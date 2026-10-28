import { Data } from '@lucid-evolution/lucid'

function fieldHex(value, label) {
  if (typeof value !== 'string' || value.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(value)) {
    throw new Error('Oracle State ' + label + ' must be even-length hex bytes')
  }
  return value.toLowerCase()
}

function fieldInteger(value, label) {
  try {
    const raw = value && typeof value === 'object' && 'int' in value
      ? value.int
      : value
    const parsed = typeof raw === 'bigint'
      ? raw
      : typeof raw === 'number' && Number.isSafeInteger(raw)
        ? BigInt(raw)
        : typeof raw === 'string' && /^-?\d+$/.test(raw)
          ? BigInt(raw)
          : (() => { throw new Error() })()
    if (parsed < 0n) throw new Error()
    return parsed
  } catch {
    throw new Error('Oracle State ' + label + ' must be a non-negative integer')
  }
}

/**
 * Decode and authenticate the existing Oracle State datum fields.
 *
 * This reads facts already committed on-chain; it does not refresh or replace
 * the timestamp and must not be interpreted as a freshness assertion.
 */
export function decodeOracleStateDatum(
  datumCbor,
  {
    expectedPublisherPkh,
    expectedAssetPolicyHex = '',
    expectedAssetNameHex = '',
    expectedPriceUsdmSubunitsPerLovelace = 100n,
  } = {},
) {
  if (typeof datumCbor !== 'string' || datumCbor.length === 0 ||
      datumCbor.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(datumCbor)) {
    throw new Error('Oracle State datum CBOR must be non-empty even-length hex')
  }

  let datum
  try {
    datum = Data.from(datumCbor)
  } catch (error) {
    throw new Error(
      'Oracle State datum CBOR is invalid: ' +
      (error instanceof Error ? error.message : String(error)),
    )
  }

  if (!datum || datum.index !== 0 || !Array.isArray(datum.fields) || datum.fields.length !== 5) {
    throw new Error('Oracle State datum must be constructor 0 with exactly five fields')
  }

  const [rawPolicy, rawAssetName, rawPrice, rawTimestamp, rawPublisher] = datum.fields
  const assetPolicyHex = fieldHex(rawPolicy, 'asset policy')
  const assetNameHex = fieldHex(rawAssetName, 'asset name')
  const price = fieldInteger(rawPrice, 'price')
  const timestampMs = fieldInteger(rawTimestamp, 'timestampMs')
  const publisherPkh = fieldHex(rawPublisher, 'publisher payment credential')

  const expectedPolicy = fieldHex(expectedAssetPolicyHex, 'expected asset policy')
  const expectedName = fieldHex(expectedAssetNameHex, 'expected asset name')
  const expectedPrice = fieldInteger(
    expectedPriceUsdmSubunitsPerLovelace,
    'expected priceUsdmSubunitsPerLovelace',
  )
  const expectedPublisher = fieldHex(expectedPublisherPkh, 'expected publisher payment credential')

  if (!/^[0-9a-f]{56}$/.test(expectedPublisher)) {
    throw new Error('Oracle State expected publisher payment credential must be a 28-byte hash')
  }
  if (assetPolicyHex !== expectedPolicy || assetNameHex !== expectedName) {
    throw new Error('Oracle State datum asset identity does not match the configured asset')
  }
  if (price !== expectedPrice) {
    throw new Error('Oracle State datum price does not match the configured price')
  }
  if (publisherPkh !== expectedPublisher) {
    throw new Error('Oracle State datum publisher does not match the authenticated deployment wallet')
  }

  return {
    assetPolicyHex,
    assetNameHex,
    priceUsdmSubunitsPerLovelace: price.toString(),
    timestampMs,
    publisherPkh,
  }
}
