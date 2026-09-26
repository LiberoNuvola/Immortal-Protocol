import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src', 'gameFlow.ts'), 'utf8')

function section(name: string, nextName: string | null): string {
  const start = source.indexOf(`export async function ${name}`)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = nextName
    ? source.indexOf(`export async function ${nextName}`, start)
    : source.length
  expect(end).toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('Cardano reference-script spending boundary', () => {
  it('keeps Reveal on the reference-script path', () => {
    const reveal = section('revealPrize', 'loadCertifiedTicketState')
    expect(reveal).toContain('.readFrom([prizeValidatorReferenceUtxo, b1PrizePoolReferenceUtxo])')
    expect(reveal).not.toContain('.attachSpendingValidator(scripts.prizeValidator as Script)')
    expect(reveal).not.toContain('.attachSpendingValidator(scripts.b1PrizePool as Script)')
  })

  it('keeps Claim off inline validators', () => {
    const claim = section('claimPrize', 'expirePrize')
    expect(claim).toContain('findReferenceScriptUtxo(')
    expect(claim).toContain('.readFrom([prizeValidatorReferenceUtxo, b1PrizePoolReferenceUtxo])')
    expect(claim).not.toContain('.attachSpendingValidator(scripts.prizeValidator as Script)')
    expect(claim).not.toContain('.attachSpendingValidator(scripts.b1PrizePool as Script)')
  })

  it('keeps Expire off inline validators', () => {
    const expire = section('expirePrize', null)
    expect(expire).toContain('findReferenceScriptUtxo(')
    expect(expire).toContain('.readFrom([prizeValidatorReferenceUtxo, b1PrizePoolReferenceUtxo])')
    expect(expire).not.toContain('.attachSpendingValidator(')
  })
})
