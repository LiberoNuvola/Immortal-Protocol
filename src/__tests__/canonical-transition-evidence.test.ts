import { describe, expect, it } from 'vitest'
import {
  acceptCanonicalTransitionEvidence,
  assertCanonicalTransitionBinding,
  assertUniqueCanonicalTransitionRealizations,
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
  preStateFingerprint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  postStateFingerprint: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  actionFingerprint: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
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
      expect(() => validateCanonicalTransitionEvidence({ ...valid, [field]: '' })).toThrow(field + ' must be a 32-byte hex digest')
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
  it('binds the evidence to the expected canonical action, pre-state, post-state and settlement', () => {
    expect(() => assertCanonicalTransitionBinding(valid, {
      actionFingerprint: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      preStateFingerprint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      postStateFingerprint: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      transactionRef: 'tx-123',
    })).not.toThrow()

    expect(() => assertCanonicalTransitionBinding(valid, {
      actionFingerprint: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      preStateFingerprint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      postStateFingerprint: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      transactionRef: 'tx-123',
    })).toThrow('canonical action fingerprint mismatch')

    expect(() => assertCanonicalTransitionBinding(valid, {
      actionFingerprint: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      preStateFingerprint: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      postStateFingerprint: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      transactionRef: 'tx-123',
    })).toThrow('canonical pre-state fingerprint mismatch')
  })

  it('rejects duplicate evidence or settlement transaction references', () => {
    expect(() => assertUniqueCanonicalTransitionRealizations([valid, {
      ...valid,
      evidenceId: 'evidence-2',
    }])).toThrow('duplicate settlement transaction reference')

    expect(() => assertUniqueCanonicalTransitionRealizations([valid, {
      ...valid,
      evidenceId: 'evidence-1',
      transactionRef: 'tx-456',
    }])).toThrow('duplicate canonical evidence ID')
  })

})
