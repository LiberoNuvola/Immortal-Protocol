import { describe, expect, it } from 'vitest'
import { prepareMidnightIssue } from './IntentBoundary'
import {
  bindMidnightFinalizedReceipt,
  buildMidnightExecutionEvidence,
} from './ExecutionEvidenceBoundary'

const intent = Object.freeze({
  action: 'Issue' as const,
  classId: 3n,
  price: 5n,
})

const admission = Object.freeze({
  admitted: true as const,
  actionClass: 'Issue' as const,
  decisionReference: 'admission:001',
  stateHash: 'aa'.repeat(32),
  actionFingerprint: 'bb'.repeat(32),
  expectedPostStateHash: 'cc'.repeat(32),
})

const observation = Object.freeze({
  adapter: 'MIDNIGHT' as const,
  observationReference: 'obs:001',
  contractReference: 'contract:001',
  ledgerStateReference: 'ledger:001',
  sourceReference: 'public-data:001',
})

const receipt = Object.freeze({
  adapter: 'MIDNIGHT' as const,
  actionClass: 'Issue' as const,
  transactionReference: 'tx:001',
  circuitName: 'issue',
  admissionDecisionReference: admission.decisionReference,
  admissionStateHash: admission.stateHash,
  actionFingerprint: admission.actionFingerprint,
  finalityReference: 'finality:001',
  observedPostStateHash: admission.expectedPostStateHash,
  executionEvidenceReference: 'exec-proof:001',
  status: 'FINALIZED' as const,
})

describe('Midnight execution/evidence boundary', () => {
  it('binds the expected post-state to the finalized receipt', () => {
    const envelope = prepareMidnightIssue(intent, admission)
    expect(envelope.expectedPostStateHash).toBe(admission.expectedPostStateHash)
    expect(bindMidnightFinalizedReceipt(envelope, receipt).observedPostStateHash)
      .toBe(admission.expectedPostStateHash)
  })

  it('rejects observed post-state mutation', () => {
    const envelope = prepareMidnightIssue(intent, admission)
    expect(() =>
      bindMidnightFinalizedReceipt(envelope, {
        ...receipt,
        observedPostStateHash: 'dd'.repeat(32),
      }),
    ).toThrow('post-state mismatch')
  })

  it('rejects missing execution evidence', () => {
    const envelope = prepareMidnightIssue(intent, admission)
    expect(() =>
      bindMidnightFinalizedReceipt(envelope, {
        ...receipt,
        executionEvidenceReference: '',
      }),
    ).toThrow('executionEvidenceReference is required')
  })

  it('builds evidence with execution identity separate from observation identity', () => {
    const envelope = prepareMidnightIssue(intent, admission)
    const evidence = buildMidnightExecutionEvidence(envelope, receipt, observation)
    expect(evidence.executionEvidenceReference).toBe('exec-proof:001')
    expect(evidence.transactionReference).toBe('tx:001')
    expect(evidence.observationReference).toBe('obs:001')
    expect(evidence.observedPostStateHash).toBe(admission.expectedPostStateHash)
    expect(evidence.executionEvidenceReference).not.toBe(evidence.observationReference)
  })
})
