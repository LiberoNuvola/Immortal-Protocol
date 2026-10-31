#!/usr/bin/env node
/**
 * One-request, read-only Float API observation for the exact Moneta USDM asset.
 * Float documents confirmed-chain materializations and exposes per-market reserves.
 * This collector preserves the raw provider response; it does not treat Float as
 * an independent market venue or a qualified oracle.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
})
const ASSET_PATH = ASSET.policyId + '.' + ASSET.assetNameHex
const ENDPOINT = 'https://api.float.sundae.fi/v1/assets/' + ASSET_PATH + '?quote=ada'
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function outputPath(argv) {
  const index = argv.indexOf('--out')
  return resolve(index >= 0 && argv[index + 1]
    ? argv[index + 1]
    : 'audit/oracles/float-usdm-readonly.json')
}

async function main() {
  const out = outputPath(process.argv.slice(2))
  const startedAt = new Date().toISOString()
  let response
  let rawBody = ''
  let parsed = null
  let fetchError = null

  try {
    response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: { accept: 'application/json', 'user-agent': 'IMMORTAL-Agent-A-readonly/1.0' },
      signal: AbortSignal.timeout(45_000),
    })
    rawBody = await response.text()
    try { parsed = JSON.parse(rawBody) } catch { /* raw body remains preserved */ }
  } catch (error) {
    fetchError = error instanceof Error ? error.message : String(error)
  }

  const completedAt = new Date().toISOString()
  const assetId = String(parsed?.id ?? '').toLowerCase()
  const exactAssetMatches = assetId === ASSET_PATH.toLowerCase()
  const markets = Array.isArray(parsed?.markets) ? parsed.markets : []
  const marketsWithExactUsdm = markets.filter((market) =>
    [market?.assets?.a, market?.assets?.b].some((id) =>
      String(id ?? '').toLowerCase() === ASSET_PATH.toLowerCase(),
    ),
  )
  const result = {
    schema: 'immortal-float-usdm-readonly-observation-v1',
    source: 'Float API (api.float.sundae.fi)',
    request: { method: 'GET', url: ENDPOINT, quote: 'ada' },
    exactAsset: ASSET,
    startedAt,
    completedAt,
    http: {
      status: response?.status ?? null,
      ok: response?.ok ?? false,
      date: response?.headers.get('date') ?? null,
      etag: response?.headers.get('etag') ?? null,
      cacheControl: response?.headers.get('cache-control') ?? null,
      contentType: response?.headers.get('content-type') ?? null,
    },
    rawResponse: {
      bodySha256: sha256(rawBody),
      bodyBytes: Buffer.byteLength(rawBody),
      body: rawBody,
    },
    fetchError,
    providerMeta: parsed?.meta ?? null,
    providerConfidence: parsed?.confidence ?? null,
    decimals: parsed?.decimals ?? null,
    providerAssetId: parsed?.id ?? null,
    exactAssetMatches,
    marketsReported: markets.length,
    marketsWithExactUsdmCount: marketsWithExactUsdm.length,
    markets: marketsWithExactUsdm,
    status: response?.ok && parsed && exactAssetMatches &&
      parsed.decimals === ASSET.decimals &&
      parsed?.meta?.finality === 'confirmed' &&
      marketsWithExactUsdm.length === markets.length
      ? 'OBSERVED_EXACT_USDM_CONFIRMED_CHAIN_MARKETS'
      : 'SOURCE_UNAVAILABLE_OR_IDENTITY_OR_FINALITY_UNVERIFIED',
    limitations: [
      'This is one Float API/indexer observation, not an independent market venue.',
      'confirmed finality is the provider-reported materialization watermark, not a second node quorum.',
      'The collector requests quote=ada and preserves reserves; it does not infer or qualify a USDM/USD peg.',
      'Pool identity, pair membership and reserves require separate comparison with direct chain UTxOs.',
      'A stale market remains recorded as stale; it must not be treated as live executable liquidity.',
    ],
  }

  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: result.status,
    output: out,
    httpStatus: result.http.status,
    providerAsOf: result.providerMeta?.as_of ?? null,
    providerFinality: result.providerMeta?.finality ?? null,
    exactUsdmMarkets: result.marketsWithExactUsdmCount,
    rawBodySha256: result.rawResponse.bodySha256,
    completedAt,
  }, null, 2))

  if (result.status !== 'OBSERVED_EXACT_USDM_CONFIRMED_CHAIN_MARKETS') {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'FLOAT_USDM_OBSERVATION_FAILED',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exitCode = 1
})
