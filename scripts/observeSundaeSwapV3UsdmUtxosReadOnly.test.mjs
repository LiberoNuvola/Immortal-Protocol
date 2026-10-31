import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  decodeSundaeV3PoolDatum,
  reconcileSundaeV3PoolWithApi,
  validateSundaeV3PoolUtxo,
} from './lib/sundaeV3PoolDatum.mjs'

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/sundaeswap-v3-usdm-mainnet-2026-10-31.json', import.meta.url),
  'utf8',
))

describe('SundaeSwap V3 real Koios Mainnet fixtures', () => {
  it('decodes all five real eight-field PoolDatum fixtures', () => {
    const decoded = fixture.candidates.map((candidate) => decodeSundaeV3PoolDatum(candidate.inlineDatumJson))
    expect(decoded).toHaveLength(5)
    expect(decoded.map((datum) => datum.identifier)).toEqual(
      fixture.apiV3Pools.map((pool) => pool.id),
    )
    expect(decoded.every((datum) => datum.circulatingLp > 0n)).toBe(true)
  })

  it('validates all five exact-USDM pool NFT, Value and reserve structures', () => {
    const results = fixture.candidates.map(validateSundaeV3PoolUtxo)
    expect(results.map((result) => result.status)).toEqual(['MATCH', 'MATCH', 'MATCH', 'MATCH', 'MATCH'])
    expect(results.every((result) => result.reasons.length === 0)).toBe(true)
    expect(results[4].reserveARaw).toBe('74578079679')
    expect(results[4].reserveBRaw).toBe('14572208659')
    expect(results[4].datum.protocolFeesRaw).toBe('1239772000')
  })

  it('reconciles pool IDs, CIP-68 LP identities, pair, reserves and circulating LP with official API', () => {
    const results = fixture.candidates.map((candidate, index) => {
      const validation = validateSundaeV3PoolUtxo(candidate)
      return reconcileSundaeV3PoolWithApi(validation, fixture.apiV3Pools[index])
    })
    expect(results.map((result) => result.status)).toEqual(['MATCH', 'MATCH', 'MATCH', 'MATCH', 'MATCH'])
    expect(results.every((result) => result.reasons.length === 0)).toBe(true)
  })

  it('fails closed when the pool NFT quantity is not exactly one', () => {
    const candidate = structuredClone(fixture.candidates[0])
    const nft = candidate.assets.find((asset) => asset.asset_name.startsWith('000de140'))
    nft.quantity = '2'
    expect(validateSundaeV3PoolUtxo(candidate).reasons).toContain('POOL_NFT_QUANTITY_NOT_ONE')
  })

  it('detects an ADA Value reserve that no longer reconciles with the official API', () => {
    const candidate = structuredClone(fixture.candidates[4])
    candidate.valueLovelaceRaw = (BigInt(candidate.valueLovelaceRaw) + 1n).toString()
    const validation = validateSundaeV3PoolUtxo(candidate)
    expect(validation.status).toBe('MATCH')
    expect(reconcileSundaeV3PoolWithApi(validation, fixture.apiV3Pools[4]).reasons)
      .toContain('SUNDAE_API_RESERVE_A_MISMATCH')
  })

  it('fails closed when the API reserve differs from the real on-chain reserve', () => {
    const validation = validateSundaeV3PoolUtxo(fixture.candidates[4])
    const api = structuredClone(fixture.apiV3Pools[4])
    api.current.quantityA.quantity = (BigInt(api.current.quantityA.quantity) + 1n).toString()
    expect(reconcileSundaeV3PoolWithApi(validation, api).reasons)
      .toContain('SUNDAE_API_RESERVE_A_MISMATCH')
  })

  it('fails closed when the API LP token identity is not the CIP-68 333 token for the pool ID', () => {
    const validation = validateSundaeV3PoolUtxo(fixture.candidates[0])
    const api = structuredClone(fixture.apiV3Pools[0])
    api.assetLP.assetId = api.assetLP.assetId.slice(0, -1) + '0'
    expect(reconcileSundaeV3PoolWithApi(validation, api).reasons)
      .toContain('SUNDAE_API_LP_ASSET_ID_MISMATCH')
  })
})
