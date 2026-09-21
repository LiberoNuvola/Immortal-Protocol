import { describe, expect, it } from 'vitest'
import {
  classifyStall,
  eligibleActionExists,
  eligibleState,
  livenessConditionalPreconditions,
  noLiveActionCanFollowSafeIdleWitness,
  type LivenessSnapshot,
} from '../livenessBoundary'

const base: LivenessSnapshot = {
  inCertifiedKernel: true,
  inActivationOrMigrationWindow: false,
  eligibleActionCount: 1n,
  authoritativeInputsAvailable: true,
  proposerAvailable: true,
  deliveryAndInclusionFair: true,
  deciderAvailable: true,
  governanceLocked: false,
  observedSuccessorOutsideKernel: false,
  observedInternalStallWithInputs: false,
}

describe('IMMORTAL R4 liveness boundary', () => {
  it('distinguishes certified eligible state from action existence', () => {
    expect(eligibleState(base)).toBe(true)
    expect(eligibleActionExists(base)).toBe(true)
  })

  it('recognizes the conditional progress envelope', () => {
    expect(livenessConditionalPreconditions(base)).toBe(true)
    expect(classifyStall(base)).toBe('PROGRESS_AVAILABLE')
  })

  it('classifies missing authoritative truth as FM6', () => {
    expect(classifyStall({ ...base, authoritativeInputsAvailable: false })).toBe('FM6_EXTERNAL_TRUTH_UNAVAILABLE')
  })

  it('classifies proposer failure as FM4', () => {
    expect(classifyStall({ ...base, proposerAvailable: false })).toBe('FM4_ACTOR_UNAVAILABLE')
  })

  it('classifies delivery failure as FM5', () => {
    expect(classifyStall({ ...base, deliveryAndInclusionFair: false })).toBe('FM5_COMMUNICATION_UNAVAILABLE')
  })

  it('classifies decider failure as FM8', () => {
    expect(classifyStall({ ...base, deciderAvailable: false })).toBe('FM8_DECIDER_UNAVAILABLE')
  })

  it('classifies governance lock as FM7 before environmental retry', () => {
    expect(classifyStall({ ...base, governanceLocked: true })).toBe('FM7_GOVERNANCE_LOCK')
  })

  it('classifies a successor leaving Kc as FM2 certificate defect', () => {
    expect(classifyStall({ ...base, observedSuccessorOutsideKernel: true })).toBe('FM2_CERTIFICATE_DEFECT')
  })

  it('classifies an internal stall with inputs as FM3', () => {
    expect(classifyStall({ ...base, observedInternalStallWithInputs: true })).toBe('FM3_CERTIFICATE_LIVENESS_DEFECT')
  })

  it('preserves the negative no-live witness', () => {
    expect(noLiveActionCanFollowSafeIdleWitness()).toBe(true)
  })

  it('classifies a certified state with no eligible action as an FM1 boundary', () => {
    expect(classifyStall({ ...base, eligibleActionCount: 0n })).toBe('FM1_VIABILITY_BOUNDARY')
  })
})