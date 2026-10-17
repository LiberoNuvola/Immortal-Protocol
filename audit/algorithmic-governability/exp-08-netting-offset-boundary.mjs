#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const isRecord = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasOwnDataFields = (value, fields) => isRecord(value) && fields.every((field) => {
  const descriptor = Object.getOwnPropertyDescriptor(value, field)
  return Boolean(descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value'))
})

const net = (left, right, relation) => {
  if (!hasOwnDataFields(relation, ['authorized']) || relation.authorized !== true) return 'UNVERIFIABLE'
  const obligationFields = ['id', 'settlementAsset', 'amount']
  if (!hasOwnDataFields(left, obligationFields) || !hasOwnDataFields(right, obligationFields)) return 'UNVERIFIABLE'
  if (typeof left.id !== 'string' || !left.id.trim() ||
      typeof right.id !== 'string' || !right.id.trim() ||
      typeof left.settlementAsset !== 'string' || !left.settlementAsset.trim() ||
      typeof right.settlementAsset !== 'string' || !right.settlementAsset.trim() ||
      typeof left.amount !== 'bigint' || typeof right.amount !== 'bigint') return 'UNVERIFIABLE'
  if (left.settlementAsset !== right.settlementAsset) return 'REJECTED'
  if (left.amount <= 0n || right.amount <= 0n) return 'REJECTED'
  return Object.freeze({
    gross: Object.freeze({ left: left.amount, right: right.amount }),
    net: left.amount - right.amount,
  })
}

const a = Object.freeze({ id: 'A', settlementAsset: 'U', amount: 50n })
const b = Object.freeze({ id: 'B', settlementAsset: 'U', amount: 20n })

const result = net(a, b, { authorized: true })
assert(result.net === 30n, 'authorized compatible obligations produce an explicit net position')
assert(result.gross.left === 50n && result.gross.right === 20n, 'gross obligations remain auditable after netting')

assert(
  net(a, b, null) === 'UNVERIFIABLE',
  'missing netting authorization fails closed',
)
assert(
  net({ ...a, amount: 50 }, b, { authorized: true }) === 'UNVERIFIABLE',
  'non-BigInt obligation amount fails closed rather than throwing during subtraction',
)
assert(
  net({ ...a, amount: '50' }, b, { authorized: true }) === 'UNVERIFIABLE',
  'numeric-string obligation amount cannot enter netting',
)
let authorizationGetterCalled = false
const accessorAuthorization = {}
Object.defineProperty(accessorAuthorization, 'authorized', {
  enumerable: true,
  get() {
    authorizationGetterCalled = true
    return true
  },
})
assert(net(a, b, accessorAuthorization) === 'UNVERIFIABLE',
  'accessor-backed netting authorization is rejected')
assert(authorizationGetterCalled === false,
  'netting authorization validation does not execute accessors')
assert(
  net(Object.create(a), b, { authorized: true }) === 'UNVERIFIABLE',
  'inherited obligation fields cannot authorize netting',
)
assert(
  net(a, Object.freeze({ id: 'C', settlementAsset: 'OTHER', amount: 20n }), { authorized: true }) === 'REJECTED',
  'incompatible settlement domains are rejected rather than implicitly converted',
)

console.log('ALL EXP-08 NETTING/OFFSET BOUNDARY CHECKS PASSED')
