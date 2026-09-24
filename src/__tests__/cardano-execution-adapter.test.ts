import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import {
  createCardanoExecutionAdapter,
} from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'

describe('CardanoExecutionAdapter', () => {
  it('owns signing and infrastructure submission', async () => {
    const calls: string[] = []
    const adapter = createCardanoExecutionAdapter({
      signTx: async (tx) => {
        expect(tx).toBe('built')
        calls.push('sign')
        return 'signed'
      },
      submitTx: async (signedTx) => {
        expect(signedTx).toBe('signed')
        calls.push('submit')
        return 'tx-001'
      },
    })

    await expect(adapter.submitInfrastructure('built')).resolves.toEqual({
      transactionRef: 'tx-001',
    })
    expect(calls).toEqual(['sign', 'submit'])
  })

  it('rejects an empty transaction reference', async () => {
    const adapter = createCardanoExecutionAdapter({
      signTx: async (tx) => tx,
      submitTx: async () => '   ',
    })

    await expect(adapter.submitInfrastructure('built')).rejects.toThrow(
      'empty transaction reference',
    )
  })

  it('keeps SALE/MINT free of direct Lucid sign/submit calls', () => {
    const source = readFileSync(
      new URL('../mint.ts', import.meta.url),
      'utf8',
    )

    expect(source).not.toMatch(/lucid\.(signTx|submitTx)\b/)
    expect(source).toContain('createCardanoExecutionAdapter')
  })
  it('keeps every TypeScript economic transaction orchestrator behind the Adapter submit boundary', () => {
    const files = [
      '../mint.ts',
      '../gameFlow.ts',
      '../txHelpers.ts',
    ]

    for (const relativePath of files) {
      const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
      expect(source).not.toMatch(/(?:lucid|wallet|client)\.(signTx|submitTx)\s*\(/)
    }

    const txHelpers = readFileSync(
      new URL('../txHelpers.ts', import.meta.url),
      'utf8',
    )
    expect(txHelpers).toContain('createCardanoExecutionAdapter')
  })

})