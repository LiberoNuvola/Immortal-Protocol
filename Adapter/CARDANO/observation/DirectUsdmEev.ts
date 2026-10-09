/**
 * Direct-USDM EEV observation boundary for PRE-RICH Preprod.
 *
 * This module observes a physical native-token balance only.
 * It does not use Economic.poolUsdmValue and does not apply an oracle price.
 *
 * The Preprod tUSDM identity below is an EXTERNAL CANDIDATE identity,
 * not yet a PRE-RICH normative deployment approval.
 */

export const PREPROD_TUSDM_CANDIDATE_POLICY_ID =
  'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9'

export const PREPROD_TUSDM_CANDIDATE_ASSET_NAME_HEX =
  '0014df10745553444d'

export const PREPROD_TUSDM_CANDIDATE_UNIT =
  PREPROD_TUSDM_CANDIDATE_POLICY_ID +
  PREPROD_TUSDM_CANDIDATE_ASSET_NAME_HEX

export const PREPROD_TUSDM_LEDGER_DECIMALS = 6

export const IMMORTAL_USDM_SUBUNITS_PER_USDM = 100

export const TUSDM_ATOMIC_UNITS_PER_TOKEN = 10n ** 6n

function requiredNonNegative(quantity: bigint, name: string): bigint {
  if (typeof quantity !== 'bigint' || quantity < 0n) {
    throw new Error(name + ' must be a non-negative bigint')
  }
  return quantity
}

export function directUsdmEevFromAtomic(quantity: bigint): bigint {
  const atomic = requiredNonNegative(quantity, 'quantity')
  return (
    atomic * BigInt(IMMORTAL_USDM_SUBUNITS_PER_USDM)
  ) / TUSDM_ATOMIC_UNITS_PER_TOKEN
}

export function observeDirectUsdmEev({
  assets,
  expectedUnit = PREPROD_TUSDM_CANDIDATE_UNIT,
}: {
  assets: Record<string, bigint>
  expectedUnit?: string
}): {
  unit: string
  atomicQuantity: bigint
  eevUsdmSubunits: bigint
} {
  if (!assets || typeof assets !== 'object') {
    throw new Error('assets are required')
  }
  if (
    typeof expectedUnit !== 'string' ||
    !/^[0-9a-fA-F]{56,}$/.test(expectedUnit)
  ) {
    throw new Error('expectedUnit must be a valid native-asset unit')
  }

  const quantity = assets[expectedUnit] ?? 0n
  requiredNonNegative(quantity, 'direct USDM quantity')

  if (quantity === 0n) {
    throw new Error(
      'exact observed PrizePool UTxO does not contain the expected direct-USDM asset',
    )
  }

  return {
    unit: expectedUnit,
    atomicQuantity: quantity,
    eevUsdmSubunits: directUsdmEevFromAtomic(quantity),
  }
}
