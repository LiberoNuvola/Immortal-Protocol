import { describe, expect, it } from 'vitest'
import {
  projectCardanoToImmortalV3,
  expectedRevealPostState,
  PRE_RICH_CANONICAL_PRICES,
  type ProjectionInput,
} from './PreRichCardanoObservationProjection'

function baseInput(overrides: Partial<ProjectionInput> = {}): ProjectionInput {
  const base: ProjectionInput = {
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
      cap: 10n,
      saleable: true,
    })),
    safetyCapital: 11n,
    reserveProtection: 13n,
    mandatoryFutureCosts: 17n,
    currentActiveClass: 1n,
    highestClassEverActivated: 2n,
  }
  return { ...base, ...overrides }
}

describe('B6 / PC-05 Cardano ↔ V3 monetary scale conformance', () => {
  it('normalizes B1 USDM sub-units into IMMORTAL reference units exactly', () => {
    const state = projectCardanoToImmortalV3(baseInput())

    expect(state.crystallizedLiabilities).toBe(5n)
    expect(state.unresolvedReserve).toBe(3n)
    expect(state.unresolvedTicketCount).toBe(2n)
    expect(state.jackpot.lockedAmount).toBe(10n)
    expect(state.jackpot.threshold).toBe(25n)
    expect(state.safetyCapital).toBe(11n)
    expect(state.reserveProtection).toBe(13n)
    expect(state.mandatoryFutureCosts).toBe(17n)
    expect(state.classes[0].unresolved).toBe(1n)
    expect(state.classes[0].exposure).toBe(1n)
    expect(state.classes[1].unresolved).toBe(1n)
    expect(state.classes[1].exposure).toBe(2n)
  })

  it('rejects an observed aggregate that is not exactly representable in reference units', () => {
    const input = baseInput()
    expect(() =>
      projectCardanoToImmortalV3({
        ...input,
        pool: {
          ...input.pool,
          pendingLiabilitiesUsdm: 501n,
        },
      }),
    ).toThrow('pendingLiabilitiesUsdm is not representable in whole IMMORTAL reference units')
  })

  it('preserves the normalized scale through the canonical Reveal post-state transition', () => {
    const pre = projectCardanoToImmortalV3(baseInput())
    const post = expectedRevealPostState(pre, 1n, 250n)
    expect(post.crystallizedLiabilities).toBe(255n)
    expect(post.unresolvedReserve).toBe(1n)
    expect(post.unresolvedTicketCount).toBe(1n)
    expect(post.classes[1].unresolved).toBe(0n)
    expect(post.classes[1].exposure).toBe(0n)
  })
})
