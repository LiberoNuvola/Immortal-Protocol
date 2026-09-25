/**
 * SCALE call-data construction for Materios' canonical committee Runtime API.
 *
 * The runtime declaration is:
 *   calculate_committee(AuthoritySelectionInputs, ScEpochNumber)
 *
 * AuthoritySelectionInputs is already an exact SCALE byte sequence supplied
 * by the caller. ScEpochNumber is the sidechain-domain newtype over u64.
 * SCALE tuple/argument encoding concatenates the two encoded arguments.
 *
 * This helper does not synthesize AuthoritySelectionInputs; it only appends
 * the exact SCALE encoding of the epoch to already-authenticated input bytes.
 */
export const MATERIOS_COMMITTEE_RUNTIME_API =
  'SessionValidatorManagementApi_calculate_committee'

function requireHex(value: string, field: string, allowEmpty = false): string {
  if (typeof value !== 'string' || !/^0x[0-9a-f]*$/i.test(value)) {
    throw new Error(`${field} must be 0x-prefixed hex`)
  }
  if (!allowEmpty && value.length === 2) {
    throw new Error(`${field} must not be empty`)
  }
  if ((value.length - 2) % 2 !== 0) {
    throw new Error(`${field} must contain whole bytes`)
  }
  return value.toLowerCase()
}

export function encodeScEpochNumber(epoch: bigint): string {
  if (epoch < 0n || epoch > 0xffffffffffffffffn) {
    throw new Error('sidechainEpoch must fit u64')
  }

  const bytes = Buffer.alloc(8)
  bytes.writeBigUInt64LE(epoch)
  return `0x${bytes.toString('hex')}`
}

export function buildCalculateCommitteeCallData(
  authoritySelectionInputsHex: string,
  sidechainEpoch: bigint,
): string {
  const inputs = requireHex(
    authoritySelectionInputsHex,
    'authoritySelectionInputsHex',
  )
  const epoch = encodeScEpochNumber(sidechainEpoch)

  return `0x${inputs.slice(2)}${epoch.slice(2)}`
}
