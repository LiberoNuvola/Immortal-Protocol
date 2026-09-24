import { describe, expect, it } from 'vitest'
import {
  assertExecutableLiquidityBoundToInputs,
  assertExecutableLiquidityObservation,
  type ExecutableLiquidityObservation,
} from './ExecutableLiquidityObservation'

const POOL = 'a'.repeat(64) + '#0'
const OTHER = 'b'.repeat(64) + '#1'

function observation(overrides: Partial<ExecutableLiquidityObservation> = {}): ExecutableLiquidityObservation {
  return {
    observationReference: 'pool-observation-1',
    observedAt: 1n,
    sourceInputReferences: [POOL],
    utxos: [{
      txHash: 'a'.repeat(64),
      index: 0,
      usdmValue: 400000n,
      spendable: true,
      ringFenced: false,
    }],
    declaredUsdmLiquidity: 400000n,
    ...overrides,
  }
}

describe('ExecutableLiquidityObservation source binding', () => {
  it('accepts an observation whose exact source UTxO is consumed', () => {
    expect(() => assertExecutableLiquidityBoundToInputs(
      observation(),
      [POOL, OTHER],
    )).not.toThrow()
  })

  it('rejects a source UTxO that is not consumed by the candidate transaction', () => {
    expect(() => assertExecutableLiquidityBoundToInputs(
      observation(),
      [OTHER],
    )).toThrow(/source input/)
  })

  it('rejects observed liquidity from a different UTxO than the declared Pool source', () => {
    expect(() => assertExecutableLiquidityObservation(
      observation({
        utxos: [{
          txHash: 'b'.repeat(64),
          index: 1,
          usdmValue: 400000n,
          spendable: true,
          ringFenced: false,
        }],
      }),
    )).toThrow(/not declared as a source input/)
  })

  it('rejects a declared source set that does not exactly match observed liquidity UTxOs', () => {
    expect(() => assertExecutableLiquidityObservation(
      observation({
        sourceInputReferences: [POOL, OTHER],
      }),
    )).toThrow(/exactly match/)
  })
})
