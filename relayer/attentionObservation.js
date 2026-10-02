const crypto = require('crypto')

const DEFAULT_WINDOW_MS = 5 * 60 * 1000
const DEFAULT_MAX_UNIQUE_PER_WINDOW = 100000

/**
 * Privacy-preserving application-level attention aggregator.
 *
 * It counts coarse request observations, not identities. A caller supplies
 * an already-normalized visitor bucket; this module deliberately does not
 * persist IP addresses, cookies, wallet addresses or raw user-agent strings.
 *
 * This is an observation producer, not an economic authority.
 */
class AttentionObservationAggregator {
  constructor({ windowMs = DEFAULT_WINDOW_MS, maxUniquePerWindow = DEFAULT_MAX_UNIQUE_PER_WINDOW } = {}) {
    if (!Number.isFinite(windowMs) || windowMs <= 0) throw new Error('windowMs must be positive')
    this.windowMs = windowMs
    this.maxUniquePerWindow = maxUniquePerWindow
    this.buckets = new Map()
  }

  record({ bucketId, timestamp = Date.now() }) {
    if (typeof bucketId !== 'string' || bucketId.length === 0) {
      throw new Error('bucketId is required')
    }
    if (!Number.isFinite(timestamp)) throw new Error('timestamp must be finite')

    const windowStart = Math.floor(timestamp / this.windowMs) * this.windowMs
    const key = String(windowStart)
    let bucket = this.buckets.get(key)

    if (!bucket) {
      bucket = { windowStart, visits: 0, uniqueBuckets: new Set() }
      this.buckets.set(key, bucket)
    }

    bucket.visits += 1
    if (bucket.uniqueBuckets.size < this.maxUniquePerWindow) {
      bucket.uniqueBuckets.add(bucketId)
    }
    return this.snapshot(timestamp)
  }

  snapshot(now = Date.now()) {
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs
    const bucket = this.buckets.get(String(windowStart))
    if (!bucket) {
      return {
        observedVisitorsPerHour: 0,
        observationWindowMs: this.windowMs,
        observedAt: now,
        source: 'attention-aggregator-v0.1',
      }
    }

    const elapsed = Math.max(1, Math.min(this.windowMs, now - windowStart))
    const rate = bucket.uniqueBuckets.size / (elapsed / 3600000)

    return {
      observedVisitorsPerHour: Math.round(rate * 100) / 100,
      observedVisits: bucket.visits,
      uniqueVisitorBuckets: bucket.uniqueBuckets.size,
      observationWindowMs: this.windowMs,
      observedAt: now,
      source: 'attention-aggregator-v0.1',
    }
  }

  static normalizeBucket(value, salt) {
    if (typeof value !== 'string' || value.length === 0) throw new Error('visitor signal is required')
    if (typeof salt !== 'string' || salt.length === 0) throw new Error('salt is required')
    return crypto.createHmac('sha256', salt).update(value).digest('hex')
  }
}

function buildAttentionObservationEnvelope({
  snapshot,
  baselineVisitorsPerHour,
  occupancyRatio,
  trendRatio,
  futureAttentionLowRatio,
  futureAttentionHighRatio,
  trajectoryConfidence,
  observedAt = snapshot.observedAt,
  maxAgeMs = 15 * 60 * 1000,
}) {
  if (!snapshot || typeof snapshot.observedVisitorsPerHour !== 'number') {
    throw new Error('snapshot is required')
  }

  return Object.freeze({
    observedVisitorsPerHour: snapshot.observedVisitorsPerHour,
    baselineVisitorsPerHour,
    occupancyRatio,
    trendRatio,
    futureAttentionLowRatio,
    futureAttentionHighRatio,
    trajectoryConfidence,
    observedAt,
    maxAgeMs,
    source: snapshot.source,
    observationWindowMs: snapshot.observationWindowMs,
  })
}

module.exports = {
  AttentionObservationAggregator,
  buildAttentionObservationEnvelope,
}
