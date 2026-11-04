import { describe, expect, it } from 'vitest'
import type { UTxO } from 'lucid-cardano'
import {
  resolveCanonicalTreasuryAddress,
  selectCanonicalTreasuryDatum,
} from '../treasuryIdentity'

const DERIVED = 'addr_test1wqderivedtreasury'
const OTHER = 'addr_test1wqotherstakecredential'
const DATUM_A = 'd8799f01ff'
const DATUM_B = 'd8799f02ff'

function utxo(
  txHash: string,
  outputIndex: number,
  rawDatum: unknown,
  address = DERIVED,
): UTxO {
  return {
    txHash,
    outputIndex,
    address,
    assets: { lovelace: 2_000_000n },
    datum: rawDatum,
  } as unknown as UTxO
}

describe('PRE-RICH canonical Treasury identity', () => {
  it('uses the validator-derived address when no deployment pin is configured', () => {
    expect(resolveCanonicalTreasuryAddress(DERIVED)).toBe(DERIVED)
    expect(resolveCanonicalTreasuryAddress(DERIVED, '')).toBe(DERIVED)
    expect(resolveCanonicalTreasuryAddress(DERIVED, '   ')).toBe(DERIVED)
  })

  it('accepts only an exact configured-address match', () => {
    expect(resolveCanonicalTreasuryAddress(DERIVED, DERIVED)).toBe(DERIVED)
  })

  it('rejects a configured address that differs despite potentially sharing a payment credential', () => {
    expect(() => resolveCanonicalTreasuryAddress(DERIVED, OTHER))
      .toThrow(/TREASURY_IDENTITY_MISMATCH/)
  })

  it('fails closed when the validator-derived address is unavailable', () => {
    expect(() => resolveCanonicalTreasuryAddress(undefined, DERIVED))
      .toThrow(/TREASURY_DERIVED_ADDRESS_MISSING/)
    expect(() => resolveCanonicalTreasuryAddress('', undefined))
      .toThrow(/TREASURY_DERIVED_ADDRESS_MISSING/)
  })
})

describe('PRE-RICH canonical Treasury datum selection', () => {
  it('accepts multiple Treasury UTxOs when every one carries the same raw CBOR datum', () => {
    const first = utxo('aa'.repeat(32), 0, DATUM_A)
    const second = utxo('bb'.repeat(32), 1, '0x' + DATUM_A.toUpperCase())

    expect(selectCanonicalTreasuryDatum([first, second], DERIVED)).toBe(DATUM_A)
  })

  it('rejects an empty Treasury custody set', () => {
    expect(() => selectCanonicalTreasuryDatum([], DERIVED))
      .toThrow(/TREASURY_UTXO_SET_EMPTY/)
  })

  it('rejects any Treasury UTxO without a datum instead of silently omitting it', () => {
    const withDatum = utxo('aa'.repeat(32), 0, DATUM_A)
    const withoutDatum = utxo('bb'.repeat(32), 1, undefined)

    expect(() => selectCanonicalTreasuryDatum([withDatum, withoutDatum], DERIVED))
      .toThrow(/TREASURY_UTXO_DATUM_MISSING/)
  })

  it('rejects conflicting datums instead of selecting the first UTxO', () => {
    const first = utxo('aa'.repeat(32), 0, DATUM_A)
    const second = utxo('bb'.repeat(32), 1, DATUM_B)

    expect(() => selectCanonicalTreasuryDatum([first, second], DERIVED))
      .toThrow(/TREASURY_DATUM_CONFLICT/)
  })

  it('rejects UTxOs returned for a different address', () => {
    const unexpected = utxo('aa'.repeat(32), 0, DATUM_A, OTHER)
    expect(() => selectCanonicalTreasuryDatum([unexpected], DERIVED))
      .toThrow(/TREASURY_UTXO_ADDRESS_MISMATCH/)
  })

  it('rejects duplicated UTxO references', () => {
    const first = utxo('aa'.repeat(32), 0, DATUM_A)
    const duplicate = utxo('aa'.repeat(32), 0, DATUM_A)

    expect(() => selectCanonicalTreasuryDatum([first, duplicate], DERIVED))
      .toThrow(/TREASURY_UTXO_REFERENCE_DUPLICATE/)
  })

  it('rejects a malformed datum encoding', () => {
    const malformed = utxo('aa'.repeat(32), 0, 'not-cbor-hex')
    expect(() => selectCanonicalTreasuryDatum([malformed], DERIVED))
      .toThrow(/TREASURY_UTXO_DATUM_INVALID/)
  })

  it('compares object-form datums without invoking Lucid serialization', () => {
    const first = utxo('aa'.repeat(32), 0, { index: 0, fields: [1n, '00'] })
    const same = utxo('bb'.repeat(32), 1, { fields: [1n, '00'], index: 0 })
    const different = utxo('cc'.repeat(32), 2, { index: 0, fields: [2n, '00'] })

    expect(selectCanonicalTreasuryDatum([first, same], DERIVED)).toEqual({ index: 0, fields: [1n, '00'] })
    expect(() => selectCanonicalTreasuryDatum([first, different], DERIVED))
      .toThrow(/TREASURY_DATUM_CONFLICT/)
  })
})
