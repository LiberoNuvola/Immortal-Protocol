/*
 * PRE-RICH expiry policy boundary.
 *
 * The policy belongs to the DApp/profile. IMMORTAL defines the conformance
 * properties, not a universal numeric horizon.
 */

export type PreRichExpiryIssuanceState = {
  /** Identifier/hash of the authoritative issuance-state snapshot. */
  issuanceStateHash: string
  /** Economic epoch/version of the verified issuance observation. */
  economicEpoch: bigint
  currentActiveClass: bigint
  highestClassEverActivated: bigint
  eev: bigint
  unresolvedReserve: bigint
  unresolvedTicketCount: bigint
}

export type PreRichExpiryPolicy = {
  policyId: string
  policyVersion: bigint
  deriveHorizonMs: (state: PreRichExpiryIssuanceState) => bigint
}

export type CrystallizedTicketExpiry = {
  issuedAt: bigint
  expiresAt: bigint
  horizonMs: bigint
  policyId: string
  policyVersion: bigint
  issuanceStateHash: string
}

function validateIssuanceState(state: PreRichExpiryIssuanceState): void {
  if (!state.issuanceStateHash) throw new Error('issuanceStateHash is required')
  if (state.economicEpoch < 0n) throw new Error('economicEpoch must be non-negative')
  if (state.currentActiveClass < 0n) throw new Error('currentActiveClass must be non-negative')
  if (state.highestClassEverActivated < 0n) throw new Error('highestClassEverActivated must be non-negative')
  if (state.eev < 0n) throw new Error('eev must be non-negative')
  if (state.unresolvedReserve < 0n) throw new Error('unresolvedReserve must be non-negative')
  if (state.unresolvedTicketCount < 0n) throw new Error('unresolvedTicketCount must be non-negative')
}

export function crystallizeTicketExpiry(
  policy: PreRichExpiryPolicy,
  state: PreRichExpiryIssuanceState,
  issuedAt: bigint,
): CrystallizedTicketExpiry {
  if (!policy.policyId) throw new Error('expiry policyId is required')
  if (policy.policyVersion < 0n) throw new Error('expiry policyVersion must be non-negative')
  if (issuedAt < 0n) throw new Error('issuedAt must be non-negative')
  validateIssuanceState(state)

  const first = policy.deriveHorizonMs(state)
  const second = policy.deriveHorizonMs(state)

  if (first !== second) {
    throw new Error('expiry policy must be deterministic for a fixed issuance state')
  }
  if (first < 0n) throw new Error('expiry horizon must be non-negative')

  return {
    issuedAt,
    expiresAt: issuedAt + first,
    horizonMs: first,
    policyId: policy.policyId,
    policyVersion: policy.policyVersion,
    issuanceStateHash: state.issuanceStateHash,
  }
}