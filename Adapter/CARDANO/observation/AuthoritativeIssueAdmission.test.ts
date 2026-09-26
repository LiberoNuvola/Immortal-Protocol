import { describe, expect, it } from 'vitest'
import {
  createAuthoritativeIssueAdmissionProvider,
  type AuthoritativeIssueAdmissionDecision,
} from './AuthoritativeIssueAdmission'

const TX = 'ab'.repeat(32)
const COUNTER = TX + '#0'
const POOL = TX + '#1'

function decision(
  overrides: Partial<AuthoritativeIssueAdmissionDecision> = {},
): AuthoritativeIssueAdmissionDecision {
  return {
    gateVersion: 'economic-gate-v1',
    decisionReference: 'decision:issue:1',
    authoritativeObservationReference: 'observation:issue:1',
    stateHash: '01'.repeat(32),
    actionFingerprint: '02'.repeat(32),
    postStateHash: '03'.repeat(32),
    eev: 1000n,
    executableLiquidityObservation: {
      observationReference: 'observation:issue:1',
      observedAt: 100n,
      sourceInputReferences: [POOL],
      utxos: [{
        txHash: TX,
        index: 1,
        usdmValue: 500n,
        spendable: true,
        ringFenced: false,
      }],
      declaredUsdmLiquidity: 500n,
    },
    authenticatedPoolInputReference: POOL,
    authenticatedPoolUsdmValue: 500n,
    requiredImmediateLiquidity: 100n,
    ...overrides,
  }
}

describe('Authoritative Issue admission producer', () => {
  it('converts one authoritative decision into a bound Issue witness', async () => {
    const provider = createAuthoritativeIssueAdmissionProvider(async () =>
      decision(),
    )

    const witness = await provider({
      counterInputReference: COUNTER,
      poolInputReference: POOL,
      liquiditySourceReferences: [POOL],
      poolUsdmValue: 500n,
    })

    expect(witness.actionClass).toBe('Issue')
    expect(witness.authenticatedPoolInputReference).toBe(POOL)
    expect(witness.authenticatedPoolUsdmValue).toBe(500n)
  })

  it('fails closed when the authoritative decision names another Pool input', async () => {
    const otherPool = 'cd'.repeat(32) + '#9'
    const provider = createAuthoritativeIssueAdmissionProvider(async () =>
      decision({
        authenticatedPoolInputReference: otherPool,
      }),
    )

    await expect(
      provider({
        counterInputReference: COUNTER,
        poolInputReference: POOL,
        liquiditySourceReferences: [POOL],
        poolUsdmValue: 500n,
      }),
    ).rejects.toThrow()
  })

  it('fails closed when declared liquidity differs from the authenticated Pool value', async () => {
    const provider = createAuthoritativeIssueAdmissionProvider(async () =>
      decision({
        authenticatedPoolUsdmValue: 600n,
      }),
    )

    await expect(
      provider({
        counterInputReference: COUNTER,
        poolInputReference: POOL,
        liquiditySourceReferences: [POOL],
        poolUsdmValue: 500n,
      }),
    ).rejects.toThrow()
  })
})
