#!/usr/bin/env node
/**
 * Read-only MuesliSwap pool discovery for the exact Moneta USDM asset.
 * Queries both pool orientations and restricts providers to MuesliSwap V1/V2.
 * No trading, order placement, wallet or chain write.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE = 'https://api.muesliswap.com'
const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
})
const ASSET_UNIT = ASSET.policyId + ASSET.assetNameHex
const PROVIDERS = 'muesliswap_v2,muesliswap'
const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function outputPath(argv) {
  const i = argv.indexOf('--out')
  return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve('audit/oracles/muesliswap-cardano-usdm-readonly.json')
}

async function request(queryName, tokenSide, onlyVerified) {
  const params = new URLSearchParams({
    [tokenSide]: ASSET.policyId + '.' + ASSET.assetNameHex,
    'only-verified': onlyVerified,
    providers: PROVIDERS,
  })
  const url = BASE + '/liquidity/pools?' + params.toString()
  let response
  try {
    response = await fetch(url, { headers: { accept: 'application/json' } })
  } catch (error) {
    return {
      evidence: {
        queryName, tokenSide, url, method: 'GET', status: null,
        responseDate: null, contentType: null, bodySha256: null, rawBody: null,
        networkError: {
          name: error instanceof Error ? error.name : 'Error',
          message: error instanceof Error ? error.message : String(error),
          cause: error?.cause ? String(error.cause) : null,
        },
      },
      json: null,
    }
  }
  const raw = await response.text()
  const evidence = {
    queryName,
    tokenSide,
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

function unit(address) {
  return String(address?.policyId ?? '').toLowerCase() + String(address?.name ?? '').toLowerCase()
}

function poolSummary(pool, queryName, onlyVerified) {
  const baseUnit = unit(pool.baseAddress)
  const quoteUnit = unit(pool.quoteAddress)
  return {
    queryName,
    onlyVerifiedQuery: onlyVerified,
    provider: pool.provider ?? pool.providerName ?? pool.dex ?? null,
    poolId: pool.id ?? pool.poolId ?? pool.lpAssetId ?? null,
    baseAddress: pool.baseAddress ?? null,
    quoteAddress: pool.quoteAddress ?? null,
    baseUnit,
    quoteUnit,
    exactUsdmFound: baseUnit === ASSET_UNIT || quoteUnit === ASSET_UNIT,
    exactPair: {
      baseDecimals: pool.baseDecimalPlaces ?? null,
      quoteDecimals: pool.quoteDecimalPlaces ?? null,
      price: pool.price ?? null,
      bidPrice: pool.bidPrice ?? null,
      askPrice: pool.askPrice ?? null,
      volume: pool.volume ?? null,
      liquidity: pool.liquidity ?? pool.tvl ?? null,
      fee: pool.fee ?? null,
    },
    rawPool: pool,
  }
}

async function main() {
  const startedAt = new Date().toISOString()
  // Query both verified-only and unfiltered modes. The public API supports
  // only-verified=y/n; retaining both prevents a verified-only filter from
  // silently hiding a real pool. Every query variant is preserved separately.
  const requests = await Promise.all([
    request('USDM_AS_TOKEN_A_VERIFIED', 'token-a', 'y'),
    request('USDM_AS_TOKEN_B_VERIFIED', 'token-b', 'y'),
    request('USDM_AS_TOKEN_A_UNFILTERED', 'token-a', 'n'),
    request('USDM_AS_TOKEN_B_UNFILTERED', 'token-b', 'n'),
  ])
  const queryResults = requests.map((result, index) => ({
    ...result,
    queryName: ['token-a-verified', 'token-b-verified', 'token-a-unfiltered', 'token-b-unfiltered'][index],
    tokenSide: ['token-a', 'token-b', 'token-a', 'token-b'][index],
    onlyVerified: ['y', 'y', 'n', 'n'][index],
  }))
  const queryPools = queryResults.map((result) => ({
    queryName: result.queryName,
    tokenSide: result.tokenSide,
    onlyVerified: result.onlyVerified,
    count: Array.isArray(result.json) ? result.json.length : 0,
    status: result.evidence.status,
    bodySha256: result.evidence.bodySha256,
  }))
  const summaries = queryResults.flatMap((result) =>
    (Array.isArray(result.json) ? result.json : [])
      .map((pool) => poolSummary(pool, result.tokenSide, result.onlyVerified)),
  )
  const byKey = new Map()
  for (const pool of summaries) {
    const key = String(pool.provider ?? 'unknown') + ':' + String(pool.poolId ?? pool.baseUnit + ':' + pool.quoteUnit)
    const existing = byKey.get(key)
    if (!existing) byKey.set(key, { ...pool, queryVariants: [pool.queryName] })
    else if (!existing.queryVariants.includes(pool.queryName)) existing.queryVariants.push(pool.queryName)
  }
  const pools = [...byKey.values()]
  const basePools = summaries.filter((pool) => pool.queryName === 'token-a').length
  const quotePools = summaries.filter((pool) => pool.queryName === 'token-b').length
  const evidence = {
    schema: 'immortal-muesliswap-cardano-usdm-readonly-v1',
    classification: 'INDEPENDENT_DEX_VENUE_OBSERVATION_NOT_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    source: {
      name: 'MuesliSwap public API',
      baseUrl: BASE,
      docs: 'https://docs.muesliswap.com/muesli-api',
      terms: 'Official docs describe API as private-use; commercial use requires contacting MuesliSwap.',
      providerFilter: PROVIDERS,
      verificationModesQueried: ['y', 'n'],
      verifiedOnly: false,
    },
    exactAsset: ASSET,
    acquisition: {
      requests: queryResults.map((result) => result.evidence),
      queryPools,
      rawPoolRows: summaries.length,
      basePoolCount: basePools,
      quotePoolCount: quotePools,
      uniquePoolCount: pools.length,
      exactUsdmPoolCount: pools.filter((pool) => pool.exactUsdmFound).length,
      sourceStatus: queryResults.every((x) => x.evidence.status === 200)
        ? 'COMPLETE'
        : queryResults.some((x) => x.evidence.status === 200)
          ? 'PARTIAL'
          : 'SOURCE_UNAVAILABLE',
    },
    pools,
    startedAt,
    completedAt: new Date().toISOString(),
    limitations: [
      'MuesliSwap is a separate DEX venue from Minswap, but its API fields are source-reported and not independently validated here.',
      'The API documentation says token decimals must be accounted for by the client; all raw amounts/prices are preserved and not normalized by this collector.',
      'The /price endpoint is intentionally not used; pool-level data is collected to avoid treating a best-market aggregator price as an independent venue quote.',
      'Ticker, symbol and token name are never used as identity; exact policy ID and asset name are required.',
      'No USDM/USD peg, oracle qualification, EEV valuation, deployment approval, order placement, wallet, signing or chain write is produced.',
    ],
  }
  const out = outputPath(process.argv.slice(2))
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: evidence.acquisition.sourceStatus === 'SOURCE_UNAVAILABLE'
      ? 'SOURCE_UNAVAILABLE'
      : evidence.acquisition.sourceStatus === 'PARTIAL'
        ? 'READ_ONLY_MUESLISWAP_COLLECTION_PARTIAL'
        : 'READ_ONLY_MUESLISWAP_COLLECTION_COMPLETE',
    output: out,
    basePoolCount: basePools.length,
    quotePoolCount: quotePools.length,
    uniquePoolCount: pools.length,
    exactUsdmPoolCount: evidence.acquisition.exactUsdmPoolCount,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_MUESLISWAP_COLLECTION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
