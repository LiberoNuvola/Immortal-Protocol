import { describe, expect, it } from 'vitest'

import {
  createCardanoExecutionAdapter,
} from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'

describe('CardanoExecutionAdapter', () => {
  it('owns signing and submission', async () => {
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

    await expect(adapter.submit('built')).resolves.toEqual({
      transactionRef: 'tx-001',
    })
    expect(calls).toEqual(['sign', 'submit'])
  })

  it('rejects an empty transaction reference', async () => {
    const adapter = createCardanoExecutionAdapter({
      signTx: async (tx) => tx,
      submitTx: async () => '   ',
    })

    await expect(adapter.submit('built')).rejects.toThrow(
      'empty transaction reference',
    )
  })
})
