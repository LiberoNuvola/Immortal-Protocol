#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const initial = Object.freeze({
  condition: true,
  evidenceFresh: false,
  canonicalVersion: 7,
  transitionApplied: false,
})

const attempt = (s, invoker, expectedVersion) => {
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

console.log('ALL PERMISSIONLESS LIVENESS BOUNDARY CHECKS PASSED')
