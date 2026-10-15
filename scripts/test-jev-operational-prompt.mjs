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
assert.match(prompt, /REVEAL\.TRACE: FAIL/);
assert.match(prompt, /inspect the referenced run\/log\/artifact/i);
assert.match(prompt, /do not infer root cause/i);
assert.match(prompt, /do not modify IMMORTAL, Cardano Adapter, or DApp cores/i);
assert.match(prompt, /do not start other branches/i);
assert.match(prompt, /38615595908/);
assert.ok(prompt.length < 7001);

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
