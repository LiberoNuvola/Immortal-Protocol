import { describe, expect, it } from 'vitest'
import { defaultPrizeTable, prizeAmountForTier, rowPayoutTotal } from '../gameRules'

describe('PRE-RICH canonical payout-unit boundary', () => {
  const ONE_USDM = 100

  it('represents Genesis as exactly 100 USDM sub-units', () => {
    expect(prizeAmountForTier(defaultPrizeTable, 1, ONE_USDM)).toBe(100)
  })

  it('represents the 2.5 USDM tier exactly as 250 sub-units', () => {
    expect(prizeAmountForTier(defaultPrizeTable, 2, ONE_USDM)).toBe(250)
  })

  it('represents the 500 USDM tier exactly as 50,000 sub-units', () => {
    expect(prizeAmountForTier(defaultPrizeTable, 5, ONE_USDM)).toBe(50_000)
  })

  it('preserves the 500x ticket cap exactly in sub-units', () => {
    expect(rowPayoutTotal(defaultPrizeTable, 5, 5, ONE_USDM)).toBe(50_000)
    expect(rowPayoutTotal(defaultPrizeTable, 5, 4, ONE_USDM)).toBe(50_000)
  })

  it('preserves every canonical ladder price without fractional truncation', () => {
    const prices = [1, 2, 3, 5, 10, 25, 50, 100]
    for (const price of prices) {
      const priceSubunits = price * ONE_USDM
      expect(Number.isInteger(prizeAmountForTier(defaultPrizeTable, 2, priceSubunits))).toBe(true)
      expect(prizeAmountForTier(defaultPrizeTable, 2, priceSubunits)).toBe(250 * price)
    }
  })
})
