import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  MateriosProvider,
  merkleRoot,
  prepareBlobData,
  submitCertifiedReceipt
} from "@fluxpointstudios/orynq-sdk-anchors-materios";

const MAX_PACKET_BYTES = 32 * 1024 * 1024;
const VERIFIED_SCOPE = "exact header.stateRoot + exact storage key + exact returned value";
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

type JsonRecord = Record<string, unknown>;

export interface OrynqReceiptPlan {
  readonly content: Buffer;
  readonly contentHash: string;
  readonly receiptId: string;
  readonly chunkMerkleRoot: string;
  readonly chunkCount: number;
  readonly byteLength: number;
  readonly witnessBlockHash: string;
  readonly witnessBlockNumber: string;
  readonly evidenceSchema: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function field(record: JsonRecord, key: string, context: string): unknown {
  if (!(key in record)) throw new Error("MISSING_" + context.toUpperCase() + "_" + key.toUpperCase());
  return record[key];
}

function recordField(record: JsonRecord, key: string, context: string): JsonRecord {
  const value = field(record, key, context);
  if (!isRecord(value)) throw new Error("INVALID_" + context.toUpperCase() + "_" + key.toUpperCase());
  return value;
}

function stringField(record: JsonRecord, key: string, context: string): string {
  const value = field(record, key, context);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("INVALID_" + context.toUpperCase() + "_" + key.toUpperCase());
  }
  return value;
}

function hexField(
  record: JsonRecord,
  key: string,
  context: string,
  exactBytes?: number
): string {
  const value = stringField(record, key, context);
  const normalized = value.startsWith("0x") ? value : "0x" + value;
  const hex = normalized.slice(2);
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("INVALID_HEX_" + context.toUpperCase() + "_" + key.toUpperCase());
  }
  if (exactBytes !== undefined && hex.length !== exactBytes * 2) {
    throw new Error("INVALID_LENGTH_" + context.toUpperCase() + "_" + key.toUpperCase());
  }
  return "0x" + hex.toLowerCase();
}

function sha256Hex(bytes: Uint8Array): string {
  return "0x" + createHash("sha256").update(bytes).digest("hex");
}

function normalizeVerifiedWitness(input: unknown): JsonRecord {
  if (!isRecord(input)) throw new Error("INVALID_MATERIOS_WITNESS_PACKET");

  if (input.schema_version !== "materios-b3-anchor-state-witness-v1") {
    throw new Error("UNSUPPORTED_MATERIOS_WITNESS_SCHEMA");
  }

  const target = recordField(input, "target", "witness");
  const anchor = recordField(input, "anchor_record", "witness");
  const proof = recordField(input, "storage_proof", "witness");
  const verification = recordField(input, "verification", "witness");

  if (verification.state_root_storage_proof !== "verified") {
    throw new Error("MATERIOS_STORAGE_PROOF_NOT_VERIFIED");
  }
  if (verification.scope !== VERIFIED_SCOPE) {
    throw new Error("MATERIOS_STORAGE_PROOF_SCOPE_MISMATCH");
  }

  const blockHash = hexField(target, "block_hash", "target", 32);
  const stateRoot = hexField(target, "state_root", "target", 32);
  const storageKey = hexField(target, "storage_key", "target");
  const blockNumber = stringField(target, "block_number", "target");
  if (!/^(0|[1-9][0-9]*)$/.test(blockNumber)) {
    throw new Error("INVALID_TARGET_BLOCK_NUMBER");
  }

  const proofAt = hexField(proof, "at", "storage_proof", 32);
  if (proofAt !== blockHash) {
    throw new Error("MATERIOS_STORAGE_PROOF_BLOCK_MISMATCH");
  }

  const anchorValue = hexField(anchor, "scale_hex", "anchor_record");
  const proofScaleHex = hexField(proof, "scale_hex", "storage_proof");
  const nodesValue = field(proof, "nodes", "storage_proof");
  if (!Array.isArray(nodesValue) || nodesValue.length === 0) {
    throw new Error("INVALID_MATERIOS_STORAGE_PROOF_NODES");
  }
  const nodes = nodesValue.map((node, index) => {
    if (typeof node !== "string" || node.length === 0) {
      throw new Error("INVALID_MATERIOS_STORAGE_PROOF_NODE_" + index);
    }
    const normalized = node.startsWith("0x") ? node : "0x" + node;
    if (!/^[0-9a-fA-F]+$/.test(normalized.slice(2)) || normalized.length % 2 !== 0) {
      throw new Error("INVALID_MATERIOS_STORAGE_PROOF_NODE_" + index);
    }
    return normalized.toLowerCase();
  });

  // Deliberately omit rpc_endpoint, captured_at and arbitrary caller fields.
  // This reduces accidental disclosure and gives the receipt a stable schema.
  return {
    schema_version: "immortal-materios-b3-orynq-receipt-v1",
    evidence_kind: "materios-b3-anchor-state-witness",
    source_witness_schema: input.schema_version,
    target: {
      block_hash: blockHash,
      block_number: blockNumber,
      state_root: stateRoot,
      storage_key: storageKey
    },
    anchor_record: {
      scale_hex: anchorValue
    },
    storage_proof: {
      at: proofAt,
      format: "state_getReadProof.proof node-hex array",
      nodes,
      scale_hex: proofScaleHex
    },
    verification: {
      state_root_storage_proof: "verified",
      scope: VERIFIED_SCOPE
    }
  };
}

/**
 * Build the exact blob payload that will be uploaded to Orynq/Materios.
 * The source artifact must already have passed the B3-B Rust storage-proof
 * verifier. This function checks its declared boundary, but does not itself
 * substitute for running that verifier or for independent GRANDPA finality.
 */
export function buildOrynqReceiptPlan(input: unknown): OrynqReceiptPlan {
  const normalized = normalizeVerifiedWitness(input);
  const content = Buffer.from(JSON.stringify(normalized), "utf8");
  if (content.length === 0 || content.length > MAX_PACKET_BYTES) {
    throw new Error("MATERIOS_EVIDENCE_PACKET_SIZE_INVALID");
  }

  const contentHash = sha256Hex(content);
  // This mirrors the SDK default: SHA-256 of the 32 content-hash bytes.
  const receiptId = sha256Hex(Buffer.from(contentHash.slice(2), "hex"));
  const { manifest } = prepareBlobData(receiptId, content);
  const chunkMerkleRoot = merkleRoot(manifest.chunks.map((chunk) => chunk.sha256));

  const target = normalized.target as JsonRecord;
  return {
    content,
    contentHash,
    receiptId,
    chunkMerkleRoot,
    chunkCount: manifest.chunk_count,
    byteLength: content.length,
    witnessBlockHash: String(target.block_hash),
    witnessBlockNumber: String(target.block_number),
    evidenceSchema: String(normalized.schema_version)
  };
}


/**
 * Re-run the repository's Rust storage-proof verifier before exposing the
 * witness to a live submitter. The JSON's verification flag alone is not a
 * cryptographic attestation and is never accepted as a substitute for this
 * local verification.
 */
function verifyStorageProofWithRust(input: unknown): void {
  if (!isRecord(input)) throw new Error("INVALID_MATERIOS_EVIDENCE_PACKET");
  const target = recordField(input, "target", "witness");
  const anchor = recordField(input, "anchor_record", "witness");
  const proof = recordField(input, "storage_proof", "witness");
  const stateRoot = hexField(target, "state_root", "target", 32);
  const storageKey = hexField(target, "storage_key", "target");
  const expectedValue = hexField(anchor, "scale_hex", "anchor_record");
  const expectedProofHex = hexField(proof, "scale_hex", "storage_proof");
  const nodeValues = field(proof, "nodes", "storage_proof");
  if (!Array.isArray(nodeValues) || nodeValues.length === 0) {
    throw new Error("INVALID_MATERIOS_STORAGE_PROOF_NODES");
  }
  const nodes = nodeValues.map((node, index) => {
    if (typeof node !== "string" || node.length === 0) {
      throw new Error("INVALID_MATERIOS_STORAGE_PROOF_NODE_" + index);
    }
    const normalized = node.startsWith("0x") ? node : "0x" + node;
    if (!/^[0-9a-fA-F]+$/.test(normalized.slice(2)) || normalized.length % 2 !== 0) {
      throw new Error("INVALID_MATERIOS_STORAGE_PROOF_NODE_" + index);
    }
    return normalized.toLowerCase();
  });
  const manifest = resolve(REPO_ROOT, "poc/materios-execution-verifier/Cargo.toml");
  const run = spawnSync(
    "cargo",
    ["run", "--quiet", "--manifest-path", manifest, "--bin", "verify-storage-witness", "--", stateRoot, storageKey, expectedValue],
    {
      cwd: REPO_ROOT,
      input: nodes.join("\n") + "\n",
      encoding: "utf8",
      timeout: 600_000,
      maxBuffer: MAX_PACKET_BYTES * 2
    }
  );
  if (run.error) {
    throw new Error("MATERIOS_RUST_VERIFIER_EXECUTION_FAILED: " + run.error.message);
  }
  if (run.status !== 0) {
    const details = (run.stderr ?? "").trim().slice(-2000);
    throw new Error("MATERIOS_RUST_STORAGE_PROOF_INVALID" + (details ? ": " + details : ""));
  }
  const verifiedProofHex = (run.stdout ?? "").trim().toLowerCase();
  if (verifiedProofHex !== expectedProofHex) {
    throw new Error("MATERIOS_RUST_VERIFIER_OUTPUT_MISMATCH");
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) throw new Error("REQUIRED_ENV_" + name);
  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const submit = args.includes("--submit");
  const waitForAnchor = args.includes("--wait-for-anchor");
  const inputPathArg = args.find((arg) => !arg.startsWith("--"));
  if (waitForAnchor && !submit) throw new Error("WAIT_FOR_ANCHOR_REQUIRES_SUBMIT");
  if (submit && process.env.MATERIOS_CONFIRM_SUBMISSION !== "YES") {
    throw new Error("LIVE_SUBMISSION_REQUIRES_MATERIOS_CONFIRM_SUBMISSION_YES");
  }
  const inputPath = resolve(REPO_ROOT, inputPathArg ?? "poc/materios-checkpoint/out/MateriosB3AnchorStateWitness.verified.json");
  const raw = await readFile(inputPath);
  if (raw.byteLength > MAX_PACKET_BYTES) throw new Error("MATERIOS_EVIDENCE_PACKET_SIZE_INVALID");
  const packet: unknown = JSON.parse(raw.toString("utf8"));
  const plan = buildOrynqReceiptPlan(packet);
  verifyStorageProofWithRust(packet);

  const planSummary = {
    evidenceSchema: plan.evidenceSchema,
    witnessBlockHash: plan.witnessBlockHash,
    witnessBlockNumber: plan.witnessBlockNumber,
    contentHash: plan.contentHash,
    receiptId: plan.receiptId,
    chunkMerkleRoot: plan.chunkMerkleRoot,
    chunkCount: plan.chunkCount,
    byteLength: plan.byteLength,
    note: "Blob receipt: SDK 0.6.2 submits the uploaded-chunk Merkle root, not the semantic/content hash."
  };

  if (!submit) {
    console.log(JSON.stringify({
      mode: "dry-run",
      plan: planSummary,
      nextStep: "To submit a transaction, pass --submit and set MATERIOS_CONFIRM_SUBMISSION=YES."
    }, null, 2));
    return;
  }

  const provider = new MateriosProvider({
    rpcUrl: requiredEnv("MATERIOS_RPC_URL"),
    signerUri: requiredEnv("MATERIOS_SIGNER_URI")
  });
  try {
    await provider.connect();
    const keypair = provider.getKeypair();
    const gatewayBaseUrl = requiredEnv("MATERIOS_BLOB_GATEWAY_URL");
    const certificationTimeoutMs = Number(process.env.MATERIOS_CERT_TIMEOUT_MS ?? "600000");
    const anchorTimeoutMs = Number(process.env.MATERIOS_ANCHOR_TIMEOUT_MS ?? "1800000");
    if (!Number.isSafeInteger(certificationTimeoutMs) || certificationTimeoutMs <= 0) {
      throw new Error("INVALID_MATERIOS_CERT_TIMEOUT_MS");
    }
    if (!Number.isSafeInteger(anchorTimeoutMs) || anchorTimeoutMs <= 0) {
      throw new Error("INVALID_MATERIOS_ANCHOR_TIMEOUT_MS");
    }

    const result = await submitCertifiedReceipt(
      provider,
      {
        contentHash: plan.contentHash,
        // For a blob receipt the SDK replaces this placeholder with the chunk Merkle root.
        // Do not set schemaHash: the deployed certifier's schema-aware semantics are not assumed.
        rootHash: plan.contentHash,
        manifestHash: plan.contentHash,
        receiptId: plan.receiptId
      },
      plan.content,
      {
        blobGateway: {
          baseUrl: gatewayBaseUrl,
          // Prefer request-bound sr25519 signatures over a shared raw API key.
          signerKeypair: {
            address: keypair.address,
            sign: (message) => keypair.sign(message)
          }
        },
        waitForAnchor,
        certificationPollOpts: { timeoutMs: certificationTimeoutMs },
        anchorPollOpts: { timeoutMs: anchorTimeoutMs }
      }
    );

    if (result.confirmed !== true) {
      throw new Error("MATERIOS_RECEIPT_STORAGE_CONFIRMATION_MISSING");
    }
    if (waitForAnchor && !result.anchor) {
      throw new Error("MATERIOS_L1_ANCHOR_NOT_CONFIRMED");
    }

    console.log(JSON.stringify({
      mode: "submitted",
      plan: planSummary,
      receipt: {
        receiptId: result.receiptId,
        blockHash: result.blockHash,
        blockNumber: result.blockNumber,
        txHash: result.txHash,
        confirmed: result.confirmed,
        certHash: result.certHash,
        leafHash: result.leafHash,
        anchor: result.anchor ?? null
      },
      qualification: {
        receiptSubmission: "confirmed",
        certification: result.certHash ? "observed" : "not-observed",
        l1Anchor: result.anchor ? "observed" : "not-requested",
        independentStorageProof: "must be preserved from the Rust verifier evidence",
        grandpaFinality: "not established by this SDK bridge"
      }
    }, null, 2));
  } finally {
    await provider.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
