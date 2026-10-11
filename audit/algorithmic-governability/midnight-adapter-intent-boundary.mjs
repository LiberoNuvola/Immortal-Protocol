#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const prepare = (intent, admission) => {
  if (!admission || admission.admitted !== true) return 'UNVERIFIABLE'
  if (admission.actionClass !== intent.action) return 'REJECTED'
  if (!admission.decisionReference || !admission.stateHash || !admission.actionFingerprint) return 'UNVERIFIABLE'
  return Object.freeze({
    adapter: 'MIDNIGHT',
    intent,
    admissionDecisionReference: admission.decisionReference,
    admissionStateHash: admission.stateHash,
    actionFingerprint: admission.actionFingerprint,
    publicInputs: Object.freeze({ classId: intent.classId, price: intent.price }),
    privateWitnessRefs: Object.freeze([]),
  })
}

const intent = Object.freeze({ action: 'Issue', classId: 3n, price: 5n })
const admission = Object.freeze({
  admitted: true,
  actionClass: 'Issue',
  decisionReference: 'decision#1',
  stateHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  actionFingerprint: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
})

const envelope = prepare(intent, admission)
assert(envelope.adapter === 'MIDNIGHT', 'Intent crosses into Midnight envelope')
assert(envelope.intent === intent, 'Intent identity is preserved')
assert(envelope.admissionDecisionReference === admission.decisionReference, 'admission decision reference is preserved')
assert(envelope.admissionStateHash === admission.stateHash, 'admission state binding is preserved')
assert(envelope.actionFingerprint === admission.actionFingerprint, 'action fingerprint is preserved')
assert(envelope.publicInputs.classId === 3n && envelope.publicInputs.price === 5n, 'Intent coordinates remain explicit')
assert(envelope.privateWitnessRefs.length === 0, 'private witness references remain explicit')

assert(prepare(intent, undefined) === 'UNVERIFIABLE', 'missing admission fails closed')
assert(
  prepare(Object.freeze({ ...intent, action: 'Reveal' }), admission) === 'REJECTED',
  'Intent/admission action mismatch is rejected',
)

console.log('ALL MIDNIGHT INTENT ADAPTER BOUNDARY CHECKS PASSED')