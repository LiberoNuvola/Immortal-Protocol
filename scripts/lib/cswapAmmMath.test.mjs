import { describe, expect, it } from 'vitest'
import { deriveCswapProvisionalSpot } from './cswapAmmMath.mjs'

const USDM = {
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
}
const LP_POLICY = '16c66059d8ed65d35a64b229e34bfcd01899de45379a35c3aa74c7a5'

function candidate(overrides = {}) {
  return {
    paymentCredentialMatchesOfficial: true,
    utxoRef: '4564f545ead6a1b626989c75110b20b4f3512694acd23f4ffb57334dfec6eec3#1',
    valueLovelaceRaw: '1041525670',
    reserveBRaw: '198980533',
    blockHeight: 14134278,
    blockTime: 1793338417,
    datum: {
      balance: '424221685',
      feeNumerator: '85',
      assetA: { policyId: '', assetNameHex: '' },
      assetB: USDM,
      lpPolicyId: LP_POLICY,
      lpNameHex: '432d4c503a204144412078200014efbfbd105553444d',
    },
    ...overrides,
  }
}

describe('CSWAP provisional third-party SDK spot reconstruction', () => {
  it('derives ADA/USDM spot after the SDK 2 ADA pool deposit exclusion', () => {
    const result = deriveCswapProvisionalSpot(candidate())
    expect(result.classification).toBe('PROVISIONAL_THIRD_PARTY_SDK_FORMULA_NOT_PLUTUSV3_VERIFIED')
    expect(result.reserveAdaRaw).toBe('1039525670')
    expect(result.reserveUsdmRaw).toBe('198980533')
    expect(result.feeNumeratorRaw).toBe('85')
    expect(result.feePercent).toBe('0.85')
    expect(result.priceAdaPerUsdm).toBe('5.22425814')
  })

  it('does not accept a candidate without official payment credential match', () => {
    expect(deriveCswapProvisionalSpot(candidate({ paymentCredentialMatchesOfficial: false }))).toBeNull()
  })

  it('does not accept a non-ADA/USDM pair', () => {
    expect(deriveCswapProvisionalSpot(candidate({
      datum: { ...candidate().datum, assetA: USDM, assetB: { policyId: 'ff'.repeat(28), assetNameHex: '01' } },
    }))).toBeNull()
  })

  it('does not accept an LP policy that differs from the pinned registry identity', () => {
    expect(deriveCswapProvisionalSpot(candidate({
      datum: { ...candidate().datum, lpPolicyId: 'ab'.repeat(28) },
    }))).toBeNull()
  })

  it('fails closed if the pool lovelace does not exceed the SDK minimum deposit', () => {
    expect(() => deriveCswapProvisionalSpot(candidate({ valueLovelaceRaw: '2000000' })))
      .toThrow('CSWAP_POOL_ADA_NOT_ABOVE_MIN_DEPOSIT')
  })

  it('fails closed on a fee numerator outside the 10k basis', () => {
    expect(() => deriveCswapProvisionalSpot(candidate({
      datum: { ...candidate().datum, feeNumerator: '10000' },
    }))).toThrow('CSWAP_FEE_NUMERATOR_OUT_OF_RANGE')
  })
})
