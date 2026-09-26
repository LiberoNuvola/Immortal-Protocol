/**
 * PRE-RICH Issue admission boundary.
 *
 * This module is deliberately not an economic oracle and not a frontend
 * calculator. It accepts an EconomicAdmissionWitness only from an
 * authoritative/refinement producer, then binds that decision to the exact
 * runtime inputs that mintSerialNFT is about to spend.
 *
 * The provider is injected so the browser cannot manufacture EEV,
 * executable liquidity, state hashes or gate decisions locally.
 */
import {
  assertEconomicAdmission,
  type EconomicAdmissionWitness,
} from '../Adapter/CARDANO/runtime/EconomicAdmission'

import {
  assertEconomicAdmissionMatchesCanonicalEvidence,
} from '../Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding'
import type { CanonicalTransitionEvidence } from '../Adapter/CARDANO/observation/CanonicalTransitionEvidence'
import {
  validateIssueRefinementEvidence,
  issueClassSaleable,
  type IssueRefinementEvidence,
} from '../PRE-RICH/profile/PreRichIssueEvidence'

export type IssueAdmissionRuntimeInputs = {
  readonly counterInputReference: string
  readonly poolInputReference: string
  readonly liquiditySourceReferences: readonly string[]
  readonly poolUsdmValue: bigint
}

export type AuthoritativeIssueAdmissionProvider = (
  inputs: IssueAdmissionRuntimeInputs,
) => Promise<EconomicAdmissionWitness>

export async function obtainAuthoritativeIssueAdmission(
  provider: AuthoritativeIssueAdmissionProvider,
  inputs: IssueAdmissionRuntimeInputs,
  issueClassEvidence: IssueRefinementEvidence,
): Promise<EconomicAdmissionWitness> {
  validateIssueRefinementEvidence(issueClassEvidence)
  if (!issueClassSaleable(issueClassEvidence)) {
    throw new Error('PRE-RICH Issue rejected: class is not saleable')
  }
  if (!inputs.counterInputReference.trim()) {
    throw new Error('Issue admission requires an exact Counter input reference')
  }
  if (!inputs.poolInputReference.trim()) {
    throw new Error('Issue admission requires an exact B1 PrizePool input reference')
  }
  if (inputs.poolUsdmValue < 0n) {
    throw new Error('Issue admission pool valuation must be non-negative')
  }
  const liquiditySources = [...inputs.liquiditySourceReferences]
  if (liquiditySources.length === 0) {
    throw new Error('Issue admission requires at least one authenticated liquidity source')
  }

  const witness = await provider(inputs)
  assertEconomicAdmission(
    witness,
    [inputs.counterInputReference, inputs.poolInputReference],
    liquiditySources,
    'Issue',
  )

  if (witness.authenticatedPoolInputReference !== inputs.poolInputReference) {
    throw new Error('Issue admission is bound to a different B1 PrizePool input')
  }
  if (witness.authenticatedPoolUsdmValue !== inputs.poolUsdmValue) {
    throw new Error('Issue admission pool valuation does not match observed runtime input')
  }

  return witness
}

/**
 * Binds the Issue admission witness to the canonical transition-evidence
 * packet that records the same action, pre-state and candidate post-state.
 * This is evidence binding only: it does not manufacture the fingerprints
 * or certify the authoritative observation that produced the witness.
 */
export function assertIssueAdmissionMatchesCanonicalEvidence(
  admission: EconomicAdmissionWitness,
  evidence: CanonicalTransitionEvidence,
): void {
  assertEconomicAdmissionMatchesCanonicalEvidence(admission, evidence)
  if (admission.actionClass !== 'Issue') {
    throw new Error('Issue admission evidence binding requires actionClass=Issue')
  }
  if (admission.actionFingerprint !== evidence.actionFingerprint) {
    throw new Error('economic admission action fingerprint does not match canonical evidence')
  }
}
