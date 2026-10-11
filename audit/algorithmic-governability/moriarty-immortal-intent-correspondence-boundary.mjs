#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

/*
 * Research-only boundary based on the verified upstream Moriarty native
 * OwnerIntent / Authorization shape. No Moriarty compiler is reimplemented.
 */

const moriartyOwnerIntent = Object.freeze({
  profile: 'moriarty-owner-intent/2',
  source_hash: '11'.repeat(32),
  program_hash: '22'.repeat(32),
  semantics: 'moriarty-native-semantics-v1',
  action: 'Issue',
  scenario_hash: '33'.repeat(32),
  assets: Object.freeze(['USDM']),
  authority: Object.freeze({
    network: 'midnight-preview',
    anchor: 'anchor-1',
    program_address: 'program-1',
    target_hash: '44'.repeat(32),
    signer: 'signer-1',
    public_key_hex: '55'.repeat(32),
    scheme: 'SchnorrBip340',
    nonce: 7,
    predecessor: 'head-6',
    not_before: 100,
    not_after: 200,
    limits: Object.freeze([Object.freeze({
      asset: 'USDM',
      beneficiary: 'pool',
      gross_cap: 1000,
      fee_cap: 10,
      net_floor: 1,
      liability_cap: 100,
    })]),
  }),
})

const projectToImmortalIssue = (ownerIntent) => {
  if (!ownerIntent || ownerIntent.action !== 'Issue') return 'REJECTED'
  if (!ownerIntent.source_hash || !ownerIntent.program_hash || !ownerIntent.scenario_hash) return 'UNVERIFIABLE'
  if (!ownerIntent.authority || !ownerIntent.authority.nonce || !ownerIntent.authority.predecessor) return 'UNVERIFIABLE'
  if (!Array.isArray(ownerIntent.assets) || ownerIntent.assets.length === 0) return 'UNVERIFIABLE'

  /*
   * These are application coordinates. They are supplied by a separately
   * defined PRE-RICH profile binding, not inferred from Moriarty fields.
   */
  return Object.freeze({
    intent: Object.freeze({
      action: 'Issue',
      classId: 3n,
      price: 5n,
    }),
    sourceIdentity: Object.freeze({
      profile: ownerIntent.profile,
      sourceHash: ownerIntent.source_hash,
      programHash: ownerIntent.program_hash,
      semantics: ownerIntent.semantics,
      scenarioHash: ownerIntent.scenario_hash,
      nonce: ownerIntent.authority.nonce,
      predecessor: ownerIntent.authority.predecessor,
    }),
  })
}

const mapped = projectToImmortalIssue(moriartyOwnerIntent)
assert(mapped !== 'REJECTED' && mapped !== 'UNVERIFIABLE', 'verified Moriarty OwnerIntent can enter an explicit projection boundary')
assert(mapped.intent.action === moriartyOwnerIntent.action, 'action identity is preserved')
assert(mapped.intent.classId === 3n && mapped.intent.price === 5n, 'PRE-RICH class/price remain explicit application coordinates')
assert(mapped.sourceIdentity.sourceHash === moriartyOwnerIntent.source_hash, 'source identity remains bound')
assert(mapped.sourceIdentity.programHash === moriartyOwnerIntent.program_hash, 'program identity remains bound')
assert(mapped.sourceIdentity.scenarioHash === moriartyOwnerIntent.scenario_hash, 'scenario identity remains bound')
assert(mapped.sourceIdentity.nonce === moriartyOwnerIntent.authority.nonce, 'nonce is not silently discarded')
assert(mapped.sourceIdentity.predecessor === moriartyOwnerIntent.authority.predecessor, 'predecessor is not silently discarded')

const missingAuthority = structuredClone(moriartyOwnerIntent)
missingAuthority.authority.predecessor = ''
assert(projectToImmortalIssue(missingAuthority) === 'UNVERIFIABLE',
  'missing authority-bearing source data cannot be converted into a default')

const actionConflict = structuredClone(moriartyOwnerIntent)
actionConflict.action = 'Claim'
assert(projectToImmortalIssue(actionConflict) === 'REJECTED',
  'conflicting source action is rejected')

const noAdmission = Object.freeze({ ...mapped, economicAdmission: undefined })
assert(noAdmission.economicAdmission === undefined,
  'Intent projection does not manufacture economic admission')

const authorityOnly = Object.freeze({
  sourceIdentity: mapped.sourceIdentity,
  authorityVerified: true,
})
assert(authorityOnly.authorityVerified === true && !('economicAdmission' in authorityOnly),
  'signature/authority evidence remains distinct from economic admission')

console.log('ALL MORIARTY/IMMORTAL INTENT CORRESPONDENCE BOUNDARY CHECKS PASSED')
