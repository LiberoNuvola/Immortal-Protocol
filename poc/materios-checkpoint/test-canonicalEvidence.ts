import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  canonicalAnchorKey,
  validateCanonicalEvidencePacket,
  type CanonicalEvidencePacket,
} from './src/canonicalEvidence.ts'

function makePacket(): CanonicalEvidencePacket {
  const base = {
    schemaVersion: 'immortal-anchor-v1' as const,
    chainId: 'materios',
    genesisHash: 'aa'.repeat(32),
    blockHash: 'bb'.repeat(32),
    blockNumber: 1234n,
    stateRoot: 'cc'.repeat(32),
    storageKey: '0x01aa',
    authorityCommitment: 'dd'.repeat(32),
  }
  return {
    ...base,
    anchorKey: canonicalAnchorKey(base),
    finalityProof: { kind: 'finality', digest: 'ee'.repeat(32) },
    storageProof: { kind: 'storage', digest: 'ff'.repeat(32) },
    producedAt: '2026-09-21T20:00:00.000Z',
  }
}

test('canonical evidence packet validates its full tuple binding', () => {
  const packet = makePacket()
  assert.doesNotThrow(() => validateCanonicalEvidencePacket(packet))
})

test('changing chain or state-root changes the anchor key', () => {
  const packet = makePacket()
  const changed = { ...packet, chainId: 'other' }
  assert.notEqual(
    packet.anchorKey,
    canonicalAnchorKey({
      schemaVersion: changed.schemaVersion,
      chainId: changed.chainId,
      genesisHash: changed.genesisHash,
      blockHash: changed.blockHash,
      blockNumber: changed.blockNumber,
      stateRoot: changed.stateRoot,
      storageKey: changed.storageKey,
      authorityCommitment: changed.authorityCommitment,
    }),
  )
})

test('anchor-key mutation fails closed', () => {
  const packet = makePacket()
  assert.throws(
    () => validateCanonicalEvidencePacket({ ...packet, anchorKey: '00'.repeat(32) }),
    /anchorKey does not match/
  )
})

test('missing proof references fail closed', () => {
  const packet = makePacket()
  assert.throws(
    () => validateCanonicalEvidencePacket({ ...packet, finalityProof: { kind: 'finality', digest: '1'.repeat(64) }, storageProof: { kind: 'storage', digest: '' } }),
    /storageProof.digest/
  )
})

test('proof kind mismatch fails closed', () => {
  const packet = makePacket()
  assert.throws(
    () => validateCanonicalEvidencePacket({
      ...packet,
      finalityProof: { kind: 'storage', digest: 'ee'.repeat(32) },
    }),
    /finalityProof\.kind/,
  )
})


test('mutation of any canonical tuple field invalidates the anchor', () => {
  const packet = makePacket()
  const tuples = [
    { ...packet, chainId: 'other-chain' },
    { ...packet, genesisHash: '11'.repeat(32) },
    { ...packet, blockHash: '22'.repeat(32) },
    { ...packet, blockNumber: 1235n },
    { ...packet, stateRoot: '33'.repeat(32) },
    { ...packet, storageKey: '0x02bb' },
    { ...packet, authorityCommitment: '44'.repeat(32) },
  ]
  for (const candidate of tuples) {
    assert.notEqual(
      packet.anchorKey,
      canonicalAnchorKey({
        schemaVersion: candidate.schemaVersion,
        chainId: candidate.chainId,
        genesisHash: candidate.genesisHash,
        blockHash: candidate.blockHash,
        blockNumber: candidate.blockNumber,
        stateRoot: candidate.stateRoot,
        storageKey: candidate.storageKey,
        authorityCommitment: candidate.authorityCommitment,
      }),
    )
  }
})

test('unsupported schema and malformed hashes fail closed', () => {
  const packet = makePacket()
  assert.throws(
    () => validateCanonicalEvidencePacket({ ...packet, schemaVersion: 'immortal-anchor-v2' as 'immortal-anchor-v1' }),
    /unsupported anchor schema/,
  )
  assert.throws(
    () => validateCanonicalEvidencePacket({ ...packet, stateRoot: 'aa' }),
    /stateRoot must be 32-byte hex/,
  )
  assert.throws(
    () => validateCanonicalEvidencePacket({ ...packet, blockNumber: -1n }),
    /blockNumber must be non-negative/,
  )
})
