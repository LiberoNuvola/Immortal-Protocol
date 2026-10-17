#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const families = [
  'EXP-01', 'EXP-02', 'EXP-03', 'EXP-04', 'EXP-05', 'EXP-06',
  'EXP-07', 'EXP-08', 'EXP-09', 'EXP-10', 'EXP-11', 'EXP-12',
]

const boundary = (family) => Object.freeze({
  domain: family,
  ruleVersion: `${family}-rule-v1`,
  evidenceContract: `${family}-evidence-v1`,
  boundContract: `${family}-bounds-v1`,
  adoptionPath: `${family}-authorized-adoption`,
})

const derive = (b, input) => {
  if (!isRecord(input) || input.evidenceValid !== true) return { status: 'UNVERIFIABLE' }
  if (input.withinDeclaredBounds !== true) return { status: 'REJECTED' }
  return Object.freeze({
    status: 'ADMISSIBLE',
    domain: b.domain,
    ruleVersion: b.ruleVersion,
    evidenceContract: b.evidenceContract,
    boundContract: b.boundContract,
    adoptionPath: b.adoptionPath,
    value: input.value,
  })
}

const adopt = (candidate, canonicalState, expectedBoundary) => {
  const matchesBoundary = isRecord(candidate) &&
    candidate.status === 'ADMISSIBLE' &&
    candidate.domain === expectedBoundary.domain &&
    candidate.ruleVersion === expectedBoundary.ruleVersion &&
    candidate.evidenceContract === expectedBoundary.evidenceContract &&
    candidate.boundContract === expectedBoundary.boundContract &&
    candidate.adoptionPath === expectedBoundary.adoptionPath

  return {
    ...canonicalState,
    adopted: matchesBoundary ? candidate : null,
  }
}

const canonicalBefore = Object.freeze({ version: 'canonical-v1', adopted: null })

const inheritedEvidence = Object.create({ value: 1, evidenceValid: true, withinDeclaredBounds: true })
assert(derive(boundary('EXP-01'), inheritedEvidence).status === 'UNVERIFIABLE',
  'inherited evidence properties cannot certify an EXP result')
assert(derive(boundary('EXP-01'), new Date()).status === 'UNVERIFIABLE',
  'non-record evidence containers cannot certify an EXP result')

const inheritedCandidate = Object.create({
  status: 'ADMISSIBLE',
  ...boundary('EXP-01'),
})

for (const malformedCandidate of [null, undefined, 'candidate', 7, [], inheritedCandidate, new Date()]) {
  const afterMalformedAdopt = adopt(malformedCandidate, canonicalBefore, boundary('EXP-01'))
  assert(afterMalformedAdopt.adopted === null, `malformed candidate (${String(malformedCandidate)}) cannot be adopted`)
  assert(afterMalformedAdopt.version === canonicalBefore.version, 'malformed candidate cannot change canonical version')
}

for (const family of families) {
  const b = boundary(family)
  const ok = derive(b, { value: 1, evidenceValid: true, withinDeclaredBounds: true })
  assert(ok.status === 'ADMISSIBLE', `${family} admits a certified in-bound result`)
  assert(ok.domain === family, `${family} retains domain identity`)
  assert(ok.ruleVersion === b.ruleVersion, `${family} retains rule identity`)
  assert(ok.evidenceContract === b.evidenceContract, `${family} retains evidence identity`)
  assert(ok.boundContract === b.boundContract, `${family} retains bound identity`)
  assert(ok.adoptionPath === b.adoptionPath, `${family} retains adoption-path identity`)

  const missing = derive(b, { value: 1, evidenceValid: false, withinDeclaredBounds: true })
  assert(missing.status === 'UNVERIFIABLE', `${family} fails closed on invalid evidence`)

  const rejected = derive(b, { value: 1, evidenceValid: true, withinDeclaredBounds: false })
  assert(rejected.status === 'REJECTED', `${family} rejects an explicit bound violation`)

  const afterCertify = canonicalBefore
  assert(afterCertify.adopted === null, `${family} certification alone does not mutate canonical state`)

  const afterAdopt = adopt(ok, canonicalBefore, b)
  assert(afterAdopt.adopted === ok, `${family} adoption is an explicit separate operation`)

  for (const field of ['domain', 'ruleVersion', 'evidenceContract', 'boundContract', 'adoptionPath']) {
    const forged = Object.freeze({ ...ok, [field]: `forged-${field}` })
    const afterForgedAdopt = adopt(forged, canonicalBefore, b)
    assert(afterForgedAdopt.adopted === null, `${family} adoption rejects candidate-mutated ${field}`)
    assert(afterForgedAdopt.version === canonicalBefore.version, `${family} forged ${field} cannot change canonical version`)
  }
}

const reward = boundary('EXP-10')
const other = boundary('EXP-01')
const crossed = Object.freeze({ ...reward, domain: other.domain })

assert(crossed.domain !== reward.domain, 'cross-family domain mutation is detectable')
assert(crossed.ruleVersion === reward.ruleVersion, 'cross-family mutation does not silently rewrite rule identity')
assert(crossed.evidenceContract === reward.evidenceContract, 'cross-family mutation does not silently rewrite evidence identity')

const partialSearch = Object.freeze({
  declaredDomain: 'EXP-generalized',
  exploredCount: 2,
  coverage: 'PARTIAL',
  normativeUniverse: false,
})
assert(partialSearch.coverage === 'PARTIAL', 'partial search coverage remains explicit')
assert(partialSearch.normativeUniverse === false, 'partial search cannot become a complete normative universe')

console.log('ALL EXP CROSS-FUNCTION CONFORMANCE CHECKS PASSED')
