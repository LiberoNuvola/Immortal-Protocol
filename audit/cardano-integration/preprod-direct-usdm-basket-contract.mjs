import { createHash } from 'node:crypto'

const POLICY_HEX_LENGTH = 56
const MAX_ASSET_NAME_HEX_LENGTH = 64
const TX_HASH_HEX_LENGTH = 64

function parseQuantity(value, field) {
  let parsed
  if (typeof value === 'bigint') {
    parsed = value
  } else if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error(field + ' must be a safe integer')
    parsed = BigInt(value)
  } else if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    parsed = BigInt(value)
  } else {
    throw new Error(field + ' must be an integer quantity')
  }
  if (parsed < 0n) throw new Error(field + ' must not be negative')
  return parsed
}

export function normalizeAssetUnit(unit, field = 'asset unit') {
  if (typeof unit !== 'string' || !/^[0-9a-f]+$/i.test(unit)) {
    throw new Error(field + ' must be hexadecimal')
  }
  if (
    unit.length < POLICY_HEX_LENGTH ||
    unit.length > POLICY_HEX_LENGTH + MAX_ASSET_NAME_HEX_LENGTH ||
    unit.length % 2 !== 0
  ) {
    throw new Error(field + ' has an invalid policy/name length')
  }
  return unit.toLowerCase()
}

export function parseExactPoolOutputReference(value) {
  if (typeof value !== 'string') throw new Error('Pool output reference must be a string')
  const match = new RegExp('^([0-9a-f]{' + TX_HASH_HEX_LENGTH + '})#(0|[1-9]\\d*)$', 'i').exec(value)
  if (!match) throw new Error('Pool output reference must be an exact txHash#outputIndex')
  const index = Number(match[2])
  if (!Number.isSafeInteger(index)) throw new Error('Pool output index must be a safe integer')
  return { canonical: match[1].toLowerCase() + '#' + String(index), txHash: match[1].toLowerCase(), outputIndex: index }
}

export function selectExactPoolOutput(utxoSet, poolOutputReference) {
  if (!Array.isArray(utxoSet)) throw new Error('Koios UTxO set must be an array')
  const expected = parseExactPoolOutputReference(poolOutputReference)
  const matches = utxoSet.filter((utxo) => {
    if (!utxo || typeof utxo.tx_hash !== 'string') return false
    const outputIndex = Number(utxo.tx_index)
    return (
      /^[0-9a-f]{64}$/i.test(utxo.tx_hash) &&
      utxo.tx_hash.toLowerCase() === expected.txHash &&
      Number.isSafeInteger(outputIndex) &&
      outputIndex === expected.outputIndex
    )
  })
  if (matches.length !== 1) {
    throw new Error('Exact B1 PrizePool UTxO must match exactly once in the live address response')
  }
  return matches[0]
}

function unitFromKoiosAsset(asset, index) {
  if (!asset || typeof asset.policy_id !== 'string' || typeof asset.asset_name !== 'string') {
    throw new Error('Koios asset record ' + index + ' is malformed')
  }
  if (!/^[0-9a-f]{56}$/i.test(asset.policy_id)) {
    throw new Error('Koios asset record ' + index + ' has an invalid policy id')
  }
  if (!/^(?:[0-9a-f]{2}){0,32}$/i.test(asset.asset_name)) {
    throw new Error('Koios asset record ' + index + ' has an invalid asset name')
  }
  return (asset.policy_id + asset.asset_name).toLowerCase()
}

function basketDigest(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

/**
 * Canonical positive-asset basket contract shared by EV3 source production,
 * qualification and protected approval. This is evidence-layer validation;
 * it does not change on-chain validator or economic semantics.
 */
export function canonicalizeDirectUsdmBasket({
  poolOutputReference,
  poolAddress,
  poolTokenUnit,
  approvedTusdmUnit,
  lovelace,
  assetList,
}) {
  const reference = parseExactPoolOutputReference(poolOutputReference)
  if (typeof poolAddress !== 'string' || poolAddress.trim().length === 0) {
    throw new Error('Pool address is required')
  }
  const poolUnit = normalizeAssetUnit(poolTokenUnit, 'Pool singleton unit')
  const tusdmUnit = normalizeAssetUnit(approvedTusdmUnit, 'approved tUSDM unit')
  if (poolUnit === tusdmUnit) throw new Error('Pool singleton and tUSDM units must be distinct')
  const lovelaceQuantity = parseQuantity(lovelace, 'lovelace quantity')
  if (!Array.isArray(assetList)) throw new Error('Koios asset list must be an array')

  const seen = new Set()
  const positiveAssets = []
  for (let index = 0; index < assetList.length; index += 1) {
    const asset = assetList[index]
    const unit = unitFromKoiosAsset(asset, index)
    if (seen.has(unit)) throw new Error('Duplicate Koios asset unit: ' + unit)
    seen.add(unit)
    const quantity = parseQuantity(asset.quantity, 'asset quantity at index ' + index)
    if (quantity > 0n) positiveAssets.push({ unit, quantity: quantity.toString() })
  }

  positiveAssets.sort((a, b) => a.unit.localeCompare(b.unit))
  const quantityByUnit = new Map(positiveAssets.map(({ unit, quantity }) => [unit, BigInt(quantity)]))
  if (quantityByUnit.get(poolUnit) !== 1n) {
    throw new Error('Exact Pool singleton must have quantity exactly one')
  }
  if ((quantityByUnit.get(tusdmUnit) ?? 0n) <= 0n) {
    throw new Error('Approved physical tUSDM must be strictly positive')
  }
  for (const { unit } of positiveAssets) {
    if (unit !== poolUnit && unit !== tusdmUnit) {
      throw new Error('Unqualified positive native asset in Pool basket: ' + unit)
    }
  }

  if (lovelaceQuantity <= 0n) throw new Error('Pool lovelace envelope must be strictly positive')

  const payload = {
    poolOutputReference: reference.canonical,
    poolAddress,
    poolTokenUnit: poolUnit,
    approvedTusdmUnit: tusdmUnit,
    lovelaceQuantity: lovelaceQuantity.toString(),
    positiveAssets,
  }
  return { ...payload, basketDigest: basketDigest(payload) }
}

export function verifyDirectUsdmBasket(basket) {
  if (!basket || typeof basket !== 'object' || Array.isArray(basket)) return false
  const expectedKeys = [
    'poolOutputReference',
    'poolAddress',
    'poolTokenUnit',
    'approvedTusdmUnit',
    'lovelaceQuantity',
    'positiveAssets',
    'basketDigest',
  ].sort()
  if (Object.keys(basket).sort().join('|') !== expectedKeys.join('|')) return false
  if (typeof basket.basketDigest !== 'string' || !/^[0-9a-f]{64}$/.test(basket.basketDigest)) return false
  if (!Array.isArray(basket.positiveAssets)) return false
  try {
    const assetList = basket.positiveAssets.map((entry, index) => {
      if (!entry || typeof entry.unit !== 'string' || typeof entry.quantity !== 'string') {
        throw new Error('positive asset record ' + index + ' is malformed')
      }
      const unit = normalizeAssetUnit(entry.unit, 'positive asset unit')
      return {
        policy_id: unit.slice(0, POLICY_HEX_LENGTH),
        asset_name: unit.slice(POLICY_HEX_LENGTH),
        quantity: entry.quantity,
      }
    })
    const canonical = canonicalizeDirectUsdmBasket({
      poolOutputReference: basket.poolOutputReference,
      poolAddress: basket.poolAddress,
      poolTokenUnit: basket.poolTokenUnit,
      approvedTusdmUnit: basket.approvedTusdmUnit,
      lovelace: basket.lovelaceQuantity,
      assetList,
    })
    return canonical.basketDigest === basket.basketDigest
  } catch {
    return false
  }
}
