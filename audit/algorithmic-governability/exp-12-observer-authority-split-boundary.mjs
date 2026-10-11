#!/usr/bin/env node

const authorize = (observation, authority) => {
  if (!observation?.verified) return 'UNVERIFIABLE'
  if (!authority?.authorized) return 'UNVERIFIABLE'
  return Object.freeze({
    state: observation.state,
    authority: true,
  })
}

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const observation = Object.freeze({
  verified: true,
  state: 'observed-state-v1',
})

assert(
  authorize(observation, { authorized: true }).authority === true,
  'verified observation plus separate authority can produce an authorization result',
)
assert(
  authorize(observation, null) === 'UNVERIFIABLE',
  'observation alone cannot manufacture authority',
)
assert(
  authorize(Object.freeze({ ...observation, verified: false }), { authorized: true }) === 'UNVERIFIABLE',
  'unverified observation cannot enter the authority boundary',
)

console.log('ALL EXP-12 OBSERVER/AUTHORITY BOUNDARY CHECKS PASSED')
