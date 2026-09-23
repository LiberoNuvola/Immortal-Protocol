import { describe, expect, it } from "vitest";
import {
  verifyComposedTransitionCertificate,
  type ComposedTransitionCertificate,
} from "./ComposedTransitionCertificate";

const base: ComposedTransitionCertificate = {
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
  existingBoundaries: {
    v3TransitionValid: true,
    refinementExact: true,
    semanticEncodingValid: true,
  },
};

describe("CAES composition boundary", () => {
  it("accepts when all existing verification boundaries agree", () => {
    expect(verifyComposedTransitionCertificate(base)).toEqual({ accepted: true });
  });

  it("rejects when V3 transition validity is absent", () => {
    expect(
      verifyComposedTransitionCertificate({
        ...base,
        existingBoundaries: { ...base.existingBoundaries, v3TransitionValid: false },
      }),
    ).toEqual({ accepted: false, reason: "V3_TRANSITION_INVALID" });
  });

  it("rejects when concrete refinement is absent", () => {
    expect(
      verifyComposedTransitionCertificate({
        ...base,
        existingBoundaries: { ...base.existingBoundaries, refinementExact: false },
      }),
    ).toEqual({ accepted: false, reason: "REFINEMENT_NOT_EXACT" });
  });

  it("rejects when Cardano semantic encoding is absent", () => {
    expect(
      verifyComposedTransitionCertificate({
        ...base,
        existingBoundaries: {
          ...base.existingBoundaries,
          semanticEncodingValid: false,
        },
      }),
    ).toEqual({ accepted: false, reason: "SEMANTIC_ENCODING_INVALID" });
  });
});
