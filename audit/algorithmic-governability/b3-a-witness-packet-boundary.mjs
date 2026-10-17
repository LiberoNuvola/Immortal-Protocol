#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

/*
 * B3-A fixture/conformance boundary only.
 * This harness checks packet shape and declared cross-field correspondence.
 * It does not verify cryptography or establish a real Materios witness.
 */
const requiredPacketFields = [
  'checkpoint',
  'authorityTransition',
  'executionProof',
  'selectionCommitment',
]

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasOwn = (value, field) => Object.hasOwn(value, field)

const hasPacketShape = (packet) => {
  if (!isRecord(packet)) return false
  if (!requiredPacketFields.every((field) => hasOwn(packet, field) && isRecord(packet[field]))) return false

  const { checkpoint, authorityTransition, executionProof, selectionCommitment } = packet

  // Required fields are own data properties: inherited values and accessors
  // are not accepted as evidence supplied by the packet.
  const requiredOwnFields = {
    checkpoint: ['chainId', 'genesisHash', 'blockHash', 'blockNumber'],
    authorityTransition: [
      'kind', 'protocolVersion', 'fromSetId', 'toSetId', 'activationBlock',
      'selectionInputsHash', 'proofSystem', 'proofBytes',
    ],
    executionProof: ['version', 'chainId', 'blockHash', 'method', 'proofSystem', 'proofBytes'],
    selectionCommitment: ['blockHash', 'blockNumber', 'selectionInputsHash'],
  }

  for (const [field, required] of Object.entries(requiredOwnFields)) {
    const record = packet[field]
    if (!required.every((name) => hasOwn(record, name))) return false
    if (required.some((name) => {
      const descriptor = Object.getOwnPropertyDescriptor(record, name)
      return !descriptor || !hasOwn(descriptor, 'value')
    })) return false
  }

  if (!isRecord(authorityTransition.activationBlock)) return false
  if (!hasOwn(authorityTransition, 'activationBlock')) return false
  for (const name of ['hash', 'number']) {
    const descriptor = Object.getOwnPropertyDescriptor(authorityTransition.activationBlock, name)
    if (!descriptor || !hasOwn(authorityTransition.activationBlock, name) || !hasOwn(descriptor, 'value')) return false
  }

  // Scalar values must be present and typed; avoid nulls, blanks and coercion.
  const nonBlankStrings = [
    checkpoint.chainId, checkpoint.genesisHash, checkpoint.blockHash, checkpoint.blockNumber,
    authorityTransition.kind, authorityTransition.fromSetId, authorityTransition.toSetId,
    authorityTransition.selectionInputsHash, authorityTransition.proofSystem, authorityTransition.proofBytes,
    authorityTransition.activationBlock.hash, authorityTransition.activationBlock.number,
    executionProof.chainId, executionProof.blockHash, executionProof.method,
    executionProof.proofSystem, executionProof.proofBytes,
    selectionCommitment.blockHash, selectionCommitment.blockNumber, selectionCommitment.selectionInputsHash,
  ]
  if (!nonBlankStrings.every((value) => typeof value === 'string' && value.trim() !== '')) return false
  if (!Number.isSafeInteger(authorityTransition.protocolVersion) || authorityTransition.protocolVersion < 1) return false
  if (!Number.isSafeInteger(executionProof.version) || executionProof.version < 1) return false

  return true
}

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

assert(hasPacketShape(positive), 'B3-A packet with all own typed fields is shape-valid')

for (const malformed of [null, undefined, true, 1, 'packet', [], new Date()]) {
  assert(!hasPacketShape(malformed), 'malformed top-level packet container is rejected')
}
for (const field of requiredPacketFields) {
  const missing = { ...positive }
  delete missing[field]
  assert(!hasPacketShape(missing), 'missing ' + field + ' blocks B3-A evidence crossing')

  const inherited = Object.create({ [field]: positive[field] })
  for (const ownField of requiredPacketFields.filter((name) => name !== field)) {
    Object.defineProperty(inherited, ownField, { value: positive[ownField], enumerable: true })
  }
  assert(!hasPacketShape(inherited), 'inherited ' + field + ' cannot satisfy packet field requirement')
}

const packetWithInheritedCheckpointField = Object.assign(Object.create({ chainId: positive.checkpoint.chainId }), {
  ...positive.checkpoint,
})
delete packetWithInheritedCheckpointField.chainId
assert(!hasPacketShape({ ...positive, checkpoint: packetWithInheritedCheckpointField }),
  'inherited checkpoint chain identity cannot satisfy required own field')

const dateCheckpoint = Object.assign(new Date(), positive.checkpoint)
assert(!hasPacketShape({ ...positive, checkpoint: dateCheckpoint }),
  'Date checkpoint with forged fields is not accepted as a plain record')

for (const field of ['checkpoint', 'authorityTransition', 'executionProof', 'selectionCommitment']) {
  for (const malformed of [[], new Date(), null]) {
    assert(!hasPacketShape({ ...positive, [field]: malformed }),
      field + ' non-record container is rejected')
  }
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

for (const mutation of [
  (p) => { p.checkpoint.chainId = '' },
  (p) => { p.checkpoint.blockNumber = '   ' },
  (p) => { p.authorityTransition.protocolVersion = 0 },
  (p) => { p.authorityTransition.fromSetId = '' },
  (p) => { p.executionProof.version = -1 },
  (p) => { p.executionProof.method = '' },
  (p) => { p.selectionCommitment.selectionInputsHash = '' },
]) {
  const copy = structuredClone(positive)
  mutation(copy)
  assert(!hasPacketShape(copy), 'blank or invalid typed evidence field is rejected')
}

console.log('ALL B3-A WITNESS PACKET BOUNDARY CHECKS PASSED')
