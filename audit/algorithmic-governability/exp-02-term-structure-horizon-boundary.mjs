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

const evaluateHorizon = (observation, requestedHorizon) => {
  if (!isRecord(observation) ||
      typeof requestedHorizon !== 'string' ||
      requestedHorizon.trim().length === 0) return 'UNVERIFIABLE'
  const descriptor = Object.getOwnPropertyDescriptor(observation, 'horizon')
  if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value') ||
      typeof descriptor.value !== 'string' || descriptor.value.trim().length === 0) {
    return 'UNVERIFIABLE'
  }
  if (descriptor.value !== requestedHorizon) return 'REJECTED'
  return 'ADMISSIBLE'
}

assert(
  evaluateHorizon({ horizon: 'H1', amount: 10n }, 'H1') === 'ADMISSIBLE',
  'explicit matching horizon is admissible',
)
assert(
  evaluateHorizon({ horizon: 'H1', amount: 10n }, 'H2') === 'REJECTED',
  'incompatible horizons are rejected rather than silently mixed',
)
assert(
  evaluateHorizon({ amount: 10n }, 'H1') === 'UNVERIFIABLE',
  'missing horizon evidence fails closed',
)
assert(
  evaluateHorizon({ horizon: '   ' }, 'H1') === 'UNVERIFIABLE',
  'blank observed horizon fails closed',
)
assert(
  evaluateHorizon({ horizon: 'H1' }, '   ') === 'UNVERIFIABLE',
  'blank requested horizon fails closed',
)
let horizonGetterCalls = 0
const accessorHorizon = {}
Object.defineProperty(accessorHorizon, 'horizon', {
  get() { horizonGetterCalls += 1; return 'H1' },
})
assert(
  evaluateHorizon(accessorHorizon, 'H1') === 'UNVERIFIABLE' && horizonGetterCalls === 0,
  'accessor-backed horizon fails closed without executing getters',
)
assert(
  evaluateHorizon(Object.create({ horizon: 'H1' }), 'H1') === 'UNVERIFIABLE',
  'inherited horizon evidence cannot be accepted',
)

const temporalFacts = Object.freeze({
  economicRiskHorizon: 'H1',
  ticketExpiry: 'T-expiry-1',
  mandatoryFutureCosts: 25n,
})

assert(
  temporalFacts.economicRiskHorizon !== temporalFacts.ticketExpiry,
  'economic horizon remains distinct from ticket expiry policy',
)
assert(
  temporalFacts.mandatoryFutureCosts === 25n,
  'future-cost quantity remains explicit rather than implied by the horizon label',
)

console.log('ALL EXP-02 TERM-STRUCTURE BOUNDARY CHECKS PASSED')
