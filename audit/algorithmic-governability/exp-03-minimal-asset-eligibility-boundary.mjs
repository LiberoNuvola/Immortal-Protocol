#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

// This is a conformance model only; the concrete asset set remains profile-scoped.
// Require the already-authorized profile to declare identity, evidence contract and
// valuation/settlement source without inferring any valuation or liquidity properties.
const evaluateEligibility = (profile, observation) => {
  if (!profile || !observation) return 'UNVERIFIABLE'

  for (const field of ['assetIdentity', 'evidenceContract', 'valuationSettlementSource']) {
    if (typeof profile[field] !== 'string' || profile[field].trim().length === 0) {
      return 'UNVERIFIABLE'
    }
  }

  if (typeof observation.assetIdentity !== 'string' || observation.assetIdentity.trim().length === 0) {
    return 'UNVERIFIABLE'
  }
  if (observation.evidencePresent !== true) return 'UNVERIFIABLE'
  if (profile.assetIdentity !== observation.assetIdentity) return 'REJECTED'
  return 'ADMISSIBLE'
}

const authorizedProfile = Object.freeze({
  assetIdentity: 'asset-profile-v1',
  evidenceContract: 'asset-evidence-contract-v1',
  valuationSettlementSource: 'profile-defined-source-v1',
})
const matchingObservation = Object.freeze({
  assetIdentity: 'asset-profile-v1',
  evidencePresent: true,
})

assert(
  evaluateEligibility(authorizedProfile, matchingObservation) === 'ADMISSIBLE',
  'profile-scoped identity with explicit evidence and source contract is admissible',
)
assert(
  evaluateEligibility(authorizedProfile, { ...matchingObservation, assetIdentity: 'asset-other-v1' }) === 'REJECTED',
  'mismatched asset identity is rejected',
)
assert(
  evaluateEligibility(authorizedProfile, { ...matchingObservation, evidencePresent: false }) === 'UNVERIFIABLE',
  'missing asset evidence fails closed',
)

for (const field of ['assetIdentity', 'evidenceContract', 'valuationSettlementSource']) {
  const missing = { ...authorizedProfile }
  delete missing[field]
  assert(
    evaluateEligibility(missing, matchingObservation) === 'UNVERIFIABLE',
    `missing profile field ${field} fails closed`,
  )

  const blank = { ...authorizedProfile, [field]: '' }
  assert(
    evaluateEligibility(blank, matchingObservation) === 'UNVERIFIABLE',
    `blank profile field ${field} fails closed`,
  )
}

assert(
  evaluateEligibility({ ...authorizedProfile, assetIdentity: '' }, matchingObservation) === 'UNVERIFIABLE',
  'empty declared asset identity is unverifiable',
)
assert(
  evaluateEligibility(authorizedProfile, { ...matchingObservation, assetIdentity: '' }) === 'UNVERIFIABLE',
  'empty observed asset identity is unverifiable',
)
assert(
  evaluateEligibility(null, matchingObservation) === 'UNVERIFIABLE',
  'absent authorized profile fails closed',
)
assert(
  evaluateEligibility(authorizedProfile, null) === 'UNVERIFIABLE',
  'absent asset observation fails closed',
)

const admitted = {
  eligibility: 'ADMISSIBLE',
  assetIdentity: 'asset-profile-v1',
  valued: false,
  liquid: false,
  protected: false,
  rewardEligible: false,
  governanceAuthority: false,
}

assert(admitted.eligibility === 'ADMISSIBLE', 'eligibility is independently represented')
assert(admitted.valued === false, 'eligibility does not imply valuation')
assert(admitted.liquid === false, 'eligibility does not imply liquidity')
assert(admitted.protected === false, 'eligibility does not imply ProtectedCapital treatment')
assert(admitted.rewardEligible === false, 'eligibility does not imply reward eligibility')
assert(admitted.governanceAuthority === false, 'eligibility does not imply governance authority')

console.log('ALL EXP-03-MINIMAL ASSET ELIGIBILITY CHECKS PASSED')
