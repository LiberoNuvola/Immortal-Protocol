import { describe, expect, it } from 'vitest'
import { claimRefinementAdmissible, validateClaimRefinementEvidence, type ClaimRefinementEvidence } from '../../PRE-RICH/profile/PreRichClaimRefinement'

const base: ClaimRefinementEvidence = {
  ticketPolicyId: 'aa'.repeat(28),
  ticketAssetNameHex: '30',
  statusBefore: 'Revealed',
  statusAfter: 'Claimed',
  prizeAmountSubunits: 250n,
  settlementAmountSubunits: 250n,
  ticketOwnerPkh: 'owner',
  claimantPkh: 'owner',
  ownerSigned: true,
  claimValidityUpperBound: 1_000n,
  expiresAt: 1_000n,
  pendingLiabilityBefore: 500n,
  pendingLiabilityAfter: 250n,
  totalLiquidityBefore: 10_000n,
  totalLiquidityAfter: 9_750n,
  ticketNftRetained: true,
}

describe('PRE-RICH ticket-level Claim refinement', () => {
  it('accepts a complete exact claim witness', () => {
    expect(claimRefinementAdmissible(base)).toBe(true)
    expect(() => validateClaimRefinementEvidence(base)).not.toThrow()
  })

  it('requires the frozen PrizeAmount to equal settlement exactly', () => {
    expect(() => validateClaimRefinementEvidence({ ...base, settlementAmountSubunits: 249n }))
      .toThrow('settlement must equal the frozen PrizeAmount exactly')
  })

  it('requires current ownership and owner signature', () => {
    expect(() => validateClaimRefinementEvidence({ ...base, claimantPkh: 'other' }))
      .toThrow('claimant must be the current ticket owner')
    expect(() => validateClaimRefinementEvidence({ ...base, ownerSigned: false }))
      .toThrow('current ticket owner must sign the claim')
  })

  it('allows the exact expiresAt boundary', () => {
    expect(claimRefinementAdmissible({ ...base, claimValidityUpperBound: 1_000n, expiresAt: 1_000n })).toBe(true)
  })

  it('rejects a claim past expiry', () => {
    expect(() => validateClaimRefinementEvidence({ ...base, claimValidityUpperBound: 1_001n }))
      .toThrow('claim validity window exceeds ticket expiry')
  })

  it('reduces pending liability and liquidity exactly once by payout', () => {
    expect(() => validateClaimRefinementEvidence({ ...base, pendingLiabilityAfter: 249n }))
      .toThrow('claim must reduce pending liability by the exact payout')
    expect(() => validateClaimRefinementEvidence({ ...base, totalLiquidityAfter: 9_749n }))
      .toThrow('claim must reduce total liquidity by the exact payout')
  })

  it('rejects underfunded liability or pool', () => {
    expect(() => validateClaimRefinementEvidence({ ...base, pendingLiabilityBefore: 249n, pendingLiabilityAfter: 0n }))
      .toThrow('pending liability is insufficient for frozen payout')
    expect(() => validateClaimRefinementEvidence({ ...base, totalLiquidityBefore: 249n, totalLiquidityAfter: 0n }))
      .toThrow('pool liquidity is insufficient for the frozen payout')
  })

  it('keeps NFT retention explicit', () => {
    expect(() => validateClaimRefinementEvidence({ ...base, ticketNftRetained: false }))
      .toThrow('claim must not require NFT burn')
  })

  it('fails closed for non-Revealed input or wrong terminal state', () => {
    expect(claimRefinementAdmissible({ ...base, statusBefore: 'Pending' } as unknown as ClaimRefinementEvidence)).toBe(false)
    expect(claimRefinementAdmissible({ ...base, statusAfter: 'Revealed' } as unknown as ClaimRefinementEvidence)).toBe(false)
  })
})