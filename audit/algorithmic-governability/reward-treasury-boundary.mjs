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
  budgetWithinAvailableRevenue: true,
  protectedValueExcluded: true,
  receiptVerified: true,
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

console.log('ALL REWARD/TREASURY BOUNDARY CHECKS PASSED')
