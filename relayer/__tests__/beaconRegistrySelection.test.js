const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  selectPendingRegistryCandidates,
} = require('../beaconRegistrySelection')

function registryUtxo(id, datum) {
  return { id, datum }
}

function pendingDatum(brRound, targetRound, status = 0) {
  return {
    round: BigInt(brRound),
    target: { round: BigInt(targetRound) },
    status,
  }
}

function decodeRegistryDatum(utxo) {
  return utxo.datum
}

describe('BeaconRegistry worker Pending selection', () => {
  it('refuses two qualified Pending outputs for the same target round', () => {
    const first = registryUtxo('first', pendingDatum(42, 42))
    const second = registryUtxo('second', pendingDatum(42, 42))

    const result = selectPendingRegistryCandidates(
      [first, second],
      decodeRegistryDatum,
    )

    assert.deepEqual(result.selected, [])
    assert.deepEqual(result.duplicates, [{ round: '42', count: 2 }])
    assert.deepEqual(result.rejected, [])
  })

  it('rejects a mismatched brRound that would otherwise split the same target round', () => {
    const mismatched = registryUtxo('mismatched', pendingDatum(41, 42))
    const qualified = registryUtxo('qualified', pendingDatum(42, 42))

    const result = selectPendingRegistryCandidates(
      [mismatched, qualified],
      decodeRegistryDatum,
    )

    assert.deepEqual(
      result.selected.map(({ round, utxo }) => [round, utxo.id]),
      [['42', 'qualified']],
    )
    assert.deepEqual(result.duplicates, [])
    assert.deepEqual(
      result.rejected.map(({ utxo, reason }) => [utxo.id, reason]),
      [['mismatched', 'BR_ROUND_TARGET_ROUND_MISMATCH']],
    )
  })

  it('ignores an undecodable Registry output without blocking a valid Pending', () => {
    const malformed = registryUtxo('malformed', null)
    const qualified = registryUtxo('qualified', pendingDatum(42, 42))

    const result = selectPendingRegistryCandidates(
      [malformed, qualified],
      decodeRegistryDatum,
    )

    assert.deepEqual(
      result.selected.map(({ round, utxo }) => [round, utxo.id]),
      [['42', 'qualified']],
    )
    assert.deepEqual(
      result.rejected.map(({ utxo, reason }) => [utxo.id, reason]),
      [['malformed', 'UNDECODABLE_DATUM']],
    )
  })

  it('rejects a structurally decoded but semantically unqualified Pending', () => {
    const mismatched = registryUtxo('unqualified', pendingDatum(7, 8))

    const result = selectPendingRegistryCandidates(
      [mismatched],
      decodeRegistryDatum,
    )

    assert.deepEqual(result.selected, [])
    assert.deepEqual(result.duplicates, [])
    assert.deepEqual(
      result.rejected.map(({ utxo, reason }) => [utxo.id, reason]),
      [['unqualified', 'BR_ROUND_TARGET_ROUND_MISMATCH']],
    )
  })

  it('does not treat Ready outputs as Pending candidates', () => {
    const ready = registryUtxo('ready', pendingDatum(42, 42, 1))
    const qualified = registryUtxo('qualified', pendingDatum(43, 43))

    const result = selectPendingRegistryCandidates(
      [ready, qualified],
      decodeRegistryDatum,
    )

    assert.deepEqual(
      result.selected.map(({ round, utxo }) => [round, utxo.id]),
      [['43', 'qualified']],
    )
    assert.deepEqual(
      result.rejected.map(({ utxo, reason }) => [utxo.id, reason]),
      [['ready', 'NOT_PENDING']],
    )
  })

  it('selects distinct qualified target rounds independently', () => {
    const round42 = registryUtxo('round-42', pendingDatum(42, 42))
    const round43 = registryUtxo('round-43', pendingDatum(43, 43))

    const result = selectPendingRegistryCandidates(
      [round42, round43],
      decodeRegistryDatum,
    )

    assert.deepEqual(
      result.selected.map(({ round, utxo }) => [round, utxo.id]),
      [['42', 'round-42'], ['43', 'round-43']],
    )
    assert.deepEqual(result.duplicates, [])
    assert.deepEqual(result.rejected, [])
  })
})
