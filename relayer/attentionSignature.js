const crypto = require('crypto')

const ED25519_PUBLIC_KEY_LENGTH = 32
const ED25519_SIGNATURE_LENGTH = 64

function hexBytes(value, name, length) {
  if (typeof value !== 'string' || !new RegExp('^[0-9a-fA-F]{' + (length * 2) + '}$').test(value)) {
    throw new Error(name + ' must be ' + length + '-byte hex')
  }
  return Buffer.from(value, 'hex')
}

function canonicalAttentionPayload(observation) {
  return JSON.stringify({
    producerId: observation.producerId,
    sequence: observation.sequence,
    observationReference: observation.observationReference,
    observedAt: observation.observedAt,
    observationWindowMs: observation.observationWindowMs,
    observedVisitorsPerHour: observation.observedVisitorsPerHour,
    observedVisits: observation.observedVisits,
    uniqueVisitorBuckets: observation.uniqueVisitorBuckets,
    source: observation.source,
    observationHash: observation.observationHash,
  })
}

function verifySignedAttentionObservation(observation, publicKeyHex, signatureHex) {
  const publicKey = hexBytes(publicKeyHex, 'publicKey', ED25519_PUBLIC_KEY_LENGTH)
  const signature = hexBytes(signatureHex, 'signature', ED25519_SIGNATURE_LENGTH)

  if (observation.producerId !== observation.authorizedProducerId) {
    throw new Error('attention observation producer identity mismatch')
  }

  const ok = crypto.verify(
    null,
    Buffer.from(canonicalAttentionPayload(observation)),
    { key: Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      publicKey,
    ]) },
    signature,
  )

  if (!ok) {
    throw new Error('attention observation signature verification failed')
  }

  return true
}

function buildSignedAttentionObservation(observation, privateKeyPem) {
  const payload = Buffer.from(canonicalAttentionPayload(observation))
  const signatureHex = crypto.sign(null, payload, privateKeyPem).toString('hex')

  return Object.freeze({
    ...observation,
    signatureHex,
  })
}

module.exports = {
  canonicalAttentionPayload,
  verifySignedAttentionObservation,
  buildSignedAttentionObservation,
  ED25519_PUBLIC_KEY_LENGTH,
  ED25519_SIGNATURE_LENGTH,
}
