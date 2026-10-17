#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Bitcoin L1 evidence-envelope boundary.
 *
 * Research-only executable boundary. It models only evidence classification:
 * Bitcoin consensus validity is not IMMORTAL economic admission, post-state
 * equivalence, or irreversible finality.
 */

const hex64 = (seed) => String(seed).repeat(64).slice(0, 64)

const envelope = (overrides = {}) => Object.freeze({
  chainIdentity: 'bitcoin-l1-research',
  blockRef: 'block:000001',
  txRef: 'tx:000001',
  inputs: Object.freeze(['input:000001']),
  outputs: Object.freeze(['output:000001']),
  commitmentRef: 'commitment:000001',
  observationStatus: 'INCLUDED',
  confirmationState: 'OBSERVED',
  reorgStatus: 'STABLE',
  sourceReference: 'source:bitcoin-node:001',
  immortalAdmissionReference: 'admission:001',
  expectedPostStateDigest: hex64('a'),
  observedPostStateDigest: hex64('a'),
  ...overrides,
})

const isDigest = (value) => typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value)

const hasText = (value) => typeof value === 'string' && value.trim().length > 0

const classify = (obs) => {
  if (!obs) return 'UNVERIFIABLE'
  if (!hasText(obs.sourceReference) || !hasText(obs.txRef) || !hasText(obs.blockRef)) return 'UNVERIFIABLE'
  if (!isDigest(obs.expectedPostStateDigest) || !isDigest(obs.observedPostStateDigest)) return 'UNVERIFIABLE'
  // The research state machine declares PENDING / INCLUDED / ACCEPTED and
  // the envelope currently models STABLE / REORGED. Unknown labels fail closed.
  if (!['PENDING', 'INCLUDED', 'ACCEPTED'].includes(obs.observationStatus)) return 'UNVERIFIABLE'
  if (!['STABLE', 'REORGED'].includes(obs.reorgStatus)) return 'UNVERIFIABLE'
  if (!['OBSERVED', 'FINALITY_POLICY_SATISFIED'].includes(obs.confirmationState)) return 'UNVERIFIABLE'
  if (obs.observationStatus === 'PENDING') return 'UNVERIFIABLE'
  if (obs.reorgStatus === 'REORGED') return 'INVALIDATED'
  if (obs.observationStatus === 'INCLUDED' && !obs.immortalAdmissionReference) {
    return 'REJECTED_FOR_IMMORTAL_EXECUTION'
  }
  if (obs.observedPostStateDigest !== obs.expectedPostStateDigest) {
    return 'REJECTED_POST_STATE_MISMATCH'
  }
  if (obs.observationStatus === 'ACCEPTED' && obs.confirmationState !== 'FINALITY_POLICY_SATISFIED') {
    return 'REJECTED_FINALITY_UNSATISFIED'
  }
  if (obs.observationStatus === 'ACCEPTED' && obs.reorgStatus !== 'STABLE') {
    return 'INVALIDATED'
  }
  return 'ADMISSIBLE_OBSERVATION'
}

assert(
  classify(envelope()) === 'ADMISSIBLE_OBSERVATION',
  'complete Bitcoin evidence envelope is admissible as an observation',
)

assert(
  classify(envelope({ immortalAdmissionReference: '' })) === 'REJECTED_FOR_IMMORTAL_EXECUTION',
  'Bitcoin consensus-valid observation without IMMORTAL admission cannot close execution evidence',
)

assert(
  classify(envelope({ observedPostStateDigest: hex64('b') })) === 'REJECTED_POST_STATE_MISMATCH',
  'confirmed Bitcoin inclusion with mismatched IMMORTAL post-state is rejected',
)

assert(
  classify(envelope({
    observationStatus: 'ACCEPTED',
    confirmationState: 'FINALITY_POLICY_SATISFIED',
    reorgStatus: 'REORGED',
  })) === 'INVALIDATED',
  'reorg invalidates a previously accepted Bitcoin observation',
)

assert(
  classify(envelope({
    observationStatus: 'ACCEPTED',
    confirmationState: 'OBSERVED',
  })) === 'REJECTED_FINALITY_UNSATISFIED',
  'accepted Bitcoin observation requires the already-declared finality policy evidence',
)

assert(
  classify(envelope({ sourceReference: '' })) === 'UNVERIFIABLE',
  'missing Bitcoin observation provenance fails closed',
)

assert(
  classify(envelope({ sourceReference: '   ' })) === 'UNVERIFIABLE',
  'blank Bitcoin observation provenance fails closed',
)

assert(
  classify(envelope({ txRef: null })) === 'UNVERIFIABLE',
  'non-string transaction reference fails closed',
)

assert(
  classify(envelope({ expectedPostStateDigest: undefined, observedPostStateDigest: undefined })) === 'UNVERIFIABLE',
  'missing expected and observed post-state digests cannot compare equal by absence',
)

assert(
  classify(envelope({ observedPostStateDigest: 'not-a-digest' })) === 'UNVERIFIABLE',
  'malformed observed post-state digest fails closed',
)

assert(
  classify(envelope({ observationStatus: 'UNKNOWN' })) === 'UNVERIFIABLE',
  'unknown observation status cannot be promoted to an admissible observation',
)

assert(
  classify(envelope({ observationStatus: 'PENDING' })) === 'UNVERIFIABLE',
  'pending observation cannot be treated as admissible evidence',
)

assert(
  classify(envelope({ reorgStatus: 'MAYBE' })) === 'UNVERIFIABLE',
  'unknown reorg status fails closed',
)

assert(
  classify(envelope({ confirmationState: 'FINAL' })) === 'UNVERIFIABLE',
  'undeclared confirmation state cannot satisfy the finality boundary',
)

console.log('ALL BITCOIN L1 EVIDENCE ENVELOPE BOUNDARY CHECKS PASSED')
