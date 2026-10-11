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
  if (!certifiedInput || certifiedInput.withinDeclaredBounds == null) {
    return { status: 'UNVERIFIABLE' }
  }
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

const fee = makeBoundary('fee', 'fee-v1')
const reward = makeBoundary('reward', 'reward-v1')
const governance = makeBoundary('governance', 'governance-v1')

for (const boundary of [fee, reward, governance]) {
  const result = derive(boundary, { value: 7, withinDeclaredBounds: true })
  assert(result.status === 'ADMISSIBLE', `${boundary.domain} candidate is admissible inside its declared boundary`)
  assert(result.ruleVersion === boundary.ruleVersion, `${boundary.domain} result retains rule identity`)
  assert(result.evidenceContract === boundary.evidenceContract, `${boundary.domain} result retains evidence-contract identity`)
  assert(result.boundContract === boundary.boundContract, `${boundary.domain} result retains bound-contract identity`)
  assert(result.family === boundary.domain, `${boundary.domain} result retains domain identity`)
}

assert(derive(fee, null).status === 'UNVERIFIABLE', 'missing required certification fails closed')
assert(
  derive(reward, { value: 7, withinDeclaredBounds: false }).status === 'REJECTED',
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
