const { describe, expect, it } = require('vitest')
const { createPreprodIssueObservationProducer } = require('./preprodIssueObservationProvider')

const counter = 'a'.repeat(64) + '#0'
const pool = 'b'.repeat(64) + '#1'

const decisionInput = {
  preState: { crystallizedLiabilities: '0' },
  classId: '0',
  price: '1',
  preEEV: '4000',
  candidateEEV: '4001',
  availableExecutableLiquidity: '500',
  requiredImmediateLiquidity: '100',
  truthVerified: true,
  eevFresh: true,
  obligationsComplete: true,
  allOmegaSuccessorsCertified: true,
  decisionReference: 'decision:preprod:1',
  observationReference: 'preprod:obs:1',
}

describe('Preprod Issue observation producer', () => {
  it('passes an authoritative observation through without economic recalculation', async () => {
    const producer = createPreprodIssueObservationProducer({
      readObservation: async inputs => ({
        ...inputs,
        observationReference: 'preprod:obs:1',
        observedAt: '123',
        decisionInput,
      }),
    })

    await expect(
      producer({
        counterInputReference: counter,
        poolInputReference: pool,
        poolUsdmValue: '500',
      }),
    ).resolves.toEqual({
      decisionInput,
      observationReference: 'preprod:obs:1',
      observedAt: '123',
    })
  })

  it('rejects a Counter reference mismatch', async () => {
    const producer = createPreprodIssueObservationProducer({
      readObservation: async inputs => ({
        ...inputs,
        counterInputReference: 'c'.repeat(64) + '#0',
        poolInputReference: pool,
        poolUsdmValue: '500',
        observationReference: 'preprod:obs:1',
        observedAt: '123',
        decisionInput,
      }),
    })

    await expect(
      producer({
        counterInputReference: counter,
        poolInputReference: pool,
        poolUsdmValue: '500',
      }),
    ).rejects.toThrow('Counter reference mismatch')
  })

  it('rejects a Pool valuation mismatch', async () => {
    const producer = createPreprodIssueObservationProducer({
      readObservation: async inputs => ({
        ...inputs,
        counterInputReference: counter,
        poolInputReference: pool,
        poolUsdmValue: '499',
        observationReference: 'preprod:obs:1',
        observedAt: '123',
        decisionInput: {
          ...decisionInput,
          availableExecutableLiquidity: '499',
        },
      }),
    })

    await expect(
      producer({
        counterInputReference: counter,
        poolInputReference: pool,
        poolUsdmValue: '500',
      }),
    ).rejects.toThrow('Pool valuation mismatch')
  })

  it('rejects a decision bound to another observation', async () => {
    const producer = createPreprodIssueObservationProducer({
      readObservation: async inputs => ({
        ...inputs,
        observationReference: 'preprod:obs:1',
        observedAt: '123',
        decisionInput: {
          ...decisionInput,
          observationReference: 'preprod:obs:other',
        },
      }),
    })

    await expect(
      producer({
        counterInputReference: counter,
        poolInputReference: pool,
        poolUsdmValue: '500',
      }),
    ).rejects.toThrow('does not match authoritative observation')
  })

  it('rejects incomplete decision input instead of filling fields', async () => {
    const producer = createPreprodIssueObservationProducer({
      readObservation: async inputs => ({
        ...inputs,
        observationReference: 'preprod:obs:1',
        observedAt: '123',
        decisionInput: {
          preState: {},
          classId: '0',
        },
      }),
    })

    await expect(
      producer({
        counterInputReference: counter,
        poolInputReference: pool,
        poolUsdmValue: '500',
      }),
    ).rejects.toThrow('IssueDecisionInput field price is missing')
  })
})
