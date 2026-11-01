/**
 * Deterministic pool accounting for ticket expiry.
 *
 * This is a DApp construction helper only. PrizeValidator and B1PrizePool
 * independently enforce the same accounting on-chain.
 */
export type ExpiryTicketState = 'Pending' | 'Revealed' | 'Claimed'

export type ExpiryAccountingInput = {
  status: ExpiryTicketState
  ticketPriceUsdm: bigint
  prizeAmountUsdm: bigint
  pendingLiabilities: bigint
  unresolvedReserve: bigint
  unresolvedTicketCount: bigint
}

export type ExpiryAccountingOutput = {
  pendingLiabilities: bigint
  unresolvedReserve: bigint
  unresolvedTicketCount: bigint
}

export function deriveExpiryAccounting(
  input: ExpiryAccountingInput,
): ExpiryAccountingOutput {
  const {
    status,
    ticketPriceUsdm,
    prizeAmountUsdm,
    pendingLiabilities,
    unresolvedReserve,
    unresolvedTicketCount,
  } = input

  if (ticketPriceUsdm <= 0n) {
    throw new Error('EXPIRE requires a positive ticket price')
  }
  if (
    prizeAmountUsdm < 0n ||
    pendingLiabilities < 0n ||
    unresolvedReserve < 0n ||
    unresolvedTicketCount < 0n
  ) {
    throw new Error('EXPIRE accounting values must be non-negative')
  }

  if (status === 'Pending') {
    if (prizeAmountUsdm !== 0n) {
      throw new Error('Pending EXPIRE requires zero crystallized payout')
    }
    if (unresolvedTicketCount <= 0n) {
      throw new Error('B1PrizePool has no unresolved ticket to expire')
    }
    if (unresolvedReserve < ticketPriceUsdm) {
      throw new Error('B1PrizePool unresolved reserve is insufficient for ticket expiry')
    }
    return {
      pendingLiabilities,
      unresolvedReserve: unresolvedReserve - ticketPriceUsdm,
      unresolvedTicketCount: unresolvedTicketCount - 1n,
    }
  }

  if (status === 'Revealed') {
    if (prizeAmountUsdm > pendingLiabilities) {
      throw new Error('Revealed EXPIRE payout exceeds pending liabilities')
    }
    return {
      pendingLiabilities: pendingLiabilities - prizeAmountUsdm,
      unresolvedReserve,
      unresolvedTicketCount,
    }
  }

  throw new Error('EXPIRE cannot consume a Claimed ticket')
}
