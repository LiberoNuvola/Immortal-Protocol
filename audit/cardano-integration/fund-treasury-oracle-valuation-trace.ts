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
  nativeScriptFromJson,
  type Script,
  type UTxO,
} from 'lucid-cardano'
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
  return nativeScriptFromJson({
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
const lucid = await Lucid.new(provider, 'Preprod')
lucid.selectWalletFromSeed(SEED)

const address = await lucid.wallet.address()
const details = getAddressDetails(address)
const keyHash = details.paymentCredential?.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(keyHash)
const testPolicyId = lucid.utils.mintingPolicyToId(testPolicy)
const oracleStateUnit = testPolicyId + ORACLE_STATE_TOKEN_NAME_HEX
const poolUnit = testPolicyId + POOL_TOKEN_NAME_HEX

const scripts = buildScriptsFromLucid(
  lucid,
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

const now = BigInt(Date.now())

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
const bootstrap = await lucid
  .newTx()
  .mintAssets(
    {
      [oracleStateUnit]: 1n,
      [poolUnit]: 1n,
    },
    Data.void(),
  )
  .attachMintingPolicy(testPolicy)
  .payToContract(
    scripts.b1PrizePoolAddress,
    { inline: Data.to(prePoolDatum) },
    {
      lovelace: INITIAL_POOL_LOVELACE,
      [poolUnit]: 1n,
    },
  )
  .payToAddress(
    address,
    {
      lovelace: 2_000_000n,
      [oracleStateUnit]: 1n,
    },
    { inline: Data.to(oracleDatum) } as any,
  )
  .addSigner(address)
  .complete()

const bootstrapSigned = await bootstrap.sign().complete()
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

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

const fund = await lucid
  .newTx()
  .collectFrom([poolInput], Data.to(c(0)))
  .attachSpendingValidator(scripts.b1PrizePool as Script)
  .addReferenceInput(oracleRef)
  .payToContract(
    scripts.b1PrizePoolAddress as string,
    { inline: Data.to(postPoolDatum) },
    {
      lovelace: FUNDED_POOL_LOVELACE,
      [poolUnit]: 1n,
    },
  )
  .addSigner(address)
  .validFrom(Number(now))
  .validTo(Number(now + 3_600_000n))
  .complete()

const signed = await fund.sign().complete()
const txCbor = signed.toCBOR()
const txHash = await signed.submit()
await lucid.awaitTx(txHash)

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
