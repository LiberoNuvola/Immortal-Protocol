import { PRE_SNAPSHOT_ORIGIN_POINT } from './preSnapshotUtxoIndex.mjs'

const HEX_32 = /^[0-9a-f]{64}$/
const HEX_POLICY = /^[0-9a-f]{56}$/
const HEX_ASSET_NAME = /^(?:[0-9a-f]{2}){0,32}$/
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BECH32_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function fail(code) {
  throw new Error(code)
}

function isObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function requireObject(value, field) {
  if (!isObject(value)) fail('OGMIOS_INVALID_OBJECT:' + field)
  return value
}

function requireArray(value, field) {
  if (!Array.isArray(value)) fail('OGMIOS_INVALID_ARRAY:' + field)
  return value
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.length === 0) fail('OGMIOS_INVALID_STRING:' + field)
  return value
}

function integerBigInt(value, field, allowNegative = false) {
  let result
  if (typeof value === 'bigint') {
    result = value
  } else if (typeof value === 'string' && /^-?(0|[1-9][0-9]*)$/.test(value)) {
    result = BigInt(value)
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    result = BigInt(value)
  } else {
    fail('OGMIOS_INVALID_INTEGER:' + field)
  }
  if (!allowNegative && result < 0n) fail('OGMIOS_NEGATIVE_INTEGER:' + field)
  return result
}

function safeNumber(value, field) {
  const number = integerBigInt(value, field)
  if (number > BigInt(Number.MAX_SAFE_INTEGER)) fail('OGMIOS_INTEGER_OUT_OF_RANGE:' + field)
  return Number(number)
}

function normalizeHex(value, field, pattern) {
  if (typeof value !== 'string') fail('OGMIOS_INVALID_HEX_TYPE:' + field)
  const normalized = value.toLowerCase()
  if (!pattern.test(normalized)) fail('OGMIOS_INVALID_HEX:' + field)
  return normalized
}

function bech32Polymod(values) {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let bit = 0; bit < 5; bit += 1) {
      if (((top >>> bit) & 1) !== 0) checksum ^= BECH32_GENERATORS[bit]
    }
  }
  return checksum >>> 0
}

function expandHrp(hrp) {
  const high = []
  const low = []
  for (let index = 0; index < hrp.length; index += 1) {
    const code = hrp.charCodeAt(index)
    high.push(code >>> 5)
    low.push(code & 31)
  }
  return high.concat([0], low)
}

function convertBits(words, fromBits, toBits, pad) {
  let accumulator = 0
  let bits = 0
  const result = []
  const maxValue = (1 << toBits) - 1
  const maxAccumulator = (1 << (fromBits + toBits - 1)) - 1

  for (const word of words) {
    if (!Number.isInteger(word) || word < 0 || (word >>> fromBits) !== 0) {
      fail('OGMIOS_BECH32_INVALID_WORD')
    }
    accumulator = ((accumulator << fromBits) | word) & maxAccumulator
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      result.push((accumulator >>> bits) & maxValue)
    }
  }

  if (pad) {
    if (bits > 0) result.push((accumulator << (toBits - bits)) & maxValue)
  } else {
    if (bits >= fromBits) fail('OGMIOS_BECH32_EXCESS_PADDING')
    if (((accumulator << (toBits - bits)) & maxValue) !== 0) fail('OGMIOS_BECH32_NONZERO_PADDING')
  }
  return result
}

function decodeBech32Address(address) {
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    fail('OGMIOS_BECH32_MIXED_CASE')
  }
  const normalized = address.toLowerCase()
  const separator = normalized.lastIndexOf('1')
  if (separator < 1 || separator + 7 > normalized.length) fail('OGMIOS_BECH32_SEPARATOR')
  const hrp = normalized.slice(0, separator)
  if (hrp !== 'addr' && hrp !== 'addr_test') fail('OGMIOS_BECH32_ADDRESS_HRP')
  const words = []
  for (const character of normalized.slice(separator + 1)) {
    const word = BECH32_CHARSET.indexOf(character)
    if (word < 0) fail('OGMIOS_BECH32_CHARACTER')
    words.push(word)
  }
  if (bech32Polymod(expandHrp(hrp).concat(words)) !== 1) fail('OGMIOS_BECH32_CHECKSUM')
  const bytes = convertBits(words.slice(0, -6), 5, 8, false)
  return Buffer.from(bytes).toString('hex')
}

function decodeBase58Address(address) {
  let value = 0n
  for (const character of address) {
    const digit = BASE58_ALPHABET.indexOf(character)
    if (digit < 0) fail('OGMIOS_BASE58_CHARACTER')
    value = value * 58n + BigInt(digit)
  }
  let hex = value === 0n ? '' : value.toString(16)
  if (hex.length % 2 !== 0) hex = '0' + hex
  const body = hex.length === 0 ? Buffer.alloc(0) : Buffer.from(hex, 'hex')
  let leadingZeros = 0
  while (leadingZeros < address.length && address[leadingZeros] === '1') leadingZeros += 1
  const bytes = Buffer.concat([Buffer.alloc(leadingZeros), body])
  if (bytes.length === 0 || bytes.length > 128) fail('OGMIOS_BASE58_ADDRESS_LENGTH')
  return bytes.toString('hex')
}

export function decodeOgmiosAddress(addressValue) {
  const address = requireString(addressValue, 'output.address')
  let result
  if (address.startsWith('addr1') || address.startsWith('addr_test1') ||
      address.startsWith('ADDR1') || address.startsWith('ADDR_TEST1')) {
    result = decodeBech32Address(address)
  } else {
    result = decodeBase58Address(address)
  }
  const bytes = result.length / 2
  if (bytes < 1 || bytes > 128) fail('OGMIOS_ADDRESS_BYTES_LENGTH')
  return result
}

function decodeAssetMap(value, field, allowNegative = false, requireAda = false) {
  const record = requireObject(value, field)
  if (requireAda) {
    const ada = requireObject(record.ada, field + '.ada')
    integerBigInt(ada.lovelace, field + '.ada.lovelace')
  }
  const assets = []
  for (const policyCandidate of Object.keys(record)) {
    if (policyCandidate === 'ada') continue
    const policyIdHex = normalizeHex(policyCandidate, field + '.policyId', HEX_POLICY)
    const names = requireObject(record[policyCandidate], field + '.policy[' + policyIdHex + ']')
    for (const assetCandidate of Object.keys(names)) {
      const assetNameHex = normalizeHex(assetCandidate, field + '.assetName', HEX_ASSET_NAME)
      const quantity = integerBigInt(
        names[assetCandidate],
        field + '.quantity',
        allowNegative
      )
      if (quantity === 0n) fail('OGMIOS_ZERO_ASSET_QUANTITY:' + field)
      assets.push({
        policyIdHex,
        assetNameHex,
        quantity: quantity.toString()
      })
    }
  }
  return assets
}

function decodeOutput(outputValue, field) {
  const output = requireObject(outputValue, field)
  return {
    addressHex: decodeOgmiosAddress(output.address),
    assets: decodeAssetMap(output.value, field + '.value', false, true)
  }
}

function decodeOutputReference(referenceValue, field) {
  const reference = requireObject(referenceValue, field)
  const transaction = requireObject(reference.transaction, field + '.transaction')
  return {
    txId: normalizeHex(transaction.id, field + '.transaction.id', HEX_32),
    index: integerBigInt(reference.index, field + '.index').toString()
  }
}

function decodeTransaction(transactionValue, field) {
  const transaction = requireObject(transactionValue, field)
  const spends = transaction.spends
  if (spends !== 'inputs' && spends !== 'collaterals') {
    fail('OGMIOS_UNKNOWN_SPENDS:' + field)
  }

  const inputs = requireArray(transaction.inputs, field + '.inputs')
    .map((reference, index) => decodeOutputReference(reference, field + '.inputs[' + index + ']'))
  const collaterals = transaction.collaterals === undefined
    ? []
    : requireArray(transaction.collaterals, field + '.collaterals')
      .map((reference, index) => decodeOutputReference(reference, field + '.collaterals[' + index + ']'))

  if (spends === 'collaterals' && collaterals.length === 0) {
    fail('OGMIOS_MISSING_COLLATERALS:' + field)
  }

  const outputs = transaction.outputs === undefined
    ? []
    : requireArray(transaction.outputs, field + '.outputs')
      .map((output, index) => decodeOutput(output, field + '.outputs[' + index + ']'))

  const collateralReturn = transaction.collateralReturn === undefined || transaction.collateralReturn === null
    ? null
    : decodeOutput(transaction.collateralReturn, field + '.collateralReturn')

  if (spends === 'inputs' && collateralReturn !== null) {
    fail('OGMIOS_UNEXPECTED_COLLATERAL_RETURN:' + field)
  }

  const mint = transaction.mint === undefined
    ? []
    : decodeAssetMap(transaction.mint, field + '.mint', true, false)

  return {
    id: normalizeHex(transaction.id, field + '.id', HEX_32),
    spends,
    inputs,
    collaterals,
    outputs,
    collateralReturn,
    mint
  }
}

export function decodeOgmiosV7Block(blockValue, currentPoint) {
  const block = requireObject(blockValue, 'block')
  if (block.type !== 'praos') fail('OGMIOS_UNSUPPORTED_BLOCK_TYPE')
  const supportedEras = new Set(['shelley', 'allegra', 'mary', 'alonzo', 'babbage', 'conway'])
  if (!supportedEras.has(block.era)) fail('OGMIOS_UNSUPPORTED_ERA:' + String(block.era))

  const parentHash = block.ancestor
  if (parentHash === 'genesis') {
    if (currentPoint.slot !== 0 || currentPoint.blockNo !== 0 || currentPoint.hash !== PRE_SNAPSHOT_ORIGIN_POINT.hash) {
      fail('OGMIOS_UNEXPECTED_GENESIS_ANCESTOR')
    }
  } else if (normalizeHex(parentHash, 'block.ancestor', HEX_32) !== currentPoint.hash) {
    fail('OGMIOS_BLOCK_ANCESTOR_MISMATCH')
  }

  const point = {
    slot: safeNumber(block.slot, 'block.slot'),
    blockNo: safeNumber(block.height, 'block.height'),
    hash: normalizeHex(block.id, 'block.id', HEX_32)
  }
  const transactions = block.transactions === undefined
    ? []
    : requireArray(block.transactions, 'block.transactions')
      .map((transaction, index) => decodeTransaction(transaction, 'block.transactions[' + index + ']'))

  return {
    parentPoint: currentPoint,
    point,
    transactions
  }
}

function samePoint(left, right) {
  return left !== null && right !== null &&
    left.slot === right.slot &&
    left.blockNo === right.blockNo &&
    left.hash === right.hash
}

function pointToOgmios(point) {
  return { slot: point.slot, id: point.hash }
}

function findRetainedPoint(state, slot, id) {
  const candidates = [
    state.currentPoint,
    ...state.history.slice().reverse().map(entry => entry.point),
    state.anchorPoint
  ]
  const matches = candidates.filter(point => point.slot === slot && point.hash === id)
  const unique = []
  const seen = new Set()
  for (const match of matches) {
    const key = match.slot + ':' + match.blockNo + ':' + match.hash
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(match)
    }
  }
  if (unique.length !== 1) fail('OGMIOS_ROLLBACK_POINT_NOT_RETAINED')
  return unique[0]
}

export function resolveOgmiosV7RollbackPoint(pointValue, state) {
  if (pointValue === 'origin') {
    if (!samePoint(state.anchorPoint, PRE_SNAPSHOT_ORIGIN_POINT)) {
      fail('OGMIOS_ROLLBACK_BEFORE_BOOTSTRAP_ANCHOR')
    }
    return state.anchorPoint
  }
  const point = requireObject(pointValue, 'rollback.point')
  const slot = safeNumber(point.slot, 'rollback.point.slot')
  const id = normalizeHex(point.id, 'rollback.point.id', HEX_32)
  return findRetainedPoint(state, slot, id)
}

export function getOgmiosV7IntersectionPoints(state, maxPoints = 128) {
  if (!Number.isInteger(maxPoints) || maxPoints < 1) fail('OGMIOS_INVALID_INTERSECTION_LIMIT')
  const hasOrigin = samePoint(state.anchorPoint, PRE_SNAPSHOT_ORIGIN_POINT)
  const pointLimit = hasOrigin ? Math.max(0, maxPoints - 1) : maxPoints
  const candidates = [
    state.currentPoint,
    ...state.history.slice().reverse().map(entry => entry.point),
    ...(hasOrigin ? [] : [state.anchorPoint])
  ]
  const points = []
  const seen = new Set()
  for (const point of candidates) {
    const key = point.slot + ':' + point.hash
    if (seen.has(key)) continue
    seen.add(key)
    points.push(pointToOgmios(point))
    if (points.length >= pointLimit) break
  }
  if (hasOrigin) points.push('origin')
  return points
}

export function decodeOgmiosV7ChainSyncResult(resultValue, state) {
  const result = requireObject(resultValue, 'chainSync.result')
  if (result.direction === 'forward') {
    return {
      direction: 'forward',
      block: decodeOgmiosV7Block(result.block, state.currentPoint),
      tip: result.tip
    }
  }
  if (result.direction === 'backward') {
    return {
      direction: 'backward',
      point: resolveOgmiosV7RollbackPoint(result.point, state),
      tip: result.tip
    }
  }
  fail('OGMIOS_UNKNOWN_CHAIN_SYNC_DIRECTION')
}
