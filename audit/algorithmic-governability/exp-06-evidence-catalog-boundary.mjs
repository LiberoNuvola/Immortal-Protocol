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

const evaluate = (entry, observed) => {
  if (!entry || !observed) return 'UNVERIFIABLE'
  if (entry.required.some((field) => observed[field] == null || observed[field] === '')) {
    return entry.missingResult
  }
  if (observed.invalidEvidence === true) return entry.invalidResult
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

console.log('ALL EXP-06 EVIDENCE CATALOG CHECKS PASSED')
