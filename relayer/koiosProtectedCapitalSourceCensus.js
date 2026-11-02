const { createHash } = require('node:crypto')

const DEFAULT_PAGE_SIZE = 500
const MAX_KOIOS_PAGE_SIZE = 1000
const DATUM_HASH_BATCH_SIZE = 8

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']'
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ':' + canonicalJson(value[key]),
    ).join(',') + '}'
  }
  return JSON.stringify(value)
}

function assertPreprodKoiosEndpoint(baseUrl) {
  let parsed
  try {
    parsed = new URL(baseUrl)
  } catch {
    throw new Error('KOIOS_PREPROD_BASE_URL_INVALID')
  }
  if (parsed.protocol !== 'https:' ||
      !parsed.hostname.toLowerCase().includes('preprod') ||
      parsed.pathname.replace(/\/$/, '') !== '/api/v1' ||
      parsed.search || parsed.hash) {
    throw new Error('KOIOS_ENDPOINT_MUST_BE_HTTPS_PREPROD_API_V1')
  }
  return parsed.toString().replace(/\/$/, '')
}

function exactTip(raw) {
  const row = Array.isArray(raw) ? raw[0] : raw
  const hash = String(row?.hash ?? '').toLowerCase()
  const slot = Number(row?.abs_slot ?? row?.absolute_slot)
  const blockHeight = Number(row?.block_height ?? row?.block_no)
  if (!/^[0-9a-f]{64}$/.test(hash) ||
      !Number.isSafeInteger(slot) || slot < 0 ||
      !Number.isSafeInteger(blockHeight) || blockHeight < 0) {
    throw new Error('KOIOS_TIP_NOT_EXACT')
  }
  return { hash, slot, blockHeight }
}

function parseContentRange(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('KOIOS_EXACT_CONTENT_RANGE_MISSING')
  }
  const match = /^(?:(\d+)-(\d+)|\*)\/(\d+|\*)$/.exec(value.trim())
  if (!match || match[3] === '*') {
    throw new Error('KOIOS_EXACT_CONTENT_RANGE_REQUIRED:' + value)
  }
  const first = match[1] === undefined ? null : Number(match[1])
  const last = match[2] === undefined ? null : Number(match[2])
  const total = Number(match[3])
  if ((first !== null && !Number.isSafeInteger(first)) ||
      (last !== null && !Number.isSafeInteger(last)) ||
      !Number.isSafeInteger(total) || total < 0) {
    throw new Error('KOIOS_CONTENT_RANGE_OUT_OF_SAFE_INTEGER_BOUNDS')
  }
  return { first, last, total, raw: value.trim() }
}

function validateKoiosUtxoRow(row) {
  const txHash = String(row?.tx_hash ?? '').toLowerCase()
  const outputIndex = Number(row?.tx_index)
  if (!/^[0-9a-f]{64}$/.test(txHash) ||
      !Number.isSafeInteger(outputIndex) || outputIndex < 0 ||
      typeof row?.address !== 'string' || !row.address ||
      row.value === undefined || row.value === null) {
    throw new Error('KOIOS_ADDRESS_UTXO_ROW_MALFORMED')
  }
  if (row.asset_list !== undefined && !Array.isArray(row.asset_list)) {
    throw new Error('KOIOS_ADDRESS_UTXO_ASSET_LIST_MALFORMED')
  }
  const seenUnits = new Set()
  for (const asset of row.asset_list ?? []) {
    const policyId = String(asset?.policy_id ?? '').toLowerCase()
    const assetName = String(asset?.asset_name ?? '').toLowerCase()
    if (!/^[0-9a-f]{56}$/.test(policyId) || !/^(?:[0-9a-f]{2}){0,32}$/.test(assetName)) {
      throw new Error('KOIOS_ADDRESS_UTXO_ASSET_IDENTITY_INVALID')
    }
    const quantity = BigInt(String(asset?.quantity ?? ''))
    if (quantity < 0n) throw new Error('KOIOS_ADDRESS_UTXO_NEGATIVE_ASSET_QUANTITY')
    const unit = policyId + assetName
    if (seenUnits.has(unit)) throw new Error('KOIOS_ADDRESS_UTXO_DUPLICATE_ASSET_UNIT:' + unit)
    seenUnits.add(unit)
  }
  const lovelace = BigInt(String(row.value))
  if (lovelace < 0n) throw new Error('KOIOS_ADDRESS_UTXO_NEGATIVE_LOVELACE')
  return {
    ...row,
    tx_hash: txHash,
    tx_index: outputIndex,
    utxo_reference: txHash + '#' + outputIndex,
  }
}

function makeUrl(baseUrl, path, query = {}) {
  const url = new URL(baseUrl.replace(/\/$/, '') + path)
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value))
  }
  return url
}

function createKoiosProtectedCapitalSource({
  baseUrl = 'https://preprod.koios.rest/api/v1',
  apiToken = '',
  fetchImpl = globalThis.fetch,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = 10000,
  now = () => new Date().toISOString(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required')
  const normalizedBaseUrl = assertPreprodKoiosEndpoint(baseUrl)
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_KOIOS_PAGE_SIZE) {
    throw new Error('pageSize must be an integer between 1 and 1000')
  }
  if (!Number.isInteger(maxPages) || maxPages < 1) {
    throw new Error('maxPages must be a positive integer')
  }

  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    Prefer: 'count=exact',
    ...(apiToken ? { Authorization: 'Bearer ' + apiToken } : {}),
  }

  async function requestJson(url, body, label) {
    const response = await fetchImpl(url, body === undefined
      ? { method: 'GET', headers }
      : { method: 'POST', headers, body: JSON.stringify(body) })
    const text = await response.text()
    if (!response.ok) {
      throw new Error(label + '_HTTP_' + response.status + ':' + text.slice(0, 500))
    }
    let json
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(label + '_INVALID_JSON')
    }
    return { json, text, headers: response.headers, status: response.status }
  }

  async function readTip() {
    const response = await requestJson(
      makeUrl(normalizedBaseUrl, '/tip'),
      undefined,
      'KOIOS_TIP',
    )
    return exactTip(response.json)
  }

  async function readAddressPage(address, offset) {
    const url = makeUrl(normalizedBaseUrl, '/address_utxos', {
      limit: pageSize,
      offset,
      order: 'tx_hash.asc,tx_index.asc',
    })
    const response = await requestJson(
      url,
      { _addresses: [address], _extended: true },
      'KOIOS_ADDRESS_UTXOS',
    )
    if (!Array.isArray(response.json)) {
      throw new Error('KOIOS_ADDRESS_UTXOS_RESPONSE_NOT_ARRAY')
    }
    const contentRange = parseContentRange(
      response.headers?.get?.('content-range') ?? null,
    )
    const rows = response.json.map(validateKoiosUtxoRow)
    if (rows.length > pageSize) throw new Error('KOIOS_ADDRESS_UTXOS_PAGE_EXCEEDS_LIMIT')
    if (contentRange.total === 0) {
      if (offset !== 0 || rows.length !== 0 ||
          (contentRange.first !== null && contentRange.first !== 0)) {
        throw new Error('KOIOS_ADDRESS_UTXOS_EMPTY_RANGE_INCONSISTENT')
      }
    } else {
      if (rows.length === 0) throw new Error('KOIOS_ADDRESS_UTXOS_EARLY_EMPTY_PAGE')
      if (contentRange.first !== offset ||
          contentRange.last !== offset + rows.length - 1) {
        throw new Error('KOIOS_ADDRESS_UTXOS_RANGE_DOES_NOT_MATCH_OFFSET')
      }
      if (rows.length !== Math.min(pageSize, contentRange.total - offset)) {
        throw new Error('KOIOS_ADDRESS_UTXOS_PAGE_LENGTH_INCONSISTENT')
      }
    }
    return {
      rows,
      contentRange,
      bodyDigest: sha256Hex(response.text),
    }
  }

  async function enumerateAddress(address) {
    if (typeof address !== 'string' || !address.trim()) {
      throw new Error('KOIOS_CENSUS_ADDRESS_REQUIRED')
    }
    const pages = []
    const rows = []
    const seen = new Set()
    let offset = 0
    let expectedTotal = null

    for (;;) {
      if (pages.length >= maxPages) throw new Error('KOIOS_ADDRESS_UTXOS_MAX_PAGES_EXCEEDED')
      const page = await readAddressPage(address, offset)
      if (expectedTotal === null) expectedTotal = page.contentRange.total
      if (page.contentRange.total !== expectedTotal) {
        throw new Error('KOIOS_ADDRESS_UTXOS_TOTAL_CHANGED_DURING_PAGINATION')
      }
      for (const row of page.rows) {
        if (row.address !== address) {
          throw new Error('KOIOS_ADDRESS_UTXOS_ADDRESS_MISMATCH:' + row.utxo_reference)
        }
        if (seen.has(row.utxo_reference)) {
          throw new Error('KOIOS_ADDRESS_UTXOS_DUPLICATE_REFERENCE:' + row.utxo_reference)
        }
        seen.add(row.utxo_reference)
        rows.push(row)
      }
      pages.push({
        offset,
        limit: pageSize,
        returnedCount: page.rows.length,
        contentRange: page.contentRange.raw,
        responseSha256: page.bodyDigest,
        firstUtxoReference: page.rows[0]?.utxo_reference ?? null,
        lastUtxoReference: page.rows.at(-1)?.utxo_reference ?? null,
      })
      offset += page.rows.length
      if (offset === expectedTotal) break
      if (offset > expectedTotal) throw new Error('KOIOS_ADDRESS_UTXOS_OFFSET_EXCEEDED_TOTAL')
    }

    if (rows.length !== expectedTotal) {
      throw new Error('KOIOS_ADDRESS_UTXOS_TOTAL_NOT_RECONCILED')
    }
    return {
      address,
      totalCount: expectedTotal,
      returnedCount: rows.length,
      pages,
      rows,
    }
  }

  async function resolveDatumHashes(rows) {
    const uniqueHashes = [...new Set(rows
      .filter((row) => !row.inline_datum?.bytes && row.datum_hash)
      .map((row) => String(row.datum_hash).toLowerCase()))]
    const resolved = new Map()
    for (let offset = 0; offset < uniqueHashes.length; offset += DATUM_HASH_BATCH_SIZE) {
      const batch = uniqueHashes.slice(offset, offset + DATUM_HASH_BATCH_SIZE)
      const response = await requestJson(
        makeUrl(normalizedBaseUrl, '/datum_info'),
        { _datum_hashes: batch },
        'KOIOS_DATUM_INFO',
      )
      if (!Array.isArray(response.json)) throw new Error('KOIOS_DATUM_INFO_RESPONSE_NOT_ARRAY')
      for (const datum of response.json) {
        const hash = String(datum?.datum_hash ?? '').toLowerCase()
        const bytes = datum?.bytes
        if (!/^[0-9a-f]{64}$/.test(hash) || typeof bytes !== 'string' ||
            !/^(?:[0-9a-fA-F]{2})+$/.test(bytes)) {
          throw new Error('KOIOS_DATUM_INFO_ROW_MALFORMED')
        }
        if (resolved.has(hash)) throw new Error('KOIOS_DATUM_INFO_DUPLICATE_HASH:' + hash)
        resolved.set(hash, bytes.toLowerCase())
      }
      if (offset + DATUM_HASH_BATCH_SIZE < uniqueHashes.length) await sleep(120)
    }
    return rows.map((row) => {
      const inlineBytes = row.inline_datum?.bytes
      const datumHash = row.datum_hash ? String(row.datum_hash).toLowerCase() : null
      const datumBytes = typeof inlineBytes === 'string'
        ? inlineBytes.toLowerCase()
        : datumHash ? resolved.get(datumHash) ?? null : null
      return {
        ...row,
        datum_hash: datumHash,
        datum_bytes: datumBytes,
        datum_source: typeof inlineBytes === 'string'
          ? 'INLINE'
          : datumBytes ? 'DATUM_INFO' : 'MISSING',
      }
    })
  }

  async function scanSnapshot(addresses) {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('KOIOS_CENSUS_ADDRESSES_REQUIRED')
    }
    const names = new Set()
    for (const entry of addresses) {
      if (!entry || typeof entry.name !== 'string' || !entry.name.trim() ||
          typeof entry.address !== 'string' || !entry.address.trim()) {
        throw new Error('KOIOS_CENSUS_ADDRESS_ENTRY_INVALID')
      }
      if (names.has(entry.name)) throw new Error('KOIOS_CENSUS_DUPLICATE_ADDRESS_NAME:' + entry.name)
      names.add(entry.name)
    }

    const startedAt = now()
    const tipBefore = await readTip()
    const addressScans = {}
    for (const entry of addresses) {
      const scan = await enumerateAddress(entry.address)
      const rowsWithDatums = await resolveDatumHashes(scan.rows)
      addressScans[entry.name] = {
        ...scan,
        rows: rowsWithDatums,
      }
    }
    const tipAfter = await readTip()
    if (tipBefore.hash !== tipAfter.hash ||
        tipBefore.slot !== tipAfter.slot ||
        tipBefore.blockHeight !== tipAfter.blockHeight) {
      throw new Error('KOIOS_SNAPSHOT_CHANGED_DURING_CENSUS')
    }

    const manifestBase = {
      schema: 'IMMORTAL-KOIOS-ADDRESS-UTXO-CENSUS-V1',
      provider: {
        name: 'Koios',
        baseUrl: normalizedBaseUrl,
        endpoint: 'POST /address_utxos',
        pagination: 'PostgREST limit/offset with Prefer: count=exact and Content-Range verification',
      },
      network: 'Preprod',
      startedAt,
      completedAt: now(),
      snapshot: tipBefore,
      snapshotReference: 'koios-preprod-observation:' + tipBefore.slot + ':' + tipBefore.hash,
      pageSize,
      addresses: Object.fromEntries(Object.entries(addressScans).map(([name, scan]) => [
        name,
        {
          address: scan.address,
          totalCount: scan.totalCount,
          returnedCount: scan.returnedCount,
          pageCount: scan.pages.length,
          pages: scan.pages,
          utxoReferences: scan.rows.map((row) => row.utxo_reference),
          datumRecords: scan.rows.map((row) => ({
            utxoReference: row.utxo_reference,
            datumHash: row.datum_hash ?? null,
            datumSource: row.datum_source,
            datumBytesSha256: row.datum_bytes
              ? sha256Hex(Buffer.from(row.datum_bytes, 'hex'))
              : null,
          })),
          missingDatumCount: scan.rows.filter((row) => !row.datum_bytes).length,
        },
      ])),
    }
    const sourceManifestDigest = sha256Hex(canonicalJson(manifestBase))
    const manifest = {
      ...manifestBase,
      sourceManifestDigest,
      providerAttestationVerified: false,
      datumHashContentVerified: false,
      providerSnapshotPinned: false,
      sameBackendSnapshotVerified: false,
      consistencyAssessment: 'TIP_STABLE_BUT_NOT_QUERY_PINNED',
      tipUnchangedAcrossScan: true,
      paginationTotalsExactlyReconciled: true,
    }

    return {
      manifest,
      manifestBase,
      sourceManifestDigest,
      snapshotReference: manifest.snapshotReference,
      observedSlot: BigInt(tipBefore.slot),
      observedAt: BigInt(Math.floor(Date.parse(manifest.completedAt) / 1000)),
      addressScans,
    }
  }

  return {
    readTip,
    enumerateAddress,
    resolveDatumHashes,
    scanSnapshot,
  }
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_KOIOS_PAGE_SIZE,
  createKoiosProtectedCapitalSource,
  parseContentRange,
  assertPreprodKoiosEndpoint,
  canonicalJson,
  sha256Hex,
}
