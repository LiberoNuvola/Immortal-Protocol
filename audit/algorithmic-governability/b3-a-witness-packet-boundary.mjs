#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

/*
 * B3-A fixture/conformance boundary only.
 * The categories below mirror existing repository evidence contracts:
 * checkpoint/header, authority transition, execution proof and selection
 * commitment. This harness does not verify cryptography or claim a real
 * Materios witness.
 */
const requiredPacketFields = [
  'checkpoint',
  'authorityTransition',
  'executionProof',
  'selectionCommitment',
]

const hasPacketShape = (packet) =>
  packet &&
  requiredPacketFields.every((field) =>
    packet[field] !== undefined &&
    packet[field] !== null,
  )

const positive = Object.freeze({
  checkpoint: Object.freeze({
    chainId: 'materios-preprod',
    genesisHash: '32-byte-genesis-hash',
    blockHash: '32-byte-block-hash',
    blockNumber: '1856408',
  }),
  authorityTransition: Object.freeze({
    kind: 'materios-authority-set-transition',
    protocolVersion: 1,
    fromSetId: '7',
    toSetId: '8',
    activationBlock: Object.freeze({
      hash: '32-byte-block-hash',
      number: '1856408',
    }),
    selectionInputsHash: '32-byte-selection-hash',
    proofSystem: 'native-proof-system',
    proofBytes: 'proof-bytes',
  }),
  executionProof: Object.freeze({
    version: 1,
    chainId: 'materios-preprod',
    blockHash: '32-byte-block-hash',
    method: 'SessionValidatorManagementApi_calculate_committee',
    proofSystem: 'native-proof-system',
    proofBytes: 'execution-proof',
  }),
  selectionCommitment: Object.freeze({
    blockHash: '32-byte-block-hash',
    blockNumber: '1856408',
    selectionInputsHash: '32-byte-selection-hash',
  }),
})

assert(hasPacketShape(positive), 'B3-A evidence packet contains all existing boundary categories')

for (const field of requiredPacketFields) {
  const missing = { ...positive }
  delete missing[field]
  assert(!hasPacketShape(missing), 'missing ' + field + ' blocks B3-A evidence crossing')
}

assert(
  positive.authorityTransition.activationBlock.hash === positive.checkpoint.blockHash,
  'authority-transition activation block is explicitly bound to checkpoint hash',
)
assert(
  positive.authorityTransition.activationBlock.number === positive.checkpoint.blockNumber,
  'authority-transition activation block is explicitly bound to checkpoint number',
)
assert(
  positive.selectionCommitment.blockHash === positive.checkpoint.blockHash &&
    positive.selectionCommitment.blockNumber === positive.checkpoint.blockNumber &&
    positive.selectionCommitment.selectionInputsHash === positive.authorityTransition.selectionInputsHash,
  'selection commitment is bound to the same checkpoint and selection-input hash',
)
assert(
  positive.executionProof.chainId === positive.checkpoint.chainId &&
    positive.executionProof.blockHash === positive.checkpoint.blockHash &&
    positive.executionProof.proofSystem === positive.authorityTransition.proofSystem,
  'execution proof is explicitly bound to checkpoint identity and proof-system identity',
)

console.log('ALL B3-A WITNESS PACKET BOUNDARY CHECKS PASSED')
