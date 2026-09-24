import { describe, expect, it } from 'vitest'
import {
  assertEconomicAdmissionMatchesCanonicalEvidence,
} from './EconomicAdmissionTransitionBinding'
import type { EconomicAdmissionWitness } from '../runtime/EconomicAdmission'
import type { CanonicalTransitionEvidence } from './CanonicalTransitionEvidence'

const admission: EconomicAdmissionWitness = {
  gateVersion: 'economic-gate-v1',
  admitted: true,
  decisionReference: 'decision:1',
  authoritativeObservationReference: 'observation:1',
  stateHash: '11'.repeat(32),
  actionClass: 'Reveal',
  actionFingerprint: '22'.repeat(32),
  postStateHash: '33'.repeat(32),
  eev: 1000n,
  executableLiquidityObservation: {
    observationReference: 'observation:1',
    observedAt: 1n,
    sourceInputReferences: ['aa'.repeat(32) + '#0'],
    utxos: [{ txHash: 'aa'.repeat(32), index: 0, usdmValue: 1000n, spendable: true, ringFenced: false }],
    declaredUsdmLiquidity: 1000n,
  },
  authenticatedPoolInputReference: 'aa'.repeat(32) + '#0',
  authenticatedPoolUsdmValue: 1000n,
  requiredImmediateLiquidity: 500n,
}

const evidence: CanonicalTransitionEvidence = {
  evidenceId: 'e1',
  fixtureId: 'f1',
  actionClass: 'Reveal',
  protocolVersion: 'v3',
  profileVersion: 'pre-rich-v1',
  adapterId: 'cardano',
  adapterVersion: '0.1',
  environment: 'yaci-devnet',
  preStateFingerprint: '11'.repeat(32),
  postStateFingerprint: '33'.repeat(32),
  actionFingerprint: '22'.repeat(32),
  transactionRef: 'tx-1',
}

describe('Economic admission ↔ canonical transition evidence', () => {
  it('accepts matching action and state fingerprints', () => {
    expect(() =>
      assertEconomicAdmissionMatchesCanonicalEvidence(admission, evidence),
    ).not.toThrow()
  })

  it('rejects an action mismatch', () => {
    expect(() =>
      assertEconomicAdmissionMatchesCanonicalEvidence(
        { ...admission, actionClass: 'Claim' },
        evidence,
      ),
    ).toThrow('economic admission action does not match canonical evidence')
  })

  it('rejects a pre-state mismatch', () => {
    expect(() =>
      assertEconomicAdmissionMatchesCanonicalEvidence(
        { ...admission, stateHash: '44'.repeat(32) },
        evidence,
      ),
    ).toThrow('economic admission pre-state hash does not match canonical evidence')
  })

  it('rejects a candidate post-state mismatch', () => {
    expect(() =>
      assertEconomicAdmissionMatchesCanonicalEvidence(
        { ...admission, postStateHash: '55'.repeat(32) },
        evidence,
      ),
    ).toThrow('economic admission post-state hash does not match canonical evidence')
  })
})
