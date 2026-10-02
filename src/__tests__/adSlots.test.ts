import { describe, expect, it } from 'vitest'
import {
  AD_SLOT_DYNAMIC_PRICING,
  calculateAdaptivePriceEnvelope,
  calculateAdTotalUsd,
} from '../adSlots'

const now = 1_800_000_000_000

const observation = (overrides = {}) => ({
  observedVisitorsPerHour: 100,
  baselineVisitorsPerHour: 100,
  occupancyRatio: 0.5,
  trendRatio: 0,
  futureAttentionLowRatio: 0.9,
  futureAttentionHighRatio: 1.2,
  trajectoryConfidence: 0.8,
  observedAt: now,
  maxAgeMs: 60_000,
  ...overrides,
})

describe('adaptive PRE-RICH advertising pricing', () => {
  it('is bounded by the configured price floor and ceiling', () => {
    const envelope = calculateAdaptivePriceEnvelope(
      observation({
        occupancyRatio: 1,
        observedVisitorsPerHour: 10_000,
        baselineVisitorsPerHour: 1,
        futureAttentionLowRatio: 10,
        futureAttentionHighRatio: 20,
      }),
      now,
    )

    expect(envelope).not.toBeNull()
    expect(envelope!.lowerPricePerHour).toBeGreaterThanOrEqual(AD_SLOT_DYNAMIC_PRICING.floorPricePerHour)
    expect(envelope!.upperPricePerHour).toBeLessThanOrEqual(AD_SLOT_DYNAMIC_PRICING.ceilingPricePerHour)
    expect(envelope!.lowerPricePerHour).toBeLessThanOrEqual(envelope!.upperPricePerHour)
  })

  it('raises the current rate when observed attention rises', () => {
    const low = calculateAdaptivePriceEnvelope(
      observation({ observedVisitorsPerHour: 50 }),
      now,
    )!
    const high = calculateAdaptivePriceEnvelope(
      observation({ observedVisitorsPerHour: 300 }),
      now,
    )!

    expect(high.currentPricePerHour).toBeGreaterThanOrEqual(low.currentPricePerHour)
  })

  it('widens the future envelope when the trajectory interval widens', () => {
    const narrow = calculateAdaptivePriceEnvelope(
      observation({ futureAttentionLowRatio: 1, futureAttentionHighRatio: 1.1 }),
      now,
    )!
    const wide = calculateAdaptivePriceEnvelope(
      observation({ futureAttentionLowRatio: 0.5, futureAttentionHighRatio: 2 }),
      now,
    )!

    expect(wide.upperPricePerHour).toBeGreaterThanOrEqual(narrow.upperPricePerHour)
  })

  it('reduces trajectory influence when confidence is low', () => {
    const lowConfidence = calculateAdaptivePriceEnvelope(
      observation({
        trajectoryConfidence: 0,
        futureAttentionLowRatio: 0.1,
        futureAttentionHighRatio: 3,
      }),
      now,
    )!
    const highConfidence = calculateAdaptivePriceEnvelope(
      observation({
        trajectoryConfidence: 1,
        futureAttentionLowRatio: 0.1,
        futureAttentionHighRatio: 3,
      }),
      now,
    )!

    expect(highConfidence.upperPricePerHour).toBeGreaterThanOrEqual(lowConfidence.upperPricePerHour)
  })

  it('fails closed for stale observations', () => {
    const envelope = calculateAdaptivePriceEnvelope(
      observation({ observedAt: now - 60_001 }),
      now,
    )

    expect(envelope).toBeNull()
  })

  it('fails closed for invalid observation baselines', () => {
    expect(
      calculateAdaptivePriceEnvelope(
        observation({ baselineVisitorsPerHour: 0 }),
        now,
      ),
    ).toBeNull()
  })

  it('keeps legacy package pricing available without an observation', () => {
    expect(calculateAdTotalUsd('1h')).toBe(1)
  })
})
