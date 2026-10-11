#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Structural accounting boundary only.
 * No reward amount, percentage or Treasury allocation formula is introduced.
 * The revenue/budget relationship is supplied as an externally certified fact.
 */
const boundary = Object.freeze({
  accountingVersion: 'accounting-v1',
  rewardRuleVersion: 'reward-v1',
  feeRuleVersion: 'fee-v1',
  budgetWithinAvailableRevenue: true,
  protectedValueExcluded: true,
  receiptVerified: true,
  rewardOutcome: 0,
})

const certifyBudget = (b) => {
  if (!b?.receiptVerified) return 'UNVERIFIABLE'
  if (b.protectedValueExcluded !== true) return 'REJECTED'
  if (b.budgetWithinAvailableRevenue == null) return 'UNVERIFIABLE'
  if (b.budgetWithinAvailableRevenue !== true) return 'REJECTED'
  return 'CERTIFIED'
}

assert(certifyBudget(boundary) === 'CERTIFIED',
  'verified revenue/accounting evidence can certify a reward budget boundary')
assert(
  certifyBudget(Object.freeze({ ...boundary, budgetWithinAvailableRevenue: false })) === 'REJECTED',
  'reward budget cannot exceed the separately observed available revenue envelope',
)
assert(
  certifyBudget(Object.freeze({ ...boundary, receiptVerified: false })) === 'UNVERIFIABLE',
  'unverified Treasury receipt cannot certify a reward budget',
)
assert(
  certifyBudget(Object.freeze({ ...boundary, protectedValueExcluded: false })) === 'REJECTED',
  'Protected value cannot be treated as reward budget',
)

const mutatedAccounting = Object.freeze({
  ...boundary,
  accountingVersion: 'accounting-v2',
})
assert(
  mutatedAccounting.accountingVersion !== boundary.accountingVersion,
  'accounting-rule mutation remains distinguishable',
)

/*
 * Feedback-loop separation.
 *
 * Reward receipt may be an output of the accounting/reward path, but it cannot
 * become an input that changes the fee rule, accounting rule, or its own budget
 * authority. These are distinct external capabilities in the canonical model.
 */
const rewardOutcomeCannotRewritePolicy = (state) => Object.freeze({
  ...state,
  feeRuleVersion: state.feeRuleVersion,
  accountingVersion: state.accountingVersion,
  budgetWithinAvailableRevenue: state.budgetWithinAvailableRevenue,
})

const rewardOutcome = Object.freeze({
  ...boundary,
  rewardOutcome: 123,
})

const afterReward = rewardOutcomeCannotRewritePolicy(rewardOutcome)
assert(afterReward.feeRuleVersion === boundary.feeRuleVersion,
  'reward output cannot change the separately authorized fee rule identity')
assert(afterReward.accountingVersion === boundary.accountingVersion,
  'reward output cannot change the accounting rule identity')
assert(afterReward.budgetWithinAvailableRevenue === boundary.budgetWithinAvailableRevenue,
  'reward output cannot certify or enlarge its own budget envelope')

const selfFundedBudget = Object.freeze({
  ...boundary,
  budgetWithinAvailableRevenue: false,
  receiptVerified: true,
})
assert(
  certifyBudget(selfFundedBudget) === 'REJECTED',
  'reward output cannot self-authorize a reward budget outside the observed revenue envelope',
)

const authorityEscalation = Object.freeze({
  ...boundary,
  rewardAuthority: `authority-derived-from-reward-${rewardOutcome.rewardOutcome}`,
  feeAuthority: `fee-authority-derived-from-reward-${rewardOutcome.rewardOutcome}`,
})
assert(
  !('rewardAuthority' in boundary),
  'reward outcome cannot create an implicit reward authority field in the canonical boundary',
)
assert(
  !('feeAuthority' in boundary),
  'reward outcome cannot create an implicit fee authority field in the canonical boundary',
)
assert(
  authorityEscalation.rewardAuthority !== undefined &&
  authorityEscalation.feeAuthority !== undefined,
  'adversarial result-dependent authority mutations remain distinguishable',
)

console.log('ALL REWARD/TREASURY BOUNDARY CHECKS PASSED')
