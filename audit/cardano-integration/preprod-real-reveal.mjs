import { Constr, Data, Lucid, Koios, getAddressDetails, scriptFromNative, mintingPolicyToId, validatorToScriptHash, validatorToAddress, applyDoubleCborEncoding } from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

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
const DEPLOY_ONLY = process.env.PREPROD_DEPLOY_ONLY === '1'
const DEPLOYMENT_MANIFEST = process.env.PREPROD_DEPLOYMENT_MANIFEST ?? EVIDENCE_DIR + '/preprod-deployment.json'
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
  return scriptFromNative({ type: 'all', scripts: [{ type: 'sig', keyHash }] })
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
function normalizeScriptBytes(bytes) {
  if (typeof bytes === 'string') return bytes
  if (bytes instanceof Uint8Array || Buffer.isBuffer(bytes)) return Buffer.from(bytes).toString('hex')
  if (Array.isArray(bytes)) return Buffer.from(bytes).toString('hex')
  if (bytes && typeof bytes === 'object') {
    const candidates = [bytes.hex, bytes.bytes, bytes.data, bytes.value, bytes.cbor, bytes.script, bytes.script_bytes, bytes.serialized, bytes.raw].filter(v => v !== undefined)
    for (const candidate of candidates) {
      try { const normalized = normalizeScriptBytes(candidate); if (normalized) return normalized } catch {}
    }
    if (typeof bytes.toString === 'function') {
      const rendered = bytes.toString()
      if (rendered && rendered !== '[object Object]') { try { return normalizeScriptBytes(rendered) } catch {} }
    }
  }
  throw new Error('Koios reference script bytes have an unsupported shape')
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
provider.awaitTx = async (txHash) => {
  await waitFor(async () => {
    const response = await fetch(`${KOIOS}/tx_info`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ _tx_hashes: [txHash] }) })
    if (!response.ok) throw new Error(`Koios tx_info failed: ${response.status}`)
    return response.json()
  }, rows => Array.isArray(rows) && rows.some(row => row?.tx_hash === txHash), 'transaction ' + txHash)
  return true
}

async function safeKoiosUtxos(address) {
  const response = await fetch(`${KOIOS}/address_info`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ _addresses: [address] }) })
  if (!response.ok) throw new Error(`Koios address_info failed: ${response.status}`)
  const rows = await response.json()
  const info = rows?.[0]
  if (!info) return []
  return Promise.all((info.utxo_set ?? []).map(async (u) => {
    const assets = { lovelace: BigInt(u.value) }
    for (const asset of u.asset_list ?? []) assets[asset.policy_id + (asset.asset_name ?? '')] = BigInt(asset.quantity)
    let scriptRef
    const rs = u.reference_script
    if (rs?.type) {
      const type = { plutusV1: 'PlutusV1', plutusV2: 'PlutusV2', plutusV3: 'PlutusV3' }[rs.type]
      if (type) {
        scriptRef = { type, script: applyDoubleCborEncoding(normalizeScriptBytes(rs.bytes)) }
      }
    }
    const inlineDatum = u.inline_datum?.bytes ? normalizeScriptBytes(u.inline_datum.bytes) : undefined
    return {
      txHash: u.tx_hash,
      outputIndex: u.tx_index,
      assets,
      address: info.address,
      datumHash: inlineDatum ? undefined : (u.datum_hash || undefined),
      datum: inlineDatum,
      scriptRef,
    }
  }))
}

const lucid = await Lucid(provider, 'Preprod')

let walletMode = 'mnemonic'
try { lucid.selectWallet.fromSeed(SEED) } catch (mnemonicError) {
  try { lucid.selectWallet.fromPrivateKey(SEED); walletMode = 'private-key' } catch { throw mnemonicError }
}
const address = await lucid.wallet().address()
if (address !== EXPECTED_ADDRESS) throw new Error('PREPROD_REVEAL_SEED resolves to unexpected wallet address')
const details = getAddressDetails(address)
const keyHash = details.paymentCredential?.hash
if (!keyHash) throw new Error('Preprod wallet has no payment credential')

const walletBefore = await provider.getUtxos(address)
const balanceBefore = walletBefore.reduce((s, u) => s + (u.assets.lovelace ?? 0n), 0n)
console.log(JSON.stringify({ walletMode, walletAddressVerified: address === EXPECTED_ADDRESS, utxoCount: walletBefore.length, lovelaceBalance: balanceBefore.toString() }, null, 2))
if (balanceBefore < 20_000_000n) throw new Error('Preprod wallet needs at least 20 ADA for the complete Reveal evidence sequence')

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

const lucidCompat = { ...lucid, utils: { validatorToScriptHash, mintingPolicyToId, validatorToAddress: (script) => validatorToAddress('Preprod', script) } }
const scripts = buildScriptsFromLucid(lucidCompat, defaultPrizeTable, keyHash, ORACLE_STATE_POLICY_ID, ORACLE_STATE_TOKEN_NAME_HEX, testPolicyId, poolTokenNameHex)
if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) throw new Error('Failed to derive Reveal script addresses')

let issuedAt = BigInt(Date.now())
let expiresAt = issuedAt + 3_600_000n
const playerSecret = fromHex('01'.repeat(32))
let beaconValue = await deriveBeacon(0, 0, MAINCHAIN_REF, fromHex('11'.repeat(32)), MATERIOS_CONTEXT, GAME_VERSION)
let playerCommitmentHex = toHex(await playerCommitment(0, 1, playerSecret))
let commitmentHex = toHex(await ticketCommitment(new TextEncoder().encode('RF-REAL-PREPROD-REVEAL'), fromHex(playerCommitmentHex), GAME_VERSION, 1, Number(PRICE_USDM), encodeBeaconTarget({ networkId: 0, round: 0, mainchainRef: MAINCHAIN_REF, version: GAME_VERSION })))
let ticketSeed = await deriveTicketSeed(0, 1, playerSecret, beaconValue, GAME_VERSION)
let symbolsSeed = await deriveSymbolsSeed(ticketSeed)
let symbols = await generateSymbols(symbolsSeed)
let digest = await sha256(symbolsSeed)
let expectedResult = await sha256(new Uint8Array([...field(digest), ...field(symbols)]))
let row1Tier = classifyRowTier(symbols.slice(0, 3))
let row2Tier = classifyRowTier(symbols.slice(3, 6))
let payout = BigInt(rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(PRICE_USDM)))
let prizeTier = Math.max(row1Tier, row2Tier)
const prePrizeDatum = prizeDatum(testPolicyId, scripts.b1PrizePoolHash, playerCommitmentHex, commitmentHex, toHex(beaconValue), issuedAt, expiresAt)
let postPrizeDatum = c(0, [testPolicyId, TICKET_NAME_HEX, playerCommitmentHex, PRICE_USDM, commitmentHex, toHex(GAME_VERSION), 1n, payout, '', '', c(1), toHex(expectedResult), BigInt(prizeTier), c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]), c(1), toHex(beaconValue), '11'.repeat(32), toHex(MATERIOS_CONTEXT), scripts.b1PrizePoolHash, issuedAt, expiresAt, BigInt(row1Tier), BigInt(row2Tier)])
const prePoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, PRICE_USDM, 1n, 0n)
let postPoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, 0n, 0n, payout)

let bootstrapHash, bootstrapCbor = '', prizeReferenceHash, poolReferenceHash, prizeUtxo, poolUtxo, prizeReferenceUtxo, poolReferenceUtxo, deploymentManifest

if (DEPLOY_ONLY) throw new Error('PREPROD_DEPLOY_ONLY is not supported in this Reveal-only harness')

try { deploymentManifest = JSON.parse(await readFile(DEPLOYMENT_MANIFEST, 'utf8')) } catch { deploymentManifest = null }

const prizeUtxos = await safeKoiosUtxos(scripts.prizeAddress)
const poolUtxos = await safeKoiosUtxos(scripts.b1PrizePoolAddress)
const referenceUtxos = await safeKoiosUtxos(address)

const candidatePrizeRef = deploymentManifest?.utxos?.prize
const candidatePoolRef = deploymentManifest?.utxos?.pool
const candidatePrizeReferenceRef = deploymentManifest?.utxos?.prizeReference
const candidatePoolReferenceRef = deploymentManifest?.utxos?.poolReference

if (deploymentManifest) {
  if (!candidatePrizeRef || !candidatePoolRef || !candidatePrizeReferenceRef || !candidatePoolReferenceRef) throw new Error('Deployment manifest is missing required Preprod UTxO references')
} else {
  const expectedPrizeScript = applyDoubleCborEncoding(normalizeScriptBytes(scripts.prizeValidator))
  const expectedPoolScript = applyDoubleCborEncoding(normalizeScriptBytes(scripts.b1PrizePool))
  prizeUtxo = prizeUtxos.find(u => u.assets[ticketUnit] === 1n)
  poolUtxo = poolUtxos.find(u => u.assets[poolUnit] === 1n && u.assets[liquidityUnit] === TOTAL_LIQUIDITY_USDM)
  prizeReferenceUtxo = referenceUtxos.find(u => u.scriptRef?.type === 'PlutusV2' && u.scriptRef.script === expectedPrizeScript)
  poolReferenceUtxo = referenceUtxos.find(u => u.scriptRef?.type === 'PlutusV2' && u.scriptRef.script === expectedPoolScript)
}

if (deploymentManifest) {
  const parseRef = value => { const [txHash, outputIndex] = value.split('#'); return { txHash, outputIndex: Number(outputIndex) } }
  const liveUtxos = await provider.getUtxosByOutRef([parseRef(candidatePrizeRef), parseRef(candidatePoolRef), parseRef(candidatePrizeReferenceRef), parseRef(candidatePoolReferenceRef)])
  const byRef = new Map(liveUtxos.map(u => [ref(u), u]))
  prizeUtxo = byRef.get(candidatePrizeRef)
  poolUtxo = byRef.get(candidatePoolRef)
  prizeReferenceUtxo = byRef.get(candidatePrizeReferenceRef)
  poolReferenceUtxo = byRef.get(candidatePoolReferenceRef)
  if (!prizeUtxo || !poolUtxo || !prizeReferenceUtxo || !poolReferenceUtxo) throw new Error('Previously deployed Preprod topology could not be rehydrated by Lucid Evolution')
} else if (!prizeUtxo || !poolUtxo || !prizeReferenceUtxo || !poolReferenceUtxo) {
  throw new Error('Previously deployed Preprod topology could not be resolved; refusing to bootstrap during Reveal')
}

if (!prizeReferenceUtxo.scriptRef || !poolReferenceUtxo.scriptRef) throw new Error('Previously deployed Preprod reference scripts are missing or unresolved')

const prizeDatumCbor = normalizeScriptBytes(prizeUtxo.datum)
if (!/^[0-9a-fA-F]+$/.test(prizeDatumCbor) || prizeDatumCbor.length % 2 !== 0) throw new Error('Existing Preprod Prize datum is not valid hex CBOR')
let deployedPrizeDatum
try { deployedPrizeDatum = Data.from(prizeDatumCbor) } catch (error) { throw new Error('Existing Preprod Prize datum could not be decoded by Lucid: ' + (error instanceof Error ? error.message : String(error))) }
if (!(deployedPrizeDatum instanceof Constr) || deployedPrizeDatum.index !== 0 || deployedPrizeDatum.fields.length < 23) throw new Error('Existing Preprod Prize datum has an unexpected shape')
if (deployedPrizeDatum.fields[0] !== testPolicyId || deployedPrizeDatum.fields[1] !== TICKET_NAME_HEX) throw new Error('Existing Preprod ticket identity does not match the current topology')
if (BigInt(deployedPrizeDatum.fields[3]) !== PRICE_USDM) throw new Error('Existing Preprod ticket price does not match the Reveal profile')
issuedAt = BigInt(deployedPrizeDatum.fields[19])
expiresAt = BigInt(deployedPrizeDatum.fields[20])
playerCommitmentHex = deployedPrizeDatum.fields[2]
commitmentHex = deployedPrizeDatum.fields[4]
const deployedGameVersion = deployedPrizeDatum.fields[5]
if (deployedGameVersion !== toHex(GAME_VERSION)) throw new Error('Existing Preprod game version mismatch')
const deployedBeaconValueHex = deployedPrizeDatum.fields[15]
beaconValue = fromHex(deployedBeaconValueHex)
ticketSeed = await deriveTicketSeed(0, 1, playerSecret, beaconValue, GAME_VERSION)
symbolsSeed = await deriveSymbolsSeed(ticketSeed)
symbols = await generateSymbols(symbolsSeed)
digest = await sha256(symbolsSeed)
expectedResult = await sha256(new Uint8Array([...field(digest), ...field(symbols)]))
row1Tier = classifyRowTier(symbols.slice(0, 3))
row2Tier = classifyRowTier(symbols.slice(3, 6))
payout = BigInt(rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(PRICE_USDM)))
prizeTier = Math.max(row1Tier, row2Tier)
postPrizeDatum = c(0, [testPolicyId, TICKET_NAME_HEX, playerCommitmentHex, PRICE_USDM, commitmentHex, deployedGameVersion, 1n, payout, '', '', c(1), toHex(expectedResult), BigInt(prizeTier), c(0, [0n, 0n, toHex(MAINCHAIN_REF), deployedGameVersion]), c(1), deployedBeaconValueHex, '11'.repeat(32), toHex(MATERIOS_CONTEXT), scripts.b1PrizePoolHash, issuedAt, expiresAt, BigInt(row1Tier), BigInt(row2Tier)])
postPoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, 0n, 0n, payout)

console.log(JSON.stringify({ status: 'DEPLOYMENT_REUSED', network: 'cardano-preprod', deploymentManifest: DEPLOYMENT_MANIFEST, bootstrapHash: deploymentManifest?.bootstrapHash ?? 'recovered-from-live-preprod', prizeReferenceHash: deploymentManifest?.prizeReferenceHash ?? ref(prizeReferenceUtxo).split('#')[0], poolReferenceHash: deploymentManifest?.poolReferenceHash ?? ref(poolReferenceUtxo).split('#')[0], prizeUtxo: ref(prizeUtxo), poolUtxo: ref(poolUtxo), prizeReferenceUtxo: ref(prizeReferenceUtxo), poolReferenceUtxo: ref(poolReferenceUtxo) }, null, 2))

const preStateFingerprint = hashJson({ prizeRef: ref(prizeUtxo), prizeDatum: prizeUtxo.datum, poolRef: ref(poolUtxo), poolDatum: poolUtxo.datum })
const inputDiagnostics = {
  prize: { ref: ref(prizeUtxo), datumType: typeof prizeUtxo.datum, datum: prizeUtxo.datum, datumNormalized: normalizeScriptBytes(prizeUtxo.datum), datumLength: normalizeScriptBytes(prizeUtxo.datum).length, assets: Object.fromEntries(Object.entries(prizeUtxo.assets).map(([k, v]) => [k, v.toString()])) },
  pool: { ref: ref(poolUtxo), datumType: typeof poolUtxo.datum, datum: poolUtxo.datum, datumNormalized: normalizeScriptBytes(poolUtxo.datum), datumLength: normalizeScriptBytes(poolUtxo.datum).length, assets: Object.fromEntries(Object.entries(poolUtxo.assets).map(([k, v]) => [k, v.toString()])) },
}
await writeFile(EVIDENCE_DIR + '/reveal-input-diagnostic.json', JSON.stringify(inputDiagnostics, null, 2) + '\n')

const { CML } = await import('@lucid-evolution/lucid')
CML.PlutusData.from_cbor_hex(prizeDatumCbor)
await writeFile(EVIDENCE_DIR + '/cml-prize-datum-probe.json', JSON.stringify({ status: 'PARSED', utxo: ref(prizeUtxo), datumLength: prizeDatumCbor.length }, null, 2) + '\n')

// Provider-native UTxOs from getUtxosByOutRef are passed untouched to Collect.
let reveal = await lucid.newTx()
  .collectFrom([prizeUtxo], c(1, [toHex(playerSecret)]))
  .readFrom([prizeReferenceUtxo])
  .attach.SpendingValidator(scripts.prizeValidator)
  .complete()

reveal = await reveal
  .collectFrom([poolUtxo], c(2, [PRICE_USDM]))
  .attach.SpendingValidator(scripts.b1PrizePool)
  .complete()

reveal = await reveal
  .pay.ToContract(scripts.prizeAddress, { kind: 'inline', value: Data.to(postPrizeDatum) }, prizeUtxo.assets)
  .pay.ToContract(scripts.b1PrizePoolAddress, { kind: 'inline', value: Data.to(postPoolDatum) }, poolUtxo.assets)
  .addSigner(address)
  .validTo(Number(expiresAt))
  .complete()

const signedReveal = await reveal.sign.withWallet().complete()
const revealCbor = signedReveal.toCBOR()
const revealBytes = Buffer.from(revealCbor, 'hex').length
const protocolParameters = await provider.getProtocolParameters()
if (revealBytes > protocolParameters.maxTxSize) throw new Error(`Preprod Reveal exceeds maxTxSize: ${revealBytes} > ${protocolParameters.maxTxSize}`)
const revealHash = await signedReveal.submit()
await lucid.awaitTx(revealHash)

const postPrize = (await provider.getUtxos(scripts.prizeAddress)).find(u => u.txHash === revealHash && u.assets[ticketUnit] === 1n)
const postPool = (await provider.getUtxos(scripts.b1PrizePoolAddress)).find(u => u.txHash === revealHash && u.assets[poolUnit] === 1n)
if (!postPrize || !postPool) throw new Error('Preprod Reveal confirmation missing expected outputs')

const postStateFingerprint = hashJson({ prizeRef: ref(postPrize), prizeDatum: postPrize.datum, poolRef: ref(postPool), poolDatum: postPool.datum })
let replayRejected = false
let replayError = ''
try { await signedReveal.submit() } catch (error) { replayRejected = true; replayError = error instanceof Error ? error.message : String(error) }
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
  bootstrapHash: deploymentManifest?.bootstrapHash ?? 'recovered-from-live-preprod',
  bootstrapCbor,
  prizeReferenceHash: deploymentManifest?.prizeReferenceHash ?? ref(prizeReferenceUtxo).split('#')[0],
  poolReferenceHash: deploymentManifest?.poolReferenceHash ?? ref(poolReferenceUtxo).split('#')[0],
  consumedUtxos: [ref(prizeUtxo), ref(poolUtxo)],
  producedUtxos: [ref(postPrize), ref(postPool)],
  preStateFingerprint,
  postStateFingerprint,
  action: { actionClass: 'REVEAL', ticketPolicyId: testPolicyId, ticketNameHex: TICKET_NAME_HEX, priceUsdm: PRICE_USDM.toString(), payout: payout.toString(), row1Tier, row2Tier, prizeTier, resultHex: toHex(expectedResult) },
  replay: { rejected: replayRejected, error: replayError },
  provider: { query: 'Koios Preprod', submission: 'Koios Preprod' },
}
await writeFile(EVIDENCE_DIR + '/real-preprod-reveal.json', JSON.stringify(evidence, null, 2) + '\n')
await writeFile(EVIDENCE_DIR + '/reveal-tx.cbor', Buffer.from(revealCbor, 'hex'))
await writeFile(EVIDENCE_DIR + '/reveal-tx-hash.txt', revealHash + '\n')
if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `preprod_reveal_tx_hash=${revealHash}\n`, { flag: 'a' })
console.log(JSON.stringify({ status: 'CONFIRMED', network: 'cardano-preprod', transactionRef: revealHash, transactionBytes: revealBytes, maxTxSize: protocolParameters.maxTxSize, consumedUtxos: evidence.consumedUtxos, producedUtxos: evidence.producedUtxos, replayRejected }, null, 2))
