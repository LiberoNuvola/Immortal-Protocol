#!/usr/bin/env node
/**
 * Read-only DEX Screener observations for the exact Moneta USDM asset and
 * already-identified Minswap V2 pair IDs. DEX Screener is a secondary
 * indexer of DEX venues, not an independent liquidity venue or oracle.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE = 'https://api.dexscreener.com'
const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
})
const ASSET_UNIT = ASSET.policyId + ASSET.assetNameHex
const sha256 = (raw) => createHash('sha256').update(raw, 'utf8').digest('hex')

function argValue(argv, flag, fallback) {
  const index = argv.indexOf(flag)
  return index >= 0 && argv[index + 1] ? resolve(argv[index + 1]) : resolve(fallback)
}

async function request(path) {
  const url = BASE + path
  const response = await fetch(url, { headers: { accept: 'application/json' } })
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

function tokenUnit(token, chainId = 'cardano') {
  const address = String(token?.address ?? '').toLowerCase()
  // DEX Screener represents Cardano ADA as "0x"; on-ledger ADA unit is empty.
  if (chainId === 'cardano' && address === '0x' && String(token?.symbol ?? '').toUpperCase() === 'ADA') return ''
  return address
}

function pairSummary(pair, requestedPairId, apiPool) {
  const baseUnit = tokenUnit(pair.baseToken, pair.chainId)
  const quoteUnit = tokenUnit(pair.quoteToken, pair.chainId)
  const apiA = String(apiPool.assetA?.currency_symbol ?? '').toLowerCase() +
    String(apiPool.assetA?.token_name ?? '').toLowerCase()
  const apiB = String(apiPool.assetB?.currency_symbol ?? '').toLowerCase() +
    String(apiPool.assetB?.token_name ?? '').toLowerCase()
  const dexPair = [baseUnit, quoteUnit].sort()
  const apiPair = [apiA, apiB].sort()
  return {
    requestedPairId,
    pairAddress: String(pair.pairAddress ?? '').toLowerCase(),
    pairAddressMatchesRequest: String(pair.pairAddress ?? '').toLowerCase() === requestedPairId,
    chainId: pair.chainId ?? null,
    dexId: pair.dexId ?? null,
    url: pair.url ?? null,
    baseToken: pair.baseToken ?? null,
    quoteToken: pair.quoteToken ?? null,
    tokenAddressEncoding: {
      baseAddress: baseUnit,
      quoteAddress: quoteUnit,
      baseMatchesApiAssetA: baseUnit === apiA,
      baseMatchesApiAssetB: baseUnit === apiB,
      quoteMatchesApiAssetA: quoteUnit === apiA,
      quoteMatchesApiAssetB: quoteUnit === apiB,
      exactPairUnitMatch: dexPair.join(':') === apiPair.join(':'),
      exactUsdmUnitFound: baseUnit === ASSET_UNIT || quoteUnit === ASSET_UNIT,
      note: 'Cardano token address encoding is retained verbatim; do not infer identity from ticker or display name.',
    },
    priceUsd: pair.priceUsd ?? null,
    priceNative: pair.priceNative ?? null,
    liquidity: pair.liquidity ?? null,
    volume: pair.volume ?? null,
    txns: pair.txns ?? null,
    priceChange: pair.priceChange ?? null,
    fdv: pair.fdv ?? null,
    marketCap: pair.marketCap ?? null,
    pairCreatedAt: pair.pairCreatedAt ?? null,
  }
}

async function main() {
  const argv = process.argv.slice(2)
  const apiPath = argValue(argv, '--api', 'audit/api/minswap-usdm-readonly.json')
  const outPath = argValue(argv, '--out', 'audit/oracles/dexscreener-cardano-usdm-readonly.json')
  const api = JSON.parse(await readFile(apiPath, 'utf8'))
  if (api.exactAsset?.policyId?.toLowerCase() !== ASSET.policyId ||
      api.exactAsset?.assetNameHex?.toLowerCase() !== ASSET.assetNameHex) {
    throw new Error('MIN_SWAP_API_EXACT_ASSET_IDENTITY_MISMATCH')
  }

  // Discover all indexed Cardano pairs containing the exact policy+asset-name unit.
  const tokenPairs = await request('/token-pairs/v1/cardano/' + encodeURIComponent(ASSET_UNIT))
  const discoveredPairs = Array.isArray(tokenPairs.json) ? tokenPairs.json : []
  const exactUnitPairs = discoveredPairs.filter((pair) =>
    tokenUnit(pair.baseToken, pair.chainId) === ASSET_UNIT || tokenUnit(pair.quoteToken, pair.chainId) === ASSET_UNIT
  )

  // Resolve every Minswap V2 pair already proven by the same-run API/on-chain census.
  const apiV2Pools = api.pools.filter((pool) => pool.protocol === 'MinswapV2')
  const pairLookups = []
  for (const pool of apiV2Pools) {
    const requestedPairId = String(pool.id ?? '').toLowerCase()
    if (!requestedPairId) continue
    const result = await request('/latest/dex/pairs/cardano/' + encodeURIComponent(requestedPairId))
    const pairs = Array.isArray(result.json?.pairs) ? result.json.pairs : []
    pairLookups.push({
      lpAssetUnit: requestedPairId,
      apiAssetA: pool.assetA,
      apiAssetB: pool.assetB,
      response: result.evidence,
      pairs: pairs.map((pair) => pairSummary(pair, requestedPairId, pool)),
    })
  }

  const venueCounts = exactUnitPairs.reduce((counts, pair) => {
    const venue = String(pair.dexId ?? 'UNKNOWN')
    counts[venue] = (counts[venue] ?? 0) + 1
    return counts
  }, {})
  const evidence = {
    schema: 'immortal-dexscreener-cardano-usdm-readonly-v1',
    classification: 'SECONDARY_DEX_INDEXER_OBSERVATION_NOT_INDEPENDENT_VENUE_OR_ORACLE',
    network: 'cardano-mainnet',
    source: {
      name: 'DEX Screener public API',
      baseUrl: BASE,
      docs: 'https://docs.dexscreener.com/api/reference',
      rateLimits: { pairLookupPerMinute: 300, tokenPairLookupPerMinute: 300 },
    },
    exactAsset: ASSET,
    tokenPairDiscovery: {
      request: tokenPairs.evidence,
      returnedPairCount: discoveredPairs.length,
      exactUnitPairCount: exactUnitPairs.length,
      venueCounts,
      exactUnitPairs,
      note: 'If token address encoding differs from the Cardano policy+asset-name unit, zero exactUnitPairCount is inconclusive; known pair lookups are still retained separately.',
    },
    knownMinswapV2PairLookups: pairLookups,
    summary: {
      minswapV2ApiPoolCount: apiV2Pools.length,
      pairLookups: pairLookups.length,
      pairAddressMatches: pairLookups.reduce((n, x) => n + x.pairs.filter((p) => p.pairAddressMatchesRequest).length, 0),
      exactPairUnitMatches: pairLookups.reduce((n, x) => n + x.pairs.filter((p) => p.tokenAddressEncoding.exactPairUnitMatch).length, 0),
      exactUsdmUnitFoundInPairResponse: pairLookups.reduce((n, x) => n + x.pairs.filter((p) => p.tokenAddressEncoding.exactUsdmUnitFound).length, 0),
      pairResponsesMissing: pairLookups.filter((x) => x.pairs.length === 0).length,
    },
    limitations: [
      'DEX Screener is a secondary indexer of DEX pools; it is not an independent trading venue.',
      'Minswap V2 pair data overlaps the same underlying Minswap venue already observed via Minswap API and Koios.',
      'USD price, liquidity and volume are third-party reported metrics; they are not independently validated or suitable as an oracle by this collector.',
      'Exact token identity requires matching Cardano policy ID and asset name; ticker, name, or symbol alone is never sufficient.',
      'No USDM/USD peg, price qualification, EEV valuation, deployment approval, transaction, wallet, signature, refresh or chain write is produced.',
    ],
    startedAt: api.startedAt,
    completedAt: new Date().toISOString(),
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_DEXSCREENER_COLLECTION_COMPLETE',
    output: outPath,
    summary: evidence.summary,
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_DEXSCREENER_COLLECTION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
