/**
 * Provisional CSWAP ADA/USDM pool spot reconstruction.
 *
 * Formula/field mapping source: Flux-Point-Studios/dexter (MIT), src/dex/cswap.ts
 * and src/pricing/cswap-pricing.ts. This is a third-party SDK interpretation,
 * not a source-verified implementation of the deployed PlutusV3 validator.
 */
const USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
const ADA_UNIT = ''
const CSWAP_LP_POLICY = '16c66059d8ed65d35a64b229e34bfcd01899de45379a35c3aa74c7a5'
export const CSWAP_MIN_POOL_ADA_LOVELACE = 2_000_000n
export const CSWAP_FEE_DENOMINATOR = 10_000n
export const CSWAP_PLATFORM_FEE_BPS = 15n
export const CSWAP_BATCHER_FEE_LOVELACE = 690_000n
const SCALE = 100_000_000n

function positive(value, name) {
  const n = BigInt(String(value))
  if (n <= 0n) throw new Error(name + '_NONPOSITIVE')
  return n
}
function formatScaled(value, decimals = 8) {
  const scale = 10n ** BigInt(decimals)
  const whole = value / scale
  const fraction = (value % scale).toString().padStart(decimals, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

/**
 * Dexter's CSWAP adapter treats datum feeNumerator as lp_fee_10k and derives
 * poolFeePercent = lpFee10k / 100. It subtracts 2 ADA min pool deposit from
 * lovelace, then computes the ADA/token reserve ratio.
 */
export function deriveCswapProvisionalSpot(candidate) {
  if (!candidate || candidate.paymentCredentialMatchesOfficial !== true) return null
  const datum = candidate.datum
  if (!datum) return null
  const assetA = String(datum.assetA?.policyId ?? '').toLowerCase() + String(datum.assetA?.assetNameHex ?? '').toLowerCase()
  const assetB = String(datum.assetB?.policyId ?? '').toLowerCase() + String(datum.assetB?.assetNameHex ?? '').toLowerCase()
  if (assetA !== ADA_UNIT || assetB !== USDM_UNIT) return null
  if (String(datum.lpPolicyId ?? '').toLowerCase() !== CSWAP_LP_POLICY) return null

  const feeBps = BigInt(String(datum.feeNumerator))
  if (feeBps < 0n || feeBps >= CSWAP_FEE_DENOMINATOR) {
    throw new Error('CSWAP_FEE_NUMERATOR_OUT_OF_RANGE')
  }
  const lovelace = positive(candidate.valueLovelaceRaw, 'CSWAP_LOVELACE')
  if (lovelace <= CSWAP_MIN_POOL_ADA_LOVELACE) {
    throw new Error('CSWAP_POOL_ADA_NOT_ABOVE_MIN_DEPOSIT')
  }
  const reserveAda = lovelace - CSWAP_MIN_POOL_ADA_LOVELACE
  const reserveUsdm = positive(candidate.reserveBRaw, 'CSWAP_USDM_RESERVE')
  const priceScaled = (reserveAda * SCALE + reserveUsdm / 2n) / reserveUsdm

  return {
    venue: 'CSWAP',
    classification: 'PROVISIONAL_THIRD_PARTY_SDK_FORMULA_NOT_PLUTUSV3_VERIFIED',
    utxoRef: candidate.utxoRef ?? null,
    sourceBlockHeight: candidate.blockHeight ?? null,
    sourceBlockTime: candidate.blockTime ?? null,
    reserveAdaRaw: reserveAda.toString(),
    reserveUsdmRaw: reserveUsdm.toString(),
    minPoolAdaRemovedRaw: CSWAP_MIN_POOL_ADA_LOVELACE.toString(),
    feeNumeratorRaw: feeBps.toString(),
    feeDenominatorRaw: CSWAP_FEE_DENOMINATOR.toString(),
    feePercent: formatScaled(feeBps, 2),
    platformFeeBpsFromThirdPartySdk: CSWAP_PLATFORM_FEE_BPS.toString(),
    batcherFeeLovelaceFromThirdPartySdk: CSWAP_BATCHER_FEE_LOVELACE.toString(),
    priceNumeratorRaw: reserveAda.toString(),
    priceDenominatorRaw: reserveUsdm.toString(),
    priceAdaPerUsdm: formatScaled(priceScaled),
    priceMethod: 'DEXTER_CSWAP_SDK_RESERVE_RATIO',
    formulaSource: 'https://github.com/Flux-Point-Studios/dexter/blob/master/src/dex/cswap.ts',
    formulaReviewSource: 'https://github.com/Flux-Point-Studios/dexter/blob/master/src/pricing/cswap-pricing.ts',
    limitations: [
      'Third-party SDK interpretation only; not verified against deployed PlutusV3 validator execution.',
      'Datum balance field semantics and LP token name encoding remain unverified.',
      'This provisional spot must not be merged into the qualified venue set or used for EEV/oracle decisions.',
    ],
  }
}
