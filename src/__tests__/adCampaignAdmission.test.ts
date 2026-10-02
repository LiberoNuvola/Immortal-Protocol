import { describe, expect, it } from 'vitest'
import { deriveAdPricingDecision, type TrustedAttentionState } from '../adPricingDecision'
import { admitAdCampaign } from '../adCampaignAdmission'

const attention: TrustedAttentionState = {
  producerId: 'pre-rich-attention-producer-v0.1',
  observationReference: 'obs-001',
  observationHash: 'a'.repeat(64),
  sequence: 12,
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

describe('ad campaign admission', () => {
  it('freezes price, provenance and expiry into the admission', () => {
    const decision = deriveAdPricingDecision(attention, 2_000)!
    const admission = admitAdCampaign('6h', decision, 2_000)

    expect(admission).not.toBeNull()
    expect(admission?.pricePerHour).toBe(decision.envelope.currentPricePerHour)
    expect(admission?.totalPriceUsd).toBe(
      Number((6 * decision.envelope.currentPricePerHour).toFixed(2)),
    )
    expect(admission?.observationReference).toBe('obs-001')
    expect(admission?.observationHash).toBe('a'.repeat(64))
    expect(admission?.sequence).toBe(12)
    expect(admission?.expiresAt).toBe(2_000 + 6 * 60 * 60 * 1000)
  })

  it('fails closed after the pricing decision expires', () => {
    const decision = deriveAdPricingDecision(attention, 2_000)!
    expect(admitAdCampaign('1h', decision, decision.envelope.validUntil + 1)).toBeNull()
  })

  it('keeps the campaign price tied to the decision, not a fresh client value', () => {
    const decision = deriveAdPricingDecision(attention, 2_000)!
    const admission = admitAdCampaign('1d', decision, 2_000)!

    expect(admission.pricePerHour).toBe(decision.envelope.currentPricePerHour)
    expect(admission.totalPriceUsd).not.toBe(999)
  })
})
