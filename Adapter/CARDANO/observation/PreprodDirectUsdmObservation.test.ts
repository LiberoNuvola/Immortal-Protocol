import { describe, expect, it } from 'vitest'
import { observePreprodDirectUsdmPool } from './PreprodDirectUsdmObservation'

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
