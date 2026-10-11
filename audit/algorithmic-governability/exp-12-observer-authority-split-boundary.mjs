#!/usr/bin/env node

const authorize = (observation, authority) => {
  if (
    !observation?.verified ||
    typeof observation.observationId !== 'string' ||
    typeof observation.evidenceRef !== 'string'
  ) {
    return 'UNVERIFIABLE'
  }

  if (
    !authority?.authorized ||
    typeof authority.authorityReference !== 'string'
  ) {
    return 'UNVERIFIABLE'
  }

  return Object.freeze({
    observationId: observation.observationId,
    evidenceRef: observation.evidenceRef,
    authorityReference: authority.authorityReference,
  })
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
