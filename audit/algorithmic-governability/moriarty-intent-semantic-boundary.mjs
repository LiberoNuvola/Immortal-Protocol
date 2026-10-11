/**
 * Research-only Moriarty ↔ IMMORTAL Intent boundary.
 *
 * This file deliberately models correspondence status, not compiler semantics.
 * It must not turn a Moriarty feature into an IMMORTAL rule or an economic
 * admission decision.
 */

const MORIARTY_NESTED_INTENT_FIELDS = Object.freeze([
  'version',
  'advertisedSourceHash',
  'advertisedPolicyDigest',
  'signer',
  'nonce',
  'preHead',
  'notBefore',
  'notAfter',
  'grossCap',
  'feeCap',
  'netFloor',
  'failure',
  'observations',
  'disclosures',
  'retainedEffects',
  'retainedDuties',
  'delegation',
  'recovery',
  'operation',
])

const MORIARTY_AUTHENTICATION_SURFACE = Object.freeze([
  'profile',
  'core',
  'sourceProfile',
  'authoringProfile',
  'agreementId',
  'actionName',
  'selectedActionId',
  'sourceSha256',
  'ownerProgramSha256',
  'domain',
  'asset',
  'signature',
])

const IMMORTAL_ISSUE_INTENT_KEYS = Object.freeze([
  'action',
  'classId',
  'price',
])

function classifyIssueIntentAgainstMoriarty(intent) {
  if (intent?.action !== 'Issue') {
    throw new Error('IMMORTAL IssueIntent action mismatch')
  }
  if (typeof intent?.classId !== 'bigint' || typeof intent?.price !== 'bigint') {
    throw new Error('IMMORTAL IssueIntent numeric coordinates must remain bigint')
  }

  return Object.freeze({
    mapped: Object.freeze(['action']),
    profileSpecific: Object.freeze(['classId', 'price']),
    notRepresented: Object.freeze(MORIARTY_NESTED_INTENT_FIELDS),
    authenticationSurfaceNotRepresented: Object.freeze(MORIARTY_AUTHENTICATION_SURFACE),
    admissionPresent: false,
    equivalentToMoriarty: false,
  })
}

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

const result = classifyIssueIntentAgainstMoriarty({
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
  result.notRepresented.includes('grossCap') &&
    result.notRepresented.includes('netFloor') &&
    result.notRepresented.includes('nonce') &&
    result.notRepresented.includes('operation'),
  'Exact Moriarty nested intent fields remain explicit mapping residue',
)
assert(
  result.authenticationSurfaceNotRepresented.includes('signature') &&
    result.authenticationSurfaceNotRepresented.includes('sourceSha256') &&
    result.authenticationSurfaceNotRepresented.includes('ownerProgramSha256'),
  'Exact Moriarty authentication surface remains outside the current IMMORTAL IssueIntent',
)
assert(result.admissionPresent === false, 'Intent must not manufacture economic admission')
assert(result.equivalentToMoriarty === false, 'Subset mapping must not claim schema equivalence')

console.log('Moriarty/IMMORTAL Intent semantic boundary: PASS')
