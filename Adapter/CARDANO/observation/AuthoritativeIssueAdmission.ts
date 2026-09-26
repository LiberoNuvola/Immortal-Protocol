/**
 * Authoritative PRE-RICH Issue admission producer.
 *
 * This is the server/relayer-side boundary between an already-authoritative
 * economic decision and the Cardano runtime witness. It deliberately does
 * not calculate EEV, protected capital, viability or liquidity valuation.
 * Those values must arrive in the canonical admission decision.
 *
 * The browser may consume the resulting witness but cannot manufacture it.
 */
import {
  assertEconomicAdmission,
  type EconomicAdmissionWitness,
} from '../runtime/EconomicAdmission'
import type {
  ExecutableLiquidityObservation,
} from './ExecutableLiquidityObservation'
import {
  validateAuthoritativeIssueAdmissionDecision,
} from './AuthoritativeIssueAdmissionDecision'
import type {
  AuthoritativeIssueAdmissionProvider,
  IssueAdmissionRuntimeInputs,
} from '../../../src/preRichIssueAdmissionBridge'

export type AuthoritativeIssueAdmissionDecision = {
  gateVersion: string
  decisionReference: string
  authoritativeObservationReference: string
  stateHash: string
  actionFingerprint: string
  postStateHash: string
  eev: bigint
  executableLiquidityObservation: ExecutableLiquidityObservation
  authenticatedPoolInputReference: string
  authenticatedPoolUsdmValue: bigint
  requiredImmediateLiquidity: bigint
}

/**
 * Construct the runtime provider from one authoritative admission decision.
 *
 * The provider is intentionally single-decision and input-bound: a decision
 * can only cross the boundary when its canonical integrity and its Pool
 * reference/value exactly match the runtime inputs supplied by the caller.
 */
export function createAuthoritativeIssueAdmissionProvider(
  decisionSource: (
    inputs: IssueAdmissionRuntimeInputs,
  ) => Promise<AuthoritativeIssueAdmissionDecision>,
): AuthoritativeIssueAdmissionProvider {
  return async (inputs) => {
    const decision = await decisionSource(inputs)

    validateAuthoritativeIssueAdmissionDecision(decision)

    const witness: EconomicAdmissionWitness = {
      gateVersion: decision.gateVersion,
      admitted: true,
      decisionReference: decision.decisionReference,
      authoritativeObservationReference:
        decision.authoritativeObservationReference,
      stateHash: decision.stateHash,
      actionClass: 'Issue',
      actionFingerprint: decision.actionFingerprint,
      postStateHash: decision.postStateHash,
      eev: decision.eev,
      executableLiquidityObservation:
        decision.executableLiquidityObservation,
      authenticatedPoolInputReference:
        decision.authenticatedPoolInputReference,
      authenticatedPoolUsdmValue:
        decision.authenticatedPoolUsdmValue,
      requiredImmediateLiquidity:
        decision.requiredImmediateLiquidity,
    }

    assertEconomicAdmission(
      witness,
      [inputs.counterInputReference, inputs.poolInputReference],
      inputs.liquiditySourceReferences,
      'Issue',
    )

    if (
      witness.authenticatedPoolInputReference !==
      inputs.poolInputReference
    ) {
      throw new Error(
        'authoritative Issue decision is bound to a different PrizePool input',
      )
    }

    if (
      witness.authenticatedPoolUsdmValue !==
      inputs.poolUsdmValue
    ) {
      throw new Error(
        'authoritative Issue decision has a different PrizePool valuation',
      )
    }

    return witness
  }
}
