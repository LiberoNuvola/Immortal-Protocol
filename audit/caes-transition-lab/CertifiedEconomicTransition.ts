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

export type TransitionCertificate = {
  preStateHash: string;
  action: TransitionAction;
  postStateHash: string;
  ruleId: string;
  transitionValid: boolean;
  liveness: LivenessHypotheses;
  transitionId: string;
};

/**
 * Experimental checker only.
 *
 * It intentionally checks certificate consistency, not economic policy.
 * The producer may claim transitionValid=true, but the checker independently
 * requires the structural witness fields and an explicit liveness boundary.
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

  if (!witness.transitionValid) {
    return { accepted: false, reason: "TRANSITION_NOT_CERTIFIED" };
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
