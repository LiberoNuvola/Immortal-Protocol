#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const hasOwnDataProperties = (record, fields) => {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) return false
  const prototype = Object.getPrototypeOf(record)
  if (prototype !== Object.prototype && prototype !== null) return false
  return fields.every((field) => {
    const descriptor = Object.getOwnPropertyDescriptor(record, field)
    return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
  })
}

const CANONICAL_FIELDS = ['condition', 'evidenceFresh', 'canonicalVersion', 'transitionApplied']
const CANDIDATE_FIELDS = ['invoker', 'transitionRef', 'expectedVersion']

const initial = Object.freeze({
  condition: true,
  evidenceFresh: false,
  canonicalVersion: 7,
  transitionApplied: false,
})

const attempt = (s, invoker, expectedVersion) => {
  if (!hasOwnDataProperties(s, CANONICAL_FIELDS)) return { status: 'UNVERIFIABLE', state: s }
  if (!invoker) return { ...s, status: 'SAFE_STALL' }
  if (expectedVersion !== s.canonicalVersion) return { ...s, status: 'STALE_STATE' }
  if (!s.condition || !s.evidenceFresh || s.transitionApplied) {
    return { ...s, status: 'UNVERIFIABLE' }
  }
  return {
    ...s,
    condition: false,
    transitionApplied: true,
    canonicalVersion: s.canonicalVersion + 1,
    status: 'APPLIED',
  }
}

const noKeeper = attempt(initial, null, 7)
assert(noKeeper.status === 'SAFE_STALL', 'absence of a keeper produces safe stall')
assert(noKeeper.canonicalVersion === initial.canonicalVersion, 'safe stall does not mutate canonical state')

const missingFreshEvidence = attempt(initial, 'keeper-a', 7)
assert(missingFreshEvidence.status === 'UNVERIFIABLE', 'missing/stale evidence cannot authorize transition')
assert(missingFreshEvidence.canonicalVersion === initial.canonicalVersion, 'missing/stale evidence leaves canonical state unchanged')

const staleVersion = attempt(Object.freeze({ ...initial, evidenceFresh: true }), 'keeper-a', 6)
assert(staleVersion.status === 'STALE_STATE', 'invocation against an outdated canonical version is rejected')
assert(staleVersion.canonicalVersion === initial.canonicalVersion, 'stale-version invocation cannot mutate canonical state')

const freshState = Object.freeze({ ...initial, evidenceFresh: true })
const applied = attempt(freshState, 'keeper-b', 7)
assert(applied.status === 'APPLIED', 'fresh evidence allows permissionless invocation')
assert(applied.canonicalVersion === 8, 'successful transition increments canonical version exactly once')

const duplicate = attempt(applied, 'keeper-c', 7)
assert(duplicate.status === 'STALE_STATE', 'duplicate invocation against prior version is rejected')
assert(duplicate.canonicalVersion === 8, 'duplicate invocation cannot increment canonical version twice')

const replay = attempt(applied, 'keeper-d', 8)
assert(replay.status === 'UNVERIFIABLE', 'same transition cannot be replayed at the current version')
assert(replay.canonicalVersion === 8, 'replay attempt leaves canonical state unchanged')

/*
 * Commit-time revalidation fixture for competing permissionless keepers.
 * This models the existing canonical-version/atomic-transition requirement;
 * it is not evidence that a deployed ledger implements this path correctly.
 */
const commitCandidate = (canonical, candidate) => {
  if (!hasOwnDataProperties(canonical, CANONICAL_FIELDS)) {
    return { status: 'UNVERIFIABLE', state: canonical }
  }
  if (!hasOwnDataProperties(candidate, CANDIDATE_FIELDS)) {
    return { status: 'INVALID_CANDIDATE', state: canonical }
  }
  if (typeof candidate.invoker !== 'string' || candidate.invoker.trim() === '') {
    return { status: 'INVALID_CANDIDATE', state: canonical }
  }
  if (typeof candidate.transitionRef !== 'string' || candidate.transitionRef.trim() === '') {
    return { status: 'INVALID_CANDIDATE', state: canonical }
  }
  if (!Number.isSafeInteger(candidate.expectedVersion) || candidate.expectedVersion < 0) {
    return { status: 'INVALID_CANDIDATE', state: canonical }
  }
  if (candidate.expectedVersion !== canonical.canonicalVersion) {
    return { status: 'STALE_STATE', state: canonical }
  }
  if (!canonical.condition || !canonical.evidenceFresh || canonical.transitionApplied) {
    return { status: 'UNVERIFIABLE', state: canonical }
  }
  return {
    status: 'APPLIED',
    state: Object.freeze({
      ...canonical,
      condition: false,
      transitionApplied: true,
      canonicalVersion: canonical.canonicalVersion + 1,
    }),
  }
}

const concurrentCandidateA = Object.freeze({
  invoker: 'keeper-a',
  transitionRef: 'transition-001',
  expectedVersion: freshState.canonicalVersion,
})
const concurrentCandidateB = Object.freeze({
  invoker: 'keeper-b',
  transitionRef: 'transition-001',
  expectedVersion: freshState.canonicalVersion,
})

const invalidCandidates = [
  null,
  {},
  { ...concurrentCandidateA, invoker: '   ' },
  { ...concurrentCandidateA, transitionRef: '' },
  { ...concurrentCandidateA, expectedVersion: '7' },
  { ...concurrentCandidateA, expectedVersion: -1 },
  { ...concurrentCandidateA, expectedVersion: Number.MAX_SAFE_INTEGER + 1 },
]
for (const candidate of invalidCandidates) {
  const rejected = commitCandidate(freshState, candidate)
  assert(rejected.status === 'INVALID_CANDIDATE', 'malformed candidate identity/version is rejected')
  assert(rejected.state.canonicalVersion === freshState.canonicalVersion, 'invalid candidate leaves canonical version unchanged')
}

for (const malformedCanonical of [null, undefined, 'state', 5, []]) {
  const rejected = commitCandidate(malformedCanonical, concurrentCandidateA)
  assert(rejected.status === 'UNVERIFIABLE', `malformed canonical state (${String(malformedCanonical)}) cannot be committed against`)
  assert(rejected.state === malformedCanonical, 'malformed canonical state is not replaced or synthesized')
}


let canonicalGetterCalled = false
const accessorCanonical = { ...freshState }
Object.defineProperty(accessorCanonical, 'evidenceFresh', {
  enumerable: true,
  get() {
    canonicalGetterCalled = true
    return true
  },
})
const accessorCanonicalResult = commitCandidate(accessorCanonical, concurrentCandidateA)
assert(accessorCanonicalResult.status === 'UNVERIFIABLE',
  'accessor-backed canonical state is unverifiable')
assert(canonicalGetterCalled === false,
  'canonical-state validation does not execute accessors')

let candidateGetterCalled = false
const accessorCandidate = { ...concurrentCandidateA }
Object.defineProperty(accessorCandidate, 'expectedVersion', {
  enumerable: true,
  get() {
    candidateGetterCalled = true
    return freshState.canonicalVersion
  },
})
const accessorCandidateResult = commitCandidate(freshState, accessorCandidate)
assert(accessorCandidateResult.status === 'INVALID_CANDIDATE',
  'accessor-backed keeper candidate is rejected')
assert(candidateGetterCalled === false,
  'keeper-candidate validation does not execute accessors')

let attemptGetterCalled = false
const accessorAttemptState = { ...freshState }
Object.defineProperty(accessorAttemptState, 'condition', {
  enumerable: true,
  get() {
    attemptGetterCalled = true
    return true
  },
})
const accessorAttemptResult = attempt(accessorAttemptState, 'keeper-x', 7)
assert(accessorAttemptResult.status === 'UNVERIFIABLE',
  'accessor-backed state cannot authorize a permissionless transition')
assert(attemptGetterCalled === false,
  'permissionless attempt validation does not execute state accessors')

const raceWinner = commitCandidate(freshState, concurrentCandidateA)
assert(raceWinner.status === 'APPLIED', 'first eligible keeper wins commit-time version revalidation')
assert(raceWinner.state.canonicalVersion === 8, 'first concurrent candidate increments canonical version once')

const raceLoser = commitCandidate(raceWinner.state, concurrentCandidateB)
assert(raceLoser.status === 'STALE_STATE', 'competing keeper is rejected after canonical state advances')
assert(raceLoser.state.canonicalVersion === 8, 'losing concurrent candidate cannot increment canonical version twice')
assert(raceLoser.state.transitionApplied === true, 'losing candidate preserves the already-committed transition')

const staleEvidenceCandidate = commitCandidate(
  Object.freeze({ ...freshState, evidenceFresh: false }),
  concurrentCandidateA,
)
assert(staleEvidenceCandidate.status === 'UNVERIFIABLE', 'commit-time revalidation rejects evidence that is no longer fresh')
assert(staleEvidenceCandidate.state.canonicalVersion === freshState.canonicalVersion, 'failed commit-time revalidation leaves canonical version unchanged')

console.log('ALL PERMISSIONLESS LIVENESS BOUNDARY CHECKS PASSED')
