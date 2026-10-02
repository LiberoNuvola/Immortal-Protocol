import { describe, expect, it, vi } from 'vitest'
import { submitAdSettlement } from '../adSettlement'
import type { AdCampaignAdmission } from '../adCampaignAdmission'

const admission: AdCampaignAdmission = {
  packageId: '6h',
  pricePerHour: 2,
  totalPriceUsd: 12,
  admittedAt: 1_000,
  expiresAt: 1_000 + 6 * 60 * 60 * 1000,
  validUntil: 10_000,
  observationReference: 'obs-001',
  observationHash: 'a'.repeat(64),
  producerId: 'producer-1',
  sequence: 4,
}

describe('PRE-RICH advertising settlement', () => {
  it('requires campaign admission and delegates signing to the Cardano adapter', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(2_000)

    const signTx = vi.fn().mockResolvedValue({ signed: true })
    const submitTx = vi.fn().mockResolvedValue('tx-ad-001')

    const receipt = await submitAdSettlement(
      { signTx, submitTx },
      { tx: 'advertising-payment' },
      admission,
    )

    expect(signTx).toHaveBeenCalledTimes(1)
    expect(submitTx).toHaveBeenCalledTimes(1)
    expect(receipt.transactionRef).toBe('tx-ad-001')
    expect(receipt.totalPriceUsd).toBe(12)
    expect(receipt.observationReference).toBe('obs-001')
  })

  it('fails before signing when campaign admission is absent', async () => {
    const signTx = vi.fn()
    const submitTx = vi.fn()

    await expect(
      submitAdSettlement({ signTx, submitTx }, {}, undefined),
    ).rejects.toThrow('Ad campaign admission required')

    expect(signTx).not.toHaveBeenCalled()
    expect(submitTx).not.toHaveBeenCalled()
  })

  it('fails before signing after pricing expiry', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_001)
    const signTx = vi.fn()
    const submitTx = vi.fn()

    await expect(
      submitAdSettlement({ signTx, submitTx }, {}, admission),
    ).rejects.toThrow('pricing decision has expired')

    expect(signTx).not.toHaveBeenCalled()
    expect(submitTx).not.toHaveBeenCalled()
  })
})
