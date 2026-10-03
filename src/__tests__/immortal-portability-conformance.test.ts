import { describe, expect, it } from 'vitest'
import vectors from '../../Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json'

type Vector = (typeof vectors.vectors)[number]

function rawSurplus(eev: number, protectedCapital: number): number {
  return Math.max(0, eev - protectedCapital)
}

function solvency(eev: number, protectedCapital: number): boolean {
  return eev >= 0 && protectedCapital >= 0 && eev >= protectedCapital
}

describe('IMMORTAL portability conformance seed vectors', () => {
  const executable = vectors.vectors.filter(
    (vector): vector is Vector & { status?: never } => !('status' in vector),
  )

  it('keeps the machine-readable vector set bound to the universal formula', () => {
    for (const vector of executable) {
      if ('cases' in vector || !('expected' in vector) || vector.expected === null) continue
      expect(rawSurplus(vector.eev, vector.protectedCapital)).toBe(vector.expected.rawSurplus)
    }
  })

  it('preserves the protected-capital decomposition witness', () => {
    const vector = vectors.vectors.find((item) => item.id === 'V05')
    expect(vector).toBeDefined()
    if (!vector || !('decomposition' in vector)) return

    const d = vector.decomposition
    const total =
      d.crystallizedLiabilities +
      d.worstCaseExposure +
      d.safetyCapital +
      d.reserveProtection +
      d.mandatoryFutureCosts +
      d.additionalProtectedCapital

    expect(total).toBe(vector.protectedCapital)
    expect(rawSurplus(vector.eev, total)).toBe(vector.expected.rawSurplus)
  })

  it('does not turn RawSurplus into a universal discretionary-allocation rule', () => {
    const vector = vectors.vectors.find((item) => item.id === 'V06')
    expect(vector).toBeDefined()
    if (!vector || !('candidateDiscretionaryAllocation' in vector)) return

    expect(vector.expected.discretionaryAuthorizationFromRawSurplus).toBe('not-defined')
    expect(rawSurplus(vector.eev, vector.protectedCapital)).toBe(vector.expected.rawSurplus)
  })

  it('preserves state locality', () => {
    const vector = vectors.vectors.find((item) => item.id === 'V07')
    expect(vector).toBeDefined()
    if (!vector || !('cases' in vector)) return

    for (const testCase of vector.cases) {
      expect(rawSurplus(testCase.eev, testCase.protectedCapital)).toBe(
        testCase.expectedRawSurplus,
      )
    }
  })

  it('checks explicit solvency fixtures without redefining the economic gate', () => {
    for (const id of ['V03', 'V04']) {
      const vector = vectors.vectors.find((item) => item.id === id)
      expect(vector).toBeDefined()
      if (!vector || !('expected' in vector) || vector.expected === null) continue

      expect(solvency(vector.eev, vector.protectedCapital)).toBe(vector.expected.solvency)
    }
  })

  it('keeps unresolved vectors explicitly pending rather than inventing schema', () => {
    expect(vectors.vectors.find((item) => item.id === 'V08')?.status).toBe(
      'pending-schema-extraction',
    )
    expect(vectors.vectors.find((item) => item.id === 'V09')?.status).toBe(
      'pending-certified-kernel-fixture',
    )
  })
})
