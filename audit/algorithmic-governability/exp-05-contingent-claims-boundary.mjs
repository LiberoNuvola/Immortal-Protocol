#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const establishClaim = (spec, event, state) => {
  if (!spec || typeof spec.triggerPredicate !== 'function' || typeof spec.payoffFunction !== 'function') {
    return 'UNVERIFIABLE'
  }
  if (!spec.settlementAsset || typeof spec.cap !== 'bigint' || spec.cap < 0n) {
    return 'UNVERIFIABLE'
  }
  if (!spec.triggerPredicate(event, state)) return null

  const computed = spec.payoffFunction(event, state)
  if (typeof computed !== 'bigint' || computed < 0n) return 'REJECTED'

  const established = computed > spec.cap ? spec.cap : computed
  return Object.freeze({
    settlementAsset: spec.settlementAsset,
    entitlement: established,
  })
}

const settleEstablishedClaim = (claim, mutableState) => {
  if (!claim || typeof claim.entitlement !== 'bigint') return 'UNVERIFIABLE'
  // mutableState is deliberately ignored: settlement consumes the
  // established entitlement rather than recomputing a payout.
  void mutableState
  return claim.entitlement
}

const spec = Object.freeze({
  settlementAsset: 'reference-unit',
  cap: 100n,
  triggerPredicate: (_event, state) => state.eligible === true,
  payoffFunction: (_event, state) => BigInt(state.baseAmount),
})

const established = establishClaim(
  spec,
  { kind: 'qualified-event' },
  { eligible: true, baseAmount: 75 },
)

assert(established !== 'UNVERIFIABLE' && established !== null, 'qualified trigger establishes an explicit claim instance')
assert(established.entitlement === 75n, 'established entitlement records the derived payoff')
assert(
  settleEstablishedClaim(established, { eligible: true, baseAmount: 1 }) === 75n,
  'settlement uses established entitlement and does not recompute mutable state',
)

const capped = establishClaim(
  spec,
  { kind: 'qualified-event' },
  { eligible: true, baseAmount: 500 },
)
assert(capped.entitlement === 100n, 'declared claim cap is applied at establishment')

const missingSpec = establishClaim(null, {}, {})
assert(missingSpec === 'UNVERIFIABLE', 'missing claim definition fails closed')

const unmet = establishClaim(
  spec,
  { kind: 'qualified-event' },
  { eligible: false, baseAmount: 75 },
)
assert(unmet === null, 'unmet trigger does not establish a claim')

const invalidPayoff = establishClaim(
  {
    ...spec,
    payoffFunction: () => -1n,
  },
  { kind: 'qualified-event' },
  { eligible: true, baseAmount: 75 },
)
assert(invalidPayoff === 'REJECTED', 'invalid payoff output is rejected')

console.log('ALL EXP-05 CONTINGENT CLAIM BOUNDARY CHECKS PASSED')
