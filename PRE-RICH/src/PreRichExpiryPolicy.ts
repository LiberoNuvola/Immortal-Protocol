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
    /*
     * V1 intentionally uses the declared maximum as the neutral temporal
     * reference. Economic state modulates the horizon through a dimensionless
     * reserve-pressure ratio; no hidden temporal constants are introduced.
     */
    if (state.eev <= 0n) return PRE_RICH_EXPIRY_MAX_HORIZON_MS
    const reservePressure = state.unresolvedReserve * 100n / state.eev
    return PRE_RICH_EXPIRY_MAX_HORIZON_MS / (1n + reservePressure)
  },
}


export type CardanoIssueTimeConversion = {
  unixTimeToSlot: (unixTimeMs: number) => number
  slotToUnixTime: (slot: number) => number
}

export type CardanoIssueTimeAnchor = {
  validityStartSlot: number
  issuedAt: bigint
}

/**
 * Select a conservative issuance floor from the exact Lucid slot conversion.
 * The returned time is the beginning of the selected slot, and the caller
 * must put that same slot in the transaction validity-start interval.
 */
export function deriveCardanoIssueTimeAnchor(
  candidateNowMs: bigint,
  validityUpperBoundSlot: number,
  conversion: CardanoIssueTimeConversion,
): CardanoIssueTimeAnchor {
  if (candidateNowMs < 0n || candidateNowMs > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('candidate issue time must be a non-negative safe millisecond value')
  }
  if (!Number.isSafeInteger(validityUpperBoundSlot) || validityUpperBoundSlot < 0) {
    throw new Error('Issue validity upper-bound slot must be a non-negative safe integer')
  }
  const candidateSlot = conversion.unixTimeToSlot(Number(candidateNowMs))
  if (!Number.isSafeInteger(candidateSlot) || candidateSlot < 0) {
    throw new Error('Lucid returned an invalid Issue validity-start slot')
  }
  const issuedAt = conversion.slotToUnixTime(candidateSlot)
  if (!Number.isSafeInteger(issuedAt) || issuedAt < 0) {
    throw new Error('Lucid returned an invalid Issue slot-start time')
  }
  if (conversion.unixTimeToSlot(issuedAt) !== candidateSlot) {
    throw new Error('Lucid Issue slot/time conversion is not reversible at the selected slot')
  }
  // The returned timestamp must be the first millisecond belonging to this
  // slot, not merely any timestamp that maps back to the same slot. Checking
  // the preceding millisecond catches offset conversions that otherwise pass
  // the one-way slot -> time -> slot round trip.
  if (issuedAt > 0) {
    const precedingMillisecondSlot = conversion.unixTimeToSlot(issuedAt - 1)
    if (!Number.isSafeInteger(precedingMillisecondSlot) ||
        precedingMillisecondSlot < 0 ||
        precedingMillisecondSlot >= candidateSlot) {
      throw new Error('Lucid Issue slot/time conversion is not reversible at the selected slot')
    }
  }
  if (BigInt(issuedAt) > candidateNowMs) {
    throw new Error('Issue slot-start time cannot be later than the candidate time')
  }
  if (candidateSlot >= validityUpperBoundSlot) {
    throw new Error('Issue validity-start slot must precede the authenticated validity upper bound')
  }
  return { validityStartSlot: candidateSlot, issuedAt: BigInt(issuedAt) }
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

export function assertExpiryIssuanceStateMatchesAuthoritative(
  supplied: PreRichExpiryIssuanceState,
  authoritative: PreRichExpiryIssuanceState,
): void {
  validateIssuanceState(supplied)
  validateIssuanceState(authoritative)
  const fields: (keyof PreRichExpiryIssuanceState)[] = [
    'issuanceStateHash',
    'economicEpoch',
    'currentActiveClass',
    'highestClassEverActivated',
    'eev',
    'unresolvedReserve',
    'unresolvedTicketCount',
  ]
  for (const field of fields) {
    if (supplied[field] !== authoritative[field]) {
      throw new Error(`expiry issuance state does not match authoritative admission/carrier field: ${field}`)
    }
  }
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