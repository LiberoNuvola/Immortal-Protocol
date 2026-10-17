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

const transfer = (obligation, source, destination, authorization) => {
  if (!hasOwnDataFields(authorization, ['authorized']) || authorization.authorized !== true) return 'UNVERIFIABLE'
  if (!hasOwnDataFields(obligation, ['id', 'amount'])) return 'UNVERIFIABLE'
  if (typeof obligation.id !== 'string' || !obligation.id.trim() ||
      typeof obligation.amount !== 'bigint' ||
      typeof source !== 'string' || !source.trim() ||
      typeof destination !== 'string' || !destination.trim()) return 'UNVERIFIABLE'
  if (source === destination) return 'REJECTED'
  return Object.freeze({
    obligationId: obligation.id,
    amount: obligation.amount,
    source,
    destination,
    history: [Object.freeze({ source, destination })],
  })
}

const obligation = Object.freeze({ id: 'obl-1', amount: 125n })

const moved = transfer(obligation, 'party-a', 'party-b', { authorized: true })
assert(moved.amount === 125n, 'transfer preserves the established obligation amount')
assert(moved.obligationId === obligation.id, 'transfer preserves obligation identity')
assert(moved.history.length === 1, 'transfer records explicit provenance')

assert(
  transfer(obligation, 'party-a', 'party-b', null) === 'UNVERIFIABLE',
  'missing transfer authorization fails closed',
)
assert(
  transfer({ ...obligation, amount: 125 }, 'party-a', 'party-b', { authorized: true }) === 'UNVERIFIABLE',
  'non-BigInt obligation amount fails closed',
)
assert(
  transfer(obligation, '', 'party-b', { authorized: true }) === 'UNVERIFIABLE',
  'blank transfer source fails closed',
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
assert(transfer(obligation, 'party-a', 'party-b', accessorAuthorization) === 'UNVERIFIABLE',
  'accessor-backed transfer authorization is rejected')
assert(authorizationGetterCalled === false,
  'transfer authorization validation does not execute accessors')
assert(
  transfer(obligation, 'party-a', 'party-a', { authorized: true }) === 'REJECTED',
  'source and destination collision is rejected',
)

console.log('ALL EXP-09 NOVATION BOUNDARY CHECKS PASSED')
