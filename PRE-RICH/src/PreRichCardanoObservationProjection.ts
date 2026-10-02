/**
 * PRE-RICH application projection for Cardano observations.
 *
 * This module intentionally lives outside Adapter/CARDANO because it contains
 * application policy: the PRE-RICH ticket ladder, PRE-RICH payout bound and
 * Jackpot/application control representation. The generic Adapter consumes
 * only the resulting chain-neutral economic aggregate.
 */

export type TicketClassStateV3 = {
  classId: bigint
  issued: bigint
  unresolved: bigint
  exposure: bigint
  cap: bigint
  saleable: boolean
}

export type EconomicStateV3 = {
  crystallizedLiabilities: bigint
  unresolvedReserve: bigint
  unresolvedTicketCount: bigint
  safetyCapital: bigint
  reserveProtection: bigint
  mandatoryFutureCosts: bigint
  classes: TicketClassStateV3[]
  control: {
    currentActiveClass: bigint
    highestClassEverActivated: bigint
  }
  jackpot: {
    lockedAmount: bigint
    threshold: bigint
    status: 'inactive' | 'locked' | 'payable' | 'closed'
    cycle: bigint
  }
}

function validateEconomicStateV3(state: EconomicStateV3): void {
  if (typeof state.control.currentActiveClass !== 'bigint' ||
      typeof state.control.highestClassEverActivated !== 'bigint') {
    throw new Error('V3 control state must be explicitly observed as bigint values')
  }
  if (state.control.currentActiveClass < 0n ||
      state.control.highestClassEverActivated < 0n) {
    throw new Error('V3 control state must be non-negative')
  }
  const aggregateValues = [
    state.crystallizedLiabilities,
    state.unresolvedReserve,
    state.unresolvedTicketCount,
    state.safetyCapital,
    state.reserveProtection,
    state.mandatoryFutureCosts,
    state.jackpot.lockedAmount,
    state.jackpot.threshold,
    state.jackpot.cycle,
    state.control.currentActiveClass,
    state.control.highestClassEverActivated,
  ]
  if (aggregateValues.some((value) => value < 0n)) {
    throw new Error('V3 state contains a negative economic value')
  }
  if (state.control.currentActiveClass > state.control.highestClassEverActivated) {
    throw new Error('V3 current active class cannot exceed highest-ever activated class')
  }
  const currentClass = state.classes.find((entry) => entry.classId === state.control.currentActiveClass)
  if (!currentClass) {
    throw new Error('V3 current active class must identify a canonical class')
  }
  if (!currentClass.saleable || currentClass.issued >= currentClass.cap) {
    throw new Error('V3 current active class must remain saleable and below cap')
  }
  if (state.classes.length !== PRE_RICH_CANONICAL_PRICES.length) {
    throw new Error('V3 state must contain exactly 8 canonical ticket classes')
  }
  state.classes.forEach((entry, index) => {
    if (entry.classId !== BigInt(index)) {
      throw new Error('V3 class state must contain canonical unique class IDs 0..7')
    }
    if (entry.issued < 0n || entry.unresolved < 0n || entry.exposure < 0n || entry.cap < 0n) {
      throw new Error('V3 class state contains a negative value')
    }
    if (entry.exposure !== PRE_RICH_CANONICAL_PRICES[index] * entry.unresolved) {
      throw new Error('V3 class exposure does not match the canonical price')
    }
    if (entry.unresolved > entry.issued) {
      throw new Error('V3 unresolved tickets cannot exceed issued tickets')
    }
  })
}
export const USDM_SUBUNITS_PER_REFERENCE_UNIT = 100n
export const PRE_RICH_MAX_NORMAL_PAYOUT_MULTIPLIER = 500n
export const PRE_RICH_CANONICAL_PRICES = [
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
  /** Authoritative protected-capital observations; omission must fail closed. */
  safetyCapital: bigint
  reserveProtection: bigint
  mandatoryFutureCosts: bigint
  currentActiveClass: bigint
  highestClassEverActivated: bigint
}

function referenceUnitFromUsdm(priceUsdm: bigint): bigint {
  if (priceUsdm <= 0n) throw new Error('ticket price must be positive')
  if (priceUsdm % USDM_SUBUNITS_PER_REFERENCE_UNIT !== 0n) {
    throw new Error(
      `non-canonical price: ${priceUsdm} USDM sub-units is not divisible by ${USDM_SUBUNITS_PER_REFERENCE_UNIT}`,
    )
  }

  const referencePrice = priceUsdm / USDM_SUBUNITS_PER_REFERENCE_UNIT
  if (!PRE_RICH_CANONICAL_PRICES.includes(referencePrice as never)) {
    throw new Error(
      `non-canonical IMMORTAL reference price: ${referencePrice}`,
    )
  }

  return referencePrice
}

function classIdFromReferencePrice(referencePrice: bigint): bigint {
  const index = PRE_RICH_CANONICAL_PRICES.findIndex(
    (p) => p === referencePrice,
  )
  if (index < 0) {
    throw new Error(`non-canonical IMMORTAL reference price: ${referencePrice}`)
  }
  return BigInt(index)
}

function projectClasses(
  tickets: ObservedUnresolvedTicket[],
  authoritativeClasses: AuthoritativeClassState[],
) {
  if (authoritativeClasses.length !== PRE_RICH_CANONICAL_PRICES.length) {
    throw new Error('missing or ambiguous authoritative class state: expected exactly 8 canonical ticket classes')
  }

  const authoritativeIds = new Set<bigint>()
  for (const authoritative of authoritativeClasses) {
    if (
      authoritative.classId < 0n ||
      authoritative.classId >= BigInt(PRE_RICH_CANONICAL_PRICES.length) ||
      authoritativeIds.has(authoritative.classId)
    ) {
      throw new Error('missing or ambiguous authoritative class state')
    }
    authoritativeIds.add(authoritative.classId)
    if (authoritative.issued < 0n || authoritative.cap < 0n) {
      throw new Error('authoritative class contains a negative value')
    }
  }

  const byClass = new Map<bigint, { unresolved: bigint; exposure: bigint }>()
  const seenTicketIds = new Set<string>()

  for (const ticket of tickets) {
    if (seenTicketIds.has(ticket.ticketId)) {
      throw new Error('duplicate unresolved ticket ID: ' + ticket.ticketId)
    }
    seenTicketIds.add(ticket.ticketId)
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
        PRE_RICH_CANONICAL_PRICES[Number(authoritative.classId)] ?? -1n
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

  if (classes.length !== PRE_RICH_CANONICAL_PRICES.length) {
    throw new Error('authoritative class state must cover all canonical classes')
  }
  for (let index = 0; index < classes.length; index += 1) {
    if (classes[index].classId !== BigInt(index)) {
      throw new Error('authoritative class state must cover canonical IDs 0..7 exactly once')
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
    safetyCapital: input.safetyCapital,
    reserveProtection: input.reserveProtection,
    mandatoryFutureCosts: input.mandatoryFutureCosts,
    classes,
    control: {
      currentActiveClass: input.currentActiveClass,
      highestClassEverActivated: input.highestClassEverActivated,
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

  const price = PRE_RICH_CANONICAL_PRICES[Number(classId)]
  if (price === undefined) throw new Error(`unknown reveal class ${classId}`)
  if (payout < 0n || payout > PRE_RICH_MAX_NORMAL_PAYOUT_MULTIPLIER * price) {
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

