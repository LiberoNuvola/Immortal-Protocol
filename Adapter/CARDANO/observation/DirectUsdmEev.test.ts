import { describe, expect, it } from 'vitest'
import { directUsdmEevFromAtomic, observeDirectUsdmEev } from './DirectUsdmEev'

// Snapshot coverage: direct-USDM evidence remains fail-closed.
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

  it('rejects negative physical quantities rather than producing a negative EEV', () => {
    expect(() => directUsdmEevFromAtomic(-1n)).toThrow(/non-negative bigint/)
    expect(() => observeDirectUsdmEev({
      assets: { ['e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d']: -1n },
    })).toThrow(/non-negative bigint/)
  })
  it('does not count ADA or a different native asset as direct-USDM EEV', () => {
    expect(() => observeDirectUsdmEev({
      assets: {
        lovelace: 999_000_000n,
        ['ab'.repeat(28) + '505245']: 10_000_000n,
      },
    })).toThrow(/does not contain the expected direct-USDM asset/)
  })
  it('rejects a non-profile asset even when direct tUSDM is also present', () => {
    const directUnit = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'
    const foreignUnit = 'ab'.repeat(28) + '505245'
    expect(() => observeDirectUsdmEev({
      assets: {
        [directUnit]: 1_000_000_000n,
        [foreignUnit]: 10_000_000n,
      },
    })).toThrow(/rejects unqualified Pool asset/)
  })

  it('ignores only explicitly allowlisted envelope assets such as ADA and the Pool NFT', () => {
    const directUnit = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'
    const poolUnit = 'cd'.repeat(28) + '504f4f4c'
    expect(observeDirectUsdmEev({
      assets: {
        lovelace: 2_000_000n,
        [poolUnit]: 1n,
        [directUnit]: 1_000_000_000n,
      },
      allowedNonEconomicUnits: ['lovelace', poolUnit],
    }).eevUsdmSubunits).toBe(100_000n)
  })

  it('rejects malformed asset-unit identity instead of treating a ticker as identity', () => {
    expect(() => observeDirectUsdmEev({
      assets: { USDM: 1_000_000n },
      expectedUnit: 'USDM',
    })).toThrow(/valid native-asset unit/)
  })
})
