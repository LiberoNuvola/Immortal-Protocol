#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * EXP-06 — executable evidence catalog boundary.
 *
 * This catalog mirrors already-frozen evidence contracts in the repository:
 * B5/B6 action evidence, F6 Genesis/Treasury evidence, and RegistryPublish
 * implementation requirements. It does not introduce new economic predicates.
 */
const catalog = Object.freeze({
  Issue: Object.freeze({
    locus: 'B5/B6 action evidence',
    required: [
      'canonicalPreState',
      'actionParameters',
      'candidatePostState',
      'economicAdmission',
      'adapterInput',
      'ledgerState',
      'postState',
      'evidenceProvenance',
    ],
    missingResult: 'UNVERIFIABLE',
    invalidResult: 'REJECTED',
  }),
  Reveal: Object.freeze({
    locus: 'B5/B6 action evidence',
    required: [
      'canonicalPreState',
      'actionParameters',
      'candidatePostState',
      'protectedCapital',
      'EEV',
      'executableLiquidity',
      'gateResult',
      'viabilityResult',
      'adapterInput',
      'ledgerState',
      'postState',
      'evidenceProvenance',
    ],
    missingResult: 'UNVERIFIABLE',
    invalidResult: 'REJECTED',
  }),
  Claim: Object.freeze({
    locus: 'B5/B6 action evidence',
    required: [
      'canonicalPreState',
      'ownershipSignature',
      'expiryEligibility',
      'settlementValueEquivalence',
      'atomicLiabilityLiquidityReduction',
      'ticketNftPreservation',
      'adapterInput',
      'ledgerState',
      'postState',
      'evidenceProvenance',
    ],
    missingResult: 'UNVERIFIABLE',
    invalidResult: 'REJECTED',
  }),
  Expire: Object.freeze({
    locus: 'B5/B6 action evidence',
    required: [
      'canonicalPreState',
      'ticketExpiresAt',
      'expiryEligibility',
      'adapterInput',
      'ledgerState',
      'postState',
      'evidenceProvenance',
    ],
    missingResult: 'UNVERIFIABLE',
    invalidResult: 'REJECTED',
  }),
  FundTreasury: Object.freeze({
    locus: 'F6 Genesis/Treasury evidence',
    required: [
      'treasuryIdentity',
      'treasuryUtxo',
      'assetIdentity',
      'oracleEvidence',
      'freshnessEvidence',
      'valuationEvidence',
      'receiptEvidence',
      'transaction',
      'ledgerResult',
      'accountingDelta',
      'evidenceProvenance',
    ],
    missingResult: 'UNVERIFIABLE',
    invalidResult: 'REJECTED',
  }),
  RegistryPublish: Object.freeze({
    locus: 'src/registryFlow.ts + BeaconRegistry validator',
    required: [
      'pendingRegistryUtxo',
      'canonicalGameRoundCommitment',
      'materiosReceiptCommitment',
      'relayerAuthorization',
      'adapterTransaction',
      'ledgerResult',
      'postState',
      'evidenceProvenance',
    ],
    missingResult: 'UNVERIFIABLE',
    invalidResult: 'REJECTED',
  }),
})

const requiredActions = [
  'Issue',
  'Reveal',
  'Claim',
  'Expire',
  'FundTreasury',
  'RegistryPublish',
]

const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
   Object.getPrototypeOf(value) === null)

const isPresentEvidenceValue = (value) =>
  value != null && !(typeof value === 'string' && value.trim().length === 0)

const INVALID_FIELD = Symbol('invalid-own-data-field')

const readOwnData = (record, key) => {
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
    return INVALID_FIELD
  }
  return descriptor.value
}

const hasOwnDataFields = (record, fields) => isRecord(record) && fields.every((field) => {
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
})

const evaluate = (entry, observed) => {
  if (!isRecord(entry) || !isRecord(observed)) return 'UNVERIFIABLE'
  const required = readOwnData(entry, 'required')
  const missingResult = readOwnData(entry, 'missingResult')
  const invalidResult = readOwnData(entry, 'invalidResult')
  if (!Array.isArray(required) ||
      typeof missingResult !== 'string' ||
      typeof invalidResult !== 'string') return 'UNVERIFIABLE'

  for (const field of required) {
    if (typeof field !== 'string') return 'UNVERIFIABLE'
    const value = readOwnData(observed, field)
    if (value === INVALID_FIELD || !isPresentEvidenceValue(value)) return missingResult
  }

  const invalidEvidence = readOwnData(observed, 'invalidEvidence')
  if (invalidEvidence === true) return invalidResult
  if (invalidEvidence === INVALID_FIELD) {
    // Absence is allowed, but an accessor must not be invoked to infer validity.
    const descriptor = Object.getOwnPropertyDescriptor(observed, 'invalidEvidence')
    if (descriptor) return 'UNVERIFIABLE'
  }
  return 'ADMISSIBLE'
}

assert(
  requiredActions.every((action) => catalog[action]),
  'EXP-06 catalog covers the six already-mapped evidence domains',
)

for (const action of requiredActions) {
  const entry = catalog[action]
  assert(typeof entry.locus === 'string' && entry.locus.length > 0, `${action} has an explicit evidence locus`)
  assert(entry.required.length > 0, `${action} has non-empty required evidence`)
  assert(entry.required.every((field) => typeof field === 'string' && field.length > 0), `${action} evidence fields are typed by stable names`)
  assert(entry.missingResult === 'UNVERIFIABLE', `${action} missing evidence fails closed`)
  assert(entry.invalidResult === 'REJECTED', `${action} invalid evidence is rejected`)
}

// Exhaustively test the catalog contract: every required field must be present,
// and explicit invalidity must reject for every action (not only selected examples).
for (const action of requiredActions) {
  const entry = catalog[action]
  const completeEvidence = Object.fromEntries(
    entry.required.map((field) => [field, `present:${field}`]),
  )

  for (const field of entry.required) {
    const missingField = { ...completeEvidence }
    delete missingField[field]
    assert(
      evaluate(entry, missingField) === 'UNVERIFIABLE',
      `${action}: missing required field ${field} fails closed`,
    )

    const blankField = { ...completeEvidence, [field]: '' }
    assert(
      evaluate(entry, blankField) === 'UNVERIFIABLE',
      `${action}: blank required field ${field} fails closed`,
    )
  }

  assert(
    evaluate(entry, { ...completeEvidence, invalidEvidence: true }) === 'REJECTED',
    `${action}: explicitly invalid evidence is rejected`,
  )
}

assert(evaluate(catalog.Issue, null) === 'UNVERIFIABLE', 'absent action evidence is unverifiable')

for (const malformed of [undefined, true, 7, 'evidence', [], new Date(0)]) {
  assert(
    evaluate(catalog.Issue, malformed) === 'UNVERIFIABLE',
    'non-record observed evidence container fails closed',
  )
}
const forgedEvidenceArray = []
Object.assign(forgedEvidenceArray, Object.fromEntries(
  catalog.Issue.required.map((field) => [field, `present:${field}`]),
))
assert(
  evaluate(catalog.Issue, forgedEvidenceArray) === 'UNVERIFIABLE',
  'array with forged required evidence properties cannot be admissible',
)
assert(
  evaluate(catalog.Issue, { ...Object.fromEntries(catalog.Issue.required.map((field) => [field, `present:${field}`])), canonicalPreState: '   ' }) === 'UNVERIFIABLE',
  'whitespace-only required evidence fails closed',
)
const inheritedEvidence = Object.create(Object.fromEntries(
  catalog.Issue.required.map((field) => [field, `present:${field}`]),
))
assert(
  evaluate(catalog.Issue, inheritedEvidence) === 'UNVERIFIABLE',
  'inherited required evidence cannot satisfy the evidence catalog',
)
let evidenceGetterCalls = 0
const accessorEvidence = Object.fromEntries(
  catalog.Issue.required.filter((field) => field !== 'canonicalPreState').map((field) => [field, `present:${field}`]),
)
Object.defineProperty(accessorEvidence, 'canonicalPreState', {
  get() { evidenceGetterCalls += 1; return 'present:canonicalPreState' },
  enumerable: true,
})
assert(
  evaluate(catalog.Issue, accessorEvidence) === 'UNVERIFIABLE' && evidenceGetterCalls === 0,
  'accessor-backed required evidence is unverifiable without executing its getter',
)
const invalidEvidenceAccessor = Object.fromEntries(
  catalog.Issue.required.map((field) => [field, `present:${field}`]),
)
Object.defineProperty(invalidEvidenceAccessor, 'invalidEvidence', {
  get() { evidenceGetterCalls += 1; return false },
  enumerable: true,
})
assert(
  evaluate(catalog.Issue, invalidEvidenceAccessor) === 'UNVERIFIABLE' && evidenceGetterCalls === 0,
  'accessor-backed validity metadata cannot be used to infer admissibility',
)

const issueEvidence = Object.fromEntries(
  catalog.Issue.required.map((field) => [field, `present:${field}`]),
)
assert(evaluate(catalog.Issue, issueEvidence) === 'ADMISSIBLE', 'complete Issue evidence is admissible to the evidence boundary')

const incompleteReveal = Object.fromEntries(
  catalog.Reveal.required.map((field) => [field, `present:${field}`]),
)
delete incompleteReveal.EEV
assert(
  evaluate(catalog.Reveal, incompleteReveal) === 'UNVERIFIABLE',
  'Reveal without required EEV evidence cannot be authorized by the evidence boundary',
)

const malformedTreasury = Object.fromEntries(
  catalog.FundTreasury.required.map((field) => [field, `present:${field}`]),
)
malformedTreasury.invalidEvidence = true
assert(
  evaluate(catalog.FundTreasury, malformedTreasury) === 'REJECTED',
  'invalid Treasury evidence is rejected rather than converted into a reward or admission fact',
)

const registryEvidence = Object.fromEntries(
  catalog.RegistryPublish.required.map((field) => [field, `present:${field}`]),
)
assert(
  evaluate(catalog.RegistryPublish, registryEvidence) === 'ADMISSIBLE',
  'complete RegistryPublish evidence is admissible to the evidence boundary',
)

const evidenceMetadata = Object.freeze({
  sourceReference: 'source:001',
  observationReference: 'observation:001',
  evidenceDigest: 'dd'.repeat(32),
  evidenceVersion: 'evidence-v1',
  verificationStatus: 'VERIFIED',
})

const verifyEvidenceMetadata = (meta) => {
  if (!isRecord(meta)) return 'UNVERIFIABLE'
  const fields = [
    'verificationStatus',
    'sourceReference',
    'observationReference',
    'evidenceVersion',
    'evidenceDigest',
  ]
  if (!hasOwnDataFields(meta, fields)) return 'UNVERIFIABLE'
  if (meta.verificationStatus !== 'VERIFIED') return 'UNVERIFIABLE'
  if (!meta.sourceReference || !meta.observationReference || !meta.evidenceVersion) return 'UNVERIFIABLE'
  if (!/^[0-9a-fA-F]{64}$/.test(meta.evidenceDigest)) return 'UNVERIFIABLE'
  return 'ADMISSIBLE'
}

assert(
  verifyEvidenceMetadata(evidenceMetadata) === 'ADMISSIBLE',
  'verified evidence metadata is admissible only with explicit provenance and digest identity',
)
assert(
  verifyEvidenceMetadata({ ...evidenceMetadata, evidenceDigest: 'ee'.repeat(32) }) === 'ADMISSIBLE',
  'a distinct evidence digest remains independently identifiable',
)
assert(
  verifyEvidenceMetadata({ ...evidenceMetadata, verificationStatus: 'UNVERIFIED' }) === 'UNVERIFIABLE',
  'unverified evidence cannot be promoted by the catalog',
)
assert(
  verifyEvidenceMetadata({ ...evidenceMetadata, evidenceDigest: 'not-a-digest' }) === 'UNVERIFIABLE',
  'malformed evidence digest fails closed',
)

let metadataGetterCalls = 0
const accessorBackedMetadata = {
  sourceReference: evidenceMetadata.sourceReference,
  observationReference: evidenceMetadata.observationReference,
  evidenceDigest: evidenceMetadata.evidenceDigest,
  evidenceVersion: evidenceMetadata.evidenceVersion,
  get verificationStatus() {
    metadataGetterCalls += 1
    return 'VERIFIED'
  },
}
assert(
  verifyEvidenceMetadata(accessorBackedMetadata) === 'UNVERIFIABLE',
  'accessor-backed evidence metadata fails closed',
)
assert(
  metadataGetterCalls === 0,
  'evidence metadata accessors are rejected without executing getters',
)
const inheritedMetadata = Object.create(evidenceMetadata)
assert(
  verifyEvidenceMetadata(inheritedMetadata) === 'UNVERIFIABLE',
  'inherited evidence metadata cannot establish provenance',
)

console.log('ALL EXP-06 EVIDENCE CATALOG CHECKS PASSED')
