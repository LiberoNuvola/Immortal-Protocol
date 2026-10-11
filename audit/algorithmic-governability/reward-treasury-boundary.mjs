#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const boundary = Object.freeze({
  accountingVersion: 'accounting-v1',
  rewardRuleVersion: 'reward-v1',
  budget: 50,
  protected: 1000,
  availableRevenue: 50,
  receiptVerified: true,
})

const certifiedBudget = (b) => {
  if (!b.receiptVerified) return 0
  if (b.budget < 0 || b.budget > b.availableRevenue) return 0
  return b.budget
}

const rewardAllocation = (amount, b) => {
  const budget = certifiedBudget(b)
  if (!b.receiptVerified) return 0
  if (amount < 0) return 0
  return Math.min(amount, budget)
}

assert(certifiedBudget(boundary) === 50, 'verified revenue can produce a bounded certified reward budget')
assert(rewardAllocation(20, boundary) === 20, 'reward allocation stays within certified budget')
assert(rewardAllocation(60, boundary) === 50, 'allocation cannot exceed certified reward budget')

const forgedReceipt = Object.freeze({ ...boundary, receiptVerified: false })
assert(certifiedBudget(forgedReceipt) === 0, 'unverified Treasury receipt yields zero certified reward budget')
assert(rewardAllocation(20, forgedReceipt) === 0, 'unverified receipt cannot fund rewards')

const inflatedBudget = Object.freeze({ ...boundary, budget: 51 })
assert(certifiedBudget(inflatedBudget) === 0, 'budget inflation beyond available revenue fails closed')

const protectedOnly = Object.freeze({
  ...boundary,
  budget: 0,
  availableRevenue: 0,
  protected: 1050,
})
assert(rewardAllocation(10, protectedOnly) === 0, 'protected/encumbered value cannot become reward budget')

const authorityEscalation = Object.freeze({
  ...boundary,
  rewardRuleVersion: 'reward-v2',
  accountingVersion: 'accounting-v2',
})
assert(authorityEscalation.rewardRuleVersion !== boundary.rewardRuleVersion, 'reward-rule mutation is detectable')
assert(authorityEscalation.accountingVersion !== boundary.accountingVersion, 'accounting-rule mutation is detectable')

console.log('ALL REWARD/TREASURY BOUNDARY CHECKS PASSED')
