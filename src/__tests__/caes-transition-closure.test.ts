import { describe, expect, it, vi } from 'vitest'

import { createCardanoExecutionAdapter } from '../../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import type { EconomicAdmissionWitness } from '../../Adapter/CARDANO/runtime/EconomicAdmission'
import { assertEconomicAdmissionMatchesCanonicalEvidence } from '../../Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding'
import type { CanonicalTransitionEvidence } from '../../Adapter/CARDANO/observation/CanonicalTransitionEvidence'

const pool = '11'.repeat(32) + '#0'

const admission: EconomicAdmissionWitness = {
  gateVersion: 'economic-gate-v1',
  admitted: true,
  decisionReference: 'decision:caes-closure:1',
  authoritativeObservationReference: 'observation:caes-closure:1',
  stateHash: '00'.repeat(32),
  actionClass: 'Reveal',
  actionFingerprint: 'aa'.repeat(32),
  postStateHash: 'bb'.repeat(32),
  eev: 1000n,
  executableLiquidityObservation: {
    observationReference: 'observation:caes-closure:1',
    observedAt: 100n,
    sourceInputReferences: [pool],
    utxos: [
      {
        txHash: '11'.repeat(32),
        index: 0,
        usdmValue: 800n,
        spendable: true,
        ringFenced: false,
      },
    ],
    declaredUsdmLiquidity: 800n,
  },
  authenticatedPoolInputReference: pool,
  authenticatedPoolUsdmValue: 800n,
  requiredImmediateLiquidity: 800n,
}

const evidence: CanonicalTransitionEvidence = {
  evidenceId: 'evidence:caes-closure:1',
  fixtureId: 'fixture:caes-closure:1',
  actionClass: 'Reveal',
  protocolVersion: '3.0.0',
  profileVersion: 'PRE-RICH-v1',
  adapterId: 'cardano',
  adapterVersion: 'test',
  environment: 'test',
  preStateFingerprint: '00'.repeat(32),
  postStateFingerprint: 'bb'.repeat(32),
  actionFingerprint: 'aa'.repeat(32),
  transactionRef: 'tx-caes-closure-1',
}

async function submitComposedEconomic(
  adapter: ReturnType<typeof createCardanoExecutionAdapter>,
  tx: unknown,
  admissionWitness: EconomicAdmissionWitness,
  canonicalEvidence: CanonicalTransitionEvidence,
) {
  // This ordering is the CAES composition boundary under test:
  // evidence binding must succeed before the adapter is allowed to sign.
  assertEconomicAdmissionMatchesCanonicalEvidence(admissionWitness, canonicalEvidence)
  return adapter.submitEconomic(
    tx,
    admissionWitness,
    [pool],
    [pool],
    'Reveal',
  )
}

describe('CAES transition closure boundary', () => {
  it('composes admission, canonical evidence and Cardano submission', async () => {
    const lucid = {
      signTx: vi.fn().mockResolvedValue('signed'),
      submitTx: vi.fn().mockResolvedValue(evidence.transactionRef),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      submitComposedEconomic(adapter, {
        canonicalPreState: admission.stateHash,
        canonicalPostState: admission.postStateHash,
      }, admission, evidence),
    ).resolves.toEqual({ transactionRef: evidence.transactionRef })

    expect(lucid.signTx).toHaveBeenCalledTimes(1)
    expect(lucid.submitTx).toHaveBeenCalledTimes(1)
  })

  it('stops before Cardano signing when canonical evidence diverges', async () => {
    const lucid = {
      signTx: vi.fn(),
      submitTx: vi.fn(),
    }
    const adapter = createCardanoExecutionAdapter(lucid)

    await expect(
      submitComposedEconomic(
        adapter,
        {},
        admission,
        { ...evidence, postStateFingerprint: 'cc'.repeat(32) },
      ),
    ).rejects.toThrow('post-state hash does not match canonical evidence')

    expect(lucid.signTx).not.toHaveBeenCalled()
    expect(lucid.submitTx).not.toHaveBeenCalled()
  })
})
