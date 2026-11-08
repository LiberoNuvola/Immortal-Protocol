import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyPreSnapshotBlock,
  createPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'
import { comparePreSnapshotReplicaStates } from './preSnapshotReplicaConformance.mjs'

const asset = {
  policyIdHex: 'ab'.repeat(28),
  assetNameHex: Buffer.from('PRE').toString('hex')
}
const origin = { slot: 0, blockNo: 0, hash: '00'.repeat(32) }
const pointOne = { slot: 1, blockNo: 0, hash: '11'.repeat(32) }
const pointOneFork = { slot: 1, blockNo: 0, hash: '22'.repeat(32) }
const pointTwo = { slot: 2, blockNo: 1, hash: '33'.repeat(32) }

const utxo = (txId, addressHex, quantity) => ({
  txId,
  index: 0,
  addressHex,
  assets: [{ ...asset, quantity: String(quantity) }]
})
const output = (addressHex, quantity) => ({
  addressHex,
  assets: [{ ...asset, quantity: String(quantity) }]
})
function createState(entries, networkId = 'cardano-m1-two-node-test') {
  return createPreSnapshotIndex({
    networkId,
    asset,
    anchorPoint: origin,
    utxos: entries
  })
}
function advance(state, point, txId, addressHex, quantity) {
  return applyPreSnapshotBlock(state, {
    parentPoint: state.currentPoint,
    point,
    transactions: [{
      id: txId,
      spends: 'inputs',
      inputs: [],
      collaterals: [],
      outputs: [output(addressHex, quantity)],
      collateralReturn: null,
      mint: [{ ...asset, quantity: String(quantity) }]
    }]
  })
}
function compare(stateA, stateB, point = pointOne, assetOverride = asset) {
  return comparePreSnapshotReplicaStates({
    replicaA: { id: 'node-a-index', state: stateA },
    replicaB: { id: 'node-b-index', state: stateB },
    expectedNetworkId: 'cardano-m1-two-node-test',
    expectedAsset: assetOverride,
    expectedPoint: point
  })
}
const baseState = () => createState([utxo('10'.repeat(32), '01aa', 100)])
const txId = '20'.repeat(32)

test('two replicas at the externally fixed point pass only on byte-identical snapshots', () => {
  const stateA = advance(baseState(), pointOne, txId, '02bb', 100)
  const stateB = advance(baseState(), pointOne, txId, '02bb', 100)
  const result = compare(stateA, stateB)
  assert.equal(result.status, 'PASS')
  assert.equal(result.code, 'REPLICA_SNAPSHOT_EXACT_MATCH')
  assert.equal(result.canonicalBytesEqual, true)
  assert.equal(result.digestsEqual, true)
  assert.equal(result.replicaA.digestHex, result.replicaB.digestHex)
})

test('a replica that has not reached the target remains WAITING, not PASS', () => {
  const stateA = advance(baseState(), pointOne, txId, '02bb', 100)
  const stateB = baseState()
  const result = compare(stateA, stateB)
  assert.equal(result.status, 'WAITING')
  assert.equal(result.code, 'REPLICAS_NOT_AT_EXPECTED_POINT')
})

test('different hashes at the same height fail as chain-selection divergence', () => {
  const stateA = advance(baseState(), pointOne, txId, '02bb', 100)
  const stateB = advance(baseState(), pointOneFork, txId, '02bb', 100)
  const result = compare(stateA, stateB)
  assert.equal(result.status, 'FAIL')
  assert.equal(result.code, 'REPLICA_CHAIN_SELECTION_DIVERGENCE')
})

test('same point but different PRE balances fail byte-for-byte comparison', () => {
  const stateA = advance(baseState(), pointOne, txId, '02bb', 100)
  const stateB = advance(createState([utxo('30'.repeat(32), '01aa', 90)]), pointOne, txId, '02bb', 100)
  const result = compare(stateA, stateB)
  assert.equal(result.status, 'FAIL')
  assert.equal(result.code, 'REPLICA_SNAPSHOT_BYTES_MISMATCH')
  assert.equal(result.canonicalBytesEqual, false)
  assert.equal(result.digestsEqual, false)
})

test('network or exact policy/name mismatch fails closed', () => {
  const stateA = advance(baseState(), pointOne, txId, '02bb', 100)
  const stateWrongNetwork = advance(
    createState([utxo('10'.repeat(32), '01aa', 100)], 'another-network'),
    pointOne,
    txId,
    '02bb',
    100
  )
  assert.equal(compare(stateA, stateWrongNetwork).code, 'REPLICA_CONFIGURATION_MISMATCH')
  const wrongAsset = { ...asset, assetNameHex: Buffer.from('OTHER').toString('hex') }
  assert.equal(compare(stateA, advance(baseState(), pointOne, txId, '02bb', 100), pointOne, wrongAsset).code,
    'REPLICA_CONFIGURATION_MISMATCH')
})

test('duplicate replica labels and missing target points are rejected as configuration errors', () => {
  const state = advance(baseState(), pointOne, txId, '02bb', 100)
  assert.throws(() => comparePreSnapshotReplicaStates({
    replicaA: { id: 'same', state },
    replicaB: { id: 'same', state },
    expectedNetworkId: 'cardano-m1-two-node-test',
    expectedAsset: asset,
    expectedPoint: pointOne
  }), /PRE_SNAPSHOT_REPLICA_IDS_NOT_DISTINCT/)
  assert.throws(() => comparePreSnapshotReplicaStates({
    replicaA: { id: 'a', state },
    replicaB: { id: 'b', state },
    expectedNetworkId: 'cardano-m1-two-node-test',
    expectedAsset: asset
  }), /PRE_SNAPSHOT_EXPECTED_POINT_INVALID/)
})

test('comparison never mutates or rolls back either replica', () => {
  const atPointOne = advance(baseState(), pointOne, txId, '02bb', 100)
  const stateA = applyPreSnapshotBlock(atPointOne, {
    parentPoint: pointOne,
    point: pointTwo,
    transactions: []
  })
  const stateB = advance(baseState(), pointOne, txId, '02bb', 100)
  const beforeA = stateA.currentPoint
  const beforeB = stateB.currentPoint
  const result = compare(stateA, stateB)
  assert.equal(result.status, 'WAITING')
  assert.equal(stateA.currentPoint, beforeA)
  assert.equal(stateB.currentPoint, beforeB)
})
