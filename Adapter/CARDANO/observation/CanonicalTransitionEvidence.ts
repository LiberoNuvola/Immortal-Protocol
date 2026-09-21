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

export type CanonicalTransitionBinding = {
  actionFingerprint: string
  preStateFingerprint: string
  postStateFingerprint: string
  transactionRef: string
}

export function assertCanonicalTransitionBinding(
  evidence: CanonicalTransitionEvidence,
  expected: CanonicalTransitionBinding,
): void {
  validateCanonicalTransitionEvidence(evidence)
  if (evidence.actionFingerprint !== expected.actionFingerprint) {
    throw new Error('canonical action fingerprint mismatch')
  }
  if (evidence.preStateFingerprint !== expected.preStateFingerprint) {
    throw new Error('canonical pre-state fingerprint mismatch')
  }
  if (evidence.postStateFingerprint !== expected.postStateFingerprint) {
    throw new Error('canonical post-state fingerprint mismatch')
  }
  if (evidence.transactionRef !== expected.transactionRef) {
    throw new Error('settlement transaction reference mismatch')
  }
}

export function assertUniqueCanonicalTransitionRealizations(
  evidence: CanonicalTransitionEvidence[],
): void {
  const evidenceIds = new Set<string>()
  const transactionRefs = new Set<string>()

  for (const item of evidence) {
    validateCanonicalTransitionEvidence(item)
    if (evidenceIds.has(item.evidenceId)) {
      throw new Error('duplicate canonical evidence ID')
    }
    if (transactionRefs.has(item.transactionRef)) {
      throw new Error('duplicate settlement transaction reference')
    }
    evidenceIds.add(item.evidenceId)
    transactionRefs.add(item.transactionRef)
  }
}
