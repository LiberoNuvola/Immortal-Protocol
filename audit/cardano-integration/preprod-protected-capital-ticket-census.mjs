import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Constr, Data, getAddressDetails } from '@lucid-evolution/lucid'

import { buildPreRichProtectedCapitalItemLedger } from '../../PRE-RICH/src/PreRichProtectedCapitalItemLedger.ts'

const DEFAULT_KOIOS = 'https://preprod.koios.rest/api/v1'
const PAGE_SIZE = 1000
const DEFAULT_MAX_UTXOS = 25000

function required(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(name + '_REQUIRED')
  return value.trim()
}

function normalizeHex(value, name) {
  if (typeof value !== 'string') throw new Error(name + '_MUST_BE_HEX')
  const hex = value.replace(/^0x/i, '').toLowerCase()
  if (!/^(?:[0-9a-f]{2})+$/.test(hex)) throw new Error(name + '_MUST_BE_EVEN_HEX')
  return hex
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ':' + stableStringify(value[key]),
    ).join(',') + '}'
  }
  return JSON.stringify(value)
}

function jsonForFile(value) {
  return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2) + '\n'
}

async function readJson(response, label) {
  const text = await response.text()
  if (!response.ok) throw new Error(label + '_HTTP_' + response.status + ':' + text.slice(0, 300))
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(label + '_INVALID_JSON')
  }
}

async function postKoios(koiosUrl, path, body, fetchImpl = fetch) {
  const response = await fetchImpl(koiosUrl + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })
  return readJson(response, 'KOIOS_' + path.split('?')[0].replace(/^\//, '').toUpperCase())
}

async function getTip(koiosUrl, fetchImpl = fetch) {
  const response = await fetchImpl(koiosUrl + '/tip', { headers: { accept: 'application/json' } })
  const value = await readJson(response, 'KOIOS_TIP')
  const tip = Array.isArray(value) ? value[0] : value
  if (!tip || tip.abs_slot == null || tip.block_no == null || !tip.hash) {
    throw new Error('KOIOS_TIP_MISSING_SLOT_BLOCK_OR_HASH')
  }
  return {
    slot: String(tip.abs_slot),
    blockNo: String(tip.block_no),
    blockHash: String(tip.hash).toLowerCase(),
    blockTime: tip.block_time == null ? null : String(tip.block_time),
  }
}

function outRef(row, label) {
  const txHash = String(row?.tx_hash ?? '').toLowerCase()
  const index = Number(row?.tx_index)
  if (!/^[0-9a-f]{64}$/.test(txHash) || !Number.isSafeInteger(index) || index < 0) {
    throw new Error(label + '_INVALID_OUTREF')
  }
  return txHash + '#' + index
}

/**
 * Exhaust a Koios PostgREST address_utxos query using limit/offset.
 * A full final page is followed by another request; an empty page or a
 * short page is required before paginationComplete can become true.
 */
export async function fetchAddressUtxos({
  koiosUrl,
  address,
  fetchImpl = fetch,
  pageSize = PAGE_SIZE,
  maxRows = DEFAULT_MAX_UTXOS,
}) {
  required(koiosUrl, 'KOIOS_URL')
  required(address, 'PRIZE_VALIDATOR_ADDRESS')
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new Error('PAGE_SIZE_INVALID')
  if (!Number.isSafeInteger(maxRows) || maxRows < 1) throw new Error('MAX_ROWS_INVALID')

  const rows = []
  const seen = new Set()
  const pages = []
  let offset = 0
  let paginationComplete = false

  while (!paginationComplete) {
    const path = '/address_utxos?limit=' + pageSize + '&offset=' + offset
    const response = await fetchImpl(koiosUrl.replace(/\/$/, '') + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ _addresses: [address], _extended: true }),
    })
    const page = await readJson(response, 'KOIOS_ADDRESS_UTXOS')
    if (!Array.isArray(page)) throw new Error('KOIOS_ADDRESS_UTXOS_NOT_ARRAY')

    const contentRange = response.headers?.get?.('content-range') ?? null
    if (contentRange) {
      const range = /^(\d+)-(\d+)\/(\d+|\*)$/.exec(contentRange)
      const emptyRange = /^\*\/(\d+|\*)$/.exec(contentRange)
      if (!range && !emptyRange) throw new Error('KOIOS_ADDRESS_UTXOS_CONTENT_RANGE_INVALID')
      if (range && Number(range[1]) !== offset) throw new Error('KOIOS_ADDRESS_UTXOS_OFFSET_MISMATCH')
      if (range && Number(range[2]) - Number(range[1]) + 1 !== page.length) {
        throw new Error('KOIOS_ADDRESS_UTXOS_CONTENT_RANGE_COUNT_MISMATCH')
      }
    }

    pages.push({
      offset,
      returned: page.length,
      contentRange,
    })

    for (const row of page) {
      const reference = outRef(row, 'KOIOS_ADDRESS_UTXOS')
      if (seen.has(reference)) throw new Error('KOIOS_ADDRESS_UTXOS_DUPLICATE_OUTREF:' + reference)
      seen.add(reference)
      rows.push(row)
      if (rows.length > maxRows) throw new Error('KOIOS_ADDRESS_UTXOS_SCAN_BOUND_EXCEEDED')
    }

    if (page.length === 0 || page.length < pageSize) {
      paginationComplete = true
    } else {
      const total = (() => {
        const match = /^(\d+)-(\d+)\/(\d+)$/.exec(contentRange ?? '')
        return match ? Number(match[3]) : null
      })()
      if (total !== null && offset + page.length >= total) {
        paginationComplete = true
      } else {
        offset += page.length
        if (offset > maxRows) throw new Error('KOIOS_ADDRESS_UTXOS_OFFSET_EXCEEDS_SCAN_BOUND')
      }
    }
  }

  return {
    rows,
    pageCount: pages.length,
    pages,
    paginationComplete,
  }
}

function requireConstr(value, index, field, fieldCount) {
  if (!(value instanceof Constr) || value.index !== index || !Array.isArray(value.fields)) {
    throw new Error(field + '_CONSTRUCTOR_INVALID')
  }
  if (fieldCount !== undefined && value.fields.length !== fieldCount) {
    throw new Error(field + '_FIELD_COUNT_INVALID')
  }
  return value.fields
}

function asInteger(value, field) {
  try {
    const result = typeof value === 'bigint' ? value : BigInt(value?.int ?? value)
    if (result < 0n) throw new Error()
    return result
  } catch {
    throw new Error(field + '_NON_NEGATIVE_INTEGER_REQUIRED')
  }
}

function asBytes(value, field, exactBytes) {
  if (typeof value !== 'string' || !/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
    throw new Error(field + '_BYTES_REQUIRED')
  }
  const hex = value.toLowerCase()
  if (exactBytes !== undefined && hex.length !== exactBytes * 2) {
    throw new Error(field + '_BYTE_LENGTH_INVALID')
  }
  return hex
}

export function decodePrizeDatum(cborHex) {
  const hex = normalizeHex(cborHex, 'PRIZEDATUM_CBOR')
  const datum = Data.from(hex)
  const fields = requireConstr(datum, 0, 'PRIZEDATUM', 23)
  const statusFields = requireConstr(fields[10], undefined, 'PRIZEDATUM_STATUS')
  const beaconFields = requireConstr(fields[14], undefined, 'PRIZEDATUM_BEACON_STATUS')
  if (statusFields.length !== 0 || beaconFields.length !== 0) {
    throw new Error('PRIZEDATUM_STATUS_FIELDS_INVALID')
  }

  const status = ['Pending', 'Revealed', 'Claimed'][fields[10].index]
  const beaconStatus = ['BeaconPending', 'BeaconReady'][fields[14].index]
  if (!status || !beaconStatus) throw new Error('PRIZEDATUM_STATUS_CONSTRUCTOR_UNKNOWN')

  const beaconTarget = requireConstr(fields[13], 0, 'PRIZEDATUM_BEACON_TARGET', 4)
  asInteger(beaconTarget[0], 'PRIZEDATUM_BEACON_NETWORK_ID')
  asInteger(beaconTarget[1], 'PRIZEDATUM_BEACON_ROUND')
  asBytes(beaconTarget[2], 'PRIZEDATUM_BEACON_MAINCHAIN_REF')
  asBytes(beaconTarget[3], 'PRIZEDATUM_BEACON_VERSION')

  return {
    ticketPolicyId: asBytes(fields[0], 'PRIZEDATUM_TICKET_POLICY', 28),
    ticketAssetNameHex: asBytes(fields[1], 'PRIZEDATUM_TICKET_NAME'),
    priceUsdmSubunits: asInteger(fields[3], 'PRIZEDATUM_PRICE'),
    prizeAmountUsdmSubunits: asInteger(fields[7], 'PRIZEDATUM_PAYOUT'),
    prizeStatus: status,
    beaconStatus,
    prizePoolHash: asBytes(fields[18], 'PRIZEDATUM_POOL_HASH', 28),
    issuedAt: asInteger(fields[19], 'PRIZEDATUM_ISSUED_AT'),
    expiresAt: asInteger(fields[20], 'PRIZEDATUM_EXPIRES_AT'),
  }
}

export function decodePoolDatum(cborHex) {
  const hex = normalizeHex(cborHex, 'B1_POOL_DATUM_CBOR')
  const datum = Data.from(hex)
  const fields = requireConstr(datum, 0, 'B1_POOL_DATUM', 8)
  return {
    totalLiquidityUsdmSubunits: asInteger(fields[0], 'B1_POOL_TOTAL_LIQUIDITY'),
    pendingLiabilitiesUsdmSubunits: asInteger(fields[1], 'B1_POOL_PENDING_LIABILITIES'),
    unresolvedReserveUsdmSubunits: asInteger(fields[2], 'B1_POOL_UNRESOLVED_RESERVE'),
    unresolvedTicketCount: asInteger(fields[3], 'B1_POOL_UNRESOLVED_COUNT'),
    lockedJackpotUsdmSubunits: asInteger(fields[4], 'B1_POOL_LOCKED_JACKPOT'),
    jackpotThresholdUsdmSubunits: asInteger(fields[5], 'B1_POOL_JACKPOT_THRESHOLD'),
    suspendedClasses: asInteger(fields[6], 'B1_POOL_SUSPENDED_CLASSES'),
    prizeValidatorHash: asBytes(fields[7], 'B1_POOL_PRIZE_HASH', 28),
  }
}

function scriptCredentialHash(address, label) {
  const details = getAddressDetails(address)
  const credential = details?.paymentCredential
  if (!credential || credential.type !== 'Script' || !/^[0-9a-fA-F]{56}$/.test(credential.hash ?? '')) {
    throw new Error(label + '_MUST_HAVE_SCRIPT_PAYMENT_CREDENTIAL')
  }
  return credential.hash.toLowerCase()
}

async function resolveDatumBytes(row, koiosUrl, fetchImpl = fetch) {
  const inline = row?.inline_datum?.bytes ?? row?.inline_datum?.cbor ?? null
  if (typeof inline === 'string' && inline.length > 0) return normalizeHex(inline, 'INLINE_DATUM')
  const datumHash = String(row?.datum_hash ?? '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(datumHash)) throw new Error('UTXO_DATUM_BYTES_AND_HASH_MISSING')
  const datums = await postKoios(koiosUrl, '/datum_info', { _datum_hashes: [datumHash] }, fetchImpl)
  if (!Array.isArray(datums) || datums.length !== 1 || typeof datums[0]?.bytes !== 'string') {
    throw new Error('KOIOS_DATUM_INFO_NOT_FOUND:' + datumHash)
  }
  return normalizeHex(datums[0].bytes, 'DATUM_INFO_BYTES')
}

function assetRows(row) {
  if (!Array.isArray(row?.asset_list)) throw new Error('UTXO_ASSET_LIST_MALFORMED')
  return row.asset_list.map((asset) => {
    const policyId = String(asset?.policy_id ?? '').toLowerCase()
    const assetNameHex = String(asset?.asset_name ?? '').toLowerCase()
    if (!/^[0-9a-f]{56}$/.test(policyId) || !/^(?:[0-9a-f]{2}){0,32}$/.test(assetNameHex)) {
      throw new Error('UTXO_ASSET_IDENTITY_MALFORMED')
    }
    return {
      policyId,
      assetNameHex,
      quantity: asInteger(asset.quantity, 'UTXO_ASSET_QUANTITY'),
    }
  })
}

async function fetchExactUtxo(koiosUrl, reference, expectedAddress, fetchImpl = fetch) {
  const rows = await postKoios(koiosUrl, '/utxo_info', { _utxo_refs: [reference], _extended: true }, fetchImpl)
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('B1_POOL_EXACT_UTXO_NOT_FOUND_OR_AMBIGUOUS')
  const row = rows[0]
  if (outRef(row, 'B1_POOL') !== reference.toLowerCase()) throw new Error('B1_POOL_OUTREF_MISMATCH')
  if (String(row.address ?? '') !== expectedAddress) throw new Error('B1_POOL_ADDRESS_MISMATCH')
  return row
}

async function main() {
  const koiosUrl = (process.env.KOIOS_PREPROD_URL ?? DEFAULT_KOIOS).replace(/\/$/, '')
  const prizeAddress = required(process.env.PREPROD_PRIZE_VALIDATOR_ADDRESS, 'PREPROD_PRIZE_VALIDATOR_ADDRESS')
  const ticketPolicyId = required(process.env.PREPROD_TICKET_POLICY_ID, 'PREPROD_TICKET_POLICY_ID').toLowerCase()
  const poolAddress = required(process.env.PREPROD_B1_POOL_ADDRESS, 'PREPROD_B1_POOL_ADDRESS')
  const poolOutRef = required(process.env.PREPROD_B1_POOL_OUTREF, 'PREPROD_B1_POOL_OUTREF').toLowerCase()
  const poolSingletonUnit = required(process.env.PREPROD_B1_POOL_SINGLETON_UNIT, 'PREPROD_B1_POOL_SINGLETON_UNIT').toLowerCase()
  const evidenceDir = resolve(process.env.PREPROD_PC_CENSUS_EVIDENCE_DIR ?? 'audit/preprod-evidence/protected-capital-ticket-census')
  const maxRows = Number(process.env.MAX_PRIZE_VALIDATOR_UTXOS ?? DEFAULT_MAX_UTXOS)

  if (!/^[0-9a-f]{56}$/.test(ticketPolicyId)) throw new Error('PREPROD_TICKET_POLICY_ID_INVALID')
  if (!/^([0-9a-f]{56})([0-9a-f]{0,64})$/.test(poolSingletonUnit)) throw new Error('PREPROD_B1_POOL_SINGLETON_UNIT_INVALID')
  if (!/^[0-9a-f]{64}#\d+$/.test(poolOutRef)) throw new Error('PREPROD_B1_POOL_OUTREF_INVALID')
  const prizeValidatorHash = scriptCredentialHash(prizeAddress, 'PRIZE_VALIDATOR_ADDRESS')
  const b1PrizePoolScriptHash = scriptCredentialHash(poolAddress, 'B1_POOL_ADDRESS')

  const observedAt = BigInt(Date.now())
  const tipBefore = await getTip(koiosUrl)
  const censusResult = await fetchAddressUtxos({
    koiosUrl,
    address: prizeAddress,
    maxRows,
  })
  const poolRow = await fetchExactUtxo(koiosUrl, poolOutRef, poolAddress)
  const poolDatumCbor = await resolveDatumBytes(poolRow, koiosUrl)
  const poolDatum = decodePoolDatum(poolDatumCbor)

  if (poolDatum.prizeValidatorHash !== prizeValidatorHash) {
    throw new Error('B1_POOL_DATUM_PRIZE_HASH_DOES_NOT_MATCH_CONFIGURED_PRIZE_VALIDATOR_ADDRESS')
  }
  const poolSingleton = assetRows(poolRow).filter((asset) =>
    asset.policyId + asset.assetNameHex === poolSingletonUnit,
  )
  if (poolSingleton.length !== 1 || poolSingleton[0].quantity !== 1n) {
    throw new Error('B1_POOL_EXACT_UTXO_MISSING_UNIQUE_SINGLETON')
  }

  const records = []
  const decodeErrors = []
  for (const row of censusResult.rows) {
    if (String(row.address ?? '') !== prizeAddress) throw new Error('PRIZE_VALIDATOR_ADDRESS_RESPONSE_MISMATCH')
    const reference = outRef(row, 'PRIZE_VALIDATOR_UTXO')
    try {
      const datumCbor = await resolveDatumBytes(row, koiosUrl)
      const decoded = decodePrizeDatum(datumCbor)
      const assets = assetRows(row)
      const policyAssets = assets.filter((asset) => asset.policyId === ticketPolicyId)
      const nft = policyAssets.length === 1 ? policyAssets[0] : null
      records.push({
        utxoReference: reference,
        datumDigest: sha256(Buffer.from(datumCbor, 'hex')),
        ticketPolicyId: decoded.ticketPolicyId,
        ticketAssetNameHex: decoded.ticketAssetNameHex,
        nftPolicyId: nft?.policyId ?? ticketPolicyId,
        nftAssetNameHex: nft?.assetNameHex ?? decoded.ticketAssetNameHex,
        nftQuantity: nft?.quantity ?? 0n,
        prizePoolHash: decoded.prizePoolHash,
        priceUsdmSubunits: decoded.priceUsdmSubunits,
        prizeAmountUsdmSubunits: decoded.prizeAmountUsdmSubunits,
        prizeStatus: decoded.prizeStatus,
        beaconStatus: decoded.beaconStatus,
        issuedAt: decoded.issuedAt,
        expiresAt: decoded.expiresAt,
      })
      if (policyAssets.length !== 1) decodeErrors.push({ utxoReference: reference, reason: 'TICKET_POLICY_ASSET_NOT_UNIQUE' })
    } catch (error) {
      decodeErrors.push({
        utxoReference: reference,
        reason: String(error?.message ?? error).slice(0, 240),
      })
    }
  }

  const tipAfter = await getTip(koiosUrl)
  const snapshotStable = tipBefore.slot === tipAfter.slot && tipBefore.blockHash === tipAfter.blockHash
  const rawEvidence = {
    schema: 'PRE-RICH-PROTECTED-CAPITAL-TICKET-CENSUS-RAW-V1',
    network: 'cardano-preprod',
    provider: 'Koios public Preprod API',
    prizeValidatorAddress: prizeAddress,
    ticketPolicyId,
    b1PrizePoolAddress: poolAddress,
    b1PrizePoolOutRef: poolOutRef,
    b1PoolSingletonUnit: poolSingletonUnit,
    observedAt: observedAt.toString(),
    tipBefore,
    tipAfter,
    snapshotStable,
    pagination: {
      complete: censusResult.paginationComplete,
      pageCount: censusResult.pageCount,
      pages: censusResult.pages,
      totalUtxos: censusResult.rows.length,
      maxRows,
    },
    decodeErrors,
    poolRow,
    poolDatumCbor,
    prizeRows: censusResult.rows,
  }
  const sourceManifestDigest = sha256(stableStringify(rawEvidence))

  await mkdir(evidenceDir, { recursive: true })
  const rawPath = evidenceDir + '/source-raw.json'
  const manifestPath = evidenceDir + '/source-manifest.json'
  const ledgerPath = evidenceDir + '/ticket-item-ledger.json'
  await writeFile(rawPath, jsonForFile(rawEvidence), 'utf8')

  if (!snapshotStable) {
    const manifest = {
      schema: 'PRE-RICH-PROTECTED-CAPITAL-TICKET-CENSUS-MANIFEST-V1',
      status: 'UNSTABLE_SNAPSHOT',
      sourceManifestDigest,
      sourceCompletenessAuthorityVerified: false,
      providerSignatureVerified: false,
      note: 'Koios tip changed during the multi-page read. Raw evidence is retained, but no same-snapshot ticket ledger is produced.',
      rawEvidence: rawPath,
    }
    await writeFile(manifestPath, jsonForFile(manifest), 'utf8')
    console.log(jsonForFile(manifest))
    process.exitCode = 2
    return
  }

  const decodedCount = records.length
  const census = {
    network: 'Preprod',
    observedSlot: BigInt(tipAfter.slot),
    observedAt,
    providerId: 'Koios public Preprod API',
    snapshotReference: 'preprod:' + tipAfter.slot + ':' + tipAfter.blockHash,
    sourceReference: 'POST /address_utxos limit/offset + exact POST /utxo_info ' + poolOutRef,
    sourceManifestDigest,
    prizeValidatorAddress: prizeAddress,
    prizeValidatorHash,
    b1PrizePoolScriptHash,
    ticketPolicyId,
    paginationComplete: censusResult.paginationComplete,
    pageCount: BigInt(censusResult.pageCount),
    sourceUtxoCount: BigInt(censusResult.rows.length),
    decodedPrizeDatumCount: BigInt(decodedCount),
    unclassifiedUtxoCount: BigInt(censusResult.rows.length - decodedCount),
    pool: {
      utxoReference: poolOutRef,
      datumDigest: sha256(Buffer.from(poolDatumCbor, 'hex')),
      snapshotReference: 'preprod:' + tipAfter.slot + ':' + tipAfter.blockHash,
      prizeValidatorHash: poolDatum.prizeValidatorHash,
      pendingLiabilitiesUsdmSubunits: poolDatum.pendingLiabilitiesUsdmSubunits,
      unresolvedReserveUsdmSubunits: poolDatum.unresolvedReserveUsdmSubunits,
      unresolvedTicketCount: poolDatum.unresolvedTicketCount,
      lockedJackpotUsdmSubunits: poolDatum.lockedJackpotUsdmSubunits,
      jackpotThresholdUsdmSubunits: poolDatum.jackpotThresholdUsdmSubunits,
    },
    records,
  }

  const ledger = buildPreRichProtectedCapitalItemLedger(census)
  const internalPass = ledger.qualification.ticketLedgerInternallyReconciled
  const manifest = {
    schema: 'PRE-RICH-PROTECTED-CAPITAL-TICKET-CENSUS-MANIFEST-V1',
    status: internalPass
      ? 'INTERNAL_RECONCILIATION_ONLY_SOURCE_AUTHORITY_UNVERIFIED'
      : 'NOT_RECONCILED',
    network: 'cardano-preprod',
    snapshotReference: census.snapshotReference,
    observedAt: observedAt.toString(),
    sourceManifestDigest,
    sourceCompletenessAuthorityVerified: false,
    providerSignatureVerified: false,
    paginationComplete: census.paginationComplete,
    pageCount: census.pageCount.toString(),
    sourceUtxoCount: census.sourceUtxoCount.toString(),
    decodedPrizeDatumCount: census.decodedPrizeDatumCount.toString(),
    unclassifiedUtxoCount: census.unclassifiedUtxoCount.toString(),
    decodeErrors,
    ticketLedgerInternallyReconciled: internalPass,
    fullProtectedCapitalQualified: false,
    r7L6EmptinessProven: false,
    qualificationBlockers: ledger.qualification.blockers,
    evidenceFiles: {
      rawSource: rawPath,
      ticketLedger: ledgerPath,
    },
    limitations: [
      'Koios is a read-only public query provider; this manifest is hashed but not provider-signed.',
      'Stable tip and exhausted pagination do not independently prove provider completeness or cryptographic source authority.',
      'This census covers only the configured PrizeValidator address and does not prove the full ProtectedCapital perimeter, L2 lifecycle, PA1-PA7, or global R7 L6 emptiness.',
      'No EEV, SafetyCapital, ReserveProtection, MandatoryFutureCosts, C, X(P), viability, B2, or Issue admission certificate is produced.',
    ],
  }

  await writeFile(ledgerPath, jsonForFile(ledger), 'utf8')
  await writeFile(manifestPath, jsonForFile(manifest), 'utf8')
  console.log(jsonForFile(manifest))
  if (!internalPass) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(jsonForFile({
      status: 'OBSERVATION_FAILED_CLOSED',
      error: String(error?.message ?? error).slice(0, 500),
      note: 'Public Koios reads only. No signing, transaction construction, submission, deployment, or Issue action.',
    }))
    process.exitCode = 1
  })
}
