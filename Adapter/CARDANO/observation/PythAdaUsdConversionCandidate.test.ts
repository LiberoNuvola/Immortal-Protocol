import { describe, expect, it } from 'vitest'
import { pythAdaUsdToUsdmSubunitsCandidate } from './PythAdaUsdConversionCandidate'

const convert = pythAdaUsdToUsdmSubunitsCandidate

describe('Pyth ADA/USD -> USDM candidate conversion (not production-authoritative)', () => {
  it('matches the synthetic Aiken/Haskell parity vector without selecting parity as a default', () => {
    expect(convert({
      price: 100_000_000n,
      exponent: -8n,
      economicLovelace: 1_000_000n,
      usdPerUsdmNumerator: 1n,
      usdPerUsdmDenominator: 1n,
      maximumAbsoluteExponent: 18n,
    })).toBe(100n)
  })

  it('keeps raw price/exponent until final ceiling division', () => {
    expect(convert({
      price: 69_508_700n,
      exponent: -8n,
      economicLovelace: 1_438_000n,
      usdPerUsdmNumerator: 1n,
      usdPerUsdmDenominator: 1n,
      maximumAbsoluteExponent: 18n,
    })).toBe(100n)
  })

  it('supports an explicit non-parity USD/USDM ratio', () => {
    expect(convert({
      price: 100_000_000n,
      exponent: -8n,
      economicLovelace: 1_000_000n,
      usdPerUsdmNumerator: 2n,
      usdPerUsdmDenominator: 1n,
      maximumAbsoluteExponent: 18n,
    })).toBe(50n)
  })

  it('supports an explicit fractional USD/USDM ratio', () => {
    expect(convert({
      price: 100_000_000n,
      exponent: -8n,
      economicLovelace: 1_000_000n,
      usdPerUsdmNumerator: 3n,
      usdPerUsdmDenominator: 2n,
      maximumAbsoluteExponent: 18n,
    })).toBe(67n)
  })

  it('supports non-negative exponents without floating point', () => {
    expect(convert({
      price: 7n,
      exponent: 0n,
      economicLovelace: 1_000_000n,
      usdPerUsdmNumerator: 1n,
      usdPerUsdmDenominator: 1n,
      maximumAbsoluteExponent: 18n,
    })).toBe(700n)
  })

  it('fails closed for invalid ratio, amount, price, or exponent bound', () => {
    const base = {
      price: 100_000_000n,
      exponent: -8n,
      economicLovelace: 1_000_000n,
      usdPerUsdmNumerator: 1n,
      usdPerUsdmDenominator: 1n,
      maximumAbsoluteExponent: 18n,
    }
    expect(convert({ ...base, usdPerUsdmNumerator: 0n })).toBeNull()
    expect(convert({ ...base, usdPerUsdmDenominator: 0n })).toBeNull()
    expect(convert({ ...base, economicLovelace: -1n })).toBeNull()
    expect(convert({ ...base, price: 0n })).toBeNull()
    expect(convert({ ...base, exponent: -19n })).toBeNull()
    expect(convert({ ...base, maximumAbsoluteExponent: -1n })).toBeNull()
  })
})
