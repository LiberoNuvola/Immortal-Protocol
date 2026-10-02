/**
 * PRE-RICH advertising observation authority boundary.
 *
 * This module does not make visitor counts authoritative by itself.
 * It defines the minimum producer envelope needed before an observation
 * can enter the adaptive pricing path.
 *
 * The producer identity and observation reference are explicit so later
 * deployment code can bind them to an authenticated ingress/evidence source.
 */
const crypto = require('crypto')

function requireNonEmpty(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(name + ' is required')
  }
}

function sha256CanonicalObservation(observation) {
  const canonical = JSON.stringify({
    producerId: observation.producerId,
    observationReference: observation.observationReference,
    observedAt: observation.observedAt,
    observationWindowMs: observation.observationWindowMs,
    observedVisitorsPerHour: observation.observedVisitorsPerHour,
    observedVisits: observation.observedVisits,
    uniqueVisitorBuckets: observation.uniqueVisitorBuckets,
  })

  return crypto.createHash('sha256').update(canonical).digest('hex')
}

function assertAuthoritativeAttentionObservation(observation) {
  requireNonEmpty(observation.producerId, 'producerId')
  requireNonEmpty(observation.observationReference, 'observationReference')
  requireNonEmpty(observation.source, 'source')

  if (!Number.isFinite(observation.observedAt) || observation.observedAt < 0) {
    throw new Error('observedAt must be a non-negative finite timestamp')
  }
  if (!Number.isFinite(observation.observationWindowMs) || observation.observationWindowMs <= 0) {
    throw new Error('observationWindowMs must be positive')
  }
  if (!Number.isFinite(observation.observedVisitorsPerHour) || observation.observedVisitorsPerHour < 0) {
    throw new Error('observedVisitorsPerHour must be non-negative')
  }
  if (!Number.isInteger(observation.observedVisits) || observation.observedVisits < 0) {
    throw new Error('observedVisits must be a non-negative integer')
  }
  if (!Number.isInteger(observation.uniqueVisitorBuckets) || observation.uniqueVisitorBuckets < 0) {
    throw new Error('uniqueVisitorBuckets must be a non-negative integer')
  }
  if (observation.uniqueVisitorBuckets > observation.observedVisits) {
    throw new Error('uniqueVisitorBuckets cannot exceed observedVisits')
  }

  const expectedHash = sha256CanonicalObservation(observation)
  if (observation.observationHash !== expectedHash) {
    throw new Error('attention observation hash mismatch')
  }

  return true
}

function sealAttentionObservation(snapshot, { producerId, observationReference, observedAt = snapshot.observedAt } = {}) {
  requireNonEmpty(producerId, 'producerId')
  requireNonEmpty(observationReference, 'observationReference')

  const observation = {
    producerId,
    observationReference,
    observedAt,
    observationWindowMs: snapshot.observationWindowMs,
    observedVisitorsPerHour: snapshot.observedVisitorsPerHour,
    observedVisits: snapshot.observedVisits ?? 0,
    uniqueVisitorBuckets: snapshot.uniqueVisitorBuckets ?? 0,
    source: snapshot.source,
  }

  return Object.freeze({
    ...observation,
    observationHash: sha256CanonicalObservation(observation),
  })
}

module.exports = {
  assertAuthoritativeAttentionObservation,
  sealAttentionObservation,
  sha256CanonicalObservation,
}
