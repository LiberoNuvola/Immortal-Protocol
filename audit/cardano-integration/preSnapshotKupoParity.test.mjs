import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyPreSnapshotBlock,
  createPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'
import { comparePreSnapshotKupoState } from './preSnapshotKupoParity.mjs'

const policyIdHex = 'ab'.repeat(28)
const assetNameHex = Buffer.from('PRE').toString('hex')
const asset = { policyIdHex, assetNameHex }
const address = 'addr_test1wzh4pxgnxgd6zf4xkzufdevnd0562sswpv5khd954eahlks0v4609'
const addressHex = '70af509913321ba126a6b0b896e5936be9a5420e0b296bb4b4ae7b7fda'
const origin = { slot: 0, blockNo: 0, hash: '00'.repeat(32) }
const pointOne = { slot: 1, blockNo: 0, hash: '11'.repeat(32) }
const pointTwo = { slot: 2, blockNo: 1, hash: '22'.repeat(32) }
const transactionId = '33'.repeat(32)
const networkId = 'cardano-private-testnet-m1'

function stateAtPoint(quantity = '100', chosenNetwork = networkId) {
  const initial = createPreSnapshotIndex({
    networkId: chosenNetwork,
    asset,
    anchorPoint: origin,
    utxos: []
  })
  return applyPreSnapshotBlock(initial, {
    parentPoint: origin,
    point: pointOne,
    transactions: [{
      id: transactionId,
      spends: 'inputs',
      inputs: [],
      collaterals: [],
      outputs: [{
        addressHex,
        assets: [{ ...asset, quantity }]
      }],
      collateralReturn: null,
      mint: [{ ...asset, quantity }]
    }]
  })
}

function match(quantity = '100') {
  return {
    transaction_index: 0,
    transaction_id: transactionId,
    output_index: 0,
    address,
    value: {
      coins: '2000000',
      assets: { [policyIdHex + '.' + assetNameHex]: quantity }
    },
    datum_hash: null,
    script_hash: null,
    created_at: { slot_no: pointOne.slot, header_hash: pointOne.hash },
    spent_at: null
  }
}

function compare(state = stateAtPoint(), matches = [match()], checkpoint = {
  slot_no: pointOne.slot,
  header_hash: pointOne.hash
}) {
  return comparePreSnapshotKupoState({
    state,
    kupoCheckpoint: checkpoint,
    kupoMatches: matches,
    expectedNetworkId: networkId,
    expectedAsset: asset,
    expectedPoint: pointOne
  })
}

test('exact Kupo unspent outputs at the exact checkpoint match the reducer snapshot', () => {
  const result = compare()
  assert.equal(result.status, 'PASS')
  assert.equal(result.code, 'KUPO_SNAPSHOT_EXACT_MATCH')
  assert.equal(result.canonicalBytesEqual, true)
  assert.equal(result.digestsEqual, true)
  assert.equal(result.reducer.totalQuantity, '100')
  assert.equal(result.kupo.totalQuantity, '100')
})

test('a Kupo checkpoint with another hash or slot is rejected before parsing matches', () => {
  assert.equal(compare(stateAtPoint(), [], {
    slot_no: pointOne.slot,
    header_hash: 'ff'.repeat(32)
  }).code, 'KUPO_CHECKPOINT_NOT_AT_EXPECTED_POINT')
  assert.equal(compare(stateAtPoint(), [], {
    slot_no: pointTwo.slot,
    header_hash: pointTwo.hash
  }).code, 'KUPO_CHECKPOINT_NOT_AT_EXPECTED_POINT')
})

test('a reducer ahead of the target is projected back without mutation', () => {
  const atOne = stateAtPoint()
  const atTwo = applyPreSnapshotBlock(atOne, {
    parentPoint: pointOne,
    point: pointTwo,
    transactions: []
  })
  const result = compare(atTwo)
  assert.equal(result.status, 'PASS')
  assert.equal(result.reducer.utxoCount, 1)
  assert.equal(atTwo.currentPoint.hash, pointTwo.hash)
})

test('a reducer that did not retain the Kupo checkpoint fails closed', () => {
  const laterAnchor = createPreSnapshotIndex({
    networkId,
    asset,
    anchorPoint: pointTwo,
    utxos: []
  })
  assert.equal(compare(laterAnchor).code, 'KUPO_REDUCER_TARGET_POINT_NOT_RETAINED')
})

test('different PRE quantities fail the canonical snapshot comparison', () => {
  const result = compare(stateAtPoint(), [match('99')])
  assert.equal(result.status, 'FAIL')
  assert.equal(result.code, 'KUPO_SNAPSHOT_BYTES_MISMATCH')
  assert.equal(result.canonicalBytesEqual, false)
})

test('duplicate UTxO references in Kupo output are rejected', () => {
  assert.throws(() => compare(stateAtPoint(), [match(), match()]), /KUPO_DUPLICATE_OUTPUT_REFERENCE/)
})

test('spent outputs and outputs created after the target cannot enter the UTxO set', () => {
  const spent = { ...match(), spent_at: { slot_no: 2, header_hash: pointTwo.hash } }
  assert.throws(() => compare(stateAtPoint(), [spent]), /KUPO_QUERY_RETURNED_SPENT_OUTPUT/)
  const future = {
    ...match(),
    created_at: { slot_no: pointTwo.slot, header_hash: pointTwo.hash }
  }
  assert.throws(() => compare(stateAtPoint(), [future]), /KUPO_OUTPUT_CREATED_AFTER_OR_OFF_TARGET/)
})

test('unsafe numeric quantities and missing expected asset values are rejected', () => {
  assert.throws(
    () => compare(stateAtPoint(), [match(Number.MAX_SAFE_INTEGER + 1)]),
    /KUPO_ASSET_QUANTITY_UNSAFE/
  )
  const noAsset = { ...match(), value: { coins: '1', assets: {} } }
  assert.throws(() => compare(stateAtPoint(), [noAsset]), /KUPO_EXPECTED_ASSET_MISSING/)
})

test('network mismatch fails before computing a digest', () => {
  const otherNetwork = stateAtPoint('100', 'another-network')
  const result = compare(otherNetwork, [])
  assert.equal(result.status, 'FAIL')
  assert.equal(result.code, 'KUPO_REDUCER_CONFIGURATION_MISMATCH')
})
