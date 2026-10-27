import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  hashMateriosHeader,
  verifySequentialHeaderBridge,
  withJustificationPeriodOffsets
} from "./target-ancestry-bridge.mjs";

const zeroHash = "0x" + "00".repeat(32);
function header(number, parentHash, seed) {
  return {
    parentHash,
    number: "0x" + number.toString(16),
    stateRoot: "0x" + seed.repeat(32),
    extrinsicsRoot: "0x" + ((Number.parseInt(seed, 16) + 1) % 256).toString(16).padStart(2, "0").repeat(32),
    digest: { logs: [] }
  };
}
function nextHeader(number, parent, seed) {
  return header(number, hashMateriosHeader(parent), seed);
}
function fixture() {
  const checkpoint = header(2463858, zeroHash, "11");
  const one = nextHeader(2463859, checkpoint, "22");
  const two = nextHeader(2463860, one, "33");
  const target = nextHeader(2463861, two, "44");
  return { checkpoint, one, two, target };
}
function verify({ checkpoint, one, two, target, maxSpan = 8 }) {
  return verifySequentialHeaderBridge({
    checkpointHeader: checkpoint,
    checkpointNumber: 2463858,
    checkpointHash: hashMateriosHeader(checkpoint),
    intermediateHeaders: [one, two],
    proofTargetHeader: target,
    proofTargetNumber: 2463861,
    proofTargetHash: hashMateriosHeader(target),
    maxSpan
  });
}

test("verifies exact sequential ancestry from storage checkpoint to descendant justification target", () => {
  const f = fixture();
  const result = verify(f);
  assert.equal(result.status, "ANCESTRY_LINK_VERIFIED");
  assert.equal(result.block_span, 3);
  assert.equal(result.header_count, 4);
  assert.equal(result.headers[0].block_number, 2463858);
  assert.equal(result.headers[3].block_number, 2463861);
  assert.equal(result.headers[3].block_hash, hashMateriosHeader(f.target));
});

test("rejects a broken parent hash even if each header is internally encoded", () => {
  const f = fixture();
  const broken = { ...f.one, parentHash: "0x" + "aa".repeat(32) };
  assert.throws(() => verify({ ...f, one: broken }), /ANCESTRY_PARENT_HASH_MISMATCH/);
});

test("rejects missing headers and block-number gaps", () => {
  const f = fixture();
  assert.throws(() => verifySequentialHeaderBridge({
    checkpointHeader: f.checkpoint,
    checkpointNumber: 2463858,
    checkpointHash: hashMateriosHeader(f.checkpoint),
    intermediateHeaders: [f.two],
    proofTargetHeader: f.target,
    proofTargetNumber: 2463861,
    proofTargetHash: hashMateriosHeader(f.target),
    maxSpan: 8
  }), /ANCESTRY_HEADER_COUNT_MISMATCH/);
});

test("rejects a proof target whose supplied hash differs from the reconstructed header", () => {
  const f = fixture();
  assert.throws(() => verifySequentialHeaderBridge({
    checkpointHeader: f.checkpoint,
    checkpointNumber: 2463858,
    checkpointHash: hashMateriosHeader(f.checkpoint),
    intermediateHeaders: [f.one, f.two],
    proofTargetHeader: f.target,
    proofTargetNumber: 2463861,
    proofTargetHash: "0x" + "ee".repeat(32),
    maxSpan: 8
  }), /proofTarget: HEADER_HASH_MISMATCH/);
});

test("fails closed if the bridge exceeds the configured span", () => {
  const f = fixture();
  assert.throws(() => verify(fixtureWithTarget(f), { maxSpan: 2 }), /ANCESTRY_SPAN_EXCEEDS_LIMIT/);
});

function fixtureWithTarget(f) {
  return { checkpoint: f.checkpoint, one: f.one, two: f.two, target: f.target, maxSpan: 2 };
}

test("accepts a same-block proof target only when both hashes match", () => {
  const f = fixture();
  const result = verifySequentialHeaderBridge({
    checkpointHeader: f.checkpoint,
    checkpointNumber: 2463858,
    checkpointHash: hashMateriosHeader(f.checkpoint),
    intermediateHeaders: [],
    proofTargetHeader: f.checkpoint,
    proofTargetNumber: 2463858,
    proofTargetHash: hashMateriosHeader(f.checkpoint),
    maxSpan: 0
  });
  assert.equal(result.status, "ANCESTRY_LINK_VERIFIED");
  assert.equal(result.header_count, 1);
});


test("adds probes around the next 512-block justification boundary", () => {
  const offsets = withJustificationPeriodOffsets(
    2463858,
    [0, 1, 52, 59, 60, 61, 119, 120, 121, 179, 180, 181, 239, 240, 241, 299, 300, 301],
    512,
    1
  );
  assert.deepEqual(offsets.slice(-3), [397, 398, 399]);
  assert.ok(offsets.includes(0));
  assert.ok(offsets.includes(301));
});

test("deduplicates period offsets and fails closed on unbounded probe input", () => {
  assert.deepEqual(withJustificationPeriodOffsets(511, [0, 1, 1], 512, 1), [0, 1, 2]);
  assert.throws(() => withJustificationPeriodOffsets(2463858, [5000], 512, 1), /CANDIDATE_OFFSET_OUT_OF_RANGE/);
  assert.throws(() => withJustificationPeriodOffsets(-1, [], 512, 1), /TARGET_BLOCK_NUMBER_INVALID/);
});

 
test("keeps the workflow witness tuple aligned with capture defaults", () => {
  const script = readFileSync(new URL("./capture-finality.mjs", import.meta.url), "utf8");
  const workflow = readFileSync(new URL("../../.github/workflows/materios-smoldot-p2p-finality-probe.yml", import.meta.url), "utf8");

  const scriptValue = (key) => {
    const line = script.split("\n").find((entry) => entry.trim().startsWith(key + ":"));
    assert.ok(line, "missing " + key + " in capture defaults");
    return line.slice(line.indexOf(":") + 1).trim().replace(/,$/, "").replace(/^"/, "").replace(/"$/, "");
  };
  const workflowInputDefault = (name) => {
    const lines = workflow.split("\n");
    const start = lines.findIndex((line) => line.trim() === name + ":");
    assert.notEqual(start, -1, "missing workflow input " + name);
    const defaultLine = lines.slice(start + 1, start + 8).find((line) => line.includes("default:"));
    assert.ok(defaultLine, "missing default for workflow input " + name);
    return defaultLine.split(":").slice(1).join(":").trim().replace(/^"/, "").replace(/"$/, "");
  };
  const environmentFallback = (name) => {
    const line = workflow.split("\n").find((entry) => entry.includes(name + ":"));
    assert.ok(line, "missing environment variable " + name);
    const marker = "|| '";
    const start = line.indexOf(marker);
    assert.notEqual(start, -1, "missing environment fallback for " + name);
    const remainder = line.slice(start + marker.length);
    const end = remainder.indexOf("'");
    assert.notEqual(end, -1, "malformed environment fallback for " + name);
    return remainder.slice(0, end);
  };

  const tuple = [
    ["targetNumber", "target_block_number", "MATERIOS_TARGET_BLOCK_NUMBER"],
    ["targetHash", "target_block_hash", "MATERIOS_TARGET_BLOCK_HASH"],
    ["targetStateRoot", "target_state_root", "MATERIOS_TARGET_STATE_ROOT"]
  ];
  for (const [scriptKey, inputKey, environmentKey] of tuple) {
    const expected = scriptValue(scriptKey);
    assert.equal(workflowInputDefault(inputKey), expected, inputKey + " differs from capture default " + scriptKey);
    assert.equal(environmentFallback(environmentKey), expected, environmentKey + " differs from capture default " + scriptKey);
  }
});
