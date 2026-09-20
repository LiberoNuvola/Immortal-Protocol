import { describe, expect, it } from 'vitest'

import {
  validateEconomicStateV3,
  type EconomicStateV3,
} from '../../Adapter/CARDANO/serialization/CanonicalEconomicState'

const USDM_SUBUNITS_PER_REFERENCE_UNIT = 100n

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
  issued: bigint
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
  if (classId < 0) throw new Error(`price ${price} is not a canonical IMMORTAL class`)
  return BigInt(classId)
}

function projectObservedB1ToV3(
  pool: B1PoolObservation,
  tickets: TicketObservation[],
): EconomicStateV3 {
  const classes = tickets.map((ticket) => {
    const classId = classFromUsdmPrice(ticket.priceUsdm)
    if (classId !== ticket.classId) {
      throw new Error(`ticket class/price mismatch for class ${ticket.classId}`)
    }

    const price = referencePriceFromUsdm(ticket.priceUsdm)

    return {
      classId,
      issued: ticket.issued,
      unresolved: ticket.unresolved,
      exposure: price * ticket.unresolved,
      cap: 0n,
      saleable: true,
    }
  })

  const state: EconomicStateV3 = {
    crystallizedLiabilities:
      pool.pendingLiabilities / USDM_SUBUNITS_PER_REFERENCE_UNIT,
    unresolvedReserve:
      pool.unresolvedReserve / USDM_SUBUNITS_PER_REFERENCE_UNIT,
    unresolvedTicketCount: pool.unresolvedTicketCount,
    safetyCapital: 0n,
    reserveProtection: 0n,
    mandatoryFutureCosts: 0n,
    classes,
    control: {
      currentActiveClass: 0n,
      highestClassEverActivated: 0n,
    },
    jackpot: {
      lockedAmount:
        pool.lockedJackpot / USDM_SUBUNITS_PER_REFERENCE_UNIT,
      threshold:
        pool.jackpotThreshold / USDM_SUBUNITS_PER_REFERENCE_UNIT,
      status: pool.lockedJackpot > 0n ? 'locked' : 'inactive',
      cycle: 0n,
    },
  }

  validateEconomicStateV3(state)
  return state
}

function applyImmortalReveal(
  pre: EconomicStateV3,
  classId: bigint,
  payoutReferenceUnits: bigint,
): EconomicStateV3 {
  const classes = pre.classes.map((c) => {
    if (c.classId !== classId) return c
    if (c.unresolved <= 0n) throw new Error('reveal requires an unresolved ticket')
    const price = [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n][Number(classId)]
    return {
      ...c,
      unresolved: c.unresolved - 1n,
      exposure: price * (c.unresolved - 1n),
    }
  })

  if (!classes.some((c) => c.classId === classId)) {
    throw new Error('reveal class not present')
  }

  return {
    ...pre,
    crystallizedLiabilities:
      pre.crystallizedLiabilities + payoutReferenceUnits,
    unresolvedReserve:
      pre.unresolvedReserve - [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n][Number(classId)],
    unresolvedTicketCount: pre.unresolvedTicketCount - 1n,
    classes,
  }
}

describe('IMMORTAL / PRE-RICH Reveal conformance', () => {
  it('maps a concrete B1 Reveal observation to the canonical V3 post-state', () => {
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
      { classId: 0n, priceUsdm: 100n, issued: 1n, unresolved: 1n },
      { classId: 1n, priceUsdm: 200n, issued: 1n, unresolved: 1n },
      { classId: 2n, priceUsdm: 300n, issued: 1n, unresolved: 1n },
    ]

    const pre = projectObservedB1ToV3(prePool, preTickets)
    const expected = applyImmortalReveal(pre, 1n, 10n)

    const postPool: B1PoolObservation = {
      ...prePool,
      pendingLiabilities: 1_500n,
      unresolvedReserve: 400n,
      unresolvedTicketCount: 2n,
    }

    const postTickets: TicketObservation[] = [
      { classId: 0n, priceUsdm: 100n, issued: 1n, unresolved: 1n },
      { classId: 1n, priceUsdm: 200n, issued: 1n, unresolved: 0n },
      { classId: 2n, priceUsdm: 300n, issued: 1n, unresolved: 1n },
    ]

    const observed = projectObservedB1ToV3(postPool, postTickets)

    expect(observed).toEqual(expected)
    validateEconomicStateV3(observed)
  })

  it('rejects a pool observation whose aggregate reserve disagrees with ticket composition', () => {
    const pool: B1PoolObservation = {
      totalLiquidity: 100_000n,
      pendingLiabilities: 0n,
      unresolvedReserve: 250n,
      unresolvedTicketCount: 2n,
      lockedJackpot: 0n,
      jackpotThreshold: 10_000n,
      suspendedClasses: 0n,
    }

    const tickets: TicketObservation[] = [
      { classId: 0n, priceUsdm: 100n, issued: 1n, unresolved: 1n },
      { classId: 1n, priceUsdm: 200n, issued: 1n, unresolved: 1n },
    ]

    expect(() => projectObservedB1ToV3(pool, tickets)).toThrow(
      'unresolvedReserve does not equal class decomposition',
    )
  })

  it('rejects a non-canonical USDM price at the adapter boundary', () => {
    expect(() =>
      projectObservedB1ToV3(
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
})
