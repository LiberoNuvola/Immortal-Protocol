import { decodeOgmiosAddress } from './ogmiosV7PreSnapshotAdapter.mjs'
import {
  buildPreSnapshotMessage,
  createPreSnapshotIndex,
  rollbackPreSnapshotIndex
} from './preSnapshotUtxoIndex.mjs'

export const PRE_SNAPSHOT_KUPO_CONFORMANCE_VERSION = 1

function fail(code) {
  throw Object.assign(new Error(code), { code })
}

function parseSafeInteger(value, field) {
  const number = typeof value === 'string' && /^\d+$/.test(value)
    ? Number(value)
    : value
  if (!Number.isSafeInteger(number) || number < 0) {
    fail('KUPO_INVALID_INTEGER:' + field)
  }
  return number
}

function requirePoint(point, field) {
  if (!point || typeof point !== 'object' ||
      !Number.isSafeInteger(point.slot) || point.slot < 0 ||
      !Number.isSafeInteger(point.blockNo) || point.blockNo < 0 ||
      typeof point.hash !== 'string' || !/^[0-9a-f]{64}$/.test(point.hash)) {
    fail('KUPO_INVALID_POINT:' + field)
  }
  return Object.freeze({
    slot: point.slot,
    blockNo: point.blockNo,
    hash: point.hash
  })
}

function requireAsset(asset) {
  if (!asset || typeof asset.policyIdHex !== 'string' ||
      !/^[0-9a-f]{56}$/.test(asset.policyIdHex) ||
      typeof asset.assetNameHex !== 'string' ||
      !/^(?:[0-9a-f]{2}){0,32}$/.test(asset.assetNameHex)) {
    fail('KUPO_EXPECTED_ASSET_INVALID')
  }
  return Object.freeze({
    policyIdHex: asset.policyIdHex,
    assetNameHex: asset.assetNameHex
  })
}

function pointMatchesKupo(checkpoint, expectedPoint) {
  if (!checkpoint || typeof checkpoint !== 'object') return false
  const slot = parseSafeInteger(checkpoint.slot_no, 'checkpoint.slot_no')
  return slot === expectedPoint.slot &&
    checkpoint.header_hash === expectedPoint.hash
}

function addressHexFromKupo(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('KUPO_ADDRESS_INVALID:' + field)
  }
  try {
    return decodeOgmiosAddress(value)
  } catch (error) {
    fail('KUPO_ADDRESS_DECODE_FAILED:' + field + ':' + error.message)
  }
}

function normalizeKupoMatch(match, expectedAsset, expectedPoint, index) {
  const field = 'matches[' + index + ']'
  if (!match || typeof match !== 'object' || Array.isArray(match)) {
    fail('KUPO_MATCH_INVALID:' + index)
  }
  if (typeof match.transaction_id !== 'string' ||
      !/^[0-9a-f]{64}$/.test(match.transaction_id)) {
    fail('KUPO_TRANSACTION_ID_INVALID:' + index)
  }
  const outputIndex = parseSafeInteger(match.output_index, field + '.output_index')
  if (match.spent_at !== null) fail('KUPO_QUERY_RETURNED_SPENT_OUTPUT:' + index)

  if (!match.created_at || typeof match.created_at !== 'object') {
    fail('KUPO_CREATED_AT_REQUIRED:' + index)
  }
  const createdSlot = parseSafeInteger(match.created_at.slot_no, field + '.created_at.slot_no')
  if (createdSlot > expectedPoint.slot ||
      (createdSlot === expectedPoint.slot &&
       match.created_at.header_hash !== expectedPoint.hash)) {
    fail('KUPO_OUTPUT_CREATED_AFTER_OR_OFF_TARGET:' + index)
  }

  const value = match.value
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      !value.assets || typeof value.assets !== 'object' || Array.isArray(value.assets)) {
    fail('KUPO_VALUE_ASSETS_INVALID:' + index)
  }

  const assetKey = expectedAsset.assetNameHex.length === 0
    ? expectedAsset.policyIdHex
    : expectedAsset.policyIdHex + '.' + expectedAsset.assetNameHex
  const rawQuantity = value.assets[assetKey]
  if (rawQuantity === undefined) {
    fail('KUPO_EXPECTED_ASSET_MISSING:' + index)
  }

  let quantity
  if (typeof rawQuantity === 'string' && /^\d+$/.test(rawQuantity)) {
    quantity = BigInt(rawQuantity)
  } else if (typeof rawQuantity === 'number' &&
      Number.isSafeInteger(rawQuantity) && rawQuantity >= 0) {
    quantity = BigInt(rawQuantity)
  } else {
    fail('KUPO_ASSET_QUANTITY_UNSAFE:' + index)
  }
  if (quantity <= 0n) fail('KUPO_ASSET_QUANTITY_NOT_POSITIVE:' + index)

  return {
    txId: match.transaction_id,
    index: outputIndex,
    addressHex: addressHexFromKupo(match.address, field + '.address'),
    assets: [{
      policyIdHex: expectedAsset.policyIdHex,
      assetNameHex: expectedAsset.assetNameHex,
      quantity: quantity.toString()
    }]
  }
}

function snapshotAtPoint(state, expectedPoint) {
  if (state.currentPoint.slot === expectedPoint.slot &&
      state.currentPoint.blockNo === expectedPoint.blockNo &&
      state.currentPoint.hash === expectedPoint.hash) {
    return state
  }
  if (state.currentPoint.slot < expectedPoint.slot) return null
  try {
    return rollbackPreSnapshotIndex(state, expectedPoint)
  } catch (_) {
    return null
  }
}

/**
 * Compare one reducer replica with one Kupo index queried at the same exact
 * block point. Kupo's strict checkpoint must match the supplied expectedPoint.
 * The caller must start Kupo with --until POINT or independently freeze its DB
 * at that exact point. Kupo checkpoint exposes slot/hash, not block number;
 * block number is taken from the externally verified expectedPoint.
 */
export function comparePreSnapshotKupoState({
  state,
  kupoCheckpoint,
  kupoMatches,
  expectedNetworkId,
  expectedAsset: expectedAssetValue,
  expectedPoint: expectedPointValue
}) {
  if (!state || typeof state !== 'object') fail('KUPO_REDUCER_STATE_REQUIRED')
  if (!Array.isArray(kupoMatches)) fail('KUPO_MATCHES_ARRAY_REQUIRED')
  if (typeof expectedNetworkId !== 'string' || expectedNetworkId.trim().length === 0) {
    fail('KUPO_EXPECTED_NETWORK_REQUIRED')
  }

  const expectedAsset = requireAsset(expectedAssetValue)
  const expectedPoint = requirePoint(expectedPointValue, 'expectedPoint')

  if (!pointMatchesKupo(kupoCheckpoint, expectedPoint)) {
    return Object.freeze({
      version: PRE_SNAPSHOT_KUPO_CONFORMANCE_VERSION,
      status: 'FAIL',
      code: 'KUPO_CHECKPOINT_NOT_AT_EXPECTED_POINT',
      expectedPoint,
      kupoCheckpoint: kupoCheckpoint ?? null
    })
  }

  if (state.networkId !== expectedNetworkId ||
      state.asset.policyIdHex !== expectedAsset.policyIdHex ||
      state.asset.assetNameHex !== expectedAsset.assetNameHex) {
    return Object.freeze({
      version: PRE_SNAPSHOT_KUPO_CONFORMANCE_VERSION,
      status: 'FAIL',
      code: 'KUPO_REDUCER_CONFIGURATION_MISMATCH',
      expectedPoint
    })
  }

  const reducerStateAtPoint = snapshotAtPoint(state, expectedPoint)
  if (!reducerStateAtPoint) {
    return Object.freeze({
      version: PRE_SNAPSHOT_KUPO_CONFORMANCE_VERSION,
      status: 'FAIL',
      code: 'KUPO_REDUCER_TARGET_POINT_NOT_RETAINED',
      expectedPoint,
      reducerTip: state.currentPoint
    })
  }

  const assetKey = expectedAsset.assetNameHex.length === 0
    ? expectedAsset.policyIdHex
    : expectedAsset.policyIdHex + '.' + expectedAsset.assetNameHex
  const normalized = []
  const seen = new Set()

  for (let index = 0; index < kupoMatches.length; index += 1) {
    const match = kupoMatches[index]
    if (expectedAsset.assetNameHex.length === 0 &&
        match && match.value && match.value.assets &&
        !Object.prototype.hasOwnProperty.call(match.value.assets, assetKey)) {
      continue
    }
    const output = normalizeKupoMatch(match, expectedAsset, expectedPoint, index)
    const key = output.txId + '#' + output.index
    if (seen.has(key)) fail('KUPO_DUPLICATE_OUTPUT_REFERENCE:' + key)
    seen.add(key)
    normalized.push(output)
  }

  const kupoState = createPreSnapshotIndex({
    networkId: expectedNetworkId,
    asset: expectedAsset,
    anchorPoint: expectedPoint,
    utxos: normalized
  })
  const reducerSnapshot = buildPreSnapshotMessage(reducerStateAtPoint)
  const kupoSnapshot = buildPreSnapshotMessage(kupoState)
  const canonicalBytesEqual = reducerSnapshot.canonicalBytes.equals(kupoSnapshot.canonicalBytes)
  const digestsEqual = reducerSnapshot.digestHex === kupoSnapshot.digestHex

  return Object.freeze({
    version: PRE_SNAPSHOT_KUPO_CONFORMANCE_VERSION,
    status: canonicalBytesEqual && digestsEqual ? 'PASS' : 'FAIL',
    code: canonicalBytesEqual && digestsEqual
      ? 'KUPO_SNAPSHOT_EXACT_MATCH'
      : 'KUPO_SNAPSHOT_BYTES_MISMATCH',
    expectedPoint,
    reducer: Object.freeze({
      digestHex: reducerSnapshot.digestHex,
      merkleSumRoot: reducerSnapshot.message.merkleSumRoot,
      totalQuantity: reducerSnapshot.message.totalQuantity,
      leafCount: reducerSnapshot.message.leafCount,
      utxoCount: reducerStateAtPoint.utxos.length
    }),
    kupo: Object.freeze({
      digestHex: kupoSnapshot.digestHex,
      merkleSumRoot: kupoSnapshot.message.merkleSumRoot,
      totalQuantity: kupoSnapshot.message.totalQuantity,
      leafCount: kupoSnapshot.message.leafCount,
      utxoCount: normalized.length
    }),
    canonicalBytesEqual,
    digestsEqual
  })
}
