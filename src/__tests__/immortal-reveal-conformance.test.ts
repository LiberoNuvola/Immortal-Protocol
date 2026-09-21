import { describe, expect, it } from 'vitest'

import {
  validateCanonicalEconomicState,
  type CanonicalEconomicState,
} from '../../Adapter/CARDANO/serialization/CanonicalEconomicState'

const USDM_SUBUNITS_PER_REFERENCE_UNIT = 100n
const PRE_RICH_MAX_NORMAL_PAYOUT_MULTIPLIER = 500n

type B1PoolObservation = {
  totalLiquidity: bigint
  pendingLiabilities: bigint
  unresolvedReserve: bigint
  unresolvedTicketCount: bigint
  lockedJackpot: bigint
  jackpotThreshold: bigint
  suspendedClasses: bigint
}

type TicketObservation = {
  classId: bigint
  priceUsdm: bigint
  unresolved: bigint
}

function referencePriceFromUsdm(priceUsdm: bigint): bigint {
  if (priceUsdm <= 0n || priceUsdm % USDM_SUBUNITS_PER_REFERENCE_UNIT !== 0n) {
    throw new Error(`non-canonical USDM price: ${priceUsdm}`)
  }
  return priceUsdm / USDM_SUBUNITS_PER_REFERENCE_UNIT
}

function classFromUsdmPrice(priceUsdm: bigint): bigint {
  const price = referencePriceFromUsdm(priceUsdm)
  const prices = [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n]
  const classId = prices.indexOf(price)
  if (classId < 0) throw new Error(`price ${price} is not a canonical PRE-RICH class`)
  return BigInt(classId)
}

/**
 * PRE-RICH performs the application-specific projection before the generic
 * Cardano Adapter boundary. The Adapter receives only the canonical aggregate.
 */
function projectObservedB1ToCanonical(
  pool: B1PoolObservation,
  tickets: TicketObservation[],
): CanonicalEconomicState {
  let ticketReserve = 0n
  let worstCaseExposure = 0n
  let unresolved = 0n

  for (const ticket of tickets) {
    const classId = classFromUsdmPrice(ticket.priceUsdm)
    if (classId !== ticket.classId) {
      throw new Error(`ticket class/price mismatch for class ${ticket.classId}`)
    }

    const price = referencePriceFromUsdm(ticket.priceUsdm)
    ticketReserve += price * ticket.unresolved
    unresolved += ticket.unresolved
    worstCaseExposure +=
      PRE_RICH_MAX_NORMAL_PAYOUT_MULTIPLIER * price * ticket.unresolved
  }

  if (ticketReserve !== pool.unresolvedReserve / USDM_SUBUNITS_PER_REFERENCE_UNIT) {
    throw new Error('unresolvedReserve does not equal ticket decomposition')
  }
  if (unresolved !== pool.unresolvedTicketCount) {
    throw new Error('unresolvedTicketCount does not equal ticket decomposition')
  }

  const state: CanonicalEconomicState = {
    crystallizedLiabilities:
      pool.pendingLiabilities / USDM_SUBUNITS_PER_REFERENCE_UNIT,
    unresolvedReserve:
      pool.unresolvedReserve / USDM_SUBUNITS_PER_REFERENCE_UNIT,
    unresolvedTicketCount: pool.unresolvedTicketCount,
    worstCaseExposure,
    safetyCapital: 0n,
    reserveProtection: 0n,
    mandatoryFutureCosts: 0n,
    additionalProtectedCapital:
      pool.lockedJackpot / USDM_SUBUNITS_PER_REFERENCE_UNIT,
  }

  validateCanonicalEconomicState(state)
  return state
}

function applyImmortalReveal(
  pre: CanonicalEconomicState,
  ticketPriceReferenceUnits: bigint,
  payoutReferenceUnits: bigint,
): CanonicalEconomicState {
  if (pre.unresolvedTicketCount <= 0n) throw new Error('reveal requires an unresolved ticket')
  return {
    ...pre,
    crystallizedLiabilities:
      pre.crystallizedLiabilities + payoutReferenceUnits,
    unresolvedReserve:
      pre.unresolvedReserve - ticketPriceReferenceUnits,
    unresolvedTicketCount: pre.unresolvedTicketCount - 1n,
    worstCaseExposure:
      pre.worstCaseExposure -
      PRE_RICH_MAX_NORMAL_PAYOUT_MULTIPLIER * ticketPriceReferenceUnits,
  }
}

describe('IMMORTAL / PRE-RICH Reveal conformance', () => {
  it('maps a concrete B1 Reveal observation to the canonical economic post-state', () => {
    const prePool: B1PoolObservation = {
      totalLiquidity: 100_000n,
      pendingLiabilities: 500n,
      unresolvedReserve: 600n,
      unresolvedTicketCount: 3n,
      lockedJackpot: 0n,
      jackpotThreshold: 10_000n,
      suspendedClasses: 0n,
    }

    const preTickets: TicketObservation[] = [
      { classId: 0n, priceUsdm: 100n, unresolved: 1n },
      { classId: 1n, priceUsdm: 200n, unresolved: 1n },
      { classId: 2n, priceUsdm: 300n, unresolved: 1n },
    ]

    const pre = projectObservedB1ToCanonical(prePool, preTickets)
    const expected = applyImmortalReveal(pre, 2n, 10n)

    const postPool: B1PoolObservation = {
      ...prePool,
      pendingLiabilities: 1_500n,
      unresolvedReserve: 400n,
      unresolvedTicketCount: 2n,
    }

    const postTickets: TicketObservation[] = [
      { classId: 0n, priceUsdm: 100n, unresolved: 1n },
      { classId: 1n, priceUsdm: 200n, unresolved: 0n },
      { classId: 2n, priceUsdm: 300n, unresolved: 1n },
    ]

    const observed = projectObservedB1ToCanonical(postPool, postTickets)
    expect(observed).toEqual(expected)
    validateCanonicalEconomicState(observed)
  })

  it('rejects an aggregate reserve that disagrees with application-level ticket composition', () => {
    expect(() =>
      projectObservedB1ToCanonical(
        {
          totalLiquidity: 100_000n,
          pendingLiabilities: 0n,
          unresolvedReserve: 250n,
          unresolvedTicketCount: 2n,
          lockedJackpot: 0n,
          jackpotThreshold: 10_000n,
          suspendedClasses: 0n,
        },
        [
          { classId: 0n, priceUsdm: 100n, unresolved: 1n },
          { classId: 1n, priceUsdm: 200n, unresolved: 1n },
        ],
      ),
    ).toThrow('unresolvedReserve does not equal ticket decomposition')
  })

  it('keeps non-canonical application price rejection above the generic Adapter boundary', () => {
    expect(() =>
      projectObservedB1ToCanonical(
        {
          totalLiquidity: 100_000n,
          pendingLiabilities: 0n,
          unresolvedReserve: 100n,
          unresolvedTicketCount: 1n,
          lockedJackpot: 0n,
          jackpotThreshold: 10_000n,
          suspendedClasses: 0n,
        },
        [{ classId: 0n, priceUsdm: 150n, unresolved: 1n }],
      ),
    ).toThrow('non-canonical USDM price')
  })

  it('accepts an application-independent canonical state without class or Jackpot fields', () => {
    const state: CanonicalEconomicState = {
      crystallizedLiabilities: 10n,
      unresolvedReserve: 4n,
      unresolvedTicketCount: 2n,
      worstCaseExposure: 40n,
      safetyCapital: 3n,
      reserveProtection: 2n,
      mandatoryFutureCosts: 1n,
      additionalProtectedCapital: 5n,
    }

    expect(() => validateCanonicalEconomicState(state)).not.toThrow()
  })
})