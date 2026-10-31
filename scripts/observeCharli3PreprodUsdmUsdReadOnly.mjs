#!/usr/bin/env node
/**
 * Read-only Koios Preprod observer for the documented Charli3 USDM/USD feed.
 * Captures the live feed UTxO, NFT identity and datum freshness; no writes.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE = 'https://preprod.koios.rest/api/v1'
const ADDRESS = 'addr_test1wr0q3fr83cr0zv4gfdvzcquqzy242hgmvt7ey2d938rtwugyc76x9'
const NFT = Object.freeze({
  policyId: '424f268a65632944ddfe17967208178082058cbe9044f53aee28697d',
  assetNameHex: '4f7261636c6546656564',
})
const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')
const nftUnit = NFT.policyId + NFT.assetNameHex
const DOCUMENTED_FRESHNESS_WINDOW_MS = 3_600_000

function outputPath(argv) {
  const i = argv.indexOf('--out')
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve('audit/oracles/charli3-preprod-usdm-usd-readonly.json')
}

async function readJson(path, body) {
  const response = await fetch(BASE + path, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const raw = await response.text()
  const evidence = {
    url: BASE + path,
    method: 'POST',
    status: response.status,
    responseDate: response.headers.get('date'),
    bodySha256: sha256(raw),
    rawBody: raw,
  }
  if (!response.ok) return { json: null, evidence }
  try { return { json: JSON.parse(raw), evidence } }
  catch { return { json: null, evidence, parseError: true } }
}

function intValue(value) {
  const raw = value && typeof value === 'object' && value.int !== undefined ? value.int : value
  if (!(typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'bigint') || !/^-?\d+$/.test(String(raw))) return null
  return BigInt(raw)
}

function constr(value) {
  return value && typeof value === 'object' && Number.isInteger(value.constructor) && Array.isArray(value.fields)
    ? value : null
}

function bytesHex(value) {
  return value && typeof value.bytes === 'string' && /^(?:[0-9a-f]{2})*$/i.test(value.bytes)
    ? value.bytes.toLowerCase() : null
}

function humanBytes(value) {
  const hex = bytesHex(value)
  return hex === null ? null : Buffer.from(hex, 'hex').toString('utf8')
}

function decimalString(raw, precision) {
  if (raw === null || precision === null || precision < 0n || precision > 30n) return null
  const negative = raw < 0n
  const digits = (negative ? -raw : raw).toString().padStart(Number(precision) + 1, '0')
  if (precision === 0n) return (negative ? '-' : '') + digits
  const split = digits.length - Number(precision)
  return (negative ? '-' : '') + digits.slice(0, split) + '.' + digits.slice(split)
}

function decodePriceData(datum) {
  const root = constr(datum)
  if (!root || root.constructor !== 0) return { status: 'UNSUPPORTED_ROOT' }
  const generic = root.fields.map(constr).find((x) => x?.constructor === 2 && x.fields.length === 1 && Array.isArray(x.fields[0]?.map))
  if (!generic) return { status: 'GENERIC_PRICE_DATA_NOT_FOUND' }
  const entries = generic.fields[0].map
  const values = new Map()
  for (const entry of entries) {
    const key = intValue(entry?.k)
    if (key !== null) values.set(Number(key), entry?.v)
  }
  const rawPrice = intValue(values.get(0))
  const createdAt = intValue(values.get(1))
  const expiresAt = intValue(values.get(2))
  const precision = intValue(values.get(3))
  return {
    status: rawPrice === null || createdAt === null || expiresAt === null ? 'PRICE_FIELDS_INCOMPLETE' : 'DECODED',
    priceRaw: rawPrice?.toString() ?? null,
    precision: precision?.toString() ?? null,
    priceDecimal: decimalString(rawPrice, precision),
    createdAtMs: createdAt?.toString() ?? null,
    expiresAtMs: expiresAt?.toString() ?? null,
    baseAssetIdHex: bytesHex(values.get(4)),
    quoteAssetIdHex: bytesHex(values.get(5)),
    baseSymbol: humanBytes(values.get(6)),
    quoteSymbol: humanBytes(values.get(7)),
    baseName: humanBytes(values.get(8)),
    quoteName: humanBytes(values.get(9)),
  }
}

async function main() {
  const startedAt = new Date().toISOString()
  const PAGE_SIZE = 100
  const pages = []
  const rows = []
  for (let page = 0; page < 10; page += 1) {
    const offset = page * PAGE_SIZE
    const result = await readJson('/address_utxos?limit=' + PAGE_SIZE + '&offset=' + offset, {
      _addresses: [ADDRESS],
      _extended: true,
    })
    if (!Array.isArray(result.json)) {
      const evidence = {
        schema: 'immortal-charli3-preprod-usdm-usd-observation-v1',
        classification: 'SOURCE_UNAVAILABLE',
        network: 'cardano-preprod',
        startedAt,
        completedAt: new Date().toISOString(),
        provider: { name: 'Koios', baseUrl: BASE },
        target: { oracle: 'Charli3', feed: 'USDM/USD', address: ADDRESS, nft: NFT },
        acquisition: { pages, failedPage: page, error: result.evidence },
        candidates: [],
        limitations: ['No usable UTxO response was received; this is not evidence that the feed does not exist.'],
      }
      const out = outputPath(process.argv.slice(2))
      await mkdir(dirname(out), { recursive: true })
      await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
      console.log(JSON.stringify({ status: 'SOURCE_UNAVAILABLE', output: out, failedPage: page }))
      return
    }
    pages.push({ page, offset, returnedCount: result.json.length, response: result.evidence })
    rows.push(...result.json)
    if (result.json.length < PAGE_SIZE) break
    if (page === 9) throw new Error('KOIOS_PREPROD_FEED_PAGE_CAP_REACHED')
  }

  const invalidRows = rows.filter((row) => String(row.address ?? '') !== ADDRESS)
  const candidates = rows.map((row) => {
    const assets = (Array.isArray(row.asset_list) ? row.asset_list : []).map((asset) => ({
      policyId: String(asset.policy_id ?? '').toLowerCase(),
      assetNameHex: String(asset.asset_name ?? '').toLowerCase(),
      quantityRaw: String(asset.quantity ?? ''),
    }))
    const nftQuantity = BigInt(assets.find((asset) => asset.policyId + asset.assetNameHex === nftUnit)?.quantityRaw ?? '0')
    const priceData = decodePriceData(row.inline_datum?.value ?? null)
    const createdAt = priceData.createdAtMs === null ? null : Number(priceData.createdAtMs)
    const expiresAt = priceData.expiresAtMs === null ? null : Number(priceData.expiresAtMs)
    const now = Date.now()
    const activeByDatumTime = createdAt !== null && expiresAt !== null && expiresAt > now && createdAt <= now
    const ageMs = createdAt === null ? null : now - createdAt
    const withinDocumentedFreshnessWindow = ageMs !== null && ageMs >= 0 && ageMs <= DOCUMENTED_FRESHNESS_WINDOW_MS
    const exactFeedPairMatched = priceData.baseSymbol === 'USDM' && priceData.quoteSymbol === 'USD'
    return {
      utxoRef: String(row.tx_hash ?? '') + '#' + String(row.tx_index ?? ''),
      address: row.address ?? null,
      stakeAddress: row.stake_address ?? null,
      valueLovelaceRaw: String(row.value ?? ''),
      assets,
      oracleFeedNftQuantityRaw: nftQuantity.toString(),
      oracleFeedNftValidated: nftQuantity === 1n,
      datumHash: row.datum_hash ?? null,
      inlineDatumCborHex: row.inline_datum?.bytes ?? null,
      inlineDatumJson: row.inline_datum?.value ?? null,
      decodedPriceData: priceData,
      freshness: {
        evaluatedAt: new Date(now).toISOString(),
        createdAt: createdAt === null ? null : new Date(createdAt).toISOString(),
        expiresAt: expiresAt === null ? null : new Date(expiresAt).toISOString(),
        activeByDatumTime,
        withinDocumentedFreshnessWindow,
        ageMs,
      },
      exactFeedPairMatched,
      structuralStatus: invalidRows.length === 0 && nftQuantity === 1n &&
        priceData.status === 'DECODED' && exactFeedPairMatched
        ? 'FEED_UTXO_STRUCTURALLY_DECODED'
        : 'UNQUALIFIED_FEED_UTXO',
      feedObservationStatus: invalidRows.length === 0 && nftQuantity === 1n &&
        priceData.status === 'DECODED' && exactFeedPairMatched &&
        activeByDatumTime && withinDocumentedFreshnessWindow
        ? 'ACTIVE_PREPROD_FEED_OBSERVATION'
        : 'STALE_OR_UNQUALIFIED_PREPROD_FEED',
    }
  })

  const evidence = {
    schema: 'immortal-charli3-preprod-usdm-usd-observation-v1',
    classification: 'PREPROD_ORACLE_FEED_OBSERVATION_NOT_MAINNET_QUALIFICATION',
    network: 'cardano-preprod',
    startedAt,
    completedAt: new Date().toISOString(),
    provider: { name: 'Koios', baseUrl: BASE },
    target: {
      oracle: 'Charli3',
      feed: 'USDM/USD',
      address: ADDRESS,
      feedNft: NFT,
      documentedConfiguration: {
        nodes: 5,
        minimumUpdatedNodes: 3,
        freshnessWindowSeconds: 3600,
        generationFrequencySeconds: 3600,
        minimumTriggerDeviationPercent: 2,
        interquartileRangeConstant: 1,
        percentageDeviation: 15,
        signatoriesPool: 2,
        requiredSignatories: 1,
      },
    },
    acquisition: {
      endpoint: '/address_utxos',
      requestEvidence: pages.map((page) => page.response),
      pageCount: pages.length,
      returnedUtxoCount: rows.length,
      paginationComplete: pages.length > 0 && pages[pages.length - 1].returnedCount < PAGE_SIZE,
      invalidAddressRows: invalidRows.length,
      feedNftCandidateCount: candidates.filter((candidate) => candidate.oracleFeedNftValidated).length,
    },
    candidates,
    limitations: [
      'This is a Preprod feed, not a Mainnet oracle deployment or Mainnet qualification.',
      'Feed configuration values are transcribed from Charli3 Preprod documentation; on-chain live datum and freshness must be independently verified.',
      'The decoded price is source-supplied oracle data; this observer does not verify Charli3 node signatures or provenance package.',
      'No wallet, signing, transaction submission, oracle refresh, deployment or chain write occurs.',
    ],
  }
  const out = outputPath(process.argv.slice(2))
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_CHARLI3_PREPROD_OBSERVATION_COMPLETE',
    output: out,
    utxoCount: rows.length,
    feedNftCandidates: evidence.acquisition.feedNftCandidateCount,
    decoded: candidates.filter((candidate) => candidate.decodedPriceData.status === 'DECODED').length,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_CHARLI3_PREPROD_OBSERVATION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
