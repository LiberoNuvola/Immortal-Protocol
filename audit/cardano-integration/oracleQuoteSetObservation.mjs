import { Data } from 'lucid-cardano'

export const ORACLE_QUOTE_MAX_AGE_MS = 3_600_000n

function fieldsOf(value) {
  return value && typeof value === 'object' && Array.isArray(value.fields)
    ? value.fields
    : null
}

function constructorIndex(value) {
  if (!value || typeof value !== 'object') return null
  const raw = value.index ?? value.constr
  if (raw === undefined) return null
  const parsed = Number(raw)
  return Number.isInteger(parsed) ? parsed : null
}

function bytesOf(value) {
  const raw = typeof value === 'string' ? value : value?.bytes
  return typeof raw === 'string' ? raw.toLowerCase() : null
}

function integerOf(value) {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value)
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value)
  if (value && typeof value.int !== 'undefined') {
    try { return BigInt(value.int) } catch { return null }
  }
  return null
}

function assetIdentity(policyHex, nameHex) {
  if (policyHex === '' && nameHex === '') {
    return { unit: 'lovelace', valid: true }
  }
  const valid =
    /^[0-9a-f]{56}$/.test(policyHex) &&
    nameHex.length <= 64 &&
    nameHex.length % 2 === 0 &&
    /^[0-9a-f]*$/.test(nameHex)
  return {
    unit: valid ? policyHex + nameHex : 'invalid:' + policyHex + nameHex,
    valid,
  }
}

function decodeQuote(raw, index) {
  if (constructorIndex(raw) !== 0) {
    throw new Error(`OracleQuote[${index}] has an unexpected constructor`)
  }
  const fields = fieldsOf(raw)
  if (!fields || fields.length !== 5) {
    throw new Error(`OracleQuote[${index}] must have exactly five fields`)
  }
  const assetPolicyHex = bytesOf(fields[0])
  const assetNameHex = bytesOf(fields[1])
  const price = integerOf(fields[2])
  const timestampMs = integerOf(fields[3])
  const publisherPkh = bytesOf(fields[4])
  if (
    assetPolicyHex === null ||
    assetNameHex === null ||
    price === null ||
    timestampMs === null ||
    publisherPkh === null
  ) {
    throw new Error(`OracleQuote[${index}] contains an invalid field type`)
  }

  const identity = assetIdentity(assetPolicyHex, assetNameHex)
  return {
    index,
    unit: identity.unit,
    assetPolicyHex,
    assetNameHex,
    assetIdentityValid: identity.valid,
    price,
    timestampMs,
    publisherPkh,
  }
}

/**
 * Inspect a decoded on-chain Oracle datum without signing or modifying state.
 * This validates datum shape, identity uniqueness and the existing publisher/
 * timestamp contract. It deliberately cannot prove external price truth.
 */
export function inspectOracleDatum(raw, options = {}) {
  const { expectedPublisherPkh, nowMs, maxAgeMs = ORACLE_QUOTE_MAX_AGE_MS } = options
  if (typeof expectedPublisherPkh !== 'string' || !/^[0-9a-f]{56}$/i.test(expectedPublisherPkh)) {
    throw new Error('Configured Oracle publisher must be a 28-byte key hash')
  }
  if (typeof nowMs !== 'bigint' || nowMs < 0n) {
    throw new Error('Observation time must be a non-negative bigint in POSIX milliseconds')
  }
  if (typeof maxAgeMs !== 'bigint' || maxAgeMs <= 0n) {
    throw new Error('Oracle max age must be a positive bigint')
  }

  const datum = typeof raw === 'string' ? Data.from(raw) : raw
  const constructor = constructorIndex(datum)
  const fields = fieldsOf(datum)
  if (!fields) throw new Error('Oracle datum fields are missing or malformed')

  let schema
  let rawQuotes
  if (constructor === 0 && fields.length === 5) {
    schema = 'legacy-single-quote'
    rawQuotes = [datum]
  } else if (constructor === 1 && fields.length === 1 && Array.isArray(fields[0])) {
    schema = 'oracle-quote-set'
    rawQuotes = fields[0]
  } else {
    throw new Error('Oracle datum constructor/field shape is not supported')
  }

  const decoded = rawQuotes.map(decodeQuote)
  const counts = new Map()
  for (const quote of decoded) counts.set(quote.unit, (counts.get(quote.unit) ?? 0) + 1)

  const expectedPublisher = expectedPublisherPkh.toLowerCase()
  const quotes = decoded.map(quote => {
    const ageMs = nowMs - quote.timestampMs
    const publisherMatches = quote.publisherPkh === expectedPublisher
    const timestampNotFuture = quote.timestampMs <= nowMs
    const fresh = timestampNotFuture && ageMs <= maxAgeMs
    const uniqueIdentity = counts.get(quote.unit) === 1
    const positivePrice = quote.price > 0n
    const usableForIssue = quote.assetIdentityValid && uniqueIdentity &&
      publisherMatches && fresh && positivePrice
    const quoteBlockers = []
    if (!quote.assetIdentityValid) quoteBlockers.push('INVALID_ASSET_IDENTITY')
    if (!uniqueIdentity) quoteBlockers.push('DUPLICATE_ASSET_IDENTITY')
    if (quote.price < 0n) quoteBlockers.push('NEGATIVE_PRICE')
    else if (quote.price === 0n) quoteBlockers.push('NONPOSITIVE_PRICE')
    if (!publisherMatches) quoteBlockers.push('PUBLISHER_MISMATCH')
    if (!timestampNotFuture) quoteBlockers.push('FUTURE_TIMESTAMP')
    else if (!fresh) quoteBlockers.push('STALE_TIMESTAMP')

    return {
      unit: quote.unit,
      assetPolicyHex: quote.assetPolicyHex,
      assetNameHex: quote.assetNameHex,
      assetIdentityValid: quote.assetIdentityValid,
      price: quote.price.toString(),
      timestampMs: quote.timestampMs.toString(),
      publisherPkh: quote.publisherPkh,
      publisherMatches,
      ageMs: ageMs.toString(),
      timestampNotFuture,
      fresh,
      positivePrice,
      uniqueIdentity,
      usableForIssue,
      blockers: quoteBlockers,
    }
  })

  const adaQuotes = quotes.filter(q => q.unit === 'lovelace')
  const adaQuote = adaQuotes.length === 1 ? adaQuotes[0] : null
  const blockers = []
  if (adaQuotes.length === 0) blockers.push('ADA_QUOTE_REQUIRED_FOR_EVERY_TREASURY_OUTPUT')
  if (adaQuotes.length > 1) blockers.push('DUPLICATE_ADA_QUOTE')
  if (adaQuote && !adaQuote.usableForIssue) {
    blockers.push(...adaQuote.blockers.map(reason => 'ADA_' + reason))
  }
  if (schema === 'legacy-single-quote') {
    blockers.push('LEGACY_SCHEMA_SUPPORTS_ONLY_ONE_ASSET_QUOTE')
  }

  const duplicateAssetUnits = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([unit]) => unit)
    .sort()
  const eligibleUnits = quotes
    .filter(q => q.usableForIssue)
    .map(q => q.unit)
    .filter((unit, index, all) => all.indexOf(unit) === index)
    .sort()

  return {
    schema,
    constructorIndex: constructor,
    quoteCount: quotes.length,
    quotes,
    duplicateAssetUnits,
    adaQuoteCount: adaQuotes.length,
    adaOnlySettlementStructurallyUsable: Boolean(adaQuote?.usableForIssue),
    eligibleUnits,
    blockers: [...new Set(blockers)],
    sourceTruthProven: false,
    sourceQualificationStatus: 'NOT_PROVEN_BY_DATUM_ALONE',
    qualificationNote: 'The on-chain datum identifies a configured publisher; it does not independently prove the external market source or decentralize the publisher.',
  }
}

/** Export the CBOR parser for a direct read-only script; no key material is used. */
export function decodeOracleDatumCbor(raw) {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new Error('Inline Oracle datum CBOR is required')
  }
  return Data.from(raw)
}
