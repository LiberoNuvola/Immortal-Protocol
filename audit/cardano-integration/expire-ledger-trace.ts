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
  type Script,
  type UTxO,
} from 'lucid-cardano'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import { createCardanoExecutionAdapter } from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
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

function nativePolicy(lucid: any, keyHash: string): Script {
  return lucid.utils.nativeScriptFromJson({
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

const wallet = JSON.parse(
  readFileSync('/tmp/immortal-yaci-test-wallet.json', 'utf8'),
)

const lucid = await Lucid(
  new Blockfrost(API, ''),
  'Preprod',
)
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet.address()
const details = lucid.utils.getAddressDetails(address)
const keyHash = details.paymentCredential?.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = lucid.utils.mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

const scripts = buildScriptsFromLucid(
  lucid,
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

const now = BigInt(Date.now())
const issuedAt = now - 7_200_000n
const expiresAt = now - 3_600_000n

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
  .attachMintingPolicy(testPolicy)
  .payToContract(
    scripts.b1PrizePoolAddress,
    { inline: Data.to(prePoolDatum) },
    {
      lovelace: 5_000_000n,
      [poolUnit]: 1n,
      [liquidityUnit]: TOTAL_LIQUIDITY_USDM,
    },
  )
  .payToContract(
    scripts.prizeAddress,
    { inline: Data.to(prePrizeDatum) },
    { lovelace: 3_000_000n },
  )
  .payToAddress(address, { [ticketUnit]: 1n })
  .addSigner(address)
  .complete()

const bootstrapSigned = await bootstrap.sign().complete()
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

const expireTx = await lucid
  .newTx()
  .collectFrom([prizeUtxo], c(3))
  .attachSpendingValidator(scripts.prizeValidator as Script)
  .collectFrom([poolUtxo], c(4))
  .attachSpendingValidator(scripts.b1PrizePool as Script)
  .payToAddress(address, {
    lovelace: prizeUtxo.assets.lovelace ?? 0n,
  })
  .payToContract(
    scripts.b1PrizePoolAddress as string,
    { inline: Data.to(postPoolDatum) },
    poolUtxo.assets,
  )
  .addSigner(address)
  .validFrom(Number(expiresAt))
  .complete()

let signedExpire: any = null
const executionAdapter = createCardanoExecutionAdapter({
  signTx: async (tx: unknown) => {
    signedExpire = await lucid.signTx(tx as any)
    return signedExpire
  },
  submitTx: async (signedTx: unknown) => lucid.submitTx(signedTx as any),
})
const submission = await executionAdapter.submit(expireTx)
const txHash = submission.transactionRef
if (!signedExpire) throw new Error('Adapter did not retain signed EXPIRE for replay evidence')
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

let replayRejected = false
let replayError = ''
try {
  await lucid.submitTx(signedExpire)
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
    canonicalEvidence: evidence,
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
