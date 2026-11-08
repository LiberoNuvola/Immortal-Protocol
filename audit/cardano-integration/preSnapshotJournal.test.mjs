import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, appendFile, stat, rm, access, writeFile } from 'node:fs/promises'
import { tmpdir, hostname } from 'node:os'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'

import {
  createPersistentOgmiosIndexHandlers,
  createPersistentOgmiosV7ChainSyncClient,
  createPreSnapshotJournal,
  openPreSnapshotJournal
} from './preSnapshotJournal.mjs'
import { PRE_SNAPSHOT_ORIGIN_POINT } from './preSnapshotUtxoIndex.mjs'

const asset = {
  policyIdHex: 'ab'.repeat(28),
  assetNameHex: Buffer.from('PRE').toString('hex')
}
const addressA = '01aa'
const addressB = '02bb'
const origin = PRE_SNAPSHOT_ORIGIN_POINT
const pointOne = { slot: 1, blockNo: 0, hash: '11'.repeat(32) }
const pointTwo = { slot: 2, blockNo: 1, hash: '22'.repeat(32) }
const txIn = { txId: '10'.repeat(32), index: 0 }
const bootstrap = [{
  ...txIn,
  addressHex: addressA,
  assets: [{ ...asset, quantity: '100' }]
}]
const output = (addressHex, quantity) => ({
  addressHex,
  assets: [{ ...asset, quantity: String(quantity) }]
})
const transferBlock = {
  parentPoint: origin,
  point: pointOne,
  transactions: [{
    id: '20'.repeat(32),
    spends: 'inputs',
    inputs: [txIn],
    collaterals: [],
    outputs: [output(addressA, 40), output(addressB, 60)],
    collateralReturn: null,
    mint: []
  }]
}
const nextBlock = {
  parentPoint: pointOne,
  point: pointTwo,
  transactions: [{
    id: '30'.repeat(32),
    spends: 'inputs',
    inputs: [{ txId: '20'.repeat(32), index: 1 }],
    collaterals: [],
    outputs: [output(addressB, 60)],
    collateralReturn: null,
    mint: []
  }]
}

async function withDirectory(run) {
  const directory = await mkdtemp(join(tmpdir(), 'immortal-pre-wal-'))
  try {
    await run(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

async function create(directory) {
  return createPreSnapshotJournal({
    directory,
    networkId: 'cardano-private-testnet-m1',
    asset,
    anchorPoint: origin,
    utxos: bootstrap
  })
}

test('journal fsyncs block events and recovers the exact reducer state after reopen', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    await journal.applyBlock(transferBlock)
    const status = await journal.getStatus()
    assert.equal(status.sequence, 1)
    assert.equal(status.currentPoint.hash, pointOne.hash)
    assert.equal(status.totalQuantity, '100')
    await journal.close()

    const recovered = await openPreSnapshotJournal({ directory })
    const state = await recovered.getState()
    const recoveredStatus = await recovered.getStatus()
    assert.equal(state.currentPoint.hash, pointOne.hash)
    assert.equal(recoveredStatus.sequence, 1)
    assert.equal(recoveredStatus.lastHash, status.lastHash)
    assert.equal(recoveredStatus.totalQuantity, '100')
    await recovered.close()
  })
})

test('rollback is a journal event and alternate branch survives a restart', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    await journal.applyBlock(transferBlock)
    await journal.applyBlock(nextBlock)
    await journal.rollback(pointOne)
    const rolled = await journal.getState()
    assert.equal(rolled.currentPoint.hash, pointOne.hash)
    await journal.close()

    const reopened = await openPreSnapshotJournal({ directory })
    const status = await reopened.getStatus()
    assert.equal(status.sequence, 3)
    assert.equal(status.currentPoint.hash, pointOne.hash)
    const branchB = {
      parentPoint: pointOne,
      point: { slot: 3, blockNo: 1, hash: '33'.repeat(32) },
      transactions: [{
        id: '40'.repeat(32),
        spends: 'inputs',
        inputs: [{ txId: '20'.repeat(32), index: 1 }],
        collaterals: [],
        outputs: [output(addressB, 60)],
        collateralReturn: null,
        mint: []
      }]
    }
    await reopened.applyBlock(branchB)
    assert.equal((await reopened.getStatus()).totalQuantity, '100')
    await reopened.close()

    const finalOpen = await openPreSnapshotJournal({ directory })
    assert.equal((await finalOpen.getStatus()).currentPoint.hash, branchB.point.hash)
    assert.equal((await finalOpen.getStatus()).sequence, 4)
    await finalOpen.close()
  })
})

test('only an incomplete final line is truncated during crash recovery', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    await journal.applyBlock(transferBlock)
    await journal.close()
    const logPath = join(directory, 'journal.ndjson')
    const validSize = (await stat(logPath)).size
    await appendFile(logPath, '{"sequence":2,"previousHash":"partial"', 'utf8')
    const recovered = await openPreSnapshotJournal({ directory })
    assert.equal((await stat(logPath)).size, validSize)
    assert.equal((await recovered.getStatus()).sequence, 1)
    await recovered.close()
  })
})

test('a complete but corrupted journal record fails closed and releases writer lock', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    await journal.applyBlock(transferBlock)
    await journal.close()
    const logPath = join(directory, 'journal.ndjson')
    const original = await readFile(logPath, 'utf8')
    const record = JSON.parse(original.trim())
    record.hash = (record.hash[0] === '0' ? '1' : '0') + record.hash.slice(1)
    const corrupted = JSON.stringify(record) + '\n'
    assert.notEqual(corrupted, original)
    await writeFile(logPath, corrupted, 'utf8')

    await assert.rejects(
      openPreSnapshotJournal({ directory }),
      /PRE_SNAPSHOT_JOURNAL_RECORD_DIGEST_MISMATCH/
    )
    await access(join(directory, 'writer.lock')).then(
      () => assert.fail('writer lock should be released after failed recovery'),
      error => assert.equal(error.code, 'ENOENT')
    )
  })
})

test('invalid block transition is not appended and does not advance the cursor', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    const invalid = {
      ...transferBlock,
      point: { ...pointOne, blockNo: 2 }
    }
    await assert.rejects(journal.applyBlock(invalid), /BLOCK_SEQUENCE_MISMATCH/)
    const status = await journal.getStatus()
    assert.equal(status.sequence, 0)
    assert.equal(status.currentPoint.hash, origin.hash)
    await journal.close()
    const reopened = await openPreSnapshotJournal({ directory })
    assert.equal((await reopened.getStatus()).sequence, 0)
    await reopened.close()
  })
})

test('single-writer lock rejects a second process opening the same journal', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    await assert.rejects(
      openPreSnapshotJournal({ directory }),
      /Another writer holds this PRE snapshot journal/
    )
    await journal.close()
    const reopened = await openPreSnapshotJournal({ directory })
    await reopened.close()
  })
})

test('ChainSync callbacks resolve only after persistent forward/rollback commits', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    const handlers = createPersistentOgmiosIndexHandlers(journal)
    assert.equal((await handlers.getIndexState()).currentPoint.hash, origin.hash)
    await handlers.onRollForward(transferBlock)
    assert.equal((await handlers.getIndexState()).currentPoint.hash, pointOne.hash)
    await handlers.onRollBackward(origin)
    assert.equal((await handlers.getIndexState()).currentPoint.hash, origin.hash)
    assert.equal((await journal.getStatus()).sequence, 2)
    await journal.close()
  })
})

test('stale writer lock from a terminated local process is reclaimed automatically', async () => {
  await withDirectory(async directory => {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
    await once(child, 'spawn')
    const deadPid = child.pid
    child.kill()
    await once(child, 'exit')

    await writeFile(join(directory, 'writer.lock'), JSON.stringify({
      format: 'immortal-pre-snapshot-wal-v1',
      pid: deadPid,
      hostname: hostname(),
      startedAt: new Date().toISOString()
    }) + '\n', { mode: 0o600 })

    const journal = await create(directory)
    assert.equal((await journal.getStatus()).sequence, 0)
    await journal.close()
    await access(join(directory, 'writer.lock')).then(
      () => assert.fail('writer lock should be removed after close'),
      error => assert.equal(error.code, 'ENOENT')
    )
  })
})

test('a foreign-host or unverifiable writer lock is not removed', async () => {
  await withDirectory(async directory => {
    const lockPath = join(directory, 'writer.lock')
    await writeFile(lockPath, JSON.stringify({
      format: 'immortal-pre-snapshot-wal-v1',
      pid: 999999,
      hostname: 'not-this-host',
      startedAt: new Date().toISOString()
    }) + '\n', { mode: 0o600 })
    await assert.rejects(create(directory), /writer lock owner cannot be verified/)
    await access(lockPath)
  })
})

test('persistent ChainSync factory binds journal callbacks without exposing an alternate state writer', async () => {
  await withDirectory(async directory => {
    const journal = await create(directory)
    const client = createPersistentOgmiosV7ChainSyncClient({
      journal,
      url: 'ws://127.0.0.1:1337',
      reconnectDelayMs: 10
    })
    assert.equal(client.isRunning, false)
    assert.equal(client.lastError, null)
    await journal.close()
  })
})
