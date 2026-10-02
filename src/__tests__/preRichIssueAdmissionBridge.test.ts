import { describe, expect, it } from 'vitest'
import { assertIssueAdmissionMatchesCanonicalEvidence } from '../preRichIssueAdmissionBridge'
import { obtainAuthoritativeIssueAdmission, type AuthoritativeIssueAdmissionProvider } from '../preRichIssueAdmissionBridge'
import type { EconomicAdmissionWitness } from '../../Adapter/CARDANO/runtime/EconomicAdmission'

const counter = 'a'.repeat(64) + '#0'
const pool = 'b'.repeat(64) + '#1'

function witness(): EconomicAdmissionWitness {
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
    await expect(obtainAuthoritativeIssueAdmission(provider, inputs, classEvidence)).rejects.toThrow('different B1 PrizePool input')
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
