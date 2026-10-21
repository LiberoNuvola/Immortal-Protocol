/**
 * Candidate exact-rational conversion of raw Pyth ADA/USD into IMMORTAL
 * USDM sub-units. This is a test/differential surface only.
 *
 * The USD-per-USDM ratio and exponent bound are mandatory caller-supplied
 * inputs. No 1:1 USD/USDM parity is assumed. This function is not wired to
 * Issue settlement or used as authoritative production valuation.
 */

export type PythAdaUsdConversionCandidateInput = {
  /** Raw signed-feed integer price p. */
  price: bigint
  /** Raw signed-feed exponent e: p × 10^e USD per ADA. */
  exponent: bigint
  /** Economic lovelace after the established minimum-UTxO exclusion. */
  economicLovelace: bigint
  /** D = USD per USDM, represented exactly as numerator / denominator. */
  usdPerUsdmNumerator: bigint
  usdPerUsdmDenominator: bigint
  /** Test/configuration input; no normative bound is chosen in this module. */
  maximumAbsoluteExponent: bigint
}

function powerOfTen(exponent: bigint): bigint {
  let scale = 1n
  for (let i = 0n; i < exponent; i += 1n) {
    scale *= 10n
  }
  return scale
}

function ceilingDivPositive(numerator: bigint, denominator: bigint): bigint {
  if (numerator === 0n) return 0n
  return (numerator + denominator - 1n) / denominator
}

export function pythAdaUsdToUsdmSubunitsCandidate({
  price,
  exponent,
  economicLovelace,
  usdPerUsdmNumerator,
  usdPerUsdmDenominator,
  maximumAbsoluteExponent,
}: PythAdaUsdConversionCandidateInput): bigint | null {
  const values = [
    price,
    exponent,
    economicLovelace,
    usdPerUsdmNumerator,
    usdPerUsdmDenominator,
    maximumAbsoluteExponent,
  ]
  if (values.some(value => typeof value !== 'bigint')) return null

  const exponentMagnitude = exponent < 0n ? -exponent : exponent
  if (
    price <= 0n ||
    economicLovelace < 0n ||
    usdPerUsdmNumerator <= 0n ||
    usdPerUsdmDenominator <= 0n ||
    maximumAbsoluteExponent < 0n ||
    exponentMagnitude > maximumAbsoluteExponent
  ) {
    return null
  }

  const scale = powerOfTen(exponentMagnitude)
  const numerator = exponent < 0n
    ? economicLovelace * price * 100n * usdPerUsdmDenominator
    : economicLovelace * price * scale * 100n * usdPerUsdmDenominator
  const denominator = exponent < 0n
    ? 1_000_000n * scale * usdPerUsdmNumerator
    : 1_000_000n * usdPerUsdmNumerator

  return ceilingDivPositive(numerator, denominator)
}
