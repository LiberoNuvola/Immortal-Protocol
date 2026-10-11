import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src', 'gameFlow.ts'), 'utf8')

function claimSection(): string {
  const start = source.indexOf('export async function claimPrize')
  const end = source.indexOf('export async function expirePrize', start)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('Claim settlement address binding', () => {
  it('derives PrizeValidator claimant address from the owner payment credential', () => {
    const claim = claimSection()
    expect(claim).toContain('const buyerPaymentCredential = lucid.utils.paymentCredentialOf(buyer)')
    expect(claim).toContain("if (!buyerPaymentCredential || buyerPaymentCredential.type !== 'Key')")
    expect(claim).toContain('const claimantAddress = lucid.utils.credentialToAddress(buyerPaymentCredential)')
  })

  it('pays settlement to the enterprise claimant address, not the wallet base address', () => {
    const claim = claimSection()
    expect(claim).toContain('.payToAddress(claimantAddress, settlementValue)')
    expect(claim).not.toContain('.payToAddress(buyer, settlementValue)')
  })

  it('returns the ticket NFT to the original wallet address and keeps owner signing', () => {
    const claim = claimSection()
    expect(claim).toContain('.payToAddress(buyer, { [opts.ticketPolicyId + opts.ticketAssetNameHex]: 1n })')
    expect(claim).toContain('.addSigner(buyer)')
  })
})
