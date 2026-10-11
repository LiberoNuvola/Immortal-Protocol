#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const allocate = (candidates, budget, rule) => {
  if (!Array.isArray(candidates) || budget == null || !rule) return 'UNVERIFIABLE'
  if (rule.kind !== 'declared-v1') return 'UNVERIFIABLE'
  const sorted = [...candidates].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return 0
  })
  if (sorted.length > 1 && sorted[0].rank === sorted[1].rank) return 'UNRESOLVED'
  if (sorted.length === 0) return []
  return Object.freeze([{ id: sorted[0].id, amount: BigInt(Math.min(Number(budget), Number(sorted[0].requested))) }])
}

const candidates = [
  { id: 'b', rank: 2, requested: 70n },
  { id: 'a', rank: 1, requested: 40n },
]

const allocation = allocate(candidates, 50n, { kind: 'declared-v1' })
assert(allocation.length === 1 && allocation[0].id === 'a', 'declared allocation rule produces deterministic selection')
assert(allocation[0].amount === 40n, 'allocation remains within certified budget')

assert(
  allocate([{ id: 'a', rank: 1, requested: 10n }, { id: 'b', rank: 1, requested: 10n }], 20n, { kind: 'declared-v1' }) === 'UNRESOLVED',
  'an unresolved tie is not broken by caller/iteration order',
)
assert(
  allocate(candidates, null, { kind: 'declared-v1' }) === 'UNVERIFIABLE',
  'missing certified budget fails closed',
)

console.log('ALL EXP-11 DETERMINISTIC ALLOCATION BOUNDARY CHECKS PASSED')
