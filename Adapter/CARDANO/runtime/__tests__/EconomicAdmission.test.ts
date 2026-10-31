import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import { C, Lucid, TxComplete } from 'lucid-cardano'
import { createCardanoExecutionAdapter } from '../CardanoExecutionAdapter'
import { assertExecutableLiquidityMatchesAuthenticatedPool, assertExecutableLiquidityObservationFresh } from '../../observation/ExecutableLiquidityObservation'
import type { EconomicAdmissionWitness } from '../EconomicAdmission'

beforeAll(async () => {
  // lucid-cardano's ESM CML loader expects fs to be injected for Node file URLs.
  // Production browser loading is unchanged; this initializes the pinned local
  // wasm artifact for this Vitest integration test.
  Object.assign(globalThis, { fs })
  if (!C.isInstantiated()) await C.instantiate()
})

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
      to_bytes: () => new TextEncoder().encode(JSON.stringify(references)),
    }),
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function legacyCmlTransaction(
  references: readonly string[],
  outputLovelace = 5_000_000n,
): C.Transaction {
  const inputs = C.TransactionInputs.new()
  for (const reference of references) {
    const [txHash, outputIndex] = reference.split('#')
    inputs.add(
      C.TransactionInput.new(
        C.TransactionHash.from_hex(txHash),
        C.BigNum.from_str(outputIndex),
      ),
    )
  }

  const paymentKeyHash = C.Ed25519KeyHash.from_hex('ab'.repeat(28))
  const address = C.EnterpriseAddress.new(
    0,
    C.StakeCredential.from_keyhash(paymentKeyHash),
  ).to_address()
  const outputs = C.TransactionOutputs.new()
  outputs.add(
    C.TransactionOutput.new(
      address,
      C.Value.new(C.BigNum.from_str(outputLovelace.toString())),
    ),
  )

  const body = C.TransactionBody.new(
    inputs,
    outputs,
    C.BigNum.from_str('170000'),
  )
  return C.Transaction.new(body, C.TransactionWitnessSet.new(), undefined)
}

async function makeSimulatedCip30Lucid() {
  const lucid = await Lucid.new()
  const emptyWitnessSetHex = bytesToHex(C.TransactionWitnessSet.new().to_bytes())
  const api = {
    getUsedAddresses: vi.fn().mockResolvedValue([]),
    getUnusedAddresses: vi.fn().mockResolvedValue([]),
    getRewardAddresses: vi.fn().mockResolvedValue([]),
    getUtxos: vi.fn().mockResolvedValue([]),
    signTx: vi.fn().mockResolvedValue(emptyWitnessSetHex),
    submitTx: vi.fn().mockResolvedValue('tx-cip30-simulated'),
  }
  lucid.selectWallet(api as any)
  return { lucid, api }
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
    const tx = completedTxWithInputs(candidateInputs)
    await expect(adapter.submitEconomic(tx, admission, candidateInputs, [pool0])).resolves.toEqual({ transactionRef: 'tx-1' })
    expect(lucid.signTx).toHaveBeenCalledWith(tx)
    expect(lucid.submitTx).toHaveBeenCalledWith('signed')
  })


  it('accepts additional completed inputs only when the connected wallet reports them', async () => {
    const walletInput = '33'.repeat(32) + '#0'
    const lucid = {
      wallet: {
        getUtxos: vi.fn().mockResolvedValue([
          { txHash: '33'.repeat(32), outputIndex: 0, address: 'addr_test1_wallet' },
        ]),
      },
      signTx: vi.fn().mockResolvedValue('signed'),
      submitTx: vi.fn().mockResolvedValue('tx-wallet-balanced'),
    }
    const adapter = createCardanoExecutionAdapter(lucid)
    const tx = completedTxWithInputs([pool0, walletInput])

    await expect(
      adapter.submitEconomic(tx, admission, [pool0], [pool0]),
    ).resolves.toEqual({ transactionRef: 'tx-wallet-balanced' })

    expect(lucid.wallet.getUtxos).toHaveBeenCalledTimes(1)
    expect(lucid.signTx).toHaveBeenCalledWith(tx)
    expect(lucid.submitTx).toHaveBeenCalledWith('signed')
  })

  it('submits the pinned legacy lucid-cardano TxComplete through its native signing API', async () => {
    const references = candidateInputs
    const inputs = references.map((reference) => {
      const [txHash, outputIndex] = reference.split('#')
      return {
        transaction_id: () => ({ to_hex: () => txHash }),
        // lucid-cardano 0.10.11 CML exposes input.index() as BigNum.
        index: () => ({ to_str: () => outputIndex }),
      }
    })
    const submit = vi.fn().mockResolvedValue('tx-legacy-lucid')
    const complete = vi.fn().mockResolvedValue({ submit })
    const sign = vi.fn().mockReturnValue({ complete })
    const tx = {
      txComplete: {
        body: () => ({
          inputs: () => ({
            len: () => inputs.length,
            get: (index: number) => inputs[index],
          }),
        }),
        to_bytes: () => new TextEncoder().encode(JSON.stringify(references)),
      },
      sign,
    }
    // Match src/wallet.ts: the actual Lucid instance exposes these methods
    // under wallet and has no top-level signTx/submitTx methods.
    const lucid = { wallet: { getUtxos: vi.fn() } }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic(tx, admission, candidateInputs, [pool0]),
    ).resolves.toEqual({ transactionRef: 'tx-legacy-lucid' })

    expect(sign).toHaveBeenCalledTimes(1)
    expect(complete).toHaveBeenCalledTimes(1)
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('accepts Lucid Evolution exact CML CBOR hex for the integrity snapshot', async () => {
    const references = candidateInputs
    const inputs = references.map((reference) => {
      const [txHash, outputIndex] = reference.split('#')
      return {
        transaction_id: () => ({ to_hex: () => txHash }),
        index: () => Number(outputIndex),
      }
    })
    const tx = {
      toTransaction: () => ({
        body: () => ({
          inputs: () => ({
            len: () => inputs.length,
            get: (index: number) => inputs[index],
          }),
        }),
        to_cbor_hex: () => bytesToHex(new TextEncoder().encode(JSON.stringify(references))),
      }),
    }
    const lucid = {
      signTx: vi.fn().mockResolvedValue('signed'),
      submitTx: vi.fn().mockResolvedValue('tx-evolution-cbor'),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic(tx, admission, candidateInputs, [pool0]),
    ).resolves.toEqual({ transactionRef: 'tx-evolution-cbor' })

    expect(lucid.signTx).toHaveBeenCalledWith(tx)
    expect(lucid.submitTx).toHaveBeenCalledWith('signed')
  })

  it('uses lucid-cardano 0.10.11 and a simulated CIP-30 wallet with a real CML transaction', async () => {
    const { lucid, api } = await makeSimulatedCip30Lucid()
    const tx = new TxComplete(lucid, legacyCmlTransaction([pool0]))
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic(tx, admission, [pool0], [pool0]),
    ).resolves.toEqual({ transactionRef: 'tx-cip30-simulated' })

    expect(api.signTx).toHaveBeenCalledTimes(1)
    expect(api.signTx).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f]+$/), true)
    expect(api.submitTx).toHaveBeenCalledTimes(1)
    expect(api.submitTx).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f]+$/))
  })

  it('rejects a legacy TxComplete body replacement with unchanged inputs during wallet lookup', async () => {
    const walletInput = '33'.repeat(32) + '#0'
    const { lucid, api } = await makeSimulatedCip30Lucid()
    const original = legacyCmlTransaction([pool0, walletInput], 5_000_000n)
    const replacement = legacyCmlTransaction([pool0, walletInput], 6_000_000n)
    const tx = new TxComplete(lucid, original)
    const walletUtxoLookup = vi.spyOn(lucid.wallet, 'getUtxos').mockImplementation(async () => {
      // Rebind the public TxComplete.txComplete property while the adapter awaits
      // wallet classification. Spending inputs stay identical; the output changes.
      tx.txComplete = replacement
      return [{
        txHash: '33'.repeat(32),
        outputIndex: 0,
        address: 'addr_test1_wallet',
        assets: { lovelace: 2_000_000n },
      }]
    })
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic(tx, admission, [pool0], [pool0]),
    ).rejects.toThrow('Completed transaction bytes changed after economic admission validation')

    expect(walletUtxoLookup).toHaveBeenCalledTimes(1)
    expect(api.signTx).not.toHaveBeenCalled()
    expect(api.submitTx).not.toHaveBeenCalled()
  })

  it('treats the pinned CML Transaction.body input collection as a detached copy', () => {
    const transaction = legacyCmlTransaction([pool0])
    const bodyInputs = transaction.body().inputs()
    bodyInputs.add(
      C.TransactionInput.new(
        C.TransactionHash.from_hex('44'.repeat(32)),
        C.BigNum.from_str('1'),
      ),
    )

    expect(transaction.body().inputs().len()).toBe(1)
  })

  it('rejects if completed spending inputs change during the asynchronous wallet classification', async () => {
    const walletInput = '33'.repeat(32) + '#0'
    const replacementInput = '44'.repeat(32) + '#1'
    let bodyReferences = [pool0, walletInput]
    const tx = {
      toTransaction: () => ({
        body: () => ({
          inputs: () => ({
            len: () => bodyReferences.length,
            get: (index: number) => {
              const [txHash, outputIndex] = bodyReferences[index].split('#')
              return {
                transaction_id: () => ({ to_hex: () => txHash }),
                index: () => Number(outputIndex),
              }
            },
          }),
        }),
        to_bytes: () => new TextEncoder().encode(JSON.stringify(bodyReferences)),
      }),
    }
    const lucid = {
      wallet: {
        getUtxos: vi.fn().mockImplementation(async () => {
          // Simulate a mutable completed transaction changing while the adapter
          // awaits the connected wallet's UTxO list.
          bodyReferences = [pool0, replacementInput]
          return [{ txHash: '33'.repeat(32), outputIndex: 0, address: 'addr_test1_wallet' }]
        }),
      },
      signTx: vi.fn(),
      submitTx: vi.fn(),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic(tx, admission, [pool0], [pool0]),
    ).rejects.toThrow('Completed transaction spending inputs changed after economic admission validation')

    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })

  it('rejects an additional completed input that is not in the connected wallet UTxO list', async () => {
    const unclassifiedInput = '33'.repeat(32) + '#0'
    const lucid = {
      wallet: { getUtxos: vi.fn().mockResolvedValue([]) },
      signTx: vi.fn(),
      submitTx: vi.fn(),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic(
        completedTxWithInputs([pool0, unclassifiedInput]),
        admission,
        [pool0],
        [pool0],
      ),
    ).rejects.toThrow('not verified as connected-wallet UTxOs')

    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })

  it('fails closed when additional inputs exist but wallet UTxO listing is unavailable', async () => {
    const unclassifiedInput = '33'.repeat(32) + '#0'
    const lucid = { signTx: vi.fn(), submitTx: vi.fn() }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      adapter.submitEconomic(
        completedTxWithInputs([pool0, unclassifiedInput]),
        admission,
        [pool0],
        [pool0],
      ),
    ).rejects.toThrow('connected wallet UTxO listing is unavailable')

    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
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
