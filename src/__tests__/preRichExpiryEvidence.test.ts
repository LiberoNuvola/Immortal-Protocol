import { describe, expect, it } from 'vitest'

import {
  expiredAtOrAfter,
  lateRevealEconomicEffect,
  validBeforeExpiry,
  validateTicketExpiryEvidence,
} from '../../PRE-RICH/profile/PreRichExpiryEvidence'

const evidence = {
  ticketId: 'ticket-001',
  issuedAt: 1_000n,
  expiresAt: 2_000n,
}

describe('PRE-RICH ticket expiry refinement evidence', () => {
  it('accepts a crystallized expiresAt that is not before issuedAt', () => {
    expect(() => validateTicketExpiryEvidence(evidence)).not.toThrow()
  })

  it('allows reveal/claim exactly through the expiresAt upper-bound convention', () => {
    expect(validBeforeExpiry(1_999n, evidence)).toBe(true)
    expect(validBeforeExpiry(2_000n, evidence)).toBe(true)
    expect(validBeforeExpiry(2_001n, evidence)).toBe(false)
  })

  it('allows expiry at and after the crystallized expiresAt boundary', () => {
    expect(expiredAtOrAfter(1_999n, evidence)).toBe(false)
    expect(expiredAtOrAfter(2_000n, evidence)).toBe(true)
    expect(expiredAtOrAfter(2_001n, evidence)).toBe(true)
  })

  it('makes late reveal economically inert after expiry', () => {
    expect(lateRevealEconomicEffect(1_999n, evidence)).toBe(1n)
    expect(lateRevealEconomicEffect(2_000n, evidence)).toBe(1n)
    expect(lateRevealEconomicEffect(2_001n, evidence)).toBe(0n)
  })

  it('fails closed on invalid timestamp order', () => {
    expect(() =>
      validateTicketExpiryEvidence({
        ...evidence,
        expiresAt: 999n,
      }),
    ).toThrow('expiresAt must not precede issuedAt')
  })

  it('fails closed on empty ticket identity', () => {
    expect(() =>
      validateTicketExpiryEvidence({
        ...evidence,
        ticketId: '',
      }),
    ).toThrow('ticketId is required')
  })
})