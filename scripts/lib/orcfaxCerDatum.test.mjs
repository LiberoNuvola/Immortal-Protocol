import { describe, expect, it } from 'vitest'
import { decodeFspDatum, decodeFsDatum } from './orcfaxCerDatum.mjs'

const c = (constructor, fields = []) => ({ constructor, fields })
const b = (hex) => ({ bytes: hex })
const i = (value) => ({ int: String(value) })

describe('Orcfax CER datum decoder', () => {
  it('decodes FSP state as a 28-byte FS script hash', () => {
    const hash = 'ab'.repeat(28)
    expect(decodeFspDatum(b(hash))).toEqual({ fsScriptHash: hash })
  })

  it('rejects malformed FSP script hashes', () => {
    expect(() => decodeFspDatum(b('abcd'))).toThrow('ORCFAX_FS_SCRIPT_HASH_LENGTH_INVALID')
    expect(() => decodeFspDatum(c(0, []))).toThrow('ORCFAX_INVALID_BYTES')
  })

  it('decodes CER feed id, millisecond timestamp and exact rational', () => {
    const feedId = Buffer.from('CER/ADA-USD/').toString('hex')
    const datum = c(0, [
      c(0, [b(feedId), i(1793478550123), c(0, [i(19350000), i(100000000)])]),
      c(0, [b('12'.repeat(28))]),
    ])
    const decoded = decodeFsDatum(datum)
    expect(decoded.feedId).toBe('CER/ADA-USD/')
    expect(decoded.createdAtMs).toBe(1793478550123n)
    expect(decoded.numerator).toBe(19350000n)
    expect(decoded.denominator).toBe(100000000n)
  })

  it('preserves versioned feed id prefixes', () => {
    const feedId = Buffer.from('CER/ADA-USDM/2').toString('hex')
    const decoded = decodeFsDatum(c(0, [
      c(0, [b(feedId), i(1793478550123), c(0, [i(5), i(1)])]),
      c(0, []),
    ]))
    expect(decoded.feedId.startsWith('CER/ADA-USDM/')).toBe(true)
  })

  it('rejects malformed statements and nonpositive rationals', () => {
    expect(() => decodeFsDatum(c(0, [c(0, []), c(0, [])]))).toThrow('ORCFAX_STATEMENT_SHAPE_UNSUPPORTED')
    expect(() => decodeFsDatum(c(0, [
      c(0, [b(Buffer.from('CER/ADA-USD/').toString('hex')), i(1), c(0, [i(1), i(0)])]),
      c(0, []),
    ]))).toThrow('ORCFAX_RATIONAL_NONPOSITIVE')
  })
})
