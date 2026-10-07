/**
 * Runtime gate for an authoritative PRE-RICH Issue admission provider.
 *
 * This module is transport/integrity infrastructure only. It does not derive
 * EEV, ProtectedCapital, viability or class activation. It validates that an
 * already-authoritative witness is complete and bound to the exact runtime
 * inputs before the Cardano execution adapter can consume it.
 */
import {
  assertEconomicAdmission,
  type EconomicAdmissionWitness,
} from './EconomicAdmission'
import { validateAuthoritativeIssueAdmissionDecision } from '../observation/AuthoritativeIssueAdmissionDecision'

export type IssueEvidenceArtifact = {
  reference: string
  digest: string
}

export type IssueEevDeploymentApproval = {
  status: 'DEPLOYMENT_APPROVED'
  candidateId: string
  sourceSetId: string
  profileVersion: string
  evidenceHash: string
  qualifiedProperties: readonly string[]
  excludedProperties: readonly string[]
  testSuiteVersion: string
  failureMatrixVersion: string
  validFrom: string
  validUntilOrRevalidationRule: string
}

export type IssueEevQualificationEvidence = {
  status: 'qualified'
  contractVersion: string
  sourceReference: string
  verificationReference: string
  derivationVersion: string
  snapshotReference: string
  deploymentApproval: IssueEevDeploymentApproval
  evidence: Record<
    'EV1' | 'EV2' | 'EV3' | 'EV4' | 'EV5' | 'EV6' | 'EV7',
    IssueEvidenceArtifact
  >
}

export type IssueProtectedCapitalProvenance = {
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

export type IssueViabilityCertificateEvidence = {
  id: string
  version: string
  modelReference: string
  characteristicPredicateReference: string
  witnessSelectorReference: string
  boundsReference: string
  proofs: Record<
    'VC1' | 'VC2' | 'VC3' | 'VC4' | 'VC5' | 'VC6',
    IssueEvidenceArtifact
  >
  evidence: Record<
    'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8' | 'E9' | 'E10',
    IssueEvidenceArtifact
  >
  digest: string
}

export type IssueAdmissionV3CarrierBinding = {
  carrierStateReference: string
  candidateState: Record<string, unknown>
}

export type AuthoritativeIssueAdmissionWitness =
  EconomicAdmissionWitness & {
    v3CarrierBinding: IssueAdmissionV3CarrierBinding
    eevQualification: IssueEevQualificationEvidence
    protectedCapitalProvenance: IssueProtectedCapitalProvenance
    viabilityCertificate: IssueViabilityCertificateEvidence
  }

export type AuthoritativeIssueAdmissionProvider = (
  inputs: IssueAdmissionRuntimeInputs,
) => Promise<AuthoritativeIssueAdmissionWitness>

export type AuthoritativeIssueAdmissionSource = {
  id: string
  version: string
  provider: AuthoritativeIssueAdmissionProvider
}

export type IssueAdmissionRuntimeInputs = {
  counterInputReference: string
  poolInputReference: string
  liquiditySourceReferences: readonly string[]
  poolUsdmValue: bigint
  carrierStateReference?: string
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(name + ' must be non-empty')
  }
  return value.trim()
}

function assertDigest(value: unknown, name: string): void {
  const digest = requiredString(value, name)
  if (!/^[0-9a-fA-F]{64}$/.test(digest)) {
    throw new Error(name + ' must be a 32-byte hex digest')
  }
}

function assertEvidenceRecord(
  record: unknown,
  keys: readonly string[],
  name: string,
): void {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error(name + ' is required')
  }
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key]
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(name + '.' + key + ' is required')
    }
    const artifact = value as Record<string, unknown>
    requiredString(artifact.reference, name + '.' + key + '.reference')
    assertDigest(artifact.digest, name + '.' + key + '.digest')
  }
}

export function assertAuthoritativeIssueAdmissionWitness(
  witness: EconomicAdmissionWitness | undefined,
): asserts witness is AuthoritativeIssueAdmissionWitness {
  if (!witness) {
    throw new Error('authoritative Issue witness is required')
  }

  const candidate = witness as unknown as Record<string, unknown>

  const eev = candidate.eevQualification as IssueEevQualificationEvidence | undefined
  if (!eev || eev.status !== 'qualified') {
    throw new Error('authoritative Issue witness requires a qualified EEV certificate')
  }
  requiredString(eev.contractVersion, 'eevQualification.contractVersion')
  requiredString(eev.sourceReference, 'eevQualification.sourceReference')
  requiredString(eev.verificationReference, 'eevQualification.verificationReference')
  requiredString(eev.derivationVersion, 'eevQualification.derivationVersion')
  requiredString(eev.snapshotReference, 'eevQualification.snapshotReference')
  if (eev.deploymentApproval?.status !== 'DEPLOYMENT_APPROVED') {
    throw new Error('authoritative Issue witness requires DEPLOYMENT_APPROVED EEV qualification')
  }
  requiredString(eev.deploymentApproval.candidateId, 'eevQualification.deploymentApproval.candidateId')
  requiredString(eev.deploymentApproval.sourceSetId, 'eevQualification.deploymentApproval.sourceSetId')
  requiredString(eev.deploymentApproval.profileVersion, 'eevQualification.deploymentApproval.profileVersion')
  assertDigest(eev.deploymentApproval.evidenceHash, 'eevQualification.deploymentApproval.evidenceHash')
  for (const key of ['qualifiedProperties', 'excludedProperties'] as const) {
    if (!Array.isArray(eev.deploymentApproval[key])) {
      throw new Error('eevQualification.deploymentApproval.' + key + ' must be an array')
    }
    eev.deploymentApproval[key].forEach((value, index) =>
      requiredString(value, 'eevQualification.deploymentApproval.' + key + '[' + index + ']'),
    )
  }
  requiredString(eev.deploymentApproval.testSuiteVersion, 'eevQualification.deploymentApproval.testSuiteVersion')
  requiredString(eev.deploymentApproval.failureMatrixVersion, 'eevQualification.deploymentApproval.failureMatrixVersion')
  requiredString(eev.deploymentApproval.validFrom, 'eevQualification.deploymentApproval.validFrom')
  requiredString(eev.deploymentApproval.validUntilOrRevalidationRule, 'eevQualification.deploymentApproval.validUntilOrRevalidationRule')
  assertEvidenceRecord(
    eev.evidence,
    ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7'],
    'eevQualification.evidence',
  )

  const pc = candidate.protectedCapitalProvenance as
    | IssueProtectedCapitalProvenance
    | undefined
  if (!pc) {
    throw new Error('authoritative Issue witness requires ProtectedCapital provenance')
  }
  requiredString(pc.sourceReference, 'protectedCapitalProvenance.sourceReference')
  const componentValues = Object.values(pc.components ?? {})
  if (componentValues.length !== 6) {
    throw new Error('ProtectedCapital provenance must contain exactly 6 components')
  }
  for (const value of componentValues) {
    if (typeof value !== 'bigint' || value < 0n) {
      throw new Error('authoritative Issue witness ProtectedCapital component is invalid')
    }
  }
  if (typeof pc.total !== 'bigint' || pc.total < 0n) {
    throw new Error('authoritative Issue witness ProtectedCapital total is invalid')
  }
  if (componentValues.reduce((sum, value) => sum + value, 0n) !== pc.total) {
    throw new Error('authoritative Issue witness ProtectedCapital total does not match components')
  }
  for (const value of Object.values(pc.accountingInputs ?? {})) {
    if (typeof value !== 'bigint' || value < 0n) {
      throw new Error('authoritative Issue witness ProtectedCapital accounting input is invalid')
    }
  }

  const vc = candidate.viabilityCertificate as
    | IssueViabilityCertificateEvidence
    | undefined
  if (!vc) {
    throw new Error('authoritative Issue witness requires a complete viability certificate')
  }
  requiredString(vc.id, 'viabilityCertificate.id')
  requiredString(vc.version, 'viabilityCertificate.version')
  requiredString(vc.modelReference, 'viabilityCertificate.modelReference')
  requiredString(
    vc.characteristicPredicateReference,
    'viabilityCertificate.characteristicPredicateReference',
  )
  requiredString(vc.witnessSelectorReference, 'viabilityCertificate.witnessSelectorReference')
  requiredString(vc.boundsReference, 'viabilityCertificate.boundsReference')
  assertDigest(vc.digest, 'viabilityCertificate.digest')
  assertEvidenceRecord(
    vc.proofs,
    ['VC1', 'VC2', 'VC3', 'VC4', 'VC5', 'VC6'],
    'viabilityCertificate.proofs',
  )
  assertEvidenceRecord(
    vc.evidence,
    ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'],
    'viabilityCertificate.evidence',
  )

  const carrier = candidate.v3CarrierBinding as
    | IssueAdmissionV3CarrierBinding
    | undefined
  if (!carrier) {
    throw new Error('authoritative Issue witness requires the V3 carrier binding')
  }
  requiredString(carrier.carrierStateReference, 'v3CarrierBinding.carrierStateReference')
  if (!carrier.candidateState || typeof carrier.candidateState !== 'object') {
    throw new Error('v3CarrierBinding.candidateState is required')
  }
  if (pc.sourceReference !== carrier.carrierStateReference) {
    throw new Error('ProtectedCapital provenance is not bound to the V3 carrier')
  }
}

export async function resolveAuthoritativeIssueAdmission(
  source: AuthoritativeIssueAdmissionSource,
  inputs: IssueAdmissionRuntimeInputs,
  _classEvidence?: unknown,
): Promise<AuthoritativeIssueAdmissionWitness> {
  if (!source || typeof source !== 'object') {
    throw new Error('authoritative Issue source is required')
  }
  requiredString(source.id, 'authoritative Issue source id')
  requiredString(source.version, 'authoritative Issue source version')
  if (typeof source.provider !== 'function') {
    throw new Error('authoritative Issue source provider is required')
  }

  if (inputs.poolUsdmValue < 0n) {
    throw new Error('runtime Pool USDM value must be non-negative')
  }

  const witness = await source.provider(inputs)
  assertAuthoritativeIssueAdmissionWitness(witness)

  assertEconomicAdmission(
    witness,
    [
      inputs.counterInputReference,
      inputs.poolInputReference,
      inputs.carrierStateReference
        ? inputs.carrierStateReference
        : witness.v3CarrierBinding.carrierStateReference,
    ],
    inputs.liquiditySourceReferences,
    'Issue',
  )

  validateAuthoritativeIssueAdmissionDecision(witness)

  if (witness.authenticatedPoolInputReference !== inputs.poolInputReference) {
    throw new Error(
      'authoritative Issue witness is bound to a different B1 PrizePool input',
    )
  }

  if (witness.authenticatedPoolUsdmValue !== inputs.poolUsdmValue) {
    throw new Error(
      'authoritative Issue witness Pool valuation does not match runtime input',
    )
  }

  if (
    inputs.carrierStateReference &&
    witness.v3CarrierBinding.carrierStateReference !==
      inputs.carrierStateReference
  ) {
    throw new Error(
      'authoritative Issue witness is bound to a different V3 carrier state',
    )
  }

  return witness
}
