import { describe, expect, it } from 'vitest'
import { Data } from 'lucid-cardano'
import {
  assertPreRichPreprodInitialProfile,
  buildPreRichPreprodInitialClasses,
} from '../PRE-RICH/profile/PreRichPreprodDeploymentProfile'
import { buildPreRichPreprodInitialDatum } from './preprodV3InitialDatum'

describe('PRE-RICH Preprod V3 initial deployment profile', () => {
  it('declares exactly eight classes with only class 0 saleable', () => {
    assertPreRichPreprodInitialProfile()
    const classes = buildPreRichPreprodInitialClasses()
    expect(classes).toHaveLength(8)
    expect(classes[0]?.saleable).toBe(true)
    expect(classes.slice(1).every((entry) => !entry.saleable)).toBe(true)
    expect(classes.every((entry) => entry.issued === 0n && entry.unresolved === 0n)).toBe(true)
  })

  it('produces deterministic Plutus datum CBOR', () => {
    const a = buildPreRichPreprodInitialDatum()
    const b = buildPreRichPreprodInitialDatum()
    expect(a).toMatch(/^[0-9a-f]+$/)
    expect(a).toBe(b)
    expect(() => Data.from(a)).not.toThrow()
  })
})
