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

export type AuthoritativeIssueAdmissionProvider = (
  inputs: IssueAdmissionRuntimeInputs,
) => Promise<EconomicAdmissionWitness>

export type IssueAdmissionRuntimeInputs = {
  counterInputReference: string
  poolInputReference: string
  liquiditySourceReferences: readonly string[]
  poolUsdmValue: bigint
  carrierStateReference?: string
}

export type AuthoritativeIssueAdmissionSource = {
  id: string
  version: string
  provider: AuthoritativeIssueAdmissionProvider
}

function requiredString(value: string, name: string): void {
  if (!value.trim()) throw new Error(name + ' must be non-empty')
}

export async function resolveAuthoritativeIssueAdmission(
  source: AuthoritativeIssueAdmissionSource,
  inputs: IssueAdmissionRuntimeInputs,
  _classEvidence?: unknown,
): Promise<EconomicAdmissionWitness> {
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

  assertEconomicAdmission(
    witness,
    [
      inputs.counterInputReference,
      inputs.poolInputReference,
      ...(inputs.carrierStateReference
        ? [inputs.carrierStateReference]
        : []),
    ],
    inputs.liquiditySourceReferences,
    'Issue',
  )

  validateAuthoritativeIssueAdmissionDecision(witness)

  if (
    witness.authenticatedPoolInputReference !==
    inputs.poolInputReference
  ) {
    throw new Error(
      'authoritative Issue witness is bound to a different B1 PrizePool input',
    )
  }

  if (witness.authenticatedPoolUsdmValue !== inputs.poolUsdmValue) {
    throw new Error(
      'authoritative Issue witness Pool valuation does not match runtime input',
    )
  }

  return witness
}
