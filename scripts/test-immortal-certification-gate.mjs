import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const checker = path.join(root, "scripts/immortal-certification-gate.mjs");
const manifest = path.join(
  root,
  "docs/02-certification/IMMORTAL-CLOSURE-EVIDENCE-MANIFEST.json"
);
const temp = path.join(
  root,
  "docs/02-certification/.immortal-gate-test-manifest.json"
);

function run(args = []) {
  return spawnSync(process.execPath, [checker, ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

test("manifest corrente: struttura valida, nessuna certificazione runtime", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /struttura valida/i);
});

test("un gate GREEN senza verifica runtime viene rifiutato", () => {
  const data = JSON.parse(fs.readFileSync(manifest, "utf8"));
  data.gates[0].status = "GREEN";
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + "\n");

  try {
    const result = run(["--manifest", path.relative(root, temp)]);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, /GREEN bloccato/i);
  } finally {
    fs.rmSync(temp, { force: true });
  }
});

test("--require-closure non può approvare gate non certificati", () => {
  const result = run(["--require-closure"]);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /require-closure non disponibile/i);
});

test("un manifest JSON null viene rifiutato", () => {
  fs.writeFileSync(temp, "null");

  try {
    const result = run(["--manifest", path.relative(root, temp)]);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, /deve essere un oggetto JSON/i);
  } finally {
    fs.rmSync(temp, { force: true });
  }
});

test("un manifest con schema errato viene rifiutato", () => {
  const data = JSON.parse(fs.readFileSync(manifest, "utf8"));
  data.schemaVersion = "schema-errato";
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + "\n");

  try {
    const result = run(["--manifest", path.relative(root, temp)]);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, /schemaVersion non riconosciuta/i);
  } finally {
    fs.rmSync(temp, { force: true });
  }
});
