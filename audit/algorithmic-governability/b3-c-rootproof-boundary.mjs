#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const required = [
  'checkpointRef', 'stateRoot', 'runtimeIdentity', 'storageKey', 'claimedValue',
  'storageProof', 'b3Context', 'finalityEvidence', 'semanticBinding',
]

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const ownData = (record, field) => {
  if (!isRecord(record) || !Object.hasOwn(record, field)) return false
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return !!descriptor && Object.hasOwn(descriptor, 'value')
}

const nonBlank = (value) => typeof value === 'string' && value.trim() !== ''

// Structural/cross-reference checks only; no cryptographic verification occurs here.
const inspectEnvelope = (packet) => {
  if (!isRecord(packet)) return { status: 'UNVERIFIABLE', reason: 'packet is not a plain record' }
  if (!required.every((field) => ownData(packet, field))) {
    return { status: 'UNVERIFIABLE', reason: 'required own data property missing or accessor-backed' }
  }
  if (required.some((field) => !nonBlank(packet[field]))) {
    return { status: 'UNVERIFIABLE', reason: 'required field is blank or not a string' }
  }

  const crossRefs = [
    ['checkpointHash', 'headerCheckpointHash'],
    ['proofRoot', 'stateRoot'],
    ['proofKey', 'storageKey'],
    ['proofValue', 'claimedValue'],
    ['semanticCheckpointRef', 'checkpointRef'],
  ]
  if (!crossRefs.every(([left, right]) => ownData(packet, left) && ownData(packet, right))) {
    return { status: 'UNVERIFIABLE', reason: 'cross-reference field missing or accessor-backed' }
  }
  if (crossRefs.some(([left, right]) => packet[left] !== packet[right])) {
    return { status: 'REJECTED', reason: 'declared cross-reference mismatch' }
  }

  return { status: 'STRUCTURALLY_CONSISTENT', reason: 'authentication not performed by this harness' }
}

const positive = Object.freeze({
  checkpointRef: 'block:1856408',
  checkpointHash: '0xcheckpoint',
  headerCheckpointHash: '0xcheckpoint',
  stateRoot: '0xstateroot',
  runtimeIdentity: 'runtime:v1',
  storageKey: '0xkey',
  claimedValue: '0xvalue',
  storageProof: 'proof:v1',
  proofRoot: '0xstateroot',
  proofKey: '0xkey',
  proofValue: '0xvalue',
  b3Context: 'beacon:v1',
  finalityEvidence: 'grandpa:fixture',
  semanticBinding: 'binding:v1',
  semanticCheckpointRef: 'block:1856408',
})

assert(inspectEnvelope(positive).status === 'STRUCTURALLY_CONSISTENT',
  'consistent fixture is structural-only, never cryptographically accepted')

for (const malformed of [null, undefined, true, 1, 'packet', [], new Date()]) {
  assert(inspectEnvelope(malformed).status === 'UNVERIFIABLE', 'malformed top-level packet is unverifiable')
}
for (const field of required) {
  assert(inspectEnvelope({ ...positive, [field]: '' }).status === 'UNVERIFIABLE',
    'missing/blank ' + field + ' fails closed')
}
for (const [left, right] of [
  ['checkpointHash', 'headerCheckpointHash'],
  ['proofRoot', 'stateRoot'],
  ['proofKey', 'storageKey'],
  ['proofValue', 'claimedValue'],
  ['semanticCheckpointRef', 'checkpointRef'],
]) {
  assert(inspectEnvelope({ ...positive, [left]: 'deliberate-mismatch' }).status === 'REJECTED',
    left + '/' + right + ' mismatch is rejected')
}

const inheritedTopLevel = Object.assign(Object.create({ checkpointRef: positive.checkpointRef }), positive)
delete inheritedTopLevel.checkpointRef
assert(inspectEnvelope(inheritedTopLevel).status === 'UNVERIFIABLE',
  'inherited checkpoint reference cannot satisfy packet contract')

const accessorPacket = { ...positive }
delete accessorPacket.storageProof
Object.defineProperty(accessorPacket, 'storageProof', { enumerable: true, get: () => 'forged-proof' })
assert(inspectEnvelope(accessorPacket).status === 'UNVERIFIABLE',
  'accessor-backed proof material is not treated as supplied evidence')

for (const field of ['storageProof', 'finalityEvidence', 'runtimeIdentity', 'semanticBinding']) {
  assert(inspectEnvelope({ ...positive, [field]: 'fabricated-but-nonblank' }).status === 'STRUCTURALLY_CONSISTENT',
    field + ' content remains unauthenticated by structural checks')
}

console.log('ALL B3-C ROOTPROOF STRUCTURAL BOUNDARY CHECKS PASSED')
console.log('AUTHENTIC ROOTPROOF VERIFICATION REMAINS OPEN: no cryptographic verifier is invoked')
