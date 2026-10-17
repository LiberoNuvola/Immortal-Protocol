/**
 * Research-only MRY-2/MRY-3 boundary.
 *
 * It proves only that the distinct identity objects are explicit and bound:
 * IMMORTAL intent fingerprint, Moriarty intent/program identity, and economic
 * admission reference. It deliberately does not implement Moriarty canonical
 * encoding or assert hash equivalence.
 */

const HEX32 = /^[0-9a-fA-F]{64}$/

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasOwnDataProperties = (record, fields) => isRecord(record) && fields.every((field) => {
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
})

function bindIntentIdentities(input) {
  const requiredFields = [
    'immortalIntentFingerprint', 'moriartyProgramFingerprint', 'actionFingerprint',
    'admissionDecisionReference', 'action',
  ]
  if (!isRecord(input)) throw new Error('Intent identity binding input must be a record')
  if (!hasOwnDataProperties(input, requiredFields)) {
    throw new Error('Intent identity binding input must contain own data properties')
  }
  const { immortalIntentFingerprint, moriartyProgramFingerprint, actionFingerprint, admissionDecisionReference, action } = input
  if (!HEX32.test(immortalIntentFingerprint)) {
    throw new Error('IMMORTAL intent fingerprint must be a 32-byte digest')
  }
  if (!HEX32.test(moriartyProgramFingerprint)) {
    throw new Error('Moriarty program identity must be a 32-byte digest')
  }
  if (!HEX32.test(actionFingerprint)) {
    throw new Error('Admission action fingerprint must be a 32-byte digest')
  }
  if (!admissionDecisionReference?.trim()) {
    throw new Error('Admission decision reference is required')
  }
  if (action !== 'Issue') {
    throw new Error('MRY binding test is scoped to Issue')
  }

  return Object.freeze({
    action,
    immortalIntentFingerprint,
    moriartyProgramFingerprint,
    actionFingerprint,
    admissionDecisionReference,
  })
}

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

const bound = bindIntentIdentities({
  immortalIntentFingerprint: '11'.repeat(32),
  moriartyProgramFingerprint: '22'.repeat(32),
  actionFingerprint: '33'.repeat(32),
  admissionDecisionReference: 'admission:example',
  action: 'Issue',
})

assert(bound.immortalIntentFingerprint !== bound.moriartyProgramFingerprint,
  'IMMORTAL and Moriarty identities remain distinct')
assert(bound.actionFingerprint !== bound.moriartyProgramFingerprint,
  'Admission action identity is not silently aliased to Moriarty program identity')
assert(bound.action === 'Issue', 'Action remains explicitly bound')
assert(bound.admissionDecisionReference === 'admission:example',
  'Admission reference remains explicitly bound')

let rejected = false
try {
  bindIntentIdentities({
    immortalIntentFingerprint: '11'.repeat(32),
    moriartyProgramFingerprint: '22'.repeat(32),
    actionFingerprint: 'not-a-digest',
    admissionDecisionReference: 'admission:example',
    action: 'Issue',
  })
} catch {
  rejected = true
}
assert(rejected, 'Malformed admission identity cannot cross the binding boundary')

rejected = false
try {
  bindIntentIdentities({
    immortalIntentFingerprint: '11'.repeat(32),
    moriartyProgramFingerprint: '22'.repeat(32),
    actionFingerprint: '33'.repeat(32),
    admissionDecisionReference: '',
    action: 'Issue',
  })
} catch {
  rejected = true
}
assert(rejected, 'Missing admission reference cannot cross the binding boundary')

for (const malformed of [null, undefined, 'input', 7, [], Object.assign([], {
  immortalIntentFingerprint: '11'.repeat(32),
  moriartyProgramFingerprint: '22'.repeat(32),
  actionFingerprint: '33'.repeat(32),
  admissionDecisionReference: 'admission:example',
  action: 'Issue',
})]) {
  rejected = false
  try {
    bindIntentIdentities(malformed)
  } catch (error) {
    rejected = error instanceof Error && error.message === 'Intent identity binding input must be a record'
  }
  assert(rejected, 'Malformed identity binding container is rejected explicitly')
}

let identityGetterCalled = false
const accessorIdentity = {
  immortalIntentFingerprint: '11'.repeat(32),
  moriartyProgramFingerprint: '22'.repeat(32),
  actionFingerprint: '33'.repeat(32),
  admissionDecisionReference: 'admission:example',
  action: 'Issue',
}
Object.defineProperty(accessorIdentity, 'actionFingerprint', {
  enumerable: true,
  get() {
    identityGetterCalled = true
    return '33'.repeat(32)
  },
})
rejected = false
try {
  bindIntentIdentities(accessorIdentity)
} catch (error) {
  rejected = error instanceof Error &&
    error.message === 'Intent identity binding input must contain own data properties'
}
assert(rejected, 'Accessor-backed identity fields are rejected')
assert(identityGetterCalled === false, 'Identity binding does not execute input accessors')

const inheritedIdentity = Object.create({
  immortalIntentFingerprint: '11'.repeat(32),
  moriartyProgramFingerprint: '22'.repeat(32),
  actionFingerprint: '33'.repeat(32),
  admissionDecisionReference: 'admission:example',
  action: 'Issue',
})
rejected = false
try {
  bindIntentIdentities(inheritedIdentity)
} catch (error) {
  rejected = error instanceof Error &&
    error.message === 'Intent identity binding input must contain own data properties'
}
assert(rejected, 'Inherited identity fields cannot cross the binding boundary')

console.log('MRY-2/MRY-3 Intent identity binding boundary: PASS')
