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

import { MateriosRpc } from "./rpc.js";
import { decodeAuthorityList, decodeSetId, parseHeaderNumber } from "./scale.js";

const __dir = dirname(fileURLToPath(import.meta.url));

const RPC =
  process.env.MATERIOS_RPC ??
  "https://materios.fluxpointstudios.com/preprod-rpc";

const CHAIN_ID =
  process.env.MATERIOS_CHAIN_ID ??
  "materios_preprod_v6";

function sha256Hex(hex: string): string {
  const clean = hex.replace(/^0x/i, "");
  return (
    "0x" +
    createHash("sha256")
      .update(Buffer.from(clean, "hex"))
      .digest("hex")
  );
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
    },
    grandpa: {
      set_id: setId.toString(),
      authorities: authorities.map((a) => ({
        public_key: a.public_key,
        weight: a.weight.toString(),
      })),
    },
    scope: {
      verified: [
        "finalized head hash obtained from chain_getFinalizedHead",
        "header read at the exact finalized hash",
        "runtime version read at the exact finalized hash",
        "runtime code read at the exact finalized hash",
        "GRANDPA authority list read at the exact finalized hash",
        "GRANDPA set id read at the exact finalized hash",
      ],
      open: [
        "independent GRANDPA justification verification",
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
  console.log("GRANDPA set_id:", setId.toString());
  console.log("authorities:", authorities.length);
  console.log("wrote:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
