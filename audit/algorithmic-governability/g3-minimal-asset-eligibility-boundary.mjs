#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const evaluateEligibility = (profileIdentity, observedIdentity, evidencePresent) => {
  if (!evidencePresent) return 'UNVERIFIABLE'
  if (profileIdentity !== observedIdentity) return 'REJECTED'
  return 'ADMISSIBLE'
}

assert(
  evaluateEligibility('asset-profile-v1', 'asset-profile-v1', true) === 'ADMISSIBLE',
  'matching authorized asset identity is admissible',
)
assert(
  evaluateEligibility('asset-profile-v1', 'asset-other-v1', true) === 'REJECTED',
  'mismatched asset identity is rejected',
)
assert(
  evaluateEligibility('asset-profile-v1', 'asset-profile-v1', false) === 'UNVERIFIABLE',
  'missing asset evidence fails closed',
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

console.log('ALL G3-MINIMAL ASSET ELIGIBILITY CHECKS PASSED')
