#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const gate = path.join(here, "enforce-aiken-parity-gate.sh");
const base = {
  CACHE_HIT: "false",
  GATE_TESTS_OUTCOME: "success",
  HASKELL_FIXTURE_OUTCOME: "success",
  AIKEN_FIXTURE_TESTS_OUTCOME: "success",
  AIKEN_FIXTURE_PARITY_OUTCOME: "success",
  AIKEN_CHECK_OUTCOME: "success",
  AIKEN_BUILD_OUTCOME: "success",
};

function run(overrides = {}) {
  return spawnSync("bash", [gate], {
    encoding: "utf8",
    env: { ...process.env, ...base, ...overrides },
  });
}

const good = run();
assert.equal(good.status, 0, good.stderr);
assert.match(good.stdout, /PARITY_EVIDENCE_GATE=success/);

for (const [name, overrides, expected] of [
  ["parity skipped", { AIKEN_FIXTURE_PARITY_OUTCOME: "skipped" }, /Haskell-to-Aiken parity/],
  ["Haskell fixtures missing", { HASKELL_FIXTURE_OUTCOME: "failure" }, /canonical Haskell fixtures/],
  ["generated tests skipped", { AIKEN_FIXTURE_TESTS_OUTCOME: "skipped" }, /Aiken test generation/],
  ["gate self-test failed", { GATE_TESTS_OUTCOME: "failure" }, /gate self-tests/],
  ["check failed without cache", { AIKEN_CHECK_OUTCOME: "failure" }, /Aiken check/],
  ["build failed without cache", { AIKEN_BUILD_OUTCOME: "failure" }, /Aiken build/],
]) {
  const result = run(overrides);
  assert.notEqual(result.status, 0, `Expected fail-closed result for: ${name}`);
  assert.match(result.stdout, expected, `Wrong diagnostic for: ${name}`);
}

const cached = run({
  CACHE_HIT: "true",
  AIKEN_CHECK_OUTCOME: "skipped",
  AIKEN_BUILD_OUTCOME: "skipped",
});
assert.equal(cached.status, 0, cached.stdout + cached.stderr);
assert.match(cached.stdout, /PARITY_EVIDENCE_GATE=success/);

console.log("Aiken parity evidence gate tests passed (1 success, 6 fail-closed cases, 1 exact-cache case).");
