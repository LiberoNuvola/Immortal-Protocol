#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const transfer = (obligation, source, destination, authorization) => {
  if (!authorization?.authorized) return 'UNVERIFIABLE'
  if (!obligation?.id || !source || !destination) return 'UNVERIFIABLE'
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
  transfer(obligation, 'party-a', 'party-a', { authorized: true }) === 'REJECTED',
  'source and destination collision is rejected',
)

console.log('ALL EXP-09 NOVATION BOUNDARY CHECKS PASSED')
