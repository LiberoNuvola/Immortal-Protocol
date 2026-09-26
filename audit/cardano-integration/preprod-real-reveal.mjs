import { Constr, Data, Lucid, Koios } from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

import { buildScriptsFromLucid } from '../../src/loadValidator'
import { defaultPrizeTable, generateSymbols, classifyRowTier, rowPayoutTotal } from '../../src/gameRules'
import {
  deriveBeacon, deriveSymbolsSeed, deriveTicketSeed, encodeBeaconTarget,
  field, fromHex, playerCommitment, sha256, ticketCommitment, toHex,
} from '../../src/beacon'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const SEED = process.env.PREPROD_REVEAL_SEED?.trim()
const EXPECTED_ADDRESS = process.env.PREPROD_WALLET_ADDRESS?.trim()
const EVIDENCE_DIR = process.env.PREPROD_REVEAL_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const PRICE_USDM = 100n
const TOTAL_LIQUIDITY_USDM = 100_000n
const TICKET_NAME_HEX = '52462d5245414c2d52455645414c'
const ORACLE_STATE_POLICY_ID = '00'.repeat(28)
const ORACLE_STATE_TOKEN_NAME_HEX = '4f5241434c45'
const MAINCHAIN_REF = new Uint8Array(32)
const MATERIOS_CONTEXT = new Uint8Array(32)
const GAME_VERSION = new TextEncoder().encode('V1')

if (!SEED) throw new Error('PREPROD_REVEAL_SEED is required')
if (!EXPECTED_ADDRESS) throw new Error('PREPROD_WALLET_ADDRESS is required')

await mkdir(EVIDENCE_DIR, { recursive: true })

function nativePolicy(lucid, keyHash) {
  return lucid.utils.nativeScriptFromJson({
    type: 'all',
    scripts: [{ type: 'sig', keyHash }],
  })
}
function c(index, fields = []) { return new Constr(index, fields) }
function ref(u) { return u.txHash + '#' + u.outputIndex }
function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value, (_k, v) => typeof v === 'bigint' ? v.toString() : v)).digest('hex')
}
function prizeDatum(ticketPolicyId, prizePoolHash, playerCommitmentHex, commitmentHex, beaconValueHex, issuedAt, expiresAt) {
  return c(0, [
    ticketPolicyId, TICKET_NAME_HEX, playerCommitmentHex, PRICE_USDM, commitmentHex,
    toHex(GAME_VERSION), 1n, 0n, '', '', c(0), '', 0n,
    c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
    c(1), beaconValueHex, '11'.repeat(32), toHex(MATERIOS_CONTEXT), prizePoolHash,
    issuedAt, expiresAt, 0n, 0n,
  ])
}
function poolDatum(prizeHash, liquidity, reserve, count, liabilities) {
  return c(0, [liquidity, liabilities, reserve, count, 0n, 10_000n, 0n, prizeHash])
}
async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }
async function waitFor(fn, predicate, label) {
  for (let i = 0; i < 60; i++) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(2000)
  }
  throw new Error('Timed out waiting for ' + label)
}

const provider = new Koios(KOIOS)
const lucid = await Lucid(provider, 'Preprod')
lucid.selectWalletFromSeed(SEED)

const address = await lucid.wallet().address()
if (address !== EXPECTED_ADDRESS) {
  throw new Error('PREPROD_REVEAL_SEED resolves to unexpected wallet address')
}
const details = lucid.utils.getAddressDetails(address)
const keyHash = details.paymentCredential?.hash
if (!keyHash) throw new Error('Preprod wallet has no payment credential')

const walletBefore = await provider.getUtxos(address)
const balanceBefore = walletBefore.reduce((s, u) => s + (u.assets.lovelace ?? 0n), 0n)
if (balanceBefore < 20_000_000n) {
  throw new Error('Preprod wallet needs at least 20 ADA for the complete Reveal evidence sequence')
}

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = lucid.utils.mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

const scripts = buildScriptsFromLucid(
  lucid, defaultPrizeTable, keyHash,
  ORACLE_STATE_POLICY_ID, ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId, poolTokenNameHex,
)
if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) throw new Error('Failed to derive Reveal script addresses')

const issuedAt = BigInt(Date.now())
const expiresAt = issuedAt + 3_600_000n
const playerSecret = fromHex('01'.repeat(32))

const beaconValue = await deriveBeacon(0, 0, MAINCHAIN_REF, fromHex('11'.repeat(32)), MATERIOS_CONTEXT, GAME_VERSION)
const playerCommitmentHex = toHex(await playerCommitment(0, 1, playerSecret))
const commitmentHex = toHex(await ticketCommitment(
  new TextEncoder().encode('RF-REAL-PREPROD-REVEAL'),
  fromHex(playerCommitmentHex), GAME_VERSION, 1, Number(PRICE_USDM),
  encodeBeaconTarget({ networkId: 0, round: 0, mainchainRef: MAINCHAIN_REF, version: GAME_VERSION }),
))
const ticketSeed = await deriveTicketSeed(0, 1, playerSecret, beaconValue, GAME_VERSION)
const symbolsSeed = await deriveSymbolsSeed(ticketSeed)
const symbols = await generateSymbols(symbolsSeed)
const digest = await sha256(symbolsSeed)
const expectedResult = await sha256(new Uint8Array([...field(digest), ...field(symbols)]))
const row1Tier = classifyRowTier(symbols.slice(0, 3))
const row2Tier = classifyRowTier(symbols.slice(3, 6))
const payout = BigInt(rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(PRICE_USDM)))
const prizeTier = Math.max(row1Tier, row2Tier)

const prePrizeDatum = prizeDatum(
  testPolicyId, scripts.b1PrizePoolHash, playerCommitmentHex, commitmentHex,
  toHex(beaconValue), issuedAt, expiresAt,
)
const postPrizeDatum = c(0, [
  testPolicyId, TICKET_NAME_HEX, playerCommitmentHex, PRICE_USDM, commitmentHex,
  toHex(GAME_VERSION), 1n, payout, '', '', c(1), toHex(expectedResult),
  BigInt(prizeTier), c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
  c(1), toHex(beaconValue), '11'.repeat(32), toHex(MATERIOS_CONTEXT),
  scripts.b1PrizePoolHash, issuedAt, expiresAt, BigInt(row1Tier), BigInt(row2Tier),
])
const prePoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, PRICE_USDM, 1n, 0n)
const postPoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, 0n, 0n, payout)

const bootstrap = await lucid.newTx()
  .mintAssets({ [poolUnit]: 1n, [liquidityUnit]: TOTAL_LIQUIDITY_USDM, [ticketUnit]: 1n }, Data.void())
  .attachMintingPolicy(testPolicy)
  .payToContract(
    scripts.b1PrizePoolAddress, { inline: Data.to(prePoolDatum) },
    { lovelace: 5_000_000n, [poolUnit]: 1n, [liquidityUnit]: TOTAL_LIQUIDITY_USDM },
  )
  .payToContract(
    scripts.prizeAddress, { inline: Data.to(prePrizeDatum) },
    { lovelace: 3_000_000n, [ticketUnit]: 1n },
  )
  .addSigner(address).complete()
const bootstrapSigned = await bootstrap.sign().complete()
const bootstrapCbor = bootstrapSigned.toCBOR()
const bootstrapHash = await bootstrapSigned.submit()
await lucid.awaitTx(bootstrapHash)

const prizeUtxos = await waitFor(
  () => provider.getUtxos(scripts.prizeAddress),
  xs => xs.some(u => u.assets[ticketUnit] === 1n),
  'Preprod Prize UTxO',
)
const poolUtxos = await waitFor(
  () => provider.getUtxos(scripts.b1PrizePoolAddress),
  xs => xs.some(u => u.assets[poolUnit] === 1n),
  'Preprod B1PrizePool UTxO',
)
const prizeUtxo = prizeUtxos.find(u => u.assets[ticketUnit] === 1n)
const poolUtxo = poolUtxos.find(u => u.assets[poolUnit] === 1n)
if (!prizeUtxo || !poolUtxo) throw new Error('Preprod bootstrap outputs not found')

const prizeReferenceTx = await lucid.newTx()
  .payToAddressWithData(address, { scriptRef: scripts.prizeValidator }, { lovelace: 2_000_000n })
  .complete()
const prizeReferenceSigned = await prizeReferenceTx.sign().complete()
const prizeReferenceHash = await prizeReferenceSigned.submit()
await lucid.awaitTx(prizeReferenceHash)

const poolReferenceTx = await lucid.newTx()
  .payToAddressWithData(address, { scriptRef: scripts.b1PrizePool }, { lovelace: 2_000_000n })
  .complete()
const poolReferenceSigned = await poolReferenceTx.sign().complete()
const poolReferenceHash = await poolReferenceSigned.submit()
await lucid.awaitTx(poolReferenceHash)

const referenceUtxos = await provider.getUtxos(address)
const prizeReferenceUtxo = referenceUtxos.find(u => u.txHash === prizeReferenceHash)
const poolReferenceUtxo = referenceUtxos.find(u => u.txHash === poolReferenceHash)
if (!prizeReferenceUtxo || !poolReferenceUtxo || !prizeReferenceUtxo.scriptRef || !poolReferenceUtxo.scriptRef) {
  throw new Error('Preprod reference-script outputs could not be resolved with full script CBOR')
}

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo), prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo), poolDatum: poolUtxo.datum,
})

const reveal = await lucid.newTx()
  .readFrom([prizeReferenceUtxo, poolReferenceUtxo])
  .collectFrom([prizeUtxo], c(1, [toHex(playerSecret)]))
  .attachSpendingValidator(scripts.prizeValidator)
  .collectFrom([poolUtxo], c(2, [PRICE_USDM]))
  .attachSpendingValidator(scripts.b1PrizePool)
  .payToContract(scripts.prizeAddress, { inline: Data.to(postPrizeDatum) }, prizeUtxo.assets)
  .payToContract(scripts.b1PrizePoolAddress, { inline: Data.to(postPoolDatum) }, poolUtxo.assets)
  .addSigner(address)
  .validTo(Number(expiresAt))
  .complete()

const signedReveal = await reveal.sign().complete()
const revealCbor = signedReveal.toCBOR()
const revealBytes = Buffer.from(revealCbor, 'hex').length
const protocolParameters = await provider.getProtocolParameters()
if (revealBytes > protocolParameters.maxTxSize) {
  throw new Error(`Preprod Reveal exceeds maxTxSize: ${revealBytes} > ${protocolParameters.maxTxSize}`)
}
const revealHash = await signedReveal.submit()
await lucid.awaitTx(revealHash)

const postPrize = (await provider.getUtxos(scripts.prizeAddress)).find(u => u.txHash === revealHash && u.assets[ticketUnit] === 1n)
const postPool = (await provider.getUtxos(scripts.b1PrizePoolAddress)).find(u => u.txHash === revealHash && u.assets[poolUnit] === 1n)
if (!postPrize || !postPool) throw new Error('Preprod Reveal confirmation missing expected outputs')

const postStateFingerprint = hashJson({
  prizeRef: ref(postPrize), prizeDatum: postPrize.datum,
  poolRef: ref(postPool), poolDatum: postPool.datum,
})
let replayRejected = false
let replayError = ''
try { await signedReveal.submit() } catch (error) {
  replayRejected = true
  replayError = error instanceof Error ? error.message : String(error)
}
if (!replayRejected) throw new Error('Duplicate Preprod Reveal was unexpectedly accepted')

const evidence = {
  schema: 'IMMORTAL-PREPROD-REAL-REVEAL-v0.1',
  status: 'CONFIRMED',
  network: 'cardano-preprod',
  transactionRef: revealHash,
  transactionCbor: revealCbor,
  transactionBytes: revealBytes,
  maxTxSize: protocolParameters.maxTxSize,
  walletAddress: address,
  bootstrapHash,
  bootstrapCbor,
  prizeReferenceHash,
  poolReferenceHash,
  consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
  producedUtxos: [ref(postPrize), ref(postPool)],
  preStateFingerprint,
  postStateFingerprint,
  action: {
    actionClass: 'REVEAL',
    ticketPolicyId: testPolicyId,
    ticketNameHex: TICKET_NAME_HEX,
    priceUsdm: PRICE_USDM.toString(),
    payout: payout.toString(),
    row1Tier, row2Tier, prizeTier,
    resultHex: toHex(expectedResult),
  },
  replay: { rejected: replayRejected, error: replayError },
  provider: { query: 'Koios Preprod', submission: 'Koios Preprod' },
}
await writeFile(EVIDENCE_DIR + '/real-preprod-reveal.json', JSON.stringify(evidence, null, 2) + '\n')
await writeFile(EVIDENCE_DIR + '/reveal-tx.cbor', Buffer.from(revealCbor, 'hex'))
await writeFile(EVIDENCE_DIR + '/reveal-tx-hash.txt', revealHash + '\n')

if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, `preprod_reveal_tx_hash=${revealHash}\n`, { flag: 'a' })
}

console.log(JSON.stringify({
  status: 'CONFIRMED',
  network: 'cardano-preprod',
  transactionRef: revealHash,
  transactionBytes: revealBytes,
  maxTxSize: protocolParameters.maxTxSize,
  consumedUtxos: evidence.consumedUtxos,
  producedUtxos: evidence.producedUtxos,
  replayRejected,
}, null, 2))
