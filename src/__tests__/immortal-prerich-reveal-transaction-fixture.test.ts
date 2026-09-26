/**
 * P2.8-A — PRE-RICH Reveal transaction boundary fixture
 *
 * Purpose:
 *   Bridge the already-closed P2.6/P2.7 Cardano observation model to the
 *   concrete PRE-RICH Reveal transaction semantics in src/gameFlow.ts.
 *
 * This is a deterministic transaction-boundary fixture.
 * It does NOT submit a Cardano transaction and does NOT prove Plutus execution.
 *
 * The fixture mirrors the concrete Reveal changes implemented by PRE-RICH:
 *
 *   Prize UTxO:
 *     Pending -> Revealed
 *     pdPrizeAmount := computed payout
 *     pdResult      := computed result
 *     pdPrizeTier   := computed tier
 *
 *   B1PrizePool UTxO:
 *     ppPendingLiabilities += prizeAmount
 *     ppUnresolvedReserve  -= priceUsdm
 *     ppUnresolvedTicketCount -= 1
 *
 * The resulting concrete economic observation is then projected through the
 * existing Cardano -> IMMORTAL V3 adapter and compared with the expected
 * IMMORTAL Reveal transition.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  expectedRevealPostState,
  projectCardanoToImmortalV3,
} from '../../PRE-RICH/profile/PreRichCardanoObservationProjection'

const USDM_SUBUNITS_PER_REFERENCE_UNIT = 100n

type PrizeStatus = 'Pending' | 'Revealed'

type PrizeDatumFixture = {
  ticketId: string
  priceUsdm: bigint
  prizeAmountUsdm: bigint
  status: PrizeStatus
  resultHex: string
  tier: bigint
}

type B1PrizePoolDatumFixture = {
  totalLiquidityUsdm: bigint
  pendingLiabilitiesUsdm: bigint
  unresolvedReserveUsdm: bigint
  unresolvedTicketCount: bigint
  lockedJackpotUsdm: bigint
  jackpotThresholdUsdm: bigint
}

type ScriptUtxoFixture = {
  ref: string
  datum: PrizeDatumFixture | B1PrizePoolDatumFixture
}

type RevealTransactionFixture = {
  consumed: {
    prize: ScriptUtxoFixture
    b1PrizePool: ScriptUtxoFixture
  }
  produced: {
    prize: ScriptUtxoFixture
    b1PrizePool: ScriptUtxoFixture
  }
  reveal: {
    ticketId: string
    priceUsdm: bigint
    prizeAmountUsdm: bigint
    classId: bigint
  }
}

/**
 * This fixture intentionally uses the same semantic values as the current
 * P2.6 replay, but now represents them at the PRE-RICH transaction boundary:
 *
 *   200 USDM sub-units = 2 reference units = IMMORTAL class 1
 *   1000 USDM sub-units = 10 reference units of crystallised liabilities
 */
function makeRevealFixture(): RevealTransactionFixture {
  const prizePre: PrizeDatumFixture = {
    ticketId: 'ticket-2',
    priceUsdm: 200n,
    prizeAmountUsdm: 0n,
    status: 'Pending',
    resultHex: '',
    tier: 0n,
  }

  const poolPre: B1PrizePoolDatumFixture = {
    totalLiquidityUsdm: 100_000n,
    pendingLiabilitiesUsdm: 500n,
    unresolvedReserveUsdm: 600n,
    unresolvedTicketCount: 3n,
    lockedJackpotUsdm: 0n,
    jackpotThresholdUsdm: 10_000n,
  }

  const prizePost: PrizeDatumFixture = {
    ...prizePre,
    prizeAmountUsdm: 1_000n,
    status: 'Revealed',
    resultHex: 'deadbeef',
    tier: 3n,
  }

  const poolPost: B1PrizePoolDatumFixture = {
    ...poolPre,
    pendingLiabilitiesUsdm: 1_500n,
    unresolvedReserveUsdm: 400n,
    unresolvedTicketCount: 2n,
  }

  return {
    consumed: {
      prize: {
        ref: 'prize-utxo-pre',
        datum: prizePre,
      },
      b1PrizePool: {
        ref: 'b1-pool-utxo-pre',
        datum: poolPre,
      },
    },
    produced: {
      prize: {
        ref: 'prize-utxo-post',
        datum: prizePost,
      },
      b1PrizePool: {
        ref: 'b1-pool-utxo-post',
        datum: poolPost,
      },
    },
    reveal: {
      ticketId: 'ticket-2',
      priceUsdm: 200n,
      prizeAmountUsdm: 1_000n,
      classId: 1n,
    },
  }
}

function unresolvedTicketsAfterReveal() {
  return [
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
  ]
}

function authoritativeClasses() {
  return [
    { classId: 0n, issued: 1n, cap: 1n, saleable: true },
    { classId: 1n, issued: 1n, cap: 1n, saleable: true },
    { classId: 2n, issued: 1n, cap: 1n, saleable: true },
    { classId: 3n, issued: 1n, cap: 1n, saleable: true },
    { classId: 4n, issued: 1n, cap: 1n, saleable: true },
    { classId: 5n, issued: 1n, cap: 1n, saleable: true },
    { classId: 6n, issued: 1n, cap: 1n, saleable: true },
    { classId: 7n, issued: 1n, cap: 1n, saleable: true },
  ]
}

describe('P2.8-A — PRE-RICH Reveal transaction boundary', () => {
  test('fixture consumes Prize + B1PrizePool and recreates both state UTxOs', () => {
    const fixture = makeRevealFixture()

    assert.equal(fixture.consumed.prize.ref, 'prize-utxo-pre')
    assert.equal(fixture.consumed.b1PrizePool.ref, 'b1-pool-utxo-pre')

    assert.equal(fixture.produced.prize.ref, 'prize-utxo-post')
    assert.equal(fixture.produced.b1PrizePool.ref, 'b1-pool-utxo-post')
  })

  test('PrizeDatum boundary records Pending -> Revealed and freezes the payout', () => {
    const fixture = makeRevealFixture()

    const pre = fixture.consumed.prize.datum as PrizeDatumFixture
    const post = fixture.produced.prize.datum as PrizeDatumFixture

    assert.equal(pre.priceUsdm, 200n)
    assert.equal(pre.status, 'Pending')
    assert.equal(pre.prizeAmountUsdm, 0n)

    assert.equal(post.priceUsdm, 200n)
    assert.equal(post.status, 'Revealed')
    assert.equal(post.prizeAmountUsdm, 1_000n)
    assert.equal(post.tier, 3n)
    assert.equal(post.resultHex, 'deadbeef')
  })

  test('B1PrizePool boundary applies the exact Reveal economic deltas', () => {
    const fixture = makeRevealFixture()

    const pre = fixture.consumed.b1PrizePool.datum as B1PrizePoolDatumFixture
    const post = fixture.produced.b1PrizePool.datum as B1PrizePoolDatumFixture

    assert.equal(
      post.pendingLiabilitiesUsdm,
      pre.pendingLiabilitiesUsdm + fixture.reveal.prizeAmountUsdm,
    )

    assert.equal(
      post.unresolvedReserveUsdm,
      pre.unresolvedReserveUsdm - fixture.reveal.priceUsdm,
    )

    assert.equal(
      post.unresolvedTicketCount,
      pre.unresolvedTicketCount - 1n,
    )
  })

  test('the PRE-RICH transaction boundary maps the revealed ticket to IMMORTAL class 1', () => {
    const fixture = makeRevealFixture()

    assert.equal(
      fixture.reveal.priceUsdm / USDM_SUBUNITS_PER_REFERENCE_UNIT,
      2n,
    )
    assert.equal(fixture.reveal.classId, 1n)
  })

  test('post-transaction Cardano observation projects to the exact IMMORTAL Reveal result', () => {
    const fixture = makeRevealFixture()

    const preState = projectCardanoToImmortalV3({
      safetyCapital: 0n,
      reserveProtection: 0n,
      mandatoryFutureCosts: 0n,
      currentActiveClass: 0n,
      highestClassEverActivated: 0n,
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
          ticketId: fixture.reveal.ticketId,
          priceUsdm: fixture.reveal.priceUsdm,
          status: 'BeaconReady' as const,
        },
        {
          ticketId: 'ticket-3',
          priceUsdm: 300n,
          status: 'Pending' as const,
        },
      ],
      authoritativeClasses: authoritativeClasses(),
    })

    const expectedPostState = expectedRevealPostState(
      preState,
      fixture.reveal.classId,
      fixture.reveal.prizeAmountUsdm /
        USDM_SUBUNITS_PER_REFERENCE_UNIT,
    )

    const observedPostState = projectCardanoToImmortalV3({
      safetyCapital: 0n,
      reserveProtection: 0n,
      mandatoryFutureCosts: 0n,
      currentActiveClass: 0n,
      highestClassEverActivated: 0n,
      pool: {
        pendingLiabilitiesUsdm:
          (fixture.produced.b1PrizePool.datum as B1PrizePoolDatumFixture)
            .pendingLiabilitiesUsdm,
        unresolvedReserveUsdm:
          (fixture.produced.b1PrizePool.datum as B1PrizePoolDatumFixture)
            .unresolvedReserveUsdm,
        unresolvedTicketCount:
          (fixture.produced.b1PrizePool.datum as B1PrizePoolDatumFixture)
            .unresolvedTicketCount,
        lockedJackpotUsdm: 0n,
        jackpotThresholdUsdm: 10_000n,
      },
      tickets: unresolvedTicketsAfterReveal(),
      authoritativeClasses: authoritativeClasses(),
    })

    assert.deepEqual(observedPostState, expectedPostState)
  })

  test('the concrete economic deltas are not silently absorbed by the adapter', () => {
    const fixture = makeRevealFixture()

    const prePool = fixture.consumed.b1PrizePool
      .datum as B1PrizePoolDatumFixture
    const postPool = fixture.produced.b1PrizePool
      .datum as B1PrizePoolDatumFixture

    const expectedLiabilityDelta =
      fixture.reveal.prizeAmountUsdm /
      USDM_SUBUNITS_PER_REFERENCE_UNIT

    const expectedReserveDelta =
      fixture.reveal.priceUsdm /
      USDM_SUBUNITS_PER_REFERENCE_UNIT

    assert.equal(
      (postPool.pendingLiabilitiesUsdm -
        prePool.pendingLiabilitiesUsdm) /
        USDM_SUBUNITS_PER_REFERENCE_UNIT,
      expectedLiabilityDelta,
    )

    assert.equal(
      (prePool.unresolvedReserveUsdm -
        postPool.unresolvedReserveUsdm) /
        USDM_SUBUNITS_PER_REFERENCE_UNIT,
      expectedReserveDelta,
    )

    assert.equal(
      prePool.unresolvedTicketCount -
        postPool.unresolvedTicketCount,
      1n,
    )
  })

  test('corrupting the concrete post-state breaks IMMORTAL projection', () => {
    const fixture = makeRevealFixture()

    const postPool = fixture.produced.b1PrizePool
      .datum as B1PrizePoolDatumFixture

    assert.throws(() =>
      projectCardanoToImmortalV3({
        safetyCapital: 0n,
        reserveProtection: 0n,
        mandatoryFutureCosts: 0n,
        pool: {
          pendingLiabilitiesUsdm: postPool.pendingLiabilitiesUsdm,
          unresolvedReserveUsdm: 500n,
          unresolvedTicketCount: postPool.unresolvedTicketCount,
          lockedJackpotUsdm: 0n,
          jackpotThresholdUsdm: 10_000n,
        },
        tickets: unresolvedTicketsAfterReveal(),
        authoritativeClasses: authoritativeClasses(),
      }),
    )
  })

  test('P2.8-A remains a fixture, not an emulator claim', () => {
    const fixture = makeRevealFixture()

    assert.equal(fixture.consumed.prize.ref !== fixture.produced.prize.ref, true)
    assert.equal(
      fixture.consumed.b1PrizePool.ref !== fixture.produced.b1PrizePool.ref,
      true,
    )

    // No provider, wallet, signer, node or emulator is invoked here.
    // P2.8-B is the execution-backed phase.
    assert.equal(true, true)
  })
})
