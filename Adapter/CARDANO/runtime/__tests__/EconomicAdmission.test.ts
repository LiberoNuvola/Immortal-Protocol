import { describe, expect, it, vi } from 'vitest'
import { createCardanoExecutionAdapter } from '../CardanoExecutionAdapter'
import { assertExecutableLiquidityMatchesAuthenticatedPool, assertExecutableLiquidityObservationFresh } from '../../observation/ExecutableLiquidityObservation'
import type { EconomicAdmissionWitness } from '../EconomicAdmission'

const pool0 = '11'.repeat(32) + '#0'
const pool1 = '22'.repeat(32) + '#1'

const admission: EconomicAdmissionWitness = {
  gateVersion: 'economic-gate-v1',
  admitted: true,
  decisionReference: 'decision:test:1',
  authoritativeObservationReference: 'observation:test:1',
  stateHash: '00'.repeat(32),
  actionClass: 'Reveal',
  actionFingerprint: 'aa'.repeat(32),
  postStateHash: 'bb'.repeat(32),
  eev: 1000n,
  executableLiquidityObservation: {
    observationReference: 'observation:test:1',
    observedAt: 100n,
    sourceInputReferences: [pool0],
    utxos: [
      { txHash: '11'.repeat(32), index: 0, usdmValue: 800n, spendable: true, ringFenced: false },
    ],
    declaredUsdmLiquidity: 800n,
  },
  authenticatedPoolInputReference: pool0,
  authenticatedPoolUsdmValue: 800n,
  requiredImmediateLiquidity: 800n,
}

const candidateInputs = [pool0, pool1]

function completedTxWithInputs(references: readonly string[]) {
  const inputs = references.map((reference) => {
    const [txHash, outputIndex] = reference.split('#')
    return {
      transaction_id: () => ({ to_hex: () => txHash }),
      index: () => Number(outputIndex),
    }
  })
  return {
    toTransaction: () => ({
      body: () => ({
        inputs: () => ({
          len: () => inputs.length,
          get: (index: number) => inputs[index],
        }),
      }),
    }),
  }
}

describe('economic Cardano submission boundary', () => {
  it('fails closed when no Economic Gate admission is supplied', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, undefined, candidateInputs, [pool0])).rejects.toThrow('Economic admission required')
    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })

  it('consumes a valid admission before signing and submitting', async () => {
    const lucid = { signTx: vi.fn().mockResolvedValue('signed'), submitTx: vi.fn().mockResolvedValue('tx-1') }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic(completedTxWithInputs(candidateInputs), admission, candidateInputs, [pool0])).resolves.toEqual({ transactionRef: 'tx-1' })
    expect(lucid.signTx).toHaveBeenCalledWith(completedTxWithInputs(candidateInputs))
    expect(lucid.submitTx).toHaveBeenCalledWith('signed')
  })


  it('rejects admission-bound inputs that are absent from the actual completed transaction body', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(
      adapter.submitEconomic(completedTxWithInputs([pool0]), admission, candidateInputs, [pool0]),
    ).rejects.toThrow('not all present in the actual transaction body')
    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })

  it('fails closed when the completed transaction body cannot be inspected', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(
      adapter.submitEconomic({}, admission, candidateInputs, [pool0]),
    ).rejects.toThrow('completed Lucid transaction with toTransaction()')
    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })

  it('rejects a witness whose action class differs from the economic orchestrator', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(
      adapter.submitEconomic({}, admission, candidateInputs, [pool0], 'Claim'),
    ).rejects.toThrow('actionClass mismatch')
    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })

  it('rejects admission when authenticated Pool reference is wrong', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, {
      ...admission,
      authenticatedPoolInputReference: pool1,
    }, candidateInputs, [pool0])).rejects.toThrow('exactly the authenticated B1 PrizePool input')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects admission when authenticated Pool valuation differs', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, {
      ...admission,
      authenticatedPoolUsdmValue: 801n,
    }, candidateInputs, [pool0])).rejects.toThrow('does not match authenticated B1 PrizePool USDM valuation')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects a malformed action fingerprint before signing', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, { ...admission, actionFingerprint: 'not-a-digest' }, candidateInputs, [pool0]))
      .rejects.toThrow('actionFingerprint')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects malformed admission before signing', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, { ...admission, stateHash: 'not-a-hash' }, candidateInputs, [pool0])).rejects.toThrow('stateHash')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects liquidity that includes a ring-fenced UTxO', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, {
      ...admission,
      executableLiquidityObservation: {
        ...admission.executableLiquidityObservation,
        utxos: [{ ...admission.executableLiquidityObservation.utxos[0], ringFenced: true }],
      },
    }, candidateInputs, [pool0])).rejects.toThrow('ring-fenced')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects liquidity whose declared amount does not equal observed spendable UTxOs', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, {
      ...admission,
      executableLiquidityObservation: { ...admission.executableLiquidityObservation, declaredUsdmLiquidity: 1200n },
    }, candidateInputs, [pool0])).rejects.toThrow('does not match observed spendable UTxOs')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects required liquidity above the observed spendable amount', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, { ...admission, requiredImmediateLiquidity: 801n }, candidateInputs, [pool0])).rejects.toThrow('exceeds observed spendable liquidity')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects an observed source that is not consumed by the candidate transaction', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, {
      ...admission,
      executableLiquidityObservation: { ...admission.executableLiquidityObservation, sourceInputReferences: ['33'.repeat(32) + '#0'] },
    }, candidateInputs, [pool0])).rejects.toThrow('not declared as a source input')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })

  it('rejects a liquidity source set that differs from the economic action source', async () => {
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)
    await expect(adapter.submitEconomic({}, admission, candidateInputs, [pool1])).rejects.toThrow('source inputs do not match economic action source')
    expect(lucid.signTx).not.toHaveBeenCalled()
  })
})

describe('authenticated B1 PrizePool liquidity correlation', () => {
  it('accepts the exact authenticated Pool UTxO and valuation', () => {
    assertExecutableLiquidityMatchesAuthenticatedPool(
      admission.executableLiquidityObservation,
      pool0,
      800n,
    )
  })

  it('rejects a wrong Pool UTxO', () => {
    expect(() =>
      assertExecutableLiquidityMatchesAuthenticatedPool(
        admission.executableLiquidityObservation,
        pool1,
        800n,
      ),
    ).toThrow('exactly the authenticated B1 PrizePool input')
  })

  it('rejects double-counted Pool liquidity', () => {
    expect(() =>
      assertExecutableLiquidityMatchesAuthenticatedPool(
        {
          ...admission.executableLiquidityObservation,
          sourceInputReferences: [pool0],
          utxos: [
            admission.executableLiquidityObservation.utxos[0],
            { ...admission.executableLiquidityObservation.utxos[0] },
          ],
          declaredUsdmLiquidity: 1600n,
        },
        pool0,
        800n,
      ),
    ).toThrow('duplicate executable liquidity UTxO reference')
  })

  it('rejects a valuation mismatch against the authenticated Pool state', () => {
    expect(() =>
      assertExecutableLiquidityMatchesAuthenticatedPool(
        admission.executableLiquidityObservation,
        pool0,
        801n,
      ),
    ).toThrow('does not match authenticated B1 PrizePool USDM valuation')
  })
})

describe('executable liquidity observation freshness', () => {
  it('accepts an observation within the caller-supplied freshness horizon', () => {
    assertExecutableLiquidityObservationFresh(
      admission.executableLiquidityObservation,
      150n,
      50n,
    )
  })

  it('rejects a stale observation', () => {
    expect(() =>
      assertExecutableLiquidityObservationFresh(
        admission.executableLiquidityObservation,
        151n,
        50n,
      ),
    ).toThrow('observation is stale')
  })

  it('rejects an observation from the future', () => {
    expect(() =>
      assertExecutableLiquidityObservationFresh(
        admission.executableLiquidityObservation,
        99n,
        50n,
      ),
    ).toThrow('from the future')
  })
})
