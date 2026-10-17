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
  Boolean(w) &&
  componentOrder.every((field) =>
    Object.prototype.hasOwnProperty.call(w, field) &&
    typeof w[field] === 'bigint',
  )

// Compose only the six declared buckets. Metadata or unknown fields must
// never enter the economic sum; incomplete/wrongly typed inputs stay invalid.
const protectedCapital = (w) =>
  hasAllComponents(w)
    ? componentOrder.reduce((sum, field) => sum + w[field], 0n)
    : null

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
assert(protectedCapital(missing) === null, 'missing bucket cannot be silently treated as zero')
assert(Object.prototype.hasOwnProperty.call(missing, 'reserveProtection') === false, 'missing component is not silently represented as zero')

const zeroed = Object.freeze({
  ...complete,
  reserveProtection: 0n,
})
assert(hasAllComponents(zeroed), 'zero is distinguishable from a missing component')
assert(protectedCapital(zeroed) === 40n, 'component mutation changes the composed protected amount')
const metadataAugmented = Object.freeze({
  ...complete,
  profileMultiplier: 999n,
})
assert(hasAllComponents(metadataAugmented), 'declared buckets remain explicit alongside unrelated metadata')
assert(
  protectedCapital(metadataAugmented) === protectedCapital(complete),
  'unrelated profile metadata is never included in the ProtectedCapital sum',
)

const wronglyTyped = Object.freeze({
  ...complete,
  reserveProtection: 4,
})
assert(!hasAllComponents(wronglyTyped), 'a number cannot silently replace a typed bigint bucket')
assert(protectedCapital(wronglyTyped) === null, 'wrongly typed bucket set fails closed')

const tamperedProfile = Object.freeze({
  ...complete,
  worstCaseExposure: 0n,
  profileMultiplier: 0n,
})
assert(tamperedProfile.profileMultiplier === 0n, 'profile mutation remains explicit data')
assert(protectedCapital(tamperedProfile) !== protectedCapital(complete), 'protected-capital mutation is observable')

console.log('ALL EXP-01 TYPED OBLIGATION BUCKET BOUNDARY CHECKS PASSED')
