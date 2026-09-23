// src/tickets.ts
import wallet from './wallet'
import { mintSerialNFT, type MintSerialOptions } from './mint'
import { COUNTER_SCRIPT_ADDRESS } from './config'

/**
 * B1 buy flow: each ticket requires a separate mint transaction.
 *
 * The mint transaction creates the NFT and PrizeDatum and pays the
 * Treasury in the same transaction (C-02 atomic sale invariant).
 *
 * The mint path crosses the Cardano execution boundary through the
 * Cardano Adapter for signing/submission.
 *
 * qty > 1 = multiple sequential transactions (one per ticket).
 */
export async function buyTickets(
  qty: number = 1,
  mintOptions: MintSerialOptions,
) {
  const lucid = wallet.getLucid()

  if (!lucid) {
    throw new Error('Wallet not connected')
  }

  if (!COUNTER_SCRIPT_ADDRESS) {
    throw new Error(
      'COUNTER_SCRIPT_ADDRESS not configured in config/.env',
    )
  }

  if (qty <= 0) {
    throw new Error('Invalid quantity')
  }

  const results: Array<{
    txHash: string
    tokenName: string
    assetId: string
  }> = []

  for (let i = 0; i < qty; i++) {
    const r = await mintSerialNFT(mintOptions)
    results.push(r)
  }

  return results
}

export default { buyTickets }
