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

import { Constr, Data, Lucid, Blockfrost, getAddressDetails, nativeScriptFromJson, type Script, type UTxO } from 'lucid-cardano'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import { buildScriptsFromLucid } from '../../src/loadValidator'
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
  assertCanonicalTransitionBinding,
  type CanonicalTransitionEvidence,
} from '../../Adapter/CARDANO/observation/CanonicalTransitionEvidence'

const API = 'http://127.0.0.1:8080/api/v1'
const SEED =
  'test test test test test test test test test test test test test test test test test test test test test test test sauce'

const PRICE_USDM = 100n
const TOTAL_LIQUIDITY_USDM = 100_000n
const TICKET_NAME_HEX = '52462d5245414c2d52455645414c'
const ORACLE_STATE_POLICY_ID = '00'.repeat(28)
const ORACLE_STATE_TOKEN_NAME_HEX = ''
const MAINCHAIN_REF = new Uint8Array(32)
const MATERIOS_CONTEXT = new Uint8Array(32)
const GAME_VERSION = new TextEncoder().encode('V1')

type NativeScript = { type: 'sig'; keyHash: string } | {
  type: 'all'
  scripts: NativeScript[]
}

function nativePolicy(lucid: any, keyHash: string): Script {
  return nativeScriptFromJson({
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
const lucid = new Lucid(new Blockfrost(API, ''), 'Preprod')
lucid.selectWalletFromSeed(SEED)

const address = await lucid.wallet.address()
const details = getAddressDetails(address)
const keyHash = details.paymentCredential && details.paymentCredential.hash
if (!keyHash) throw new Error('test wallet has no payment key hash')

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = typeof lucid.utils.mintingPolicyToId === 'function' ? lucid.utils.mintingPolicyToId(testPolicy) : lucid.utils.validatorToScriptHash(testPolicy)
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
    {
      lovelace: 3_000_000n,
      [ticketUnit]: 1n,
    },
  )
  .addSigner(address)
  .complete()

const bootstrapSigned = await bootstrap.sign().complete()
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

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo),
  prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo),
  poolDatum: poolUtxo.datum,
})

const reveal = await lucid
  .newTx()
  .collectFrom([prizeUtxo], c(1, [toHex(playerSecret)]))
  .attachSpendingValidator(scripts.prizeValidator as Script)
  .collectFrom([poolUtxo], c(2, [PRICE_USDM]))
  .attachSpendingValidator(scripts.b1PrizePool as Script)
  .payToContract(
    scripts.prizeAddress as string,
    { inline: Data.to(postPrizeDatum) },
    prizeUtxo.assets,
  )
  .payToContract(
    scripts.b1PrizePoolAddress as string,
    { inline: Data.to(postPoolDatum) },
    poolUtxo.assets,
  )
  .addSigner(address)
  .validTo(Number(expiresAt))
  .complete()

let signedReveal: any = null
const executionAdapter = createCardanoExecutionAdapter({
  signTx: async (tx: unknown) => {
    signedReveal = await lucid.signTx(tx as any)
    return signedReveal
  },
  submitTx: async (signedTx: unknown) => lucid.submitTx(signedTx as any),
})
const submission = await executionAdapter.submit(reveal)
const txHash = submission.transactionRef
if (!signedReveal) throw new Error('Adapter did not retain the signed Reveal for replay evidence')
const txCbor = signedReveal.toCBOR()
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

const evidence: CanonicalTransitionEvidence = {
  evidenceId: hashJson({
    fixtureId: 'RF10-RF11-YACI-REVEAL-001',
    actionFingerprint,
    preStateFingerprint,
    postStateFingerprint,
    transactionRef: txHash,
  }),
  fixtureId: 'RF10-RF11-YACI-REVEAL-001',
  actionClass: 'REVEAL',
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

assertCanonicalTransitionBinding(evidence, {
  actionFingerprint,
  preStateFingerprint,
  postStateFingerprint,
  transactionRef: txHash,
})

let replayRejected = false
let replayError = ''
try {
  await lucid.submitTx(signedReveal)
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
    canonicalEvidence: evidence,
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
