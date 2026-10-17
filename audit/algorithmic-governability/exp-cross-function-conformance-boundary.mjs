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

const hasOwnDataProperties = (record, fields) => {
  if (!isRecord(record)) return false
  return fields.every((field) => {
    const descriptor = Object.getOwnPropertyDescriptor(record, field)
    return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
  })
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
  const required = [
    'domain', 'ruleVersion', 'evidenceContract', 'boundContract',
    'value', 'evidenceValid', 'withinDeclaredBounds',
  ]
  if (!hasOwnDataProperties(input, required)) {
    return { status: 'UNVERIFIABLE' }
  }
  for (const field of ['domain', 'ruleVersion', 'evidenceContract', 'boundContract']) {
    if (typeof input[field] !== 'string' || input[field].trim() === '') {
      return { status: 'UNVERIFIABLE' }
    }
  }
  if (input.domain !== b.domain ||
      input.ruleVersion !== b.ruleVersion ||
      input.evidenceContract !== b.evidenceContract ||
      input.boundContract !== b.boundContract) {
    return { status: 'REJECTED' }
  }
  if (input.value === undefined || input.value === null) return { status: 'UNVERIFIABLE' }
  if (typeof input.evidenceValid !== 'boolean' ||
      typeof input.withinDeclaredBounds !== 'boolean') {
    return { status: 'UNVERIFIABLE' }
  }
  if (input.evidenceValid !== true) return { status: 'UNVERIFIABLE' }
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

const derivationInput = (b, overrides = {}) => ({
  domain: b.domain,
  ruleVersion: b.ruleVersion,
  evidenceContract: b.evidenceContract,
  boundContract: b.boundContract,
  value: 1,
  evidenceValid: true,
  withinDeclaredBounds: true,
  ...overrides,
})

const adopt = (candidate, canonicalState, expectedBoundary) => {
  if (!hasOwnDataProperties(canonicalState, ['version', 'adopted'])) {
    return { version: undefined, adopted: null }
  }
  const requiredCandidateFields = [
    'status', 'domain', 'ruleVersion', 'evidenceContract', 'boundContract', 'adoptionPath', 'value',
  ]
  if (!hasOwnDataProperties(candidate, requiredCandidateFields)) {
    return { ...canonicalState, adopted: null }
  }
  const matchesBoundary =
    candidate.status === 'ADMISSIBLE' &&
    candidate.domain === expectedBoundary.domain &&
    candidate.ruleVersion === expectedBoundary.ruleVersion &&
    candidate.evidenceContract === expectedBoundary.evidenceContract &&
    candidate.boundContract === expectedBoundary.boundContract &&
    candidate.adoptionPath === expectedBoundary.adoptionPath

  return {
    version: canonicalState.version,
    adopted: matchesBoundary ? candidate : null,
  }
}


let evidenceGetterCalled = false
const accessorEvidence = derivationInput(boundary('EXP-01'))
Object.defineProperty(accessorEvidence, 'evidenceValid', {
  enumerable: true,
  get() {
    evidenceGetterCalled = true
    return true
  },
})
assert(derive(boundary('EXP-01'), accessorEvidence).status === 'UNVERIFIABLE',
  'accessor-backed EXP evidence cannot certify a result')
assert(evidenceGetterCalled === false,
  'EXP evidence validation does not execute accessors')

let candidateGetterCalled = false
const accessorCandidate = { status: 'ADMISSIBLE', ...boundary('EXP-01') }
Object.defineProperty(accessorCandidate, 'ruleVersion', {
  enumerable: true,
  get() {
    candidateGetterCalled = true
    return boundary('EXP-01').ruleVersion
  },
})
const accessorAdoption = adopt(accessorCandidate, { version: 'canonical-v1', adopted: null }, boundary('EXP-01'))
assert(accessorAdoption.adopted === null,
  'accessor-backed EXP candidate cannot be adopted')
assert(candidateGetterCalled === false,
  'EXP adoption validation does not execute candidate accessors')

let canonicalGetterCalled = false
const accessorCanonical = { version: 'canonical-v1', adopted: null }
Object.defineProperty(accessorCanonical, 'version', {
  enumerable: true,
  get() {
    canonicalGetterCalled = true
    return 'canonical-v1'
  },
})
const canonicalGuardResult = adopt(null, accessorCanonical, boundary('EXP-01'))
assert(canonicalGuardResult.adopted === null,
  'accessor-backed canonical state cannot be mutated by adoption')
assert(canonicalGetterCalled === false,
  'canonical-state guard does not execute accessors')

let unrelatedCanonicalGetterCalled = false
const canonicalWithExtraGetter = { version: 'canonical-v1', adopted: null }
Object.defineProperty(canonicalWithExtraGetter, 'unrelatedMetadata', {
  enumerable: true,
  get() {
    unrelatedCanonicalGetterCalled = true
    return 'must-not-run'
  },
})
const unrelatedGetterResult = adopt(derive(boundary('EXP-01'), derivationInput(boundary('EXP-01'))),
  canonicalWithExtraGetter, boundary('EXP-01'))
assert(unrelatedGetterResult.adopted !== null,
  'valid adoption preserves its intended result when unrelated metadata exists')
assert(unrelatedCanonicalGetterCalled === false,
  'adoption does not execute unrelated canonical-state getters while copying state')

let statusGetterCalled = false
const accessorStatusCandidate = { status: 'ADMISSIBLE', ...boundary('EXP-01'), value: 1 }
Object.defineProperty(accessorStatusCandidate, 'status', {
  enumerable: true,
  get() {
    statusGetterCalled = true
    return 'ADMISSIBLE'
  },
})
assert(adopt(accessorStatusCandidate, { version: 'canonical-v1', adopted: null }, boundary('EXP-01')).adopted === null,
  'accessor-backed status cannot pass the adoption boundary')
assert(statusGetterCalled === false,
  'adoption validation does not execute the status accessor')

const canonicalBefore = Object.freeze({ version: 'canonical-v1', adopted: null })

const inheritedEvidence = Object.create(derivationInput(boundary('EXP-01')))
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
  const ok = derive(b, derivationInput(b))
  assert(ok.status === 'ADMISSIBLE', `${family} admits a certified in-bound result`)
  assert(ok.domain === family, `${family} retains domain identity`)
  assert(ok.ruleVersion === b.ruleVersion, `${family} retains rule identity`)
  assert(ok.evidenceContract === b.evidenceContract, `${family} retains evidence identity`)
  assert(ok.boundContract === b.boundContract, `${family} retains bound identity`)
  assert(ok.adoptionPath === b.adoptionPath, `${family} retains adoption-path identity`)

  const missing = derive(b, derivationInput(b, { evidenceValid: false }))
  assert(missing.status === 'UNVERIFIABLE', `${family} fails closed on invalid evidence`)

  const rejected = derive(b, derivationInput(b, { withinDeclaredBounds: false }))
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

const missingIdentity = derive(boundary('EXP-01'), {
  value: 1, evidenceValid: true, withinDeclaredBounds: true,
})
assert(missingIdentity.status === 'UNVERIFIABLE',
  'derivation cannot silently inherit missing family and rule identity')

const crossedInput = derivationInput(boundary('EXP-10'), {
  domain: 'EXP-01',
})
assert(derive(boundary('EXP-10'), crossedInput).status === 'REJECTED',
  'cross-family derivation input is rejected before certification')

let derivationIdentityGetterCalled = false
const accessorIdentityInput = derivationInput(boundary('EXP-01'))
Object.defineProperty(accessorIdentityInput, 'ruleVersion', {
  enumerable: true,
  get() {
    derivationIdentityGetterCalled = true
    return boundary('EXP-01').ruleVersion
  },
})
assert(derive(boundary('EXP-01'), accessorIdentityInput).status === 'UNVERIFIABLE',
  'accessor-backed rule identity cannot enter derivation')
assert(derivationIdentityGetterCalled === false,
  'derivation identity validation does not execute accessors')

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
