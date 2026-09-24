export type ClaimRefinementEvidence = {
  ticketPolicyId: string
  ticketAssetNameHex: string
  statusBefore: 'Revealed'
  statusAfter: 'Claimed'
  prizeAmountSubunits: bigint
  settlementAmountSubunits: bigint
  ticketOwnerPkh: string
  claimantPkh: string
  ownerSigned: boolean
  claimValidityUpperBound: bigint
  expiresAt: bigint
  pendingLiabilityBefore: bigint
  pendingLiabilityAfter: bigint
  totalLiquidityBefore: bigint
  totalLiquidityAfter: bigint
  ticketNftRetained: boolean
}

export function validateClaimRefinementEvidence(evidence: ClaimRefinementEvidence): void {
  if (!evidence.ticketPolicyId.trim()) throw new Error('ticket policy ID is required')
  if (!evidence.ticketAssetNameHex.trim()) throw new Error('ticket asset name is required')
  if (evidence.statusBefore !== 'Revealed') throw new Error('claim requires a Revealed ticket')
  if (evidence.statusAfter !== 'Claimed') throw new Error('claim must end in Claimed status')
  if (evidence.prizeAmountSubunits <= 0n) throw new Error('claim payout must be positive')
  if (evidence.settlementAmountSubunits !== evidence.prizeAmountSubunits) {
    throw new Error('settlement must equal the frozen PrizeAmount exactly')
  }
  if (!evidence.ticketOwnerPkh.trim() || !evidence.claimantPkh.trim()) {
    throw new Error('ticket owner and claimant are required')
  }
  if (evidence.claimantPkh !== evidence.ticketOwnerPkh) {
    throw new Error('claimant must be the current ticket owner')
  }
  if (!evidence.ownerSigned) throw new Error('current ticket owner must sign the claim')
  if (evidence.claimValidityUpperBound < 0n || evidence.expiresAt < 0n) {
    throw new Error('claim timestamps must be non-negative')
  }
  if (evidence.claimValidityUpperBound > evidence.expiresAt) {
    throw new Error('claim validity window exceeds ticket expiry')
  }
  if (evidence.pendingLiabilityBefore < evidence.prizeAmountSubunits) {
    throw new Error('pending liability is insufficient for frozen payout')
  }
  if (evidence.pendingLiabilityAfter !== evidence.pendingLiabilityBefore - evidence.prizeAmountSubunits) {
    throw new Error('claim must reduce pending liability by the exact payout')
  }
  if (evidence.totalLiquidityBefore < evidence.prizeAmountSubunits) {
    throw new Error('pool liquidity is insufficient for the frozen payout')
  }
  if (evidence.totalLiquidityAfter !== evidence.totalLiquidityBefore - evidence.prizeAmountSubunits) {
    throw new Error('claim must reduce total liquidity by the exact payout')
  }
  if (!evidence.ticketNftRetained) throw new Error('claim must not require NFT burn')
}

export function claimRefinementAdmissible(evidence: ClaimRefinementEvidence): boolean {
  try {
    validateClaimRefinementEvidence(evidence)
    return true
  } catch {
    return false
  }
}