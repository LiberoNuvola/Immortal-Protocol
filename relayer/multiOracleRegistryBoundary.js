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
  const feedId = requiredString(input.feedId, 'feedId')
  const policyVersion = requiredString(input.policyVersion, 'policyVersion')

  const resolution = await registryProvider.resolveVerifiedRegistrySnapshot({
    sourceId,
    feedId,
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
  const trustRootReference = requiredString(resolution.trustRootReference, 'trustRootReference')
  const signatureScheme = requiredString(resolution.signatureScheme, 'signatureScheme')
  const registryVersion = requiredString(resolution.registryVersion, 'registryVersion')
  const registrySequence = requiredString(resolution.registrySequence, 'registrySequence')
  if (!/^(0|[1-9][0-9]*)$/.test(registrySequence)) {
    throw new Error('registrySequence must be a canonical non-negative decimal sequence')
  }
  const registryDigest = requiredString(resolution.registryDigest, 'registryDigest').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(registryDigest)) {
    throw new Error('registryDigest must be a SHA-256 hex digest')
  }
  const currentnessAuthorityReference = requiredString(
    resolution.currentnessAuthorityReference,
    'currentnessAuthorityReference',
  )
  const currentnessCheckpointReference = requiredString(
    resolution.currentnessCheckpointReference,
    'currentnessCheckpointReference',
  )
  const currentnessControlSequence = requiredString(
    resolution.currentnessControlSequence,
    'currentnessControlSequence',
  )
  if (!/^(0|[1-9][0-9]*)$/.test(currentnessControlSequence)) {
    throw new Error('currentnessControlSequence must be a canonical non-negative decimal sequence')
  }
  if (resolution.currentnessVerificationStatus !== 'VERIFIED') {
    throw new Error('authoritative currentness state must be independently verified')
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
      trustRootReference,
      signatureScheme,
      registryVersion,
      registrySequence,
      registryDigest,
      currentnessAuthorityReference,
      currentnessCheckpointReference,
      currentnessControlSequence,
      currentnessVerificationStatus: 'VERIFIED',
      verificationStatus: 'VERIFIED',
    }),
  })
}

module.exports = { normalizeUsingRegistryProvider }
