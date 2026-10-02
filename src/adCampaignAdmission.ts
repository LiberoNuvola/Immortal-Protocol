import { getExpiryDateFromPackage, getPackageById, type AdSlotPackageId } from './adSlots'
import type { AdPricingDecision } from './adPricingDecision'

export type AdCampaignAdmission = {
  packageId: AdSlotPackageId
  pricePerHour: number
  totalPriceUsd: number
  admittedAt: number
  expiresAt: number
  validUntil: number
  observationReference: string
  observationHash: string
  producerId: string
  sequence: number
}

export function admitAdCampaign(
  packageId: AdSlotPackageId,
  decision: AdPricingDecision,
  now = Date.now(),
): AdCampaignAdmission | null {
  const pkg = getPackageById(packageId)

  if (!decision.observationReference.trim()) return null
  if (!/^[0-9a-f]{64}$/i.test(decision.observationHash)) return null
  if (!decision.producerId.trim()) return null
  if (!Number.isInteger(decision.sequence) || decision.sequence < 0) return null
  if (!Number.isFinite(decision.envelope.currentPricePerHour)) return null
  if (now > decision.envelope.validUntil) return null
  if (decision.envelope.validUntil <= now) return null

  const pricePerHour = decision.envelope.currentPricePerHour
  const totalPriceUsd = Number((pkg.hours * pricePerHour).toFixed(2))
  const expiresAt = getExpiryDateFromPackage(packageId, now).getTime()

  return Object.freeze({
    packageId,
    pricePerHour,
    totalPriceUsd,
    admittedAt: now,
    expiresAt,
    validUntil: decision.envelope.validUntil,
    observationReference: decision.observationReference,
    observationHash: decision.observationHash,
    producerId: decision.producerId,
    sequence: decision.sequence,
  })
}
