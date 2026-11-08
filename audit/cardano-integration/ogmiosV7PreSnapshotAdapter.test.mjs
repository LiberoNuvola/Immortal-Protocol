import test from 'node:test'
import assert from 'node:assert/strict'

import {
  decodeOgmiosAddress,
  decodeOgmiosV7Block,
  decodeOgmiosV7ChainSyncResult,
  getOgmiosV7IntersectionPoints,
  resolveOgmiosV7RollbackPoint
} from './ogmiosV7PreSnapshotAdapter.mjs'
import {
  PRE_SNAPSHOT_ORIGIN_POINT,
  applyPreSnapshotBlock,
  createPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'
import { parseOgmiosV7Json } from './ogmiosV7ChainSyncClient.mjs'

const address = 'addr_test1wzh4pxgnxgd6zf4xkzufdevnd0562sswpv5khd954eahlks0v4609'
const addressHex = '70af509913321ba126a6b0b896e5936be9a5420e0b296bb4b4ae7b7fda'
const policyIdHex = 'ab'.repeat(28)
const assetNameHex = Buffer.from('PRE').toString('hex')
const parent = { slot: 100, blockNo: 11, hash: '10'.repeat(32) }
const point = { slot: 101, blockNo: 12, hash: '11'.repeat(32) }
const output = (quantity, addr = address) => ({
  address: addr,
  value: {
    ada: { lovelace: 3000000n },
    [policyIdHex]: { [assetNameHex]: BigInt(quantity) }
  }
})
const reference = (txId, index) => ({
  transaction: { id: txId },
  index
})
const baseBlock = transactions => ({
  type: 'praos',
  era: 'conway',
  id: point.hash,
  ancestor: parent.hash,
  height: point.blockNo,
  slot: point.slot,
  transactions
})

test('Ogmios Shelley address decodes to the exact raw Cardano bytes', () => {
  assert.equal(decodeOgmiosAddress(address), addressHex)
})

test('Ogmios v7 block normalizes Praos header, input references, value assets and mint', () => {
  const txId = '20'.repeat(32)
  const normalized = decodeOgmiosV7Block(baseBlock([{
    id: txId,
    spends: 'inputs',
    inputs: [reference('21'.repeat(32), 3)],
    collaterals: [],
    outputs: [output(12)],
    mint: { [policyIdHex]: { [assetNameHex]: 12n } },
    signatories: []
  }]), parent)

  assert.deepEqual(normalized.parentPoint, parent)
  assert.deepEqual(normalized.point, point)
  assert.deepEqual(normalized.transactions[0], {
    id: txId,
    spends: 'inputs',
    inputs: [{ txId: '21'.repeat(32), index: '3' }],
    collaterals: [],
    outputs: [{
      addressHex,
      assets: [{ policyIdHex, assetNameHex, quantity: '12' }]
    }],
    collateralReturn: null,
    mint: [{ policyIdHex, assetNameHex, quantity: '12' }]
  })
})

test('Ogmios v7 spends=collaterals uses collaterals and collateralReturn', () => {
  const txId = '30'.repeat(32)
  const normalized = decodeOgmiosV7Block(baseBlock([{
    id: txId,
    spends: 'collaterals',
    inputs: [reference('31'.repeat(32), 0)],
    collaterals: [reference('32'.repeat(32), 1)],
    outputs: [output(900)],
    collateralReturn: output(7),
    signatories: []
  }]), parent)
  const tx = normalized.transactions[0]

  assert.equal(tx.spends, 'collaterals')
  assert.deepEqual(tx.inputs, [{ txId: '31'.repeat(32), index: '0' }])
  assert.deepEqual(tx.collaterals, [{ txId: '32'.repeat(32), index: '1' }])
  assert.equal(tx.outputs.length, 1)
  assert.equal(tx.outputs[0].assets[0].quantity, '900')
  assert.equal(tx.collateralReturn.assets[0].quantity, '7')
  assert.deepEqual(tx.mint, [])
})

test('Ogmios optional empty transactions, outputs and mint are normalized safely', () => {
  const emptyBlock = {
    ...baseBlock([]),
    transactions: undefined
  }
  delete emptyBlock.transactions
  const normalized = decodeOgmiosV7Block(emptyBlock, parent)
  assert.deepEqual(normalized.transactions, [])

  const emptyTx = decodeOgmiosV7Block(baseBlock([{
    id: '40'.repeat(32),
    spends: 'inputs',
    inputs: [],
    signatories: []
  }]), parent)
  assert.deepEqual(emptyTx.transactions[0].outputs, [])
  assert.deepEqual(emptyTx.transactions[0].mint, [])
})

test('unknown spends, missing collateral set, wrong era and parent mismatch fail closed', () => {
  assert.throws(() => decodeOgmiosV7Block(baseBlock([{
    id: '50'.repeat(32),
    inputs: [],
    signatories: []
  }]), parent), /OGMIOS_UNKNOWN_SPENDS/)
  assert.throws(() => decodeOgmiosV7Block(baseBlock([{
    id: '51'.repeat(32),
    spends: 'collaterals',
    inputs: [],
    signatories: []
  }]), parent), /OGMIOS_MISSING_COLLATERALS/)
  assert.throws(() => decodeOgmiosV7Block({
    ...baseBlock([]),
    era: 'dijkstra'
  }, parent), /OGMIOS_UNSUPPORTED_ERA/)
  assert.throws(() => decodeOgmiosV7Block({
    ...baseBlock([]),
    ancestor: '99'.repeat(32)
  }, parent), /OGMIOS_BLOCK_ANCESTOR_MISMATCH/)
  assert.throws(() => decodeOgmiosV7Block({
    ...baseBlock([]),
    id: 'not-a-block-hash'
  }, parent), /OGMIOS_INVALID_HEX/)
})

test('missing mint and value asset fields remain different from explicit zero quantity', () => {
  assert.throws(() => decodeOgmiosV7Block(baseBlock([{
    id: '60'.repeat(32),
    spends: 'inputs',
    inputs: [],
    outputs: [{
      address,
      value: { ada: { lovelace: 1000000n }, [policyIdHex]: { [assetNameHex]: 0n } }
    }],
    signatories: []
  }]), parent), /OGMIOS_ZERO_ASSET_QUANTITY/)
})

test('BigInt-safe Ogmios JSON parser preserves quantities above JavaScript safe integer', () => {
  const huge = '9007199254740993'
  const parsed = parseOgmiosV7Json('{"value":{"ada":{"lovelace":1},"' +
    policyIdHex + '":{"' + assetNameHex + '":' + huge + '}}}')
  assert.equal(typeof parsed.value[policyIdHex][assetNameHex], 'bigint')
  assert.equal(parsed.value[policyIdHex][assetNameHex].toString(), huge)
})

test('rollback point maps slot/id to retained block number and current point deduplicates', () => {
  const state = createPreSnapshotIndex({
    networkId: 'cardano-private-testnet-m1',
    asset: { policyIdHex, assetNameHex },
    anchorPoint: PRE_SNAPSHOT_ORIGIN_POINT,
    utxos: []
  })
  const blockOne = decodeOgmiosV7Block({
    type: 'praos',
    era: 'conway',
    id: '70'.repeat(32),
    ancestor: 'genesis',
    height: 0,
    slot: 1,
    transactions: []
  }, state.currentPoint)
  const after = applyPreSnapshotBlock(state, blockOne)
  const target = resolveOgmiosV7RollbackPoint({
    slot: 1,
    id: '70'.repeat(32)
  }, after)
  assert.deepEqual(target, after.currentPoint)
  assert.deepEqual(getOgmiosV7IntersectionPoints(after), [
    { slot: 1, id: '70'.repeat(32) },
    'origin'
  ])
})

test('rollback to Ogmios origin resolves only when the index is anchored at origin', () => {
  const state = createPreSnapshotIndex({
    networkId: 'cardano-private-testnet-m1',
    asset: { policyIdHex, assetNameHex },
    anchorPoint: PRE_SNAPSHOT_ORIGIN_POINT,
    utxos: []
  })
  assert.deepEqual(resolveOgmiosV7RollbackPoint('origin', state), PRE_SNAPSHOT_ORIGIN_POINT)

  const nonOrigin = createPreSnapshotIndex({
    networkId: 'cardano-private-testnet-m1',
    asset: { policyIdHex, assetNameHex },
    anchorPoint: parent,
    utxos: []
  })
  assert.throws(() => resolveOgmiosV7RollbackPoint('origin', nonOrigin), /OGMIOS_ROLLBACK_BEFORE_BOOTSTRAP_ANCHOR/)
})

test('chain-sync response decoder handles forward and backward result envelopes', () => {
  const originState = createPreSnapshotIndex({
    networkId: 'cardano-private-testnet-m1',
    asset: { policyIdHex, assetNameHex },
    anchorPoint: PRE_SNAPSHOT_ORIGIN_POINT,
    utxos: []
  })
  const forward = decodeOgmiosV7ChainSyncResult({
    direction: 'forward',
    tip: 'origin',
    block: {
      type: 'praos',
      era: 'conway',
      id: '80'.repeat(32),
      ancestor: 'genesis',
      height: 0,
      slot: 1,
      transactions: []
    }
  }, originState)
  assert.equal(forward.direction, 'forward')
  assert.equal(forward.block.point.hash, '80'.repeat(32))

  const after = applyPreSnapshotBlock(originState, forward.block)
  const backward = decodeOgmiosV7ChainSyncResult({
    direction: 'backward',
    tip: 'origin',
    point: 'origin'
  }, after)
  assert.equal(backward.direction, 'backward')
  assert.deepEqual(backward.point, PRE_SNAPSHOT_ORIGIN_POINT)
})
