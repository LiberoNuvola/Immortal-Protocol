#!/usr/bin/env node
/**
 * SuperCardano public market-data observer for the exact Moneta USDM asset.
 *
 * Read-only GETs only. Captures the independent indexer's pool and settled-trade
 * view without treating it as an independent market venue or USD oracle.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
})
const UNIT = ASSET.policyId + ASSET.assetNameHex
const BASE = 'https://supercardano.com/api/v1'
const TIMEOUT_MS = 30_000

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function outputPath(argv) {
  const index = argv.indexOf('--out')
  return index >= 0 && argv[index + 1]
    ? resolve(argv[index + 1])
    : resolve('audit/oracles/supercardano-usdm-readonly.json')
}

async function getJson(path) {
  const url = BASE + path
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const rawBody = await response.text()
  const evidence = {
    url,
    status: response.status,
    ok: response.ok,
    dateHeader: response.headers.get('date'),
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
    contentType: response.headers.get('content-type'),
    bodySha256: sha256(rawBody),
    bodyBytes: Buffer.byteLength(rawBody),
    rawBody,
  }
  if (!response.ok) {
    const error = new Error('SUPERCARDANO_HTTP_' + response.status)
    error.evidence = evidence
    throw error
  }
  let json
  try {
    json = JSON.parse(rawBody)
  } catch {
    const error = new Error('SUPERCARDANO_JSON_INVALID')
    error.evidence = evidence
    throw error
  }
  evidence.json = json
  return evidence
}

function unitOf(asset) {
  return String(asset?.currency_symbol ?? asset?.policyId ?? '').toLowerCase() +
    String(asset?.token_name ?? asset?.assetNameHex ?? '').toLowerCase()
}

async function main() {
  const startedAt = new Date().toISOString()
  const poolPath = '/markets/tokens/' + UNIT
  const tradesPath = poolPath + '/trades'
  const responses = []
  let status = 'READ_ONLY_COLLECTION_COMPLETE'
  let error = null

  try {
    const poolsResponse = await getJson(poolPath)
    responses.push(poolsResponse)
    const tradesResponse = await getJson(tradesPath)
    responses.push(tradesResponse)

    const tokenData = poolsResponse.json?.data
    const tradesData = tradesResponse.json?.data
    if (tokenData?.unit?.toLowerCase() !== UNIT) throw new Error('SUPERCARDANO_TOKEN_IDENTITY_MISMATCH')
    if (!Array.isArray(tokenData.pools)) throw new Error('SUPERCARDANO_POOL_SCHEMA_INVALID')
    if (!Array.isArray(tradesData?.rows)) throw new Error('SUPERCARDANO_TRADES_SCHEMA_INVALID')

    const asOfTime = Number(tokenData.asOf ?? poolsResponse.json.meta?.asOf?.time ?? 0)
    const pools = tokenData.pools.map((pool) => {
      const ageSeconds = asOfTime > 0 && Number.isFinite(Number(pool.time))
        ? Math.max(0, asOfTime - Number(pool.time))
        : null
      return {
        ...pool,
        ageSecondsAtSourceAsOf: ageSeconds,
        freshnessAtSourceAsOf: ageSeconds === null
          ? 'UNKNOWN'
          : ageSeconds < 86_400 ? 'UNDER_24H'
            : ageSeconds < 604_800 ? 'ONE_TO_SEVEN_DAYS' : 'OVER_SEVEN_DAYS',
        exactUsdmInPair: String(pool.assetA ?? '').toLowerCase() === UNIT ||
          String(pool.assetB ?? '').toLowerCase() === UNIT,
      }
    })
    const trades = tradesData.rows.filter((trade) => String(trade.unit ?? '').toLowerCase() === UNIT)

    const byVenue = {}
    const freshnessByVenue = {}
    for (const pool of pools) {
      const venue = pool.venue ?? 'UNKNOWN'
      byVenue[venue] = (byVenue[venue] ?? 0) + 1
      freshnessByVenue[venue] ??= { UNDER_24H: 0, ONE_TO_SEVEN_DAYS: 0, OVER_SEVEN_DAYS: 0, UNKNOWN: 0 }
      freshnessByVenue[venue][pool.freshnessAtSourceAsOf] += 1
    }
    const tradeByVenue = {}
    const tradeLevelsByVenue = {}
    const flaggedTradeCountByFlag = {}
    for (const trade of trades) {
      const venue = trade.venue ?? 'UNKNOWN'
      tradeByVenue[venue] = (tradeByVenue[venue] ?? 0) + 1
      tradeLevelsByVenue[venue] ??= {}
      const level = String(trade.level ?? 'UNKNOWN')
      tradeLevelsByVenue[venue][level] = (tradeLevelsByVenue[venue][level] ?? 0) + 1
      for (const flag of trade.flags ?? []) {
        flaggedTradeCountByFlag[flag] = (flaggedTradeCountByFlag[flag] ?? 0) + 1
      }
    }

    const result = {
      schema: 'immortal-supercardano-usdm-readonly-v1',
      classification: 'INDEPENDENT_ONCHAIN_INDEXER_OBSERVATION_NOT_INDEPENDENT_MARKET_ORACLE',
      network: 'cardano-mainnet',
      source: {
        name: 'SuperCardano',
        baseUrl: BASE,
        method: 'public HTTP GET; own Cardano node/indexer as described by source methodology',
        methodologyUrl: 'https://supercardano.com/methodology',
      },
      exactAsset: ASSET,
      unit: UNIT,
      startedAt,
      completedAt: new Date().toISOString(),
      sourceMeta: {
        token: poolsResponse.json.meta ?? null,
        trades: tradesResponse.json.meta ?? null,
        asOfBlockHeight: poolsResponse.json.meta?.asOf?.height ?? null,
        asOfUnixTime: poolsResponse.json.meta?.asOf?.time ?? null,
      },
      summary: {
        tokenPoolCount: pools.length,
        poolCountByVenue: byVenue,
        poolFreshnessByVenueAtSourceAsOf: freshnessByVenue,
        tradeRowsReturned: tradesData.rows.length,
        exactUsdmTradeRows: trades.length,
        exactUsdmTradeRowsByVenue: tradeByVenue,
        tradeLevelsByVenue,
        flaggedTradeCountByFlag,
        tokenPriceAda: tokenData.price ?? null,
        tokenLiquidityRaw: tokenData.liquidity ?? null,
        tokenChange24h: tokenData.change24h ?? null,
        activity: tokenData.activity ?? null,
      },
      pools,
      trades,
      rawResponses: responses.map(({ json, ...raw }) => raw),
      limitations: [
        'This is a separately operated on-chain indexer observation, not a separate DEX venue: its pool and trade records describe the same public Cardano ledger.',
        'SuperCardano methodology states that ADA/USD is currently displayed via DexHunter; this observer therefore preserves ADA-denominated pool/trade evidence and does not treat USD conversions as an independent USD source.',
        'The source methodology says its own pool price surface currently reads Minswap V2, while other DEX readers are being brought online; venue-level pool and trade rows must be assessed separately for coverage and freshness.',
        'Pool and trade observations are subject to the source own freshness, decoder coverage, and methodology. A missing row is not proof that a venue has no pool.',
        'No USDM/USD peg, issuer reserve, oracle qualification, EEV valuation, or deployment approval is produced.',
        'Only public GET requests are made; no wallet, signing, transaction, oracle refresh, or chain write occurs.',
      ],
    }

    const out = outputPath(process.argv.slice(2))
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
    console.log(JSON.stringify({
      status,
      output: out,
      summary: result.summary,
      completedAt: result.completedAt,
    }, null, 2))
  } catch (cause) {
    status = 'READ_ONLY_COLLECTION_FAILED'
    error = cause instanceof Error ? cause.message : String(cause)
    const out = outputPath(process.argv.slice(2))
    const result = {
      schema: 'immortal-supercardano-usdm-readonly-v1',
      status,
      network: 'cardano-mainnet',
      exactAsset: ASSET,
      startedAt,
      completedAt: new Date().toISOString(),
      error,
      failedResponse: cause?.evidence ?? null,
      rawResponses: responses.map(({ json, ...raw }) => raw),
    }
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
    console.error(JSON.stringify({ status, error, output: out }, null, 2))
    process.exitCode = 1
  }
}

main()
