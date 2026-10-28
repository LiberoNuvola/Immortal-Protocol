import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { decodeOracleStateDatum } from './preprod-oracle-state-datum.mjs'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const EVIDENCE_DIR = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const DEPLOYMENT_PATH = process.env.PREPROD_DEPLOYMENT_MANIFEST ??
  EVIDENCE_DIR + '/preprod-direct-usdm-deployment.json'
const ORACLE_STATE_PATH = process.env.PREPROD_ORACLE_STATE_MANIFEST ??
  EVIDENCE_DIR + '/preprod-oracle-state-deployment.json'

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(label + ' is required')
  }
  return value.trim()
}

function exactRef(utxo, label) {
  if (!utxo || typeof utxo.tx_hash !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(utxo.tx_hash) ||
      !Number.isInteger(utxo.tx_index) || utxo.tx_index < 0) {
    throw new Error(label + ' lacks exact Koios tx_hash/tx_index')
  }
  return utxo.tx_hash + '#' + utxo.tx_index
}

function parseRef(value, label) {
  const match = /^([0-9a-fA-F]{64})#(\d+)$/.exec(requiredString(value, label))
  if (!match) throw new Error(label + ' must be an exact txHash#outputIndex reference')
  return { txHash: match[1].toLowerCase(), outputIndex: Number(match[2]) }
}

function unitQuantity(utxo, unit) {
  const policy = unit.slice(0, 56).toLowerCase()
  const assetName = unit.slice(56).toLowerCase()
  const assets = utxo?.asset_list
  if (!Array.isArray(assets)) throw new Error('Koios Oracle State UTxO has malformed asset_list')
  const matches = assets.filter(asset =>
    String(asset?.policy_id ?? '').toLowerCase() === policy &&
    String(asset?.asset_name ?? '').toLowerCase() === assetName,
  )
  if (matches.length === 0) return 0n
  if (matches.length !== 1) throw new Error('Koios returned duplicate Oracle State asset rows')
  return BigInt(matches[0].quantity)
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

async function readTip() {
  const response = await fetch(KOIOS + '/tip')
  if (!response.ok) throw new Error('Koios /tip failed: ' + response.status)
  const value = await response.json()
  const tip = Array.isArray(value) ? value[0] : value
  if (!tip || tip.block_no === undefined || tip.hash === undefined) {
    throw new Error('Koios /tip returned malformed chain-tip evidence')
  }
  return tip
}

const deployment = JSON.parse(await readFile(DEPLOYMENT_PATH, 'utf8'))
const oracle = JSON.parse(await readFile(ORACLE_STATE_PATH, 'utf8'))
const identity = oracle?.oracleState
const configuration = deployment?.oracleConfiguration

if (deployment?.network !== 'cardano-preprod' ||
    deployment?.status !== 'DEPLOYED' ||
    oracle?.network !== 'cardano-preprod' ||
    oracle?.status !== 'MATERIALIZED' ||
    oracle?.authorityKind !== 'DEPLOYMENT_WALLET_SIGNED') {
  throw new Error('Oracle State liveness observer requires the materialized Preprod deployment identity')
}
for (const [key, value] of Object.entries({
  policyId: identity?.policyId,
  tokenNameHex: identity?.tokenNameHex,
  unit: identity?.unit,
  publisherPkh: identity?.publisherPkh,
  address: identity?.address,
  utxo: identity?.utxo,
})) requiredString(value, 'oracleState.' + key)

if (identity.unit.toLowerCase() !==
    (identity.policyId + identity.tokenNameHex).toLowerCase()) {
  throw new Error('Oracle State unit does not match the exact policy/name identity')
}
if (deployment.walletAddress !== identity.address ||
    configuration?.statePolicyId !== identity.policyId ||
    configuration?.stateTokenNameHex !== identity.tokenNameHex ||
    configuration?.publisherPkh !== identity.publisherPkh ||
    configuration?.address !== identity.address ||
    configuration?.utxo !== identity.utxo) {
  throw new Error('Oracle State singleton identity does not match the deployment manifest')
}

const parsed = parseRef(identity.utxo, 'oracleState.utxo')
const rows = await post('/address_info', { _addresses: [identity.address] })
const info = rows?.find(row => row?.address === identity.address) ?? rows?.[0]
if (!info || info.address !== identity.address || !Array.isArray(info.utxo_set)) {
  throw new Error('Koios returned no exact Oracle State address state')
}

const allTokenOutputs = info.utxo_set.filter(utxo => {
  const quantity = unitQuantity(utxo, identity.unit)
  return quantity > 0n
})
if (allTokenOutputs.length !== 1 || unitQuantity(allTokenOutputs[0], identity.unit) !== 1n) {
  throw new Error('Oracle State token is not a unique live singleton at its configured address')
}

const live = allTokenOutputs[0]
const liveRef = exactRef(live, 'Oracle State')
if (liveRef.toLowerCase() !== (parsed.txHash + '#' + parsed.outputIndex).toLowerCase()) {
  throw new Error('Configured Oracle State out-reference is not the exact live singleton; refusing silent identity migration')
}
if (typeof live.inline_datum?.bytes !== 'string' || live.inline_datum.bytes.length === 0) {
  throw new Error('Exact live Oracle State UTxO is missing inline datum CBOR')
}

const decoded = decodeOracleStateDatum(live.inline_datum.bytes, {
  expectedPublisherPkh: identity.publisherPkh,
  expectedAssetPolicyHex: '',
  expectedAssetNameHex: '',
  expectedPriceUsdmSubunitsPerLovelace: 100n,
})
const maxAgeMs = BigInt(requiredString(oracle?.datumSemantics?.maxAgeMs, 'datumSemantics.maxAgeMs'))
if (maxAgeMs <= 0n) throw new Error('Oracle State maxAgeMs must be positive')

const observedAtMs = BigInt(Date.now())
const timestampAgeMs = observedAtMs - decoded.timestampMs
const freshnessStatus = timestampAgeMs < 0n
  ? 'FUTURE_TIMESTAMP'
  : timestampAgeMs <= maxAgeMs
    ? 'FRESH'
    : 'STALE'

const refreshed = {
  ...oracle,
  datumSemantics: {
    ...oracle.datumSemantics,
    assetPolicyHex: decoded.assetPolicyHex,
    assetNameHex: decoded.assetNameHex,
    priceUsdmSubunitsPerLovelace: decoded.priceUsdmSubunitsPerLovelace,
    timestampMs: decoded.timestampMs.toString(),
    maxAgeMs: maxAgeMs.toString(),
  },
  observation: {
    provider: 'Koios',
    address: identity.address,
    utxo: liveRef,
    observedAt: new Date(Number(observedAtMs)).toISOString(),
    chainTip: await readTip(),
    timestampAgeMs: timestampAgeMs.toString(),
    freshnessStatus,
    withinMaxAge: freshnessStatus === 'FRESH',
    interpretation: 'Read-only observation of the exact live singleton; a stale timestamp is recorded, not refreshed or substituted.',
  },
}
delete refreshed.evidenceHash
refreshed.evidenceHash = createHash('sha256')
  .update(JSON.stringify(refreshed, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  ), 'utf8')
  .digest('hex')

await writeFile(ORACLE_STATE_PATH, JSON.stringify(refreshed, null, 2) + '\n')

console.log(JSON.stringify({
  status: 'OBSERVED',
  network: 'cardano-preprod',
  oracleStateUtxo: liveRef,
  timestampMs: decoded.timestampMs.toString(),
  timestampAgeMs: timestampAgeMs.toString(),
  maxAgeMs: maxAgeMs.toString(),
  freshnessStatus,
  withinMaxAge: freshnessStatus === 'FRESH',
  evidenceHash: refreshed.evidenceHash,
  evidenceFile: ORACLE_STATE_PATH,
}, null, 2))
