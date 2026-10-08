import {
  Lucid,
  Koios,
  getAddressDetails,
  scriptFromNative,
  mintingPolicyToId,
  validatorToScriptHash,
  validatorToAddress,
  Constr,
  Data,
} from '@lucid-evolution/lucid'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

import { buildScriptsFromLucid } from '../../src/loadValidator'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const SEED = process.env.PREPROD_REVEAL_SEED?.trim()
const EXPECTED_ADDRESS = process.env.PREPROD_WALLET_ADDRESS?.trim()
const TUSDM_UNIT = process.env.PREPROD_TUSDM_UNIT?.trim()
const ORACLE_STATE_POLICY_ID = process.env.PREPROD_ORACLE_STATE_POLICY_ID?.trim()
const ORACLE_STATE_TOKEN_NAME_HEX = process.env.PREPROD_ORACLE_STATE_TOKEN_NAME_HEX?.trim()
const ORACLE_PUBLISHER_PKH = process.env.PREPROD_ORACLE_PUBLISHER_PKH?.trim()
const EVIDENCE_DIR = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const DEPLOYMENT_MANIFEST =
  process.env.PREPROD_DEPLOYMENT_MANIFEST ??
  EVIDENCE_DIR + '/preprod-direct-usdm-deployment.json'
const POOL_TOKEN_NAME_HEX =
  process.env.PREPROD_DIRECT_POOL_TOKEN_NAME_HEX ??
  '504f4f4c2d444952454354'

const IMMORTAL_USDM_SUBUNITS = 100n
const TUSDM_ATOMIC_PER_TOKEN = 1_000_000n
const TARGET_EEV_USDM_SUBUNITS = 100_000n
const PHYSICAL_TUSDM_ATOMS =
  TARGET_EEV_USDM_SUBUNITS * TUSDM_ATOMIC_PER_TOKEN / IMMORTAL_USDM_SUBUNITS
const POOL_LOVELACE = 5_000_000n

function required(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

function validUnit(value, field) {
  const unit = required(value, field)
  if (!/^[0-9a-fA-F]{56,}$/.test(unit)) {
    throw new Error(field + ' must be a valid Cardano native-asset unit')
  }
  return unit
}

function ref(utxo) {
  if (
    !utxo ||
    typeof utxo.txHash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.txHash) ||
    !Number.isInteger(utxo.outputIndex) ||
    utxo.outputIndex < 0
  ) {
    throw new Error('UTxO has no exact Cardano reference')
  }
  return utxo.txHash + '#' + utxo.outputIndex
}

function hashJson(value) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        value,
        (_key, v) => (typeof v === 'bigint' ? v.toString() : v),
      ),
    )
    .digest('hex')
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function safeKoiosUtxos(address) {
  const response = await fetch(KOIOS + '/address_info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _addresses: [address] }),
  })
  if (!response.ok) {
    throw new Error('Koios address_info failed: ' + response.status)
  }
  const rows = await response.json()
  const info = rows?.[0]
  if (!info) return []
  return (info.utxo_set ?? []).map(u => {
    const assets = { lovelace: BigInt(u.value) }
    for (const asset of u.asset_list ?? []) {
      assets[asset.policy_id + (asset.asset_name ?? '')] =
        BigInt(asset.quantity)
    }
    return {
      txHash: u.tx_hash,
      outputIndex: u.tx_index,
      assets,
      address: info.address,
      datum: u.inline_datum?.bytes,
    }
  })
}

async function waitFor(fn, predicate, label) {
  for (let i = 0; i < 60; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(2000)
  }
  throw new Error('Timed out waiting for ' + label)
}

required(SEED, 'PREPROD_REVEAL_SEED')
required(EXPECTED_ADDRESS, 'PREPROD_WALLET_ADDRESS')
validUnit(TUSDM_UNIT, 'PREPROD_TUSDM_UNIT')
required(ORACLE_STATE_POLICY_ID, 'PREPROD_ORACLE_STATE_POLICY_ID')
required(ORACLE_STATE_TOKEN_NAME_HEX, 'PREPROD_ORACLE_STATE_TOKEN_NAME_HEX')
required(ORACLE_PUBLISHER_PKH, 'PREPROD_ORACLE_PUBLISHER_PKH')
validUnit(TUSDM_UNIT, 'PREPROD_TUSDM_UNIT')

if (TUSDM_UNIT.length < 56 || !/^[0-9a-fA-F]+$/.test(POOL_TOKEN_NAME_HEX)) {
  throw new Error('deployment asset configuration is malformed')
}
if (POOL_TOKEN_NAME_HEX.length === 0 || POOL_TOKEN_NAME_HEX.length % 2 !== 0) {
  throw new Error('PREPROD_DIRECT_POOL_TOKEN_NAME_HEX must be even-length hex')
}

await mkdir(EVIDENCE_DIR, { recursive: true })

try {
  await readFile(DEPLOYMENT_MANIFEST, 'utf8')
  throw new Error(
    'direct-USDM deployment manifest already exists; refusing duplicate bootstrap',
  )
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}

const provider = new Koios(KOIOS)
provider.awaitTx = async txHash => {
  await waitFor(
    async () => {
      const response = await fetch(KOIOS + '/tx_info', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ _tx_hashes: [txHash] }),
      })
      if (!response.ok) {
        throw new Error('Koios tx_info failed: ' + response.status)
      }
      return response.json()
    },
    rows => Array.isArray(rows) && rows.some(row => row?.tx_hash === txHash),
    'transaction ' + txHash,
  )
  return true
}

const lucid = await Lucid(provider, 'Preprod')
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()
if (address !== EXPECTED_ADDRESS) {
  throw new Error('PREPROD_REVEAL_SEED resolves to unexpected wallet address')
}

const details = getAddressDetails(address)
const walletKeyHash = details.paymentCredential?.hash
if (!walletKeyHash) throw new Error('Preprod wallet has no payment credential')

const walletUtxos = await provider.getUtxos(address)
const walletLovelace = walletUtxos.reduce(
  (sum, u) => sum + (u.assets?.lovelace ?? 0n),
  0n,
)
const walletTusdm = walletUtxos.reduce(
  (sum, u) => sum + (u.assets?.[TUSDM_UNIT] ?? 0n),
  0n,
)

console.log(
  JSON.stringify(
    {
      network: 'cardano-preprod',
      walletAddress: address,
      walletAddressVerified: address === EXPECTED_ADDRESS,
      walletLovelace: walletLovelace.toString(),
      directUsdmUnit: TUSDM_UNIT,
      directUsdmAtomicBalance: walletTusdm.toString(),
      requiredDirectUsdmAtomic: PHYSICAL_TUSDM_ATOMS.toString(),
      targetEevUsdmSubunits: TARGET_EEV_USDM_SUBUNITS.toString(),
    },
    null,
    2,
  ),
)

if (walletLovelace < 20_000_000n) {
  throw new Error('wallet needs at least 20 ADA before direct-USDM bootstrap')
}
if (walletTusdm < PHYSICAL_TUSDM_ATOMS) {
  throw new Error(
    'wallet does not contain enough deployment-approved physical tUSDM; fund the wallet first and rerun',
  )
}

const poolPolicy = scriptFromNative({
  type: 'all',
  scripts: [{ type: 'sig', keyHash: walletKeyHash }],
})
const poolTokenPolicyId = mintingPolicyToId(poolPolicy)
const poolTokenUnit = poolTokenPolicyId + POOL_TOKEN_NAME_HEX

const lucidCompat = {
  ...lucid,
  utils: {
    validatorToScriptHash,
    mintingPolicyToId,
    validatorToAddress: script => validatorToAddress('Preprod', script),
  },
}

const scripts = buildScriptsFromLucid(
  lucidCompat,
  undefined,
  ORACLE_PUBLISHER_PKH,
  ORACLE_STATE_POLICY_ID,
  ORACLE_STATE_TOKEN_NAME_HEX,
  poolTokenPolicyId,
  POOL_TOKEN_NAME_HEX,
)

if (!scripts.b1PrizePoolAddress || !scripts.prizeAddress) {
  throw new Error('failed to derive direct-USDM B1 topology')
}

const existingPool = (await provider.getUtxos(scripts.b1PrizePoolAddress))
  .filter(u => (u.assets?.[poolTokenUnit] ?? 0n) > 0n)

if (existingPool.length !== 0) {
  throw new Error(
    'derived direct-USDM Pool address already contains the Pool singleton; refusing duplicate deployment',
  )
}

const prizeHash = scripts.prizeHash

const poolDatum = new Constr(0, [
  TARGET_EEV_USDM_SUBUNITS,
  0n,
  0n,
  0n,
  0n,
  10_000n,
  0n,
  prizeHash,
])

const bootstrap = await lucid
  .newTx()
  .mintAssets({ [poolTokenUnit]: 1n }, Data.void())
  .attach.MintingPolicy(poolPolicy)
  .pay.ToContract(
    scripts.b1PrizePoolAddress,
    { kind: 'inline', value: Data.to(poolDatum) },
    {
      lovelace: POOL_LOVELACE,
      [poolTokenUnit]: 1n,
      [TUSDM_UNIT]: PHYSICAL_TUSDM_ATOMS,
    },
  )
  .addSigner(address)
  .complete()

const signed = await bootstrap.sign.withWallet().complete()
const cbor = signed.toCBOR()
const txBytes = Buffer.from(cbor, 'hex').length
const txHash = await signed.submit()
await lucid.awaitTx(txHash)

const poolUtxo = await waitFor(
  () => provider.getUtxos(scripts.b1PrizePoolAddress),
  xs =>
    xs.filter(
      u =>
        u.assets?.[poolTokenUnit] === 1n &&
        u.assets?.[TUSDM_UNIT] === PHYSICAL_TUSDM_ATOMS,
    ),
  'direct-USDM PrizePool UTxO',
)

const matches = poolUtxo.filter(
  u =>
    u.assets?.[poolTokenUnit] === 1n &&
    u.assets?.[TUSDM_UNIT] === PHYSICAL_TUSDM_ATOMS,
)

if (matches.length !== 1) {
  throw new Error(
    'direct-USDM bootstrap did not produce exactly one expected Pool UTxO',
  )
}

const pool = matches[0]

const manifest = {
  schema: 'IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1',
  status: 'DEPLOYED',
  network: 'cardano-preprod',
  profileCandidate: 'PRE-RICH-EEV-USDM-DIRECT-V1',
  walletAddress: address,
  bootstrap: {
    txHash,
    transactionBytes: txBytes,
  },
  assets: {
    poolTokenPolicyId,
    poolTokenNameHex: POOL_TOKEN_NAME_HEX,
    poolUnit: poolTokenUnit,
    directUsdmUnit: TUSDM_UNIT,
    physicalDirectUsdmAtomicAmount: PHYSICAL_TUSDM_ATOMS.toString(),
    verifiedUsdmSubunits: TARGET_EEV_USDM_SUBUNITS.toString(),
  },
  oracleConfiguration: {
    statePolicyId: ORACLE_STATE_POLICY_ID,
    stateTokenNameHex: ORACLE_STATE_TOKEN_NAME_HEX,
    publisherPkh: ORACLE_PUBLISHER_PKH,
    note: 'retained only because current B1 script factories require Oracle State parameterization; direct-USDM EEV itself performs no oracle valuation',
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
    pool: ref(pool),
  },
  eevSource: {
    sourceKind: 'CARDANO_LIVE_UTXO',
    sourcePoolUtxo: ref(pool),
    assetUnit: TUSDM_UNIT,
    derivationVersion: 'direct-usdm-v1',
    formula: 'floor(atomicQuantity * 100 / 1000000)',
    physicalAtomicQuantity: PHYSICAL_TUSDM_ATOMS.toString(),
    eevUsdmSubunits: TARGET_EEV_USDM_SUBUNITS.toString(),
  },
}

manifest.evidenceHash = hashJson(manifest)

await writeFile(
  DEPLOYMENT_MANIFEST,
  JSON.stringify(manifest, null, 2) + '\n',
)

console.log(
  JSON.stringify(
    {
      status: manifest.status,
      network: manifest.network,
      profileCandidate: manifest.profileCandidate,
      txHash,
      poolUtxo: ref(pool),
      b1PrizePoolAddress: scripts.b1PrizePoolAddress,
      b1PrizePoolHash: scripts.b1PrizePoolHash,
      directUsdmUnit: TUSDM_UNIT,
      physicalDirectUsdmAtomicAmount:
        PHYSICAL_TUSDM_ATOMS.toString(),
      verifiedUsdmSubunits:
        TARGET_EEV_USDM_SUBUNITS.toString(),
      manifest: DEPLOYMENT_MANIFEST,
      evidenceHash: manifest.evidenceHash,
    },
    null,
    2,
  ),
)
