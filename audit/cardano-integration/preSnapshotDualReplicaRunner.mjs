import { access, mkdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  createPreSnapshotJournal,
  createPersistentOgmiosV7ChainSyncClient,
  openPreSnapshotJournal
} from './preSnapshotJournal.mjs'
import { comparePreSnapshotReplicaStates } from './preSnapshotReplicaConformance.mjs'

function fail(code) {
  throw Object.assign(new Error(code), { code })
}

function validPoint(point, name) {
  if (!point || typeof point !== 'object' ||
      !Number.isSafeInteger(point.slot) || point.slot < 0 ||
      !Number.isSafeInteger(point.blockNo) || point.blockNo < 0 ||
      typeof point.hash !== 'string' || !/^[0-9a-f]{64}$/.test(point.hash)) {
    fail('DUAL_REPLICA_INVALID_POINT:' + name)
  }
}

function validateLocalOgmiosUrl(value, name) {
  let url
  try {
    url = new URL(value)
  } catch (_) {
    fail('DUAL_REPLICA_INVALID_OGMIOS_URL:' + name)
  }
  const host = url.hostname.toLowerCase()
  const loopback = host === 'localhost' || host === '127.0.0.1' ||
    host === '::1' || host === '[::1]'
  if (url.protocol !== 'ws:' || !loopback || !url.port ||
      url.username || url.password || url.search || url.hash) {
    fail('DUAL_REPLICA_OGMIOS_MUST_BE_LOCAL_LOOPBACK_WS:' + name)
  }
  return url.toString()
}

/**
 * Validate a two-local-node run configuration before creating journals or
 * opening sockets. Node instance IDs are operator-supplied labels, not
 * cryptographic attestations of physical/process independence.
 */
export function validatePreSnapshotDualReplicaConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    fail('DUAL_REPLICA_CONFIG_REQUIRED')
  }
  if (typeof config.networkId !== 'string' || config.networkId.trim().length === 0) {
    fail('DUAL_REPLICA_NETWORK_ID_REQUIRED')
  }
  if (!config.asset || typeof config.asset.policyIdHex !== 'string' ||
      !/^[0-9a-f]{56}$/.test(config.asset.policyIdHex) ||
      typeof config.asset.assetNameHex !== 'string' ||
      !/^(?:[0-9a-f]{2}){0,32}$/.test(config.asset.assetNameHex)) {
    fail('DUAL_REPLICA_ASSET_INVALID')
  }
  validPoint(config.anchorPoint, 'anchorPoint')
  validPoint(config.expectedPoint, 'expectedPoint')
  if (config.initialUtxos !== undefined && !Array.isArray(config.initialUtxos)) {
    fail('DUAL_REPLICA_INITIAL_UTXOS_INVALID')
  }
  const timeoutMs = config.timeoutMs ?? 120000
  const pollIntervalMs = config.pollIntervalMs ?? 250
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 3600000) {
    fail('DUAL_REPLICA_TIMEOUT_INVALID')
  }
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 50 || pollIntervalMs > 5000) {
    fail('DUAL_REPLICA_POLL_INTERVAL_INVALID')
  }
  if (!Array.isArray(config.replicas) || config.replicas.length !== 2) {
    fail('DUAL_REPLICA_EXACTLY_TWO_REPLICAS_REQUIRED')
  }

  const replicas = config.replicas.map((replica, index) => {
    const label = index === 0 ? 'A' : 'B'
    if (!replica || typeof replica !== 'object' || Array.isArray(replica)) {
      fail('DUAL_REPLICA_ENTRY_INVALID:' + label)
    }
    if (typeof replica.id !== 'string' || replica.id.trim().length === 0) {
      fail('DUAL_REPLICA_ID_REQUIRED:' + label)
    }
    if (typeof replica.nodeInstanceId !== 'string' || replica.nodeInstanceId.trim().length === 0) {
      fail('DUAL_REPLICA_NODE_INSTANCE_ID_REQUIRED:' + label)
    }
    if (typeof replica.journalDirectory !== 'string' || replica.journalDirectory.trim().length === 0) {
      fail('DUAL_REPLICA_JOURNAL_DIRECTORY_REQUIRED:' + label)
    }
    return Object.freeze({
      id: replica.id,
      nodeInstanceId: replica.nodeInstanceId,
      url: validateLocalOgmiosUrl(replica.url, label),
      journalDirectory: resolve(replica.journalDirectory)
    })
  })

  if (replicas[0].id === replicas[1].id) fail('DUAL_REPLICA_IDS_NOT_DISTINCT')
  if (replicas[0].nodeInstanceId === replicas[1].nodeInstanceId) {
    fail('DUAL_REPLICA_NODE_INSTANCE_IDS_NOT_DISTINCT')
  }
  if (replicas[0].url === replicas[1].url) fail('DUAL_REPLICA_OGMIOS_URLS_NOT_DISTINCT')
  if (replicas[0].journalDirectory === replicas[1].journalDirectory) {
    fail('DUAL_REPLICA_JOURNAL_DIRECTORIES_NOT_DISTINCT')
  }

  return Object.freeze({
    networkId: config.networkId,
    asset: Object.freeze({
      policyIdHex: config.asset.policyIdHex,
      assetNameHex: config.asset.assetNameHex
    }),
    anchorPoint: Object.freeze({
      slot: config.anchorPoint.slot,
      blockNo: config.anchorPoint.blockNo,
      hash: config.anchorPoint.hash
    }),
    expectedPoint: Object.freeze({
      slot: config.expectedPoint.slot,
      blockNo: config.expectedPoint.blockNo,
      hash: config.expectedPoint.hash
    }),
    initialUtxos: config.initialUtxos ?? [],
    timeoutMs,
    pollIntervalMs,
    replicas: Object.freeze(replicas)
  })
}

async function manifestExists(directory) {
  try {
    await access(join(directory, 'manifest.json'))
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

async function openOrCreateJournal(config, replica) {
  await mkdir(replica.journalDirectory, { recursive: true })
  if (await manifestExists(replica.journalDirectory)) {
    return openPreSnapshotJournal({ directory: replica.journalDirectory })
  }
  return createPreSnapshotJournal({
    directory: replica.journalDirectory,
    networkId: config.networkId,
    asset: config.asset,
    anchorPoint: config.anchorPoint,
    utxos: config.initialUtxos
  })
}

function wait(milliseconds) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds))
}

/**
 * Read-only dual local-Ogmios runner. It opens independent WAL directories,
 * starts both ChainSync clients, and compares each index at the externally
 * supplied expectedPoint. It never signs, submits, chooses a point or writes
 * to a Cardano node. A WAITING timeout is not a PASS.
 */
export async function runPreSnapshotDualReplicaConformance(configValue) {
  const config = validatePreSnapshotDualReplicaConfig(configValue)
  const journals = []
  const clients = []
  const observedErrors = new Map()
  let report = null

  try {
    for (const replica of config.replicas) {
      const journal = await openOrCreateJournal(config, replica)
      journals.push(journal)
      const client = createPersistentOgmiosV7ChainSyncClient({
        journal,
        url: replica.url,
        reconnectDelayMs: 1000,
        onError: error => observedErrors.set(replica.id, {
          code: error?.code ?? 'OGMIOS_UNKNOWN_ERROR',
          message: error?.message ?? String(error),
          fatal: error?.fatal === true
        })
      })
      clients.push(client)
    }

    const runningPromises = clients.map(client =>
      client.start().catch(() => {})
    )
    const deadline = Date.now() + config.timeoutMs
    let comparison = null

    while (Date.now() < deadline) {
      const [stateA, stateB] = await Promise.all([
        journals[0].getState(),
        journals[1].getState()
      ])
      comparison = comparePreSnapshotReplicaStates({
        replicaA: { id: config.replicas[0].id, state: stateA },
        replicaB: { id: config.replicas[1].id, state: stateB },
        expectedNetworkId: config.networkId,
        expectedAsset: config.asset,
        expectedPoint: config.expectedPoint
      })

      if (comparison.status !== 'WAITING') break

      const fatalIndex = clients.findIndex(client =>
        !client.isRunning && client.lastError?.fatal === true
      )
      if (fatalIndex >= 0) {
        const replica = config.replicas[fatalIndex]
        const error = observedErrors.get(replica.id) ?? {
          code: 'OGMIOS_FATAL_ERROR',
          message: clients[fatalIndex].lastError?.message ?? 'Fatal ChainSync error'
        }
        report = Object.freeze({
          status: 'FAIL',
          code: 'DUAL_REPLICA_OGMIOS_FATAL:' + replica.id,
          comparison,
          error
        })
        break
      }
      await wait(config.pollIntervalMs)
    }

    if (!report) {
      if (!comparison || comparison.status === 'WAITING') {
        report = Object.freeze({
          status: 'WAITING',
          code: 'DUAL_REPLICA_CONFORMANCE_TIMEOUT',
          comparison
        })
      } else {
        report = comparison
      }
    }

    await Promise.all(clients.map(client => client.stop()))
    // Re-read after stopping to make the reported comparison a stable local view.
    if (report.status === 'PASS' || report.status === 'FAIL') {
      const [stateA, stateB] = await Promise.all([
        journals[0].getState(),
        journals[1].getState()
      ])
      const finalComparison = comparePreSnapshotReplicaStates({
        replicaA: { id: config.replicas[0].id, state: stateA },
        replicaB: { id: config.replicas[1].id, state: stateB },
        expectedNetworkId: config.networkId,
        expectedAsset: config.asset,
        expectedPoint: config.expectedPoint
      })
      if (finalComparison.status !== 'WAITING') report = finalComparison
    }

    return report
  } finally {
    await Promise.all(clients.map(client => client.stop().catch(() => {})))
    await Promise.all(journals.map(journal => journal.close().catch(() => {})))
  }
}

async function main() {
  const configPath = process.argv[2]
  if (!configPath) fail('USAGE: node preSnapshotDualReplicaRunner.mjs <config.json>')
  const config = JSON.parse(await readFile(resolve(configPath), 'utf8'))
  const result = await runPreSnapshotDualReplicaConformance(config)
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  if (result.status !== 'PASS') process.exitCode = 1
}

if (process.argv[1] &&
    pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write((error.code ?? 'DUAL_REPLICA_RUNNER_ERROR') + ': ' + error.message + '\n')
    process.exitCode = 1
  })
}
