import { beforeAll, describe, expect, it } from 'vitest'
import { Constr, Data, Emulator, Lucid, type UTxO } from 'lucid-cardano'
import {
  resolveCanonicalTreasuryAddress,
  selectCanonicalTreasuryDatum,
} from '../treasuryIdentity'

const DERIVED = 'addr_test1wqderivedtreasury'
const OTHER = 'addr_test1wqotherstakecredential'

function datum(value = 1n) {
  return new Constr(0, [value, '00'.repeat(28)])
}

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

beforeAll(async () => {
  // Data.to uses Lucid's WASM ledger-data runtime; initialize it as in the
  // repository's read-only observer scripts before serializing Plutus data.
  await Lucid.new(new Emulator([]), 'Preprod')
})

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
  it('accepts multiple Treasury UTxOs when every one carries the same datum', () => {
    const expected = datum(1n)
    const first = utxo('aa'.repeat(32), 0, Data.to(expected))
    const second = utxo('bb'.repeat(32), 1, expected)

    const result = selectCanonicalTreasuryDatum([first, second], DERIVED)
    expect(Data.to(result)).toBe(Data.to(expected))
  })

  it('rejects an empty Treasury custody set', () => {
    expect(() => selectCanonicalTreasuryDatum([], DERIVED))
      .toThrow(/TREASURY_UTXO_SET_EMPTY/)
  })

  it('rejects any Treasury UTxO without a datum instead of silently omitting it', () => {
    const withDatum = utxo('aa'.repeat(32), 0, Data.to(datum()))
    const withoutDatum = utxo('bb'.repeat(32), 1, undefined)

    expect(() => selectCanonicalTreasuryDatum([withDatum, withoutDatum], DERIVED))
      .toThrow(/TREASURY_UTXO_DATUM_MISSING/)
  })

  it('rejects conflicting datums instead of selecting the first UTxO', () => {
    const first = utxo('aa'.repeat(32), 0, datum(1n))
    const second = utxo('bb'.repeat(32), 1, datum(2n))

    expect(() => selectCanonicalTreasuryDatum([first, second], DERIVED))
      .toThrow(/TREASURY_DATUM_CONFLICT/)
  })

  it('rejects UTxOs returned for a different address', () => {
    const unexpected = utxo('aa'.repeat(32), 0, datum(), OTHER)
    expect(() => selectCanonicalTreasuryDatum([unexpected], DERIVED))
      .toThrow(/TREASURY_UTXO_ADDRESS_MISMATCH/)
  })

  it('rejects duplicated UTxO references', () => {
    const first = utxo('aa'.repeat(32), 0, datum())
    const duplicate = utxo('aa'.repeat(32), 0, datum())

    expect(() => selectCanonicalTreasuryDatum([first, duplicate], DERIVED))
      .toThrow(/TREASURY_UTXO_REFERENCE_DUPLICATE/)
  })

  it('rejects a malformed datum encoding', () => {
    const malformed = utxo('aa'.repeat(32), 0, 'not-cbor-hex')
    expect(() => selectCanonicalTreasuryDatum([malformed], DERIVED))
      .toThrow(/TREASURY_UTXO_DATUM_INVALID/)
  })
})
