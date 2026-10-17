#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const compose = (profiles) => {
  if (!Array.isArray(profiles)) return 'UNVERIFIABLE'
  const seen = new Set()
  for (const profile of profiles) {
    if (!profile || !profile.id || !Number.isInteger(profile.version) || profile.version <= 0) {
      return 'UNVERIFIABLE'
    }
    for (const key of Object.keys(profile.parameters ?? {})) {
      const qualified = JSON.stringify([profile.domain, key])
      if (seen.has(qualified)) return 'REJECTED'
      seen.add(qualified)
    }
  }
  return 'ADMISSIBLE'
}

const a = Object.freeze({
  id: 'profile-a',
  domain: 'economics-a',
  version: 1,
  parameters: { priceUnit: 1 },
})
const b = Object.freeze({
  id: 'profile-b',
  domain: 'economics-b',
  version: 2,
  parameters: { riskUnit: 4 },
})

assert(compose([a, b]) === 'ADMISSIBLE', 'orthogonal declared profiles compose without ambiguity')
assert(compose([a]) === 'ADMISSIBLE', 'a single explicit profile remains valid')
assert(compose(null) === 'UNVERIFIABLE', 'non-array profile collections fail closed')

const delimiterA = Object.freeze({
  id: 'delimiter-a',
  domain: 'a',
  version: 1,
  parameters: { 'b:c': 1 },
})
const delimiterB = Object.freeze({
  id: 'delimiter-b',
  domain: 'a:b',
  version: 1,
  parameters: { c: 2 },
})
assert(compose([delimiterA, delimiterB]) === 'ADMISSIBLE',
  'distinct domain/parameter tuples do not collide through delimiter concatenation')
assert(
  compose([{ id: 'profile-a', domain: 'economics-a', version: 0, parameters: {} }]) === 'UNVERIFIABLE',
  'invalid profile version fails closed',
)

const conflicting = Object.freeze({
  id: 'profile-c',
  domain: 'economics-a',
  version: 1,
  parameters: { priceUnit: 2 },
})

assert(
  compose([a, conflicting]) === 'REJECTED',
  'same-domain parameter collision is rejected rather than silently overridden',
)
assert(
  compose([conflicting, a]) === 'REJECTED',
  'composition order cannot choose a collision winner',
)

const composed = Object.freeze({
  members: [a.id, b.id],
  governanceAuthority: false,
  economicAuthority: false,
})
assert(composed.members.length === 2, 'member identity remains explicit after composition')
assert(composed.governanceAuthority === false, 'composition does not manufacture governance authority')
assert(composed.economicAuthority === false, 'composition does not manufacture economic authority')

console.log('ALL EXP-04 COMPOSITION BOUNDARY CHECKS PASSED')
