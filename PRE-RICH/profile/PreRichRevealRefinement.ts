export type RevealRefinementEvidence = {
  ticketPolicyId: string
  ticketAssetNameHex: string
  statusBefore: 'Pending'
  statusAfter: 'Revealed'
  beaconReady: boolean
  commitmentVerified: boolean
  resultVerified: boolean
  resultHex: string
  priceSubunits: bigint
  row1Tier: bigint
  row2Tier: bigint
  prizeTier: bigint
  prizeAmountSubunits: bigint
  revealValidityUpperBound: bigint
  expiresAt: bigint
  unresolvedBefore: bigint
  unresolvedAfter: bigint
  unresolvedReserveBefore: bigint
  unresolvedReserveAfter: bigint
  pendingLiabilityBefore: bigint
  pendingLiabilityAfter: bigint
  totalLiquidityBefore: bigint
  lockedJackpotBefore: bigint
}

export function validateRevealRefinementEvidence(evidence: RevealRefinementEvidence): void {
  if (!evidence.ticketPolicyId.trim()) throw new Error('ticket policy ID is required')
  if (!evidence.ticketAssetNameHex.trim()) throw new Error('ticket asset name is required')
  if (evidence.statusBefore !== 'Pending') throw new Error('reveal requires a Pending ticket')
  if (evidence.statusAfter !== 'Revealed') throw new Error('reveal must end in Revealed status')
  if (!evidence.beaconReady) throw new Error('Beacon must be ready before reveal')
  if (!evidence.commitmentVerified) throw new Error('ticket commitment must be verified before reveal')
  if (!evidence.resultVerified) throw new Error('reveal result must be cryptographically verified')
  if (!/^[0-9a-fA-F]{64}$/.test(evidence.resultHex)) throw new Error('revealed result must be a 32-byte hex binding')
  if (evidence.priceSubunits <= 0n) throw new Error('ticket price must be positive')
  if (evidence.row1Tier < 0n || evidence.row2Tier < 0n || evidence.prizeTier < 0n) throw new Error('tier values must be non-negative')
  const expectedTier = evidence.row1Tier > evidence.row2Tier ? evidence.row1Tier : evidence.row2Tier
  if (evidence.prizeTier !== expectedTier) throw new Error('prize tier must equal max(row1Tier,row2Tier)')
  if (evidence.prizeAmountSubunits < 0n) throw new Error('prize amount must be non-negative')
  if (evidence.prizeAmountSubunits > 500n * evidence.priceSubunits) {
    throw new Error('reveal payout exceeds the canonical 500x cap')
  }
  if (evidence.revealValidityUpperBound < 0n || evidence.expiresAt < 0n) throw new Error('reveal timestamps must be non-negative')
  if (evidence.revealValidityUpperBound > evidence.expiresAt) throw new Error('reveal validity window exceeds ticket expiry')
  if (evidence.unresolvedBefore <= 0n || evidence.unresolvedAfter < 0n) throw new Error('invalid unresolved ticket counts')
  if (evidence.unresolvedAfter !== evidence.unresolvedBefore - 1n) throw new Error('reveal must consume exactly one unresolved ticket')
  if (evidence.unresolvedReserveBefore < evidence.priceSubunits) throw new Error('unresolved reserve is insufficient for reveal')
  if (evidence.unresolvedReserveAfter !== evidence.unresolvedReserveBefore - evidence.priceSubunits) throw new Error('reveal must release exactly the ticket reserve')
  if (evidence.pendingLiabilityBefore < 0n || evidence.pendingLiabilityAfter < 0n) throw new Error('pending liability must be non-negative')
  if (evidence.pendingLiabilityAfter !== evidence.pendingLiabilityBefore + evidence.prizeAmountSubunits) throw new Error('reveal must create the exact crystallised payout liability')
  if (evidence.totalLiquidityBefore < 0n || evidence.lockedJackpotBefore < 0n) throw new Error('economic liquidity values must be non-negative')
  const effectivePoolBefore = evidence.totalLiquidityBefore
    - evidence.pendingLiabilityBefore
    - evidence.unresolvedReserveBefore
    - evidence.lockedJackpotBefore
  if (effectivePoolBefore < 0n) throw new Error('pre-reveal effective pool is already insolvent')
  if (evidence.prizeAmountSubunits > effectivePoolBefore) throw new Error('reveal payout exceeds pre-reveal effective pool')
}

export function revealRefinementAdmissible(evidence: RevealRefinementEvidence): boolean {
  try {
    validateRevealRefinementEvidence(evidence)
    return true
  } catch {
    return false
  }
}