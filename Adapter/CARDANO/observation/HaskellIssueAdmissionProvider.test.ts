
import { describe, expect, it } from 'vitest'
import { execPath } from 'node:process'
import { createHaskellIssueAdmissionProvider } from './HaskellIssueAdmissionProvider'

const counter = 'a'.repeat(64) + '#0'
const pool = 'b'.repeat(64) + '#1'
const carrier = 'c'.repeat(64) + '#2'
const control = 'e'.repeat(64) + '#3'
const observationReference = 'observation:issue:provider'
const decisionReference = 'decision:issue:provider'

function pc() {
  return {
    sourceReference: carrier,
    components: {
      crystallizedLiabilities: 1n,
      worstCaseExposure: 500n,
      safetyCapital: 2n,
      reserveProtection: 3n,
      lockedJackpot: 4n,
      mandatoryFutureCosts: 5n,
    },
    accountingInputs: { unresolvedReserve: 1n, unresolvedTicketCount: 1n },
    total: 515n,
  }
}

function eevQualification() {
  return {
    status: 'qualified' as const,
    contractVersion: '3.0.0',
    deploymentApproval: {
      status: 'DEPLOYMENT_APPROVED' as const,
      candidateId: 'candidate',
      sourceSetId: 'source-set',
      profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
      evidenceHash: 'd'.repeat(64),
      qualifiedProperties: ['EV1','EV2','EV3','EV4','EV5','EV6','EV7'],
      excludedProperties: [],
      testSuiteVersion: 'suite',
      failureMatrixVersion: 'matrix',
      validFrom: '2026-10-09T00:00:00Z',
      validUntilOrRevalidationRule: 'LIVE_UTXO_REVALIDATION',
    },
    sourceReference: 'cardano:preprod/utxo/' + pool,
    verificationReference: 'github-actions:run/test@' + 'e'.repeat(40),
    derivationVersion: 'direct-usdm-v1',
    snapshotReference: 'sha256:' + 'f'.repeat(64),
    evidence: Object.fromEntries(
      ['EV1','EV2','EV3','EV4','EV5','EV6','EV7'].map((key) => [
        key,
        { reference: 'repo:' + key, digest: '1'.repeat(64) },
      ]),
    ),
  }
}

function viabilityCertificate() {
  const refs = (prefix: string, keys: readonly string[]) =>
    Object.fromEntries(keys.map((key) => [
      key,
      { reference: prefix + key, digest: '2'.repeat(64) },
    ]))
  return {
    id: 'kc-test',
    version: '1',
    modelReference: 'model:test',
    characteristicPredicateReference: 'chi:test',
    witnessSelectorReference: 'wit:test',
    boundsReference: 'bounds:test',
    proofs: refs('proof:', ['VC1','VC2','VC3','VC4','VC5','VC6']),
    evidence: refs('evidence:', ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10']),
    digest: '3'.repeat(64),
    deploymentBinding: {
      network: 'cardano-preprod',
      carrierStateReference: carrier,
        controlStateReference: control,
      stateHash: '4'.repeat(64),
      eevSnapshotReference: 'sha256:' + 'f'.repeat(64),
      protectedCapitalSourceReference: carrier,
    },
  }
}

function producerScript() {
  const decision = {
    actionClass: 'Issue',
    action: 'Issue:0:1',
    stateHash: '4'.repeat(64),
    postStateHash: '5'.repeat(64),
    actionFingerprint: '6'.repeat(64),
    decisionReference,
    authoritativeObservationReference: observationReference,
    preEEV: '100',
    candidateEEV: '100',
    availableExecutableLiquidity: '100',
    requiredImmediateLiquidity: '0',
    truthVerified: true,
    eevFresh: true,
    obligationsComplete: true,
    allOmegaSuccessorsCertified: true,
    candidateState: {
      crystallizedLiabilities: '1',
      unresolvedReserve: '1',
      unresolvedTicketCount: '1',
      safetyCapital: '2',
      reserveProtection: '3',
      mandatoryFutureCosts: '5',
      classes: [],
      control: { currentActiveClass: '0', highestClassEverActivated: '0' },
      jackpot: { lockedAmount: '4', threshold: '0', status: 'inactive', cycle: '0' },
    },
    protectedCapitalProvenance: {
      sourceType: 'V3_PRESTATE_CANONICAL_HASKELL',
      components: {
        crystallizedLiabilities: '1',
        worstCaseExposure: '500',
        safetyCapital: '2',
        reserveProtection: '3',
        lockedJackpot: '4',
        mandatoryFutureCosts: '5',
      },
      accountingInputs: {
        unresolvedReserve: '1',
        unresolvedTicketCount: '1',
      },
      total: '515',
    },
  }
  const payload = JSON.stringify({ admitted: true, decision })
  return 'process.stdin.resume(); process.stdin.on("end",()=>process.stdout.write(' + JSON.stringify(payload) + '))'
}

describe('Haskell Issue admission provider', () => {
  it('binds Haskell decision coordinates and ProtectedCapital provenance', async () => {
    const eev = eevQualification()
    const certificate = viabilityCertificate()
    const protectedCapital = pc()

    const provider = createHaskellIssueAdmissionProvider({
      command: execPath,
      args: ['-e', producerScript()],
      observationSource: async () => ({
        decisionInput: {
          preState: {},
          classId: 0,
          price: 1,
          preEEV: 100,
          candidateEEV: 100,
          availableExecutableLiquidity: 100,
          requiredImmediateLiquidity: 0,
          truthVerified: true,
          eevFresh: true,
          obligationsComplete: true,
          allOmegaSuccessorsCertified: true,
          decisionReference,
          observationReference,
        },
        decisionReference,
        observationReference,
        poolInputReference: pool,
        poolUsdmValue: 100n,
        liquiditySourceReferences: [pool],
        carrierStateReference: carrier,
        controlStateReference: control,
        controlStateReference: control,
        eevQualification: eev,
        protectedCapitalProvenance: protectedCapital,
        viabilityCertificate: certificate,
        carrierBindingSignature: 'a'.repeat(128),
        observedAt: 1000n,
      }),
    })

    const witness = await provider({
      counterInputReference: counter,
      poolInputReference: pool,
      liquiditySourceReferences: [pool],
      poolUsdmValue: 100n,
      classId: 0n,
      price: 1n,
      carrierStateReference: carrier,
        controlStateReference: control,
    })

    expect(witness.actionClass).toBe('Issue')
    expect(witness.counterInputReference).toBe(counter)
    expect(witness.preEEV).toBe(100n)
    expect(witness.issueClassId).toBe(0n)
    expect(witness.issuePrice).toBe(1n)
    expect(witness.truthVerified).toBe(true)
    expect(witness.eevFresh).toBe(true)
    expect(witness.obligationsComplete).toBe(true)
    expect(witness.allOmegaSuccessorsCertified).toBe(true)
    expect(witness.controlStateReference).toBe(control)
    expect(witness.protectedCapitalProvenance.total).toBe(515n)
    expect(witness.protectedCapitalProvenance.sourceReference).toBe(carrier)
    expect(witness.carrierAuthoritySignature).toBe('a'.repeat(128))
  })

  it('rejects Haskell ProtectedCapital that disagrees with the authority source', async () => {
    const eev = eevQualification()
    const certificate = viabilityCertificate()
    const bad = pc()
    bad.components.safetyCapital = 99n

    const provider = createHaskellIssueAdmissionProvider({
      command: execPath,
      args: ['-e', producerScript()],
      observationSource: async () => ({
        decisionInput: {
          preState: {},
          classId: 0,
          price: 1,
          preEEV: 100,
          candidateEEV: 100,
          availableExecutableLiquidity: 100,
          requiredImmediateLiquidity: 0,
          truthVerified: true,
          eevFresh: true,
          obligationsComplete: true,
          allOmegaSuccessorsCertified: true,
          decisionReference,
          observationReference,
        },
        decisionReference,
        observationReference,
        poolInputReference: pool,
        poolUsdmValue: 100n,
        liquiditySourceReferences: [pool],
        carrierStateReference: carrier,
        controlStateReference: control,
        eevQualification: eev,
        protectedCapitalProvenance: bad,
        viabilityCertificate: certificate,
        carrierBindingSignature: 'a'.repeat(128),
        observedAt: 1000n,
      }),
    })

    await expect(
      provider({
        counterInputReference: counter,
        poolInputReference: pool,
        liquiditySourceReferences: [pool],
        poolUsdmValue: 100n,
        classId: 0n,
        price: 1n,
        carrierStateReference: carrier,
        controlStateReference: control,
      }),
    ).rejects.toThrow('ProtectedCapital mismatch on safetyCapital')
  })
})
