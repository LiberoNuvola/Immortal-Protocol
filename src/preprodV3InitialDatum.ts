import {
  PRE_RICH_PREPROD_DEPLOYMENT_PROFILE_V1 as profile,
  PRE_RICH_PREPROD_CLASS_PRICES,
  assertPreRichPreprodInitialProfile,
  buildPreRichPreprodInitialClasses,
} from '../PRE-RICH/profile/PreRichPreprodDeploymentProfile'

/**
 * Minimal canonical Plutus-data CBOR encoder for this deployment datum.
 *
 * The legacy lucid-cardano 0.10.11 web serializer can construct Constr values
 * but its WASM list constructor is not available in the Vitest Node runtime.
 * This datum contains one real Plutus List (the eight classes), so encoding
 * that list directly keeps the deployment artifact deterministic and avoids
 * making the test/runtime depend on an unrelated WASM initialization side
 * effect. The resulting bytes use the canonical Plutus Data encoding.
 */
function encodeUnsigned(n: bigint): string {
  if (n < 0n) throw new Error('initial V3 datum cannot contain negative integers')
  if (n < 24n) return Number(n).toString(16).padStart(2, '0')
  if (n <= 0xffn) return '18' + Number(n).toString(16).padStart(2, '0')
  if (n <= 0xffffn) return '19' + Number(n).toString(16).padStart(4, '0')
  if (n <= 0xffffffffn) return '1a' + Number(n).toString(16).padStart(8, '0')
  if (n <= 0xffffffffffffffffn) {
    return '1b' + n.toString(16).padStart(16, '0')
  }
  throw new Error('initial V3 datum integer exceeds supported CBOR width')
}

function encodeList(items: string[]): string {
  const length = BigInt(items.length)
  if (length < 24n) {
    return '8' + Number(length).toString(16) + items.join('')
  }
  throw new Error('initial V3 datum list is unexpectedly long')
}

function encodeConstr(index: number, fields: string[]): string {
  if (!Number.isInteger(index) || index < 0 || index > 6) {
    throw new Error('initial V3 datum constructor index is unsupported')
  }
  // Plutus constructors 0..6 use CBOR tags 121..127.
  return (0x79 + index).toString(16) + encodeList(fields)
}

function encodeInt(value: bigint): string {
  return encodeUnsigned(value)
}

function encodeClass(entry: {
  classId: bigint
  issued: bigint
  unresolved: bigint
  exposure: bigint
  cap: bigint
  saleable: boolean
}): string {
  return encodeConstr(0, [
    encodeInt(entry.classId),
    encodeInt(entry.issued),
    encodeInt(entry.unresolved),
    encodeInt(entry.exposure),
    encodeInt(entry.cap),
    encodeConstr(entry.saleable ? 1 : 0, []),
  ])
}

export function buildPreRichPreprodInitialDatum(): string {
  assertPreRichPreprodInitialProfile()

  const classes = buildPreRichPreprodInitialClasses().map(encodeClass)

  if (classes.length !== PRE_RICH_PREPROD_CLASS_PRICES.length) {
    throw new Error('initial V3 datum class count mismatch')
  }

  const state = encodeConstr(0, [
    encodeInt(profile.crystallizedLiabilities),
    encodeInt(profile.unresolvedReserve),
    encodeInt(profile.unresolvedTicketCount),
    encodeInt(profile.safetyCapital),
    encodeInt(profile.reserveProtection),
    encodeInt(profile.mandatoryFutureCosts),
    encodeList(classes),
    encodeConstr(0, [
      encodeInt(profile.currentActiveClass),
      encodeInt(profile.highestClassEverActivated),
    ]),
    encodeConstr(0, [
      encodeInt(profile.jackpot.lockedAmount),
      encodeInt(profile.jackpot.threshold),
      encodeConstr(0, []),
      encodeInt(profile.jackpot.cycle),
    ]),
  ])

  return encodeConstr(0, [
    encodeInt(profile.stateVersion),
    state,
  ])
}
