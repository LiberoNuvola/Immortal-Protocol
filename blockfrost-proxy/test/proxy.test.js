'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createApp, validateRoute, isCardanoTransactionCbor, MAX_SUBMIT_BYTES } = require('../proxy')
const ORIGIN = 'https://dapp.example'
const KEY = 'server-only-test-key'
const TX = 'a'.repeat(64)
const SCRIPT = 'b'.repeat(56)
async function withServer(app, run) {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  try { await run('http://127.0.0.1:' + address.port) }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}
function makeApp(fetchImpl = async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }), options = {}) {
  return createApp({ apiKey: KEY, allowedOrigins: new Set([ORIGIN]), fetchImpl, ...options })
}
test('requires server credential and explicit origins', () => {
  assert.throws(() => createApp({ allowedOrigins: new Set([ORIGIN]) }), /BLOCKFROST_API_KEY/)
  assert.throws(() => createApp({ apiKey: KEY, allowedOrigins: new Set() }), /ALLOWED_ORIGINS/)
})
test('CBOR envelope requires one complete four-item top-level array and bounded nested items', () => {
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x00, 0x01, 0x02, 0x03])), true)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x00, 0x01])), false)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x01])), false)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x81, 0x00])), false)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x00, 0x01, 0x02, 0x03, 0x04])), false)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x9f, 0x00, 0x01, 0x02, 0x03, 0xff])), false)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x9f, 0xff, 0x00, 0x01, 0x02])), true)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0xbf, 0xff, 0x00, 0x01, 0x02])), true)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x5f, 0x41, 0xaa, 0xff, 0x00, 0x01, 0x02])), true)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x7f, 0x61, 0x61, 0xff, 0x00, 0x01, 0x02])), true)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x5f, 0x41])), false)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0xbf, 0x00, 0xff, 0x01, 0x02])), false)
  assert.equal(isCardanoTransactionCbor(Buffer.from([0x84, 0x5f, 0x61, 0x61, 0xff, 0x00, 0x01, 0x02])), false)
})
test('route allowlist is exact and method-bound', () => {
  assert.equal(validateRoute('GET', '/blockfrost/epochs/latest/parameters', new URLSearchParams()), '/epochs/latest/parameters')
  assert.equal(validateRoute('GET', '/blockfrost/txs/' + TX + '/utxos', new URLSearchParams()), '/txs/' + TX + '/utxos')
  assert.equal(validateRoute('GET', '/blockfrost/scripts/' + SCRIPT + '/cbor', new URLSearchParams()), '/scripts/' + SCRIPT + '/cbor')
  assert.equal(validateRoute('POST', '/blockfrost/tx/submit', new URLSearchParams()), '/tx/submit')
  assert.equal(validateRoute('DELETE', '/blockfrost/tx/submit', new URLSearchParams()), null)
  assert.equal(validateRoute('GET', '/blockfrost/txs/' + TX + '/metadata', new URLSearchParams()), null)
  assert.equal(validateRoute('GET', '/blockfrost/txs/' + TX + '/utxos?host=evil', new URLSearchParams('host=evil')), null)
  assert.equal(validateRoute('GET', '/blockfrost/%2e%2e/secret', new URLSearchParams()), null)
  assert.equal(validateRoute('GET', '/blockfrost/txs/' + TX + '//utxos', new URLSearchParams()), null)
  assert.equal(validateRoute('GET', '/blockfrost/addresses/a/utxos?page=1001', new URLSearchParams('page=1001')), null)
  assert.equal(validateRoute('GET', '/blockfrost/addresses/a/utxos?page=1&page=2', new URLSearchParams('page=1&page=2')), null)
  assert.equal(validateRoute('GET', '/blockfrost/epochs/latest/parameters?page=2', new URLSearchParams('page=2')), null)
  assert.equal(validateRoute('GET', '/blockfrost/assets/' + 'd'.repeat(56) + '/addresses', new URLSearchParams('count=2')), '/assets/' + 'd'.repeat(56) + '/addresses?count=2')
})
test('rejects missing and foreign origins without wildcard CORS', async () => {
  const app = makeApp()
  await withServer(app, async (base) => {
    const missing = await fetch(base + '/blockfrost/epochs/latest/parameters')
    assert.equal(missing.status, 403)
    const foreign = await fetch(base + '/blockfrost/epochs/latest/parameters', { headers: { Origin: 'https://evil.example' } })
    assert.equal(foreign.status, 403)
    assert.equal(foreign.headers.get('access-control-allow-origin'), null)
  })
})
test('forwards only fixed upstream GET with server credential and preserves response', async () => {
  let captured
  const app = makeApp(async (url, init) => {
    captured = { url, init }
    return new Response('{"ok":true}', { status: 206, headers: { 'content-type': 'application/json' } })
  })
  await withServer(app, async (base) => {
    const response = await fetch(base + '/blockfrost/epochs/latest/parameters', { headers: { Origin: ORIGIN } })
    assert.equal(response.status, 206)
    assert.equal(await response.text(), '{"ok":true}')
    assert.equal(captured.url, 'https://cardano-preprod.blockfrost.io/api/v0/epochs/latest/parameters')
    assert.equal(captured.init.headers.project_id, KEY)
    assert.equal(captured.init.method, 'GET')
  })
})
test('relays a synthetic four-item CBOR envelope byte-for-byte without validating signature semantics', async () => {
  // This fixture tests transparent transport only; it is not a signed ledger transaction.
  const bytes = Buffer.from([0x84, 0x00, 0x01, 0x02, 0x03])
  let captured
  const app = makeApp(async (url, init) => {
    captured = { url, init, body: Buffer.from(init.body) }
    return new Response('', { status: 202 })
  })
  await withServer(app, async (base) => {
    const response = await fetch(base + '/blockfrost/tx/submit', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/cbor' }, body: bytes })
    assert.equal(response.status, 202)
    assert.equal(captured.url, 'https://cardano-preprod.blockfrost.io/api/v0/tx/submit')
    assert.deepEqual(captured.body, bytes)
    assert.equal(captured.init.headers.project_id, KEY)
  })
})
test('rejects wrong submit content type, malformed CBOR and over-limit body', async () => {
  let called = false
  const app = makeApp(async () => { called = true; return new Response('', { status: 202 }) })
  await withServer(app, async (base) => {
    const wrong = await fetch(base + '/blockfrost/tx/submit', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: '{}' })
    assert.equal(wrong.status, 415)
    const invalid = await fetch(base + '/blockfrost/tx/submit', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/cbor' }, body: Buffer.from([0x84, 0x00]) })
    assert.equal(invalid.status, 400)
    assert.equal(called, false)
    const large = await fetch(base + '/blockfrost/tx/submit', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/cbor' }, body: Buffer.alloc(MAX_SUBMIT_BYTES + 1) })
    assert.equal(large.status, 413)
  })
})
test('bounds upstream response bytes and per-process request rate', async () => {
  const large = makeApp(async () => new Response(Buffer.alloc(5 * 1024 * 1024 + 1), { status: 200 }))
  await withServer(large, async (base) => {
    const response = await fetch(base + '/blockfrost/epochs/latest/parameters', { headers: { Origin: ORIGIN } })
    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { error: 'upstream_response_too_large' })
  })
  const limited = makeApp(undefined, { rateMax: 1 })
  await withServer(limited, async (base) => {
    const request = () => fetch(base + '/blockfrost/epochs/latest/parameters', { headers: { Origin: ORIGIN } })
    const first = await request()
    const second = await request()
    assert.equal(first.status, 200)
    assert.equal(second.status, 429)
  })
})
test('upstream failure and timeout are bounded and sanitized', async () => {
  const failed = makeApp(async () => { throw new Error('secret upstream detail') })
  await withServer(failed, async (base) => {
    const response = await fetch(base + '/blockfrost/epochs/latest/parameters', { headers: { Origin: ORIGIN } })
    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { error: 'upstream_unavailable' })
  })
  const slow = makeApp((_url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))), { timeoutMs: 5 })
  await withServer(slow, async (base) => {
    const response = await fetch(base + '/blockfrost/epochs/latest/parameters', { headers: { Origin: ORIGIN } })
    assert.equal(response.status, 504)
  })
})
