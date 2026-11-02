import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const mintSource = readFileSync(join(root, 'src/mint.ts'), 'utf8')
const ticketsSource = readFileSync(join(root, 'src/tickets.ts'), 'utf8')

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') return []
      return sourceFiles(path)
    }
    return /\\.(?:ts|tsx|js|jsx)$/.test(entry.name) && !/\\.(?:test|spec)\\./.test(entry.name)
      ? [path]
      : []
  })
}

describe('Authoritative PRE-RICH Issue entrypoint', () => {
  it('does not expose a generic Issue mint that accepts a caller-built economic witness', () => {
    expect(mintSource).toContain('async function mintSerialNFTInternal(')
    expect(mintSource).not.toMatch(/export\\s+async\\s+function\\s+mintSerialNFT\\s*\\(/)
    expect(mintSource).not.toContain('economicAdmission?: EconomicAdmissionWitness')
    expect(mintSource).not.toContain('opts.economicAdmission')
    expect(mintSource).not.toContain('mintSerialNFT,')
  })

  it('always obtains Issue admission through the configured authoritative provider', () => {
    expect(mintSource).toContain('const economicAdmission = await obtainAuthoritativeIssueAdmission(')
    expect(mintSource).toContain('const requireCarrierBinding = true')
    expect(mintSource).toContain('const requireB2ControlBinding = true')
    expect(mintSource).toContain('mintSerialNFTInternal(opts)')
    expect(mintSource).toContain('mintSerialNFTWithAuthoritativeAdmission,')
  })

  it('routes the ticket-sale helper only through the authoritative Issue wrapper', () => {
    expect(ticketsSource).toContain('mintSerialNFTWithAuthoritativeAdmission')
    expect(ticketsSource).toContain('await mintSerialNFTWithAuthoritativeAdmission(mintOptions)')
    expect(ticketsSource).not.toMatch(/\\bmintSerialNFT\\s*\\(/)
  })

  it('has no alternate application callsite for the removed generic mint API', () => {
    const files = sourceFiles(join(root, 'src')).filter((path) =>
      path !== join(root, 'src/mint.ts') &&
      path !== join(root, 'src/tickets.ts'),
    )
    const bypasses = files.filter((path) =>
      /\\bmintSerialNFT\\s*\\(/.test(readFileSync(path, 'utf8')),
    )
    expect(bypasses).toEqual([])
  })
})
