#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Toy transport boundary only.
 * The universal layer receives an already-certified semantic result; this test
 * does not invent an economic derivation formula.
 */
const certifiedResult = Object.freeze({
  ruleVersion: 'universal-rule-v1',
  semanticResult: Object.freeze({
    kind: 'settlement-target',
    amount: 7n,
    unit: 'U',
  }),
})

const cardanoAdapter = (x) => Object.freeze({
  chain: 'cardano',
  payload: { amount: x.semanticResult.amount, unit: x.semanticResult.unit },
  ruleVersion: x.ruleVersion,
})

const otherAdapter = (x) => Object.freeze({
  chain: 'adapter-b',
  payload: { amount: x.semanticResult.amount, unit: x.semanticResult.unit },
  ruleVersion: x.ruleVersion,
})

const a = cardanoAdapter(certifiedResult)
const b = otherAdapter(certifiedResult)

assert(a.ruleVersion === b.ruleVersion, 'adapters preserve universal rule identity')
assert(a.payload.amount === b.payload.amount, 'adapters preserve the same certified semantic amount')
assert(a.payload.unit === b.payload.unit, 'adapters preserve the same certified semantic unit')
assert(a.chain !== b.chain, 'adapter encodings remain chain-specific')

const semanticFromAdapter = (adapter) => {
  if (!adapter?.payload || typeof adapter.payload.amount !== 'bigint') return null
  return Object.freeze({
    amount: adapter.payload.amount,
    unit: adapter.payload.unit,
  })
}

const verifySemanticEquivalence = (adapter, expected) => {
  const actual = semanticFromAdapter(adapter)
  return (
    adapter.ruleVersion === expected.ruleVersion &&
    actual?.amount === expected.semanticResult.amount &&
    actual?.unit === expected.semanticResult.unit
  )
}

assert(verifySemanticEquivalence(a, certifiedResult), 'Cardano adapter preserves the universal semantic result')
assert(verifySemanticEquivalence(b, certifiedResult), 'adapter-b preserves the universal semantic result')

const tampered = Object.freeze({
  ...otherAdapter(certifiedResult),
  payload: { amount: 8n, unit: 'U' },
})
assert(!verifySemanticEquivalence(tampered, certifiedResult), 'adapter semantic mutation is rejected by equivalence checking')

const missingRule = Object.freeze({
  ...b,
  ruleVersion: '',
})
assert(!verifySemanticEquivalence(missingRule, certifiedResult), 'missing universal rule identity cannot pass equivalence')

console.log('ALL MULTI-ADAPTER SEMANTIC BOUNDARY CHECKS PASSED')
