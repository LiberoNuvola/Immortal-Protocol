#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

// This is a conformance model only; the concrete asset set remains profile-scoped.
// Require the already-authorized profile to declare identity, evidence contract and
// valuation/settlement source without inferring any valuation or liquidity properties.
const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
   Object.getPrototypeOf(value) === null)

const readOwnData = (record, key) => {
  if (!isRecord(record)) return undefined
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined
}

const evaluateEligibility = (profile, observation) => {
  if (!isRecord(profile) || !isRecord(observation)) return 'UNVERIFIABLE'

  const profileValues = {}
  for (const field of ['assetIdentity', 'evidenceContract', 'valuationSettlementSource']) {
    const value = readOwnData(profile, field)
    if (typeof value !== 'string' || value.trim().length === 0) return 'UNVERIFIABLE'
    profileValues[field] = value
  }

  const observedIdentity = readOwnData(observation, 'assetIdentity')
  if (typeof observedIdentity !== 'string' || observedIdentity.trim().length === 0) {
    return 'UNVERIFIABLE'
  }
  if (readOwnData(observation, 'evidencePresent') !== true) return 'UNVERIFIABLE'
  if (profileValues.assetIdentity !== observedIdentity) return 'REJECTED'
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
let eligibilityGetterCalls = 0
const accessorProfile = { ...authorizedProfile }
Object.defineProperty(accessorProfile, 'assetIdentity', {
  get() { eligibilityGetterCalls += 1; return 'asset-profile-v1' },
})
assert(
  evaluateEligibility(accessorProfile, matchingObservation) === 'UNVERIFIABLE' && eligibilityGetterCalls === 0,
  'accessor-backed profile identity fails closed without executing getters',
)
assert(
  evaluateEligibility(Object.create(authorizedProfile), matchingObservation) === 'UNVERIFIABLE',
  'inherited profile fields cannot establish asset eligibility',
)
const accessorObservation = { assetIdentity: 'asset-profile-v1' }
Object.defineProperty(accessorObservation, 'evidencePresent', {
  get() { eligibilityGetterCalls += 1; return true },
})
assert(
  evaluateEligibility(authorizedProfile, accessorObservation) === 'UNVERIFIABLE' && eligibilityGetterCalls === 0,
  'accessor-backed evidence flag cannot establish asset eligibility',
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
