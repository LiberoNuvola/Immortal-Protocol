import { describe, expect, it } from 'vitest'
import { generateKeyPairSync, sign } from 'node:crypto'
import {
  canonicalRegistryPayload,
  createSignedMultiOracleRegistryProvider,
  digestRegistryPayload,
  verifySignedMultiOracleRegistrySnapshot,
} from './multiOracleRegistrySnapshot.js'
import { normalizeUsingRegistryProvider } from './multiOracleRegistryBoundary.js'
import { digestPayload } from './multiOracleObservation.js'

const keyPair = generateKeyPairSync('ed25519')
const trustedPublicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString()
const wrongKeyPair = generateKeyPairSync('ed25519')
const wrongPublicKeyPem = wrongKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString()

const registryEntry = {
  sourceId: 'source-alpha',
  feedId: 'feed-ada-usd',
  baseAsset: 'ADA',
  quoteAsset: 'USD',
  timestampUnit: 'unix-ms',
  activationState: 'ACTIVE',
  policyVersion: 'policy-test-v1',
  sourceKind: 'fixture-only',
  verificationMethod: 'fixture-only',
  authorizedIdentity: 'fixture-key',
  dependencyGroup: 'fixture-provider',
}

function payload(overrides = {}) {
  return {
    schema: 'IMMORTAL-MULTI-ORACLE-REGISTRY-V1',
    registryVersion: 'registry-test-v1',
    policyVersion: 'policy-test-v1',
    entries: [{ ...registryEntry }],
    ...overrides,
  }
}

function envelope(payloadValue = payload(), signingKey = keyPair.privateKey) {
  return {
    payload: payloadValue,
    payloadDigest: digestRegistryPayload(payloadValue),
    signature: sign(null, Buffer.from(canonicalRegistryPayload(payloadValue), 'utf8'), signingKey).toString('base64'),
  }
}

function observation(overrides = {}) {
  const fields = {
    sourceId: 'source-alpha',
    feedId: 'feed-ada-usd',
    baseAsset: 'ADA',
    quoteAsset: 'USD',
    rawPrice: '69508700',
    exponent: '-8',
    sourceTimestamp: '1793214000000',
    timestampUnit: 'unix-ms',
    authenticationReference: 'fixture:source-alpha:observation-1',
    normalizationVersion: 'normalizer-v1',
    policyVersion: 'policy-test-v1',
    ...overrides,
  }
  return { ...fields, payloadDigest: digestPayload(fields) }
}

function registryProvider(envelopeValue = envelope(), publicKeyPem = trustedPublicKeyPem) {
  return createSignedMultiOracleRegistryProvider({
    envelope: envelopeValue,
    trustedPublicKeyPem: publicKeyPem,
    registryReference: 'fixture://signed-registry/snapshot-1',
    trustRootReference: 'fixture://trust-root/ed25519-key-1',
  })
}

describe('signed multi-oracle registry snapshot verifier', () => {
  it('verifies a signed snapshot and computes its canonical SHA-256 digest', () => {
    const verified = verifySignedMultiOracleRegistrySnapshot(envelope(), trustedPublicKeyPem)
    expect(verified.verificationStatus).toBe('VERIFIED')
    expect(verified.signatureScheme).toBe('Ed25519')
    expect(verified.registryDigest).toBe(digestRegistryPayload(verified.payload))
    expect(Object.isFrozen(verified)).toBe(true)
    expect(Object.isFrozen(verified.payload.entries)).toBe(true)
  })

  it('rejects a payload modified without updating its digest', () => {
    const candidate = envelope()
    candidate.payload.entries[0].feedId = 'feed-manipulated'
    expect(() => verifySignedMultiOracleRegistrySnapshot(candidate, trustedPublicKeyPem))
      .toThrow(/payload digest mismatch/)
  })

  it('rejects a payload whose digest was recomputed but whose signature was not updated', () => {
    const candidate = envelope()
    candidate.payload.entries[0].feedId = 'feed-manipulated'
    candidate.payloadDigest = digestRegistryPayload(candidate.payload)
    expect(() => verifySignedMultiOracleRegistrySnapshot(candidate, trustedPublicKeyPem))
      .toThrow(/signature is invalid/)
  })

  it('rejects a signature produced by a key outside the supplied trust root', () => {
    expect(() => verifySignedMultiOracleRegistrySnapshot(envelope(payload(), wrongKeyPair.privateKey), trustedPublicKeyPem))
      .toThrow(/signature is invalid/)
  })

  it('rejects a malformed snapshot digest', () => {
    expect(() => verifySignedMultiOracleRegistrySnapshot(
      { ...envelope(), payloadDigest: 'not-a-digest' },
      trustedPublicKeyPem,
    )).toThrow(/payloadDigest/)
  })

  it('rejects a malformed signature encoding', () => {
    expect(() => verifySignedMultiOracleRegistrySnapshot(
      { ...envelope(), signature: 'not-base64!' },
      trustedPublicKeyPem,
    )).toThrow(/canonical base64/)
  })

  it('rejects an unsupported signing key type', () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const rsaPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString()
    expect(() => verifySignedMultiOracleRegistrySnapshot(envelope(), rsaPem))
      .toThrow(/must use Ed25519/)
  })

  it('rejects a wrong schema even when the changed payload is re-signed', () => {
    const wrongSchema = envelope(payload({ schema: 'OTHER-SCHEMA' }))
    expect(() => verifySignedMultiOracleRegistrySnapshot(wrongSchema, trustedPublicKeyPem))
      .toThrow(/schema is invalid/)
  })

  it('rejects registry entries that silently use a different policy version', () => {
    const invalid = payload({
      entries: [{ ...registryEntry, policyVersion: 'policy-other-v1' }],
    })
    expect(() => verifySignedMultiOracleRegistrySnapshot(envelope(invalid), trustedPublicKeyPem))
      .toThrow(/entry policyVersion does not match snapshot/)
  })

  it('rejects duplicate source/feed/policy entries as ambiguous registry state', () => {
    const duplicate = payload({ entries: [{ ...registryEntry }, { ...registryEntry }] })
    expect(() => verifySignedMultiOracleRegistrySnapshot(envelope(duplicate), trustedPublicKeyPem))
      .toThrow(/duplicate source\/feed\/policy entry/)
  })

  it('refuses ambiguous numeric values or non-JSON values during canonicalization', () => {
    expect(() => canonicalRegistryPayload({ number: 1.25 })).toThrow(/safe integers/)
    expect(() => canonicalRegistryPayload({ value: undefined })).toThrow(/non-JSON value|undefined/)
  })

  it('creates a resolver bound to exact source, feed and policy, then normalizes the observation', async () => {
    const provider = registryProvider()
    const result = await normalizeUsingRegistryProvider(provider, observation())
    expect(result.observation.feedId).toBe('feed-ada-usd')
    expect(result.registryBinding.registryVersion).toBe('registry-test-v1')
    expect(result.registryBinding.trustRootReference).toBe('fixture://trust-root/ed25519-key-1')
    expect(result.registryBinding.signatureScheme).toBe('Ed25519')
    expect(result.registryBinding.verificationStatus).toBe('VERIFIED')
  })

  it('rejects a different feed instead of selecting another entry', async () => {
    const provider = registryProvider()
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-other',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/entry not found/)
  })

  it('rejects policy versions not present in the authenticated snapshot', async () => {
    const provider = registryProvider()
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-other-v1',
    })).rejects.toThrow(/does not match verified registry snapshot/)
  })

  it('rejects inactive sources at normalization boundary without fallback', async () => {
    const inactivePayload = payload({
      entries: [{ ...registryEntry, activationState: 'INACTIVE' }],
    })
    const provider = registryProvider(envelope(inactivePayload))
    await expect(normalizeUsingRegistryProvider(provider, observation()))
      .rejects.toThrow(/not active/)
  })
})
