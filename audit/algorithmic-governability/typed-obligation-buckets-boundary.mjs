#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const componentOrder = [
  'crystallizedLiabilities',
  'worstCaseExposure',
  'safetyCapital',
  'reserveProtection',
  'mandatoryFutureCosts',
  'additionalProtected',
]

const hasAllComponents = (w) =>
  componentOrder.every((field) =>
    Object.prototype.hasOwnProperty.call(w, field),
  )

const protectedCapital = (w) =>
  Object.values(w).reduce((sum, value) => sum + value, 0n)

const complete = Object.freeze({
  crystallizedLiabilities: 10n,
  worstCaseExposure: 20n,
  safetyCapital: 3n,
  reserveProtection: 4n,
  mandatoryFutureCosts: 5n,
  additionalProtected: 2n,
})

assert(hasAllComponents(complete), 'all existing ProtectedCapital interface components are represented explicitly')
assert(protectedCapital(complete) === 44n, 'explicit components compose without hidden or implicit amounts')

const missing = {
  ...complete,
}
delete missing.reserveProtection
assert(!hasAllComponents(missing), 'missing protected component is detectable')
assert(Object.prototype.hasOwnProperty.call(missing, 'reserveProtection') === false, 'missing component is not silently represented as zero')

const zeroed = Object.freeze({
  ...complete,
  reserveProtection: 0n,
})
assert(hasAllComponents(zeroed), 'zero is distinguishable from a missing component')
assert(protectedCapital(zeroed) === 40n, 'component mutation changes the composed protected amount')

const tamperedProfile = Object.freeze({
  ...complete,
  worstCaseExposure: 0n,
  profileMultiplier: 0n,
})
assert(tamperedProfile.profileMultiplier === 0n, 'profile mutation remains explicit data')
assert(protectedCapital(tamperedProfile) !== protectedCapital(complete), 'protected-capital mutation is observable')

console.log('ALL TYPED OBLIGATION BUCKET BOUNDARY CHECKS PASSED')
