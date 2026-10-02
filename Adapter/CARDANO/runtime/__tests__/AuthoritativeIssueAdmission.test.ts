import { describe, expect, it } from 'vitest'
import { resolveAuthoritativeIssueAdmission } from '../AuthoritativeIssueAdmission'
import type { EconomicAdmissionWitness } from '../EconomicAdmission'

const hash = 'a'.repeat(64)
const poolRef = 'b'.repeat(64) + '#0'
const counterRef = 'c'.repeat(64) + '#0'

function witness(): EconomicAdmissionWitness {
  return {
    gateVersion: 'economic-gate-v1', admitted: true,
    decisionReference: 'decision://issue/1',
    authoritativeObservationReference: 'obs://issue/1',
    stateHash: hash, actionClass: 'Issue', actionFingerprint: hash,
    postStateHash: hash, eev: 100n,
    executableLiquidityObservation: {
      observationReference: 'obs://issue/1', observedAt: 1n,
      sourceInputReferences: [poolRef],
      utxos: [{ txHash: 'b'.repeat(64), index: 0, usdmValue: 100n, spendable: true, ringFenced: false }],
      declaredUsdmLiquidity: 100n,
    },
    authenticatedPoolInputReference: poolRef,
    authenticatedPoolUsdmValue: 100n,
    requiredImmediateLiquidity: 1n,
  }
}

const inputs = {
  counterInputReference: counterRef,
  poolInputReference: poolRef,
  liquiditySourceReferences: [poolRef],
  poolUsdmValue: 100n,
}
const classEvidence = {
  classId: 0n, priceReferenceUnits: 1n,
  currentActiveClass: 0n, highestClassEverActivated: 0n,
  issued: 0n, cap: 100n,
}

describe('AuthoritativeIssueAdmission', () => {
  it('accepts only a producer witness bound to the exact runtime pool', async () => {
    const result = await resolveAuthoritativeIssueAdmission(
      { id: 'test-authority', version: '1', provider: async () => witness() },
      inputs, classEvidence,
    )
    expect(result.actionClass).toBe('Issue')
  })

  it('rejects a witness from the wrong action class', async () => {
    const bad = witness()
    bad.actionClass = 'Reveal'
    await expect(resolveAuthoritativeIssueAdmission(
      { id: 'test-authority', version: '1', provider: async () => bad },
      inputs, classEvidence,
    )).rejects.toThrow(/actionClass/)
  })

  it('rejects a witness whose liquidity source is not the exact Pool input', async () => {
    const bad = witness()
    bad.executableLiquidityObservation.sourceInputReferences = [counterRef]
    await expect(resolveAuthoritativeIssueAdmission(
      { id: 'test-authority', version: '1', provider: async () => bad },
      inputs, classEvidence,
    )).rejects.toThrow()
  })
})
