import { describe, expect, it } from 'vitest'
import { assertObservedTicketNft, certifyTicketBinding } from '../../PRE-RICH/profile/PreRichCertifiedTicket'
import { escapeHtml } from '../../src/ticket3d'

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

describe('Certified 3D renderer escaping', () => {
  it('escapes all HTML-significant characters deterministically', () => {
    expect(escapeHtml('<script>alert("x")</script> & \'ticket\'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;ticket&#39;',
    )
  })
})

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
      verificationReference: 'verify-2',
    })).toThrow('ticket asset name does not match PrizeDatum identity')
  })

  it('rejects an invalid expiry ordering', () => {
    expect(() => certifyTicketBinding({
      walletAssetPolicyId: datum.ticketPolicy,
      walletAssetNameHex: datum.ticketName,
      datum: { ...datum, expiresAt: 999n },
      verificationReference: 'verify-3',
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
      verificationReference: 'verify-4',
    })
    expect(state.row1Tier).toBe(2n)
    expect(state.row2Tier).toBe(0n)
    expect(state.prizeTier).toBe(2n)
  })
})

describe('Certified ticket NFT observation', () => {
  it('accepts exactly one observed ticket NFT', () => {
    expect(() => assertObservedTicketNft(
      { ['aa'.repeat(28) + '3132']: 1n },
      'aa'.repeat(28),
      '3132',
    )).not.toThrow()
  })

  it('rejects a missing ticket NFT', () => {
    expect(() => assertObservedTicketNft(
      {},
      'aa'.repeat(28),
      '3132',
    )).toThrow('certified ticket NFT must be observed with quantity exactly one')
  })

  it('rejects multiple units of the same ticket NFT', () => {
    expect(() => assertObservedTicketNft(
      { ['aa'.repeat(28) + '3132']: 2n },
      'aa'.repeat(28),
      '3132',
    )).toThrow('certified ticket NFT must be observed with quantity exactly one')
  })
})
