/**
 * Capture the exact finalized Materios state needed by the B3/M6 handoff.
 *
 * This tool is evidence extraction only:
 * - it asks the node for chain_getFinalizedHead();
 * - it binds all subsequent state/runtime reads to that exact hash;
 * - it does NOT verify GRANDPA cryptographically;
 * - it does NOT verify StorageProof cryptographically;
 * - it does NOT reimplement Ariadne/Materios selector logic.
 *
 * Output is intentionally compact: runtime code bytes are measured and
 * SHA-256 hashed locally, but the full WASM blob is not embedded in JSON.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { blake2b } from "@noble/hashes/blake2.js";

import { MateriosRpc } from "./rpc.js";
import { decodeAuthorityList, decodeSetId, parseHeaderNumber } from "./scale.js";

const __dir = dirname(fileURLToPath(import.meta.url));

const RPC =
  process.env.MATERIOS_RPC ??
  "https://materios.fluxpointstudios.com/preprod-rpc";

const CHAIN_ID =
  process.env.MATERIOS_CHAIN_ID ??
  "materios_preprod_v6";

function bytesFromHex(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "");
  if (clean.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(clean)) {
    throw new Error("runtime code is not valid even-length hex");
  }
  return Uint8Array.from(Buffer.from(clean, "hex"));
}

function sha256Hex(hex: string): string {
  return "0x" + createHash("sha256").update(bytesFromHex(hex)).digest("hex");
}

function blake2_256Hex(hex: string): string {
  return "0x" + Buffer.from(blake2b(bytesFromHex(hex), { dkLen: 32 })).toString("hex");
}

async function main(): Promise<void> {
  const rpc = new MateriosRpc(RPC);

  console.log("Materios finalized-state capture");
  console.log("RPC:", RPC);
  console.log("Claim: extraction only — no independent finality proof");

  const finalizedHash = await rpc.getFinalizedHead();
  const header = await rpc.getHeader(finalizedHash);
  const runtime = await rpc.getRuntimeVersion(finalizedHash);
  const runtimeCodeHex = await rpc.getRuntimeCode(finalizedHash);

  const authoritiesHex = await rpc.stateCall(
    "GrandpaApi_grandpa_authorities",
    "0x",
    finalizedHash,
  );
  const setIdHex = await rpc.stateCall(
    "GrandpaApi_current_set_id",
    "0x",
    finalizedHash,
  );

  const authorities = decodeAuthorityList(authoritiesHex);
  const setId = decodeSetId(setIdHex);
  const blockNumber = parseHeaderNumber(header.number);
  const codeSha256 = sha256Hex(runtimeCodeHex);

  let grandpaFinalityProof: {
    status: "captured" | "unavailable";
    proof_hex: string | null;
    error?: string;
  } = {
    status: "unavailable",
    proof_hex: null,
  };

  try {
    const proof = await rpc.getGrandpaFinalityProof(Number(blockNumber));
    if (proof === null) {
      grandpaFinalityProof = {
        status: "unavailable",
        proof_hex: null,
      };
    } else {
      grandpaFinalityProof = {
        status: "captured",
        proof_hex: proof,
      };
    }
  } catch (error) {
    grandpaFinalityProof = {
      status: "unavailable",
      proof_hex: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const packet = {
    schema_version: "materios-finalized-state-capture-v1",
    chain_id: CHAIN_ID,
    rpc_endpoint: RPC,
    captured_at: new Date().toISOString(),
    finalized: {
      block_hash: finalizedHash,
      block_number: blockNumber.toString(),
      state_root: header.stateRoot,
      parent_hash: header.parentHash,
      extrinsics_root: header.extrinsicsRoot,
    },
    runtime,
    runtime_code: {
      encoding: "hex",
      byte_length: (runtimeCodeHex.length - 2) / 2,
      sha256: codeSha256,
      blake2_256: blake2_256Hex(runtimeCodeHex),
      native_substrate_hash: "blake2_256",
    },
    grandpa: {
      set_id: setId.toString(),
      authorities: authorities.map((a) => ({
        public_key: a.public_key,
        weight: a.weight.toString(),
      })),
      finality_proof: grandpaFinalityProof,
    },
    scope: {
      verified: [
        "finalized head hash obtained from chain_getFinalizedHead",
        "header read at the exact finalized hash",
        "runtime version read at the exact finalized hash",
        "runtime code read at the exact finalized hash",
        "GRANDPA authority list read at the exact finalized hash",
        "GRANDPA set id read at the exact finalized hash",
        "standard grandpa_proveFinality transport queried for the finalized block number; raw bytes are untrusted evidence",
      ],
      open: [
        "independent decoding and GRANDPA FinalityProof verification",
        "authority-set transition proof",
        "cryptographic runtime execution proof",
        "WASM source reproducibility proof",
        "M6 composition proof",
      ],
    },
  };

  const outDir = join(__dir, "..", "out");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "MateriosFinalizedStateCapture.json");
  writeFileSync(outPath, JSON.stringify(packet, null, 2) + "\n", "utf8");

  console.log("\n=== Capture ===");
  console.log("finalized hash:", finalizedHash);
  console.log("finalized block:", blockNumber.toString());
  console.log("state root:", header.stateRoot);
  console.log("specVersion:", runtime.specVersion);
  console.log("runtime code bytes:", packet.runtime_code.byte_length);
  console.log("runtime code sha256:", codeSha256);
  console.log("runtime code blake2_256:", packet.runtime_code.blake2_256);
  console.log("GRANDPA set_id:", setId.toString());
  console.log("authorities:", authorities.length);
  console.log("GRANDPA finality proof status:", grandpaFinalityProof.status);
  console.log("wrote:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
