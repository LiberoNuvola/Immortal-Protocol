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
  return scriptFromNative({
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
function normalizeScriptBytes(bytes) {
  if (typeof bytes === 'string') return bytes
  if (bytes instanceof Uint8Array || Buffer.isBuffer(bytes)) return Buffer.from(bytes).toString('hex')
  if (Array.isArray(bytes)) return Buffer.from(bytes).toString('hex')
  if (bytes && typeof bytes === 'object') {
    const candidates = [
      bytes.hex, bytes.bytes, bytes.data, bytes.value, bytes.cbor,
      bytes.script, bytes.script_bytes, bytes.serialized, bytes.raw,
    ].filter(v => v !== undefined)
    for (const candidate of candidates) {
      try {
        const normalized = normalizeScriptBytes(candidate)
        if (normalized) return normalized
      } catch {}
    }
    if (typeof bytes.toString === 'function') {
      const rendered = bytes.toString()
      if (rendered && rendered !== '[object Object]') {
        try { return normalizeScriptBytes(rendered) } catch {}
      }
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

async function safeKoiosAwaitTx(txHash) {
  await waitFor(
    async () => {
      const response = await fetch(`${KOIOS}/tx_info`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ _tx_hashes: [txHash] }),
      })
      if (!response.ok) throw new Error(`Koios tx_info failed: ${response.status}`)
      return response.json()
    },
    rows => Array.isArray(rows) && rows.some(row => row?.tx_hash === txHash),
    'transaction ' + txHash,
  )
  return true
}

async function safeKoiosUtxos(address) {
  const response = await fetch(`${KOIOS}/address_info`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _addresses: [address] }),
  })
  if (!response.ok) throw new Error(`Koios address_info failed: ${response.status}`)
  const rows = await response.json()
  const info = rows?.[0]
  if (!info) return []
  return (info.utxo_set ?? []).map((u) => {
    const assets = { lovelace: BigInt(u.value) }
    for (const asset of u.asset_list ?? []) {
      assets[asset.policy_id + (asset.asset_name ?? '')] = BigInt(asset.quantity)
    }
    let scriptRef
    const rs = u.reference_script
    if (rs?.type) {
      const type = { plutusV1: 'PlutusV1', plutusV2: 'PlutusV2', plutusV3: 'PlutusV3' }[rs.type]
      if (type) {
        let normalized
        try {
          normalized = normalizeScriptBytes(rs.bytes)
        } catch (error) {
          const diagnostic = {
            referenceScriptType: rs.type,
            referenceScriptKeys: Object.keys(rs),
            referenceScriptShape: rs,
            bytesType: typeof rs.bytes,
            bytesKeys: rs.bytes && typeof rs.bytes === 'object' ? Object.keys(rs.bytes) : undefined,
            bytesShape: rs.bytes,
            normalizationError: error instanceof Error ? error.message : String(error),
          }
          await writeFile(
            EVIDENCE_DIR + '/koios-reference-script-diagnostic.json',
            JSON.stringify(diagnostic, null, 2) + '\\n',
          )
          throw new Error('Koios reference script bytes shape is unsupported; diagnostic written to ' + EVIDENCE_DIR + '/koios-reference-script-diagnostic.json')
        }
        scriptRef = { type, script: applyDoubleCborEncoding(normalized) }
      }
    }
    return {
      txHash: u.tx_hash,
      outputIndex: u.tx_index,
      assets,
      address: info.address,
      datumHash: u.inline_datum?.bytes ? undefined : (u.datum_hash || undefined),
      datum: u.inline_datum?.bytes || undefined,
      scriptRef,
    }
  })
}
const originalGetUtxos = provider.getUtxos.bind(provider)
provider.awaitTx = safeKoiosAwaitTx
provider.getUtxos = async (addressOrCredential) =>
  typeof addressOrCredential === 'string'
    ? safeKoiosUtxos(addressOrCredential)
    : originalGetUtxos(addressOrCredential)

const lucid = await Lucid(provider, 'Preprod')

let walletMode = 'mnemonic'
try {
  lucid.selectWallet.fromSeed(SEED)
} catch (mnemonicError) {
  try {
    lucid.selectWallet.fromPrivateKey(SEED)
    walletMode = 'private-key'
  } catch {
    throw mnemonicError
  }
}

const address = await lucid.wallet().address()
if (address !== EXPECTED_ADDRESS) {
  throw new Error('PREPROD_REVEAL_SEED resolves to unexpected wallet address')
}
const details = getAddressDetails(address)
const keyHash = details.paymentCredential?.hash
if (!keyHash) throw new Error('Preprod wallet has no payment credential')

const walletBefore = await provider.getUtxos(address)
const balanceBefore = walletBefore.reduce((s, u) => s + (u.assets.lovelace ?? 0n), 0n)
console.log(JSON.stringify({ walletMode, walletAddressVerified: address === EXPECTED_ADDRESS, utxoCount: walletBefore.length, lovelaceBalance: balanceBefore.toString() }, null, 2))
if (balanceBefore < 20_000_000n) {
  throw new Error('Preprod wallet needs at least 20 ADA for the complete Reveal evidence sequence')
}

const testPolicy = nativePolicy(lucid, keyHash)
const testPolicyId = mintingPolicyToId(testPolicy)
const poolTokenNameHex = '504f4f4c'
const liquidityTokenNameHex = '5553444d'
const poolUnit = testPolicyId + poolTokenNameHex
const liquidityUnit = testPolicyId + liquidityTokenNameHex
const ticketUnit = testPolicyId + TICKET_NAME_HEX

const lucidCompat = {
  ...lucid,
  utils: {
    validatorToScriptHash,
    mintingPolicyToId,
    validatorToAddress: (script) => validatorToAddress('Preprod', script),
  },
}

const scripts = buildScriptsFromLucid(
  lucidCompat, defaultPrizeTable, keyHash,
  ORACLE_STATE_POLICY_ID, ORACLE_STATE_TOKEN_NAME_HEX,
  testPolicyId, poolTokenNameHex,
)
if (!scripts.prizeAddress || !scripts.b1PrizePoolAddress) throw new Error('Failed to derive Reveal script addresses')

let issuedAt = BigInt(Date.now())
let expiresAt = issuedAt + 3_600_000n
const playerSecret = fromHex('01'.repeat(32))

let beaconValue = await deriveBeacon(0, 0, MAINCHAIN_REF, fromHex('11'.repeat(32)), MATERIOS_CONTEXT, GAME_VERSION)
let playerCommitmentHex = toHex(await playerCommitment(0, 1, playerSecret))
let commitmentHex = toHex(await ticketCommitment(
  new TextEncoder().encode('RF-REAL-PREPROD-REVEAL'),
  fromHex(playerCommitmentHex), GAME_VERSION, 1, Number(PRICE_USDM),
  encodeBeaconTarget({ networkId: 0, round: 0, mainchainRef: MAINCHAIN_REF, version: GAME_VERSION }),
))
let ticketSeed = await deriveTicketSeed(0, 1, playerSecret, beaconValue, GAME_VERSION)
let symbolsSeed = await deriveSymbolsSeed(ticketSeed)
let symbols = await generateSymbols(symbolsSeed)
let digest = await sha256(symbolsSeed)
let expectedResult = await sha256(new Uint8Array([...field(digest), ...field(symbols)]))
let row1Tier = classifyRowTier(symbols.slice(0, 3))
let row2Tier = classifyRowTier(symbols.slice(3, 6))
let payout = BigInt(rowPayoutTotal(defaultPrizeTable, row1Tier, row2Tier, Number(PRICE_USDM)))
let prizeTier = Math.max(row1Tier, row2Tier)

const prePrizeDatum = prizeDatum(
  testPolicyId, scripts.b1PrizePoolHash, playerCommitmentHex, commitmentHex,
  toHex(beaconValue), issuedAt, expiresAt,
)
let postPrizeDatum = c(0, [
  testPolicyId, TICKET_NAME_HEX, playerCommitmentHex, PRICE_USDM, commitmentHex,
  toHex(GAME_VERSION), 1n, payout, '', '', c(1), toHex(expectedResult),
  BigInt(prizeTier), c(0, [0n, 0n, toHex(MAINCHAIN_REF), toHex(GAME_VERSION)]),
  c(1), toHex(beaconValue), '11'.repeat(32), toHex(MATERIOS_CONTEXT),
  scripts.b1PrizePoolHash, issuedAt, expiresAt, BigInt(row1Tier), BigInt(row2Tier),
])
const prePoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, PRICE_USDM, 1n, 0n)
let postPoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, 0n, 0n, payout)

let bootstrapHash
let bootstrapCbor = ''
let prizeReferenceHash
let poolReferenceHash
let prizeUtxo
let poolUtxo
let prizeReferenceUtxo
let poolReferenceUtxo
let deploymentManifest

if (DEPLOY_ONLY) {
  const bootstrap = await lucid.newTx()
    .mintAssets({ [poolUnit]: 1n, [liquidityUnit]: TOTAL_LIQUIDITY_USDM, [ticketUnit]: 1n }, Data.void())
    .attach.MintingPolicy(testPolicy)
    .pay.ToContract(
      scripts.b1PrizePoolAddress, { kind: 'inline', value: Data.to(prePoolDatum) },
      { lovelace: 5_000_000n, [poolUnit]: 1n, [liquidityUnit]: TOTAL_LIQUIDITY_USDM },
    )
    .pay.ToContract(
      scripts.prizeAddress, { kind: 'inline', value: Data.to(prePrizeDatum) },
      { lovelace: 3_000_000n, [ticketUnit]: 1n },
    )
    .addSigner(address).complete()
  const bootstrapSigned = await bootstrap.sign.withWallet().complete()
  bootstrapCbor = bootstrapSigned.toCBOR()
  bootstrapHash = await bootstrapSigned.submit()
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
  prizeUtxo = prizeUtxos.find(u => u.assets[ticketUnit] === 1n)
  poolUtxo = poolUtxos.find(u => u.assets[poolUnit] === 1n)
  if (!prizeUtxo || !poolUtxo) throw new Error('Preprod bootstrap outputs not found')

  const prizeReferenceTx = await lucid.newTx()
    .pay.ToAddressWithData(address, undefined, { lovelace: 2_000_000n }, scripts.prizeValidator)
    .complete()
  const prizeReferenceSigned = await prizeReferenceTx.sign.withWallet().complete()
  prizeReferenceHash = await prizeReferenceSigned.submit()
  await lucid.awaitTx(prizeReferenceHash)

  const poolReferenceTx = await lucid.newTx()
    .pay.ToAddressWithData(address, undefined, { lovelace: 2_000_000n }, scripts.b1PrizePool)
    .complete()
  const poolReferenceSigned = await poolReferenceTx.sign.withWallet().complete()
  poolReferenceHash = await poolReferenceSigned.submit()
  await lucid.awaitTx(poolReferenceHash)

  const referenceUtxos = await provider.getUtxos(address)
  prizeReferenceUtxo = referenceUtxos.find(u => u.txHash === prizeReferenceHash)
  poolReferenceUtxo = referenceUtxos.find(u => u.txHash === poolReferenceHash)
  if (!prizeReferenceUtxo || !poolReferenceUtxo || !prizeReferenceUtxo.scriptRef || !poolReferenceUtxo.scriptRef) {
    throw new Error('Preprod reference-script outputs could not be resolved with full script CBOR')
  }

  deploymentManifest = {
    schema: 'IMMORTAL-PREPROD-DEPLOYMENT-v0.1',
    status: 'DEPLOYED',
    network: 'cardano-preprod',
    walletAddress: address,
    bootstrapHash,
    prizeReferenceHash,
    poolReferenceHash,
    assets: {
      poolUnit,
      liquidityUnit,
      ticketUnit,
      liquidityAmount: TOTAL_LIQUIDITY_USDM.toString(),
    },
    topology: {
      counterHash: scripts.counterHash,
      registryHash: scripts.registryHash,
      treasuryHash: scripts.treasuryHash,
      prizeHash: scripts.prizeHash,
      b1PrizePoolHash: scripts.b1PrizePoolHash,
      ticketPolicyId: scripts.ticketPolicyId,
      prizeAddress: scripts.prizeAddress,
      b1PrizePoolAddress: scripts.b1PrizePoolAddress,
    },
    utxos: {
      prize: ref(prizeUtxo),
      pool: ref(poolUtxo),
      prizeReference: ref(prizeReferenceUtxo),
      poolReference: ref(poolReferenceUtxo),
    },
    scriptRefs: {
      prizeReference: prizeReferenceUtxo.scriptRef,
      poolReference: poolReferenceUtxo.scriptRef,
    },
    source: {
      walletMode,
      lucidEvolution: '0.6.5',
    },
  }
  await writeFile(DEPLOYMENT_MANIFEST, JSON.stringify(deploymentManifest, null, 2) + '\\n')
  console.log(JSON.stringify({
    status: 'DEPLOYED',
    network: 'cardano-preprod',
    manifest: DEPLOYMENT_MANIFEST,
    bootstrapHash,
    prizeReferenceHash,
    poolReferenceHash,
    prizeUtxo: ref(prizeUtxo),
    poolUtxo: ref(poolUtxo),
    prizeReferenceUtxo: ref(prizeReferenceUtxo),
    poolReferenceUtxo: ref(poolReferenceUtxo),
  }, null, 2))
  process.exit(0)
}

try {
  deploymentManifest = JSON.parse(await readFile(DEPLOYMENT_MANIFEST, 'utf8'))
} catch {
  deploymentManifest = null
}

if (deploymentManifest) {
  if (deploymentManifest.schema !== 'IMMORTAL-PREPROD-DEPLOYMENT-v0.1' || deploymentManifest.status !== 'DEPLOYED') {
    throw new Error('Existing Preprod deployment manifest is invalid or not marked DEPLOYED')
  }
  if (deploymentManifest.network !== 'cardano-preprod') throw new Error('Deployment manifest network mismatch')
  if (deploymentManifest.walletAddress !== address) throw new Error('Deployment manifest wallet address mismatch')
  if (deploymentManifest.topology?.prizeAddress !== scripts.prizeAddress) throw new Error('Deployment manifest Prize address mismatch')
  if (deploymentManifest.topology?.b1PrizePoolAddress !== scripts.b1PrizePoolAddress) throw new Error('Deployment manifest B1PrizePool address mismatch')
  if (deploymentManifest.assets?.ticketUnit !== ticketUnit) throw new Error('Deployment manifest ticket asset mismatch')
  if (deploymentManifest.assets?.poolUnit !== poolUnit) throw new Error('Deployment manifest pool asset mismatch')
  if (deploymentManifest.assets?.liquidityUnit !== liquidityUnit) throw new Error('Deployment manifest liquidity asset mismatch')
}

bootstrapHash = deploymentManifest?.bootstrapHash
prizeReferenceHash = deploymentManifest?.prizeReferenceHash
poolReferenceHash = deploymentManifest?.poolReferenceHash

const prizeUtxos = await provider.getUtxos(scripts.prizeAddress)
const poolUtxos = await provider.getUtxos(scripts.b1PrizePoolAddress)
const referenceUtxos = await provider.getUtxos(address)

if (deploymentManifest) {
  const deployedPrizeRef = deploymentManifest.utxos?.prize
  const deployedPoolRef = deploymentManifest.utxos?.pool
  const deployedPrizeReferenceRef = deploymentManifest.utxos?.prizeReference
  const deployedPoolReferenceRef = deploymentManifest.utxos?.poolReference
  if (!deployedPrizeRef || !deployedPoolRef || !deployedPrizeReferenceRef || !deployedPoolReferenceRef) {
    throw new Error('Deployment manifest is missing required Preprod UTxO references')
  }
  prizeUtxo = prizeUtxos.find(u => ref(u) === deployedPrizeRef)
  poolUtxo = poolUtxos.find(u => ref(u) === deployedPoolRef)
  prizeReferenceUtxo = referenceUtxos.find(u => ref(u) === deployedPrizeReferenceRef)
  poolReferenceUtxo = referenceUtxos.find(u => ref(u) === deployedPoolReferenceRef)
} else {
  // No cross-run artifact is required: locate the already deployed topology directly on Preprod.
  // The native-policy asset IDs are deterministic for this wallet, and the reference scripts
  // are matched by their exact serialized Plutus script bytes.
  prizeUtxo = prizeUtxos.find(u => u.assets[ticketUnit] === 1n)
  poolUtxo = poolUtxos.find(u => u.assets[poolUnit] === 1n && u.assets[liquidityUnit] === TOTAL_LIQUIDITY_USDM)
  const expectedPrizeScript = applyDoubleCborEncoding(scripts.prizeValidator)
  const expectedPoolScript = applyDoubleCborEncoding(scripts.b1PrizePool)
  prizeReferenceUtxo = referenceUtxos.find(u => u.scriptRef?.type === 'PlutusV2' && u.scriptRef.script === expectedPrizeScript)
  poolReferenceUtxo = referenceUtxos.find(u => u.scriptRef?.type === 'PlutusV2' && u.scriptRef.script === expectedPoolScript)
  if (prizeUtxo && poolUtxo && prizeReferenceUtxo && poolReferenceUtxo) {
    bootstrapHash = 'recovered-from-live-preprod'
    prizeReferenceHash = ref(prizeReferenceUtxo).split('#')[0]
    poolReferenceHash = ref(poolReferenceUtxo).split('#')[0]
    deploymentManifest = {
      schema: 'IMMORTAL-PREPROD-DEPLOYMENT-v0.1',
      status: 'DEPLOYED',
      network: 'cardano-preprod',
      walletAddress: address,
      bootstrapHash,
      prizeReferenceHash,
      poolReferenceHash,
      assets: {
        poolUnit,
        liquidityUnit,
        ticketUnit,
        liquidityAmount: TOTAL_LIQUIDITY_USDM.toString(),
      },
      topology: {
        prizeHash: scripts.prizeHash,
        b1PrizePoolHash: scripts.b1PrizePoolHash,
        prizeAddress: scripts.prizeAddress,
        b1PrizePoolAddress: scripts.b1PrizePoolAddress,
      },
      utxos: {
        prize: ref(prizeUtxo),
        pool: ref(poolUtxo),
        prizeReference: ref(prizeReferenceUtxo),
        poolReference: ref(poolReferenceUtxo),
      },
      source: { walletMode, recoveredFromLivePreprod: true },
    }
  }
}

if (!prizeUtxo || !poolUtxo || !prizeReferenceUtxo || !poolReferenceUtxo) {
  throw new Error('Previously deployed Preprod topology could not be resolved; refusing to bootstrap during Reveal')
}
if (!prizeReferenceUtxo.scriptRef || !poolReferenceUtxo.scriptRef) {
  throw new Error('Previously deployed Preprod reference scripts are missing or unresolved')
}

const deployedPrizeDatum = Data.from(prizeUtxo.datum)
if (!(deployedPrizeDatum instanceof Constr) || deployedPrizeDatum.index !== 0 || deployedPrizeDatum.fields.length < 23) {
  throw new Error('Existing Preprod Prize datum has an unexpected shape')
}
if (deployedPrizeDatum.fields[0] !== testPolicyId || deployedPrizeDatum.fields[1] !== TICKET_NAME_HEX) {
  throw new Error('Existing Preprod ticket identity does not match the current topology')
}
if (BigInt(deployedPrizeDatum.fields[3]) !== PRICE_USDM) {
  throw new Error('Existing Preprod ticket price does not match the Reveal profile')
}
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
postPrizeDatum = c(0, [
  testPolicyId, TICKET_NAME_HEX, playerCommitmentHex, PRICE_USDM, commitmentHex,
  deployedGameVersion, 1n, payout, '', '', c(1), toHex(expectedResult),
  BigInt(prizeTier), c(0, [0n, 0n, toHex(MAINCHAIN_REF), deployedGameVersion]),
  c(1), deployedBeaconValueHex, '11'.repeat(32), toHex(MATERIOS_CONTEXT),
  scripts.b1PrizePoolHash, issuedAt, expiresAt, BigInt(row1Tier), BigInt(row2Tier),
])
postPoolDatum = poolDatum(scripts.prizeHash, TOTAL_LIQUIDITY_USDM, 0n, 0n, payout)

console.log(JSON.stringify({
  status: 'DEPLOYMENT_REUSED',
  network: 'cardano-preprod',
  deploymentManifest: DEPLOYMENT_MANIFEST,
  bootstrapHash,
  prizeReferenceHash,
  poolReferenceHash,
  prizeUtxo: ref(prizeUtxo),
  poolUtxo: ref(poolUtxo),
  prizeReferenceUtxo: ref(prizeReferenceUtxo),
  poolReferenceUtxo: ref(poolReferenceUtxo),
}, null, 2))

const preStateFingerprint = hashJson({
  prizeRef: ref(prizeUtxo), prizeDatum: prizeUtxo.datum,
  poolRef: ref(poolUtxo), poolDatum: poolUtxo.datum,
})

const reveal = await lucid.newTx()
  .readFrom([prizeReferenceUtxo, poolReferenceUtxo])
  .collectFrom([prizeUtxo], c(1, [toHex(playerSecret)]))
  .attach.SpendingValidator(scripts.prizeValidator)
  .collectFrom([poolUtxo], c(2, [PRICE_USDM]))
  .attach.SpendingValidator(scripts.b1PrizePool)
  .pay.ToContract(scripts.prizeAddress, { kind: 'inline', value: Data.to(postPrizeDatum) }, prizeUtxo.assets)
  .pay.ToContract(scripts.b1PrizePoolAddress, { kind: 'inline', value: Data.to(postPoolDatum) }, poolUtxo.assets)
  .addSigner(address)
  .validTo(Number(expiresAt))
  .complete()

const signedReveal = await reveal.sign.withWallet().complete()
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
