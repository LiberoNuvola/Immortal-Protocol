import { describe, expect, it } from 'vitest'
import { Constr } from 'lucid-cardano'
import { observeAndAdmitGenesisTreasury } from '../GenesisTreasuryRuntime'

describe('Genesis Treasury runtime composition', () => {
  it('admits a fresh observed Treasury value at the 4000 USDM threshold', async () => {
    const lucid = {
      utxosAt: async (address:string) => address === 'treasury'
        ? [{txHash:'treasuryTx',outputIndex:0,assets:{'PRENAME':100000000n},datum:null}]
        : [{txHash:'oracleTx',outputIndex:0,assets:{'OS':1n},datum:new Constr(0,['PRE','NAME',4000n,1000n,'PUB'] as any)}],
    }
    const result = await observeAndAdmitGenesisTreasury({
      lucid,
      treasuryAddress:'treasury',
      oracleStateAddress:'oracle',
      prePolicyId:'PRE',
      preAssetNameHex:'NAME',
      oracleStatePolicyId:'O',
      oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB',
      nowMs:1000n,
    })
    expect(result.admitted).toBe(true)
    if (result.admitted) expect(result.verifiedTreasuryValueUsdm).toBe(400000n)
  })

  it('does not admit a stale Oracle observation', async () => {
    const lucid = {
      utxosAt: async (address:string) => address === 'treasury'
        ? [{txHash:'treasuryTx',outputIndex:0,assets:{'PRENAME':100000000n},datum:null}]
        : [{txHash:'oracleTx',outputIndex:0,assets:{'OS':1n},datum:new Constr(0,['PRE','NAME',40000n,0n,'PUB'] as any)}],
    }
    const result = await observeAndAdmitGenesisTreasury({
      lucid,
      treasuryAddress:'treasury',
      oracleStateAddress:'oracle',
      prePolicyId:'PRE',
      preAssetNameHex:'NAME',
      oracleStatePolicyId:'O',
      oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB',
      nowMs:4_000_001n,
    })
    expect(result).toEqual({admitted:false,reason:'ORACLE_STALE'})
  })
})