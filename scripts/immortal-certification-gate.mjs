#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REQUIRED = {
  G1: ["native-cardano-ledger", "persisted-ledger-evaluation-packet"],
  G2: ["real-preprod-reveal", "observed-transaction-size", "real-reveal-ledger-evaluation"],
  G3: ["grandpa-finality-witness", "state-storage-proof", "authority-transition-provenance"],
  G4: ["protected-capital-provenance", "economic-gate-runtime-evidence", "v3-cardano-semantic-correspondence"],
  G5: ["governance-runtime-evidence", "canonical-replay-evidence"],
  G6: ["canonical-treasury-witness", "authenticated-oracle-witness", "genesis-carrier-evidence"],
  G7: ["eev-ev1-ev7-deployment-approval", "viability-kc-omega-certificate", "rf8-no-side-door-evidence"]
};

let failed = false;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failed = true;
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  const value = process.argv[i + 1];
  if (!value || value.startsWith("--")) {
    fail(`${name} richiede un valore.`);
    return fallback;
  }
  return value;
}

function main() {
  const root = path.resolve(arg("--repo-root", "."));
  const manifestArg = arg(
    "--manifest",
    "docs/02-certification/IMMORTAL-CLOSURE-EVIDENCE-MANIFEST.json"
  );
  const manifestPath = path.resolve(root, manifestArg);
  const relative = path.relative(root, manifestPath);

  if (failed) return;

  if (!relative || relative === ".." ||
      relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail("Il manifest deve essere un file dentro la repository.");
    return;
  }

  if (!fs.existsSync(manifestPath)) {
    fail(`Manifest non trovato: ${manifestPath}`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`JSON non valido: ${error.message}`);
    return;
  }

  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    fail("Il manifest deve essere un oggetto JSON, non null, array o valore primitivo.");
    return;
  }

  if (manifest.schemaVersion !== "immortal-closure-evidence-manifest/v1")
    fail("schemaVersion non riconosciuta.");

  if (manifest.policyVersion !== "2026-10-24.v1")
    fail("policyVersion non riconosciuta.");

  if (manifest.repository !== "LiberoNuvola/Immortal-Protocol")
    fail("Repository non canonica.");

  if (!Array.isArray(manifest.gates)) {
    fail("gates deve essere un array.");
  } else {
    const ids = manifest.gates.map(g => g?.id);

    if (
      ids.length !== 7 ||
      new Set(ids).size !== 7 ||
      !Object.keys(REQUIRED).every(id => ids.includes(id))
    ) {
      fail("Il manifest deve contenere esattamente G1-G7.");
    }

    for (const [id, required] of Object.entries(REQUIRED)) {
      const gate = manifest.gates.find(g => g?.id === id);
      if (!gate) continue;

      if (!["OPEN", "INCONCLUSIVE", "GREEN", "CLOSED"].includes(gate.status))
        fail(`${id}: status non ammesso.`);

      if (!Array.isArray(gate.requiredEvidenceClasses)) {
        fail(`${id}: requiredEvidenceClasses deve essere un array.`);
      } else {
        for (const cls of required) {
          if (!gate.requiredEvidenceClasses.includes(cls))
            fail(`${id}: requisito obbligatorio mancante: ${cls}`);
        }
      }

      if (!Array.isArray(gate.evidence))
        fail(`${id}: evidence deve essere un array.`);

      // Il checker strutturale non certifica prove runtime.
      if (["GREEN", "CLOSED"].includes(gate.status))
        fail(`${id}: ${gate.status} bloccato; verifica runtime non ancora abilitata.`);
    }
  }

  if (process.argv.includes("--require-closure")) {
    fail("--require-closure non disponibile: i contratti di prova runtime non sono ancora implementati.");
  }

  if (!failed)
    console.log("PASS: struttura valida; nessuna certificazione runtime concessa.");
}

try {
  main();
} catch (error) {
  fail(`Errore inatteso: ${error.message}`);
}

if (failed) process.exitCode = 1;
