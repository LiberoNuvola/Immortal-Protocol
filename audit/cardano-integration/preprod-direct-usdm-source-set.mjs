import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const EVIDENCE_DIR = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const DEPLOYMENT_MANIFEST = process.env.PREPROD_DEPLOYMENT_MANIFEST ?? EVIDENCE_DIR + '/preprod-deployment.json'
const TUSDM_UNIT = process.env.PREPROD_TUSDM_UNIT?.trim()

const IMMORTAL_USDM_SUBUNITS_PER_USDM = 100n
const TUSDM_ATOMIC_UNITS_PER_TOKEN = 1_000_000n

function digest(value) {
  return createHash('sha256')
    .update(JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
    .digest('hex')
}

function parseRef(value, field) {
  if (typeof value !== 'string') throw new Error(field + ' must be a string')
  const match = /^([0-9a-fA-F]{64})#(\\d+)$/.exec(value)
  if (!match) throw new Error(field + ' must be an exact txHash#outputIndex reference')
  return { txHash: match[1], outputIndex: Number(match[2]) }
}

function decodeAssets(assetList = [], lovelace) {
  const assets = { lovelace: BigInt(lovelace) }
  for (const asset of assetList) {
    if (!asset || typeof asset.policy_id !== 'string' || typeof asset.asset_name !== 'string' || asset.quantity === undefined) {
      throw new Error('Koios returned malformed asset evidence')
    }
    assets[asset.policy_id + asset.asset_name] = BigInt(asset.quantity)
  }
  return assets
}

async function post(endpoint, body) {
  const response = await fetch(KOIOS + endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('Koios ' + endpoint + ' failed: ' + response.status)
  return response.json()
}

async function tip() {
  const response = await fetch(KOIOS + '/tip')
  if (!response.ok) throw new Error('Koios /tip failed: ' + response.status)
  const value = await response.json()
  return Array.isArray(value) ? value[0] : value
}

if (!TUSDM_UNIT || !/^[0-9a-fA-F]{56,}$/.test(TUSDM_UNIT)) {
  throw new Error('PREPROD_TUSDM_UNIT is required and must be the deployment-approved native-asset unit; no asset identity is invented here')
}

await mkdir(EVIDENCE_DIR, { recursive: true })

let manifest
try {
  manifest = JSON.parse(await readFile(DEPLOYMENT_MANIFEST, 'utf8'))
} catch {
  throw new Error('real Preprod deployment manifest is required')
}

const poolRef = manifest?.utxos?.pool
const poolAddress = manifest?.topology?.b1PrizePoolAddress
const poolTokenUnit = manifest?.assets?.poolUnit

if (!poolRef || !poolAddress || !poolTokenUnit) {
  throw new Error('deployment manifest lacks exact B1 PrizePool identity')
}

const parsedPool = parseRef(poolRef, 'poolRef')
const rows = await post('/address_info', { _addresses: [poolAddress] })
const info = rows?.[0]
if (!info) throw new Error('Koios returned no live B1 PrizePool address state')

const matches = (info.utxo_set ?? []).filter(
  u => u.tx_hash === parsedPool.txHash && u.tx_index === parsedPool.outputIndex,
)
if (matches.length !== 1) {
  throw new Error('exact B1 PrizePool UTxO is not live; cached historical state is stale')
}

const pool = matches[0]
const assets = decodeAssets(pool.asset_list, pool.value)

if (assets[poolTokenUnit] !== 1n) {
  throw new Error('exact live PrizePool UTxO does not contain the deployed Pool singleton')
}

const atomicQuantity = assets[TUSDM_UNIT] ?? 0n
if (atomicQuantity <= 0n) {
  throw new Error('exact live PrizePool UTxO does not contain the deployment-approved physical tUSDM')
}

const eevUsdmSubunits =
  (atomicQuantity * IMMORTAL_USDM_SUBUNITS_PER_USDM) /
  TUSDM_ATOMIC_UNITS_PER_TOKEN

if (eevUsdmSubunits <= 0n) {
  throw new Error('physical tUSDM quantity is below one representable IMMORTAL USDM sub-unit')
}

const sourceSet = {
  schema: 'PRE-RICH-EEV-USDM-DIRECT-V1-SOURCE-SET-v0.1',
  profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
  status: 'OBSERVED_NOT_QUALIFIED',
  network: 'cardano-preprod',
  source: {
    kind: 'CARDANO_LIVE_UTXO',
    provider: 'Koios',
    b1PrizePoolAddress: poolAddress,
    b1PrizePoolUtxo: poolRef,
    poolSingletonUnit: poolTokenUnit,
    directUsdmUnit: TUSDM_UNIT,
  },
  derivation: {
    version: 'direct-usdm-v1',
    ledgerDecimals: 6,
    immortalUsdmSubunitsPerUsdm: '100',
    formula: 'floor(atomicQuantity * 100 / 1000000)',
    atomicQuantity: atomicQuantity.toString(),
    verifiedUsdmSubunits: eevUsdmSubunits.toString(),
    rounding: 'FLOOR',
  },
  freshness: {
    model: 'LIVE_UTXO_REVALIDATION',
    rule: 'The exact source UTxO must be revalidated as unspent at admission time and the Issue transaction must consume the exact txHash#outputIndex. Historical cached UTxO state is stale.',
    stalenessTest: 'Exact out-reference lookup must return exactly one live UTxO immediately before admission.',
  },
  chainTip: await tip(),
  observedAt: new Date().toISOString(),
  deploymentApproval: {
    status: 'PENDING',
    reason: 'Physical source evidence is materialized, but PRE-RICH deployment authority has not yet promoted the configured identity to DEPLOYMENT_APPROVED.',
  },
}

sourceSet.evidenceHash = digest(sourceSet)

const output = EVIDENCE_DIR + '/preprod-direct-usdm-source-set.json'
await writeFile(output, JSON.stringify(sourceSet, null, 2) + '\\n')

console.log(JSON.stringify({
  status: sourceSet.status,
  poolUtxo: poolRef,
  directUsdmUnit: TUSDM_UNIT,
  verifiedUsdmSubunits: eevUsdmSubunits.toString(),
  freshnessModel: sourceSet.freshness.model,
  evidenceFile: output,
  evidenceHash: sourceSet.evidenceHash,
}, null, 2))
