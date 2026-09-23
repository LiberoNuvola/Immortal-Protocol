import { describe, expect, it } from "vitest";
import {
  verifyTransitionCertificate,
  type TransitionCertificate,
} from "./CertifiedEconomicTransition";

const validWitness: TransitionCertificate = {
  preStateHash: "state:pre:001",
  action: { kind: "Issue", payload: "class=1" },
  postStateHash: "state:post:002",
  ruleId: "EconomicTransitionV3/Issue",
  transitionValid: true,
  liveness: {
    authoritativeInputsAvailable: true,
    proposerAvailable: true,
    deliveryAndInclusionFair: true,
    deciderAvailable: true,
  },
  transitionId: "transition:001",
};

describe("CAES transition witness lab", () => {
  it("accepts a structurally complete witness", () => {
    expect(verifyTransitionCertificate(validWitness)).toEqual({ accepted: true });
  });

  it("rejects a witness that merely claims validity", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        transitionValid: false,
      }),
    ).toEqual({ accepted: false, reason: "TRANSITION_NOT_CERTIFIED" });
  });

  it("keeps liveness hypotheses explicit", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        liveness: {
          ...validWitness.liveness,
          proposerAvailable: false,
        },
      }),
    ).toEqual({
      accepted: false,
      reason: "LIVENESS_HYPOTHESES_UNSATISFIED",
    });
  });

  it("rejects stale/non-transitioning state witnesses", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        preStateHash: validWitness.postStateHash,
      }),
    ).toEqual({ accepted: false, reason: "NON_TRANSITIONAL_STATE" });
  });

  it("rejects missing rule identity", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        ruleId: "",
      }),
    ).toEqual({ accepted: false, reason: "MISSING_RULE_ID" });
  });

  it("rejects an incomplete pre-state binding", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        preStateHash: "",
      }),
    ).toEqual({ accepted: false, reason: "MISSING_PRE_STATE" });
  });
});
