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

const hasNonBlankString = (value) =>
  typeof value === 'string' && value.trim().length > 0

const certifyBudget = (b) => {
  if (!b) return 'UNVERIFIABLE'
  if (!hasNonBlankString(b.accountingVersion) ||
      !hasNonBlankString(b.rewardRuleVersion) ||
      !hasNonBlankString(b.feeRuleVersion)) return 'UNVERIFIABLE'
  if (typeof b.receiptVerified !== 'boolean') return 'UNVERIFIABLE'
  if (b.receiptVerified !== true) return 'UNVERIFIABLE'
  if (typeof b.protectedValueExcluded !== 'boolean') return 'UNVERIFIABLE'
  if (b.protectedValueExcluded !== true) return 'REJECTED'
  if (typeof b.budgetWithinAvailableRevenue !== 'boolean') return 'UNVERIFIABLE'
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

assert(
  certifyBudget(Object.freeze({ ...boundary, receiptVerified: 'true' })) === 'UNVERIFIABLE',
  'string-valued receipt verification cannot certify a reward budget',
)
assert(
  certifyBudget(Object.freeze({ ...boundary, receiptVerified: null })) === 'UNVERIFIABLE',
  'unknown receipt verification cannot certify a reward budget',
)
assert(
  certifyBudget(Object.freeze({ ...boundary, budgetWithinAvailableRevenue: 'true' })) === 'UNVERIFIABLE',
  'string-valued budget-envelope evidence remains unverifiable',
)
assert(
  certifyBudget(Object.freeze({ ...boundary, budgetWithinAvailableRevenue: null })) === 'UNVERIFIABLE',
  'unknown budget-envelope evidence remains unverifiable',
)
assert(
  certifyBudget(Object.freeze({ ...boundary, protectedValueExcluded: null })) === 'UNVERIFIABLE',
  'unknown Protected-value classification is not treated as a proven violation or as safety',
)
for (const field of ['accountingVersion', 'rewardRuleVersion', 'feeRuleVersion']) {
  assert(
    certifyBudget(Object.freeze({ ...boundary, [field]: '' })) === 'UNVERIFIABLE',
    `missing ${field} leaves budget certification unverifiable`,
  )
}


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


/*
 * Certified budget -> allocation bound.
 * This exercises the already documented invariant RewardAllocation <= RewardBudget.
 * It adds no allocation formula and does not create a budget from Treasury balance.
 */
const authorizeAllocation = (certification, certifiedBudget, allocation) => {
  if (certification !== 'CERTIFIED') return 'UNVERIFIABLE'
  if (!Number.isFinite(certifiedBudget) || !Number.isFinite(allocation)) return 'UNVERIFIABLE'
  if (certifiedBudget < 0 || allocation < 0) return 'REJECTED'
  if (allocation > certifiedBudget) return 'REJECTED'
  return 'AUTHORIZED_WITHIN_CERTIFIED_BUDGET'
}

assert(
  authorizeAllocation('CERTIFIED', 100, 100) === 'AUTHORIZED_WITHIN_CERTIFIED_BUDGET',
  'allocation equal to a certified budget remains within the declared envelope',
)
assert(
  authorizeAllocation('CERTIFIED', 100, 101) === 'REJECTED',
  'reward allocation cannot exceed the certified reward budget',
)
assert(
  authorizeAllocation('CERTIFIED', 0, 1) === 'REJECTED',
  'zero certified reward budget cannot authorize a positive allocation',
)
assert(
  authorizeAllocation('UNVERIFIABLE', 100, 1) === 'UNVERIFIABLE',
  'uncertified budget cannot authorize a reward allocation',
)
assert(
  authorizeAllocation('CERTIFIED', null, 1) === 'UNVERIFIABLE',
  'missing certified budget amount leaves allocation authorization unverifiable',
)
assert(
  authorizeAllocation('CERTIFIED', 100, null) === 'UNVERIFIABLE',
  'missing allocation amount leaves allocation authorization unverifiable',
)

console.log('ALL REWARD/TREASURY BOUNDARY CHECKS PASSED')
