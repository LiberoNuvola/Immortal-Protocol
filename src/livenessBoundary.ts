/**
 * IMMORTAL R4 liveness boundary.
 *
 * This is an executable observation/classification model, not a network
 * liveness proof. It keeps safety/viability separate from environmental
 * assumptions L1-L4 and follows the normative FM1-FM10 taxonomy.
 */

export type LivenessSnapshot = {
  inCertifiedKernel: boolean
  inActivationOrMigrationWindow: boolean
  eligibleActionCount: bigint
  authoritativeInputsAvailable: boolean
  proposerAvailable: boolean
  deliveryAndInclusionFair: boolean
  deciderAvailable: boolean
  governanceLocked: boolean
  observedSuccessorOutsideKernel: boolean
  observedInternalStallWithInputs: boolean
}

export type StallClassification =
  | 'PROGRESS_AVAILABLE'
  | 'FM1_VIABILITY_BOUNDARY'
  | 'FM2_CERTIFICATE_DEFECT'
  | 'FM3_CERTIFICATE_LIVENESS_DEFECT'
  | 'FM4_ACTOR_UNAVAILABLE'
  | 'FM5_COMMUNICATION_UNAVAILABLE'
  | 'FM6_EXTERNAL_TRUTH_UNAVAILABLE'
  | 'FM7_GOVERNANCE_LOCK'
  | 'FM8_DECIDER_UNAVAILABLE'
  | 'FM9_CENSORSHIP'
  | 'FM10_OVER_CONSERVATIVE_CERTIFICATE'

export function eligibleState(snapshot: LivenessSnapshot): boolean {
  return snapshot.inCertifiedKernel && !snapshot.inActivationOrMigrationWindow
}

export function eligibleActionExists(snapshot: LivenessSnapshot): boolean {
  return eligibleState(snapshot) && snapshot.eligibleActionCount > 0n
}

export function livenessConditionalPreconditions(snapshot: LivenessSnapshot): boolean {
  return (
    eligibleActionExists(snapshot) &&
    snapshot.authoritativeInputsAvailable &&
    snapshot.proposerAvailable &&
    snapshot.deliveryAndInclusionFair &&
    snapshot.deciderAvailable &&
    !snapshot.governanceLocked &&
    !snapshot.observedSuccessorOutsideKernel
  )
}

export function classifyStall(snapshot: LivenessSnapshot): StallClassification {
  if (livenessConditionalPreconditions(snapshot)) return 'PROGRESS_AVAILABLE'
  if (snapshot.observedSuccessorOutsideKernel) return 'FM2_CERTIFICATE_DEFECT'
  if (snapshot.observedInternalStallWithInputs && eligibleState(snapshot)) return 'FM3_CERTIFICATE_LIVENESS_DEFECT'
  if (!eligibleState(snapshot)) return 'FM1_VIABILITY_BOUNDARY'
  if (snapshot.governanceLocked) return 'FM7_GOVERNANCE_LOCK'
  if (!snapshot.authoritativeInputsAvailable) return 'FM6_EXTERNAL_TRUTH_UNAVAILABLE'
  if (!snapshot.proposerAvailable) return 'FM4_ACTOR_UNAVAILABLE'
  if (!snapshot.deliveryAndInclusionFair) return 'FM5_COMMUNICATION_UNAVAILABLE'
  if (!snapshot.deciderAvailable) return 'FM8_DECIDER_UNAVAILABLE'
  if (snapshot.eligibleActionCount > 0n) return 'FM9_CENSORSHIP'
  return 'FM10_OVER_CONSERVATIVE_CERTIFICATE'
}

export function noLiveActionCanFollowSafeIdleWitness(): boolean {
  const idle: LivenessSnapshot = {
    inCertifiedKernel: true,
    inActivationOrMigrationWindow: false,
    eligibleActionCount: 0n,
    authoritativeInputsAvailable: true,
    proposerAvailable: true,
    deliveryAndInclusionFair: true,
    deciderAvailable: true,
    governanceLocked: false,
    observedSuccessorOutsideKernel: false,
    observedInternalStallWithInputs: false,
  }
  return !eligibleActionExists(idle) && eligibleState(idle)
}