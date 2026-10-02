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

export const PRE_RICH_EXPIRY_MIN_HORIZON_MS = 2n * 60n * 60n * 1000n
export const PRE_RICH_EXPIRY_MAX_HORIZON_MS = 300n * 24n * 60n * 60n * 1000n

export type PreRichExpiryPolicy = {
  policyId: string
  policyVersion: bigint
  minHorizonMs: bigint
  maxHorizonMs: bigint
  deriveHorizonMs: (state: PreRichExpiryIssuanceState) => bigint
}

export const preRichExpiryPolicyV1: PreRichExpiryPolicy = {
  policyId: 'pre-rich-expiry-v1',
  policyVersion: 1n,
  minHorizonMs: PRE_RICH_EXPIRY_MIN_HORIZON_MS,
  maxHorizonMs: PRE_RICH_EXPIRY_MAX_HORIZON_MS,
  deriveHorizonMs: (state) => {
    if (state.eev === 0n) return PRE_RICH_EXPIRY_MAX_HORIZON_MS
    const protectedLoad =
      state.unresolvedReserve * 1000n / state.eev
    const classPressure =
      state.currentActiveClass > 0n
        ? state.highestClassEverActivated * 1000n / state.currentActiveClass
        : 1000n
    const stress = protectedLoad > classPressure
      ? protectedLoad
      : classPressure
    return PRE_RICH_EXPIRY_MAX_HORIZON_MS * 1000n / (1000n + stress)
  },
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
  if (policy.minHorizonMs < 0n) throw new Error('expiry minimum horizon must be non-negative')
  if (policy.maxHorizonMs < 0n) throw new Error('expiry maximum horizon must be non-negative')
  if (policy.minHorizonMs > policy.maxHorizonMs) throw new Error('expiry minimum horizon cannot exceed maximum horizon')
  if (issuedAt < 0n) throw new Error('issuedAt must be non-negative')
  validateIssuanceState(state)

  const first = policy.deriveHorizonMs(state)
  const second = policy.deriveHorizonMs(state)

  if (first !== second) {
    throw new Error('expiry policy must be deterministic for a fixed issuance state')
  }
  if (first < 0n) throw new Error('expiry horizon must be non-negative')

  const horizonMs =
    first < policy.minHorizonMs
      ? policy.minHorizonMs
      : first > policy.maxHorizonMs
        ? policy.maxHorizonMs
        : first

  return {
    issuedAt,
    expiresAt: issuedAt + horizonMs,
    horizonMs,
    policyId: policy.policyId,
    policyVersion: policy.policyVersion,
    issuanceStateHash: state.issuanceStateHash,
  }
}