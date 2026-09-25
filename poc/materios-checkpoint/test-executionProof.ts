import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  executionProofPacketId,
  validateMateriosExecutionProofPacket,
  type MateriosExecutionProofPacket,
} from './src/executionProof.ts'

function makePacket(): MateriosExecutionProofPacket {
  return {
    schemaVersion: 'materios-execution-proof-v1',
    chainId: 'materios_preprod_v6',
    genesisHash: '11'.repeat(32),
    blockHash: '22'.repeat(32),
    blockNumber: 1234n,
    stateRoot: '33'.repeat(32),
    runtime: {
      specName: 'materios',
      implName: 'materios',
      specVersion: 42,
      implVersion: 7,
      codeHash: '66'.repeat(32),
    },
    runtimeApiMethod: 'SessionValidatorManagementApi_calculate_committee',
    callDataHex: '0xaabb',
    resultHex: '0xccdd',
    // SCALE-encoded StorageProof transport placeholder.
    proofScaleHex: '0x040801020304',
    sidechainEpoch: 88n,
    cardanoEpochNonceHex: '0x' + '44'.repeat(32),
    genesisUtxoHex: '0xdeadbeef',
    selectionPath: {
      kind: 'normal',
      evidenceHash: '66'.repeat(32),
    },
    authorityCommitment: '55'.repeat(32),
  }
}

test('valid native execution-proof transport envelope passes', () => {
  assert.doesNotThrow(() =>
    validateMateriosExecutionProofPacket(makePacket()),
  )
})

test('packet id is deterministic', () => {
  const packet = makePacket()
  assert.equal(executionProofPacketId(packet), executionProofPacketId(packet))
})

test('block/state binding fields are mandatory', () => {
  const packet = makePacket()

  assert.throws(
    () => validateMateriosExecutionProofPacket({ ...packet, blockHash: 'aa' }),
    /blockHash must be 32-byte hex/,
  )

  assert.throws(
    () => validateMateriosExecutionProofPacket({ ...packet, stateRoot: 'bb' }),
    /stateRoot must be 32-byte hex/,
  )
})

test('runtime identity fields fail closed', () => {
  const packet = makePacket()

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        runtime: { ...packet.runtime, specName: '' },
      }),
    /runtime.specName is required/,
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        runtime: { ...packet.runtime, specVersion: -1 },
      }),
    /runtime.specVersion must be a safe non-negative integer/,
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        runtime: { ...packet.runtime, codeHash: 'aa' },
      }),
    /runtime.codeHash must be 32-byte hex/,
  )
})

test('execution payload and SCALE proof bytes must be valid hex', () => {
  const packet = makePacket()

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        callDataHex: 'not-hex',
      }),
    /callDataHex must be 0x-prefixed hex/,
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        proofScaleHex: 'not-hex',
      }),
    /proofScaleHex must be 0x-prefixed hex/,
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        proofScaleHex: '0x',
      }),
    /proofScaleHex must not be empty/,
  )
})

test('selection context fails closed on malformed epoch/genesis data', () => {
  const packet = makePacket()

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        sidechainEpoch: -1n,
      }),
    /sidechainEpoch must be non-negative/,
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        cardanoEpochNonceHex: '0x',
      }),
    /cardanoEpochNonceHex must not be empty/,
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        selectionPath: {
          kind: 'other' as 'normal',
          evidenceHash: '66'.repeat(32),
        },
      }),
    /selectionPath must be pinned or normal/,
  )
})

test('pinned authority-selection regime cannot be expired', () => {
  const packet = makePacket()

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        selectionPath: {
          kind: 'pinned',
          evidenceHash: '66'.repeat(32),
          untilEpoch: packet.sidechainEpoch - 1n,
        },
      }),
    /selectionPath pinned regime expired/,
  )
})

test('authority-selection regime is part of packet identity', () => {
  const packet = makePacket()
  const id = executionProofPacketId(packet)

  const changedKind = executionProofPacketId({
    ...packet,
    selectionPath: {
      kind: 'pinned',
      evidenceHash: '66'.repeat(32),
      untilEpoch: packet.sidechainEpoch + 10n,
    },
  })

  const changedEvidence = executionProofPacketId({
    ...packet,
    selectionPath: {
      kind: 'normal',
      evidenceHash: '77'.repeat(32),
    },
  })

  assert.notEqual(id, changedKind)
  assert.notEqual(id, changedEvidence)
})

test('mutating bound execution material changes packet identity', () => {
  const packet = makePacket()
  const id = executionProofPacketId(packet)

  const changedResult = executionProofPacketId({
    ...packet,
    resultHex: '0xeeff',
  })
  const changedProof = executionProofPacketId({
    ...packet,
    proofScaleHex: '0x06010203040506',
  })
  const changedBlock = executionProofPacketId({
    ...packet,
    blockNumber: packet.blockNumber + 1n,
  })
  const changedEpoch = executionProofPacketId({
    ...packet,
    sidechainEpoch: packet.sidechainEpoch + 1n,
  })

  assert.notEqual(id, changedResult)
  assert.notEqual(id, changedProof)
  assert.notEqual(id, changedBlock)
  assert.notEqual(id, changedEpoch)
})
