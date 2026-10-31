const NFT_POLICY_ID = '909133088303c49f3a30f1cc8ed553a73857a29779f6c6561cd8093f'
const LP_POLICY_ID = 'af3d70acf4bd5b3abb319a7d75c89fb3e56eafcdd46b2e9b57a2557f'
const FACTORY_POLICY_ID = 'de9b756719341e79785aa13c164e7fe68c189ed04d61c9876b2fe53f'
const FACTORY_TOKEN_NAME_HEX = '4d7565736c69537761705f414d4d'
const ADA_UNIT = ''
const USDM_UNIT = 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d'
const SCALE_8 = 100_000_000n

function constr(value, name) {
  if (!value || value.constructor !== 0 || !Array.isArray(value.fields)) {
    throw new Error('MUESLI_POOL_DATUM_' + name + '_CONSTRUCTOR_INVALID')
  }
  return value.fields
}
function bytes(value, name) {
  if (!value || typeof value.bytes !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value.bytes)) {
    throw new Error('MUESLI_POOL_DATUM_' + name + '_BYTES_INVALID')
  }
  return value.bytes.toLowerCase()
}
function integer(value, name) {
  const raw = String(value?.int ?? '')
  if (!/^-?\d+$/.test(raw)) throw new Error('MUESLI_POOL_DATUM_' + name + '_INTEGER_INVALID')
  return BigInt(raw)
}
function asset(value, name) {
  const fields = constr(value, name)
  if (fields.length !== 2) throw new Error('MUESLI_POOL_DATUM_' + name + '_SHAPE_INVALID')
  return { policyId: bytes(fields[0], name + '_POLICY'), assetNameHex: bytes(fields[1], name + '_NAME') }
}
function unit(value) {
  return String(value?.policyId ?? '').toLowerCase() + String(value?.assetNameHex ?? '').toLowerCase()
}
function quantityOf(assets, assetUnit) {
  const found = assets.find((item) =>
    String(item.policyId ?? '').toLowerCase() + String(item.assetNameHex ?? '').toLowerCase() === assetUnit)
  return found ? BigInt(String(found.quantityRaw ?? '0')) : 0n
}
function formatScaled(value, scale = 8) {
  const factor = 10n ** BigInt(scale)
  const whole = value / factor
  const fraction = (value % factor).toString().padStart(scale, '0').replace(/0+$/, '')
  return fraction ? whole.toString() + '.' + fraction : whole.toString()
}

export function decodeMuesliPoolDatum(value) {
  const fields = constr(value, 'ROOT')
  if (fields.length !== 4) throw new Error('MUESLI_POOL_DATUM_FIELD_COUNT_UNSUPPORTED')
  const assetA = asset(fields[0], 'COIN_A')
  const assetB = asset(fields[1], 'COIN_B')
  const totalLiquidity = integer(fields[2], 'TOTAL_LIQUIDITY')
  const swapFee = integer(fields[3], 'SWAP_FEE')
  return { assetA, assetB, totalLiquidity, swapFee }
}

export function validateMuesliPoolCandidate(candidate) {
  const reasons = []
  let datum
  try {
    datum = decodeMuesliPoolDatum(candidate.resolvedDatumJson ?? candidate.inlineDatumJson)
  } catch (error) {
    reasons.push(error instanceof Error ? error.message : 'MUESLI_POOL_DATUM_DECODE_FAILED')
  }
  if (!candidate.paymentCredentialMatchesOfficial) reasons.push('POOL_PAYMENT_CREDENTIAL_MISMATCH')
  if (!datum) return { status: 'UNQUALIFIED', reasons, datum: null }

  const requestedNftUnit = String(candidate.requestedPoolNftUnit ?? '').toLowerCase()
  const nftName = requestedNftUnit.startsWith(NFT_POLICY_ID) ? requestedNftUnit.slice(56) : ''
  const nftUnit = NFT_POLICY_ID + nftName
  const factoryUnit = FACTORY_POLICY_ID + FACTORY_TOKEN_NAME_HEX
  const lpUnit = LP_POLICY_ID + nftName
  const assets = (candidate.assets ?? []).map((item) => ({
    policyId: String(item.policyId ?? item.policy_id ?? '').toLowerCase(),
    assetNameHex: String(item.assetNameHex ?? item.asset_name ?? '').toLowerCase(),
    quantityRaw: String(item.quantityRaw ?? item.quantity ?? '0'),
  }))
  if (!nftName || requestedNftUnit.length !== 120) reasons.push('POOL_NFT_UNIT_IDENTITY_INVALID')
  if (quantityOf(assets, nftUnit) !== 1n) reasons.push('POOL_NFT_QUANTITY_NOT_ONE')
  if (String(candidate.poolNftQuantityRaw ?? '0') !== '1') reasons.push('POOL_NFT_CANDIDATE_QUANTITY_NOT_ONE')
  if (quantityOf(assets, factoryUnit) !== 1n) reasons.push('FACTORY_COIN_QUANTITY_NOT_ONE')

  const assetAUnit = unit(datum.assetA)
  const assetBUnit = unit(datum.assetB)
  const isAdaA = assetAUnit === ADA_UNIT
  const isAdaB = assetBUnit === ADA_UNIT
  if (assetAUnit === assetBUnit) reasons.push('POOL_PAIR_ASSETS_IDENTICAL')
  if (assetAUnit > assetBUnit) reasons.push('POOL_PAIR_NOT_CANONICALLY_ORDERED')
  if (assetAUnit !== USDM_UNIT && assetBUnit !== USDM_UNIT) reasons.push('USDM_NOT_IN_POOL_DATUM_PAIR')
  if (datum.totalLiquidity <= 0n) reasons.push('POOL_TOTAL_LIQUIDITY_NONPOSITIVE')
  if (datum.swapFee < 1n || datum.swapFee > 10_000n) reasons.push('POOL_SWAP_FEE_OUT_OF_RANGE')

  const reserveA = isAdaA ? BigInt(String(candidate.valueLovelaceRaw ?? '0')) : quantityOf(assets, assetAUnit)
  const reserveB = isAdaB ? BigInt(String(candidate.valueLovelaceRaw ?? '0')) : quantityOf(assets, assetBUnit)
  if (reserveA <= 0n) reasons.push('POOL_RESERVE_A_NONPOSITIVE')
  if (reserveB <= 0n) reasons.push('POOL_RESERVE_B_NONPOSITIVE')
  if (BigInt(String(candidate.valueLovelaceRaw ?? '0')) <= 0n) reasons.push('POOL_LOVELACE_NONPOSITIVE')

  const lpQuantity = quantityOf(assets, lpUnit)
  const hasLp = lpQuantity > 0n
  if (lpQuantity < 0n) reasons.push('POOL_LP_QUANTITY_NEGATIVE')
  const allowedUnits = new Set([nftUnit, factoryUnit])
  if (!isAdaA) allowedUnits.add(assetAUnit)
  if (!isAdaB) allowedUnits.add(assetBUnit)
  if (hasLp) allowedUnits.add(lpUnit)
  if (assets.some((item) => !allowedUnits.has(unit(item)))) reasons.push('UNEXPECTED_ASSETS_IN_POOL_VALUE')
  const flattenedAssetCount = assets.length + 1 // Koios asset_list omits ADA/lovelace
  const expectedFlattenedCount = hasLp ? (isAdaA || isAdaB ? 5 : 6) : (isAdaA || isAdaB ? 4 : 5)
  if (flattenedAssetCount !== expectedFlattenedCount) reasons.push('POOL_VALUE_ASSET_CARDINALITY_MISMATCH')

  let priceAdaPerUsdm = null
  let priceAdaPerUsdmScaledRaw = null
  if (isAdaA && assetBUnit === USDM_UNIT) {
    priceAdaPerUsdmScaledRaw = (reserveA * SCALE_8 / reserveB).toString()
    priceAdaPerUsdm = formatScaled(BigInt(priceAdaPerUsdmScaledRaw))
  } else if (isAdaB && assetAUnit === USDM_UNIT) {
    priceAdaPerUsdmScaledRaw = (reserveB * SCALE_8 / reserveA).toString()
    priceAdaPerUsdm = formatScaled(BigInt(priceAdaPerUsdmScaledRaw))
  }

  return {
    status: reasons.length === 0 ? 'MATCH' : 'UNQUALIFIED',
    reasons,
    datum: {
      assetA: datum.assetA,
      assetB: datum.assetB,
      totalLiquidityRaw: datum.totalLiquidity.toString(),
      swapFeeRaw: datum.swapFee.toString(),
      swapFeeBasis: '10000',
    },
    reserveARaw: reserveA.toString(),
    reserveBRaw: reserveB.toString(),
    poolNftUnit: nftUnit,
    lpUnit,
    lpQuantityRaw: lpQuantity.toString(),
    factoryUnit,
    priceAdaPerUsdm,
    priceAdaPerUsdmScaledRaw,
  }
}
