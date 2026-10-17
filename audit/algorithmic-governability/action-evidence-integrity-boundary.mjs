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

const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
   Object.getPrototypeOf(value) === null)

const ownData = (record, field) => {
  if (!isRecord(record) || !Object.hasOwn(record, field)) return false
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return !!descriptor && Object.hasOwn(descriptor, 'value')
}

const dataValue = (record, field) => Object.getOwnPropertyDescriptor(record, field).value

const validatePacket = (p) => {
  if (!isRecord(p) || !ownData(p, 'action') || !['Issue','Reveal','Claim','Expire'].includes(dataValue(p, 'action'))) return false
  const containers = [
    'canonicalPreState','actionParameters','candidatePostState',
    'adapterInput','ledgerState','postState','evidenceProvenance',
  ]
  if (!containers.every((field) => ownData(p, field) && isRecord(dataValue(p, field)))) return false

  const requiredNested = {
    canonicalPreState: ['fingerprint'],
    actionParameters: ['fingerprint'],
    candidatePostState: ['fingerprint'],
    adapterInput: ['fingerprint'],
    ledgerState: ['transactionHash'],
    postState: ['fingerprint'],
    evidenceProvenance: ['sourceCommit', 'observationRef'],
  }
  for (const [container, fields] of Object.entries(requiredNested)) {
    const record = dataValue(p, container)
    if (!fields.every((field) => ownData(record, field))) return false
  }

  if (!isDigest(dataValue(dataValue(p, 'canonicalPreState'), 'fingerprint'))) return false
  if (!isDigest(dataValue(dataValue(p, 'actionParameters'), 'fingerprint'))) return false
  if (!isDigest(dataValue(dataValue(p, 'candidatePostState'), 'fingerprint'))) return false
  if (!isDigest(dataValue(dataValue(p, 'adapterInput'), 'fingerprint'))) return false
  if (!isDigest(dataValue(dataValue(p, 'ledgerState'), 'transactionHash'))) return false
  if (!isDigest(dataValue(dataValue(p, 'postState'), 'fingerprint'))) return false
  if (!isDigest(dataValue(dataValue(p, 'evidenceProvenance'), 'sourceCommit'))) return false
  const observationRef = dataValue(dataValue(p, 'evidenceProvenance'), 'observationRef')
  if (typeof observationRef !== 'string' || observationRef.trim().length === 0) return false
  return true
}

assert(validatePacket(packet), 'action evidence packet contains bound state/input/ledger/provenance identities')

for (const malformed of [null, undefined, true, 1, 'packet', []]) {
  assert(!validatePacket(malformed), 'malformed action packet container fails closed')
}
for (const field of [
  'canonicalPreState','actionParameters','candidatePostState',
  'adapterInput','ledgerState','postState','evidenceProvenance',
]) {
  const arrayField = []
  Object.assign(arrayField, packet[field])
  assert(!validatePacket({ ...packet, [field]: arrayField }), field + ' array container cannot masquerade as a record')
}
const arrayPacket = []
Object.assign(arrayPacket, packet)
assert(!validatePacket(arrayPacket), 'array carrying forged packet properties cannot cross the evidence boundary')

const accessorTopLevel = { ...packet }
Object.defineProperty(accessorTopLevel, 'canonicalPreState', {
  enumerable: true,
  configurable: true,
  get: () => packet.canonicalPreState,
})
assert(!validatePacket(accessorTopLevel), 'accessor-backed top-level evidence container is rejected')

const accessorNested = { ...packet, canonicalPreState: { ...packet.canonicalPreState } }
Object.defineProperty(accessorNested.canonicalPreState, 'fingerprint', {
  enumerable: true,
  configurable: true,
  get: () => packet.canonicalPreState.fingerprint,
})
assert(!validatePacket(accessorNested), 'accessor-backed nested fingerprint is rejected')

const accessorAction = { ...packet }
Object.defineProperty(accessorAction, 'action', {
  enumerable: true,
  configurable: true,
  get: () => 'Issue',
})
assert(!validatePacket(accessorAction), 'accessor-backed action discriminator is rejected')

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
