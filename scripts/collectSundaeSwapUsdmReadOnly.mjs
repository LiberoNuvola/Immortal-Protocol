#!/usr/bin/env node
/**
 * Read-only SundaeSwap Mainnet USDM pool discovery via the official SDK's
 * documented GraphQL query shape (QueryProviderSundaeSwap.findPoolDataByAssetId).
 *
 * No wallet, signing, transaction building/submission, or chain write.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const API = 'https://api.sundae.fi/graphql'
const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
  decimals: 6,
})
const ASSET_ID = ASSET.policyId + '.' + ASSET.assetNameHex
const TIMEOUT_MS = 30_000

const POOLS_BY_ASSET_QUERY = `
query poolByIdent($assetId: ID!) {
  pools {
    byAsset(asset: $assetId) {
      feesFinalized { slot }
      marketOpen { slot }
      openingFee
      finalFee
      id
      assetA { assetId: id decimals }
      assetB { assetId: id decimals }
      assetLP { assetId: id decimals }
      current {
        quantityA { quantity }
        quantityB { quantity }
        quantityLP { quantity }
      }
      linearAmplificationFactor
      modules { kind identifier }
      prices
      sqrtPrices
      rates
      totalLp
      protocolAskFee
      version
    }
  }
}`

const PROTOCOLS_QUERY = `
query ProtocolValidators {
  protocols {
    blueprint {
      validators { hash title }
    }
    references { key txIn { hash index } }
    version
  }
}`

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function postGraphql(label, query, variables = {}) {
  const startedAt = new Date().toISOString()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    })
    const rawBody = await response.text()
    const completedAt = new Date().toISOString()
    const bodySha256 = sha256(rawBody)
    if (!response.ok) {
      throw Object.assign(new Error('SUNDAE_GRAPHQL_HTTP_' + response.status), {
        evidence: { label, status: response.status, startedAt, completedAt, bodySha256, rawBody },
      })
    }
    let json
    try { json = JSON.parse(rawBody) } catch {
      throw Object.assign(new Error('SUNDAE_GRAPHQL_JSON_INVALID'), {
        evidence: { label, status: response.status, startedAt, completedAt, bodySha256, rawBody },
      })
    }
    if (json.errors?.length) {
      throw Object.assign(new Error('SUNDAE_GRAPHQL_RESPONSE_ERRORS'), {
        evidence: { label, status: response.status, startedAt, completedAt, bodySha256, errors: json.errors, rawBody },
      })
    }
    if (!json.data) {
      throw Object.assign(new Error('SUNDAE_GRAPHQL_DATA_MISSING'), {
        evidence: { label, status: response.status, startedAt, completedAt, bodySha256, rawBody },
      })
    }
    return {
      label, endpoint: API, method: 'POST', status: response.status,
      startedAt, completedAt, responseDate: response.headers.get('date'),
      bodySha256, rawBody, json,
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function main() {
  const outIndex = process.argv.indexOf('--out')
  const outPath = resolve(outIndex >= 0 && process.argv[outIndex + 1]
    ? process.argv[outIndex + 1]
    : 'audit/oracles/sundaeswap-usdm-readonly.json')
  const startedAt = new Date().toISOString()
  let poolsEvidence
  let protocolsEvidence
  try {
    poolsEvidence = await postGraphql('pools-by-exact-usdm', POOLS_BY_ASSET_QUERY, { assetId: ASSET_ID })
    protocolsEvidence = await postGraphql('protocol-validator-anchors', PROTOCOLS_QUERY)
  } catch (error) {
    const failure = {
      schema: 'immortal-sundaeswap-usdm-readonly-failure-v1',
      network: 'cardano-mainnet',
      exactAsset: ASSET,
      source: 'SundaeSwap official GraphQL API',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'SOURCE_UNAVAILABLE_OR_INVALID_RESPONSE',
      error: error instanceof Error ? error.message : String(error),
      evidence: error?.evidence ?? null,
    }
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, JSON.stringify(failure, null, 2) + '\n')
    console.error(JSON.stringify({ status: failure.status, error: failure.error }))
    process.exitCode = 1
    return
  }

  const pools = poolsEvidence.json.data?.pools?.byAsset
  const protocols = protocolsEvidence.json.data?.protocols
  if (!Array.isArray(pools) || !Array.isArray(protocols)) {
    throw new Error('SUNDAE_GRAPHQL_RESULT_SHAPE_INVALID')
  }

  const exactMatches = pools.filter((pool) =>
    pool.assetA?.assetId?.toLowerCase() === ASSET_ID.toLowerCase() ||
    pool.assetB?.assetId?.toLowerCase() === ASSET_ID.toLowerCase()
  )
  const unexpected = pools.filter((pool) => !exactMatches.includes(pool))
  const validatorAnchors = protocols.map((protocol) => ({
    version: protocol.version,
    validators: (protocol.blueprint?.validators ?? []).map(({ title, hash }) => ({ title, hash })),
    references: protocol.references ?? [],
  }))

  const evidence = {
    schema: 'immortal-sundaeswap-usdm-readonly-v1',
    network: 'cardano-mainnet',
    exactAsset: ASSET,
    exactAssetIdQuery: ASSET_ID,
    source: 'SundaeSwap official GraphQL API',
    startedAt,
    completedAt: new Date().toISOString(),
    queryEvidence: [poolsEvidence, protocolsEvidence].map(({ rawBody, json, ...meta }) => meta),
    poolCountReturned: pools.length,
    exactUsdmPoolCount: exactMatches.length,
    unexpectedPoolCount: unexpected.length,
    pools: exactMatches,
    unexpectedPools: unexpected.map((pool) => ({ id: pool.id, assetA: pool.assetA, assetB: pool.assetB })),
    protocolValidatorAnchors: validatorAnchors,
    rawResponses: {
      poolsByAsset: poolsEvidence.rawBody,
      protocolValidatorAnchors: protocolsEvidence.rawBody,
    },
    limitations: [
      'This is a venue API observation, not an on-chain verification of pool UTxOs or datum.',
      'Exact USDM policy/name is checked in both returned asset IDs; ticker-only matches are excluded.',
      'Pool versions and curves must be decoded and priced with their own protocol-specific semantics.',
      'API and on-chain sources are correlated views of the same venue; neither is an independent fiat oracle.',
      'No price, peg, oracle, EEV or deployment qualification is produced.',
      'Read-only public GraphQL POST queries only; no wallet, signing, transaction submission or chain write.',
    ],
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_SUNDAESWAP_USDM_COLLECTION_COMPLETE',
    output: outPath,
    poolCountReturned: evidence.poolCountReturned,
    exactUsdmPoolCount: evidence.exactUsdmPoolCount,
    protocolVersions: validatorAnchors.map((x) => x.version),
    completedAt: evidence.completedAt,
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_SUNDAESWAP_USDM_COLLECTION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
