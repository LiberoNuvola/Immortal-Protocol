import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import {
  canonicalizeDirectUsdmBasket,
  parseExactPoolOutputReference,
  selectExactPoolOutput,
  verifyDirectUsdmBasket,
} from './preprod-direct-usdm-basket-contract.mjs'

const poolPolicy = 'a'.repeat(56)
const poolUnit = poolPolicy + '504f4f4c'
const tusdmUnit = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'
const foreignUnit = 'b'.repeat(56) + '01'
const poolRef = 'ab'.repeat(32) + '#0'

function koiosAsset(unit, quantity) {
  return {
    policy_id: unit.slice(0, 56),
    asset_name: unit.slice(56),
    quantity: String(quantity),
  }
}

function fixture(overrides = {}) {
  return {
    poolOutputReference: poolRef,
    poolAddress: 'addr_test1_b1_pool_fixture',
    poolTokenUnit: poolUnit,
    approvedTusdmUnit: tusdmUnit,
    lovelace: '5000000',
    assetList: [
      koiosAsset(tusdmUnit, 1_000_000),
      koiosAsset(poolUnit, 1),
    ],
    ...overrides,
  }
}

test('EV3 contract accepts ADA + exact Pool singleton + positive approved tUSDM', () => {
  const basket = canonicalizeDirectUsdmBasket(fixture())
  assert.deepEqual(basket.positiveAssets, [
    { unit: poolUnit, quantity: '1' },
    { unit: tusdmUnit, quantity: '1000000' },
  ])
  assert.equal(basket.poolOutputReference, poolRef)
  assert.equal(basket.lovelaceQuantity, '5000000')
  assert.match(basket.basketDigest, /^[0-9a-f]{64}$/)
  assert.equal(verifyDirectUsdmBasket(basket), true)
})

test('EV3 contract rejects any additional positive native asset', () => {
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [...fixture().assetList, koiosAsset(foreignUnit, 1)],
    })),
    /Unqualified positive native asset/,
  )
})

test('EV3 contract rejects absent or zero approved tUSDM', () => {
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [koiosAsset(poolUnit, 1)],
    })),
    /Approved physical tUSDM/,
  )
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [koiosAsset(poolUnit, 1), koiosAsset(tusdmUnit, 0)],
    })),
    /Approved physical tUSDM/,
  )
})

test('EV3 contract requires exact Pool singleton quantity one', () => {
  for (const quantity of [0, 2]) {
    assert.throws(
      () => canonicalizeDirectUsdmBasket(fixture({
        assetList: [koiosAsset(poolUnit, quantity), koiosAsset(tusdmUnit, 1)],
      })),
      /Pool singleton/,
    )
  }
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [koiosAsset(tusdmUnit, 1)],
    })),
    /Pool singleton/,
  )
})

test('EV3 contract rejects malformed, negative, duplicate and oversized asset records', () => {
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [{ ...koiosAsset(poolUnit, 1), quantity: '-1' }, koiosAsset(tusdmUnit, 1)],
    })),
    /must not be negative/,
  )
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [koiosAsset(poolUnit, 1), koiosAsset(poolUnit, 1), koiosAsset(tusdmUnit, 1)],
    })),
    /Duplicate Koios asset unit/,
  )
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [{ policy_id: 'z'.repeat(56), asset_name: '', quantity: '1' }, koiosAsset(tusdmUnit, 1)],
    })),
    /invalid policy id/,
  )
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [{ policy_id: poolPolicy, asset_name: '0', quantity: '1' }, koiosAsset(tusdmUnit, 1)],
    })),
    /invalid asset name/,
  )
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [{ policy_id: poolPolicy, asset_name: 'aa'.repeat(33), quantity: '1' }, koiosAsset(tusdmUnit, 1)],
    })),
    /invalid asset name/,
  )
  assert.throws(
    () => canonicalizeDirectUsdmBasket(fixture({
      assetList: [{ ...koiosAsset(poolUnit, 1), quantity: '1.5' }, koiosAsset(tusdmUnit, 1)],
    })),
    /integer quantity/,
  )
})

test('EV3 contract canonicalizes asset order and commits quantity changes', () => {
  const first = canonicalizeDirectUsdmBasket(fixture())
  const reordered = canonicalizeDirectUsdmBasket(fixture({
    assetList: [...fixture().assetList].reverse(),
  }))
  const changed = canonicalizeDirectUsdmBasket(fixture({
    assetList: [koiosAsset(poolUnit, 1), koiosAsset(tusdmUnit, 1_000_001)],
  }))
  assert.equal(first.basketDigest, reordered.basketDigest)
  assert.notEqual(first.basketDigest, changed.basketDigest)
})

test('EV3 basket digest rejects altered evidence', () => {
  const basket = canonicalizeDirectUsdmBasket(fixture())
  assert.equal(verifyDirectUsdmBasket({ ...basket, lovelaceQuantity: '5000001' }), false)
  assert.equal(verifyDirectUsdmBasket({ ...basket, basketDigest: '0'.repeat(64) }), false)
})

test('EV3 basket verifier rejects a self-digested foreign positive asset', () => {
  const basket = canonicalizeDirectUsdmBasket(fixture())
  const forged = {
    ...basket,
    positiveAssets: [
      ...basket.positiveAssets,
      { unit: foreignUnit, quantity: '1' },
    ],
  }
  const payload = { ...forged }
  delete payload.basketDigest
  forged.basketDigest = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
  assert.equal(verifyDirectUsdmBasket(forged), false)
})

test('exact Pool output reference is parsed canonically and must occur exactly once', () => {
  assert.deepEqual(parseExactPoolOutputReference(poolRef.toUpperCase()), {
    canonical: poolRef,
    txHash: 'ab'.repeat(32),
    outputIndex: 0,
  })
  const live = { tx_hash: 'ab'.repeat(32), tx_index: 0, value: '5000000' }
  assert.equal(selectExactPoolOutput([live], poolRef), live)
  assert.throws(
    () => selectExactPoolOutput([live, { ...live }], poolRef),
    /must match exactly once/,
  )
  assert.throws(
    () => selectExactPoolOutput([], poolRef),
    /must match exactly once/,
  )
  assert.throws(
    () => parseExactPoolOutputReference('not-an-out-reference'),
    /exact txHash/,
  )
})
