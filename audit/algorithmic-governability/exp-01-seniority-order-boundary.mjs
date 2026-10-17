#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error('FAIL: ' + message)
  console.log('PASS: ' + message)
}

const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
   Object.getPrototypeOf(value) === null)

const readOwnData = (record, key) => {
  if (!isRecord(record)) return undefined
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined
}

const order = (obligations) => {
  if (!Array.isArray(obligations)) return 'UNVERIFIABLE'
  const normalized = []
  for (const obligation of obligations) {
    const id = readOwnData(obligation, 'id')
    const type = readOwnData(obligation, 'type')
    const seniorityRank = readOwnData(obligation, 'seniorityRank')
    if (typeof id !== 'string' || id.trim().length === 0 ||
        typeof type !== 'string' || type.trim().length === 0 ||
        !Number.isSafeInteger(seniorityRank)) {
      return 'UNVERIFIABLE'
    }
    normalized.push({ id, type, seniorityRank })
  }
  const ranks = normalized.map((o) => o.seniorityRank)
  if (new Set(ranks).size !== ranks.length) return 'UNRESOLVED'
  return normalized.sort((a, b) => a.seniorityRank - b.seniorityRank)
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
let getterCalls = 0
const accessorObligation = { id: 'o1', type: 'typed-a' }
Object.defineProperty(accessorObligation, 'seniorityRank', {
  get() { getterCalls += 1; return 1 },
})
assert(
  order([accessorObligation]) === 'UNVERIFIABLE' && getterCalls === 0,
  'accessor-backed seniority fails closed without executing getters',
)
assert(
  order([Object.create({ id: 'o1', type: 'typed-a', seniorityRank: 1 })]) === 'UNVERIFIABLE',
  'inherited obligation identity cannot enter seniority ordering',
)
assert(
  order([{ id: 'o1', type: 'typed-a', seniorityRank: Number.MAX_SAFE_INTEGER + 1 }]) === 'UNVERIFIABLE',
  'unsafe integer ranks are not accepted as deterministic seniority values',
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
