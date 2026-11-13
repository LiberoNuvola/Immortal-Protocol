function normalizeLedgerPoint(raw, label) {
  const candidate = raw?.tip ?? raw
  const slot = Number(candidate?.slot)
  const hash = candidate?.hash ?? candidate?.id
  if (!Number.isSafeInteger(slot) || slot < 0 ||
      typeof hash !== 'string' || !/^[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error(label + '_MALFORMED: ' + JSON.stringify(raw))
  }
  return { slot, hash: hash.toLowerCase() }
}

/**
 * Owns one Ogmios v7 acquired-ledger-state lifecycle.
 *
 * The endpoint used by IMMORTAL expects { slot, id } for acquireLedgerState.
 * An acknowledgement is considered acquired before it is validated so a
 * malformed or mismatched acknowledgement is still released by the caller.
 */
export function createOgmiosLedgerStateSession({
  rpc,
  maxAcquireAttempts = 3,
  retryDelayMs = attempt => 250 * attempt,
  sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
}) {
  if (typeof rpc !== 'function') throw new TypeError('OGMIOS_RPC_REQUIRED')
  if (!Number.isSafeInteger(maxAcquireAttempts) || maxAcquireAttempts < 1) {
    throw new TypeError('OGMIOS_MAX_ACQUIRE_ATTEMPTS_INVALID')
  }

  let acquired = false
  let released = false
  let acquiredPoint = null

  async function acquire() {
    if (acquired || released) throw new Error('OGMIOS_LEDGER_STATE_SESSION_ALREADY_USED')

    let lastError = 'unknown acquire error'
    for (let attempt = 1; attempt <= maxAcquireAttempts; attempt += 1) {
      const tipResponse = await rpc('queryNetwork/tip')
      const requestedPoint = normalizeLedgerPoint(tipResponse, 'OGMIOS_NETWORK_TIP')

      try {
        const acknowledgement = await rpc('acquireLedgerState', {
          point: { slot: requestedPoint.slot, id: requestedPoint.hash },
        })

        // Set before validating the response: any acknowledged acquisition
        // must be released, even when its point or acknowledgement is malformed.
        acquired = true
        if (acknowledgement?.acquired !== 'ledgerState' || !acknowledgement?.point) {
          throw new Error(
            'OGMIOS_LEDGER_STATE_ACQUIRE_ACK_MALFORMED: ' +
            JSON.stringify(acknowledgement),
          )
        }

        const actualPoint = normalizeLedgerPoint(
          acknowledgement.point,
          'OGMIOS_ACQUIRED_POINT',
        )
        if (actualPoint.slot !== requestedPoint.slot ||
            actualPoint.hash !== requestedPoint.hash) {
          throw new Error(
            'OGMIOS_ACQUIRED_POINT_MISMATCH: ' +
            JSON.stringify({ requested: requestedPoint, acquired: actualPoint }),
          )
        }

        acquiredPoint = { slot: actualPoint.slot, id: actualPoint.hash }
        return { ...acquiredPoint }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        if (acquired) throw error
        if (attempt < maxAcquireAttempts) {
          await sleep(retryDelayMs(attempt))
        }
      }
    }

    throw new Error(
      'OGMIOS_LEDGER_STATE_ACQUIRE_FAILED_AFTER_' +
      maxAcquireAttempts + '_ATTEMPTS: ' + lastError,
    )
  }

  async function query(method, params = {}) {
    if (!acquired || released || !acquiredPoint) {
      throw new Error('OGMIOS_LEDGER_STATE_QUERY_OUTSIDE_ACQUIRED_SESSION')
    }
    return rpc(method, params)
  }

  async function release() {
    if (!acquired || released) return false
    // Close the query gate before awaiting the network release. A failed
    // release is surfaced and must never be represented as a successful close.
    released = true
    await rpc('releaseLedgerState')
    return true
  }

  return {
    acquire,
    query,
    release,
    get isAcquired() { return acquired },
    get isReleased() { return released },
    get point() { return acquiredPoint ? { ...acquiredPoint } : null },
  }
}
