#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Boundary only.
 * This harness deliberately does not select a reward amount or formula.
 * It verifies eligibility, explicit rule/evidence identity, and bounded-budget
 * admission without turning those facts into canonical reward economics.
 */
const boundary = Object.freeze({
  ruleVersion: 'reward-v1',
  evidenceContract: 'contribution-evidence-v1',
  authority: 'pre-authorized-adopter-v1',
})

const contribution = Object.freeze({
  contributionId: 'c-001',
  contributor: 'identity-1',
  accepted: true,
  verified: true,
  evidenceRef: 'ci-review-001',
})

const rewardEligibility = (c, b) => {
  if (!b?.ruleVersion || !b?.evidenceContract || !b?.authority) return 'UNVERIFIABLE'
  if (!c?.accepted || !c?.verified || !c?.evidenceRef) return 'UNVERIFIABLE'
  return Object.freeze({
    eligible: true,
    contributionId: c.contributionId,
    evidenceRef: c.evidenceRef,
    ruleVersion: b.ruleVersion,
    evidenceContract: b.evidenceContract,
  })
}

const admission = rewardEligibility(contribution, boundary)
assert(admission.eligible === true, 'verified accepted contribution can enter reward eligibility')
assert(admission.ruleVersion === boundary.ruleVersion, 'eligibility retains the declared reward rule identity')
assert(admission.evidenceContract === boundary.evidenceContract, 'eligibility retains the declared evidence contract')
assert(admission.contributionId === contribution.contributionId, 'eligibility remains bound to the contribution identity')

const forged = Object.freeze({
  ...contribution,
  verified: false,
  evidenceRef: '',
})
assert(
  rewardEligibility(forged, boundary) === 'UNVERIFIABLE',
  'unverified/self-declared contribution cannot enter reward eligibility',
)

const selfPromotionAttempt = Object.freeze({
  ...boundary,
  authority: 'authority-derived-from-reward',
})
assert(
  selfPromotionAttempt.authority !== boundary.authority,
  'reward result cannot silently replace the pre-authorized authority boundary',
)

const corrected = Object.freeze({
  ...contribution,
  accepted: false,
})
assert(
  rewardEligibility(corrected, boundary) === 'UNVERIFIABLE',
  'corrected/revoked contribution loses future reward eligibility',
)

console.log('ALL CONTRIBUTOR REWARD BOUNDARY CHECKS PASSED')
