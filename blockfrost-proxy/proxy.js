'use strict'

const express = require('express')
const UPSTREAM = 'https://cardano-preprod.blockfrost.io/api/v0'
const MAX_SUBMIT_BYTES = 16_384
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 12_000
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 120

function parseOrigins(value) {
  return new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean).map((item) => {
    const url = new URL(item)
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== item.replace(/\/$/, '') || url.username || url.password) {
      throw new Error('BLOCKFROST_PROXY_ALLOWED_ORIGINS must contain exact HTTP(S) origins only')
    }
    return url.origin
  }))
}

function validateRoute(method, pathname, searchParams) {
  if (!pathname.startsWith('/blockfrost/') || pathname.length > 512 || searchParams.toString().length > 128 || pathname.includes('%') || pathname.includes('\\') || pathname.includes('//')) return null
  const path = pathname.slice('/blockfrost/'.length)
  if (!path || path.split('/').some((part) => !part || part === '.' || part === '..')) return null
  const id = '[A-Za-z0-9]+'
  const hex56 = '[a-fA-F0-9]{56}'
  const hex64 = '[a-fA-F0-9]{64}'
  const asset = '[a-fA-F0-9]{56,120}'
  const routes = [
    ['GET', new RegExp('^epochs/latest/parameters$'), 'none'],
    ['GET', new RegExp('^addresses/' + id + '/utxos$'), 'page'],
    ['GET', new RegExp('^addresses/' + id + '/utxos/' + asset + '$'), 'page'],
    ['GET', new RegExp('^assets/' + asset + '/addresses$'), 'count'],
    ['GET', new RegExp('^txs/' + hex64 + '/utxos$'), 'none'],
    ['GET', new RegExp('^accounts/' + id + '$'), 'none'],
    ['GET', new RegExp('^scripts/datum/' + hex64 + '/cbor$'), 'none'],
    ['GET', new RegExp('^txs/' + hex64 + '$'), 'none'],
    ['GET', new RegExp('^scripts/' + hex56 + '$'), 'none'],
    ['GET', new RegExp('^scripts/' + hex56 + '/cbor$'), 'none'],
    ['POST', /^tx\/submit$/, 'none'],
  ]
  const match = routes.find(([allowedMethod, pattern]) => allowedMethod === method && pattern.test(path))
  if (!match) return null
  const queryMode = match[2]
  const entries = [...searchParams.entries()]
  if (queryMode === 'none' && entries.length) return null
  if (queryMode === 'page' && (entries.length > 1 || entries.some(([key]) => key !== 'page') || (searchParams.has('page') && !/^[1-9][0-9]{0,3}$/.test(searchParams.get('page'))))) return null
  if (queryMode === 'count' && (entries.length !== 1 || searchParams.get('count') !== '2')) return null
  return '/' + path + (searchParams.size ? '?' + searchParams.toString() : '')
}

function isCardanoTransactionCbor(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || (buffer[0] >> 5) !== 4) return false
  let offset = 0
  let nodes = 0
  function length(ai) {
    if (ai < 24) return ai
    const size = ai === 24 ? 1 : ai === 25 ? 2 : ai === 26 ? 4 : ai === 27 ? 8 : 0
    if (!size || offset + size > buffer.length) throw new Error('invalid CBOR length')
    let n = 0n
    for (let i = 0; i < size; i++) n = (n << 8n) | BigInt(buffer[offset++])
    if (n > BigInt(buffer.length)) throw new Error('CBOR item exceeds transaction size')
    return Number(n)
  }
  function read(depth = 0) {
    if (depth > 64 || ++nodes > 100000 || offset >= buffer.length) throw new Error('invalid CBOR structure')
    const initial = buffer[offset++]
    const major = initial >> 5
    const ai = initial & 31
    if (ai === 31) throw new Error('indefinite CBOR items are not accepted')
    if (major === 7) {
      const size = ai === 24 ? 1 : ai === 25 ? 2 : ai === 26 ? 4 : ai === 27 ? 8 : 0
      if (offset + size > buffer.length) throw new Error('truncated CBOR simple value')
      offset += size
      return major
    }
    const count = length(ai)
    if (major === 0 || major === 1) return major
    if (major === 2 || major === 3) {
      if (offset + count > buffer.length) throw new Error('truncated CBOR string')
      offset += count
      return major
    }
    if (major === 4) { for (let i = 0; i < count; i++) read(depth + 1); return major }
    if (major === 5) { for (let i = 0; i < count * 2; i++) read(depth + 1); return major }
    if (major === 6) { read(depth + 1); return major }
    throw new Error('unsupported CBOR type')
  }
  try { return read() === 4 && rootArrayLength === 4 && offset === buffer.length } catch { return false }
}

async function readBounded(response, limit) {
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  while (true) {
    const part = await reader.read()
    if (part.done) break
    total += part.value.byteLength
    if (total > limit) {
      await reader.cancel()
      throw new Error('upstream response exceeds configured limit')
    }
    chunks.push(Buffer.from(part.value))
  }
  return Buffer.concat(chunks, total)
}

function createApp(options = {}) {
  const apiKey = options.apiKey ?? process.env.BLOCKFROST_API_KEY
  if (!apiKey) throw new Error('BLOCKFROST_API_KEY is required; provider credentials must remain server-side')
  const origins = options.allowedOrigins instanceof Set ? options.allowedOrigins : parseOrigins(options.allowedOrigins ?? process.env.BLOCKFROST_PROXY_ALLOWED_ORIGINS)
  if (!origins.size) throw new Error('BLOCKFROST_PROXY_ALLOWED_ORIGINS must configure at least one exact origin')
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new Error('A Fetch-compatible upstream implementation is required')
  const app = express()
  const rates = new Map()
  const now = options.now ?? Date.now
  const rateMax = options.rateMax ?? RATE_MAX
  app.disable('x-powered-by')
  app.use('/blockfrost', express.raw({ type: 'application/cbor', limit: MAX_SUBMIT_BYTES }))
  app.use('/blockfrost', async (req, res) => {
    const origin = req.get('Origin')
    if (!origin || !origins.has(origin)) return res.status(403).json({ error: 'origin_not_allowed' })
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    res.set('Access-Control-Max-Age', '600')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    const nowMs = now()
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const prior = rates.get(ip)
    const bucket = !prior || nowMs - prior.start >= RATE_WINDOW_MS ? { start: nowMs, count: 0 } : prior
    bucket.count += 1
    rates.set(ip, bucket)
    if (bucket.count > rateMax) return res.status(429).json({ error: 'rate_limited' })
    let parsed
    try { parsed = new URL(req.originalUrl, 'http://proxy.invalid') } catch { return res.status(400).json({ error: 'invalid_request_url' }) }
    const upstreamPath = validateRoute(req.method, parsed.pathname, parsed.searchParams)
    if (!upstreamPath) return res.status(404).json({ error: 'route_not_allowed' })
    const headers = { project_id: apiKey, accept: 'application/json' }
    let body
    if (req.method === 'POST') {
      if (req.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/cbor') return res.status(415).json({ error: 'application_cbor_required' })
      if (!Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > MAX_SUBMIT_BYTES) return res.status(413).json({ error: 'invalid_or_oversized_cbor_body' })
      if (!isCardanoTransactionCbor(req.body)) return res.status(400).json({ error: 'invalid_cardano_transaction_cbor' })
      headers['content-type'] = 'application/cbor'
      body = req.body
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS)
    try {
      const upstream = await fetchImpl(UPSTREAM + upstreamPath, { method: req.method, headers, ...(body ? { body } : {}), signal: controller.signal, redirect: 'error' })
      const declaredLength = Number(upstream.headers?.get?.('content-length') || 0)
      if (declaredLength > MAX_RESPONSE_BYTES) return res.status(502).json({ error: 'upstream_response_too_large' })
      let data
      try { data = await readBounded(upstream, MAX_RESPONSE_BYTES) } catch { return res.status(502).json({ error: 'upstream_response_too_large' }) }
      const contentType = upstream.headers?.get?.('content-type')
      if (contentType) res.set('Content-Type', contentType)
      res.set('Cache-Control', 'no-store')
      return res.status(upstream.status).send(data)
    } catch (error) {
      const timedOut = error?.name === 'AbortError'
      return res.status(timedOut ? 504 : 502).json({ error: timedOut ? 'upstream_timeout' : 'upstream_unavailable' })
    } finally { clearTimeout(timeout) }
  })
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'request_body_too_large' })
    return res.status(400).json({ error: 'invalid_request' })
  })
  return app
}

if (require.main === module) {
  const app = createApp()
  const port = Number(process.env.BLOCKFROST_PROXY_PORT || 3001)
  app.listen(port, () => console.log('Blockfrost Preprod proxy listening on port ' + port))
}
module.exports = { createApp, validateRoute, isCardanoTransactionCbor, MAX_SUBMIT_BYTES, MAX_RESPONSE_BYTES }
