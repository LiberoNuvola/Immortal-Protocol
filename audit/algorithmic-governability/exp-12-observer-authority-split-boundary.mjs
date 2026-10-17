#!/usr/bin/env node

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

const authorize = (observation, authority) => {
  if (!isRecord(observation) || !isRecord(authority)) return 'UNVERIFIABLE'

  const verified = readOwnData(observation, 'verified')
  const observationId = readOwnData(observation, 'observationId')
  const evidenceRef = readOwnData(observation, 'evidenceRef')
  const authorized = readOwnData(authority, 'authorized')
  const authorityReference = readOwnData(authority, 'authorityReference')

  if (
    verified !== true ||
    typeof observationId !== 'string' ||
    typeof evidenceRef !== 'string'
  ) return 'UNVERIFIABLE'

  if (
    authorized !== true ||
    typeof authorityReference !== 'string'
  ) return 'UNVERIFIABLE'

  return Object.freeze({ observationId, evidenceRef, authorityReference })
}

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const observation = Object.freeze({
  verified: true,
  observationId: 'obs-v1',
  evidenceRef: 'evidence-obs-v1',
  state: 'observed-state-v1',
})

const authority = Object.freeze({
  authorized: true,
  authorityReference: 'authority-v1',
})

const authorized = authorize(observation, authority)

assert(
  authorized.observationId === observation.observationId &&
    authorized.evidenceRef === observation.evidenceRef &&
    authorized.authorityReference === authority.authorityReference,
  'verified observation and separate authority retain their explicit identities at the boundary',
)

assert(
  authorize(observation, null) === 'UNVERIFIABLE',
  'observation alone cannot manufacture authority',
)

assert(
  authorize(Object.freeze({ ...observation, verified: false }), authority) === 'UNVERIFIABLE',
  'unverified observation cannot enter the authority boundary',
)

assert(
  authorize(Object.freeze({ ...observation, evidenceRef: undefined }), authority) === 'UNVERIFIABLE',
  'observation without explicit provenance cannot enter the authority boundary',
)

assert(
  authorize(observation, Object.freeze({ authorized: true })) === 'UNVERIFIABLE',
  'authority without an explicit authorization reference cannot cross the boundary',
)
let fieldGetterCalls = 0
const accessorObservation = { observationId: 'obs-v1', evidenceRef: 'evidence-obs-v1' }
Object.defineProperty(accessorObservation, 'verified', {
  get() { fieldGetterCalls += 1; return true },
})
assert(
  authorize(accessorObservation, authority) === 'UNVERIFIABLE' && fieldGetterCalls === 0,
  'accessor-backed observation verification fails closed without invoking its getter',
)
assert(
  authorize(Object.create(observation), authority) === 'UNVERIFIABLE',
  'inherited observation identity cannot cross the authority boundary',
)
const accessorAuthority = { authorityReference: 'authority-v1' }
Object.defineProperty(accessorAuthority, 'authorized', {
  get() { fieldGetterCalls += 1; return true },
})
assert(
  authorize(observation, accessorAuthority) === 'UNVERIFIABLE' && fieldGetterCalls === 0,
  'accessor-backed authority cannot self-authorize through a getter',
)

const alteredObservation = Object.freeze({
  ...observation,
  observationId: 'obs-mutated',
})

const alteredAuthorization = authorize(alteredObservation, authority)

assert(
  alteredAuthorization.observationId !== authorized.observationId,
  'observation identity mutation remains distinguishable from the previously authorized result',
)

assert(
  alteredAuthorization.authorityReference === authorized.authorityReference,
  'observation mutation does not silently mutate the separately supplied authority identity',
)

console.log('ALL EXP-12 OBSERVER/AUTHORITY BOUNDARY CHECKS PASSED')
