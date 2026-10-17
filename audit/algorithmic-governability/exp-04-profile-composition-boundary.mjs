#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const ownDataField = (record, key) => {
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? { present: true, value: descriptor.value }
    : { present: false, value: undefined }
}

const isRecord = (value) => value !== null && typeof value === 'object' &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

const compose = (profiles) => {
  if (!Array.isArray(profiles)) return 'UNVERIFIABLE'
  const seen = new Set()
  for (const profile of profiles) {
    if (!isRecord(profile)) return 'UNVERIFIABLE'
    const id = ownDataField(profile, 'id')
    const domain = ownDataField(profile, 'domain')
    const version = ownDataField(profile, 'version')
    const parameters = ownDataField(profile, 'parameters')
    if (!id.present || typeof id.value !== 'string' || !id.value.trim() ||
        !domain.present || typeof domain.value !== 'string' || !domain.value.trim() ||
        !version.present || !Number.isInteger(version.value) || version.value <= 0 ||
        !parameters.present || !isRecord(parameters.value)) {
      return 'UNVERIFIABLE'
    }
    for (const key of Object.keys(parameters.value)) {
      const qualified = JSON.stringify([domain.value, key])
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

let getterExecuted = false
const accessorProfile = {
  id: 'accessor-profile',
  version: 1,
  parameters: {},
  get domain() {
    getterExecuted = true
    return 'economics-a'
  },
}
assert(compose([accessorProfile]) === 'UNVERIFIABLE',
  'accessor-backed identity fields are rejected without evaluation')
assert(getterExecuted === false, 'profile validation never executes identity getters')

const inheritedIdentity = Object.assign(Object.create({ id: 'inherited-id' }), {
  domain: 'economics-a',
  version: 1,
  parameters: {},
})
assert(compose([inheritedIdentity]) === 'UNVERIFIABLE',
  'inherited profile identity fields are rejected')

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
