#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMateriosJevInput } from "./jev-materios-evidence-ingress.mjs";

const cp = {
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
  extraction: {
    rpc_endpoint: "https://materios.example.invalid/rpc",
    timestamp_iso8601: "2026-10-14T20:00:00.000Z"
  }
};
const bytes = Buffer.from(JSON.stringify(cp, null, 2) + "\n");
const metadata = {
  repository: "LiberoNuvola/Immortal-Protocol",
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  ref: "refs/heads/work/immortal-green-closure",
  executionContext: "devnet",
  workflowRunUrl: "https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/1",
  workflowRunId: "1",
  runAttempt: 1
};
const options = {
  checkpointBytes: bytes,
  sourceUri: "https://example.invalid/evidence/CanonicalCheckpoint.json",
  metadata,
  expectedChainId: "materios_preprod_v6",
  now: new Date("2026-10-14T20:01:00.000Z"),
  maxAgeSeconds: 120
};

const input = buildMateriosJevInput(options);
assert.equal(input.checks.length, 5);
assert.equal(input.checks[0].stepOutcome, "success");
assert.equal(input.checks[1].observedValue.digest.length, 64);
assert.equal(input.checks[2].stepOutcome, "skipped");
assert.equal(input.checks[3].stepOutcome, "skipped");
assert.equal(input.checks[4].stepOutcome, "skipped");
assert.equal(input.checks[0].evidenceRefs[0].sha256, input.checks[1].observedValue.digest);
assert.match(input.checks[0].limitations.join(" "), /does not verify GRANDPA finality/i);

assert.throws(() => buildMateriosJevInput({ ...options, expectedChainId: "wrong-network" }), /CHECKPOINT_CHAIN_ID_MISMATCH/);
assert.throws(() => buildMateriosJevInput({ ...options, checkpointBytes: Buffer.from("{bad json") }), /INVALID_CHECKPOINT_JSON/);
assert.throws(() => buildMateriosJevInput({ ...options, sourceUri: "not-a-uri" }), /INVALID_SOURCE_URI/);
assert.throws(() => buildMateriosJevInput({ ...options, maxAgeSeconds: 10 }), /CHECKPOINT_OBSERVATION_STALE/);
const invalidHash = structuredClone(cp);
invalidHash.checkpoint.state_root = "0x1234";
assert.throws(() => buildMateriosJevInput({ ...options, checkpointBytes: Buffer.from(JSON.stringify(invalidHash)) }), /INVALID_CHECKPOINT_FIELDS/);
const invalidAuthorities = structuredClone(cp);
invalidAuthorities.grandpa.authority_count = 2;
assert.throws(() => buildMateriosJevInput({ ...options, checkpointBytes: Buffer.from(JSON.stringify(invalidAuthorities)) }), /INVALID_GRANDPA_EXTRACTION_FIELDS/);

console.log("JEV Materios evidence ingress tests passed.");
