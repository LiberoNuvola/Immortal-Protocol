import { describe, expect, it } from 'vitest'
import { resolveAuthoritativeIssueAdmission } from '../AuthoritativeIssueAdmission'
import type { EconomicAdmissionWitness } from '../EconomicAdmission'

const hash = 'a'.repeat(64)
const poolRef = 'b'.repeat(64) + '#0'
const counterRef = 'c'.repeat(64) + '#0'

function eevQualification() {
  return {
    status: 'qualified' as const,
    contractVersion: '3.0.0',
    sourceReference: 'source://test-eev',
    verificationReference: 'verify://test-eev',
    derivationVersion: 'test-eev-v1',
    snapshotReference: 'snapshot://issue/1',
    evidence: {
      EV1: { reference: 'evidence://EV1', digest: '1'.repeat(64) },
      EV2: { reference: 'evidence://EV2', digest: '2'.repeat(64) },
      EV3: { reference: 'evidence://EV3', digest: '3'.repeat(64) },
      EV4: { reference: 'evidence://EV4', digest: '4'.repeat(64) },
      EV5: { reference: 'evidence://EV5', digest: '5'.repeat(64) },
      EV6: { reference: 'evidence://EV6', digest: '6'.repeat(64) },
      EV7: { reference: 'evidence://EV7', digest: '7'.repeat(64) },
    },
  }
}

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
    eevQualification: eevQualification(),
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

describe('qualified EEV certificate boundary', () => {
  it('rejects a witness without EV1-EV7 qualification', async () => {
    const bad = witness()
    delete (bad as unknown as { eevQualification?: unknown }).eevQualification
    await expect(resolveAuthoritativeIssueAdmission(
      { id: 'test-authority', version: '1', provider: async () => bad },
      inputs, classEvidence,
    )).rejects.toThrow(/qualified EEV certificate/)
  })

  it('rejects incomplete EV evidence', async () => {
    const bad = witness()
    ;(bad as any).eevQualification.evidence.EV6.digest = 'x'
    await expect(resolveAuthoritativeIssueAdmission(
      { id: 'test-authority', version: '1', provider: async () => bad },
      inputs, classEvidence,
    )).rejects.toThrow(/incomplete EEV evidence: EV6/)
  })
})
