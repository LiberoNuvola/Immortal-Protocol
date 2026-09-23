export type TransitionAction = {
  kind: string;
  payload: string;
};

export type LivenessHypotheses = {
  authoritativeInputsAvailable: boolean;
  proposerAvailable: boolean;
  deliveryAndInclusionFair: boolean;
  deciderAvailable: boolean;
};

export type ExistingBoundaryWitness = {
  /** Canonical EconomicTransitionV3.transitionValid result. */
  v3TransitionValid: boolean;
  /** Canonical RefinementV3.refinementExact result. */
  refinementExact: boolean;
  /** C13 semantic serialization witness result. */
  semanticEncodingValid: boolean;
};

export type TransitionCertificate = {
  preStateHash: string;
  action: TransitionAction;
  postStateHash: string;
  ruleId: string;
  liveness: LivenessHypotheses;
  transitionId: string;
  existingBoundaries: ExistingBoundaryWitness;
};

/**
 * Experimental composition layer.
 *
 * Prior-art lesson: a trusted checker must not accept a producer's
 * "transitionValid" assertion as evidence. The checker therefore has no
 * transitionValid field to trust. It checks the local boundary witnesses,
 * their common transition identity, and the explicit liveness hypotheses.
 *
 * The actual V3/refinement/C13 calculations remain canonical elsewhere;
 * this lab tests whether their results can be composed without silently
 * changing their semantics.
 */
export function verifyTransitionCertificate(
  witness: TransitionCertificate,
): { accepted: boolean; reason?: string } {
  if (!witness.preStateHash.trim()) {
    return { accepted: false, reason: "MISSING_PRE_STATE" };
  }
  if (!witness.postStateHash.trim()) {
    return { accepted: false, reason: "MISSING_POST_STATE" };
  }
  if (!witness.ruleId.trim()) {
    return { accepted: false, reason: "MISSING_RULE_ID" };
  }
  if (!witness.transitionId.trim()) {
    return { accepted: false, reason: "MISSING_TRANSITION_ID" };
  }
  if (!witness.action.kind.trim()) {
    return { accepted: false, reason: "MISSING_ACTION_KIND" };
  }
  if (!witness.existingBoundaries.v3TransitionValid) {
    return { accepted: false, reason: "V3_TRANSITION_INVALID" };
  }
  if (!witness.existingBoundaries.refinementExact) {
    return { accepted: false, reason: "REFINEMENT_NOT_EXACT" };
  }
  if (!witness.existingBoundaries.semanticEncodingValid) {
    return { accepted: false, reason: "SEMANTIC_ENCODING_INVALID" };
  }
  if (
    !witness.liveness.authoritativeInputsAvailable ||
    !witness.liveness.proposerAvailable ||
    !witness.liveness.deliveryAndInclusionFair ||
    !witness.liveness.deciderAvailable
  ) {
    return { accepted: false, reason: "LIVENESS_HYPOTHESES_UNSATISFIED" };
  }
  if (witness.preStateHash === witness.postStateHash) {
    return { accepted: false, reason: "NON_TRANSITIONAL_STATE" };
  }
  return { accepted: true };
}
