import { describe, expect, it } from 'vitest'
import { projectCardanoToImmortalV3, PRE_RICH_CANONICAL_PRICES, type ProjectionInput } from '../../PRE-RICH/profile/PreRichCardanoObservationProjection'

function baseInput(): ProjectionInput {
  return {
    tickets: [
      { ticketId: 't0', priceUsdm: 100n, status: 'Pending' },
      { ticketId: 't1', priceUsdm: 200n, status: 'BeaconReady' },
    ],
    pool: {
      pendingLiabilitiesUsdm: 500n,
      unresolvedReserveUsdm: 300n,
      unresolvedTicketCount: 2n,
      lockedJackpotUsdm: 1_000n,
      jackpotThresholdUsdm: 2_500n,
    },
    authoritativeClasses: PRE_RICH_CANONICAL_PRICES.map((_price, index) => ({
      classId: BigInt(index),
      issued: index < 2 ? 1n : 0n,
      cap: 10n + BigInt(index),
      saleable: index !== 3,
    })),
    safetyCapital: 11n,
    reserveProtection: 13n,
    mandatoryFutureCosts: 17n,
    currentActiveClass: 1n,
    highestClassEverActivated: 3n,
  }
}

describe('B6 V3 ↔ Cardano projection correspondence boundary', () => {
  it('preserves every economically represented aggregate and every class field', () => {
    const state = projectCardanoToImmortalV3(baseInput())

    expect(state.crystallizedLiabilities).toBe(5n)
    expect(state.unresolvedReserve).toBe(3n)
    expect(state.unresolvedTicketCount).toBe(2n)
    expect(state.safetyCapital).toBe(11n)
    expect(state.reserveProtection).toBe(13n)
    expect(state.mandatoryFutureCosts).toBe(17n)
    expect(state.control).toEqual({ currentActiveClass: 1n, highestClassEverActivated: 3n })
    expect(state.jackpot).toEqual({
      lockedAmount: 10n,
      threshold: 25n,
      status: 'locked',
      cycle: 0n,
    })

    expect(state.classes).toHaveLength(8)
    expect(state.classes.map((c) => ({
      classId: c.classId,
      issued: c.issued,
      unresolved: c.unresolved,
      exposure: c.exposure,
      cap: c.cap,
      saleable: c.saleable,
    }))).toEqual(PRE_RICH_CANONICAL_PRICES.map((price, index) => ({
      classId: BigInt(index),
      issued: index < 2 ? 1n : 0n,
      unresolved: index < 2 ? 1n : 0n,
      exposure: price,
      cap: 10n + BigInt(index),
      saleable: index !== 3,
    })))
  })

  it('fails closed on omitted authoritative class coverage', () => {
    const input = baseInput()
    expect(() => projectCardanoToImmortalV3({
      ...input,
      authoritativeClasses: input.authoritativeClasses.slice(0, 7),
    })).toThrow('missing or ambiguous authoritative class state')
  })

  it('fails closed on a control state that cannot be ordered monotonically', () => {
    expect(() => projectCardanoToImmortalV3({
      ...baseInput(),
      currentActiveClass: 4n,
      highestClassEverActivated: 3n,
    })).toThrow('V3 current active class cannot exceed highest-ever activated class')
  })

  it('makes the non-equivalent B1 control/jackpot boundary explicit', () => {
    const state = projectCardanoToImmortalV3(baseInput())
    expect(state.control.currentActiveClass).toBe(1n)
    expect(state.control.highestClassEverActivated).toBe(3n)
    expect(state.jackpot.status).toBe('locked')
    expect(state.jackpot.cycle).toBe(0n)

    // B1PrizePoolDatum does not natively carry these V3 fields.
    // Therefore this projection is a correspondence boundary, not a proof
    // that the B1 datum itself authenticates control history or jackpot lifecycle.
    expect(Object.keys(state.control)).toEqual(['currentActiveClass', 'highestClassEverActivated'])
    expect(Object.keys(state.jackpot)).toEqual(['lockedAmount', 'threshold', 'status', 'cycle'])
  })
})
