const REQUIRED_DECISION_FIELDS = [
  'preState',
  'classId',
  'price',
  'preEEV',
  'candidateEEV',
  'availableExecutableLiquidity',
  'requiredImmediateLiquidity',
  'truthVerified',
  'eevFresh',
  'obligationsComplete',
  'allOmegaSuccessorsCertified',
  'decisionReference',
  'observationReference',
]

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} is required`)
  }
  return value
}

function requiredReference(value, field) {
  const reference = requiredString(value, field)
  if (!/^(.*)#(\\d+)$/.test(reference)) {
    throw new Error(`${field} must be an exact txHash#outputIndex reference`)
  }
  return reference
}

function requiredNonNegativeInteger(value, field) {
  try {
    const n = BigInt(String(value))
    if (n < 0n) throw new Error('negative')
    return String(n)
  } catch {
    throw new Error(`${field} must be a non-negative integer`)
  }
}

/**
 * Adapt an authoritative deployed-Preprod observation reader to the existing
 * IssueAdmission transport contract.
 *
 * This module deliberately contains no economic calculation. The reader is
 * responsible for obtaining the canonical V3 state/carrier and authenticated
 * Oracle/Pool observations. This adapter only validates provenance and shapes
 * those observations into the exact IssueDecisionInput consumed by Haskell.
 */
function createPreprodIssueObservationProducer({ readObservation }) {
  if (typeof readObservation !== 'function') {
    throw new Error('readObservation is required')
  }

  return async function buildDecisionContext(runtimeInputs) {
    if (!runtimeInputs || typeof runtimeInputs !== 'object') {
      throw new Error('runtimeInputs are required')
    }

    const counterInputReference = requiredReference(
      runtimeInputs.counterInputReference,
      'counterInputReference',
    )
    const poolInputReference = requiredReference(
      runtimeInputs.poolInputReference,
      'poolInputReference',
    )
    const poolUsdmValue = requiredNonNegativeInteger(
      runtimeInputs.poolUsdmValue,
      'poolUsdmValue',
    )

    const observed = await readObservation({
      counterInputReference,
      poolInputReference,
      poolUsdmValue,
    })

    if (!observed || typeof observed !== 'object') {
      throw new Error('authoritative Preprod observation returned no context')
    }

    const observationReference = requiredString(
      observed.observationReference,
      'observationReference',
    )
    const observedAt = requiredNonNegativeInteger(
      observed.observedAt,
      'observedAt',
    )

    if (observed.counterInputReference !== counterInputReference) {
      throw new Error('authoritative observation Counter reference mismatch')
    }
    if (observed.poolInputReference !== poolInputReference) {
      throw new Error('authoritative observation Pool reference mismatch')
    }
    if (String(observed.poolUsdmValue) !== poolUsdmValue) {
      throw new Error('authoritative observation Pool valuation mismatch')
    }

    const decisionInput = observed.decisionInput
    if (!decisionInput || typeof decisionInput !== 'object') {
      throw new Error('authoritative observation did not provide IssueDecisionInput')
    }

    for (const field of REQUIRED_DECISION_FIELDS) {
      if (decisionInput[field] === undefined || decisionInput[field] === null) {
        throw new Error(`IssueDecisionInput field ${field} is missing`)
      }
    }

    if (decisionInput.observationReference !== observationReference) {
      throw new Error(
        'IssueDecisionInput observationReference does not match authoritative observation',
      )
    }

    return {
      decisionInput,
      observationReference,
      observedAt,
    }
  }
}

module.exports = {
  createPreprodIssueObservationProducer,
}
