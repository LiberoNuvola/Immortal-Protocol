import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PRE_RICH_CANONICAL_PRICES,
  projectCardanoToImmortalV3,
  type AuthoritativeClassState,
} from '../../PRE-RICH/src/PreRichCardanoObservationProjection'

/**
 * Observation-boundary conformance only.
 *
 * The Cardano observation layer produces a canonical PRE-RICH V3 state.
 * UniversalEconomicKernel remains the economic authority and is tested in
 * Haskell through projectPreRichState/projectionBoundaryEquivalent.
 *
 * This suite therefore does NOT re-implement RawSurplus or the universal
 * kernel. It verifies that Cardano-observed inputs preserve the complete
 * protected-capital decomposition needed by that existing bridge.
 */

const classes: AuthoritativeClassState[] = PRE_RICH_CANONICAL_PRICES.map(
  (_, classId) => ({
    classId: BigInt(classId),
    issued: 10_000n,
    cap: 20_000n,
    saleable: true,
  }),
)

function ticketsForClass0(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ticketId: `class0-${i}`,
    priceUsdm: 100n,
    status: 'Pending' as const,
  }))
}

function project(input: {
  liabilities: bigint
  tickets: ReturnType<typeof ticketsForClass0>
  safety: bigint
  reserveProtection: bigint
  futureCosts: bigint
}) {
  const reserve = input.tickets.reduce((sum, ticket) => sum + ticket.priceUsdm, 0n)

  return projectCardanoToImmortalV3({
    safetyCapital: input.safety,
    reserveProtection: input.reserveProtection,
    mandatoryFutureCosts: input.futureCosts,
    currentActiveClass: 0n,
    highestClassEverActivated: 0n,
    pool: {
      pendingLiabilitiesUsdm: input.liabilities * 100n,
      unresolvedReserveUsdm: reserve,
      unresolvedTicketCount: BigInt(input.tickets.length),
      lockedJackpotUsdm: 0n,
      jackpotThresholdUsdm: 10_000n,
    },
    tickets: input.tickets,
    authoritativeClasses: classes,
  })
}

function protectedComponents(state: ReturnType<typeof project>) {
  return {
    crystallizedLiabilities: state.crystallizedLiabilities,
    worstCaseExposure: state.classes.reduce(
      (sum, c) => sum + 500n * c.exposure,
      0n,
    ),
    safetyCapital: state.safetyCapital,
    reserveProtection: state.reserveProtection,
    mandatoryFutureCosts: state.mandatoryFutureCosts,
  }
}

test('Cardano observation preserves the V01 protected-capital boundary decomposition', () => {
  const state = project({
    liabilities: 0n,
    tickets: ticketsForClass0(1),
    safety: 200n,
    reserveProtection: 0n,
    futureCosts: 0n,
  })

  assert.deepEqual(protectedComponents(state), {
    crystallizedLiabilities: 0n,
    worstCaseExposure: 500n,
    safetyCapital: 200n,
    reserveProtection: 0n,
    mandatoryFutureCosts: 0n,
  })
})

test('Cardano observation preserves V05 complete protected-capital decomposition', () => {
  const state = project({
    liabilities: 1000n,
    tickets: ticketsForClass0(12),
    safety: 500n,
    reserveProtection: 500n,
    futureCosts: 500n,
  })

  assert.deepEqual(protectedComponents(state), {
    crystallizedLiabilities: 1000n,
    worstCaseExposure: 6000n,
    safetyCapital: 500n,
    reserveProtection: 500n,
    mandatoryFutureCosts: 500n,
  })
})

test('Cardano observation preserves the V03 insolvent fixture without inventing a solvency result', () => {
  const state = project({
    liabilities: 0n,
    tickets: ticketsForClass0(1),
    safety: 500n,
    reserveProtection: 0n,
    futureCosts: 0n,
  })

  const components = protectedComponents(state)
  assert.equal(
    components.worstCaseExposure + components.safetyCapital,
    1000n,
  )

  // Solvency is intentionally NOT evaluated here. That remains the
  // UniversalEconomicKernel boundary in the Haskell conformance suite.
})

test('Cardano observation preserves V06 locality inputs without interpreting discretionary allocation', () => {
  const state = project({
    liabilities: 0n,
    tickets: ticketsForClass0(19),
    safety: 0n,
    reserveProtection: 0n,
    futureCosts: 0n,
  })

  const components = protectedComponents(state)
  assert.equal(components.worstCaseExposure, 9500n)
})

test('Cardano observation preserves V07 state-locality as distinct V3 states', () => {
  const low = project({
    liabilities: 0n,
    tickets: ticketsForClass0(4),
    safety: 0n,
    reserveProtection: 0n,
    futureCosts: 0n,
  })
  const high = project({
    liabilities: 0n,
    tickets: ticketsForClass0(9),
    safety: 0n,
    reserveProtection: 0n,
    futureCosts: 0n,
  })

  assert.notDeepEqual(protectedComponents(low), protectedComponents(high))
  assert.equal(protectedComponents(low).worstCaseExposure, 2000n)
  assert.equal(protectedComponents(high).worstCaseExposure, 4500n)
})


test('Cardano observation rejects corrupted aggregate reserve instead of repairing it', () => {
  assert.throws(
    () =>
      projectCardanoToImmortalV3({
        safetyCapital: 0n,
        reserveProtection: 0n,
        mandatoryFutureCosts: 0n,
        currentActiveClass: 0n,
        highestClassEverActivated: 0n,
        pool: {
          pendingLiabilitiesUsdm: 0n,
          unresolvedReserveUsdm: 99n,
          unresolvedTicketCount: 1n,
          lockedJackpotUsdm: 0n,
          jackpotThresholdUsdm: 10_000n,
        },
        tickets: [
          { ticketId: 'bad', priceUsdm: 100n, status: 'Pending' },
        ],
        authoritativeClasses: classes,
      }),
    /unresolved reserve mismatch/,
  )
})
