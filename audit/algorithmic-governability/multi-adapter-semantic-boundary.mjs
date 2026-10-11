#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

// Toy only: demonstrates reuse of one universal derivation across two adapter encodings.
const rule = Object.freeze({ version: 'universal-rule-v1' })
const certifiedState = Object.freeze({ available: 12, obligations: 5 })

const derive = (state, r) => ({
  ruleVersion: r.version,
  semanticAmount: state.available - state.obligations,
})

const result = derive(certifiedState, rule)

const cardanoAdapter = (x) => Object.freeze({
  chain: 'cardano',
  payload: `lovelace-like:${x.semanticAmount}`,
  ruleVersion: x.ruleVersion,
})

const otherAdapter = (x) => Object.freeze({
  chain: 'adapter-b',
  payload: { amount: x.semanticAmount },
  ruleVersion: x.ruleVersion,
})

const a = cardanoAdapter(result)
const b = otherAdapter(result)

assert(a.ruleVersion === b.ruleVersion, 'adapters preserve the universal rule identity')
assert(Number(a.payload.split(':')[1]) === b.payload.amount, 'adapters preserve the same semantic result')
assert(a.chain !== b.chain, 'adapter encodings remain chain-specific')

const tampered = Object.freeze({
  ...otherAdapter(result),
  payload: { amount: result.semanticAmount + 1 },
})

assert(tampered.payload.amount !== result.semanticAmount, 'adapter result mutation is detectable')
assert(tampered.ruleVersion === result.ruleVersion, 'rule identity alone does not hide semantic mutation')

console.log('ALL MULTI-ADAPTER SEMANTIC BOUNDARY CHECKS PASSED')