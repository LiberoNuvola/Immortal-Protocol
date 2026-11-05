#!/usr/bin/env node

// NON-NORMATIVE toy model. This checks process invariants only; it does not
// control GitHub permissions, force merges, or certify repository governance.
import assert from 'node:assert/strict'

const ELIGIBLE_CLASSES = new Set(['A', 'B', 'C', 'D', 'E'])
const REQUIRED_EVIDENCE = [
  'layerDeclared',
  'scopeInventoryPresent',
  'normativeStatusDeclared',
  'reproductionOrReasonForNATest',
  'residualImpactDeclared',
  'commitShaBound',
]

const classify = (pr) => {
  if (!pr || typeof pr !== 'object') return 'INCOMPLETE'
  if (!ELIGIBLE_CLASSES.has(pr.eligibleClass)) return 'OUT_OF_SCOPE'
  if (pr.normativeChange === true || pr.semanticBoundaryChanged === true) return 'OUT_OF_SCOPE'
  if (REQUIRED_EVIDENCE.some((field) => pr[field] !== true)) return 'INCOMPLETE'
  if (pr.checksPass !== true) return 'INCOMPLETE'
  if (pr.evidenceCommitSha !== pr.commitSha) return 'INCOMPLETE'
  return 'ELIGIBLE'
}

const challenge = (status, claim) => {
  const allowed = new Set([
    'MISSING_EVIDENCE',
    'FAILING_CHECK',
    'SCOPE_MISMATCH',
    'SECURITY',
    'PROVENANCE',
    'COMPATIBILITY',
    'LICENSING',
  ])
  if (!claim || !allowed.has(claim.category)) return { status, accepted: false }
  if (typeof claim.reason !== 'string' || claim.reason.trim().length < 12) {
    return { status, accepted: false }
  }
  if (claim.category !== 'SECURITY' && (typeof claim.evidenceRef !== 'string' || claim.evidenceRef.trim().length === 0)) {
    return { status, accepted: false }
  }
  return { status: 'CHALLENGED', accepted: true, category: claim.category }
}

const deadlineTransition = (status, elapsedDays, hasRecordedBlocker) => {
  if (elapsedDays < 14 || hasRecordedBlocker || status === 'RESOLVED' ||
      status === 'CLOSED' || status === 'WITHDRAWN') return status
  if (status === 'ELIGIBLE' || status === 'CLAIMED' || status === 'INCOMPLETE') {
    return 'PROCEDURALLY_OVERDUE'
  }
  return status
}

// A valid challenge has its own lifecycle. Deadline expiry increases visibility
// and accountability; it never silently resolves the technical objection.
const challengeDeadlineTransition = (state, elapsedDays) => {
  const terminal = new Set(['RESOLVED_NO_BLOCKER', 'RESOLVED_FIXED', 'CLOSED'])
  if (terminal.has(state) || elapsedDays < 14) return state
  if (state === 'SECURITY_HOLD' || state === 'SECURITY_ESCALATED') return 'SECURITY_ESCALATED'
  if (state === 'OPEN' || state === 'ACKNOWLEDGED' ||
      state === 'UNDER_REVIEW' || state === 'ESCALATED') return 'ESCALATED'
  return state
}

const challengeAllowsAutoMerge = (pr) => {
  const state = pr.challengeState ?? (pr.challengeOpen === true ? 'OPEN' : 'NONE')
  if (state === 'NONE') return true
  if (state !== 'RESOLVED_NO_BLOCKER' && state !== 'RESOLVED_FIXED') return false
  if (typeof pr.challengeResolutionRef !== 'string' || pr.challengeResolutionRef.trim().length === 0) return false
  if (typeof pr.challengeResolutionReason !== 'string' || pr.challengeResolutionReason.trim().length < 12) return false
  if (pr.challengeResolutionCommitSha !== pr.commitSha) return false
  if (state === 'RESOLVED_FIXED' && (pr.requiredChecksPass !== true ||
      pr.evidenceCommitSha !== pr.commitSha)) return false
  return true
}

// Stable example: evidence completeness is a deterministic function of declared
// scope and commit-bound evidence, not reviewer preference or PR popularity.
const eligiblePR = Object.freeze({
  eligibleClass: 'C',
  normativeChange: false,
  semanticBoundaryChanged: false,
  layerDeclared: true,
  scopeInventoryPresent: true,
  normativeStatusDeclared: true,
  reproductionOrReasonForNATest: true,
  residualImpactDeclared: true,
  commitShaBound: true,
  checksPass: true,
  commitSha: 'abc123',
  evidenceCommitSha: 'abc123',
})

assert.equal(classify(eligiblePR), 'ELIGIBLE')
assert.equal(classify({ ...eligiblePR, reviewerPreference: 'dislikes this author' }), 'ELIGIBLE',
  'maintainer preference alone does not alter evidence eligibility')
assert.equal(classify({ ...eligiblePR, normativeChange: true }), 'OUT_OF_SCOPE',
  'normative changes are routed to stronger review even when tests pass')
assert.equal(classify({ ...eligiblePR, semanticBoundaryChanged: true }), 'OUT_OF_SCOPE',
  'semantic boundary changes cannot enter the reduced-review path')
assert.equal(classify({ ...eligiblePR, checksPass: false }), 'INCOMPLETE',
  'a failed required check cannot be overridden by popularity or preference')
assert.equal(classify({ ...eligiblePR, evidenceCommitSha: 'older-commit' }), 'INCOMPLETE',
  'evidence bound to an old commit is invalidated after the PR changes')
assert.equal(classify({ ...eligiblePR, residualImpactDeclared: false }), 'INCOMPLETE',
  'missing residual-obligation impact declaration fails closed')
assert.equal(classify({ ...eligiblePR, eligibleClass: 'NORMATIVE' }), 'OUT_OF_SCOPE',
  'unknown or excluded classes cannot claim evidence-gated eligibility')

const noReason = challenge('ELIGIBLE', { category: 'SCOPE_MISMATCH', reason: 'I disagree' })
assert.equal(noReason.accepted, false)
assert.equal(noReason.status, 'ELIGIBLE',
  'a preference without a concrete reason does not create a valid challenge')
const emptyEvidenceChallenge = challenge('ELIGIBLE', {
  category: 'PROVENANCE',
  reason: 'The source provenance cannot be reproduced.',
  evidenceRef: '   ',
})
assert.equal(emptyEvidenceChallenge.accepted, false,
  'a non-security challenge requires a non-empty evidence reference')

const evidencedChallenge = challenge('ELIGIBLE', {
  category: 'FAILING_CHECK',
  reason: 'Required conformance vector fails reproducibly.',
  evidenceRef: 'ci://run/123',
})
assert.equal(evidencedChallenge.accepted, true)
assert.equal(evidencedChallenge.status, 'CHALLENGED',
  'a categorized challenge with a concrete reason and evidence is recorded')

const securityHold = challenge('ELIGIBLE', {
  category: 'SECURITY',
  reason: 'Potential credential exposure requires private triage.',
})
assert.equal(securityHold.accepted, true)
assert.equal(securityHold.status, 'CHALLENGED',
  'security concerns may be triaged without public exploit details')

assert.equal(deadlineTransition('ELIGIBLE', 15, false), 'PROCEDURALLY_OVERDUE',
  'deadline expiry makes unexplained delay visible')
assert.equal(deadlineTransition('ELIGIBLE', 30, true), 'ELIGIBLE',
  'a documented blocker preserves state and must not imply rejection')
assert.equal(deadlineTransition('CHALLENGED', 30, false), 'CHALLENGED',
  'time alone does not erase a valid challenge')
assert.notEqual(deadlineTransition('ELIGIBLE', 15, false), 'MERGED',
  'overdue status never auto-merges a PR')
assert.notEqual(deadlineTransition('ELIGIBLE', 15, false), 'REJECTED',
  'overdue status never auto-rejects a PR')

// GitHub Auto-merge model: this is a policy model only, not a live GitHub gate.
// Auto-merge is eligible only after the process gate, approval, required checks,
// and current-head evidence all agree. GitHub remains responsible for enforcement.
const autoMergeEligible = (pr) =>
  classify(pr) === 'ELIGIBLE' &&
  pr.approved === true &&
  pr.requiredChecksPass === true &&
  pr.approvalCommitSha === pr.commitSha &&
  pr.evidenceCommitSha === pr.commitSha &&
  challengeAllowsAutoMerge(pr)

assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
}), true, 'eligible non-normative PR can request Auto-merge only after approval and checks')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: false,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
}), false, 'evidence eligibility alone cannot trigger merge')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: false,
  approvalCommitSha: 'abc123',
}), false, 'a failing required check blocks the modeled merge path')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'older-commit',
}), false, 'approval for a previous head does not authorize the current head')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  normativeChange: true,
}), false, 'normative changes cannot enter the reduced Auto-merge path')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'OPEN',
}), false, 'an unresolved concrete challenge blocks the modeled merge path')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'ESCALATED',
}), false, 'an overdue challenge stays blocking until it receives a recorded disposition')
assert.equal(challengeDeadlineTransition('OPEN', 13), 'OPEN',
  'challenge remains open inside its response window')
assert.equal(challengeDeadlineTransition('OPEN', 15), 'ESCALATED',
  'an unaddressed challenge escalates publicly after its response window')
assert.equal(challengeDeadlineTransition('SECURITY_HOLD', 15), 'SECURITY_ESCALATED',
  'a security hold escalates without exposing sensitive details or clearing the hold')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'SECURITY_ESCALATED',
}), false, 'a time-expired security hold cannot authorize its own merge')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'RESOLVED_NO_BLOCKER',
  challengeResolutionRef: 'issue://7/disposition/1',
  challengeResolutionReason: 'The concern was checked against the current head and does not apply.',
  challengeResolutionCommitSha: 'abc123',
}), true, 'a resolved challenge permits the normal approval-and-check path when its disposition is recorded for the current head')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'RESOLVED_FIXED',
  challengeResolutionRef: 'issue://7/disposition/2',
  challengeResolutionReason: 'The identified issue was fixed on this exact head.',
  challengeResolutionCommitSha: 'abc123',
}), true, 'a fixed challenge permits merge only when its resolution is bound to the current checked head')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'RESOLVED_NO_BLOCKER',
  challengeResolutionReason: 'The concern was checked against the current head and does not apply.',
  challengeResolutionCommitSha: 'abc123',
}), false, 'a resolution without a traceable record reference fails closed')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'UPHELD',
  challengeResolutionRef: 'issue://7/disposition/3',
  challengeResolutionReason: 'The challenge identified a substantive blocker on this head.',
  challengeResolutionCommitSha: 'abc123',
}), false, 'an upheld blocker prevents the affected head from being auto-merged')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'RESOLVED_NO_BLOCKER',
  challengeResolutionReason: 'The concern was checked against the current head and does not apply.',
  challengeResolutionCommitSha: 'abc123',
}), false, 'a challenge cannot be silently dismissed without a recorded disposition')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  challengeState: 'RESOLVED_NO_BLOCKER',
  challengeResolutionRef: 'issue://7/disposition/1',
  challengeResolutionReason: 'The concern was checked against the previous head.',
  challengeResolutionCommitSha: 'old-head',
}), false, 'challenge disposition bound to an old head must be reassessed')
assert.equal(challengeAllowsAutoMerge({
  ...eligiblePR,
  challengeState: 'RESOLVED_FIXED',
  challengeResolutionRef: 'issue://7/disposition/4',
  challengeResolutionReason: 'Fix was claimed, but the evidence is stale.',
  challengeResolutionCommitSha: 'abc123',
  requiredChecksPass: true,
  evidenceCommitSha: 'different-head',
}), false, 'claiming a fix cannot override stale evidence')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  evidenceCommitSha: 'different-head',
}), false, 'stale evidence cannot authorize a merge')
assert.equal(autoMergeEligible({
  ...eligiblePR,
  approved: true,
  requiredChecksPass: true,
  approvalCommitSha: 'abc123',
  proceduralOverdue: true,
}), true, 'deadline status alone does not decide merge eligibility; approval and checks still govern')

console.log('PASS: contribution acceptance boundary remains evidence-gated in the toy model')
console.log('PASS: modeled Auto-merge requires eligibility, current-head approval, green required checks, and a resolved challenge disposition')
console.log('PASS: overdue challenges escalate visibly but never become auto-merge permits')
console.log('PASS: maintainer discretion is constrained by recorded challenge categories')
console.log('PASS: deadlines expose stalling without creating automatic merge/rejection')
console.log('PASS: normative scope, commit binding, and mandatory checks fail closed')
console.log('ALL CONTRIBUTION-ACCEPTANCE GOVERNABILITY CHECKS PASSED')
