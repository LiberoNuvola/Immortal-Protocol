import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertExecutableLiquidityObservation,
  assertExecutableLiquidityBoundToInputs,
  type ExecutableLiquidityObservation,
} from '../../Adapter/CARDANO/observation/ExecutableLiquidityObservation'
import { assertEconomicAdmission, type EconomicAdmissionWitness } from '../../Adapter/CARDANO/runtime/EconomicAdmission'

const TX_A = 'a'.repeat(64)
const TX_B = 'b'.repeat(64)

function observation(): ExecutableLiquidityObservation {
  return {
    observationReference: 'obs-1',
    observedAt: 1n,
    sourceInputReferences: [TX_A + '#0'],
    utxos: [{
      txHash: TX_A,
      index: 0,
      usdmValue: 100n,
      spendable: true,
      ringFenced: false,
    }],
    declaredUsdmLiquidity: 100n,
  }
}

function witness(): EconomicAdmissionWitness {
  return {
    gateVersion: 'gate-v1',
    admitted: true,
    decisionReference: 'decision-1',
    authoritativeObservationReference: 'obs-1',
    stateHash: 'c'.repeat(64),
    eev: 100n,
    executableLiquidityObservation: observation(),
    requiredImmediateLiquidity: 100n,
  }
}

describe('Executable liquidity input provenance', () => {
  it('accepts an observation whose source and UTxO are consumed inputs', () => {
    assert.doesNotThrow(() =>
      assertExecutableLiquidityBoundToInputs(
        observation(),
        [TX_A + '#0', TX_B + '#1'],
      ),
    )
  })

  it('rejects a stale source input that is not consumed by the candidate tx', () => {
    assert.throws(
      () => assertExecutableLiquidityBoundToInputs(observation(), [TX_B + '#1']),
      /not a consumed candidate input/,
    )
  })

  it('rejects an observed UTxO when only the declared source reference is present', () => {
    const obs = observation()
    obs.utxos[0] = { ...obs.utxos[0], txHash: TX_B }
    assert.throws(
      () => assertExecutableLiquidityBoundToInputs(obs, [TX_A + '#0', TX_B + '#1']),
      /not declared as a source input|not a consumed candidate input/,
    )
  })

  it('rejects duplicated or mismatched physical liquidity', () => {
    const dup = observation()
    dup.utxos = [dup.utxos[0], { ...dup.utxos[0] }]
    assert.throws(() => assertExecutableLiquidityObservation(dup), /duplicate/)

    const mismatch = observation()
    mismatch.declaredUsdmLiquidity = 101n
    assert.throws(() => assertExecutableLiquidityObservation(mismatch), /does not match/)
  })
})

describe('Economic admission provenance', () => {
  it('accepts matching economic action and liquidity source inputs', () => {
    assert.doesNotThrow(() =>
      assertEconomicAdmission(
        witness(),
        [TX_A + '#0', TX_B + '#1'],
        [TX_A + '#0'],
      ),
    )
  })

  it('rejects a source reference that differs from the economic action source', () => {
    assert.throws(
      () => assertEconomicAdmission(
        witness(),
        [TX_A + '#0'],
        [TX_B + '#1'],
      ),
      /source inputs do not match economic action source/,
    )
  })

  it('rejects a valid observation that is not part of candidate inputs', () => {
    assert.throws(
      () => assertEconomicAdmission(
        witness(),
        [TX_B + '#1'],
        [TX_A + '#0'],
      ),
      /not a consumed candidate input/,
    )
  })
})
