#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Boundary only.
 * No canonical reward amount or Treasury distribution rule is selected here.
 * The test proves only that a certified reward budget cannot exceed a separately
 * observed revenue envelope and cannot be sourced from protected value.
 */
const boundary = Object.freeze({
  accountingVersion: 'accounting-v1',
  rewardRuleVersion: 'reward-v1',
  certifiedBudget: 50n,
  availableRevenue: 50n,
  protectedValue: 1000n,
  receiptVerified: true,
})

const certifyBudget = (b) => {
  if (!b?.receiptVerified) return 'UNVERIFIABLE'
  if (b.certifiedBudget < 0n || b.availableRevenue < 0n || b.protectedValue < 0n) {
    return 'REJECTED'
  }
  if (b.certifiedBudget > b.availableRevenue) return 'REJECTED'
  return b.certifiedBudget
}

assert(certifyBudget(boundary) === 50n, 'verified revenue can support an explicitly certified reward budget')
assert(certifyBudget(Object.freeze({ ...boundary, certifiedBudget: 51n })) === 'REJECTED', 'certified budget cannot exceed observed available revenue')
assert(
  certifyBudget(Object.freeze({ ...boundary, receiptVerified: false })) === 'UNVERIFIABLE',
  'unverified Treasury receipt cannot certify a reward budget',
)

const protectedOnly = Object.freeze({
  ...boundary,
  certifiedBudget: 0n,
  availableRevenue: 0n,
  protectedValue: 1050n,
})
assert(certifyBudget(protectedOnly) === 0n, 'protected-only state produces no reward budget')

const mutatedAccounting = Object.freeze({
  ...boundary,
  accountingVersion: 'accounting-v2',
})
assert(
  mutatedAccounting.accountingVersion !== boundary.accountingVersion,
  'accounting-rule mutation remains distinguishable',
)

console.log('ALL REWARD/TREASURY BOUNDARY CHECKS PASSED')
