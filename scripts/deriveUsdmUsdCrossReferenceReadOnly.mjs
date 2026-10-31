#!/usr/bin/env node
/**
 * Derive observational USDM/USD cross-rates from:
 *   - direct USDM/ADA constant-product pools verified on Cardano Mainnet
 *   - verified MuesliSwap AMM pool datum/value observations\n *   - independent public ADA/USD exchange bid/ask midpoints
 *
 * This is a read-only research calculation, not a peg oracle or EEV valuation.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { deriveDanogoClmmSpotPrice } from './lib/danogoClmmMath.mjs'

const ADA_UNIT = ''
const USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
const SCALE = 100_000_000n

function parseScaled(value, scale = 8) {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value ?? ''))
  if (!match) throw new Error('DECIMAL_INVALID:' + value)
  const fraction = (match[2] ?? '').padEnd(scale, '0').slice(0, scale)
  return BigInt(match[1]) * 10n ** BigInt(scale) + BigInt(fraction || '0')
}
function formatScaled(value, scale = 8) {
  const factor = 10n ** BigInt(scale)
  const whole = value / factor
  const fraction = (value % factor).toString().padStart(scale, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}
function mulScaled(a, b) {
  return (a * b + SCALE / 2n) / SCALE
}
function unit(asset) {
  return String(asset?.policyId ?? '').toLowerCase() + String(asset?.assetNameHex ?? '').toLowerCase()
}
function poolPrice(assetA, assetB, reserveARaw, reserveBRaw) {
  const a = unit(assetA)
  const b = unit(assetB)
  const reserveA = BigInt(String(reserveARaw))
  const reserveB = BigInt(String(reserveBRaw))
  if (reserveA <= 0n || reserveB <= 0n) throw new Error('POOL_RESERVE_NONPOSITIVE')
  if (a === ADA_UNIT && b === USDM_UNIT) {
    return { adaReserveRaw: reserveA.toString(), usdmReserveRaw: reserveB.toString(), priceScaledRaw: (reserveA * SCALE / reserveB).toString(), orientation: 'ADA_ASSET_A_USDM_ASSET_B' }
  }
  if (a === USDM_UNIT && b === ADA_UNIT) {
    return { adaReserveRaw: reserveB.toString(), usdmReserveRaw: reserveA.toString(), priceScaledRaw: (reserveB * SCALE / reserveA).toString(), orientation: 'USDM_ASSET_A_ADA_ASSET_B' }
  }
  return null
}

async function main() {
  const argv = process.argv.slice(2)
  const arg = (flag, fallback) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : resolve(fallback)
  }
  const onchainPath = arg('--onchain', 'audit/onchain/minswap-v2-usdm-utxos-readonly.json')
  const sundaePath = arg('--sundae', 'audit/onchain/sundaeswap-v3-usdm-utxos-readonly.json')
  const wingPath = arg('--wingriders', 'audit/wingriders/wingriders-v2-usdm-readonly.json')
  const muesliPath = arg('--muesli', 'audit/muesliswap/muesliswap-usdm-utxos-readonly.json')
  const adaUsdPath = arg('--ada-usd', 'audit/ada-usd/ada-usd-public-references-readonly.json')
  const danogoPath = arg('--danogo', 'audit/danogo/danogo-clmm-usdm-readonly.json')
  const outPath = arg('--out', 'audit/oracles/usdm-usd-cross-reference-readonly.json')
  const calculationStartedAt = new Date().toISOString()
  const [onchain, sundae, wing, muesli, adaUsd, danogo] = await Promise.all([
    readFile(onchainPath, 'utf8').then(JSON.parse),
    readFile(sundaePath, 'utf8').then(JSON.parse),
    readFile(wingPath, 'utf8').then(JSON.parse),
    readFile(muesliPath, 'utf8').then(JSON.parse),
    readFile(adaUsdPath, 'utf8').then(JSON.parse),
    readFile(danogoPath, 'utf8').then(JSON.parse),
  ])

  if (onchain.network !== 'cardano-mainnet' || wing.network !== 'cardano-mainnet' || muesli.network !== 'cardano-mainnet') {
    throw new Error('CARDANO_NETWORK_MISMATCH')
  }
  if (adaUsd.pair !== 'ADA/USD') throw new Error('ADA_USD_PAIR_MISMATCH')
  if (danogo.network !== 'cardano-mainnet') throw new Error('DANOGO_NETWORK_MISMATCH')

  const dexPools = []
  for (const candidate of onchain.candidates ?? []) {
    const validation = candidate.datumValidation ?? {}
    if (validation.status !== 'MATCH' || !validation.datum) continue
    const d = validation.datum
    const price = poolPrice(d.assetA, d.assetB, d.reserveARaw, d.reserveBRaw)
    if (!price) continue
    dexPools.push({
      venue: 'Minswap V2',
      poolType: 'CONSTANT_PRODUCT',
      utxoRef: candidate.utxoRef,
      sourceBlockHeight: candidate.transactionContext?.blockHeight ?? candidate.blockHeight ?? null,
      sourceBlockTime: candidate.transactionContext?.blockTime ?? candidate.blockTime ?? null,
      ...price,
      baseFeeANumeratorRaw: d.baseFeeANumeratorRaw ?? null,
      baseFeeBNumeratorRaw: d.baseFeeBNumeratorRaw ?? null,
      feeSharingNumeratorRaw: d.feeSharingNumeratorRaw ?? null,
      allowDynamicFee: d.allowDynamicFee ?? null,
      feeBasis: '10000',
      priceAdaPerUsdm: formatScaled(BigInt(price.priceScaledRaw)),
    })
  }
  for (const candidate of sundae.candidates ?? []) {
    const validation = candidate.datumValidation ?? {}
    if (validation.status !== 'MATCH' || candidate.apiReconciliation?.status !== 'MATCH') continue
    const datum = validation.datum
    const price = poolPrice(datum.assetA, datum.assetB, validation.reserveARaw, validation.reserveBRaw)
    if (!price) continue
    dexPools.push({
      venue: 'SundaeSwap V3',
      poolType: 'CONSTANT_PRODUCT',
      poolUtxoRef: candidate.utxoRef,
      sourceBlockHeight: candidate.blockHeight ?? null,
      sourceBlockTime: candidate.blockTime ?? null,
      ...price,
      priceAdaPerUsdm: formatScaled(BigInt(price.priceScaledRaw)),
      bidFeesPer10000Raw: datum.bidFeesPer10000Raw,
      askFeesPer10000Raw: datum.askFeesPer10000Raw,
      protocolFeesRaw: datum.protocolFeesRaw,
      apiReconciliationStatus: candidate.apiReconciliation.status,
    })
  }

  for (const pool of wing.pools ?? []) {
    if (pool.status !== 'MATCH' || pool.poolType !== 'ConstantProduct') continue
    const d = pool.datum ?? {}
    const price = poolPrice(d.assetA, d.assetB, pool.activeReserveARaw, pool.activeReserveBRaw)
    if (!price) continue
    dexPools.push({
      venue: 'WingRiders V2',
      poolType: 'CONSTANT_PRODUCT',
      utxoRef: pool.utxoRef,
      sourceBlockHeight: pool.blockHeight ?? null,
      sourceBlockTime: pool.blockTime ?? null,
      ...price,
      swapFeeInBasis: d.swapFeeInBasis ?? null,
      protocolFeeInBasis: d.protocolFeeInBasis ?? null,
      projectFeeInBasis: d.projectFeeInBasis ?? null,
      reserveFeeInBasis: d.reserveFeeInBasis ?? null,
      feeBasis: d.feeBasis ?? '10000',
      priceAdaPerUsdm: formatScaled(BigInt(price.priceScaledRaw)),
    })
  }

  for (const candidate of muesli.candidates ?? []) {
    const validation = candidate.datumValidation ?? {}
    if (validation.status !== 'MATCH' || !validation.priceAdaPerUsdm) continue
    dexPools.push({
      venue: 'MuesliSwap',
      poolType: 'CONSTANT_PRODUCT',
      utxoRef: candidate.utxoRef,
      sourceBlockHeight: candidate.blockHeight ?? null,
      sourceBlockTime: candidate.blockTime ?? null,
      adaReserveRaw: validation.reserveARaw && validation.datum?.assetA?.policyId === '' ? validation.reserveARaw
        : validation.reserveBRaw && validation.datum?.assetB?.policyId === '' ? validation.reserveBRaw : null,
      usdmReserveRaw: validation.datum?.assetA?.policyId === 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad'
        ? validation.reserveARaw : validation.reserveBRaw,
      priceAdaPerUsdm: validation.priceAdaPerUsdm,
      priceScaledRaw: validation.priceAdaPerUsdmScaledRaw,
      swapFeeBasisPoints: validation.datum?.swapFeeRaw ?? null,
      feeBasis: validation.datum?.swapFeeBasis ?? '10000',
      poolDatumHash: candidate.datumHash,
      paymentCredentialMatchesOfficial: candidate.paymentCredentialMatchesOfficial,
    })
  }


  const danogoPricePools = []
  const danogoExcluded = []
  for (const pool of danogo.pools ?? []) {
    try {
      const quote = deriveDanogoClmmSpotPrice(pool)
      if (!quote) {
        danogoExcluded.push({
          poolKey: pool.poolKey ?? null,
          utxoRef: pool.utxoRef ?? null,
          status: pool.status,
          reason: pool.rewardEpochBehind === true && pool.rewardAmountRead !== true
            ? 'REWARD_AMOUNT_UNRESOLVED'
            : 'NOT_A_VALID_DIRECT_ADA_USDM_MATCH',
        })
        continue
      }
      danogoPricePools.push(quote)
      dexPools.push({
        venue: 'Danogo CLMM',
        poolType: 'CONCENTRATED_LIQUIDITY',
        utxoRef: quote.utxoRef,
        sourceBlockHeight: quote.sourceBlockHeight,
        sourceBlockTime: quote.sourceBlockTime,
        adaReserveRaw: null,
        usdmReserveRaw: null,
        priceAdaPerUsdm: quote.priceAdaPerUsdm,
        priceNumeratorRaw: quote.priceNumeratorRaw,
        priceDenominatorRaw: quote.priceDenominatorRaw,
        priceMethod: quote.priceMethod,
        virtualReserveXRaw: quote.virtualReserveXRaw,
        virtualReserveYRaw: quote.virtualReserveYRaw,
        activeReserveXRaw: quote.activeReserveXRaw,
        activeReserveYRaw: quote.activeReserveYRaw,
        lpFeeRateBasisPoints: quote.lpFeeRateBasisPoints,
        rewardAmountRead: quote.rewardAmountRead,
        rewardAmountAssumedRaw: quote.rewardAmountAssumedRaw,
        priceLimit: quote.priceLimit,
      })
    } catch (error) {
      danogoExcluded.push({
        poolKey: pool.poolKey ?? null,
        utxoRef: pool.utxoRef ?? null,
        status: pool.status,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const cex = (adaUsd.sources ?? []).filter((x) => x.status === 'MATCHED' && x.midUsd)
  const crossRates = []
  for (const pool of dexPools) {
    for (const ref of cex) {
      const adaUsdMid = parseScaled(ref.midUsd)
      const cross = mulScaled(parseScaled(pool.priceAdaPerUsdm), adaUsdMid)
      const poolUtxoAgeSecondsAtCalculation = pool.sourceBlockTime === null || pool.sourceBlockTime === undefined
        ? null
        : Math.max(0, Math.floor(Date.parse(calculationStartedAt) / 1000 - Number(pool.sourceBlockTime)))
      crossRates.push({
        dexVenue: pool.venue,
        poolUtxoRef: pool.utxoRef,
        adaPerUsdmSpot: pool.priceAdaPerUsdm,
        adaUsdVenue: ref.venue,
        adaUsdBid: ref.bidUsd,
        adaUsdAsk: ref.askUsd,
        adaUsdMid: ref.midUsd,
        indicativeUsdmUsd: formatScaled(cross),
        poolUtxoBlockTime: pool.sourceBlockTime,
        poolUtxoUpdatedAt: pool.sourceBlockTime === null || pool.sourceBlockTime === undefined
          ? null : new Date(Number(pool.sourceBlockTime) * 1000).toISOString(),
        poolUtxoAgeSecondsAtCalculation,
        cexObservedAt: ref.observedAt,
        cexSourceTime: ref.sourceTime,
      })
    }
  }

  const dexPrices = dexPools.map((p) => parseScaled(p.priceAdaPerUsdm))
  const priceSpread = dexPrices.length > 1
    ? {
        minAdaPerUsdm: formatScaled(dexPrices.reduce((a, b) => a < b ? a : b)),
        maxAdaPerUsdm: formatScaled(dexPrices.reduce((a, b) => a > b ? a : b)),
      }
    : null

  const evidence = {
    schema: 'immortal-usdm-usd-cross-reference-readonly-v1',
    calculationStartedAt,
    classification: 'OBSERVATIONAL_AMM_SPOT_X_CEX_ADA_USD_CROSS_NOT_PEG_OR_ORACLE_QUALIFICATION',
    network: 'cardano-mainnet-plus-public-cex-market-data',
    exactAsset: {
      policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
      assetNameHex: '0014df105553444d',
      decimals: 6,
    },
    sources: {
      minswapOnchain: { startedAt: onchain.startedAt, completedAt: onchain.completedAt },
      sundaeswapV3Onchain: { startedAt: sundae.startedAt, completedAt: sundae.completedAt, summary: sundae.summary },
      wingridersOnchain: { startedAt: wing.startedAt, completedAt: wing.completedAt },
      muesliswapOnchain: { startedAt: muesli.startedAt, completedAt: muesli.completedAt, summary: muesli.summary },
      danogoClmmOnchain: { startedAt: danogo.startedAt, completedAt: danogo.completedAt, summary: danogo.summary },
      adaUsdReferences: { startedAt: adaUsd.startedAt, completedAt: adaUsd.completedAt, summary: adaUsd.summary },
    },
    summary: {
      directConstantProductPools: dexPools.length,
      distinctDexVenues: [...new Set(dexPools.map((x) => x.venue))],
      successfulAdaUsdReferences: cex.length,
      danogoClmmDirectAdaUsdmPools: danogoPricePools.length,
      danogoClmmExcludedPools: danogoExcluded.length,
      crossRateCount: crossRates.length,
      adaPerUsdmSpotRange: priceSpread,
    },
    dexPools,
    danogoClmm: { included: danogoPricePools, excluded: danogoExcluded },
    adaUsdReferences: cex,
    indicativeCrossRates: crossRates,
    limitations: [
      'AMM spot is a marginal pool price before taker execution fees and slippage; constant-product venues use active reserve ratios, while Danogo CLMM uses the official SDK virtual-reserve marginal ratio. Neither is a guaranteed execution price.',
      'Constant-product pools are included only after venue-specific structural validation. Danogo CLMM uses the official SDK virtual-reserve formula, not a raw reserve ratio; ADA pools with unresolved current-epoch reward amounts are excluded. MuesliSwap is included only for candidates passing the official four-field PoolDatum, pool NFT, factory token, pair and Value checks. SundaeSwap V3 is included after official contract-source review and live API/Koios reserve reconciliation.',
      'Each CEX midpoint is a separate centralized-exchange market reference. It is not a decentralized oracle and may be stale, thin, or venue-specific.',
      'MuesliSwap public API DNS was unavailable in the captured run; its direct on-chain pool observation is validated against the official MuesliSwap pool contract source. A separate MuesliSwap USDM/USADA pool is not a direct ADA/USDM quote and is not included in this cross-rate.',
      'The ADA/USD and USDM/ADA observations have separate timestamps and are not an atomic cross-market snapshot.',
      'Pool UTxO ages are reported for transparency only; no freshness threshold or automatic pool exclusion is introduced by this observer.',
      'No averaging, outlier threshold, peg band, confidence threshold, redemption claim, issuer reserve claim, EEV valuation, or deployment qualification is performed.',
      'The resulting USDM/USD values are indicative cross-rates only. They do not establish USDM/USD parity or oracle suitability.',
    ],
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: 'READ_ONLY_USDM_USD_CROSS_REFERENCE_COMPLETE',
    output: outPath,
    summary: evidence.summary,
    completedAt: new Date().toISOString(),
  }, null, 2))
}
main().catch((error) => {
  console.error(JSON.stringify({
    status: 'READ_ONLY_USDM_USD_CROSS_REFERENCE_FAILED',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }, null, 2))
  process.exitCode = 1
})
