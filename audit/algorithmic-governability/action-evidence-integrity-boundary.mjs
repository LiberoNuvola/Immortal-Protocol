#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const DIGEST32 = /^[0-9a-fA-F]{64}$/

const packet = Object.freeze({
  action: 'Issue',
  canonicalPreState: Object.freeze({ fingerprint: '11'.repeat(32) }),
  actionParameters: Object.freeze({ fingerprint: '22'.repeat(32) }),
  candidatePostState: Object.freeze({ fingerprint: '33'.repeat(32) }),
  adapterInput: Object.freeze({ fingerprint: '44'.repeat(32) }),
  ledgerState: Object.freeze({ transactionHash: '55'.repeat(32) }),
  postState: Object.freeze({ fingerprint: '66'.repeat(32) }),
  evidenceProvenance: Object.freeze({
    sourceCommit: '77'.repeat(32),
    observationRef: 'obs:issue-001',
  }),
})

const isDigest = (value) => typeof value === 'string' && DIGEST32.test(value)

const validatePacket = (p) => {
  if (!p || !['Issue','Reveal','Claim','Expire'].includes(p.action)) return false
  if (!isDigest(p.canonicalPreState?.fingerprint)) return false
  if (!isDigest(p.actionParameters?.fingerprint)) return false
  if (!isDigest(p.candidatePostState?.fingerprint)) return false
  if (!isDigest(p.adapterInput?.fingerprint)) return false
  if (!isDigest(p.ledgerState?.transactionHash)) return false
  if (!isDigest(p.postState?.fingerprint)) return false
  if (!isDigest(p.evidenceProvenance?.sourceCommit)) return false
  if (typeof p.evidenceProvenance?.observationRef !== 'string' || p.evidenceProvenance.observationRef.trim().length === 0) return false
  return true
}

assert(validatePacket(packet), 'action evidence packet contains bound state/input/ledger/provenance identities')
assert(
  packet.canonicalPreState.fingerprint !== packet.candidatePostState.fingerprint,
  'pre-state and candidate-post-state remain distinct evidence identities',
)
assert(
  packet.adapterInput.fingerprint !== packet.ledgerState.transactionHash,
  'adapter input identity and ledger transaction identity remain distinct',
)

const cases = [
  ['malformed pre-state digest', { canonicalPreState: { fingerprint: 'bad' } }],
  ['missing action-parameter binding', { actionParameters: undefined }],
  ['missing candidate-post-state binding', { candidatePostState: undefined }],
  ['missing adapter-input binding', { adapterInput: undefined }],
  ['missing ledger transaction identity', { ledgerState: { transactionHash: undefined } }],
  ['malformed ledger transaction digest', { ledgerState: { transactionHash: 'xyz' } }],
  ['missing provenance source commit', { evidenceProvenance: { observationRef: 'obs:issue-001' } }],
  ['malformed provenance source commit digest', { evidenceProvenance: { sourceCommit: 'not-a-digest', observationRef: 'obs:issue-001' } }],
  ['malformed post-state digest', { postState: { fingerprint: 'bad' } }],
  ['missing provenance observation', { evidenceProvenance: { sourceCommit: '77'.repeat(32) } }],
  ['blank provenance observation', { evidenceProvenance: { sourceCommit: '77'.repeat(32), observationRef: '   ' } }],
  ['non-string provenance observation', { evidenceProvenance: { sourceCommit: '77'.repeat(32), observationRef: 17 } }],
  ['unknown action', { action: 'Unknown' }],
]

for (const [label, mutation] of cases) {
  const altered = { ...packet, ...mutation }
  assert(!validatePacket(altered), label + ' cannot cross evidence boundary')
}

const actionTamper = { ...packet, actionParameters: { fingerprint: packet.candidatePostState.fingerprint } }
assert(
  actionTamper.actionParameters.fingerprint === actionTamper.candidatePostState.fingerprint &&
    actionTamper.actionParameters.fingerprint !== packet.actionParameters.fingerprint,
  'action-parameter mutation remains observable rather than silently absorbed',
)

console.log('ALL ACTION EVIDENCE INTEGRITY BOUNDARY CHECKS PASSED')
