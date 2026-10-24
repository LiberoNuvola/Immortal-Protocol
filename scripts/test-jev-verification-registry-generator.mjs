#!/usr/bin/env node
import assert from "node:assert/strict";
import { classifyLedgerEvaluation, generateRegistry } from "./jev-verification-registry-generator.mjs";
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

const p28Cancelled = structuredClone(p28Outcomes);
p28Cancelled.checks.find((c) => c.checkId === "P2.8.LEDGER.EVIDENCE.GATE").stepOutcome = "cancelled";
const p28CancelledRegistry = generateRegistry(p28Cancelled);
assert.equal(p28CancelledRegistry.checks.find((c) => c.checkId === "P2.8.LEDGER.EVIDENCE.GATE").result, "BLOCKED");
assert.equal(p28CancelledRegistry.overallResult, "FAIL", "a decoder failure must dominate a cancelled downstream gate");

const p28MaterializationFailure = structuredClone(base);
p28MaterializationFailure.checks = [
  {
    checkId: "P2.8.CONTEXT.MATERIALIZATION",
    requirementRef: "Integration Lab / Materialize raw Yaci ledger context for P2.8",
    stepOutcome: "failure",
    evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
    limitations: ["Failed context materialization blocks all dependent qualification."],
  },
  {
    checkId: "P2.8.YACI.UTXO.DECODER",
    requirementRef: "Integration Lab / Run native Yaci UTxO decoder conformance",
    stepOutcome: "skipped",
    evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
    limitations: ["Decoder did not run because materialization failed."],
  },
  {
    checkId: "P2.8.LEDGER.EVIDENCE.GATE",
    requirementRef: "Integration Lab / Run P2.8 ledger evidence gate",
    stepOutcome: "skipped",
    evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
    limitations: ["Skipped gate is NOT_RUN, never PASS."],
  },
];
const materializationFailureRegistry = generateRegistry(p28MaterializationFailure);
assert.equal(materializationFailureRegistry.checks.find((c) => c.checkId === "P2.8.CONTEXT.MATERIALIZATION").result, "FAIL");
assert.equal(materializationFailureRegistry.checks.find((c) => c.checkId === "P2.8.YACI.UTXO.DECODER").result, "NOT_RUN");
assert.equal(materializationFailureRegistry.checks.find((c) => c.checkId === "P2.8.LEDGER.EVIDENCE.GATE").result, "NOT_RUN");
assert.equal(materializationFailureRegistry.overallResult, "FAIL", "materialization failure must dominate skipped decoder and gate");

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

const successfulLedgerReport = [
  { redeemer: { purpose: "spend", index: 0 }, status: "success", logs: [], ex_units: { memory: 123, steps: 456 } },
  { redeemer: { purpose: "mint", index: 0 }, status: "success", logs: [], ex_units: { memory: 789, steps: 101112 } },
];
assert.equal(classifyLedgerEvaluation(successfulLedgerReport), "success", "all semantic redeemers with ExUnits establish evaluator success");

const validatorFailureReport = [
  { redeemer: { purpose: "spend", index: 0 }, status: "failure", failure: "ValidationFailure (EvaluationError ...)" },
];
assert.equal(classifyLedgerEvaluation(validatorFailureReport), "failure", "typed Plutus ValidationFailure is a genuine validator failure");

const missingScriptReport = [
  { redeemer: { purpose: "spend", index: 0 }, status: "failure", failure: "MissingScript ..." },
];
assert.equal(classifyLedgerEvaluation(missingScriptReport), "unknown", "MissingScript is blocked context, not validator failure");

const contextErrorReport = [
  { redeemer: { purpose: "spend", index: 0 }, status: "failure", failure: "ContextError ..." },
];
assert.equal(classifyLedgerEvaluation(contextErrorReport), "unknown", "context translation errors cannot be accepted as validator failures");
assert.equal(classifyLedgerEvaluation([]), "unknown", "empty evaluator reports cannot pass");
assert.equal(classifyLedgerEvaluation([{ status: "success" }]), "unknown", "success without ExUnits cannot pass");
assert.equal(classifyLedgerEvaluation([{ status: "failure", failure: "IncompatibleBudget ..." }]), "unknown", "non-validation ledger failures remain blocked");
assert.equal(classifyLedgerEvaluation(null), "unknown", "missing semantic report remains blocked");

console.log("JEV registry generator tests passed.");
