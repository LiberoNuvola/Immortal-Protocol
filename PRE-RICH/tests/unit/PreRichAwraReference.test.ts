import { describe, expect, it } from 'vitest'
import {
  admitAwraCandidate,
  applyAwraProbabilityDeltas,
  awraBudgetAdmissible,
  computeAwraProbabilityDeltas,
  deriveAwraAlpha,
  evaluateAwraCandidate,
  evaluateAwraDistribution,
  generateRecovered55Candidates,
  selectAuthorizedAwraCandidate,
} from '../../src/PreRichAwraReference'

describe('PRE-RICH AWRA reference layer', () => {
  it('recovers the historical budget-to-probability transformation', () => {
    const deltas = computeAwraProbabilityDeltas(0.05, [
      { multiple: 1, weight: 0.4 },
      { multiple: 2, weight: 0.6 },
    ])

    expect(deltas).toHaveLength(2)
    expect(deltas[0]?.multiple).toBe(1)
    expect(deltas[0]?.probability).toBeCloseTo(0.02)
    expect(deltas[1]?.multiple).toBe(2)
    expect(deltas[1]?.probability).toBeCloseTo(0.015)

    const addedExpectedPayout = deltas.reduce(
      (sum, delta) => sum + delta.multiple * delta.probability,
      0,
    )
    expect(addedExpectedPayout).toBeCloseTo(0.05)
  })

  it('never admits an AWRA budget above RawSurplus', () => {
    expect(awraBudgetAdmissible(100, 100)).toBe(true)
    expect(awraBudgetAdmissible(100, 100.0001)).toBe(false)
  })

  it('derives alpha only from an already-admissible budget', () => {
    expect(deriveAwraAlpha(100, 25)).toBe(0.25)
    expect(deriveAwraAlpha(0, 0)).toBeNull()
    expect(() => deriveAwraAlpha(10, 11)).toThrow(
      'AWRA budget exceeds RawSurplus',
    )
  })

  it('requires an explicit donor rule and leaves non-targeted tail outcomes unchanged', () => {
    const base = [
      { multiple: 0, probability: 0.8 },
      { multiple: 1, probability: 0.1 },
      { multiple: 2, probability: 0.08 },
      { multiple: 5, probability: 0.019 },
      { multiple: 100, probability: 0.001 },
    ]
    const deltas = computeAwraProbabilityDeltas(0.02, [
      { multiple: 1, weight: 0.5 },
      { multiple: 2, weight: 0.5 },
    ])
    const transformed = applyAwraProbabilityDeltas(base, deltas, 0)

    expect(transformed.find((x) => x.multiple === 5)?.probability).toBe(0.019)
    expect(transformed.find((x) => x.multiple === 100)?.probability).toBe(0.001)

    const baseMetrics = evaluateAwraDistribution(base)
    const transformedMetrics = evaluateAwraDistribution(transformed)

    expect(transformedMetrics.expectedPayout - baseMetrics.expectedPayout)
      .toBeCloseTo(0.02)
  })

  it('keeps safety, viability and authorized policy as distinct gates', () => {
    const candidate = {
      id: 'candidate',
      budget: 10,
      weights: [{ multiple: 1, weight: 1 }],
    }

    expect(admitAwraCandidate(10, candidate, {
      economicGate: () => true,
      viability: () => true,
      authorizedPolicy: () => true,
    }).authorizedPolicyAccepted).toBe(true)

    expect(admitAwraCandidate(10, candidate, {
      economicGate: () => true,
      viability: () => false,
      authorizedPolicy: () => true,
    }).authorizedPolicyAccepted).toBe(false)

    expect(admitAwraCandidate(9, candidate, {
      economicGate: () => true,
      viability: () => true,
      authorizedPolicy: () => true,
    }).budgetWithinRawSurplus).toBe(false)
  })





  it('accepts the current canonical Classic-6 ticket distribution as a reference input', () => {
    const distribution = [
      { multiple: 0, probability: 0.765625 },
      { multiple: 1, probability: 0.14875 },
      { multiple: 2, probability: 0.007225 },
      { multiple: 2.5, probability: 0.0525 },
      { multiple: 3.5, probability: 0.0051 },
      { multiple: 5, probability: 0.01665 },
      { multiple: 6, probability: 0.00153 },
      { multiple: 7.5, probability: 0.00054 },
      { multiple: 10, probability: 0.000081 },
      { multiple: 100, probability: 0.0016625 },
      { multiple: 101, probability: 0.0001615 },
      { multiple: 102.5, probability: 0.000057 },
      { multiple: 105, probability: 0.0000171 },
      { multiple: 200, probability: 0.0000009025 },
      { multiple: 500, probability: 0.0000999975 },
    ]

    const metrics = evaluateAwraDistribution(distribution)

    expect(metrics.winRate).toBeCloseTo(0.234375)
    expect(metrics.profitWinRate).toBeCloseTo(0.085625)
    expect(metrics.expectedPayout).toBeCloseTo(0.64996875)
    expect(metrics.variance).toBeCloseTo(44.750915874, 8)
    expect(metrics.probabilityAtLeast100x).toBeCloseTo(0.001999)
  })

  it('never lets preference select an inadmissible candidate', () => {
    const candidates = [
      { id: 'unsafe-high', budget: 10, weights: [{ multiple: 1, weight: 1 }] },
      { id: 'safe-low', budget: 5, weights: [{ multiple: 1, weight: 1 }] },
    ]

    const selected = selectAuthorizedAwraCandidate(
      candidates,
      (candidate) => candidate.id === 'safe-low',
      (left, right) => right.budget - left.budget,
    )

    expect(selected?.id).toBe('safe-low')
  })



  it('can rerun the recovered 55 candidates against the current Classic-6 model', () => {
    const distribution = [
      { multiple: 0, probability: 0.765625 },
      { multiple: 1, probability: 0.14875 },
      { multiple: 2, probability: 0.007225 },
      { multiple: 2.5, probability: 0.0525 },
      { multiple: 3.5, probability: 0.0051 },
      { multiple: 5, probability: 0.01665 },
      { multiple: 6, probability: 0.00153 },
      { multiple: 7.5, probability: 0.00054 },
      { multiple: 10, probability: 0.000081 },
      { multiple: 100, probability: 0.0016625 },
      { multiple: 101, probability: 0.0001615 },
      { multiple: 102.5, probability: 0.000057 },
      { multiple: 105, probability: 0.0000171 },
      { multiple: 200, probability: 0.0000009025 },
      { multiple: 500, probability: 0.0000999975 },
    ]

    const baseExpected = evaluateAwraDistribution(distribution).expectedPayout
    const evaluations = generateRecovered55Candidates().map((candidate) =>
      evaluateAwraCandidate(distribution, candidate, 0),
    )

    expect(evaluations).toHaveLength(55)
    for (const evaluation of evaluations) {
      expect(evaluation.expectedPayout - baseExpected)
        .toBeCloseTo(evaluation.candidate.budget)
    }
  })

  it('recovers the historical 5 x 11 grid shape without inventing extra weights', () => {
    const candidates = generateRecovered55Candidates()
    expect(candidates).toHaveLength(55)
    expect(candidates[0]?.budget).toBe(0.005)
    expect(candidates.at(-1)?.budget).toBe(0.1)
    expect(candidates[0]?.weights).toEqual([
      { multiple: 1, weight: 0 },
      { multiple: 2, weight: 1 },
    ])
    expect(candidates.at(-1)?.weights).toEqual([
      { multiple: 1, weight: 1 },
      { multiple: 2, weight: 0 },
    ])
  })
})
