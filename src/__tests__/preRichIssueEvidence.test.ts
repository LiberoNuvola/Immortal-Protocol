import { describe, expect, it } from 'vitest'

import {
  issueClassSaleable,
  issueRefinementAdmissible,
  validateIssueRefinementEvidence,
} from '../../PRE-RICH/profile/PreRichIssueEvidence'

const base = {
  classId: 2n,
  priceReferenceUnits: 3n,
  currentActiveClass: 2n,
  highestClassEverActivated: 6n,
  issued: 4n,
  cap: 10n,
}

describe('PRE-RICH Issue refinement evidence', () => {
  it('accepts the V3 classSaleable boundary when the class is active and below cap', () => {
    expect(issueClassSaleable(base)).toBe(true)
    expect(issueRefinementAdmissible(base)).toBe(true)
  })

  it('rejects a class above CurrentActiveClass even when capacity remains', () => {
    expect(
      issueClassSaleable({
        ...base,
        classId: 3n,
        priceReferenceUnits: 5n,
      }),
    ).toBe(false)
  })

  it('rejects a class at its cap', () => {
    expect(issueClassSaleable({ ...base, issued: 10n })).toBe(false)
  })

  it('rejects a class/price mismatch', () => {
    expect(() =>
      validateIssueRefinementEvidence({
        ...base,
        priceReferenceUnits: 5n,
      }),
    ).toThrow('PRE-RICH issue price does not match class')
  })

  it('rejects inconsistent activation history', () => {
    expect(() =>
      validateIssueRefinementEvidence({
        ...base,
        currentActiveClass: 7n,
        highestClassEverActivated: 6n,
      }),
    ).toThrow('current active class cannot exceed highest-ever activated class')
  })

  it('fails closed on an unknown class', () => {
    expect(() =>
      validateIssueRefinementEvidence({
        ...base,
        classId: 8n,
        priceReferenceUnits: 100n,
      }),
    ).toThrow('unknown PRE-RICH issue class')
  })
})