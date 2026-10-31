#!/usr/bin/env node
/**
 * Read-only Minswap Mainnet market-data collector for Moneta USDM.
 *
 * Only calls Minswap public read endpoints (GET/POST). POST /metrics is a
 * query endpoint; this script never submits transactions or signs anything.
 * Pool membership is determined by exact policy + asset-name equality,
 * never by ticker/name alone. API observations are not on-chain proofs and
 * Minswap/GeckoTerminal are not independent market venues.
 *
 * Usage:
 *   node scripts/collectMinswapUsdmReadOnly.mjs
 *   node scripts/collectMinswapUsdmReadOnly.mjs --out audit/oracles/minswap-usdm.json
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE = 'https://api-mainnet-prod.minswap.org'
const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
  ticker: 'USDM',
})
const PROTOCOLS = ['Minswap', 'MinswapV2', 'MinswapStable']
const LIMIT = 100
const MAX_PAGES_PER_PROTOCOL = 50
const PERIOD = '1d'

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function exactAsset(asset) {
  return Boolean(
    asset &&
    String(asset.currency_symbol ?? '').toLowerCase() === ASSET.policyId &&
    String(asset.token_name ?? '').toLowerCase() === ASSET.assetNameHex,
  )
}

function parseArgs(argv) {
  const outIndex = argv.indexOf('--out')
  return outIndex >= 0 && argv[outIndex + 1]
    ? resolve(argv[outIndex + 1])
    : resolve('audit/oracles/minswap-usdm-readonly.json')
}

async function request(path, init = {}) {
  const response = await fetch(BASE + path, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const raw = await response.text()
  const record = {
    url: BASE + path,
    method: init.method ?? 'GET',
    status: response.status,
    responseDate: response.headers.get('date'),
    contentType: response.headers.get('content-type'),
    bodySha256: sha256(raw),
    body: null,
  }
  if (!response.ok) {
    record.errorBody = raw.slice(0, 2000)
    throw Object.assign(new Error(`Minswap API ${response.status} for ${path}`), {
      evidence: record,
    })
  }
  try {
    record.body = JSON.parse(raw)
  } catch {
    throw new Error(`Minswap returned non-JSON content for ${path}`)
  }
  return record
}

async function collectAsset() {
  const q = new URLSearchParams({
    term: 'USDM',
    limit: String(LIMIT),
    only_verified: 'true',
  })
  const result = await request('/v1/assets?' + q)
  const matches = (result.body.assets ?? []).filter(exactAsset)
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one exact verified Moneta USDM asset; found ${matches.length}`)
  }
  const asset = matches[0]
  if (Number(asset.metadata?.decimals) !== ASSET.decimals) {
    throw new Error('Exact USDM asset metadata has an unexpected decimals value')
  }
  return { evidence: result, asset }
}

async function collectPools(protocol) {
  let cursor
  const pages = []
  const pools = new Map()
  for (let page = 0; page < MAX_PAGES_PER_PROTOCOL; page += 1) {
    const body = {
      term: 'USDM',
      only_verified: false,
      limit: LIMIT,
      sort_field: 'liquidity',
      sort_direction: 'desc',
      protocols: [protocol],
      currency: 'usd',
      ...(cursor ? { search_after: cursor } : {}),
    }
    const evidence = await request('/v1/pools/metrics', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    pages.push({
      request: { protocol, page: page + 1, cursor: cursor ?? null },
      response: evidence,
    })
    for (const pool of evidence.body.pool_metrics ?? []) {
      if (!exactAsset(pool.asset_a) && !exactAsset(pool.asset_b)) continue
      const lp = pool.lp_asset ?? {}
      const id = String(lp.currency_symbol ?? '') + String(lp.token_name ?? '')
      if (!id) continue
      pools.set(id, pool)
    }
    cursor = evidence.body.search_after
    if (!cursor || (Array.isArray(cursor) && cursor.length === 0)) break
    if (page === MAX_PAGES_PER_PROTOCOL - 1) {
      throw new Error(`Pagination safety limit reached for ${protocol}`)
    }
  }
  return { protocol, pages, pools: [...pools.entries()].map(([id, metrics]) => ({ id, metrics })) }
}

async function collectPoolHistory(poolId) {
  const encodedId = encodeURIComponent(poolId)
  const metrics = await request(`/v1/pools/${encodedId}/metrics?currency=usd`)
  const price = await request(`/v1/pools/${encodedId}/price/timeseries?period=${PERIOD}`)
  const volume = await request(`/v1/pools/${encodedId}/volume/timeseries?period=${PERIOD}&currency=usd`)
  const tvl = await request(`/v1/pools/${encodedId}/tvl/timeseries?period=${PERIOD}&currency=usd`)
  return { metrics, price, volume, tvl }
}

async function main() {
  const startedAt = new Date().toISOString()
  const asset = await collectAsset()
  const protocolResults = await Promise.all(PROTOCOLS.map(collectPools))
  const poolMap = new Map()
  const pages = []
  for (const result of protocolResults) {
    pages.push(...result.pages)
    for (const pool of result.pools) {
      // Preserve protocol family in the key: identical LP asset identifiers
      // must not silently overwrite a distinct API record from another family.
      const key = result.protocol + ':' + pool.id
      poolMap.set(key, { ...pool, protocol: result.protocol })
    }
  }

  const pools = []
  for (const [identityKey, pool] of poolMap) {
    const { id, metrics, protocol } = pool
    pools.push({
      id,
      identityKey,
      protocol,
      exactUsdmSide: exactAsset(metrics.asset_a) ? 'asset_a' : 'asset_b',
      assetA: metrics.asset_a,
      assetB: metrics.asset_b,
      apiMetrics: metrics,
      history: await collectPoolHistory(id),
    })
  }

  const evidence = {
    schema: 'immortal-minswap-usdm-readonly-v1',
    classification: 'DEX_MARKET_OBSERVATION_NOT_ONCHAIN_PROOF_NOT_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    startedAt,
    completedAt: new Date().toISOString(),
    source: {
      name: 'Minswap public API',
      baseUrl: BASE,
      docs: 'https://docs.minswap.org/developer/minswap-apis',
      requestMode: 'read-only GET and metrics-query POST; no transaction endpoints',
    },
    exactAsset: ASSET,
    assetLookup: asset.evidence,
    verifiedAsset: asset.asset,
    poolProtocolsQueried: PROTOCOLS,
    poolMetricPages: pages,
    poolCount: pools.length,
    pools,
    limitations: [
      'API/indexer observations are not direct UTxO observations.',
      'Ticker and display name are not used as asset identity.',
      'Minswap API and GeckoTerminal may observe the same underlying Minswap venue; do not count them as independent market sources.',
      'USD-denominated pool metrics depend on Minswap API valuation methodology and are not an independent USD/USDM oracle.',
      'No USD/USDM conversion, peg assumption, EEV valuation, or protocol parameter is produced.',
      'No transaction, wallet, signature, oracle refresh, or chain write is performed.',
    ],
  }

  const out = parseArgs(process.argv.slice(2))
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_COLLECTION_COMPLETE',
    output: out,
    exactAssetMatched: true,
    poolsFound: pools.length,
    protocols: PROTOCOLS,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch(async (error) => {
  const safe = {
    status: 'READ_ONLY_COLLECTION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    apiEvidence: error?.evidence ?? null,
    timestamp: new Date().toISOString(),
  }
  console.error(JSON.stringify(safe, null, 2))
  process.exitCode = 1
})
