const { describe, expect, it, vi } = require('vitest')
const { normalizeUsingRegistryProvider } = require('./multiOracleRegistryBoundary')
const { digestPayload } = require('./multiOracleObservation')

const registryEntry = {
  sourceId: 'source-alpha',
  feedId: 'feed-ada-usd',
  baseAsset: 'ADA',
  quoteAsset: 'USD',
  timestampUnit: 'unix-ms',
  activationState: 'ACTIVE',
  policyVersion: 'policy-test-v1',
}

const observationFields = {
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

function observation(overrides = {}) {
  const fields = { ...observationFields, ...overrides }
  return { ...fields, payloadDigest: digestPayload(fields) }
}

function resolution(overrides = {}) {
  return {
    verificationStatus: 'VERIFIED',
    registryReference: 'registry-evidence:test-snapshot-001',
    registryVersion: 'registry-v1',
    registryDigest: 'a'.repeat(64),
    policyVersion: 'policy-test-v1',
    entry: registryEntry,
    ...overrides,
  }
}

function provider(result = resolution()) {
  return { resolveVerifiedRegistrySnapshot: vi.fn(async () => result) }
}

describe('multi-oracle registry provider boundary', () => {
  it('resolves by exact source and policy version before normalizing', async () => {
    const registryProvider = provider()
    const result = await normalizeUsingRegistryProvider(registryProvider, observation())

    expect(registryProvider.resolveVerifiedRegistrySnapshot).toHaveBeenCalledWith({
      sourceId: 'source-alpha',
      policyVersion: 'policy-test-v1',
    })
    expect(result.observation.rawPrice).toBe('69508700')
    expect(result.registryBinding.registryDigest).toBe('a'.repeat(64))
    expect(result.registryBinding.verificationStatus).toBe('VERIFIED')
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.registryBinding)).toBe(true)
  })

  it('fails closed when no registry provider is wired', async () => {
    await expect(normalizeUsingRegistryProvider(null, observation()))
      .rejects.toThrow(/registryProvider/)
  })

  it('rejects a registry snapshot not independently marked verified by the trusted provider', async () => {
    await expect(normalizeUsingRegistryProvider(
      provider(resolution({ verificationStatus: 'UNVERIFIED' })),
      observation(),
    )).rejects.toThrow(/independently verified/)
  })

  it('rejects a mismatched policy version returned by the registry provider', async () => {
    await expect(normalizeUsingRegistryProvider(
      provider(resolution({ policyVersion: 'policy-other-v1' })),
      observation(),
    )).rejects.toThrow(/policy version mismatch/)
  })

  it('rejects malformed registry digests', async () => {
    await expect(normalizeUsingRegistryProvider(
      provider(resolution({ registryDigest: 'not-a-digest' })),
      observation(),
    )).rejects.toThrow(/registryDigest/)
  })

  it('rejects a missing registry entry', async () => {
    await expect(normalizeUsingRegistryProvider(
      provider(resolution({ entry: undefined })),
      observation(),
    )).rejects.toThrow(/entry is required/)
  })

  it('rejects inactive entries instead of falling back', async () => {
    await expect(normalizeUsingRegistryProvider(
      provider(resolution({ entry: { ...registryEntry, activationState: 'INACTIVE' } })),
      observation(),
    )).rejects.toThrow(/not active/)
  })

  it('rejects an entry whose policy does not match the observation', async () => {
    await expect(normalizeUsingRegistryProvider(
      provider(resolution({ entry: { ...registryEntry, policyVersion: 'policy-other-v1' } })),
      observation(),
    )).rejects.toThrow(/policyVersion does not match registry/)
  })

  it('does not swallow registry-provider failures', async () => {
    const registryProvider = {
      resolveVerifiedRegistrySnapshot: vi.fn(async () => { throw new Error('registry unavailable') }),
    }
    await expect(normalizeUsingRegistryProvider(registryProvider, observation()))
      .rejects.toThrow('registry unavailable')
  })
})
