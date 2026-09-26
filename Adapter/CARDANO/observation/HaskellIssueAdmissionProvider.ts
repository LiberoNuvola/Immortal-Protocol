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
    preEEV: number
    candidateEEV: number
    availableExecutableLiquidity: number
    requiredImmediateLiquidity: number
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
) {
  return createAuthoritativeIssueAdmissionProvider(async (inputs) => {
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

    if (
      decision.decisionReference !== observed.decisionReference ||
      decision.authoritativeObservationReference !==
        observed.observationReference
    ) {
      throw new Error(
        'Haskell Issue decision identity does not match the authoritative observation',
      )
    }

    const observation = {
      observationReference: observed.observationReference,
      observedAt: Date.now(),
      sourceInputReferences: [...observed.liquiditySourceReferences],
      utxos: [{
        txHash: observed.poolInputReference.split('#')[0],
        index: Number(observed.poolInputReference.split('#')[1]),
        usdmValue: observed.poolUsdmValue,
        spendable: true,
        ringFenced: false,
      }],
      declaredUsdmLiquidity: BigInt(
        decision.availableExecutableLiquidity,
      ),
    }

    const result: AuthoritativeIssueAdmissionDecision = {
      gateVersion: 'pre-rich-economic-gate-v1',
      decisionReference: decision.decisionReference,
      authoritativeObservationReference:
        decision.authoritativeObservationReference,
      stateHash: decision.stateHash,
      actionFingerprint: decision.actionFingerprint,
      postStateHash: decision.postStateHash,
      eev: BigInt(decision.candidateEEV),
      executableLiquidityObservation: observation,
      authenticatedPoolInputReference:
        observed.poolInputReference,
      authenticatedPoolUsdmValue: observed.poolUsdmValue,
      requiredImmediateLiquidity:
        BigInt(decision.requiredImmediateLiquidity),
    }

    return result
  })
}
