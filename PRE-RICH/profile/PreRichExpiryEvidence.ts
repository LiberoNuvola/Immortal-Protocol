/**
 * PRE-RICH ticket-level expiry refinement evidence.
 *
 * This module does not choose an expiry duration. It only proves the
 * lifecycle boundary for an already-crystallized issued ticket.
 */

export type TicketExpiryEvidence = {
  ticketId: string
  issuedAt: bigint
  expiresAt: bigint
}

export function validateTicketExpiryEvidence(
  evidence: TicketExpiryEvidence,
): void {
  if (!evidence.ticketId) throw new Error('ticketId is required')
  if (evidence.issuedAt < 0n) throw new Error('issuedAt must be non-negative')
  if (evidence.expiresAt < 0n) throw new Error('expiresAt must be non-negative')
  if (evidence.expiresAt < evidence.issuedAt) {
    throw new Error('expiresAt must not precede issuedAt')
  }
}

/** Reveal/claim eligibility: validity interval upper bound must not exceed expiresAt. */
export function validBeforeExpiry(
  validityUpperBound: bigint,
  evidence: TicketExpiryEvidence,
): boolean {
  validateTicketExpiryEvidence(evidence)
  return validityUpperBound <= evidence.expiresAt
}

/** Expiry eligibility: validity interval lower bound must reach expiresAt. */
export function expiredAtOrAfter(
  validityLowerBound: bigint,
  evidence: TicketExpiryEvidence,
): boolean {
  validateTicketExpiryEvidence(evidence)
  return validityLowerBound >= evidence.expiresAt
}

/**
 * Terminal property used by the economic refinement: once expiry is reached,
 * a late reveal cannot reopen claimability.
 */
export function lateRevealEconomicEffect(
  validityUpperBound: bigint,
  evidence: TicketExpiryEvidence,
): bigint {
  validateTicketExpiryEvidence(evidence)
  return validityUpperBound > evidence.expiresAt ? 0n : 1n
}