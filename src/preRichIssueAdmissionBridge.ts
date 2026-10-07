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

export type EevQualificationEvidence = {
  status: 'qualified'
  contractVersion: string
  sourceReference: string
  verificationReference: string
  derivationVersion: string
  snapshotReference: string
  evidence: Record<
    'EV1' | 'EV2' | 'EV3' | 'EV4' | 'EV5' | 'EV6' | 'EV7',
    { reference: string; digest: string }
  >
}

export type ProtectedCapitalProvenance = {
  sourceReference: string
  components: {
    crystallizedLiabilities: bigint
    worstCaseExposure: bigint
    safetyCapital: bigint
    reserveProtection: bigint
    lockedJackpot: bigint
    mandatoryFutureCosts: bigint
  }
  accountingInputs: {
    unresolvedReserve: bigint
    unresolvedTicketCount: bigint
  }
  total: bigint
}

export type ViabilityCertificateEvidence = {
  id: string
  version: string
  modelReference: string
  characteristicPredicateReference: string
  witnessSelectorReference: string
  boundsReference: string
  proofs: Record<
    'VC1' | 'VC2' | 'VC3' | 'VC4' | 'VC5' | 'VC6',
    { reference: string; digest: string }
  >
  evidence: Record<
    'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8' | 'E9' | 'E10',
    { reference: string; digest: string }
  >
  digest: string
}

export type AuthoritativeIssueAdmissionWitness =
  EconomicAdmissionWitness & {
    v3CarrierBinding?: IssueV3CarrierBinding
    eevQualification: EevQualificationEvidence
    protectedCapitalProvenance: ProtectedCapitalProvenance
    viabilityCertificate: ViabilityCertificateEvidence
  }

export type IssueAdmissionRuntimeInputs = {
  counterInputReference: string
  poolInputReference: string
  liquiditySourceReferences: readonly string[]
  poolUsdmValue: bigint
  classId: bigint
  price: bigint
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

  if (!witness.eevQualification || witness.eevQualification.status !== 'qualified') {
    throw new Error('authoritative Issue witness requires a qualified EEV certificate')
  }
  for (const key of ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7'] as const) {
    const evidence = witness.eevQualification.evidence[key]
    if (
      !evidence ||
      !evidence.reference.trim() ||
      !/^[0-9a-fA-F]{64}$/.test(evidence.digest)
    ) {
      throw new Error('authoritative Issue witness has incomplete EEV evidence: ' + key)
    }
  }

  const pc = witness.protectedCapitalProvenance
  if (!pc || !pc.sourceReference.trim() || pc.total < 0n) {
    throw new Error('authoritative Issue witness requires ProtectedCapital provenance')
  }
  const pcTotal = Object.values(pc.components).reduce((sum, value) => sum + value, 0n)
  if (pcTotal !== pc.total) {
    throw new Error('authoritative Issue witness ProtectedCapital total does not match components')
  }
  for (const value of Object.values(pc.components)) {
    if (value < 0n) throw new Error('authoritative Issue witness ProtectedCapital component is negative')
  }
  if (!witness.v3CarrierBinding || pc.sourceReference !== witness.v3CarrierBinding.carrierStateReference) {
    throw new Error('authoritative Issue witness ProtectedCapital is not bound to the V3 carrier')
  }

  const vc = witness.viabilityCertificate
  if (!vc || !vc.id.trim() || !vc.version.trim() || !vc.modelReference.trim() ||
      !vc.characteristicPredicateReference.trim() || !vc.witnessSelectorReference.trim() ||
      !vc.boundsReference.trim() || !/^[0-9a-fA-F]{64}$/.test(vc.digest)) {
    throw new Error('authoritative Issue witness requires a complete viability certificate')
  }
  for (const key of ['VC1', 'VC2', 'VC3', 'VC4', 'VC5', 'VC6'] as const) {
    const proof = vc.proofs[key]
    if (!proof || !proof.reference.trim() || !/^[0-9a-fA-F]{64}$/.test(proof.digest)) {
      throw new Error('authoritative Issue witness has incomplete viability proof: ' + key)
    }
  }
  for (const key of ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10'] as const) {
    const evidence = vc.evidence[key]
    if (!evidence || !evidence.reference.trim() || !/^[0-9a-fA-F]{64}$/.test(evidence.digest)) {
      throw new Error('authoritative Issue witness has incomplete viability evidence: ' + key)
    }
  }

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
