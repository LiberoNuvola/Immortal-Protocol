import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { Constr, Data } from 'lucid-cardano'
import { observeEconomicStateCarrier } from './preprodEconomicStateObservation'

function stateDatum() {
  const classes = Array.from({ length: 8 }, (_, i) =>
    new Constr(0, [BigInt(i), 0n, 0n, 0n, 10n, new Constr(1, [])]),
  )
  const state = new Constr(0, [
    0n, 0n, 0n, 0n, 0n, 0n,
    classes,
    new Constr(0, [0n, 0n]),
    new Constr(0, [0n, 0n, new Constr(0, []), 0n]),
  ])
  return Data.to(new Constr(0, [0n, state]))
}

function lucidWith(utxos: any[]) {
  return { utxosAt: async () => utxos }
}

const baseUtxo = {
  txHash: '11'.repeat(32),
  outputIndex: 0,
  assets: { ['aa'.repeat(28) + '5354415445']: 1n },
  datum: stateDatum(),
}

describe('Preprod V3 economic state carrier observer', () => {
  it('decodes one authenticated singleton state', async () => {
    const observed = await observeEconomicStateCarrier({
      lucid: lucidWith([baseUtxo]),
      carrierAddress: 'addr_test1carrier',
      carrierPolicyId: 'aa'.repeat(28),
      carrierTokenNameHex: '5354415445',
    })
    assert.equal(observed.stateVersion, 0n)
    assert.equal(observed.state.classes.length, 8)
    assert.equal(observed.state.unresolvedReserve, 0n)
    assert.equal(observed.carrierStateReference, 'cardano:tx/' + '11'.repeat(32) + '#0')
  })

  it('rejects ambiguous singleton state', async () => {
    await assert.rejects(
      observeEconomicStateCarrier({
        lucid: lucidWith([baseUtxo, { ...baseUtxo, outputIndex: 1 }]),
        carrierAddress: 'addr_test1carrier',
        carrierPolicyId: 'aa'.repeat(28),
        carrierTokenNameHex: '5354415445',
      }),
      /ambiguous/,
    )
  })

  it('decodes payable Jackpot lifecycle state without collapsing it', async () => {
    const fields = new Constr(0, [
      0n, 0n, 0n, 0n, 0n, 0n,
      Array.from({ length: 8 }, (_, i) =>
        new Constr(0, [BigInt(i), 0n, 0n, 0n, 10n, new Constr(1, [])]),
      ),
      new Constr(0, [0n, 0n]),
      new Constr(0, [0n, 0n, new Constr(2, []), 0n]),
    ])
    const utxo = { ...baseUtxo, datum: Data.to(new Constr(0, [0n, fields])) }
    const observed = await observeEconomicStateCarrier({
      lucid: lucidWith([utxo]),
      carrierAddress: 'addr_test1carrier',
      carrierPolicyId: 'aa'.repeat(28),
      carrierTokenNameHex: '5354415445',
    })
    assert.equal(observed.state.jackpot.status, 'payable')
  })
})