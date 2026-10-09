/**
 * Server-side composition of the real Preprod Issue authority boundary.
 *
 * This factory does not invent EEV, control state, ProtectedCapital or
 * viability. It only composes:
 *
 *   live Cardano observation
 *     -> signed authority evidence (EEV + certificates)
 *     -> canonical Haskell IssueDecision
 *     -> runtime EconomicAdmissionWitness
 *
 * The signed authority endpoint remains an external dependency. If it is
 * unavailable, malformed, stale or not cryptographically valid, Issue fails
 * closed.
 */

import type { AuthoritativeIssueAdmissionProvider } from '../../../src/preRichIssueAdmissionBridge'
import { observePreprodDirectUsdmPool } from './PreprodDirectUsdmObservation'
import {
  createHaskellIssueAdmissionProvider,
  type HaskellIssueObservation,
} from './HaskellIssueAdmissionProvider'

const { readPreprodIssueObservation } = require('../../../relayer/preprodIssueObservationReader') as {
  readPreprodIssueObservation: (args: Record<string, unknown>) => Promise<{
    observationReference: string
    observedAt: bigint
    counterInputReference: string
    poolInputReference: string
    poolUsdmValue: bigint
    carrierStateReference: string
    controlStateReference: string
    eevQualification: unknown
    protectedCapitalProvenance: unknown
    viabilityCertificate: unknown
    decisionInput: Record<string, unknown>
  }>
}

const { fetchSignedIssueAuthority } = require('../../../relayer/signedIssueAuthority') as {
  fetchSignedIssueAuthority: (args: {
    baseUrl: string
    publicKeyPem: string
    request: Record<string, unknown>
  }) => Promise<Record<string, unknown>>
}

export type PreprodAuthoritativeIssueProviderOptions = {
  lucid: unknown
  deployment: {
    counterAddress: string
    b1PrizePoolAddress: string
    poolTokenUnit: string
    carrierAddress: string
    carrierPolicyId: string
    carrierTokenNameHex: string
    controlAddress: string
    controlPolicyId: string
    controlTokenNameHex: string
  }
  authorityUrl: string
  authorityPublicKeyPem: string
  directUsdmUnit: string
  command: string
  args?: readonly string[]
  /**
   * Time used to validate the signed authority freshness window.
   * This is evaluation time, not the source observation timestamp.
   */
  currentObservedAt?: bigint
}

export function createPreprodAuthoritativeIssueProvider(
  options: PreprodAuthoritativeIssueProviderOptions,
): AuthoritativeIssueAdmissionProvider {
  if (!options.lucid) throw new Error('lucid is required')
  if (!options.authorityUrl.trim()) throw new Error('authorityUrl is required')
  if (!options.authorityPublicKeyPem.trim()) {
    throw new Error('authorityPublicKeyPem is required')
  }
  if (!options.directUsdmUnit.trim()) {
    throw new Error('directUsdmUnit is required')
  }
  if (!options.deployment.controlAddress.trim()) {
    throw new Error('controlAddress is required')
  }
  if (!options.deployment.controlPolicyId.trim()) {
    throw new Error('controlPolicyId is required')
  }
  if (!options.deployment.controlTokenNameHex.trim()) {
    throw new Error('controlTokenNameHex is required')
  }
  if (!options.command.trim()) throw new Error('command is required')

  const observationSource = async (inputs: {
    counterInputReference: string
    poolInputReference: string
    liquiditySourceReferences: readonly string[]
    poolUsdmValue: bigint
    classId: bigint
    price: bigint
    carrierStateReference?: string
  }): Promise<HaskellIssueObservation> => {
    const request = {
      counterInputReference: inputs.counterInputReference,
      poolInputReference: inputs.poolInputReference,
      carrierStateReference: inputs.carrierStateReference,
      controlStateReference: inputs.controlStateReference,
      classId: inputs.classId,
      price: inputs.price,
      observationReference: undefined,
      observedAt: undefined,
    }

    const observed = await readPreprodIssueObservation({
      lucid: options.lucid,
      ...options.deployment,
      classId: Number(inputs.classId),
      price: Number(inputs.price),
      authoritySource: async (authorityRequest: Record<string, unknown>) => {
        const direct = await observePreprodDirectUsdmPool({
          lucid: options.lucid as {
            utxosAt(address: string): Promise<any[]>
          },
          poolAddress: options.deployment.b1PrizePoolAddress,
          poolInputReference: String(authorityRequest.poolInputReference),
          poolTokenUnit: options.deployment.poolTokenUnit,
          directUsdmUnit: options.directUsdmUnit,
          observationReference: String(authorityRequest.observationReference),
          observedAt:
            authorityRequest.observedAt === undefined ||
            authorityRequest.observedAt === null
              ? undefined
              : BigInt(String(authorityRequest.observedAt)),
        })

        const authority = await fetchSignedIssueAuthority({
          baseUrl: options.authorityUrl,
          publicKeyPem: options.authorityPublicKeyPem,
          request: {
            ...request,
            ...authorityRequest,
            directUsdmUnit: options.directUsdmUnit,
            controlStateReference: inputs.controlStateReference,
            directUsdmObservedValue: direct.poolUsdmValue.toString(),
            directUsdmObservationReference: direct.observationReference,
            directUsdmObservedAt: direct.observedAt.toString(),
          },
        })

        if (
          authority.controlStateReference !==
          'cardano:tx/' + inputs.controlStateReference
        ) {
          throw new Error(
            'signed authority B2 control reference does not match direct observed control state',
          )
        }

        if (BigInt(String(authority.poolUsdmValue)) !== direct.poolUsdmValue) {
          throw new Error(
            'signed authority Pool valuation does not match direct physical USDM observation',
          )
        }

        if (
          authority.preEEV !== undefined &&
          BigInt(String(authority.preEEV)) !== direct.poolUsdmValue
        ) {
          throw new Error(
            'signed authority preEEV does not match direct physical USDM observation',
          )
        }

        if (
          authority.candidateEEV !== undefined &&
          BigInt(String(authority.candidateEEV)) !== direct.poolUsdmValue
        ) {
          throw new Error(
            'signed authority candidateEEV does not match direct physical USDM observation',
          )
        }

        if (
          authority.observedAt !== undefined &&
          BigInt(String(authority.observedAt)) !== direct.observedAt
        ) {
          throw new Error(
            'signed authority observedAt does not match direct physical observation timestamp',
          )
        }

        const qualification = authority.eevQualification as
          | Record<string, unknown>
          | undefined
        const approval = qualification?.deploymentApproval as
          | Record<string, unknown>
          | undefined

        if (
          qualification &&
          qualification.status !== 'qualified'
        ) {
          throw new Error('signed authority did not provide qualified EEV evidence')
        }

        if (
          approval &&
          approval.profileVersion !== 'PRE-RICH-EEV-USDM-DIRECT-V1'
        ) {
          throw new Error('signed authority EEV profile does not match direct-USDM V1')
        }

        return authority
      },
      ...(options.currentObservedAt === undefined
        ? {}
        : { observedAt: options.currentObservedAt }),
    })

    return {
      decisionInput: observed.decisionInput,
      decisionReference: String((observed.decisionInput as Record<string, unknown>).decisionReference),
      observationReference: observed.observationReference,
      poolInputReference: observed.poolInputReference,
      poolUsdmValue: observed.poolUsdmValue,
      liquiditySourceReferences: [observed.poolInputReference],
      carrierStateReference: observed.carrierStateReference.replace(/^cardano:tx\//, ''),
      controlStateReference: observed.controlStateReference.replace(/^cardano:tx\//, ''),
      eevQualification: observed.eevQualification as HaskellIssueObservation['eevQualification'],
      protectedCapitalProvenance:
        observed.protectedCapitalProvenance as HaskellIssueObservation['protectedCapitalProvenance'],
      viabilityCertificate:
        observed.viabilityCertificate as HaskellIssueObservation['viabilityCertificate'],
      observedAt: observed.observedAt,
    }
  }

  return createHaskellIssueAdmissionProvider({
    command: options.command,
    args: options.args,
    observationSource,
  })
}
