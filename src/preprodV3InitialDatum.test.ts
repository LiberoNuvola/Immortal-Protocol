import { describe, expect, it } from 'vitest'
import {
  assertPreRichPreprodInitialProfile,
  buildPreRichPreprodInitialClasses,
} from '../PRE-RICH/profile/PreRichPreprodDeploymentProfile'
import { buildPreRichPreprodInitialDatum } from './preprodV3InitialDatum'

const EXPECTED_INITIAL_V3_DATUM_CBOR =
  '7982007989000000000000887986000000000a7a807986010000000a79807986020000000a79807986030000000a79807986040000000a79807986050000000a79807986060000000a79807986070000000a79807982000079840000798000'

describe('PRE-RICH Preprod V3 initial deployment profile', () => {
  it('declares exactly eight classes with only class 0 saleable', () => {
    assertPreRichPreprodInitialProfile()
    const classes = buildPreRichPreprodInitialClasses()
    expect(classes).toHaveLength(8)
    expect(classes[0]?.saleable).toBe(true)
    expect(classes.slice(1).every((entry) => !entry.saleable)).toBe(true)
    expect(classes.every((entry) => entry.issued === 0n && entry.unresolved === 0n)).toBe(true)
  })

  it('produces the canonical deterministic Plutus datum CBOR', () => {
    const a = buildPreRichPreprodInitialDatum()
    const b = buildPreRichPreprodInitialDatum()
    expect(a).toMatch(/^[0-9a-f]+$/)
    expect(a).toBe(b)
    expect(a).toBe(EXPECTED_INITIAL_V3_DATUM_CBOR)
    expect(a.length / 2).toBe(95)
  })
})
