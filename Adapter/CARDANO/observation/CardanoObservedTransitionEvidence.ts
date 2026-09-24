/**
 * Evidence-only record for a real Cardano/Yaci transition.
 *
 * This type deliberately does not call its observed hashes "canonical V3"
 * fingerprints. The laboratory hashes the concrete observed UTxOs/datums
 * before and after a transaction. Canonical V3 state identity remains a
 * separate evidence obligation.
 */
export type CardanoObservedTransitionEvidence = {
  evidenceId: string
  fixtureId: string
  actionClass: string
  environment: string
  preStateObservationFingerprint: string
  postStateObservationFingerprint: string
  actionObservationFingerprint: string
  transactionRef: string
}

function nonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(name + ' must be non-empty')
}

export function validateCardanoObservedTransitionEvidence(
  evidence: CardanoObservedTransitionEvidence,
): void {
  nonEmpty(evidence.evidenceId, 'evidenceId')
  nonEmpty(evidence.fixtureId, 'fixtureId')
  nonEmpty(evidence.actionClass, 'actionClass')
  nonEmpty(evidence.environment, 'environment')
  nonEmpty(evidence.preStateObservationFingerprint, 'preStateObservationFingerprint')
  nonEmpty(evidence.postStateObservationFingerprint, 'postStateObservationFingerprint')
  nonEmpty(evidence.actionObservationFingerprint, 'actionObservationFingerprint')
  nonEmpty(evidence.transactionRef, 'transactionRef')
}

export function assertCardanoObservedTransitionBinding(
  evidence: CardanoObservedTransitionEvidence,
  expected: Omit<CardanoObservedTransitionEvidence, 'evidenceId' | 'fixtureId' | 'environment'>,
): void {
  validateCardanoObservedTransitionEvidence(evidence)

  if (evidence.actionClass !== expected.actionClass) {
    throw new Error('observed Cardano action class mismatch')
  }
  if (evidence.preStateObservationFingerprint !== expected.preStateObservationFingerprint) {
    throw new Error('observed Cardano pre-state fingerprint mismatch')
  }
  if (evidence.postStateObservationFingerprint !== expected.postStateObservationFingerprint) {
    throw new Error('observed Cardano post-state fingerprint mismatch')
  }
  if (evidence.actionObservationFingerprint !== expected.actionObservationFingerprint) {
    throw new Error('observed Cardano action fingerprint mismatch')
  }
  if (evidence.transactionRef !== expected.transactionRef) {
    throw new Error('observed Cardano transaction reference mismatch')
  }
}
