import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('RF8 Treasury relayer boundary', () => {
  it('keeps Treasury distribution fail-closed until EconomicAdmission exists', () => {
    const source = readFileSync(
      join(process.cwd(), 'relayer', 'relayer.js'),
      'utf8',
    )
    const start = source.indexOf('async function treasuryWorker')
    expect(start).toBeGreaterThanOrEqual(0)

    const end = source.indexOf('// ---------------------------------------------------------------------------\n// UTxO helpers', start)
    expect(end).toBeGreaterThan(start)

    const treasuryWorker = source.slice(start, end)

    expect(treasuryWorker).not.toMatch(/\.signTx\s*\(/)
    expect(treasuryWorker).not.toMatch(/\.submitTx\s*\(/)
    expect(treasuryWorker).toContain('FAIL-CLOSED MIGRATION BOUNDARY')
    expect(treasuryWorker).toContain('authoritative Economic')
  })
})
