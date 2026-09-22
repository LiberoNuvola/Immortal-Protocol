/**
 * PRE-RICH application boundary for the frozen Genesis bootstrap predicate.
 *
 * This module does not implement an oracle and does not move funds.
 * It composes verified Treasury observation with an already-verified
 * PRE/USDM price. On-chain revalidation remains a separate obligation.
 */

export const GENESIS_PRE_TREASURY_THRESHOLD_USDM = 4_000n

export type GenesisTreasuryObservation = {
  sourceRegime: 'PRE-GENESIS' | 'GENESIS'
  treasuryIdentity: string
  treasuryStateReference: string
  prePolicyId: string
  preAssetNameHex: string
  preQuantity: bigint
  verifiedPreUsdmPrice: bigint
  oracleStateReference: string
  oraclePublisher: string
  oracleTimestamp: bigint
  observedAt: bigint
  sourceStateHash: string
  valuationVerified: boolean
  oracleFresh: boolean
}

export type GenesisTreasuryAdmission =
  | {
      admitted: true
      verifiedTreasuryValueUsdm: bigint
      observation: GenesisTreasuryObservation
    }
  | {
      admitted: false
      reason:
        | 'WRONG_SOURCE_REGIME'
        | 'WRONG_TREASURY'
        | 'INVALID_ASSET'
        | 'INVALID_QUANTITY'
        | 'INVALID_PRICE'
        | 'ORACLE_UNVERIFIED'
        | 'ORACLE_STALE'
        | 'BELOW_THRESHOLD'
    }

export function verifiedTreasuryPreValueUsdm(
  observation: GenesisTreasuryObservation,
): bigint | null {
  if (!observation.valuationVerified || !observation.oracleFresh) return null
  if (observation.preQuantity < 0n || observation.verifiedPreUsdmPrice < 0n) return null
  return observation.preQuantity * observation.verifiedPreUsdmPrice
}

export function admitGenesisTreasury(
  observation: GenesisTreasuryObservation,
  canonicalTreasuryIdentity: string,
  canonicalPrePolicyId: string,
  canonicalPreAssetNameHex: string,
): GenesisTreasuryAdmission {
  if (observation.sourceRegime !== 'PRE-GENESIS') {
    return { admitted: false, reason: 'WRONG_SOURCE_REGIME' }
  }
  if (observation.treasuryIdentity !== canonicalTreasuryIdentity) {
    return { admitted: false, reason: 'WRONG_TREASURY' }
  }
  if (
    observation.prePolicyId !== canonicalPrePolicyId ||
    observation.preAssetNameHex !== canonicalPreAssetNameHex
  ) {
    return { admitted: false, reason: 'INVALID_ASSET' }
  }
  if (observation.preQuantity < 0n) {
    return { admitted: false, reason: 'INVALID_QUANTITY' }
  }
  if (observation.verifiedPreUsdmPrice < 0n) {
    return { admitted: false, reason: 'INVALID_PRICE' }
  }
  if (!observation.valuationVerified) {
    return { admitted: false, reason: 'ORACLE_UNVERIFIED' }
  }
  if (!observation.oracleFresh) {
    return { admitted: false, reason: 'ORACLE_STALE' }
  }

  const verifiedTreasuryValueUsdm = verifiedTreasuryPreValueUsdm(observation)
  if (verifiedTreasuryValueUsdm === null) {
    return { admitted: false, reason: 'ORACLE_UNVERIFIED' }
  }
  if (verifiedTreasuryValueUsdm < GENESIS_PRE_TREASURY_THRESHOLD_USDM) {
    return { admitted: false, reason: 'BELOW_THRESHOLD' }
  }

  return { admitted: true, verifiedTreasuryValueUsdm, observation }
}
