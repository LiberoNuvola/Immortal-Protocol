import { describe, expect, it } from 'vitest'
import { fromHex, sha256, concatBytes, field } from '../beacon'
import { generateSymbols, rowTierFromIndex, classifyRowTier } from '../gameRules'

type ReplayGameCase = {
  symbolsSeed: string
  symbols: number[]
  rows: Array<{
    row: 1 | 2
    attempt: number
    u: number
    outcome: number
    tier: number
    symbols: number[]
  }>
}

type ReplayBoundaryCase = {
  boundaryOutcomeCases: Array<{ outcome: number; tier: number }>
}

type ReplayVectors = {
  outcomeDomain: number
  accepted16BitUpperBound: number
  reduction: string
  payoutSubunitsPerUSDM: number
  cases: Array<ReplayGameCase | ReplayBoundaryCase>
}

const vectors = (
  await import('../../verification/pre-rich-gamerules-v1-vectors.json')
).default as ReplayVectors

function expectedRowAttemptInput(seed: Uint8Array, row: 1 | 2, attempt: number): Uint8Array {
  return concatBytes(
    field(new Uint8Array([row, attempt])),
    seed,
  )
}

async function deriveRowU(seed: Uint8Array, row: 1 | 2, attempt: number): Promise<number> {
  const digest = await sha256(expectedRowAttemptInput(seed, row, attempt))
  return digest[0]! * 256 + digest[1]!
}

describe('PRE-RICH GameRules replay vectors', () => {
  it('matches the canonical vector envelope', () => {
    expect(vectors.outcomeDomain).toBe(20_000)
    expect(vectors.accepted16BitUpperBound).toBe(60_000)
    expect(vectors.reduction).toBe('modulo-20000')
    expect(vectors.payoutSubunitsPerUSDM).toBe(100)
  })

  for (const testCase of vectors.cases.filter((candidate): candidate is ReplayGameCase => 'symbolsSeed' in candidate)) {
    it('replays ' + testCase.symbolsSeed, async () => {
      const seed = fromHex(testCase.symbolsSeed)
      const actualSymbols = await generateSymbols(seed)

      expect(Array.from(actualSymbols)).toEqual(testCase.symbols)

      for (const row of testCase.rows) {
        const u = await deriveRowU(seed, row.row, row.attempt)
        expect(u).toBe(row.u)
        expect(u).toBeLessThan(60_000)
        expect(u % 20_000).toBe(row.outcome)

        const tier = classifyRowTier(fromHex(
          row.symbols.map((symbol) => symbol.toString(16).padStart(2, '0')).join(''),
        ))
        expect(tier).toBe(row.tier)
      }
    })
  }

  it('preserves every canonical interval boundary', () => {
    const boundaries = vectors.cases.find(
      (candidate): candidate is ReplayBoundaryCase => 'boundaryOutcomeCases' in candidate,
    )
    if (!boundaries) {
      throw new Error('canonical boundary vector missing')
    }

    for (const boundary of boundaries.boundaryOutcomeCases) {
      expect(rowTierFromIndex(boundary.outcome)).toBe(boundary.tier)
    }
  })
})
