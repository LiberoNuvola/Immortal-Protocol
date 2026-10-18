import test from "node:test";
import assert from "node:assert/strict";
import { OMEGA_ELEMENTS, validateProfileManifest } from "./validate-profile-manifest.mjs";

function validManifest() {
  return {
    profileId: "example-profile",
    profileVersion: "0.0.0-draft",
    sourceCommit: "a".repeat(40),
    claimScope: "ABSTRACT_MODEL_ONLY",
    model: {
      stateSpaceRef: "unresolved", actionUniverseRef: "unresolved",
      admissibleActionsRef: "unresolved", acceptanceRef: "unresolved",
      environmentPerimeterRef: "unresolved", omegaRef: "unresolved",
      transitionRef: "unresolved", safePredicateRef: "unresolved", eevContractRef: "unresolved",
    },
    certificate: {
      certificateId: "example-certificate", certificateVersion: "0.0.0-draft",
      characteristicPredicateRef: "unresolved", witnessSelectorRef: "unresolved",
      boundsRef: "unresolved", proofArtifacts: ["unresolved"],
    },
    omegaDeclaration: {
      fixingAuthorityRef: "unresolved", perimeterRef: "unresolved",
      residualRiskRef: "unresolved", completenessEvidenceRef: "unresolved",
      elements: OMEGA_ELEMENTS.map((element, index) => ({
        number: index + 1, element, evidenceRef: "unresolved",
      })),
    },
    initialState: {
      canonicalStateRef: "unresolved", stateDigest: "b".repeat(64),
      derivationTraceRef: "unresolved", chiEvaluationRef: "unresolved",
    },
    evidencePacket: {
      checkerRef: "unresolved", checkerVersion: "unresolved",
      command: ["unresolved"], rawOutputRef: "unresolved", exitStatus: 0,
      artifactDigests: ["c".repeat(64)], assumptionsRef: "unresolved", limitationsRef: "unresolved",
    },
  };
}

test("accepts a structurally complete draft without upgrading its evidence status", () => {
  const result = validateProfileManifest(validManifest());
  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("rejects a missing Ω element", () => {
  const manifest = validManifest();
  manifest.omegaDeclaration.elements.pop();
  const result = validateProfileManifest(manifest);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("exactly 13 entries")));
});

test("rejects duplicated or out-of-range Ω numbering", () => {
  const manifest = validManifest();
  manifest.omegaDeclaration.elements[12].number = 12;
  const result = validateProfileManifest(manifest);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("unique integers 1..13")));
});

test("rejects a malformed source commit digest", () => {
  const manifest = validManifest();
  manifest.sourceCommit = "not-a-commit";
  const result = validateProfileManifest(manifest);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("sourceCommit")));
});

test("rejects empty evidence references", () => {
  const manifest = validManifest();
  manifest.omegaDeclaration.elements[0].evidenceRef = " ";
  const result = validateProfileManifest(manifest);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("evidenceRef")));
});
