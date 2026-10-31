export const SUNDAE_V3_POOL_SCRIPT_HASH = 'e0302560ced2fdcbfcb2602697df970cd0d6a38f94b32703f51c312b'
export const SUNDAE_V3_POOL_NFT_PREFIX = '000de140'
export const SUNDAE_V3_POOL_LP_PREFIX = '0014df10'
export const SUNDAE_USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'

function constr(value, index, count, name) {
  if (!value || value.constructor !== index || !Array.isArray(value.fields) ||
      (count !== null && value.fields.length !== count)) {
    throw new Error(name + '_CONSTRUCTOR_SHAPE_INVALID')
  }
  return value.fields
}
function list(value, count, name) {
  if (!value || !Array.isArray(value.list) || (count !== null && value.list.length !== count)) {
    throw new Error(name + '_LIST_SHAPE_INVALID')
  }
  return value.list
}
function bytes(value, name) {
  if (!value || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error(name + '_BYTES_INVALID')
  }
  return value.bytes.toLowerCase()
}
function integer(value, name) {
  if (!value || !['number', 'string', 'bigint'].includes(typeof value.int) ||
      !/^-?\d+$/.test(String(value.int))) throw new Error(name + '_INT_INVALID')
  return BigInt(String(value.int))
}
function parseAsset(value, name) {
  const pair = list(value, 2, name)
  const policyId = bytes(pair[0], name + '_POLICY')
  const assetNameHex = bytes(pair[1], name + '_NAME')
  if (policyId !== '' && policyId.length !== 56) throw new Error(name + '_POLICY_LENGTH_INVALID')
  if (assetNameHex.length > 64) throw new Error(name + '_ASSET_NAME_TOO_LONG')
  return { policyId, assetNameHex, unit: policyId + assetNameHex }
}
function compareAsset(a, b) {
  return a.policyId.localeCompare(b.policyId) || a.assetNameHex.localeCompare(b.assetNameHex)
}
function quantityOf(assets, unit) {
  const item = assets.find((asset) => asset.unit === unit)
  return BigInt(String(item?.quantityRaw ?? '0'))
}

export function decodeSundaeV3PoolDatum(value) {
  const fields = constr(value, 0, 8, 'SUNDAE_V3_POOL_DATUM')
  const identifier = bytes(fields[0], 'POOL_IDENTIFIER')
  if (identifier.length !== 56) throw new Error('POOL_IDENTIFIER_LENGTH_INVALID')
  const pair = list(fields[1], 2, 'POOL_ASSET_PAIR')
  const assetA = parseAsset(pair[0], 'ASSET_A')
  const assetB = parseAsset(pair[1], 'ASSET_B')
  if (assetA.unit === assetB.unit) throw new Error('POOL_PAIR_ASSETS_IDENTICAL')
  if (compareAsset(assetA, assetB) >= 0) throw new Error('POOL_PAIR_NOT_CANONICALLY_SORTED')
  const feeManager = fields[5]
  if (!((feeManager?.constructor === 1 && Array.isArray(feeManager.fields) && feeManager.fields.length === 0) ||
        (feeManager?.constructor === 0 && Array.isArray(feeManager.fields) && feeManager.fields.length === 1))) {
    throw new Error('POOL_FEE_MANAGER_OPTION_SHAPE_UNSUPPORTED')
  }
  const datum = {
    identifier,
    assetA,
    assetB,
    circulatingLp: integer(fields[2], 'CIRCULATING_LP'),
    bidFeesPer10000: integer(fields[3], 'BID_FEES_PER_10000'),
    askFeesPer10000: integer(fields[4], 'ASK_FEES_PER_10000'),
    feeManager,
    marketOpen: integer(fields[6], 'MARKET_OPEN'),
    protocolFees: integer(fields[7], 'PROTOCOL_FEES'),
  }
  if (datum.circulatingLp < 0n || datum.bidFeesPer10000 < 0n ||
      datum.askFeesPer10000 < 0n || datum.marketOpen < 0n || datum.protocolFees < 0n) {
    throw new Error('POOL_DATUM_NEGATIVE_FIELD')
  }
  if (datum.bidFeesPer10000 > 10_000n || datum.askFeesPer10000 > 10_000n) {
    throw new Error('POOL_FEE_OUT_OF_RANGE')
  }
  return datum
}

export function validateSundaeV3PoolUtxo(candidate) {
  const reasons = []
  let datum
  try {
    datum = decodeSundaeV3PoolDatum(candidate.inlineDatumJson)
  } catch (error) {
    return { status: 'UNQUALIFIED', reasons: [error instanceof Error ? error.message : String(error)] }
  }
  if (candidate.paymentCredential !== SUNDAE_V3_POOL_SCRIPT_HASH) reasons.push('POOL_PAYMENT_CREDENTIAL_MISMATCH')
  if (datum.assetA.unit !== SUNDAE_USDM_UNIT && datum.assetB.unit !== SUNDAE_USDM_UNIT) {
    reasons.push('EXACT_USDM_NOT_IN_POOL_DATUM_PAIR')
  }
  const nftUnit = SUNDAE_V3_POOL_SCRIPT_HASH + SUNDAE_V3_POOL_NFT_PREFIX + datum.identifier
  const lpUnit = SUNDAE_V3_POOL_SCRIPT_HASH + SUNDAE_V3_POOL_LP_PREFIX + datum.identifier
  const assets = (candidate.assets ?? []).map((asset) => ({
    unit: String(asset.policy_id ?? '').toLowerCase() + String(asset.asset_name ?? '').toLowerCase(),
    quantityRaw: String(asset.quantity ?? '0'),
  }))
  if (quantityOf(assets, nftUnit) !== 1n) reasons.push('POOL_NFT_QUANTITY_NOT_ONE')
  const isAdaA = datum.assetA.unit === ''
  const isAdaB = datum.assetB.unit === ''
  if (isAdaB) reasons.push('ADA_ASSET_ORDER_INVALID')
  const allowedUnits = new Set([nftUnit])
  if (!isAdaA) allowedUnits.add(datum.assetA.unit)
  if (!isAdaB) allowedUnits.add(datum.assetB.unit)
  if (assets.some((asset) => !allowedUnits.has(asset.unit)) ||
      [...allowedUnits].filter((unit) => unit !== nftUnit).some((unit) => quantityOf(assets, unit) <= 0n)) {
    reasons.push('POOL_VALUE_ASSET_COMPOSITION_INVALID')
  }
  const lovelace = BigInt(String(candidate.valueLovelaceRaw ?? '0'))
  const valueA = isAdaA ? lovelace : quantityOf(assets, datum.assetA.unit)
  const valueB = quantityOf(assets, datum.assetB.unit)
  const reserveA = valueA - (isAdaA ? datum.protocolFees : 0n)
  const reserveB = valueB
  const expectedLovelace = datum.protocolFees + (isAdaA ? reserveA : 0n)
  if (lovelace !== expectedLovelace) reasons.push('POOL_LOVELACE_PROTOCOL_FEE_COMPOSITION_MISMATCH')
  if (reserveA <= 0n || reserveB <= 0n || datum.circulatingLp <= 0n) reasons.push('POOL_ACTIVE_RESERVES_OR_LP_NONPOSITIVE')
  return {
    status: reasons.length === 0 ? 'MATCH' : 'UNQUALIFIED',
    reasons,
    datum: {
      identifier: datum.identifier,
      assetA: { policyId: datum.assetA.policyId, assetNameHex: datum.assetA.assetNameHex },
      assetB: { policyId: datum.assetB.policyId, assetNameHex: datum.assetB.assetNameHex },
      circulatingLpRaw: datum.circulatingLp.toString(),
      bidFeesPer10000Raw: datum.bidFeesPer10000.toString(),
      askFeesPer10000Raw: datum.askFeesPer10000.toString(),
      marketOpenRaw: datum.marketOpen.toString(),
      protocolFeesRaw: datum.protocolFees.toString(),
    },
    poolNft: { unit: nftUnit, quantityRaw: quantityOf(assets, nftUnit).toString() },
    expectedLpAsset: { unit: lpUnit },
    reserveARaw: reserveA.toString(),
    reserveBRaw: reserveB.toString(),
  }
}

function apiAssetUnit(asset) {
  const id = String(asset?.assetId ?? '').toLowerCase()
  if (id === 'ada.lovelace') return ''
  const dot = id.indexOf('.')
  if (dot <= 0) throw new Error('SUNDAE_API_ASSET_ID_INVALID')
  return id.slice(0, dot) + id.slice(dot + 1)
}

export function reconcileSundaeV3PoolWithApi(validation, apiPool) {
  const reasons = []
  if (validation?.status !== 'MATCH') return { status: 'ONCHAIN_POOL_UNQUALIFIED', reasons: ['ONCHAIN_POOL_NOT_MATCHED'] }
  if (!apiPool || apiPool.version !== 'V3') reasons.push('SUNDAE_API_V3_POOL_MISSING')
  if (apiPool) {
    if (String(apiPool.id).toLowerCase() !== validation.datum.identifier) reasons.push('SUNDAE_API_POOL_ID_MISMATCH')
    if (apiAssetUnit(apiPool.assetA) !== validation.datum.assetA.policyId + validation.datum.assetA.assetNameHex ||
        apiAssetUnit(apiPool.assetB) !== validation.datum.assetB.policyId + validation.datum.assetB.assetNameHex) {
      reasons.push('SUNDAE_API_ASSET_PAIR_MISMATCH')
    }
    const expectedLpId = SUNDAE_V3_POOL_SCRIPT_HASH + '.' +
      SUNDAE_V3_POOL_LP_PREFIX + validation.datum.identifier
    if (String(apiPool.assetLP?.assetId ?? '').toLowerCase() !== expectedLpId) reasons.push('SUNDAE_API_LP_ASSET_ID_MISMATCH')
    if (String(apiPool.current?.quantityA?.quantity) !== validation.reserveARaw) reasons.push('SUNDAE_API_RESERVE_A_MISMATCH')
    if (String(apiPool.current?.quantityB?.quantity) !== validation.reserveBRaw) reasons.push('SUNDAE_API_RESERVE_B_MISMATCH')
    if (String(apiPool.current?.quantityLP?.quantity) !== validation.datum.circulatingLpRaw) reasons.push('SUNDAE_API_CIRCULATING_LP_MISMATCH')
  }
  return { status: reasons.length === 0 ? 'MATCH' : 'MISMATCH', reasons }
}
