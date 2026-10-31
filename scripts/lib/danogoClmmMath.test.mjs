import { describe, expect, it } from 'vitest'
import { deriveDanogoClmmSpotPrice, calcLiquidity, formatRatio } from './danogoClmmMath.mjs'

const USDM = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
const ADA = ''

function pool({ tokenX = USDM, tokenY = ADA, activeX = '100', activeY = '100',
  lowerNum = '1', lowerDen = '2', upperNum = '2', upperDen = '1',
  rewardEpochBehind = false, rewardAmountRead = false } = {}) {
  return {
    status: 'MATCH',
    poolKey: 'danogo-clmm:test',
    utxoRef: 'ab'.repeat(32) + '#0',
    activeReserveXRaw: activeX,
    activeReserveYRaw: activeY,
    rewardEpochBehind,
    rewardAmountRead,
    rewardAmountAssumedRaw: '0',
    datum: {
      tokenX: { unit: tokenX },
      tokenY: { unit: tokenY },
      sqrtLowerPrice: { numeratorRaw: lowerNum, denominatorRaw: lowerDen },
      sqrtUpperPrice: { numeratorRaw: upperNum, denominatorRaw: upperDen },
      lpFeeRate: '30',
    },
  }
}

describe('Danogo CLMM official virtual-reserve spot math', () => {
  it('matches the symmetric-range, symmetric-reserve marginal spot', () => {
    const result = deriveDanogoClmmSpotPrice(pool())
    expect(result.priceAdaPerUsdm).toBe('1')
    expect(result.virtualReserveXRaw).toBe('184')
    expect(result.virtualReserveYRaw).toBe('184')
    expect(result.priceMethod).toBe('OFFICIAL_DANOGO_SDK_VIRTUAL_RESERVE_MARGINAL_RATIO')
  })

  it('inverts the virtual reserve ratio when ADA is token X', () => {
    const result = deriveDanogoClmmSpotPrice(pool({ tokenX: ADA, tokenY: USDM, activeX: '100', activeY: '400' }))
    expect(result.priceNumeratorRaw).toBe(result.virtualReserveXRaw)
    expect(result.priceDenominatorRaw).toBe(result.virtualReserveYRaw)
    expect(result.priceAdaPerUsdm).toBe(formatRatio(BigInt(result.virtualReserveXRaw), BigInt(result.virtualReserveYRaw)))
  })

  it('uses Y/X when USDM is token X', () => {
    const result = deriveDanogoClmmSpotPrice(pool({ activeX: '100', activeY: '400' }))
    expect(result.priceNumeratorRaw).toBe(result.virtualReserveYRaw)
    expect(result.priceDenominatorRaw).toBe(result.virtualReserveXRaw)
    expect(result.priceAdaPerUsdm).toBe(formatRatio(BigInt(result.virtualReserveYRaw), BigInt(result.virtualReserveXRaw)))
  })

  it('excludes an ADA pool with unresolved current-epoch rewards', () => {
    expect(deriveDanogoClmmSpotPrice(pool({ tokenX: ADA, tokenY: USDM, rewardEpochBehind: true }))).toBeNull()
  })

  it('allows the reward-behind pool only when its reward amount was actually read', () => {
    const result = deriveDanogoClmmSpotPrice(pool({
      tokenX: ADA, tokenY: USDM, rewardEpochBehind: true, rewardAmountRead: true,
    }))
    expect(result).not.toBeNull()
    expect(result.rewardAmountRead).toBe(true)
  })

  it('does not produce a direct ADA/USDM quote for other pairs', () => {
    expect(deriveDanogoClmmSpotPrice(pool({ tokenY: 'ff'.repeat(28) + '01' }))).toBeNull()
  })

  it('fails closed on invalid price ranges', () => {
    expect(() => deriveDanogoClmmSpotPrice(pool({
      lowerNum: '2', lowerDen: '1', upperNum: '1', upperDen: '2',
    }))).toThrow('DANO_CLMM_PRICE_RANGE_INVALID')
  })

  it('rejects nonpositive active reserves', () => {
    expect(() => deriveDanogoClmmSpotPrice(pool({ activeX: '0' })))
      .toThrow('DANO_CLMM_ACTIVE_RESERVE_X_NONPOSITIVE')
  })

  it('uses integer-only liquidity arithmetic', () => {
    const liquidity = calcLiquidity(100n, 100n,
      { num: 1n, den: 2n }, { num: 2n, den: 1n })
    expect(liquidity.numerator).toBe(1000n)
    expect(liquidity.denominator).toBe(6n)
  })
})
