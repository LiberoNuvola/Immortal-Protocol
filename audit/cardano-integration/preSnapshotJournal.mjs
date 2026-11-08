import {
  open,
  mkdir,
  readFile,
  rename,
  unlink,
  truncate,
  stat
} from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { hostname } from 'node:os'

import { createOgmiosV7ChainSyncClient } from './ogmiosV7ChainSyncClient.mjs'

import {
  PRE_SNAPSHOT_INDEX_SCHEMA_VERSION,
  applyPreSnapshotBlock,
  createPreSnapshotIndex,
  inspectPreSnapshotIndex,
  rollbackPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'

export const PRE_SNAPSHOT_JOURNAL_FORMAT = 'immortal-pre-snapshot-wal-v1'

function fail(code, message = code) {
  const error = new Error(message)
  error.code = code
  throw error
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value) {
  // All journal fields are authored in a fixed insertion order. Reject unsupported
  // values (including BigInt) rather than allowing non-deterministic coercion.
  const json = JSON.stringify(value)
  if (typeof json !== 'string') fail('JOURNAL_VALUE_NOT_SERIALIZABLE')
  return json
}

function manifestPayload({ networkId, asset, anchorPoint, utxos }) {
  return {
    format: PRE_SNAPSHOT_JOURNAL_FORMAT,
    reducerSchemaVersion: PRE_SNAPSHOT_INDEX_SCHEMA_VERSION,
    networkId,
    asset,
    anchorPoint,
    utxos
  }
}

function pointEqual(left, right) {
  return left.slot === right.slot &&
    left.blockNo === right.blockNo &&
    left.hash === right.hash
}

async function syncDirectory(path) {
  // Node does not expose a portable directory-handle fsync on Windows.
  // Journal file contents are still fsynced; Linux/macOS also sync directory entries.
  if (process.platform === 'win32') return
  const handle = await open(path, 'r')
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}

async function writeAtomicFile(path, content) {
  const temporaryPath = path + '.tmp-' + process.pid + '-' + createHash('sha256')
    .update(String(Date.now()) + Math.random().toString())
    .digest('hex').slice(0, 12)
  const handle = await open(temporaryPath, 'wx', 0o600)
  try {
    await handle.writeFile(content, 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }
  await rename(temporaryPath, path)
  await syncDirectory(dirname(path))
}

async function reclaimStaleWriterLock(directory, lockPath) {
  const reaperPath = lockPath + '.reaper'
  let reaper
  try {
    reaper = await open(reaperPath, 'wx', 0o600)
  } catch (error) {
    if (error && error.code === 'EEXIST') {
      fail('PRE_SNAPSHOT_JOURNAL_LOCK_RECOVERY_BUSY', 'Another process is checking the journal writer lock')
    }
    throw error
  }

  try {
    let metadata
    try {
      metadata = JSON.parse(await readFile(lockPath, 'utf8'))
    } catch (_) {
      fail('PRE_SNAPSHOT_JOURNAL_LOCK_UNVERIFIABLE', 'The writer lock is unreadable; manual inspection is required')
    }
    if (!metadata || metadata.format !== PRE_SNAPSHOT_JOURNAL_FORMAT ||
        !Number.isSafeInteger(metadata.pid) || metadata.pid <= 0 ||
        metadata.hostname !== hostname()) {
      fail('PRE_SNAPSHOT_JOURNAL_LOCK_UNVERIFIABLE', 'The writer lock owner cannot be verified on this host')
    }

    try {
      process.kill(metadata.pid, 0)
      fail('PRE_SNAPSHOT_JOURNAL_LOCKED', 'Another live process holds this PRE snapshot journal')
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }

    await unlink(lockPath)
    await syncDirectory(directory)
  } finally {
    await reaper.close().catch(() => {})
    await unlink(reaperPath).catch(() => {})
    await syncDirectory(directory)
  }
}

async function acquireWriterLock(directory) {
  const lockPath = join(directory, 'writer.lock')
  let handle
  try {
    handle = await open(lockPath, 'wx', 0o600)
  } catch (error) {
    if (!error || error.code !== 'EEXIST') throw error
    await reclaimStaleWriterLock(directory, lockPath)
    try {
      handle = await open(lockPath, 'wx', 0o600)
    } catch (retryError) {
      if (retryError && retryError.code === 'EEXIST') {
        fail('PRE_SNAPSHOT_JOURNAL_LOCKED', 'Another writer acquired this PRE snapshot journal')
      }
      throw retryError
    }
  }
  try {
    await handle.writeFile(canonicalJson({
      format: PRE_SNAPSHOT_JOURNAL_FORMAT,
      pid: process.pid,
      hostname: hostname(),
      startedAt: new Date().toISOString()
    }) + '\n', 'utf8')
    await handle.sync()
    await syncDirectory(directory)
  } catch (error) {
    await handle.close().catch(() => {})
    await unlink(lockPath).catch(() => {})
    throw error
  }
  return {
    async release() {
      await handle.close()
      await unlink(lockPath).catch(error => {
        if (error.code !== 'ENOENT') throw error
      })
      await syncDirectory(directory)
    }
  }
}

function recordBody(sequence, previousHash, event) {
  return {
    sequence,
    previousHash,
    event
  }
}

function hashRecord(body) {
  return sha256Hex(Buffer.from(canonicalJson(body), 'utf8'))
}

function createRecord(sequence, previousHash, event) {
  const body = recordBody(sequence, previousHash, event)
  return {
    ...body,
    hash: hashRecord(body)
  }
}

function normalizeJournalEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    fail('PRE_SNAPSHOT_JOURNAL_INVALID_EVENT')
  }
  if (event.type === 'block') {
    if (!event.block || typeof event.block !== 'object') fail('PRE_SNAPSHOT_JOURNAL_INVALID_BLOCK_EVENT')
    return { type: 'block', block: event.block }
  }
  if (event.type === 'rollback') {
    const point = event.point
    if (!point || typeof point !== 'object' ||
        !Number.isSafeInteger(point.slot) ||
        !Number.isSafeInteger(point.blockNo) ||
        typeof point.hash !== 'string') {
      fail('PRE_SNAPSHOT_JOURNAL_INVALID_ROLLBACK_EVENT')
    }
    return {
      type: 'rollback',
      point: {
        slot: point.slot,
        blockNo: point.blockNo,
        hash: point.hash
      }
    }
  }
  fail('PRE_SNAPSHOT_JOURNAL_UNKNOWN_EVENT')
}

function applyJournalEvent(state, event) {
  if (event.type === 'block') return applyPreSnapshotBlock(state, event.block)
  if (event.type === 'rollback') return rollbackPreSnapshotIndex(state, event.point)
  fail('PRE_SNAPSHOT_JOURNAL_UNKNOWN_EVENT')
}

async function readManifest(path) {
  let raw
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') fail('PRE_SNAPSHOT_JOURNAL_MANIFEST_MISSING')
    throw error
  }
  let envelope
  try {
    envelope = JSON.parse(raw)
  } catch (_) {
    fail('PRE_SNAPSHOT_JOURNAL_MANIFEST_INVALID_JSON')
  }
  if (!envelope || envelope.format !== PRE_SNAPSHOT_JOURNAL_FORMAT ||
      !envelope.payload || typeof envelope.digest !== 'string') {
    fail('PRE_SNAPSHOT_JOURNAL_MANIFEST_INVALID')
  }
  const expectedDigest = sha256Hex(Buffer.from(canonicalJson(envelope.payload), 'utf8'))
  if (envelope.digest !== expectedDigest) fail('PRE_SNAPSHOT_JOURNAL_MANIFEST_DIGEST_MISMATCH')
  const payload = envelope.payload
  if (payload.reducerSchemaVersion !== PRE_SNAPSHOT_INDEX_SCHEMA_VERSION) {
    fail('PRE_SNAPSHOT_JOURNAL_UNSUPPORTED_REDUCER_SCHEMA')
  }
  return payload
}

async function replayJournal(path, initialState) {
  let bytes
  try {
    bytes = await readFile(path)
  } catch (error) {
    if (error.code === 'ENOENT') fail('PRE_SNAPSHOT_JOURNAL_LOG_MISSING')
    throw error
  }

  // A final fragment without '\n' is an interrupted append and may be truncated.
  // A malformed newline-terminated record is corruption and must never be skipped.
  const finalNewline = bytes.lastIndexOf(0x0a)
  if (bytes.length > 0 && finalNewline !== bytes.length - 1) {
    const safeLength = finalNewline + 1
    await truncate(path, safeLength)
    const journalHandle = await open(path, 'r+')
    try {
      await journalHandle.sync()
    } finally {
      await journalHandle.close()
    }
    bytes = bytes.subarray(0, safeLength)
  }

  const text = bytes.toString('utf8')
  const lines = text.length === 0 ? [] : text.slice(0, -1).split('\n')
  let state = initialState
  let expectedSequence = 1
  let previousHash = '0'.repeat(64)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.length === 0) fail('PRE_SNAPSHOT_JOURNAL_EMPTY_RECORD:' + (index + 1))
    let record
    try {
      record = JSON.parse(line)
    } catch (_) {
      fail('PRE_SNAPSHOT_JOURNAL_INVALID_RECORD_JSON:' + (index + 1))
    }
    if (!record || record.sequence !== expectedSequence ||
        record.previousHash !== previousHash ||
        typeof record.hash !== 'string' ||
        !record.event || typeof record.event !== 'object') {
      fail('PRE_SNAPSHOT_JOURNAL_CHAIN_MISMATCH:' + (index + 1))
    }
    const body = recordBody(record.sequence, record.previousHash, record.event)
    if (record.hash !== hashRecord(body)) {
      fail('PRE_SNAPSHOT_JOURNAL_RECORD_DIGEST_MISMATCH:' + (index + 1))
    }
    const event = normalizeJournalEvent(record.event)
    try {
      state = applyJournalEvent(state, event)
    } catch (error) {
      fail(
        'PRE_SNAPSHOT_JOURNAL_REPLAY_FAILED:' + (index + 1),
        'Journal replay failed at record ' + (index + 1) + ': ' + error.message
      )
    }
    previousHash = record.hash
    expectedSequence += 1
  }

  return {
    state,
    sequence: expectedSequence - 1,
    lastHash: previousHash,
    recordCount: expectedSequence - 1
  }
}

async function createInitialFiles(directory, config) {
  const manifestPath = join(directory, 'manifest.json')
  const journalPath = join(directory, 'journal.ndjson')
  const payload = manifestPayload(config)
  const envelope = {
    format: PRE_SNAPSHOT_JOURNAL_FORMAT,
    payload,
    digest: sha256Hex(Buffer.from(canonicalJson(payload), 'utf8'))
  }
  await writeAtomicFile(manifestPath, canonicalJson(envelope) + '\n')
  const journalHandle = await open(journalPath, 'wx', 0o600)
  try {
    await journalHandle.sync()
  } finally {
    await journalHandle.close()
  }
  await syncDirectory(directory)
  return { manifestPath, journalPath }
}

async function openExistingFiles(directory) {
  const manifestPath = join(directory, 'manifest.json')
  const journalPath = join(directory, 'journal.ndjson')
  const payload = await readManifest(manifestPath)
  const initialState = createPreSnapshotIndex({
    networkId: payload.networkId,
    asset: payload.asset,
    anchorPoint: payload.anchorPoint,
    utxos: payload.utxos
  })
  const replayed = await replayJournal(journalPath, initialState)
  return {
    manifestPath,
    journalPath,
    initialState,
    ...replayed
  }
}

export async function createPreSnapshotJournal({
  directory,
  networkId,
  asset,
  anchorPoint,
  utxos = []
}) {
  if (typeof directory !== 'string' || directory.length === 0) fail('PRE_SNAPSHOT_JOURNAL_DIRECTORY_REQUIRED')
  await mkdir(directory, { recursive: true })
  const lock = await acquireWriterLock(directory)
  let files
  try {
    const manifestPath = join(directory, 'manifest.json')
    const journalPath = join(directory, 'journal.ndjson')
    const existing = await Promise.all([
      stat(manifestPath).then(() => true).catch(error => error.code === 'ENOENT' ? false : Promise.reject(error)),
      stat(journalPath).then(() => true).catch(error => error.code === 'ENOENT' ? false : Promise.reject(error))
    ])
    if (existing.some(Boolean)) fail('PRE_SNAPSHOT_JOURNAL_ALREADY_EXISTS')
    const initialState = createPreSnapshotIndex({ networkId, asset, anchorPoint, utxos })
    const initial = {
      networkId,
      asset: initialState.asset,
      anchorPoint: initialState.anchorPoint,
      utxos: utxos.map(entry => ({
        txId: entry.txId,
        index: entry.index,
        addressHex: entry.addressHex,
        assets: entry.assets.map(assetEntry => ({
          policyIdHex: assetEntry.policyIdHex,
          assetNameHex: assetEntry.assetNameHex,
          quantity: String(assetEntry.quantity)
        }))
      }))
    }
    files = await createInitialFiles(directory, initial)
    let state = initialState
    let sequence = 0
    let lastHash = '0'.repeat(64)
    let closed = false
    let poisoned = false
    let queue = Promise.resolve()

    const appendEvent = async eventValue => {
      if (closed) fail('PRE_SNAPSHOT_JOURNAL_CLOSED')
      if (poisoned) fail('PRE_SNAPSHOT_JOURNAL_POISONED')
      const event = normalizeJournalEvent(eventValue)
      const nextState = applyJournalEvent(state, event)
      const record = createRecord(sequence + 1, lastHash, event)
      const line = canonicalJson(record) + '\n'
      let handle
      try {
        handle = await open(files.journalPath, 'a', 0o600)
        await handle.writeFile(line, 'utf8')
        await handle.sync()
      } catch (error) {
        poisoned = true
        throw error
      } finally {
        if (handle) await handle.close().catch(() => {})
      }
      state = nextState
      sequence += 1
      lastHash = record.hash
      return state
    }

    const enqueue = operation => {
      const result = queue.then(operation)
      queue = result.catch(() => {})
      return result
    }

    return Object.freeze({
      directory,
      manifestPath: files.manifestPath,
      journalPath: files.journalPath,
      async getState() {
        if (closed) fail('PRE_SNAPSHOT_JOURNAL_CLOSED')
        return state
      },
      async applyBlock(block) {
        const detachedBlock = JSON.parse(canonicalJson(block))
        return enqueue(() => appendEvent({ type: 'block', block: detachedBlock }))
      },
      async rollback(point) {
        const detachedPoint = JSON.parse(canonicalJson(point))
        return enqueue(() => appendEvent({ type: 'rollback', point: detachedPoint }))
      },
      async getStatus() {
        return Object.freeze({
          closed,
          poisoned,
          sequence,
          lastHash,
          currentPoint: state.currentPoint,
          utxoCount: inspectPreSnapshotIndex(state).utxoCount,
          totalQuantity: inspectPreSnapshotIndex(state).totalQuantity
        })
      },
      async close() {
        if (closed) return
        await queue
        closed = true
        await lock.release()
      }
    })
  } catch (error) {
    await lock.release().catch(() => {})
    throw error
  }
}

export async function openPreSnapshotJournal({ directory }) {
  if (typeof directory !== 'string' || directory.length === 0) fail('PRE_SNAPSHOT_JOURNAL_DIRECTORY_REQUIRED')
  const lock = await acquireWriterLock(directory)
  try {
    const existing = await openExistingFiles(directory)
    let state = existing.state
    let sequence = existing.sequence
    let lastHash = existing.lastHash
    let closed = false
    let poisoned = false
    let queue = Promise.resolve()

    const appendEvent = async eventValue => {
      if (closed) fail('PRE_SNAPSHOT_JOURNAL_CLOSED')
      if (poisoned) fail('PRE_SNAPSHOT_JOURNAL_POISONED')
      const event = normalizeJournalEvent(eventValue)
      const nextState = applyJournalEvent(state, event)
      const record = createRecord(sequence + 1, lastHash, event)
      const line = canonicalJson(record) + '\n'
      let handle
      try {
        handle = await open(existing.journalPath, 'a', 0o600)
        await handle.writeFile(line, 'utf8')
        await handle.sync()
      } catch (error) {
        poisoned = true
        throw error
      } finally {
        if (handle) await handle.close().catch(() => {})
      }
      state = nextState
      sequence += 1
      lastHash = record.hash
      return state
    }

    const enqueue = operation => {
      const result = queue.then(operation)
      queue = result.catch(() => {})
      return result
    }

    return Object.freeze({
      directory,
      manifestPath: existing.manifestPath,
      journalPath: existing.journalPath,
      async getState() {
        if (closed) fail('PRE_SNAPSHOT_JOURNAL_CLOSED')
        return state
      },
      async applyBlock(block) {
        return enqueue(() => appendEvent({ type: 'block', block }))
      },
      async rollback(point) {
        return enqueue(() => appendEvent({ type: 'rollback', point }))
      },
      async getStatus() {
        return Object.freeze({
          closed,
          poisoned,
          sequence,
          lastHash,
          currentPoint: state.currentPoint,
          utxoCount: inspectPreSnapshotIndex(state).utxoCount,
          totalQuantity: inspectPreSnapshotIndex(state).totalQuantity
        })
      },
      async close() {
        if (closed) return
        await queue
        closed = true
        await lock.release()
      }
    })
  } catch (error) {
    await lock.release().catch(() => {})
    throw error
  }
}

/**
 * Directly usable ChainSync callbacks. Each callback resolves only after its
 * journal event has been fsynced and made the current in-memory state.
 */
export function createPersistentOgmiosIndexHandlers(journal) {
  if (!journal || typeof journal.getState !== 'function' ||
      typeof journal.applyBlock !== 'function' || typeof journal.rollback !== 'function') {
    fail('PRE_SNAPSHOT_JOURNAL_HANDLERS_INVALID')
  }
  return Object.freeze({
    getIndexState: () => journal.getState(),
    onIntersection: async point => {
      const state = await journal.getState()
      if (!pointEqual(state.currentPoint, point)) {
        await journal.rollback(point)
      }
    },
    onRollForward: async normalizedBlock => {
      await journal.applyBlock(normalizedBlock)
    },
    onRollBackward: async point => {
      await journal.rollback(point)
    }
  })
}

/**
 * Build a live ChainSync client whose callbacks commit exclusively through the WAL.
 * The supplied client options must include url and may include WebSocket options,
 * reconnect settings and onError.
 */
export function createPersistentOgmiosV7ChainSyncClient({ journal, ...clientOptions }) {
  const handlers = createPersistentOgmiosIndexHandlers(journal)
  const observerOnIntersection = clientOptions.onIntersection
  return createOgmiosV7ChainSyncClient({
    ...clientOptions,
    ...handlers,
    onIntersection: async (point, tip) => {
      await handlers.onIntersection(point, tip)
      if (typeof observerOnIntersection === 'function') {
        await observerOnIntersection(point, tip)
      }
    }
  })
}
