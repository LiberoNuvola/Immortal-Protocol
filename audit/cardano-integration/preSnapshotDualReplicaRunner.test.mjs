import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isPreSnapshotRemoteTipAtOrAfterTarget,
  validatePreSnapshotDualReplicaConfig
} from './preSnapshotDualReplicaRunner.mjs'

const asset = {
  policyIdHex: 'ab'.repeat(28),
  assetNameHex: Buffer.from('PRE').toString('hex')
}
const origin = { slot: 0, blockNo: 0, hash: '00'.repeat(32) }
const target = { slot: 100, blockNo: 25, hash: '11'.repeat(32) }
const config = () => ({
  networkId: 'cardano-private-testnet-m1',
  asset: { ...asset },
  anchorPoint: { ...origin },
  expectedPoint: { ...target },
  initialUtxos: [],
  replicas: [
    {
      id: 'node-a',
      nodeInstanceId: 'cardano-node-a',
      url: 'ws://127.0.0.1:1337',
      journalDirectory: './.m1-a/node-a'
    },
    {
      id: 'node-b',
      nodeInstanceId: 'cardano-node-b',
      url: 'ws://127.0.0.1:1338',
      journalDirectory: './.m1-a/node-b'
    }
  ]
})

test('validates two distinct local loopback Ogmios replicas and WAL directories', () => {
  const validated = validatePreSnapshotDualReplicaConfig(config())
  assert.equal(validated.replicas.length, 2)
  assert.notEqual(validated.replicas[0].url, validated.replicas[1].url)
  assert.notEqual(validated.replicas[0].journalDirectory, validated.replicas[1].journalDirectory)
  assert.equal(validated.timeoutMs, 120000)
  assert.equal(validated.pollIntervalMs, 250)
})

test('rejects remote or non-loopback Ogmios endpoints before opening sockets', () => {
  const value = config()
  value.replicas[1].url = 'wss://remote.example:443'
  assert.throws(() => validatePreSnapshotDualReplicaConfig(value), /DUAL_REPLICA_OGMIOS_MUST_BE_LOCAL_LOOPBACK_WS/)
})

test('rejects duplicated node instance identities, even when ports differ', () => {
  const value = config()
  value.replicas[1].nodeInstanceId = value.replicas[0].nodeInstanceId
  assert.throws(() => validatePreSnapshotDualReplicaConfig(value), /DUAL_REPLICA_NODE_INSTANCE_IDS_NOT_DISTINCT/)
})

test('rejects duplicate Ogmios URLs and duplicate journal directories', () => {
  const duplicateUrl = config()
  duplicateUrl.replicas[1].url = duplicateUrl.replicas[0].url
  assert.throws(() => validatePreSnapshotDualReplicaConfig(duplicateUrl), /DUAL_REPLICA_OGMIOS_URLS_NOT_DISTINCT/)

  const duplicateDirectory = config()
  duplicateDirectory.replicas[1].journalDirectory = duplicateDirectory.replicas[0].journalDirectory
  assert.throws(() => validatePreSnapshotDualReplicaConfig(duplicateDirectory), /DUAL_REPLICA_JOURNAL_DIRECTORIES_NOT_DISTINCT/)
})

test('rejects malformed fixed target points and test assets', () => {
  const badPoint = config()
  badPoint.expectedPoint.hash = 'bad'
  assert.throws(() => validatePreSnapshotDualReplicaConfig(badPoint), /DUAL_REPLICA_INVALID_POINT:expectedPoint/)

  const badAsset = config()
  badAsset.asset.policyIdHex = '00'
  assert.throws(() => validatePreSnapshotDualReplicaConfig(badAsset), /DUAL_REPLICA_ASSET_INVALID/)
})

test('rejects invalid timeout and missing replica entry', () => {
  const badTimeout = config()
  badTimeout.timeoutMs = 10
  assert.throws(() => validatePreSnapshotDualReplicaConfig(badTimeout), /DUAL_REPLICA_TIMEOUT_INVALID/)

  const missingReplica = config()
  missingReplica.replicas.pop()
  assert.throws(() => validatePreSnapshotDualReplicaConfig(missingReplica), /DUAL_REPLICA_EXACTLY_TWO_REPLICAS_REQUIRED/)
})

test('requires each connected remote tip to reach the externally fixed target', () => {
  assert.equal(isPreSnapshotRemoteTipAtOrAfterTarget({
    id: 'aa'.repeat(32), slot: 120, height: 30
  }, target), true)
  assert.equal(isPreSnapshotRemoteTipAtOrAfterTarget({
    id: 'aa'.repeat(32), slot: 90, height: 20
  }, target), false)
  assert.equal(isPreSnapshotRemoteTipAtOrAfterTarget('origin', origin), true)
  assert.equal(isPreSnapshotRemoteTipAtOrAfterTarget('origin', target), false)
  assert.equal(isPreSnapshotRemoteTipAtOrAfterTarget(null, target), false)
})
