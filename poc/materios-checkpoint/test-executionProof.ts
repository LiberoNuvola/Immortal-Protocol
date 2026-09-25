import { strict as assert } from 'node:assert'
import { blake2b } from '@noble/hashes/blake2.js'
import { test } from 'node:test'
import {
  executionProofPacketId,
  validateMateriosExecutionProofPacket,
  verifyRuntimeCodeBinding,
  verifyOnChainSelectionInputsCommitment,
  type MateriosExecutionProofPacket,
} from './src/executionProof.ts'

function makePacket(): MateriosExecutionProofPacket {
  const authoritySelectionInputsHex = '0x01020304'
  const selectionInputsHash = Buffer.from(blake2b(Buffer.from(authoritySelectionInputsHex.slice(2), 'hex'), { dkLen: 32 })).toString('hex')

  return {
    schemaVersion: 'materios-execution-proof-v2',
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
    authoritySelectionInputsHex,
    selectionInputsHash,
    callDataHex: '0x010203045800000000000000',
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

test('epoch nonce accepts the upstream 64-byte bound', () => {
  const packet = makePacket()
  const nonce = '0x' + 'aa'.repeat(64)

  assert.doesNotThrow(() =>
    validateMateriosExecutionProofPacket({
      ...packet,
      cardanoEpochNonceHex: nonce,
    }),
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        cardanoEpochNonceHex: '0x' + 'aa'.repeat(65),
      }),
    /cardanoEpochNonceHex exceeds 64-byte maximum/,
  )
})

test('byte-oriented hex fields reject odd-length payloads', () => {
  const packet = makePacket()

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        resultHex: '0xabc',
      }),
    /resultHex must contain whole bytes/,
  )

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        proofScaleHex: '0xabc',
      }),
    /proofScaleHex must contain whole bytes/,
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


test('call data is exactly bound to selection inputs and sidechain epoch', () => {
  const packet = makePacket()
  assert.doesNotThrow(() => validateMateriosExecutionProofPacket(packet))

  assert.throws(
    () =>
      validateMateriosExecutionProofPacket({
        ...packet,
        callDataHex: '0x010203045900000000000000',
      }),
    /callDataHex does not match authoritySelectionInputsHex \+ sidechainEpoch/,
  )
})

test('selection inputs are cryptographically bound to the declared on-chain hash', () => {
  const packet = makePacket()
  assert.doesNotThrow(() => validateMateriosExecutionProofPacket(packet))
  assert.throws(
    () => validateMateriosExecutionProofPacket({ ...packet, selectionInputsHash: '77'.repeat(32) }),
    /selectionInputsHash does not match authoritySelectionInputsHex/,
  )

  const changedInput = { ...packet, authoritySelectionInputsHex: '0x01020305' }
  assert.throws(
    () => validateMateriosExecutionProofPacket(changedInput),
    /selectionInputsHash does not match authoritySelectionInputsHex/,
  )
})

test('packet selection-input hash must equal the extracted on-chain commitment', () => {
  const packet = makePacket()

  assert.doesNotThrow(() =>
    verifyOnChainSelectionInputsCommitment(packet, packet.selectionInputsHash),
  )

  assert.throws(
    () =>
      verifyOnChainSelectionInputsCommitment(
        packet,
        '77'.repeat(32),
      ),
    /selectionInputsHash does not match on-chain commitment/,
  )
})

test('declared runtime code hash binds to the exact captured WASM bytes', async () => {
  const packet = makePacket()
  const { blake2b } = await import('@noble/hashes/blake2.js')
  const code = new Uint8Array([0x00, 0x61, 0x73, 0x6d])
  const codeHash = Buffer.from(blake2b(code, { dkLen: 32 })).toString('hex')

  const bound = {
    ...packet,
    runtime: { ...packet.runtime, codeHash },
  }
  assert.doesNotThrow(() =>
    verifyRuntimeCodeBinding(bound, '0x0061736d'),
  )
  assert.throws(
    () => verifyRuntimeCodeBinding(bound, '0x0061736e'),
    /runtime.codeHash does not match captured runtime WASM/,
  )
})
