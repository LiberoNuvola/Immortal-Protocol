import test from 'node:test'
import assert from 'node:assert/strict'

import { bootstrapPreSnapshotFromWholeUtxo } from './preSnapshotWholeUtxoBootstrap.mjs'

const policyIdHex = 'ab'.repeat(28)
const assetNameHex = Buffer.from('PRE').toString('hex')
const address = 'addr_test1wzh4pxgnxgd6zf4xkzufdevnd0562sswpv5khd954eahlks0v4609'
const addressHex = '70af509913321ba126a6b0b896e5936be9a5420e0b296bb4b4ae7b7fda'
const point = { slot: 123456, blockNo: 987, hash: '11'.repeat(32), source: 'ogmios-v7-chainsync-tip' }
const asset = { policyIdHex, assetNameHex }

function output(txId, index, quantity, extra = {}) {
  return {
    transaction: { id: txId },
    index,
    address,
    value: {
      ada: { lovelace: 3000000n },
      ...(quantity === undefined ? {} : { [policyIdHex]: { [assetNameHex]: quantity } }),
      ...extra
    }
  }
}

function makeSession({
  result = [],
  acquired = true,
  released = false,
  pointValue = { slot: point.slot, id: point.hash },
  queryError = null,
  releaseError = null,
  afterQuery = null
} = {}) {
  const calls = []
  let isAcquired = acquired
  let isReleased = released
  return {
    calls,
    session: {
      get isAcquired() { return isAcquired },
      get isReleased() { return isReleased },
      get point() { return pointValue },
      async query(method, params) {
        calls.push({ method, params })
        if (afterQuery) afterQuery({ setAcquired: value => { isAcquired = value } })
        if (queryError) throw queryError
        return result
      },
      async release() {
        calls.push({ method: 'releaseLedgerState' })
        if (releaseError) throw releaseError
        isAcquired = false
        isReleased = true
        return true
      }
    }
  }
}

async function run(result, options = {}, overrides = {}) {
  const { session, calls } = makeSession({ result, ...options })
  const value = await bootstrapPreSnapshotFromWholeUtxo({
    ledgerSession: session,
    chainSyncPoint: point,
    networkId: 'cardano-private-testnet-m1',
    asset,
    ...overrides
  })
  return { value, calls }
}

test('queries the complete WholeUtxo method at the acquired point and releases it', async () => {
  const { value, calls } = await run([
    output('01'.repeat(32), 0, 25n),
    output('02'.repeat(32), 1, undefined, {
      ['cd'.repeat(28)]: { [assetNameHex]: 900000n }
    }),
    output('03'.repeat(32), 2, undefined, {
      [policyIdHex]: { [Buffer.from('PREX').toString('hex')]: 700000n }
    })
  ])
  assert.deepEqual(calls, [
    { method: 'queryLedgerState/utxo', params: {} },
    { method: 'releaseLedgerState' }
  ])
  assert.equal(value.manifest.wholeUtxoCount, 3)
  assert.equal(value.manifest.matchingUtxoCount, 1)
  assert.equal(value.manifest.totalQuantity, '25')
  assert.equal(value.utxos[0].txId, '01'.repeat(32))
  assert.equal(value.utxos[0].index, 0)
  assert.equal(value.utxos[0].addressHex, addressHex)
  assert.equal(value.index.anchorPoint.blockNo, point.blockNo)
  assert.equal(value.manifest.qualification, 'CANDIDATE_ONLY_NO_SOURCE_COMPLETENESS_PROOF')
  assert.equal(value.manifest.authority, 'NOT_ESTABLISHED')
  assert.equal(value.manifest.responseDigest.rawWireBytesAvailable, false)
})

test('preserves exact BigInt quantities above the JavaScript safe-integer range', async () => {
  const huge = 9007199254740993123456789n
  const { value } = await run([output('04'.repeat(32), 7, huge)])
  assert.equal(value.manifest.totalQuantity, huge.toString())
  assert.equal(value.index.utxos[0].quantity, huge.toString())
})

test('an empty WholeUtxo array yields an explicit empty index', async () => {
  const { value } = await run([])
  assert.equal(value.manifest.wholeUtxoCount, 0)
  assert.equal(value.manifest.matchingUtxoCount, 0)
  assert.equal(value.manifest.totalQuantity, '0')
  assert.deepEqual(value.index.utxos, [])
})

test('matches an explicitly empty asset-name byte string', async () => {
  const emptyAsset = { policyIdHex, assetNameHex: '' }
  const { value } = await run([{
    transaction: { id: '05'.repeat(32) },
    index: 0,
    address,
    value: { ada: { lovelace: 1n }, [policyIdHex]: { '': 4n } }
  }], {}, { asset: emptyAsset })
  assert.equal(value.manifest.asset.assetNameHex, '')
  assert.equal(value.manifest.totalQuantity, '4')
})

test('rejects duplicate TxIn, malformed identifiers, missing ADA and non-positive token quantities', async t => {
  const cases = [
    { name: 'duplicate TxIn', rows: [output('06'.repeat(32), 0, 1n), output('06'.repeat(32), 0, 2n)], error: /WHOLE_UTXO_DUPLICATE_OUT_REF/ },
    { name: 'invalid transaction id', rows: [output('bad-txid', 0, 1n)], error: /WHOLE_UTXO_TX_ID_INVALID/ },
    { name: 'missing ADA', rows: [{ ...output('07'.repeat(32), 0, 1n), value: { [policyIdHex]: { [assetNameHex]: 1n } } }], error: /WHOLE_UTXO_INVALID_OBJECT/ },
    { name: 'zero quantity', rows: [output('08'.repeat(32), 0, 0n)], error: /WHOLE_UTXO_NON_POSITIVE_INTEGER/ },
    { name: 'negative quantity', rows: [output('09'.repeat(32), 0, -1n)], error: /WHOLE_UTXO_NON_POSITIVE_INTEGER/ },
    { name: 'invalid matching address', rows: [{ ...output('0a'.repeat(32), 0, 1n), address: 'not-an-address' }], error: /WHOLE_UTXO_BYRON_OR_UNSUPPORTED_ADDRESS_NOT_QUALIFIED/ } 
  ]
  for (const item of cases) {
    await t.test(item.name, async () => {
      const { session, calls } = makeSession({ result: item.rows })
      await assert.rejects(() => bootstrapPreSnapshotFromWholeUtxo({
        ledgerSession: session,
        chainSyncPoint: point,
        networkId: 'cardano-private-testnet-m1',
        asset
      }), item.error)
      assert.equal(calls.at(-1).method, 'releaseLedgerState')
    })
  }
})

test('rejects Byron/base58 PRE outputs instead of misclassifying them as qualified', async () => {
  const { session } = makeSession({ result: [{
    ...output('0b'.repeat(32), 0, 1n),
    address: 'Ae2tdPwUPEZ'
  }] })
  await assert.rejects(() => bootstrapPreSnapshotFromWholeUtxo({
    ledgerSession: session,
    chainSyncPoint: point,
    networkId: 'cardano-private-testnet-m1',
    asset
  }), /WHOLE_UTXO_BYRON_OR_UNSUPPORTED_ADDRESS_NOT_QUALIFIED/)
})

test('requires the exact acquired ChainSync slot/hash and an evidenced block-height source', async () => {
  for (const badPoint of [
    { ...point, slot: point.slot + 1 },
    { ...point, hash: '22'.repeat(32) },
    { ...point, source: 'queryNetwork-blockHeight' },
    { ...point, blockNo: undefined }
  ]) {
    const { session, calls } = makeSession({ result: [] })
    await assert.rejects(() => bootstrapPreSnapshotFromWholeUtxo({
      ledgerSession: session,
      chainSyncPoint: badPoint,
      networkId: 'cardano-private-testnet-m1',
      asset
    }))
    assert.equal(calls.at(-1).method, 'releaseLedgerState')
  }
})

test('query errors, response-shape errors and release errors never yield a result', async () => {
  const queryFailure = makeSession({ queryError: new Error('RPC unavailable') })
  await assert.rejects(() => bootstrapPreSnapshotFromWholeUtxo({
    ledgerSession: queryFailure.session,
    chainSyncPoint: point,
    networkId: 'cardano-private-testnet-m1',
    asset
  }), /RPC unavailable/)
  assert.equal(queryFailure.calls.at(-1).method, 'releaseLedgerState')

  const malformed = makeSession({ result: { result: [] } })
  await assert.rejects(() => bootstrapPreSnapshotFromWholeUtxo({
    ledgerSession: malformed.session,
    chainSyncPoint: point,
    networkId: 'cardano-private-testnet-m1',
    asset
  }), /WHOLE_UTXO_RESULT_NOT_ARRAY/)

  const releaseFailure = makeSession({ result: [], releaseError: new Error('release failed') })
  await assert.rejects(() => bootstrapPreSnapshotFromWholeUtxo({
    ledgerSession: releaseFailure.session,
    chainSyncPoint: point,
    networkId: 'cardano-private-testnet-m1',
    asset
  }), /release failed/)
})

test('session expiry during WholeUtxo query fails and release is still attempted', async () => {
  const calls = []
  let acquired = true
  let released = false
  const session = {
    get isAcquired() { return acquired },
    get isReleased() { return released },
    point: { slot: point.slot, id: point.hash },
    async query(method, params) {
      calls.push({ method, params })
      acquired = false
      return []
    },
    async release() {
      calls.push({ method: 'releaseLedgerState' })
      released = true
      return true
    }
  }
  await assert.rejects(() => bootstrapPreSnapshotFromWholeUtxo({
    ledgerSession: session,
    chainSyncPoint: point,
    networkId: 'cardano-private-testnet-m1',
    asset
  }), /WHOLE_UTXO_SESSION_EXPIRED_DURING_QUERY/)
  assert.equal(calls.at(-1).method, 'releaseLedgerState')
})
