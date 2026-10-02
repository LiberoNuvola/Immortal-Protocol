const { verifySignedAttentionObservation } = require('./attentionSignature')

class AttentionProducerRegistry {
  constructor({ maxAgeMs = 5 * 60 * 1000, clock = () => Date.now() } = {}) {
    if (!Number.isInteger(maxAgeMs) || maxAgeMs <= 0) {
      throw new Error('maxAgeMs must be a positive integer')
    }
    this.maxAgeMs = maxAgeMs
    this.clock = clock
    this.producers = new Map()
  }

  register({ producerId, publicKeyHex }) {
    if (typeof producerId !== 'string' || producerId.trim() === '') {
      throw new Error('producerId is required')
    }
    if (this.producers.has(producerId)) {
      throw new Error('attention producer is already registered')
    }
    this.producers.set(producerId, {
      publicKeyHex,
      lastSequence: -1,
    })
  }

  accept(observation, signatureHex) {
    const producer = this.producers.get(observation.producerId)
    if (!producer) {
      throw new Error('attention producer is not registered')
    }

    if (!Number.isInteger(observation.sequence) || observation.sequence < 0) {
      throw new Error('attention observation sequence must be a non-negative integer')
    }

    if (observation.sequence <= producer.lastSequence) {
      throw new Error('attention observation sequence replayed or out of order')
    }

    const now = this.clock()
    if (!Number.isFinite(now) || now < 0) {
      throw new Error('authoritative attention clock is invalid')
    }
    if (observation.observedAt > now) {
      throw new Error('attention observation is from the future')
    }
    if (now - observation.observedAt > this.maxAgeMs) {
      throw new Error('attention observation is stale')
    }

    verifySignedAttentionObservation(
      observation,
      producer.publicKeyHex,
      signatureHex,
    )

    producer.lastSequence = observation.sequence

    return Object.freeze({
      ...observation,
      signatureHex,
      acceptedAt: now,
    })
  }

  lastAcceptedSequence(producerId) {
    const producer = this.producers.get(producerId)
    if (!producer) throw new Error('attention producer is not registered')
    return producer.lastSequence
  }
}

module.exports = { AttentionProducerRegistry }
