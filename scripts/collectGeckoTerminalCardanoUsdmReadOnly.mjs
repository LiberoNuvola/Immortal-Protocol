#!/usr/bin/env node
/**
 * Read-only GeckoTerminal Cardano USDM pool discovery by exact policy+asset-name unit.
 * The public API is a secondary indexer, not an independent venue or oracle.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE = 'https://api.geckoterminal.com/api/v2'
const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
})
const ASSET_UNIT = ASSET.policyId + ASSET.assetNameHex
const VERSION = '20230203'
const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function outputPath(argv) {
  const i = argv.indexOf('--out')
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve('audit/oracles/geckoterminal-cardano-usdm-readonly.json')
}

async function request(path) {
  const url = BASE + path
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json;version=' + VERSION,
    },
  })
  const raw = await response.text()
  const evidence = {
    url,
    method: 'GET',
    status: response.status,
    responseDate: response.headers.get('date'),
    contentType: response.headers.get('content-type'),
    bodySha256: sha256(raw),
    rawBody: raw,
  }
  if (!response.ok) return { evidence, json: null }
  try { return { evidence, json: JSON.parse(raw) } }
  catch { return { evidence, json: null, parseError: true } }
}

async function main() {
  const startedAt = new Date().toISOString()
  const result = await request('/networks/cardano/tokens/' + encodeURIComponent(ASSET_UNIT) + '/pools?page=1')
  const data = Array.isArray(result.json?.data) ? result.json.data : []
  const included = Array.isArray(result.json?.included) ? result.json.included : []
  const exactTokenId = 'cardano_' + ASSET_UNIT
  const pools = data.map((pool) => {
    const baseToken = pool.relationships?.base_token?.data?.id ?? null
    const quoteToken = pool.relationships?.quote_token?.data?.id ?? null
    return {
    id: pool.id ?? null,
    address: pool.attributes?.address ?? null,
    name: pool.attributes?.name ?? null,
    dexId: pool.relationships?.dex?.data?.id ?? null,
    baseToken,
    quoteToken,
    exactUsdmPairIdentityMatched: baseToken === exactTokenId || quoteToken === exactTokenId,
    reserveInUsd: pool.attributes?.reserve_in_usd ?? null,
    volumeUsd: pool.attributes?.volume_usd ?? null,
    priceChangePercentage: pool.attributes?.price_change_percentage ?? null,
    baseTokenPriceUsd: pool.attributes?.base_token_price_usd ?? null,
    quoteTokenPriceUsd: pool.attributes?.quote_token_price_usd ?? null,
    tokenPriceUsd: pool.attributes?.token_price_usd ?? null,
    usdmPriceUsd: baseToken === exactTokenId
      ? pool.attributes?.base_token_price_usd ?? null
      : quoteToken === exactTokenId
        ? pool.attributes?.quote_token_price_usd ?? null
        : null,
    usdmPriceOrientation: baseToken === exactTokenId ? 'base' : quoteToken === exactTokenId ? 'quote' : null,
  }})
  const exactUsdmPoolCount = pools.filter((pool) => pool.exactUsdmPairIdentityMatched).length
  const venueCounts = pools.reduce((counts, pool) => {
    const venue = String(pool.dexId ?? 'UNKNOWN')
    counts[venue] = (counts[venue] ?? 0) + 1
    return counts
  }, {})
  const evidence = {
    schema: 'immortal-geckoterminal-cardano-usdm-readonly-v1',
    classification: 'SECONDARY_DEX_INDEXER_OBSERVATION_NOT_INDEPENDENT_VENUE_OR_ORACLE',
    network: 'cardano-mainnet',
    source: {
      name: 'GeckoTerminal public API V2',
      baseUrl: BASE,
      docs: 'https://api.geckoterminal.com/docs/index.html',
      apiVersion: VERSION,
      documentedPublicRateLimitPerMinute: 10,
      cacheWindowSeconds: 60,
    },
    exactAsset: ASSET,
    acquisition: {
      endpoint: '/networks/cardano/tokens/{token_address}/pools',
      request: result.evidence,
      returnedPoolCount: data.length,
      includedResourceCount: included.length,
      exactUsdmPoolCount,
      venueCounts,
      nextPage: result.json?.links?.next ?? null,
      paginationComplete: !result.json?.links?.next,
    },
    pools,
    startedAt,
    completedAt: new Date().toISOString(),
    limitations: [
      'GeckoTerminal is a secondary market-data indexer; it does not create an independent DEX venue.',
      'Minswap pools overlap the Minswap venue already observed through Minswap API and Koios; WingRiders and SundaeSwap remain distinct venues.',
      'Pool USD reserves, volume and price fields are source-reported metrics, not independent oracle observations.',
      'Exact token identity is checked against the Cardano policy ID plus asset name; no ticker-only match is accepted.',
      'The endpoint returns top pools for a token, not a guaranteed exhaustive pool census; only one page is requested to respect the free public API rate limit.',
      'No price/peg qualification, oracle qualification, EEV valuation, deployment approval, transaction, wallet, signature, refresh or chain write is produced.',
    ],
  }
  const out = outputPath(process.argv.slice(2))
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_GECKOTERMINAL_COLLECTION_COMPLETE',
    output: out,
    returnedPoolCount: data.length,
    exactUsdmPoolCount,
    venueCounts,
    paginationComplete: evidence.acquisition.paginationComplete,
    httpStatus: result.evidence.status,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_GECKOTERMINAL_COLLECTION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
