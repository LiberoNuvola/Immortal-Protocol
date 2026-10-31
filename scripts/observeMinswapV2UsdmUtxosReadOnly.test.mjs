import { describe, expect, it } from 'vitest'
import {
  decodeV2PoolDatum,
  expectedLpAssetName,
  validateV2Candidate,
} from './observeMinswapV2UsdmUtxosReadOnly.mjs'

const STAKE = '1eae96baf29e27682ea3f815aba361a0c6059d45e4bfbe95bbd2f44a'
const USDM = {
  policyId: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  assetNameHex: '0014df105553444d',
}
const OTHER = { policyId: 'ff'.repeat(28), assetNameHex: '54455354' }
const NFT_POLICY = 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c'
const NFT_NAME = '4d5350'
const RESERVE_A = 12_000_000n
const RESERVE_B = 20_000_000n
const MIN_ADA = 4_500_000n

const constr = (constructor, fields = []) => ({ constructor, fields })
const bytes = (hex) => ({ bytes: hex })
const int = (value) => ({ int: String(value) })

function fixtureDatum(overrides = {}) {
  return constr(0, [
    constr(0, [constr(1, [bytes(STAKE)])]),
    constr(0, [bytes(USDM.policyId), bytes(USDM.assetNameHex)]),
    constr(0, [bytes(OTHER.policyId), bytes(OTHER.assetNameHex)]),
    int(15_000_000),
    int(RESERVE_A),
    int(RESERVE_B),
    int(30),
    int(30),
    constr(0), // None
    constr(0), // False
    ...Object.entries(overrides).map(([index, value]) => [Number(index), value]),
  ].reduce((fields, entry) => {
    if (Array.isArray(entry)) fields[entry[0]] = entry[1]
    else fields.push(entry)
    return fields
  }, []))
}

function candidate(overrides = {}) {
  const lpName = expectedLpAssetName(USDM, OTHER)
  const assets = [
    { unit: USDM.policyId + USDM.assetNameHex, quantityRaw: String(RESERVE_A) },
    { unit: OTHER.policyId + OTHER.assetNameHex, quantityRaw: String(RESERVE_B) },
    { unit: NFT_POLICY + NFT_NAME, quantityRaw: '1' },
    { unit: NFT_POLICY + lpName, quantityRaw: '9223372036854775792' },
  ]
  return {
    utxo: { value: String(MIN_ADA) },
    assets: overrides.assets ?? assets,
    datum: overrides.datum ?? fixtureDatum(),
  }
}

describe('Minswap V2 PoolDatum decoder (synthetic fixtures)', () => {
  it('decodes the published 10-field PoolDatum and preserves integer precision', () => {
    const decoded = decodeV2PoolDatum(fixtureDatum())
    expect(decoded.poolBatchingStakeScriptHash).toBe(STAKE)
    expect(decoded.assetA).toEqual(USDM)
    expect(decoded.assetB).toEqual(OTHER)
    expect(decoded.reserveA).toBe(RESERVE_A)
    expect(decoded.reserveB).toBe(RESERVE_B)
    expect(decoded.totalLiquidity).toBe(15_000_000n)
  })

  it('rejects an unsupported PoolDatum constructor shape', () => {
    expect(() => decodeV2PoolDatum(constr(1, []))).toThrow('MIN_SWAP_V2_POOL_DATUM_SHAPE_UNSUPPORTED')
    expect(() => decodeV2PoolDatum(constr(0, []) )).toThrow('MIN_SWAP_V2_POOL_DATUM_SHAPE_UNSUPPORTED')
  })

  it('accepts a fully consistent exact-USDM candidate', () => {
    const f = candidate()
    expect(validateV2Candidate(f.utxo, f.assets, f.datum).status).toBe('MATCH')
  })

  it('fails closed on a batching stake credential mismatch', () => {
    const f = candidate()
    const wrong = fixtureDatum()
    wrong.fields[0].fields[0].fields[0] = bytes('ab'.repeat(28))
    const result = validateV2Candidate(f.utxo, f.assets, wrong)
    expect(result.status).toBe('UNQUALIFIED')
    expect(result.reasons).toContain('POOL_BATCHING_STAKE_CREDENTIAL_MISMATCH')
  })

  it('fails closed when the Pool NFT is not exactly one', () => {
    const f = candidate()
    const changed = f.assets.map((a) => a.unit === NFT_POLICY + NFT_NAME ? { ...a, quantityRaw: '2' } : a)
    expect(validateV2Candidate(f.utxo, changed, f.datum).reasons).toContain('POOL_AUTH_NFT_QUANTITY_NOT_ONE')
  })

  it('fails closed when the LP asset is absent', () => {
    const f = candidate()
    const changed = f.assets.filter((a) => a.unit !== NFT_POLICY + expectedLpAssetName(USDM, OTHER))
    expect(validateV2Candidate(f.utxo, changed, f.datum).reasons).toContain('DERIVED_LP_ASSET_MISSING_OR_NONPOSITIVE')
  })

  it('fails closed on datum-vs-Value reserve mismatch', () => {
    const f = candidate()
    const changed = f.assets.map((a) => a.unit === USDM.policyId + USDM.assetNameHex
      ? { ...a, quantityRaw: String(RESERVE_A + 1n) } : a)
    expect(validateV2Candidate(f.utxo, changed, f.datum).reasons).toContain('RESERVE_A_VALUE_MISMATCH')
  })

  it('fails closed on unexpected assets in the pool Value', () => {
    const f = candidate()
    const changed = [...f.assets, { unit: 'ee'.repeat(28) + '01', quantityRaw: '1' }]
    expect(validateV2Candidate(f.utxo, changed, f.datum).reasons).toContain('UNEXPECTED_ASSETS_IN_POOL_VALUE')
  })

  it('does not accept a candidate whose datum omits the exact USDM asset', () => {
    const f = candidate()
    const changedDatum = fixtureDatum()
    changedDatum.fields[1] = constr(0, [bytes(OTHER.policyId), bytes(OTHER.assetNameHex)])
    expect(validateV2Candidate(f.utxo, f.assets, changedDatum).reasons).toContain('USDM_NOT_IN_DATUM_ASSET_PAIR')
  })
})
