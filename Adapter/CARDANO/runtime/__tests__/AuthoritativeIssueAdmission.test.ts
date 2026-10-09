import { describe, expect, it } from 'vitest'
import { resolveAuthoritativeIssueAdmission } from '../AuthoritativeIssueAdmission'
import type { EconomicAdmissionWitness } from '../EconomicAdmission'

const hash = 'a'.repeat(64)
const poolRef = 'b'.repeat(64) + '#0'
const counterRef = 'c'.repeat(64) + '#0'
const controlRef = 'e'.repeat(64) + '#3'

function protectedCapitalProvenance() {
  return {
    sourceReference: 'cardano:tx/' + 'd'.repeat(64) + '#2',
    components: {
      crystallizedLiabilities: 10n,
      worstCaseExposure: 50n,
      safetyCapital: 20n,
      reserveProtection: 30n,
      lockedJackpot: 40n,
      mandatoryFutureCosts: 50n,
    },
    accountingInputs: {
      unresolvedReserve: 1n,
      unresolvedTicketCount: 1n,
    },
    total: 200n,
  }
}

function viabilityCertificate() {
  const proofs = Object.fromEntries(['VC1','VC2','VC3','VC4','VC5','VC6'].map((key, i) => [
    key,
    { reference: 'proof://' + key, digest: String(i + 1).repeat(64).slice(0,64) },
  ]))
  const evidence = Object.fromEntries(['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10'].map((key, i) => [
    key,
    { reference: 'evidence://' + key, digest: String((i + 1) % 10).repeat(64).slice(0,64) },
  ]))
  return {
    id: 'pre-rich-kc-v1',
    version: '1',
    modelReference: 'model://pre-rich-v1',
    characteristicPredicateReference: 'chi://pre-rich-v1',
    witnessSelectorReference: 'wit://pre-rich-v1',
    boundsReference: 'bounds://pre-rich-v1',
    proofs,
    evidence,
    digest: '9'.repeat(64),
    deploymentBinding: {
      network: 'cardano-preprod',
      carrierStateReference: 'cardano:tx/' + 'd'.repeat(64) + '#2',
      stateHash: hash,
      eevSnapshotReference: 'snapshot://issue/1',
      protectedCapitalSourceReference: 'cardano:tx/' + 'd'.repeat(64) + '#2',
    },
  }
}

function eevQualification() {
  return {
    status: 'qualified' as const,
    contractVersion: '3.0.0',
    deploymentApproval: {
      status: 'DEPLOYMENT_APPROVED' as const,
      candidateId: 'test-eev-v1',
      sourceSetId: 'test-source-set-v1',
      profileVersion: 'test-eev-profile-v1',
      evidenceHash: 'e'.repeat(64),
      qualifiedProperties: ['EV1','EV2','EV3','EV4','EV5','EV6','EV7'],
      excludedProperties: [],
      testSuiteVersion: 'test-suite-v1',
      failureMatrixVersion: 'failure-matrix-v1',
      validFrom: '2026-10-07T00:00:00Z',
      validUntilOrRevalidationRule: 'revalidate-on-source-or-profile-change',
    },
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

function witness(): EconomicAdmissionWitness & {
  v3CarrierBinding: { carrierStateReference: string; candidateState: any }
  eevQualification: ReturnType<typeof eevQualification>
  protectedCapitalProvenance: ReturnType<typeof protectedCapitalProvenance>
  viabilityCertificate: ReturnType<typeof viabilityCertificate>
} {
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
    counterInputReference: counterRef,
    controlStateReference: controlRef,
    preEEV: 100n,
    issueClassId: 0n,
    issuePrice: 1n,
    truthVerified: true,
    eevFresh: true,
    obligationsComplete: true,
    allOmegaSuccessorsCertified: true,
    eevQualification: eevQualification(),
    protectedCapitalProvenance: protectedCapitalProvenance(),
    viabilityCertificate: viabilityCertificate(),
    v3CarrierBinding: {
      carrierStateReference: 'cardano:tx/' + 'd'.repeat(64) + '#2',
      candidateState: {
        crystallizedLiabilities: '10',
        unresolvedReserve: '1',
        unresolvedTicketCount: '1',
        safetyCapital: '20',
        reserveProtection: '30',
        mandatoryFutureCosts: '50',
        classes: [],
        control: { currentActiveClass: '0', highestClassEverActivated: '0' },
        jackpot: { lockedAmount: '40', threshold: '0', status: 'inactive', cycle: '0' },
      },
    },
  }
}

const inputs = {
  counterInputReference: counterRef,
  controlStateReference: controlRef,
  poolInputReference: poolRef,
  liquiditySourceReferences: [poolRef],
  poolUsdmValue: 100n,
  classId: 0n,
  price: 1n,
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
    )).rejects.toThrow(/EV6/)
  })
})
