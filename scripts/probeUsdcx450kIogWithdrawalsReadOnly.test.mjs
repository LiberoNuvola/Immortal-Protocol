import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePaymentAddresses, queryIogAddress, runProbe, TARGET_BURNS } from './probeUsdcx450kIogWithdrawalsReadOnly.mjs'

function response(value, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(value) }
}

test('resolves every payment address using Koios POST with explicit all-address flags', async () => {
  let request
  const fetchFn = async (url, options) => {
    request = { url, options }
    return response([{ stake_address: 'stake1example', addresses: ['addr1one', 'addr1two', 'addr1one'] }])
  }
  const result = await resolvePaymentAddresses('stake1example', fetchFn)
  assert.deepEqual(result.addresses, ['addr1one', 'addr1two'])
  assert.equal(request.options.method, 'POST')
  assert.deepEqual(JSON.parse(request.options.body), {
    _stake_addresses: ['stake1example'], _first_only: false, _empty: true,
  })
})

test('rejects malformed or non-payment addresses from Koios', async () => {
  await assert.rejects(
    resolvePaymentAddresses('stake1example', async () => response([{ stake_address: 'stake1example', addresses: ['stake_test1bad'] }])),
    /KOIOS_PAYMENT_ADDRESS_INVALID/,
  )
})

test('IOG history selects exact burn hashes, never amount-only matches', async () => {
  const result = await queryIogAddress('addr1example', async (url, options) => {
    assert.equal(options.method, 'GET')
    return response([
      { cardanoBurnTxHash: TARGET_BURNS[0], amount: '450000000000', status: 'finalized', ethereumTxHash: '0x' + 'a'.repeat(64) },
      { cardanoBurnTxHash: 'f'.repeat(64), amount: '450000000000', status: 'finalized', ethereumTxHash: '0x' + 'b'.repeat(64) },
    ])
  })
  assert.equal(result.rowsReturned, 2)
  assert.equal(result.matches.length, 1)
  assert.equal(result.matches[0].burnTxHash, TARGET_BURNS[0])
})

test('full probe queries each resolved payment address and reports exact targets', async () => {
  const calls = []
  const fetchFn = async (url, options) => {
    calls.push({ url, method: options.method })
    if (url.endsWith('/account_addresses')) {
      return response([{ stake_address: 'stake1example', addresses: ['addr1a', 'addr1b'] }])
    }
    if (url.endsWith('/addr1a')) {
      return response([{ cardanoBurnTxHash: TARGET_BURNS[1], amount: '450000000000', status: 'finalized', ethereumTxHash: '0x' + 'c'.repeat(64) }])
    }
    return response([])
  }
  const times = ['2026-11-01T00:00:00.000Z', '2026-11-01T00:00:02.000Z']
  const result = await runProbe({ stakeAddress: 'stake1example', fetchFn, now: () => new Date(times.shift()) })
  assert.equal(result.paymentAddressCount, 2)
  assert.equal(result.exactBurnMatches.length, 1)
  assert.equal(result.exactBurnMatches[0].paymentAddress, 'addr1a')
  assert.equal(result.targetDisposition[0].status, 'NO_EXACT_IOG_ROW_FOUND_FOR_RESOLVED_ADDRESSES')
  assert.equal(result.targetDisposition[1].status, 'IOG_ROW_FOUND_REQUIRES_INDEPENDENT_ETHEREUM_CREDIT_CHECK')
  assert.equal(calls.length, 3)
  assert.deepEqual(calls.map((x) => x.method), ['POST', 'GET', 'GET'])
})

test('fails closed on non-200 provider responses', async () => {
  await assert.rejects(resolvePaymentAddresses('stake1example', async () => response({ error: true }, 429)), /KOIOS_ACCOUNT_ADDRESSES_HTTP_429/)
})
