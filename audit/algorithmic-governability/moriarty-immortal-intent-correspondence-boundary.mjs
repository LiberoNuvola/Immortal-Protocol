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

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasOwnDataProperties = (record, fields) => isRecord(record) && fields.every((field) => {
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
})

const hasOwnArrayDataElements = (array) => Array.isArray(array) &&
  Array.from({ length: array.length }, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(array, String(index))
    return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
  }).every(Boolean)

const projectToImmortalIssue = (ownerIntent) => {
  if (!hasOwnDataProperties(ownerIntent, [
    'profile', 'source_hash', 'program_hash', 'semantics', 'action', 'scenario_hash', 'assets', 'authority',
  ])) return 'UNVERIFIABLE'
  if (!hasOwnDataProperties(ownerIntent.authority, ['nonce', 'predecessor'])) return 'UNVERIFIABLE'
  if (!hasOwnArrayDataElements(ownerIntent.assets)) return 'UNVERIFIABLE'
  if (ownerIntent.action !== 'Issue') return 'REJECTED'
  if (!ownerIntent.source_hash || !ownerIntent.program_hash || !ownerIntent.scenario_hash) return 'UNVERIFIABLE'
  if (!isRecord(ownerIntent.authority)) return 'UNVERIFIABLE'
  if (!ownerIntent.authority.nonce || !ownerIntent.authority.predecessor) return 'UNVERIFIABLE'
  if (!Array.isArray(ownerIntent.assets) || ownerIntent.assets.length === 0) return 'UNVERIFIABLE'
  if (!ownerIntent.assets.every((asset) => typeof asset === 'string' && asset.trim().length > 0)) return 'UNVERIFIABLE'

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

for (const malformed of [null, undefined, 'owner-intent', 7, [], Object.assign([], moriartyOwnerIntent)]) {
  assert(projectToImmortalIssue(malformed) === 'UNVERIFIABLE',
    'malformed OwnerIntent container fails closed')
}

for (const malformed of [null, undefined, 'authority', 7, [], Object.assign([], moriartyOwnerIntent.authority)]) {
  const candidate = structuredClone(moriartyOwnerIntent)
  candidate.authority = malformed
  assert(projectToImmortalIssue(candidate) === 'UNVERIFIABLE',
    'malformed authority container fails closed')
}

for (const assets of [['USDM', 7], ['USDM', null], ['  ']]) {
  const candidate = structuredClone(moriartyOwnerIntent)
  candidate.assets = assets
  assert(projectToImmortalIssue(candidate) === 'UNVERIFIABLE',
    'malformed asset identifiers fail closed')
}

let sourceGetterCalled = false
const accessorOwnerIntent = { ...moriartyOwnerIntent }
Object.defineProperty(accessorOwnerIntent, 'source_hash', {
  enumerable: true,
  get() {
    sourceGetterCalled = true
    return moriartyOwnerIntent.source_hash
  },
})
assert(projectToImmortalIssue(accessorOwnerIntent) === 'UNVERIFIABLE',
  'accessor-backed source identity fails closed')
assert(sourceGetterCalled === false,
  'OwnerIntent projection does not execute source accessors')

let authorityGetterCalled = false
const accessorAuthorityIntent = structuredClone(moriartyOwnerIntent)
Object.defineProperty(accessorAuthorityIntent.authority, 'nonce', {
  enumerable: true,
  get() {
    authorityGetterCalled = true
    return moriartyOwnerIntent.authority.nonce
  },
})
assert(projectToImmortalIssue(accessorAuthorityIntent) === 'UNVERIFIABLE',
  'accessor-backed authority identity fails closed')
assert(authorityGetterCalled === false,
  'OwnerIntent projection does not execute authority accessors')

let assetGetterCalled = false
const accessorAssetsIntent = structuredClone(moriartyOwnerIntent)
Object.defineProperty(accessorAssetsIntent.assets, '0', {
  enumerable: true,
  configurable: true,
  get() {
    assetGetterCalled = true
    return 'USDM'
  },
})
assert(projectToImmortalIssue(accessorAssetsIntent) === 'UNVERIFIABLE',
  'accessor-backed asset entries fail closed')
assert(assetGetterCalled === false,
  'OwnerIntent projection does not execute asset accessors')

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
