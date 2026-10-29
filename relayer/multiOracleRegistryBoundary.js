/**
 * Fail-closed adapter between a registry provider and the structural
 * multi-oracle observation normalizer.
 *
 * This is an integration contract, not a registry of record and not a
 * cryptographic verifier. The injected provider MUST independently
 * authenticate the registry snapshot (signature/trust root or equivalent),
 * verify its digest, and apply the governed activation procedure before it
 * returns verificationStatus: "VERIFIED". The status is an assertion by that
 * trusted provider; this module does not authenticate the provider itself.
 *
 * No registry entries, source identities, quorum, aggregation, freshness
 * thresholds, fallback, USD/USDM conversion, or production consumer wiring
 * are defined here.
 */
const { normalizeOracleObservation } = require('./multiOracleObservation')

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

async function normalizeUsingRegistryProvider(registryProvider, input) {
  if (!registryProvider || typeof registryProvider.resolveVerifiedRegistrySnapshot !== 'function') {
    throw new Error('trusted registryProvider.resolveVerifiedRegistrySnapshot is required')
  }
  if (!input || typeof input !== 'object') throw new Error('observation is required')

  const sourceId = requiredString(input.sourceId, 'sourceId')
  const policyVersion = requiredString(input.policyVersion, 'policyVersion')

  const resolution = await registryProvider.resolveVerifiedRegistrySnapshot({
    sourceId,
    policyVersion,
  })

  if (!resolution || typeof resolution !== 'object') {
    throw new Error('registry provider returned no resolution')
  }
  if (resolution.verificationStatus !== 'VERIFIED') {
    throw new Error('registry snapshot must be independently verified')
  }
  if (requiredString(resolution.policyVersion, 'registryResolution.policyVersion') !== policyVersion) {
    throw new Error('registry resolution policy version mismatch')
  }

  const registryReference = requiredString(resolution.registryReference, 'registryReference')
  const registryVersion = requiredString(resolution.registryVersion, 'registryVersion')
  const registryDigest = requiredString(resolution.registryDigest, 'registryDigest').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(registryDigest)) {
    throw new Error('registryDigest must be a SHA-256 hex digest')
  }
  if (!resolution.entry || typeof resolution.entry !== 'object') {
    throw new Error('registry resolution entry is required')
  }

  const observation = normalizeOracleObservation(resolution.entry, input)
  if (observation.sourceId !== sourceId) {
    throw new Error('resolved registry source identity mismatch')
  }

  return Object.freeze({
    observation,
    registryBinding: Object.freeze({
      sourceId,
      policyVersion,
      registryReference,
      registryVersion,
      registryDigest,
      verificationStatus: 'VERIFIED',
    }),
  })
}

module.exports = { normalizeUsingRegistryProvider }
