import { describe, expect, it } from 'vitest'
import { Constr } from 'lucid-cardano'
import { genesisTreasuryThresholdReached, observeGenesisTreasuryState } from '../genesisTreasuryObservation'

function utxo(txHash:string, outputIndex:number, assets:Record<string,bigint>, datum:any): any {
  return { txHash, outputIndex, address: 'treasury', assets, datum }
}

function lucidFor(
  treasuryUtxos: any[],
  oracleUtxos: any[],
  derivedAddress = 'treasury',
) {
  return {
    utils: {
      validatorToAddress: () => derivedAddress,
    },
    utxosAt: async (address:string) => address === 'treasury' ? treasuryUtxos : oracleUtxos,
  }
}

describe('Genesis Treasury observation', () => {
  it('fails closed when Treasury has ambiguous PRE-bearing UTxOs', async () => {
    const lucid = lucidFor(
      [utxo('a',0,{PRE:4000000n},null),utxo('b',1,{PRE:1n},null)],
      [],
    )
    await expect(observeGenesisTreasuryState({
      lucid, treasuryAddress:'treasury', oracleStateAddress:'oracle',
      prePolicyId:'PRE', preAssetNameHex:'NAME', oracleStatePolicyId:'O', oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB', nowMs:1000n,
    })).rejects.toThrow(/ambiguous/)
  })

  it('selects the PRE quote from an authenticated multi-asset OracleQuoteSet', async () => {
    const adaQuote = new Constr(0, ['', '', 100n, 1000n, 'PUB'] as any)
    const preQuote = new Constr(0, ['PRE', 'NAME', 40000n, 1000n, 'PUB'] as any)
    const oracleDatum = new Constr(1, [[adaQuote, preQuote]] as any)
    const lucid = lucidFor(
      [utxo('treasuryTx',0,{'PRENAME':100000000n},null)],
      [utxo('oracleTx',0,{OS:1n},oracleDatum)],
    )
    const observation = await observeGenesisTreasuryState({
      lucid, treasuryAddress:'treasury', oracleStateAddress:'oracle',
      prePolicyId:'PRE', preAssetNameHex:'NAME', oracleStatePolicyId:'O', oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB', nowMs:1000n,
    })
    expect(observation.verifiedPreUsdmPrice).toBe(40000n)
    expect(observation.oracleFresh).toBe(true)
    expect(genesisTreasuryThresholdReached(observation)).toBe(true)
  })

  it('rejects a caller-configured Treasury address that is not the validator-derived address', async () => {
    const lucid = lucidFor([], [], 'canonical-treasury')
    await expect(observeGenesisTreasuryState({
      lucid, treasuryAddress:'attacker-selected-treasury', oracleStateAddress:'oracle',
      prePolicyId:'PRE', preAssetNameHex:'NAME', oracleStatePolicyId:'O', oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB', nowMs:1000n,
    })).rejects.toThrow(/TREASURY_IDENTITY_MISMATCH/)
  })

  it('fails closed when the Lucid address derivation capability is absent', async () => {
    const lucid = { utxosAt: async () => [] }
    await expect(observeGenesisTreasuryState({
      lucid, treasuryAddress:'treasury', oracleStateAddress:'oracle',
      prePolicyId:'PRE', preAssetNameHex:'NAME', oracleStatePolicyId:'O', oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB', nowMs:1000n,
    })).rejects.toThrow(/TREASURY_DERIVATION_UNAVAILABLE/)
  })

  it('accepts a fresh authenticated 4000 USDM observation', async () => {
    const oracleDatum = new Constr(0,['PRE','NAME',40000n,1000n,'PUB'] as any)
    const lucid = lucidFor(
      [utxo('treasuryTx',0,{'PRENAME':100000000n},null)],
      [utxo('oracleTx',0,{OS:1n},oracleDatum)],
    )
    const observation = await observeGenesisTreasuryState({
      lucid, treasuryAddress:'treasury', oracleStateAddress:'oracle',
      prePolicyId:'PRE', preAssetNameHex:'NAME', oracleStatePolicyId:'O', oracleStateTokenNameHex:'S',
      oraclePublisherPkh:'PUB', nowMs:1000n,
    })
    expect(observation.oracleFresh).toBe(true)
    expect(genesisTreasuryThresholdReached(observation)).toBe(true)
  })
})
