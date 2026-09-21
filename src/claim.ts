import { claimPrize as canonicalClaimPrize } from './gameFlow'
import type { ExactSettlementValue } from './gameFlow'

/**
 * Public UI compatibility wrapper.
 *
 * The canonical Claim requires an explicit concrete settlement value.
 * No fixed ADA amount is inferred from prizeAmount.
 */
export async function claimPrize(
  scriptAddress: string,
  ticketPolicyId: string,
  ticketAssetName: string,
  statusCb: (message: string) => void,
  settlementValue?: ExactSettlementValue,
  b1PrizePoolAddress?: string,
): Promise<string> {
  statusCb('Preparing exact-settlement Claim...')

  if (!settlementValue || Object.keys(settlementValue).length === 0) {
    throw new Error(
      'Exact settlement quote required: Claim will not infer ADA or token quantity from prizeAmount',
    )
  }

  const txHash = await canonicalClaimPrize({
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
