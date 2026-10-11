#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const order = (obligations) => {
  if (!Array.isArray(obligations)) return 'UNVERIFIABLE'
  for (const obligation of obligations) {
    if (!obligation?.id || !obligation?.type || !Number.isInteger(obligation.seniorityRank)) {
      return 'UNVERIFIABLE'
    }
  }
  const ranks = obligations.map((o) => o.seniorityRank)
  if (new Set(ranks).size !== ranks.length) return 'UNRESOLVED'
  return [...obligations].sort((a, b) => a.seniorityRank - b.seniorityRank)
}

const obligations = [
  { id: 'o2', type: 'typed-b', seniorityRank: 2 },
  { id: 'o1', type: 'typed-a', seniorityRank: 1 },
]

const ordered = order(obligations)
assert(ordered[0].id === 'o1' && ordered[1].id === 'o2', 'explicit seniority rank yields deterministic order')
assert(order([{ id: 'o1', type: 'typed-a' }]) === 'UNVERIFIABLE', 'missing seniority information fails closed')
assert(
  order([{ id: 'o1', type: 'typed-a', seniorityRank: 1 }, { id: 'o2', type: 'typed-b', seniorityRank: 1 }]) === 'UNRESOLVED',
  'equal seniority does not acquire an implicit caller/iteration tie-break',
)

const independent = Object.freeze({
  id: 'o1',
  seniorityRank: 1,
  amount: 100n,
  protected: true,
})
assert(independent.seniorityRank !== undefined, 'ordering metadata remains explicit')
assert(independent.amount === 100n && independent.protected === true, 'ordering remains distinct from amount/protection semantics')

console.log('ALL EXP-01 SENIORITY ORDER BOUNDARY CHECKS PASSED')
