import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import {
  createCardanoExecutionAdapter,
} from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import type { EconomicAdmissionWitness } from '../../Adapter/CARDANO/runtime/EconomicAdmission'

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

describe('CardanoExecutionAdapter authoritative Issue boundary', () => {
  it('rejects a legacy Issue witness that lacks authoritative provenance', async () => {
    const pool = 'b'.repeat(64) + '#0'
    const witness: EconomicAdmissionWitness = {
      gateVersion: 'economic-gate-v1',
      admitted: true,
      decisionReference: 'decision://issue/1',
      authoritativeObservationReference: 'obs://issue/1',
      stateHash: 'a'.repeat(64),
      actionClass: 'Issue',
      actionFingerprint: 'b'.repeat(64),
      postStateHash: 'c'.repeat(64),
      eev: 100n,
      executableLiquidityObservation: {
        observationReference: 'obs://issue/1',
        observedAt: 1n,
        sourceInputReferences: [pool],
        utxos: [{ txHash: 'b'.repeat(64), index: 0, usdmValue: 100n, spendable: true, ringFenced: false }],
        declaredUsdmLiquidity: 100n,
      },
      authenticatedPoolInputReference: pool,
      authenticatedPoolUsdmValue: 100n,
      requiredImmediateLiquidity: 1n,
    }
    const adapter = createCardanoExecutionAdapter({
      signTx: async () => 'signed',
      submitTx: async () => 'tx',
    })
    await expect(adapter.submitEconomic(
      'built',
      witness,
      ['a'.repeat(64) + '#0', pool, 'c'.repeat(64) + '#2'],
      [pool],
      'Issue',
    )).rejects.toThrow(/authoritative Issue witness/)
  })
})
