import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * Source-level guard for PrizeValidator row-tier immutability.
 *
 * pdRow1Tier / pdRow2Tier are written exactly once, by Reveal, where they are
 * pinned to the values derived from GameRules. identityFieldsEq deliberately
 * does NOT compare them (Reveal must be able to change them), so every other
 * transition that continues the datum has to freeze them explicitly through
 * rowTiersUnchanged. If a transition is added or refactored without that, a
 * continuing Prize datum could silently rewrite the recorded result tiers.
 *
 * This is a static check over plutus/PrizeValidator.hs. It is not a substitute
 * for a ledger-level negative twin (Sync/Claim with mutated tiers must be
 * rejected on Yaci), which remains to be added to the Cardano trace suite.
 */

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(
  resolve(here, '../../plutus/PrizeValidator.hs'),
  'utf8',
)

// Split into top-level definitions keyed by their INLINABLE pragma.
function definitions(src: string): Map<string, string> {
  const pragma = /{-# INLINABLE (\w+) #-}/g
  const marks: { name: string; start: number }[] = []
  for (let m = pragma.exec(src); m; m = pragma.exec(src)) {
    marks.push({ name: m[1], start: m.index })
  }
  const out = new Map<string, string>()
  marks.forEach((mark, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].start : src.length
    out.set(mark.name, src.slice(mark.start, end))
  })
  return out
}

const defs = definitions(source)

// Transitions that continue the PrizeDatum through identityFieldsEq.
const continuing = [...defs.entries()].filter(
  ([name, body]) =>
    name !== 'identityFieldsEq' && body.includes('identityFieldsEq n datum'),
)

describe('PrizeValidator row-tier immutability', () => {
  it('rowTiersUnchanged compares both row tiers', () => {
    const body = defs.get('rowTiersUnchanged')
    assert.ok(body, 'rowTiersUnchanged is not defined')
    assert.match(body, /pdRow1Tier a == pdRow1Tier b/)
    assert.match(body, /pdRow2Tier a == pdRow2Tier b/)
  })

  it('identityFieldsEq leaves the tiers to the transitions', () => {
    const body = defs.get('identityFieldsEq') as string
    assert.ok(body, 'identityFieldsEq is not defined')
    // Strip comments, then confirm the tiers are not part of the comparison.
    const code = body
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n')
    assert.doesNotMatch(code, /pdRow[12]Tier/)
  })

  it('finds the Sync, Reveal and Claim continuations', () => {
    // Fails loudly if the validator is restructured, so this guard is revisited
    // instead of silently passing on zero matches.
    assert.ok(
      continuing.length >= 3,
      'expected at least 3 continuing transitions, found ' + continuing.length + ': ' +
        continuing.map(([n]) => n).join(', '),
    )
    const names = continuing.map(([n]) => n)
    assert.ok(names.includes('validateReveal'), 'validateReveal not found')
    assert.ok(names.includes('validateClaim'), 'validateClaim not found')
  })

  for (const [name, body] of continuing) {
    if (name === 'validateReveal') {
      it('validateReveal pins both tiers to the GameRules-derived values', () => {
        assert.match(body, /pdRow1Tier n == row1Tier/)
        assert.match(body, /pdRow2Tier n == row2Tier/)
      })
    } else {
      it(name + ' freezes the row tiers via rowTiersUnchanged', () => {
        assert.match(body, /rowTiersUnchanged n datum/)
      })
    }
  }
})
