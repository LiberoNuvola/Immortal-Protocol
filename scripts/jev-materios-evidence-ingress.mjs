#!/usr/bin/env node
import { createHash } from "node:crypto";

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const fail = (code) => { throw new Error(code); };
const isUri = (value) => {
  if (typeof value !== "string") return false;
  try { const u = new URL(value); return Boolean(u.protocol && u.host); } catch { return false; }
};
const isHex32 = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);

/**
 * Convert an existing PoC-0 CanonicalCheckpoint.json into explicit JEV checks.
 * The source bytes are hashed as received. This validates extraction structure,
 * not GRANDPA finality, storage inclusion, or canonicality.
 */
export function buildMateriosJevInput({
  checkpointBytes,
  sourceUri,
  metadata,
  expectedChainId,
  now = new Date(),
  maxAgeSeconds = null
}) {
  if (!(Buffer.isBuffer(checkpointBytes) || checkpointBytes instanceof Uint8Array || typeof checkpointBytes === "string")) fail("INVALID_CHECKPOINT_BYTES");
  if (!isUri(sourceUri)) fail("INVALID_SOURCE_URI");
  if (!isObject(metadata)) fail("INVALID_JEV_METADATA");
  for (const field of ["repository", "commitSha", "ref", "executionContext"]) {
    if (typeof metadata[field] !== "string" || !metadata[field].trim()) fail("INVALID_JEV_METADATA_" + field.toUpperCase());
  }
  if (!/^[0-9a-f]{40}$/.test(metadata.commitSha)) fail("INVALID_JEV_METADATA_COMMIT_SHA");
  const bytes = Buffer.from(checkpointBytes);
  let cp;
  try { cp = JSON.parse(bytes.toString("utf8")); } catch { fail("INVALID_CHECKPOINT_JSON"); }
  if (!isObject(cp)) fail("INVALID_CHECKPOINT_OBJECT");

  const chainId = cp.chain_id;
  const checkpoint = cp.checkpoint;
  const grandpa = cp.grandpa;
  const extraction = cp.extraction;
  if (typeof chainId !== "string" || !chainId.trim()) fail("INVALID_CHECKPOINT_CHAIN_ID");
  if (typeof expectedChainId !== "string" || !expectedChainId.trim()) fail("EXPECTED_CHAIN_ID_REQUIRED");
  if (chainId !== expectedChainId) fail("CHECKPOINT_CHAIN_ID_MISMATCH");
  if (!isObject(checkpoint) || !/^\d+$/.test(checkpoint.block_number ?? "") ||
      !isHex32(checkpoint.block_hash) || !isHex32(checkpoint.state_root) ||
      !isHex32(checkpoint.parent_hash)) fail("INVALID_CHECKPOINT_FIELDS");
  if (!Number.isSafeInteger(cp.runtime_spec_version) || cp.runtime_spec_version < 0 ||
      typeof cp.runtime_spec_name !== "string" || !cp.runtime_spec_name.trim()) fail("INVALID_RUNTIME_METADATA");
  if (!isObject(grandpa) || !/^\d+$/.test(grandpa.set_id ?? "") ||
      !Number.isSafeInteger(grandpa.authority_count) || grandpa.authority_count < 1 ||
      !Array.isArray(grandpa.authorities) || grandpa.authorities.length !== grandpa.authority_count ||
      !isHex32(grandpa.authority_commitment)) fail("INVALID_GRANDPA_EXTRACTION_FIELDS");
  for (const authority of grandpa.authorities) {
    if (!isObject(authority) || !isHex32(authority.public_key) || !/^\d+$/.test(authority.weight ?? "")) {
      fail("INVALID_GRANDPA_AUTHORITY");
    }
  }
  if (!isObject(extraction) || typeof extraction.timestamp_iso8601 !== "string" ||
      Number.isNaN(Date.parse(extraction.timestamp_iso8601))) fail("INVALID_EXTRACTION_TIMESTAMP");

  const observedAt = new Date(extraction.timestamp_iso8601);
  const current = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(current.getTime())) fail("INVALID_NOW");
  if (maxAgeSeconds !== null) {
    if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds < 0) fail("INVALID_MAX_AGE");
    const ageSeconds = (current.getTime() - observedAt.getTime()) / 1000;
    if (ageSeconds < 0 || ageSeconds > maxAgeSeconds) fail("CHECKPOINT_OBSERVATION_STALE");
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const sourceRef = { kind: "artifact", uri: sourceUri, sha256, note: "SHA-256 computed over exact CanonicalCheckpoint.json bytes supplied to the adapter." };
  const limitations = [
    "PoC-0 checkpoint extraction only; this check does not verify GRANDPA finality.",
    "No storage proof or independent canonicality proof is established.",
    "A locally computed digest identifies these bytes; it does not prove the source claims are true."
  ];
  const extractionOutcome = "success";
  return {
    metadata: {
      ...metadata,
      generatedAt: current.toISOString()
    },
    checks: [
      {
        checkId: "MATERIOS.CHECKPOINT.EXTRACTION",
        requirementRef: "JEV Materios ingress v0.1 / validate PoC-0 CanonicalCheckpoint structure and configured chain identity",
        stepOutcome: extractionOutcome,
        evidenceRefs: [sourceRef],
        observedValue: { chainId, blockNumber: checkpoint.block_number, blockHash: checkpoint.block_hash, stateRoot: checkpoint.state_root, runtimeSpecVersion: cp.runtime_spec_version, authorityCount: grandpa.authority_count },
        limitations
      },
      {
        checkId: "MATERIOS.ARTIFACT.DIGEST",
        requirementRef: "JEV Materios ingress v0.1 / compute SHA-256 over exact checkpoint artifact bytes",
        stepOutcome: "success",
        evidenceRefs: [sourceRef],
        observedValue: { algorithm: "SHA-256", digest: sha256 },
        limitations: ["Digest computation does not independently authenticate the artifact producer."]
      },
      {
        checkId: "MATERIOS.GRANDPA.FINALITY",
        requirementRef: "JEV Materios ingress v0.1 / independently verify GRANDPA finality",
        stepOutcome: "skipped",
        evidenceRefs: [sourceRef],
        limitations: ["No finality verifier result is supplied to this mapper; extraction cannot be promoted to finality verification."]
      },
      {
        checkId: "MATERIOS.STORAGE.PROOF",
        requirementRef: "JEV Materios ingress v0.1 / verify a storage proof against the exact checkpoint state root",
        stepOutcome: "skipped",
        evidenceRefs: [sourceRef],
        limitations: ["No storage proof is supplied to this mapper."]
      },
      {
        checkId: "MATERIOS.CANONICALITY",
        requirementRef: "JEV Materios ingress v0.1 / establish canonicality from independently verified evidence",
        stepOutcome: "skipped",
        evidenceRefs: [sourceRef],
        limitations: ["Canonicality is not established by extraction, metadata validation, or hashing."]
      }
    ]
  };
}
