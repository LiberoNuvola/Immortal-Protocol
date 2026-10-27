import { createHash } from 'node:crypto'
import {
  DexV1Constant,
  DexV2Constant,
  NetworkId,
  PoolV1,
  PoolV2,
  StablePool,
  StableswapConstant,
} from '@minswap/sdk'

const NETWORK = 'cardano-mainnet'
const KOIOS = (process.env.KOIOS_MAINNET_URL ?? 'https://api.koios.rest/api/v1').replace(/\/$/, '')
const ADA_UNIT = 'lovelace'
const MONETA_USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
const USDM_POLICY = MONETA_USDM_UNIT.slice(0, 56)
const USDM_NAME = MONETA_USDM_UNIT.slice(56)
const USDM_DECIMALS = 6
const NETWORK_ID = NetworkId.MAINNET
const V1_POOL_SCRIPT_HASH = bech32ScriptHashToHex(DexV1Constant.POOL_SCRIPT_HASH)
const V1_NFT_POLICY = DexV1Constant.POOL_NFT_POLICY_ID.toLowerCase()
const V2_CONFIG = DexV2Constant.CONFIG[NETWORK_ID]
const V2_POOL_SCRIPT_HASH = V2_CONFIG.poolScriptHash.toLowerCase()
const V2_AUTH_UNIT = V2_CONFIG.poolAuthenAsset.toLowerCase()
const V2_AUTH_POLICY = V2_AUTH_UNIT.slice(0, 56)
const V2_AUTH_NAME = V2_AUTH_UNIT.slice(56)
const PAGE_SIZE = 500
const MAX_UTXOS = 25000

function bech32ScriptHashToHex(value) {
  const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const separator = value.lastIndexOf('1')
  if (separator <= 0 || value.slice(0, separator) !== 'script') throw new Error('MIN​​SWAP_SCRIPT_HASH_BECH32_INVALID'.replaceAll('\u200b', ''))
  const encoded = value.slice(separator + 1)
  if (encoded.length <= 6) throw new Error('MIN​​SWAP_SCRIPT_HASH_BECH32_TOO_SHORT'.replaceAll('\u200b', ''))
  const values = []
  for (const ch of encoded) {
    const n = alphabet.indexOf(ch)
    if (n < 0) throw new Error('MIN​​SWAP_SCRIPT_HASH_BECH32_CHAR_INVALID'.replaceAll('\u200b', ''))
    values.push(n)
  }
  let checksum = 1
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  const expand = []
  for (const ch of value.slice(0, separator)) expand.push(ch.charCodeAt(0) >>> 5)
  expand.push(0)
  for (const ch of value.slice(0, separator)) expand.push(ch.charCodeAt(0) & 31)
  for (const n of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ n
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) checksum ^= generators[i]
  }
  if ((checksum >>> 0) !== 1) throw new Error('MIN​​SWAP_SCRIPT_HASH_BECH32_CHECKSUM_INVALID'.replaceAll('\u200b', ''))
  let accumulator = 0
  let bits = 0
  const bytes = []
  for (const n of values.slice(0, -6)) {
    accumulator = (accumulator << 5) | n
    bits += 5
    while (bits >= 8) {
      bits -= 8
      bytes.push((accumulator >>> bits) & 0xff)
    }
  }
  if (bits >= 5 || ((accumulator << (8 - bits)) & 0xff) !== 0) throw new Error('MIN​​SWAP_SCRIPT_HASH_BECH32_PADDING_INVALID'.replaceAll('\u200b', ''))
  const result = Buffer.from(bytes).toString('hex')
  if (!/^[0-9a-f]{56}$/.test(result)) throw new Error('MIN​​SWAP_SCRIPT_HASH_LENGTH_INVALID'.replaceAll('\u200b', ''))
  return result
}

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function normalizeHex(value) {
  const raw = typeof value === 'string' ? value : value?.bytes
  return typeof raw === 'string' ? raw.replace(/^0x/i, '').toLowerCase() : null
}

function tipSummary(tip) {
  if (!tip || tip.block_no == null || tip.abs_slot == null) throw new Error('KOIOS_MAINNET_TIP_MISSING_FIELDS')
  return {
    blockNo: String(tip.block_no),
    slot: String(tip.abs_slot),
    blockHash: tip.hash ?? tip.block_hash ?? null,
  }
}

async function koiosGet(path) {
  const response = await fetch(KOIOS + path, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('KOIOS_' + path.replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status)
  return response.json()
}

async function koiosPost(path, body) {
  const response = await fetch(KOIOS + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok) throw new Error('KOIOS_' + path.split('?')[0].replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status + ':' + text.slice(0, 250))
  return JSON.parse(text)
}

function decodeAssets(assetList = [], lovelace) {
  const assets = { [ADA_UNIT]: String(lovelace) }
  for (const item of assetList) {
    if (!item || typeof item.policy_id !== 'string' || typeof item.asset_name !== 'string' || item.quantity === undefined) throw new Error('KOIOS_MAINNET_ASSET_ROW_MALFORMED')
    const unit = item.policy_id.toLowerCase() + item.asset_name.toLowerCase()
    if (Object.hasOwn(assets, unit)) throw new Error('KOIOS_MAINNET_DUPLICATE_ASSET_UNIT')
    assets[unit] = String(item.quantity)
  }
  return assets
}

function sdkValue(row) {
  const assets = decodeAssets(row.asset_list, row.value)
  return Object.entries(assets).map(([unit, quantity]) => ({ unit, quantity }))
}

function refOf(row) {
  return {
    txHash: String(row.tx_hash ?? '').toLowerCase(),
    index: Number(row.tx_index),
    address: String(row.address ?? ''),
  }
}

function validateRef(ref) {
  if (!/^[0-9a-f]{64}$/.test(ref.txHash) || !Number.isSafeInteger(ref.index) || ref.index < 0 || !ref.address) throw new Error('KOIOS_MAINNET_OUTREF_INVALID')
}

async function queryAssetUtxos(policy, name) {
  const all = []
  const seen = new Set()
  let offset = 0
  while (true) {
    const rows = await koiosPost('/asset_utxos?limit=' + PAGE_SIZE + '&offset=' + offset, { _asset_list: [[policy, name]], _extended: true })
    if (!Array.isArray(rows)) throw new Error('KOIOS_MAINNET_ASSET_UTXOS_NOT_ARRAY')
    for (const row of rows) {
      const ref = refOf(row)
      validateRef(ref)
      const key = ref.txHash + '#' + ref.index
      if (seen.has(key)) throw new Error('KOIOS_MAINNET_DUPLICATE_OUTREF_ACROSS_PAGES')
      seen.add(key)
      all.push(row)
    }
    if (all.length > MAX_UTXOS) throw new Error('KOIOS_MAINNET_USDM_UTXO_SCAN_EXCEEDS_BOUND')
    if (rows.length < PAGE_SIZE) break
    offset += rows.length
  }
  return all
}

async function requeryExact(address, txHash, index) {
  const rows = await koiosPost('/address_utxos', { _addresses: [address], _extended: true })
  if (!Array.isArray(rows)) throw new Error('KOIOS_MAINNET_ADDRESS_UTXOS_NOT_ARRAY')
  return rows.filter((row) =>
    String(row.tx_hash ?? '').toLowerCase() === txHash &&
    Number(row.tx_index) === index &&
    String(row.address ?? '') === address
  )
}

function exactAdaUsdmPair(pool) {
  const pair = new Set([pool.assetA, pool.assetB])
  return pair.size === 2 && pair.has(ADA_UNIT) && pair.has(MONETA_USDM_UNIT)
}

async function verifyV1(candidate) {
  const matches = await requeryExact(candidate.ref.address, candidate.ref.txHash, candidate.ref.index)
  if (matches.length !== 1) return { protocol: 'Minswap V1', status: 'BLOCKED_OUTREF_NOT_UNIQUELY_LIVE', outRef: candidate.ref.txHash + '#' + candidate.ref.index, exactMatches: matches.length }
  const row = matches[0]
  const assets = decodeAssets(row.asset_list, row.value)
  const originalAssets = decodeAssets(candidate.row.asset_list, candidate.row.value)
  const currentDatumHash = String(row.datum_hash ?? '').toLowerCase()
  const assetsMatch = Object.keys(originalAssets).length === Object.keys(assets).length && Object.entries(originalAssets).every(([unit, quantity]) => assets[unit] === quantity)
  const datumMatches = Boolean(candidate.datumHash && currentDatumHash === candidate.datumHash)
  const nftMatches = (assets[candidate.pool.nft] ?? '0') === '1'
  return {
    protocol: 'Minswap V1',
    status: assetsMatch && datumMatches && nftMatches ? 'OBSERVED_NOT_QUALIFIED' : 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH',
    address: candidate.ref.address,
    outRef: candidate.ref.txHash + '#' + candidate.ref.index,
    assetA: candidate.pool.assetA,
    assetB: candidate.pool.assetB,
    nft: candidate.pool.nft,
    reserveA: String(candidate.pool.reserveA),
    reserveB: String(candidate.pool.reserveB),
    datumHash: currentDatumHash,
    datumHashMatchesFirstRead: datumMatches,
    completeValueMatchesFirstRead: assetsMatch,
    poolNftQuantityOne: nftMatches,
    assets,
  }
}

async function verifyV2(candidate) {
  const matches = await requeryExact(candidate.ref.address, candidate.ref.txHash, candidate.ref.index)
  if (matches.length !== 1) return { protocol: 'Minswap V2', status: 'BLOCKED_OUTREF_NOT_UNIQUELY_LIVE', outRef: candidate.ref.txHash + '#' + candidate.ref.index, exactMatches: matches.length }
  const row = matches[0]
  const assets = decodeAssets(row.asset_list, row.value)
  const originalAssets = decodeAssets(candidate.row.asset_list, candidate.row.value)
  const currentDatum = normalizeHex(row.inline_datum)
  const assetsMatch = Object.keys(originalAssets).length === Object.keys(assets).length && Object.entries(originalAssets).every(([unit, quantity]) => assets[unit] === quantity)
  const datumMatches = Boolean(candidate.datum && currentDatum && candidate.datum === currentDatum)
  return {
    protocol: 'Minswap V2',
    status: assetsMatch && datumMatches ? 'OBSERVED_NOT_QUALIFIED' : 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH',
    address: candidate.ref.address,
    outRef: candidate.ref.txHash + '#' + candidate.ref.index,
    assetA: candidate.pool.assetA,
    assetB: candidate.pool.assetB,
    datumCborHex: candidate.datum,
    datumMatchesFirstRead: datumMatches,
    completeValueMatchesFirstRead: assetsMatch,
    reservesFromDatum: { reserveA: String(candidate.pool.reserveA), reserveB: String(candidate.pool.reserveB) },
    valueReserves: candidate.pool.valueReserves.map((value) => value.toString()),
    fees: { feeA: candidate.pool.feeA.map(String), feeB: candidate.pool.feeB.map(String), feeShare: candidate.pool.feeShare?.map(String) ?? null },
    totalLiquidity: String(candidate.pool.totalLiquidity),
    lpAsset: candidate.pool.lpAsset,
    assets,
  }
}

async function observeStablePool(config) {
  const rows = await koiosPost('/address_utxos', { _addresses: [config.poolAddress], _extended: true })
  if (!Array.isArray(rows)) throw new Error('KOIOS_MAINNET_STABLE_ADDRESS_UTXOS_NOT_ARRAY')
  const pools = rows.filter((row) => {
    const assets = decodeAssets(row.asset_list, row.value)
    return String(row.address ?? '') === config.poolAddress && (assets[config.nftAsset.toLowerCase()] ?? '0') === '1'
  })
  if (pools.length !== 1) {
    return { protocol: 'Minswap StableSwap', status: 'BLOCKED_STABLE_POOL_NFT_NOT_UNIQUE', address: config.poolAddress, nftAsset: config.nftAsset, matches: pools.length, configuredAssets: config.assets }
  }
  const row = pools[0]
  const ref = refOf(row)
  validateRef(ref)
  const datum = normalizeHex(row.inline_datum)
  if (!datum) return { protocol: 'Minswap StableSwap', status: 'BLOCKED_STABLE_POOL_INLINE_DATUM_MISSING', address: config.poolAddress, outRef: ref.txHash + '#' + ref.index, datumHash: row.datum_hash ?? null }
  const value = sdkValue(row)
  const pool = new StablePool.State(NETWORK_ID, ref.address, { txHash: ref.txHash, index: ref.index }, value, datum)
  const matches = await requeryExact(ref.address, ref.txHash, ref.index)
  if (matches.length !== 1) return { protocol: 'Minswap StableSwap', status: 'BLOCKED_STABLE_POOL_OUTREF_NOT_UNIQUELY_LIVE', address: ref.address, outRef: ref.txHash + '#' + ref.index, exactMatches: matches.length }
  const current = matches[0]
  const currentDatum = normalizeHex(current.inline_datum)
  const currentAssets = decodeAssets(current.asset_list, current.value)
  const initialAssets = decodeAssets(row.asset_list, row.value)
  const datumMatches = Boolean(currentDatum && currentDatum === datum)
  const assetsMatch = Object.keys(initialAssets).length === Object.keys(currentAssets).length && Object.entries(initialAssets).every(([unit, quantity]) => currentAssets[unit] === quantity)
  return {
    protocol: 'Minswap StableSwap',
    status: datumMatches && assetsMatch ? 'OBSERVED_NOT_QUALIFIED' : 'BLOCKED_STABLE_POOL_WITNESS_MISMATCH',
    address: ref.address,
    outRef: ref.txHash + '#' + ref.index,
    configuredAssets: config.assets,
    reservesFromDatum: pool.reserves.map(String),
    fee: String(config.fee),
    adminFee: String(config.adminFee),
    feeDenominator: String(config.feeDenominator),
    datumCborHex: datum,
    datumMatchesFirstRead: datumMatches,
    completeValueMatchesFirstRead: assetsMatch,
    assets: currentAssets,
  }
}

async function main() {
  const expectedV1ScriptHash = 'e1317b152faac13426e6a83e06ff88a4d62cce3c1634ab0a5ec13309'
  if (V1_POOL_SCRIPT_HASH !== expectedV1ScriptHash || !/^[0-9a-f]{56}$/.test(V2_POOL_SCRIPT_HASH)) throw new Error('MIN​​SWAP_MAINNET_SCRIPT_CONFIG_INVALID'.replaceAll('\u200b', ''))
  if (MONETA_USDM_UNIT.length !== 56 + 16) throw new Error('MONETA_MAINNET_USDM_UNIT_LENGTH_INVALID')

  const observedAt = new Date().toISOString()
  const rawTipBefore = await koiosGet('/tip')
  const tipBefore = tipSummary(Array.isArray(rawTipBefore) ? rawTipBefore[0] : rawTipBefore)

  const usdmRows = await queryAssetUtxos(USDM_POLICY, USDM_NAME)
  const v1Rows = usdmRows.filter((row) => String(row.payment_cred ?? '').toLowerCase() === V1_POOL_SCRIPT_HASH)
  const v1Pools = []
  let v1Rejected = 0
  for (const row of v1Rows) {
    try {
      const ref = refOf(row)
      validateRef(ref)
      const datumHash = String(row.datum_hash ?? '').toLowerCase()
      if (!/^[0-9a-f]{64}$/.test(datumHash)) throw new Error('MIN​​SWAP_V1_DATUM_HASH_INVALID'.replaceAll('\u200b', ''))
      const pool = new PoolV1.State(ref.address, { txHash: ref.txHash, index: ref.index }, sdkValue(row), datumHash)
      if (exactAdaUsdmPair(pool)) v1Pools.push({ row, ref, pool, datumHash })
    } catch {
      v1Rejected += 1
    }
  }

  const v2Rows = await queryAssetUtxos(V2_AUTH_POLICY, V2_AUTH_NAME)
  const v2CredentialRows = v2Rows.filter((row) => String(row.payment_cred ?? '').toLowerCase() === V2_POOL_SCRIPT_HASH)
  const v2Pools = []
  let v2Rejected = 0
  for (const row of v2CredentialRows) {
    try {
      const ref = refOf(row)
      validateRef(ref)
      if (!normalizeHex(row.inline_datum)) throw new Error('MIN​​SWAP_V2_INLINE_DATUM_MISSING'.replaceAll('\u200b', ''))
      const value = sdkValue(row)
      const pool = new PoolV2.State(NETWORK_ID, ref.address, { txHash: ref.txHash, index: ref.index }, value, normalizeHex(row.inline_datum))
      if ((value.find((item) => item.unit === V2_AUTH_UNIT)?.quantity ?? '0') !== '1') throw new Error('MIN​​SWAP_V2_AUTH_UNIT_QUANTITY_INVALID'.replaceAll('\u200b', ''))
      if (exactAdaUsdmPair(pool)) v2Pools.push({ row, ref, pool, datum: normalizeHex(row.inline_datum) })
    } catch {
      v2Rejected += 1
    }
  }

  const stableConfigs = StableswapConstant.CONFIG[NETWORK_ID]
  const stableConfigsWithMoneta = stableConfigs.filter((config) => config.assets.some((unit) => unit.toLowerCase() === MONETA_USDM_UNIT))
  const exactStableAdaUsdmConfigs = stableConfigs.filter((config) => {
    const pair = new Set(config.assets.map((unit) => unit.toLowerCase()))
    return pair.size === 2 && pair.has(ADA_UNIT) && pair.has(MONETA_USDM_UNIT)
  })
  const stableObservations = []
  for (const config of stableConfigsWithMoneta) stableObservations.push(await observeStablePool(config))

  const v1Observations = []
  for (const candidate of v1Pools) v1Observations.push(await verifyV1(candidate))
  const v2Observations = []
  for (const candidate of v2Pools) v2Observations.push(await verifyV2(candidate))

  const rawTipAfter = await koiosGet('/tip')
  const tipAfter = tipSummary(Array.isArray(rawTipAfter) ? rawTipAfter[0] : rawTipAfter)
  if (BigInt(tipAfter.slot) < BigInt(tipBefore.slot)) throw new Error('KOIOS_MAINNET_TIP_MOVED_BACKWARDS')
  const chainTipUnchanged = tipBefore.slot === tipAfter.slot && tipBefore.blockHash === tipAfter.blockHash
  const observations = [...v1Observations, ...v2Observations, ...stableObservations]
  const mismatches = observations.filter((item) => String(item.status).startsWith('BLOCKED_'))
  let status
  if (mismatches.length) status = 'BLOCKED_MAINNET_POOL_WITNESS_MISMATCH'
  else if (v1Observations.length + v2Observations.length > 0) status = 'LIVE_ADA_MONETA_USDM_POOL_CANDIDATE_OBSERVED_NOT_QUALIFIED'
  else status = 'NO_EXACT_ADA_MONETA_USDM_PAIR_FOUND_IN_MINSWAP_V1_V2'
  const snapshot = {
    schema: 'MINSWAP-MAINNET-MONETA-USDM-POOL-OBSERVATION-v1',
    network: NETWORK,
    status,
    qualification: 'OBSERVED_NOT_QUALIFIED',
    targetPair: { assetA: ADA_UNIT, assetB: MONETA_USDM_UNIT, usdmPolicyId: USDM_POLICY, usdmAssetNameHex: USDM_NAME, usdmDecimals: USDM_DECIMALS },
    discovery: {
      provider: 'Koios Mainnet public API',
      readOnly: true,
      maxAssetUtxoScanRows: MAX_UTXOS,
      v1: { scannedExactUsdmUtxos: usdmRows.length, poolScriptHash: V1_POOL_SCRIPT_HASH, poolCredentialRows: v1Rows.length, parseRejects: v1Rejected, exactAdaUsdmCandidates: v1Pools.length },
      v2: { authAsset: V2_AUTH_UNIT, poolScriptHash: V2_POOL_SCRIPT_HASH, scannedPoolAuthUtxos: v2Rows.length, poolCredentialRows: v2CredentialRows.length, parseRejects: v2Rejected, exactAdaUsdmCandidates: v2Pools.length },
      stableSwap: { configuredPools: stableConfigs.length, livePoolObservationsWithMonetaUsdm: stableObservations, configuredPoolsContainingMonetaUsdm: stableConfigsWithMoneta.length, exactAdaUsdmConfigPairs: exactStableAdaUsdmConfigs.length },
      mainnetMonetaIdentityUsed: true,
      preprodTestAssetUsed: false,
      noSigningOrSubmission: true,
    },
    pools: [...v1Observations, ...v2Observations],
    chainTip: { before: tipBefore, after: tipAfter },
    snapshotConsistency: { chainTipUnchanged, warning: chainTipUnchanged ? null : 'Tip advanced during independent read-only queries; this is a bounded observation interval, not an atomic same-slot snapshot.' },
    observedAt,
    completedAt: new Date().toISOString(),
    guardrails: {
      noUsdUsdmConversionQualified: true,
      noParityAssumption: true,
      noSpotQuoteApproval: true,
      statusNote: 'A live ADA/Moneta-USDM pool is only a candidate market observation. It does not alone qualify USD/USDM conversion; freshness, manipulation bounds, fee treatment, authenticated ADA/USD binding, timestamp/transaction coupling and a governed exact-rational consumer contract remain mandatory.',
    },
  }
  snapshot.evidenceSha256 = sha256(snapshot)
  console.log(JSON.stringify(snapshot, null, 2))
  if (status === 'BLOCKED_MAINNET_POOL_WITNESS_MISMATCH') process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'OBSERVATION_FAILED_CLOSED',
    network: NETWORK,
    error: String(error?.message ?? error).slice(0, 500),
    note: 'Public Koios reads only. No wallet secrets were used, no transaction was built, signed or submitted.',
  }, null, 2))
  process.exitCode = 1
})
