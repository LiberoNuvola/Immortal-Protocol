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

import { CML, Constr, Data, Lucid, Blockfrost, getAddressDetails, scriptFromNative, mintingPolicyToId, validatorToScriptHash, validatorToAddress, applyParamsToScript as evolutionApplyParamsToScript, type Script, type UTxO } from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { beaconRegistryValidator, buildB1PrizePool, buildScriptsFromLucid, prizeTableToData, prizeValidatorFactory } from '../../src/loadValidator'
import { createCardanoExecutionAdapter } from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import {
  assertRevealUsesReferenceScripts,
  bindPublishedReferenceScript,
} from './revealReferenceScripts'
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
  ticketNonce: bigint,
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
    ticketNonce,
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
// Diagnostics only: tx shape and redeemer ExUnits, to compare evaluated vs final vs submitted tx.
const describeTx = (cborHex: string) => {
  const tx = CML.Transaction.from_cbor_hex(cborHex)
  const body = tx.body()
  const redeemers: Array<{ tag: number; index: number; mem: string; steps: string }> = []
  const rs = tx.witness_set().redeemers()
  const legacy = rs?.as_arr_legacy_redeemer()
  if (legacy) {
    for (let i = 0; i < legacy.len(); i++) {
      const r = legacy.get(i)
      redeemers.push({ tag: Number(r.tag()), index: Number(r.index()), mem: r.ex_units().mem().toString(), steps: r.ex_units().steps().toString() })
    }
  }
  const map = rs?.as_map_redeemer_key_to_redeemer_val()
  if (map) {
    const keys = map.keys()
    for (let i = 0; i < keys.len(); i++) {
      const key = keys.get(i)
      const val = map.get(key)
      if (val) redeemers.push({ tag: Number(key.tag()), index: Number(key.index()), mem: val.ex_units().mem().toString(), steps: val.ex_units().steps().toString() })
    }
  }
  return {
    txSha256: createHash('sha256').update(Buffer.from(cborHex, 'hex')).digest('hex'),
    bodyHash: CML.hash_transaction(body).to_hex(),
    bytes: cborHex.length / 2,
    fee: body.fee().toString(),
    ttl: body.ttl()?.toString() ?? null,
    redeemers,
  }
}

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

// Yaci's first evaluation under-declared the final Reveal context by 438 memory
// and 105,090 steps per redeemer (about 0.019%) in run #1595. Keep the raw
// evaluator result separate from the budget returned to Lucid, and apply a
// small engineering margin so fee/body finalization cannot leave a redeemer
// just below the cost of its final ledger context. This does not change any
// validator or economic rule; the final preflight below verifies coverage and
// checks the aggregate against the active protocol limits.
const EX_UNITS_SAFETY_MARGIN_BPS = 100
const EX_UNITS_SAFETY_DENOMINATOR = 10_000n

function withExUnitsSafetyMargin(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Yaci returned invalid execution units: ' + String(value))
  }
  return Number(
    (BigInt(value) * BigInt(EX_UNITS_SAFETY_DENOMINATOR + BigInt(EX_UNITS_SAFETY_MARGIN_BPS)) 
      + EX_UNITS_SAFETY_DENOMINATOR - 1n) / EX_UNITS_SAFETY_DENOMINATOR,
  )
}

const evaluateYaciTx = async (
  tx: string,
  additionalUTxOs: Array<{
    txHash: string
    outputIndex: number
    address: string
    assets: Record<string, bigint>
    datumHash?: string
    datum?: string
    scriptRef?: { type: string; script: string }
  }> = [],
) => {
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

providerWithEvaluation.evaluateTx = async (tx, additionalUTxOs = []) => {
  const cbor = tx.startsWith('0x') ? tx.slice(2) : tx
  const measured = await evaluateYaciTx(cbor, additionalUTxOs)
  const budgeted = measured.map((redeemer) => ({
    ...redeemer,
    ex_units: {
      mem: withExUnitsSafetyMargin(redeemer.ex_units.mem),
      steps: withExUnitsSafetyMargin(redeemer.ex_units.steps),
    },
  }))
  if (measured.length > 0) {
    console.log(JSON.stringify({
      revealDiag: 'yaci-evaluate',
      tx: describeTx(cbor),
      yaciMeasuredExUnits: measured,
      yaciBudgetedExUnits: budgeted,
      safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
    }))
  }
  return budgeted
}

// validTo() converts ms to slots with this table; the 'Preprod' default does not match the devnet genesis.
// Anchor = latest Yaci block (slot, time); slot length is the Yaci devkit default (1.0 s, see bootstrap log).
const DEVNET_SLOT_LENGTH_MS = 1000
const latestBlock = await (await fetch(API + '/blocks/latest')).json() as {
  slot: number
  time: number
}
if (!Number.isSafeInteger(latestBlock.slot) || latestBlock.slot < 0 ||
    !Number.isSafeInteger(latestBlock.time) || latestBlock.time <= 0) {
  throw new Error('Yaci /blocks/latest lacks slot/time: ' + JSON.stringify(latestBlock))
}
const devnetSlotConfig = {
  zeroTime: latestBlock.time * 1000,
  zeroSlot: latestBlock.slot,
  slotLength: DEVNET_SLOT_LENGTH_MS,
}
const lucid = await Lucid(providerWithEvaluation, 'Preprod', { slotConfig: devnetSlotConfig })
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

// Keep reference-script UTxOs outside the spending wallet's coin-selection
// address. Otherwise they can be selected as funding inputs while also being
// supplied to readFrom(), invalidating the intended reference-script binding.
const referenceLucid = await Lucid(providerWithEvaluation, 'Preprod', {
  slotConfig: devnetSlotConfig,
})
referenceLucid.selectWallet.fromSeed(SEED, { accountIndex: 1 })
const referenceAddress = await referenceLucid.wallet().address()
if (referenceAddress === address) {
  throw new Error('reference-script receiver must be isolated from the spending wallet')
}
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

/**
 * Explicitly isolated acceptance experiment. When enabled by the lab only,
 * route this fixture through the Aiken Plutus V3 candidate and re-parameterize
 * the existing B1PrizePool Plutus V2 script to bind its prize hash to the
 * candidate's actual script hash. Default behavior remains the canonical
 * Haskell Plutus V2 trace; no production source or V3 carrier is replaced.
 */
const aikenRevealV3Candidate = process.env.IMMORTAL_REVEAL_AIKEN_V3 === '1'
if (aikenRevealV3Candidate) {
  const blueprint = JSON.parse(readFileSync('poc/aiken-reveal-parity/plutus.json', 'utf8')) as {
    preamble?: { plutusVersion?: string }
    validators?: Array<{ title?: string; compiledCode?: string; hash?: string }>
  }
  if (blueprint.preamble?.plutusVersion !== 'v3') {
    throw new Error('Aiken Reveal candidate fixture requires a Plutus V3 blueprint')
  }
  const matches = (blueprint.validators ?? []).filter(v => v.title === 'reveal.pre_rich_reveal.spend')
  if (matches.length !== 1 || !matches[0].compiledCode || !matches[0].hash) {
    throw new Error('Expected one compiled Aiken Reveal spend validator in the blueprint')
  }
  const aikenUnparameterizedScript = {
    type: 'PlutusV3',
    script: matches[0].compiledCode,
  } as Script
  const aikenBlueprintHash = validatorToScriptHash(aikenUnparameterizedScript).toLowerCase()
  if (aikenBlueprintHash !== matches[0].hash.toLowerCase()) {
    throw new Error('Aiken blueprint and Lucid unparameterized V3 hashes do not match')
  }
  // The Aiken Prize validator is parameterized with the same deterministic
  // fixture Oracle State identity/publisher used in this local Reveal trace.
  // These parameters are not consumed by Reveal/Expire semantics, but they
  // must be applied to get the actual executable script and stable pool binding.
  const aikenPrizeScript = {
    type: 'PlutusV3',
    script: evolutionApplyParamsToScript(
      matches[0].compiledCode,
      [fixtureOracleStatePolicyId, ORACLE_STATE_TOKEN_NAME_HEX, keyHash],
    ),
  } as Script
  const aikenPrizeHash = validatorToScriptHash(aikenPrizeScript).toLowerCase()
  const aikenBoundPoolScript = buildB1PrizePool(
    aikenPrizeHash,
    keyHash,
    fixtureOracleStatePolicyId,
    ORACLE_STATE_TOKEN_NAME_HEX,
    testPolicyId,
    poolTokenNameHex,
  ) as unknown as Script
  const aikenBoundPoolHash = validatorToScriptHash(aikenBoundPoolScript).toLowerCase()
  Object.assign(scripts, {
    prizeValidator: aikenPrizeScript,
    prizeHash: aikenPrizeHash,
    b1PrizePool: aikenBoundPoolScript,
    b1PrizePoolHash: aikenBoundPoolHash,
    prizeAddress: validatorToAddress('Preprod', aikenPrizeScript),
    b1PrizePoolAddress: validatorToAddress('Preprod', aikenBoundPoolScript),
  })
  console.log(JSON.stringify({
    aikenRevealDiag: 'isolated-candidate-selected',
    canonicalHaskellValidatorModified: false,
    existingV3CarrierModified: false,
    plutusVersion: 'v3',
    aikenPrizeHash,
    aikenPrizeScriptBytes: Buffer.from(aikenPrizeScript.script, 'hex').length,
    boundPoolHash: aikenBoundPoolHash,
    boundPoolScriptType: aikenBoundPoolScript.type,
    boundPoolScriptBytes: Buffer.from(aikenBoundPoolScript.script, 'hex').length,
    transactionSizeLimitBytes: protocolParameters.maxTxSize,
    warning: 'Experimental local Yaci path only; not production semantic equivalence or deployment qualification.',
  }, null, 2))
}

if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) {
  throw new Error('failed to derive Prize/B1PrizePool addresses')
}

function toEvolutionData(value: any): any {
  if (typeof value === 'bigint' || typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(toEvolutionData)
  if (value instanceof Map) {
    return new Map([...value.entries()].map(([k, v]) => [toEvolutionData(k), toEvolutionData(v)]))
  }
  if (value && typeof value.index === 'number' && Array.isArray(value.fields)) {
    return new Constr(value.index, value.fields.map(toEvolutionData))
  }
  throw new Error('unsupported Data value in parameterization differential')
}

const legacyPrizeScriptHex = (scripts.prizeValidator as any).script
const differentialParams = [
  validatorToScriptHash({
    type: 'PlutusV2',
    script: (beaconRegistryValidator as any).script,
  } as any),
  toEvolutionData(prizeTableToData(defaultPrizeTable)),
  fixtureOracleStatePolicyId,
  ORACLE_STATE_TOKEN_NAME_HEX,
  keyHash,
]
const evolutionPrizeScriptHex = evolutionApplyParamsToScript(
  (prizeValidatorFactory as any).script,
  differentialParams,
)
console.log(JSON.stringify({
  parameterizationDifferential: {
    legacyBytes: Buffer.from(legacyPrizeScriptHex, 'hex').length,
    evolutionBytes: Buffer.from(evolutionPrizeScriptHex, 'hex').length,
    legacyHash: validatorToScriptHash({ type: 'PlutusV2', script: legacyPrizeScriptHex } as any),
    evolutionHash: validatorToScriptHash({ type: 'PlutusV2', script: evolutionPrizeScriptHex } as any),
    identicalCbor: legacyPrizeScriptHex === evolutionPrizeScriptHex,
  },
}, null, 2))

const issuedAt = BigInt(Date.now())
const expiresAt = issuedAt + 3_600_000n
// Upper bound stays <= pdExpiresAt but inside the devnet ledger time horizon (safe zone 300 s).
const revealValidTo = () => {
  const near = BigInt(Date.now()) + 180_000n
  return near < expiresAt ? near : expiresAt
}
const playerSecret = fromHex('01'.repeat(32))
// The integrated Aiken candidate uses the same deterministic winning nonce as
// aiken-reveal-ledger-probe.ts so the real B1PrizePool validator sees a nonzero
// payout. Keep the canonical Haskell trace's historical nonce unchanged.
const fixtureTicketNonce = aikenRevealV3Candidate ? 7n : 1n

const beaconValue = await deriveBeacon(
  0,
  0,
  MAINCHAIN_REF,
  fromHex('11'.repeat(32)),
  MATERIOS_CONTEXT,
  GAME_VERSION,
)
const playerCommitmentHex = toHex(
  await playerCommitment(0, Number(fixtureTicketNonce), playerSecret),
)
const commitmentHex = toHex(
  await ticketCommitment(
    new TextEncoder().encode('RF-REAL-REVEAL'),
    fromHex(playerCommitmentHex),
    GAME_VERSION,
    Number(fixtureTicketNonce),
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
  Number(fixtureTicketNonce),
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
  fixtureTicketNonce,
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
  fixtureTicketNonce,
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
// CIP-33 only helps after a script has been published. If a script itself is
// already larger than maxTxSize, its publication transaction cannot fit because
// the output wrapper and transaction body add bytes. Record this boundary before
// attempting publication so the evidence distinguishes publication failure from
// Reveal-spend failure.
console.log(JSON.stringify({
  revealDiag: 'reference-script-publication-plan',
  activeMaxTxSize: protocolParameters.maxTxSize ?? null,
  scripts: [
    {
      purpose: 'PrizeValidator',
      scriptBytes: Buffer.from(scripts.prizeValidator.script, 'hex').length,
      scriptBytesAloneFits: typeof protocolParameters.maxTxSize === 'number'
        ? Buffer.from(scripts.prizeValidator.script, 'hex').length <= protocolParameters.maxTxSize
        : null,
    },
    {
      purpose: 'B1PrizePool',
      scriptBytes: Buffer.from(scripts.b1PrizePool.script, 'hex').length,
      scriptBytesAloneFits: typeof protocolParameters.maxTxSize === 'number'
        ? Buffer.from(scripts.b1PrizePool.script, 'hex').length <= protocolParameters.maxTxSize
        : null,
    },
  ],
}, null, 2))
const prizeReferenceTx = await lucid
  .newTx()
  .pay.ToAddressWithData(referenceAddress, undefined, { lovelace: 2_000_000n }, scripts.prizeValidator)
  .complete({ localUPLCEval: false })
const prizeReferenceSigned = await prizeReferenceTx.sign.withWallet().complete({ localUPLCEval: false })
const prizeReferenceHash = await prizeReferenceSigned.submit()
await lucid.awaitTx(prizeReferenceHash)

const poolReferenceTx = await lucid
  .newTx()
  .pay.ToAddressWithData(referenceAddress, undefined, { lovelace: 2_000_000n }, scripts.b1PrizePool)
  .complete({ localUPLCEval: false })
const poolReferenceSigned = await poolReferenceTx.sign.withWallet().complete({ localUPLCEval: false })
const poolReferenceHash = await poolReferenceSigned.submit()
await lucid.awaitTx(poolReferenceHash)

const referenceUtxos = await lucid.utxosAt(referenceAddress)
const prizeReferenceUtxo = referenceUtxos.find((u) => u.txHash === prizeReferenceHash)
const poolReferenceUtxo = referenceUtxos.find((u) => u.txHash === poolReferenceHash)
if (!prizeReferenceUtxo || !poolReferenceUtxo) {
  throw new Error('reference-script UTxOs were not materialized on Yaci')
}

// Bind each reference UTxO to the exact accepted publication transaction.
// The helper verifies transaction body hash, output index/address and expected
// script bytes from CBOR before populating scriptRef as a local resolution hint.
const prizeReferenceInput = bindPublishedReferenceScript({
  purpose: 'PrizeValidator',
  publishedTxCbor: prizeReferenceSigned.toCBOR(),
  expectedScript: scripts.prizeValidator,
  referenceAddress,
  utxo: prizeReferenceUtxo,
})
const poolReferenceInput = bindPublishedReferenceScript({
  purpose: 'B1PrizePool',
  publishedTxCbor: poolReferenceSigned.toCBOR(),
  expectedScript: scripts.b1PrizePool,
  referenceAddress,
  utxo: poolReferenceUtxo,
})

const prizeRevealRedeemer = Data.to(c(1, [toHex(playerSecret)]))
const poolRevealRedeemer = Data.to(c(2, [PRICE_USDM]))
const postPrizeDatumCbor = Data.to(postPrizeDatum)
const postPoolDatumCbor = Data.to(postPoolDatum)

/*
 * Construction-only probes for the observed Reveal inputs. Each transaction
 * is completed independently to localize Lucid's lazy datum conversion failure.
 * These probes do not sign or submit, and the authoritative Reveal builder below
 * remains unchanged.
 */
const probeRevealCollectCompletion = async (
  label: string,
  input: UTxO,
  redeemer: string,
  outputAddress: string,
  outputDatum: string,
) => {
  // Construction-only probe: stub the evaluator temporarily so invalid
  // single-input script contexts cannot mask the Lucid/CML datum conversion
  // boundary. These synthetic ExUnits are not evidence of ledger execution.
  const originalEvaluateTx = providerWithEvaluation.evaluateTx
  providerWithEvaluation.evaluateTx = async () => [{
    redeemer_tag: 'spend',
    redeemer_index: 0,
    ex_units: { mem: 1_000_000, steps: 100_000_000 },
  }]
  try {
    await lucid
      .newTx()
      .readFrom([prizeReferenceInput, poolReferenceInput])
      .collectFrom([input], redeemer)
      .pay.ToContract(
        outputAddress,
        { kind: 'inline', value: outputDatum },
        input.assets,
      )
      .addSigner(address)
      .validTo(Number(revealValidTo()))
      .complete({ localUPLCEval: false })
    console.log(JSON.stringify({
      revealCollectFromCompletionProbe: label,
      status: 'BUILDER_COMPLETION_PASS',
      evaluator: 'temporary-synthetic-exunits-stub',
      signed: false,
      submitted: false,
      ledgerValidation: 'NOT_RUN',
    }))
  } catch (error) {
    console.error(JSON.stringify({
      revealCollectFromCompletionProbe: label,
      status: 'BUILDER_COMPLETION_FAIL',
      evaluator: 'temporary-synthetic-exunits-stub',
      signed: false,
      submitted: false,
      ledgerValidation: 'NOT_RUN',
      error: error instanceof Error ? error.message : String(error),
      stack: error && typeof error === 'object' && 'stack' in error
        ? String((error as { stack?: unknown }).stack ?? '')
        : null,
    }))
  } finally {
    providerWithEvaluation.evaluateTx = originalEvaluateTx
  }
}
await probeRevealCollectCompletion(
  'Prize-only',
  prizeUtxo,
  prizeRevealRedeemer,
  scripts.prizeAddress as string,
  postPrizeDatumCbor,
)
await probeRevealCollectCompletion(
  'B1PrizePool-only',
  poolUtxo,
  poolRevealRedeemer,
  scripts.b1PrizePoolAddress as string,
  postPoolDatumCbor,
)

const revealBuilder = lucid
  .newTx()
  .readFrom([prizeReferenceInput, poolReferenceInput])
  .collectFrom([prizeUtxo], prizeRevealRedeemer)
  .collectFrom([poolUtxo], poolRevealRedeemer)
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
  .validTo(Number(revealValidTo()))

// Emit binding evidence before Lucid completes the transaction. This is deliberately
// diagnostic-only: it does not modify protocol parameters or bypass Lucid's size guard.
const describeReferenceBinding = (purpose: string, utxo: UTxO) => {
  const scriptRef = utxo.scriptRef
  if (!scriptRef) {
    throw new Error(purpose + ': validated reference input lost its scriptRef binding')
  }
  return {
    purpose,
    outRef: utxo.txHash.toLowerCase() + '#' + utxo.outputIndex,
    scriptType: scriptRef.type,
    scriptBytes: Buffer.from(scriptRef.script, 'hex').length,
    scriptHash: validatorToScriptHash(scriptRef).toLowerCase(),
  }
}
console.log(JSON.stringify({
  revealDiag: 'reference-script-bindings-before-complete',
  protocolMaxTxSize: protocolParameters.maxTxSize ?? null,
  referenceBindings: [
    describeReferenceBinding('PrizeValidator', prizeReferenceInput),
    describeReferenceBinding('B1PrizePool', poolReferenceInput),
  ],
}, null, 2))

const reveal: any = await revealBuilder.complete({ localUPLCEval: false })

{
  const builtCbor = reveal.toCBOR()
  const diagnosticTx = CML.Transaction.from_cbor_hex(builtCbor)
  const diagnosticWitnessSet = diagnosticTx.witness_set()
  const diagnosticScriptCount = (method: string): number => {
    const collection = (diagnosticWitnessSet as any)[method]?.()
    if (collection == null) return 0
    if (typeof collection.len !== 'function') {
      throw new Error('Cannot inspect serialized Plutus witness collection: ' + method)
    }
    return Number(collection.len())
  }
  const diagnosticReferenceInputs: string[] = []
  const referenceCollection = diagnosticTx.body().reference_inputs?.()
  if (referenceCollection) {
    for (let i = 0; i < Number(referenceCollection.len()); i++) {
      const input = referenceCollection.get(i)
      diagnosticReferenceInputs.push(input.transaction_id().to_hex().toLowerCase() + '#' + Number(input.index()))
    }
  }
  const diagnosticEmbeddedScriptCounts = {
    plutus_v1: diagnosticScriptCount('plutus_v1_scripts'),
    plutus_v2: diagnosticScriptCount('plutus_v2_scripts'),
    plutus_v3: diagnosticScriptCount('plutus_v3_scripts'),
  }
  console.log(JSON.stringify({
    revealDiag: 'reference-script-raw-cbor',
    bytes: builtCbor.length / 2,
    activeMaxTxSize: protocolParameters.maxTxSize ?? null,
    referenceInputs: diagnosticReferenceInputs.sort(),
    embeddedScriptCounts: diagnosticEmbeddedScriptCounts,
    embeddedScriptTotal: Object.values(diagnosticEmbeddedScriptCounts).reduce((sum, count) => sum + count, 0),
  }, null, 2))
  // Preserve the unsigned prebuilt transaction for evidence even when the
  // strict, real-ledger size gate below rejects it.
  writeFileSync('audit/yaci-evidence/reveal-tx-prebuilt.cbor', Buffer.from(builtCbor, 'hex'))
  if (typeof protocolParameters.maxTxSize !== 'number') {
    throw new Error('Reveal reference-script preflight cannot verify active maxTxSize')
  }
  const preflightEvidence = assertRevealUsesReferenceScripts(builtCbor, {
    maxTxSize: protocolParameters.maxTxSize,
    references: [
      { txHash: prizeReferenceHash, index: prizeReferenceUtxo.outputIndex },
      { txHash: poolReferenceHash, index: poolReferenceUtxo.outputIndex },
    ],
    spends: [
      {
        txHash: prizeUtxo.txHash,
        index: prizeUtxo.outputIndex,
        redeemerCbor: prizeRevealRedeemer,
      },
      {
        txHash: poolUtxo.txHash,
        index: poolUtxo.outputIndex,
        redeemerCbor: poolRevealRedeemer,
      },
    ],
    outputs: [
      {
        address: scripts.prizeAddress as string,
        inlineDatumCbor: postPrizeDatumCbor,
      },
      {
        address: scripts.b1PrizePoolAddress as string,
        inlineDatumCbor: postPoolDatumCbor,
      },
    ],
  })
  console.log(JSON.stringify({
    revealDiag: 'reference-script-preflight',
    ...preflightEvidence,
  }))
  writeFileSync('audit/yaci-evidence/reveal-tx-prebuilt.cbor', Buffer.from(builtCbor, 'hex'))
  const reEvaluated = await evaluateYaciTx(builtCbor, []).catch((e: unknown) => ({ evaluationError: String(e).slice(0, 600) }))
  const finalDescription = describeTx(builtCbor)
  const finalMeasured = Array.isArray(reEvaluated) ? reEvaluated : []
  const budgetCoverage = finalMeasured.map((measured) => {
    const assigned = finalDescription.redeemers.find(
      (r) => r.tag === 0 && r.index === measured.redeemer_index,
    )
    return {
      redeemer_tag: measured.redeemer_tag,
      redeemer_index: measured.redeemer_index,
      measured: measured.ex_units,
      assigned: assigned ? { mem: Number(assigned.mem), steps: Number(assigned.steps) } : null,
      covered: Boolean(
        assigned &&
        Number(assigned.mem) >= measured.ex_units.mem &&
        Number(assigned.steps) >= measured.ex_units.steps,
      ),
    }
  })
  const maxTxExecutionUnits = (protocolParameters as any).maxTxExecutionUnits
  const maxMemory = Number(maxTxExecutionUnits?.memory ?? maxTxExecutionUnits?.mem)
  const maxSteps = Number(maxTxExecutionUnits?.steps)
  const assignedTotals = finalDescription.redeemers.reduce(
    (totals, r) => ({ mem: totals.mem + Number(r.mem), steps: totals.steps + Number(r.steps) }),
    { mem: 0, steps: 0 },
  )
  const withinProtocolExecutionLimits =
    Number.isFinite(maxMemory) && Number.isFinite(maxSteps)
      ? assignedTotals.mem <= maxMemory && assignedTotals.steps <= maxSteps
      : null
  const budgetCovered = finalMeasured.length > 0 &&
    budgetCoverage.length === finalMeasured.length &&
    budgetCoverage.every((entry) => entry.covered)
  console.log(JSON.stringify({
    revealDiag: 'final-built',
    tx: finalDescription,
    yaciMeasuredExUnitsOfFinal: reEvaluated,
    budgetCoverage,
    assignedTotals,
    protocolExecutionLimits: Number.isFinite(maxMemory) && Number.isFinite(maxSteps)
      ? { memory: maxMemory, steps: maxSteps }
      : null,
    withinProtocolExecutionLimits,
    budgetCovered,
  }))
  if (!Array.isArray(reEvaluated)) {
    throw new Error('Final Reveal preflight could not obtain Yaci execution-unit measurements')
  }
  if (!budgetCovered) {
    throw new Error('Final Reveal redeemer execution-unit budgets do not cover final-context evaluation')
  }
  if (withinProtocolExecutionLimits === false) {
    throw new Error('Final Reveal execution-unit budgets exceed active protocol limits')
  }
}

// Integrated negative twin: submit a wrong-secret Reveal against the same real B1PrizePool V2
// fixture before submitting the valid transaction. Reuse the already measured successful
// transaction's ExUnit budgets only to construct the adversarial CBOR; the local ledger must
// execute the wrong-secret transaction and reject it. This runs only for the isolated Aiken V3
// candidate, never for the canonical Haskell path or the existing V3 carrier.
if (aikenRevealV3Candidate) {
  const validBudgetReference = describeTx(reveal.toCBOR())
  const originalEvaluateTx = providerWithEvaluation.evaluateTx
  const wrongSecret = fromHex('02'.repeat(32))
  let wrongSecretTxBytes: number | null = null
  let wrongSecretRejected = false
  let wrongSecretRejection = ''
  try {
    providerWithEvaluation.evaluateTx = async () => validBudgetReference.redeemers.map((r) => ({
      redeemer_tag: (['spend', 'mint', 'certificate', 'withdrawal', 'vote', 'propose'] as const)[Number(r.tag)] ?? 'unknown',
      redeemer_index: r.index,
      ex_units: { mem: Number(r.mem), steps: Number(r.steps) },
    }))
    const wrongSecretReveal = await lucid
      .newTx()
      .readFrom([prizeReferenceInput, poolReferenceInput])
      .collectFrom([prizeUtxo], Data.to(c(1, [toHex(wrongSecret)])))
      .collectFrom([poolUtxo], poolRevealRedeemer)
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
      .validTo(Number(revealValidTo()))
      .complete({ localUPLCEval: false })
    const wrongSecretCbor = wrongSecretReveal.toCBOR()
    wrongSecretTxBytes = Buffer.from(wrongSecretCbor, 'hex').length
    if (typeof protocolParameters.maxTxSize !== 'number' || wrongSecretTxBytes > protocolParameters.maxTxSize) {
      throw new Error('Wrong-secret twin cannot test validator rejection: transaction size is unqualified or exceeds maxTxSize')
    }
    const wrongSecretSigned = await wrongSecretReveal.sign.withWallet().complete({ localUPLCEval: false })
    console.log(JSON.stringify({
      aikenRevealDiag: 'wrong-secret-ledger-submission',
      validatorPath: 'isolated-aiken-v3-plus-real-b1-prize-pool-v2',
      wrongSecretHex: toHex(wrongSecret),
      tx: describeTx(wrongSecretSigned.toCBOR()),
      submissionAttempted: true,
      note: 'ExUnits copied from the valid twin for construction only; acceptance/rejection is decided by Yaci ledger validation.',
    }, null, 2))
    try {
      await wrongSecretSigned.submit()
    } catch (error) {
      wrongSecretRejected = true
      wrongSecretRejection = error instanceof Error ? error.message : String(error)
    }
    if (!wrongSecretRejected) {
      throw new Error('Wrong-secret Reveal was unexpectedly accepted by the integrated Yaci ledger')
    }
    if (!/script|plutus|phase.?2|evaluation|validation|validator/i.test(wrongSecretRejection)) {
      throw new Error('Wrong-secret transaction was rejected, but evidence does not classify the error as validator/ledger validation: ' + wrongSecretRejection.slice(0, 1200))
    }
    const stillUnspentPrize = await lucid.utxosAt(scripts.prizeAddress as string)
    const stillUnspentPool = await lucid.utxosAt(scripts.b1PrizePoolAddress as string)
    if (!stillUnspentPrize.some((u) => ref(u) === ref(prizeUtxo)) ||
        !stillUnspentPool.some((u) => ref(u) === ref(poolUtxo))) {
      throw new Error('Wrong-secret rejection did not preserve the original Prize and B1PrizePool UTxOs')
    }
    console.log(JSON.stringify({
      aikenRevealDiag: 'wrong-secret-ledger-rejected',
      txBytes: wrongSecretTxBytes,
      maxTxSize: protocolParameters.maxTxSize,
      rejected: wrongSecretRejected,
      rejection: wrongSecretRejection.slice(0, 1200),
      originalInputsPreserved: true,
      canonicalHaskellValidatorModified: false,
      existingV3CarrierModified: false,
    }, null, 2))
  } finally {
    providerWithEvaluation.evaluateTx = originalEvaluateTx
  }
}

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

const serializedReferenceInputs: string[] = []
const serializedReferenceCollection = CML.Transaction.from_cbor_hex(txCbor).body().reference_inputs?.()
if (!serializedReferenceCollection) {
  throw new Error('Reveal signed CBOR lacks a reference_inputs collection')
}
for (let i = 0; i < Number(serializedReferenceCollection.len()); i++) {
  const input = serializedReferenceCollection.get(i)
  serializedReferenceInputs.push(input.transaction_id().to_hex().toLowerCase() + '#' + Number(input.index()))
}
const expectedReferenceInputs = [ref(prizeReferenceInput), ref(poolReferenceInput)].map(value => value.toLowerCase()).sort()
if (JSON.stringify([...serializedReferenceInputs].sort()) !== JSON.stringify(expectedReferenceInputs)) {
  throw new Error('Serialized Reveal reference inputs do not match the two validated reference-script UTxOs: ' +
    JSON.stringify({ serializedReferenceInputs, expectedReferenceInputs }))
}

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
    referenceInputs: serializedReferenceInputs.sort(),
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
