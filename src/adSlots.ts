export type AdSlotPackageId = '1h' | '6h' | '1d' | '3d'

export type AdSlotPackage = {
  id: AdSlotPackageId
  label: string
  hours: number
  baseUsd: number
  pricePerHour: number
}

export const AD_SLOT_PACKAGES: AdSlotPackage[] = [
  { id: '1h', label: '1 hour', hours: 1, baseUsd: 1.5, pricePerHour: 1.5 },
  { id: '6h', label: '6 hours', hours: 6, baseUsd: 7.5, pricePerHour: 1.25 },
  { id: '1d', label: '1 day', hours: 24, baseUsd: 12, pricePerHour: 0.5 },
  { id: '3d', label: '3 days', hours: 72, baseUsd: 30, pricePerHour: 0.4166666667 },
]

export const AD_SLOT_DYNAMIC_PRICING = {
  floorPricePerHour: 1,
  ceilingPricePerHour: 10,
  step: 0.5,
}

export type AdAttentionObservation = {
  observedVisitorsPerHour: number
  baselineVisitorsPerHour: number
  occupancyRatio: number
  trendRatio: number
  futureAttentionLowRatio: number
  futureAttentionHighRatio: number
  trajectoryConfidence: number
  observedAt: number
  maxAgeMs?: number
}

export type AdPricingEnvelope = {
  currentPricePerHour: number
  lowerPricePerHour: number
  upperPricePerHour: number
  confidence: number
  validUntil: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const isFiniteNonNegative = (value: number) => Number.isFinite(value) && value >= 0

const quantize = (value: number) => {
  const { floorPricePerHour, ceilingPricePerHour, step } = AD_SLOT_DYNAMIC_PRICING
  const clamped = clamp(value, floorPricePerHour, ceilingPricePerHour)
  return Math.round(clamped / step) * step
}

export function getPackageById(packageId: AdSlotPackageId): AdSlotPackage {
  const packageDef = AD_SLOT_PACKAGES.find((candidate) => candidate.id === packageId)
  if (!packageDef) throw new Error(`Unknown package: ${packageId}`)
  return packageDef
}

export function getDynamicPricePerHour(occupancyRatio: number): number {
  const { floorPricePerHour, ceilingPricePerHour, step } = AD_SLOT_DYNAMIC_PRICING
  const ratio = Math.max(0, Math.min(1, occupancyRatio))
  const adjusted = (1 + ratio * 1.5) * floorPricePerHour
  const clamped = Math.min(Math.max(adjusted, floorPricePerHour), ceilingPricePerHour)
  return Math.round(clamped / step) * step
}

/**
 * Derive a bounded advertising-price envelope from an attention observation.
 *
 * This is application-level PRE-RICH logic. It is deliberately a pure function:
 * it does not fetch analytics, trust browser counters, or claim to predict the
 * future. Future attention is supplied as an explicit bounded interval.
 *
 * Returns null when the observation is malformed or stale, so a caller cannot
 * silently price from untrusted/stale state.
 */
export function calculateAdaptivePriceEnvelope(
  observation: AdAttentionObservation,
  now = Date.now(),
): AdPricingEnvelope | null {
  const maxAgeMs = observation.maxAgeMs ?? 15 * 60 * 1000

  if (
    !isFiniteNonNegative(observation.observedVisitorsPerHour) ||
    !isFiniteNonNegative(observation.baselineVisitorsPerHour) ||
    !Number.isFinite(observation.occupancyRatio) ||
    !Number.isFinite(observation.trendRatio) ||
    !Number.isFinite(observation.futureAttentionLowRatio) ||
    !Number.isFinite(observation.futureAttentionHighRatio) ||
    !Number.isFinite(observation.trajectoryConfidence) ||
    !Number.isFinite(observation.observedAt) ||
    maxAgeMs < 0
  ) return null

  if (now < observation.observedAt || now - observation.observedAt > maxAgeMs) return null
  if (observation.baselineVisitorsPerHour <= 0) return null

  const low = Math.max(0, Math.min(observation.futureAttentionLowRatio, observation.futureAttentionHighRatio))
  const high = Math.max(low, observation.futureAttentionHighRatio)
  const confidence = clamp(observation.trajectoryConfidence, 0, 1)
  const occupancy = clamp(observation.occupancyRatio, 0, 1)
  const currentAttentionRatio = clamp(
    observation.observedVisitorsPerHour / observation.baselineVisitorsPerHour,
    0.25,
    4,
  )
  const trendFactor = clamp(1 + observation.trendRatio * 0.25, 0.75, 1.25)

  const basePressure = 1 + occupancy * 1.5
  const currentFactor = clamp(0.75 + currentAttentionRatio * 0.25, 0.75, 1.75) * trendFactor
  const futureLowFactor = 0.75 + clamp(low, 0, 3) * 0.25
  const futureHighFactor = 0.75 + clamp(high, 0, 3) * 0.25

  const conservativeLow = basePressure * (currentFactor * (1 - confidence) + futureLowFactor * confidence)
  const conservativeHigh = basePressure * (currentFactor * (1 - confidence) + futureHighFactor * confidence)
  const current = basePressure * currentFactor

  const lowerPricePerHour = quantize(conservativeLow)
  const upperPricePerHour = quantize(Math.max(conservativeHigh, conservativeLow))
  const currentPricePerHour = quantize(current)

  return {
    currentPricePerHour,
    lowerPricePerHour: Math.min(lowerPricePerHour, upperPricePerHour),
    upperPricePerHour,
    confidence,
    validUntil: observation.observedAt + maxAgeMs,
  }
}

export function calculateAdTotalUsd(
  packageId: AdSlotPackageId,
  occupancyRatio = 0,
  pricingEnvelope?: AdPricingEnvelope | null,
): number {
  const pkg = getPackageById(packageId)
  const dynamicRate = pricingEnvelope?.currentPricePerHour ?? getDynamicPricePerHour(occupancyRatio)
  const packagePrice = Number((pkg.hours * dynamicRate).toFixed(2))
  return Number(packagePrice.toFixed(2))
}

export function parsePackageSelection(packageId: string): AdSlotPackage {
  return getPackageById(packageId as AdSlotPackageId)
}

export function formatUsd(value: number): string {
  return `${value.toFixed(2)} USDM`
}

export function getExpiryDateFromPackage(packageId: AdSlotPackageId, now = Date.now()): Date {
  const pkg = getPackageById(packageId)
  return new Date(now + pkg.hours * 60 * 60 * 1000)
}

export default {
  AD_SLOT_PACKAGES,
  AD_SLOT_DYNAMIC_PRICING,
  getPackageById,
  getDynamicPricePerHour,
  calculateAdaptivePriceEnvelope,
  calculateAdTotalUsd,
  parsePackageSelection,
  formatUsd,
  getExpiryDateFromPackage,
}
