import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { Data } from '@lucid-evolution/lucid'
import { blake2b } from '@noble/hashes/blake2b.js'

const KOIOS = process.env.KOIOS_MAINNET_URL ?? 'https://api.koios.rest/api/v1'
const OUTPUT = process.env.MINSWAP_EVIDENCE_OUTPUT ??
  'audit/cardano-integration/evidence/minswap-v2-usdm-ada-pool-observation.json'

const POLICY = 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c'
const POOL_SCRIPT_HASH = 'ea07b733d932129c378af627436e7cbc2ef0bf96e0036bb51b3bde6b'
const POOL_AUTH_NAME = '4d5350' // "MSP"
const LP_NAME = '7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171'
const ADA_POLICY = ''
const ADA_NAME = ''
const USDM_POLICY = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad'
const USDM_NAME = '0014df105553444d'
const MIN_POOL_ADA = 4_500_000n
const DEFAULT_BURN_LIQUIDITY = 10n
const MAX_INT64 = 9_223_372_036_854_775_807n
const PAGE_SIZE = 500
const MAX_PAGES = 20

const lpUnit = POLICY + LP_NAME
const authUnit = POLICY + POOL_AUTH_NAME
const usdmUnit = USDM_POLICY + USDM_NAME

function fail(code, detail = '') {
  throw new Error(detail ? code + ':' + detail : code)
}

function normalizedHex(value, label, expectedBytes = null) {
  if (typeof value !== 'string' || !/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
    fail('INVALID_HEX_FIELD', label)
  }
  const hex = value.toLowerCase()
  if (expectedBytes !== null && hex.length !== expectedBytes * 2) {
    fail('HEX_FIELD_LENGTH_MISMATCH', label)
  }
  return hex
}

function parseRef(row, label) {
  const hash = String(row?.tx_hash ?? '').toLowerCase()
  const index = Number(row?.tx_index)
  if (!/^[0-9a-f]{64}$/.test(hash) || !Number.isSafeInteger(index) || index < 0) {
    fail('UTXO_REFERENCE_MALFORMED', label)
  }
  return hash + '#' + index
}

function parseContentRange(value) {
  if (typeof value !== 'string') fail('KOIOS_CONTENT_RANGE_MISSING')
  const match = /^(?:(\d+)-(\d+)|\*)\/(\d+|\*)$/.exec(value.trim())
  if (!match || match[3] === '*') fail('KOIOS_CONTENT_RANGE_INVALID', value)
  const first = match[1] === undefined ? null : Number(match[1])
  const last = match[2] === undefined ? null : Number(match[2])
  const total = Number(match[3])
  if (!Number.isSafeInteger(total) || total < 0 ||
      (first !== null && !Number.isSafeInteger(first)) ||
      (last !== null && !Number.isSafeInteger(last))) {
    fail('KOIOS_CONTENT_RANGE_UNSAFE', value)
  }
  return { first, last, total, raw: value.trim() }
}

async function jsonRequest(endpoint, { method = 'GET', body, offset = null, pageSize = PAGE_SIZE } = {}) {
  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    Prefer: 'count=exact',
    ...(process.env.KOIOS_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KOIOS_API_TOKEN } : {}),
  }
  if (offset !== null) headers.Range = offset + '-' + (offset + pageSize - 1)
  const url = KOIOS.replace(/\/$/, '') + endpoint
  const bodyText = body === undefined ? undefined : JSON.stringify(body)
  const maxAttempts = 4

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response
    try {
      response = await fetch(url, {
        method,
        headers,
        ...(bodyText === undefined ? {} : { body: bodyText }),
        redirect: 'error',
        signal: AbortSignal.timeout(25_000),
      })
    } catch (error) {
      if (attempt + 1 >= maxAttempts) {
        fail('KOIOS_NETWORK_ERROR', endpoint + ':' + String(error).slice(0, 250))
      }
      await new Promise(resolve => setTimeout(resolve, 2_000 * (2 ** attempt)))
      continue
    }

    const text = await response.text()
    if (!response.ok) {
      const retryable = response.status === 429 || [500, 502, 503, 504].includes(response.status)
      if (retryable && attempt + 1 < maxAttempts) {
        const retryAfter = response.headers.get('retry-after')
        const retryAfterSeconds = retryAfter && /^\d+$/.test(retryAfter.trim())
          ? Number(retryAfter.trim())
          : retryAfter && Number.isFinite(Date.parse(retryAfter))
            ? Math.max(0, (Date.parse(retryAfter) - Date.now()) / 1000)
            : null
        const fallbackMs = response.status === 429
          ? Math.min(15_000 * (2 ** attempt), 60_000)
          : Math.min(2_000 * (2 ** attempt), 15_000)
        const delayMs = retryAfterSeconds === null
          ? fallbackMs
          : Math.max(fallbackMs, Math.min(120_000, retryAfterSeconds * 1000))
        console.warn(JSON.stringify({
          event: 'KOIOS_RETRY',
          endpoint,
          status: response.status,
          attempt: attempt + 1,
          delayMs,
        }))
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
      fail('KOIOS_HTTP_ERROR', endpoint + ':' + response.status + ':' + text.slice(0, 400))
    }

    let json
    try {
      json = JSON.parse(text)
    } catch {
      fail('KOIOS_RESPONSE_NOT_JSON', endpoint)
    }
    return { json, text, headers: response.headers, status: response.status, attempts: attempt + 1 }
  }
  fail('KOIOS_RETRY_LOOP_EXHAUSTED', endpoint)
}

function exactTip(value) {
  const row = Array.isArray(value) ? value[0] : value
  const hash = String(row?.hash ?? '').toLowerCase()
  const blockHeight = Number(row?.block_no ?? row?.block_height)
  const absSlot = Number(row?.abs_slot ?? row?.absolute_slot)
  const blockTime = Number(row?.block_time)
  if (!/^[0-9a-f]{64}$/.test(hash) ||
      !Number.isSafeInteger(blockHeight) || blockHeight < 0 ||
      !Number.isSafeInteger(absSlot) || absSlot < 0 ||
      !Number.isSafeInteger(blockTime) || blockTime < 0) {
    fail('KOIOS_TIP_NOT_EXACT')
  }
  return { hash, blockHeight, absSlot, blockTime }
}

async function readTip() {
  const response = await jsonRequest('/tip')
  return exactTip(response.json)
}

function assetList(row, label) {
  if (!Array.isArray(row?.asset_list)) fail('KOIOS_ASSET_LIST_MISSING', label)
  const result = new Map()
  for (const asset of row.asset_list) {
    const policyId = normalizedHex(String(asset?.policy_id ?? ''), label + '.policy_id', 28)
    const assetName = normalizedHex(String(asset?.asset_name ?? ''), label + '.asset_name')
    if (assetName.length > 64) fail('ASSET_NAME_TOO_LONG', label)
    const quantity = BigInt(String(asset?.quantity ?? ''))
    if (quantity < 0n) fail('NEGATIVE_ASSET_QUANTITY', label)
    const unit = policyId + assetName
    if (result.has(unit)) fail('DUPLICATE_ASSET_UNIT', unit)
    result.set(unit, quantity)
  }
  return result
}

function quantityOf(assets, unit) {
  return assets.get(unit) ?? 0n
}

function sha3Hex(hex) {
  return createHash('sha3-256').update(Buffer.from(hex, 'hex')).digest('hex')
}

function computeLpName(assetA, assetB) {
  const a = sha3Hex(assetA.policyId + assetA.assetName)
  const b = sha3Hex(assetB.policyId + assetB.assetName)
  return sha3Hex(a + b)
}

function cborConstr(value, expectedIndex, expectedFields, label) {
  if (!value || typeof value !== 'object' ||
      Number(value.index ?? value.constr) !== expectedIndex ||
      !Array.isArray(value.fields) ||
      (expectedFields !== null && value.fields.length !== expectedFields)) {
    fail('PLUTUS_CONSTR_SHAPE_INVALID', label)
  }
  return value.fields
}

function dataInteger(value, label) {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value)
  if (value && typeof value === 'object' && 'int' in value) {
    try { return BigInt(String(value.int)) } catch { /* fail below */ }
  }
  fail('PLUTUS_INTEGER_INVALID', label)
}

function dataBytes(value, label) {
  if (typeof value === 'string') return normalizedHex(value, label)
  if (value && typeof value === 'object' && 'bytes' in value) {
    return normalizedHex(String(value.bytes), label)
  }
  fail('PLUTUS_BYTESTRING_INVALID', label)
}

function decodeAsset(value, label) {
  const fields = cborConstr(value, 0, 2, label)
  return {
    policyId: dataBytes(fields[0], label + '.policyId'),
    assetName: dataBytes(fields[1], label + '.assetName'),
  }
}

function decodeOption(value, label) {
  const index = Number(value?.index ?? value?.constr)
  if (index === 0 && Array.isArray(value.fields) && value.fields.length === 1) {
    return { kind: 'Some', value: dataInteger(value.fields[0], label + '.value').toString() }
  }
  if (index === 1 && Array.isArray(value.fields) && value.fields.length === 0) {
    return { kind: 'None' }
  }
  fail('PLUTUS_OPTION_INVALID', label)
}

function decodeBool(value, label) {
  const index = Number(value?.index ?? value?.constr)
  if (index === 0 && Array.isArray(value.fields) && value.fields.length === 0) return false
  if (index === 1 && Array.isArray(value.fields) && value.fields.length === 0) return true
  fail('PLUTUS_BOOL_INVALID', label)
}

function decodePoolDatum(bytes, datumHash) {
  const actualHash = Buffer.from(
    blake2b(Buffer.from(bytes, 'hex'), { dkLen: 32 }),
  ).toString('hex')
  if (datumHash && actualHash !== datumHash) fail('DATUM_HASH_MISMATCH', actualHash + '!=' + datumHash)

  let decoded
  try { decoded = Data.from(bytes) } catch (error) {
    fail('POOL_DATUM_CBOR_DECODE_FAILED', String(error).slice(0, 250))
  }
  const fields = cborConstr(decoded, 0, 10, 'PoolDatum')
  return {
    assetA: decodeAsset(fields[1], 'PoolDatum.assetA'),
    assetB: decodeAsset(fields[2], 'PoolDatum.assetB'),
    totalLiquidity: dataInteger(fields[3], 'PoolDatum.totalLiquidity'),
    reserveA: dataInteger(fields[4], 'PoolDatum.reserveA'),
    reserveB: dataInteger(fields[5], 'PoolDatum.reserveB'),
    baseFeeANumerator: dataInteger(fields[6], 'PoolDatum.baseFeeANumerator'),
    baseFeeBNumerator: dataInteger(fields[7], 'PoolDatum.baseFeeBNumerator'),
    feeSharingNumerator: decodeOption(fields[8], 'PoolDatum.feeSharingNumerator'),
    allowDynamicFee: decodeBool(fields[9], 'PoolDatum.allowDynamicFee'),
  }
}

function decimalRatio(numerator, denominator, places = 12) {
  if (denominator === 0n) fail('ZERO_PRICE_DENOMINATOR')
  const scale = 10n ** BigInt(places)
  const scaled = (numerator * scale) / denominator
  const whole = scaled / scale
  const fraction = (scaled % scale).toString().padStart(places, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

function findAssetUtxo(rows, unit) {
  const matches = rows.filter((row) => {
    const assets = assetList(row, parseRef(row, 'asset_utxo'))
    return row.payment_cred?.toLowerCase() === POOL_SCRIPT_HASH &&
      quantityOf(assets, authUnit) === 1n &&
      quantityOf(assets, unit) > 0n
  })
  if (matches.length !== 1) {
    fail('EXACT_POOL_OUTPUT_NOT_UNIQUE', 'matches=' + matches.length)
  }
  return matches[0]
}

function verifyPoolOutput(row, datumBytes) {
  const ref = parseRef(row, 'exact_pool_output')
  const paymentCred = String(row.payment_cred ?? '').toLowerCase()
  if (paymentCred !== POOL_SCRIPT_HASH) fail('POOL_PAYMENT_CREDENTIAL_MISMATCH', paymentCred)
  if (row.is_spent !== false) fail('POOL_OUTPUT_NOT_CURRENT_UNSPENT', ref)

  const assets = assetList(row, ref)
  if (quantityOf(assets, authUnit) !== 1n) fail('POOL_AUTH_TOKEN_NOT_SINGLETON', ref)
  const lpLocked = quantityOf(assets, lpUnit)
  if (lpLocked <= 0n) fail('POOL_LP_ASSET_MISSING', ref)

  const datumHash = row.datum_hash == null ? null :
    normalizedHex(String(row.datum_hash), 'datum_hash', 32)
  const datum = decodePoolDatum(datumBytes, datumHash)

  const isAdaA = datum.assetA.policyId === ADA_POLICY && datum.assetA.assetName === ADA_NAME
  const isAdaB = datum.assetB.policyId === ADA_POLICY && datum.assetB.assetName === ADA_NAME
  const isUsdmA = datum.assetA.policyId === USDM_POLICY && datum.assetA.assetName === USDM_NAME
  const isUsdmB = datum.assetB.policyId === USDM_POLICY && datum.assetB.assetName === USDM_NAME
  if (!((isAdaA && isUsdmB) || (isAdaB && isUsdmA))) fail('POOL_DATUM_ASSET_PAIR_MISMATCH')

  const computedLpName = computeLpName(datum.assetA, datum.assetB)
  if (computedLpName !== LP_NAME) fail('LP_ASSET_NAME_DERIVATION_MISMATCH', computedLpName)

  if (datum.totalLiquidity <= DEFAULT_BURN_LIQUIDITY || datum.totalLiquidity >= MAX_INT64) {
    fail('POOL_TOTAL_LIQUIDITY_OUT_OF_RANGE', datum.totalLiquidity.toString())
  }
  const expectedPoolHeldLp = MAX_INT64 - (datum.totalLiquidity - DEFAULT_BURN_LIQUIDITY)
  if (lpLocked !== expectedPoolHeldLp) {
    fail('POOL_LOCKED_LP_QUANTITY_MISMATCH', lpLocked + '!=' + expectedPoolHeldLp)
  }

  const lovelace = BigInt(String(row.value ?? ''))
  if (lovelace < MIN_POOL_ADA) fail('POOL_MIN_ADA_MISSING')
  const valueAdaReserve = lovelace - MIN_POOL_ADA

  const valueAssets = new Map(assets)
  const ledgerUsdmReserve = quantityOf(valueAssets, usdmUnit)
  const ledgerAdaReserve = valueAdaReserve
  const datumUsdmReserve = isUsdmA ? datum.reserveA : datum.reserveB
  const datumAdaReserve = isAdaA ? datum.reserveA : datum.reserveB

  // Minswap V2 intentionally tracks two reserve views:
  // - PoolDatum reserves are the swap-curve reserves.
  // - physical Value reserves can exceed datum reserves by earned fee /
  //   profit-sharing surplus. The official validator passes both separately
  //   into BatchingPool and defines fee-sharing withdrawals as Value - Datum.
  const adaValueMinusDatum = ledgerAdaReserve - datumAdaReserve
  const usdmValueMinusDatum = ledgerUsdmReserve - datumUsdmReserve
  if (adaValueMinusDatum < 0n || usdmValueMinusDatum < 0n) {
    fail(
      'POOL_DATUM_RESERVE_EXCEEDS_VALUE_RESERVE',
      'ada=' + adaValueMinusDatum + ',usdm=' + usdmValueMinusDatum,
    )
  }

  const [assetAValue, assetBValue] = isAdaA
    ? [ledgerAdaReserve, ledgerUsdmReserve]
    : [ledgerUsdmReserve, ledgerAdaReserve]
  const datumReserveA = isAdaA ? datumAdaReserve : datumUsdmReserve
  const datumReserveB = isAdaA ? datumUsdmReserve : datumAdaReserve
  const valueReserveA = isAdaA ? ledgerAdaReserve : ledgerUsdmReserve
  const valueReserveB = isAdaA ? ledgerUsdmReserve : ledgerAdaReserve

  const expectedAssetUnits = new Set([authUnit, lpUnit, usdmUnit])
  if (assets.size !== expectedAssetUnits.size ||
      [...assets.keys()].some((unit) => !expectedAssetUnits.has(unit))) {
    fail('POOL_OUTPUT_CONTAINS_UNEXPECTED_NATIVE_ASSETS', [...assets.keys()].join(','))
  }

  const adaPerUsdm = decimalRatio(datumAdaReserve, datumUsdmReserve)
  const usdmPerAda = decimalRatio(datumUsdmReserve, datumAdaReserve)
  const physicalAdaPerUsdm = decimalRatio(ledgerAdaReserve, ledgerUsdmReserve)
  const physicalUsdmPerAda = decimalRatio(ledgerUsdmReserve, ledgerAdaReserve)
  return {
    ref,
    address: row.address,
    paymentCredential: paymentCred,
    blockHeight: Number(row.block_height),
    blockTime: Number(row.block_time),
    lovelaceIncludingMinPoolAda: lovelace.toString(),
    minPoolAdaLovelace: MIN_POOL_ADA.toString(),
    datumHash,
    calculatedDatumHash: Buffer.from(blake2b(Buffer.from(datumBytes, 'hex'), { dkLen: 32 })).toString('hex'),
    datumCborBytesHexLength: datumBytes.length,
    datum: {
      assetA: datum.assetA,
      assetB: datum.assetB,
      totalLiquidity: datum.totalLiquidity.toString(),
      reserveA: datum.reserveA.toString(),
      reserveB: datum.reserveB.toString(),
      baseFeeANumerator: datum.baseFeeANumerator.toString(),
      baseFeeBNumerator: datum.baseFeeBNumerator.toString(),
      feeSharingNumerator: datum.feeSharingNumerator,
      allowDynamicFee: datum.allowDynamicFee,
    },
    ledgerValue: {
      assetAReserve: assetAValue.toString(),
      assetBReserve: assetBValue.toString(),
      lockedPoolAuthToken: quantityOf(assets, authUnit).toString(),
      poolHeldLpQuantity: lpLocked.toString(),
      reserveViews: {
        datumCurve: {
          assetA: datumReserveA.toString(),
          assetB: datumReserveB.toString(),
        },
        physicalValue: {
          assetA: valueReserveA.toString(),
          assetB: valueReserveB.toString(),
        },
        physicalValueMinusDatum: {
          assetA: (valueReserveA - datumReserveA).toString(),
          assetB: (valueReserveB - datumReserveB).toString(),
          interpretation: 'Minswap V2 Value-minus-Datum reserve surplus; validator fee-sharing withdrawal computes Datum - Value as the exact removal delta.',
        },
      },
    },
    reconciliation: {
      lpAssetNameRecomputedFromExactDatumPair: computedLpName,
      lpAssetMatchesCanonicalPoolIdentifier: computedLpName === LP_NAME,
      poolHeldLpFormulaMatchesOfficialValidator: lpLocked === expectedPoolHeldLp,
      adaValueReserveMatchesLedgerValueAfterMinimumAda: ledgerAdaReserve === valueAdaReserve,
      usdmValueReserveMatchesLedgerAssetQuantity: ledgerUsdmReserve === quantityOf(valueAssets, usdmUnit),
      datumReservesDoNotExceedPhysicalValueReserves: adaValueMinusDatum >= 0n && usdmValueMinusDatum >= 0n,
      exactNativeAssetSetMatchesPoolValidator: true,
    },
    poolSpotReserveRatio: {
      source: 'POOL_DATUM_SWAP_CURVE_RESERVES',
      adaPerUsdm: adaPerUsdm,
      usdmPerAda: usdmPerAda,
      warning: 'Datum reserve ratio only; not an executable quote, TWAP, or USD/USDM price.',
    },
    physicalValueReserveRatio: {
      adaPerUsdm: physicalAdaPerUsdm,
      usdmPerAda: physicalUsdmPerAda,
      warning: 'Physical Value reserve ratio includes Value-minus-Datum surplus and is not the datum swap-curve ratio or an executable quote.',
    },
  }
}

function normalizeUtxo(row, label) {
  parseRef(row, label)
  if (typeof row?.address !== 'string' || !row.address) fail('UTXO_ADDRESS_MISSING', label)
  const paymentCred = String(row.payment_cred ?? '').toLowerCase()
  if (!/^[0-9a-f]{56}$/.test(paymentCred)) fail('UTXO_PAYMENT_CREDENTIAL_INVALID', label)
  return { ...row, payment_cred: paymentCred }
}

async function fetchAssetUtxos() {
  const all = []
  let offset = 0
  let total = null
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await jsonRequest('/asset_utxos?limit=' + PAGE_SIZE +
      '&offset=' + offset + '&order=tx_hash.asc,tx_index.asc', {
      method: 'POST',
      body: { _asset_list: [[POLICY, LP_NAME]], _extended: true },
      offset,
      pageSize: PAGE_SIZE,
    })
    if (!Array.isArray(response.json)) fail('KOIOS_ASSET_UTXOS_RESPONSE_NOT_ARRAY')
    const range = parseContentRange(response.headers.get('content-range'))
    if (total === null) total = range.total
    if (range.total !== total) fail('KOIOS_ASSET_UTXOS_TOTAL_CHANGED')
    const rows = response.json.map((row) => normalizeUtxo(row, 'asset_utxos'))
    if (range.total === 0) {
      if (rows.length !== 0 || offset !== 0) fail('KOIOS_EMPTY_ASSET_RANGE_INCONSISTENT')
      return { rows, total: 0, pages: [{ offset, contentRange: range.raw }] }
    }
    if (range.first !== offset || range.last !== offset + rows.length - 1 ||
        rows.length !== Math.min(PAGE_SIZE, total - offset)) {
      fail('KOIOS_ASSET_UTXOS_RANGE_INCONSISTENT', range.raw)
    }
    all.push(...rows)
    if (all.length === total) {
      const refs = all.map((row) => parseRef(row, 'asset_utxo'))
      if (new Set(refs).size !== refs.length) fail('KOIOS_ASSET_UTXOS_DUPLICATE_OUTREF')
      return {
        rows: all,
        total,
        pages: [{ offset, contentRange: range.raw }],
      }
    }
    offset += rows.length
  }
  fail('KOIOS_ASSET_UTXOS_MAX_PAGES_EXCEEDED')
}

async function refreshExactUtxo(ref) {
  const response = await jsonRequest('/utxo_info', {
    method: 'POST',
    body: { _utxo_refs: [ref], _extended: true },
  })
  if (!Array.isArray(response.json) || response.json.length !== 1) {
    fail('KOIOS_EXACT_UTXO_REPLAY_NOT_UNIQUE', ref)
  }
  const row = normalizeUtxo(response.json[0], 'utxo_info')
  if (parseRef(row, 'utxo_info') !== ref) fail('KOIOS_EXACT_UTXO_OUTREF_MISMATCH')
  if (row.is_spent !== false) fail('KOIOS_EXACT_UTXO_IS_SPENT', ref)
  return row
}

async function getDatumBytes(row) {
  if (typeof row.inline_datum?.bytes === 'string' && row.inline_datum.bytes.length > 0) {
    return normalizedHex(row.inline_datum.bytes, 'inline_datum.bytes')
  }
  const datumHash = normalizedHex(String(row.datum_hash ?? ''), 'datum_hash', 32)
  const response = await jsonRequest('/datum_info', {
    method: 'POST',
    body: { _datum_hashes: [datumHash] },
  })
  if (!Array.isArray(response.json) || response.json.length !== 1) {
    fail('KOIOS_DATUM_INFO_NOT_UNIQUE', datumHash)
  }
  const datum = response.json[0]
  if (String(datum.hash ?? '').toLowerCase() !== datumHash) fail('KOIOS_DATUM_HASH_RESPONSE_MISMATCH')
  return normalizedHex(datum.bytes, 'datum_info.bytes')
}

function sha256Json(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

async function main() {
  const startedAt = new Date().toISOString()
  const tipBefore = await readTip()

  // Verify the repository's documented SHA3-256 LP derivation against its own
  // public MIN/ADA vector before using it to authenticate the USDM/ADA pair.
  const lpSelfTest = computeLpName(
    { policyId: ADA_POLICY, assetName: ADA_NAME },
    {
      policyId: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6',
      assetName: '4d494e',
    },
  )
  if (lpSelfTest !== '82e2b1fd27a7712a1a9cf750dfbea1a5778611b20e06dd6a611df7a643f8cb75') {
    fail('MINSWAP_SHA3_LP_DERIVATION_SELF_TEST_FAILED', lpSelfTest)
  }

  const assetScan = await fetchAssetUtxos()
  if (assetScan.total === 0) fail('LP_ASSET_HAS_NO_CURRENT_UTXOS')
  const candidate = findAssetUtxo(assetScan.rows, lpUnit)
  const candidateRef = parseRef(candidate, 'pool_candidate')
  const refreshed = await refreshExactUtxo(candidateRef)
  const datumBytes = await getDatumBytes(refreshed)
  const verified = verifyPoolOutput(refreshed, datumBytes)
  const tipAfter = await readTip()

  const evidence = {
    schema: 'IMMORTAL-MINSWAP-V2-USDM-ADA-RAW-POOL-OBSERVATION-V1',
    status: 'RAW_POOL_UTXO_AND_DATUM_MATCHED',
    qualification: 'NOT_QUALIFIED_AS_USD_USDM_REFERENCE',
    operation: {
      readOnly: true,
      walletLoaded: false,
      transactionBuilt: false,
      transactionSigned: false,
      transactionSubmitted: false,
      ledgerStateChanged: false,
    },
    network: 'cardano-mainnet',
    provider: {
      name: 'Koios',
      endpoint: KOIOS,
      indexerAttestationVerified: false,
      independentNodeConsensusProof: false,
    },
    observedAt: {
      startedAt,
      completedAt: new Date().toISOString(),
      tipBefore,
      tipAfter,
      tipUnchanged: tipBefore.hash === tipAfter.hash,
    },
    contract: {
      repository: 'https://github.com/minswap/minswap-dex-v2',
      poolScriptHash: POOL_SCRIPT_HASH,
      lpPolicyId: POLICY,
      poolValidityAsset: authUnit,
      minimumPoolAdaLovelace: MIN_POOL_ADA.toString(),
      defaultBurnLiquidity: DEFAULT_BURN_LIQUIDITY.toString(),
      maxInt64: MAX_INT64.toString(),
    },
    pair: {
      assetA: { policyId: ADA_POLICY, assetName: ADA_NAME, ticker: 'ADA', decimals: 6 },
      assetB: { policyId: USDM_POLICY, assetName: USDM_NAME, ticker: 'USDM', issuer: 'Moneta', decimals: 6 },
      lpAssetUnit: lpUnit,
    },
    discovery: {
      lpAssetUtxoRows: assetScan.rows.length,
      lpAssetUtxoTotal: assetScan.total,
      uniquePoolOutputRef: candidateRef,
      pagination: assetScan.pages,
    },
    livePool: verified,
    evidenceDigest: null,
    limits: [
      'A single Koios indexer response is not an independent ledger consensus proof.',
      'The raw reserve ratio is a current marginal reserve ratio, not executable depth, TWAP, or a USD-denominated price.',
      'This Mainnet USDM asset is not the distinct Preprod tUSDM used by the B1 PrizePool.',
      'No ADA/USD source, price composition, or PRE-RICH Oracle qualification is performed here.',
    ],
  }
  evidence.evidenceDigest = sha256Json({ ...evidence, evidenceDigest: null })
  await mkdir(OUTPUT.split('/').slice(0, -1).join('/') || '.', { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify({
    status: evidence.status,
    qualification: evidence.qualification,
    network: evidence.network,
    observedTip: tipAfter,
    tipUnchanged: evidence.observedAt.tipUnchanged,
    poolOutRef: verified.ref,
    poolAddress: verified.address,
    poolScriptHash: verified.paymentCredential,
    assetA: verified.datum.assetA,
    assetB: verified.datum.assetB,
    reserveA: verified.datum.reserveA,
    reserveB: verified.datum.reserveB,
    poolSpotReserveRatio: verified.poolSpotReserveRatio,
    reconciliation: verified.reconciliation,
    datumHash: verified.datumHash,
    evidenceDigest: evidence.evidenceDigest,
    output: OUTPUT,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'BLOCKED',
    error: String(error?.message ?? error),
    operation: 'READ_ONLY',
    transactionSubmitted: false,
    ledgerStateChanged: false,
  }, null, 2))
  process.exitCode = 1
})
