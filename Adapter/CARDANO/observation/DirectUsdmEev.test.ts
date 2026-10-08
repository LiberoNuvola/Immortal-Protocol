import { describe, expect, it } from 'vitest'
import { directUsdmEevFromAtomic, observeDirectUsdmEev } from './DirectUsdmEev'

describe('Direct USDM EEV boundary', () => {
  it('maps one physical token to the protocol economic unit', () => {
    expect(directUsdmEevFromAtomic(1_000_000n)).toBe(100n)
  })
  it('maps the current 100000-subunit target', () => {
    expect(directUsdmEevFromAtomic(1_000_000_000n)).toBe(100_000n)
  })
  it('rounds downward', () => {
    expect(directUsdmEevFromAtomic(10_009n)).toBe(1n)
    expect(directUsdmEevFromAtomic(20_000n)).toBe(2n)
  })
  it('fails closed when the expected asset is absent', () => {
    expect(() => observeDirectUsdmEev({ assets: { lovelace: 1n } })).toThrow()
  })
})
