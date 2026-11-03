import { describe, expect, it } from 'vitest'
import {
  assertDirectUsdmMatchesPoolDatum,
  observePreprodDirectUsdmPool,
} from './PreprodDirectUsdmObservation'

const poolUnit = 'a'.repeat(56)
const usdmUnit = 'b'.repeat(56)
const poolRef = '1'.repeat(64) + '#0'

const lucid = {
  async utxosAt() {
    return [{
      txHash: '1'.repeat(64),
      outputIndex: 0,
      assets: {
        [poolUnit]: 1n,
        [usdmUnit]: 1_000_000_000n,
      },
      address: 'addr_test1wexample',
    }]
  },
}

describe('Preprod direct-USDM runtime observation', () => {
  it('binds the EEV observation to the exact live Pool UTxO', async () => {
    const result = await observePreprodDirectUsdmPool({
      lucid,
      poolAddress: 'addr_test1wexample',
      poolInputReference: poolRef,
      poolTokenUnit: poolUnit,
      directUsdmUnit: usdmUnit,
      observationReference: 'preprod-issue:' + poolRef,
      observedAt: 123n,
    })

    expect(result.poolInputReference).toBe(poolRef)
    expect(result.poolUsdmValue).toBe(100_000n)
    expect(result.liquiditySourceReferences).toEqual([poolRef])
    expect(result.observedAt).toBe(123n)
  })

  it('fails closed when the exact Pool UTxO is absent', async () => {
    await expect(
      observePreprodDirectUsdmPool({
        lucid: {
          async utxosAt() { return [] },
        },
        poolAddress: 'addr_test1wexample',
        poolInputReference: poolRef,
        poolTokenUnit: poolUnit,
        directUsdmUnit: usdmUnit,
        observationReference: 'preprod-issue:' + poolRef,
        observedAt: 123n,
      }),
    ).rejects.toThrow(/no longer live/)
  })

  it('rejects an unqualified asset mixed into a live Pool UTxO', async () => {
    await expect(
      observePreprodDirectUsdmPool({
        lucid: {
          async utxosAt() {
            return [{
              txHash: '1'.repeat(64),
              outputIndex: 0,
              assets: {
                [poolUnit]: 1n,
                [usdmUnit]: 1_000_000_000n,
                ['c'.repeat(56)]: 1_000_000n,
              },
            }]
          },
        },
        poolAddress: 'addr_test1wexample',
        poolInputReference: poolRef,
        poolTokenUnit: poolUnit,
        directUsdmUnit: usdmUnit,
        observationReference: 'preprod-issue:' + poolRef,
        observedAt: 123n,
      }),
    ).rejects.toThrow(/rejects unqualified Pool asset/)
  })

  it('requires exact equality between the B1 datum liquidity and direct-USDM observation', () => {
    expect(() => assertDirectUsdmMatchesPoolDatum(100_000n, 100_000n)).not.toThrow()
    expect(() => assertDirectUsdmMatchesPoolDatum(110_000n, 100_000n))
      .toThrow(/does not match direct physical USDM/)
    expect(() => assertDirectUsdmMatchesPoolDatum(90_000n, 100_000n))
      .toThrow(/does not match direct physical USDM/)
  })

  it('fails closed when the expected direct-USDM asset is absent', async () => {
    await expect(
      observePreprodDirectUsdmPool({
        lucid: {
          async utxosAt() {
            return [{
              txHash: '1'.repeat(64),
              outputIndex: 0,
              assets: { [poolUnit]: 1n },
            }]
          },
        },
        poolAddress: 'addr_test1wexample',
        poolInputReference: poolRef,
        poolTokenUnit: poolUnit,
        directUsdmUnit: usdmUnit,
        observationReference: 'preprod-issue:' + poolRef,
        observedAt: 123n,
      }),
    ).rejects.toThrow(/direct-USDM/)
  })
})
