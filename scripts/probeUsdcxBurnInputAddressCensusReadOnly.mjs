#!/usr/bin/env node
/**
 * Read-only census of the Cardano payment addresses funding every USDCx burn
 * returned by Koios asset_history. It does NOT call the undocumented IOG
 * withdrawal-history route. This stage only produces a bounded, auditable
 * burn-tx -> exact USDCx input UTxO -> payment-address map for a separate
 * correlation step.
 *
 * No wallet, signature, IOG call, burn, withdrawal, tx submission, approval,
 * deployment, Oracle update or chain mutation.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export const KOIOS = 'https://api.koios.rest/api/v1'
export const USDCX_POLICY = '1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e34'
export const USDCX_NAME = '5553444378'
export const USDCX_UNIT = USDCX_POLICY + USDCX_NAME
export const TX_HASHES_PER_BATCH = 20
export const MAX_BURN_EVENTS = 2_000
export const MAX_RESPONSE_BYTES = 12_000_000
const REQUEST_TIMEOUT_MS = 30_000
export const TX_INFO_BATCH_SPACING_MS = 5_200
export const MAX_TX_INFO_RATE_LIMIT_RETRIES = 3

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex')


export function retryDelayMs(retryAfter, attempt, nowMs = Date.now()) {
  if (!Number.isSafeInteger(attempt) || attempt < 0) throw new Error('RETRY_ATTEMPT_INVALID')
  if (typeof retryAfter === 'string' && retryAfter.trim()) {
    const value = retryAfter.trim()
    if (/^\d+(?:\.\d+)?$/.test(value)) {
      return Math.max(0, Math.ceil(Number(value) * 1_000))
    }
    const dateMs = Date.parse(value)
    if (Number.isFinite(dateMs)) return Math.max(0, dateMs - nowMs)
  }
  return Math.min(120_000, 30_000 * (2 ** attempt))
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function readJson(response, label) {
  const body = await response.text()
  const bytes = Buffer.byteLength(body, 'utf8')
  if (bytes > MAX_RESPONSE_BYTES) throw new Error(label + '_RESPONSE_TOO_LARGE')
  if (!response.ok) throw new Error(label + '_HTTP_' + response.status)
  let value
  try { value = JSON.parse(body) } catch { throw new Error(label + '_INVALID_JSON') }
  return {
    value,
    meta: {
      httpStatus: response.status,
      httpDate: response.headers?.get?.('date') ?? null,
      contentRange: response.headers?.get?.('content-range') ?? null,
      responseBytes: bytes,
      responseSha256: sha256(body),
    },
  }
}

export async function getJson(url, label, fetchFn = fetch) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetchFn(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'error',
    })
    const retryable = response.status === 429 || [500, 502, 503, 504].includes(response.status)
    if (!retryable || attempt >= MAX_TX_INFO_RATE_LIMIT_RETRIES) {
      return readJson(response, label)
    }
    await sleep(retryDelayMs(response.headers?.get?.('retry-after') ?? null, attempt))
  }
}

export async function postJson(url, payload, label, fetchFn = fetch) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'error',
    })
    const retryable = response.status === 429 || [500, 502, 503, 504].includes(response.status)
    if (!retryable || attempt >= MAX_TX_INFO_RATE_LIMIT_RETRIES) {
      return readJson(response, label)
    }
    await sleep(retryDelayMs(response.headers?.get?.('retry-after') ?? null, attempt))
  }
}
export function decodeTip(payload) {
  const tip = Array.isArray(payload) ? payload[0] : payload
  if (!tip || typeof tip.hash !== 'string' || !/^[0-9a-f]{64}$/i.test(tip.hash) ||
      !Number.isSafeInteger(Number(tip.abs_slot)) ||
      !Number.isSafeInteger(Number(tip.block_no))) {
    throw new Error('KOIOS_TIP_SHAPE_INVALID')
  }
  return {
    hash: tip.hash.toLowerCase(),
    absSlot: Number(tip.abs_slot),
    blockNo: Number(tip.block_no),
    blockTime: Number.isSafeInteger(Number(tip.block_time)) ? Number(tip.block_time) : null,
  }
}

export function decodeBurnEvents(payload) {
  if (!Array.isArray(payload)) throw new Error('KOIOS_ASSET_HISTORY_SHAPE_INVALID')
  const rows = payload.filter(x =>
    String(x?.policy_id ?? '').toLowerCase() === USDCX_POLICY &&
    String(x?.asset_name ?? '').toLowerCase() === USDCX_NAME
  )
  if (rows.length !== 1) throw new Error('KOIOS_EXACT_USDCX_HISTORY_NOT_UNIQUE')
  if (!Array.isArray(rows[0].minting_txs)) throw new Error('KOIOS_MINTING_TXS_ARRAY_MISSING')

  const seen = new Set()
  const burns = []
  for (const event of rows[0].minting_txs) {
    if (typeof event?.tx_hash !== 'string' || !/^[0-9a-f]{64}$/i.test(event.tx_hash) ||
        typeof event?.quantity !== 'string' || !/^-?\d+$/.test(event.quantity)) {
      throw new Error('KOIOS_HISTORY_EVENT_INVALID')
    }
    const txHash = event.tx_hash.toLowerCase()
    if (seen.has(txHash)) throw new Error('KOIOS_HISTORY_DUPLICATE_TX')
    seen.add(txHash)
    const quantity = BigInt(event.quantity)
    if (quantity < 0n) {
      burns.push({
        txHash,
        burnedAtomic: (-quantity).toString(),
        blockTime: Number.isSafeInteger(Number(event.block_time)) ? Number(event.block_time) : null,
      })
    }
  }
  if (burns.length === 0) throw new Error('KOIOS_NO_USDCX_BURNS_FOUND')
  if (burns.length > MAX_BURN_EVENTS) throw new Error('KOIOS_BURN_EVENT_SAFETY_LIMIT')
  return burns
}

function decodeAssetRows(rows, label, { signed = false } = {}) {
  if (!Array.isArray(rows)) throw new Error(label + '_ASSET_LIST_MISSING')
  return rows.filter(x =>
    String(x?.policy_id ?? '').toLowerCase() === USDCX_POLICY &&
    String(x?.asset_name ?? '').toLowerCase() === USDCX_NAME
  ).map(x => {
    const pattern = signed ? /^-?\d+$/ : /^\d+$/
    if (typeof x.quantity !== 'string' || !pattern.test(x.quantity)) {
      throw new Error(label + '_USDCX_QUANTITY_INVALID')
    }
    return BigInt(x.quantity)
  })
}

/**
 * Validates one Koios /tx_info batch and maps each requested negative mint
 * event to the payment addresses of input UTxOs that physically held USDCx.
 *
 * A burn is marked mapped only when:
 * - exactly one tx_info row exists for that hash;
 * - assets_minted contains exactly the matching negative USDCx quantity;
 * - inputs are present and decode correctly;
 * - positive USDCx input quantity covers the burn amount;
 * - each contributing input has a valid Cardano mainnet payment address.
 */
export function decodeBurnTxInfoBatch(requestedBurns, payload) {
  if (!Array.isArray(requestedBurns) || !Array.isArray(payload)) {
    throw new Error('KOIOS_TX_INFO_BATCH_SHAPE_INVALID')
  }
  const expected = new Map(requestedBurns.map(x => [x.txHash.toLowerCase(), x]))
  if (expected.size !== requestedBurns.length) throw new Error('REQUESTED_BURN_HASH_DUPLICATE')

  const returned = new Map()
  for (const row of payload) {
    const hash = String(row?.tx_hash ?? '').toLowerCase()
    if (!/^[0-9a-f]{64}$/.test(hash) || !expected.has(hash) || returned.has(hash)) {
      throw new Error('KOIOS_TX_INFO_HASH_SET_INVALID')
    }
    returned.set(hash, row)
  }

  const records = []
  for (const burn of requestedBurns) {
    const row = returned.get(burn.txHash.toLowerCase())
    if (!row) {
      records.push({
        txHash: burn.txHash,
        burnedAtomic: burn.burnedAtomic,
        status: 'TX_INFO_ROW_MISSING',
        inputAddresses: [],
        inputUsdcxAtomic: '0',
      })
      continue
    }

    const minted = decodeAssetRows(row.assets_minted, 'TX_INFO_MINTED', { signed: true })
    if (minted.length !== 1 || minted[0] !== -BigInt(burn.burnedAtomic)) {
      records.push({
        txHash: burn.txHash,
        burnedAtomic: burn.burnedAtomic,
        status: 'USDCX_BURN_MINTED_AMOUNT_MISMATCH',
        inputAddresses: [],
        inputUsdcxAtomic: '0',
      })
      continue
    }

    if (!Array.isArray(row.inputs) || row.inputs.length === 0) {
      records.push({
        txHash: burn.txHash,
        burnedAtomic: burn.burnedAtomic,
        status: 'TX_INFO_INPUTS_MISSING',
        inputAddresses: [],
        inputUsdcxAtomic: '0',
      })
      continue
    }

    let inputTotal = 0n
    const addresses = new Map()
    let malformedUsdcxInput = false
    for (const input of row.inputs) {
      const quantities = decodeAssetRows(input?.asset_list, 'TX_INPUT')
      if (quantities.length === 0) continue
      const amount = quantities.reduce((sum, value) => sum + value, 0n)
      inputTotal += amount
      const address = input?.payment_addr?.bech32
      if (typeof address !== 'string' || !/^addr1[0-9a-z]+$/.test(address)) {
        malformedUsdcxInput = true
        continue
      }
      const item = addresses.get(address) ?? { address, inputUsdcxAtomic: 0n }
      item.inputUsdcxAtomic += amount
      addresses.set(address, item)
    }

    if (malformedUsdcxInput) {
      records.push({
        txHash: burn.txHash,
        burnedAtomic: burn.burnedAtomic,
        status: 'USDCX_INPUT_PAYMENT_ADDRESS_MALFORMED',
        inputAddresses: [...addresses.values()].map(x => ({
          address: x.address, inputUsdcxAtomic: x.inputUsdcxAtomic.toString(),
        })),
        inputUsdcxAtomic: inputTotal.toString(),
      })
      continue
    }

    const inputAddresses = [...addresses.values()].map(x => ({
      address: x.address,
      inputUsdcxAtomic: x.inputUsdcxAtomic.toString(),
    })).sort((a, b) => a.address.localeCompare(b.address))

    records.push({
      txHash: burn.txHash,
      burnedAtomic: burn.burnedAtomic,
      status: inputTotal >= BigInt(burn.burnedAtomic) && inputAddresses.length > 0
        ? 'INPUT_PAYMENT_ADDRESSES_MAPPED'
        : 'USDCX_INPUT_QUANTITY_BELOW_BURN_OR_ADDRESS_ABSENT',
      inputAddresses,
      inputUsdcxAtomic: inputTotal.toString(),
    })
  }
  return records
}

export function summarizeBurnAddressCensus(records) {
  if (!Array.isArray(records)) throw new Error('BURN_RECORDS_ARRAY_REQUIRED')
  const addressMap = new Map()
  for (const record of records) {
    if (record.status !== 'INPUT_PAYMENT_ADDRESSES_MAPPED') continue
    for (const input of record.inputAddresses) {
      const entry = addressMap.get(input.address) ?? {
        address: input.address,
        burnTxHashes: [],
        totalUsdcxInputAtomic: 0n,
      }
      entry.burnTxHashes.push(record.txHash)
      entry.totalUsdcxInputAtomic += BigInt(input.inputUsdcxAtomic)
      addressMap.set(input.address, entry)
    }
  }
  const addresses = [...addressMap.values()]
    .map(x => ({
      address: x.address,
      burnTxHashes: [...new Set(x.burnTxHashes)].sort(),
      burnTxCount: new Set(x.burnTxHashes).size,
      totalUsdcxInputAtomic: x.totalUsdcxInputAtomic.toString(),
    }))
    .sort((a, b) => a.address.localeCompare(b.address))
  const mapped = records.filter(x => x.status === 'INPUT_PAYMENT_ADDRESSES_MAPPED').length
  return {
    burnEventCount: records.length,
    burnTxInfoMappedCount: mapped,
    burnTxInfoUnmappedCount: records.length - mapped,
    uniqueInputPaymentAddressCount: addresses.length,
    addresses,
  }
}

export async function runCensus({ fetchFn = fetch, now = () => new Date(), batchSize = TX_HASHES_PER_BATCH } = {}) {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 20) {
    throw new Error('TX_INFO_BATCH_SIZE_OUT_OF_RANGE')
  }
  const startedAt = now().toISOString()
  const tipBefore = await getJson(KOIOS + '/tip', 'KOIOS_TIP_BEFORE', fetchFn)
  const tipBeforeDecoded = decodeTip(tipBefore.value)

  await sleep(TX_INFO_BATCH_SPACING_MS)
  const history = await getJson(
    KOIOS + '/asset_history?_asset_policy=' + USDCX_POLICY + '&_asset_name=' + USDCX_NAME,
    'KOIOS_ASSET_HISTORY',
    fetchFn,
  )
  await sleep(TX_INFO_BATCH_SPACING_MS)
  const burns = decodeBurnEvents(history.value)

  const batches = []
  const records = []
  for (let offset = 0; offset < burns.length; offset += batchSize) {
    const batch = burns.slice(offset, offset + batchSize)
    const requestedHashes = batch.map(x => x.txHash)
    const response = await postJson(
      KOIOS + '/tx_info',
      { _tx_hashes: requestedHashes, _inputs: true, _assets: true },
      'KOIOS_TX_INFO_' + String(batches.length + 1).padStart(2, '0'),
      fetchFn,
    )
    const decoded = decodeBurnTxInfoBatch(batch, response.value)
    records.push(...decoded)
    batches.push({
      batchNumber: batches.length + 1,
      requestedCount: requestedHashes.length,
      returnedCount: response.value.length,
      requestedFirstHash: requestedHashes[0],
      requestedLastHash: requestedHashes[requestedHashes.length - 1],
      status: decoded.every(x => x.status === 'INPUT_PAYMENT_ADDRESSES_MAPPED')
        ? 'ALL_BATCH_BURNS_MAPPED'
        : 'BATCH_HAS_UNMAPPED_BURNS',
      responseMeta: response.meta,
    })
    if (offset + batchSize < burns.length) await sleep(TX_INFO_BATCH_SPACING_MS)
  }

  await sleep(TX_INFO_BATCH_SPACING_MS)
  const tipAfter = await getJson(KOIOS + '/tip', 'KOIOS_TIP_AFTER', fetchFn)
  const tipAfterDecoded = decodeTip(tipAfter.value)
  const summary = summarizeBurnAddressCensus(records)
  const status = summary.burnTxInfoUnmappedCount === 0 &&
    records.length === burns.length &&
    tipBeforeDecoded.hash === tipAfterDecoded.hash
    ? 'ALL_RETURNED_BURNS_MAPPED_TO_INPUT_PAYMENT_ADDRESSES'
    : 'PARTIAL_BURN_INPUT_ADDRESS_CENSUS'

  return {
    schema: 'IMMORTAL-USDCX-BURN-INPUT-ADDRESS-CENSUS-READONLY-v1',
    classification: 'READ_ONLY_INDEXER_INPUT_ADDRESS_DISCOVERY_NOT_IOG_WITHDRAWAL_OR_REDEMPTION_QUALIFICATION',
    startedAt,
    completedAt: now().toISOString(),
    network: 'cardano-mainnet',
    asset: {
      policyId: USDCX_POLICY,
      assetNameHex: USDCX_NAME,
      unit: USDCX_UNIT,
      decimals: 6,
    },
    source: {
      koiosAssetHistory: history.meta,
      koiosTxInfoBatches: batches,
      txInfoBatchSpacingMs: TX_INFO_BATCH_SPACING_MS,
      txInfoRateLimitRetries: MAX_TX_INFO_RATE_LIMIT_RETRIES,
      historyCompleteness: 'RETURNED_INDEXER_HISTORY_ONLY_NOT_INDEPENDENTLY_CERTIFIED',
      txInfoAddresses: 'PAYMENT_ADDRESSES_OF_INPUT_UTXOS_THAT_CONTAINED_EXACT_USDCX',
    },
    chainTip: {
      before: { ...tipBeforeDecoded, responseMeta: tipBefore.meta },
      after: { ...tipAfterDecoded, responseMeta: tipAfter.meta },
      unchangedDuringAcquisition: tipBeforeDecoded.hash === tipAfterDecoded.hash,
    },
    status,
    summary,
    burns: records,
    limitations: [
      'Koios asset_history is an indexer-returned event list; completeness is not independently certified.',
      'Koios tx_info is a separate endpoint but is operated by the same indexer family; it is not an independent ledger source.',
      'Input payment addresses are candidates for address-keyed IOG history correlation, not proof that IOG stores a matching withdrawal record for every burn.',
      'The observed IOG withdrawal-history route is not a published/versioned third-party API contract; this census does not call it.',
      'No IOG status, Ethereum release, collateral liability or redemption conclusion is inferred.',
      'No wallet, signature, burn, withdrawal request, transaction, approval, deployment or Oracle update is performed.',
    ],
  }
}

async function main() {
  const args = process.argv.slice(2)
  const index = args.indexOf('--out')
  const outputPath = resolve(index >= 0 && args[index + 1]
    ? args[index + 1]
    : 'audit/oracles/usdcx-burn-input-address-census-readonly.json')
  const result = await runCensus()
  const serialized = JSON.stringify(result, null, 2) + '\n'
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, serialized, { mode: 0o600 })
  console.log(JSON.stringify({
    output: outputPath,
    status: result.status,
    burnEventCount: result.summary.burnEventCount,
    burnTxInfoMappedCount: result.summary.burnTxInfoMappedCount,
    burnTxInfoUnmappedCount: result.summary.burnTxInfoUnmappedCount,
    uniqueInputPaymentAddressCount: result.summary.uniqueInputPaymentAddressCount,
    unchangedDuringAcquisition: result.chainTip.unchangedDuringAcquisition,
    sha256: sha256(serialized),
  }, null, 2))
}

if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(JSON.stringify({ error: error?.message ?? 'UNKNOWN_ERROR' }))
    process.exitCode = 1
  })
}
