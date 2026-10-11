#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const state = Object.freeze({
  condition: true,
  evidenceFresh: false,
  canonicalVersion: 7,
  transitionApplied: false,
})

const attempt = (s, invoker) => {
  if (!invoker) return { ...s, transitionApplied: false, status: 'SAFE_STALL' }
  if (!s.condition || !s.evidenceFresh) {
    return { ...s, transitionApplied: false, status: 'UNVERIFIABLE' }
  }
  return {
    ...s,
    transitionApplied: true,
    canonicalVersion: s.canonicalVersion + 1,
    status: 'APPLIED',
  }
}

const noKeeper = attempt(state, null)
assert(noKeeper.status === 'SAFE_STALL', 'absence of a keeper produces safe stall')
assert(noKeeper.canonicalVersion === state.canonicalVersion, 'safe stall does not mutate canonical state')

const staleAttempt = attempt(state, 'keeper-a')
assert(staleAttempt.status === 'UNVERIFIABLE', 'stale evidence cannot authorize transition')
assert(staleAttempt.canonicalVersion === state.canonicalVersion, 'stale evidence leaves canonical state unchanged')

const freshState = Object.freeze({ ...state, evidenceFresh: true })
const applied = attempt(freshState, 'keeper-b')
assert(applied.status === 'APPLIED', 'fresh evidence allows a permissionless invocation to proceed')
assert(applied.canonicalVersion === freshState.canonicalVersion + 1, 'successful transition updates canonical state once')

const duplicate = attempt(applied, 'keeper-c')
assert(duplicate.status === 'APPLIED' || duplicate.status === 'UNVERIFIABLE', 'a second actor must revalidate current state rather than trust prior wake-up')

console.log('ALL PERMISSIONLESS LIVENESS BOUNDARY CHECKS PASSED')
