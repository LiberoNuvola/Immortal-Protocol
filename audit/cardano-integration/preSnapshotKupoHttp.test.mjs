import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyPreSnapshotBlock,
  createPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'
import {
  comparePreSnapshotKupoEndpoint,
  queryKupoExactPoint,
  validateLocalKupoBaseUrl
} from './preSnapshotKupoHttp.mjs'

const policyIdHex = 'ab'.repeat(28)
const assetNameHex = Buffer.from('PRE').toString('hex')
const asset = { policyIdHex, assetNameHex }
const address = 'addr_test1wzh4pxgnxgd6zf4xkzufdevnd0562sswpv5khd954eahlks0v4609'
const addressHex = '70af509913321ba126a6b0b896e5936be9a5420e0b296bb4b4ae7b7fda'
const origin = { slot: 0, blockNo: 0, hash: '00'.repeat(32) }
const target = { slot: 1, blockNo: 0, hash: '11'.repeat(32) }
const txId = '33'.repeat(32)
const networkId = 'cardano-m1-kupo-http-test'
const checkpoint = { slot_no: target.slot, header_hash: target.hash }
const match = {
  transaction_index: 0,
  transaction_id: txId,
  output_index: 0,
  address,
  value: { coins: '2000000', assets: { [policyIdHex + '.' + assetNameHex]: '100' } },
  datum_hash: null,
  script_hash: null,
  created_at: { slot_no: target.slot, header_hash: target.hash },
  spent_at: null
}
const baseUrl = 'http://127.0.0.1:1442'

function reducerState() {
  const initial = createPreSnapshotIndex({
    networkId,
    asset,
    anchorPoint: origin,
    utxos: []
  })
  return applyPreSnapshotBlock(initial, {
    parentPoint: origin,
    point: target,
    transactions: [{
      id: txId,
      spends: 'inputs',
      inputs: [],
      collaterals: [],
      outputs: [{
        addressHex,
        assets: [{ ...asset, quantity: '100' }]
      }],
      collateralReturn: null,
      mint: [{ ...asset, quantity: '100' }]
    }]
  })
}

function response(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return value }
  }
}

function fakeFetch(values, captured = []) {
  const queue = [...values]
  const fetchImpl = async (url, options) => {
    captured.push({ url: String(url), options })
    if (queue.length === 0) throw new Error('unexpected fetch call')
    return queue.shift()
  }
  return { fetchImpl, captured }
}

test('local Kupo HTTP client requests strict checkpoint and exact-asset unspent matches', async () => {
  const captured = []
  const fake = fakeFetch([
    response(checkpoint),
    response([match])
  ], captured)
  const result = await comparePreSnapshotKupoEndpoint({
    state: reducerState(),
    baseUrl,
    expectedNetworkId: networkId,
    expectedAsset: asset,
    expectedPoint: target,
    fetchImpl: fake.fetchImpl
  })
  assert.equal(result.status, 'PASS')
  assert.equal(result.code, 'KUPO_SNAPSHOT_EXACT_MATCH')
  assert.equal(result.matchCount, 1)
  assert.equal(captured.length, 2)
  assert.equal(captured[0].url, baseUrl + '/checkpoints/1?strict')
  assert.equal(captured[1].url, baseUrl + '/matches/' + policyIdHex + '.' + assetNameHex + '?unspent')
  assert.equal(captured[1].options.headers.Accept, 'application/json;asset-quantity=string')
  assert.equal(captured[0].options.redirect, 'error')
})

test('remote, HTTPS, credential-bearing and path-prefixed endpoints are rejected', () => {
  assert.equal(validateLocalKupoBaseUrl('http://localhost:1442'), 'http://localhost:1442')
  assert.throws(() => validateLocalKupoBaseUrl('https://127.0.0.1:1442'), /KUPO_HTTP_ENDPOINT_MUST_BE_LOCAL_LOOPBACK/)
  assert.throws(() => validateLocalKupoBaseUrl('http://example.com:1442'), /KUPO_HTTP_ENDPOINT_MUST_BE_LOCAL_LOOPBACK/)
  assert.throws(() => validateLocalKupoBaseUrl('http://user:pass@127.0.0.1:1442'), /KUPO_HTTP_ENDPOINT_MUST_BE_LOCAL_LOOPBACK/)
  assert.throws(() => validateLocalKupoBaseUrl('http://127.0.0.1:1442/api'), /KUPO_HTTP_ENDPOINT_MUST_BE_LOCAL_LOOPBACK/)
})

test('a missing strict checkpoint is reported as a point mismatch, never an ancestor match', async () => {
  const fake = fakeFetch([response(null), response([])])
  const result = await comparePreSnapshotKupoEndpoint({
    state: reducerState(),
    baseUrl,
    expectedNetworkId: networkId,
    expectedAsset: asset,
    expectedPoint: target,
    fetchImpl: fake.fetchImpl
  })
  assert.equal(result.status, 'FAIL')
  assert.equal(result.code, 'KUPO_CHECKPOINT_NOT_AT_EXPECTED_POINT')
})

test('an HTTP error from the checkpoint endpoint fails closed', async () => {
  const fake = fakeFetch([response({ error: 'not ready' }, 503)])
  await assert.rejects(
    queryKupoExactPoint({
      baseUrl,
      expectedPoint: target,
      expectedAsset: asset,
      fetchImpl: fake.fetchImpl
    }),
    /KUPO_HTTP_STATUS:checkpoint:503/
  )
})

test('a malformed matches payload is rejected instead of being treated as empty', async () => {
  const fake = fakeFetch([response(checkpoint), response({ items: [match] })])
  await assert.rejects(
    queryKupoExactPoint({
      baseUrl,
      expectedPoint: target,
      expectedAsset: asset,
      fetchImpl: fake.fetchImpl
    }),
    /KUPO_MATCHES_RESPONSE_NOT_ARRAY/
  )
})

test('a Kupo endpoint with different PRE balances returns a mismatch report', async () => {
  const wrong = {
    ...match,
    value: { coins: '2000000', assets: { [policyIdHex + '.' + assetNameHex]: '99' } }
  }
  const fake = fakeFetch([response(checkpoint), response([wrong])])
  const result = await comparePreSnapshotKupoEndpoint({
    state: reducerState(),
    baseUrl,
    expectedNetworkId: networkId,
    expectedAsset: asset,
    expectedPoint: target,
    fetchImpl: fake.fetchImpl
  })
  assert.equal(result.status, 'FAIL')
  assert.equal(result.code, 'KUPO_SNAPSHOT_BYTES_MISMATCH')
})

test('empty asset names query the policy wildcard and comparator filters non-empty names', async () => {
  const emptyNameAsset = { policyIdHex, assetNameHex: '' }
  const captured = []
  const fake = fakeFetch([response(checkpoint), response([])], captured)
  await queryKupoExactPoint({
    baseUrl,
    expectedPoint: target,
    expectedAsset: emptyNameAsset,
    fetchImpl: fake.fetchImpl
  })
  assert.equal(captured[1].url, baseUrl + '/matches/' + policyIdHex + '.*?unspent')
})
