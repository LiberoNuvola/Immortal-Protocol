import { describe, expect, it } from 'vitest'
import { projectObservedPreRichPublicState } from '../PreRichPublicStateProjection'

const state = {
  crystallizedLiabilities: 0n,
  unresolvedReserve: 100n,
  unresolvedTicketCount: 1n,
  safetyCapital: 1000n,
  reserveProtection: 100n,
  mandatoryFutureCosts: 50n,
  classes: Array.from({ length: 8 }, (_, i) => ({
    classId: BigInt(i),
    issued: 0n,
    unresolved: 0n,
    exposure: 0n,
    cap: 100n,
    saleable: true,
  })),
  control: {
    currentActiveClass: 3n,
    highestClassEverActivated: 4n,
  },
  jackpot: {
    lockedAmount: 0n,
    threshold: 1000n,
    status: 'inactive' as const,
    cycle: 0n,
  },
}

describe('PRE-RICH public state projection', () => {
  it('projects observed class state without deriving modes or actions', () => {
    const snapshot = projectObservedPreRichPublicState(
      state,
      {
        activeClassEvidenceRef: 'cardano:tx/abc#0',
        observedAt: '2026-09-26T08:00:00Z',
        roundId: '185',
      },
      [{
        action: 'BUY_TICKET',
        state: 'AVAILABLE',
        available: true,
        reason: 'Authoritative sale declaration.',
        observedAt: '2026-09-26T08:00:00Z',
      }],
      [{
        mode: 'ACTIVE_CLASS',
        active: true,
        status: 'ACTIVE',
        reason: 'Authoritatively declared.',
        evidenceRef: 'cardano:tx/abc#0',
        observedAt: '2026-09-26T08:00:00Z',
      }],
    )

    expect(snapshot.activeClass?.classId).toBe(3)
    expect(snapshot.activeClass?.roundId).toBe('185')
    expect(snapshot.actions[0]?.action).toBe('BUY_TICKET')
    expect(snapshot.modes[0]?.mode).toBe('ACTIVE_CLASS')
  })

  it('fails closed when class evidence is absent', () => {
    expect(() => projectObservedPreRichPublicState(
      state,
      { activeClassEvidenceRef: '', observedAt: '2026-09-26T08:00:00Z' },
      [],
      [],
    )).toThrow('active class evidence reference is required')
  })
})
