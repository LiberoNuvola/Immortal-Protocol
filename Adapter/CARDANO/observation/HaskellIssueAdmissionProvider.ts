/**
 * Node/relayer adapter for the authoritative Haskell Issue producer.
 *
 * This module is intentionally server-side. It is not imported by the
 * browser bundle. The economic decision is produced by the Haskell
 * PreRichEconomicAdmission path; TypeScript only binds that result to the
 * exact observed Cardano inputs.
 */
import { spawn } from 'node:child_process'
import {
  createAuthoritativeIssueAdmissionProvider,
  type AuthoritativeIssueAdmissionDecision,
} from './AuthoritativeIssueAdmission'

export type HaskellIssueObservation = {
  decisionInput: Record<string, unknown>
  decisionReference: string
  observationReference: string
  poolInputReference: string
  poolUsdmValue: bigint
  carrierInputReference: string
  carrierPolicyId: string
  carrierTokenNameHex: string
  liquiditySourceReferences: readonly string[]
}

export type HaskellIssueAdmissionProviderOptions = {
  command: string
  args?: readonly string[]
  observationSource: (
    inputs: {
      counterInputReference: string
      poolInputReference: string
      liquiditySourceReferences: readonly string[]
      poolUsdmValue: bigint
    },
  ) => Promise<HaskellIssueObservation>
}

type HaskellDecisionEnvelope = {
  admitted: boolean
  error?: string
  decision?: {
    actionClass: string
    action: string
    stateHash: string
    postStateHash: string
    actionFingerprint: string
    decisionReference: string
    authoritativeObservationReference: string
    preEEV: string
    candidateEEV: string
    availableExecutableLiquidity: string
    requiredImmediateLiquidity: string
    candidateState: Record<string, unknown>
  }
}

function runProducer(
  command: string,
  args: readonly string[],
  input: Record<string, unknown>,
): Promise<HaskellDecisionEnvelope> {
  const normalizeBigInts = (value: unknown): unknown => {
    if (typeof value === 'bigint') return value.toString()
    if (Array.isArray(value)) return value.map(normalizeBigInts)
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
          key,
          normalizeBigInts(entry),
        ]),
      )
    }
    return value
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk