#!/usr/bin/env node
/**
 * Read-only Charli3 Mainnet ADA/USD feed observer.
 * Verifies the exact feed address and OracleFeed NFT, decodes the official
 * Charli3 standard datum, preserves raw Koios evidence and reports freshness.
 * No wallet, signing, transaction, oracle refresh, or chain write.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { decodeCharli3Datum } from './lib/charli3Datum.mjs'

const BASE = (process.env.KOIOS_MAINNET_URL ?? 'https://api.koios.rest/api/v1').replace(/\/$/, '')
const ADDRESS = 'addr1wyvxns52tsgz8ggvrh4np5gjyfk0g5fshqq2ytvu9t7pe8qp3adw6'
const FEED_NFT = {
  policyId: '08c56c0fa73748a23c3bc1d9e6a60a4187416fc4ff8fe3475506990e',
  assetNameHex: '4f7261636c6546656564',
}
const EXPECTED = { baseSymbol: 'ADA', quoteSymbol: 'USD' }
const MAX_AGE_MS = 6 * 60 * 60 * 1000
const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function outputPath(argv) {
  const i = argv.indexOf('--out')
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve('audit/oracles/charli3-ada-usd-mainnet-readonly.json')
}

async function readJson(path, body) {
  const response = await fetch(BASE + path, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'IMMORTAL-Agent-A-Charli3-readonly/1.0' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  })
  const raw = await response.text()
  const evidence = {
    url: BASE + path,
    method: 'POST',
    status: response.status,
    responseDate: response.headers.get('date'),
    bodyBytes: Buffer.byteLength(raw),
    bodySha256: sha256(raw),
    rawBody: raw,
  }
  if (!response.ok) throw Object.assign(new Error('KOIOS_HTTP_' + response.status + ':' + path), { evidence })
  let json
  try { json = JSON.parse(raw) } catch {
    throw Object.assign(new Error('KOIOS_JSON_INVALID:' + path), { evidence })
  }
  return { json, evidence }
}

function quantity(utxo) {
  const asset = (utxo.asset_list ?? []).find((x) =>
    String(x.policy_id ?? '').toLowerCase() === FEED_NFT.policyId &&
    String(x.asset_name ?? '').toLowerCase() === FEED_NFT.assetNameHex)
  return BigInt(String(asset?.quantity ?? '0'))
}

function formatScaled(value, precision) {
  const scale = 10n ** BigInt(precision)
  const whole = value / scale
  const fraction = (value % scale).toString().padStart(precision, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

async function main() {
  const startedAt = new Date().toISOString()
  const out = outputPath(process.argv.slice(2))
  const responseEvidence = []
  try {
    const PAGE_SIZE = 1000
    const scan = await readJson(
      '/asset_utxos?address=eq.' + encodeURIComponent(ADDRESS) + '&limit=' + PAGE_SIZE + '&offset=0',
      { _asset_list: [[FEED_NFT.policyId, FEED_NFT.assetNameHex]], _extended: true },
    )
    responseEvidence.push(scan.evidence)
    if (!Array.isArray(scan.json)) throw new Error('KOIOS_CHARLI3_ASSET_UTXOS_SHAPE_INVALID')
    const candidates = scan.json.filter((u) =>
      String(u.address ?? '') === ADDRESS &&
      String(u.payment_cred ?? '').length > 0 &&
      quantity(u) === 1n,
    )
    const observedAt = Date.now()
    const decoded = []
    const invalid = []
    for (const u of candidates) {
      const utxoRef = String(u.tx_hash ?? '').toLowerCase() + '#' + String(u.tx_index)
      try {
        const datum = decodeCharli3Datum(u.inline_datum?.value ?? null)
        const adaUsd = datum.prices.filter((p) =>
          p.baseSymbol === EXPECTED.baseSymbol && p.quoteSymbol === EXPECTED.quoteSymbol,
        )
        if (adaUsd.length !== 1) throw new Error('CHARLI3_ADA_USD_PRICE_CARDINALITY:' + adaUsd.length)
        const price = adaUsd[0]
        const priceRaw = BigInt(price.priceRaw)
        const timestampMs = BigInt(price.timestampMs)
        const expiryMs = BigInt(price.expiryMs)
        if (priceRaw <= 0n || timestampMs <= 0n || expiryMs <= timestampMs || price.precision < 0 || price.precision > 18) {
          throw new Error('CHARLI3_ADA_USD_PRICE_FIELDS_INVALID')
        }
        const ageMs = observedAt - Number(timestampMs)
        const expiryRemainingMs = Number(expiryMs) - observedAt
        const freshness = ageMs < 0
          ? 'FUTURE_TIMESTAMP'
          : expiryRemainingMs <= 0
            ? 'EXPIRED'
            : ageMs > MAX_AGE_MS
              ? 'STALE'
              : 'FRESH'
        decoded.push({
          utxoRef,
          address: u.address,
          paymentCredential: String(u.payment_cred ?? '').toLowerCase(),
          feedNftQuantityRaw: quantity(u).toString(),
          datumHash: u.datum_hash ?? null,
          inlineDatumCborHex: u.inline_datum?.bytes ?? null,
          baseSymbol: price.baseSymbol,
          quoteSymbol: price.quoteSymbol,
          priceRaw: price.priceRaw,
          precision: price.precision,
          priceDecimal: formatScaled(priceRaw, price.precision),
          timestampMs: timestampMs.toString(),
          timestampIso: new Date(Number(timestampMs)).toISOString(),
          expiryMs: expiryMs.toString(),
          expiryIso: new Date(Number(expiryMs)).toISOString(),
          ageMsAtCapture: ageMs,
          expiryRemainingMsAtCapture: expiryRemainingMs,
          freshness,
          extendedData: datum.extendedData,
          otherPriceMaps: datum.prices.filter((p) => p !== price),
          transactionHash: String(u.tx_hash ?? '').toLowerCase(),
          transactionIndex: Number(u.tx_index),
        })
      } catch (e) {
        invalid.push({ utxoRef, reason: e instanceof Error ? e.message : String(e), datumHash: u.datum_hash ?? null })
      }
    }

    const txHashes = [...new Set(decoded.map((x) => x.transactionHash).filter(Boolean))]
    const txContext = {}
    for (const hash of txHashes) {
      const r = await readJson('/tx_info', { _tx_hashes: [hash] })
      responseEvidence.push(r.evidence)
      const tx = Array.isArray(r.json) ? r.json.find((x) => String(x.tx_hash ?? '').toLowerCase() === hash) : null
      txContext[hash] = tx ? {
        blockHash: tx.block_hash ?? null,
        blockHeight: tx.block_height ?? null,
        epochNo: tx.epoch_no ?? null,
        absoluteSlot: tx.absolute_slot ?? tx.slot_no ?? null,
        blockTime: tx.block_time ?? tx.tx_timestamp ?? null,
      } : null
    }
    for (const row of decoded) row.transactionContext = txContext[row.transactionHash] ?? null

    const valid = decoded.filter((x) => x.freshness === 'FRESH')
    const stale = decoded.filter((x) => x.freshness !== 'FRESH')
    const result = {
      schema: 'immortal-charli3-ada-usd-mainnet-readonly-v1',
      classification: 'ONCHAIN_CHARLI3_ADA_USD_ORACLE_OBSERVATION_NOT_USDM_PEG_OR_EEV_QUALIFICATION',
      network: 'cardano-mainnet',
      startedAt,
      completedAt: new Date().toISOString(),
      source: {
        name: 'Charli3 Push Oracle',
        documentation: 'https://docs.charli3.io/oracles/resources/networks/mainnet',
        datumStandard: 'https://docs.charli3.io/oracles/overview/datum-standard',
      },
      target: { address: ADDRESS, feedNft: FEED_NFT, pair: 'ADA/USD', expectedBaseSymbol: 'ADA', expectedQuoteSymbol: 'USD', configuredFreshnessMs: MAX_AGE_MS },
      acquisition: {
        provider: 'Koios',
        baseUrl: BASE,
        endpoint: '/asset_utxos',
        exactAssetFilter: FEED_NFT,
        addressFilter: ADDRESS,
        extended: true,
        returnedUtxoCount: scan.json.length,
        candidateCount: candidates.length,
        transactionLookups: txHashes.length,
        responseEvidence: responseEvidence.map((x) => ({ url: x.url, status: x.status, responseDate: x.responseDate, bodySha256: x.bodySha256, bodyBytes: x.bodyBytes })),
      },
      summary: {
        candidateCount: candidates.length,
        decodedAdaUsdCount: decoded.length,
        freshCount: valid.length,
        staleOrExpiredCount: stale.length,
        invalidCount: invalid.length,
        latestTimestampIso: decoded.sort((a,b) => b.timestampMs.localeCompare(a.timestampMs))[0]?.timestampIso ?? null,
        freshness: valid.length > 0 ? 'FRESH' : decoded.length > 0 ? 'STALE_OR_EXPIRED' : 'MISSING_OR_INVALID',
      },
      feeds: decoded,
      invalid,
      rawResponses: responseEvidence,
      limitations: [
        'The feed is an on-chain Charli3 aggregate, not a raw CEX quote; its configured nodes and source mix must be considered when comparing with CEX references.',
        'The documented mainnet network configuration specifies five nodes, a 3-of-5 update threshold, six-hour freshness/cadence, 15% deviation threshold and two required signatories.',
        'This observer verifies the published datum shape, feed NFT/address, ADA/USD symbols and timestamp/expiry; it does not independently audit the off-chain node source data or aggregation transaction.',
        'No USDM/USD peg, issuer reserves/redemption, EEV valuation, oracle quorum policy, or deployment approval is produced.',
        'Only public Koios reads are performed; no wallet, signing, transaction, oracle refresh or chain write occurs.',
      ],
    }
    result.status = valid.length > 0 ? 'OBSERVED_FRESH_CHARLI3_ADA_USD' : decoded.length > 0 ? 'OBSERVED_STALE_CHARLI3_ADA_USD' : 'CHARLI3_ADA_USD_UNAVAILABLE_OR_INVALID'
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
    console.log(JSON.stringify({ status: result.status, output: out, summary: result.summary, completedAt: result.completedAt }, null, 2))
    if (decoded.length === 0) process.exitCode = 1
  } catch (error) {
    const result = {
      schema: 'immortal-charli3-ada-usd-mainnet-readonly-v1',
      classification: 'ONCHAIN_CHARLI3_ADA_USD_ORACLE_OBSERVATION_NOT_USDM_PEG_OR_EEV_QUALIFICATION',
      network: 'cardano-mainnet',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'CHARLI3_ADA_USD_OBSERVATION_FAILED',
      error: error instanceof Error ? error.message : String(error),
      failedResponse: error?.evidence ?? null,
      rawResponses: responseEvidence,
    }
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
    console.error(JSON.stringify({ status: result.status, error: result.error, output: out }, null, 2))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main()
