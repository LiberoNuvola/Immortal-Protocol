import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { decodeMuesliPoolDatum, validateMuesliPoolCandidate } from './lib/muesliPoolDatum.mjs'

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/muesliswap-usdm-mainnet-2026-10-31.json', import.meta.url),
  'utf8',
))

describe('MuesliSwap official PoolDatum decoder and Mainnet fixtures', () => {
  it('decodes the official four-field PoolDatum from the ADA/USDM pool', () => {
    const datum = decodeMuesliPoolDatum(fixture.candidates[0].resolvedDatumJson)
    expect(datum.assetA).toEqual({ policyId: '', assetNameHex: '' })
    expect(datum.assetB).toEqual(fixture.exactAsset)
    expect(datum.totalLiquidity).toBe(685640428n)
    expect(datum.swapFee).toBe(30n)
  })

  it('qualifies the exact-USDM/ADA pool structure and derives an indicative AMM spot', () => {
    const result = validateMuesliPoolCandidate(fixture.candidates[0])
    expect(result.status).toBe('MATCH')
    expect(result.reasons).toEqual([])
    expect(result.reserveARaw).toBe('1605647750')
    expect(result.reserveBRaw).toBe('304217365')
    expect(result.priceAdaPerUsdm).toBe('5.277')
    expect(result.datum.swapFeeRaw).toBe('30')
  })

  it('qualifies the official USDM/USADA pool but does not invent a direct ADA cross-rate', () => {
    const result = validateMuesliPoolCandidate(fixture.candidates[2])
    expect(result.status).toBe('MATCH')
    expect(result.reasons).toEqual([])
    expect(result.reserveARaw).toBe('14517925')
    expect(result.reserveBRaw).toBe('14517925')
    expect(result.priceAdaPerUsdm).toBeNull()
  })

  it('fails closed on a different payment credential and unsupported eight-field datum', () => {
    const result = validateMuesliPoolCandidate(fixture.candidates[1])
    expect(result.status).toBe('UNQUALIFIED')
    expect(result.reasons).toContain('POOL_PAYMENT_CREDENTIAL_MISMATCH')
    expect(result.reasons).toContain('MUESLI_POOL_DATUM_FIELD_COUNT_UNSUPPORTED')
  })

  it('fails closed when the factory token quantity is not exactly one', () => {
    const candidate = structuredClone(fixture.candidates[0])
    candidate.assets = candidate.assets.map((asset) =>
      asset.policyId === fixture.provenance.factoryPolicyId
        ? { ...asset, quantityRaw: '2' }
        : asset,
    )
    const result = validateMuesliPoolCandidate(candidate)
    expect(result.status).toBe('UNQUALIFIED')
    expect(result.reasons).toContain('FACTORY_COIN_QUANTITY_NOT_ONE')
  })

  it('fails closed when an unexpected native asset appears in the pool Value', () => {
    const candidate = structuredClone(fixture.candidates[0])
    candidate.assets.push({
      policyId: 'ee'.repeat(28),
      assetNameHex: '01',
      quantityRaw: '1',
    })
    const result = validateMuesliPoolCandidate(candidate)
    expect(result.status).toBe('UNQUALIFIED')
    expect(result.reasons).toContain('UNEXPECTED_ASSETS_IN_POOL_VALUE')
  })

  it('fails closed when the Pool NFT quantity is not exactly one', () => {
    const candidate = structuredClone(fixture.candidates[0])
    candidate.poolNftQuantityRaw = '2'
    const result = validateMuesliPoolCandidate(candidate)
    expect(result.status).toBe('UNQUALIFIED')
    expect(result.reasons).toContain('POOL_NFT_QUANTITY_NOT_ONE')
  })
})
