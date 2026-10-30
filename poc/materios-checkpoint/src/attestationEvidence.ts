import { blake2b } from '@noble/hashes/blake2.js'
import { bytesToHex, decodeCompact, hexToBytes } from './scale.js'

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function decodeBase58(value: string): Uint8Array {
  if (!value) throw new Error('SS58 address is empty')

  let integer = 0n
  for (const character of value) {
    const digit = BASE58_ALPHABET.indexOf(character)
    if (digit < 0) throw new Error('SS58 address contains a non-Base58 character')
    integer = integer * 58n + BigInt(digit)
  }

  const decoded: number[] = []
  while (integer > 0n) {
    decoded.unshift(Number(integer & 0xffn))
    integer >>= 8n
  }

  let leadingZeroes = 0
  while (leadingZeroes < value.length && value[leadingZeroes] === '1') {
    leadingZeroes += 1
  }

  return Uint8Array.from([
    ...new Array<number>(leadingZeroes).fill(0),
    ...decoded,
  ])
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

/**
 * Decode and checksum-verify an SS58 AccountId32 address.
 * Materios Preprod uses SS58 prefix 42.
 */
export function decodeMateriosSs58AccountId(
  address: string,
  expectedPrefix = 42,
): string {
  const decoded = decodeBase58(address)
  if (decoded.length !== 35) {
    throw new Error(
      `SS58 AccountId32 must decode to 35 bytes, got ${decoded.length}`,
    )
  }

  if (decoded[0] !== expectedPrefix) {
    throw new Error(
      `SS58 prefix mismatch: expected ${expectedPrefix}, got ${decoded[0]}`,
    )
  }

  const payload = decoded.subarray(0, 33)
  const actualChecksum = decoded.subarray(33, 35)
  const checksumInput = concat([
    new TextEncoder().encode('SS58PRE'),
    payload,
  ])
  const expectedChecksum = blake2b(checksumInput, { dkLen: 64 }).subarray(0, 2)

  if (
    actualChecksum[0] !== expectedChecksum[0] ||
    actualChecksum[1] !== expectedChecksum[1]
  ) {
    throw new Error('SS58 checksum mismatch')
  }

  return bytesToHex(decoded.subarray(1, 33)).toLowerCase()
}

/**
 * Decode the SCALE BoundedBTreeSet<AccountId32> value stored by
 * OrinqReceipts.CommitteeMembers. BTreeSet SCALE encoding is Vec encoding:
 * compact element count followed by sorted fixed-width AccountId32 values.
 */
export function decodeCommitteeMembersScale(
  valueHex: string,
  maximumMembers = 96,
): string[] {
  const bytes = hexToBytes(valueHex)
  const compact = decodeCompact(bytes, 0)

  if (compact.value > BigInt(maximumMembers)) {
    throw new Error(
      `committee member count exceeds configured maximum ${maximumMembers}`,
    )
  }

  const count = Number(compact.value)
  const expectedLength = compact.offset + count * 32
  if (bytes.length !== expectedLength) {
    throw new Error(
      `CommitteeMembers SCALE length mismatch: expected ${expectedLength}, got ${bytes.length}`,
    )
  }

  const members: string[] = []
  for (let index = 0; index < count; index += 1) {
    const start = compact.offset + index * 32
    members.push(bytesToHex(bytes.subarray(start, start + 32)).toLowerCase())
  }

  if (new Set(members).size !== members.length) {
    throw new Error('CommitteeMembers contains duplicate AccountId32 entries')
  }

  return members
}

/** Decode exactly one SCALE u32 little-endian value. */
export function decodeAttestationThresholdScale(valueHex: string): number {
  const bytes = hexToBytes(valueHex)
  if (bytes.length !== 4) {
    throw new Error(
      `AttestationThreshold SCALE value must be 4 bytes, got ${bytes.length}`,
    )
  }

  return (
    bytes[0] +
    bytes[1] * 0x100 +
    bytes[2] * 0x10000 +
    bytes[3] * 0x1000000
  )
}

export type IndexedAttester = {
  address: string
  accountId: string
}

/**
 * Cross-check an indexer-supplied signer list against the committee and
 * threshold values read from exact-block on-chain storage.
 *
 * This checks membership and threshold only. It does not independently prove
 * that the accounts submitted AttestationRecorded calls or verify signatures.
 */
export function verifyIndexedSignerSetAgainstCommittee(
  signerAddresses: readonly string[],
  committeeMembers: readonly string[],
  attestationThreshold: number,
): IndexedAttester[] {
  if (!Number.isSafeInteger(attestationThreshold) || attestationThreshold < 1) {
    throw new Error('on-chain attestation threshold must be a positive integer')
  }
  if (committeeMembers.length === 0) {
    throw new Error('on-chain committee is empty')
  }
  if (attestationThreshold > committeeMembers.length) {
    throw new Error('on-chain attestation threshold exceeds committee size')
  }
  if (signerAddresses.length === 0) {
    throw new Error('indexer signer list is empty')
  }

  const committee = new Set(
    committeeMembers.map((member) => {
      const normalized = member.replace(/^0x/i, '').toLowerCase()
      if (!/^[0-9a-f]{64}$/.test(normalized)) {
        throw new Error('committee AccountId32 is not 32-byte hex')
      }
      return normalized
    }),
  )

  const attesters = signerAddresses.map((address) => ({
    address,
    accountId: decodeMateriosSs58AccountId(address),
  }))

  const accountIds = attesters.map((attester) => attester.accountId)
  if (new Set(accountIds).size !== accountIds.length) {
    throw new Error('indexer signer list contains duplicate AccountId32 values')
  }

  for (const accountId of accountIds) {
    if (!committee.has(accountId.replace(/^0x/, ''))) {
      throw new Error(
        `indexer signer ${accountId} is not in the on-chain committee snapshot`,
      )
    }
  }

  if (accountIds.length < attestationThreshold) {
    throw new Error(
      `indexer signer count ${accountIds.length} is below on-chain threshold ${attestationThreshold}`,
    )
  }

  return attesters
}
