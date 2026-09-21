import { describe, expect, it } from 'vitest'
import {
  jackpotFloorReferenceUnits,
  jackpotFundingAdmissible,
  jackpotFundingNeedReferenceUnits,
  stableLadder,
  type PreRichJackpotPolicyInput,
} from '../../PRE-RICH/profile/PreRichJackpotPolicy'

const base: PreRichJackpotPolicyInput = {
  ticketPricesReferenceUnits: [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n],
  maxNormalPayoutMultiplier: 500n,
  currentActiveClass: 7n,
  highestClassEverActivated: 7n,
  activationPredicate: true,
  suspensionPredicate: false,
  lockedJackpot: 0n,
  normalSaleablePricesReferenceUnits: [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n],
}

describe('PRE-RICH Jackpot policy', () => {
  it('activates only on a stable top-class ladder', () => {
    expect(stableLadder(base)).toBe(true)
    expect(stableLadder({ ...base, currentActiveClass: 6n })).toBe(false)
    expect(stableLadder({ ...base, highestClassEverActivated: 6n })).toBe(false)
    expect(stableLadder({ ...base, activationPredicate: false })).toBe(false)
    expect(stableLadder({ ...base, suspensionPredicate: true })).toBe(false)
  })

  it('derives the full ladder floor as 98,000 reference USDM units', () => {
    expect(jackpotFloorReferenceUnits(base)).toBe(98_000n)
  })

  it('uses saleable prices when they exceed the normal ladder sum', () => {
    expect(
      jackpotFloorReferenceUnits({
        ...base,
        normalSaleablePricesReferenceUnits: [100n, 100n],
      }),
    ).toBe(100_000n)
  })

  it('funds only the exact gap to the current floor', () => {
    expect(jackpotFundingNeedReferenceUnits(base)).toEqual({
      stableLadder: true,
      floorReferenceUnits: 98_000n,
      fundingNeedReferenceUnits: 98_000n,
    })
    expect(
      jackpotFundingNeedReferenceUnits({ ...base, lockedJackpot: 97_500n }),
    ).toEqual({
      stableLadder: true,
      floorReferenceUnits: 98_000n,
      fundingNeedReferenceUnits: 500n,
    })
    expect(
      jackpotFundingNeedReferenceUnits({ ...base, lockedJackpot: 100_000n }),
    ).toEqual({
      stableLadder: true,
      floorReferenceUnits: 98_000n,
      fundingNeedReferenceUnits: 0n,
    })
  })

  it('does not allocate funding while the ladder is unstable', () => {
    expect(
      jackpotFundingNeedReferenceUnits({ ...base, currentActiveClass: 6n }),
    ).toEqual({
      stableLadder: false,
      floorReferenceUnits: 98_000n,
      fundingNeedReferenceUnits: 0n,
    })
  })

  it('requires both Gate acceptance and sufficient RawSurplus', () => {
    expect(jackpotFundingAdmissible(base, 98_000n, true)).toBe(true)
    expect(jackpotFundingAdmissible(base, 97_999n, true)).toBe(false)
    expect(jackpotFundingAdmissible(base, 100_000n, false)).toBe(false)
  })
})