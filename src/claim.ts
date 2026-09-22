import { claimPrize as canonicalClaimPrize } from './gameFlow'
import type { ExactSettlementValue } from './gameFlow'
import type { EconomicAdmissionWitness } from '../Adapter/CARDANO/runtime/EconomicAdmission'

/**
 * Public UI compatibility wrapper.
 *
 * The canonical Claim requires an explicit concrete settlement value and an
 * authoritative Economic Gate admission witness.
 * No fixed ADA amount or synthetic admission is inferred.
 */
export async function claimPrize(
  scriptAddress: string,
  ticketPolicyId: string,
  ticketAssetName: string,
  statusCb: (message: string) => void,
  settlementValue?: ExactSettlementValue,
  b1PrizePoolAddress?: string,
  economicAdmission?: EconomicAdmissionWitness,
): Promise<string> {
  statusCb('Preparing exact-settlement Claim...')

  if (!settlementValue || Object.keys(settlementValue).length === 0) {
    throw new Error(
      'Exact settlement quote required: Claim will not infer ADA or token quantity from prizeAmount',
    )
  }

  if (!economicAdmission) {
    throw new Error(
      'Authoritative Economic Gate admission required: Claim will not synthesize or infer economic authorization',
    )
  }

  const txHash = await canonicalClaimPrize({
    economicAdmission,
    prizeAddress: scriptAddress,
    ticketPolicyId,
    ticketAssetNameHex: ticketAssetName,
    b1PrizePoolAddress,
    settlementValue,
  })

  statusCb(`Submitted tx: ${txHash}`)
  return txHash
}

export default { claimPrize }
