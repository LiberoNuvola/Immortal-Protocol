import { describe, expect, it } from 'vitest'
import {
  assertPreRichControlMatches,
  assertPreRichControlHistory,
} from './PreRichHysteresisBinding'

const classes = [
  { id: 0, capacityCost: 10n },
  { id: 1, capacityCost: 20n },
  { id: 2, capacityCost: 40n },
] as const

describe('PRE-RICH hysteresis control binding', () => {
  it('accepts the deterministic activation result', () => {
    const result = assertPreRichControlMatches(
      320n,
      classes,
      { currentActiveClass: null, highestClassEverActivated: null },
      { currentActiveClass: 2, highestClassEverActivated: 2 },
    )

    expect(result.action).toBe('ACTIVATE')
  })

  it('rejects caller-selected control that disagrees with the controller', () => {
    expect(() =>
      assertPreRichControlMatches(
        320n,
        classes,
        { currentActiveClass: null, highestClassEverActivated: null },
        { currentActiveClass: 1, highestClassEverActivated: 1 },
      ),
    ).toThrow(
      'PRE-RICH control-state mismatch: observed control is not the deterministic hysteresis result',
    )
  })

  it('accepts direct contraction while preserving historical maximum', () => {
    const result = assertPreRichControlMatches(
      80n,
      classes,
      { currentActiveClass: 2, highestClassEverActivated: 2 },
      { currentActiveClass: 0, highestClassEverActivated: 2 },
    )

    expect(result.action).toBe('CONTRACT')
    expect(result.highestClassEverActivated).toBe(2)
  })

  it('rejects a non-monotonic historical result', () => {
    expect(() =>
      assertPreRichControlHistory(
        { currentActiveClass: 2, highestClassEverActivated: 2 },
        { currentActiveClass: 0, highestClassEverActivated: 1 },
      ),
    ).toThrow('PRE-RICH HighestClassEverActivated must be monotonic')
  })

  it('rejects current class above historical maximum', () => {
    expect(() =>
      assertPreRichControlHistory(
        { currentActiveClass: 0, highestClassEverActivated: 0 },
        { currentActiveClass: 2, highestClassEverActivated: 1 },
      ),
    ).toThrow(
      'PRE-RICH CurrentActiveClass cannot exceed HighestClassEverActivated',
    )
  })
})
