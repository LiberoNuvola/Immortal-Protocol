#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Contributor credential boundary:
 * the credential may attest to a canonical ContributionRecord, while
 * reward allocation and governance authority remain separate capabilities.
 * No reward amount, governance weight, or transferability rule is defined here.
 */

const contributionRecord = Object.freeze({
  contributionId: 'c-001',
  contributorId: 'identity-1',
  evidenceRef: 'ci-review-001',
  accepted: true,
  evidenceContractVersion: 'contribution-evidence-v1',
  ruleVersion: 'credential-v1',
})

const credential = Object.freeze({
  kind: 'ContributorCredential',
  contributionId: contributionRecord.contributionId,
  evidenceRef: contributionRecord.evidenceRef,
  evidenceContractVersion: contributionRecord.evidenceContractVersion,
  ruleVersion: contributionRecord.ruleVersion,
})

const credentialEligible = (record, candidate) => (
  record.accepted === true &&
  candidate.contributionId === record.contributionId &&
  candidate.evidenceRef === record.evidenceRef &&
  candidate.evidenceContractVersion === record.evidenceContractVersion &&
  candidate.ruleVersion === record.ruleVersion
)

assert(
  credentialEligible(contributionRecord, credential),
  'credential eligibility is bound to the accepted ContributionRecord and evidence identity',
)

const rewardBudget = Object.freeze({
  certified: true,
  budgetWithinDeclaredEnvelope: true,
})

const rewardAllocation = (record, budget) => (
  record.accepted && budget.certified && budget.budgetWithinDeclaredEnvelope
    ? 'ELIGIBLE_FOR_DECLARED_REWARD_PATH'
    : 'UNVERIFIABLE'
)

assert(
  rewardAllocation(contributionRecord, rewardBudget) === 'ELIGIBLE_FOR_DECLARED_REWARD_PATH',
  'reward remains on the independent declared reward-allocation path',
)

const credentialWithFakeAuthority = Object.freeze({
  ...credential,
  governanceAuthority: 'derived-from-credential',
  treasuryAuthority: 'derived-from-credential',
})

assert(
  credentialEligible(contributionRecord, credentialWithFakeAuthority),
  'adding undeclared authority fields does not alter credential eligibility',
)
assert(
  !('governanceAuthority' in credential),
  'canonical credential carries no implicit governance authority',
)
assert(
  !('treasuryAuthority' in credential),
  'canonical credential carries no implicit Treasury authority',
)

const correctedRecord = Object.freeze({
  ...contributionRecord,
  accepted: false,
})

assert(
  credentialEligible(correctedRecord, credential) === false,
  'corrected/revoked ContributionRecord removes future credential eligibility',
)

const budgetFromCredential = (candidate) => (
  'rewardBudget' in candidate ? candidate.rewardBudget : null
)

assert(
  budgetFromCredential(credential) === null,
  'credential cannot manufacture a reward budget',
)

console.log('ALL CONTRIBUTOR CREDENTIAL SEPARATION CHECKS PASSED')
