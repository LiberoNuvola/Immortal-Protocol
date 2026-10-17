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

const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
   Object.getPrototypeOf(value) === null)

const readBuckets = (w) => {
  if (!isRecord(w)) return null
  const values = []
  for (const field of componentOrder) {
    const descriptor = Object.getOwnPropertyDescriptor(w, field)
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value') ||
        typeof descriptor.value !== 'bigint') return null
    values.push(descriptor.value)
  }
  return values
}

const hasAllComponents = (w) => readBuckets(w) !== null

// Compose only the six declared buckets. Metadata or unknown fields must
// never enter the economic sum; incomplete/wrongly typed inputs stay invalid.
const protectedCapital = (w) => {
  const values = readBuckets(w)
  return values === null ? null : values.reduce((sum, amount) => sum + amount, 0n)
}

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
let bucketGetterCalls = 0
const accessorBuckets = { ...complete }
Object.defineProperty(accessorBuckets, 'safetyCapital', {
  get() { bucketGetterCalls += 1; return 3n },
})
assert(
  !hasAllComponents(accessorBuckets) && protectedCapital(accessorBuckets) === null && bucketGetterCalls === 0,
  'accessor-backed protected bucket fails closed without executing getters',
)
assert(
  protectedCapital(Object.create(complete)) === null,
  'inherited protected buckets cannot satisfy the canonical component set',
)

const tamperedProfile = Object.freeze({
  ...complete,
  worstCaseExposure: 0n,
  profileMultiplier: 0n,
})
assert(tamperedProfile.profileMultiplier === 0n, 'profile mutation remains explicit data')
assert(protectedCapital(tamperedProfile) !== protectedCapital(complete), 'protected-capital mutation is observable')

console.log('ALL EXP-01 TYPED OBLIGATION BUCKET BOUNDARY CHECKS PASSED')
