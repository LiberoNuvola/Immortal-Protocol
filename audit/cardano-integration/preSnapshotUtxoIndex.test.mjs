import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyPreSnapshotBlock,
  buildPreSnapshotMessage,
  createPreSnapshotIndex,
  inspectPreSnapshotIndex,
  rollbackPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'

const asset = {
  policyIdHex: 'ab'.repeat(28),
  assetNameHex: Buffer.from('PRE').toString('hex')
}
const otherAsset = {
  policyIdHex: 'cd'.repeat(28),
  assetNameHex: Buffer.from('PRE').toString('hex')
}
const origin = { slot: 0, blockNo: 0, hash: '00'.repeat(32) }
const point = (slot, blockNo, fill) => ({ slot, blockNo, hash: fill.repeat(32) })
const ref = (txId, index = 0) => ({ txId, index })
const output = (addressHex, quantity, unit = asset) => ({
  addressHex,
  assets: quantity === null ? [] : [{ ...unit, quantity: String(quantity) }]
})
const utxo = (txId, index, addressHex, quantity, unit = asset) => ({
  txId,
  index,
  ...output(addressHex, quantity, unit)
})
const tx = ({
  id,
  validity = 'valid',
  inputs = [],
  collaterals = [],
  outputs = [],
  collateralReturn = null,
  mint = []
}) => ({ id, validity, inputs, collaterals, outputs, collateralReturn, mint })
const block = (previous, current, transactions) => ({
  parentPoint: previous,
  point: current,
  transactions
})
const bootstrap = (entries) => createPreSnapshotIndex({
  networkId: 'cardano-private-testnet-m1',
  asset,
  anchorPoint: origin,
  utxos: entries
})

test('bootstrap filters exact policy/name and aggregates balances by raw address', () => {
  const state = bootstrap([
    utxo('01'.repeat(32), 0, '01aa', 20),
    utxo('02'.repeat(32), 0, '01aa', 30),
    utxo('03'.repeat(32), 0, '02bb', 50),
    utxo('04'.repeat(32), 0, '03cc', 900, otherAsset)
  ])
  const snapshot = buildPreSnapshotMessage(state)
  assert.equal(snapshot.message.totalQuantity, '100')
  assert.equal(snapshot.message.leafCount, 2)
  assert.deepEqual(snapshot.leaves, [
    { addressHex: '01aa', quantity: '50' },
    { addressHex: '02bb', quantity: '50' }
  ])
  assert.equal(inspectPreSnapshotIndex(state).utxoCount, 3)
})

test('valid transfer and split outputs preserve total and aggregate same-address UTxOs', () => {
  const initial = bootstrap([utxo('10'.repeat(32), 0, '01aa', 100)])
  const next = point(1, 1, '11')
  const state = applyPreSnapshotBlock(initial, block(origin, next, [
    tx({
      id: '20'.repeat(32),
      inputs: [ref('10'.repeat(32), 0)],
      outputs: [
        output('01aa', 25),
        output('02bb', 30),
        output('02bb', 45)
      ]
    })
  ]))
  const snapshot = buildPreSnapshotMessage(state)
  assert.equal(snapshot.message.totalQuantity, '100')
  assert.equal(snapshot.message.leafCount, 2)
  assert.deepEqual(snapshot.leaves, [
    { addressHex: '01aa', quantity: '25' },
    { addressHex: '02bb', quantity: '75' }
  ])
})

test('valid mint and burn reconcile exactly with UTxO total delta', () => {
  const initial = bootstrap([utxo('30'.repeat(32), 0, '01aa', 100)])
  const mintedPoint = point(1, 1, '31')
  const minted = applyPreSnapshotBlock(initial, block(origin, mintedPoint, [
    tx({
      id: '32'.repeat(32),
      inputs: [ref('30'.repeat(32), 0)],
      outputs: [output('01aa', 105)],
      mint: [{ ...asset, quantity: '5' }]
    })
  ]))
  assert.equal(inspectPreSnapshotIndex(minted).totalQuantity, '105')

  const burnedPoint = point(2, 2, '33')
  const burned = applyPreSnapshotBlock(minted, block(mintedPoint, burnedPoint, [
    tx({
      id: '34'.repeat(32),
      inputs: [ref('32'.repeat(32), 0)],
      outputs: [output('01aa', 100)],
      mint: [{ ...asset, quantity: '-5' }]
    })
  ]))
  assert.equal(inspectPreSnapshotIndex(burned).totalQuantity, '100')
})

test('phase-2-invalid transaction consumes collateral only and creates collateral return', () => {
  const initial = bootstrap([
    utxo('40'.repeat(32), 0, '01aa', 100),
    utxo('41'.repeat(32), 0, '02bb', 40)
  ])
  const next = point(1, 1, '42')
  const state = applyPreSnapshotBlock(initial, block(origin, next, [
    tx({
      id: '43'.repeat(32),
      validity: 'invalid',
      inputs: [ref('40'.repeat(32), 0)],
      collaterals: [ref('41'.repeat(32), 0)],
      outputs: [output('03cc', 777)],
      collateralReturn: output('04dd', 40)
    })
  ]))
  const indexed = inspectPreSnapshotIndex(state)
  assert.equal(indexed.totalQuantity, '140')
  assert.deepEqual(indexed.entries, [
    { key: '4040404040404040404040404040404040404040404040404040404040404040#0', addressHex: '01aa', quantity: '100' },
    { key: '4343434343434343434343434343434343434343434343434343434343434343#1', addressHex: '04dd', quantity: '40' }
  ])
})

test('within-block chained transactions rollback without resurrecting transient UTxOs', () => {
  const initial = bootstrap([utxo('50'.repeat(32), 0, '01aa', 100)])
  const next = point(1, 1, '51')
  const chained = applyPreSnapshotBlock(initial, block(origin, next, [
    tx({
      id: '52'.repeat(32),
      inputs: [ref('50'.repeat(32), 0)],
      outputs: [output('02bb', 100)]
    }),
    tx({
      id: '53'.repeat(32),
      inputs: [ref('52'.repeat(32), 0)],
      outputs: [output('03cc', 100)]
    })
  ]))
  assert.equal(inspectPreSnapshotIndex(chained).totalQuantity, '100')
  const rolledBack = rollbackPreSnapshotIndex(chained, origin)
  assert.deepEqual(inspectPreSnapshotIndex(rolledBack), inspectPreSnapshotIndex(initial))
})

test('rollback and alternative fork match a clean replay of the selected branch', () => {
  const initial = bootstrap([utxo('60'.repeat(32), 0, '01aa', 100)])
  const p1 = point(1, 1, '61')
  const p2a = point(2, 2, '62')
  const p2b = point(3, 2, '63')

  const after1 = applyPreSnapshotBlock(initial, block(origin, p1, [
    tx({
      id: '64'.repeat(32),
      inputs: [ref('60'.repeat(32), 0)],
      outputs: [output('02bb', 100)]
    })
  ]))
  const branchA = applyPreSnapshotBlock(after1, block(p1, p2a, [
    tx({
      id: '65'.repeat(32),
      inputs: [ref('64'.repeat(32), 0)],
      outputs: [output('03cc', 100)]
    })
  ]))
  const rolledBack = rollbackPreSnapshotIndex(branchA, p1)
  const branchB = applyPreSnapshotBlock(rolledBack, block(p1, p2b, [
    tx({
      id: '66'.repeat(32),
      inputs: [ref('64'.repeat(32), 0)],
      outputs: [output('04dd', 100)]
    })
  ]))
  const cleanReplay = applyPreSnapshotBlock(after1, block(p1, p2b, [
    tx({
      id: '66'.repeat(32),
      inputs: [ref('64'.repeat(32), 0)],
      outputs: [output('04dd', 100)]
    })
  ]))
  assert.deepEqual(inspectPreSnapshotIndex(branchB), inspectPreSnapshotIndex(cleanReplay))
  assert.notEqual(buildPreSnapshotMessage(branchA).digestHex, buildPreSnapshotMessage(branchB).digestHex)
})

test('a mismatch in mint conservation fails atomically', () => {
  const initial = bootstrap([utxo('70'.repeat(32), 0, '01aa', 100)])
  const next = point(1, 1, '71')
  assert.throws(() => applyPreSnapshotBlock(initial, block(origin, next, [
    tx({
      id: '72'.repeat(32),
      inputs: [ref('70'.repeat(32), 0)],
      outputs: [output('02bb', 99)]
    })
  ])), /BLOCK_ASSET_CONSERVATION_MISMATCH/)
  assert.equal(inspectPreSnapshotIndex(initial).totalQuantity, '100')
  assert.equal(initial.currentPoint.hash, origin.hash)
})

test('duplicate block inputs and duplicate bootstrap UTxOs fail closed', () => {
  const initial = bootstrap([utxo('80'.repeat(32), 0, '01aa', 100)])
  const next = point(1, 1, '81')
  assert.throws(() => applyPreSnapshotBlock(initial, block(origin, next, [
    tx({ id: '82'.repeat(32), inputs: [ref('80'.repeat(32), 0)], outputs: [] }),
    tx({ id: '83'.repeat(32), inputs: [ref('80'.repeat(32), 0)], outputs: [] })
  ])), /DUPLICATE_CONSUMED_INPUT/)
  assert.throws(() => bootstrap([
    utxo('84'.repeat(32), 0, '01aa', 1),
    utxo('84'.repeat(32), 0, '02bb', 2)
  ]), /DUPLICATE_BOOTSTRAP_UTXO/)
})

test('unknown validity, wrong parent, unknown rollback point and malformed asset fail closed', () => {
  const initial = bootstrap([utxo('90'.repeat(32), 0, '01aa', 100)])
  const next = point(1, 1, '91')
  assert.throws(() => applyPreSnapshotBlock(initial, block(origin, next, [
    tx({ id: '92'.repeat(32), validity: undefined, outputs: [] })
  ])), /UNKNOWN_TRANSACTION_VALIDITY/)
  assert.throws(() => applyPreSnapshotBlock(initial, block(point(0, 0, '93'), next, [])), /BLOCK_PARENT_MISMATCH/)
  assert.throws(() => rollbackPreSnapshotIndex(initial, point(9, 9, '94')), /ROLLBACK_POINT_NOT_RETAINED/)
  assert.throws(() => applyPreSnapshotBlock(initial, block(origin, point(2, 2, '96'), [])), /BLOCK_SEQUENCE_MISMATCH/)
  assert.throws(() => bootstrap([{
    txId: '95'.repeat(32),
    index: 0,
    addressHex: 'zz',
    assets: [{ ...asset, quantity: '100' }]
  }]), /INVALID_HEX/)
})

test('index state and exported UTxO rows are immutable', () => {
  const state = bootstrap([utxo('97'.repeat(32), 0, '01aa', 100)])
  assert.equal(Object.isFrozen(state), true)
  assert.equal(Object.isFrozen(state.utxos), true)
  assert.equal(Array.isArray(state.utxos), true)
  assert.equal(Object.isFrozen(state.utxos[0]), true)
  assert.throws(() => state.utxos.push({}), TypeError)
})

test('snapshot bytes and digest are deterministic for the same point and balances', () => {
  const first = bootstrap([
    utxo('a0'.repeat(32), 0, '02bb', 25),
    utxo('a1'.repeat(32), 0, '01aa', 75)
  ])
  const second = bootstrap([
    utxo('a1'.repeat(32), 0, '01aa', 75),
    utxo('a0'.repeat(32), 0, '02bb', 25)
  ])
  const a = buildPreSnapshotMessage(first)
  const b = buildPreSnapshotMessage(second)
  assert.equal(a.digestHex, b.digestHex)
  assert.deepEqual(a.canonicalBytes, b.canonicalBytes)
})
