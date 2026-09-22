/**
 * Runtime witness crossing the economic-gate boundary into an economic
 * Cardano submission.
 *
 * The adapter does not calculate EEV, ProtectedCapital, viability or Ω.
 * Those values belong to the authoritative economic/profile layer.
 * This witness is deliberately explicit so an economic transaction cannot
 * silently bypass the gate by calling the generic Cardano submitter.
 */
export type EconomicAdmissionWitness = {
  gateVersion: string
  admitted: true
  decisionReference: string
  authoritativeObservationReference: string
  stateHash: string
  eev: bigint
}

export function assertEconomicAdmission(
  witness: EconomicAdmissionWitness | undefined,
): asserts witness is EconomicAdmissionWitness {
  if (!witness || witness.admitted !== true) {
    throw new Error(
      'Economic admission required: economic Cardano submission cannot bypass the Economic Gate',
    )
  }
  if (!witness.gateVersion.trim()) {
    throw new Error('Economic admission gateVersion is required')
  }
  if (!witness.decisionReference.trim()) {
    throw new Error('Economic admission decisionReference is required')
  }
  if (!witness.authoritativeObservationReference.trim()) {
    throw new Error('Economic admission authoritativeObservationReference is required')
  }
  if (!/^[0-9a-fA-F]{64}$/.test(witness.stateHash)) {
    throw new Error('Economic admission stateHash must be a 32-byte hex digest')
  }
  if (witness.eev < 0n) {
    throw new Error('Economic admission EEV must be non-negative')
  }
}
