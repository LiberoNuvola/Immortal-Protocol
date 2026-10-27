import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { merkleRoot, prepareBlobData } from "@fluxpointstudios/orynq-sdk-anchors-materios";
import { buildOrynqReceiptPlan } from "../src/anchor-verified-evidence.js";

function witness(nodeHex = "0x" + "ab".repeat(64)) {
  const blockHash = "0x" + "11".repeat(32);
  return {
    schema_version: "materios-b3-anchor-state-witness-v1",
    captured_at: "2026-10-27T00:00:00.000Z",
    rpc_endpoint: "https://private.example.invalid/archive",
    target: {
      block_hash: blockHash,
      block_number: "4242",
      checkpoint_source: "fixture",
      state_root: "0x" + "22".repeat(32),
      storage_key: "0x" + "33".repeat(64)
    },
    anchor_record: { scale_hex: "0x" + "44".repeat(64) },
    storage_proof: {
      at: blockHash,
      format: "state_getReadProof.proof node-hex array",
      nodes: [nodeHex, "0x" + "cd".repeat(80)],
      scale_hex: "0x" + "55".repeat(96)
    },
    verification: {
      state_root_storage_proof: "verified",
      scope: "exact header.stateRoot + exact storage key + exact returned value"
    }
  };
}

test("receipt root is the Merkle root of uploaded chunks, not the content hash", () => {
  const plan = buildOrynqReceiptPlan(witness("0x" + "ab".repeat(160_000)));
  const contentHash = "0x" + createHash("sha256").update(plan.content).digest("hex");
  const { manifest } = prepareBlobData(plan.receiptId, plan.content);
  const expectedChunkRoot = merkleRoot(manifest.chunks.map((chunk) => chunk.sha256));

  assert.ok(plan.chunkCount > 1, "fixture must cross the 256 KiB chunk boundary");
  assert.equal(plan.contentHash, contentHash);
  assert.equal(plan.chunkMerkleRoot, expectedChunkRoot);
  assert.notEqual(plan.chunkMerkleRoot, plan.contentHash);
  assert.equal(
    plan.receiptId,
    "0x" + createHash("sha256").update(Buffer.from(plan.contentHash.slice(2), "hex")).digest("hex")
  );
});

test("normalizes away RPC endpoint and capture-time metadata", () => {
  const plan = buildOrynqReceiptPlan(witness());
  const payload = JSON.parse(plan.content.toString("utf8")) as Record<string, unknown>;

  assert.equal(payload.schema_version, "immortal-materios-b3-orynq-receipt-v1");
  assert.equal("rpc_endpoint" in payload, false);
  assert.equal("captured_at" in payload, false);
});

test("fails closed when storage proof is not marked verified", () => {
  const value = witness();
  value.verification.state_root_storage_proof = "pending";
  assert.throws(() => buildOrynqReceiptPlan(value), /MATERIOS_STORAGE_PROOF_NOT_VERIFIED/);
});

test("fails closed when the read proof targets a different block", () => {
  const value = witness();
  value.storage_proof.at = "0x" + "99".repeat(32);
  assert.throws(() => buildOrynqReceiptPlan(value), /MATERIOS_STORAGE_PROOF_BLOCK_MISMATCH/);
});

test("fails closed when proof scope is not the exact state-root/value boundary", () => {
  const value = witness();
  value.verification.scope = "best-effort";
  assert.throws(() => buildOrynqReceiptPlan(value), /MATERIOS_STORAGE_PROOF_SCOPE_MISMATCH/);
});
