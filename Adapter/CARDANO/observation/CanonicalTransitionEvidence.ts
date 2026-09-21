/**
 * Evidence-only binding for a single economically material transition.
 *
 * This is not an economic authority and does not validate the transition
 * itself. It binds the canonical action, pre/post state fingerprints and the
 * concrete settlement transaction into one auditable evidence record.
 */
export type CanonicalTransitionEvidence = {
  evidenceId: string
  fixtureId: string
  actionClass: string
  protocolVersion: string
  profileVersion: string
  adapterId: string
  adapterVersion: string
  environment: string
  preStateFingerprint: string
  postStateFingerprint: string
  actionFingerprint: string
  transactionRef: string
}

function nonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(name + ' must be non-empty')
}

export function validateCanonicalTransitionEvidence(
  evidence: CanonicalTransitionEvidence,
): void {
  nonEmpty(evidence.evidenceId, 'evidenceId')
  nonEmpty(evidence.fixtureId, 'fixtureId')
  nonEmpty(evidence.actionClass, 'actionClass')
  nonEmpty(evidence.protocolVersion, 'protocolVersion')
  nonEmpty(evidence.profileVersion, 'profileVersion')
  nonEmpty(evidence.adapterId, 'adapterId')
  nonEmpty(evidence.adapterVersion, 'adapterVersion')
  nonEmpty(evidence.environment, 'environment')
  nonEmpty(evidence.preStateFingerprint, 'preStateFingerprint')
  nonEmpty(evidence.postStateFingerprint, 'postStateFingerprint')
  nonEmpty(evidence.actionFingerprint, 'actionFingerprint')
  nonEmpty(evidence.transactionRef, 'transactionRef')
}

export function acceptCanonicalTransitionEvidence(
  evidence: CanonicalTransitionEvidence,
): { ok: true; evidence: CanonicalTransitionEvidence } | { ok: false; reason: string } {
  try {
    validateCanonicalTransitionEvidence(evidence)
    return { ok: true, evidence }
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'invalid canonical transition evidence',
    }
  }
}
