#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildOperationalPrompt } from "./build-jev-operational-prompt.mjs";

const registry = {
  subject: {
    repository: "LiberoNuvola/Immortal-Protocol",
    commitSha: "0123456789abcdef0123456789abcdef01234567",
    ref: "refs/heads/work/immortal-green-closure",
    workflowRunId: "38615595908",
    workflowRunUrl: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908",
    runAttempt: 2,
    executionContext: "devnet",
  },
  overallResult: "FAIL",
  checks: [
    {
      checkId: "V3.CARRIER.LEDGER",
      result: "PASS",
      evidenceRefs: [{ kind: "workflow-run", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
      limitations: ["Only this step and devnet are covered."],
    },
    {
      checkId: "REVEAL.TRACE",
      result: "FAIL",
      evidenceRefs: [{ kind: "log", uri: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38615595908" }],
      limitations: ["Failure does not establish root cause."],
    },
  ],
};

const prompt = buildOperationalPrompt(registry);
assert.match(prompt, /JEV OPERATIONAL PROMPT/);
assert.match(prompt, /REVEAL\.TRACE FAIL/);
assert.match(prompt, /inspect the referenced run\/log\/artifact/i);
assert.match(prompt, /current branch HEAD/i);
assert.match(prompt, /Notion page insertion order is not execution recency/i);
assert.match(prompt, /If this prompt is stale, record the mismatch/i);
assert.match(prompt, /do not infer root cause/i);
assert.match(prompt, /do not modify IMMORTAL, Cardano Adapter, or DApp cores/i);
assert.match(prompt, /do not start other branches/i);
assert.match(prompt, /38615595908/);
assert.ok(prompt.length < 7001);

// A run may expose many scoped checks. Repeating the same run URL in every
// check used to push the generated operational prompt over its 7,000-char cap.
const manyChecks = structuredClone(registry);
manyChecks.checks = Array.from({ length: 30 }, (_, index) => ({
  checkId: "SYNTHETIC.CHECK." + String(index).padStart(2, "0"),
  result: "PASS",
  evidenceRefs: [{ kind: "workflow-run", uri: registry.subject.workflowRunUrl }],
  limitations: ["Scoped to this check only."],
}));
const manyPrompt = buildOperationalPrompt(manyChecks);
assert.ok(manyPrompt.length < 7001, "many checks with one shared run URL should fit the prompt budget");
assert.match(manyPrompt, /R:1 L:1 \(registry\)/);
assert.match(manyPrompt, /Hard boundaries:/);

// Large sets of unique, verbose caveats remain canonical in the registry.
// The prompt must index their owning checks without duplicating their full text.
const verboseRegistry = structuredClone(registry);
const verboseLimitations = Array.from({ length: 40 }, (_, index) =>
  `Unique limitation ${index}: ` + "This evidence is scoped to the exact run and does not establish Preprod or mainnet qualification. ".repeat(4)
);
verboseRegistry.checks = verboseLimitations.map((limitation, index) => ({
  checkId: "VERBOSE.LIMIT." + String(index).padStart(2, "0"),
  result: index === 39 ? "FAIL" : "PASS",
  evidenceRefs: [{ kind: "workflow-run", uri: registry.subject.workflowRunUrl }],
  limitations: [limitation],
}));
const verbosePrompt = buildOperationalPrompt(verboseRegistry);
assert.ok(verbosePrompt.length < 7001, "verbose registry limitations should not overflow the operational prompt");
assert.match(verbosePrompt, /VERBOSE\.LIMIT\.39 FAIL R:1 L:1 \(registry\)/);
assert.match(verbosePrompt, /Full limitation text and complete evidence references are retained without alteration in the validated source registry/);
assert.doesNotMatch(verbosePrompt, /Unique limitation 0:/, "full limitation text must remain in the registry, not be duplicated into the prompt");

const diagnosticRegistry = structuredClone(registry);
diagnosticRegistry.checks.push({
  checkId: "P2.8.HASKELL_V2.PENDING_EXPIRE",
  result: "FAIL",
  evidenceRefs: [{ kind: "workflow-run", uri: registry.subject.workflowRunUrl }],
  limitations: [
    "This FAIL records the workflow step outcome only; it is not itself a typed Plutus ValidationFailure or a native ledger rejection.",
    "A transaction-size or fee failure during construction, before submission, is a pre-submission build/resource block and must not be interpreted as validator semantic failure.",
    "Inspect the linked step log to identify the actual cause; this check does not infer it from the exit code.",
  ],
});
const diagnosticPrompt = buildOperationalPrompt(diagnosticRegistry);
assert.match(diagnosticPrompt, /P2\.8\.HASKELL_V2\.PENDING_EXPIRE FAIL R:1 L:3 \(registry\)/);
assert.match(diagnosticPrompt, /Full limitation text and complete evidence references are retained without alteration in the validated source registry/);
assert.doesNotMatch(diagnosticPrompt, /before submission/);


assert.throws(() => buildOperationalPrompt({}), /registry.subject is required/);
assert.throws(() => buildOperationalPrompt({ subject: registry.subject, checks: [] }), /non-empty array/);
assert.throws(() => buildOperationalPrompt({ subject: registry.subject, checks: [{ checkId: "X", result: "UNKNOWN", evidenceRefs: [], limitations: [] }] }), /invalid checkId\/result/);
assert.throws(
  () => buildOperationalPrompt({
    subject: registry.subject,
    overallResult: "PASS",
    checks: [{ checkId: "OVERSIZE.CHECK", result: "PASS", evidenceRefs: ["https://example.com/evidence"], limitations: ["x".repeat(8000)] }],
  }),
  /refusing to truncate safety boundaries/,
);

console.log("JEV operational prompt generator tests passed.");
