/**
 * Evidence-layer bridge between EconomicAdmissionWitness and the canonical
 * transition evidence record.
 *
 * This module does not compute economic truth or fingerprints. It only proves
 * that a persisted transition-evidence packet carries the same action,
 * canonical pre-state and candidate post-state identifiers that were
 * presented to the economic submission boundary.
 */
import type { EconomicAdmissionWitness } from '../runtime/EconomicAdmission'
import {
  validateCanonicalTransitionEvidence,
  type CanonicalTransitionEvidence,
} from './CanonicalTransitionEvidence'

export function assertEconomicAdmissionMatchesCanonicalEvidence(
  admission: EconomicAdmissionWitness,
  evidence: CanonicalTransitionEvidence,
): void {
  validateCanonicalTransitionEvidence(evidence)

  if (admission.actionClass !== evidence.actionClass) {
    throw new Error('economic admission action does not match canonical evidence')
  }
  if (admission.stateHash !== evidence.preStateFingerprint) {
    throw new Error('economic admission pre-state hash does not match canonical evidence')
  }
  if (admission.postStateHash !== evidence.postStateFingerprint) {
    throw new Error('economic admission post-state hash does not match canonical evidence')
  }
}
