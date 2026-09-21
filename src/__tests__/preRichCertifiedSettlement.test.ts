import { describe, expect, it } from 'vitest'
import {
  assertSettlementQuoteMatchesPrize,
  certifySettlementQuote,
} from '../../PRE-RICH/profile/PreRichCertifiedSettlement'

describe('PRE-RICH certified settlement quote', () => {
  it('certifies a concrete positive settlement asset bundle', () => {
    const quote = certifySettlementQuote(
      {
        ['aa'.repeat(28) + '00']: 250n,
      },
      250n,
      'oracle-state-123',
      1_000n,
    )
    expect(quote.expectedPrizeUsdmReferenceUnits).toBe(250n)
    expect(quote.assetMap).toEqual({ ['aa'.repeat(28) + '00']: 250n })
  })

  it('rejects empty or non-positive settlement bundles', () => {
    expect(() => certifySettlementQuote({}, 250n, 'oracle', 1n)).toThrow(
      'settlement asset map cannot be empty',
    )
    expect(() => certifySettlementQuote({ ada: 0n }, 250n, 'oracle', 1n)).toThrow(
      'settlement asset quantity must be positive',
    )
  })

  it('requires a declared oracle reference', () => {
    expect(() => certifySettlementQuote({ ada: 1n }, 250n, '   ', 1n)).toThrow(
      'oracle state reference is required',
    )
  })

  it('binds the quote to the PrizeAmount', () => {
    const quote = certifySettlementQuote({ ada: 1n }, 5n, 'oracle', 1n)
    expect(() => assertSettlementQuoteMatchesPrize(quote, 5n)).not.toThrow()
    expect(() => assertSettlementQuoteMatchesPrize(quote, 6n)).toThrow(
      'settlement quote does not match PrizeAmount',
    )
  })
})