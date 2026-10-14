#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMateriosJevInput } from "./jev-materios-evidence-ingress.mjs";
import { generateRegistry } from "./jev-verification-registry-generator.mjs";
import { validateRegistry } from "./validate-jev-verification-registry.mjs";

const checkpoint = {
  chain_id: "materios_preprod_v6",
  runtime_spec_version: 238,
  runtime_spec_name: "materios",
  checkpoint: {
    block_number: "1856408",
    block_hash: "0x" + "a".repeat(64),
    state_root: "0x" + "b".repeat(64),
    parent_hash: "0x" + "c".repeat(64)
  },
  grandpa: {
    set_id: "12",
    authority_count: 1,
    authorities: [{ public_key: "0x" + "d".repeat(64), weight: "1" }],
    authority_commitment: "0x" + "e".repeat(64)
  },
  extraction: { timestamp_iso8601: "2026-10-14T20:00:00.000Z" }
};
const metadata = {
  repository: "LiberoNuvola/Immortal-Protocol",
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  ref: "refs/heads/work/immortal-green-closure",
  executionContext: "devnet",
  workflowRunId: "1",
  workflowRunUrl: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/1",
  runAttempt: 1
};
const input = buildMateriosJevInput({
  checkpointBytes: Buffer.from(JSON.stringify(checkpoint) + "\n"),
  sourceUri: "https://example.invalid/evidence/CanonicalCheckpoint.json",
  metadata,
  expectedChainId: "materios_preprod_v6",
  now: new Date("2026-10-14T20:01:00.000Z"),
  maxAgeSeconds: 120
});
const registry = generateRegistry(input);
assert.deepEqual(validateRegistry(registry), []);
assert.equal(registry.checks.find(c => c.checkId === "MATERIOS.CHECKPOINT.EXTRACTION").result, "PASS");
assert.equal(registry.checks.find(c => c.checkId === "MATERIOS.ARTIFACT.DIGEST").result, "PASS");
assert.equal(registry.checks.find(c => c.checkId === "MATERIOS.GRANDPA.FINALITY").result, "NOT_RUN");
assert.equal(registry.checks.find(c => c.checkId === "MATERIOS.STORAGE.PROOF").result, "NOT_RUN");
assert.equal(registry.checks.find(c => c.checkId === "MATERIOS.CANONICALITY").result, "NOT_RUN");
assert.equal(registry.overallResult, "NOT_RUN");
assert.match(registry.notes.join(" "), /no protocol-wide certification/i);
console.log("JEV Materios ingress-to-registry pipeline tests passed.");
