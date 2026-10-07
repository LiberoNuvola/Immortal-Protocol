import { describe, expect, it } from 'vitest'
import {
  admitAwraCandidate,
  applyAwraProbabilityDeltas,
  awraBudgetAdmissible,
  computeAwraProbabilityDeltas,
  deriveAwraAlpha,
  evaluateAwraDistribution,
  generateRecovered55Candidates,
} from '../PreRichAwraReference'

describe('PRE-RICH AWRA reference layer', () => {
  it('recovers the historical budget-to-probability transformation', () => {
    const deltas = computeAwraProbabilityDeltas(0.05, [
      { multiple: 1, weight: 0.4 },
      { multiple: 2, weight: 0.6 },
    ])

    expect(deltas).toEqual([
      { multiple: 1, probability: 0.020000000000000004 },
      { multiple: 2, probability: 0.015 },
    ])

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
