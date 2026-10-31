/**
 * Read-only Danogo CLMM marginal spot math, ported from the official SDK.
 *
 * Source: https://github.com/dano-finance/clmm-sdk
 * src/utils.ts: calcLiquidity(), calculateConcentratedPoolSwap()
 *
 * Inputs are already-validated active reserves from the observer. This module
 * does not read the network, wallets, rewards, or submit transactions.
 */

function sqrtBigInt(value) {
  if (value < 0n) throw new Error('DANO_CLMM_SQRT_NEGATIVE')
  if (value < 2n) return value
  let x0 = value
  let x1 = (x0 + value / x0) >> 1n
  while (x1 < x0) {
    x0 = x1
    x1 = (x0 + value / x0) >> 1n
  }
  return x0
}

function ceilDiv(a, b) {
  if (b <= 0n) throw new Error('DANO_CLMM_DIVISOR_NONPOSITIVE')
  const q = a / b
  const r = a % b
  return r === 0n ? q : q + 1n
}

function parsePositive(value, name) {
  const n = BigInt(String(value))
  if (n <= 0n) throw new Error(name + '_NONPOSITIVE')
  return n
}

function calcLiquidity(x, y, lower, upper) {
  const denAdenB = lower.den * upper.den
  const numAnumB = lower.num * upper.num
  const delta = y * denAdenB - x * numAnumB
  const diffSquare = delta * delta
  const xy4Term = 4n * x * y * lower.den * lower.den * upper.num * upper.num
  const bigSqrt = sqrtBigInt(diffSquare + xy4Term)
  const numerator = y * denAdenB + x * numAnumB + bigSqrt
  const denominator = 2n * (upper.num * lower.den - upper.den * lower.num)
  if (denominator <= 0n || numerator <= 0n) {
    throw new Error('DANO_CLMM_VIRTUAL_LIQUIDITY_INVALID')
  }
  return { numerator, denominator }
}

function formatRatio(numerator, denominator, decimals = 8) {
  if (numerator <= 0n || denominator <= 0n) {
    throw new Error('DANO_CLMM_SPOT_RATIO_NONPOSITIVE')
  }
  const scale = 10n ** BigInt(decimals)
  const rounded = (numerator * scale + denominator / 2n) / denominator
  const whole = rounded / scale
  const fraction = (rounded % scale).toString().padStart(decimals, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

/**
 * Derive the marginal spot from Danogo's virtual reserves:
 *   xV = ceil(L / sqrtUpperPrice) + activeReserveX
 *   yV = ceil(L * sqrtLowerPrice) + activeReserveY
 * For X -> Y, marginal output/input = yV/xV.
 *
 * Returns null for pools that are not direct ADA/USDM or whose ADA reward
 * amount is unresolved for the current epoch.
 */
export function deriveDanogoClmmSpotPrice(pool) {
  if (!pool || pool.status !== 'MATCH') return null
  if (pool.rewardEpochBehind === true &&
      (pool.rewardAmountRead !== true || pool.rewardAmountAppliedRaw === undefined || pool.rewardAmountAppliedRaw === null)) return null

  const datum = pool.datum
  if (!datum) throw new Error('DANO_CLMM_DATUM_MISSING')
  const tokenX = String(datum.tokenX?.unit ?? '').toLowerCase()
  const tokenY = String(datum.tokenY?.unit ?? '').toLowerCase()
  const usdm = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
  const ada = ''
  const xIsUsdm = tokenX === usdm && tokenY === ada
  const yIsUsdm = tokenY === usdm && tokenX === ada
  if (!xIsUsdm && !yIsUsdm) return null

  const activeXBase = parsePositive(pool.activeReserveXRaw, 'DANO_CLMM_ACTIVE_RESERVE_X')
  const rewardApplied = pool.rewardEpochBehind === true ? BigInt(String(pool.rewardAmountAppliedRaw)) : 0n
  if (rewardApplied < 0n) throw new Error('DANO_CLMM_REWARD_AMOUNT_NEGATIVE')
  const activeX = activeXBase + rewardApplied
  const activeY = parsePositive(pool.activeReserveYRaw, 'DANO_CLMM_ACTIVE_RESERVE_Y')
  const lower = {
    num: parsePositive(datum.sqrtLowerPrice?.numeratorRaw, 'DANO_CLMM_LOWER_NUM'),
    den: parsePositive(datum.sqrtLowerPrice?.denominatorRaw, 'DANO_CLMM_LOWER_DEN'),
  }
  const upper = {
    num: parsePositive(datum.sqrtUpperPrice?.numeratorRaw, 'DANO_CLMM_UPPER_NUM'),
    den: parsePositive(datum.sqrtUpperPrice?.denominatorRaw, 'DANO_CLMM_UPPER_DEN'),
  }
  if (lower.num * upper.den >= upper.num * lower.den) {
    throw new Error('DANO_CLMM_PRICE_RANGE_INVALID')
  }

  const liquidity = calcLiquidity(activeX, activeY, lower, upper)
  const virtualX = ceilDiv(liquidity.numerator * upper.den, liquidity.denominator * upper.num) + activeX
  const virtualY = ceilDiv(liquidity.numerator * lower.num, liquidity.denominator * lower.den) + activeY
  if (virtualX <= 0n || virtualY <= 0n) throw new Error('DANO_CLMM_VIRTUAL_RESERVE_NONPOSITIVE')

  // ADA and Moneta USDM both have six decimals. Convert the pool's X->Y
  // marginal ratio into the requested ADA per USDM orientation.
  const numerator = xIsUsdm ? virtualY : virtualX
  const denominator = xIsUsdm ? virtualX : virtualY
  return {
    venue: 'Danogo CLMM',
    poolType: 'CONCENTRATED_LIQUIDITY',
    poolKey: pool.poolKey ?? null,
    utxoRef: pool.utxoRef ?? null,
    sourceBlockHeight: pool.blockHeight ?? null,
    sourceBlockTime: pool.blockTime ?? null,
    tokenX,
    tokenY,
    activeReserveXBaseRaw: activeXBase.toString(),
    rewardAmountAppliedRaw: rewardApplied.toString(),
    activeReserveXRaw: activeX.toString(),
    activeReserveYRaw: activeY.toString(),
    virtualReserveXNumeratorRaw: (liquidity.numerator * upper.den).toString(),
    virtualReserveXDenominatorRaw: (liquidity.denominator * upper.num).toString(),
    virtualReserveXRaw: virtualX.toString(),
    virtualReserveYNumeratorRaw: (liquidity.numerator * lower.num).toString(),
    virtualReserveYDenominatorRaw: (liquidity.denominator * lower.den).toString(),
    virtualReserveYRaw: virtualY.toString(),
    priceNumeratorRaw: numerator.toString(),
    priceDenominatorRaw: denominator.toString(),
    priceAdaPerUsdm: formatRatio(numerator, denominator),
    lpFeeRateBasisPoints: String(datum.lpFeeRate),
    rewardEpochBehind: pool.rewardEpochBehind === true,
    rewardAmountRead: pool.rewardAmountRead === true,
    rewardAmountAssumedRaw: pool.rewardAmountAssumedRaw ?? '0',
    priceMethod: 'OFFICIAL_DANOGO_SDK_VIRTUAL_RESERVE_MARGINAL_RATIO',
    priceLimit: 'MARGINAL_SPOT_BEFORE_SWAP_AND_PLATFORM_FEES; NOT_EXECUTABLE_QUOTE',
  }
}

export { calcLiquidity, ceilDiv, formatRatio, sqrtBigInt }
