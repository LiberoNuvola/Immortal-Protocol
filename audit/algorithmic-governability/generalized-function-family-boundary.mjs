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

console.log('ALL GENERALIZED FUNCTION FAMILY CHECKS PASSED')
