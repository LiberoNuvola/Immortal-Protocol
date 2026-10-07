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
  }
  authorityUrl: string
  authorityPublicKeyPem: string
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
      authoritySource: async (authorityRequest: Record<string, unknown>) =>
        fetchSignedIssueAuthority({
          baseUrl: options.authorityUrl,
          publicKeyPem: options.authorityPublicKeyPem,
          request: {
            ...request,
            ...authorityRequest,
          },
        }),
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
