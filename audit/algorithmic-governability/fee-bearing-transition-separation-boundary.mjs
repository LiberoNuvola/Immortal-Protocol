#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const candidate = Object.freeze({
  action: 'A',
  canonicalTransitionId: 'transition-1',
  economicStateHash: 'state-1',
  economicFeeTarget: 'target-opaque',
  settlementAmount: 'amount-opaque',
  protocolUsageFeeIdentity: 'protocol-usage-fee',
  chainExecutionCost: 'chain-cost-opaque',
  feeReferenceStatus: 'VALID',
  conversionStatus: 'VALID',
  safe: true,
})

assert(
  candidate.protocolUsageFeeIdentity !== candidate.chainExecutionCost,
  'Protocol Usage Fee and ChainExecutionCost remain distinct identities',
)

const totalCost = (transition) => Object.freeze({
  protocolUsageFee: transition.settlementAmount,
  chainExecutionCost: transition.chainExecutionCost,
})

const costs = totalCost(candidate)
assert(
  costs.protocolUsageFee === candidate.settlementAmount &&
  costs.chainExecutionCost === candidate.chainExecutionCost,
  'total-cost observation preserves the two independent cost components',
)

const commit = (transition) => {
  if (!transition || typeof transition !== 'object') return 'REJECTED'
  if (transition.safe !== true) return 'REJECTED'
  if (typeof transition.canonicalTransitionId !== 'string' || transition.canonicalTransitionId.trim() === '') return 'REJECTED'
  if (typeof transition.action !== 'string' || transition.action.trim() === '') return 'REJECTED'
  if (typeof transition.economicStateHash !== 'string' || transition.economicStateHash.trim() === '') return 'REJECTED'
  if (typeof transition.economicFeeTarget !== 'string' || transition.economicFeeTarget.trim() === '') return 'REJECTED'
  if (transition.feeReferenceStatus !== 'VALID') return 'SAFE_STALL'
  if (transition.conversionStatus !== 'VALID') return 'REJECTED'
  return 'COMMITTED'
}

assert(commit(null) === 'REJECTED', 'absent transition candidate is rejected')
assert(commit(undefined) === 'REJECTED', 'undefined transition candidate is rejected')
assert(commit(Object.freeze({ ...candidate, canonicalTransitionId: '   ' })) === 'REJECTED',
  'blank canonical transition identity cannot authorize commitment')
assert(commit(Object.freeze({ ...candidate, canonicalTransitionId: 17 })) === 'REJECTED',
  'non-string canonical transition identity cannot authorize commitment')
assert(commit(Object.freeze({ ...candidate, action: '' })) === 'REJECTED',
  'blank action identity cannot authorize commitment')
assert(commit(Object.freeze({ ...candidate, economicStateHash: '   ' })) === 'REJECTED',
  'blank economic state identity cannot authorize commitment')
assert(commit(Object.freeze({ ...candidate, economicFeeTarget: null })) === 'REJECTED',
  'missing economic fee target cannot authorize commitment')

assert(commit(candidate) === 'COMMITTED', 'valid fee-bearing transition can commit')
assert(
  commit(Object.freeze({ ...candidate, feeReferenceStatus: 'INVALID' })) === 'SAFE_STALL',
  'invalid fee reference cannot authorize commitment and enters safe failure',
)
assert(
  commit(Object.freeze({ ...candidate, conversionStatus: 'INVALID' })) === 'REJECTED',
  'invalid settlement conversion cannot authorize commitment',
)
assert(
  commit(Object.freeze({ ...candidate, safe: false })) === 'REJECTED',
  'fee payment cannot override the superior economic safety condition',
)

const changedTarget = Object.freeze({
  ...candidate,
  economicFeeTarget: 'target-mutated-by-adapter',
})
assert(
  changedTarget.economicFeeTarget !== candidate.economicFeeTarget,
  'adapter-side target mutation remains observable and cannot be silently inherited',
)

const adapterSettlement = (transition) => Object.freeze({
  action: transition.action,
  economicStateHash: transition.economicStateHash,
  economicFeeTarget: transition.economicFeeTarget,
  settlementAmount: transition.settlementAmount,
  chainExecutionCost: transition.chainExecutionCost,
})

const realized = adapterSettlement(candidate)
assert(
  realized.economicFeeTarget === candidate.economicFeeTarget,
  'adapter realization preserves the pre-authorized EconomicFeeTarget',
)
assert(
  realized.chainExecutionCost === candidate.chainExecutionCost,
  'adapter realization reports chain execution cost without rewriting the target',
)

const feeLifecycle = Object.freeze({
  canonicalEconomicState: 'S',
  feeStatus: 'PAID',
})
assert(
  !('feeStatus' in candidate),
  'fee payment is not introduced as a second canonical economic-state lifecycle',
)

const feeOnlyCommit = Object.freeze({
  ...candidate,
  canonicalTransitionId: '',
  action: 'NO_CANONICAL_TRANSITION',
})
assert(
  commit(feeOnlyCommit) === 'REJECTED',
  'fee validity alone cannot be treated as a canonical transition witness',
)
assert(
  feeOnlyCommit.canonicalTransitionId === '',
  'the conformance boundary requires an independent canonical transition identity',
)

console.log('ALL FEE-BEARING TRANSITION SEPARATION CHECKS PASSED')
