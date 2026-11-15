import { createHash } from 'node:crypto'
import { decodeOgmiosAddress } from './ogmiosV7PreSnapshotAdapter.mjs'
import { createPreSnapshotIndex } from './preSnapshotUtxoIndex.mjs'

const HEX_32 = /^[0-9a-f]{64}$/
const HEX_POLICY = /^[0-9a-f]{56}$/
const HEX_ASSET_NAME = /^(?:[0-9a-f]{2}){0,32}$/
const WHOLE_UTXO_METHOD = 'queryLedgerState/utxo'
const POINT_SOURCES = new Set([
  'ogmios-v7-chainsync-tip',
  'ogmios-v7-block-header'
])

function fail(code) {
  throw new Error(code)
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function requireObject(value, field) {
  if (!isPlainObject(value)) fail(`WHOLE_UTXO_INVALID_OBJECT:${field}`)
  return value
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') fail(`WHOLE_UTXO_INVALID_STRING:${field}`)
  return value
}

function integerBigInt(value, field, { allowZero = false } = {}) {
  let result
  if (typeof value === 'bigint') {
    result = value
  } else if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) {
    result = BigInt(value)
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    result = BigInt(value)
  } else {
    fail(`WHOLE_UTXO_INVALID_INTEGER:${field}`)
  }
  if (result < 0n || (!allowZero && result === 0n)) {
    fail(`WHOLE_UTXO_NON_POSITIVE_INTEGER:${field}`)
  }
  return result
}

function safeNumber(value, field, maximum = Number.MAX_SAFE_INTEGER) {
  const integer = integerBigInt(value, field, { allowZero: true })
  if (integer > BigInt(maximum)) fail(`WHOLE_UTXO_INTEGER_OUT_OF_RANGE:${field}`)
  return Number(integer)
}

function normalizeAsset(assetValue) {
  const asset = requireObject(assetValue, 'asset')
  const policyIdHex = requireString(asset.policyIdHex, 'asset.policyIdHex').toLowerCase()
  if (typeof asset.assetNameHex !== 'string') fail('WHOLE_UTXO_ASSET_NAME_REQUIRED')
  const assetNameHex = asset.assetNameHex
  if (!HEX_POLICY.test(policyIdHex)) fail('WHOLE_UTXO_POLICY_ID_INVALID')
  // The empty byte-string asset name is valid; do not confuse it with a missing value.
  const normalizedName = assetNameHex.toLowerCase()
  if (!HEX_ASSET_NAME.test(normalizedName)) fail('WHOLE_UTXO_ASSET_NAME_INVALID')
  return Object.freeze({ policyIdHex, assetNameHex: normalizedName })
}

function normalizeChainSyncPoint(value) {
  const point = requireObject(value, 'chainSyncPoint')
  if (!POINT_SOURCES.has(point.source)) fail('WHOLE_UTXO_CHAIN_POINT_SOURCE_UNSUPPORTED')
  const slot = safeNumber(point.slot, 'chainSyncPoint.slot')
  const blockNo = safeNumber(point.blockNo, 'chainSyncPoint.blockNo')
  const hash = requireString(point.hash, 'chainSyncPoint.hash').toLowerCase()
  if (!HEX_32.test(hash)) fail('WHOLE_UTXO_CHAIN_POINT_HASH_INVALID')
  return Object.freeze({ slot, blockNo, hash, source: point.source })
}

function normalizeAcquiredPoint(value) {
  const point = requireObject(value, 'session.point')
  const slot = safeNumber(point.slot, 'session.point.slot')
  const hash = requireString(point.id ?? point.hash, 'session.point.id').toLowerCase()
  if (!HEX_32.test(hash)) fail('WHOLE_UTXO_ACQUIRED_POINT_HASH_INVALID')
  return Object.freeze({ slot, hash })
}

function comparePoint(acquired, chainPoint) {
  return acquired.slot === chainPoint.slot && acquired.hash === chainPoint.hash
}

function canonicalize(value) {
  if (typeof value === 'bigint') return { '$immortal-bigint': value.toString() }
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    fail('WHOLE_UTXO_UNSAFE_JSON_NUMBER')
  }
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isPlainObject(value)) {
    const result = {}
    for (const key of Object.keys(value).sort()) result[key] = canonicalize(value[key])
    return result
  }
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value
  fail('WHOLE_UTXO_UNSUPPORTED_JSON_VALUE')
}

function digestCanonical(value) {
  const bytes = Buffer.from(JSON.stringify(canonicalize(value)), 'utf8')
  return createHash('sha256').update(bytes).digest('hex')
}

function decodeValue(valueValue, field, targetAsset) {
  const value = requireObject(valueValue, `${field}.value`)
  const ada = requireObject(value.ada, `${field}.value.ada`)
  integerBigInt(ada.lovelace, `${field}.value.ada.lovelace`, { allowZero: true })

  let targetQuantity = null
  const policies = Object.keys(value).filter(key => key !== 'ada').sort()
  for (const policyIdHex of policies) {
    if (!HEX_POLICY.test(policyIdHex)) fail(`WHOLE_UTXO_POLICY_ID_INVALID:${field}`)
    const names = requireObject(value[policyIdHex], `${field}.value.${policyIdHex}`)
    for (const assetNameHex of Object.keys(names).sort()) {
      if (!HEX_ASSET_NAME.test(assetNameHex)) fail(`WHOLE_UTXO_ASSET_NAME_INVALID:${field}`)
      const quantity = integerBigInt(names[assetNameHex], `${field}.value.${policyIdHex}.${assetNameHex}`)
      if (policyIdHex === targetAsset.policyIdHex && assetNameHex === targetAsset.assetNameHex) {
        if (targetQuantity !== null) fail(`WHOLE_UTXO_DUPLICATE_TARGET_ASSET:${field}`)
        targetQuantity = quantity
      }
    }
  }
  return targetQuantity
}

function decodeTargetAddress(addressValue, field) {
  const address = requireString(addressValue, `${field}.address`)
  const normalized = address.toLowerCase()
  // Byron/Base58 decoding in the existing adapter does not validate the CBOR envelope
  // and checksum. Do not silently treat that as production-safe address validation.
  if (!normalized.startsWith('addr1') && !normalized.startsWith('addr_test1')) {
    fail(`WHOLE_UTXO_BYRON_OR_UNSUPPORTED_ADDRESS_NOT_QUALIFIED:${field}`)
  }
  return decodeOgmiosAddress(address)
}

function decodeUtxo(entryValue, index, targetAsset, references) {
  const field = `utxos[${index}]`
  const entry = requireObject(entryValue, field)
  const transaction = requireObject(entry.transaction, `${field}.transaction`)
  const txId = requireString(transaction.id, `${field}.transaction.id`).toLowerCase()
  if (!HEX_32.test(txId)) fail(`WHOLE_UTXO_TX_ID_INVALID:${field}`)
  const outputIndex = safeNumber(entry.index, `${field}.index`, 65535)
  const reference = `${txId}#${outputIndex}`
  if (references.has(reference)) fail(`WHOLE_UTXO_DUPLICATE_OUT_REF:${reference}`)
  references.add(reference)

  const quantity = decodeValue(entry.value, field, targetAsset)
  // Every result row is structurally decoded, but only matching PRE outputs need
  // address bytes for the current raw-address test identity.
  const address = requireString(entry.address, `${field}.address`)
  if (quantity === null) return null
  const addressHex = decodeTargetAddress(address, field)
  return Object.freeze({
    txId,
    index: outputIndex,
    addressHex,
    assets: Object.freeze([Object.freeze({
      policyIdHex: targetAsset.policyIdHex,
      assetNameHex: targetAsset.assetNameHex,
      quantity: quantity.toString()
    })])
  })
}

/**
 * Bootstrap the M1-A PRE index from one Ogmios v7 WholeUtxo result.
 *
 * Contract: ledgerSession is an already-acquired session with the same point as
 * chainSyncPoint, exposing query(method, params), isAcquired, isReleased, point,
 * and release(). This function owns the one query and always attempts release.
 * It deliberately does not authenticate the node, network/genesis, response
 * completeness, or governance eligibility. Byron-bearing PRE outputs are rejected.
 */
export async function bootstrapPreSnapshotFromWholeUtxo({
  ledgerSession,
  chainSyncPoint: chainSyncPointValue,
  networkId,
  asset: assetValue
}) {
  if (!ledgerSession || typeof ledgerSession !== 'object' ||
      typeof ledgerSession.query !== 'function' || typeof ledgerSession.release !== 'function') {
    fail('WHOLE_UTXO_LEDGER_SESSION_REQUIRED')
  }
  if (ledgerSession.isAcquired !== true || ledgerSession.isReleased !== false) {
    fail('WHOLE_UTXO_SESSION_NOT_ACQUIRED')
  }

  let result
  let operationError = null
  try {
    const chainSyncPoint = normalizeChainSyncPoint(chainSyncPointValue)
    const acquiredPoint = normalizeAcquiredPoint(ledgerSession.point)
    if (!comparePoint(acquiredPoint, chainSyncPoint)) fail('WHOLE_UTXO_ACQUIRED_POINT_MISMATCH')
    const normalizedNetworkId = requireString(networkId, 'networkId')
    const asset = normalizeAsset(assetValue)

    const rawUtxos = await ledgerSession.query(WHOLE_UTXO_METHOD, {})
    if (ledgerSession.isAcquired !== true || ledgerSession.isReleased !== false) {
      fail('WHOLE_UTXO_SESSION_EXPIRED_DURING_QUERY')
    }
    const postQueryPoint = normalizeAcquiredPoint(ledgerSession.point)
    if (!comparePoint(postQueryPoint, chainSyncPoint)) fail('WHOLE_UTXO_POINT_CHANGED_DURING_QUERY')
    if (!Array.isArray(rawUtxos)) fail('WHOLE_UTXO_RESULT_NOT_ARRAY')

    const references = new Set()
    const decoded = rawUtxos.map((entry, index) => decodeUtxo(entry, index, asset, references))
    const utxos = decoded.filter(entry => entry !== null)
      .sort((left, right) => left.txId.localeCompare(right.txId) || left.index - right.index)
    const totalQuantity = utxos.reduce((sum, entry) => sum + BigInt(entry.assets[0].quantity), 0n)
    const anchorPoint = Object.freeze({
      slot: chainSyncPoint.slot,
      blockNo: chainSyncPoint.blockNo,
      hash: chainSyncPoint.hash
    })
    const index = createPreSnapshotIndex({
      networkId: normalizedNetworkId,
      asset,
      anchorPoint,
      utxos
    })

    result = Object.freeze({
      index,
      utxos: Object.freeze(utxos),
      manifest: Object.freeze({
        schema: 'immortal-m1a-whole-utxo-bootstrap-v1',
        qualification: 'CANDIDATE_ONLY_NO_SOURCE_COMPLETENESS_PROOF',
        networkId: normalizedNetworkId,
        asset,
        point: anchorPoint,
        pointHeightSource: chainSyncPoint.source,
        requestMethod: WHOLE_UTXO_METHOD,
        requestParams: Object.freeze({}),
        wholeUtxoCount: rawUtxos.length,
        matchingUtxoCount: utxos.length,
        totalQuantity: totalQuantity.toString(),
        responseDigest: Object.freeze({
          algorithm: 'SHA-256',
          encoding: 'canonical-decoded-json-v1',
          hex: digestCanonical(rawUtxos),
          rawWireBytesAvailable: false
        }),
        matchingRowsDigest: Object.freeze({
          algorithm: 'SHA-256',
          encoding: 'canonical-pre-utxo-rows-v1',
          hex: digestCanonical(utxos)
        }),
        addressQualification: 'SHELLEY_BECH32_ONLY; BYRON_MATCHES_REJECTED',
        authority: 'NOT_ESTABLISHED'
      })
    })
  } catch (error) {
    operationError = error
  }

  let releaseError = null
  try {
    const released = await ledgerSession.release()
    if (released !== true) fail('WHOLE_UTXO_SESSION_RELEASE_NOT_CONFIRMED')
  } catch (error) {
    releaseError = error
  }

  if (operationError && releaseError) {
    throw new AggregateError([operationError, releaseError], 'WHOLE_UTXO_QUERY_AND_RELEASE_FAILED')
  }
  if (releaseError) throw releaseError
  if (operationError) throw operationError
  return result
}
