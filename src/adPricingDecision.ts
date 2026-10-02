import { calculateAdaptivePriceEnvelope, type AdAttentionObservation, type AdPricingEnvelope } from '../src/adSlots'

export type TrustedAttentionState = AdAttentionObservation & {
  producerId: string
  observationReference: string
  observationHash: string
  sequence: number
  source: string
}

export type AdPricingDecision = {
  envelope: AdPricingEnvelope
  observationReference: string
  observationHash: string
  producerId: string
  sequence: number
}

export function deriveAdPricingDecision(
  attention: TrustedAttentionState,
  now = Date.now(),
): AdPricingDecision | null {
  if (!attention.producerId.trim() || !attention.observationReference.trim()) return null
  if (!/^[0-9a-f]{64}$/i.test(attention.observationHash)) return null
  if (!Number.isInteger(attention.sequence) || attention.sequence < 0) return null
  if (!attention.source.trim()) return null

  const envelope = calculateAdaptivePriceEnvelope(attention, now)
  if (!envelope) return null

  return Object.freeze({
    envelope,
    observationReference: attention.observationReference,
    observationHash: attention.observationHash,
    producerId: attention.producerId,
    sequence: attention.sequence,
  })
}
