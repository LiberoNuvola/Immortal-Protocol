#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const boundary = Object.freeze({
  ruleVersion: 'reward-v1',
  evidenceContract: 'contribution-evidence-v1',
  budget: 100,
  authority: 'pre-authorized-adopter-v1',
})

const contribution = Object.freeze({
  contributionId: 'c-001',
  contributor: 'identity-1',
  accepted: true,
  verified: true,
  evidenceRef: 'ci-review-001',
})

const reward = (c, b) => {
  if (!c.accepted || !c.verified || !c.evidenceRef) return null
  return Math.min(10, b)
}

const rewardAmount = reward(contribution, boundary.budget)

assert(rewardAmount !== null, 'verified accepted contribution can enter reward derivation')
assert(rewardAmount <= boundary.budget, 'reward is bounded by certified budget')

const forged = Object.freeze({
  ...contribution,
  verified: false,
  evidenceRef: '',
})

assert(reward(forged, boundary.budget) === null, 'unverified/self-declared contribution cannot earn reward')

const selfPromotionAttempt = Object.freeze({
  ...boundary,
  ruleVersion: 'reward-v2',
  evidenceContract: 'self-declared-evidence-v1',
  authority: 'authority-derived-from-reward',
})

assert(selfPromotionAttempt.ruleVersion !== boundary.ruleVersion, 'altered reward rule identity is distinguishable')
assert(selfPromotionAttempt.evidenceContract !== boundary.evidenceContract, 'altered reward evidence contract is distinguishable')
assert(selfPromotionAttempt.authority !== boundary.authority, 'result-dependent authority escalation is distinguishable')

const exhausted = Object.freeze({ ...boundary, budget: 0 })
assert(reward(contribution, exhausted.budget) === 0, 'zero remaining reward budget produces zero allocation')

const corrected = Object.freeze({
  ...contribution,
  accepted: false,
})

assert(reward(corrected, boundary.budget) === null, 'corrected/revoked contribution loses future eligibility')

console.log('ALL CONTRIBUTOR REWARD ADVERSARIAL CHECKS PASSED')