import { createRequire } from 'node:module'
import WebSocket from 'ws'
import {
  decodeOgmiosV7ChainSyncResult,
  getOgmiosV7IntersectionPoints,
  resolveOgmiosV7RollbackPoint
} from './ogmiosV7PreSnapshotAdapter.mjs'

const require = createRequire(import.meta.url)
const JSONBig = require('@cardanosolutions/json-bigint')({ useNativeBigInt: true })

class ChainSyncError extends Error {
  constructor(code, message, fatal = false) {
    super(message)
    this.name = 'ChainSyncError'
    this.code = code
    this.fatal = fatal
  }
}

function parseMessage(data) {
  const raw = Buffer.isBuffer(data) ? data.toString('utf8') : String(data)
  try {
    return JSONBig.parse(raw)
  } catch (error) {
    throw new ChainSyncError('OGMIOS_INVALID_JSON', error.message, true)
  }
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function validateTipOrOrigin(tip) {
  if (tip === 'origin') return
  if (!tip || typeof tip !== 'object' || typeof tip.id !== 'string' ||
      !Number.isSafeInteger(Number(tip.slot)) || !Number.isSafeInteger(Number(tip.height))) {
    throw new ChainSyncError('OGMIOS_INVALID_TIP', 'Ogmios returned an invalid chain tip', true)
  }
}

async function runOgmiosSession({
  url,
  WebSocketImpl,
  getIndexState,
  onRollForward,
  onRollBackward,
  onIntersection,
  maxPayload,
  maxIntersectionPoints,
  isStopped,
  setActiveSocket
}) {
  const socket = new WebSocketImpl(url, { maxPayload })
  setActiveSocket(socket)

  await new Promise((resolve, reject) => {
    const onOpen = () => {
      socket.removeListener('error', onError)
      socket.removeListener('close', onClose)
      resolve()
    }
    const onError = error => reject(new ChainSyncError('OGMIOS_CONNECT_ERROR', error.message, false))
    const onClose = (code, reason) => {
      reject(new ChainSyncError(
        'OGMIOS_CLOSED_BEFORE_OPEN',
        reason ? reason.toString() : 'Ogmios closed before opening (' + code + ')',
        false
      ))
    }
    socket.once('open', onOpen)
    socket.once('error', onError)
    socket.once('close', onClose)
  })

  const pending = new Map()
  let requestCounter = 0
  let socketFailure = null

  const rejectPending = error => {
    socketFailure = error
    for (const waiter of pending.values()) waiter.reject(error)
    pending.clear()
  }

  socket.on('error', error => {
    rejectPending(new ChainSyncError('OGMIOS_SOCKET_ERROR', error.message, false))
  })
  socket.on('close', (code, reason) => {
    const message = reason ? reason.toString() : 'Ogmios WebSocket closed (' + code + ')'
    rejectPending(new ChainSyncError('OGMIOS_SOCKET_CLOSED', message + ' (' + code + ')', false))
  })
  socket.on('message', data => {
    let response
    try {
      response = parseMessage(data)
    } catch (error) {
      rejectPending(error)
      return
    }

    const requestId = response && response.id && response.id.requestId
    const waiter = pending.get(requestId)
    if (!waiter) {
      rejectPending(new ChainSyncError(
        'OGMIOS_UNMATCHED_RESPONSE',
        'Ogmios response did not match an outstanding request',
        true
      ))
      return
    }
    pending.delete(requestId)

    if (response.error) {
      const code = Number.isInteger(response.error.code) ? response.error.code : 'UNKNOWN'
      waiter.reject(new ChainSyncError(
        'OGMIOS_RPC_ERROR_' + code,
        String(response.error.message || 'Ogmios JSON-RPC error'),
        true
      ))
      return
    }
    if (response.method !== waiter.method || !Object.prototype.hasOwnProperty.call(response, 'result')) {
      waiter.reject(new ChainSyncError(
        'OGMIOS_RESPONSE_SHAPE_MISMATCH',
        'Ogmios response method/result did not match the request',
        true
      ))
      return
    }
    waiter.resolve(response.result)
  })

  const rpc = (method, params) => new Promise((resolve, reject) => {
    if (socketFailure) {
      reject(socketFailure)
      return
    }
    if (socket.readyState !== socket.OPEN) {
      reject(new ChainSyncError('OGMIOS_SOCKET_NOT_OPEN', 'Cannot send request on a closed Ogmios socket', false))
      return
    }
    requestCounter += 1
    const requestId = 'm1-chain-sync-' + requestCounter
    pending.set(requestId, { method, resolve, reject })
    try {
      socket.send(JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: { requestId }
      }), error => {
        if (error) {
          const waiter = pending.get(requestId)
          if (waiter) {
            pending.delete(requestId)
            waiter.reject(new ChainSyncError('OGMIOS_SEND_FAILED', error.message, false))
          }
        }
      })
    } catch (error) {
      pending.delete(requestId)
      reject(new ChainSyncError('OGMIOS_SEND_FAILED', error.message, false))
    }
  })

  try {
    const initialState = await getIndexState()
    const points = getOgmiosV7IntersectionPoints(initialState, maxIntersectionPoints)
    if (!Array.isArray(points) || points.length === 0) {
      throw new ChainSyncError(
        'OGMIOS_NO_INTERSECTION_CANDIDATES',
        'No retained chain points are available for Ogmios intersection',
        true
      )
    }

    const intersection = await rpc('findIntersection', { points })
    if (!intersection || !Object.prototype.hasOwnProperty.call(intersection, 'intersection')) {
      throw new ChainSyncError(
        'OGMIOS_NO_COMMON_INTERSECTION',
        'Ogmios did not find a common point in the retained local index history',
        true
      )
    }
    validateTipOrOrigin(intersection.tip)

    const currentState = await getIndexState()
    const matchedPoint = resolveOgmiosV7RollbackPoint(intersection.intersection, currentState)
    if (onIntersection) await onIntersection(matchedPoint, intersection.tip)

    while (!isStopped()) {
      const result = await rpc('nextBlock', {})
      const state = await getIndexState()
      let event
      try {
        event = decodeOgmiosV7ChainSyncResult(result, state)
      } catch (error) {
        throw new ChainSyncError('OGMIOS_BLOCK_DECODE_FAILED', error.message, true)
      }
      validateTipOrOrigin(event.tip)

      try {
        if (event.direction === 'forward') {
          await onRollForward(event.block, event.tip)
        } else {
          await onRollBackward(event.point, event.tip)
        }
      } catch (error) {
        throw new ChainSyncError('PRE_SNAPSHOT_INDEX_CALLBACK_FAILED', error.message, true)
      }
    }
  } finally {
    setActiveSocket(null)
    if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) {
      try { socket.close() } catch (_) {}
    }
  }
}

/**
 * Create a reconnecting Ogmios v7 ChainSync client.
 *
 * getIndexState must return the latest committed reducer state.
 * onRollForward/onRollBackward must commit their state transition before resolving.
 * The client requests one block at a time, deliberately applying backpressure.
 */
export function createOgmiosV7ChainSyncClient({
  url,
  WebSocketImpl = WebSocket,
  getIndexState,
  onRollForward,
  onRollBackward,
  onIntersection,
  onError = () => {},
  reconnectDelayMs = 1500,
  maxPayload = 128 * 1024 * 1024,
  maxIntersectionPoints = 128
}) {
  if (typeof url !== 'string' || (!url.startsWith('ws://') && !url.startsWith('wss://'))) {
    throw new Error('OGMIOS_URL_MUST_BE_WS_OR_WSS')
  }
  if (typeof getIndexState !== 'function' || typeof onRollForward !== 'function' ||
      typeof onRollBackward !== 'function') {
    throw new Error('OGMIOS_INDEX_CALLBACKS_REQUIRED')
  }
  if (!Number.isSafeInteger(reconnectDelayMs) || reconnectDelayMs < 0) {
    throw new Error('INVALID_RECONNECT_DELAY')
  }
  if (!Number.isSafeInteger(maxIntersectionPoints) || maxIntersectionPoints < 1) {
    throw new Error('INVALID_MAX_INTERSECTION_POINTS')
  }

  let stopped = false
  let running = false
  let completion = null
  let activeSocket = null
  let lastError = null

  const setActiveSocket = socket => {
    activeSocket = socket
  }

  const reportError = error => {
    lastError = error
    try { onError(error) } catch (_) {}
  }

  const runLoop = async () => {
    while (!stopped) {
      try {
        await runOgmiosSession({
          url,
          WebSocketImpl,
          getIndexState,
          onRollForward,
          onRollBackward,
          onIntersection,
          maxPayload,
          maxIntersectionPoints,
          isStopped: () => stopped,
          setActiveSocket
        })
        if (!stopped) {
          throw new ChainSyncError(
            'OGMIOS_SESSION_ENDED',
            'Ogmios session ended unexpectedly',
            false
          )
        }
      } catch (error) {
        if (stopped) break
        reportError(error)
        if (error && error.fatal) break
        await delay(reconnectDelayMs)
      }
    }
    running = false
  }

  return Object.freeze({
    start() {
      if (running) return completion
      stopped = false
      running = true
      completion = runLoop()
      return completion
    },
    async stop() {
      stopped = true
      if (activeSocket &&
          (activeSocket.readyState === activeSocket.OPEN || activeSocket.readyState === activeSocket.CONNECTING)) {
        try { activeSocket.close() } catch (_) {}
      }
      if (completion) await completion
    },
    get lastError() {
      return lastError
    },
    get isRunning() {
      return running && !stopped
    }
  })
}
