import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')

describe('Cardano provider credential boundary', () => {
  it('uses only statically enumerated public Vite environment properties', () => {
    const config = read('src/config.ts')
    expect(config).not.toMatch(/import\.meta\s+as\s+any|import\.meta\.env\s*\[/)
    expect(config).toContain('import.meta.env.VITE_BLOCKFROST_PROXY_URL')
    expect(config).not.toContain('VITE_BLOCKFROST_PROJECT_ID')
    expect(config).not.toContain('VITE_BLOCKFROST_PREPROD_URL')
  })

  it('constructs the browser provider from the public proxy URL without a project credential', () => {
    const wallet = read('src/wallet.ts')
    expect(wallet).toContain('BLOCKFROST_PROXY_URL')
    expect(wallet).toContain("new Blockfrost(BLOCKFROST_PROXY_URL.replace(/\\/$/, ''), '')")
    expect(wallet).not.toMatch(/BLOCKFROST_PROJECT_ID|BLOCKFROST_PREPROD_URL/)
  })

  it('keeps provider status surfaces aligned with the public proxy configuration', () => {
    for (const file of ['src/live.ts', 'src/first-user.ts']) {
      const source = read(file)
      expect(source).toContain('BLOCKFROST_PROXY_URL')
      expect(source).not.toContain('BLOCKFROST_PROJECT_ID')
    }
  })

  it('does not inject a Blockfrost project credential into static Pages builds', () => {
    const workflow = read('.github/workflows/immortal-preprod-pages.yml')
    expect(workflow).toContain('VITE_BLOCKFROST_PROXY_URL')
    expect(workflow).not.toContain('vars.VITE_BLOCKFROST_PROJECT_ID')
    expect(workflow).not.toContain('VITE_BLOCKFROST_PREPROD_URL:')
  })
})
