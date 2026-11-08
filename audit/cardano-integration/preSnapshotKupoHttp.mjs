import { comparePreSnapshotKupoState } from './preSnapshotKupoParity.mjs'

function fail(code, message = code) {
  throw Object.assign(new Error(message), { code })
}

export function validateLocalKupoBaseUrl(value) {
  let url
  try { url = new URL(value) } catch (_) { fail('KUPO_HTTP_BASE_URL_INVALID') }
  const host = url.hostname.toLowerCase()
  const loopback = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
  if (url.protocol !== 'http:' || !loopback || !url.port || url.username || url.password ||
      url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    fail('KUPO_HTTP_ENDPOINT_MUST_BE_LOCAL_LOOPBACK')
  }
  return url.origin
}

async function getJson(fetchImpl, url, accept, label) {
  let response
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: accept },
      redirect: 'error'
    })
  } catch (error) {
    fail('KUPO_HTTP_REQUEST_FAILED:' + label, error.message)
  }
  if (!response || response.ok !== true) {
    const status = response && Number.isInteger(response.status)
      ? String(response.status)
      : 'NO_RESPONSE'
    fail('KUPO_HTTP_STATUS:' + label + ':' + status)
  }
  try {
    return await response.json()
  } catch (error) {
    fail('KUPO_HTTP_INVALID_JSON:' + label, error.message)
  }
}

export async function queryKupoExactPoint({
  baseUrl,
  expectedPoint,
  expectedAsset,
  fetchImpl = globalThis.fetch
}) {
  if (typeof fetchImpl !== 'function') fail('KUPO_FETCH_IMPLEMENTATION_REQUIRED')
  if (!expectedPoint || !Number.isSafeInteger(expectedPoint.slot) ||
      expectedPoint.slot < 0 || typeof expectedPoint.hash !== 'string') {
    fail('KUPO_EXPECTED_POINT_REQUIRED')
  }
  if (!expectedAsset || typeof expectedAsset.policyIdHex !== 'string' ||
      !/^[0-9a-f]{56}$/.test(expectedAsset.policyIdHex) ||
      typeof expectedAsset.assetNameHex !== 'string' ||
      !/^(?:[0-9a-f]{2}){0,32}$/.test(expectedAsset.assetNameHex)) {
    fail('KUPO_EXPECTED_ASSET_INVALID')
  }

  const origin = validateLocalKupoBaseUrl(baseUrl)
  const assetPattern = expectedAsset.assetNameHex.length === 0
    ? expectedAsset.policyIdHex + '.*'
    : expectedAsset.policyIdHex + '.' + expectedAsset.assetNameHex

  const checkpoint = await getJson(
    fetchImpl,
    origin + '/checkpoints/' + expectedPoint.slot + '?strict',
    'application/json',
    'checkpoint'
  )
  const matches = await getJson(
    fetchImpl,
    origin + '/matches/' + encodeURIComponent(assetPattern) + '?unspent',
    'application/json;asset-quantity=string',
    'matches'
  )
  if (!Array.isArray(matches)) fail('KUPO_MATCHES_RESPONSE_NOT_ARRAY')
  return Object.freeze({ checkpoint, matches, assetPattern })
}

export async function comparePreSnapshotKupoEndpoint({
  state,
  baseUrl,
  expectedNetworkId,
  expectedAsset,
  expectedPoint,
  fetchImpl = globalThis.fetch
}) {
  const queried = await queryKupoExactPoint({
    baseUrl,
    expectedPoint,
    expectedAsset,
    fetchImpl
  })
  const comparison = comparePreSnapshotKupoState({
    state,
    kupoCheckpoint: queried.checkpoint,
    kupoMatches: queried.matches,
    expectedNetworkId,
    expectedAsset,
    expectedPoint
  })
  return Object.freeze({
    ...comparison,
    kupoEndpoint: validateLocalKupoBaseUrl(baseUrl),
    queriedAssetPattern: queried.assetPattern,
    matchCount: queried.matches.length
  })
}
