/**
 * PRE-RICH application boundary for the frozen Genesis bootstrap predicate.
 *
 * This module does not implement an oracle and does not move funds.
 * It composes verified Treasury observation with an already-verified
 * PRE/USDM price. On-chain revalidation remains a separate obligation.
 */

export const USDM_SUBUNITS_PER_USDM = 100n
export const GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS = 4_000n * USDM_SUBUNITS_PER_USDM
/** Mirrors Adapter/CARDANO/observation/OracleTypes.hs: precision = 1_000_000. */
export const CANONICAL_ORACLE_PRECISION = 1_000_000n

export type GenesisTreasuryObservation = {
  sourceRegime: 'PRE-GENESIS' | 'GENESIS'
  treasuryIdentity: string
  treasuryStateReference: string
  prePolicyId: string
  preAssetNameHex: string
  preQuantity: bigint
  verifiedPreUsdmPrice: bigint
  oraclePrecision: bigint
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
        | 'WRONG_ORACLE_PUBLISHER'
        | 'ORACLE_UNVERIFIED'
        | 'ORACLE_STALE'
        | 'BELOW_THRESHOLD'
    }

export function verifiedTreasuryPreValueUsdmSubunits(
  observation: GenesisTreasuryObservation,
): bigint | null {
  if (!observation.valuationVerified || !observation.oracleFresh) return null
  if (observation.preQuantity < 0n || observation.verifiedPreUsdmPrice < 0n) return null
  if (observation.oraclePrecision !== CANONICAL_ORACLE_PRECISION) return null
  const numerator = observation.preQuantity * observation.verifiedPreUsdmPrice
  // Genesis admission is a hard lower-bound predicate. Fractional subunits
  // below the threshold must never be rounded upward into admissibility.
  return numerator / observation.oraclePrecision
}

export function admitGenesisTreasury(
  observation: GenesisTreasuryObservation,
  canonicalTreasuryIdentity: string,
  canonicalPrePolicyId: string,
  canonicalPreAssetNameHex: string,
  canonicalOraclePublisher: string,
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
  if (observation.oraclePrecision !== CANONICAL_ORACLE_PRECISION) {
    return { admitted: false, reason: 'INVALID_ORACLE_PRECISION' }
  }
  if (observation.oraclePublisher !== canonicalOraclePublisher) {
    return { admitted: false, reason: 'WRONG_ORACLE_PUBLISHER' }
  }
  if (!observation.valuationVerified) {
    return { admitted: false, reason: 'ORACLE_UNVERIFIED' }
  }
  if (!observation.oracleFresh) {
    return { admitted: false, reason: 'ORACLE_STALE' }
  }

  const verifiedTreasuryValueUsdmSubunits = verifiedTreasuryPreValueUsdmSubunits(observation)
  if (verifiedTreasuryValueUsdmSubunits === null) {
    return { admitted: false, reason: 'ORACLE_UNVERIFIED' }
  }
  if (verifiedTreasuryValueUsdmSubunits < GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS) {
    return { admitted: false, reason: 'BELOW_THRESHOLD' }
  }

  return { admitted: true, verifiedTreasuryValueUsdm: verifiedTreasuryValueUsdmSubunits, observation }
}
