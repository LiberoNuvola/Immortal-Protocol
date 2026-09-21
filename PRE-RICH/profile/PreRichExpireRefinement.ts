/**
 * PRE-RICH ticket-level refinement for the aggregate V3 Expire action.
 *
 * V3 currently exposes Expire as a class-level aggregate action. Cardano
 * expiry is ticket-level because each PrizeDatum carries its own expiresAt.
 * This module supplies the missing refinement witness; it does not rewrite
 * V3 or grant authority to an off-chain caller.
 */

export type ExpireRefinementEvidence = {
  ticketId: string
  ticketClass: number
  ticketPriceUsdm: bigint
  ticketIssuedAt: bigint
  ticketExpiresAt: bigint
  unresolvedBefore: bigint
  unresolvedAfter: bigint
  unresolvedReserveBefore: bigint
  unresolvedReserveAfter: bigint
}

export function validateExpireRefinementEvidence(
  evidence: ExpireRefinementEvidence,
  canonicalPriceUsdm: bigint,
  atTime: bigint,
): void {
  if (!evidence.ticketId) throw new Error('ticketId is required')
  if (!Number.isInteger(evidence.ticketClass) || evidence.ticketClass < 0) {
    throw new Error('ticketClass must be a non-negative integer')
  }
  if (canonicalPriceUsdm <= 0n) throw new Error('canonical ticket price must be positive')
  if (evidence.ticketPriceUsdm !== canonicalPriceUsdm) {
    throw new Error('ticket price does not match canonical class price')
  }
  if (evidence.ticketIssuedAt < 0n || evidence.ticketExpiresAt < 0n) {
    throw new Error('ticket timestamps must be non-negative')
  }
  if (evidence.ticketExpiresAt < evidence.ticketIssuedAt) {
    throw new Error('ticket expiry precedes issuance')
  }
  if (atTime < evidence.ticketExpiresAt) {
    throw new Error('ticket is not yet expired')
  }
  if (evidence.unresolvedBefore <= 0n || evidence.unresolvedAfter < 0n) {
    throw new Error('invalid unresolved ticket counts')
  }
  if (evidence.unresolvedAfter !== evidence.unresolvedBefore - 1n) {
    throw new Error('expire must consume exactly one unresolved ticket')
  }
  if (evidence.unresolvedReserveBefore < canonicalPriceUsdm) {
    throw new Error('unresolved reserve is insufficient for ticket release')
  }
  if (evidence.unresolvedReserveAfter !== evidence.unresolvedReserveBefore - canonicalPriceUsdm) {
    throw new Error('expire must release exactly the ticket price reserve')
  }
}

export function refinesAggregateExpire(
  evidence: ExpireRefinementEvidence,
  aggregateClass: number,
  canonicalPriceUsdm: bigint,
  atTime: bigint,
): boolean {
  try {
    validateExpireRefinementEvidence(evidence, canonicalPriceUsdm, atTime)
    return evidence.ticketClass === aggregateClass
  } catch {
    return false
  }
}