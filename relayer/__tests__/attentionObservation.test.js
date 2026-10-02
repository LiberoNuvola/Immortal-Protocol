const { describe, expect, it } = require('vitest')
const {
  AttentionObservationAggregator,
  buildAttentionObservationEnvelope,
} = require('../attentionObservation')

describe('attention observation producer', () => {
  it('aggregates coarse visitor buckets without exposing raw identifiers', () => {
    const aggregator = new AttentionObservationAggregator({ windowMs: 60_000 })
    const raw = 'coarse-client-signal'
    const bucket = AttentionObservationAggregator.normalizeBucket(raw, 'test-salt')

    aggregator.record({ bucketId: bucket, timestamp: 60_000 })
    aggregator.record({ bucketId: bucket, timestamp: 60_001 })
    aggregator.record({
      bucketId: AttentionObservationAggregator.normalizeBucket('second', 'test-salt'),
      timestamp: 60_002,
    })

    const snapshot = aggregator.snapshot(60_003)
    expect(snapshot.uniqueVisitorBuckets).toBe(2)
    expect(snapshot.observedVisits).toBe(3)
    expect(snapshot).not.toHaveProperty('ip')
    expect(snapshot).not.toHaveProperty('walletAddress')
    expect(snapshot).not.toHaveProperty('userAgent')
  })

  it('fails closed on malformed visitor signals', () => {
    const aggregator = new AttentionObservationAggregator()
    expect(() => aggregator.record({ bucketId: '' })).toThrow()
    expect(() => AttentionObservationAggregator.normalizeBucket('', 'salt')).toThrow()
    expect(() => AttentionObservationAggregator.normalizeBucket('x', '')).toThrow()
  })

  it('produces an explicit application observation envelope', () => {
    const aggregator = new AttentionObservationAggregator({ windowMs: 60_000 })
    const snapshot = aggregator.snapshot(120_000)
    const envelope = buildAttentionObservationEnvelope({
      snapshot,
      baselineVisitorsPerHour: 100,
      occupancyRatio: 0.25,
      trendRatio: 0.1,
      futureAttentionLowRatio: 0.8,
      futureAttentionHighRatio: 1.4,
      trajectoryConfidence: 0.5,
    })

    expect(envelope.source).toBe('attention-aggregator-v0.1')
    expect(envelope.observationWindowMs).toBe(60_000)
    expect(envelope.trajectoryConfidence).toBe(0.5)
  })
})
