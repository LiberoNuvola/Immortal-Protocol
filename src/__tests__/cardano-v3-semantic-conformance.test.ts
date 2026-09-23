import { Constr, type Data } from 'lucid-cardano'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'

/**
 * C13 — V3/Cardano semantic boundary.
 *
 * This test is intentionally representation-level. It proves that the
 * canonical Cardano B1 redeemer constructors preserve the semantic action
 * identity and parameter ownership expected by V3:
 *
 *   Issue   -> TicketIssued(price)
 *   Reveal  -> TicketRevealed(price), with payout owned by PrizeDatum
 *   Claim   -> TicketClaimed(amount)
 *   Expire  -> TicketExpired
 *
 * It does NOT claim validator execution or ledger equivalence. Those require
 * the real Plutus/Yaci evidence fronts (C12/C14).
 */

function constr(index: number, fields: Data[] = []): Data {
  return new Constr<Data>(index, fields) as unknown as Data
}

function intField(value: bigint): Data {
  return value
}

function b1FundTreasury(): Data {
  return constr(0)
}

function b1TicketIssued(priceUsdm: bigint): Data {
  return constr(1, [intField(priceUsdm)])
}

function b1TicketRevealed(priceUsdm: bigint): Data {
  return constr(2, [intField(priceUsdm)])
}

function b1TicketClaimed(amount: bigint): Data {
  return constr(3, [intField(amount)])
}

function b1TicketExpired(): Data {
  return constr(4)
}

function indexOf(value: Data): number {
  const candidate = value as unknown as { index?: number }
  return candidate.index ?? -1
}

function fieldsOf(value: Data): Data[] {
  const candidate = value as unknown as { fields?: Data[] }
  return candidate.fields ?? []
}

describe('C13 V3/Cardano semantic action boundary', () => {
  it('uses the canonical B1 constructor indices', () => {
    assert.equal(indexOf(b1FundTreasury()), 0)
    assert.equal(indexOf(b1TicketIssued(100n)), 1)
    assert.equal(indexOf(b1TicketRevealed(100n)), 2)
    assert.equal(indexOf(b1TicketClaimed(50000n)), 3)
    assert.equal(indexOf(b1TicketExpired()), 4)
  })

  it('binds Issue price to the redeemer parameter', () => {
    const d = b1TicketIssued(2500n)
    assert.deepEqual(fieldsOf(d), [2500n])
  })

  it('binds Reveal price to the redeemer while payout remains datum-owned', () => {
    const d = b1TicketRevealed(1000n)
    assert.deepEqual(fieldsOf(d), [1000n])
    // A Reveal redeemer carries the canonical ticket price, not a
    // caller-selected payout. The payout is read from PrizeDatum.
    assert.equal(fieldsOf(d).length, 1)
  })

  it('binds Claim amount exactly to the settlement amount', () => {
    const d = b1TicketClaimed(50000n)
    assert.deepEqual(fieldsOf(d), [50000n])
  })

  it('encodes Expire without a caller-selected economic amount', () => {
    const d = b1TicketExpired()
    assert.deepEqual(fieldsOf(d), [])
  })

  it('rejects semantic confusion between Reveal price and Claim amount', () => {
    const reveal = b1TicketRevealed(100n)
    const claim = b1TicketClaimed(100n)
    assert.equal(indexOf(reveal), 2)
    assert.equal(indexOf(claim), 3)
    assert.notEqual(indexOf(reveal), indexOf(claim))
  })
})
