import { createHash } from 'node:crypto'

export const PRE_SNAPSHOT_MODULE_ID = 'immortal-pre-snapshot-test-v1'
export const PRE_SNAPSHOT_ENCODING_VERSION = 1
export const PRE_SNAPSHOT_INDEX_SCHEMA_VERSION = 1
export const PRE_SNAPSHOT_ORIGIN_POINT = Object.freeze({ slot: 0, blockNo: 0, hash: '0'.repeat(64) })

function fail(code) {
  throw new Error(code)
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function requiredObject(value, field) {
  if (!isPlainObject(value)) fail(`INVALID_OBJECT:${field}`)
  return value
}

function requiredArray(value, field) {
  if (!Array.isArray(value)) fail(`INVALID_ARRAY:${field}`)
  return value
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.length === 0) fail(`INVALID_STRING:${field}`)
  return value
}

function normalizeHex(value, field, { bytes, minBytes = bytes, maxBytes = bytes } = {}) {
  if (typeof value !== 'string') fail(`INVALID_HEX_TYPE:${field}`)
  const hex = value.toLowerCase()
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/.test(hex)) fail(`INVALID_HEX:${field}`)
  const length = hex.length / 2
  if (length < minBytes || length > maxBytes) fail(`INVALID_HEX_LENGTH:${field}`)
  return hex
}

function toBigIntExact(value, field, { allowNegative = false } = {}) {
  let result
  if (typeof value === 'bigint') {
    result = value
  } else if (typeof value === 'string' && /^-?(0|[1-9][0-9]*)$/.test(value)) {
    result = BigInt(value)
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    result = BigInt(value)
  } else {
    fail(`INVALID_INTEGER:${field}`)
  }
  if (!allowNegative && result < 0n) fail(`NEGATIVE_INTEGER:${field}`)
  return result
}

function normalizePoint(value, field = 'point') {
  requiredObject(value, field)
  const slot = toBigIntExact(value.slot, `${field}.slot`)
  const blockNo = toBigIntExact(value.blockNo, `${field}.blockNo`)
  if (slot > BigInt(Number.MAX_SAFE_INTEGER) || blockNo > BigInt(Number.MAX_SAFE_INTEGER)) {
    fail(`POINT_INTEGER_OUT_OF_SAFE_RANGE:${field}`)
  }
  const hash = normalizeHex(value.hash, `${field}.hash`, { bytes: 32 })
  return Object.freeze({ slot: Number(slot), blockNo: Number(blockNo), hash })
}

function samePoint(left, right) {
  return left !== null && right !== null &&
    left.slot === right.slot &&
    left.blockNo === right.blockNo &&
    left.hash === right.hash
}

function pointKey(point) {
  return `${point.slot}:${point.hash}`
}

function normalizeOutRef(value, field) {
  requiredObject(value, field)
  const txId = normalizeHex(value.txId, `${field}.txId`, { bytes: 32 })
  const index = toBigIntExact(value.index, `${field}.index`)
  if (index > 65535n) fail(`OUT_REF_INDEX_OUT_OF_RANGE:${field}`)
  return { txId, index: Number(index), key: `${txId}#${index}` }
}

function normalizeAssetIdentity(value) {
  requiredObject(value, 'asset')
  return Object.freeze({
    policyIdHex: normalizeHex(value.policyIdHex, 'asset.policyIdHex', { bytes: 28 }),
    assetNameHex: normalizeHex(value.assetNameHex, 'asset.assetNameHex', { minBytes: 0, maxBytes: 32 })
  })
}

function targetQuantity(assetsValue, asset, field) {
  const assets = requiredArray(assetsValue, `${field}.assets`)
  let found = false
  let quantity = 0n
  for (let index = 0; index < assets.length; index += 1) {
    const entry = requiredObject(assets[index], `${field}.assets[${index}]`)
    const policyIdHex = normalizeHex(entry.policyIdHex, `${field}.assets[${index}].policyIdHex`, { bytes: 28 })
    const assetNameHex = normalizeHex(entry.assetNameHex, `${field}.assets[${index}].assetNameHex`, { minBytes: 0, maxBytes: 32 })
    if (policyIdHex !== asset.policyIdHex || assetNameHex !== asset.assetNameHex) continue
    if (found) fail(`DUPLICATE_TARGET_ASSET:${field}`)
    found = true
    quantity = toBigIntExact(entry.quantity, `${field}.assets[${index}].quantity`)
  }
  return found ? quantity : null
}

function normalizeTrackedOutput(outputValue, asset, field) {
  const output = requiredObject(outputValue, field)
  const quantity = targetQuantity(output.assets, asset, field)
  if (quantity === null) return null
  if (quantity === 0n) fail(`ZERO_TARGET_ASSET_QUANTITY:${field}`)
  const addressHex = normalizeHex(output.addressHex, `${field}.addressHex`, { minBytes: 1, maxBytes: 128 })
  return Object.freeze({ addressHex, quantity: quantity.toString() })
}

function cloneOutput(output) {
  return Object.freeze({ addressHex: output.addressHex, quantity: output.quantity })
}

function totalQuantity(utxos) {
  let total = 0n
  for (const output of utxos.values()) total += BigInt(output.quantity)
  return total
}

function addTrackedOutput(utxos, created, createdSet, txId, index, output, asset, field) {
  const tracked = normalizeTrackedOutput(output, asset, field)
  if (tracked === null) return
  const ref = normalizeOutRef({ txId, index }, `${field}.outRef`)
  if (utxos.has(ref.key)) fail(`DUPLICATE_UTXO:${ref.key}`)
  utxos.set(ref.key, tracked)
  created.push(ref.key)
  createdSet.add(ref.key)
}

function targetMintQuantity(mintValue, asset, field) {
  const mint = requiredArray(mintValue, field)
  let found = false
  let quantity = 0n
  for (let index = 0; index < mint.length; index += 1) {
    const entry = requiredObject(mint[index], `${field}[${index}]`)
    const policyIdHex = normalizeHex(entry.policyIdHex, `${field}[${index}].policyIdHex`, { bytes: 28 })
    const assetNameHex = normalizeHex(entry.assetNameHex, `${field}[${index}].assetNameHex`, { minBytes: 0, maxBytes: 32 })
    if (policyIdHex !== asset.policyIdHex || assetNameHex !== asset.assetNameHex) continue
    if (found) fail(`DUPLICATE_TARGET_MINT:${field}`)
    found = true
    quantity = toBigIntExact(entry.quantity, `${field}[${index}].quantity`, { allowNegative: true })
  }
  return quantity
}

function indexMap(state) {
  return new Map(state.utxos.map(entry => [
    entry.key,
    Object.freeze({ addressHex: entry.addressHex, quantity: entry.quantity })
  ]))
}

function immutableIndexEntries(utxos) {
  return Object.freeze([...utxos.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, output]) => Object.freeze({
      key,
      addressHex: output.addressHex,
      quantity: output.quantity
    })))
}

function cloneIndexState(state, utxos, currentPoint, history) {
  return Object.freeze({
    schemaVersion: state.schemaVersion,
    networkId: state.networkId,
    asset: state.asset,
    anchorPoint: state.anchorPoint,
    currentPoint,
    utxos: immutableIndexEntries(utxos),
    history: Object.freeze([...history])
  })
}

/**
 * Create a signer-local PRE UTxO index at a known bootstrap point.
 *
 * Each bootstrap UTxO is:
 * { txId: 64-hex, index: integer, addressHex: hex, assets: [{policyIdHex, assetNameHex, quantity}] }.
 * This function intentionally knows nothing about Ogmios wire JSON.
 */
export function createPreSnapshotIndex({ networkId, asset, anchorPoint, utxos = [] }) {
  const normalizedNetwork = requiredString(networkId, 'networkId')
  const normalizedAsset = normalizeAssetIdentity(asset)
  const point = normalizePoint(anchorPoint, 'anchorPoint')
  const entries = requiredArray(utxos, 'utxos')
  const map = new Map()

  for (let index = 0; index < entries.length; index += 1) {
    const entry = requiredObject(entries[index], `utxos[${index}]`)
    const ref = normalizeOutRef(entry, `utxos[${index}]`)
    const tracked = normalizeTrackedOutput(entry, normalizedAsset, `utxos[${index}]`)
    if (tracked === null) continue
    if (map.has(ref.key)) fail(`DUPLICATE_BOOTSTRAP_UTXO:${ref.key}`)
    map.set(ref.key, tracked)
  }

  return cloneIndexState({
    schemaVersion: PRE_SNAPSHOT_INDEX_SCHEMA_VERSION,
    networkId: normalizedNetwork,
    asset: normalizedAsset,
    anchorPoint: point
  }, map, point, [])
}

/**
 * Apply one normalized, ledger-accepted block atomically.
 *
 * Normalized transaction contract:
 * {
 *   id: 64-hex,
 *   spends: "inputs" | "collaterals",
 *   inputs: [{txId, index}],
 *   collaterals: [{txId, index}],
 *   outputs: [{addressHex, assets:[...]}],
 *   collateralReturn: null | {addressHex, assets:[...]},
 *   mint: [{policyIdHex, assetNameHex, quantity}]
 * }
 *
 * Ogmios v7 exposes the ledger-selected input set as transaction.spends.
 * Do not infer it from an omitted field or an invented validity flag.
 */
export function applyPreSnapshotBlock(state, blockValue) {
  requiredObject(state, 'state')
  requiredObject(blockValue, 'block')
  if (state.schemaVersion !== PRE_SNAPSHOT_INDEX_SCHEMA_VERSION) fail('UNSUPPORTED_INDEX_SCHEMA')
  const point = normalizePoint(blockValue.point, 'block.point')
  const parentPoint = normalizePoint(blockValue.parentPoint, 'block.parentPoint')
  if (!samePoint(parentPoint, state.currentPoint)) fail('BLOCK_PARENT_MISMATCH')
  const isGenesisAnchor = samePoint(state.currentPoint, PRE_SNAPSHOT_ORIGIN_POINT)
  const expectedBlockNo = isGenesisAnchor ? 0 : state.currentPoint.blockNo + 1
  if (point.blockNo !== expectedBlockNo || point.slot <= state.currentPoint.slot) {
    fail('BLOCK_SEQUENCE_MISMATCH')
  }

  const transactions = requiredArray(blockValue.transactions, 'block.transactions')
  const utxos = indexMap(state)
  const created = []
  const createdSet = new Set()
  const spent = []
  const consumedInBlock = new Set()
  const seenTransactions = new Set()
  let validMint = 0n
  const before = totalQuantity(utxos)

  for (let txIndex = 0; txIndex < transactions.length; txIndex += 1) {
    const tx = requiredObject(transactions[txIndex], `block.transactions[${txIndex}]`)
    const txId = normalizeHex(tx.id, `block.transactions[${txIndex}].id`, { bytes: 32 })
    if (seenTransactions.has(txId)) fail(`DUPLICATE_TRANSACTION:${txId}`)
    seenTransactions.add(txId)

    if (tx.spends !== 'inputs' && tx.spends !== 'collaterals') {
      fail(`UNKNOWN_TRANSACTION_SPENDS:${txIndex}`)
    }
    const inputs = requiredArray(tx.inputs, `tx[${txIndex}].inputs`)
    const collaterals = requiredArray(tx.collaterals, `tx[${txIndex}].collaterals`)
    const outputs = requiredArray(tx.outputs, `tx[${txIndex}].outputs`)
    const mint = requiredArray(tx.mint, `tx[${txIndex}].mint`)
    if (tx.spends === 'collaterals' && collaterals.length === 0) {
      fail(`MISSING_COLLATERAL_INPUTS:${txIndex}`)
    }
    if (tx.spends === 'inputs' && tx.collateralReturn !== null && tx.collateralReturn !== undefined) {
      fail(`UNEXPECTED_COLLATERAL_RETURN:${txIndex}`)
    }
    const effectiveInputs = tx.spends === 'inputs' ? inputs : collaterals

    for (let inputIndex = 0; inputIndex < effectiveInputs.length; inputIndex += 1) {
      const ref = normalizeOutRef(effectiveInputs[inputIndex], `tx[${txIndex}].effectiveInputs[${inputIndex}]`)
      if (consumedInBlock.has(ref.key)) fail(`DUPLICATE_CONSUMED_INPUT:${ref.key}`)
      consumedInBlock.add(ref.key)
      const previous = utxos.get(ref.key)
      if (previous !== undefined) {
        utxos.delete(ref.key)
        if (createdSet.has(ref.key)) {
          createdSet.delete(ref.key)
          const createdIndex = created.indexOf(ref.key)
          if (createdIndex < 0) fail('BLOCK_CREATED_UTXO_TRACKING_CORRUPT')
          created.splice(createdIndex, 1)
        } else {
          spent.push({ key: ref.key, output: cloneOutput(previous) })
        }
      }
    }

    if (tx.spends === 'inputs') {
      validMint += targetMintQuantity(mint, state.asset, `tx[${txIndex}].mint`)
      for (let outputIndex = 0; outputIndex < outputs.length; outputIndex += 1) {
        addTrackedOutput(
          utxos,
          created,
          createdSet,
          txId,
          outputIndex,
          outputs[outputIndex],
          state.asset,
          `tx[${txIndex}].outputs[${outputIndex}]`
        )
      }
    } else if (tx.collateralReturn !== null && tx.collateralReturn !== undefined) {
      // Cardano assigns collateral-return the index immediately after ordinary outputs.
      addTrackedOutput(
        utxos,
        created,
        createdSet,
        txId,
        outputs.length,
        tx.collateralReturn,
        state.asset,
        `tx[${txIndex}].collateralReturn`
      )
    }
  }

  const after = totalQuantity(utxos)
  if (after - before !== validMint) fail('BLOCK_ASSET_CONSERVATION_MISMATCH')

  const historyEntry = Object.freeze({
    point,
    parentPoint: state.currentPoint,
    created: Object.freeze([...created]),
    spent: Object.freeze(spent.map(item => Object.freeze({
      key: item.key,
      output: cloneOutput(item.output)
    })))
  })
  return cloneIndexState(
    state,
    utxos,
    point,
    [...state.history, historyEntry]
  )
}

/**
 * Roll the index back to the bootstrap point or a retained ancestor point.
 */
export function rollbackPreSnapshotIndex(state, targetValue) {
  requiredObject(state, 'state')
  const target = normalizePoint(targetValue, 'rollback.target')
  const known = samePoint(state.anchorPoint, target) ||
    state.history.some(entry => samePoint(entry.point, target))
  if (!known) fail('ROLLBACK_POINT_NOT_RETAINED')

  const utxos = indexMap(state)
  const history = [...state.history]
  let currentPoint = state.currentPoint

  while (!samePoint(currentPoint, target)) {
    const entry = history.pop()
    if (!entry || !samePoint(entry.point, currentPoint)) fail('ROLLBACK_HISTORY_CORRUPT')

    for (const key of entry.created) {
      if (!utxos.has(key)) fail(`ROLLBACK_CREATED_UTXO_MISSING:${key}`)
      utxos.delete(key)
    }
    for (const item of entry.spent) {
      if (utxos.has(item.key)) fail(`ROLLBACK_SPENT_UTXO_ALREADY_EXISTS:${item.key}`)
      utxos.set(item.key, cloneOutput(item.output))
    }
    currentPoint = entry.parentPoint
  }

  return cloneIndexState(state, utxos, target, history)
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest()
}

function u32(value) {
  const result = Buffer.alloc(4)
  result.writeUInt32BE(value)
  return result
}

function lengthPrefixed(bytes) {
  return Buffer.concat([u32(bytes.length), bytes])
}

function leafNode(addressHex, quantity) {
  const address = Buffer.from(addressHex, 'hex')
  const quantityBytes = Buffer.from(quantity.toString(), 'ascii')
  const hash = sha256(Buffer.concat([
    Buffer.from('IMMORTAL-PRE-LEAF-V1\0', 'ascii'),
    lengthPrefixed(address),
    lengthPrefixed(quantityBytes)
  ]))
  return { hash, sum: quantity }
}

function parentNode(left, right) {
  const leftSum = Buffer.from(left.sum.toString(), 'ascii')
  const rightSum = Buffer.from(right.sum.toString(), 'ascii')
  const hash = sha256(Buffer.concat([
    Buffer.from('IMMORTAL-PRE-NODE-V1\0', 'ascii'),
    left.hash,
    lengthPrefixed(leftSum),
    right.hash,
    lengthPrefixed(rightSum)
  ]))
  return { hash, sum: left.sum + right.sum }
}

function merkleSumRoot(leaves) {
  if (leaves.length === 0) {
    return sha256(Buffer.from('IMMORTAL-PRE-EMPTY-V1\0', 'ascii')).toString('hex')
  }
  let level = leaves.map(leaf => leafNode(leaf.addressHex, BigInt(leaf.quantity)))
  while (level.length > 1) {
    const next = []
    for (let index = 0; index < level.length; index += 2) {
      next.push(index + 1 < level.length
        ? parentNode(level[index], level[index + 1])
        : level[index])
    }
    level = next
  }
  return level[0].hash.toString('hex')
}

/**
 * Build a deterministic test snapshot message from the current indexed state.
 * Address bytes are the deliberately non-normative test identity.
 */
export function buildPreSnapshotMessage(state) {
  requiredObject(state, 'state')
  const balances = new Map()
  for (const output of state.utxos) {
    balances.set(
      output.addressHex,
      (balances.get(output.addressHex) ?? 0n) + BigInt(output.quantity)
    )
  }
  const leaves = [...balances.entries()]
    .map(([addressHex, quantity]) => ({ addressHex, quantity: quantity.toString() }))
    .sort((left, right) => left.addressHex < right.addressHex ? -1 : left.addressHex > right.addressHex ? 1 : 0)

  const total = leaves.reduce((sum, leaf) => sum + BigInt(leaf.quantity), 0n)
  const message = Object.freeze({
    moduleId: PRE_SNAPSHOT_MODULE_ID,
    schemaVersion: PRE_SNAPSHOT_INDEX_SCHEMA_VERSION,
    encodingVersion: PRE_SNAPSHOT_ENCODING_VERSION,
    networkId: state.networkId,
    point: Object.freeze({
      slot: state.currentPoint.slot,
      blockNo: state.currentPoint.blockNo,
      hash: state.currentPoint.hash
    }),
    asset: Object.freeze({
      policyIdHex: state.asset.policyIdHex,
      assetNameHex: state.asset.assetNameHex
    }),
    identityRule: 'raw-address-bytes-test-only-v1',
    leafCount: leaves.length,
    totalQuantity: total.toString(),
    merkleSumRoot: merkleSumRoot(leaves)
  })
  const canonicalBytes = Buffer.from(JSON.stringify(message), 'utf8')
  return Object.freeze({
    message: Object.freeze(message),
    canonicalBytes,
    digestHex: sha256(canonicalBytes).toString('hex'),
    leaves: Object.freeze(leaves.map(leaf => Object.freeze(leaf)))
  })
}

export function inspectPreSnapshotIndex(state) {
  requiredObject(state, 'state')
  const entries = state.utxos
  return Object.freeze({
    schemaVersion: state.schemaVersion,
    networkId: state.networkId,
    currentPoint: state.currentPoint,
    utxoCount: entries.length,
    totalQuantity: entries.reduce((sum, entry) => sum + BigInt(entry.quantity), 0n).toString(),
    entries: Object.freeze(entries)
  })
}
