#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
   Object.getPrototypeOf(value) === null)

const readOwnData = (record, key) => {
  if (!isRecord(record)) return undefined
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined
}

const establishClaim = (spec, event, state) => {
  if (!isRecord(spec)) return 'UNVERIFIABLE'
  const triggerPredicate = readOwnData(spec, 'triggerPredicate')
  const payoffFunction = readOwnData(spec, 'payoffFunction')
  const settlementAsset = readOwnData(spec, 'settlementAsset')
  const cap = readOwnData(spec, 'cap')
  if (typeof triggerPredicate !== 'function' || typeof payoffFunction !== 'function') {
    return 'UNVERIFIABLE'
  }
  if (typeof settlementAsset !== 'string' || settlementAsset.trim().length === 0 ||
      typeof cap !== 'bigint' || cap < 0n) {
    return 'UNVERIFIABLE'
  }

  let triggered
  try {
    triggered = triggerPredicate(event, state)
  } catch {
    return 'UNVERIFIABLE'
  }
  if (typeof triggered !== 'boolean') return 'UNVERIFIABLE'
  if (!triggered) return null

  let computed
  try {
    computed = payoffFunction(event, state)
  } catch {
    return 'UNVERIFIABLE'
  }
  if (typeof computed !== 'bigint' || computed < 0n) return 'REJECTED'

  const established = computed > cap ? cap : computed
  return Object.freeze({ settlementAsset, entitlement: established })
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

let specGetterCalls = 0
const accessorSpec = { settlementAsset: 'reference-unit', cap: 100n, triggerPredicate: () => true, payoffFunction: () => 10n }
Object.defineProperty(accessorSpec, 'cap', {
  get() { specGetterCalls += 1; return 100n },
})
assert(
  establishClaim(accessorSpec, {}, {}) === 'UNVERIFIABLE' && specGetterCalls === 0,
  'accessor-backed claim specification fails closed without executing getters',
)
assert(
  establishClaim(Object.create(spec), {}, {}) === 'UNVERIFIABLE',
  'inherited claim specification cannot establish an entitlement',
)
assert(
  establishClaim({ ...spec, triggerPredicate: () => { throw new Error('trigger failure') } }, {}, {}) === 'UNVERIFIABLE',
  'trigger evaluation failure remains unverifiable rather than escaping the boundary',
)
assert(
  establishClaim({ ...spec, triggerPredicate: () => 'yes' }, {}, {}) === 'UNVERIFIABLE',
  'non-boolean trigger output cannot establish a claim',
)
assert(
  establishClaim({ ...spec, payoffFunction: () => { throw new Error('payoff failure') } }, {}, {}) === 'UNVERIFIABLE',
  'payoff evaluation failure remains unverifiable rather than escaping the boundary',
)

console.log('ALL EXP-05 CONTINGENT CLAIM BOUNDARY CHECKS PASSED')
