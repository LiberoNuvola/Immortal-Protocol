#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const evaluateHorizon = (observation, requestedHorizon) => {
  if (!observation?.horizon || !requestedHorizon) return 'UNVERIFIABLE'
  if (observation.horizon !== requestedHorizon) return 'REJECTED'
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
