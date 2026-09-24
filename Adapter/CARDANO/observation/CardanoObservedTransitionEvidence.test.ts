import { describe, expect, it } from 'vitest'
import {
  assertCardanoObservedTransitionBinding,
  type CardanoObservedTransitionEvidence,
} from './CardanoObservedTransitionEvidence'

const evidence: CardanoObservedTransitionEvidence = {
  evidenceId: 'e1',
  fixtureId: 'f1',
  actionClass: 'REVEAL',
  environment: 'local-yaci-devnet',
  preStateObservationFingerprint: '11'.repeat(32),
  postStateObservationFingerprint: '22'.repeat(32),
  actionObservationFingerprint: '33'.repeat(32),
  transactionRef: 'tx-1',
}

describe('Cardano observed transition evidence', () => {
  it('accepts an exact observed binding', () => {
    expect(() => assertCardanoObservedTransitionBinding(evidence, evidence)).not.toThrow()
  })

  it('rejects an observed action mismatch', () => {
    expect(() =>
      assertCardanoObservedTransitionBinding(evidence, {
        ...evidence,
        actionClass: 'CLAIM',
        evidenceId: undefined as never,
      }),
    ).toThrow('observed Cardano action class mismatch')
  })

  it('rejects an observed pre-state mismatch', () => {
    expect(() =>
      assertCardanoObservedTransitionBinding(evidence, {
        ...evidence,
        preStateObservationFingerprint: '44'.repeat(32),
        evidenceId: undefined as never,
      }),
    ).toThrow('observed Cardano pre-state fingerprint mismatch')
  })

  it('rejects an observed post-state mismatch', () => {
    expect(() =>
      assertCardanoObservedTransitionBinding(evidence, {
        ...evidence,
        postStateObservationFingerprint: '55'.repeat(32),
        evidenceId: undefined as never,
      }),
    ).toThrow('observed Cardano post-state fingerprint mismatch')
  })

  it('rejects an observed transaction reference mismatch', () => {
    expect(() =>
      assertCardanoObservedTransitionBinding(evidence, {
        ...evidence,
        transactionRef: 'tx-2',
        evidenceId: undefined as never,
      }),
    ).toThrow('observed Cardano transaction reference mismatch')
  })
})
