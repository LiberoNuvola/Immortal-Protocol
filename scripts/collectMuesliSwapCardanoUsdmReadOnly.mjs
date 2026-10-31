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

async function request(queryName, tokenSide) {
  const params = new URLSearchParams({
    [tokenSide]: ASSET.policyId + '.' + ASSET.assetNameHex,
    'only-verified': 'y',
    providers: PROVIDERS,
  })
  const url = BASE + '/liquidity/pools?' + params.toString()
  const response = await fetch(url, { headers: { accept: 'application/json' } })
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

function poolSummary(pool, queryName) {
  const baseUnit = unit(pool.baseAddress)
  const quoteUnit = unit(pool.quoteAddress)
  return {
    queryName,
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
  const [baseResult, quoteResult] = await Promise.all([
    request('USDM_AS_TOKEN_A', 'token-a'),
    request('USDM_AS_TOKEN_B', 'token-b'),
  ])
  const basePools = Array.isArray(baseResult.json) ? baseResult.json : []
  const quotePools = Array.isArray(quoteResult.json) ? quoteResult.json : []
  const summaries = [
    ...basePools.map((pool) => poolSummary(pool, 'token-a')),
    ...quotePools.map((pool) => poolSummary(pool, 'token-b')),
  ]
  const byKey = new Map()
  for (const pool of summaries) {
    const key = String(pool.provider ?? 'unknown') + ':' + String(pool.poolId ?? pool.baseUnit + ':' + pool.quoteUnit)
    if (!byKey.has(key)) byKey.set(key, pool)
  }
  const pools = [...byKey.values()]
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
      verifiedOnly: true,
    },
    exactAsset: ASSET,
    acquisition: {
      requests: [baseResult.evidence, quoteResult.evidence],
      basePoolCount: basePools.length,
      quotePoolCount: quotePools.length,
      uniquePoolCount: pools.length,
      exactUsdmPoolCount: pools.filter((pool) => pool.exactUsdmFound).length,
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
    status: 'READ_ONLY_MUESLISWAP_COLLECTION_COMPLETE',
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
