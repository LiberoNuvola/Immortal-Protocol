/**
 * Midnight adapter research boundary.
 *
 * Deliberately chain-neutral admission shape: do not import the current
 * Cardano-specific EconomicAdmissionWitness into this adapter.
 */
import type { IssueIntent } from '../../IMMORTAL/intent/IssueIntent'

export type ChainNeutralEconomicAdmission = Readonly<{
  admitted: true
  actionClass: 'Issue' | 'Reveal' | 'Claim' | 'Expire'
  decisionReference: string
  stateHash: string
  actionFingerprint: string
}>

export type MidnightExecutionEnvelope = Readonly<{
  adapter: 'MIDNIGHT'
  actionClass: 'Issue'
  intent: IssueIntent
  admissionDecisionReference: string
  admissionStateHash: string
  actionFingerprint: string
  circuitName: string
  publicInputs: Readonly<{
    classId: bigint
    price: bigint
  }>
  privateWitnessRefs: readonly string[]
}>

export function prepareMidnightIssue(
  intent: IssueIntent,
  admission: ChainNeutralEconomicAdmission | undefined,
  circuitName = 'issue',
): MidnightExecutionEnvelope {
  if (!admission || admission.admitted !== true) {
    throw new Error('Midnight adapter requires authoritative economic admission')
  }
  if (admission.actionClass !== intent.action) {
    throw new Error('Midnight adapter admission action mismatch')
  }
  if (!admission.decisionReference.trim()) {
    throw new Error('Midnight adapter admission decision reference is required')
  }
  if (!/^[0-9a-fA-F]{64}$/.test(admission.stateHash)) {
    throw new Error('Midnight adapter admission stateHash must be a 32-byte digest')
  }
  if (!/^[0-9a-fA-F]{64}$/.test(admission.actionFingerprint)) {
    throw new Error('Midnight adapter admission actionFingerprint must be a 32-byte digest')
  }
  if (!circuitName.trim()) {
    throw new Error('Midnight circuit name is required')
  }

  return Object.freeze({
    adapter: 'MIDNIGHT',
    actionClass: 'Issue',
    intent: Object.freeze({ ...intent }),
    admissionDecisionReference: admission.decisionReference,
    admissionStateHash: admission.stateHash,
    actionFingerprint: admission.actionFingerprint,
    circuitName,
    publicInputs: Object.freeze({
      classId: intent.classId,
      price: intent.price,
    }),
    privateWitnessRefs: Object.freeze([]),
  })
}