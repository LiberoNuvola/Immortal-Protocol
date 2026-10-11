#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const required = [
  'checkpointRef',
  'stateRoot',
  'runtimeIdentity',
  'storageKey',
  'claimedValue',
  'storageProof',
  'b3Context',
  'finalityEvidence',
  'semanticBinding',
]

const verifyEnvelope = (packet) => {
  if (!packet) return 'UNVERIFIABLE'
  if (required.some((field) => packet[field] == null || packet[field] === '')) return 'UNVERIFIABLE'
  if (packet.checkpointHash !== packet.headerCheckpointHash) return 'REJECTED'
  if (packet.proofRoot !== packet.stateRoot) return 'REJECTED'
  if (packet.proofKey !== packet.storageKey) return 'REJECTED'
  if (packet.proofValue !== packet.claimedValue) return 'REJECTED'
  if (packet.semanticCheckpointRef !== packet.checkpointRef) return 'REJECTED'
  return 'ACCEPT'
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

assert(verifyEnvelope(positive) === 'ACCEPT', 'internally consistent RootProof envelope is accepted')

for (const field of required) {
  const missing = { ...positive, [field]: '' }
  assert(verifyEnvelope(missing) === 'UNVERIFIABLE', 'missing ' + field + ' fails closed')
}

assert(
  verifyEnvelope({ ...positive, checkpointHash: '0xother' }) === 'REJECTED',
  'checkpoint/header mismatch is rejected',
)
assert(
  verifyEnvelope({ ...positive, proofRoot: '0xother' }) === 'REJECTED',
  'storage proof root mismatch is rejected',
)
assert(
  verifyEnvelope({ ...positive, proofKey: '0xother' }) === 'REJECTED',
  'storage key mismatch is rejected',
)
assert(
  verifyEnvelope({ ...positive, proofValue: '0xother' }) === 'REJECTED',
  'storage value mismatch is rejected',
)
assert(
  verifyEnvelope({ ...positive, semanticCheckpointRef: 'block:other' }) === 'REJECTED',
  'semantic checkpoint binding mismatch is rejected',
)

console.log('ALL B3-C ROOTPROOF BOUNDARY CHECKS PASSED')
