import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { merkleRoot, prepareBlobData } from "@fluxpointstudios/orynq-sdk-anchors-materios";
import {
  buildOrynqReceiptPlan,
  dispositionMateriosSubmissionFailure
} from "../src/anchor-verified-evidence.js";

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


test("certification failure preserves landed receipt evidence and never permits resubmission", async () => {
  const error = Object.assign(new Error("DO_NOT_LOG private rpc or raw cause"), {
    name: "MateriosCertificationError",
    stage: "certification",
    result: {
      receiptId: "0xreceipt",
      blockHash: "0xblock",
      blockNumber: 77,
      txHash: "0xtx",
      confirmed: true,
      certHash: undefined,
      leafHash: "0xleaf",
      anchor: undefined
    }
  });

  const disposition = await dispositionMateriosSubmissionFailure(error, {}, {}, "0xreceipt");
  const rendered = JSON.stringify(disposition);
  const receipt = disposition.receipt as Record<string, unknown>;

  assert.equal(disposition.disposition, "receipt-already-landed-never-resubmit");
  assert.equal(disposition.safeToResubmit, false);
  assert.equal(disposition.failureStage, "certification");
  assert.equal(disposition.receiptIdMatchesPlan, true);
  assert.equal(receipt.receiptId, "0xreceipt");
  assert.equal(receipt.txHash, "0xtx");
  assert.equal(receipt.blockHash, "0xblock");
  assert.equal(rendered.includes("DO_NOT_LOG"), false);
});

test("inclusion-unknown calls resolveInclusion and preserves a landed disposition", async () => {
  const provider = { marker: "provider" };
  const error = Object.assign(new Error("DO_NOT_LOG"), {
    name: "MateriosSubmissionError",
    code: "inclusion-unknown",
    id: "0xreceipt",
    txHash: "0xtx",
    lastHead: { number: 90, hash: "0xhead" }
  });
  let calledWithProvider: unknown;
  let calledWithError: unknown;
  const sdk = {
    resolveInclusion: async (passedProvider: unknown, passedError: unknown) => {
      calledWithProvider = passedProvider;
      calledWithError = passedError;
      return { status: "landed", id: "0xreceipt", blockHash: "0xfinal", blockNumber: 91 };
    }
  };

  const disposition = await dispositionMateriosSubmissionFailure(error, provider, sdk, "0xreceipt");
  const resolution = disposition.resolution as Record<string, unknown>;

  assert.equal(calledWithProvider, provider);
  assert.equal(calledWithError, error);
  assert.equal(disposition.disposition, "finalized-inclusion-resolved-landed-never-resubmit");
  assert.equal(disposition.safeToResubmit, false);
  assert.equal(resolution.status, "landed");
  assert.equal(resolution.blockNumber, 91);
  assert.equal(JSON.stringify(disposition).includes("DO_NOT_LOG"), false);
});

test("inclusion-unknown fails closed when resolveInclusion is unavailable", async () => {
  const error = Object.assign(new Error("private details"), {
    name: "MateriosSubmissionError",
    code: "inclusion-unknown",
    id: "0xreceipt",
    txHash: "0xtx",
    lastHead: { number: 90, hash: "0xhead" }
  });

  const disposition = await dispositionMateriosSubmissionFailure(error, {}, {}, "0xreceipt");

  assert.equal(disposition.disposition, "finalized-inclusion-resolution-required-but-unavailable");
  assert.equal(disposition.safeToResubmit, false);
  assert.equal(disposition.receiptId, "0xreceipt");
  assert.equal(JSON.stringify(disposition).includes("private details"), false);
});

test("not-landed is retry-eligible only for the planned receipt id and never auto-retries", async () => {
  const matching = Object.assign(new Error("node-specific details"), {
    name: "MateriosSubmissionError",
    code: "not-landed",
    safeToResubmit: true,
    id: "0xreceipt",
    txHash: "0xtx"
  });
  const mismatching = Object.assign(new Error("node-specific details"), {
    name: "MateriosSubmissionError",
    code: "not-landed",
    safeToResubmit: true,
    id: "0xother",
    txHash: "0xtx"
  });

  const allowed = await dispositionMateriosSubmissionFailure(matching, {}, {}, "0xreceipt");
  const rejected = await dispositionMateriosSubmissionFailure(mismatching, {}, {}, "0xreceipt");

  assert.equal(allowed.disposition, "not-landed-same-id-and-payload-only");
  assert.equal(allowed.safeToResubmit, true);
  assert.equal(rejected.disposition, "not-landed-retry-eligibility-unverified");
  assert.equal(rejected.safeToResubmit, false);
});

test("dispatch errors never authorize resubmission", async () => {
  const error = Object.assign(new Error("private details"), {
    name: "MateriosSubmissionError",
    code: "dispatch",
    id: "0xreceipt",
    txHash: "0xtx"
  });

  const disposition = await dispositionMateriosSubmissionFailure(error, {}, {}, "0xreceipt");

  assert.equal(disposition.disposition, "correct-cause-do-not-resubmit-unchanged");
  assert.equal(disposition.safeToResubmit, false);
  assert.equal(JSON.stringify(disposition).includes("private details"), false);
});
