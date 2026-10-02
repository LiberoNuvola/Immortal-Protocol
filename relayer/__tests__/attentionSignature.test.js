const { describe, expect, it } = require('vitest')
const { generateKeyPairSync } = require('crypto')
const {
  verifySignedAttentionObservation,
  buildSignedAttentionObservation,
} = require('../attentionSignature')

describe('signed advertising observation ingress', () => {
  function keyPair() {
    return generateKeyPairSync('ed25519')
  }

  function observation() {
    return {
      producerId: 'pre-rich-attention-producer-v0.1',
      authorizedProducerId: 'pre-rich-attention-producer-v0.1',
      observationReference: 'obs-001',
      observedAt: 1000,
      observationWindowMs: 60_000,
      observedVisitorsPerHour: 120,
      observedVisits: 30,
      uniqueVisitorBuckets: 20,
      source: 'attention-aggregator-v0.1',
      observationHash: 'a'.repeat(64),
    }
  }

  it('accepts a correctly signed producer observation', () => {
    const { privateKey, publicKey } = keyPair()
    const signed = buildSignedAttentionObservation(observation(), privateKey)
    const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')

    expect(
      verifySignedAttentionObservation(signed, publicKeyHex, signed.signatureHex),
    ).toBe(true)
  })

  it('rejects a changed visitor count', () => {
    const { privateKey, publicKey } = keyPair()
    const signed = buildSignedAttentionObservation(observation(), privateKey)
    const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')

    expect(() =>
      verifySignedAttentionObservation(
        { ...signed, observedVisitorsPerHour: 9999 },
        publicKeyHex,
        signed.signatureHex,
      ),
    ).toThrow('attention observation signature verification failed')
  })

  it('rejects a different producer identity', () => {
    const { privateKey, publicKey } = keyPair()
    const signed = buildSignedAttentionObservation(observation(), privateKey)
    const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')

    expect(() =>
      verifySignedAttentionObservation(
        { ...signed, producerId: 'attacker' },
        publicKeyHex,
        signed.signatureHex,
      ),
    ).toThrow('attention observation producer identity mismatch')
  })
})
