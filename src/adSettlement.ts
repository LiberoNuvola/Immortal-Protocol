import type { CardanoSubmissionReceipt, CardanoLucidExecutionPort } from '../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import { createCardanoExecutionAdapter } from '../Adapter/CARDANO/runtime/CardanoExecutionAdapter'
import type { AdCampaignAdmission } from './adCampaignAdmission'

export type AdSettlementReceipt = CardanoSubmissionReceipt & {
  packageId: AdCampaignAdmission['packageId']
  totalPriceUsd: number
  observationReference: string
  observationHash: string
  pricingValidUntil: number
}

/**
 * PRE-RICH application settlement boundary.
 *
 * Advertising is not an IMMORTAL Issue/Reveal/Claim/Expire transition, so it
 * must not be mislabeled as one merely to reuse the protocol Economic Gate.
 * The campaign admission is the application-level economic precondition; the
 * Cardano adapter remains the sole signing/submission boundary.
 *
 * This function does not authorize protocol economics and does not manufacture
 * a protocol EconomicAdmission witness.
 */
export async function submitAdSettlement(
  lucid: CardanoLucidExecutionPort,
  tx: unknown,
  admission: AdCampaignAdmission | null | undefined,
): Promise<AdSettlementReceipt> {
  if (!admission) {
    throw new Error('Ad campaign admission required before advertising settlement')
  }
  if (admission.admittedAt > Date.now()) {
    throw new Error('Ad campaign admission cannot originate in the future')
  }
  if (Date.now() > admission.validUntil) {
    throw new Error('Ad campaign pricing decision has expired')
  }
  if (!admission.observationReference.trim() || !/^[0-9a-fA-F]{64}$/.test(admission.observationHash)) {
    throw new Error('Ad campaign admission provenance is invalid')
  }

  const adapter = createCardanoExecutionAdapter(lucid)
  const receipt = await adapter.submitInfrastructure(tx)

  return Object.freeze({
    ...receipt,
    packageId: admission.packageId,
    totalPriceUsd: admission.totalPriceUsd,
    observationReference: admission.observationReference,
    observationHash: admission.observationHash,
    pricingValidUntil: admission.validUntil,
  })
}
