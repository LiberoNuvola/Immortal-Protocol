import {
  type TransitionAction,
  type LivenessHypotheses,
  verifyTransitionCertificate,
} from "./CertifiedEconomicTransition";

export type ExistingBoundaryWitness = {
  /** Canonical EconomicTransitionV3.transitionValid result. */
  v3TransitionValid: boolean;
  /** Canonical RefinementV3.refinementExact result. */
  refinementExact: boolean;
  /** C13 semantic serialization witness result. */
  semanticEncodingValid: boolean;
};

export type ComposedTransitionCertificate = {
  preStateHash: string;
  action: TransitionAction;
  postStateHash: string;
  ruleId: string;
  transitionValid: boolean;
  liveness: LivenessHypotheses;
  transitionId: string;
  existingBoundaries: ExistingBoundaryWitness;
};

/**
 * Experimental composition layer.
 *
 * This does not replace any canonical IMMORTAL verifier. It demonstrates the
 * missing composition boundary: V3 transition validity + concrete refinement
 * + Cardano semantic encoding + explicit liveness hypotheses can be carried
 * by one transition witness.
 */
export function verifyComposedTransitionCertificate(
  witness: ComposedTransitionCertificate,
): { accepted: boolean; reason?: string } {
  if (!witness.existingBoundaries.v3TransitionValid) {
    return { accepted: false, reason: "V3_TRANSITION_INVALID" };
  }
  if (!witness.existingBoundaries.refinementExact) {
    return { accepted: false, reason: "REFINEMENT_NOT_EXACT" };
  }
  if (!witness.existingBoundaries.semanticEncodingValid) {
    return { accepted: false, reason: "SEMANTIC_ENCODING_INVALID" };
  }

  return verifyTransitionCertificate(witness);
}
