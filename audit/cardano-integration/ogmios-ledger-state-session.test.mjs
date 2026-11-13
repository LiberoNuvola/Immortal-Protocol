import test from 'node:test'
import assert from 'node:assert/strict'

import { createOgmiosLedgerStateSession } from './ogmios-ledger-state-session.mjs'

const point = { slot: 123456, hash: 'a'.repeat(64) }
const acknowledgement = {
  acquired: 'ledgerState',
  point: { slot: point.slot, id: point.hash.toUpperCase() },
}

test('acquires the exact requested point and releases exactly once', async () => {
  const calls = []
  const session = createOgmiosLedgerStateSession({
    rpc: async (method, params) => {
      calls.push({ method, params })
      if (method === 'queryNetwork/tip') return point
      if (method === 'acquireLedgerState') return acknowledgement
      if (method === 'queryLedgerState/epoch') return 42
      if (method === 'releaseLedgerState') return {}
      throw new Error('unexpected method: ' + method)
    },
  })

  assert.deepEqual(await session.acquire(), {
    slot: point.slot,
    id: point.hash,
  })
  assert.equal(session.isAcquired, true)
  assert.equal(session.isReleased, false)
  assert.deepEqual(session.point, { slot: point.slot, id: point.hash })
  assert.equal(await session.query('queryLedgerState/epoch'), 42)
  assert.equal(await session.release(), true)
  assert.equal(await session.release(), false)
  assert.deepEqual(calls.map(call => call.method), [
    'queryNetwork/tip',
    'acquireLedgerState',
    'queryLedgerState/epoch',
    'releaseLedgerState',
  ])
})

test('does not retry an acknowledged point mismatch and still releases it', async () => {
  const calls = []
  const session = createOgmiosLedgerStateSession({
    rpc: async method => {
      calls.push(method)
      if (method === 'queryNetwork/tip') return point
      if (method === 'acquireLedgerState') {
        return {
          acquired: 'ledgerState',
          point: { slot: point.slot + 1, id: point.hash },
        }
      }
      if (method === 'releaseLedgerState') return {}
      throw new Error('unexpected method: ' + method)
    },
    sleep: async () => assert.fail('mismatched acknowledged acquire must not retry'),
  })

  await assert.rejects(() => session.acquire(), /OGMIOS_ACQUIRED_POINT_MISMATCH/)
  assert.equal(session.isAcquired, true)
  assert.equal(session.point, null)
  await assert.rejects(
    () => session.query('queryLedgerState/epoch'),
    /OGMIOS_LEDGER_STATE_QUERY_OUTSIDE_ACQUIRED_SESSION/,
  )
  assert.equal(await session.release(), true)
  assert.deepEqual(calls, [
    'queryNetwork/tip',
    'acquireLedgerState',
    'releaseLedgerState',
  ])
})

test('releases a malformed acquire acknowledgement because acquisition was acknowledged', async () => {
  const calls = []
  const session = createOgmiosLedgerStateSession({
    rpc: async method => {
      calls.push(method)
      if (method === 'queryNetwork/tip') return point
      if (method === 'acquireLedgerState') return { acquired: 'ledgerState' }
      if (method === 'releaseLedgerState') return {}
      throw new Error('unexpected method: ' + method)
    },
  })

  await assert.rejects(() => session.acquire(), /OGMIOS_LEDGER_STATE_ACQUIRE_ACK_MALFORMED/)
  assert.equal(session.isAcquired, true)
  assert.equal(await session.release(), true)
  assert.deepEqual(calls, [
    'queryNetwork/tip',
    'acquireLedgerState',
    'releaseLedgerState',
  ])
})

test('retries only acquire failures without an acknowledgement', async () => {
  const calls = []
  let acquireAttempts = 0
  const session = createOgmiosLedgerStateSession({
    maxAcquireAttempts: 3,
    retryDelayMs: attempt => attempt * 10,
    sleep: async milliseconds => calls.push('sleep:' + milliseconds),
    rpc: async method => {
      calls.push(method)
      if (method === 'queryNetwork/tip') return point
      if (method === 'acquireLedgerState') {
        acquireAttempts += 1
        if (acquireAttempts < 3) throw new Error('provider unavailable')
        return acknowledgement
      }
      if (method === 'releaseLedgerState') return {}
      throw new Error('unexpected method: ' + method)
    },
  })

  assert.deepEqual(await session.acquire(), {
    slot: point.slot,
    id: point.hash,
  })
  assert.equal(acquireAttempts, 3)
  assert.deepEqual(calls, [
    'queryNetwork/tip',
    'acquireLedgerState',
    'sleep:10',
    'queryNetwork/tip',
    'acquireLedgerState',
    'sleep:20',
    'queryNetwork/tip',
    'acquireLedgerState',
  ])
  await session.release()
})

test('blocks queries after release and surfaces release failure', async () => {
  const calls = []
  const session = createOgmiosLedgerStateSession({
    rpc: async method => {
      calls.push(method)
      if (method === 'queryNetwork/tip') return point
      if (method === 'acquireLedgerState') return acknowledgement
      if (method === 'releaseLedgerState') throw new Error('release transport failure')
      throw new Error('unexpected method: ' + method)
    },
  })

  await session.acquire()
  await assert.rejects(() => session.release(), /release transport failure/)
  assert.equal(session.isReleased, true)
  await assert.rejects(
    () => session.query('queryLedgerState/epoch'),
    /OGMIOS_LEDGER_STATE_QUERY_OUTSIDE_ACQUIRED_SESSION/,
  )
  assert.deepEqual(calls, [
    'queryNetwork/tip',
    'acquireLedgerState',
    'releaseLedgerState',
  ])
})
