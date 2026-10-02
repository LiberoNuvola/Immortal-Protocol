const { describe, expect, it } = require('vitest')
const { buildPreprodIssueDecisionContext } = require('./preprodIssueObservation')

const counter = {
  txHash: 'a'.repeat(64),
  outputIndex: 0,
  datum: { fields: [0n] },
}

const pool = {
  txHash: 'b'.repeat(64),
  outputIndex: 1,
  assets: { 'c'.repeat(64) + '706f6f6c': 1n },
  datum: {
    fields: [500n, 100n, 0n, 0n, 0n, 0n, { index: 0 }, '']
  },
}

function lucidWith(counterAddress, poolAddress) {
  return {
    async utxosAt(address) {
      if (address === counterAddress) return [counter]
      if (address === poolAddress) return [pool]
      return []
    },
  }
}

describe('Preprod Issue observation boundary', () => {
  it('binds exact Counter/Pool refs and delegates V3 state to the authoritative producer', async () => {
    const context = await buildPreprodIssueDecisionContext({
      lucid: lucidWith('counter', 'pool'),
      counterAddress: 'counter',
      b1PrizePoolAddress: 'pool',
      poolTokenUnit: 'c'.repeat(64) + '706f6f6c',
      poolUsdmValue: 500n,
      observedAt: 123n,
      authoritativeStateProducer: async input => {
        expect(input.counterInputReference).toBe('a'.repeat(64) + '#0')
        expect(input.poolInputReference).toBe('b'.repeat(64) + '#1')
        expect(input.poolState.totalLiquidity).toBe(500n)
        return {
          observationReference: 'observation:preprod:1',
          decisionInput: { authoritative: true },
        }
      },
    })

    expect(context.runtimeInputs).toEqual({
      counterInputReference: 'a'.repeat(64) + '#0',
      poolInputReference: 'b'.repeat(64) + '#1',
      liquiditySourceReferences: ['b'.repeat(64) + '#1'],
      poolUsdmValue: 500n,
    })
    expect(context.decisionInput).toEqual({ authoritative: true })
  })

  it('fails closed when the authoritative producer returns no IssueDecisionInput', async () => {
    await expect(
      buildPreprodIssueDecisionContext({
        lucid: lucidWith('counter', 'pool'),
        counterAddress: 'counter',
        b1PrizePoolAddress: 'pool',
        poolTokenUnit: 'c'.repeat(64) + '706f6f6c',
        poolUsdmValue: 500n,
        authoritativeStateProducer: async () => ({
          observationReference: 'observation:preprod:missing-input',
        }),
      }),
    ).rejects.toThrow('no IssueDecisionInput')
  })

  it('fails closed on ambiguous Counter state', async () => {
    const lucid = {
      async utxosAt(address) {
        if (address === 'counter') return [counter, counter]
        if (address === 'pool') return [pool]
        return []
      },
    }

    await expect(
      buildPreprodIssueDecisionContext({
        lucid,
        counterAddress: 'counter',
        b1PrizePoolAddress: 'pool',
        poolTokenUnit: 'c'.repeat(64) + '706f6f6c',
        poolUsdmValue: 500n,
        authoritativeStateProducer: async () => ({}),
      }),
    ).rejects.toThrow('Counter observation is ambiguous')
  })
})
