import { describe, expect, it } from 'vitest'
import { Constr, Data } from 'lucid-cardano'
import { genesisTreasuryThresholdReached, observeGenesisTreasuryState } from '../genesisTreasuryObservation'

function utxo(txHash:string, outputIndex:number, assets:Record<string,bigint>, datum:any): any {
  return { txHash, outputIndex, assets, datum }
}

describe('Genesis Treasury observation', () => {
  it('fails closed when Treasury has ambiguous PRE-bearing UTxOs', async () => {
    const lucid = { utxosAt: async (address:string) => address === 'treasury'
      ? [utxo('a',0,{PRE:4000000n},null),utxo('b',1,{PRE:1n},null)]
      : [] }
    await expect(observeGenesisTreasuryState({
      lucid, treasuryAddress:'treasury', oracleStateAddress:'oracle',
      prePolicyId:'PRE', preAssetNameHex:'', oracleStatePolicyId:'O', oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB', nowMs:1000n,
    })).rejects.toThrow(/ambiguous/)
  })

  it('accepts a fresh authenticated 4000 USDM observation', async () => {
    const oracleDatum = Data.to(new Constr(0,['PRE','',40000n,1000n,'PUB'] as any))
    const lucid = { utxosAt: async (address:string) => address === 'treasury'
      ? [utxo('treasuryTx',0,{PRE:100000000n},null)]
      : [utxo('oracleTx',0,{OS:1n},oracleDatum)] }
    const observation = await observeGenesisTreasuryState({
      lucid, treasuryAddress:'treasury', oracleStateAddress:'oracle',
      prePolicyId:'PRE', preAssetNameHex:'', oracleStatePolicyId:'O', oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB', nowMs:1000n,
    })
    expect(observation.oracleFresh).toBe(true)
    expect(genesisTreasuryThresholdReached(observation)).toBe(true)
  })
})
