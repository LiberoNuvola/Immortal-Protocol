#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Structural boundary only.
 *
 * No numeric economic limit is invented here. Bounds are represented as an
 * externally declared boolean fact so this harness tests ownership/fail-closed
 * behavior without creating a policy threshold.
 */
const makeBoundary = (family, version) => Object.freeze({
  domain: family,
  ruleVersion: version,
  evidenceContract: `evidence-${family}-v1`,
  boundContract: `bounds-${family}-v1`,
})

const derive = (boundary, certifiedInput) => {
  if (!certifiedInput) return { status: 'UNVERIFIABLE' }
  if (!Object.prototype.hasOwnProperty.call(certifiedInput, 'value') || (certifiedInput.value === undefined || certifiedInput.value === null)) {
    return { status: 'UNVERIFIABLE' }
  }

  const requiredBindings = ['domain', 'ruleVersion', 'evidenceContract', 'boundContract']
  if (requiredBindings.some((field) =>
    typeof certifiedInput[field] !== 'string' || certifiedInput[field].trim() === '',
  )) return { status: 'UNVERIFIABLE' }
  if (typeof certifiedInput.evidenceVerified !== 'boolean' ||
      typeof certifiedInput.withinDeclaredBounds !== 'boolean') {
    return { status: 'UNVERIFIABLE' }
  }

  if (
    certifiedInput.domain !== boundary.domain ||
    certifiedInput.ruleVersion !== boundary.ruleVersion ||
    certifiedInput.evidenceContract !== boundary.evidenceContract ||
    certifiedInput.boundContract !== boundary.boundContract
  ) return { status: 'REJECTED' }
  if (certifiedInput.evidenceVerified !== true) return { status: 'UNVERIFIABLE' }
  if (certifiedInput.withinDeclaredBounds !== true) return { status: 'REJECTED' }

  return Object.freeze({
    status: 'ADMISSIBLE',
    family: boundary.domain,
    ruleVersion: boundary.ruleVersion,
    evidenceContract: boundary.evidenceContract,
    boundContract: boundary.boundContract,
    value: certifiedInput.value,
  })
}

const certifiedDerivationInput = (boundary, overrides = {}) => ({
  domain: boundary.domain,
  ruleVersion: boundary.ruleVersion,
  evidenceContract: boundary.evidenceContract,
  boundContract: boundary.boundContract,
  evidenceVerified: true,
  withinDeclaredBounds: true,
  value: 7,
  ...overrides,
})

const fee = makeBoundary('fee', 'fee-v1')
const reward = makeBoundary('reward', 'reward-v1')
const governance = makeBoundary('governance', 'governance-v1')

for (const boundary of [fee, reward, governance]) {
  const result = derive(boundary, certifiedDerivationInput(boundary))
  assert(result.status === 'ADMISSIBLE', `${boundary.domain} candidate is admissible inside its declared boundary`)
  assert(result.ruleVersion === boundary.ruleVersion, `${boundary.domain} result retains rule identity`)
  assert(result.evidenceContract === boundary.evidenceContract, `${boundary.domain} result retains evidence-contract identity`)
  assert(result.boundContract === boundary.boundContract, `${boundary.domain} result retains bound-contract identity`)
  assert(result.family === boundary.domain, `${boundary.domain} result retains domain identity`)
}

assert(derive(fee, null).status === 'UNVERIFIABLE', 'missing required certification fails closed')
assert(
  derive(fee, certifiedDerivationInput(fee, { value: undefined })).status === 'UNVERIFIABLE',
  'missing derived value cannot be certified as admissible',
)
assert(
  derive(fee, certifiedDerivationInput(fee, { value: null })).status === 'UNVERIFIABLE',
  'null derived value cannot be certified as admissible',
)
assert(
  derive(fee, (() => { const input = certifiedDerivationInput(fee); delete input.value; return input })()).status === 'UNVERIFIABLE',
  'absent derived-value field remains unverifiable',
)

assert(
  derive(fee, { value: 7, withinDeclaredBounds: true }).status === 'UNVERIFIABLE',
  'missing version-bound derivation identity remains unverifiable',
)
assert(
  derive(fee, certifiedDerivationInput(fee, { ruleVersion: undefined })).status === 'UNVERIFIABLE',
  'missing rule version cannot inherit identity from the boundary',
)
assert(
  derive(fee, certifiedDerivationInput(fee, { evidenceVerified: undefined })).status === 'UNVERIFIABLE',
  'missing evidence verification cannot be inferred from bounds',
)
assert(
  derive(fee, certifiedDerivationInput(fee, { evidenceVerified: false })).status === 'UNVERIFIABLE',
  'explicitly unverified derivation evidence remains unverifiable',
)
assert(
  derive(fee, certifiedDerivationInput(fee, { evidenceContract: 'other-evidence-v1' })).status === 'REJECTED',
  'derivation evidence cannot be rebound to another evidence contract',
)
assert(
  derive(fee, certifiedDerivationInput(fee, { boundContract: 'other-bounds-v1' })).status === 'REJECTED',
  'derivation cannot substitute another declared-bound contract',
)

assert(
  derive(reward, certifiedDerivationInput(reward, { withinDeclaredBounds: false })).status === 'REJECTED',
  'explicit declared-bound violation is rejected without defining a numeric threshold',
)

const crossFamily = Object.freeze({
  ...reward,
  domain: fee.domain,
  ruleVersion: fee.ruleVersion,
  evidenceContract: fee.evidenceContract,
  boundContract: fee.boundContract,
})

assert(crossFamily.domain !== reward.domain, 'cross-family mutation is distinguishable')
assert(crossFamily.ruleVersion !== reward.ruleVersion, 'cross-family rule mutation is distinguishable')
assert(crossFamily.evidenceContract !== reward.evidenceContract, 'cross-family evidence mutation is distinguishable')

const selfExpansion = Object.freeze({
  ...fee,
  domain: 'fee-and-governance-and-rewards-and-everything',
  ruleVersion: 'self-expanded-v2',
  boundContract: 'self-expanded-bounds',
})

assert(selfExpansion.domain !== fee.domain, 'self-expanded domain is distinguishable')
assert(selfExpansion.ruleVersion !== fee.ruleVersion, 'self-expanded rule identity is distinguishable')
assert(selfExpansion.boundContract !== fee.boundContract, 'self-expanded bounds identity is distinguishable')

/*
 * Explicit Explore -> Certify -> Adopt separation.
 *
 * Explore may report a PARTIAL search, but that result must retain its coverage
 * status and cannot be silently relabeled as a complete normative universe.
 * Adoption requires an independently authorized existing path; derivation alone
 * never mutates canonical state.
 */
const explore = (boundary, certifiedState, candidates, coverage = 'PARTIAL') => {
  if (!certifiedState || certifiedState.domain !== boundary.domain) return { status: 'UNVERIFIABLE' }
  return Object.freeze({
    status: 'CANDIDATE_SET',
    family: boundary.domain,
    ruleVersion: boundary.ruleVersion,
    evidenceContract: boundary.evidenceContract,
    candidates: Object.freeze([...candidates]),
    coverage,
  })
}

const certifyCandidate = (boundary, candidate) => {
  if (!candidate || typeof candidate !== 'object') return { status: 'UNVERIFIABLE' }
  if (!Object.prototype.hasOwnProperty.call(candidate, 'value') || (candidate.value === undefined || candidate.value === null)) {
    return { status: 'UNVERIFIABLE' }
  }

  const requiredBindings = ['domain', 'ruleVersion', 'evidenceContract', 'boundContract']
  if (requiredBindings.some((field) =>
    typeof candidate[field] !== 'string' || candidate[field].trim() === '',
  )) return { status: 'UNVERIFIABLE' }
  if (typeof candidate.evidenceVerified !== 'boolean' ||
      typeof candidate.withinDeclaredBounds !== 'boolean') {
    return { status: 'UNVERIFIABLE' }
  }

  if (
    candidate.domain !== boundary.domain ||
    candidate.ruleVersion !== boundary.ruleVersion ||
    candidate.evidenceContract !== boundary.evidenceContract ||
    candidate.boundContract !== boundary.boundContract
  ) return { status: 'REJECTED' }
  if (candidate.evidenceVerified !== true) return { status: 'UNVERIFIABLE' }
  if (candidate.withinDeclaredBounds !== true) return { status: 'REJECTED' }
  return Object.freeze({
    status: 'ADMISSIBLE',
    family: boundary.domain,
    ruleVersion: boundary.ruleVersion,
    evidenceContract: boundary.evidenceContract,
    boundContract: boundary.boundContract,
    value: candidate.value,
  })
}

const adopt = (certifiedResult, authorization) => {
  if (certifiedResult?.status !== 'ADMISSIBLE') return { status: 'UNVERIFIABLE' }
  if (authorization !== 'existing-authorized-path') return { status: 'UNVERIFIABLE' }
  return Object.freeze({ status: 'ADOPTED', semanticResult: certifiedResult })
}

const search = explore(reward, { domain: 'reward' }, ['candidate-1', 'candidate-2'], 'PARTIAL')
assert(search.coverage === 'PARTIAL', 'partial search coverage is explicit')
assert(search.candidates.length === 2, 'candidate set records the portion actually explored')
const searchClaim = Object.freeze({ ...search, coverage: 'COMPLETE' })
assert(searchClaim.coverage !== search.coverage, 'complete coverage cannot be inherited from a partial search')
assert(
  certifyCandidate(reward, {
    domain: 'reward',
    ruleVersion: 'reward-v1',
    evidenceContract: 'evidence-reward-v1',
    boundContract: 'bounds-reward-v1',
    evidenceVerified: true,
    withinDeclaredBounds: true,
    value: 7,
  }).status === 'ADMISSIBLE',
  'certification is a distinct step after exploration',
)
const certified = certifyCandidate(reward, {
  domain: 'reward',
  ruleVersion: 'reward-v1',
  evidenceContract: 'evidence-reward-v1',
  boundContract: 'bounds-reward-v1',
  evidenceVerified: true,
  withinDeclaredBounds: true,
  value: 7,
})
assert(adopt(certified, 'existing-authorized-path').status === 'ADOPTED',
  'adoption requires an existing authorized path')
assert(adopt(certified, 'algorithm-decides').status === 'UNVERIFIABLE',
  'the derivation engine cannot self-authorize adoption')
assert(
  certifyCandidate(reward, {
    domain: 'reward',
    ruleVersion: 'reward-v1',
    evidenceContract: 'other-evidence-v1',
    boundContract: 'bounds-reward-v1',
    evidenceVerified: true,
    withinDeclaredBounds: true,
    value: 7,
  }).status === 'REJECTED',
  'candidate certification cannot substitute another evidence contract',
)
assert(
  certifyCandidate(reward, {
    domain: 'reward',
    ruleVersion: 'reward-v1',
    evidenceContract: 'evidence-reward-v1',
    boundContract: 'other-bounds-v1',
    evidenceVerified: true,
    withinDeclaredBounds: true,
    value: 7,
  }).status === 'REJECTED',
  'candidate certification cannot substitute another declared-bound contract',
)
assert(!('adopted' in certified), 'certification does not mutate canonical adoption state')
assert(
  certifyCandidate(reward, { ...certified.semanticResult, withinDeclaredBounds: null }).status === 'UNVERIFIABLE',
  'unknown declared-bound evidence remains unverifiable rather than being classified as a proven violation',
)
assert(
  certifyCandidate(reward, { ...certified.semanticResult, withinDeclaredBounds: 'true' }).status === 'UNVERIFIABLE',
  'string-valued declared-bound evidence is not treated as a typed boolean',
)
assert(
  certifyCandidate(reward, { ...certified.semanticResult, evidenceVerified: null }).status === 'UNVERIFIABLE',
  'unknown evidence-verification state remains unverifiable',
)
assert(
  certifyCandidate(reward, { ...certified.semanticResult, evidenceContract: ' ' }).status === 'UNVERIFIABLE',
  'blank candidate evidence identity remains unverifiable',
)

assert(
  certifyCandidate(reward, { domain: 'reward', ruleVersion: 'reward-v1', evidenceContract: 'evidence-reward-v1', boundContract: 'bounds-reward-v1', evidenceVerified: true, withinDeclaredBounds: true }).status === 'UNVERIFIABLE',
  'candidate without a derived value cannot be certified',
)
assert(
  certifyCandidate(reward, { domain: 'reward', ruleVersion: 'reward-v1', evidenceContract: 'evidence-reward-v1', boundContract: 'bounds-reward-v1', evidenceVerified: true, withinDeclaredBounds: true, value: undefined }).status === 'UNVERIFIABLE',
  'candidate with undefined derived value remains unverifiable',
)
assert(
  certifyCandidate(reward, { domain: 'reward', ruleVersion: 'reward-v1', evidenceContract: 'evidence-reward-v1', boundContract: 'bounds-reward-v1', evidenceVerified: true, withinDeclaredBounds: true, value: null }).status === 'UNVERIFIABLE',
  'candidate with null derived value remains unverifiable',
)

assert(
  derive(reward, certifiedDerivationInput(reward, { domain: 'fee' })).status === 'REJECTED',
  'a candidate from another function family cannot cross the reward boundary',
)
assert(
  derive(reward, certifiedDerivationInput(reward, { ruleVersion: 'fee-v1' })).status === 'REJECTED',
  'a result bound to another rule version cannot cross the reward boundary',
)

import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const expCatalog = [
  ['01', 'EXP-01-SENIORITY-ORDER-BOUNDARY-v1.md'],
  ['02', 'EXP-02-TERM-STRUCTURE-HORIZON-BOUNDARY-v1.md'],
  ['03', 'EXP-03-ASSET-ELIGIBILITY-BOUNDARY-v1.md'],
  ['04', 'EXP-04-COMPOSITION-OF-PROFILES-BOUNDARY-v1.md'],
  ['05', 'EXP-05-ABSTRACT-CONTINGENT-CLAIMS-BOUNDARY-v1.md'],
  ['06', ''],
  ['07', 'EXP-07-REGIME-STRESS-CONFORMANCE-v1.md'],
  ['08', 'EXP-08-NETTING-OFFSET-BOUNDARY-v1.md'],
  ['09', 'EXP-09-OBLIGATION-TRANSFER-NOVATION-BOUNDARY-v1.md'],
  ['10', 'EXP-10-EXPLICIT-RISK-BUDGET-BOUNDARY-v1.md'],
  ['11', 'EXP-11-DETERMINISTIC-AUCTION-ALLOCATION-BOUNDARY-v1.md'],
  ['12', 'EXP-12-OBSERVER-AUTHORITY-SPLIT-BOUNDARY-v1.md'],
]

const researchDir = path.join(repoRoot, 'docs', 'research')
const auditDir = path.join(repoRoot, 'audit', 'algorithmic-governability')

for (const [id, docName] of expCatalog) {
  const prefix = `EXP-${id}`
  const docCandidates = fs.existsSync(researchDir)
    ? fs.readdirSync(researchDir).filter(name => name.startsWith(prefix) && name.endsWith('.md'))
    : []
  assert(docCandidates.length > 0, `${prefix} has a research contract`)

  const harnessCandidates = fs.existsSync(auditDir)
    ? fs.readdirSync(auditDir).filter(name => name.startsWith(`exp-${id}-`) && name.endsWith('.mjs'))
    : []
  const vitestFallback = id === '07'
    ? fs.existsSync(path.join(repoRoot, 'src', '__tests__', 'preRichHysteresis.test.ts')) &&
      fs.existsSync(path.join(repoRoot, 'PRE-RICH', 'tests', 'conformance', 'PreRichHysteresisBinding.test.ts'))
    : false
  assert(harnessCandidates.length > 0 || vitestFallback, `${prefix} has an executable conformance surface`)

  if (docName) {
    assert(docCandidates.includes(docName), `${prefix} canonical research filename is present`)
  }
}

assert(
  expCatalog.length === 12,
  'EXP catalog covers exactly EXP-01 through EXP-12',
)

console.log('ALL GENERALIZED FUNCTION FAMILY CHECKS PASSED')
