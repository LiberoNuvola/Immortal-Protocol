import { describe, expect, it } from 'vitest'
import {
  assertFrozenBeaconMode,
  beaconModeLabel,
  selectBeaconMode,
} from '../beaconTrust'

const evidence = (
  mode: 'B3_VERIFIED' | 'B2_ATTESTED' | 'B1_AUTHORIZED',
) => ({
  mode,
  roundId: '381',
  beacon: 'beacon-' + mode,
  evidenceRef: 'evidence:' + mode,
  verifiedAt: '2026-09-26T08:00:00.000Z',
})

describe('Beacon trust-mode selection', () => {
  it('defaults to B3 when B3 evidence is available', () => {
    expect(
      selectBeaconMode('381', {
        b3: evidence('B3_VERIFIED'),
        b2: evidence('B2_ATTESTED'),
        b1: evidence('B1_AUTHORIZED'),
      }).mode,
    ).toBe('B3_VERIFIED')
  })

  it('falls back to B2 when B3 is unavailable', () => {
    expect(
      selectBeaconMode('381', {
        b2: evidence('B2_ATTESTED'),
        b1: evidence('B1_AUTHORIZED'),
      }).mode,
    ).toBe('B2_ATTESTED')
  })

  it('falls back to B1 when B3 and B2 are unavailable', () => {
    expect(
      selectBeaconMode('381', {
        b1: evidence('B1_AUTHORIZED'),
      }).mode,
    ).toBe('B1_AUTHORIZED')
  })

  it('fails closed when no mode is available', () => {
    expect(() => selectBeaconMode('381', {})).toThrow(
      'No verified Beacon trust mode is available',
    )
  })

  it('does not allow a committed round to downgrade silently', () => {
    expect(() =>
      assertFrozenBeaconMode(
        evidence('B3_VERIFIED'),
        evidence('B2_ATTESTED'),
      ),
    ).toThrow('changed after round commitment')
  })

  it('uses explicit public labels', () => {
    expect(beaconModeLabel('B3_VERIFIED')).toBe('B3 — VERIFIED')
    expect(beaconModeLabel('B2_ATTESTED')).toBe('B2 — ATTESTED')
    expect(beaconModeLabel('B1_AUTHORIZED')).toBe('B1 — AUTHORIZED')
  })
})
