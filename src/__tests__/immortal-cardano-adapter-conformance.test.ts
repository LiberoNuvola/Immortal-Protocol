/**
 * IMMORTAL / Cardano Adapter — P2.7 extended conformance
 *
 * This suite is deliberately broader than the P2.6 single Reveal replay.
 * It tests:
 *   - all 8 canonical class mappings;
 *   - complete V3 field provenance;
 *   - permutation invariance;
 *   - zero-unresolved class preservation;
 *   - mutation rejection;
 *   - Reveal / Issue / Claim / Expire boundary fixtures;
 *   - multi-step state-machine traces.
 *
 * It is executable evidence for the Adapter refinement boundary.
 * It is not a replacement for live Cardano/emulator execution.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  PRE_RICH_CANONICAL_PRICES,
  USDM_SUBUNITS_PER_REFERENCE_UNIT,
  expectedRevealPostState,
  projectCardanoToImmortalV3,
  type AuthoritativeClassState,
  type ObservedB1Pool,
  type ObservedUnresolvedTicket,
} from '../../PRE-RICH/profile/PreRichCardanoObservationProjection'

type Fixture = {
  pool: ObservedB1Pool
  tickets: ObservedUnresolvedTicket[]
  authoritativeClasses: AuthoritativeClassState[]
  safetyCapital: bigint
  reserveProtection: bigint
  mandatoryFutureCosts: bigint
  currentActiveClass: bigint
  highestClassEverActivated: bigint
}

const pricesUsdm = PRE_RICH_CANONICAL_PRICES.map(
  (price) => price * USDM_SUBUNITS_PER_REFERENCE_UNIT,
)

function allClasses(issued = 1n): AuthoritativeClassState[] {
  return PRE_RICH_CANONICAL_PRICES.map((_, i) => ({
    classId: BigInt(i),
    issued,
    cap: 10n,
    saleable: true,
  }))
}

function makeFixture(
  tickets: ObservedUnresolvedTicket[],
  overrides: Partial<Fixture> = {},
): Fixture {
  const reserve = tickets.reduce((sum, t) => sum + t.priceUsdm, 0n)

  return {
    pool: {
      pendingLiabilitiesUsdm: 500n,
      unresolvedReserveUsdm: reserve,
      unresolvedTicketCount: BigInt(tickets.length),
      lockedJackpotUsdm: 0n,
      jackpotThresholdUsdm: 10_000n,
    },
    tickets,
    authoritativeClasses: allClasses(),
    safetyCapital: 7n,
    reserveProtection: 11n,
    mandatoryFutureCosts: 13n,
    currentActiveClass: 2n,
    highestClassEverActivated: 6n,
    ...overrides,
  }
}

function project(fixture: Fixture) {
  return projectCardanoToImmortalV3(fixture)
}

function cloneTicket(
  ticket: ObservedUnresolvedTicket,
  changes: Partial<ObservedUnresolvedTicket>,
): ObservedUnresolvedTicket {
  return { ...ticket, ...changes }
}

describe('P2.7 — Cardano Adapter extended conformance', () => {
  it('maps every canonical IMMORTAL class to the exact Cardano unit boundary', () => {
    const tickets = pricesUsdm.map((priceUsdm, i) => ({
      ticketId: `class-${i}`,
      priceUsdm,
      status: 'Pending' as const,
    }))

    const state = project(
      makeFixture(tickets, {
        pool: {
          pendingLiabilitiesUsdm: 0n,
          unresolvedReserveUsdm: tickets.reduce(
            (sum, t) => sum + t.priceUsdm,
            0n,
          ),
          unresolvedTicketCount: 8n,
          lockedJackpotUsdm: 0n,
          jackpotThresholdUsdm: 10_000n,
        },
      }),
    )

    for (let i = 0; i < 8; i += 1) {
      const cls = state.classes[i]
      assert.equal(cls.classId, BigInt(i))
      assert.equal(cls.unresolved, 1n)
      assert.equal(cls.exposure, PRE_RICH_CANONICAL_PRICES[i])
      assert.equal(cls.issued, 1n)
    }
  })

  it('proves classId is the canonical price-table index, not the price itself', () => {
    const state = project(
      makeFixture([
        { ticketId: 'c0', priceUsdm: 100n, status: 'Pending' },
        { ticketId: 'c7', priceUsdm: 10_000n, status: 'Pending' },
      ], {
        pool: {
          pendingLiabilitiesUsdm: 0n,
          unresolvedReserveUsdm: 10_100n,
          unresolvedTicketCount: 2n,
          lockedJackpotUsdm: 0n,
          jackpotThresholdUsdm: 10_000n,
        },
      }),
    )

    assert.equal(state.classes[0].classId, 0n)
    assert.equal(state.classes[0].exposure, 1n)
    assert.equal(state.classes[7].classId, 7n)
    assert.equal(state.classes[7].exposure, 100n)
  })

  it('preserves every canonical V3 field with explicit provenance', () => {
    const fixture = makeFixture([
      { ticketId: 'c0', priceUsdm: 100n, status: 'Pending' },
      { ticketId: 'c3', priceUsdm: 500n, status: 'BeaconReady' },
    ])

    const state = project(fixture)

    assert.equal(state.crystallizedLiabilities, 5n)
    assert.equal(state.unresolvedReserve, 6n)
    assert.equal(state.unresolvedTicketCount, 2n)
    assert.equal(state.safetyCapital, 7n)
    assert.equal(state.reserveProtection, 11n)
    assert.equal(state.mandatoryFutureCosts, 13n)
    assert.equal(state.control.currentActiveClass, 2n)
    assert.equal(state.control.highestClassEverActivated, 6n)
    assert.equal(state.jackpot.lockedAmount, 0n)
    assert.equal(state.jackpot.threshold, 100n)
    assert.equal(state.jackpot.status, 'inactive')
    assert.equal(state.jackpot.cycle, 0n)

    // Crucially, classes with zero unresolved tickets are retained.
    assert.equal(state.classes.length, 8)
    assert.equal(state.classes[0].issued, 1n)
    assert.equal(state.classes[0].unresolved, 1n)
    assert.equal(state.classes[1].issued, 1n)
    assert.equal(state.classes[1].unresolved, 0n)
    assert.equal(state.classes[3].unresolved, 1n)
    assert.equal(state.classes[3].exposure, 5n)
  })

  it('is invariant under permutation of observed ticket order', () => {
    const tickets = [
      { ticketId: 'a', priceUsdm: 100n, status: 'Pending' as const },
      { ticketId: 'b', priceUsdm: 2_500n, status: 'BeaconReady' as const },
      { ticketId: 'c', priceUsdm: 10_000n, status: 'Pending' as const },
    ]

    const a = project(makeFixture(tickets))
    const b = project(makeFixture([...tickets].reverse()))

    assert.deepEqual(a, b)
  })

  it('preserves the declared unresolved-ticket status boundary', () => {
    const pending = [
      { ticketId: 'u', priceUsdm: 500n, status: 'Pending' as const },
    ]
    const beaconReady = [
      { ticketId: 'u', priceUsdm: 500n, status: 'BeaconReady' as const },
    ]

    assert.deepEqual(
      project(makeFixture(pending)),
      project(makeFixture(beaconReady)),
    )
  })

  it('rejects a single corrupted aggregate reserve', () => {
    const fixture = makeFixture([
      { ticketId: 'a', priceUsdm: 100n, status: 'Pending' },
      { ticketId: 'b', priceUsdm: 200n, status: 'Pending' },
    ])

    assert.throws(
      () =>
        project({
          ...fixture,
          pool: { ...fixture.pool, unresolvedReserveUsdm: 299n },
        }),
      /unresolved reserve mismatch/,
    )
  })

  it('rejects a single corrupted aggregate unresolved count', () => {
    const fixture = makeFixture([
      { ticketId: 'a', priceUsdm: 100n, status: 'Pending' },
      { ticketId: 'b', priceUsdm: 200n, status: 'Pending' },
    ])

    assert.throws(
      () =>
        project({
          ...fixture,
          pool: { ...fixture.pool, unresolvedTicketCount: 1n },
        }),
      /unresolved ticket count mismatch/,
    )
  })

  it('rejects every non-canonical price between canonical points', () => {
    for (const invalid of [50n, 150n, 400n, 700n, 1_500n, 2_600n]) {
      assert.throws(
        () =>
          project(
            makeFixture([
              {
                ticketId: `invalid-${invalid}`,
                priceUsdm: invalid,
                status: 'Pending',
              },
            ], {
              pool: {
                pendingLiabilitiesUsdm: 0n,
                unresolvedReserveUsdm: invalid,
                unresolvedTicketCount: 1n,
                lockedJackpotUsdm: 0n,
                jackpotThresholdUsdm: 10_000n,
              },
            }),
          ),
        /non-canonical/,
      )
    }
  })

  it('rejects missing or ambiguous authoritative class state', () => {
    const fixture = makeFixture([
      { ticketId: 'a', priceUsdm: 100n, status: 'Pending' },
    ])

    assert.throws(
      () =>
        project({
          ...fixture,
          authoritativeClasses: fixture.authoritativeClasses.filter(
            (c) => c.classId !== 0n,
          ),
        }),
      /(missing or ambiguous|unresolvedReserve does not equal class decomposition)/,
    )

    assert.throws(
      () =>
        project({
          ...fixture,
          authoritativeClasses: [
            ...fixture.authoritativeClasses,
            { classId: 0n, issued: 1n, cap: 10n, saleable: true },
          ],
        }),
      /missing or ambiguous|must contain exactly 8|cannot contain more than 8 canonical ticket classes/,
    )
  })

  it('detects a Reveal mutation in liabilities', () => {
    const preTickets = [
      { ticketId: 'c0', priceUsdm: 100n, status: 'Pending' as const },
      { ticketId: 'c1', priceUsdm: 200n, status: 'BeaconReady' as const },
      { ticketId: 'c2', priceUsdm: 300n, status: 'Pending' as const },
    ]

    const preFixture = makeFixture(preTickets)
    const pre = project(preFixture)
    const expected = expectedRevealPostState(pre, 1n, 10n)

    const postFixture = makeFixture(
      [preTickets[0], preTickets[2]],
      {
        pool: {
          pendingLiabilitiesUsdm: 1_500n,
          unresolvedReserveUsdm: 400n,
          unresolvedTicketCount: 2n,
          lockedJackpotUsdm: 0n,
          jackpotThresholdUsdm: 10_000n,
        },
      },
    )

    const observed = project(postFixture)
    assert.deepEqual(observed, expected)

    assert.throws(
      () =>
        project({
          ...postFixture,
          pool: {
            ...postFixture.pool,
            unresolvedReserveUsdm: 300n,
          },
        }),
      /unresolved reserve mismatch/,
    )
  })

  it('covers an Issue boundary fixture without losing class provenance', () => {
    const preTickets = [
      { ticketId: 'c0', priceUsdm: 100n, status: 'Pending' as const },
    ]

    const pre = project(makeFixture(preTickets))
    const post = project(
      makeFixture([
        ...preTickets,
        { ticketId: 'new-c7', priceUsdm: 10_000n, status: 'Pending' },
      ], {
        authoritativeClasses: allClasses().map((c) =>
          c.classId === 7n ? { ...c, issued: 2n } : c,
        ),
        pool: {
          pendingLiabilitiesUsdm: 500n,
          unresolvedReserveUsdm: 10_100n,
          unresolvedTicketCount: 2n,
          lockedJackpotUsdm: 0n,
          jackpotThresholdUsdm: 10_000n,
        },
      }),
    )

    assert.equal(post.unresolvedReserve - pre.unresolvedReserve, 100n)
    assert.equal(post.unresolvedTicketCount - pre.unresolvedTicketCount, 1n)
    assert.equal(post.classes[7].issued, 2n)
    assert.equal(post.classes[7].unresolved, 1n)
    assert.equal(post.classes[7].exposure, 100n)
  })

  it('covers a Claim boundary fixture as liability-only state change', () => {
    const tickets = [
      { ticketId: 'c0', priceUsdm: 100n, status: 'Pending' as const },
    ]

    const preFixture = makeFixture(tickets)
    const pre = project(preFixture)

    const post = project({
      ...preFixture,
      pool: {
        ...preFixture.pool,
        pendingLiabilitiesUsdm: 400n,
      },
    })

    assert.equal(pre.crystallizedLiabilities, 5n)
    assert.equal(post.crystallizedLiabilities, 4n)
    assert.equal(post.unresolvedReserve, pre.unresolvedReserve)
    assert.equal(post.unresolvedTicketCount, pre.unresolvedTicketCount)
    assert.deepEqual(post.classes, pre.classes)
  })

  it('covers an Expire boundary fixture as obligation dissolution', () => {
    const tickets = [
      { ticketId: 'c0', priceUsdm: 100n, status: 'Pending' as const },
      { ticketId: 'c3', priceUsdm: 500n, status: 'Pending' as const },
    ]

    const preFixture = makeFixture(tickets)
    const pre = project(preFixture)

    const post = project({
      ...preFixture,
      tickets: [tickets[1]],
      pool: {
        ...preFixture.pool,
        unresolvedReserveUsdm: 500n,
        unresolvedTicketCount: 1n,
      },
    })

    assert.equal(post.unresolvedReserve, 5n)
    assert.equal(post.unresolvedTicketCount, 1n)
    assert.equal(post.classes[0].unresolved, 0n)
    assert.equal(post.classes[0].exposure, 0n)
    assert.equal(post.crystallizedLiabilities, pre.crystallizedLiabilities)
  })

  it('preserves exact state through a multi-step Issue → Reveal → Claim → Expire trace', () => {
    const initialTickets = [
      { ticketId: 'c0', priceUsdm: 100n, status: 'Pending' as const },
      { ticketId: 'c1', priceUsdm: 200n, status: 'BeaconReady' as const },
    ]

    const s0Fixture = makeFixture(initialTickets)
    const s0 = project(s0Fixture)

    const s1Fixture = {
      ...s0Fixture,
      tickets: [
        ...initialTickets,
        { ticketId: 'c7', priceUsdm: 10_000n, status: 'Pending' as const },
      ],
      authoritativeClasses: allClasses().map((c) =>
        c.classId === 7n ? { ...c, issued: 2n } : c,
      ),
      pool: {
        ...s0Fixture.pool,
        unresolvedReserveUsdm: 10_300n,
        unresolvedTicketCount: 3n,
      },
    }
    const s1 = project(s1Fixture)

    assert.equal(s1.unresolvedReserve, s0.unresolvedReserve + 100n)
    assert.equal(s1.unresolvedTicketCount, 3n)

    const s2Expected = expectedRevealPostState(s1, 1n, 10n)
    const s2 = project({
      ...s1Fixture,
      tickets: s1Fixture.tickets.filter((t) => t.ticketId !== 'c1'),
      pool: {
        ...s1Fixture.pool,
        pendingLiabilitiesUsdm: 1_500n,
        unresolvedReserveUsdm: 10_100n,
        unresolvedTicketCount: 2n,
      },
    })
    assert.deepEqual(s2, s2Expected)

    const s3 = project({
      ...s1Fixture,
      tickets: s1Fixture.tickets.filter((t) => t.ticketId !== 'c1'),
      pool: {
        ...s1Fixture.pool,
        pendingLiabilitiesUsdm: 500n,
        unresolvedReserveUsdm: 10_100n,
        unresolvedTicketCount: 2n,
      },
    })
    assert.equal(s3.crystallizedLiabilities, 5n)
    assert.equal(s3.unresolvedReserve, s2.unresolvedReserve)
    assert.equal(s3.unresolvedTicketCount, s2.unresolvedTicketCount)

    const s4 = project({
      ...s1Fixture,
      tickets: s1Fixture.tickets.filter(
        (t) => t.ticketId !== 'c1' && t.ticketId !== 'c0',
      ),
      pool: {
        ...s1Fixture.pool,
        pendingLiabilitiesUsdm: 500n,
        unresolvedReserveUsdm: 10_000n,
        unresolvedTicketCount: 1n,
      },
    })
    assert.equal(s4.classes[0].unresolved, 0n)
    assert.equal(s4.classes[0].exposure, 0n)
    assert.equal(s4.crystallizedLiabilities, s3.crystallizedLiabilities)
  })
})


