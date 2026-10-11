/**
 * Research-only Moriarty ↔ IMMORTAL Intent boundary.
 *
 * This file deliberately models correspondence status, not compiler semantics.
 * It must not turn a Moriarty feature into an IMMORTAL rule or an economic
 * admission decision.
 */

const MORIARTY_INTENT_SURFACE = Object.freeze([
  'version',
  'signer',
  'domain',
  'asset',
  'validity',
  'grossCap',
  'feeCap',
  'netFloor',
  'observations',
  'disclosures',
  'retainedEffects',
  'retainedDuties',
  'delegation',
  'recovery',
  'operation',
  'canonicalDigest',
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
    notRepresented: Object.freeze(
      MORIARTY_INTENT_SURFACE.filter((key) => !IMMORTAL_ISSUE_INTENT_KEYS.includes(key)),
    ),
    admissionPresent: false,
    equivalentToMoriarty: false,
  })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const result = classifyIssueIntentAgainstMoriarty({
  action: 'Issue',
  classId: 3n,
  price: 5n,
})

assert(result.mapped.includes('action'), 'Issue action must remain mapped')
assert(
  result.profileSpecific.includes('classId') && result.profileSpecific.includes('price'),
  'PRE-RICH coordinates must remain profile-specific',
)
assert(
  result.notRepresented.includes('grossCap') &&
    result.notRepresented.includes('netFloor') &&
    result.notRepresented.includes('operation'),
  'Moriarty richer intent fields must remain explicit mapping residue',
)
assert(result.admissionPresent === false, 'Intent must not manufacture economic admission')
assert(result.equivalentToMoriarty === false, 'Subset mapping must not claim equivalence')

console.log('Moriarty/IMMORTAL Intent semantic boundary: PASS')
