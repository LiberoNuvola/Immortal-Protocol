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
      [scripts.registryHash, fixtureOracleStatePolicyId, ORACLE_STATE_TOKEN_NAME_HEX, keyHash],
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

async function runSequentialRevealQueueCharacterization(): Promise<void> {
  if (!aikenRevealV3Candidate) {
    throw new Error('Sequential Reveal queue characterization requires IMMORTAL_REVEAL_AIKEN_V3=1')
  }
  const maxTxSize = Number(protocolParameters.maxTxSize)
  if (!Number.isSafeInteger(maxTxSize) || maxTxSize <= 0) {
    throw new Error('Sequential Reveal queue requires an authenticated protocol maxTxSize')
  }

  // These vectors are the repository's canonical Plutus V2 fixture vectors:
  // target=(network 0, round 1, mainchain [1,2,3], version [1]),
  // mcHash=[16], Materios context=[17]. The Aiken V3 Prize candidate derives
  // every payout itself; the fixture never inserts a claimed payout.
  const queueGameVersion = new Uint8Array([1])
  const queueMainchainRef = new Uint8Array([1, 2, 3])
  const queueMcHash = new Uint8Array([16])
  const queueMateriosContext = new Uint8Array([17])
  const queueTarget = {
    networkId: 0,
    round: 1,
    mainchainRef: queueMainchainRef,
    version: queueGameVersion,
  }
  const queueTargetHex = toHex(encodeBeaconTarget(queueTarget))
  const queueGameVersionHex = toHex(queueGameVersion)
  const queueMainchainRefHex = toHex(queueMainchainRef)
  const queueMcHashHex = toHex(queueMcHash)
  const queueMateriosContextHex = toHex(queueMateriosContext)
  const queueBeacon = await deriveBeacon(
    0,
    1,
    queueMainchainRef,
    queueMcHash,
    queueMateriosContext,
    queueGameVersion,
  )
  const queueBeaconHex = toHex(queueBeacon)
  const queueIssuedAt = BigInt(Date.now())
  const queueExpiresAt = queueIssuedAt + 3_600_000n
  const queueValidTo = () => {
    const near = BigInt(Date.now()) + 180_000n
    return near < queueExpiresAt ? near : queueExpiresAt
  }

  const maxSecretByNonce: Record<number, string> = {
    7: '000034cf',
    8: '00002b0e',
    9: '000073a1',
    10: '00002322',
    11: '000056e9',
    12: '000001db',
    13: '00002a26',
    14: '0000302f',
  }
  const lossSecretForNonce7 = '00bbccdd'

  const makeQueueTicket = async (
    scenarioIndex: number,
    nonce: number,
    price: bigint,
    outcome: 'max' | 'loss',
    poolScriptHash: string,
  ) => {
    const ticketName = 'Q' + String(scenarioIndex + 1).padStart(2, '0') + 'T' + String(nonce).padStart(2, '0')
    const ticketNameHex = toHex(new TextEncoder().encode(ticketName))
    const secretHex = outcome === 'loss' ? lossSecretForNonce7 : maxSecretByNonce[nonce]
    if (!secretHex) throw new Error('No canonical secret vector for nonce ' + nonce)
    if (outcome === 'loss' && nonce !== 7) {
      throw new Error('The canonical loss vector is only qualified for nonce 7')
    }
    const secret = fromHex(secretHex)
    const playerCommitmentValue = await playerCommitment(1, nonce, secret)
    const commitment = await ticketCommitment(
      fromHex(ticketNameHex),
      playerCommitmentValue,
      queueGameVersion,
      nonce,
      Number(price),
      fromHex(queueTargetHex),
    )
    const ticketSeed = await deriveTicketSeed(1, nonce, secret, queueBeacon, queueGameVersion)
    const symbolsSeed = await deriveSymbolsSeed(ticketSeed)
    const symbols = await generateSymbols(symbolsSeed)
    if (symbols.length !== 6) {
      throw new Error('Canonical queue fixture generated an invalid symbol count for nonce ' + nonce)
    }
    const row1Tier = classifyRowTier(symbols.slice(0, 3))
    const row2Tier = classifyRowTier(symbols.slice(3, 6))
    const payoutNumber = rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(price))
    const payout = BigInt(payoutNumber)
    if (outcome === 'max') {
      if (
        payout !== 500n * price ||
        (row1Tier !== 5 && row2Tier !== 5)
      ) {
        throw new Error(
          'Canonical max vector mismatch for nonce ' + nonce +
          ': symbols=' + JSON.stringify([...symbols]) +
          ' rowTiers=' + row1Tier + '/' + row2Tier +
          ' payout=' + payout.toString() +
          ' expected=' + (500n * price).toString(),
        )
      }
    } else if (row1Tier !== 0 || row2Tier !== 0 || payout !== 0n) {
      throw new Error(
        'Canonical LOSS vector mismatch: symbols=' + JSON.stringify([...symbols]) +
        ' rowTiers=' + row1Tier + '/' + row2Tier +
        ' payout=' + payout.toString(),
      )
    }

    const digest = await sha256(symbolsSeed)
    const result = await sha256(
      new Uint8Array([...field(digest), ...field(symbols)]),
    )
    const prizeTier = Math.max(row1Tier, row2Tier)
    const makeDatum = (revealed: boolean) => c(0, [
      testPolicyId,
      ticketNameHex,
      toHex(playerCommitmentValue),
      price,
      toHex(commitment),
      queueGameVersionHex,
      BigInt(nonce),
      revealed ? payout : 0n,
      '',
      '',
      c(revealed ? 1 : 0),
      revealed ? toHex(result) : '',
      revealed ? BigInt(prizeTier) : 0n,
      c(0, [0n, 1n, queueMainchainRefHex, queueGameVersionHex]),
      c(1),
      queueBeaconHex,
      queueMcHashHex,
      queueMateriosContextHex,
      poolScriptHash,
      queueIssuedAt,
      queueExpiresAt,
      revealed ? BigInt(row1Tier) : 0n,
      revealed ? BigInt(row2Tier) : 0n,
    ])
    return {
      nonce,
      price,
      outcome,
      ticketName,
      ticketNameHex,
      ticketUnit: testPolicyId + ticketNameHex,
      secretHex,
      symbols: [...symbols],
      row1Tier,
      row2Tier,
      prizeTier,
      payout,
      playerCommitmentHex: toHex(playerCommitmentValue),
      commitmentHex: toHex(commitment),
      inputDatum: makeDatum(false),
      outputDatum: makeDatum(true),
    }
  }

  const scenarios = [
    {
      id: 'homogeneous-buffer-plus-1',
      liquidity: 400_100n,
      tickets: Array.from({ length: 8 }, (_, i) => ({
        nonce: 7 + i, price: 100n, outcome: 'max' as const,
      })),
      order: [7, 8, 9, 10, 11, 12, 13, 14],
      rejectAt: null as number | null,
    },
    {
      id: 'mixed-buffer-small-first-plus-100',
      liquidity: 5_060_000n,
      tickets: [
        { nonce: 7, price: 100n, outcome: 'max' as const },
        { nonce: 8, price: 10_000n, outcome: 'max' as const },
      ],
      order: [7, 8],
      rejectAt: null as number | null,
    },
    {
      id: 'mixed-buffer-large-first-plus-100',
      liquidity: 5_060_000n,
      tickets: [
        { nonce: 7, price: 10_000n, outcome: 'max' as const },
        { nonce: 8, price: 100n, outcome: 'max' as const },
      ],
      order: [7, 8],
      rejectAt: null as number | null,
    },
    {
      id: 'homogeneous-exact-wce',
      liquidity: 400_000n,
      tickets: Array.from({ length: 8 }, (_, i) => ({
        nonce: 7 + i, price: 100n, outcome: 'max' as const,
      })),
      order: [7, 8, 9, 10, 11, 12, 13, 14],
      rejectAt: 7 as number | null,
    },
    {
      id: 'mixed-exact-small-first',
      liquidity: 5_050_000n,
      tickets: [
        { nonce: 7, price: 100n, outcome: 'max' as const },
        { nonce: 8, price: 10_000n, outcome: 'max' as const },
      ],
      order: [7, 8],
      rejectAt: 1 as number | null,
    },
    {
      id: 'mixed-exact-large-first',
      liquidity: 5_050_000n,
      tickets: [
        { nonce: 7, price: 10_000n, outcome: 'max' as const },
        { nonce: 8, price: 100n, outcome: 'max' as const },
      ],
      order: [7, 8],
      rejectAt: 1 as number | null,
    },
    {
      id: 'loss-before-final-maximum',
      liquidity: 400_000n,
      tickets: [
        { nonce: 7, price: 100n, outcome: 'loss' as const },
        ...[8, 9, 10, 11, 12, 13, 14].map((nonce) => ({
          nonce, price: 100n, outcome: 'max' as const,
        })),
      ],
      order: [8, 9, 10, 11, 12, 13, 7, 14],
      rejectAt: null as number | null,
    },
  ]

  // Arithmetic invariants are checked before any bootstrap or spend.
  for (const scenario of scenarios) {
    const face = scenario.tickets.reduce((sum, ticket) => sum + ticket.price, 0n)
    if (scenario.id === 'homogeneous-exact-wce' && scenario.liquidity !== 500n * face) {
      throw new Error('Homogeneous exact-WCE fixture arithmetic mismatch')
    }
    if (scenario.id === 'homogeneous-buffer-plus-1' && scenario.liquidity !== 500n * face + 100n) {
      throw new Error('Homogeneous +1-USDM fixture arithmetic mismatch')
    }
    if (
      scenario.id.startsWith('mixed-exact') &&
      scenario.liquidity !== 500n * face
    ) {
      throw new Error('Mixed exact-WCE fixture arithmetic mismatch: ' + scenario.id)
    }
    if (
      scenario.id.startsWith('mixed-buffer') &&
      scenario.liquidity !== 500n * face + 10_000n
    ) {
      throw new Error('Mixed +100-USDM fixture arithmetic mismatch: ' + scenario.id)
    }
  }

  const publication = async (purpose: string, script: Script) => {
    const tx = await lucid
      .newTx()
      .pay.ToAddressWithData(referenceAddress, undefined, { lovelace: 2_000_000n }, script)
      .complete({ localUPLCEval: false })
    const signed = await tx.sign.withWallet().complete({ localUPLCEval: false })
    const publicationCbor = signed.toCBOR()
    const publicationBytes = Buffer.from(publicationCbor, 'hex').length
    if (publicationBytes > maxTxSize) {
      throw new Error(
        purpose + ' reference publication exceeds maxTxSize: ' +
        publicationBytes + ' > ' + maxTxSize,
      )
    }
    const hash = await signed.submit()
    await lucid.awaitTx(hash)
    const refs = await lucid.utxosAt(referenceAddress)
    const utxo = refs.find((u) => u.txHash === hash)
    if (!utxo) throw new Error(purpose + ' reference UTxO was not materialized')
    const bound = bindPublishedReferenceScript({
      purpose,
      publishedTxCbor: publicationCbor,
      expectedScript: script,
      referenceAddress,
      utxo,
    })
    return {
      hash,
      utxo,
      bound,
      bytes: publicationBytes,
      scriptHash: validatorToScriptHash(script).toLowerCase(),
      scriptBytes: Buffer.from(script.script, 'hex').length,
    }
  }

  const prizeReference = await publication(
    'PrizeValidator',
    scripts.prizeValidator as Script,
  )

  const budgetTemplates = new Map<string, {
    prize: { mem: string; steps: string }
    pool: { mem: string; steps: string }
  }>()
  const queueTransactions: any[] = []
  const scenarioResults: any[] = []
  const spendInputRefsFromCbor = (cborHex: string): string[] => {
    const normalized = cborHex.startsWith('0x') ? cborHex.slice(2) : cborHex
    const inputs = CML.Transaction.from_cbor_hex(normalized).body().inputs()
    const refs: string[] = []
    for (let i = 0; i < Number(inputs.len()); i += 1) {
      const input = inputs.get(i)
      refs.push(
        input.transaction_id().to_hex().toLowerCase() + '#' + Number(input.index()),
      )
    }
    return refs
  }
  const assertQueueSpendingInputs = (
    cborHex: string,
    prize: UTxO,
    pool: UTxO,
    walletInputRefs: Set<string>,
    scenarioId: string,
  ) => {
    const actual = spendInputRefsFromCbor(cborHex)
    const prizeRef = ref(prize).toLowerCase()
    const poolRef = ref(pool).toLowerCase()
    const prizeIndex = actual.indexOf(prizeRef)
    const poolIndex = actual.indexOf(poolRef)
    if (prizeIndex < 0 || poolIndex < 0 ||
        actual.lastIndexOf(prizeRef) !== prizeIndex ||
        actual.lastIndexOf(poolRef) !== poolIndex) {
      throw new Error(
        scenarioId + ' must spend exactly one expected Prize and one expected Pool UTxO: ' +
        JSON.stringify({ actual, prizeRef, poolRef }),
      )
    }
    const walletInputs = actual.filter((inputRef) =>
      inputRef !== prizeRef && inputRef !== poolRef,
    )
    const unexpectedInputs = walletInputs.filter((inputRef) => !walletInputRefs.has(inputRef))
    if (unexpectedInputs.length > 0 || walletInputs.length === 0) {
      throw new Error(
        scenarioId + ' requires only the two script inputs plus wallet-key fee inputs: ' +
        JSON.stringify({ walletInputs, unexpectedInputs }),
      )
    }
    return { actual, prizeIndex, poolIndex, walletInputs }
  }
  const assetsFingerprint = (assets: Record<string, bigint>) =>
    Object.entries(assets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([unit, quantity]) => [unit, quantity.toString()])
  const persistTransactions = () => {
    writeFileSync(
      'audit/yaci-evidence/reveal-queue-transactions.jsonl',
      queueTransactions.map((entry) => JSON.stringify(entry, jsonReplacer)).join('\n') + '\n',
    )
  }

  for (let scenarioIndex = 0; scenarioIndex < scenarios.length; scenarioIndex += 1) {
    const scenario = scenarios[scenarioIndex]
    const poolTokenName = 'QPOOL' + String(scenarioIndex + 1).padStart(2, '0')
    const poolTokenNameHex = toHex(new TextEncoder().encode(poolTokenName))
    const poolUnit = testPolicyId + poolTokenNameHex
    const poolScript = buildB1PrizePool(
      scripts.prizeHash,
      keyHash,
      fixtureOracleStatePolicyId,
      ORACLE_STATE_TOKEN_NAME_HEX,
      testPolicyId,
      poolTokenNameHex,
    ) as Script
    const poolScriptHash = validatorToScriptHash(poolScript).toLowerCase()
    const poolAddress = validatorToAddress('Preprod', poolScript)
    const poolReference = await publication('B1PrizePool', poolScript)
    const faceTotal = scenario.tickets.reduce((sum, ticket) => sum + ticket.price, 0n)
    const tickets = await Promise.all(
      scenario.tickets.map((ticket) =>
        makeQueueTicket(
          scenarioIndex,
          ticket.nonce,
          ticket.price,
          ticket.outcome,
          poolScriptHash,
        ),
      ),
    )
    const ticketsByNonce = new Map(tickets.map((ticket) => [ticket.nonce, ticket]))
    if (ticketsByNonce.size !== tickets.length) {
      throw new Error('Queue fixture contains duplicate ticket nonces: ' + scenario.id)
    }

    const mintAssets: Record<string, bigint> = {
      [poolUnit]: 1n,
      [liquidityUnit]: scenario.liquidity,
    }
    for (const ticket of tickets) mintAssets[ticket.ticketUnit] = 1n

    let bootstrapBuilder: any = lucid
      .newTx()
      .mintAssets(mintAssets, Data.void())
      .attach.MintingPolicy(testPolicy)
    bootstrapBuilder = bootstrapBuilder.pay.ToContract(
      poolAddress,
      { kind: 'inline', value: Data.to(poolDatum(scripts.prizeHash, scenario.liquidity, faceTotal, BigInt(tickets.length), 0n)) },
      {
        lovelace: 8_000_000n,
        [poolUnit]: 1n,
        [liquidityUnit]: scenario.liquidity,
      },
    )
    for (const ticket of tickets) {
      bootstrapBuilder = bootstrapBuilder.pay.ToContract(
        scripts.prizeAddress as string,
        { kind: 'inline', value: Data.to(ticket.inputDatum) },
        {
          lovelace: 5_000_000n,
          [ticket.ticketUnit]: 1n,
        },
      )
    }
    const bootstrap = await bootstrapBuilder
      .addSigner(address)
      .complete({ localUPLCEval: false })
    const bootstrapSigned = await bootstrap.sign.withWallet().complete({ localUPLCEval: false })
    const bootstrapCbor = bootstrapSigned.toCBOR()
    const bootstrapBytes = Buffer.from(bootstrapCbor, 'hex').length
    if (bootstrapBytes > maxTxSize) {
      throw new Error(
        scenario.id + ' bootstrap exceeds maxTxSize: ' + bootstrapBytes + ' > ' + maxTxSize,
      )
    }
    const bootstrapHash = await bootstrapSigned.submit()
    await lucid.awaitTx(bootstrapHash)

    const prizeUtxos = await waitFor(
      () => lucid.utxosAt(scripts.prizeAddress as string),
      (xs) => tickets.every((ticket) =>
        xs.some((u) => u.assets[ticket.ticketUnit] === 1n && u.txHash === bootstrapHash),
      ),
      scenario.id + ' bootstrapped Prize UTxOs',
    )
    const poolUtxos = await waitFor(
      () => lucid.utxosAt(poolAddress),
      (xs) => xs.some((u) => u.assets[poolUnit] === 1n && u.txHash === bootstrapHash),
      scenario.id + ' bootstrapped B1 Pool UTxO',
    )
    const prizeByNonce = new Map<number, UTxO>(
      tickets.map((ticket) => [
        ticket.nonce,
        prizeUtxos.find((u) =>
          u.assets[ticket.ticketUnit] === 1n && u.txHash === bootstrapHash,
        ) as UTxO,
      ]),
    )
    let currentPool = poolUtxos.find((u) =>
      u.assets[poolUnit] === 1n && u.txHash === bootstrapHash,
    ) as UTxO
    if (!currentPool || tickets.some((ticket) => !prizeByNonce.get(ticket.nonce))) {
      throw new Error(scenario.id + ' initial UTxO materialization is incomplete')
    }

    let currentReserve = faceTotal
    let currentLiabilities = 0n
    let currentCount = BigInt(tickets.length)
    let acceptedCount = 0
    let rejectedAt: number | null = null
    const stepResults: any[] = []

    for (let stepIndex = 0; stepIndex < scenario.order.length; stepIndex += 1) {
      const nonce = scenario.order[stepIndex]
      const ticket = ticketsByNonce.get(nonce)
      const prizeInput = prizeByNonce.get(nonce)
      if (!ticket || !prizeInput) {
        throw new Error(scenario.id + ' reveal order references missing nonce ' + nonce)
      }
      const consumedPrizeRef = ref(prizeInput)
      const consumedPoolRef = ref(currentPool)
      const consumedPrizeAssets = assetsFingerprint(prizeInput.assets)
      const consumedPoolAssets = assetsFingerprint(currentPool.assets)
      const nextReserve = currentReserve - ticket.price
      const nextLiabilities = currentLiabilities + ticket.payout
      const nextCount = currentCount - 1n
      if (nextReserve < 0n || nextCount < 0n) {
        throw new Error(scenario.id + ' would underflow Pending reserve/count')
      }
      const inputPrizeDatumCbor = Data.to(ticket.inputDatum)
      const inputPoolDatumCbor = Data.to(
        poolDatum(scripts.prizeHash, scenario.liquidity, currentReserve, currentCount, currentLiabilities),
      )
      const outputPoolDatumCbor = Data.to(
        poolDatum(scripts.prizeHash, scenario.liquidity, nextReserve, nextCount, nextLiabilities),
      )
      const outputPrizeDatumCbor = Data.to(ticket.outputDatum)
      if (prizeInput.datum !== inputPrizeDatumCbor) {
        throw new Error(scenario.id + ' Prize input datum differs from canonical Pending fixture')
      }
      if (currentPool.datum !== inputPoolDatumCbor) {
        throw new Error(scenario.id + ' B1 Pool input datum differs from the observed evolving state')
      }
      const prizeRedeemer = Data.to(c(1, [ticket.secretHex]))
      const poolRedeemer = Data.to(c(2, [ticket.price]))
      // The Aiken Reveal context requires the full Pool Value to be preserved.
      // Transaction fees/change therefore come only from additional wallet-key
      // inputs selected by Lucid; neither the Prize nor Pool Value is reduced.
      const poolOutputAssets = currentPool.assets
      const walletInputRefs = new Set(
        (await lucid.utxosAt(address)).map((utxo) => ref(utxo).toLowerCase()),
      )
      const builder = lucid
        .newTx()
        .readFrom([prizeReference.bound, poolReference.bound])
        .collectFrom([prizeInput], prizeRedeemer)
        .collectFrom([currentPool], poolRedeemer)
        .pay.ToContract(
          scripts.prizeAddress as string,
          { kind: 'inline', value: outputPrizeDatumCbor },
          prizeInput.assets,
        )
        .pay.ToContract(
          poolAddress,
          { kind: 'inline', value: outputPoolDatumCbor },
          poolOutputAssets,
        )
        .addSigner(address)
        .validTo(Number(queueValidTo()))
      const expectedReject = scenario.rejectAt === stepIndex
      let builtTx: any
      let measuredExUnits: any = null
      let budgetSource: string | null = null
      let signedTx: any
      let signedCbor = ''
      let summary: any
      let txHash: string | null = null
      let rejection = ''

      if (expectedReject) {
        const template = budgetTemplates.get(ticket.price.toString())
        if (!template) {
          throw new Error(
            scenario.id + ' has no qualified positive-twin ExUnits template for price ' +
            ticket.price.toString(),
          )
        }
        const originalEvaluateTx = providerWithEvaluation.evaluateTx
        try {
          providerWithEvaluation.evaluateTx = async (txCbor: string) => {
            const inputPlan = assertQueueSpendingInputs(
              txCbor,
              prizeInput,
              currentPool,
              walletInputRefs,
              scenario.id,
            )
            return [
              {
                redeemer_tag: 'spend',
                redeemer_index: inputPlan.prizeIndex,
                ex_units: {
                  mem: Number(template.prize.mem),
                  steps: Number(template.prize.steps),
                },
              },
              {
                redeemer_tag: 'spend',
                redeemer_index: inputPlan.poolIndex,
                ex_units: {
                  mem: Number(template.pool.mem),
                  steps: Number(template.pool.steps),
                },
              },
            ]
          }
          builtTx = await builder.complete({ localUPLCEval: false })
          const unsignedCbor = builtTx.toCBOR()
          const unsignedBytes = Buffer.from(unsignedCbor, 'hex').length
          if (unsignedBytes > maxTxSize) {
            throw new Error(
              scenario.id + ' negative twin cannot qualify ledger rejection: CBOR ' +
              unsignedBytes + ' > maxTxSize ' + maxTxSize,
            )
          }
          const inputPlan = assertQueueSpendingInputs(
            unsignedCbor,
            prizeInput,
            currentPool,
            walletInputRefs,
            scenario.id,
          )
          const unsignedDescription = describeTx(unsignedCbor)
          const negativeSpendIndices = unsignedDescription.redeemers
            .filter((redeemer) => redeemer.tag === 0)
            .map((redeemer) => redeemer.index)
            .sort((a, b) => a - b)
          if (JSON.stringify(negativeSpendIndices) !==
              JSON.stringify([inputPlan.prizeIndex, inputPlan.poolIndex].sort((a, b) => a - b))) {
            throw new Error(scenario.id + ' negative twin lacks exactly the Prize and Pool spend redeemers')
          }
          signedTx = await builtTx.sign.withWallet().complete({ localUPLCEval: false })
          signedCbor = signedTx.toCBOR()
          const signedBytes = Buffer.from(signedCbor, 'hex').length
          if (signedBytes > maxTxSize) {
            throw new Error(
              scenario.id + ' signed negative twin exceeds maxTxSize: ' +
              signedBytes + ' > ' + maxTxSize,
            )
          }
          summary = describeTx(signedCbor)
          budgetSource = 'same-price positive Yaci twin with assigned 1% margin'
        } finally {
          providerWithEvaluation.evaluateTx = originalEvaluateTx
        }

        // Preserve the exact signed body and witnesses; only flip the
        // transaction validity bit required by the Cardano phase-2 failure
        // envelope. The body hash and witness-set CBOR must remain identical.
        const signedCandidate = CML.Transaction.from_cbor_hex(signedCbor)
        const candidateBody = signedCandidate.body()
        const candidateWitnesses = signedCandidate.witness_set()
        const candidateAuxiliaryData = signedCandidate.auxiliary_data()
        const invalidEnvelope = CML.Transaction.new(
          candidateBody,
          candidateWitnesses,
          false,
          candidateAuxiliaryData ?? undefined,
        )
        if (invalidEnvelope.is_valid() !== false) {
          throw new Error(scenario.id + ' CML did not preserve is_valid=false on the negative envelope')
        }
        const invalidCbor = invalidEnvelope.to_cbor_hex()
        const invalidBytes = Buffer.from(invalidCbor, 'hex').length
        if (invalidBytes > maxTxSize) {
          throw new Error(
            scenario.id + ' invalid-envelope CBOR exceeds maxTxSize: ' +
            invalidBytes + ' > ' + maxTxSize,
          )
        }
        const invalidSummary = describeTx(invalidCbor)
        if (invalidSummary.bodyHash !== summary.bodyHash) {
          throw new Error(scenario.id + ' CML invalid-envelope conversion changed the signed body hash')
        }
        if (candidateWitnesses.to_cbor_hex() !== invalidEnvelope.witness_set().to_cbor_hex()) {
          throw new Error(scenario.id + ' CML invalid-envelope conversion changed the witness set')
        }

        // Fail closed unless the signed body has explicit, wallet-controlled
        // ADA collateral and a coherent total-collateral / return plan.
        const bodyAny = candidateBody as any
        if (typeof bodyAny.collateral !== 'function' ||
            typeof bodyAny.total_collateral !== 'function' ||
            typeof bodyAny.collateral_return !== 'function') {
          throw new Error(scenario.id + ' pinned CML lacks the required collateral inspection API')
        }
        const collateralInputs = bodyAny.collateral()
        if (!collateralInputs || typeof collateralInputs.len !== 'function' || collateralInputs.len() < 1) {
          throw new Error(scenario.id + ' negative Reveal has no explicit collateral inputs')
        }
        const walletUtxosBefore = await lucid.utxosAt(address)
        const collateralRefs: string[] = []
        let collateralLovelace = 0n
        for (let i = 0; i < collateralInputs.len(); i += 1) {
          const collateralInput = collateralInputs.get(i)
          const collateralRef = collateralInput.transaction_id().to_hex() + '#' +
            Number(collateralInput.index())
          if (collateralRefs.includes(collateralRef)) {
            throw new Error(scenario.id + ' duplicate collateral input: ' + collateralRef)
          }
          collateralRefs.push(collateralRef)
          const collateralUtxo = walletUtxosBefore.find((utxo) => ref(utxo) === collateralRef)
          if (!collateralUtxo) {
            throw new Error(scenario.id + ' collateral input is not present in the connected wallet: ' + collateralRef)
          }
          const collateralUnits = Object.keys(collateralUtxo.assets)
          if (collateralUnits.some((unit) => unit !== 'lovelace')) {
            throw new Error(scenario.id + ' collateral input is not ADA-only: ' + collateralRef)
          }
          collateralLovelace += collateralUtxo.assets.lovelace ?? 0n
        }
        const maxCollateralInputs = Number((protocolParameters as any).maxCollateralInputs)
        const collateralPercentage = Number((protocolParameters as any).collateralPercentage)
        if (!Number.isSafeInteger(maxCollateralInputs) || maxCollateralInputs < 1 ||
            collateralInputs.len() > maxCollateralInputs) {
          throw new Error(scenario.id + ' collateral input count exceeds active protocol parameters')
        }
        if (!Number.isSafeInteger(collateralPercentage) || collateralPercentage < 1) {
          throw new Error(scenario.id + ' active collateral percentage is unavailable')
        }
        const minimumCollateral = (
          BigInt(summary.fee) * BigInt(collateralPercentage) + 99n
        ) / 100n
        const totalCollateralValue = bodyAny.total_collateral()
        const totalCollateral = totalCollateralValue == null
          ? collateralLovelace
          : BigInt(totalCollateralValue.toString())
        const collateralReturn = bodyAny.collateral_return()
        if (collateralLovelace < minimumCollateral ||
            totalCollateral < minimumCollateral ||
            totalCollateral > collateralLovelace) {
          throw new Error(scenario.id + ' collateral amount is insufficient or inconsistent: ' +
            JSON.stringify({
              collateralLovelace: collateralLovelace.toString(),
              totalCollateral: totalCollateral.toString(),
              minimumCollateral: minimumCollateral.toString(),
            }))
        }
        const expectedCollateralReturn = collateralLovelace - totalCollateral
        let collateralReturnAddress: string | null = null
        if (expectedCollateralReturn > 0n) {
          if (!collateralReturn) {
            throw new Error(scenario.id + ' excess collateral has no collateral-return output')
          }
          collateralReturnAddress = collateralReturn.address().to_bech32()
          if (collateralReturnAddress !== address) {
            throw new Error(scenario.id + ' collateral return does not return to the connected wallet')
          }
          const returnedLovelace = BigInt(collateralReturn.amount().coin().toString())
          if (returnedLovelace !== expectedCollateralReturn) {
            throw new Error(scenario.id + ' collateral-return lovelace mismatch: expected ' +
              expectedCollateralReturn.toString() + ', got ' + returnedLovelace.toString())
          }
        } else if (collateralReturn) {
          throw new Error(scenario.id + ' unexpected collateral-return output when all collateral is consumed')
        }

        // Submit raw CBOR to Yaci's node submission boundary, not the
        // Blockfrost-compatible Store/evaluator endpoint.
        const submitResponse = await fetch('http://127.0.0.1:8090/api/submit/tx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/cbor' },
          body: Buffer.from(invalidCbor, 'hex'),
        })
        const submitBody = await submitResponse.text()
        if (!submitResponse.ok) {
          throw new Error(scenario.id + ' invalid-envelope raw Yaci submission failed (HTTP ' +
            submitResponse.status + '): ' + submitBody.slice(0, 1600))
        }
        txHash = invalidSummary.bodyHash
        // Persist the actual invalid envelope, not the pre-envelope signed candidate.
        signedCbor = invalidCbor
        summary = invalidSummary
        console.log(JSON.stringify({
          revealQueueDiag: 'negative-invalid-envelope-submitted',
          scenarioId: scenario.id,
          stepIndex,
          txHash,
          bodyHashPreserved: true,
          witnessSetPreserved: true,
          isValid: false,
          collateralRefs,
          collateralLovelace: collateralLovelace.toString(),
          totalCollateral: totalCollateral.toString(),
          expectedCollateralReturn: expectedCollateralReturn.toString(),
          collateralReturnAddress,
          submitHttpStatus: submitResponse.status,
          submitResponse: submitBody.slice(0, 500),
          transaction: invalidSummary,
        }))

        await lucid.awaitTx(txHash)
        const indexedTxResponse = await fetch(API + '/txs/' + txHash)
        if (!indexedTxResponse.ok) {
          throw new Error(scenario.id + ' invalid transaction was not indexed by Yaci Store: HTTP ' +
            indexedTxResponse.status)
        }
        const walletUtxosAfter = await lucid.utxosAt(address)
        const stillUnspentCollateral = collateralRefs.filter((collateralRef) =>
          walletUtxosAfter.some((utxo) => ref(utxo) === collateralRef),
        )
        if (stillUnspentCollateral.length > 0) {
          throw new Error(scenario.id + ' ledger inclusion did not consume collateral inputs: ' +
            stillUnspentCollateral.join(', '))
        }
        if (expectedCollateralReturn > 0n) {
          const collateralReturnIndex = candidateBody.outputs().len()
          const returnedUtxo = walletUtxosAfter.find((utxo) =>
            utxo.txHash === txHash && utxo.outputIndex === collateralReturnIndex,
          )
          if (!returnedUtxo ||
              returnedUtxo.assets.lovelace !== expectedCollateralReturn ||
              Object.keys(returnedUtxo.assets).some((unit) => unit !== 'lovelace')) {
            throw new Error(scenario.id + ' expected collateral-return UTxO is not observable with exact value')
          }
        }
        const stillUnspentPrize = await lucid.utxosAt(scripts.prizeAddress as string)
        const stillUnspentPool = await lucid.utxosAt(poolAddress)
        const preservedPrize = stillUnspentPrize.find((u) => ref(u) === ref(prizeInput))
        const preservedPool = stillUnspentPool.find((u) => ref(u) === ref(currentPool))
        if (!preservedPrize || !preservedPool) {
          throw new Error(scenario.id + ' phase-2 rejected Reveal did not preserve Prize and Pool inputs')
        }
        if (preservedPrize.datum !== inputPrizeDatumCbor || preservedPool.datum !== inputPoolDatumCbor) {
          throw new Error(scenario.id + ' phase-2 rejected Reveal changed an original input datum')
        }
        if (
          JSON.stringify(assetsFingerprint(preservedPrize.assets)) !==
            JSON.stringify(assetsFingerprint(prizeInput.assets)) ||
          JSON.stringify(assetsFingerprint(preservedPool.assets)) !==
            JSON.stringify(assetsFingerprint(currentPool.assets))
        ) {
          throw new Error(scenario.id + ' phase-2 rejected Reveal changed an original input Value')
        }
        rejection = 'ledger-included is_valid=false phase-2 rejection; collateral consumed and Prize/Pool preserved'
        rejectedAt = stepIndex
      } else {
        builtTx = await builder.complete({ localUPLCEval: false })
        const unsignedCbor = builtTx.toCBOR()
        const unsignedBytes = Buffer.from(unsignedCbor, 'hex').length
        if (unsignedBytes > maxTxSize) {
          throw new Error(
            scenario.id + ' positive Reveal exceeds maxTxSize before signing: ' +
            unsignedBytes + ' > ' + maxTxSize,
          )
        }
        const inputPlan = assertQueueSpendingInputs(
          unsignedCbor,
          prizeInput,
          currentPool,
          walletInputRefs,
          scenario.id,
        )
        measuredExUnits = await evaluateYaciTx(unsignedCbor, [])
        summary = describeTx(unsignedCbor)
        const expectedSpendIndices = [inputPlan.prizeIndex, inputPlan.poolIndex].sort((a, b) => a - b)
        const measuredSpendIndices = measuredExUnits
          .filter((measured) => measured.redeemer_tag === 'spend')
          .map((measured) => measured.redeemer_index)
          .sort((a, b) => a - b)
        if (JSON.stringify(measuredSpendIndices) !== JSON.stringify(expectedSpendIndices)) {
          throw new Error(
            scenario.id + ' Yaci evaluation did not return exactly the Prize + Pool spend redeemers: ' +
            JSON.stringify({ measuredSpendIndices, expectedSpendIndices }),
          )
        }
        const coverage = measuredExUnits.map((measured) => {
          const assigned = summary.redeemers.find(
            (r: any) => r.tag === 0 && r.index === measured.redeemer_index,
          )
          return {
            redeemer_tag: measured.redeemer_tag,
            redeemer_index: measured.redeemer_index,
            measured: measured.ex_units,
            assigned: assigned
              ? { mem: Number(assigned.mem), steps: Number(assigned.steps) }
              : null,
            covered: Boolean(
              assigned &&
              Number(assigned.mem) >= measured.ex_units.mem &&
              Number(assigned.steps) >= measured.ex_units.steps,
            ),
          }
        })
        if (
          measuredExUnits.length !== 2 ||
          coverage.length !== 2 ||
          coverage.some((item) => !item.covered)
        ) {
          throw new Error(
            scenario.id + ' positive Reveal lacks two fully covered redeemer ExUnits: ' +
            JSON.stringify(coverage),
          )
        }
        const assignedPrize = summary.redeemers.find(
          (redeemer: any) => redeemer.tag === 0 && redeemer.index === inputPlan.prizeIndex,
        )
        const assignedPool = summary.redeemers.find(
          (redeemer: any) => redeemer.tag === 0 && redeemer.index === inputPlan.poolIndex,
        )
        if (!assignedPrize || !assignedPool) {
          throw new Error(scenario.id + ' could not attribute positive ExUnits by validator role')
        }
        budgetTemplates.set(ticket.price.toString(), {
          prize: {
            mem: String(assignedPrize.mem),
            steps: String(assignedPrize.steps),
          },
          pool: {
            mem: String(assignedPool.mem),
            steps: String(assignedPool.steps),
          },
        })
        budgetSource = 'measured Yaci CEK execution for this positive twin'
        signedTx = await builtTx.sign.withWallet().complete({ localUPLCEval: false })
        signedCbor = signedTx.toCBOR()
        const signedBytes = Buffer.from(signedCbor, 'hex').length
        if (signedBytes > maxTxSize) {
          throw new Error(
            scenario.id + ' signed positive Reveal exceeds maxTxSize: ' +
            signedBytes + ' > ' + maxTxSize,
          )
        }
        summary = describeTx(signedCbor)
        txHash = await signedTx.submit()
        await lucid.awaitTx(txHash)
        const nextPrizeUtxos = await waitFor(
          () => lucid.utxosAt(scripts.prizeAddress as string),
          (xs) => xs.some((u) => u.txHash === txHash && u.assets[ticket.ticketUnit] === 1n),
          scenario.id + ' revealed Prize output ' + nonce,
        )
        const nextPoolUtxos = await waitFor(
          () => lucid.utxosAt(poolAddress),
          (xs) => xs.some((u) => u.txHash === txHash && u.assets[poolUnit] === 1n),
          scenario.id + ' continuing B1 Pool output',
        )
        const nextPrize = nextPrizeUtxos.find(
          (u) => u.txHash === txHash && u.assets[ticket.ticketUnit] === 1n,
        ) as UTxO
        currentPool = nextPoolUtxos.find(
          (u) => u.txHash === txHash && u.assets[poolUnit] === 1n,
        ) as UTxO
        if (!nextPrize || !currentPool) {
          throw new Error(scenario.id + ' successful Reveal output observation is incomplete')
        }
        if (nextPrize.datum !== outputPrizeDatumCbor || currentPool.datum !== outputPoolDatumCbor) {
          throw new Error(scenario.id + ' observed Reveal output datum differs from the signed candidate output')
        }
        if (
          JSON.stringify(assetsFingerprint(nextPrize.assets)) !==
            JSON.stringify(assetsFingerprint(prizeInput.assets)) ||
          JSON.stringify(assetsFingerprint(currentPool.assets)) !==
            JSON.stringify(assetsFingerprint(poolOutputAssets))
        ) {
          throw new Error(scenario.id + ' observed Reveal output Value differs from the expected token/ADA movement')
        }
        acceptedCount += 1
        currentReserve = nextReserve
        currentLiabilities = nextLiabilities
        currentCount = nextCount
        stepResults.push({
          stepIndex,
          nonce,
          ticketNameHex: ticket.ticketNameHex,
          priceUsdmSubunits: ticket.price.toString(),
          payoutUsdmSubunits: ticket.payout.toString(),
          rowTiers: [ticket.row1Tier, ticket.row2Tier],
          symbols: ticket.symbols,
          consumedPrizeRef,
          consumedPoolRef,
          producedPrizeRef: ref(nextPrize),
          producedPoolRef: ref(currentPool),
        })
        queueTransactions.push({
          scenarioId: scenario.id,
          stepIndex,
          nonce,
          expectedOutcome: 'accept',
          spendingInputRefs: inputPlan.actual,
          walletFeeInputs: inputPlan.walletInputs,
          observedOutcome: 'accepted-by-yaci',
          ticketNameHex: ticket.ticketNameHex,
          priceUsdmSubunits: ticket.price.toString(),
          payoutUsdmSubunits: ticket.payout.toString(),
          rowTiers: [ticket.row1Tier, ticket.row2Tier],
          symbols: ticket.symbols,
          secretHex: ticket.secretHex,
          consumed: {
            prizeRef: consumedPrizeRef,
            prizeDatumCbor: inputPrizeDatumCbor,
            prizeAssets: consumedPrizeAssets,
            poolRef: consumedPoolRef,
            poolDatumCbor: inputPoolDatumCbor,
            poolAssets: consumedPoolAssets,
          },
          produced: {
            prizeRef: ref(nextPrize),
            prizeDatumCbor: outputPrizeDatumCbor,
            prizeAssets: assetsFingerprint(nextPrize.assets),
            poolRef: ref(currentPool),
            poolDatumCbor: outputPoolDatumCbor,
            poolAssets: assetsFingerprint(currentPool.assets),
          },
          signedTxCbor: signedCbor,
          tx: summary,
          measuredExUnits,
          budgetSource,
          yaci: { submitted: true, accepted: true, transactionRef: txHash },
        })
        persistTransactions()
        continue
      }

      // Re-derive the serialized spending-input plan after the failed submit;
      // the evidence record must use this CBOR-derived scope, not the temporary
      // construction-time ExUnits callback's local variables.
      const rejectedInputPlan = assertQueueSpendingInputs(
        signedCbor,
        prizeInput,
        currentPool,
        walletInputRefs,
        scenario.id,
      )
      queueTransactions.push({
        scenarioId: scenario.id,
        stepIndex,
        nonce,
        expectedOutcome: 'reject',
        spendingInputRefs: rejectedInputPlan.actual,
        walletFeeInputs: rejectedInputPlan.walletInputs,
        observedOutcome: 'rejected-by-yaci-ledger-validation',
        ticketNameHex: ticket.ticketNameHex,
        priceUsdmSubunits: ticket.price.toString(),
        payoutUsdmSubunits: ticket.payout.toString(),
        rowTiers: [ticket.row1Tier, ticket.row2Tier],
        symbols: ticket.symbols,
        secretHex: ticket.secretHex,
        consumed: {
          prizeRef: consumedPrizeRef,
          prizeDatumCbor: inputPrizeDatumCbor,
          prizeAssets: consumedPrizeAssets,
          poolRef: consumedPoolRef,
          poolDatumCbor: inputPoolDatumCbor,
          poolAssets: consumedPoolAssets,
          feeFundingInputs: rejectedInputPlan.walletInputs,
        },
        candidateOutput: {
          prizeDatumCbor: outputPrizeDatumCbor,
          poolDatumCbor: outputPoolDatumCbor,
        },
        signedTxCbor: signedCbor,
        tx: summary,
        measuredExUnits: null,
        budgetSource,
        yaci: {
          submitted: true,
          accepted: false,
          transactionRef: null,
          rejection: rejection.slice(0, 1600),
          collateral: {
            inputRefs: collateralRefs,
            inputLovelace: collateralLovelace.toString(),
            totalCollateral: totalCollateral.toString(),
            returnedLovelace: expectedCollateralReturn.toString(),
            returnAddress: collateralReturnAddress,
            consumed: true,
          },
          originalInputsPreserved: true,
        },
      })
      persistTransactions()
      break
    }

    if (scenario.rejectAt === null && rejectedAt !== null) {
      throw new Error(scenario.id + ' rejected unexpectedly at step ' + rejectedAt)
    }
    if (scenario.rejectAt !== null && rejectedAt !== scenario.rejectAt) {
      throw new Error(
        scenario.id + ' expected rejection at step ' + scenario.rejectAt +
        ' but observed ' + String(rejectedAt),
      )
    }
    if (scenario.rejectAt === null && acceptedCount !== scenario.order.length) {
      throw new Error(
        scenario.id + ' accepted only ' + acceptedCount +
        ' of ' + scenario.order.length + ' expected transitions',
      )
    }
    if (scenario.rejectAt !== null && acceptedCount !== scenario.rejectAt) {
      throw new Error(
        scenario.id + ' accepted ' + acceptedCount +
        ' transitions before the expected rejection; expected ' + scenario.rejectAt,
      )
    }
    scenarioResults.push({
      scenarioId: scenario.id,
      liquidityUsdmSubunits: scenario.liquidity.toString(),
      faceReserveUsdmSubunits: faceTotal.toString(),
      initialTicketCount: tickets.length,
      revealOrder: scenario.order,
      acceptedCount,
      rejectedAt,
      expectedDisposition: scenario.rejectAt === null
        ? 'all-sequential-reveals-accepted'
        : 'final-expected-reveal-rejected-by-ledger',
      finalPoolState: {
        totalLiquidity: scenario.liquidity.toString(),
        pendingLiabilities: currentLiabilities.toString(),
        unresolvedReserve: currentReserve.toString(),
        unresolvedTicketCount: currentCount.toString(),
      },
      bootstrapTransaction: {
        transactionRef: bootstrapHash,
        cborBytes: bootstrapBytes,
      },
      poolScript: {
        hash: poolScriptHash,
        scriptBytes: Buffer.from(poolScript.script, 'hex').length,
        referenceTransaction: poolReference.hash,
        referenceCborBytes: poolReference.bytes,
        referenceOutRef: ref(poolReference.utxo),
      },
      prizeReference: {
        transactionRef: prizeReference.hash,
        cborBytes: prizeReference.bytes,
        outRef: ref(prizeReference.utxo),
      },
      poolNftUnit: poolUnit,
    })
  }

  if (scenarioResults.length !== scenarios.length) {
    throw new Error('Sequential Reveal queue did not produce a complete scenario result set')
  }
  const summary = {
    schema: 'IMMORTAL-REVEAL-QUEUE-HEADROOM-YACI-V1',
    evidenceClass: 'local-yaci-ledger-characterization',
    testedCommit: process.env.GITHUB_SHA ?? 'unknown',
    plutusPair: {
      prize: 'isolated Aiken Plutus V3 candidate',
      pool: 'canonical parameterized B1PrizePool Plutus V2',
      prizeHash: scripts.prizeHash,
    },
    network: 'ephemeral-local-yaci-conway',
    testLiquidityAssetUnit: liquidityUnit,
    testLiquidityAssetValuation: '1:1 synthetic fixture units; NOT production USDM qualification',
    productionUsdmQualified: false,
    maxTxSize,
    subunitsPerUsdm: 100,
    feeFundingNote: 'ADA fees/change are funded only by wallet-key inputs; both Prize and B1 Pool physical Values are preserved exactly.',
    transactionEvidenceFile: 'audit/yaci-evidence/reveal-queue-transactions.jsonl',
    requiredCases: [
      '8x1-USDM exact 4000-USDM WCE: seven maximum Reveals accepted, eighth rejected',
      '8x1-USDM plus 1-USDM headroom: all eight maximum Reveals accepted',
      '1/100-USDM exact WCE: both Reveal orders reject final maximum payout',
      '1/100-USDM plus 100-USDM headroom: both Reveal orders complete',
      'six maximum wins, canonical LOSS, final maximum win at exact WCE: all complete',
    ],
    scenarios: scenarioResults,
    allAssertionsPassed: true,
    governance: {
      affordabilityPredicateChanged: false,
      v1FiveHundredXCapChanged: false,
      wceChanged: false,
      datumRedeemerAbiChanged: false,
      v3CarrierChanged: false,
      deploymentOrOnChainStateChanged: false,
    },
  }
  writeFileSync(
    'audit/yaci-evidence/reveal-queue-characterization.json',
    JSON.stringify(summary, jsonReplacer, 2) + '\n',
  )
  console.log(JSON.stringify({
    revealQueueDiag: 'sequential-aiken-v3-b1-v2-characterization-complete',
    scenarioCount: scenarioResults.length,
    acceptedTransitions: scenarioResults.reduce((sum, item) => sum + item.acceptedCount, 0),
    expectedLedgerRejections: scenarioResults.filter((item) => item.rejectedAt !== null).length,
    evidence: 'audit/yaci-evidence/reveal-queue-characterization.json',
    transactions: 'audit/yaci-evidence/reveal-queue-transactions.jsonl',
    productionUsdmQualified: false,
  }, null, 2))
}

if (process.env.IMMORTAL_REVEAL_QUEUE_CHARACTERIZATION === '1') {
  await runSequentialRevealQueueCharacterization()
  process.exit(0)
}


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
