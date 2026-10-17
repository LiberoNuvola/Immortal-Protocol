#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const actionCatalog = Object.freeze({
  Issue: [
    'canonicalPreState','actionParameters','candidatePostState',
    'economicAdmission','adapterInput','ledgerState','postState','evidenceProvenance',
  ],
  Reveal: [
    'canonicalPreState','actionParameters','candidatePostState','protectedCapital',
    'EEV','executableLiquidity','gateResult','viabilityResult',
    'adapterInput','ledgerState','postState','evidenceProvenance',
  ],
  Claim: [
    'canonicalPreState','ownershipSignature','expiryEligibility',
    'settlementValueEquivalence','atomicLiabilityLiquidityReduction',
    'ticketNftPreservation','adapterInput','ledgerState','postState','evidenceProvenance',
  ],
  Expire: [
    'canonicalPreState','ticketExpiresAt','expiryEligibility',
    'adapterInput','ledgerState','postState','evidenceProvenance',
  ],
})

const completePacket = (fields) =>
  Object.fromEntries(fields.map((field) => [field, 'evidence:' + field]))

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const isPresent = (value) =>
  value !== undefined &&
  value !== null &&
  !(typeof value === 'string' && value.trim() === '')

const ownData = (record, field) => {
  if (!isRecord(record) || !Object.hasOwn(record, field)) return false
  const descriptor = Object.getOwnPropertyDescriptor(record, field)
  return !!descriptor && Object.hasOwn(descriptor, 'value')
}

const isComplete = (action, packet) => {
  if (typeof action !== 'string' || !Object.hasOwn(actionCatalog, action)) return false
  if (!isRecord(packet)) return false
  const required = actionCatalog[action]
  return required.every((field) => {
    if (!ownData(packet, field)) return false
    return isPresent(Object.getOwnPropertyDescriptor(packet, field).value)
  })
}

assert(Object.keys(actionCatalog).length === 4, 'B5/B6 action catalog is exactly Issue/Reveal/Claim/Expire')

for (const [action, fields] of Object.entries(actionCatalog)) {
  const complete = completePacket(fields)

  for (const field of fields) {
    const missing = { ...complete }
    delete missing[field]
    assert(!isComplete(action, missing), `${action}: missing required field ${field} is incomplete`)

    assert(
      !isComplete(action, { ...complete, [field]: null }),
      `${action}: null required field ${field} is incomplete`,
    )
    assert(
      !isComplete(action, { ...complete, [field]: '' }),
      `${action}: blank required field ${field} is incomplete`,
    )
    assert(
      !isComplete(action, { ...complete, [field]: '   ' }),
      `${action}: whitespace-only required field ${field} is incomplete`,
    )
  }
}

assert(!isComplete('Unknown', completePacket(['evidenceProvenance'])), 'unknown action cannot pass the evidence boundary')
let actionCoercionCalls = 0
const malformedAction = {
  [Symbol.toPrimitive]() {
    actionCoercionCalls += 1
    return 'Issue'
  },
}
assert(!isComplete(malformedAction, completePacket(actionCatalog.Issue)),
  'non-string action identifiers cannot pass the evidence boundary')
assert(actionCoercionCalls === 0,
  'action validation does not invoke caller-controlled key coercion')
assert(!isComplete('Issue', null), 'absent action packet is incomplete')

for (const inheritedAction of ['toString', 'constructor', '__proto__']) {
  assert(!isComplete(inheritedAction, completePacket(['evidenceProvenance'])), `inherited property ${inheritedAction} is not a declared action`)
}
for (const malformedPacket of [undefined, 'packet', 7, [], new Date()]) {
  assert(!isComplete('Issue', malformedPacket), `malformed packet (${String(malformedPacket)}) is incomplete`)
}

for (const [action, fields] of Object.entries(actionCatalog)) {
  const inheritedField = fields[0]
  const prototypeEvidence = { [inheritedField]: 'inherited-evidence' }
  const packet = Object.assign(Object.create(prototypeEvidence), completePacket(fields))
  delete packet[inheritedField]
  assert(!isComplete(action, packet), `${action}: inherited ${inheritedField} cannot satisfy required evidence`)

  const accessorPacket = completePacket(fields)
  Object.defineProperty(accessorPacket, inheritedField, {
    enumerable: true,
    configurable: true,
    get: () => 'accessor-evidence',
  })
  assert(!isComplete(action, accessorPacket), `${action}: accessor-backed ${inheritedField} cannot satisfy required evidence`)
}

const datePacket = new Date()
Object.assign(datePacket, completePacket(actionCatalog.Issue))
assert(!isComplete('Issue', datePacket), 'Date instance with forged evidence fields is not an evidence packet')



for (const [action, fields] of Object.entries(actionCatalog)) {
  const packet = completePacket(fields)
  assert(isComplete(action, packet), action + ' has a complete required evidence packet')
  const mutated = { ...packet }
  delete mutated.evidenceProvenance
  assert(!isComplete(action, mutated), action + ' without provenance cannot close the evidence packet')
}

const reveal = completePacket(actionCatalog.Reveal)
const revealWithoutLiquidity = { ...reveal }
delete revealWithoutLiquidity.executableLiquidity
assert(!isComplete('Reveal', revealWithoutLiquidity), 'Reveal without executable liquidity evidence remains incomplete')

const claim = completePacket(actionCatalog.Claim)
const claimWithoutSettlement = { ...claim }
delete claimWithoutSettlement.settlementValueEquivalence
assert(!isComplete('Claim', claimWithoutSettlement), 'Claim without exact settlement equivalence remains incomplete')

const expire = completePacket(actionCatalog.Expire)
const expireWithoutExpiry = { ...expire }
delete expireWithoutExpiry.ticketExpiresAt
assert(!isComplete('Expire', expireWithoutExpiry), 'Expire without per-ticket expiry binding remains incomplete')

console.log('ALL B5/B6 ACTION EVIDENCE BOUNDARY CHECKS PASSED')
