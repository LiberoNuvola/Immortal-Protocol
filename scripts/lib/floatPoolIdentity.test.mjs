import { describe, expect, it } from 'vitest'
import { apiAssetUnit, apiMinswapLpUnit, compareFloatReservesToDatum, floatPoolKey } from './floatPoolIdentity.mjs'

const USDM = {
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
}
const ADA = { policyId: '', assetNameHex: '' }
const market = (a, b, reserves = { a: '100', b: '200' }) => ({
  assets: { a, b },
  reserves,
})
const datum = (assetA = ADA, assetB = USDM, reserveA = '100', reserveB = '200') => ({
  assetA, assetB, reserveARaw: reserveA, reserveBRaw: reserveB,
})

describe('Float Minswap V2 cross-indexer identity helpers', () => {
  it('normalizes the Minswap API LP policy/name pair as the full unit', () => {
    expect(apiMinswapLpUnit({
      apiMetrics: { lp_asset: { currency_symbol: 'AA'.repeat(28), token_name: 'BB' } },
    })).toBe('aa'.repeat(28) + 'bb')
  })

  it('normalizes API asset currency symbol and token name', () => {
    expect(apiAssetUnit({ currency_symbol: 'AA'.repeat(28), token_name: 'BB' })).toBe('aa'.repeat(28) + 'bb')
  })

  it('extracts the pool key suffix from a Float Minswap V2 market id', () => {
    expect(floatPoolKey({ id: 'minswap-v2:' + 'ab'.repeat(32) })).toBe('ab'.repeat(32))
    expect(floatPoolKey({ id: 'danogo:' + 'ab'.repeat(32) })).toBeNull()
  })

  it('matches Float reserves to datum reserves in canonical orientation', () => {
    expect(compareFloatReservesToDatum(
      market('ada.lovelace', USDM.policyId + '.' + USDM.assetNameHex),
      datum(),
    )).toBe(true)
  })

  it('matches Float reserves when asset orientation is reversed', () => {
    expect(compareFloatReservesToDatum(
      market(USDM.policyId + '.' + USDM.assetNameHex, 'ada.lovelace', { a: '200', b: '100' }),
      datum(),
    )).toBe(true)
  })

  it('detects exact reserve mismatches', () => {
    expect(compareFloatReservesToDatum(
      market('ada.lovelace', USDM.policyId + '.' + USDM.assetNameHex, { a: '101', b: '200' }),
      datum(),
    )).toBe(false)
  })

  it('returns null when market assets do not match the datum pair', () => {
    expect(compareFloatReservesToDatum(
      market('ff'.repeat(28) + '.01', USDM.policyId + '.' + USDM.assetNameHex),
      datum(),
    )).toBeNull()
  })
})
