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

const adopt = (candidate, certified, boundary) => {
  if (boundary.coverage !== 'COMPLETE' && candidate.claimsCompleteUniverse) return null
  if (!certified || certified.status !== 'admissible') return null
  if (candidate.domain !== boundary.domain) return null
  if (candidate.evidenceContract !== boundary.evidenceContract) return null
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

const validCandidate = Object.freeze({
  domain: immutableBoundary.domain,
  evidenceContract: immutableBoundary.evidenceContract,
  claimsCompleteUniverse: false,
})

assert(
  adopt(validCandidate, { status: 'admissible' }, immutableBoundary) === validCandidate,
  'admissible candidate remains adoptable without escalating authority',
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
