import {
  assertEconomicAdmission,
  type EconomicAdmissionWitness,
} from '../Adapter/CARDANO/runtime/EconomicAdmission'
import { issueClassSaleable, type IssueRefinementEvidence } from '../PRE-RICH/src/PreRichIssueEvidence'
import {
  validateCanonicalTransitionEvidence,
  type CanonicalTransitionEvidence,
} from '../Adapter/CARDANO/observation/CanonicalTransitionEvidence'

export type IssueV3CandidateClassState = {
  classId: string
  issued: string
  unresolved: string
  exposure: string
  cap: string
  saleable: boolean
}

export type IssueV3CandidateState = {
  crystallizedLiabilities: string
  unresolvedReserve: string
  unresolvedTicketCount: string
  safetyCapital: string
  reserveProtection: string
  mandatoryFutureCosts: string
  classes: IssueV3CandidateClassState[]
  control: {
    currentActiveClass: string
    highestClassEverActivated: string
  }
  jackpot: {
    lockedAmount: string
    threshold: string
    status: 'inactive' | 'locked' | 'payable' | 'closed'
    cycle: string
  }
}

export type IssueV3CarrierBinding = {
  carrierStateReference: string
  candidateState: IssueV3CandidateState
}

export type AuthoritativeIssueAdmissionWitness =
  EconomicAdmissionWitness & {
    v3CarrierBinding?: IssueV3CarrierBinding
  }

export type IssueAdmissionRuntimeInputs = {
  counterInputReference: string
  poolInputReference: string
  liquiditySourceReferences: readonly string[]
  poolUsdmValue: bigint
  carrierStateReference?: string
}

export type AuthoritativeIssueAdmissionProvider = (
  inputs: IssueAdmissionRuntimeInputs,
) => Promise<AuthoritativeIssueAdmissionWitness>

export async function obtainAuthoritativeIssueAdmission(
  provider: AuthoritativeIssueAdmissionProvider,
  inputs: IssueAdmissionRuntimeInputs,
  classEvidence: IssueRefinementEvidence,
): Promise<AuthoritativeIssueAdmissionWitness> {
  if (!issueClassSaleable(classEvidence)) {
    throw new Error('class is not saleable')
  }

  const witness = await provider(inputs)

  assertEconomicAdmission(
    witness,
    [
      inputs.counterInputReference,
      inputs.poolInputReference,
      ...(inputs.carrierStateReference ? [inputs.carrierStateReference] : []),
    ],
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
