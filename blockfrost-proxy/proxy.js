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
  if (!pathname.startsWith('/blockfrost/') || pathname.includes('%') || pathname.includes('\\') || pathname.includes('//')) return null
  const path = pathname.slice('/blockfrost/'.length)
  if (!path || path.split('/').some((part) => !part || part === '.' || part === '..')) return null
  const id = '[A-Za-z0-9]+'
  const hex56 = '[a-fA-F0-9]{56}'
  const hex64 = '[a-fA-F0-9]{64}'
  const asset = '[a-fA-F0-9]{56,120}'
  const routes = [
    ['GET', new RegExp('^epochs/latest/parameters$'), 'page'],
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
  if (queryMode === 'page') {
    if (entries.some(([key]) => key !== 'page') || (searchParams.has('page') && !/^[1-9][0-9]{0,3}$/.test(searchParams.get('page')))) return null
  }
  if (queryMode === 'count') {
    if (entries.length !== 1 || searchParams.get('count') !== '2') return null
  }
  if (method === 'POST' && searchParams.size) return null
  return '/' + path + (searchParams.size ? '?' + searchParams.toString() : '')
}

function createApp(options = {}) {
  const apiKey = options.apiKey ?? process.env.BLOCKFROST_API_KEY
  if (!apiKey) throw new Error('BLOCKFROST_API_KEY is required; provider credentials must remain server-side')
  const origins = options.allowedOrigins instanceof Set
    ? options.allowedOrigins
    : parseOrigins(options.allowedOrigins ?? process.env.BLOCKFROST_PROXY_ALLOWED_ORIGINS)
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
      if (req.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/cbor') {
        return res.status(415).json({ error: 'application_cbor_required' })
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > MAX_SUBMIT_BYTES) {
        return res.status(413).json({ error: 'invalid_or_oversized_cbor_body' })
      }
      headers['content-type'] = 'application/cbor'
      body = req.body
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS)
    try {
      const upstream = await fetchImpl(UPSTREAM + upstreamPath, {
        method: req.method,
        headers,
        ...(body ? { body } : {}),
        signal: controller.signal,
        redirect: 'error',
      })
      const declaredLength = Number(upstream.headers?.get?.('content-length') || 0)
      if (declaredLength > MAX_RESPONSE_BYTES) return res.status(502).json({ error: 'upstream_response_too_large' })
      const data = Buffer.from(await upstream.arrayBuffer())
      if (data.length > MAX_RESPONSE_BYTES) return res.status(502).json({ error: 'upstream_response_too_large' })
      const contentType = upstream.headers?.get?.('content-type')
      if (contentType) res.set('Content-Type', contentType)
      res.set('Cache-Control', 'no-store')
      return res.status(upstream.status).send(data)
    } catch (error) {
      const timedOut = error?.name === 'AbortError'
      return res.status(timedOut ? 504 : 502).json({ error: timedOut ? 'upstream_timeout' : 'upstream_unavailable' })
    } finally {
      clearTimeout(timeout)
    }
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

module.exports = { createApp, validateRoute, MAX_SUBMIT_BYTES, MAX_RESPONSE_BYTES }
