#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
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

const allocate = (candidates, budget, rule) => {
  if (!Array.isArray(candidates) || typeof budget !== 'bigint' || !isRecord(rule)) {
    return 'UNVERIFIABLE'
  }
  if (budget < 0n || readOwnData(rule, 'kind') !== 'declared-v1') return 'UNVERIFIABLE'

  const normalized = []
  for (const candidate of candidates) {
    const id = readOwnData(candidate, 'id')
    const rank = readOwnData(candidate, 'rank')
    const requested = readOwnData(candidate, 'requested')
    if (typeof id !== 'string' || id.trim().length === 0 ||
        typeof rank !== 'number' || !Number.isFinite(rank) ||
        typeof requested !== 'bigint' || requested < 0n) {
      return 'UNVERIFIABLE'
    }
    normalized.push({ id, rank, requested })
  }

  const sorted = normalized.sort((a, b) => a.rank - b.rank)
  if (sorted.length > 1 && sorted[0].rank === sorted[1].rank) return 'UNRESOLVED'
  if (sorted.length === 0) return []
  const amount = sorted[0].requested < budget ? sorted[0].requested : budget
  return Object.freeze([{ id: sorted[0].id, amount }])
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
assert(
  allocate([{ id: 'a', rank: 1, requested: 10n }], 20, { kind: 'declared-v1' }) === 'UNVERIFIABLE',
  'non-BigInt budget fails closed instead of being coerced',
)
assert(
  allocate([{ id: 'a', rank: 1, requested: 9007199254740993n }], 9007199254740992n, { kind: 'declared-v1' })[0].amount === 9007199254740992n,
  'large integer allocations preserve exact BigInt precision',
)
let candidateGetterCalls = 0
const accessorCandidate = { id: 'a', rank: 1, requested: 10n }
Object.defineProperty(accessorCandidate, 'requested', {
  get() { candidateGetterCalls += 1; return 10n },
})
assert(
  allocate([accessorCandidate], 20n, { kind: 'declared-v1' }) === 'UNVERIFIABLE' && candidateGetterCalls === 0,
  'accessor-backed candidate data fails closed without executing getters',
)
assert(
  allocate([Object.create({ id: 'a', rank: 1, requested: 10n })], 20n, { kind: 'declared-v1' }) === 'UNVERIFIABLE',
  'inherited candidate fields cannot enter allocation',
)

console.log('ALL EXP-11 DETERMINISTIC ALLOCATION BOUNDARY CHECKS PASSED')
