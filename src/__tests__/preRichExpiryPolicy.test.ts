import { describe, expect, it } from 'vitest'

import {
  assertExpiryIssuanceStateMatchesAuthoritative,
  crystallizeTicketExpiry,
  deriveCardanoIssueTimeAnchor,
  preRichExpiryPolicyV1,
  PRE_RICH_EXPIRY_MIN_HORIZON_MS,
  PRE_RICH_EXPIRY_MAX_HORIZON_MS,
  type PreRichExpiryIssuanceState,
  type PreRichExpiryPolicy,
} from '../../PRE-RICH/src/PreRichExpiryPolicy'

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
      minHorizonMs: 500n,
      maxHorizonMs: 2_000n,
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
      minHorizonMs: 1_000n,
      maxHorizonMs: 3_000n,
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
      minHorizonMs: 0n,
      maxHorizonMs: 2_000n,
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
      minHorizonMs: 0n,
      maxHorizonMs: 2_000n,
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
      minHorizonMs: 0n,
      maxHorizonMs: 2_000n,
      deriveHorizonMs: () => {
        calls += 1
        return BigInt(calls)
      },
    }

    expect(() => crystallizeTicketExpiry(policy, issuanceState, 1_000n)).toThrow(
      'expiry policy must be deterministic for a fixed issuance state',
    )
  })

  it('clamps PRE-RICH V1 below the 2-hour minimum', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'pre-rich-v1',
      policyVersion: 1n,
      minHorizonMs: 2n * 60n * 60n * 1000n,
      maxHorizonMs: 300n * 24n * 60n * 60n * 1000n,
      deriveHorizonMs: () => 1n,
    }

    const result = crystallizeTicketExpiry(policy, issuanceState, 0n)
    expect(result.horizonMs).toBe(2n * 60n * 60n * 1000n)
  })

  it('clamps PRE-RICH V1 above the 300-day maximum', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'pre-rich-v1',
      policyVersion: 1n,
      minHorizonMs: 2n * 60n * 60n * 1000n,
      maxHorizonMs: 300n * 24n * 60n * 60n * 1000n,
      deriveHorizonMs: () => 301n * 24n * 60n * 60n * 1000n,
    }

    const result = crystallizeTicketExpiry(policy, issuanceState, 0n)
    expect(result.horizonMs).toBe(300n * 24n * 60n * 60n * 1000n)
  })

  it('clamps the concrete PRE-RICH V1 policy within 2h..300d', () => {
    const result = crystallizeTicketExpiry(preRichExpiryPolicyV1, issuanceState, 0n)
    expect(result.horizonMs).toBeLessThanOrEqual(PRE_RICH_EXPIRY_MAX_HORIZON_MS)
    expect(result.horizonMs).toBeGreaterThanOrEqual(PRE_RICH_EXPIRY_MIN_HORIZON_MS)
  })

  it('uses the PRE-RICH V1 reserve-pressure ratio with integer division', () => {
    const state = {
      ...issuanceState,
      eev: 10_000n,
      unresolvedReserve: 1_000n,
    }

    const result = crystallizeTicketExpiry(preRichExpiryPolicyV1, state, 0n)

    expect(result.horizonMs).toBe(
      PRE_RICH_EXPIRY_MAX_HORIZON_MS / 11n,
    )
    expect(result.horizonMs).toBeGreaterThanOrEqual(PRE_RICH_EXPIRY_MIN_HORIZON_MS)
  })

  it('clamps a highly stressed reserve-pressure result to the declared 2-hour floor', () => {
    const state = {
      ...issuanceState,
      eev: 1n,
      unresolvedReserve: 10_000n,
    }

    const result = crystallizeTicketExpiry(preRichExpiryPolicyV1, state, 0n)

    expect(result.horizonMs).toBe(PRE_RICH_EXPIRY_MIN_HORIZON_MS)
  })

  it('preserves a zero horizon as an exact policy result', () => {
    const policy: PreRichExpiryPolicy = {
      policyId: 'zero-fixture',
      policyVersion: 1n,
      minHorizonMs: 0n,
      maxHorizonMs: 2_000n,
      deriveHorizonMs: () => 0n,
    }

    const result = crystallizeTicketExpiry(policy, issuanceState, 7_000n)
    expect(result.expiresAt).toBe(7_000n)
  })
  it('accepts only an expiry issuance snapshot identical to authenticated admission and carrier state', () => {
    const authoritative: PreRichExpiryIssuanceState = {
      issuanceStateHash: 'authoritative-state-hash',
      economicEpoch: 13n,
      currentActiveClass: 4n,
      highestClassEverActivated: 5n,
      eev: 9007199254740993n,
      unresolvedReserve: 25n,
      unresolvedTicketCount: 2n,
    }

    expect(() =>
      assertExpiryIssuanceStateMatchesAuthoritative(
        { ...authoritative },
        authoritative,
      ),
    ).not.toThrow()

    const fields: (keyof PreRichExpiryIssuanceState)[] = [
      'issuanceStateHash',
      'economicEpoch',
      'currentActiveClass',
      'highestClassEverActivated',
      'eev',
      'unresolvedReserve',
      'unresolvedTicketCount',
    ]

    for (const field of fields) {
      const mismatched = { ...authoritative }
      if (field === 'issuanceStateHash') mismatched[field] = 'different-state-hash'
      else mismatched[field] = (authoritative[field] as bigint) + 1n
      expect(() =>
        assertExpiryIssuanceStateMatchesAuthoritative(mismatched, authoritative),
      ).toThrow(`expiry issuance state does not match authoritative admission/carrier field: ${field}`)
    }
  })

  it('uses the selected Cardano slot start as the conservative expiry anchor', () => {
    const anchor = deriveCardanoIssueTimeAnchor(
      10_750n,
      20,
      {
        unixTimeToSlot: (unixTimeMs) => Math.floor(unixTimeMs / 1_000),
        slotToUnixTime: (slot) => slot * 1_000,
      },
    )

    expect(anchor.validityStartSlot).toBe(10)
    expect(anchor.issuedAt).toBe(10_000n)
    expect(anchor.issuedAt).toBeLessThanOrEqual(10_750n)
  })

  it('rejects an issuance slot at or beyond the authenticated upper bound', () => {
    expect(() =>
      deriveCardanoIssueTimeAnchor(
        10_750n,
        10,
        {
          unixTimeToSlot: (unixTimeMs) => Math.floor(unixTimeMs / 1_000),
          slotToUnixTime: (slot) => slot * 1_000,
        },
      ),
    ).toThrow('Issue validity-start slot must precede the authenticated validity upper bound')
  })

  it('rejects a non-reversible Lucid slot/time conversion', () => {
    expect(() =>
      deriveCardanoIssueTimeAnchor(
        10_750n,
        20,
        {
          unixTimeToSlot: (unixTimeMs) => Math.floor(unixTimeMs / 1_000),
          slotToUnixTime: (slot) => slot * 1_000 + 1,
        },
      ),
    ).toThrow('Lucid Issue slot/time conversion is not reversible at the selected slot')
  })

})