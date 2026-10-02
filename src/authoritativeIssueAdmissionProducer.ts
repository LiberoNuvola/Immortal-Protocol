/**
 * Authoritative Issue-admission producer boundary.
 *
 * This module deliberately does NOT derive EEV, ProtectedCapital, viability,
 * or Economic Gate booleans. It defines the transport contract between an
 * already-authorized observation/refinement service and the Cardano DApp.
 *
 * A concrete implementation may be backed by a server/keeper, but the caller
 * must inject the authoritative producer. The browser remains a consumer.
 */

import type { EconomicAdmissionWitness } from '../Adapter/CARDANO/runtime/EconomicAdmission'
import {
  obtainAuthoritativeIssueAdmission,
  type AuthoritativeIssueAdmissionProvider,
  type IssueAdmissionRuntimeInputs,
} from './preRichIssueAdmissionBridge'
import type { IssueRefinementEvidence } from '../PRE-RICH/src/PreRichIssueEvidence'

export type IssueAdmissionProducerContext = IssueAdmissionRuntimeInputs & {
  issueClassEvidence: IssueRefinementEvidence
}

export type AuthoritativeIssueAdmissionProducer =
  (context: IssueAdmissionProducerContext) => Promise<EconomicAdmissionWitness>

/**
 * Adapt an externally authoritative producer to the existing Issue bridge.
 *
 * No fallback, local calculation, browser oracle, or synthetic witness is
 * introduced here. If the producer is absent or fails, Issue remains closed.
 */
export function createAuthoritativeIssueAdmissionProvider(
  producer: AuthoritativeIssueAdmissionProducer,
  issueClassEvidence: IssueRefinementEvidence,
): AuthoritativeIssueAdmissionProvider {
  return async (inputs) =>
    producer({
      ...inputs,
      issueClassEvidence,
    })
}

/**
 * Execute the producer through the existing fail-closed admission bridge.
 * This function is intentionally the only convenience entry point exposed
 * to the Issue caller.
 */
export async function produceIssueAdmission(
  producer: AuthoritativeIssueAdmissionProducer,
  context: IssueAdmissionProducerContext,
): Promise<EconomicAdmissionWitness> {
  const provider = createAuthoritativeIssueAdmissionProvider(
    producer,
    context.issueClassEvidence,
  )

  return obtainAuthoritativeIssueAdmission(
    provider,
    context,
    context.issueClassEvidence,
  )
}
