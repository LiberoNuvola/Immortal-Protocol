const crypto = require('node:crypto')
const { verifySignedIssueAuthorityEnvelope, canonicalize } = require('./signedIssueAuthority')

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(field + ' is required')
  return value.trim()
}

function positiveInteger(value, field) {
  try {
    const n = BigInt(String(value))
    if (n <= 0n) throw new Error('non-positive')
    return n
  } catch {
    throw new Error(field + ' must be a positive integer')
  }
}

/**
 * Sign the already-computed authoritative Issue witness.
 *
 * This module never calculates EEV, ProtectedCapital, viability, liquidity,
 * control state or Gate truth. It only serializes and signs evidence that has
 * already crossed those authority boundaries, then verifies its own envelope.
 */
function signIssueAuthorityEnvelope({
  witness,
  directUsdmUnit,
  freshnessWindow,
  privateKeyPem,
  publicKeyPem,
  currentObservedAt,
}) {
  if (!witness || typeof witness !== 'object') throw new Error('authoritative Issue witness is required')
  if (witness.admitted !== true || witness.actionClass !== 'Issue') {
    throw new Error('authoritative Issue witness must be admitted and actionClass=Issue')
  }

  const privateKey = requiredString(privateKeyPem, 'ISSUE_AUTHORITY_PRIVATE_KEY')
  const publicKey = requiredString(publicKeyPem, 'ISSUE_AUTHORITY_PUBLIC_KEY')
  const unit = requiredString(directUsdmUnit, 'directUsdmUnit')
  const freshness = positiveInteger(freshnessWindow, 'freshnessWindow')

  const observedAtRaw = witness.executableLiquidityObservation?.observedAt
  if (observedAtRaw === undefined || observedAtRaw === null) {
    throw new Error('witness observedAt is required')
  }
  const observedAt = BigInt(String(observedAtRaw))
  if (witness.preEEV === undefined || witness.preEEV === null) {
    throw new Error('witness preEEV is required')
  }
  const preEEV = BigInt(String(witness.preEEV))
  if (preEEV < 0n) throw new Error('witness preEEV must be non-negative')

  for (const [name, value] of [
    ['truthVerified', witness.truthVerified],
    ['eevFresh', witness.eevFresh],
    ['obligationsComplete', witness.obligationsComplete],
    ['allOmegaSuccessorsCertified', witness.allOmegaSuccessorsCertified],
  ]) {
    if (value !== true) {
      throw new Error('witness ' + name + ' must be true before signing')
    }
  }

  const eevQualification = witness.eevQualification
  const protectedCapitalProvenance = witness.protectedCapitalProvenance
  const viabilityCertificate = witness.viabilityCertificate
  if (!eevQualification || typeof eevQualification !== 'object') throw new Error('witness.eevQualification is required')
  if (!protectedCapitalProvenance || typeof protectedCapitalProvenance !== 'object') throw new Error('witness.protectedCapitalProvenance is required')
  if (!viabilityCertificate || typeof viabilityCertificate !== 'object') throw new Error('witness.viabilityCertificate is required')

  if (!Number.isInteger(Number(witness.issueClassId)) || witness.issueClassId < 0n) {
    throw new Error('witness issueClassId must be a non-negative integer')
  }
  if (!Number.isInteger(Number(witness.issuePrice)) || witness.issuePrice <= 0n) {
    throw new Error('witness issuePrice must be a positive integer')
  }

  const payload = {
    schema: 'PRE-RICH-SIGNED-ISSUE-AUTHORITY-V1',
    authorityVersion: '1',
    counterInputReference: requiredString(witness.counterInputReference, 'counterInputReference'),
    poolInputReference: requiredString(witness.authenticatedPoolInputReference, 'poolInputReference'),
    carrierStateReference: requiredString(witness.v3CarrierBinding?.carrierStateReference, 'carrierStateReference'),
    observationReference: requiredString(witness.authoritativeObservationReference, 'authoritativeObservationReference'),
    decisionReference: requiredString(witness.decisionReference, 'decisionReference'),
    classId: String(witness.issueClassId),
    price: String(witness.issuePrice),
    directUsdmUnit: unit.toLowerCase(),
    poolUsdmValue: String(witness.authenticatedPoolUsdmValue),
    preEEV: String(preEEV),
    candidateEEV: String(witness.eev),
    requiredImmediateLiquidity: String(witness.requiredImmediateLiquidity),
    truthVerified: witness.truthVerified,
    eevFresh: witness.eevFresh,
    obligationsComplete: witness.obligationsComplete,
    allOmegaSuccessorsCertified: witness.allOmegaSuccessorsCertified,
    observedAt: String(observedAt),
    freshnessWindow: String(freshness),
    verificationReference: requiredString(eevQualification.verificationReference, 'eevQualification.verificationReference'),
    sourceReference: requiredString(eevQualification.sourceReference, 'eevQualification.sourceReference'),
    derivationVersion: requiredString(eevQualification.derivationVersion, 'eevQualification.derivationVersion'),
    eevQualification,
    protectedCapitalProvenance,
    viabilityCertificate,
  }

  const signature = crypto
    .sign(null, Buffer.from(canonicalize(payload), 'utf8'), privateKey)
    .toString('base64')
  const envelope = Object.freeze({ payload, signature })

  verifySignedIssueAuthorityEnvelope(envelope, publicKey, {
    counterInputReference: payload.counterInputReference,
    poolInputReference: payload.poolInputReference,
    carrierStateReference: payload.carrierStateReference,
    classId: witness.issueClassId,
    price: witness.issuePrice,
    directUsdmUnit: unit,
    observationReference: payload.observationReference,
    observedAt,
    currentObservedAt:
      currentObservedAt === undefined ? Date.now() : currentObservedAt,
  })

  return envelope
}

module.exports = { signIssueAuthorityEnvelope }
