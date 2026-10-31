/**
 * Pure identity and reserve comparisons for Float / Koios / Minswap API.
 */
const lower = (x) => String(x ?? '').toLowerCase()

export function apiAssetUnit(asset) {
  return lower(asset?.currency_symbol) + lower(asset?.token_name)
}

export function apiMinswapLpUnit(pool) {
  const lp = pool?.apiMetrics?.lp_asset
  const policy = lower(lp?.currency_symbol)
  const name = lower(lp?.token_name)
  return policy && name ? policy + name : null
}

export function floatPoolKey(market) {
  const id = String(market?.id ?? '')
  const prefix = 'minswap-v2:'
  return id.startsWith(prefix) ? id.slice(prefix.length).toLowerCase() : null
}

export function compareFloatReservesToDatum(market, datum) {
  const a = lower(market?.assets?.a) === 'ada.lovelace'
    ? ''
    : lower(market?.assets?.a).replace('.', '')
  const b = lower(market?.assets?.b) === 'ada.lovelace'
    ? ''
    : lower(market?.assets?.b).replace('.', '')
  const da = lower(datum?.assetA?.policyId) + lower(datum?.assetA?.assetNameHex)
  const db = lower(datum?.assetB?.policyId) + lower(datum?.assetB?.assetNameHex)
  const ra = market?.reserves?.a
  const rb = market?.reserves?.b
  if (ra === undefined || rb === undefined ||
      datum?.reserveARaw === undefined || datum?.reserveBRaw === undefined) return null
  let expectedA
  let expectedB
  if (a === da && b === db) {
    expectedA = BigInt(String(datum.reserveARaw))
    expectedB = BigInt(String(datum.reserveBRaw))
  } else if (a === db && b === da) {
    expectedA = BigInt(String(datum.reserveBRaw))
    expectedB = BigInt(String(datum.reserveARaw))
  } else {
    return null
  }
  return BigInt(String(ra)) === expectedA && BigInt(String(rb)) === expectedB
}
