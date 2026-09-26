/**
 * Fail-closed envelope for external Issue refinement inputs.
 *
 * This is a transport contract, not an oracle and not a cryptographic
 * verifier. The caller must supply evidence produced by an independently
 * authenticated source. No defaults, local timestamps or fixture valuation
 * are accepted here.
 */
function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(field + ' is required')
  return value.trim()
}

function nonNegative(value, field) {
  let n
  try { n = BigInt(String(value)) } catch { throw new Error(field + ' must be an integer') }
  if (n < 0n) throw new Error(field + ' must be non-negative')
  return n
}

function validateAuthoritativeIssueRefinementEnvelope(input) {
  if (!input || typeof input !== 'object') throw new Error('authoritative refinement envelope is required')

  const verificationReference = requiredString(input.verificationReference, 'verificationReference')
  const sourceReference = requiredString(input.sourceReference, 'sourceReference')
  const derivationVersion = requiredString(input.derivationVersion, 'derivationVersion')
  const observedAt = nonNegative(input.observedAt, 'observedAt')
  const freshnessWindow = nonNegative(input.freshnessWindow, 'freshnessWindow')
  const verificationStatus = input.verificationStatus
  if (verificationStatus !== 'VERIFIED') {
    throw new Error('authoritative refinement evidence must be explicitly VERIFIED')
  }

  const values = {
    poolUsdmValue: nonNegative(input.poolUsdmValue, 'poolUsdmValue'),
    preEEV: nonNegative(input.preEEV, 'preEEV'),
    candidateEEV: nonNegative(input.candidateEEV, 'candidateEEV'),
    requiredImmediateLiquidity: nonNegative(
      input.requiredImmediateLiquidity,
      'requiredImmediateLiquidity',
    ),
  }

  for (const key of [
    'truthVerified',
    'eevFresh',
    'obligationsComplete',
    'allOmegaSuccessorsCertified',
  ]) {
    if (typeof input[key] !== 'boolean') throw new Error(key + ' must be boolean')
  }

  return Object.freeze({
    verificationReference,
    sourceReference,
    derivationVersion,
    observedAt,
    freshnessWindow,
    verificationStatus,
    ...values,
    truthVerified: input.truthVerified,
    eevFresh: input.eevFresh,
    obligationsComplete: input.obligationsComplete,
    allOmegaSuccessorsCertified: input.allOmegaSuccessorsCertified,
    decisionReference: requiredString(input.decisionReference, 'decisionReference'),
  })
}

module.exports = { validateAuthoritativeIssueRefinementEnvelope }
