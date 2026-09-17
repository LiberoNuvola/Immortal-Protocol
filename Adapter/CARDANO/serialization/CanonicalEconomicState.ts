export type TicketClassStateV3 = {
  classId: bigint
  issued: bigint
  unresolved: bigint
  exposure: bigint
  cap: bigint
  saleable: boolean
}

export type EconomicControlStateV3 = {
  currentActiveClass: bigint
  highestClassEverActivated: bigint
}

export type JackpotStateV3 = {
  lockedAmount: bigint
  threshold: bigint
  status: 'inactive' | 'locked' | 'payable' | 'closed'
  cycle: bigint
}

export type EconomicStateV3 = {
  crystallizedLiabilities: bigint
  unresolvedReserve: bigint
  unresolvedTicketCount: bigint
  safetyCapital: bigint
  reserveProtection: bigint
  mandatoryFutureCosts: bigint
  classes: TicketClassStateV3[]
  control: EconomicControlStateV3
  jackpot: JackpotStateV3
}

function nonNegative(n: bigint, name: string): void {
  if (n < 0n) throw new Error(`${name} must be non-negative`)
}

export function validateEconomicStateV3(s: EconomicStateV3): void {
  nonNegative(s.crystallizedLiabilities, 'crystallizedLiabilities')
  nonNegative(s.unresolvedReserve, 'unresolvedReserve')
  nonNegative(s.unresolvedTicketCount, 'unresolvedTicketCount')
  nonNegative(s.safetyCapital, 'safetyCapital')
  nonNegative(s.reserveProtection, 'reserveProtection')
  nonNegative(s.mandatoryFutureCosts, 'mandatoryFutureCosts')
  nonNegative(s.jackpot.lockedAmount, 'jackpot.lockedAmount')

  if (s.classes.length > 8) {
    throw new Error('V3 state cannot contain more than 8 canonical ticket classes')
  }

  const ids = new Set<string>()
  let reserve = 0n
  let unresolved = 0n

  for (const c of s.classes) {
    nonNegative(c.classId, 'classId')
    nonNegative(c.issued, 'issued')
    nonNegative(c.unresolved, 'unresolved')
    nonNegative(c.exposure, 'exposure')
    nonNegative(c.cap, 'cap')

    const key = c.classId.toString()
    if (ids.has(key)) throw new Error(`Duplicate ticket class ${key}`)
    ids.add(key)

    reserve += c.exposure
    unresolved += c.unresolved
  }

  if (reserve !== s.unresolvedReserve) {
    throw new Error('unresolvedReserve does not equal class decomposition')
  }

  if (unresolved !== s.unresolvedTicketCount) {
    throw new Error('unresolvedTicketCount does not equal class decomposition')
  }
}
