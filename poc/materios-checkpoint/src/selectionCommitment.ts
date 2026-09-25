/**
 * Extract the on-chain Materios selection-input commitment from a raw block.
 *
 * Materios' current runtime assigns:
 *   SessionCommitteeManagement = pallet index 14
 *   pallet call set = call index 0
 *
 * The call is emitted as an unsigned/inherent extrinsic (version 4, 0x04).
 * The final field of set() is SizedByteString<32>, so the final 32 bytes of
 * the call payload are the selection_inputs_hash.
 *
 * This is deliberately a narrow decoder: it does not execute the selector,
 * validate committee contents, or establish GRANDPA finality.
 */

const EXTRINSIC_VERSION_UNSIGNED = 0x04
const SESSION_COMMITTEE_PALLET_INDEX = 14
const SET_CALL_INDEX = 0
const HASH_BYTES = 32

export type SelectionInputsCommitment = {
  extrinsicIndex: number
  extrinsicHex: string
  selectionInputsHash: string
}

function requireHex(value: string, field: string): string {
  if (typeof value !== 'string' || !/^0x[0-9a-f]*$/i.test(value)) {
    throw new Error(`${field} must be 0x-prefixed hex`)
  }
  if ((value.length - 2) % 2 !== 0) {
    throw new Error(`${field} must contain whole bytes`)
  }
  return value.toLowerCase()
}

/**
 * Recover the unique selection_inputs_hash committed by the canonical block.
 *
 * Fail closed if:
 * - an extrinsic is malformed;
 * - a matching set() inherent is shorter than the fixed hash field;
 * - more than one matching set() inherent exists;
 * - the block contains no matching set() inherent.
 */
export function extractSelectionInputsCommitment(
  extrinsics: readonly string[],
): SelectionInputsCommitment {
  if (!Array.isArray(extrinsics)) {
    throw new Error('block extrinsics must be an array')
  }

  let found: SelectionInputsCommitment | undefined

  for (let index = 0; index < extrinsics.length; index += 1) {
    const extrinsicHex = requireHex(extrinsics[index], `block extrinsic[${index}]`)
    const bytes = Buffer.from(extrinsicHex.slice(2), 'hex')

    // Unsigned/inherent SCALE extrinsic: version=4, followed by pallet/call.
    if (
      bytes[0] !== EXTRINSIC_VERSION_UNSIGNED ||
      bytes[1] !== SESSION_COMMITTEE_PALLET_INDEX ||
      bytes[2] !== SET_CALL_INDEX
    ) {
      continue
    }

    if (bytes.length < 3 + HASH_BYTES) {
      throw new Error(
        `SessionCommitteeManagement::set inherent extrinsic[${index}] is truncated`,
      )
    }

    const selectionInputsHash = `0x${bytes
      .subarray(bytes.length - HASH_BYTES)
      .toString('hex')}`

    if (found !== undefined) {
      throw new Error(
        'multiple SessionCommitteeManagement::set inherent extrinsics found',
      )
    }

    found = {
      extrinsicIndex: index,
      extrinsicHex,
      selectionInputsHash,
    }
  }

  if (found === undefined) {
    throw new Error(
      'SessionCommitteeManagement::set inherent extrinsic not found in block',
    )
  }

  return found
}
