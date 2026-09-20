import {
  type EconomicStateV3,
  validateEconomicStateV3,
} from '../serialization/CanonicalEconomicState'

export const USDM_SUBUNITS_PER_REFERENCE_UNIT = 100n
export const IMMORTAL_CANONICAL_PRICES = [
  1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n,
] as const

export type ObservedTicketStatus = 'Pending' | 'BeaconReady'

export type ObservedUnresolvedTicket = {
  ticketId: string
  priceUsdm: bigint
  status: ObservedTicketStatus
}

export type ObservedB1Pool = {
  pendingLiabilitiesUsdm: bigint
  unresolvedReserveUsdm: bigint
  unresolvedTicketCount: bigint
  lockedJackpotUsdm: bigint
  jackpotThresholdUsdm: bigint
}

export type AuthoritativeClassState = {
  classId: bigint
  issued: bigint
  cap: bigint
  saleable: boolean
}

export type ProjectionInput = {
  tickets: ObservedUnresolvedTicket[]
  pool: ObservedB1Pool
  authoritativeClasses: AuthoritativeClassState[]
  safetyCapital?: bigint
  reserveProtection?: bigint
  mandatoryFutureCosts?: bigint
  currentActiveClass?: bigint
  highestClassEverActivated?: bigint
}

function referenceUnitFromUsdm(priceUsdm: bigint): bigint {
  if (priceUsdm <= 0n) throw new Error('ticket price must be positive')
  if (priceUsdm % USDM_SUBUNITS_PER_REFERENCE_UNIT !== 0n) {
    throw new Error(
      `non-canonical price: ${priceUsdm} USDM sub-units is not divisible by ${USDM_SUBUNITS_PER_REFERENCE_UNIT}`,
    )
  }

  const referencePrice = priceUsdm / USDM_SUBUNITS_PER_REFERENCE_UNIT
  if (!IMMORTAL_CANONICAL_PRICES.includes(referencePrice as never)) {
    throw new Error(
      `non-canonical IMMORTAL reference price: ${referencePrice}`,
    )
  }

  return referencePrice
}

function classIdFromReferencePrice(referencePrice: bigint): bigint {
  const index = IMMORTAL_CANONICAL_PRICES.findIndex(
    (p) => p === referencePrice,
  )
  if (index < 0) {
    throw new Error(`non-canonical IMMORTAL reference price: ${referencePrice}`)
  }
  return BigInt(index)
}

function findAuthoritativeClass(
  authoritativeClasses: AuthoritativeClassState[],
  classId: bigint,
): AuthoritativeClassState {
  const matches = authoritativeClasses.filter((x) => x.classId === classId)
  if (matches.length !== 1) {
    throw new Error(
      `missing or ambiguous authoritative class state for class ${classId}`,
    )
  }

  const value = matches[0]
  if (value.issued < 0n) {
    throw new Error(`issued count for class ${classId} must be non-negative`)
  }
  if (value.cap < 0n) {
    throw new Error(`cap for class ${classId} must be non-negative`)
  }

  return value
}

function projectClasses(
  tickets: ObservedUnresolvedTicket[],
  authoritativeClasses: AuthoritativeClassState[],
) {
  const byClass = new Map<bigint, { unresolved: bigint; exposure: bigint }>()

  for (const ticket of tickets) {
    const referencePrice = referenceUnitFromUsdm(ticket.priceUsdm)
    const classId = classIdFromReferencePrice(referencePrice)
    const current = byClass.get(classId) ?? {
      unresolved: 0n,
      exposure: 0n,
    }

    current.unresolved += 1n
    current.exposure += referencePrice
    byClass.set(classId, current)
  }

  const classes = authoritativeClasses
    .map((authoritative) => {
      const value = byClass.get(authoritative.classId) ?? {
        unresolved: 0n,
        exposure: 0n,
      }

      if (value.exposure !== value.unresolved * (
        IMMORTAL_CANONICAL_PRICES[Number(authoritative.classId)] ?? -1n
      )) {
        throw new Error(
          `class exposure mismatch for class ${authoritative.classId}`,
        )
      }

      return {
        classId: authoritative.classId,
        issued: authoritative.issued,
        unresolved: value.unresolved,
        exposure: value.exposure,
        cap: authoritative.cap,
        saleable: authoritative.saleable,
      }
    })
    .sort((a, b) => Number(a.classId - b.classId))

  for (const entry of classes) {
    if (entry.classId < 0n || entry.classId > 7n) {
      throw new Error(`authoritative class ID must be canonical 0..7`)
    }
  }

  return classes
}

function usdmToReferenceAmount(amountUsdm: bigint, field: string): bigint {
  if (amountUsdm < 0n) throw new Error(`${field} must be non-negative`)
  if (amountUsdm % USDM_SUBUNITS_PER_REFERENCE_UNIT !== 0n) {
    throw new Error(
      `${field} is not representable in whole IMMORTAL reference units`,
    )
  }
  return amountUsdm / USDM_SUBUNITS_PER_REFERENCE_UNIT
}

export function projectCardanoToImmortalV3(
  input: ProjectionInput,
): EconomicStateV3 {
  const unresolvedTickets = input.tickets.filter(
    (ticket) =>
      ticket.status === 'Pending' || ticket.status === 'BeaconReady',
  )

  const classes = projectClasses(
    unresolvedTickets,
    input.authoritativeClasses,
  )

  const derivedReserveUsdm = unresolvedTickets.reduce(
    (sum, ticket) => sum + ticket.priceUsdm,
    0n,
  )
  const derivedCount = BigInt(unresolvedTickets.length)

  if (derivedReserveUsdm !== input.pool.unresolvedReserveUsdm) {
    throw new Error(
      `B1 unresolved reserve mismatch: observed pool=${input.pool.unresolvedReserveUsdm}, tickets=${derivedReserveUsdm}`,
    )
  }

  if (derivedCount !== input.pool.unresolvedTicketCount) {
    throw new Error(
      `B1 unresolved ticket count mismatch: observed pool=${input.pool.unresolvedTicketCount}, tickets=${derivedCount}`,
    )
  }

  const state: EconomicStateV3 = {
    crystallizedLiabilities: usdmToReferenceAmount(
      input.pool.pendingLiabilitiesUsdm,
      'pendingLiabilitiesUsdm',
    ),
    unresolvedReserve: usdmToReferenceAmount(
      input.pool.unresolvedReserveUsdm,
      'unresolvedReserveUsdm',
    ),
    unresolvedTicketCount: input.pool.unresolvedTicketCount,
    safetyCapital: input.safetyCapital ?? 0n,
    reserveProtection: input.reserveProtection ?? 0n,
    mandatoryFutureCosts: input.mandatoryFutureCosts ?? 0n,
    classes,
    control: {
      currentActiveClass: input.currentActiveClass ?? 0n,
      highestClassEverActivated: input.highestClassEverActivated ?? 0n,
    },
    jackpot: {
      lockedAmount: usdmToReferenceAmount(
        input.pool.lockedJackpotUsdm,
        'lockedJackpotUsdm',
      ),
      threshold: usdmToReferenceAmount(
        input.pool.jackpotThresholdUsdm,
        'jackpotThresholdUsdm',
      ),
      status: input.pool.lockedJackpotUsdm > 0n ? 'locked' : 'inactive',
      cycle: 0n,
    },
  }

  validateEconomicStateV3(state)
  return state
}

export function expectedRevealPostState(
  preState: EconomicStateV3,
  classId: bigint,
  payout: bigint,
): EconomicStateV3 {
  const classState = preState.classes.find((c) => c.classId === classId)
  if (!classState) throw new Error(`unknown reveal class ${classId}`)
  if (classState.unresolved <= 0n) {
    throw new Error(`class ${classId} has no unresolved ticket`)
  }

  const price = IMMORTAL_CANONICAL_PRICES[Number(classId)]
  if (price === undefined) throw new Error(`unknown reveal class ${classId}`)
  if (payout < 0n || payout > 500n * price) {
    throw new Error(`invalid payout for class ${classId}`)
  }

  const classes = preState.classes.map((c) =>
    c.classId === classId
      ? {
          ...c,
          unresolved: c.unresolved - 1n,
          exposure: c.exposure - price,
        }
      : c,
  )

  const postState: EconomicStateV3 = {
    ...preState,
    crystallizedLiabilities: preState.crystallizedLiabilities + payout,
    unresolvedReserve: preState.unresolvedReserve - price,
    unresolvedTicketCount: preState.unresolvedTicketCount - 1n,
    classes,
  }

  validateEconomicStateV3(postState)
  return postState
}

