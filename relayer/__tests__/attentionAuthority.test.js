const { describe, expect, it } = require('vitest')
const {
  assertAuthoritativeAttentionObservation,
  sealAttentionObservation,
} = require('../attentionAuthority')

describe('advertising observation authority boundary', () => {
  it('seals a producer observation with an explicit content hash', () => {
    const sealed = sealAttentionObservation(
      {
        source: 'attention-aggregator-v0.1',
        observationWindowMs: 60_000,
        observedVisitorsPerHour: 120,
        observedVisits: 30,
        uniqueVisitorBuckets: 20,
        observedAt: 120_000,
      },
      {
        producerId: 'pre-rich-attention-producer-v0.1',
        observationReference: 'obs-120000',
      },
    )

    expect(sealed.observationHash).toMatch(/^[0-9a-f]{64}$/)
    expect(assertAuthoritativeAttentionObservation(sealed)).toBe(true)
  })

  it('rejects tampered visitor observations', () => {
    const sealed = sealAttentionObservation(
      {
        source: 'attention-aggregator-v0.1',
        observationWindowMs: 60_000,
        observedVisitorsPerHour: 120,
        observedVisits: 30,
        uniqueVisitorBuckets: 20,
        observedAt: 120_000,
      },
      {
        producerId: 'pre-rich-attention-producer-v0.1',
        observationReference: 'obs-120000',
      },
    )

    expect(() =>
      assertAuthoritativeAttentionObservation({
        ...sealed,
        observedVisitorsPerHour: 9999,
      }),
    ).toThrow('attention observation hash mismatch')
  })

  it('rejects malformed producer observations', () => {
    expect(() =>
      assertAuthoritativeAttentionObservation({
        producerId: 'producer',
        observationReference: 'obs',
        source: 'attention-aggregator-v0.1',
        observedAt: 1,
        observationWindowMs: 60_000,
        observedVisitorsPerHour: 10,
        observedVisits: 2,
        uniqueVisitorBuckets: 3,
        observationHash: '0'.repeat(64),
      }),
    ).toThrow('uniqueVisitorBuckets cannot exceed observedVisits')
  })
})
