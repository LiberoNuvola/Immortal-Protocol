/**
 * Current lab trigger: real Reveal path is intentionally executed on every lab-relevant source change.
 * RF10/RF11 — real Yaci/Cardano Reveal realization trace.
 *
 * Evidence-backed fixture:
 *   Prize Pending/BeaconReady + B1PrizePool
 *       -> one atomic Reveal
 *       -> Revealed Prize + updated Pool
 *
 * The bootstrap creates only the minimum test state. It does not define
 * production token economics and does not replace the existing validators.
 */

import { Constr, Data, Lucid, Blockfrost, getAddressDetails, scriptFromNative, mintingPolicyToId, validatorToScriptHash, validatorToAddress, applyParamsToScript as evolutionApplyParamsToScript, type Script, type UTxO } from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { buildScriptsFromLucid, prizeValidatorFactory, prizeTableToData } from '../../src/loadValidator'
import { createCardanoExecutionAdapter } from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import {
  defaultPrizeTable,
  generateSymbols,
  classifyRowTier,
  rowPayoutTotal,
} from '../../src/gameRules'
import {
  deriveBeacon,
  deriveSymbolsSeed,
  deriveTicketSeed,
  encodeBeaconTarget,
  field,
  fromHex,
  playerCommitment,
  sha256,
  ticketCommitment,
  toHex,
} from '../../src/beacon'
import {
  assertCardanoObservedTransitionBinding,
  type CardanoObservedTransitionEvidence,
} from '../../Adapter/CARDANO/observation/CardanoObservedTransitionEvidence'
import {
  assertExecutableLiquidityMatchesAuthenticatedPool,
  type ExecutableLiquidityObservation,
} from '../../Adapter/CARDANO/observation/ExecutableLiquidityObservation'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test sauce'

const PRICE_USDM = 100n
const TOTAL_LIQUIDITY_USDM = 100_000n
const TICKET_NAME_HEX = '52462d5245414c2d52455645414c'
const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45' // ORACLE
const MAINCHAIN_REF = new Uint8Array(32)
const MATERIOS_CONTEXT = new Uint8Array(32)
const GAME_VERSION = new TextEncoder().encode('V1')

type NativeScript = { type: 'sig'; keyHash: string } | {
  type: 'all'
  scripts: NativeScript[]
}

function nativePolicy(lucid: any, keyHash: string): Script {
  return scriptFromNative({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  } as NativeScript)
}

function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
    .digest('hex')
}

function ref(u: UTxO): string {
  return u.txHash + '#' + u.outputIndex
}

function c(index: number, fields: any[] = []): any {
  return new Constr(index, fields)
}

function prizeDatum(
  ticketPolicyId: string,
  prizePoolHash: string,
  playerCommitmentHex: string,
  commitmentHex: string,
  beaconValueHex: string,
  issuedAt: bigint,
  expiresAt: bigint,
): any {
  return c(0, [
    ticketPolicyId,
    TICKET_NAME_HEX,
    playerCommitmentHex,
    PRICE_USDM,
    commitmentHex,
    toHex(GAME_VERSION),
    1n,
    0n,
    '',
    '',
    c(0),
    '',
    0n,
    c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
    c(1),
    beaconValueHex,
    '11'.repeat(32),
    toHex(MATERIOS_CONTEXT),
    prizePoolHash,
    issuedAt,
    expiresAt,
    0n,
    0n,
  ])
}

function poolDatum(prizeHash: string, liquidity: bigint, reserve: bigint, count: bigint, liabilities: bigint): any {
  return c(0, [
    liquidity,
    liabilities,
    reserve,
    count,
    0n,
    10_000n,
    0n,
    prizeHash,
  ])
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  label: string,
): Promise<T> {
  for (let i = 0; i < 30; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(1000)
  }
  throw new Error('Timed out waiting for ' + label)
}

const wallet = JSON.parse(
  readFileSync('/tmp/immortal-yaci-test-wallet.json', 'utf8'),
)
const provider = new Blockfrost(API, '')

// Yaci Store exposes the Blockfrost-compatible JSON evaluator, while the
// pinned Lucid Evolution provider needs evaluateTx supplied explicitly.
const providerWithEvaluation = provider as Blockfrost & {
  evaluateTx: (tx: string, additionalUTxOs?: Array<{
    txHash: string
    outputIndex: number
    address: string
    assets: Record<string, bigint>
    datumHash?: string
    datum?: string
    scriptRef?: { type: string; script: string }
  }>) => Promise<Array<{
    redeemer_tag: string
    redeemer_index: number
    ex_units: { mem: number; steps: number }
  }>>
}

providerWithEvaluation.evaluateTx = async (tx, additionalUTxOs = []) => {
  const cbor = tx.startsWith('0x') ? tx.slice(2) : tx
  if (!/^[0-9a-fA-F]+$/.test(cbor) || cbor.length % 2 !== 0) {
    throw new Error(
      `Yaci transaction evaluation received non-hex transaction CBOR: ${cbor.slice(0, 80)}`,
    )
  }

  const additionalUtxoSet = additionalUTxOs.map((utxo) => [
    { txId: utxo.txHash, index: utxo.outputIndex },
    {
      address: utxo.address,
      value: {
        ada: { lovelace: Number(utxo.assets.lovelace ?? 0n) },
        ...Object.entries(utxo.assets)
          .filter(([unit]) => unit !== 'lovelace')
          .reduce<Record<string, Record<string, number>>>((assets, [unit, amount]) => {
            const policyId = unit.slice(0, 56)
            const assetName = unit.slice(56)
            assets[policyId] ??= {}
            assets[policyId][assetName] = Number(amount)
            return assets
          }, {}),
      },
      ...(utxo.datumHash ? { datumHash: utxo.datumHash } : {}),
      ...(utxo.datum ? { datum: utxo.datum } : {}),
      ...(utxo.scriptRef
        ? {
            script: {
              [utxo.scriptRef.type === 'PlutusV1'
                ? 'plutus:v1'
                : utxo.scriptRef.type === 'PlutusV3'
                  ? 'plutus:v3'
                  : 'plutus:v2']: utxo.scriptRef.script,
            },
          }
        : {}),
    },
  ])

  const response = await fetch(API + '/utils/txs/evaluate/utxos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cbor,
      ...(additionalUtxoSet.length ? { additionalUtxoSet } : {}),
    }),
  })
  const rawResponse = await response.text()
  let result: {
    fault?: unknown
    result?: {
      EvaluationResult?: Record<string, { memory: number; steps: number }>
    }
    message?: string
  }
  try {
    result = JSON.parse(rawResponse) as typeof result
  } catch {
    result = { message: rawResponse }
  }

  if (!response.ok || result.fault || !result.result?.EvaluationResult) {
    throw new Error(
      `Yaci transaction evaluation failed (HTTP ${response.status}): ${rawResponse.slice(0, 4000)}`,
    )
  }

  return Object.entries(result.result.EvaluationResult).map(
    ([pointer, data]) => {
      const [redeemer_tag, redeemer_index] = pointer.split(':')
      return {
        redeemer_tag,
        redeemer_index: Number(redeemer_index),
        ex_units: { mem: Number(data.memory), steps: Number(data.steps) },
      }
    },
  )
}

const lucid = await Lucid(providerWithEvaluation, 'Preprod')
const protocolParameters = await provider.getProtocolParameters()
const jsonReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
console.log(JSON.stringify({
  protocolParametersCostModelLengths: Object.fromEntries(
    Object.entries(protocolParameters.costModels ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]),
  ),
}, null, 2))
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()
const details = getAddressDetails(address)
const keyHash = details.paymentCredential && details.paymentCredential.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

// Reveal does not consume Oracle state, but the parameterized validators require
// a non-empty singleton identity. Use the deterministic fixture policy here;
// production Oracle identity remains deployment-configured.
const fixtureOracleStatePolicyId = testPolicyId

const scripts = buildScriptsFromLucid(
  { ...lucid, utils: { validatorToScriptHash, mintingPolicyToId, validatorToAddress: (script: Script) => validatorToAddress('Preprod', script) } },
  defaultPrizeTable,
  keyHash,
  fixtureOracleStatePolicyId,
  ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId,
  poolTokenNameHex,
)

if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) {
  throw new Error('failed to derive Prize/B1PrizePool addresses')
}

const differentialParams = [
  validatorToScriptHash((await import('../../src/loadValidator')).beaconRegistryValidator as any),
  toEvolutionData(prizeTableToData(defaultPrizeTable)),
  toEvolutionData(new Constr(0, [fixtureOracleStatePolicyId, ORACLE_STATE_TOKEN_NAME_HEX])),
  keyHash,
]
const evolutionPrizeScriptHex = evolutionApplyParamsToScript(
  (prizeValidatorFactory as any).script,
  differentialParams,
)
console.log(JSON.stringify({
  parameterizationDifferential: {
    legacyBytes: Buffer.from(legacyPrizeScript, 'hex').length,
    evolutionBytes: Buffer.from(evolutionPrizeScriptHex, 'hex').length,
    legacyHash: validatorToScriptHash(scripts.prizeValidator as any),
    evolutionHash: validatorToScriptHash({ type: 'PlutusV2', script: evolutionPrizeScriptHex } as any),
    identicalCbor: legacyPrizeScript === evolutionPrizeScriptHex,
  },
}, null, 2))

const issuedAt = BigInt(Date.now())
const expiresAt = issuedAt + 3_600_000n
const playerSecret = fromHex('01'.repeat(32))

const beaconValue = await deriveBeacon(
  0,
  0,
  MAINCHAIN_REF,
  fromHex('11'.repeat(32)),
  MATERIOS_CONTEXT,
  GAME_VERSION,
)
const playerCommitmentHex = toHex(
  await playerCommitment(0, 1, playerSecret),
)
const commitmentHex = toHex(
  await ticketCommitment(
    new TextEncoder().encode('RF-REAL-REVEAL'),
    fromHex(playerCommitmentHex),
    GAME_VERSION,
    1,
    Number(PRICE_USDM),
    encodeBeaconTarget({
      networkId: 0,
      round: 0,
      mainchainRef: MAINCHAIN_REF,
      version: GAME_VERSION,
    }),
  ),
)

const ticketSeed = await deriveTicketSeed(
  0,
  1,
  playerSecret,
  beaconValue,
  GAME_VERSION,
)
const symbolsSeed = await deriveSymbolsSeed(ticketSeed)
const symbols = await generateSymbols(symbolsSeed)
const digest = await sha256(symbolsSeed)
const expectedResult = await sha256(
  new Uint8Array([...field(digest), ...field(symbols)]),
)
const row1Tier = classifyRowTier(symbols.slice(0, 3))
const row2Tier = classifyRowTier(symbols.slice(3, 6))
const payout = BigInt(
  rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(PRICE_USDM)),
)
const prizeTier = Math.max(row1Tier, row2Tier)

const prePrizeDatum = prizeDatum(
  testPolicyId,
  scripts.b1PrizePoolHash,
  playerCommitmentHex,
  commitmentHex,
  toHex(beaconValue),
  issuedAt,
  expiresAt,
)

const postPrizeDatum = c(0, [
  testPolicyId,
  TICKET_NAME_HEX,
  playerCommitmentHex,
  PRICE_USDM,
  commitmentHex,
  toHex(GAME_VERSION),
  1n,
  payout,
  '',
  '',
  c(1),
  toHex(expectedResult),
  BigInt(prizeTier),
  c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
  c(1),
  toHex(beaconValue),
  '11'.repeat(32),
  toHex(MATERIOS_CONTEXT),
  scripts.b1PrizePoolHash,
  issuedAt,
  expiresAt,
  BigInt(row1Tier),
  BigInt(row2Tier),
])

const prePoolDatum = poolDatum(
  scripts.prizeHash,
  TOTAL_LIQUIDITY_USDM,
  PRICE_USDM,
  1n,
  0n,
)
const postPoolDatum = poolDatum(
  scripts.prizeHash,
  TOTAL_LIQUIDITY_USDM,
  0n,
  0n,
  payout,
)

const bootstrap = await lucid
  .newTx()
  .mintAssets(
    {
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
      [ticketUnit]: 1n,
    },
    Data.void(),
  )
  .attach.MintingPolicy(testPolicy)
  .pay.ToContract(
    scripts.b1PrizePoolAddress,
    { kind: 'inline', value: Data.to(prePoolDatum) },
    {
      lovelace: 5_000_000n,
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
    },
  )
  .pay.ToContract(
    scripts.prizeAddress,
    { kind: 'inline', value: Data.to(prePrizeDatum) },
    {
      lovelace: 3_000_000n,
      [ticketUnit]: 1n,
    },
  )
  .addSigner(address)
  .complete({ localUPLCEval: false })

const bootstrapSigned = await bootstrap.sign.withWallet().complete({ localUPLCEval: false })
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

const prizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) => u.assets[ticketUnit] === 1n),
  'bootstrapped Prize UTxO',
)
const poolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.assets[poolUnit] === 1n),
  'bootstrapped B1PrizePool UTxO',
)
const prizeUtxo = prizeUtxos.find((u) => u.assets[ticketUnit] === 1n) as UTxO
const poolUtxo = poolUtxos.find((u) => u.assets[poolUnit] === 1n) as UTxO

// Real-ledger executable-liquidity correlation witness.
// This fixture's liquidity asset is deliberately a 1:1 USDM test asset, so
// the authenticated fixture valuation is the exact observed quantity.
// It is NOT a substitute for production Economic.poolUsdmValue oracle
// valuation; the latter remains an explicit conformance requirement.
const poolRef = ref(poolUtxo)
const fixturePoolUsdmValue = poolUtxo.assets[liquidityUnit] ?? 0n
const executableLiquidityObservation: ExecutableLiquidityObservation = {
  observationReference: 'RF10-RF11-YACI-POOL-LIQUIDITY-' + poolRef,
  observedAt: BigInt(Date.now()),
  sourceInputReferences: [poolRef],
  utxos: [{
    txHash: poolUtxo.txHash,
    index: poolUtxo.outputIndex,
    usdmValue: fixturePoolUsdmValue,
    spendable: true,
    ringFenced: false,
  }],
  declaredUsdmLiquidity: fixturePoolUsdmValue,
}
assertExecutableLiquidityMatchesAuthenticatedPool(
  executableLiquidityObservation,
  poolRef,
  fixturePoolUsdmValue,
)

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo),
  prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo),
  poolDatum: poolUtxo.datum,
})

// Publish the two validator scripts as reference-script UTxOs before building Reveal.
const prizeReferenceTx = await lucid
  .newTx()
  .pay.ToAddressWithData(address, undefined, { lovelace: 2_000_000n }, scripts.prizeValidator)
  .complete({ localUPLCEval: false })
const prizeReferenceSigned = await prizeReferenceTx.sign.withWallet().complete({ localUPLCEval: false })
const prizeReferenceHash = await prizeReferenceSigned.submit()
await lucid.awaitTx(prizeReferenceHash)

const poolReferenceTx = await lucid
  .newTx()
  .pay.ToAddressWithData(address, undefined, { lovelace: 2_000_000n }, scripts.b1PrizePool)
  .complete({ localUPLCEval: false })
const poolReferenceSigned = await poolReferenceTx.sign.withWallet().complete({ localUPLCEval: false })
const poolReferenceHash = await poolReferenceSigned.submit()
await lucid.awaitTx(poolReferenceHash)

const referenceUtxos = await lucid.utxosAt(address)
const prizeReferenceUtxo = referenceUtxos.find((u) => u.txHash === prizeReferenceHash)
const poolReferenceUtxo = referenceUtxos.find((u) => u.txHash === poolReferenceHash)
if (!prizeReferenceUtxo || !poolReferenceUtxo) {
  throw new Error('reference-script UTxOs were not materialized on Yaci')
}
// Some provider versions rehydrate a valid reference-script output without
// decoding scriptRef. Restore only the already-known script bytes on the local
// UTxO object; the selected output remains the exact Yaci ledger output.
const prizeReferenceInput = {
  ...prizeReferenceUtxo,
  scriptRef: (prizeReferenceUtxo as any).scriptRef ?? scripts.prizeValidator,
}
const poolReferenceInput = {
  ...poolReferenceUtxo,
  scriptRef: (poolReferenceUtxo as any).scriptRef ?? scripts.b1PrizePool,
}

const expectedPrizeHash = validatorToScriptHash(scripts.prizeValidator as Script)
const expectedPoolHash = validatorToScriptHash(scripts.b1PrizePool as Script)
if (validatorToScriptHash((prizeReferenceInput as any).scriptRef) !== expectedPrizeHash) {
  throw new Error('PrizeValidator reference script hash mismatch')
}
if (validatorToScriptHash((poolReferenceInput as any).scriptRef) !== expectedPoolHash) {
  throw new Error('B1PrizePool reference script hash mismatch')
}

const reveal = await lucid
  .newTx()
  .readFrom([prizeReferenceInput, poolReferenceInput])
  .collectFrom([prizeUtxo], Data.to(c(1, [toHex(playerSecret)])))
  .attach.SpendingValidator(scripts.prizeValidator)
  .collectFrom([poolUtxo], Data.to(c(2, [PRICE_USDM])))
  .attach.SpendingValidator(scripts.b1PrizePool)
  .pay.ToContract(
    scripts.prizeAddress as string,
    { kind: 'inline', value: Data.to(postPrizeDatum) },
    prizeUtxo.assets,
  )
  .pay.ToContract(
    scripts.b1PrizePoolAddress as string,
    { kind: 'inline', value: Data.to(postPoolDatum) },
    poolUtxo.assets,
  )
  .addSigner(address)
  .validTo(Number(expiresAt))
  .complete({ localUPLCEval: false })

let signedReveal: any = null
/*
 * Audit harness only: this trace measures a real Yaci ledger realization.
 * It is not the production economic-admission path. Production economic
 * orchestrators must use submitEconomic() with an authoritative witness.
 */
const executionAdapter = createCardanoExecutionAdapter({
  signTx: async (tx: unknown) => {
    signedReveal = await (tx as any).sign.withWallet().complete({ localUPLCEval: false })
    return signedReveal
  },
  submitTx: async (signedTx: unknown) => (signedTx as any).submit(),
})
const submission = await executionAdapter.submitInfrastructure(reveal)
const txHash = submission.transactionRef
if (!signedReveal) throw new Error('Adapter did not retain the signed Reveal for replay evidence')
const txCbor = signedReveal.toCBOR()
const txBytes = Buffer.from(txCbor, 'hex').length
console.log(JSON.stringify({
  revealSerializedBytes: txBytes,
  maxTxSize: protocolParameters.maxTxSize ?? null,
  belowMaxTxSize: typeof protocolParameters.maxTxSize === 'number'
    ? txBytes <= protocolParameters.maxTxSize
    : null,
  prizeReference: prizeReferenceHash + '#0',
  poolReference: poolReferenceHash + '#0',
}, null, 2))
if (typeof protocolParameters.maxTxSize === 'number' && txBytes > protocolParameters.maxTxSize) {
  throw new Error(`Reveal transaction remains over maxTxSize: ${txBytes} > ${protocolParameters.maxTxSize}`)
}
writeFileSync(
  'audit/yaci-evidence/reveal-tx.cbor',
  Buffer.from(txCbor, 'hex'),
)
writeFileSync(
  'audit/yaci-evidence/reveal-protocol-parameters.json',
  JSON.stringify(protocolParameters, jsonReplacer, 2),
)
await lucid.awaitTx(txHash)

const postPrizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) => u.txHash === txHash && u.assets[ticketUnit] === 1n),
  'revealed Prize UTxO',
)
const postPoolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === txHash && u.assets[poolUnit] === 1n),
  'revealed B1PrizePool UTxO',
)
const postPrize = postPrizeUtxos.find((u) => u.txHash === txHash && u.assets[ticketUnit] === 1n) as UTxO
const postPool = postPoolUtxos.find((u) => u.txHash === txHash && u.assets[poolUnit] === 1n) as UTxO

const postStateFingerprint = hashJson({
  prizeRef: ref(postPrize),
  prizeDatum: postPrize.datum,
  poolRef: ref(postPool),
  poolDatum: postPool.datum,
})

const actionFingerprint = hashJson({
  actionClass: 'REVEAL',
  ticketInput: ref(prizeUtxo),
  poolInput: ref(poolUtxo),
  ticketPolicyId: testPolicyId,
  ticketNameHex: TICKET_NAME_HEX,
  priceUsdm: PRICE_USDM,
  payout,
  row1Tier,
  row2Tier,
  prizeTier,
  resultHex: toHex(expectedResult),
})

const evidence: CardanoObservedTransitionEvidence = {
  evidenceId: hashJson({
    fixtureId: 'RF10-RF11-YACI-REVEAL-001',
    actionFingerprint,
    preStateFingerprint,
    postStateFingerprint,
    transactionRef: txHash,
  }),
  fixtureId: 'RF10-RF11-YACI-REVEAL-001',
  actionClass: 'REVEAL',
  environment: 'local-yaci-devnet',
  preStateObservationFingerprint: preStateFingerprint,
  postStateObservationFingerprint: postStateFingerprint,
  actionObservationFingerprint: actionFingerprint,
  transactionRef: txHash,
}

assertCardanoObservedTransitionBinding(evidence, {
  actionClass: 'REVEAL',
  environment: 'local-yaci-devnet',
  preStateObservationFingerprint: preStateFingerprint,
  postStateObservationFingerprint: postStateFingerprint,
  actionObservationFingerprint: actionFingerprint,
  transactionRef: txHash,
})

let replayRejected = false
let replayError = ''
try {
  await (signedReveal as any).submit()
} catch (error) {
  replayRejected = true
  replayError = error instanceof Error ? error.message : String(error)
}
if (!replayRejected) {
  throw new Error('stale/duplicate Reveal submission was unexpectedly accepted')
}

const txResponse = await fetch(API + '/txs/' + txHash + '/utxos')
if (!txResponse.ok) {
  throw new Error('Yaci tx/utxos query failed: ' + txResponse.status)
}
const txUtxos = await txResponse.json()

writeFileSync(
  'audit/yaci-evidence/reveal-transition.json',
  JSON.stringify({
    purpose: 'real-local-cardano-economic-reveal',
    bootstrapHash,
    transactionRef: txHash,
    txCbor,
    action: {
      actionClass: 'REVEAL',
      priceUsdm: PRICE_USDM.toString(),
      payout: payout.toString(),
      row1Tier,
      row2Tier,
      prizeTier,
      resultHex: toHex(expectedResult),
    },
    preState: {
      prizeRef: ref(prizeUtxo),
      poolRef: ref(poolUtxo),
      fingerprint: preStateFingerprint,
    },
    postState: {
      prizeRef: ref(postPrize),
      poolRef: ref(postPool),
      fingerprint: postStateFingerprint,
    },
    consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
    producedUtxos: [ref(postPrize), ref(postPool)],
    executableLiquidityCorrelation: {
      observationReference: executableLiquidityObservation.observationReference,
      poolInputReference: poolRef,
      observedPoolUsdmValue: fixturePoolUsdmValue.toString(),
      sourceSetExact: true,
      valuationMode: 'fixture-1-to-1-test-asset',
      canonicalEconomicPoolUsdmValueEvaluated: false,
    },
    oracle: {
      oracleStatePolicyId: fixtureOracleStatePolicyId,
      oracleStateTokenNameHex: ORACLE_STATE_TOKEN_NAME_HEX,
      oracleMode: 'fixture-identity-only',
      productionOracleQualified: false,
    },
    observedCardanoTransitionEvidence: evidence,
    replay: {
      rejected: replayRejected,
      error: replayError,
    },
    yaciTransactionUtxos: txUtxos,
  }, null, 2),
)

console.log(JSON.stringify({
  transactionRef: txHash,
  bootstrapHash,
  consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
  producedUtxos: [ref(postPrize), ref(postPool)],
  payout: payout.toString(),
  replayRejected,
}, null, 2))
