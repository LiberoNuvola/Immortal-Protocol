/**
 * Runtime witness crossing the economic-gate boundary into an economic
 * Cardano submission.
 *
 * The adapter does not calculate EEV, ProtectedCapital, viability or Ω.
 * Those values belong to the authoritative economic/profile layer.
 * This witness is deliberately explicit so an economic transaction cannot
 * silently bypass the gate by calling the generic Cardano submitter.
 */
import {
  assertExecutableLiquidityBoundToInputs,
  assertExecutableLiquidityMatchesAuthenticatedPool,
  type ExecutableLiquidityObservation,
} from '../observation/ExecutableLiquidityObservation'

export type EconomicActionClass = 'Issue' | 'Reveal' | 'Claim' | 'Expire'

export type EconomicAdmissionWitness = {
  gateVersion: string
  admitted: true
  decisionReference: string
  authoritativeObservationReference: string
  /** Canonical V3 pre-state fingerprint. */
  stateHash: string
  /** Canonical economic action being admitted (Issue/Reveal/Claim/Expire). */
  actionClass: EconomicActionClass
  /** Canonical action fingerprint bound to the economic decision. */
  actionFingerprint: string
  /** Canonical V3 candidate post-state fingerprint. */
  postStateHash: string
  eev: bigint
  executableLiquidityObservation: ExecutableLiquidityObservation
  /** Independently authenticated B1 PrizePool state used for value correlation. */
  authenticatedPoolInputReference: string
  authenticatedPoolUsdmValue: bigint
  requiredImmediateLiquidity: bigint
}

export function assertEconomicAdmission(
  witness: EconomicAdmissionWitness | undefined,
  inputReferences: readonly string[],
  liquiditySourceReferences: readonly string[],
  expectedActionClass?: EconomicActionClass,
): asserts witness is EconomicAdmissionWitness {
  if (!witness || witness.admitted !== true) {
    throw new Error(
      'Economic admission required: economic Cardano submission cannot bypass the Economic Gate',
    )
  }
  if (!witness.gateVersion.trim()) {
    throw new Error('Economic admission gateVersion is required')
  }
  if (!witness.decisionReference.trim()) {
    throw new Error('Economic admission decisionReference is required')
  }
  if (!witness.authoritativeObservationReference.trim()) {
    throw new Error('Economic admission authoritativeObservationReference is required')
  }
  if (!/^[0-9a-fA-F]{64}$/.test(witness.stateHash)) {
    throw new Error('Economic admission stateHash must be a 32-byte hex digest')
  }
  if (!witness.actionClass.trim()) {
    throw new Error('Economic admission actionClass is required')
  }
  if (expectedActionClass && witness.actionClass !== expectedActionClass) {
    throw new Error(
      `Economic admission actionClass mismatch: expected ${expectedActionClass}, got ${witness.actionClass}`,
    )
  }
  if (!/^[0-9a-fA-F]{64}$/.test(witness.actionFingerprint)) {
    throw new Error('Economic admission actionFingerprint must be a 32-byte hex digest')
  }
  if (!/^[0-9a-fA-F]{64}$/.test(witness.postStateHash)) {
    throw new Error('Economic admission postStateHash must be a 32-byte hex digest')
  }
  if (witness.eev < 0n) {
    throw new Error('Economic admission EEV must be non-negative')
  }
  if (witness.requiredImmediateLiquidity < 0n) {
    throw new Error('required immediate liquidity must be non-negative')
  }

  assertExecutableLiquidityBoundToInputs(
    witness.executableLiquidityObservation,
    inputReferences,
  )

  if (!witness.authenticatedPoolInputReference.trim()) {
    throw new Error('authenticated B1 PrizePool input reference is required')
  }
  if (witness.authenticatedPoolUsdmValue < 0n) {
    throw new Error('authenticated B1 PrizePool USDM valuation must be non-negative')
  }
  assertExecutableLiquidityMatchesAuthenticatedPool(
    witness.executableLiquidityObservation,
    witness.authenticatedPoolInputReference,
    witness.authenticatedPoolUsdmValue,
  )

  const observedSources = witness.executableLiquidityObservation.sourceInputReferences
    .map((ref) => ref.toLowerCase())
    .sort()
  const expectedSources = liquiditySourceReferences
    .map((ref) => ref.toLowerCase())
    .sort()
  if (
    observedSources.length !== expectedSources.length ||
    observedSources.some((ref, index) => ref !== expectedSources[index])
  ) {
    throw new Error('executable liquidity source inputs do not match economic action source')
  }

  if (
    witness.executableLiquidityObservation.observationReference !==
    witness.authoritativeObservationReference
  ) {
    throw new Error('executable liquidity observation reference mismatch')
  }

  if (
    witness.executableLiquidityObservation.declaredUsdmLiquidity <
    witness.requiredImmediateLiquidity
  ) {
    throw new Error(
      'required immediate liquidity exceeds observed spendable liquidity',
    )
  }
}
