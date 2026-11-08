import {
  buildPreSnapshotMessage,
  rollbackPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'

export const PRE_SNAPSHOT_REPLICA_CONFORMANCE_VERSION = 1

function fail(code) {
  throw Object.assign(new Error(code), { code })
}

function requireReplica(replica, name) {
  if (!replica || typeof replica !== 'object' || Array.isArray(replica)) {
    fail('PRE_SNAPSHOT_REPLICA_INVALID:' + name)
  }
  if (typeof replica.id !== 'string' || replica.id.trim().length === 0) {
    fail('PRE_SNAPSHOT_REPLICA_ID_REQUIRED:' + name)
  }
  if (!replica.state || typeof replica.state !== 'object') {
    fail('PRE_SNAPSHOT_REPLICA_STATE_REQUIRED:' + name)
  }
  return replica
}

function requireExpectedPoint(point) {
  if (!point || typeof point !== 'object' ||
      !Number.isSafeInteger(point.slot) || point.slot < 0 ||
      !Number.isSafeInteger(point.blockNo) || point.blockNo < 0 ||
      typeof point.hash !== 'string' || !/^[0-9a-f]{64}$/.test(point.hash)) {
    fail('PRE_SNAPSHOT_EXPECTED_POINT_INVALID')
  }
  return Object.freeze({
    slot: point.slot,
    blockNo: point.blockNo,
    hash: point.hash
  })
}

function pointEqual(left, right) {
  return left.slot === right.slot &&
    left.blockNo === right.blockNo &&
    left.hash === right.hash
}

function assetEqual(left, right) {
  return left.policyIdHex === right.policyIdHex &&
    left.assetNameHex === right.assetNameHex
}

function replicaSummary(replica, snapshot) {
  return Object.freeze({
    id: replica.id,
    indexTip: replica.state.currentPoint,
    snapshotPoint: snapshot?.message.point ?? null,
    digestHex: snapshot?.digestHex ?? null,
    merkleSumRoot: snapshot?.message.merkleSumRoot ?? null,
    totalQuantity: snapshot?.message.totalQuantity ?? null,
    leafCount: snapshot?.message.leafCount ?? null
  })
}

/**
 * Compare two independently maintained reducer states at one externally fixed
 * point. replica.id is an operator-supplied label, not cryptographic proof that
 * the two WebSockets terminate at independent Cardano nodes.
 *
 * This function never selects a snapshot point and never mutates either state.
 * A caller must bring both indexes to expectedPoint before invoking a PASS.
 */
export function comparePreSnapshotReplicaStates({
  replicaA,
  replicaB,
  expectedNetworkId,
  expectedAsset,
  expectedPoint
}) {
  const left = requireReplica(replicaA, 'A')
  const right = requireReplica(replicaB, 'B')
  if (left.id === right.id) fail('PRE_SNAPSHOT_REPLICA_IDS_NOT_DISTINCT')
  if (typeof expectedNetworkId !== 'string' || expectedNetworkId.trim().length === 0) {
    fail('PRE_SNAPSHOT_EXPECTED_NETWORK_REQUIRED')
  }
  if (!expectedAsset || typeof expectedAsset.policyIdHex !== 'string' ||
      !/^[0-9a-f]{56}$/.test(expectedAsset.policyIdHex) ||
      typeof expectedAsset.assetNameHex !== 'string' ||
      !/^(?:[0-9a-f]{2}){0,32}$/.test(expectedAsset.assetNameHex)) {
    fail('PRE_SNAPSHOT_EXPECTED_ASSET_INVALID')
  }
  const targetPoint = requireExpectedPoint(expectedPoint)
  const leftState = left.state
  const rightState = right.state
  const base = {
    version: PRE_SNAPSHOT_REPLICA_CONFORMANCE_VERSION,
    expectedNetworkId,
    expectedAsset: Object.freeze({
      policyIdHex: expectedAsset.policyIdHex,
      assetNameHex: expectedAsset.assetNameHex
    }),
    expectedPoint: targetPoint,
    replicaA: replicaSummary(left, null),
    replicaB: replicaSummary(right, null)
  }

  if (leftState.networkId !== expectedNetworkId ||
      rightState.networkId !== expectedNetworkId ||
      !assetEqual(leftState.asset, expectedAsset) ||
      !assetEqual(rightState.asset, expectedAsset)) {
    return Object.freeze({
      ...base,
      status: 'FAIL',
      code: 'REPLICA_CONFIGURATION_MISMATCH'
    })
  }

  const leftPoint = leftState.currentPoint
  const rightPoint = rightState.currentPoint
  const leftAtTarget = pointEqual(leftPoint, targetPoint)
  const rightAtTarget = pointEqual(rightPoint, targetPoint)

  const sameHeight = leftPoint.slot === rightPoint.slot &&
    leftPoint.blockNo === rightPoint.blockNo
  if (sameHeight && leftPoint.hash !== rightPoint.hash) {
    return Object.freeze({
      ...base,
      status: 'FAIL',
      code: 'REPLICA_CHAIN_SELECTION_DIVERGENCE',
      replicaA: replicaSummary(left, null),
      replicaB: replicaSummary(right, null)
    })
  }

  const projectToTarget = (state, atTarget) => {
    if (atTarget) return { status: 'READY', state }
    if (state.currentPoint.slot < targetPoint.slot) {
      return { status: 'WAITING' }
    }
    if (state.currentPoint.slot === targetPoint.slot) {
      return { status: 'FAIL', code: 'REPLICA_TARGET_POINT_CONFLICT' }
    }
    try {
      return {
        status: 'READY',
        state: rollbackPreSnapshotIndex(state, targetPoint)
      }
    } catch (_) {
      return { status: 'FAIL', code: 'REPLICA_TARGET_POINT_NOT_RETAINED' }
    }
  }

  const projectedA = projectToTarget(leftState, leftAtTarget)
  const projectedB = projectToTarget(rightState, rightAtTarget)
  if (projectedA.status !== 'READY' || projectedB.status !== 'READY') {
    if (projectedA.status === 'WAITING' || projectedB.status === 'WAITING') {
      return Object.freeze({
        ...base,
        status: 'WAITING',
        code: 'REPLICAS_NOT_AT_EXPECTED_POINT',
        replicaA: replicaSummary(left, null),
        replicaB: replicaSummary(right, null)
      })
    }
    return Object.freeze({
      ...base,
      status: 'FAIL',
      code: projectedA.code ?? projectedB.code ?? 'REPLICA_TARGET_POINT_UNAVAILABLE',
      replicaA: replicaSummary(left, null),
      replicaB: replicaSummary(right, null)
    })
  }

  const snapshotA = buildPreSnapshotMessage(projectedA.state)
  const snapshotB = buildPreSnapshotMessage(projectedB.state)
  const summaries = {
    replicaA: replicaSummary(left, snapshotA),
    replicaB: replicaSummary(right, snapshotB)
  }

  const canonicalBytesEqual = snapshotA.canonicalBytes.equals(snapshotB.canonicalBytes)
  const digestsEqual = snapshotA.digestHex === snapshotB.digestHex
  if (!canonicalBytesEqual || !digestsEqual) {
    return Object.freeze({
      ...base,
      ...summaries,
      status: 'FAIL',
      code: 'REPLICA_SNAPSHOT_BYTES_MISMATCH',
      canonicalBytesEqual,
      digestsEqual
    })
  }

  return Object.freeze({
    ...base,
    ...summaries,
    status: 'PASS',
    code: 'REPLICA_SNAPSHOT_EXACT_MATCH',
    canonicalBytesEqual: true,
    digestsEqual: true
  })
}
