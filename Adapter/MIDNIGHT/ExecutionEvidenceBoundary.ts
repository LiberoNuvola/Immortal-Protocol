/**
 * Research-only Midnight execution/evidence boundary.
 * No Midnight.js, Compact, or Cardano runtime type is imported here.
 */
import type { ChainNeutralEconomicAdmission, IssueIntent, MidnightExecutionEnvelope } from "./IntentBoundary"

export type MidnightFinalizedExecutionReceipt = Readonly<{
  adapter: "MIDNIGHT"
  actionClass: "Issue"
  transactionReference: string
  circuitName: string
  admissionDecisionReference: string
  admissionStateHash: string
  actionFingerprint: string
  finalityReference: string
  observedPostStateHash: string
  executionEvidenceReference: string
  status: "FINALIZED"
}>

export type MidnightPublicStateObservation = Readonly<{
  adapter: "MIDNIGHT"
  observationReference: string
  contractReference: string
  ledgerStateReference: string
  sourceReference: string
}>

export type MidnightExecutionEvidence = Readonly<{
  adapter: "MIDNIGHT"
  actionClass: "Issue"
  admissionDecisionReference: string
  admissionStateHash: string
  actionFingerprint: string
  circuitName: string
  transactionReference: string
  finalityReference: string
  observationReference: string
  ledgerStateReference: string
  sourceReference: string
  observedPostStateHash: string
  executionEvidenceReference: string
}>

const nonEmpty = (value: string, field: string) => {
  if (!value.trim()) throw new Error(field + " is required")
}
const digest = (value: string, field: string) => {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error(field + " must be a 32-byte digest")
}

export function bindMidnightFinalizedReceipt(
  envelope: MidnightExecutionEnvelope,
  receipt: MidnightFinalizedExecutionReceipt,
): MidnightFinalizedExecutionReceipt {
  if (receipt.adapter !== "MIDNIGHT" || receipt.actionClass !== envelope.actionClass) throw new Error("Midnight receipt action/adapter mismatch")
  if (receipt.circuitName !== envelope.circuitName) throw new Error("Midnight receipt circuit mismatch")
  if (receipt.admissionDecisionReference !== envelope.admissionDecisionReference) throw new Error("Midnight receipt admission decision mismatch")
  if (receipt.admissionStateHash !== envelope.admissionStateHash) throw new Error("Midnight receipt admission state mismatch")
  if (receipt.actionFingerprint !== envelope.actionFingerprint) throw new Error("Midnight receipt action fingerprint mismatch")
  if (receipt.status !== "FINALIZED") throw new Error("Midnight execution is not finalized")
  if (receipt.observedPostStateHash !== envelope.expectedPostStateHash) throw new Error("Midnight receipt post-state mismatch")
  nonEmpty(receipt.transactionReference, "transactionReference")
  nonEmpty(receipt.finalityReference, "finalityReference")
  nonEmpty(receipt.executionEvidenceReference, "executionEvidenceReference")
  digest(receipt.admissionStateHash, "admissionStateHash")
  digest(receipt.actionFingerprint, "actionFingerprint")
  digest(receipt.observedPostStateHash, "observedPostStateHash")
  return Object.freeze({ ...receipt })
}

export function buildMidnightExecutionEvidence(
  envelope: MidnightExecutionEnvelope,
  receipt: MidnightFinalizedExecutionReceipt,
  observation: MidnightPublicStateObservation,
): MidnightExecutionEvidence {
  bindMidnightFinalizedReceipt(envelope, receipt)
  if (observation.adapter !== "MIDNIGHT") throw new Error("Midnight observation adapter mismatch")
  nonEmpty(observation.observationReference, "observationReference")
  nonEmpty(observation.contractReference, "contractReference")
  nonEmpty(observation.ledgerStateReference, "ledgerStateReference")
  nonEmpty(observation.sourceReference, "sourceReference")
  return Object.freeze({
    adapter: "MIDNIGHT", actionClass: "Issue",
    admissionDecisionReference: envelope.admissionDecisionReference,
    admissionStateHash: envelope.admissionStateHash,
    actionFingerprint: envelope.actionFingerprint,
    circuitName: envelope.circuitName,
    transactionReference: receipt.transactionReference,
    finalityReference: receipt.finalityReference,
    observationReference: observation.observationReference,
    ledgerStateReference: observation.ledgerStateReference,
    sourceReference: observation.sourceReference,
    observedPostStateHash: receipt.observedPostStateHash,
    executionEvidenceReference: receipt.executionEvidenceReference,
  })
}

export function assertMidnightEvidenceDoesNotAuthorize(
  admission: ChainNeutralEconomicAdmission | undefined,
  intent: IssueIntent,
): void {
  if (!admission) throw new Error("authoritative economic admission is required")
  if (admission.actionClass !== intent.action) throw new Error("admission/action mismatch")
}
