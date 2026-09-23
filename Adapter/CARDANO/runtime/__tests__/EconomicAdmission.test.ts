import { describe, expect, it, vi } from 'vitest'
import { createCardanoExecutionAdapter } from '../CardanoExecutionAdapter'
import type { EconomicAdmissionWitness } from '../EconomicAdmission'

const admission: EconomicAdmissionWitness = {
  gateVersion: 'economic-gate-v1',
  admitted: true,
  decisionReference: 'decision:test:1',
  authoritativeObservationReference: 'observation:test:1',
  stateHash: '00'.repeat(32),
  eev: 1000n,
  executableLiquidityObservation: {
    observationReference: 'observation:test:1',
    observedAt: 100n,
    utxos: [
      {
        txHash: '11'.repeat(32),
        index: 0,
        usdmValue: 800n,
        spendable: true,
        ringFenced: false,
      },
      {
        txHash: '22'.repeat(32),
        index: 1,
        usdmValue: 200n,
        spendable: true,
        ringFenced: false,
      },
    ],
    declaredUsdmLiquidity: 1000n,
  },
  requiredImmediateLiquidity: 900n,
}

describe('economic Cardano submission boundary', () => {
  it('fails closed when no Economic Gate admission is supplied', async () => {
    const lucid = {
      signTx: vi.fn(),
      submitTx: vi.fn(),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(adapter.submitEconomic({}, undefined)).rejects.toThrow(
      'Economic admission required',
    )
    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })

  it('consumes a valid admission before signing and submitting', async () => {
    const lucid = {
      signTx: vi.fn().mockResolvedValue('signed'),
      submitTx: vi.fn().mockResolvedValue('tx-1'),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(adapter.submitEconomic({ candidate: true }, admission)).resolves.toEqual({
      transactionRef: 'tx-1',
    })
    expect(lucid.signTx).toHaveBeenCalledWith({ candidate: true })
    expect(lucid.submitTx).toHaveBeenCalledWith('signed')
  })

  it('rejects malformed admission before signing', async () => {
    const lucid = {
      signTx: vi.fn(),
      submitTx: vi.fn(),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic({}, {
        ...admission,
        stateHash: 'not-a-hash',
      }),
    ).rejects.toThrow('stateHash')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects liquidity that includes a ring-fenced UTxO', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic({}, {
        ...admission,
        executableLiquidityObservation: {
          ...admission.executableLiquidityObservation,
          utxos: [
            ...admission.executableLiquidityObservation.utxos.slice(0, 1),
            {
              ...admission.executableLiquidityObservation.utxos[1],
              ringFenced: true,
            },
          ],
        },
      }),
    ).rejects.toThrow('ring-fenced')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects liquidity whose declared amount does not equal observed spendable UTxOs', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic({}, {
        ...admission,
        executableLiquidityObservation: {
          ...admission.executableLiquidityObservation,
          declaredUsdmLiquidity: 1200n,
        },
      }),
    ).rejects.toThrow('does not match observed spendable UTxOs')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects required liquidity above the observed spendable amount', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic({}, {
        ...admission,
        requiredImmediateLiquidity: 1001n,
      }),
    ).rejects.toThrow('exceeds observed spendable liquidity')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })
})
