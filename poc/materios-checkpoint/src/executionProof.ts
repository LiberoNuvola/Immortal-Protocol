import { createHash } from 'node:crypto'

/**
 * B3 transport envelope for a native Substrate ProofProvider::execution_proof result.
 *
 * The proof returned by the SDK is a SCALE-encodable StorageProof. The packet
 * preserves that exact proof as SCALE bytes rather than inventing a second
 * transport representation of its trie-node set.
 *
 * This type is intentionally an evidence envelope, not a proof verifier. The
 * RPC transport is untrusted; cryptographic execution/state/finality checks
 * remain an independent verifier responsibility.
 */
export type MateriosAuthoritySelectionPath =
  | {
      kind: 'normal'
      evidenceHash: string
    }
  | {
      kind: 'pinned'
      evidenceHash: string
      untilEpoch: bigint
    }

export type MateriosExecutionProofPacket = {
  schemaVersion: 'materios-execution-proof-v1'
  chainId: string
  genesisHash: string
  blockHash: string
  blockNumber: bigint
  stateRoot: string

  runtime: {
    specName: string
    implName: string
    specVersion: number
    implVersion: number
  }

  runtimeApiMethod: string
  callDataHex: string
  resultHex: string
  proofScaleHex: string

  sidechainEpoch: bigint
  cardanoEpochNonceHex: string
  genesisUtxoHex: string

  selectionPath: MateriosAuthoritySelectionPath
  authorityCommitment: string
}

function requireHash(value: string, field: string): string {
  const clean = value.replace(/^0x/i, '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    throw new Error(`${field} must be 32-byte hex`)
  }
  return clean
}

function requireHex(value: string, field: string, allowEmpty = false): string {
  if (typeof value !== 'string' || !/^0x[0-9a-f]*$/i.test(value)) {
    throw new Error(`${field} must be 0x-prefixed hex`)
  }
  if (!allowEmpty && value.length === 2) {
    throw new Error(`${field} must not be empty`)
  }
  return value.toLowerCase()
}

function requirePositiveName(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} is required`)
}

function requireNonNegativeBigInt(value: bigint, field: string): void {
  if (value < 0n) throw new Error(`${field} must be non-negative`)
}

function requireSafeNonNegativeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a safe non-negative integer`)
  }
}

/**
 * Validate the transport envelope and all semantic bindings that can be
 * checked without executing the Substrate trie/runtime verifier.
 *
 * This function MUST NOT be interpreted as cryptographic proof verification.
 */
export function validateMateriosExecutionProofPacket(
  packet: MateriosExecutionProofPacket,
): void {
  if (packet.schemaVersion !== 'materios-execution-proof-v1') {
    throw new Error('unsupported execution proof schema')
  }

  requirePositiveName(packet.chainId, 'chainId')
  requireHash(packet.genesisHash, 'genesisHash')
  requireHash(packet.blockHash, 'blockHash')
  requireNonNegativeBigInt(packet.blockNumber, 'blockNumber')
  requireHash(packet.stateRoot, 'stateRoot')

  requirePositiveName(packet.runtime.specName, 'runtime.specName')
  requirePositiveName(packet.runtime.implName, 'runtime.implName')
  requireSafeNonNegativeInteger(packet.runtime.specVersion, 'runtime.specVersion')
  requireSafeNonNegativeInteger(packet.runtime.implVersion, 'runtime.implVersion')

  requirePositiveName(packet.runtimeApiMethod, 'runtimeApiMethod')
  requireHex(packet.callDataHex, 'callDataHex', true)
  requireHex(packet.resultHex, 'resultHex', true)
  requireHex(packet.proofScaleHex, 'proofScaleHex')

  requireNonNegativeBigInt(packet.sidechainEpoch, 'sidechainEpoch')
  requireHex(packet.cardanoEpochNonceHex, 'cardanoEpochNonceHex')
  requireHex(packet.genesisUtxoHex, 'genesisUtxoHex')

  if (packet.selectionPath.kind !== 'pinned' && packet.selectionPath.kind !== 'normal') {
    throw new Error('selectionPath must be pinned or normal')
  }

  requireHash(packet.selectionPath.evidenceHash, 'selectionPath.evidenceHash')

  if (packet.selectionPath.kind === 'pinned') {
    requireNonNegativeBigInt(packet.selectionPath.untilEpoch, 'selectionPath.untilEpoch')
    if (packet.sidechainEpoch > packet.selectionPath.untilEpoch) {
      throw new Error('selectionPath pinned regime expired')
    }
  }

  requirePositiveName(packet.authorityCommitment, 'authorityCommitment')
  requireHash(packet.authorityCommitment, 'authorityCommitment')

  // Binding invariant: execution must be evaluated at the same block whose
  // stateRoot is being authenticated. We do not infer or repair either value.
  // The caller must independently establish blockHash -> stateRoot from the
  // canonical finalized header.
}

/**
 * Deterministic transport identifier. This is only an artifact identifier;
 * it is NOT a proof of canonicality.
 */
export function executionProofPacketId(
  packet: MateriosExecutionProofPacket,
): string {
  validateMateriosExecutionProofPacket(packet)

  const hash = createHash('sha256')
  hash.update(packet.schemaVersion)
  hash.update('|')
  hash.update(packet.chainId)
  hash.update('|')
  hash.update(requireHash(packet.genesisHash, 'genesisHash'))
  hash.update('|')
  hash.update(requireHash(packet.blockHash, 'blockHash'))
  hash.update('|')
  hash.update(packet.blockNumber.toString())
  hash.update('|')
  hash.update(requireHash(packet.stateRoot, 'stateRoot'))
  hash.update('|')
  hash.update(packet.runtime.specName)
  hash.update('|')
  hash.update(packet.runtime.implName)
  hash.update('|')
  hash.update(String(packet.runtime.specVersion))
  hash.update('|')
  hash.update(String(packet.runtime.implVersion))
  hash.update('|')
  hash.update(packet.runtimeApiMethod)
  hash.update('|')
  hash.update(packet.callDataHex.toLowerCase())
  hash.update('|')
  hash.update(packet.resultHex.toLowerCase())
  hash.update('|')
  hash.update(packet.proofScaleHex.toLowerCase())
  hash.update('|')
  hash.update(packet.sidechainEpoch.toString())
  hash.update('|')
  hash.update(packet.cardanoEpochNonceHex.toLowerCase())
  hash.update('|')
  hash.update(packet.genesisUtxoHex.toLowerCase())
  hash.update('|')
  hash.update(packet.selectionPath.kind)
  hash.update('|')
  hash.update(requireHash(packet.selectionPath.evidenceHash, 'selectionPath.evidenceHash'))
  hash.update('|')
  if (packet.selectionPath.kind === 'pinned') {
    hash.update(packet.selectionPath.untilEpoch.toString())
    hash.update('|')
  }
  hash.update(requireHash(packet.authorityCommitment, 'authorityCommitment'))

  return '0x' + hash.digest('hex')
}
