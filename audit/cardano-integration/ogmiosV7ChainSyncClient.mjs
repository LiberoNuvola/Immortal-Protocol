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

function createSession(url, WebSocketImpl, maxPayload, getIndexState, callbacks, options) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocketImpl(url, { maxPayload })
    const pending = new Map()
    let requestCounter = 0
    let settled = false
    let intentionalClose = false

    const rejectPending = error => {
      for (const waiter of pending.values()) waiter.reject(error)
      pending.clear()
    }

    const fatal = (code, message) => new ChainSyncError(code, message, true)

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
        rejectPending(fatal('OGMIOS_UNMATCHED_RESPONSE', 'Ogmios response did not match an outstanding request'))
        return
      }
      pending.delete(requestId)

      if (response.error) {
        const code = Number.isInteger(response.error.code) ? response.error.code : 'UNKNOWN'
        waiter.reject(fatal('OGMIOS_RPC_ERROR_' + code, String(response.error.message || 'Ogmios JSON-RPC error')))
        return
      }
      if (response.method !== waiter.method || !Object.prototype.hasOwnProperty.call(response, 'result')) {
        waiter.reject(fatal('OGMIOS_RESPONSE_SHAPE_MISMATCH', 'Ogmios response method/result did not match the request'))
        return
      }
      waiter.resolve(response.result)
    })

    socket.on('error', error => {
      rejectPending(new ChainSyncError('OGMIOS_SOCKET_ERROR', error.message, false))
      if (!settled) {
        settled = true
        reject(new ChainSyncError('OGMIOS_SOCKET_ERROR', error.message, false))
      }
    })

    socket.on('close', (code, reason) => {
      const message = reason ? reason.toString() : 'Ogmios WebSocket closed (' + code + ')'
      const error = new ChainSyncError(
        intentionalClose ? 'OGMIOS_STOPPED' : 'OGMIOS_SOCKET_CLOSED',
        message,
        false
      )
      rejectPending(error)
      if (!settled) {
        settled = true
        if (intentionalClose) resolve()
        else reject(error)
      }
    })

    socket.once('open', async () => {
      if (settled) return

      const rpc = (method, params) => new Promise((rpcResolve, rpcReject) => {
        if (socket.readyState !== socket.OPEN) {
          rpcReject(new ChainSyncError('OGMIOS_SOCKET_NOT_OPEN', 'Cannot send request on a closed Ogmios socket', false))
          return
        }
        requestCounter += 1
        const requestId = 'm1-chain-sync-' + requestCounter
        pending.set(requestId, { method, resolve: rpcResolve, reject: rpcReject })
        const request = {
          jsonrpc: '2.0',
          method,
          params,
          id: { requestId }
        }
        try {
          socket.send(JSON.stringify(request), error => {
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
          rpcReject(new ChainSyncError('OGMIOS_SEND_FAILED', error.message, false))
        }
      })

      const session = {
        socket,
        close: () => {
          intentionalClose = true
          if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) socket.close()
          if (!settled) {
            settled = true
            resolve()
          }
        }
      }

      try {
        const initialState = await getIndexState()
        const points = getOgmiosV7IntersectionPoints(initialState, options.maxIntersectionPoints)
        if (!Array.isArray(points) || points.length === 0) {
          throw fatal('OGMIOS_NO_INTERSECTION_CANDIDATES', 'No retained chain points are available for Ogmios intersection')
        }

        const intersection = await rpc('findIntersection', { points })
        if (!intersection || !Object.prototype.hasOwnProperty.call(intersection, 'intersection')) {
          throw fatal('OGMIOS_NO_COMMON_INTERSECTION', 'Ogmios did not find a common point in the retained local index history')
        }
        validateTipOrOrigin(intersection.tip)

        const afterIntersectionState = await getIndexState()
        const matchedPoint = resolveOgmiosV7RollbackPoint(intersection.intersection, afterIntersectionState)
        if (callbacks.onIntersection) await callbacks.onIntersection(matchedPoint, intersection.tip)

        while (!options.isStopped()) {
          const result = await rpc('nextBlock', {})
          const state = await getIndexState()
          let event
          try {
            event = decodeOgmiosV7ChainSyncResult(result, state)
          } catch (error) {
            throw fatal('OGMIOS_BLOCK_DECODE_FAILED', error.message)
          }
          validateTipOrOrigin(event.tip)

          try {
            if (event.direction === 'forward') {
              await callbacks.onRollForward(event.block, event.tip)
            } else {
              await callbacks.onRollBackward(event.point, event.tip)
            }
          } catch (error) {
            throw fatal('PRE_SNAPSHOT_INDEX_CALLBACK_FAILED', error.message)
          }
        }

        session.close()
      } catch (error) {
        rejectPending(error)
        if (!settled) {
          settled = true
          reject(error)
        }
      }

      if (!settled && !options.isStopped()) {
        // A session remains alive while requests are outstanding. Its close/error events settle it.
      }
    })

    resolve({
      done: new Promise((doneResolve, doneReject) => {
        // The outer promise is resolved to the session immediately; the session's completion
        // is tracked independently so callers can stop or await it.
        const poll = () => {
          if (settled) {
            doneResolve()
            return
          }
          setTimeout(poll, 25)
        }
        poll()
      }),
      close: () => {
        intentionalClose = true
        if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) socket.close()
        if (!settled) {
          settled = true
          resolve()
        }
      },
      socket
    })
  })
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
  if (!Number.isSafeInteger(reconnectDelayMs) || reconnectDelayMs < 0) throw new Error('INVALID_RECONNECT_DELAY')

  let stopped = false
  let running = false
  let completion = null
  let activeSession = null
  let lastError = null

  const reportError = error => {
    lastError = error
    try { onError(error) } catch (_) {}
  }

  const runLoop = async () => {
    while (!stopped) {
      try {
        activeSession = await createSession(
          url,
          WebSocketImpl,
          maxPayload,
          getIndexState,
          { onRollForward, onRollBackward, onIntersection },
          {
            maxIntersectionPoints,
            isStopped: () => stopped
          }
        )
        if (stopped) break
        await activeSession.done
        if (!stopped) {
          throw new ChainSyncError('OGMIOS_SESSION_ENDED', 'Ogmios session ended unexpectedly', false)
        }
      } catch (error) {
        activeSession = null
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
      running = true
      completion = runLoop()
      return completion
    },
    async stop() {
      stopped = true
      if (activeSession) activeSession.close()
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
