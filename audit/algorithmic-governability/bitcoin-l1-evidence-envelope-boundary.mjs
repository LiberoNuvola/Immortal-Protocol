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

const classify = (obs) => {
  if (!obs) return 'UNVERIFIABLE'
  if (!obs.sourceReference || !obs.txRef || !obs.blockRef) return 'UNVERIFIABLE'
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

console.log('ALL BITCOIN L1 EVIDENCE ENVELOPE BOUNDARY CHECKS PASSED')
