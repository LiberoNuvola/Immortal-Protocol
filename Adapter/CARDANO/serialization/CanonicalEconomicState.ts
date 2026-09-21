/**
 * Chain-neutral economic state carried across the Cardano Adapter boundary.
 *
 * This module deliberately contains no PRE-RICH ticket ladder, payout table,
 * Jackpot lifecycle, class activation, or application-specific policy. Those
 * values must be resolved before crossing into the generic Adapter boundary.
 */
export type CanonicalEconomicState = {
  crystallizedLiabilities: bigint
  unresolvedReserve: bigint
  unresolvedTicketCount: bigint
  worstCaseExposure: bigint
  safetyCapital: bigint
  reserveProtection: bigint
  mandatoryFutureCosts: bigint
  additionalProtectedCapital: bigint
}

function nonNegative(n: bigint, name: string): void {
  if (n < 0n) throw new Error(`${name} must be non-negative`)
}

/**
 * Validate only universal economic shape/integrity constraints.
 *
 * Application-specific decomposition (ticket classes, prices, Jackpot state,
 * activation state, payout tables) is intentionally outside this Adapter API.
 */
export function validateCanonicalEconomicState(
  s: CanonicalEconomicState,
): void {
  nonNegative(s.crystallizedLiabilities, "crystallizedLiabilities")
  nonNegative(s.unresolvedReserve, "unresolvedReserve")
  nonNegative(s.unresolvedTicketCount, "unresolvedTicketCount")
  nonNegative(s.worstCaseExposure, "worstCaseExposure")
  nonNegative(s.safetyCapital, "safetyCapital")
  nonNegative(s.reserveProtection, "reserveProtection")
  nonNegative(s.mandatoryFutureCosts, "mandatoryFutureCosts")
  nonNegative(s.additionalProtectedCapital, "additionalProtectedCapital")
}