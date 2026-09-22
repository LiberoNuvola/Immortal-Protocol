import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  expectedRevealPostState,
  projectCardanoToImmortalV3,
} from '../../PRE-RICH/profile/PreRichCardanoObservationProjection'

const USDM_SUBUNITS_PER_REFERENCE_UNIT = 100n

function preInput() {
  return {
    safetyCapital: 0n,
    reserveProtection: 0n,
    mandatoryFutureCosts: 0n,

    pool: {
      pendingLiabilitiesUsdm: 500n,
      unresolvedReserveUsdm: 600n,
      unresolvedTicketCount: 3n,
      lockedJackpotUsdm: 0n,
      jackpotThresholdUsdm: 10_000n,
    },

    tickets: [
      {
        ticketId: 'ticket-1',
        priceUsdm: 100n,
        status: 'Pending' as const,
      },
      {
        ticketId: 'ticket-2',
        priceUsdm: 200n,
        status: 'BeaconReady' as const,
      },
      {
        ticketId: 'ticket-3',
        priceUsdm: 300n,
        status: 'Pending' as const,
      },
    ],

    authoritativeClasses: [
      { classId: 0n, issued: 1n, cap: 1n, saleable: true },
      { classId: 1n, issued: 1n, cap: 1n, saleable: true },
      { classId: 2n, issued: 1n, cap: 1n, saleable: true },
      { classId: 3n, issued: 1n, cap: 1n, saleable: true },
      { classId: 4n, issued: 1n, cap: 1n, saleable: true },
      { classId: 5n, issued: 1n, cap: 1n, saleable: true },
      { classId: 6n, issued: 1n, cap: 1n, saleable: true },
      { classId: 7n, issued: 1n, cap: 1n, saleable: true },
    ],
  }
}

describe('P2.6 — Cardano Reveal replay conformance', () => {
  test('projects a concrete B1 observation into the expected V3 pre-state', () => {
    const state = projectCardanoToImmortalV3(preInput())

    assert.equal(state.crystallizedLiabilities, 5n)
    assert.equal(state.unresolvedReserve, 6n)
    assert.equal(state.unresolvedTicketCount, 3n)

    assert.equal(state.classes.length, 8)

    assert.deepEqual(
      state.classes.slice(0, 3).map((c) => ({
        classId: c.classId,
        issued: c.issued,
        unresolved: c.unresolved,
        exposure: c.exposure,
        cap: c.cap,
        saleable: c.saleable,
      })),
      [
        {
          classId: 0n,
          issued: 1n,
          unresolved: 1n,
          exposure: 1n,
          cap: 1n,
          saleable: true,
        },
        {
          classId: 1n,
          issued: 1n,
          unresolved: 1n,
          exposure: 2n,
          cap: 1n,
          saleable: true,
        },
        {
          classId: 2n,
          issued: 1n,
          unresolved: 1n,
          exposure: 3n,
          cap: 1n,
          saleable: true,
        },
      ],
    )
  })

  test('computes the expected Reveal post-state for class 1', () => {
    const preState = projectCardanoToImmortalV3(preInput())

    const postState = expectedRevealPostState(
      preState,
      1n,
      10n,
    )

    assert.equal(postState.crystallizedLiabilities, 15n)
    assert.equal(postState.unresolvedReserve, 4n)
    assert.equal(postState.unresolvedTicketCount, 2n)

    const revealedClass = postState.classes.find(
      (c) => c.classId === 1n,
    )

    assert.ok(revealedClass)
    assert.equal(revealedClass.unresolved, 0n)
    assert.equal(revealedClass.exposure, 0n)
  })

  test('replays the concrete Cardano post-observation and gets exact V3 equality', () => {
    const preState = projectCardanoToImmortalV3(preInput())

    const expectedPostState = expectedRevealPostState(
      preState,
      1n,
      10n,
    )

    const postInput = {
      safetyCapital: 0n,
      reserveProtection: 0n,
      mandatoryFutureCosts: 0n,
      pool: {
        pendingLiabilitiesUsdm: 1500n,
        unresolvedReserveUsdm: 400n,
        unresolvedTicketCount: 2n,
        lockedJackpotUsdm: 0n,
        jackpotThresholdUsdm: 10_000n,
      },

      tickets: [
        {
          ticketId: 'ticket-1',
          priceUsdm: 100n,
          status: 'Pending' as const,
        },
        {
          ticketId: 'ticket-3',
          priceUsdm: 300n,
          status: 'Pending' as const,
        },
      ],

      authoritativeClasses: [
        { classId: 0n, issued: 1n, cap: 1n, saleable: true },
        { classId: 1n, issued: 1n, cap: 1n, saleable: true },
        { classId: 2n, issued: 1n, cap: 1n, saleable: true },
      ],
    }

    const observedPostState = projectCardanoToImmortalV3(
      postInput,
    )

    assert.deepEqual(
      observedPostState,
      expectedPostState,
    )
  })

  test('rejects a post-observation with an incorrect reserve', () => {
    const input = preInput()

    input.pool.unresolvedReserveUsdm = 500n

    assert.throws(
      () => projectCardanoToImmortalV3(input),
      /B1 unresolved reserve mismatch/,
    )
  })

  test('rejects a non-canonical Cardano ticket price', () => {
    const input = preInput()

    input.tickets[1].priceUsdm = 150n

    assert.throws(
      () => projectCardanoToImmortalV3(input),
      /non-canonical/,
    )
  })

  test('documents the unit boundary used by the replay fixture', () => {
    assert.equal(
      100n,
      USDM_SUBUNITS_PER_REFERENCE_UNIT,
    )

    assert.equal(
      100n / USDM_SUBUNITS_PER_REFERENCE_UNIT,
      1n,
    )
  })
})

