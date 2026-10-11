#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

/*
 * Research-only boundary grounded in CharlesHoskinson/Moriarty
 * moriarty-owner-intent/2 as observed at commit
 * 3748fe8278287a3729c17c5ddc245f669e21e847.
 *
 * No Moriarty compiler semantics are reimplemented here.
 */

const MORIARTY_OWNER_INTENT_FIELDS = Object.freeze([
  'profile',
  'source_hash',
  'program_hash',
  'semantics',
  'action',
  'scenario_hash',
  'assets',
  'authority',
])

const MORIARTY_AUTHORIZATION_FIELDS = Object.freeze([
  'network',
  'anchor',
  'program_address',
  'target_hash',
  'signer',
  'public_key_hex',
  'scheme',
  'nonce',
  'predecessor',
  'not_before',
  'not_after',
  'limits',
])

const IMMORTAL_ISSUE_INTENT_KEYS = Object.freeze([
  'action',
  'classId',
  'price',
])

const classify = (intent) => {
  if (intent?.action !== 'Issue') throw new Error('IMMORTAL IssueIntent action mismatch')
  if (typeof intent?.classId !== 'bigint' || typeof intent?.price !== 'bigint') {
    throw new Error('IMMORTAL IssueIntent numeric coordinates must remain bigint')
  }

  return Object.freeze({
    mapped: Object.freeze(['action']),
    profileSpecific: Object.freeze(['classId', 'price']),
    sourceIdentity: Object.freeze(MORIARTY_OWNER_INTENT_FIELDS.filter((x) => x !== 'action')),
    authorizationIdentity: Object.freeze(MORIARTY_AUTHORIZATION_FIELDS),
    admissionPresent: false,
    schemaEquivalent: false,
  })
}

const result = classify({
  action: 'Issue',
  classId: 3n,
  price: 5n,
})

assert(result.mapped.includes('action'), 'Issue action remains the semantic action anchor')
assert(
  result.profileSpecific.includes('classId') && result.profileSpecific.includes('price'),
  'PRE-RICH coordinates remain profile-specific',
)
assert(
  result.sourceIdentity.includes('source_hash') &&
    result.sourceIdentity.includes('program_hash') &&
    result.sourceIdentity.includes('scenario_hash') &&
    result.sourceIdentity.includes('assets'),
  'Moriarty source/program/scenario/asset identity remains explicit mapping residue',
)
assert(
  result.authorizationIdentity.includes('nonce') &&
    result.authorizationIdentity.includes('predecessor') &&
    result.authorizationIdentity.includes('limits') &&
    result.authorizationIdentity.includes('target_hash'),
  'Moriarty authorization constraints remain explicit mapping residue',
)
assert(result.admissionPresent === false, 'Intent must not manufacture economic admission')
assert(result.schemaEquivalent === false, 'Current IMMORTAL IssueIntent must not claim schema equivalence with Moriarty')

console.log('ALL MORIARTY/IMMORTAL INTENT SEMANTIC BOUNDARY CHECKS PASSED')
