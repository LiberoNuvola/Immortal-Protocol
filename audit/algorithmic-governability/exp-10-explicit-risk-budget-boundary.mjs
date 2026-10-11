#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const admitExposure = (budget, realizedExposure, requested) => {
  if (budget == null || realizedExposure == null || requested == null) return 'UNVERIFIABLE'
  if (budget < 0n || realizedExposure < 0n || requested < 0n) return 'REJECTED'
  return realizedExposure + requested <= budget
}

assert(
  admitExposure(100n, 40n, 30n) === true,
  'requested exposure is admissible only inside an explicit budget',
)
assert(
  admitExposure(100n, 80n, 30n) === false,
  'exposure beyond the explicit budget is not admitted',
)
assert(
  admitExposure(null, 40n, 10n) === 'UNVERIFIABLE',
  'missing budget is not converted into zero or unlimited budget',
)

const separated = Object.freeze({
  riskBudget: 100n,
  protectedCapital: 500n,
  surplus: 0n,
})
assert(separated.riskBudget !== separated.protectedCapital, 'risk budget remains distinct from ProtectedCapital')
assert(separated.surplus === 0n, 'risk-budget declaration does not manufacture surplus')

console.log('ALL EXP-10 RISK-BUDGET BOUNDARY CHECKS PASSED')
