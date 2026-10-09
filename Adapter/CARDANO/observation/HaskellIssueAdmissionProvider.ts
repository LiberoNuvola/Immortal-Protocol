/**
 * Node/relayer adapter for the authoritative Haskell Issue producer.
 *
 * This module is intentionally server-side. It is not imported by the
 * browser bundle. The economic decision is produced by the Haskell
 * PreRichEconomicAdmission path; TypeScript only binds that result to the
 * exact observed Cardano inputs.
 */
import { spawn } from 'node:child_process'
import type {
  AuthoritativeIssueAdmissionProvider,
  AuthoritativeIssueAdmissionWitness,
  IssueV3CandidateState,
  EevQualificationEvidence,
  ProtectedCapitalProvenance,
  ViabilityCertificateEvidence,
} from '../../../src/preRichIssueAdmissionBridge'

export type HaskellIssueObservation = {
  decisionInput: Record<string, unknown>
  decisionReference: string
  observationReference: string
  poolInputReference: string
  poolUsdmValue: bigint
  liquiditySourceReferences: readonly string[]
  carrierStateReference: string
  eevQualification: EevQualificationEvidence
  protectedCapitalProvenance: ProtectedCapitalProvenance
  viabilityCertificate: ViabilityCertificateEvidence
  /**
   * Timestamp of the authenticated observation snapshot, in milliseconds.
   * This value is provenance data and must not be replaced by local wall-clock time.
   */
  observedAt: bigint
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
      classId: bigint
      price: bigint
      carrierStateReference?: string
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
    candidateState: IssueV3CandidateState
    protectedCapitalProvenance?: {
      sourceType?: string
      components: {
        crystallizedLiabilities: string
        worstCaseExposure: string
        safetyCapital: string
        reserveProtection: string
        lockedJackpot: string
        mandatoryFutureCosts: string
      }
      accountingInputs: {
        unresolvedReserve: string
        unresolvedTicketCount: string
      }
      total: string
    }
  }
}

function runProducer(
  command: string,
  args: readonly string[],
  input: Record<string, unknown>,
): Promise<HaskellDecisionEnvelope> {
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
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      let parsed: HaskellDecisionEnvelope
      try {
        parsed = JSON.parse(stdout) as HaskellDecisionEnvelope
      } catch {
        reject(
          new Error(
            `Haskell Issue producer emitted invalid JSON (exit=${code}): ${stderr || stdout}`,
          ),
        )
        return
      }

      if (code !== 0 || parsed.admitted !== true || !parsed.decision) {
        reject(
          new Error(
            parsed.error ||
              `Haskell Issue producer rejected the transition (exit=${code})`,
          ),
        )
        return
      }

      resolve(parsed)
    })

    child.stdin.end(JSON.stringify(input))
  })
}

export function createHaskellIssueAdmissionProvider(
  options: HaskellIssueAdmissionProviderOptions,
): AuthoritativeIssueAdmissionProvider {
  return async (inputs) => {
    const observed = await options.observationSource(inputs)
    const envelope = await runProducer(
      options.command,
      options.args ?? [],
      observed.decisionInput,
    )

    const decision = envelope.decision
    if (!decision) {
      throw new Error('Haskell Issue producer returned no decision')
    }

    if (decision.actionClass !== 'Issue') {
      throw new Error('Haskell Issue producer returned a non-Issue action')
    }
    const expectedAction = `Issue:${inputs.classId.toString()}:${inputs.price.toString()}`
    if (decision.action !== expectedAction) {
      throw new Error(
        `Haskell Issue producer action mismatch: expected ${expectedAction}, got ${decision.action}`,
      )
    }
    if (BigInt(String(decision.preEEV)) !== BigInt(String(observed.decisionInput.preEEV))) {
      throw new Error('Haskell Issue producer pre-EEV does not match authoritative decision input')
    }
    if (BigInt(String(decision.candidateEEV)) !== BigInt(String(observed.decisionInput.candidateEEV))) {
      throw new Error('Haskell Issue producer candidate EEV does not match authoritative decision input')
    }
    if (BigInt(String(decision.availableExecutableLiquidity)) !== observed.poolUsdmValue) {
      throw new Error('Haskell Issue producer executable liquidity does not match observed Pool value')
    }
    const rawProtectedCapitalProvenance = decision.protectedCapitalProvenance
    if (!rawProtectedCapitalProvenance) {
      throw new Error('Haskell Issue producer did not emit ProtectedCapital provenance')
    }

    if (
      decision.decisionReference !== observed.decisionReference ||
      decision.authoritativeObservationReference !==
        observed.observationReference
    ) {
      throw new Error(
        'Haskell Issue decision identity does not match the authoritative observation',
      )
    }

    if (!decision.candidateState) {
      throw new Error('Haskell Issue producer returned no candidate V3 state')
    }
    if (!inputs.carrierStateReference) {
      throw new Error(
        'authoritative Issue provider requires the exact V3 carrier state reference',
      )
    }

    const protectedCapitalProvenance: ProtectedCapitalProvenance = {
      sourceReference: observed.carrierStateReference,
      components: {
        crystallizedLiabilities: BigInt(
          String(rawProtectedCapitalProvenance.components.crystallizedLiabilities),
        ),
        worstCaseExposure: BigInt(
          String(rawProtectedCapitalProvenance.components.worstCaseExposure),
        ),
        safetyCapital: BigInt(
          String(rawProtectedCapitalProvenance.components.safetyCapital),
        ),
        reserveProtection: BigInt(
          String(rawProtectedCapitalProvenance.components.reserveProtection),
        ),
        lockedJackpot: BigInt(
          String(rawProtectedCapitalProvenance.components.lockedJackpot),
        ),
        mandatoryFutureCosts: BigInt(
          String(rawProtectedCapitalProvenance.components.mandatoryFutureCosts),
        ),
      },
      accountingInputs: {
        unresolvedReserve: BigInt(
          String(rawProtectedCapitalProvenance.accountingInputs.unresolvedReserve),
        ),
        unresolvedTicketCount: BigInt(
          String(rawProtectedCapitalProvenance.accountingInputs.unresolvedTicketCount),
        ),
      },
      total: BigInt(String(rawProtectedCapitalProvenance.total)),
    }

    const observation = {
      observationReference: observed.observationReference,
      observedAt: observed.observedAt,
      sourceInputReferences: [...observed.liquiditySourceReferences],
      utxos: [{
        txHash: observed.poolInputReference.split('#')[0],
        index: Number(observed.poolInputReference.split('#')[1]),
        usdmValue: observed.poolUsdmValue,
        spendable: true,
        ringFenced: false,
      }],
      declaredUsdmLiquidity: BigInt(decision.availableExecutableLiquidity),
    }

    const result: AuthoritativeIssueAdmissionWitness = {
      admitted: true,
      actionClass: 'Issue',
      gateVersion: 'pre-rich-economic-gate-v1',
      decisionReference: decision.decisionReference,
      authoritativeObservationReference:
        decision.authoritativeObservationReference,
      stateHash: decision.stateHash,
      actionFingerprint: decision.actionFingerprint,
      postStateHash: decision.postStateHash,
      preEEV: BigInt(decision.preEEV),
      issueClassId: inputs.classId,
      issuePrice: inputs.price,
      eev: BigInt(decision.candidateEEV),
      executableLiquidityObservation: observation,
      authenticatedPoolInputReference:
        observed.poolInputReference,
      authenticatedPoolUsdmValue: observed.poolUsdmValue,
      requiredImmediateLiquidity:
        BigInt(decision.requiredImmediateLiquidity),
      v3CarrierBinding: {
        carrierStateReference: inputs.carrierStateReference,
        candidateState: decision.candidateState,
      },
      eevQualification: observed.eevQualification,
      protectedCapitalProvenance,
      viabilityCertificate: observed.viabilityCertificate,
    }

    return result
  }
}
