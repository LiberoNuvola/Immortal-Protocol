// Legacy compatibility facade for Claim.
//
// The canonical implementation lives in src/gameFlow.ts.
// This module deliberately has no payment fallbacks: callers must supply the
// exact settlement asset quantity and the canonical claim flow performs the
// final on-chain USDM-equivalence check.

import {
  claimPrize as canonicalClaimPrize,
  findPrizeUtxo,
  findTicketUtxoInWallet,
  type ExactSettlementValue,
} from './gameFlow'

export { findPrizeUtxo, findTicketUtxoInWallet }
export type { ExactSettlementValue }

export async function claimPrizeAuto(
  lucid: unknown,
  scriptAddress: string,
  ticketPolicyId: string,
  ticketAssetName: string,
  statusCb?: (msg: string) => void,
  settlementValue?: ExactSettlementValue,
  b1PrizePoolAddress?: string,
): Promise<string> {
  if (!settlementValue || Object.keys(settlementValue).length === 0) {
    throw new Error(
      'Exact settlement quote required: no automatic lovelace/token fallback is permitted',
    )
  }

  // Keep the legacy parameter for API compatibility. Canonical Claim uses the
  // connected wallet context and therefore does not accept a second Lucid
  // context that could diverge from the active wallet.
  void lucid

  statusCb?.('Building canonical Claim transaction...')

  const txHash = await canonicalClaimPrize({
    prizeAddress: scriptAddress,
    ticketPolicyId,
    ticketAssetNameHex: ticketAssetName,
    b1PrizePoolAddress,
    settlementValue,
  })

  statusCb?.(`Submitted tx: ${txHash}`)
  return txHash
}

export async function tryClaimAndNotify(
  lucid: unknown,
  scriptAddress: string,
  ticketPolicyId: string,
  ticketAssetName: string,
  onProgress?: (msg: string) => void,
  settlementValue?: ExactSettlementValue,
  b1PrizePoolAddress?: string,
): Promise<string> {
  onProgress?.('Preparing exact settlement Claim...')

  if (!settlementValue || Object.keys(settlementValue).length === 0) {
    throw new Error(
      'Exact settlement quote required before Claim can be constructed',
    )
  }

  return claimPrizeAuto(
    lucid,
    scriptAddress,
    ticketPolicyId,
    ticketAssetName,
    onProgress,
    settlementValue,
    b1PrizePoolAddress,
  )
}
