/**
 * RT-1.5 — real Yaci FundTreasury / canonical Oracle valuation trace.
 *
 * This trace is intentionally separate from Reveal:
 * B1 FundTreasury is the validator path that invokes Economic.poolUsdmValue.
 *
 * Evidence target:
 *   Pool input
 *     + authenticated Oracle reference input
 *     -> FundTreasury
 *     -> continuing Pool output whose ppTotalLiquidity equals the
 *        validator's canonical Economic.poolUsdmValue of that output.
 *
 * The pool is ADA-only (apart from the singleton NFT) so one Oracle State
 * reference UTxO is sufficient: it prices ADA and the pool singleton is
 * removed before valuation.
 *
 * This is real local-Yaci ledger evidence, not a pure TypeScript mirror.
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
import { readFileSync, writeFileSync } from 'node:fs'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import { assertExecutableLiquidityMatchesAuthenticatedPool, type ExecutableLiquidityObservation } from '../../Adapter/CARDANO/observation/ExecutableLiquidityObservation'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test sauce'

const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45' // ORACLE
const POOL_TOKEN_NAME_HEX = '504f4f4c' // POOL
const ADA_PRICE_USDM_SUBUNITS = 80n
const MIN_UTXO_LOVELACE = 1_600_000n
const INITIAL_POOL_LOVELACE = 5_000_000n
const FUNDED_POOL_LOVELACE = 7_000_000n

function c(index: number, fields: any[] = []): any {
  return new Constr(index, fields)
}

function ref(u: UTxO): string {
  return u.txHash + '#' + u.outputIndex
}

function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
    .digest('hex')
}

function nativePolicy(keyHash: string): Script {
  return scriptFromNative({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  } as any)
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

function expectedAdaUsdmValue(lovelace: bigint): bigint {
  const economicAda = lovelace > MIN_UTXO_LOVELACE
    ? lovelace - MIN_UTXO_LOVELACE
    : 0n
  return (economicAda * ADA_PRICE_USDM_SUBUNITS + 1_000_000n - 1n) / 1_000_000n
}

const wallet = JSON.parse(
  readFileSync('/tmp/immortal-yaci-test-wallet.json', 'utf8'),
)
const provider = new Blockfrost(API, '')

type EvaluationUTxO = {
  txHash: string
  outputIndex: number
  address: string
  assets: Record<string, bigint>
  datumHash?: string
  datum?: string
  scriptRef?: { type: string; script: string }
}
type EvaluationRedeemer = {
  redeemer_tag: string
  redeemer_index: number
  ex_units: { mem: number; steps: number }
}

let fundTreasuryEvaluationEvidence: {
  measured: EvaluationRedeemer[]
  budgeted: EvaluationRedeemer[]
  safetyMarginBps: number
} | null = null

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
  additionalUTxOs: EvaluationUTxO[] = [],
): Promise<EvaluationRedeemer[]> => {
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

  return Object.entries(result.result.EvaluationResult).map(([pointer, data]) => {
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
  console.log('[FT-DIAG] provider.evaluateTx override invoked')
  const measured = await evaluateYaciTx(tx, additionalUTxOs)
  const budgeted = measured.map((redeemer) => ({
    ...redeemer,
    ex_units: {
      mem: withExUnitsSafetyMargin(redeemer.ex_units.mem),
      steps: withExUnitsSafetyMargin(redeemer.ex_units.steps),
    },
  }))

  if (
    budgeted.length !== 1 ||
    budgeted[0].redeemer_tag !== 'spend' ||
    budgeted[0].redeemer_index !== 0
  ) {
    throw new Error(
      'FundTreasury expected exactly one spending redeemer at index 0; got ' +
      JSON.stringify(budgeted),
    )
  }

  fundTreasuryEvaluationEvidence = {
    measured,
    budgeted,
    safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
  }
  console.log(JSON.stringify({
    fundTreasuryDiag: 'yaci-evaluate',
    measured,
    budgeted,
    safetyMarginBps: EX_UNITS_SAFETY_MARGIN_BPS,
  }))
  return budgeted
}

// Preprod's time/slot mapping does not match this local Yaci devnet.
// Anchor Lucid's validity interval to the devnet's latest block instead.
const DEVNET_SLOT_LENGTH_MS = 1000
const FUND_TREASURY_VALIDITY_WINDOW_MS = 30_000
const latestBlock = await (await fetch(API + '/blocks/latest')).json() as {
  slot: number
  time: number
}
if (!Number.isSafeInteger(latestBlock.slot) || latestBlock.slot < 0 ||
    !Number.isSafeInteger(latestBlock.time) || latestBlock.time <= 0) {
  throw new Error('Yaci /blocks/latest lacks slot/time: ' + JSON.stringify(latestBlock))
}
// Yaci Store deployments may expose block time in seconds or milliseconds.
// Normalize once, then use this same chain-derived anchor for slot mapping,
// Oracle timestamp and transaction validity; do not mix it with wall-clock time.
const latestBlockTimeMs = latestBlock.time < 100_000_000_000
  ? latestBlock.time * 1000
  : latestBlock.time
if (!Number.isSafeInteger(latestBlockTimeMs) || latestBlockTimeMs <= 0) {
  throw new Error('Yaci /blocks/latest has an invalid normalized time: ' + JSON.stringify(latestBlock))
}
const devnetSlotConfig = {
  zeroTime: latestBlockTimeMs,
  zeroSlot: latestBlock.slot,
  slotLength: DEVNET_SLOT_LENGTH_MS,
}
const now = BigInt(latestBlockTimeMs)
console.log(JSON.stringify({
  fundTreasuryTimeAnchor: 'yaci-latest-block',
  latestBlockSlot: latestBlock.slot,
  latestBlockTimeRaw: latestBlock.time,
  latestBlockTimeMs,
  slotLengthMs: DEVNET_SLOT_LENGTH_MS,
  validityWindowMs: FUND_TREASURY_VALIDITY_WINDOW_MS,
}))
const lucid = await Lucid(providerWithEvaluation, 'Preprod', { slotConfig: devnetSlotConfig })
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()
const details = getAddressDetails(address)
const keyHash = details.paymentCredential && details.paymentCredential.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const oracleStateUnit = testPolicyId + ORACLE_STATE_TOKEN_NAME_HEX
const poolUnit = testPolicyId + POOL_TOKEN_NAME_HEX

const scripts = buildScriptsFromLucid(
  {
    ...lucid,
    utils: {
      validatorToScriptHash,
      mintingPolicyToId,
      validatorToAddress: (script: Script) => validatorToAddress('Preprod', script),
    },
  },
  undefined,
  keyHash,
  testPolicyId,
  ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId,
  POOL_TOKEN_NAME_HEX,
)

if (!scripts.b1PrizePoolAddress) {
  throw new Error('failed to derive B1PrizePool address')
}

// OracleDatum:
//   assetPolicy, assetName, price, timestamp, publisher
const oracleDatum = c(0, [
  '',
  '',
  ADA_PRICE_USDM_SUBUNITS,
  now,
  keyHash,
])

// B1PrizePoolDatum:
//   totalLiquidity, pendingLiabilities, unresolvedReserve,
//   unresolvedTicketCount, lockedJackpot, jackpotThreshold,
//   suspendedClasses, prizeHash
const preLiquidity = expectedAdaUsdmValue(INITIAL_POOL_LOVELACE)
const postLiquidity = expectedAdaUsdmValue(FUNDED_POOL_LOVELACE)

const prePoolDatum = c(0, [
  preLiquidity,
  0n,
  0n,
  0n,
  0n,
  10_000n,
  0n,
  scripts.prizeHash,
])

const postPoolDatum = c(0, [
  postLiquidity,
  0n,
  0n,
  0n,
  0n,
  10_000n,
  0n,
  scripts.prizeHash,
])

// Bootstrap both authenticated reference state and the Pool state.
const bootstrapBuilder = lucid
  .newTx()
  .mintAssets(
    {
      [oracleStateUnit]: 1n,
      [poolUnit]: 1n,
    },
    Data.void(),
  )
  .attach.MintingPolicy(testPolicy)
  .pay.ToContract(
    scripts.b1PrizePoolAddress,
    { kind: 'inline', value: Data.to(prePoolDatum) },
    {
      lovelace: INITIAL_POOL_LOVELACE,
      [poolUnit]: 1n,
    },
  )
  .pay.ToAddressWithData(
    address,
    { kind: 'inline', value: Data.to(oracleDatum) },
    {
      lovelace: 2_000_000n,
      [oracleStateUnit]: 1n,
    },
  )
  .addSigner(address)

console.log('[FT-DIAG] before bootstrap .complete(localUPLCEval=false)')
const bootstrap = await bootstrapBuilder.complete({ localUPLCEval: false })
console.log('[FT-DIAG] after bootstrap .complete')

const bootstrapSigned = await bootstrap.sign.withWallet().complete({ localUPLCEval: false })
console.log('[FT-DIAG] before bootstrap submit')
const bootstrapHash = await bootstrapSigned.submit()
console.log('[FT-DIAG] bootstrap submit returned hash=' + bootstrapHash)
await lucid.awaitTx(bootstrapHash)
console.log('[FT-DIAG] bootstrap awaitTx complete')

const poolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.assets[poolUnit] === 1n),
  'bootstrapped B1PrizePool UTxO',
)
const poolInput = poolUtxos.find((u) => u.assets[poolUnit] === 1n) as UTxO

const oracleUtxos = await waitFor(
  () => lucid.utxosAt(address),
  (xs) => xs.some((u) => u.assets[oracleStateUnit] === 1n),
  'bootstrapped Oracle State UTxO',
)
const oracleRef = oracleUtxos.find((u) => u.assets[oracleStateUnit] === 1n) as UTxO

if (poolInput.assets.lovelace !== INITIAL_POOL_LOVELACE) {
  throw new Error('unexpected initial Pool lovelace')
}

if (preLiquidity !== 272n || postLiquidity !== 432n) {
  throw new Error('unexpected canonical ADA valuation fixture')
}

// Economic liquidity observation is bound to the exact Pool state consumed by
// the FundTreasury transition. The amount is the authenticated datum/value
// pair used by the validator, not a second economic rule.
const poolRef = ref(poolInput)
const executableLiquidityObservation: ExecutableLiquidityObservation = {
  observationReference: 'RT-1.5-FUND-TREASURY-YACI-' + poolRef,
  observedAt: now,
  sourceInputReferences: [poolRef],
  utxos: [{
    txHash: poolInput.txHash,
    index: poolInput.outputIndex,
    usdmValue: preLiquidity,
    spendable: true,
    ringFenced: false,
  }],
  declaredUsdmLiquidity: preLiquidity,
}
assertExecutableLiquidityMatchesAuthenticatedPool(
  executableLiquidityObservation,
  poolRef,
  preLiquidity,
)

// Use the same explicit Yaci evaluation path as the validated Reveal trace.
// The raw evaluation is retained and a 1% engineering margin is applied only
// to the transaction-building budget; ledger submission remains authoritative.
console.log('[FT-DIAG] before FundTreasury .complete(localUPLCEval=false)')
const fund = await lucid
  .newTx()
  .collectFrom([poolInput], Data.to(c(0)))
  .attach.SpendingValidator(scripts.b1PrizePool as Script)
  .readFrom([oracleRef])
  .pay.ToContract(
    scripts.b1PrizePoolAddress as string,
    { kind: 'inline', value: Data.to(postPoolDatum) },
    {
      lovelace: FUNDED_POOL_LOVELACE,
      [poolUnit]: 1n,
    },
  )
  .addSigner(address)
  .validFrom(Number(now))
  .validTo(Number(now + BigInt(FUND_TREASURY_VALIDITY_WINDOW_MS)))
  // Use the bounded construction budget above; only ledger submission and
  // the observed post-state below determine whether FundTreasury succeeds.
  .complete({ localUPLCEval: false })
console.log('[FT-DIAG] after FundTreasury .complete')

const signed = await fund.sign.withWallet().complete({ localUPLCEval: false })
const txCbor = signed.toCBOR()
console.log('[FT-DIAG] before FundTreasury submit')
const txHash = await signed.submit()
console.log('[FT-DIAG] FundTreasury submit returned hash=' + txHash)
await lucid.awaitTx(txHash)
console.log('[FT-DIAG] FundTreasury awaitTx complete')

let duplicateSubmissionRejected = false
let duplicateSubmissionError = ''
try {
  await signed.submit()
} catch (error) {
  duplicateSubmissionRejected = true
  duplicateSubmissionError =
    error instanceof Error ? error.message : String(error)
}

if (!duplicateSubmissionRejected) {
  throw new Error(
    'FundTreasury duplicate signed transaction was accepted; expected consumed-input rejection',
  )
}

const postPoolUtxos = await waitFor(
  () => lucid.utxosAt(scripts.b1PrizePoolAddress as string),
  (xs) => xs.some((u) => u.txHash === txHash && u.assets[poolUnit] === 1n),
  'FundTreasury continuing Pool UTxO',
)
const postPool = postPoolUtxos.find(
  (u) => u.txHash === txHash && u.assets[poolUnit] === 1n,
) as UTxO

if (postPool.assets.lovelace !== FUNDED_POOL_LOVELACE) {
  throw new Error('unexpected funded Pool lovelace')
}

const postPoolRef = ref(postPool)
const expectedPre = expectedAdaUsdmValue(INITIAL_POOL_LOVELACE)
const expectedPost = expectedAdaUsdmValue(FUNDED_POOL_LOVELACE)

if (expectedPre !== preLiquidity || expectedPost !== postLiquidity) {
  throw new Error('independent expected valuation mismatch')
}

const txResponse = await fetch(API + '/txs/' + txHash + '/utxos')
if (!txResponse.ok) {
  throw new Error('Yaci tx/utxos query failed: ' + txResponse.status)
}
const txUtxos = await txResponse.json()

const evidence = {
  purpose: 'RT-1.5 real-local-cardano-fund-treasury-oracle-valuation',
  bootstrapHash,
  transactionRef: txHash,
  txCbor,
  action: 'FundTreasury',
  transactionBuildBudget: {
    source: 'Yaci evaluation result with 100 bps safety margin; not a ledger cost measurement',
    evaluationEndpoint: API + '/utils/txs/evaluate/utxos',
    redeemerTag: 'spend',
    redeemerIndex: 0,
    yaciMeasuredExUnits: fundTreasuryEvaluationEvidence?.measured ?? null,
    yaciBudgetedExUnits: fundTreasuryEvaluationEvidence?.budgeted ?? null,
    safetyMarginBps: fundTreasuryEvaluationEvidence?.safetyMarginBps ?? null,
    ledgerValidationAuthoritative: true,
  },
  preState: {
    poolRef,
    poolLovelace: INITIAL_POOL_LOVELACE.toString(),
    datumLiquidityUsdmSubunits: preLiquidity.toString(),
  },
  oracleReference: {
    ref: ref(oracleRef),
    stateUnit: oracleStateUnit,
    publisherPkh: keyHash,
    assetPolicy: 'ADA',
    assetNameHex: '',
    priceUsdmSubunitsPerLovelace: ADA_PRICE_USDM_SUBUNITS.toString(),
    timestamp: now.toString(),
  },
  postState: {
    poolRef: postPoolRef,
    poolLovelace: FUNDED_POOL_LOVELACE.toString(),
    datumLiquidityUsdmSubunits: postLiquidity.toString(),
  },
  canonicalValuation: {
    formulaSemantics: 'Economic.poolUsdmValue -> totalUsdmValue -> ADA amount excludes minUtxoLovelace -> ceilingDiv(price)',
    minUtxoLovelace: MIN_UTXO_LOVELACE.toString(),
    expectedPreUsdmSubunits: expectedPre.toString(),
    expectedPostUsdmSubunits: expectedPost.toString(),
    validatorAcceptedDatumEquality: true,
  },
  executableLiquidityCorrelation: {
    observationReference: executableLiquidityObservation.observationReference,
    sourceSetExact: true,
    poolInputReference: poolRef,
    observedPoolUsdmValue: preLiquidity.toString(),
    authenticatedPoolValueMatchesObservation: true,
  },
  duplicateSubmission: {
    attempted: true,
    rejected: duplicateSubmissionRejected,
    error: duplicateSubmissionError,
  },
  producedUtxos: [postPoolRef],
  yaciTransactionUtxos: txUtxos,
  evidenceFingerprint: hashJson({
    bootstrapHash,
    txHash,
    poolRef,
    oracleRef: ref(oracleRef),
    postPoolRef,
    preLiquidity,
    postLiquidity,
  }),
}

writeFileSync(
  'audit/yaci-evidence/fund-treasury-oracle-valuation.json',
  JSON.stringify(evidence, null, 2),
)

console.log(JSON.stringify({
  transactionRef: txHash,
  bootstrapHash,
  poolInput: poolRef,
  oracleReference: ref(oracleRef),
  postPool: postPoolRef,
  preLiquidity: preLiquidity.toString(),
  postLiquidity: postLiquidity.toString(),
}, null, 2))
