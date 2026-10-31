#!/usr/bin/env node
/**
 * Derive observational USDM/USD cross-rates from:
 *   - direct USDM/ADA constant-product pools verified on Cardano Mainnet
 *   - independent public ADA/USD exchange bid/ask midpoints
 *
 * This is a read-only research calculation, not a peg oracle or EEV valuation.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

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
  const wingPath = arg('--wingriders', 'audit/wingriders/wingriders-v2-usdm-readonly.json')
  const adaUsdPath = arg('--ada-usd', 'audit/ada-usd/ada-usd-public-references-readonly.json')
  const outPath = arg('--out', 'audit/oracles/usdm-usd-cross-reference-readonly.json')
  const calculationStartedAt = new Date().toISOString()
  const [onchain, wing, adaUsd] = await Promise.all([
    readFile(onchainPath, 'utf8').then(JSON.parse),
    readFile(wingPath, 'utf8').then(JSON.parse),
    readFile(adaUsdPath, 'utf8').then(JSON.parse),
  ])

  if (onchain.network !== 'cardano-mainnet' || wing.network !== 'cardano-mainnet') {
    throw new Error('CARDANO_NETWORK_MISMATCH')
  }
  if (adaUsd.pair !== 'ADA/USD') throw new Error('ADA_USD_PAIR_MISMATCH')

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
      wingridersOnchain: { startedAt: wing.startedAt, completedAt: wing.completedAt },
      adaUsdReferences: { startedAt: adaUsd.startedAt, completedAt: adaUsd.completedAt, summary: adaUsd.summary },
    },
    summary: {
      directConstantProductPools: dexPools.length,
      distinctDexVenues: [...new Set(dexPools.map((x) => x.venue))],
      successfulAdaUsdReferences: cex.length,
      crossRateCount: crossRates.length,
      adaPerUsdmSpotRange: priceSpread,
    },
    dexPools,
    adaUsdReferences: cex,
    indicativeCrossRates: crossRates,
    limitations: [
      'AMM spot is the ratio of the on-chain active reserve quantities before trade fees and slippage; it is not a guaranteed execution price.',
      'Only verified constant-product USDM/ADA pools are used. CLMM and stableswap pools are deliberately excluded until their official curve math is implemented.',
      'Each CEX midpoint is a separate centralized-exchange market reference. It is not a decentralized oracle and may be stale, thin, or venue-specific.',
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
