import { describe, expect, it } from 'vitest'
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
})
