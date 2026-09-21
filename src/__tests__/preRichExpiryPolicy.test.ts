import { describe, expect, it } from 'vitest'

import {
  crystallizeTicketExpiry,
  type PreRichExpiryIssuanceState,
  type PreRichExpiryPolicy,
} from '../../PRE-RICH/profile/PreRichExpiryPolicy'

const issuanceState: PreRichExpiryIssuanceState = {
  issuanceStateHash: 'fixture-state-hash',
  economicEpoch: 12n,
  currentActiveClass: 4n,
  highestClassEverActivated: 4n,
  eev: 10_000n,
  unresolvedReserve: 1_000n,
  unresolvedTicketCount: 100n,
}

describe('PRE-RICH expiry policy boundary', () => {
  it('crystallizes a deterministic state-derived horizon', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'fixture-policy',
      policyVersion: 1n,
      deriveHorizonMs: (state) => 1_000n + state.currentActiveClass * 100n,
    }

    const result = crystallizeTicketExpiry(policy, issuanceState, 5_000n)

    expect(result.horizonMs).toBe(1_400n)
    expect(result.issuedAt).toBe(5_000n)
    expect(result.expiresAt).toBe(6_400n)
    expect(result.policyId).toBe('fixture-policy')
    expect(result.policyVersion).toBe(1n)
    expect(result.issuanceStateHash).toBe('fixture-state-hash')
  })

  it('allows a DApp policy to react to issuance state without changing past tickets', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'state-reactive-fixture',
      policyVersion: 2n,
      deriveHorizonMs: (state) => state.eev + state.unresolvedReserve,
    }

    const firstState = { ...issuanceState, eev: 2_000n, unresolvedReserve: 500n }
    const laterState = { ...issuanceState, eev: 900n, unresolvedReserve: 100n }
    const first = crystallizeTicketExpiry(policy, firstState, 1_000n)
    const later = crystallizeTicketExpiry(policy, laterState, 2_000n)

    expect(first.expiresAt).toBe(3_500n)
    expect(later.expiresAt).toBe(3_000n)
    expect(first.expiresAt).not.toBe(later.expiresAt)
  })

  it('rejects a negative horizon', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'negative-fixture',
      policyVersion: 1n,
      deriveHorizonMs: () => -1n,
    }

    expect(() => crystallizeTicketExpiry(policy, issuanceState, 1_000n)).toThrow(
      'expiry horizon must be non-negative',
    )
  })

  it('rejects a missing issuance-state identity', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'identity-fixture',
      policyVersion: 1n,
      deriveHorizonMs: () => 1n,
    }

    expect(() =>
      crystallizeTicketExpiry(
        policy,
        { ...issuanceState, issuanceStateHash: '' },
        1_000n,
      ),
    ).toThrow('issuanceStateHash is required')
  })

  it('rejects a policy that is not deterministic for the same issuance state', () => {
    let calls = 0
    const policy: PreRichExpiryPolicy = {
      policyId: 'non-deterministic-fixture',
      policyVersion: 1n,
      deriveHorizonMs: () => {
        calls += 1
        return BigInt(calls)
      },
    }

    expect(() => crystallizeTicketExpiry(policy, issuanceState, 1_000n)).toThrow(
      'expiry policy must be deterministic for a fixed issuance state',
    )
  })

  it('preserves a zero horizon as an exact policy result', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'zero-fixture',
      policyVersion: 1n,
      deriveHorizonMs: () => 0n,
    }

    const result = crystallizeTicketExpiry(policy, issuanceState, 7_000n)
    expect(result.expiresAt).toBe(7_000n)
  })
})