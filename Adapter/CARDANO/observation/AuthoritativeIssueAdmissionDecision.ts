/**
 * Canonical integrity boundary for an authoritative PRE-RICH Issue decision.
 *
 * This module does not decide economics. It only validates the shape and
 * cross-field bindings of a decision produced by the authoritative
 * economic/refinement layer before that decision becomes a Cardano witness.
 */
import type { ExecutableLiquidityObservation } from './ExecutableLiquidityObservation'
import type { AuthoritativeIssueAdmissionDecision } from './AuthoritativeIssueAdmission'

function nonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(name + ' must be non-empty')
}

function digest(value: string, name: string): void {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(name + ' must be a 32-byte hex digest')
  }
}

function nonNegative(value: bigint, name: string): void {
  if (value < 0n) throw new Error(name + ' must be non-negative')
}

export function validateAuthoritativeIssueAdmissionDecision(
  decision: AuthoritativeIssueAdmissionDecision,
): void {
  nonEmpty(decision.gateVersion, 'gateVersion')
  nonEmpty(decision.decisionReference, 'decisionReference')
  nonEmpty(
    decision.authoritativeObservationReference,
    'authoritativeObservationReference',
  )
  digest(decision.stateHash, 'stateHash')
  digest(decision.actionFingerprint, 'actionFingerprint')
  digest(decision.postStateHash, 'postStateHash')
  nonNegative(decision.eev, 'eev')
  nonNegative(
    decision.authenticatedPoolUsdmValue,
    'authenticatedPoolUsdmValue',
  )
  nonNegative(
    decision.requiredImmediateLiquidity,
    'requiredImmediateLiquidity',
  )

  const observation: ExecutableLiquidityObservation =
    decision.executableLiquidityObservation

  if (
    observation.observationReference !==
    decision.authoritativeObservationReference
  ) {
    throw new Error(
      'decision observation reference does not match executable-liquidity observation',
    )
  }

  // The observation schema exposes its exact candidate inputs as
  // sourceInputReferences; bind the authoritative Pool reference to that
  // canonical source list rather than reading a non-existent shadow field.
  const sourceReferences = observation.sourceInputReferences.map((ref) =>
    ref.toLowerCase(),
  )
  if (
    sourceReferences.length !== 1 ||
    sourceReferences[0] !== decision.authenticatedPoolInputReference.toLowerCase()
  ) {
    throw new Error(
      'decision Pool input reference does not match executable-liquidity observation',
    )
  }

  const poolRef = decision.authenticatedPoolInputReference.toLowerCase()
  const observedPoolUtxo = observation.utxos.find(
    (utxo) => (utxo.txHash.toLowerCase() + '#' + utxo.index) === poolRef,
  )
  if (!observedPoolUtxo) {
    throw new Error(
      'decision Pool input reference does not match observed executable-liquidity UTxO',
    )
  }

  if (
    observation.declaredUsdmLiquidity !==
    decision.authenticatedPoolUsdmValue
  ) {
    throw new Error(
      'decision Pool valuation does not match executable-liquidity observation',
    )
  }

  if (
    observation.declaredUsdmLiquidity <
    decision.requiredImmediateLiquidity
  ) {
    throw new Error(
      'decision required immediate liquidity exceeds executable liquidity observation',
    )
  }
}
