const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
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
    assert.equal(snapshot.uniqueVisitorBuckets, 2)
    assert.equal(snapshot.observedVisits, 3)
    assert.equal(Object.hasOwn(snapshot, 'ip'), false)
    assert.equal(Object.hasOwn(snapshot, 'walletAddress'), false)
    assert.equal(Object.hasOwn(snapshot, 'userAgent'), false)
  })

  it('fails closed on malformed visitor signals', () => {
    const aggregator = new AttentionObservationAggregator()
    assert.throws(() => aggregator.record({ bucketId: '' }))
    assert.throws(() => AttentionObservationAggregator.normalizeBucket('', 'salt'))
    assert.throws(() => AttentionObservationAggregator.normalizeBucket('x', ''))
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

    assert.equal(envelope.source, 'attention-aggregator-v0.1')
    assert.equal(envelope.observationWindowMs, 60_000)
    assert.equal(envelope.trajectoryConfidence, 0.5)
  })
})
