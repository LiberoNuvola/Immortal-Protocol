#!/usr/bin/env node
/**
 * Workflow C profile-manifest structural checker.
 *
 * This checks manifest shape, required references, digests and the 13 Ω checklist
 * identities. It does NOT prove χ/Safe/Accept/T/Ω semantics, cryptographic validity,
 * envelope completeness, VC2/VC3, or Kc non-emptiness.
 */
import fs from "node:fs";

export const OMEGA_ELEMENTS = Object.freeze([
  "Authority source",
  "Event-domain definition",
  "Actor independence",
  "Adaptive adversaries",
  "Repeated events",
  "Correlated events",
  "Timing",
  "Concurrency",
  "Liquidity shocks",
  "External truth / oracle failure",
  "Environment boundary",
  "Unknown / out-of-model events",
  "Failure behaviour",
]);

const HEX_40 = /^[0-9a-f]{40}$/;
const HEX_64 = /^[0-9a-f]{64}$/;
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

function requireString(value, path, errors) {
  if (!nonEmptyString(value)) errors.push(`${path}: expected non-empty string`);
}
function requireObject(value, path, errors) {
  if (!isObject(value)) errors.push(`${path}: expected object`);
}
function requireKeys(value, keys, path, errors) {
  if (!isObject(value)) return;
  for (const key of keys) {
    if (!(key in value)) errors.push(`${path}.${key}: required field missing`);
  }
}

export function validateProfileManifest(manifest) {
  const errors = [];
  requireObject(manifest, "manifest", errors);
  if (!isObject(manifest)) return { ok: false, errors };

  requireKeys(manifest, [
    "profileId", "profileVersion", "sourceCommit", "claimScope",
    "model", "certificate", "omegaDeclaration", "initialState", "evidencePacket",
  ], "manifest", errors);

  requireString(manifest.profileId, "profileId", errors);
  requireString(manifest.profileVersion, "profileVersion", errors);
  if (typeof manifest.sourceCommit !== "string" || !HEX_40.test(manifest.sourceCommit)) {
    errors.push("sourceCommit: expected 40-character lowercase Git SHA");
  }
  if (!["ABSTRACT_MODEL_ONLY", "IMPLEMENTATION_REFINEMENT", "CHAIN_DEPLOYMENT"].includes(manifest.claimScope)) {
    errors.push("claimScope: unsupported claim scope");
  }

  const modelKeys = [
    "stateSpaceRef", "actionUniverseRef", "admissibleActionsRef", "acceptanceRef",
    "environmentPerimeterRef", "omegaRef", "transitionRef", "safePredicateRef", "eevContractRef",
  ];
  requireObject(manifest.model, "model", errors);
  requireKeys(manifest.model, modelKeys, "model", errors);
  for (const key of modelKeys) requireString(manifest.model?.[key], `model.${key}`, errors);

  const certKeys = [
    "certificateId", "certificateVersion", "characteristicPredicateRef",
    "witnessSelectorRef", "boundsRef", "proofArtifacts",
  ];
  requireObject(manifest.certificate, "certificate", errors);
  requireKeys(manifest.certificate, certKeys, "certificate", errors);
  for (const key of certKeys.slice(0, 5)) requireString(manifest.certificate?.[key], `certificate.${key}`, errors);
  if (!Array.isArray(manifest.certificate?.proofArtifacts) || manifest.certificate.proofArtifacts.length === 0 ||
      !manifest.certificate.proofArtifacts.every(nonEmptyString)) {
    errors.push("certificate.proofArtifacts: expected non-empty array of non-empty references");
  }

  const omegaKeys = ["fixingAuthorityRef", "perimeterRef", "residualRiskRef", "elements", "completenessEvidenceRef"];
  requireObject(manifest.omegaDeclaration, "omegaDeclaration", errors);
  requireKeys(manifest.omegaDeclaration, omegaKeys, "omegaDeclaration", errors);
  for (const key of ["fixingAuthorityRef", "perimeterRef", "residualRiskRef", "completenessEvidenceRef"]) {
    requireString(manifest.omegaDeclaration?.[key], `omegaDeclaration.${key}`, errors);
  }
  const elements = manifest.omegaDeclaration?.elements;
  if (!Array.isArray(elements) || elements.length !== 13) {
    errors.push("omegaDeclaration.elements: expected exactly 13 entries");
  } else {
    const numbers = elements.map((entry) => entry?.number);
    if (new Set(numbers).size !== 13 || !numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 13)) {
      errors.push("omegaDeclaration.elements: numbers must be unique integers 1..13");
    }
    for (let i = 0; i < 13; i++) {
      const entry = elements.find((e) => e?.number === i + 1);
      if (!isObject(entry)) {
        errors.push(`omegaDeclaration.elements: missing element number ${i + 1}`);
        continue;
      }
      if (entry.element !== OMEGA_ELEMENTS[i]) {
        errors.push(`omegaDeclaration.elements[${i + 1}]: expected normative element "${OMEGA_ELEMENTS[i]}"`);
      }
      requireString(entry.evidenceRef, `omegaDeclaration.elements[${i + 1}].evidenceRef`, errors);
    }
  }

  const initialKeys = ["canonicalStateRef", "stateDigest", "derivationTraceRef", "chiEvaluationRef"];
  requireObject(manifest.initialState, "initialState", errors);
  requireKeys(manifest.initialState, initialKeys, "initialState", errors);
  for (const key of ["canonicalStateRef", "derivationTraceRef", "chiEvaluationRef"]) {
    requireString(manifest.initialState?.[key], `initialState.${key}`, errors);
  }
  if (typeof manifest.initialState?.stateDigest !== "string" || !HEX_64.test(manifest.initialState.stateDigest)) {
    errors.push("initialState.stateDigest: expected 64-character lowercase SHA-256 hex");
  }

  const packetKeys = [
    "checkerRef", "checkerVersion", "command", "rawOutputRef", "exitStatus",
    "artifactDigests", "assumptionsRef", "limitationsRef",
  ];
  requireObject(manifest.evidencePacket, "evidencePacket", errors);
  requireKeys(manifest.evidencePacket, packetKeys, "evidencePacket", errors);
  for (const key of ["checkerRef", "checkerVersion", "rawOutputRef", "assumptionsRef", "limitationsRef"]) {
    requireString(manifest.evidencePacket?.[key], `evidencePacket.${key}`, errors);
  }
  if (!Array.isArray(manifest.evidencePacket?.command) || manifest.evidencePacket.command.length === 0 ||
      !manifest.evidencePacket.command.every((part) => typeof part === "string")) {
    errors.push("evidencePacket.command: expected non-empty array of strings");
  }
  if (!Number.isInteger(manifest.evidencePacket?.exitStatus)) {
    errors.push("evidencePacket.exitStatus: expected integer exit status");
  }
  if (!Array.isArray(manifest.evidencePacket?.artifactDigests) || manifest.evidencePacket.artifactDigests.length === 0 ||
      !manifest.evidencePacket.artifactDigests.every((digest) => typeof digest === "string" && HEX_64.test(digest))) {
    errors.push("evidencePacket.artifactDigests: expected non-empty array of SHA-256 digests");
  }

  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node docs/workflow-c/validate-profile-manifest.mjs <manifest.json>");
    process.exitCode = 2;
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
      const result = validateProfileManifest(manifest);
      if (!result.ok) {
        console.error("STRUCTURAL INVALID");
        for (const error of result.errors) console.error(`- ${error}`);
        process.exitCode = 1;
      } else {
        console.log("STRUCTURAL PASS — manifest shape and Ω checklist only; no model/crypto proof implied.");
      }
    } catch (error) {
      console.error(`Could not read/parse manifest: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 2;
    }
  }
}
