#!/usr/bin/env node
import assert from "node:assert/strict";
import { generateRegistry } from "./jev-verification-registry-generator.mjs";
import { validateRegistry } from "./validate-jev-verification-registry.mjs";

const base = {
  metadata: {
    repository: "LiberoNuvola/Immortal-Protocol",
    commitSha: "0123456789abcdef0123456789abcdef01234567",
    ref: "refs/heads/work/immortal-green-closure",
    workflowRunId: "38615595908",
    workflowRunUrl: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908",
    runAttempt: 2,
    executionContext: "devnet",
    generatedAt: "2026-10-14T19:30:00.000Z"
  },
  checks: [
    {
      checkId: "V3.CARRIER.LEDGER",
      requirementRef: "IMMORTAL Cardano Integration Lab / Execute V3 carrier against native Cardano ledger",
      stepOutcome: "success",
      evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
      limitations: ["PASS is limited to this step and devnet."]
    },
    {
      checkId: "REVEAL.TRACE",
      requirementRef: "IMMORTAL Cardano Integration Lab / Execute real economic Reveal transition trace",
      stepOutcome: "failure",
      evidenceRefs: [{ kind: "log", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
      observedValue: 18051,
      expectedValue: 16384,
      limitations: ["Step failure does not establish root cause."]
    }
  ]
};

const registry = generateRegistry(base);
assert.equal(registry.checks[0].result, "PASS");
assert.equal(registry.checks[1].result, "FAIL");
assert.equal(registry.overallResult, "FAIL");
assert.deepEqual(validateRegistry(registry), []);

const blocked = structuredClone(base);
blocked.checks[0].stepOutcome = "cancelled";
assert.equal(generateRegistry(blocked).checks[0].result, "BLOCKED");
const skipped = structuredClone(base);
skipped.checks[0].stepOutcome = "skipped";
assert.equal(generateRegistry(skipped).checks[0].result, "NOT_RUN");
const unknown = structuredClone(base);
unknown.checks[0].stepOutcome = "unknown";
assert.equal(generateRegistry(unknown).checks[0].result, "BLOCKED");
const p28Outcomes = structuredClone(base);
p28Outcomes.checks.push(
  {
    checkId: "P2.8.YACI.UTXO.DECODER",
    requirementRef: "Integration Lab / Run native Yaci UTxO decoder conformance",
    stepOutcome: "failure",
    evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
    limitations: ["Decoder failure blocks P2.8."],
  },
  {
    checkId: "P2.8.LEDGER.EVIDENCE.GATE",
    requirementRef: "Integration Lab / Run P2.8 ledger evidence gate",
    stepOutcome: "skipped",
    evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
    limitations: ["Skipped means NOT_RUN, never PASS."],
  },
);
const p28Registry = generateRegistry(p28Outcomes);
assert.equal(p28Registry.checks.find((c) => c.checkId === "P2.8.YACI.UTXO.DECODER").result, "FAIL");
assert.equal(p28Registry.checks.find((c) => c.checkId === "P2.8.LEDGER.EVIDENCE.GATE").result, "NOT_RUN");
assert.equal(p28Registry.overallResult, "FAIL", "a decoder failure must dominate a skipped downstream gate");

const noEvidence = structuredClone(base);
noEvidence.checks[0].evidenceRefs = [];
assert.throws(() => generateRegistry(noEvidence), /PASS outcome requires explicit evidence references/);
const duplicate = structuredClone(base);
duplicate.checks.push({ ...duplicate.checks[0] });
assert.throws(() => generateRegistry(duplicate), /duplicate check ID/);
const badSha = structuredClone(base);
badSha.metadata.commitSha = "not-a-sha";
assert.throws(() => generateRegistry(badSha), /40-character lowercase SHA/);
const missingOutcome = structuredClone(base);
delete missingOutcome.checks[0].stepOutcome;
assert.throws(() => generateRegistry(missingOutcome), /stepOutcome/);
const passingSubset = structuredClone(base);
passingSubset.checks = [passingSubset.checks[0]];
assert.equal(generateRegistry(passingSubset).overallResult, "PASS");
assert.match(generateRegistry(passingSubset).notes.join(" "), /no protocol-wide certification/i);
const skippedOverFail = structuredClone(base);
skippedOverFail.checks[1].stepOutcome = "skipped";
assert.equal(generateRegistry(skippedOverFail).overallResult, "NOT_RUN");

console.log("JEV registry generator tests passed.");
