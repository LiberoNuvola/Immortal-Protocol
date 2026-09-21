import { describe, expect, it } from 'vitest'

import {
  refinesAggregateExpire,
  validateExpireRefinementEvidence,
  type ExpireRefinementEvidence,
} from '../../PRE-RICH/profile/PreRichExpireRefinement'

const valid: ExpireRefinementEvidence = {
  ticketId: 'ticket-42',
  ticketClass: 3,
  ticketPriceUsdm: 500n,
  ticketIssuedAt: 10_000n,
  ticketExpiresAt: 20_000n,
  unresolvedBefore: 7n,
  unresolvedAfter: 6n,
  unresolvedReserveBefore: 4_000n,
  unresolvedReserveAfter: 3_500n,
}

describe('PRE-RICH Expire ticket→class refinement', () => {
  it('accepts an exact single-ticket refinement at expiry', () => {
    expect(validateExpireRefinementEvidence(valid, 500n, 20_000n)).not.toThrow()
    expect(refinesAggregateExpire(valid, 3, 500n, 20_000n)).toBe(true)
  })

  it('rejects expiry before the ticket boundary', () => {
    expect(refinesAggregateExpire(valid, 3, 500n, 19_999n)).toBe(false)
  })

  it('rejects a class-price mismatch', () => {
    expect(refinesAggregateExpire(valid, 3, 300n, 20_000n)).toBe(false)
  })

  it('rejects a ticket attributed to another aggregate class', () => {
    expect(refinesAggregateExpire(valid, 4, 500n, 20_000n)).toBe(false)
  })

  it('rejects a partial reserve release', () => {
    const malformed = {
      ...valid,
      unresolvedReserveAfter: 3_600n,
    }
    expect(refinesAggregateExpire(malformed, 3, 500n, 20_000n)).toBe(false)
  })

  it('rejects an aggregate update that consumes more than one ticket', () => {
    const malformed = {
      ...valid,
      unresolvedAfter: 5n,
    }
    expect(refinesAggregateExpire(malformed, 3, 500n, 20_000n)).toBe(false)
  })

  it('rejects a reserve claim disguised as expiry', () => {
    const malformed = {
      ...valid,
      unresolvedReserveAfter: 2_500n,
    }
    expect(refinesAggregateExpire(malformed, 3, 500n, 20_000n)).toBe(false)
  })
})