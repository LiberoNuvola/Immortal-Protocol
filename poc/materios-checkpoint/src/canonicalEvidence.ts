import { createHash } from 'node:crypto'

export type ProofRef = {
  kind: 'finality' | 'storage'
  digest: string
  uri?: string
}

export type CanonicalEvidencePacket = {
  schemaVersion: 'immortal-anchor-v1'
  chainId: string
  genesisHash: string
  blockHash: string
  blockNumber: bigint
  stateRoot: string
  storageKey: string
  authorityCommitment: string
  anchorKey: string
  finalityProof: ProofRef
  storageProof: ProofRef
  producedAt: string
}

function hex32(value: string, name: string): string {
  const clean = value.replace(/^0x/i, '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new Error(`${name} must be 32-byte hex`)
  return clean
}

function nonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(`${name} is required`)
}

function proofRefValid(ref: ProofRef, expectedKind: ProofRef['kind'], name: string): void {
  if (ref.kind !== expectedKind) {
    throw new Error(name + '.kind must be ' + expectedKind)
  }
  if (ref.digest.length !== 64 || !/^[0-9a-f]+$/.test(ref.digest)) {
    throw new Error(name + '.digest must be a 32-byte lowercase hex digest')
  }
}

export function canonicalAnchorKey(packet: Omit<CanonicalEvidencePacket,'anchorKey'|'finalityProof'|'storageProof'|'producedAt'>): string {
  nonEmpty(packet.schemaVersion, 'schemaVersion')
  nonEmpty(packet.chainId, 'chainId')
  hex32(packet.genesisHash, 'genesisHash')
  hex32(packet.blockHash, 'blockHash')
  hex32(packet.stateRoot, 'stateRoot')
  nonEmpty(packet.storageKey, 'storageKey')
  nonEmpty(packet.authorityCommitment, 'authorityCommitment')
  if (packet.blockNumber < 0n) throw new Error('blockNumber must be non-negative')

  const input = [
    packet.schemaVersion,
    packet.chainId,
    hex32(packet.genesisHash,'genesisHash'),
    hex32(packet.blockHash,'blockHash'),
    packet.blockNumber.toString(),
    hex32(packet.stateRoot,'stateRoot'),
    packet.storageKey,
    packet.authorityCommitment.toLowerCase(),
  ].join('|')

  return createHash('sha256').update(input, 'utf8').digest('hex')
}

export function validateCanonicalEvidencePacket(packet: CanonicalEvidencePacket): void {
  if (packet.schemaVersion !== 'immortal-anchor-v1') throw new Error('unsupported anchor schema')
  nonEmpty(packet.chainId, 'chainId')
  hex32(packet.genesisHash, 'genesisHash')
  hex32(packet.blockHash, 'blockHash')
  hex32(packet.stateRoot, 'stateRoot')
  if (packet.blockNumber < 0n) throw new Error('blockNumber must be non-negative')
  nonEmpty(packet.storageKey, 'storageKey')
  nonEmpty(packet.authorityCommitment, 'authorityCommitment')
  proofRefValid(packet.finalityProof, 'finality', 'finalityProof')
  proofRefValid(packet.storageProof, 'storage', 'storageProof')
  if (Number.isNaN(Date.parse(packet.producedAt))) throw new Error('producedAt must be ISO-8601')

  const anchor = canonicalAnchorKey({
    schemaVersion: packet.schemaVersion,
    chainId: packet.chainId,
    genesisHash: packet.genesisHash,
    blockHash: packet.blockHash,
    blockNumber: packet.blockNumber,
    stateRoot: packet.stateRoot,
    storageKey: packet.storageKey,
    authorityCommitment: packet.authorityCommitment,
  })
  if (packet.anchorKey !== anchor) throw new Error('anchorKey does not match canonical evidence tuple')
  // Proof semantics remain the responsibility of the B3 verifier; this schema
  // only guarantees that the evidence packet is bound to one canonical tuple.
}