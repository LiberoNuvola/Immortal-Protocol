import { describe, expect, it } from 'vitest'

import { deriveExpiryAccounting } from '../../PRE-RICH/src/PreRichExpireAccounting'

const pool = {
  pendingLiabilities: 900n,
  unresolvedReserve: 1_200n,
  unresolvedTicketCount: 3n,
}

describe('PRE-RICH state-aware EXPIRE accounting', () => {
  it('preserves the existing Pending release exactly', () => {
    expect(deriveExpiryAccounting({
      status: 'Pending',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 0n,
      ...pool,
    })).toEqual({
      pendingLiabilities: 900n,
      unresolvedReserve: 1_100n,
      unresolvedTicketCount: 2n,
    })
  })

  it('allows Pending expiry when the count reaches one and releases it to zero', () => {
    expect(deriveExpiryAccounting({
      status: 'Pending',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 0n,
      pendingLiabilities: 0n,
      unresolvedReserve: 100n,
      unresolvedTicketCount: 1n,
    })).toEqual({
      pendingLiabilities: 0n,
      unresolvedReserve: 0n,
      unresolvedTicketCount: 0n,
    })
  })

  it('does not release unresolved reserve/count a second time for a Revealed Loss', () => {
    expect(deriveExpiryAccounting({
      status: 'Revealed',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 0n,
      ...pool,
    })).toEqual(pool)
  })

  it('releases only the crystallized liability for a Revealed Win', () => {
    expect(deriveExpiryAccounting({
      status: 'Revealed',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 500n,
      ...pool,
    })).toEqual({
      pendingLiabilities: 400n,
      unresolvedReserve: 1_200n,
      unresolvedTicketCount: 3n,
    })
  })

  it('allows Revealed expiry when no unresolved tickets remain', () => {
    expect(deriveExpiryAccounting({
      status: 'Revealed',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 200n,
      pendingLiabilities: 200n,
      unresolvedReserve: 0n,
      unresolvedTicketCount: 0n,
    })).toEqual({
      pendingLiabilities: 0n,
      unresolvedReserve: 0n,
      unresolvedTicketCount: 0n,
    })
  })

  it('rejects an unresolved ticket with a crystallized payout', () => {
    expect(() => deriveExpiryAccounting({
      status: 'Pending',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 1n,
      ...pool,
    })).toThrow('Pending EXPIRE requires zero crystallized payout')
  })

  it('rejects a Revealed Win whose liability is not present in the pool', () => {
    expect(() => deriveExpiryAccounting({
      status: 'Revealed',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 901n,
      ...pool,
    })).toThrow('Revealed EXPIRE payout exceeds pending liabilities')
  })

  it('rejects insufficient unresolved reserve', () => {
    expect(() => deriveExpiryAccounting({
      status: 'Pending',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 0n,
      pendingLiabilities: 0n,
      unresolvedReserve: 99n,
      unresolvedTicketCount: 1n,
    })).toThrow('B1PrizePool unresolved reserve is insufficient for ticket expiry')
  })

  it('rejects zero count for Pending expiry', () => {
    expect(() => deriveExpiryAccounting({
      status: 'Pending',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 0n,
      pendingLiabilities: 0n,
      unresolvedReserve: 100n,
      unresolvedTicketCount: 0n,
    })).toThrow('B1PrizePool has no unresolved ticket to expire')
  })

  it('rejects Claimed tickets', () => {
    expect(() => deriveExpiryAccounting({
      status: 'Claimed',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 500n,
      ...pool,
    })).toThrow('EXPIRE cannot consume a Claimed ticket')
  })

  it('rejects negative pool accounting', () => {
    expect(() => deriveExpiryAccounting({
      status: 'Revealed',
      ticketPriceUsdm: 100n,
      prizeAmountUsdm: 0n,
      pendingLiabilities: -1n,
      unresolvedReserve: 0n,
      unresolvedTicketCount: 0n,
    })).toThrow('EXPIRE accounting values must be non-negative')
  })
})
