import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(process.cwd(), 'src')
const ALLOWED_SUBMIT_BOUNDARY = new Set(['txHelpers.ts'])

function collectTsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectTsFiles(path))
    else if (entry.name.endsWith('.ts')) out.push(path)
  }
  return out
}

describe('RF8 application submission boundary', () => {
  it('contains direct Lucid sign/submit calls to the single approved helper', () => {
    const files = collectTsFiles(ROOT)
    const violations: string[] = []
    for (const file of files) {
      const rel = relative(ROOT, file)
      const source = readFileSync(file, 'utf8')
      if (/\.signTx\s*\(/.test(source) || /\.submitTx\s*\(/.test(source)) {
        const allowed = ALLOWED_SUBMIT_BOUNDARY.has(rel.split('\\').join('/'))
        if (!allowed) violations.push(rel)
      }
    }
    expect(violations).toEqual([])
  })

  it('keeps transaction submission behind the Cardano adapter helper', () => {
    const source = readFileSync(join(ROOT, 'txHelpers.ts'), 'utf8')
    expect(source).toMatch(/createCardanoExecutionAdapter\s*\(/)
    expect(source).toMatch(/adapter\.submitInfrastructure\s*\(/)
  })
  it('requires current economic orchestrators to use the economic submission path', () => {
    const economicFiles = [
      'mint.ts',
      'gameFlow.ts',
    ]

    const forbiddenGenericEconomicPatterns = [
      /(?:mintSerialNFT|revealPrize|claimPrize|expirePrize)[\s\S]*?signAndSubmitTx\s*\(/,
      /(?:mintSerialNFT|revealPrize|claimPrize|expirePrize)[\s\S]*?\.submit\s*\(/,
    ]

    for (const relativePath of economicFiles) {
      const source = readFileSync(join(ROOT, relativePath), 'utf8')
      expect(source).toContain('submitEconomic')
      expect(source).not.toMatch(forbiddenGenericEconomicPatterns[0])
      expect(source).not.toMatch(forbiddenGenericEconomicPatterns[1])
    }
  })

  it('keeps the generic submission helper distinct from economic submission', () => {
    const source = readFileSync(join(ROOT, 'txHelpers.ts'), 'utf8')
    expect(source).toMatch(/export async function signAndSubmitTx/)
    expect(source).toMatch(/export async function signAndSubmitEconomicTx/)
    expect(source).toMatch(/adapter\\.submitInfrastructure\\(/)
    expect(source).toMatch(/adapter\\.submitEconomic\\(/)
  })

  it('fails closed on the legacy Treasury distribution relayer surface', () => {
    const relayer = readFileSync(
      join(process.cwd(), 'relayer', 'relayer.js'),
      'utf8',
    )
    const start = relayer.indexOf('async function treasuryWorker(lucid) {')
    const end = relayer.indexOf(
      '// ---------------------------------------------------------------------------\n// UTxO helpers',
      start,
    )
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)

    const treasuryWorker = relayer.slice(start, end)
    expect(treasuryWorker).not.toMatch(/lucid\.signTx\s*\(/)
    expect(treasuryWorker).not.toMatch(/lucid\.submitTx\s*\(/)
    expect(treasuryWorker).toContain('legacy distribution disabled')
  })

})