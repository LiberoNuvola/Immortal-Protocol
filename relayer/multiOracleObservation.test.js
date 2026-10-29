import { describe, expect, it } from 'vitest'
import { normalizeOracleObservation, digestPayload } from './multiOracleObservation.js'

const registry = {
  sourceId: 'source-alpha',
  feedId: 'feed-ada-usd',
  baseAsset: 'ADA',
  quoteAsset: 'USD',
  timestampUnit: 'unix-ms',
  activationState: 'ACTIVE',
  policyVersion: 'policy-test-v1',
}

const canonical = {
  sourceId: 'source-alpha',
  feedId: 'feed-ada-usd',
  baseAsset: 'ADA',
  quoteAsset: 'USD',
  rawPrice: '69508700',
  exponent: '-8',
  sourceTimestamp: '1793214000000',
  timestampUnit: 'unix-ms',
  authenticationReference: 'evidence:source-alpha:001',
  normalizationVersion: 'normalizer-v1',
  policyVersion: 'policy-test-v1',
}

function input(overrides = {}) {
  const value = { ...canonical, ...overrides }
  const normalized = {
    sourceId: value.sourceId,
    feedId: value.feedId,
    baseAsset: value.baseAsset,
    quoteAsset: value.quoteAsset,
    rawPrice: String(value.rawPrice),
    exponent: String(value.exponent),
    sourceTimestamp: String(value.sourceTimestamp),
    timestampUnit: value.timestampUnit,
    authenticationReference: value.authenticationReference,
    normalizationVersion: value.normalizationVersion,
    policyVersion: value.policyVersion,
  }
  return { ...normalized, payloadDigest: digestPayload(normalized) }
}

describe('multi-oracle structural observation boundary', () => {
  it('normalizes a structurally consistent observation without claiming source authentication', () => {
    const result = normalizeOracleObservation(registry, input())
    expect(result.rawPrice).toBe('69508700')
    expect(result.exponent).toBe('-8')
    expect(result.baseAsset).toBe('ADA')
    expect(result.quoteAsset).toBe('USD')
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('rejects inactive sources', () => {
    expect(() => normalizeOracleObservation(
      { ...registry, activationState: 'INACTIVE' }, input(),
    )).toThrow(/not active/)
  })

  it('rejects unknown or mismatched source identity', () => {
    expect(() => normalizeOracleObservation(registry, input({ sourceId: 'source-unknown' })))
      .toThrow(/sourceId does not match/)
  })

  it('rejects a different feed', () => {
    expect(() => normalizeOracleObservation(registry, input({ feedId: 'other-feed' })))
      .toThrow(/feedId does not match/)
  })

  it('rejects reversed or otherwise mismatched asset direction', () => {
    expect(() => normalizeOracleObservation(
      registry, input({ baseAsset: 'USD', quoteAsset: 'ADA' }),
    )).toThrow(/asset pair or direction/)
  })

  it('rejects timestamp unit mismatch', () => {
    expect(() => normalizeOracleObservation(
      registry, input({ timestampUnit: 'unix-seconds' }),
    )).toThrow(/timestamp unit/)
  })

  it('rejects an observation policy version that differs from the registry', () => {
    expect(() => normalizeOracleObservation(
      registry, input({ policyVersion: 'policy-other-v1' }),
    )).toThrow(/policyVersion does not match registry/)
  })

  it('rejects absent source timestamp and malformed integer fields', () => {
    expect(() => normalizeOracleObservation(
      registry, input({ sourceTimestamp: undefined }),
    )).toThrow(/sourceTimestamp/)
    expect(() => normalizeOracleObservation(
      registry, input({ exponent: '1.25' }),
    )).toThrow(/exponent must be a canonical decimal integer/)
  })

  it('rejects negative prices and non-canonical negative zero', () => {
    expect(() => normalizeOracleObservation(registry, input({ rawPrice: '-1' })))
      .toThrow(/rawPrice must be non-negative/)
    expect(() => normalizeOracleObservation(registry, input({ rawPrice: '-0' })))
      .toThrow(/rawPrice must be a canonical decimal integer/)
  })

  it('rejects unsafe JavaScript numeric inputs rather than silently rounding', () => {
    const candidate = input()
    candidate.rawPrice = Number.MAX_SAFE_INTEGER + 1
    expect(() => normalizeOracleObservation(registry, candidate))
      .toThrow(/safe integer or decimal string/)
  })

  it('rejects a payload digest that no longer matches the observation', () => {
    const candidate = input()
    candidate.rawPrice = '69508701'
    expect(() => normalizeOracleObservation(registry, candidate)).toThrow(/digest mismatch/)
  })

  it('rejects a missing digest', () => {
    const candidate = input()
    delete candidate.payloadDigest
    expect(() => normalizeOracleObservation(registry, candidate)).toThrow(/payloadDigest is required/)
  })
})
