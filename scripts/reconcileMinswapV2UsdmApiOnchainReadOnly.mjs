#!/usr/bin/env node
/**
 * Reconcile exact-USDM Minswap V2 pool identities between:
 *   1) Koios Mainnet UTxO + decoded PoolDatum observations
 *   2) Minswap public API pool metrics
 *   3) optional SuperCardano independent indexer pool/trade observation
 *
 * Read-only local artifact processing. No network, wallet, signing, or chain write.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ASSET = Object.freeze({
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
})
const exactUsdmUnit = ASSET.policyId + ASSET.assetNameHex

function argValue(argv, flag, fallback) {
  const index = argv.indexOf(flag)
  return index >= 0 && argv[index + 1] ? resolve(argv[index + 1]) : resolve(fallback)
}

function assetUnit(asset) {
  return String(asset?.policyId ?? asset?.currency_symbol ?? '').toLowerCase() +
    String(asset?.assetNameHex ?? asset?.token_name ?? '').toLowerCase()
}

function pairUnits(assetA, assetB) {
  return [assetUnit(assetA), assetUnit(assetB)].sort()
}

async function main() {
  const argv = process.argv.slice(2)
  const onchainPath = argValue(argv, '--onchain', 'audit/onchain/minswap-v2-usdm-utxos-readonly.json')
  const apiPath = argValue(argv, '--api', 'audit/api/minswap-usdm-readonly.json')
  const supercardanoPath = argv.includes('--supercardano')
    ? argValue(argv, '--supercardano', 'audit/indexer/supercardano-usdm-readonly.json')
    : null
  const outPath = argValue(argv, '--out', 'audit/oracles/minswap-v2-api-onchain-reconciliation.json')
  const [onchain, api, supercardano] = await Promise.all([
    readFile(onchainPath, 'utf8').then(JSON.parse),
    readFile(apiPath, 'utf8').then(JSON.parse),
    supercardanoPath ? readFile(supercardanoPath, 'utf8').then(JSON.parse) : Promise.resolve(null),
  ])

  if (onchain.network !== 'cardano-mainnet' || api.network !== 'cardano-mainnet') {
    throw new Error('RECONCILIATION_NETWORK_MISMATCH')
  }
  if (assetUnit(ASSET) !== exactUsdmUnit) throw new Error('EXACT_USDM_IDENTITY_INTERNAL_ERROR')
  if (api.exactAsset?.policyId?.toLowerCase() !== ASSET.policyId ||
      api.exactAsset?.assetNameHex?.toLowerCase() !== ASSET.assetNameHex) {
    throw new Error('API_EXACT_USDM_IDENTITY_MISMATCH')
  }

  if (supercardano && (supercardano.network !== 'cardano-mainnet' ||
      supercardano.unit?.toLowerCase() !== exactUsdmUnit)) {
    throw new Error('SUPERCARDANO_EXACT_ASSET_OR_NETWORK_MISMATCH')
  }

  const apiV2 = api.pools.filter((pool) => pool.protocol === 'MinswapV2')
  const apiByLp = new Map()
  const duplicateApiIds = []
  for (const pool of apiV2) {
    const lpId = String(pool.id ?? '').toLowerCase()
    if (!lpId) continue
    if (apiByLp.has(lpId)) duplicateApiIds.push(lpId)
    else apiByLp.set(lpId, pool)
  }

  const onchainByLp = new Map()
  const onchainUnqualified = []
  for (const candidate of onchain.candidates ?? []) {
    const validation = candidate.datumValidation ?? {}
    if (validation.status !== 'MATCH' || !validation.lpAsset) {
      onchainUnqualified.push({
        utxoRef: candidate.utxoRef,
        status: validation.status ?? 'UNKNOWN',
        reasons: validation.reasons ?? [],
      })
      continue
    }
    const lpId = assetUnit(validation.lpAsset)
    if (!lpId) {
      onchainUnqualified.push({ utxoRef: candidate.utxoRef, status: 'LP_ID_MISSING', reasons: [] })
      continue
    }
    if (!onchainByLp.has(lpId)) onchainByLp.set(lpId, [])
    onchainByLp.get(lpId).push(candidate)
  }

  const matched = []
  const onchainOnly = []
  const pairMismatch = []
  for (const [lpId, candidates] of onchainByLp) {
    const apiPool = apiByLp.get(lpId)
    for (const candidate of candidates) {
      const datum = candidate.datumValidation.datum
      if (!apiPool) {
        onchainOnly.push({ lpAssetUnit: lpId, utxoRef: candidate.utxoRef })
        continue
      }
      const onchainPair = pairUnits(datum.assetA, datum.assetB)
      const apiPair = pairUnits(apiPool.assetA, apiPool.assetB)
      if (onchainPair.join(':') !== apiPair.join(':')) {
        pairMismatch.push({
          lpAssetUnit: lpId,
          utxoRef: candidate.utxoRef,
          onchainPair,
          apiPair,
        })
        continue
      }
      matched.push({
        lpAssetUnit: lpId,
        utxoRef: candidate.utxoRef,
        exactUsdmQuantityRaw: candidate.exactUsdmQuantityRaw,
        datumAssetA: datum.assetA,
        datumAssetB: datum.assetB,
        datumReserveARaw: datum.reserveARaw,
        datumReserveBRaw: datum.reserveBRaw,
        valueSurplusARaw: candidate.datumValidation.valueSurplusARaw,
        valueSurplusBRaw: candidate.datumValidation.valueSurplusBRaw,
        apiPoolProtocol: apiPool.protocol,
        apiAssetA: apiPool.assetA,
        apiAssetB: apiPool.assetB,
        apiMetrics: {
          liquidity: apiPool.apiMetrics?.liquidity ?? null,
          liquidityA: apiPool.apiMetrics?.liquidity_a ?? null,
          liquidityB: apiPool.apiMetrics?.liquidity_b ?? null,
          volume24h: apiPool.apiMetrics?.volume_24h ?? null,
          volume7d: apiPool.apiMetrics?.volume_7d ?? null,
          tradingFeeApr: apiPool.apiMetrics?.trading_fee_apr ?? null,
          tradingFee24h: apiPool.apiMetrics?.trading_fee_24h ?? null,
          tradingFee7d: apiPool.apiMetrics?.trading_fee_7d ?? null,
        },
      })
    }
  }

  const apiOnly = [...apiByLp.keys()]
    .filter((lpId) => !onchainByLp.has(lpId))
    .map((lpAssetUnit) => ({ lpAssetUnit }))


  let supercardanoEvidence = null
  if (supercardano) {
    const prefix = 'minswap-v2:'
    const scPools = (supercardano.pools ?? []).filter((pool) =>
      String(pool.venue ?? '') === 'minswap-v2' &&
      String(pool.key ?? '').startsWith(prefix))
    const scByLp = new Map()
    const duplicateScIds = []
    for (const pool of scPools) {
      const lpId = String(pool.key).slice(prefix.length).toLowerCase()
      if (scByLp.has(lpId)) duplicateScIds.push(lpId)
      else scByLp.set(lpId, pool)
    }

    const scMatched = []
    const scOnchainOnly = []
    const scPairMismatch = []
    const scReserveMismatch = []
    for (const [lpId, candidates] of onchainByLp) {
      const pool = scByLp.get(lpId)
      for (const candidate of candidates) {
        if (!pool) {
          scOnchainOnly.push({ lpAssetUnit: lpId, utxoRef: candidate.utxoRef })
          continue
        }
        const datum = candidate.datumValidation.datum
        const datumA = assetUnit(datum.assetA)
        const datumB = assetUnit(datum.assetB)
        const poolA = String(pool.assetA ?? '').toLowerCase()
        const poolB = String(pool.assetB ?? '').toLowerCase()
        const sameOrder = poolA === datumA && poolB === datumB
        const reverseOrder = poolA === datumB && poolB === datumA
        if (!sameOrder && !reverseOrder) {
          scPairMismatch.push({ lpAssetUnit: lpId, utxoRef: candidate.utxoRef, datumPair: [datumA, datumB], supercardanoPair: [poolA, poolB] })
          continue
        }
        const reserveA = String(sameOrder ? pool.reserveA : pool.reserveB)
        const reserveB = String(sameOrder ? pool.reserveB : pool.reserveA)
        const reserveMatches = reserveA === String(datum.reserveARaw) && reserveB === String(datum.reserveBRaw)
        const row = {
          lpAssetUnit: lpId,
          utxoRef: candidate.utxoRef,
          venue: pool.venue,
          poolKey: pool.key,
          poolHeight: pool.height,
          poolTime: pool.time,
          poolFreshnessAtSourceAsOf: pool.freshnessAtSourceAsOf ?? 'NOT_CLASSIFIED',
          datumReserveARaw: String(datum.reserveARaw),
          datumReserveBRaw: String(datum.reserveBRaw),
          supercardanoReserveARaw: reserveA,
          supercardanoReserveBRaw: reserveB,
          reserveExactMatch: reserveMatches,
        }
        if (reserveMatches) scMatched.push(row)
        else scReserveMismatch.push(row)
      }
    }
    const scOnly = [...scByLp.keys()]
      .filter((lpId) => !onchainByLp.has(lpId))
      .map((lpAssetUnit) => ({ lpAssetUnit }))
    const venueFreshness = {}
    for (const pool of supercardano.pools ?? []) {
      const venue = pool.venue ?? 'UNKNOWN'
      venueFreshness[venue] ??= { total: 0, UNDER_24H: 0, ONE_TO_SEVEN_DAYS: 0, OVER_SEVEN_DAYS: 0, UNKNOWN: 0 }
      venueFreshness[venue].total += 1
      const bucket = pool.freshnessAtSourceAsOf ?? 'UNKNOWN'
      venueFreshness[venue][bucket] = (venueFreshness[venue][bucket] ?? 0) + 1
    }
    supercardanoEvidence = {
      source: supercardano.source,
      startedAt: supercardano.startedAt,
      completedAt: supercardano.completedAt,
      sourceMeta: supercardano.sourceMeta,
      summary: {
        supercardanoPoolCount: (supercardano.pools ?? []).length,
        poolCountByVenue: supercardano.summary?.poolCountByVenue ?? {},
        poolFreshnessByVenueAtSourceAsOf: venueFreshness,
        tradeCountByVenue: supercardano.summary?.exactUsdmTradeRowsByVenue ?? {},
        onchainMinswapV2PoolCount: onchainByLp.size,
        supercardanoMinswapV2PoolCount: scByLp.size,
        exactPoolIdentityAndPairAndReserveMatches: scMatched.length,
        onchainOnlyCount: scOnchainOnly.length,
        supercardanoOnlyCount: scOnly.length,
        pairMismatchCount: scPairMismatch.length,
        reserveMismatchCount: scReserveMismatch.length,
        duplicateSupercardanoLpIds: duplicateScIds.length,
      },
      matched: scMatched,
      onchainOnly: scOnchainOnly,
      supercardanoOnly: scOnly,
      pairMismatch: scPairMismatch,
      reserveMismatch: scReserveMismatch,
      duplicateLpIds: duplicateScIds,
    }
  }

  const evidence = {
    schema: 'immortal-minswap-v2-usdm-multi-indexer-reconciliation-v2',
    classification: 'POOL_SET_AND_ASSET_PAIR_RECONCILIATION_NOT_PRICE_OR_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet',
    exactAsset: ASSET,
    sources: {
      onchain: {
        provider: onchain.provider,
        startedAt: onchain.startedAt,
        completedAt: onchain.completedAt,
        acquisition: onchain.acquisition,
      },
      supercardano: supercardanoEvidence ? {
        source: supercardanoEvidence.source,
        startedAt: supercardanoEvidence.startedAt,
        completedAt: supercardanoEvidence.completedAt,
        sourceMeta: supercardanoEvidence.sourceMeta,
      } : null,
      api: {
        source: api.source,
        startedAt: api.startedAt,
        completedAt: api.completedAt,
        poolMetricPages: api.poolMetricPages,
        poolCount: api.poolCount,
        historyCollection: api.historyCollection ?? null,
      },
    },
    summary: {
      onchainCandidateCount: (onchain.candidates ?? []).length,
      onchainStructurallyMatchedCount: [...onchainByLp.values()].reduce((sum, xs) => sum + xs.length, 0),
      apiPoolCountAllProtocols: api.poolCount,
      apiMinswapV2PoolCount: apiV2.length,
      matchedCount: matched.length,
      onchainOnlyCount: onchainOnly.length,
      apiOnlyCount: apiOnly.length,
      pairMismatchCount: pairMismatch.length,
      onchainUnqualifiedCount: onchainUnqualified.length,
      duplicateApiLpIdCount: duplicateApiIds.length,
      supercardano: supercardanoEvidence?.summary ?? null,
    },
    supercardano: supercardanoEvidence,
    matched,
    onchainOnly,
    apiOnly,
    pairMismatch,
    onchainUnqualified,
    duplicateApiIds,
    limitations: [
      'A match confirms LP asset identity and exact unordered pair identity between Koios on-chain datum/value evidence and the Minswap API record.',
      'Minswap API and Koios are two observations of the same Cardano/DEX state, not independent market venues or independent price oracles.',
      'SuperCardano is a separately operated on-chain indexer observation; it is not a separate DEX venue and its USD display uses DexHunter ADA/USD according to its published methodology.',
      'SuperCardano pool freshness is classified against its own asOf timestamp; historical pool rows must not be interpreted as live liquidity without checking block/time and reserves.',
      'Exact reserve agreement is an observed comparison only; mismatches are preserved and must be investigated against each provider decoder and the actual contract datum semantics.'
      'Minswap API USD liquidity/volume metrics are preserved as source data and are not independently verified by this reconciliation.',
      'No USDM/USD price, peg, oracle qualification, EEV valuation, deployment approval, or economic parameter is produced.',
      'Snapshot times are close but not a cryptographic atomic snapshot; each source has its own observation timestamp and raw response hashes.',
      'Only public read-only data and already-collected artifacts are used; no transaction, wallet, signature, refresh, or chain write occurs.',
    ],
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_POOL_SET_RECONCILIATION_COMPLETE',
    output: outPath,
    summary: evidence.summary,
    completedAt: new Date().toISOString(),
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_POOL_SET_RECONCILIATION_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
