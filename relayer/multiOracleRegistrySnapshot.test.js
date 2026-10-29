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
    registrySequence: '12',
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

function registryProvider(
  envelopeValue = envelope(),
  publicKeyPem = trustedPublicKeyPem,
  currentnessOverrides = {},
) {
  const { currentSnapshotEnvelope = envelopeValue, state: stateOverrides = {} } = currentnessOverrides
  const currentPayload = currentSnapshotEnvelope.payload
  const currentnessProvider = {
    resolveCurrentRegistryState: async ({ policyVersion }) => ({
      verificationStatus: 'VERIFIED',
      authorityReference: 'fixture://authority/current-registry',
      checkpointReference: 'fixture://checkpoint/current-registry-1',
      policyVersion: currentPayload.policyVersion ?? policyVersion,
      controlSequence: '41',
      registrySequence: currentPayload.registrySequence,
      registryVersion: currentPayload.registryVersion,
      registryDigest: digestRegistryPayload(currentPayload),
      registryStatus: 'CURRENT',
      revokedEntries: [],
      ...stateOverrides,
    }),
  }
  return createSignedMultiOracleRegistryProvider({
    envelope: envelopeValue,
    trustedPublicKeyPem: publicKeyPem,
    registryReference: 'fixture://signed-registry/snapshot-1',
    trustRootReference: 'fixture://trust-root/ed25519-key-1',
    currentnessProvider,
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

  it('requires an injected authoritative currentness provider instead of trusting signature alone', () => {
    expect(() => createSignedMultiOracleRegistryProvider({
      envelope: envelope(),
      trustedPublicKeyPem,
      registryReference: 'fixture://signed-registry/snapshot-1',
      trustRootReference: 'fixture://trust-root/ed25519-key-1',
    })).toThrow(/currentnessProvider/)
  })

  it('rejects an older signed snapshot when the authoritative checkpoint has advanced', async () => {
    const staleSnapshot = envelope(payload({ registrySequence: '11', registryVersion: 'registry-test-v0' }))
    const currentSnapshot = envelope(payload({ registrySequence: '12', registryVersion: 'registry-test-v1' }))
    const provider = registryProvider(staleSnapshot, trustedPublicKeyPem, {
      currentSnapshotEnvelope: currentSnapshot,
    })
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/stale or rolled back/)
  })

  it('rejects a snapshot ahead of the authoritative checkpoint', async () => {
    const futureSnapshot = envelope(payload({ registrySequence: '13', registryVersion: 'registry-test-v2' }))
    const currentSnapshot = envelope(payload({ registrySequence: '12', registryVersion: 'registry-test-v1' }))
    const provider = registryProvider(futureSnapshot, trustedPublicKeyPem, {
      currentSnapshotEnvelope: currentSnapshot,
    })
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/ahead of the authoritative current checkpoint/)
  })

  it('rejects a matching sequence with a different current checkpoint digest', async () => {
    const provider = registryProvider(envelope(), trustedPublicKeyPem, {
      state: { registryDigest: 'f'.repeat(64) },
    })
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/does not match the authoritative current checkpoint/)
  })

  it('rejects a registry state marked revoked or not current', async () => {
    const provider = registryProvider(envelope(), trustedPublicKeyPem, {
      state: { registryStatus: 'REVOKED' },
    })
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/revoked or not the authoritative current snapshot/)
  })

  it('rejects a source/feed/policy tuple revoked in the currentness overlay', async () => {
    const provider = registryProvider(envelope(), trustedPublicKeyPem, {
      state: {
        revokedEntries: [{
          sourceId: 'source-alpha',
          feedId: 'feed-ada-usd',
          policyVersion: 'policy-test-v1',
        }],
      },
    })
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/revoked in authoritative currentness state/)
  })

  it('rejects an unauthenticated currentness response', async () => {
    const provider = registryProvider(envelope(), trustedPublicKeyPem, {
      state: { verificationStatus: 'UNVERIFIED' },
    })
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/current registry state must be independently verified/)
  })

  it('rejects malformed checkpoint control sequence', async () => {
    const provider = registryProvider(envelope(), trustedPublicKeyPem, {
      state: { controlSequence: '0041' },
    })
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/canonical non-negative decimal sequence/)
  })

  it('reads currentness state on each source resolution instead of caching revocations', async () => {
    let calls = 0
    const currentnessProvider = {
      resolveCurrentRegistryState: async () => {
        calls += 1
        return {
          verificationStatus: 'VERIFIED',
          authorityReference: 'fixture://authority/current-registry',
          checkpointReference: 'fixture://checkpoint/current-registry-1',
          policyVersion: 'policy-test-v1',
          controlSequence: String(calls),
          registrySequence: '12',
          registryVersion: 'registry-test-v1',
          registryDigest: digestRegistryPayload(payload()),
          registryStatus: 'CURRENT',
          revokedEntries: calls === 1 ? [] : [{
            sourceId: 'source-alpha',
            feedId: 'feed-ada-usd',
            policyVersion: 'policy-test-v1',
          }],
        }
      },
    }
    const provider = createSignedMultiOracleRegistryProvider({
      envelope: envelope(),
      trustedPublicKeyPem,
      registryReference: 'fixture://signed-registry/snapshot-1',
      trustRootReference: 'fixture://trust-root/ed25519-key-1',
      currentnessProvider,
    })
    expect((await provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).verificationStatus).toBe('VERIFIED')
    await expect(provider.resolveVerifiedRegistrySnapshot({
      sourceId: 'source-alpha',
      feedId: 'feed-ada-usd',
      policyVersion: 'policy-test-v1',
    })).rejects.toThrow(/revoked in authoritative currentness state/)
    expect(calls).toBe(2)
  })
})
