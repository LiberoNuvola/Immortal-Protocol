/**
 * Policy-independent structural boundary for multi-oracle observations.
 *
 * This module is NOT a cryptographic verifier, source registry of record,
 * aggregator, price converter, or production oracle path. It validates that
 * a caller-supplied registry entry and observation agree structurally and
 * that the payload digest matches the canonical payload. Authentication must
 * be established by a separate source-specific verifier before activation.
 * No freshness threshold, source allowlist, quorum, aggregation, fallback,
 * or USD/USDM conversion policy is selected here.
 */
const { createHash } = require('node:crypto')

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

function integerString(value, field, { nonNegative = false } = {}) {
  if (typeof value !== 'string' && typeof value !== 'bigint' && typeof value !== 'number') {
    throw new Error(field + ' must be an integer')
  }
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new Error(field + ' must be a safe integer or decimal string')
  }
  const text = String(value)
  if (!/^(0|-[1-9][0-9]*|[1-9][0-9]*)$/.test(text)) {
    throw new Error(field + ' must be a canonical decimal integer')
  }
  const parsed = BigInt(text)
  if (nonNegative && parsed < 0n) throw new Error(field + ' must be non-negative')
  return parsed.toString()
}

function canonicalPayload(observation) {
  return JSON.stringify({
    sourceId: observation.sourceId,
    feedId: observation.feedId,
    baseAsset: observation.baseAsset,
    quoteAsset: observation.quoteAsset,
    rawPrice: observation.rawPrice,
    exponent: observation.exponent,
    sourceTimestamp: observation.sourceTimestamp,
    timestampUnit: observation.timestampUnit,
    authenticationReference: observation.authenticationReference,
    normalizationVersion: observation.normalizationVersion,
    policyVersion: observation.policyVersion,
  })
}

function digestPayload(observation) {
  return createHash('sha256').update(canonicalPayload(observation), 'utf8').digest('hex')
}

/**
 * Checks structural consistency only. registryEntry must already have been
 * obtained from an authoritative, versioned registry by the caller.
 * authenticationReference is provenance, not proof that authentication
 * succeeded; this function deliberately does not assert source authenticity.
 */
function normalizeOracleObservation(registryEntry, input) {
  if (!registryEntry || typeof registryEntry !== 'object') {
    throw new Error('registryEntry is required')
  }
  if (!input || typeof input !== 'object') throw new Error('observation is required')
  if (registryEntry.activationState !== 'ACTIVE') {
    throw new Error('source is not active in the supplied registry entry')
  }

  const sourceId = requiredString(input.sourceId, 'sourceId')
  const feedId = requiredString(input.feedId, 'feedId')
  const baseAsset = requiredString(input.baseAsset, 'baseAsset')
  const quoteAsset = requiredString(input.quoteAsset, 'quoteAsset')
  const timestampUnit = requiredString(input.timestampUnit, 'timestampUnit')
  const authenticationReference = requiredString(input.authenticationReference, 'authenticationReference')
  const normalizationVersion = requiredString(input.normalizationVersion, 'normalizationVersion')
  const policyVersion = requiredString(input.policyVersion, 'policyVersion')
  const rawPrice = integerString(input.rawPrice, 'rawPrice')
  const exponent = integerString(input.exponent, 'exponent')
  const sourceTimestamp = integerString(input.sourceTimestamp, 'sourceTimestamp', { nonNegative: true })

  if (sourceId !== requiredString(registryEntry.sourceId, 'registry.sourceId')) {
    throw new Error('sourceId does not match registry')
  }
  if (feedId !== requiredString(registryEntry.feedId, 'registry.feedId')) {
    throw new Error('feedId does not match registry')
  }
  if (baseAsset !== requiredString(registryEntry.baseAsset, 'registry.baseAsset') ||
      quoteAsset !== requiredString(registryEntry.quoteAsset, 'registry.quoteAsset')) {
    throw new Error('asset pair or direction does not match registry')
  }
  if (timestampUnit !== requiredString(registryEntry.timestampUnit, 'registry.timestampUnit')) {
    throw new Error('timestamp unit does not match registry')
  }
  if (BigInt(rawPrice) < 0n) throw new Error('rawPrice must be non-negative')
  if (input.payloadDigest === undefined) throw new Error('payloadDigest is required')
  const supplied = requiredString(input.payloadDigest, 'payloadDigest').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(supplied)) throw new Error('payloadDigest must be a SHA-256 hex digest')
  const canonical = {
    sourceId, feedId, baseAsset, quoteAsset, rawPrice, exponent, sourceTimestamp,
    timestampUnit, authenticationReference, normalizationVersion, policyVersion,
  }
  const actual = digestPayload(canonical)
  if (supplied !== actual) throw new Error('payload digest mismatch')

  return Object.freeze({ ...canonical, payloadDigest: supplied })
}

module.exports = { normalizeOracleObservation, digestPayload }
