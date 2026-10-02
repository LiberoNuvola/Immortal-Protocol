const { describe, expect, it } = require('vitest')
const { generateKeyPairSync } = require('crypto')
const { buildSignedAttentionObservation } = require('../attentionSignature')
const { AttentionProducerRegistry } = require('../attentionProducerRegistry')

describe('advertising producer replay protection', () => {
  function signedObservation(privateKey, sequence, observedAt = 1000) {
    return buildSignedAttentionObservation({
      producerId: 'producer-1',
      authorizedProducerId: 'producer-1',
      sequence,
      observationReference: 'obs-' + sequence,
      observedAt,
      observationWindowMs: 60_000,
      observedVisitorsPerHour: 120,
      observedVisits: 30,
      uniqueVisitorBuckets: 20,
      source: 'attention-aggregator-v0.1',
      observationHash: 'a'.repeat(64),
    }, privateKey)
  }

  it('accepts a fresh signed observation and advances sequence', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')
    const registry = new AttentionProducerRegistry({ maxAgeMs: 5_000, clock: () => 2_000 })
    registry.register({ producerId: 'producer-1', publicKeyHex })

    const observation = signedObservation(privateKey, 0)
    const accepted = registry.accept(observation, observation.signatureHex)

    expect(accepted.producerId).toBe('producer-1')
    expect(registry.lastAcceptedSequence('producer-1')).toBe(0)
  })

  it('rejects replay of an already accepted sequence', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')
    const registry = new AttentionProducerRegistry({ maxAgeMs: 5_000, clock: () => 2_000 })
    registry.register({ producerId: 'producer-1', publicKeyHex })

    const observation = signedObservation(privateKey, 4)
    registry.accept(observation, observation.signatureHex)

    expect(() => registry.accept(observation, observation.signatureHex))
      .toThrow('attention observation sequence replayed or out of order')
  })

  it('rejects stale observations even when their signature is valid', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')
    const registry = new AttentionProducerRegistry({ maxAgeMs: 500, clock: () => 2_000 })

    registry.register({ producerId: 'producer-1', publicKeyHex })
    const observation = signedObservation(privateKey, 0, 1000)

    expect(() => registry.accept(observation, observation.signatureHex))
      .toThrow('attention observation is stale')
  })

  it('rejects an unregistered producer', () => {
    const { privateKey } = generateKeyPairSync('ed25519')
    const registry = new AttentionProducerRegistry({ clock: () => 2_000 })
    const observation = signedObservation(privateKey, 0)

    expect(() => registry.accept(observation, observation.signatureHex))
      .toThrow('attention producer is not registered')
  })
})
