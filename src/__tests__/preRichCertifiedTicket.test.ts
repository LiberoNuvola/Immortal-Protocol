import { describe, expect, it } from 'vitest'
import { certifyTicketBinding } from '../../PRE-RICH/profile/PreRichCertifiedTicket'

const datum = {
  ticketPolicy: 'aa'.repeat(28),
  ticketName: '3132',
  priceUsdm: 2_00n,
  commitment: '11'.repeat(32),
  gameVersion: '5052492d52494348',
  ticketNonce: 12n,
  status: 'Pending' as const,
  result: '',
  prizeTier: 0n,
  prizeAmount: 0n,
  issuedAt: 1000n,
  expiresAt: 2000n,
  row1Tier: 0n,
  row2Tier: 0n,
  beaconTarget: 'target-12',
}

describe('Certified persistent ticket binding', () => {
  it('certifies the immutable NFT identity against PrizeDatum', () => {
    const state = certifyTicketBinding({
      walletAssetPolicyId: datum.ticketPolicy,
      walletAssetNameHex: datum.ticketName,
      datum,
      purchaseTxHash: 'purchase-1',
      verificationReference: 'verify-1',
    })
    expect(state.identity.policyId).toBe(datum.ticketPolicy)
    expect(state.identity.assetName).toBe(datum.ticketName)
    expect(state.status).toBe('Pending')
  })

  it('rejects policy substitution', () => {
    expect(() => certifyTicketBinding({
      walletAssetPolicyId: 'bb'.repeat(28),
      walletAssetNameHex: datum.ticketName,
      datum,
    })).toThrow('ticket policy ID does not match PrizeDatum identity')
  })

  it('rejects asset-name substitution', () => {
    expect(() => certifyTicketBinding({
      walletAssetPolicyId: datum.ticketPolicy,
      walletAssetNameHex: '3334',
      datum,
    })).toThrow('ticket asset name does not match PrizeDatum identity')
  })

  it('rejects an invalid expiry ordering', () => {
    expect(() => certifyTicketBinding({
      walletAssetPolicyId: datum.ticketPolicy,
      walletAssetNameHex: datum.ticketName,
      datum: { ...datum, expiresAt: 999n },
    })).toThrow('expiresAt must not precede issuedAt')
  })

  it('preserves row-local result state rather than collapsing it', () => {
    const state = certifyTicketBinding({
      walletAssetPolicyId: datum.ticketPolicy,
      walletAssetNameHex: datum.ticketName,
      datum: {
        ...datum,
        status: 'Revealed',
        result: 'canonical-result',
        prizeTier: 2n,
        prizeAmount: 250n,
        row1Tier: 2n,
        row2Tier: 0n,
      },
    })
    expect(state.row1Tier).toBe(2n)
    expect(state.row2Tier).toBe(0n)
    expect(state.prizeTier).toBe(2n)
  })
})