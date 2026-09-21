import { describe, expect, it } from 'vitest'

type HalfPayout = 0 | 2 | 5 | 10 | 200 | 1000

const rowCounts: Record<number, bigint> = {
  0: 17_500n,
  1: 1_700n,
  2: 600n,
  3: 180n,
  4: 19n,
  5: 1n,
}

const rowHalfPayout: Record<number, HalfPayout> = {
  0: 0,
  1: 2,
  2: 5,
  3: 10,
  4: 200,
  5: 1000,
}

const expectedCounts: Record<string, bigint> = {
  '0': 306_250_000n,
  '1': 59_500_000n,
  '2': 2_890_000n,
  '2.5': 21_000_000n,
  '3.5': 2_040_000n,
  '5': 6_660_000n,
  '6': 612_000n,
  '7.5': 216_000n,
  '10': 32_400n,
  '100': 665_000n,
  '101': 64_600n,
  '102.5': 22_800n,
  '105': 6_840n,
  '200': 361n,
  '500': 39_999n,
}

function exactTicketDistribution(): Map<string, bigint> {
  const result = new Map<string, bigint>()
  for (const [tierA, countA] of Object.entries(rowCounts)) {
    for (const [tierB, countB] of Object.entries(rowCounts)) {
      const half = Math.min(
        rowHalfPayout[Number(tierA)] + rowHalfPayout[Number(tierB)],
        1000,
      )
      const key = String(half / 2)
      result.set(key, (result.get(key) ?? 0n) + countA * countB)
    }
  }
  return result
}

describe('PRE-RICH Classic-6 exact ticket distribution', () => {
  it('convolves the two canonical 20,000-row domains exactly', () => {
    const actual = exactTicketDistribution()
    expect(Object.fromEntries(actual)).toEqual(expectedCounts)
    expect([...actual.values()].reduce((sum, n) => sum + n, 0n)).toBe(400_000_000n)
  })

  it('preserves the canonical expected payout exactly', () => {
    const actual = exactTicketDistribution()
    let payoutHalfNumerator = 0n
    for (const [multiplier, count] of actual) {
      payoutHalfNumerator += BigInt(Number(multiplier) * 2) * count
    }
    const expectedHalfNumerator = 41_598_000_000n
    expect(payoutHalfNumerator).toBe(expectedHalfNumerator)
  })

  it('keeps the 500x cap exact', () => {
    const actual = exactTicketDistribution()
    expect(actual.get('500')).toBe(39_999n)
    expect(actual.has('501')).toBe(false)
  })
})