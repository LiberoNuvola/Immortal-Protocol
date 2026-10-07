import { describe, expect, it } from 'vitest'
import { assertIssueAdmissionMatchesCanonicalEvidence } from '../preRichIssueAdmissionBridge'
import { obtainAuthoritativeIssueAdmission, type AuthoritativeIssueAdmissionProvider } from '../preRichIssueAdmissionBridge'
import type { AuthoritativeIssueAdmissionWitness } from '../preRichIssueAdmissionBridge'

const counter = 'a'.repeat(64) + '#0'
const pool = 'b'.repeat(64) + '#1'

function eevQualification() {
  return {
    status: 'qualified' as const,
    contractVersion: '3.0.0',
    sourceReference: 'source://test-eev',
    verificationReference: 'verify://test-eev',
    derivationVersion: 'test-eev-v1',
    snapshotReference: 'snapshot://issue/1',
    evidence: {
      EV1: { reference: 'evidence://EV1', digest: 'a'.repeat(64) },
      EV2: { reference: 'evidence://EV2', digest: 'b'.repeat(64) },
      EV3: { reference: 'evidence://EV3', digest: 'c'.repeat(64) },
      EV4: { reference: 'evidence://EV4', digest: 'd'.repeat(64) },
      EV5: { reference: 'evidence://EV5', digest: 'e'.repeat(64) },
      EV6: { reference: 'evidence://EV6', digest: 'f'.repeat(64) },
      EV7: { reference: 'evidence://EV7', digest: '0'.repeat(64) },
    },
  }
}

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
    accountingInputs: { unresolvedReserve: 1n, unresolvedTicketCount: 1n },
    total: 200n,
  }
}

function viabilityCertificate() {
  return {
    id: 'pre-rich-kc-v1',
    version: '1',
    modelReference: 'model://pre-rich-v1',
    characteristicPredicateReference: 'chi://pre-rich-v1',
    witnessSelectorReference: 'wit://pre-rich-v1',
    boundsReference: 'bounds://pre-rich-v1',
    proofs: Object.fromEntries(['VC1','VC2','VC3','VC4','VC5','VC6'].map((key, i) => [
      key, { reference: 'proof://' + key, digest: String(i + 1).repeat(64).slice(0,64) },
    ])),
    evidence: Object.fromEntries(['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10'].map((key, i) => [
      key, { reference: 'evidence://' + key, digest: String(i % 10).repeat(64).slice(0,64) },
    ])),
    digest: '9'.repeat(64),
  }
}

function witness(): AuthoritativeIssueAdmissionWitness {
  return {
    gateVersion: 'economic-gate-v1',
    admitted: true,
    decisionReference: 'decision:issue:1',
    authoritativeObservationReference: 'observation:issue:1',
    stateHash: '1'.repeat(64),
    actionClass: 'Issue',
    actionFingerprint: '2'.repeat(64),
    postStateHash: '3'.repeat(64),
    eev: 1000n,
    executableLiquidityObservation: {
      observationReference: 'observation:issue:1',
      observedAt: 1n,
      sourceInputReferences: [pool],
      utxos: [{ txHash: 'b'.repeat(64), index: 1, usdmValue: 500n, spendable: true, ringFenced: false }],
      declaredUsdmLiquidity: 500n,
    },
    authenticatedPoolInputReference: pool,
    authenticatedPoolUsdmValue: 500n,
    requiredImmediateLiquidity: 100n,
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

const classEvidence = {
  classId: 0n,
  priceReferenceUnits: 1n,
  currentActiveClass: 0n,
  highestClassEverActivated: 0n,
  issued: 0n,
  cap: 10n,
}


const canonicalEvidence = {
  evidenceId: 'evidence:issue:1',
  fixtureId: 'fixture:issue:1',
  actionClass: 'Issue',
  protocolVersion: 'v3',
  profileVersion: 'pre-rich-v1',
  adapterId: 'cardano',
  adapterVersion: 'b1',
  environment: 'preprod',
  preStateFingerprint: '1'.repeat(64),
  postStateFingerprint: '3'.repeat(64),
  actionFingerprint: '2'.repeat(64),
  transactionRef: 'tx:issue:1',
}

const inputs = {
  counterInputReference: counter,
  poolInputReference: pool,
  liquiditySourceReferences: [pool],
  poolUsdmValue: 500n,
}

describe('PRE-RICH Issue admission bridge', () => {
  it('accepts only an authoritative Issue witness bound to exact runtime inputs', async () => {
    const provider: AuthoritativeIssueAdmissionProvider = async () => witness()
    await expect(obtainAuthoritativeIssueAdmission(provider, inputs, classEvidence)).resolves.toMatchObject({ actionClass: 'Issue' })
  })

  it('rejects a witness bound to a different pool', async () => {
    const provider: AuthoritativeIssueAdmissionProvider = async () => ({ ...witness(), authenticatedPoolInputReference: 'c'.repeat(64) + '#9' })
    await expect(obtainAuthoritativeIssueAdmission(provider, inputs, classEvidence)).rejects.toThrow(/different B1 PrizePool input|executable liquidity observation/)
  })

  it('rejects a non-saleable class before invoking authority', async () => {
    let called = false
    const provider: AuthoritativeIssueAdmissionProvider = async () => { called = true; return witness() }
    await expect(obtainAuthoritativeIssueAdmission(provider, inputs, { ...classEvidence, issued: 10n, cap: 10n })).rejects.toThrow('class is not saleable')
    expect(called).toBe(false)
  })

  it('binds the admitted Issue to the same canonical pre/post transition evidence', async () => {
    const admission = await obtainAuthoritativeIssueAdmission(
      async () => witness(),
      inputs,
      classEvidence,
    )
    expect(() => assertIssueAdmissionMatchesCanonicalEvidence(admission, canonicalEvidence)).not.toThrow()
  })

  it('rejects canonical evidence whose pre-state differs from the admission', async () => {
    const admission = await obtainAuthoritativeIssueAdmission(
      async () => witness(),
      inputs,
      classEvidence,
    )
    expect(() =>
      assertIssueAdmissionMatchesCanonicalEvidence(
        admission,
        { ...canonicalEvidence, preStateFingerprint: '9'.repeat(64) },
      ),
    ).toThrow('pre-state hash does not match canonical evidence')
  })

  it('rejects canonical evidence whose action fingerprint differs from the admission', async () => {
    const admission = await obtainAuthoritativeIssueAdmission(
      async () => witness(),
      inputs,
      classEvidence,
    )
    expect(() =>
      assertIssueAdmissionMatchesCanonicalEvidence(
        admission,
        { ...canonicalEvidence, actionFingerprint: '9'.repeat(64) },
      ),
    ).toThrow('action fingerprint does not match canonical evidence')
  })

  it('rejects canonical evidence for a non-Issue action', async () => {
    const admission = await obtainAuthoritativeIssueAdmission(
      async () => witness(),
      inputs,
      classEvidence,
    )
    expect(() =>
      assertIssueAdmissionMatchesCanonicalEvidence(
        admission,
        { ...canonicalEvidence, actionClass: 'Reveal' },
      ),
    ).toThrow('economic admission action does not match canonical evidence')
  })

})
