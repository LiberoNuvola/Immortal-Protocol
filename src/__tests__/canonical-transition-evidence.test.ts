import { describe, expect, it } from 'vitest'
import {
  acceptCanonicalTransitionEvidence,
  validateCanonicalTransitionEvidence,
  type CanonicalTransitionEvidence,
} from '../../Adapter/CARDANO/observation/CanonicalTransitionEvidence'

const valid: CanonicalTransitionEvidence = {
  evidenceId: 'evidence-1',
  fixtureId: 'reveal-fixture-1',
  actionClass: 'Reveal',
  protocolVersion: 'v3',
  profileVersion: 'pre-rich-v1',
  adapterId: 'cardano',
  adapterVersion: '0.1',
  environment: 'yaci-devnet',
  preStateFingerprint: 'pre-sha256',
  postStateFingerprint: 'post-sha256',
  actionFingerprint: 'action-sha256',
  transactionRef: 'tx-123',
}

describe('RF10/RF11 — canonical transition evidence binding', () => {
  it('accepts a complete action/pre/post/transaction evidence record', () => {
    expect(acceptCanonicalTransitionEvidence(valid)).toEqual({ ok: true, evidence: valid })
  })

  it('requires the settlement transaction reference', () => {
    expect(() => validateCanonicalTransitionEvidence({ ...valid, transactionRef: ' ' })).toThrow('transactionRef must be non-empty')
  })

  it('requires both canonical state endpoints and the action fingerprint', () => {
    for (const field of ['preStateFingerprint', 'postStateFingerprint', 'actionFingerprint'] as const) {
      expect(() => validateCanonicalTransitionEvidence({ ...valid, [field]: '' })).toThrow(field + ' must be non-empty')
    }
  })

  it('does not treat an observation without a transition binding as sufficient evidence', () => {
    const result = acceptCanonicalTransitionEvidence({
      ...valid,
      evidenceId: '',
      actionFingerprint: '',
      transactionRef: '',
    })
    expect(result.ok).toBe(false)
  })
})
