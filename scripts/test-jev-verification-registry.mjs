#!/usr/bin/env node
import assert from "node:assert/strict";
import { validateRegistry } from "./validate-jev-verification-registry.mjs";

const good = {
  schema: "immortal.jev-verification-registry.v1",
  registryVersion: "0.1",
  generatedAt: "2026-10-14T17:00:00.000Z",
  subject: {
    repository: "LiberoNuvola/Immortal-Protocol",
    commitSha: "0123456789abcdef0123456789abcdef01234567",
    ref: "refs/heads/work/immortal-green-closure",
    workflowRunId: "38615595908",
    workflowRunUrl: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908",
    runAttempt: 2,
    executionContext: "devnet"
  },
  checks: [
    {
      checkId: "V3.CARRIER.LEDGER",
      requirementRef: "Integration Lab: Execute V3 carrier against native Cardano ledger",
      result: "PASS",
      evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
      limitations: ["This check does not establish Reveal success or overall Integration Lab GREEN."]
    },
    {
      checkId: "REVEAL.TX.SIZE",
      requirementRef: "Cardano transaction size must not exceed 16384 bytes",
      result: "FAIL",
      evidenceRefs: [{ kind: "log", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
      observedValue: 18051,
      expectedValue: 16384,
      limitations: ["Observed on Yaci devnet; does not itself identify the root cause."]
    }
  ],
  overallResult: "FAIL",
  notes: ["Example fixture only; values illustrate schema semantics and are not a fresh observation."]
};

assert.deepEqual(validateRegistry(good), [], "valid registry should pass");
const noEvidencePass = structuredClone(good);
noEvidencePass.checks[0].evidenceRefs = [];
assert.ok(validateRegistry(noEvidencePass).some((e) => e.includes("PASS requires at least one evidence reference")));
const duplicateId = structuredClone(good);
duplicateId.checks[1].checkId = duplicateId.checks[0].checkId;
assert.ok(validateRegistry(duplicateId).some((e) => e.includes("duplicate check ID")));
const unknownContext = structuredClone(good);
unknownContext.subject.executionContext = "probably-mainnet";
assert.ok(validateRegistry(unknownContext).some((e) => e.includes("unknown execution context")));
const invalidDigest = structuredClone(good);
invalidDigest.checks[0].evidenceRefs[0].sha256 = "sha256:not-a-digest";
assert.ok(validateRegistry(invalidDigest).some((e) => e.includes("must be a SHA-256 digest")));
const unknownResult = structuredClone(good);
unknownResult.checks[0].result = "GREEN";
assert.ok(validateRegistry(unknownResult).some((e) => e.includes("unknown result")));
console.log("JEV verification registry tests passed.");
