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

const isComplete = (action, packet) => {
  const required = actionCatalog[action]
  if (!required || !packet) return false
  return required.every((field) => packet[field] !== undefined && packet[field] !== '')
}

assert(Object.keys(actionCatalog).length === 4, 'B5/B6 action catalog is exactly Issue/Reveal/Claim/Expire')

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
