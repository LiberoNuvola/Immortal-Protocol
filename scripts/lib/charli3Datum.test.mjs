import { describe, expect, it } from 'vitest'
import { decodeCharli3Datum } from './charli3Datum.mjs'

const c = (constructor, fields = []) => ({ constructor, fields })
const i = (n) => ({ int: String(n) })
const b = (s) => ({ bytes: Buffer.from(s, 'utf8').toString('hex') })
const map = (entries) => ({ map: entries.map(([k,v]) => ({ k: i(k), v })) })

describe('Charli3 standard oracle datum decoder', () => {
  it('decodes the published price map with exact integer price and timestamps', () => {
    const datum = c(0, [c(2, [map([
      [0, i(193500)], [1, i(1793478550123)], [2, i(1793490000000)], [3, i(6)],
      [6, b('ADA')], [7, b('USD')],
    ])])])
    const result = decodeCharli3Datum(datum)
    expect(result.prices[0]).toMatchObject({
      priceRaw: '193500', timestampMs: '1793478550123', precision: 6,
      baseSymbol: 'ADA', quoteSymbol: 'USD',
    })
  })

  it('merges shared price fields with local fields and reads extended metadata', () => {
    const datum = c(0, [
      c(0, [map([[3, i(6)], [6, b('ADA')], [7, b('USD')]])]),
      c(2, [map([[0, i(193500)], [1, i(1793478550123)], [2, i(1793490000000)]])]),
      c(1, [map([[0, i(7)], [1, i(5)], [2, i(2)]])]),
    ])
    const result = decodeCharli3Datum(datum)
    expect(result.prices[0].baseSymbol).toBe('ADA')
    expect(result.extendedData).toMatchObject({
      oracleProviderId: '7', dataSourceCount: '5', dataSignatoriesCount: '2',
    })
  })

  it('rejects unknown constructors, malformed maps and missing price fields', () => {
    expect(() => decodeCharli3Datum(c(0, [c(3, [])]))).toThrow('CHARLI3_ORACLE_FIELD_CONSTRUCTOR_UNSUPPORTED')
    expect(() => decodeCharli3Datum(c(0, [c(2, [{ map: [] }])]))).toThrow('CHARLI3_PRICE_MAP_REQUIRED_FIELD_MISSING:0')
    expect(() => decodeCharli3Datum(c(0, [c(2, [map([[0, i(1)]])])]))).toThrow('CHARLI3_PRICE_MAP_REQUIRED_FIELD_MISSING')
  })
})
