#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "immortal-evidence-test-"));
const input = path.join(temp, "input");
const output = path.join(temp, "output");
try {
  await fs.mkdir(input);
  const fixture = "test address=addr_test1qexample\nlocal_key=ed25519e_sk1abcdefghijklmnopqrstuvwxyz0123456789\n";
  await fs.writeFile(path.join(input, "yaci.log"), fixture);
  await fs.writeFile(path.join(input, "result.json"), JSON.stringify({ ok: true }) + "\n");

  const run = spawnSync(process.execPath, [path.join(here, "build-evidence-packet.mjs"), input, output], {
    encoding: "utf8",
    env: { ...process.env, GITHUB_REPOSITORY: "LiberoNuvola/Immortal-Protocol", GITHUB_SHA: "test-sha", GITHUB_RUN_ID: "123" },
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const sanitized = await fs.readFile(path.join(output, "yaci.log"), "utf8");
  assert.match(sanitized, /\[REDACTED_SECRET\]/);
  assert.doesNotMatch(sanitized, /ed25519e_sk1abcdefghijklmnopqrstuvwxyz/);
  assert.match(sanitized, /addr_test1qexample/, "public test address should not be classified as a private key");
  assert.equal(await fs.readFile(path.join(input, "yaci.log"), "utf8"), fixture, "input evidence must remain unchanged");

  const packet = JSON.parse(await fs.readFile(path.join(output, "packet.json"), "utf8"));
  assert.equal(packet.schema, "immortal.evidence-packet.v1");
  assert.equal(packet.source.repository, "LiberoNuvola/Immortal-Protocol");
  assert.equal(packet.source.commitSha, "test-sha");
  assert.equal(packet.fileCount, 2);
  assert.equal(packet.redactionCount, 1);
  const logEntry = packet.files.find((entry) => entry.path === "yaci.log");
  assert.equal(logEntry.sha256, crypto.createHash("sha256").update(sanitized).digest("hex"));
  console.log("Evidence packet tests passed.");
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
