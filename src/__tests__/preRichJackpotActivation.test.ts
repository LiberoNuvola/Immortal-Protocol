import { describe, expect, it } from 'vitest'

import {
  PRE_RICH_JACKPOT_TOP_CLASS_ID,
  isPreRichJackpotFundingEligible,
  isPreRichJackpotStableLadder,
  preRichJackpotFundingNeed,
  type PreRichJackpotFundingWitness,
} from '../../PRE-RICH/profile/PreRichJackpotActivation'

const stable: PreRichJackpotFundingWitness = {
  currentActiveClass: PRE_RICH_JACKPOT_TOP_CLASS_ID,
  highestClassEverActivated: PRE_RICH_JACKPOT_TOP_CLASS_ID,
  activationPredicateSatisfied: true,
  suspensionPredicateSatisfied: false,
  jackpotFloor: 98_000n,
  lockedJackpot: 98_000n,
  economicGateAccepted: true,
}

describe('PRE-RICH Jackpot activation policy boundary', () => {
  it('requires the top class to be both current and highest-ever activated', () => {
    expect(
      isPreRichJackpotStableLadder({
        ...stable,
        currentActiveClass: PRE_RICH_JACKPOT_TOP_CLASS_ID - 1n,
      }),
    ).toBe(false)

    expect(
      isPreRichJackpotStableLadder({
        ...stable,
        highestClassEverActivated: PRE_RICH_JACKPOT_TOP_CLASS_ID - 1n,
      }),
    ).toBe(false)
  })

  it('composes the existing activation/suspension predicates without inventing a scalar maturity threshold', () => {
    expect(
      isPreRichJackpotStableLadder({
        ...stable,
        activationPredicateSatisfied: false,
      }),
    ).toBe(false)

    expect(
      isPreRichJackpotStableLadder({
        ...stable,
        suspensionPredicateSatisfied: true,
      }),
    ).toBe(false)

    expect(isPreRichJackpotStableLadder(stable)).toBe(true)
  })

  it('derives funding need as the minimum shortfall, never as a fixed percentage', () => {
    expect(preRichJackpotFundingNeed(98_000n, 90_000n)).toBe(8_000n)
    expect(preRichJackpotFundingNeed(98_000n, 98_000n)).toBe(0n)
    expect(preRichJackpotFundingNeed(90_000n, 98_000n)).toBe(0n)
  })

  it('requires positive funding need and Economic Gate acceptance', () => {
    expect(isPreRichJackpotFundingEligible(stable)).toBe(false)

    expect(
      isPreRichJackpotFundingEligible({
        ...stable,
        lockedJackpot: 90_000n,
      }),
    ).toBe(true)

    expect(
      isPreRichJackpotFundingEligible({
        ...stable,
        lockedJackpot: 90_000n,
        economicGateAccepted: false,
      }),
    ).toBe(false)
  })

  it('rejects negative monetary inputs fail-closed', () => {
    expect(() => preRichJackpotFundingNeed(-1n, 0n)).toThrow(
      'Jackpot floor must be non-negative',
    )
    expect(() => preRichJackpotFundingNeed(0n, -1n)).toThrow(
      'Locked Jackpot must be non-negative',
    )
  })
})
