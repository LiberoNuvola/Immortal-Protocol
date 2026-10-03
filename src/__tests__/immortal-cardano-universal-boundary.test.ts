import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  projectCardanoToImmortalV3,
  type AuthoritativeClassState,
} from '../../PRE-RICH/src/PreRichCardanoObservationProjection'

type Vector = {
  id: string
  eev?: bigint
  protectedCapital?: bigint
  decomposition?: {
    crystallizedLiabilities: bigint
    worstCaseExposure: bigint
    safetyCapital: bigint
    reserveProtection: bigint
    mandatoryFutureCosts: bigint
    additionalProtectedCapital: bigint
  }
  cases?: Array<{
    eev: bigint
    protectedCapital: bigint
    expectedRawSurplus: bigint
  }>
}

const classes: AuthoritativeClassState[] = Array.from(
  { length: 8 },
  (_, classId) => ({
    classId: BigInt(classId),
    issued: 0n,
    cap: 10_000n,
    saleable: true,
  }),
)

function projectProtectedComponents(vector: Vector) {
  const d = vector.decomposition
  const protectedCapital = vector.protectedCapital ?? 0n

  const input = {
    safetyCapital: d?.safetyCapital ?? protectedCapital,
    reserveProtection: d?.reserveProtection ?? 0n,
    mandatoryFutureCosts: d?.mandatoryFutureCosts ?? 0n,
    currentActiveClass: 0n,
    highestClassEverActivated: 0n,
    pool: {
      pendingLiabilitiesUsdm: (d?.crystallizedLiabilities ?? 0n) * 100n,
      unresolvedReserveUsdm: 0n,
      unresolvedTicketCount: 0n,
      lockedJackpotUsdm: 0n,
      jackpotThresholdUsdm: 10_000n,
    },
    tickets: [],
    authoritativeClasses: classes,
  }

  const state = projectCardanoToImmortalV3(input)

  return {
    crystallizedLiabilities: state.crystallizedLiabilities,
    safetyCapital: state.safetyCapital,
    reserveProtection: state.reserveProtection,
    mandatoryFutureCosts: state.mandatoryFutureCosts,
    // The Cardano adapter deliberately does not calculate RawSurplus here.
    // ProtectedCapital/RawSurplus remain UniversalEconomicKernel outputs.
  }
}

const vectors: Vector[] = [
  { id: 'V01', eev: 1000n, protectedCapital: 700n },
  { id: 'V02', eev: 1000n, protectedCapital: 1000n },
  { id: 'V03', eev: 900n, protectedCapital: 1000n },
  { id: 'V04', eev: 0n, protectedCapital: 0n },
  {
    id: 'V06',
    eev: 10_000n,
    protectedCapital: 9500n,
  },
]

test('Cardano adapter → universal normalization preserves settled protected-capital inputs', () => {
  for (const vector of vectors) {
    const normalized = projectProtectedComponents(vector)
    assert.equal(
      normalized.safetyCapital +
        normalized.reserveProtection +
        normalized.mandatoryFutureCosts +
        normalized.crystallizedLiabilities,
      vector.protectedCapital,
      vector.id,
    )
  }
})

test('Cardano adapter V07 locality cases remain distinct at the observation boundary', () => {
  const cases = [
    { eev: 5000n, protectedCapital: 2000n },
    { eev: 5000n, protectedCapital: 4500n },
  ]

  const normalized = cases.map((item) =>
    projectProtectedComponents({
      id: 'V07',
      eev: item.eev,
      protectedCapital: item.protectedCapital,
    }),
  )

  assert.notDeepEqual(normalized[0], normalized[1])
  assert.equal(
    normalized[0].safetyCapital,
    2000n,
  )
  assert.equal(
    normalized[1].safetyCapital,
    4500n,
  )
})
