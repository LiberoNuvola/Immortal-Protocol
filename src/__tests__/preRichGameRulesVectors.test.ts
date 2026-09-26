import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateSymbols, rowTierFromIndex } from '../gameRules'

const vectorsPath = join(process.cwd(), 'verification', 'pre-rich-gamerules-v1-vectors.json')
const vectors = JSON.parse(readFileSync(vectorsPath, 'utf8')) as {
  version: string
  outcomeDomain: number
  accepted16BitUpperBound: number
  reduction: string
  cases: Array<{
    symbolsSeed?: string
    rows?: Array<{ row: number; attempt: number; u: number; outcome: number; tier: number; symbols: number[] }>
    symbols?: number[]
    boundaryOutcomeCases?: Array<{ outcome: number; tier: number }>
  }>
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    throw new Error('invalid vector hex')
  }
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

describe('PRE-RICH GameRules canonical vectors', () => {
  it('matches the declared vector contract', () => {
    expect(vectors.version).toBe('PRE-RICH-GAMERULES-V1')
    expect(vectors.outcomeDomain).toBe(20_000)
    expect(vectors.accepted16BitUpperBound).toBe(60_000)
    expect(vectors.reduction).toBe('modulo-20000')
  })

  it('replays every canonical deterministic symbol vector', async () => {
    const cases = vectors.cases.filter((item) => item.symbolsSeed && item.symbols && item.rows)
    expect(cases).toHaveLength(3)

    for (const item of cases) {
      const seed = hexToBytes(item.symbolsSeed!)
      const actual = await generateSymbols(seed)
      expect(Array.from(actual)).toEqual(item.symbols)

      for (const row of item.rows!) {
        expect(row.outcome).toBe(row.u % 20_000)
        expect(row.outcome).toBeGreaterThanOrEqual(0)
        expect(row.outcome).toBeLessThan(20_000)
        expect(rowTierFromIndex(row.outcome)).toBe(row.tier)
      }
    }
  })

  it('replays every economic row interval boundary', () => {
    const boundaryCase = vectors.cases.find((item) => item.boundaryOutcomeCases)
    expect(boundaryCase?.boundaryOutcomeCases).toBeDefined()

    for (const item of boundaryCase!.boundaryOutcomeCases!) {
      expect(rowTierFromIndex(item.outcome)).toBe(item.tier)
    }
  })
})
