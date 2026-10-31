import { describe, expect, it } from 'vitest'
import { decodeSwapDatum, deriveQuote, formatRatio } from './observeSaturnSwapUsdmOrderbookReadOnly.mjs'

const USDM = {
  policy: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad',
  name: '0014df105553444d',
}
const bytes = (value) => ({ bytes: value })
const integer = (value) => ({ int: value })
const constr = (constructor, fields) => ({ constructor, fields })

function datum({ sellPolicy = USDM.policy, sellName = USDM.name, sell = 10_000_000,
  buyPolicy = '', buyName = '', buy = 20_000_000, expiry = null, fields = 9 } = {}) {
  const owner = constr(0, [
    constr(0, [bytes('aa'.repeat(28))]),
    constr(1, []),
  ])
  const base = [
    owner,
    bytes(sellPolicy), bytes(sellName), integer(sell),
    bytes(buyPolicy), bytes(buyName), integer(buy),
    expiry === null ? constr(1, []) : constr(0, [integer(expiry)]),
    constr(0, [constr(0, [bytes('00')]), integer(0)]),
  ]
  while (base.length < fields) base.push(integer(0))
  return constr(0, base)
}

const deployment = {
  id: 'saturn-v2-mainnet-1pct',
  feePercentX100: 100,
  scriptHash: '73990b71041ceade6f867617f6ce9f187ab710ea2bf1ff8db7d0292f',
  address: 'addr1z9eejzm3qsww4hn0semp0akwnuv84dcsag4lrludklgzjt675jq4yvpskgayj55xegdp30g5rfynax66r8vgn9fldndsrfnae7',
  datumFields: 9,
  plutusVersion: 'V2',
}

describe('SaturnSwap exact-USDM CLOB decoder', () => {
  it('decodes the 9-field V2 SwapDatum and owner key credential', () => {
    const decoded = decodeSwapDatum(datum(), 9)
    expect(decoded.sellUnit).toBe(USDM.policy + USDM.name)
    expect(decoded.buyUnit).toBe('')
    expect(decoded.amountSellRaw).toBe('10000000')
    expect(decoded.amountBuyRaw).toBe('20000000')
    expect(decoded.ownerPaymentCredential).toBe('aa'.repeat(28))
    expect(decoded.validBeforeTimeMs).toBeNull()
  })

  it('derives an ask from USDM sold for ADA', () => {
    const decoded = decodeSwapDatum(datum(), 9)
    const quote = deriveQuote(deployment, {
      value: '2000000',
      asset_list: [{ policy_id: USDM.policy, asset_name: USDM.name, quantity: '10000000' }],
      tx_hash: 'ab'.repeat(32), tx_index: 0,
    }, decoded, 1_800_000_000_000)
    expect(quote.side).toBe('ASK_USDM_FOR_ADA')
    expect(quote.priceAdaPerUsdm).toBe('2')
    expect(quote.fundedByCurrentUtxo).toBe(true)
  })

  it('derives a bid from ADA sold for USDM', () => {
    const decoded = decodeSwapDatum(datum({
      sellPolicy: '', sellName: '', sell: 30_000_000,
      buyPolicy: USDM.policy, buyName: USDM.name, buy: 10_000_000,
    }), 9)
    const quote = deriveQuote(deployment, { value: '30000000', asset_list: [] }, decoded, 1_800_000_000_000)
    expect(quote.side).toBe('BID_ADA_FOR_USDM')
    expect(quote.priceAdaPerUsdm).toBe('3')
    expect(quote.fundedByCurrentUtxo).toBe(true)
  })

  it('marks an expired order and an underfunded order separately', () => {
    const expired = decodeSwapDatum(datum({ expiry: 1_700_000_000_000 }), 9)
    const expiredQuote = deriveQuote(deployment, {
      value: '0', asset_list: [{ policy_id: USDM.policy, asset_name: USDM.name, quantity: '10000000' }],
    }, expired, 1_800_000_000_000)
    expect(expiredQuote.expired).toBe(true)
    const underfunded = deriveQuote(deployment, {
      value: '0', asset_list: [{ policy_id: USDM.policy, asset_name: USDM.name, quantity: '1' }],
    }, decodeSwapDatum(datum(), 9), 1_800_000_000_000)
    expect(underfunded.fundedByCurrentUtxo).toBe(false)
  })

  it('rejects a datum field-count mismatch', () => {
    expect(() => decodeSwapDatum(datum(), 11)).toThrow('SWAP_DATUM_FIELD_COUNT_INVALID')
  })

  it('returns no direct quote for a USDM/token pair', () => {
    const decoded = decodeSwapDatum(datum({ buyPolicy: 'bb'.repeat(28), buyName: '01' }), 9)
    expect(deriveQuote(deployment, { value: '0', asset_list: [] }, decoded, 1_800_000_000_000)).toBeNull()
  })

  it('formats ratios using integer arithmetic', () => {
    expect(formatRatio(1n, 3n, 8)).toBe('0.33333333')
  })
})
