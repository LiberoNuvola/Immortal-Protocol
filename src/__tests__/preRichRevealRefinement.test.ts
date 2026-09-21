import { describe, expect, it } from 'vitest'
import { revealRefinementAdmissible, validateRevealRefinementEvidence, type RevealRefinementEvidence } from '../../PRE-RICH/profile/PreRichRevealRefinement'

const base: RevealRefinementEvidence = {
  ticketPolicyId: 'aa'.repeat(28),
  ticketAssetNameHex: '30',
  statusBefore: 'Pending',
  statusAfter: 'Revealed',
  beaconReady: true,
  commitmentVerified: true,
  resultVerified: true,
  resultHex: 'bb'.repeat(32),
  priceSubunits: 100n,
  row1Tier: 0n,
  row2Tier: 2n,
  prizeTier: 2n,
  prizeAmountSubunits: 250n,
  revealValidityUpperBound: 1_000n,
  expiresAt: 1_000n,
  unresolvedBefore: 10n,
  unresolvedAfter: 9n,
  unresolvedReserveBefore: 1_000n,
  unresolvedReserveAfter: 900n,
  pendingLiabilityBefore: 500n,
  pendingLiabilityAfter: 750n,
  totalLiquidityBefore: 10_000n,
  lockedJackpotBefore: 1_000n,
}

describe('PRE-RICH ticket-level Reveal refinement', () => {
  it('accepts a complete canonical reveal witness', () => {
    expect(revealRefinementAdmissible(base)).toBe(true)
    expect(() => validateRevealRefinementEvidence(base)).not.toThrow()
  })

  it('requires Beacon, commitment and result verification', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, beaconReady: false }))
      .toThrow('Beacon must be ready before reveal')
    expect(() => validateRevealRefinementEvidence({ ...base, commitmentVerified: false }))
      .toThrow('ticket commitment must be verified before reveal')
    expect(() => validateRevealRefinementEvidence({ ...base, resultVerified: false }))
      .toThrow('reveal result must be cryptographically verified')
  })

  it('preserves the two-row result summary exactly', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, row1Tier: 5n, row2Tier: 2n, prizeTier: 2n }))
      .toThrow('prize tier must equal max(row1Tier,row2Tier)')
    expect(revealRefinementAdmissible({ ...base, row1Tier: 5n, row2Tier: 2n, prizeTier: 5n })).toBe(true)
  })

  it('enforces the 500x payout cap', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, prizeAmountSubunits: 50_001n }))
      .toThrow('reveal payout exceeds the canonical 500x cap')
  })

  it('allows reveal at the exact expiry boundary', () => {
    expect(revealRefinementAdmissible({ ...base, revealValidityUpperBound: 1_000n, expiresAt: 1_000n })).toBe(true)
  })

  it('rejects reveal after expiry', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, revealValidityUpperBound: 1_001n }))
      .toThrow('reveal validity window exceeds ticket expiry')
  })

  it('releases exactly one ticket reserve and unresolved count', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, unresolvedAfter: 8n }))
      .toThrow('reveal must consume exactly one unresolved ticket')
    expect(() => validateRevealRefinementEvidence({ ...base, unresolvedReserveAfter: 899n }))
      .toThrow('reveal must release exactly the ticket reserve')
  })

  it('creates exactly the crystallised payout liability', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, pendingLiabilityAfter: 749n }))
      .toThrow('reveal must create the exact crystallised payout liability')
  })

  it('rejects a payout above pre-reveal effective pool', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, prizeAmountSubunits: 8_001n, row2Tier: 5n, prizeTier: 5n }))
      .toThrow('reveal payout exceeds pre-reveal effective pool')
  })

  it('fails closed when the pre-reveal pool is already insolvent', () => {
    expect(() => validateRevealRefinementEvidence({ ...base, totalLiquidityBefore: 2_499n }))
      .toThrow('pre-reveal effective pool is already insolvent')
  })
})