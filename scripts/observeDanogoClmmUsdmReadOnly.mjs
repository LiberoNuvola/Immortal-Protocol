#!/usr/bin/env node
/**
 * Read-only Danogo CLMM USDM pool observer.
 *
 * Pool NFT policy/script identity and protocol configuration out-ref are pinned
 * from the official dano-finance/clmm-sdk. Candidate pool NFT names are discovered
 * from the same-run SuperCardano exact-USDM indexer artifact. Koios supplies the
 * independent current UTxO/datum/value observation.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const KOIOS = 'https://api.koios.rest/api/v1'
const USDM = {
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
}
const USDM_UNIT = USDM.policyId + USDM.assetNameHex
const DANO_POOL_SCRIPT_HASH_MAINNET = 'd8b69fc53637bcfadbc4469083f706bc293f4d9d2296646c5ca167bb'
const DANO_POOL_SCRIPT_OUT_REF_MAINNET = '64d111b957e7d7848ffdde5149aa77fa4090a7fa1ad0ac108067900614848501#0'
const DANO_PROTOCOL_CONFIG_OUT_REF_MAINNET = '2cafd7c92f7093e5229af274be83dea660b0590b4174bbed79ba662b44fbd1ee#0'
const PAGE_SIZE = 1000
const MAX_PAGES = 10

function sha256(raw) {
  return createHash('sha256').update(raw).digest('hex')
}
function argValue(argv, flag, fallback) {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve(fallback)
}
function constr(value, name) {
  if (!value || value.constructor !== 0 || !Array.isArray(value.fields)) {
    throw new Error(name + '_CONSTR0_INVALID')
  }
  return value.fields
}
function bytes(value, name) {
  if (!value || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error(name + '_BYTES_INVALID')
  }
  return value.bytes.toLowerCase()
}
function integer(value, name) {
  if (!value || typeof value.int !== 'number' && typeof value.int !== 'string' && typeof value.int !== 'bigint') {
    throw new Error(name + '_INT_INVALID')
  }
  const text = String(value.int)
  if (!/^-?\d+$/.test(text)) throw new Error(name + '_INT_INVALID')
  return BigInt(text)
}
function parseAssetClass(value, name) {
  // The official SDK serializes tokenX/tokenY as a two-element Plutus list,
  // not as an AssetClass constructor. Keep the schema exact and fail closed.
  const fields = value && Array.isArray(value.list) ? value.list : null
  if (!fields || fields.length !== 2) throw new Error(name + '_ASSET_CLASS_LIST_INVALID')
  const policyId = bytes(fields[0], name + '_POLICY')
  const assetNameHex = bytes(fields[1], name + '_NAME')
  if (policyId === '' && assetNameHex === '') return { policyId: '', assetNameHex: '', unit: '' }
  if (policyId.length !== 56) throw new Error(name + '_POLICY_LENGTH_INVALID')
  return { policyId, assetNameHex, unit: policyId + assetNameHex }
}
function parseRatio(value, name) {
  const fields = constr(value, name)
  if (fields.length !== 2) throw new Error(name + '_RATIO_FIELDS_INVALID')
  const numerator = integer(fields[0], name + '_NUM')
  const denominator = integer(fields[1], name + '_DEN')
  if (numerator <= 0n || denominator <= 0n) throw new Error(name + '_RATIO_NONPOSITIVE')
  return { numeratorRaw: numerator.toString(), denominatorRaw: denominator.toString() }
}
function parsePoolDatum(value) {
  const fields = constr(value, 'DANO_POOL_DATUM')
  if (fields.length !== 12) throw new Error('DANO_POOL_DATUM_FIELD_COUNT_INVALID')
  const tokenX = parseAssetClass(fields[0], 'TOKEN_X')
  const tokenY = parseAssetClass(fields[1], 'TOKEN_Y')
  const lpFeeRate = integer(fields[2], 'LP_FEE_RATE')
  const platformFeeX = integer(fields[3], 'PLATFORM_FEE_X')
  const platformFeeY = integer(fields[4], 'PLATFORM_FEE_Y')
  const totalSwapFee = integer(fields[5], 'TOTAL_SWAP_FEE')
  const sqrtLowerPrice = parseRatio(fields[6], 'SQRT_LOWER_PRICE')
  const sqrtUpperPrice = parseRatio(fields[7], 'SQRT_UPPER_PRICE')
  const minXChange = integer(fields[8], 'MIN_X_CHANGE')
  const minYChange = integer(fields[9], 'MIN_Y_CHANGE')
  const circulatingLPToken = integer(fields[10], 'CIRCULATING_LP_TOKEN')
  const lastWithdrawEpoch = integer(fields[11], 'LAST_WITHDRAW_EPOCH')
  if (tokenX.unit === tokenY.unit) throw new Error('DANO_POOL_IDENTICAL_PAIR_ASSETS')
  if (lpFeeRate < 0n || lpFeeRate > 10000n) throw new Error('DANO_POOL_LP_FEE_OUT_OF_RANGE')
  for (const [name, n] of Object.entries({ platformFeeX, platformFeeY, totalSwapFee, minXChange, minYChange, circulatingLPToken, lastWithdrawEpoch })) {
    if (n < 0n) throw new Error('DANO_POOL_' + name.toUpperCase() + '_NEGATIVE')
  }
  if (circulatingLPToken <= 0n) throw new Error('DANO_POOL_LP_SUPPLY_NONPOSITIVE')
  const lowerN = BigInt(sqrtLowerPrice.numeratorRaw)
  const lowerD = BigInt(sqrtLowerPrice.denominatorRaw)
  const upperN = BigInt(sqrtUpperPrice.numeratorRaw)
  const upperD = BigInt(sqrtUpperPrice.denominatorRaw)
  if (lowerN * upperD >= upperN * lowerD) throw new Error('DANO_POOL_PRICE_RANGE_INVALID')
  return {
    tokenX, tokenY, lpFeeRate: lpFeeRate.toString(),
    platformFeeXRaw: platformFeeX.toString(),
    platformFeeYRaw: platformFeeY.toString(),
    totalSwapFeeRaw: totalSwapFee.toString(),
    sqrtLowerPrice, sqrtUpperPrice,
    minXChangeRaw: minXChange.toString(),
    minYChangeRaw: minYChange.toString(),
    circulatingLPTokenRaw: circulatingLPToken.toString(),
    lastWithdrawEpoch: lastWithdrawEpoch.toString(),
  }
}
function valueQuantity(utxo, unit) {
  if (unit === '') return BigInt(String(utxo.value ?? '0'))
  const asset = (utxo.asset_list ?? []).find((a) =>
    String(a.policy_id ?? '').toLowerCase() + String(a.asset_name ?? '').toLowerCase() === unit)
  return BigInt(String(asset?.quantity ?? '0'))
}
function keyToNft(pool) {
  const prefix = 'danogo-clmm:'
  const key = String(pool.key ?? '')
  if (!key.startsWith(prefix)) throw new Error('DANO_POOL_KEY_PREFIX_INVALID')
  const unit = key.slice(prefix.length).toLowerCase()
  const policyId = unit.slice(0, 56)
  const assetNameHex = unit.slice(56)
  if (policyId !== DANO_POOL_SCRIPT_HASH_MAINNET || assetNameHex.length === 0) {
    throw new Error('DANO_POOL_NFT_IDENTITY_INVALID')
  }
  return { unit, policyId, assetNameHex }
}
async function fetchAssetUtxos(assetPairs) {
  const pages = []
  const rows = []
  for (let offset = 0; offset < PAGE_SIZE * MAX_PAGES; offset += PAGE_SIZE) {
    const url = KOIOS + '/asset_utxos?limit=' + PAGE_SIZE + '&offset=' + offset
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ _asset_list: assetPairs, _extended: true }),
      signal: AbortSignal.timeout(45_000),
    })
    const rawBody = await response.text()
    const page = {
      url, method: 'POST', status: response.status,
      responseDate: response.headers.get('date'),
      bodySha256: sha256(rawBody), bodyBytes: Buffer.byteLength(rawBody), rawBody,
    }
    pages.push(page)
    if (!response.ok) throw Object.assign(new Error('KOIOS_ASSET_UTXOS_HTTP_' + response.status), { pages })
    const json = JSON.parse(rawBody)
    if (!Array.isArray(json)) throw Object.assign(new Error('KOIOS_ASSET_UTXOS_SHAPE_INVALID'), { pages })
    rows.push(...json)
    if (json.length < PAGE_SIZE) return { rows, pages, paginationComplete: true }
  }
  return { rows, pages, paginationComplete: false }
}

async function main() {
  const argv = process.argv.slice(2)
  const superPath = argValue(argv, '--supercardano', 'audit/indexer/supercardano-usdm-readonly.json')
  const outPath = argValue(argv, '--out', 'audit/oracles/danogo-clmm-usdm-readonly.json')
  const startedAt = new Date().toISOString()
  const supercardano = JSON.parse(await readFile(superPath, 'utf8'))
  if (supercardano.network !== 'cardano-mainnet' || supercardano.unit?.toLowerCase() !== USDM_UNIT) {
    throw new Error('DANO_SUPERCARDANO_INPUT_ASSET_OR_NETWORK_INVALID')
  }
  const pools = (supercardano.pools ?? []).filter((p) => p.venue === 'danogo-clmm')
  const nftMap = new Map()
  for (const pool of pools) {
    const nft = keyToNft(pool)
    if (!nftMap.has(nft.unit)) nftMap.set(nft.unit, { nft, pool })
  }
  const requested = [...nftMap.values()]
  const assetPairs = requested.map(({ nft }) => [nft.policyId, nft.assetNameHex])
  const acquisition = await fetchAssetUtxos(assetPairs)
  const byNft = new Map()
  for (const row of acquisition.rows) {
    for (const asset of row.asset_list ?? []) {
      const unit = String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase()
      if (nftMap.has(unit)) {
        if (!byNft.has(unit)) byNft.set(unit, [])
        byNft.get(unit).push(row)
      }
    }
  }

  const results = []
  for (const { nft, pool } of requested) {
    const rows = byNft.get(nft.unit) ?? []
    if (rows.length === 0) {
      results.push({ status: 'NO_CURRENT_UTXO_FOR_POOL_NFT', nft, poolKey: pool.key, poolHeight: pool.height, poolTime: pool.time })
      continue
    }
    if (rows.length !== 1) {
      results.push({ status: 'POOL_NFT_UTXO_CARDINALITY_INVALID', nft, rowCount: rows.length, poolKey: pool.key })
      continue
    }
    const utxo = rows[0]
    const nftQty = valueQuantity(utxo, nft.unit)
    const paymentCred = String(utxo.payment_cred ?? '').toLowerCase()
    try {
      if (nftQty !== 1n) throw new Error('DANO_POOL_NFT_QUANTITY_NOT_ONE')
      if (!utxo.inline_datum?.value) throw new Error('DANO_POOL_INLINE_DATUM_MISSING')
      const datum = parsePoolDatum(utxo.inline_datum.value)
      if (datum.tokenX.unit !== USDM_UNIT && datum.tokenY.unit !== USDM_UNIT) {
        throw new Error('DANO_POOL_DATUM_USDM_PAIR_MISMATCH')
      }
      const poolA = String(pool.assetA ?? '').toLowerCase()
      const poolB = String(pool.assetB ?? '').toLowerCase()
      const sameOrder = poolA === datum.tokenX.unit && poolB === datum.tokenY.unit
      const reverseOrder = poolA === datum.tokenY.unit && poolB === datum.tokenX.unit
      if (!sameOrder && !reverseOrder) throw new Error('DANO_SUPERCARDANO_DATUM_PAIR_MISMATCH')
      const valueX = valueQuantity(utxo, datum.tokenX.unit)
      const valueY = valueQuantity(utxo, datum.tokenY.unit)
      const scReserveX = BigInt(String(sameOrder ? pool.reserveA : pool.reserveB))
      const scReserveY = BigInt(String(sameOrder ? pool.reserveB : pool.reserveA))
      // Mirror the official SDK's active-reserve convention:
      // subtract platform fees from both assets, and for tokenX=ADA also
      // subtract min ADA (3 ADA) plus totalSwapFee. Reward amount is not
      // available from this pool UTxO alone, so keep it explicitly at zero.
      const platformFeeX = BigInt(datum.platformFeeXRaw)
      const platformFeeY = BigInt(datum.platformFeeYRaw)
      const totalSwapFee = BigInt(datum.totalSwapFeeRaw)
      const excludedAda = datum.tokenX.unit === '' ? 3_000_000n + totalSwapFee : 0n
      const activeReserveX = valueX - platformFeeX - excludedAda
      const activeReserveY = valueY - platformFeeY
      if (activeReserveX < 0n || activeReserveY < 0n) throw new Error('DANO_ACTIVE_RESERVE_NEGATIVE')
      const reserveMatch = activeReserveX === scReserveX && activeReserveY === scReserveY
      const currentEpoch = Math.floor((Date.now() - 1647899091000) / 432_000_000) + 328
      const rewardEpochBehind = datum.tokenX.unit === '' && Number(datum.lastWithdrawEpoch) < currentEpoch
      results.push({
        status: reserveMatch ? 'MATCH' : 'ACTIVE_RESERVE_MISMATCH',
        nft, poolKey: pool.key,
        utxoRef: String(utxo.tx_hash) + '#' + String(utxo.tx_index),
        paymentCredential: paymentCred,
        paymentCredentialMatchesPoolScript: paymentCred === DANO_POOL_SCRIPT_HASH_MAINNET,
        nftQuantityRaw: nftQty.toString(),
        datumHash: utxo.datum_hash ?? null,
        inlineDatumCborHex: utxo.inline_datum.bytes ?? null,
        datum,
        valueReserveXRaw: valueX.toString(),
        valueReserveYRaw: valueY.toString(),
        activeReserveXRaw: activeReserveX.toString(),
        activeReserveYRaw: activeReserveY.toString(),
        supercardanoReserveXRaw: scReserveX.toString(),
        supercardanoReserveYRaw: scReserveY.toString(),
        exactActiveReserveMatch: reserveMatch,
        rewardAmountAssumedRaw: '0',
        rewardAmountRead: false,
        rewardEpochBehind,
        blockHeight: utxo.block_height ?? null,
        blockTime: utxo.block_time ?? null,
        supercardanoPoolHeight: pool.height ?? null,
        supercardanoPoolTime: pool.time ?? null,
        poolFreshnessAtSourceAsOf: pool.freshnessAtSourceAsOf ?? 'NOT_CLASSIFIED',
      })
    } catch (cause) {
      results.push({
        status: 'UNQUALIFIED_DATUM',
        nft, poolKey: pool.key,
        utxoRef: String(utxo.tx_hash) + '#' + String(utxo.tx_index),
        paymentCredential: paymentCred,
        paymentCredentialMatchesPoolScript: paymentCred === DANO_POOL_SCRIPT_HASH_MAINNET,
        nftQuantityRaw: nftQty.toString(),
        datumHash: utxo.datum_hash ?? null,
        inlineDatumCborHex: utxo.inline_datum?.bytes ?? null,
        error: cause instanceof Error ? cause.message : String(cause),
        blockHeight: utxo.block_height ?? null,
        blockTime: utxo.block_time ?? null,
      })
    }
  }

  const evidence = {
    schema: 'immortal-danogo-clmm-usdm-readonly-v1',
    classification: 'DANOGO_CLMM_POOL_NFT_DATUM_AND_VALUE_OBSERVATION_NOT_PRICE_OR_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    exactAsset: USDM,
    source: {
      provider: 'Koios',
      baseUrl: KOIOS,
      officialSdk: 'https://github.com/dano-finance/clmm-sdk',
      officialPoolScriptHash: DANO_POOL_SCRIPT_HASH_MAINNET,
      officialPoolScriptOutRef: DANO_POOL_SCRIPT_OUT_REF_MAINNET,
      officialProtocolConfigOutRef: DANO_PROTOCOL_CONFIG_OUT_REF_MAINNET,
    },
    discoverySource: {
      provider: 'SuperCardano',
      sourceMeta: supercardano.sourceMeta,
      startedAt: supercardano.startedAt,
      completedAt: supercardano.completedAt,
      poolCount: pools.length,
    },
    startedAt,
    completedAt: new Date().toISOString(),
    acquisition: {
      endpoint: '/asset_utxos',
      assetPairsRequested: assetPairs,
      paginationComplete: acquisition.paginationComplete,
      pages: acquisition.pages,
    },
    summary: {
      poolNftsDiscovered: requested.length,
      currentUtxoCount: results.filter((r) => r.utxoRef).length,
      matchedCount: results.filter((r) => r.status === 'MATCH').length,
      unqualifiedCount: results.filter((r) => r.status === 'UNQUALIFIED_DATUM').length,
      missingCurrentUtxoCount: results.filter((r) => r.status === 'NO_CURRENT_UTXO_FOR_POOL_NFT').length,
      cardinalityErrorCount: results.filter((r) => r.status === 'POOL_NFT_UTXO_CARDINALITY_INVALID').length,
      reserveMismatchCount: results.filter((r) => r.status === 'ACTIVE_RESERVE_MISMATCH').length,
      adaPoolsWithPotentialUnverifiedReward: results.filter((r) => r.rewardEpochBehind).length,
      paymentCredentialScriptMatches: results.filter((r) => r.paymentCredentialMatchesPoolScript).length,
    },
    pools: results,
    limitations: [
      'Pool NFT identity is pinned from the official Danogo CLMM SDK mainnet constants; exact policy/name is taken from SuperCardano discovery and independently queried on Koios.',
      'A MATCH confirms current pool NFT UTxO cardinality, inline datum schema, exact USDM pair identity, and active reserve agreement with SuperCardano after subtracting platform fees and (for tokenX=ADA) 3 ADA plus totalSwapFee, following the official SDK convention.',
      'The official SDK can add staking rewards to the ADA-side active reserve when a staking reference UTxO is supplied. This observer does not resolve that separate staking UTxO; rewardAmount is explicitly assumed zero and any pool whose lastWithdrawEpoch is behind the observed epoch is flagged. Do not use this output as an executable quote until rewards are resolved.'
      'Danogo CLMM is concentrated liquidity. A simple reserve ratio is not a price; current tick/range, liquidity and fee state must be decoded and independently calculated before deriving a quote.',
      'SuperCardano is a separate indexer, not an independent DEX venue or USD price source. Its USD display uses DexHunter ADA/USD.',
      'No USD/USDM peg, issuer reserve, oracle qualification, EEV valuation, deployment approval, wallet action, transaction, or chain write is produced.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_DANOGO_CLMM_OBSERVATION_COMPLETE',
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_DANOGO_CLMM_OBSERVATION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
