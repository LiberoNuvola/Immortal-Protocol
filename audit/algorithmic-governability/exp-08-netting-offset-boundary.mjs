#!/usr/bin/env node

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const net = (left, right, relation) => {
  if (!relation || relation.authorized !== true) return 'UNVERIFIABLE'
  if (!left?.id || !right?.id) return 'UNVERIFIABLE'
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
  net(a, Object.freeze({ id: 'C', settlementAsset: 'OTHER', amount: 20n }), { authorized: true }) === 'REJECTED',
  'incompatible settlement domains are rejected rather than implicitly converted',
)

console.log('ALL EXP-08 NETTING/OFFSET BOUNDARY CHECKS PASSED')
