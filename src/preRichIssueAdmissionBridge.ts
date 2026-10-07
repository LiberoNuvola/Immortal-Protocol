import {
  assertEconomicAdmission,
  type EconomicAdmissionWitness,
} from '../Adapter/CARDANO/runtime/EconomicAdmission'
import { issueClassSaleable, type IssueRefinementEvidence } from '../PRE-RICH/src/PreRichIssueEvidence'
import {
  validateCanonicalTransitionEvidence,
  type CanonicalTransitionEvidence,
} from '../Adapter/CARDANO/observation/CanonicalTransitionEvidence'

export type IssueAdmissionRuntimeInputs = {
  counterInputReference: string
  poolInputReference: string
  liquiditySourceReferences: readonly string[]
  poolUsdmValue: bigint
  carrierInputReference: string
}

export type AuthoritativeIssueAdmissionProvider = (
  inputs: IssueAdmissionRuntimeInputs,
) => Promise<EconomicAdmissionWitness>

export async function obtainAuthoritativeIssueAdmission(
  provider: AuthoritativeIssueAdmissionProvider,
  inputs: IssueAdmissionRuntimeInputs,
  classEvidence: IssueRefinementEvidence,
): Promise<EconomicAdmissionWitness> {
  if (!issueClassSaleable(classEvidence)) {
    throw new Error('class is not saleable')
  }

  const witness = await provider(inputs)

  assertEconomicAdmission(
    witness,
    [inputs.counterInputReference, inputs.poolInputReference],
    inputs.liquiditySourceReferences,
    'Issue',
  )

  if (witness.authenticatedPoolInputReference !== inputs.poolInputReference) {
    throw new Error('economic admission is bound to a different B1 PrizePool input')
  }

  if (witness.authenticatedPoolUsdmValue !== inputs.poolUsdmValue) {
    throw new Error('economic admission B1 PrizePool valuation does not match runtime input')
  }

  return witness
}

export function assertIssueCarrierBindingWitness(
  admission: EconomicAdmissionWitness,
): void {
  if (admission.actionClass !== 'Issue') throw new Error('economic admission is not an Issue transition')
  if (!admission.carrierInputReference?.trim()) throw new Error('Issue admission is missing the V3 carrier input reference')
  if (!admission.carrierPolicyId?.trim() || !admission.carrierTokenNameHex?.trim()) {
    throw new Error('Issue admission is missing the V3 carrier singleton identity')
  }
  if (admission.carrierPreStateVersion === undefined || admission.carrierPreStateVersion < 0n) {
    throw new Error('Issue admission is missing the V3 carrier pre-state version')
  }
  if (!admission.carrierCandidateState) {
    throw new Error('Issue admission is missing the authoritative V3 candidate post-state')
  }
}

export function assertIssueAdmissionMatchesCanonicalEvidence(
  admission: EconomicAdmissionWitness,
  evidence: CanonicalTransitionEvidence,
): void {
  validateCanonicalTransitionEvidence(evidence)

  if (admission.actionClass !== 'Issue' || evidence.actionClass !== 'Issue') {
    throw new Error('economic admission action does not match canonical evidence')
  }
  if (admission.stateHash !== evidence.preStateFingerprint) {
    throw new Error('pre-state hash does not match canonical evidence')
  }
  if (admission.actionFingerprint !== evidence.actionFingerprint) {
    throw new Error('action fingerprint does not match canonical evidence')
  }
  if (admission.postStateHash !== evidence.postStateFingerprint) {
    throw new Error('post-state hash does not match canonical evidence')
  }
}