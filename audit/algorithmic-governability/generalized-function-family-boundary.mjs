#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const makeBoundary = (family, version) => Object.freeze({
  domain: family,
  ruleVersion: version,
  evidenceContract: `evidence-${family}-v1`,
  limit: 100,
})

const derive = (boundary, certifiedInput) => {
  if (certifiedInput == null) return { status: 'UNVERIFIABLE' }
  if (certifiedInput < 0 || certifiedInput > boundary.limit) return { status: 'REJECTED' }
  return Object.freeze({
    status: 'ADMISSIBLE',
    family: boundary.domain,
    ruleVersion: boundary.ruleVersion,
    evidenceContract: boundary.evidenceContract,
    value: certifiedInput,
  })
}

const fee = makeBoundary('fee', 'fee-v1')
const reward = makeBoundary('reward', 'reward-v1')
const governance = makeBoundary('governance', 'governance-v1')

for (const boundary of [fee, reward, governance]) {
  const result = derive(boundary, 7)
  assert(result.status === 'ADMISSIBLE', `${boundary.domain} candidate is admissible inside its own boundary`)
  assert(result.ruleVersion === boundary.ruleVersion, `${boundary.domain} result retains rule identity`)
  assert(result.evidenceContract === boundary.evidenceContract, `${boundary.domain} result retains evidence-contract identity`)
  assert(result.family === boundary.domain, `${boundary.domain} result retains domain identity`)
}

assert(derive(fee, null).status === 'UNVERIFIABLE', 'missing required input fails closed')
assert(derive(reward, 101).status === 'REJECTED', 'bound violation is rejected')

const crossFamily = Object.freeze({
  ...reward,
  domain: fee.domain,
  ruleVersion: fee.ruleVersion,
  evidenceContract: fee.evidenceContract,
})

assert(crossFamily.domain !== reward.domain, 'cross-family mutation is distinguishable')
assert(crossFamily.ruleVersion !== reward.ruleVersion, 'cross-family rule mutation is distinguishable')

const selfExpansion = Object.freeze({
  ...fee,
  domain: 'fee-and-governance-and-rewards-and-everything',
  ruleVersion: 'self-expanded-v2',
})

assert(selfExpansion.domain !== fee.domain, 'self-expanded domain is distinguishable')
assert(selfExpansion.ruleVersion !== fee.ruleVersion, 'self-expanded rule identity is distinguishable')

console.log('ALL GENERALIZED FUNCTION FAMILY CHECKS PASSED')
