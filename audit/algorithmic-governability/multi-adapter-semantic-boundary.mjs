#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

/*
 * Differential boundary only.
 *
 * This fixture uses the verified Moriarty OwnerIntent/Authorization shape as
 * source-language input, projects it into the existing chain-neutral IMMORTAL
 * IssueIntent coordinates, and then sends the same already-certified semantic
 * result through two chain-specific encodings:
 *   - Cardano
 *   - Midnight/Moriarty
 *
 * It does not reimplement Moriarty semantics, derive economics, authenticate
 * ledger state, or claim production adapter equivalence.
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

const immortalIntent = Object.freeze({
  action: 'Issue',
  classId: 3n,
  price: 5n,
})

const certifiedAdmission = Object.freeze({
  admitted: true,
  actionClass: 'Issue',
  decisionReference: 'admission:issue-001',
  stateHash: '66'.repeat(32),
  actionFingerprint: '77'.repeat(32),
  ruleVersion: 'pre-rich-economic-rule-v1',
})

const semanticResult = Object.freeze({
  action: immortalIntent.action,
  classId: immortalIntent.classId,
  price: immortalIntent.price,
  ruleVersion: certifiedAdmission.ruleVersion,
  admissionDecisionReference: certifiedAdmission.decisionReference,
  stateHash: certifiedAdmission.stateHash,
  actionFingerprint: certifiedAdmission.actionFingerprint,
})

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasOwnDataProperties = (record, fields) => {
  if (!isRecord(record)) return false
  return fields.every((field) => {
    const descriptor = Object.getOwnPropertyDescriptor(record, field)
    return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
  })
}

const hasOwnArrayDataElements = (array) => Array.isArray(array) &&
  Array.from({ length: array.length }, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(array, String(index))
    return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
  }).every(Boolean)

const projectMoriartyToImmortal = (ownerIntent, intent) => {
  if (!hasOwnDataProperties(ownerIntent, [
    'profile', 'source_hash', 'program_hash', 'semantics', 'action', 'scenario_hash', 'assets', 'authority',
  ])) return null
  if (!hasOwnDataProperties(intent, ['action', 'classId', 'price'])) return null
  if (!hasOwnDataProperties(ownerIntent.authority, ['nonce', 'predecessor'])) return null
  if (!hasOwnArrayDataElements(ownerIntent.assets)) return null
  if (ownerIntent.action !== intent.action) return null
  if (!ownerIntent.source_hash || !ownerIntent.program_hash || !ownerIntent.scenario_hash) return null
  if (!isRecord(ownerIntent.authority) || !ownerIntent.authority.nonce || !ownerIntent.authority.predecessor) return null
  if (!Array.isArray(ownerIntent.assets) || ownerIntent.assets.length === 0) return null
  if (!ownerIntent.assets.every((asset) => typeof asset === 'string' && asset.trim().length > 0)) return null
  return Object.freeze({
    intent,
    sourceBinding: Object.freeze({
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

const projected = projectMoriartyToImmortal(moriartyOwnerIntent, immortalIntent)
assert(projectMoriartyToImmortal(null, immortalIntent) === null,
  'missing Moriarty OwnerIntent is rejected at the projection boundary')
assert(projectMoriartyToImmortal(Object.assign([], moriartyOwnerIntent), immortalIntent) === null,
  'array with forged OwnerIntent properties is rejected')
assert(projectMoriartyToImmortal(moriartyOwnerIntent, null) === null,
  'missing IMMORTAL Intent is rejected at the projection boundary')
for (const candidate of [
  { ...moriartyOwnerIntent, authority: null },
  { ...moriartyOwnerIntent, authority: [] },
  { ...moriartyOwnerIntent, assets: ['USDM', 7] },
  { ...moriartyOwnerIntent, assets: ['  '] },
]) {
  assert(projectMoriartyToImmortal(candidate, immortalIntent) === null,
    'malformed authority or asset container is rejected')
}
assert(projected !== null, 'Moriarty OwnerIntent can be explicitly projected into IMMORTAL IssueIntent')
assert(projected.intent.action === semanticResult.action, 'projection preserves the action')
assert(projected.intent.classId === semanticResult.classId, 'projection preserves PRE-RICH class coordinate')
assert(projected.intent.price === semanticResult.price, 'projection preserves PRE-RICH price coordinate')
assert(projected.sourceBinding.sourceHash === moriartyOwnerIntent.source_hash, 'projection preserves Moriarty source identity')
assert(projected.sourceBinding.nonce === moriartyOwnerIntent.authority.nonce, 'projection preserves Moriarty nonce')
assert(projected.sourceBinding.predecessor === moriartyOwnerIntent.authority.predecessor, 'projection preserves Moriarty predecessor')

const cardanoAdapter = (result) => Object.freeze({
  chain: 'cardano',
  payload: Object.freeze({
    action: result.action,
    classId: result.classId,
    price: result.price,
  }),
  ruleVersion: result.ruleVersion,
  admissionDecisionReference: result.admissionDecisionReference,
  stateHash: result.stateHash,
  actionFingerprint: result.actionFingerprint,
})

const midnightMoriartyAdapter = (result, sourceBinding) => Object.freeze({
  chain: 'midnight-moriarty',
  payload: Object.freeze({
    action: result.action,
    classId: result.classId,
    price: result.price,
  }),
  ruleVersion: result.ruleVersion,
  admissionDecisionReference: result.admissionDecisionReference,
  stateHash: result.stateHash,
  actionFingerprint: result.actionFingerprint,
  sourceBinding,
})

const cardano = cardanoAdapter(semanticResult)
const midnight = midnightMoriartyAdapter(semanticResult, projected.sourceBinding)

const normalize = (adapter) => Object.freeze({
  action: adapter.payload.action,
  classId: adapter.payload.classId,
  price: adapter.payload.price,
  ruleVersion: adapter.ruleVersion,
  admissionDecisionReference: adapter.admissionDecisionReference,
  stateHash: adapter.stateHash,
  actionFingerprint: adapter.actionFingerprint,
})

const cardanoSemantic = normalize(cardano)
const midnightSemantic = normalize(midnight)

assert(JSON.stringify(cardanoSemantic, (_, value) =>
  typeof value === 'bigint' ? value.toString() : value
) === JSON.stringify(midnightSemantic, (_, value) =>
  typeof value === 'bigint' ? value.toString() : value
), 'Cardano and Midnight preserve the same certified semantic result')
assert(cardano.chain !== midnight.chain, 'adapter encodings remain chain-specific')
assert(cardano.stateHash === certifiedAdmission.stateHash,
  'Cardano semantic evidence retains the certified source-state hash')
assert(midnight.stateHash === certifiedAdmission.stateHash,
  'Midnight semantic evidence retains the certified source-state hash')
assert(cardano.actionFingerprint === certifiedAdmission.actionFingerprint,
  'Cardano semantic evidence retains the certified action fingerprint')
assert(midnight.actionFingerprint === certifiedAdmission.actionFingerprint,
  'Midnight semantic evidence retains the certified action fingerprint')
assert(midnight.sourceBinding.sourceHash === moriartyOwnerIntent.source_hash,
  'Midnight encoding retains the distinct Moriarty source binding')
assert(!('sourceBinding' in cardano),
  'Cardano adapter need not inherit Midnight source metadata')
assert(certifiedAdmission.admitted === true,
  'differential comparison starts from an already-admitted result')

const tamperedPrice = Object.freeze({
  ...midnight,
  payload: Object.freeze({ ...midnight.payload, price: 6n }),
})
assert(
  JSON.stringify(normalize(tamperedPrice), (_, value) => typeof value === 'bigint' ? value.toString() : value) !==
    JSON.stringify(cardanoSemantic, (_, value) => typeof value === 'bigint' ? value.toString() : value),
  'Midnight semantic mutation is detected')

const tamperedStateHash = Object.freeze({
  ...midnight,
  stateHash: '99'.repeat(32),
})
assert(
  JSON.stringify(normalize(tamperedStateHash), (_, value) => typeof value === 'bigint' ? value.toString() : value) !==
    JSON.stringify(cardanoSemantic, (_, value) => typeof value === 'bigint' ? value.toString() : value),
  'state-hash mutation remains visible in cross-adapter comparison')

const tamperedActionFingerprint = Object.freeze({
  ...midnight,
  actionFingerprint: 'aa'.repeat(32),
})
assert(
  JSON.stringify(normalize(tamperedActionFingerprint), (_, value) => typeof value === 'bigint' ? value.toString() : value) !==
    JSON.stringify(cardanoSemantic, (_, value) => typeof value === 'bigint' ? value.toString() : value),
  'action-fingerprint mutation remains visible in cross-adapter comparison')
  
const tamperedAction = Object.freeze({
  ...cardano,
  payload: Object.freeze({ ...cardano.payload, action: 'Claim' }),
})
assert(
  JSON.stringify(normalize(tamperedAction), (_, value) => typeof value === 'bigint' ? value.toString() : value) !==
    JSON.stringify(midnightSemantic, (_, value) => typeof value === 'bigint' ? value.toString() : value),
  'Cardano action mutation is detected')

const missingRule = Object.freeze({
  ...midnight,
  ruleVersion: '',
})
assert(
  JSON.stringify(normalize(missingRule), (_, value) => typeof value === 'bigint' ? value.toString() : value) !==
    JSON.stringify(cardanoSemantic, (_, value) => typeof value === 'bigint' ? value.toString() : value),
  'missing universal rule identity cannot pass differential equivalence')

const alteredSource = Object.freeze({
  ...midnight.sourceBinding,
  sourceHash: '88'.repeat(32),
})
const alteredMidnight = Object.freeze({
  ...midnight,
  sourceBinding: alteredSource,
})

const sourceBindingMatches = (actual, expected) => {
  const fields = [
    ['profile', 'profile'],
    ['sourceHash', 'source_hash'],
    ['programHash', 'program_hash'],
    ['semantics', 'semantics'],
    ['scenarioHash', 'scenario_hash'],
    ['nonce', null],
    ['predecessor', null],
  ]
  if (!hasOwnDataProperties(actual, fields.map(([actualField]) => actualField))) return false
  if (!hasOwnDataProperties(expected, ['profile', 'source_hash', 'program_hash', 'semantics', 'scenario_hash', 'authority'])) return false
  if (!hasOwnDataProperties(expected.authority, ['nonce', 'predecessor'])) return false
  return fields.every(([actualField, expectedField]) => {
    const expectedValue = expectedField === null
      ? expected.authority?.[actualField]
      : expected[expectedField]
    const actualValue = actual[actualField]
    if (typeof expectedValue === 'string') {
      return typeof actualValue === 'string' &&
        actualValue.trim() !== '' &&
        actualValue === expectedValue
    }
    return actualValue === expectedValue
  })
}

assert(sourceBindingMatches(midnight.sourceBinding, moriartyOwnerIntent),
  'Midnight source binding matches the originating Moriarty identity and predecessor')
assert(!sourceBindingMatches(alteredMidnight.sourceBinding, moriartyOwnerIntent),
  'mutated Moriarty source identity fails source-binding equivalence')
assert(!sourceBindingMatches({ ...midnight.sourceBinding, predecessor: '' }, moriartyOwnerIntent),
  'missing source predecessor fails source-binding equivalence')
assert(!sourceBindingMatches(null, moriartyOwnerIntent),
  'missing source binding fails source-binding equivalence')


let ownerActionGetterCalled = false
const accessorOwnerIntent = { ...moriartyOwnerIntent }
Object.defineProperty(accessorOwnerIntent, 'action', {
  enumerable: true,
  get() {
    ownerActionGetterCalled = true
    return 'Issue'
  },
})
assert(projectMoriartyToImmortal(accessorOwnerIntent, immortalIntent) === null,
  'accessor-backed Moriarty source fields are rejected before projection')
assert(ownerActionGetterCalled === false,
  'projection does not execute an accessor while validating source identity')

let intentPriceGetterCalled = false
const accessorIntent = { ...immortalIntent }
Object.defineProperty(accessorIntent, 'price', {
  enumerable: true,
  get() {
    intentPriceGetterCalled = true
    return 5n
  },
})
assert(projectMoriartyToImmortal(moriartyOwnerIntent, accessorIntent) === null,
  'accessor-backed IMMORTAL intent fields are rejected before projection')
assert(intentPriceGetterCalled === false,
  'projection does not execute an accessor while validating the IMMORTAL intent')

const accessorAuthority = { ...moriartyOwnerIntent.authority }
Object.defineProperty(accessorAuthority, 'nonce', {
  enumerable: true,
  get() { return 7 },
})
assert(projectMoriartyToImmortal(
  { ...moriartyOwnerIntent, authority: accessorAuthority },
  immortalIntent,
) === null, 'accessor-backed authority nonce is rejected before projection')

const accessorAssets = ['USDM']
Object.defineProperty(accessorAssets, '0', {
  enumerable: true,
  configurable: true,
  get() { return 'USDM' },
})
assert(projectMoriartyToImmortal(
  { ...moriartyOwnerIntent, assets: accessorAssets },
  immortalIntent,
) === null, 'accessor-backed asset array elements are rejected before projection')

let sourceBindingGetterCalled = false
const accessorSourceBinding = { ...midnight.sourceBinding }
Object.defineProperty(accessorSourceBinding, 'sourceHash', {
  enumerable: true,
  get() {
    sourceBindingGetterCalled = true
    return moriartyOwnerIntent.source_hash
  },
})
assert(!sourceBindingMatches(accessorSourceBinding, moriartyOwnerIntent),
  'accessor-backed source binding is rejected')
assert(sourceBindingGetterCalled === false,
  'source-binding comparison does not execute accessors')

console.log('ALL MORIARTY-AWARE MULTI-ADAPTER DIFFERENTIAL CHECKS PASSED')
