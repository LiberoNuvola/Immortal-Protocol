#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Research/conformance boundary only.
 *
 * Transferability is intentionally undecided. The test accepts either
 * an authorized transfer or a rejected transfer, while requiring that
 * ownership state cannot rewrite the canonical contribution, evidence,
 * reward budget, or governance/Treasury authority.
 */

const record = Object.freeze({
  contributionId: 'c-001',
  contributorId: 'contributor-1',
  evidenceRef: 'evidence-001',
  accepted: true,
  verified: true,
  ruleVersion: 'credential-v1',
})

const issued = Object.freeze({
  credentialId: 'cred-001',
  contributionId: record.contributionId,
  issuanceReference: 'issue-001',
  holderId: record.contributorId,
})

const authorizedTransfer = Object.freeze({
  ...issued,
  holderId: 'holder-2',
  transferReference: 'transfer-001',
})

const rejectedTransfer = Object.freeze({
  ...issued,
  transferStatus: 'REJECTED_BY_FUTURE_RULE',
  transferReference: 'transfer-001',
})

const semanticView = (credential) => Object.freeze({
  contributionId: credential.contributionId,
})

assert(
  semanticView(authorizedTransfer).contributionId === record.contributionId,
  'an authorized ownership change does not change the canonical contribution identity',
)
assert(
  semanticView(rejectedTransfer).contributionId === record.contributionId,
  'a rejected transfer leaves the canonical contribution identity unchanged',
)

const rewardEligibility = (r, credential) => {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false
  if (!credential || typeof credential !== 'object' || Array.isArray(credential)) return false
  return r.accepted === true &&
    r.verified === true &&
    credential.contributionId === r.contributionId
}

assert(
  rewardEligibility(record, authorizedTransfer) === true,
  'reward eligibility remains derived from the ContributionRecord, not transfer state',
)
assert(
  rewardEligibility(record, rejectedTransfer) === true,
  'transfer rejection does not rewrite contribution semantics',
)

for (const malformedRecord of [null, undefined, 'record', 4, []]) {
  assert(rewardEligibility(malformedRecord, issued) === false, `malformed record (${String(malformedRecord)}) fails closed`)
}
for (const malformedCredential of [null, undefined, 'credential', 4, []]) {
  assert(rewardEligibility(record, malformedCredential) === false, `malformed credential (${String(malformedCredential)}) fails closed`)
}

const authorityFree = (credential) => ({
  governanceAuthority: credential.governanceAuthority ?? null,
  treasuryAuthority: credential.treasuryAuthority ?? null,
  rewardBudget: credential.rewardBudget ?? null,
})

assert(
  authorityFree(authorizedTransfer).governanceAuthority === null,
  'ownership state does not manufacture governance authority',
)
assert(
  authorityFree(authorizedTransfer).treasuryAuthority === null,
  'ownership state does not manufacture Treasury authority',
)
assert(
  authorityFree(authorizedTransfer).rewardBudget === null,
  'ownership state does not manufacture a reward budget',
)

console.log('ALL CONTRIBUTOR CREDENTIAL TRANSFERABILITY INDEPENDENCE CHECKS PASSED')
