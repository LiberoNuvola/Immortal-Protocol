#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const immutableBoundary = Object.freeze({
  domain: 'predeclared-observation-domain-v1',
  ruleVersion: 'rule-v1',
  evidenceContract: 'evidence-v1',
  safeSet: Object.freeze(['SAFE', 'RECOVERABLE']),
  authority: 'pre-authorized-adopter-v1',
  coverage: 'PARTIAL',
})

const observation = Object.freeze({
  samples: Object.freeze([2, 8, 3, 7]),
  evidenceRef: 'obs-001',
})

const monitorA = (o) => o.samples.reduce((a, b) => a + b, 0)
const monitorB = (o) => Math.max(...o.samples) - Math.min(...o.samples)

const resultA = monitorA(observation)
const resultB = monitorB(observation)

assert(resultA !== resultB, 'competing monitors can derive different metrics from the same observation')
assert(immutableBoundary.authority === 'pre-authorized-adopter-v1', 'authority is fixed before monitor evaluation')
assert(immutableBoundary.evidenceContract === 'evidence-v1', 'evidence contract is fixed before monitor evaluation')
assert(immutableBoundary.safeSet.includes('SAFE'), 'safe set remains immutable after observation')

const attemptedAuthorityEscalation = Object.freeze({
  ...immutableBoundary,
  authority: `authority-derived-from-result-${resultA}`,
  evidenceContract: `evidence-derived-from-result-${resultB}`,
})

assert(
  attemptedAuthorityEscalation.authority !== immutableBoundary.authority,
  'adversarial result-dependent authority mutation is distinguishable from the canonical boundary',
)
assert(
  attemptedAuthorityEscalation.evidenceContract !== immutableBoundary.evidenceContract,
  'adversarial result-dependent evidence-contract mutation is distinguishable',
)

const INVALID = Symbol('invalid-own-data-field')
const ownDataValue = (record, field) => {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) return INVALID
  const prototype = Object.getPrototypeOf(record)
  if (prototype !== Object.prototype && prototype !== null) return INVALID
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : INVALID
}
const hasOwnArrayDataElements = (array) => Array.isArray(array) &&
  Array.from({ length: array.length }, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(array, String(index))
    return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
  }).every(Boolean)

const matchesExpectedArray = (array, expected) => {
  if (!Array.isArray(array) || array.length !== expected.length ||
      !hasOwnArrayDataElements(array)) return false
  for (let index = 0; index < expected.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(array, String(index))
    if (descriptor.value !== expected[index]) return false
  }
  return true
}

const adopt = (candidate, certified, boundary) => {
  if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) return null
  const domain = ownDataValue(candidate, 'domain')
  const evidenceContract = ownDataValue(candidate, 'evidenceContract')
  const claimsCompleteUniverse = ownDataValue(candidate, 'claimsCompleteUniverse')
  const certifiedStatus = ownDataValue(certified, 'status')
  if (domain === INVALID || evidenceContract === INVALID || claimsCompleteUniverse === INVALID ||
      certifiedStatus === INVALID) return null
  if (boundary.coverage !== 'COMPLETE' && claimsCompleteUniverse) return null
  if (certifiedStatus !== 'admissible') return null
  if (domain !== boundary.domain) return null
  if (evidenceContract !== boundary.evidenceContract) return null
  for (const [field, expected] of [
    ['authority', boundary.authority],
    ['ruleVersion', boundary.ruleVersion],
    ['coverage', boundary.coverage],
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, field)
    if (descriptor) {
      if (!Object.prototype.hasOwnProperty.call(descriptor, 'value') || descriptor.value !== expected) return null
    }
  }
  const safeSetDescriptor = Object.getOwnPropertyDescriptor(candidate, 'safeSet')
  if (safeSetDescriptor) {
    if (!Object.prototype.hasOwnProperty.call(safeSetDescriptor, 'value')) return null
    const safeSet = safeSetDescriptor.value
    if (!matchesExpectedArray(safeSet, boundary.safeSet)) return null
  }
  return candidate
}

const partialCandidate = Object.freeze({
  domain: immutableBoundary.domain,
  evidenceContract: immutableBoundary.evidenceContract,
  claimsCompleteUniverse: true,
})

assert(
  adopt(partialCandidate, { status: 'admissible' }, immutableBoundary) === null,
  'partial search cannot be adopted as a complete normative universe',
)

for (const malformedCandidate of [null, undefined, 'candidate', 7, []]) {
  assert(
    adopt(malformedCandidate, { status: 'admissible' }, immutableBoundary) === null,
    `malformed candidate (${String(malformedCandidate)}) is rejected without throwing`,
  )
}

const validCandidate = Object.freeze({
  domain: immutableBoundary.domain,
  evidenceContract: immutableBoundary.evidenceContract,
  claimsCompleteUniverse: false,
})

assert(
  adopt(validCandidate, { status: 'admissible' }, immutableBoundary) === validCandidate,
  'admissible candidate remains adoptable without escalating authority',
)
let candidateGetterCalls = 0
const accessorCandidate = { ...validCandidate }
Object.defineProperty(accessorCandidate, 'domain', {
  get() { candidateGetterCalls += 1; return immutableBoundary.domain },
})
assert(
  adopt(accessorCandidate, { status: 'admissible' }, immutableBoundary) === null && candidateGetterCalls === 0,
  'accessor-backed candidate domain fails closed without executing getters',
)
const accessorCertified = {}
Object.defineProperty(accessorCertified, 'status', {
  get() { candidateGetterCalls += 1; return 'admissible' },
})
assert(
  adopt(validCandidate, accessorCertified, immutableBoundary) === null && candidateGetterCalls === 0,
  'accessor-backed certification status cannot authorize adoption',
)
assert(
  adopt(Object.create(validCandidate), { status: 'admissible' }, immutableBoundary) === null,
  'inherited candidate fields cannot authorize adoption',
)
const accessorSafeSet = [...immutableBoundary.safeSet]
Object.defineProperty(accessorSafeSet, '0', {
  configurable: true,
  get() { candidateGetterCalls += 1; return 'SAFE' },
})
assert(
  adopt({ ...validCandidate, safeSet: accessorSafeSet }, { status: 'admissible' }, immutableBoundary) === null && candidateGetterCalls === 0,
  'accessor-backed safe-set entries cannot influence adoption',
)
let safeSetOverrideCalls = 0
const overriddenSafeSet = [...immutableBoundary.safeSet]
Object.defineProperty(overriddenSafeSet, 'some', {
  value() {
    safeSetOverrideCalls += 1
    return false
  },
})
assert(
  adopt({ ...validCandidate, safeSet: overriddenSafeSet }, { status: 'admissible' }, immutableBoundary) !== null &&
    safeSetOverrideCalls === 0,
  'caller-overridden array methods cannot influence safe-set validation or execute during adoption',
)

const authorityEscalationCandidate = Object.freeze({
  ...validCandidate,
  authority: 'authority-derived-from-result',
})
assert(
  adopt(authorityEscalationCandidate, { status: 'admissible' }, immutableBoundary) === null,
  'candidate cannot smuggle result-dependent authority through adoption',
)
const ruleVersionEscalationCandidate = Object.freeze({
  ...validCandidate,
  ruleVersion: 'rule-derived-from-result',
})
assert(
  adopt(ruleVersionEscalationCandidate, { status: 'admissible' }, immutableBoundary) === null,
  'candidate cannot smuggle a result-dependent rule version through adoption',
)
const safeSetWideningCandidate = Object.freeze({
  ...validCandidate,
  safeSet: Object.freeze(['SAFE', 'RECOVERABLE', 'UNBOUNDED']),
})
assert(
  adopt(safeSetWideningCandidate, { status: 'admissible' }, immutableBoundary) === null,
  'candidate cannot smuggle a widened safe set through adoption',
)

const recoveryAttempt = Object.freeze({
  ...immutableBoundary,
  domain: 'expanded-domain-via-recovery',
  safeSet: Object.freeze(['SAFE', 'RECOVERABLE', 'UNBOUNDED']),
})

assert(recoveryAttempt.domain !== immutableBoundary.domain, 'recovery domain widening is detectable')
assert(
  recoveryAttempt.safeSet.some((x) => !immutableBoundary.safeSet.includes(x)),
  'recovery safe-set widening is detectable',
)

console.log('ALL ALGORITHMIC GOVERNABILITY ADVERSARIAL CHECKS PASSED')
