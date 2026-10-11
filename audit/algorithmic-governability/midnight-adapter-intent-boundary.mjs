#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const isDigest = (value) => typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value)

const readRepoFile = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8')

const withoutComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')

const prepare = (intent, admission, circuitName = 'issue') => {
  if (!admission || admission.admitted !== true) return 'UNVERIFIABLE'
  if (admission.actionClass !== intent.action) return 'REJECTED'
  if (typeof admission.decisionReference !== 'string' || !admission.decisionReference.trim()) return 'UNVERIFIABLE'
  if (!isDigest(admission.stateHash) || !isDigest(admission.actionFingerprint)) return 'UNVERIFIABLE'
  if (typeof circuitName !== 'string' || !circuitName.trim()) return 'UNVERIFIABLE'
  return Object.freeze({
    adapter: 'MIDNIGHT',
    intent,
    admissionDecisionReference: admission.decisionReference,
    admissionStateHash: admission.stateHash,
    actionFingerprint: admission.actionFingerprint,
    circuitName,
    publicInputs: Object.freeze({ classId: intent.classId, price: intent.price }),
    privateWitnessRefs: Object.freeze([]),
  })
}

const intent = Object.freeze({ action: 'Issue', classId: 3n, price: 5n })
const admission = Object.freeze({
  admitted: true,
  actionClass: 'Issue',
  decisionReference: 'decision#1',
  stateHash: 'a'.repeat(64),
  actionFingerprint: 'b'.repeat(64),
})

const envelope = prepare(intent, admission)
assert(envelope.adapter === 'MIDNIGHT', 'admitted Intent crosses into Midnight envelope')
assert(envelope.intent === intent, 'Intent identity is preserved')
assert(envelope.admissionDecisionReference === admission.decisionReference, 'admission decision reference is preserved')
assert(envelope.admissionStateHash === admission.stateHash, 'admission state binding is preserved')
assert(envelope.actionFingerprint === admission.actionFingerprint, 'action fingerprint is preserved')
assert(envelope.publicInputs.classId === 3n && envelope.publicInputs.price === 5n, 'Intent coordinates remain explicit')
assert(envelope.privateWitnessRefs.length === 0, 'private witness references remain explicit')
assert(envelope.circuitName === 'issue', 'execution target is explicit')

assert(prepare(intent, undefined) === 'UNVERIFIABLE', 'missing admission fails closed')
assert(
  prepare(Object.freeze({ ...intent, action: 'Reveal' }), admission) === 'REJECTED',
  'Intent/admission action mismatch is rejected',
)
assert(
  prepare(intent, Object.freeze({ ...admission, stateHash: 'not-a-digest' })) === 'UNVERIFIABLE',
  'malformed canonical-state digest fails closed',
)
assert(
  prepare(intent, Object.freeze({ ...admission, actionFingerprint: 'c'.repeat(63) })) === 'UNVERIFIABLE',
  'wrong-length action fingerprint fails closed',
)
assert(
  prepare(intent, Object.freeze({ ...admission, decisionReference: '  ' })) === 'UNVERIFIABLE',
  'blank admission identity fails closed',
)
assert(
  prepare(intent, admission, '  ') === 'UNVERIFIABLE',
  'blank execution target fails closed',
)
assert(
  !('economicAdmission' in envelope),
  'adapter envelope transports admission identity but does not manufacture economic authority',
)

const midnightIntentSource = readRepoFile('Adapter/MIDNIGHT/IntentBoundary.ts')
const midnightEvidenceSource = readRepoFile('Adapter/MIDNIGHT/ExecutionEvidenceBoundary.ts')
const midnightIntentCode = withoutComments(midnightIntentSource)
const midnightEvidenceCode = withoutComments(midnightEvidenceSource)

assert(
  midnightIntentSource.includes('export type ChainNeutralEconomicAdmission'),
  'Midnight adapter exposes a chain-neutral admission type',
)
assert(
  !midnightIntentCode.includes('Adapter/CARDANO') &&
    !midnightEvidenceCode.includes('Adapter/CARDANO'),
  'Midnight adapter code has no direct Cardano runtime import',
)
assert(
  !midnightIntentCode.includes('EconomicAdmissionWitness') &&
    !midnightEvidenceCode.includes('EconomicAdmissionWitness'),
  'Midnight adapter code does not import the Cardano-specific EconomicAdmissionWitness',
)

console.log('ALL MIDNIGHT INTENT ADAPTER BOUNDARY CHECKS PASSED')
