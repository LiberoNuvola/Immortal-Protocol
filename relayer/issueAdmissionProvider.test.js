const { describe, expect, it } = require('vitest')
const {
  produceAuthoritativeIssueAdmission,
  createAuthoritativeIssueAdmissionProvider,
} = require('./issueAdmissionProvider')

const pool = 'b'.repeat(64) + '#1'
const counter = 'a'.repeat(64) + '#0'

const decisionInput = {
  preState: {},
  classId: '0',
  price: '1',
  preEEV: '1000',
  candidateEEV: '1001',
  availableExecutableLiquidity: '500',
  requiredImmediateLiquidity: '100',
  truthVerified: true,
  eevFresh: true,
  obligationsComplete: true,
  allOmegaSuccessorsCertified: true,
  decisionReference: 'decision:issue:1',
  observationReference: 'observation:issue:1',
}

const runtimeInputs = {
  counterInputReference: counter,
  poolInputReference: pool,
  liquiditySourceReferences: [pool],
  poolUsdmValue: '500',
}

const observedContext = {
  decisionInput,
  observationReference: 'observation:issue:1',
  observedAt: '123',
}

const admittedDecision = {
  admitted: true,
  decision: {
    actionClass: 'Issue',
    decisionReference: 'decision:issue:1',
    authoritativeObservationReference: 'observation:issue:1',
    stateHash: '1'.repeat(64),
    postStateHash: '2'.repeat(64),
    actionFingerprint: '3'.repeat(64),
    preEEV: '1000',
    candidateEEV: '1001',
    availableExecutableLiquidity: '500',
    requiredImmediateLiquidity: '100',
  },
}

describe('Issue admission executable bridge', () => {
  it('executes the canonical producer and returns an input-bound witness', async () => {
    const runner = async input => {
      expect(input).toEqual(decisionInput)
      return admittedDecision
    }

    const witness = await produceAuthoritativeIssueAdmission({
      decisionInput,
      runtimeInputs: {
        ...runtimeInputs,
        ...observedContext,
      },
      runner,
    })

    expect(witness).toMatchObject({
      admitted: true,
      actionClass: 'Issue',
      authenticatedPoolInputReference: pool,
      authenticatedPoolUsdmValue: 500n,
      requiredImmediateLiquidity: 100n,
    })
    expect(witness.executableLiquidityObservation.utxos[0]).toMatchObject({
      txHash: 'b'.repeat(64),
      index: 1,
      usdmValue: 500n,
    })
  })

  it('adapts an authoritative observation producer to the mint provider contract', async () => {
    const runner = async input => {
      expect(input).toEqual(decisionInput)
      return admittedDecision
    }

    const buildDecisionContext = async inputs => {
      expect(inputs).toEqual(runtimeInputs)
      return observedContext
    }

    const provider = createAuthoritativeIssueAdmissionProvider({
      buildDecisionContext,
      runner,
    })

    const witness = await provider(runtimeInputs)

    expect(witness.authenticatedPoolInputReference).toBe(pool)
    expect(witness.authoritativeObservationReference).toBe('observation:issue:1')
  })

  it('fails closed when the decision is bound to another observation', async () => {
    const runner = async () => ({
      ...admittedDecision,
      decision: {
        ...admittedDecision.decision,
        authoritativeObservationReference: 'observation:other',
      },
    })

    await expect(
      produceAuthoritativeIssueAdmission({
        decisionInput,
        runtimeInputs: {
          ...runtimeInputs,
          ...observedContext,
        },
        runner,
      }),
    ).rejects.toThrow('different observation reference')
  })

  it('fails closed when authoritative liquidity differs from Pool valuation', async () => {
    const runner = async () => ({
      ...admittedDecision,
      decision: {
        ...admittedDecision.decision,
        availableExecutableLiquidity: '499',
      },
    })

    await expect(
      produceAuthoritativeIssueAdmission({
        decisionInput,
        runtimeInputs: {
          ...runtimeInputs,
          ...observedContext,
        },
        runner,
      }),
    ).rejects.toThrow('does not match observed Pool valuation')
  })

  it('fails closed on malformed input references', async () => {
    await expect(
      produceAuthoritativeIssueAdmission({
        decisionInput,
        runtimeInputs: {
          ...runtimeInputs,
          ...observedContext,
          poolInputReference: 'not-a-utxo',
        },
        runner: async () => admittedDecision,
      }),
    ).rejects.toThrow('exact txHash#outputIndex reference')
  })
})
