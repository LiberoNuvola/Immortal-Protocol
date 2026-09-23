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
  liveness: {
    authoritativeInputsAvailable: true,
    proposerAvailable: true,
    deliveryAndInclusionFair: true,
    deciderAvailable: true,
  },
  transitionId: "transition:001",
  existingBoundaries: {
    v3TransitionValid: true,
    refinementExact: true,
    semanticEncodingValid: true,
  },
};

describe("CAES transition witness lab", () => {
  it("accepts a structurally complete composition witness", () => {
    expect(verifyTransitionCertificate(validWitness)).toEqual({ accepted: true });
  });

  it("does not trust a producer-supplied transitionValid assertion", () => {
    const malicious = { ...validWitness, transitionValid: false } as unknown as TransitionCertificate;
    expect(verifyTransitionCertificate(malicious)).toEqual({ accepted: true });
  });

  it("rejects missing V3 transition validity", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        existingBoundaries: { ...validWitness.existingBoundaries, v3TransitionValid: false },
      }),
    ).toEqual({ accepted: false, reason: "V3_TRANSITION_INVALID" });
  });

  it("rejects missing refinement", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        existingBoundaries: { ...validWitness.existingBoundaries, refinementExact: false },
      }),
    ).toEqual({ accepted: false, reason: "REFINEMENT_NOT_EXACT" });
  });

  it("rejects missing semantic encoding", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        existingBoundaries: {
          ...validWitness.existingBoundaries,
          semanticEncodingValid: false,
        },
      }),
    ).toEqual({ accepted: false, reason: "SEMANTIC_ENCODING_INVALID" });
  });

  it("keeps liveness hypotheses explicit", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        liveness: { ...validWitness.liveness, proposerAvailable: false },
      }),
    ).toEqual({
      accepted: false,
      reason: "LIVENESS_HYPOTHESES_UNSATISFIED",
    });
  });

  it("rejects non-transitioning state witnesses", () => {
    expect(
      verifyTransitionCertificate({
        ...validWitness,
        preStateHash: validWitness.postStateHash,
      }),
    ).toEqual({ accepted: false, reason: "NON_TRANSITIONAL_STATE" });
  });
});
