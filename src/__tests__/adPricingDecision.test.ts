import { describe, expect, it } from 'vitest'
import { deriveAdPricingDecision, type TrustedAttentionState } from '../adPricingDecision'

const base: TrustedAttentionState = {
  producerId: 'pre-rich-attention-producer-v0.1',
  observationReference: 'obs-001',
  observationHash: 'a'.repeat(64),
  sequence: 7,
  source: 'attention-aggregator-v0.1',
  observedVisitorsPerHour: 120,
  baselineVisitorsPerHour: 100,
  occupancyRatio: 0.6,
  trendRatio: 0.2,
  futureAttentionLowRatio: 1.1,
  futureAttentionHighRatio: 1.8,
  trajectoryConfidence: 0.8,
  observedAt: 1_000,
  maxAgeMs: 5_000,
}

describe('trusted attention to advertising pricing', () => {
  it('returns a pricing decision carrying observation provenance', () => {
    const decision = deriveAdPricingDecision(base, 2_000)
    expect(decision).not.toBeNull()
    expect(decision?.observationReference).toBe('obs-001')
    expect(decision?.observationHash).toBe('a'.repeat(64))
    expect(decision?.producerId).toBe(base.producerId)
    expect(decision?.sequence).toBe(7)
    expect(decision?.envelope.currentPricePerHour).toBeGreaterThanOrEqual(1)
  })

  it('fails closed for stale trusted attention', () => {
    expect(deriveAdPricingDecision(base, 7_000)).toBeNull()
  })

  it('fails closed when provenance is malformed', () => {
    expect(
      deriveAdPricingDecision({ ...base, observationReference: '' }, 2_000),
    ).toBeNull()
    expect(
      deriveAdPricingDecision({ ...base, observationHash: 'bad' }, 2_000),
    ).toBeNull()
  })

  it('does not itself manufacture producer authority', () => {
    const decision = deriveAdPricingDecision(
      { ...base, producerId: 'unverified-client' },
      2_000,
    )
    expect(decision?.producerId).toBe('unverified-client')
  })
})
