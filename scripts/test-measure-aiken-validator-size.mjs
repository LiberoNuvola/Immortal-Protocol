#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const analyzer = path.join(here, "measure-aiken-validator-size.mjs");
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "aiken-size-test-"));
try {
  const config = path.join(temp, "aiken.toml");
  const blueprint = path.join(temp, "plutus.json");
  const report = path.join(temp, "report.json");
  await fs.writeFile(config, 'plutus = "v3"\n');

  async function run(codeHex) {
    await fs.writeFile(blueprint, JSON.stringify({
      validators: [
        { title: "reveal.pre_rich_reveal.spend", hash: "abc123", compiledCode: codeHex },
        { title: "reveal.pre_rich_reveal.else", hash: "abcdef", compiledCode: "aa".repeat(120) },
        { title: "unrelated.validator", hash: "def456", compiledCode: "deadbeef" },
      ],
    }));
    return spawnSync(process.execPath, [analyzer, config, blueprint, report], { encoding: "utf8" });
  }

  const below = await run("ab".repeat(100));
  assert.equal(below.status, 0, below.stderr);
  const measured = JSON.parse(await fs.readFile(report, "utf8"));
  assert.equal(measured.targetLanguageVersion, "v3");
  assert.equal(measured.validators.length, 1);
  assert.equal(measured.validators[0].compiledScriptBytesLowerBound, 100);
  assert.equal(measured.result, "LOWER_BOUND_BELOW_LIMIT_FULL_DEPLOYABILITY_UNPROVEN");
  assert.equal(measured.fullTransactionSize, "NOT_MEASURED");
  assert.equal(measured.deploymentGateClosed, true);

  const atLimit = await run("ab".repeat(16_384));
  assert.notEqual(atLimit.status, 0, "A script at the transaction byte ceiling must fail closed");
  const impossible = JSON.parse(await fs.readFile(report, "utf8"));
  assert.equal(impossible.result, "IMPOSSIBLE_UNDER_TRANSACTION_SIZE_LIMIT");

  await fs.writeFile(blueprint, JSON.stringify({ validators: [{ title: "some.other", compiledCode: "ab" }] }));
  const missing = spawnSync(process.execPath, [analyzer, config, blueprint, report], { encoding: "utf8" });
  assert.notEqual(missing.status, 0, "Missing target validator must fail closed");

  await fs.writeFile(blueprint, JSON.stringify({ validators: [{ title: "reveal.pre_rich_reveal.spend", compiledCode: "xyz" }] }));
  const malformed = spawnSync(process.execPath, [analyzer, config, blueprint, report], { encoding: "utf8" });
  assert.notEqual(malformed.status, 0, "Malformed compiledCode must fail closed");

  console.log("Aiken script-size analyzer tests passed (below-limit evidence, hard-limit fail-closed, missing/malformed artifact).");
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
