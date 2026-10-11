/**
 * Real Yaci/Cardano EXPIRE realization trace.
 *
 * C3 target:
 *   expired Pending PrizeDatum + B1PrizePool
 *     -> atomic EXPIRE
 *     -> PrizeDatum consumed (no continuing PrizeValidator output)
 *     -> pool reserve/count released exactly once
 *     -> ticket NFT remains independently held by its owner
 *
 * This is conformance evidence, not new economic policy.
 */

import {
  Constr,
  Data,
  Lucid,
  Blockfrost,
  getAddressDetails,
  scriptFromNative,
  mintingPolicyToId,
  validatorToScriptHash,
  validatorToAddress,
  type Script,
  type UTxO,
} from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import {
  assertCanonicalTransitionBinding,
  type CanonicalTransitionEvidence,
} from '../../Adapter/CARDANO/observation/CanonicalTransitionEvidence'
import { defaultPrizeTable } from '../../src/gameRules'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test test test sauce'

const PRICE_USDM = 100n
const TOTAL_LIQUIDITY_USDM = 100_000n
const TICKET_NAME_HEX = '52462d5245414c2d455850495245'
const ORACLE_STATE_POLICY_ID = '00'.repeat(28)
const ORACLE_STATE_TOKEN_NAME_HEX = ''
const MAINCHAIN_REF = new Uint8Array(32)
const GAME_VERSION = new TextEncoder().encode('V1')

function c(index: number, fields: any[] = []): any {
  return new Constr(index, fields)
}

function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
    .digest('hex')
}

function ref(u: UTxO): string {
  return u.txHash + '#' + u.outputIndex
}

function nativePolicy(keyHash: string): Script {
  return scriptFromNative({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  } as any)
}

function datumFields(utxo: UTxO): any[] {
  const raw = utxo.datum
  if (!raw) throw new Error('UTxO datum missing')
  const parsed = Data.from(raw) as any
  if (!parsed || !Array.isArray(parsed.fields)) {
    throw new Error('UTxO datum fields unavailable')
  }
  return parsed.fields
}

function bigintField(fields: any[], index: number): bigint {
  const value = fields[index]
  const candidate =
    typeof value === 'bigint'
      ? value
      : value && typeof value === 'object' && value.int !== undefined
        ? BigInt(value.int)
        : null
  if (candidate === null) throw new Error('datum integer field missing: ' + index)
  return candidate
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

function poolDatum(
  prizeHash: string,
  liquidity: bigint,
  reserve: bigint,
  count: bigint,
  liabilities: bigint,
): any {
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

function prizeDatum(
  ticketPolicyId: string,
  prizePoolHash: string,
  issuedAt: bigint,
  expiresAt: bigint,
): any {
  return c(0, [
    ticketPolicyId,
    TICKET_NAME_HEX,
    '22'.repeat(32),
    PRICE_USDM,
    '33'.repeat(32),
    '5641',
    1n,
    0n,
    '',
    '',
    c(0),
    '',
    0n,
    c(0, [0n, 0n, '00'.repeat(32), '5641']),
    c(0),
    '',
    '44'.repeat(32),
    '55'.repeat(32),
    prizePoolHash,
    issuedAt,
    expiresAt,
    0n,
    0n,
  ])
}

const provider = new Blockfrost(API, '')

type EvaluationUTxO = {
  txHash: string
  outputIndex: number
  address: string
  assets: Record<string, bigint>
  datumHash?: string | null
  datum?: string | null
  scriptRef?: { type: string; script: string } | null
}
type EvaluationRedeemer = {
  redeemer_tag: string
  redeemer_index: number
  ex_units: { mem: number; steps: number }
}
type YaciEvaluationResponse = {
  fault?: unknown
  result?: { EvaluationResult?: Record<string, { memory: number; steps: number }> }
  message?: string
}

const latestBlock = await (await fetch(API + '/blocks/latest')).json() as {
  slot: number
  time: number
}
if (
  !Number.isSafeInteger(latestBlock.slot) ||
  latestBlock.slot < 0 ||
  !Number.isSafeInteger(latestBlock.time) ||
  latestBlock.time <= 0
) {
  throw new Error('Yaci /blocks/latest lacks slot/time: ' + JSON.stringify(latestBlock))
}
const latestBlockTimeMs = latestBlock.time < 100_000_000_000
  ? latestBlock.time * 1000
  : latestBlock.time
if (!Number.isSafeInteger(latestBlockTimeMs) || latestBlockTimeMs <= 0) {
  throw new Error('Yaci /blocks/latest has invalid normalized time: ' + JSON.stringify(latestBlock))
}
const devnetSlotConfig = {
  zeroTime: latestBlockTimeMs,
  zeroSlot: latestBlock.slot,
  slotLength: 1000,
}
console.log(JSON.stringify({
  expireTimeAnchor: 'yaci-latest-block',
  latestBlockSlot: latestBlock.slot,
  latestBlockTimeRaw: latestBlock.time,
  latestBlockTimeMs,
  slotLengthMs: 1000,
}))

const EX_UNITS_SAFETY_MARGIN_BPS = 100
const EX_UNITS_DENOMINATOR = 10_000n
let expireEvaluationEvidence: {
  measured: EvaluationRedeemer[]
  budgeted: EvaluationRedeemer[]
  safetyMarginBps: number
} | null = null

function withExUnitsSafetyMargin(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Yaci returned invalid execution units: ' + String(value))
  }
  return Number(
    (BigInt(value) * (EX_UNITS_DENOMINATOR + BigInt(EX_UNITS_SAFETY_MARGIN_BPS))
      + EX_UNITS_DENOMINATOR - 1n) / EX_UNITS_DENOMINATOR,
  )
}

async function evaluateYaciTx(
  tx: string,
  additionalUTxOs: EvaluationUTxO[] = [],
): Promise<EvaluationRedeemer[]> {
  const cbor = tx.startsWith('0x') ? tx.slice(2) : tx
  if (!/^[0-9a-fA-F]+$/.test(cbor) || cbor.length % 2 !== 0) {
    throw new Error('Yaci received invalid transaction CBOR: ' + cbor.slice(0, 80))
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
  const raw = await response.text()
  let parsed: YaciEvaluationResponse
  try {
    parsed = JSON.parse(raw) as YaciEvaluationResponse
  } catch {
    parsed = { message: raw }
  }
  if (!response.ok || parsed.fault || !parsed.result?.EvaluationResult) {
    throw new Error(
      `Yaci EXPIRE evaluation failed (HTTP ${response.status}): ${raw.slice(0, 3500)}`,
    )
  }
  return Object.entries(parsed.result.EvaluationResult).map(([pointer, data]) => {
    const [redeemer_tag, redeemer_index] = pointer.split(':')
    return {
      redeemer_tag,
      redeemer_index: Number(redeemer_index),
      ex_units: { mem: Number(data.memory), steps: Number(data.steps) },
    }
  })
}

const providerWithEvaluation = provider as Blockfrost & {
  evaluateTx: (tx: string, additionalUTxOs?: EvaluationUTxO[]) => Promise<EvaluationRedeemer[]>
}
providerWithEvaluation.evaluateTx = async (tx, additionalUTxOs = []) => {
  const measured = await evaluateYaciTx(tx, additionalUTxOs)
  const budgeted = measured.map((redeemer) => ({
    ...redeemer,
    ex_units: {
      mem: withExUnitsSafetyMargin(redeemer.ex_units.mem),
      steps: withExUnitsSafetyMargin(redeemer.ex_units.steps),
    },
  }))
  if (budgeted.length > 0) {
    const pointers = budgeted.map((x) => `${x.redeemer_tag}:${x.redeemer_index}`).sort()
    if (
      budgeted.length !== 2 ||
      budgeted.some((x) => x.redeemer_tag !== 'spend') ||
      pointers.join(',') !== 'spend:0,spend:1'
    ) {
      throw new Error('EXPIRE expected two spending redeemers (spend:0, spend:1); got ' + JSON.stringify(budgeted))
    }
  }
  expireEvaluationEvidence = {
    measured,
    budgeted,
    safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
  }
  console.log(JSON.stringify({
    expireDiag: 'yaci-evaluate',
    measured,
    budgeted,
    safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
  }))
  return budgeted
}

const lucid = await Lucid(providerWithEvaluation, 'Preprod', {
  slotConfig: devnetSlotConfig,
})
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()
const details = getAddressDetails(address)
const keyHash = details.paymentCredential?.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

const scripts = buildScriptsFromLucid(
  {
    ...lucid,
    utils: {
      validatorToScriptHash,
      mintingPolicyToId,
      validatorToAddress: (script: Script) => validatorToAddress('Preprod', script),
    },
  },
  defaultPrizeTable,
  keyHash,
  ORACLE_STATE_POLICY_ID,
  ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId,
  poolTokenNameHex,
)

if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) {
  throw new Error('failed to derive Prize/B1PrizePool addresses')
}

// EXPIRE evaluates pdExpiresAt against the transaction validity range; it
// does not establish the DApp/profile expiry horizon. Keep this fixture focused
// on the EXPIRE transition and align its expiry marker with recent Yaci time so
// the validity lower bound remains inside the node's available era-history.
const expiresAt = BigInt(latestBlockTimeMs) - 10_000n
const issuedAt = 0n // placeholder for this synthetic pre-state, not issuance evidence

const prePrizeDatum = prizeDatum(
  testPolicyId,
  scripts.b1PrizePoolHash,
  issuedAt,
  expiresAt,
)

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
  0n,
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
    scripts.b1PrizePoolAddress as string,
    { kind: 'inline', value: Data.to(prePoolDatum) },
    {
      lovelace: 5_000_000n,
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
    },
  )
  .pay.ToContract(
    scripts.prizeAddress as string,
    { kind: 'inline', value: Data.to(prePrizeDatum) },
    { lovelace: 3_000_000n },
  )
  .pay.ToAddress(address, { lovelace: 2_000_000n, [ticketUnit]: 1n })
  .addSigner(address)
  .complete()

const bootstrapSigned = await bootstrap.sign.withWallet().complete()
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

const prizeUtxos = await waitFor(
  () => lucid.utxosAt(scripts.prizeAddress as string),
  (xs) => xs.some((u) => u.assets.lovelace === 3_000_000n),
  'bootstrapped expired Prize UTxO',
)
const poolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.assets[poolUnit] === 1n),
  'bootstrapped B1PrizePool UTxO',
)
const walletUtxos = await lucid.utxosAt(address)
if (!walletUtxos.some((u) => u.assets[ticketUnit] === 1n)) {
  throw new Error('ticket NFT was not delivered to the holder')
}

const prizeUtxo = prizeUtxos.find((u) => u.assets.lovelace === 3_000_000n) as UTxO
const poolUtxo = poolUtxos.find((u) => u.assets[poolUnit] === 1n) as UTxO

const nonLovelacePrizeAssets = Object.entries(prizeUtxo.assets).filter(
  ([unit, quantity]) => unit !== 'lovelace' && quantity !== 0n,
)
if (nonLovelacePrizeAssets.length > 0) {
  throw new Error('expired Prize UTxO unexpectedly carries non-ADA assets')
}

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo),
  prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo),
  poolDatum: poolUtxo.datum,
})

console.log(JSON.stringify({
  expireBuild: 'begin',
  prizeInput: ref(prizeUtxo),
  poolInput: ref(poolUtxo),
  expiresAt: expiresAt.toString(),
  latestBlockSlot: latestBlock.slot,
  latestBlockTimeMs,
}))
const expireTx = await lucid
  .newTx()
  .collectFrom([prizeUtxo], Data.to(c(3)))
  .attach.SpendingValidator(scripts.prizeValidator as Script)
  .collectFrom([poolUtxo], Data.to(c(4)))
  .attach.SpendingValidator(scripts.b1PrizePool as Script)
  .pay.ToAddress(address, {
    lovelace: prizeUtxo.assets.lovelace ?? 0n,
  })
  .pay.ToContract(
    scripts.b1PrizePoolAddress as string,
    { kind: 'inline', value: Data.to(postPoolDatum) },
    poolUtxo.assets,
  )
  .addSigner(address)
  .validFrom(Number(expiresAt + 1_000n))
  .complete({ localUPLCEval: false })

// This fixture qualifies the on-chain EXPIRE transition only. It does not
// claim an authoritative production Issue-admission witness or bypass that gate.
const signedExpire = await expireTx.sign.withWallet().complete()
const txHash = await signedExpire.submit()
const txCbor = signedExpire.toCBOR()
await lucid.awaitTx(txHash)

const postPoolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === txHash && u.assets[poolUnit] === 1n),
  'expired B1PrizePool UTxO',
)

const postPool = postPoolUtxos.find(
  (u) => u.txHash === txHash && u.assets[poolUnit] === 1n,
) as UTxO

const remainingPrizeOutputs = (await lucid.utxosAt(
  scripts.prizeAddress as string,
)).filter((u) => u.assets.lovelace === 3_000_000n)

if (remainingPrizeOutputs.length !== 0) {
  throw new Error('EXPIRE unexpectedly left a continuing Prize UTxO')
}

const postPoolFields = datumFields(postPool)
const postLiquidity = bigintField(postPoolFields, 0)
const postLiability = bigintField(postPoolFields, 1)
const postReserve = bigintField(postPoolFields, 2)
const postCount = bigintField(postPoolFields, 3)

if (postLiquidity !== TOTAL_LIQUIDITY_USDM) {
  throw new Error('EXPIRE changed total economic liquidity')
}
if (postLiability !== 0n) {
  throw new Error('EXPIRE created or preserved an unexpected liability')
}
if (postReserve !== 0n) {
  throw new Error('EXPIRE did not release the exact ticket reserve')
}
if (postCount !== 0n) {
  throw new Error('EXPIRE did not release exactly one unresolved ticket')
}

const walletAfter = await lucid.utxosAt(address)
const ticketQuantity = walletAfter.reduce(
  (sum, u) => sum + (u.assets[ticketUnit] ?? 0n),
  0n,
)
if (ticketQuantity !== 1n) {
  throw new Error('EXPIRE changed ticket NFT ownership/quantity')
}

const postStateFingerprint = hashJson({
  prizeRef: null,
  poolRef: ref(postPool),
  poolDatum: postPool.datum,
})

const actionFingerprint = hashJson({
  actionClass: 'EXPIRE',
  ticketInput: ref(prizeUtxo),
  poolInput: ref(poolUtxo),
  ticketPolicyId: testPolicyId,
  ticketNameHex: TICKET_NAME_HEX,
  priceUsdm: PRICE_USDM,
  expiresAt,
})

const evidence = {
  evidenceId: hashJson({
    fixtureId: 'C3-YACI-EXPIRE-001',
    actionFingerprint,
    preStateFingerprint,
    postStateFingerprint,
    transactionRef: txHash,
  }),
  fixtureId: 'C3-YACI-EXPIRE-001',
  actionClass: 'EXPIRE',
  protocolVersion: 'IMMORTAL-V3',
  profileVersion: 'PRE-RICH',
  adapterId: 'CARDANO-YACI',
  adapterVersion: 'yaci-devkit-0.12.0-beta5',
  environment: 'local-yaci-devnet',
  preStateFingerprint,
  postStateFingerprint,
  actionFingerprint,
  transactionRef: txHash,
}

const canonicalEvidence: CanonicalTransitionEvidence = evidence
assertCanonicalTransitionBinding(canonicalEvidence, {
  actionFingerprint,
  preStateFingerprint,
  postStateFingerprint,
  transactionRef: txHash,
})

let replayRejected = false
let replayError = ''
try {
  await signedExpire.submit()
} catch (error) {
  replayRejected = true
  replayError = error instanceof Error ? error.message : String(error)
}
if (!replayRejected) {
  throw new Error('stale/duplicate EXPIRE submission was unexpectedly accepted')
}

writeFileSync(
  'audit/yaci-evidence/expire-transition.json',
  JSON.stringify({
    purpose: 'real-local-cardano-economic-expire',
    bootstrapHash,
    transactionRef: txHash,
    txCbor,
    action: {
      actionClass: 'EXPIRE',
      priceUsdm: PRICE_USDM.toString(),
      expiresAt: expiresAt.toString(),
    },
    preState: {
      prizeRef: ref(prizeUtxo),
      poolRef: ref(poolUtxo),
      fingerprint: preStateFingerprint,
    },
    postState: {
      prizeRef: null,
      poolRef: ref(postPool),
      fingerprint: postStateFingerprint,
    },
    accounting: {
      totalLiquidity: postLiquidity.toString(),
      pendingLiabilities: postLiability.toString(),
      unresolvedReserve: postReserve.toString(),
      unresolvedTicketCount: postCount.toString(),
      ticketNftQuantity: ticketQuantity.toString(),
    },
    consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
    producedUtxos: [ref(postPool)],
    canonicalEvidence,
    yaciEvaluation: expireEvaluationEvidence,
    timeAnchor: {
      source: 'Yaci latest block',
      slot: latestBlock.slot,
      timeRaw: latestBlock.time,
      timeMs: latestBlockTimeMs,
      slotLengthMs: 1000,
      expiresAt: expiresAt.toString(),
      validFrom: (expiresAt + 1_000n).toString(),
      issuedAt: issuedAt.toString(),
    },
    replay: {
      rejected: replayRejected,
      error: replayError,
    },
  }, null, 2),
)

console.log(JSON.stringify({
  transactionRef: txHash,
  bootstrapHash,
  consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
  producedUtxos: [ref(postPool)],
  ticketNftQuantity: ticketQuantity.toString(),
  replayRejected,
}, null, 2))
