/**
 * Capture the exact historical Materios AnchorRecord witness required by B3-B.
 *
 * Evidence extraction only. This tool does not claim finality, authority
 * provenance, or proof validity. It binds every read to one exact block hash.
 *
 * Usage:
 *   MATERIOS_ARCHIVE_RPC=<archive-http-rpc> npm run capture:anchor
 *
 * Optional overrides:
 *   MATERIOS_B3_ANCHOR_BLOCK_HASH
 *   MATERIOS_B3_ANCHOR_STORAGE_KEY
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MateriosRpc } from "./rpc.js";
import { parseHeaderNumber } from "./scale.js";

const __dir = dirname(fileURLToPath(import.meta.url));

const RPC = process.env.MATERIOS_ARCHIVE_RPC;
if (!RPC) {
  throw new Error(
    "MATERIOS_ARCHIVE_RPC is required and must point to a historical-state-capable Materios RPC",
  );
}

const BLOCK_HASH =
  process.env.MATERIOS_B3_ANCHOR_BLOCK_HASH ??
  "0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e";

const STORAGE_KEY =
  process.env.MATERIOS_B3_ANCHOR_STORAGE_KEY ??
  "0xf2f45ef88f71bc25f444a160450145be2893c8b379803be566c94f4bfeab5cb26c42575af239d32de4c42a85bada380301b459db196564ea1768e71663b4caa2439279839c52e758f605a5fbd6026b55";

async function main(): Promise<void> {
  const rpc = new MateriosRpc(RPC);

  const header = await rpc.getHeader(BLOCK_HASH);
  const blockNumber = parseHeaderNumber(header.number);

  const storageValue = await rpc.getStorage(STORAGE_KEY, BLOCK_HASH);
  if (storageValue === null) {
    throw new Error("Historical AnchorRecord is absent at the requested block");
  }

  const readProof = await rpc.getReadProof([STORAGE_KEY], BLOCK_HASH);
  if (readProof.at.toLowerCase() !== BLOCK_HASH.toLowerCase()) {
    throw new Error("Historical storage proof returned a different block hash");
  }

  const packet = {
    schema_version: "materios-b3-anchor-state-witness-v1",
    captured_at: new Date().toISOString(),
    rpc_endpoint: RPC,
    target: {
      block_hash: BLOCK_HASH,
      block_number: blockNumber.toString(),
      state_root: header.stateRoot,
      storage_key: STORAGE_KEY,
    },
    anchor_record: {
      scale_hex: storageValue,
    },
    storage_proof: {
      at: readProof.at,
      format: "state_getReadProof.proof node-hex array",
      nodes: readProof.proof,
    },
    scope: {
      verified: [
        "header fetched at exact target block hash",
        "state_getStorage fetched at exact target block hash",
        "state_getReadProof fetched at exact target block hash",
        "proof.at matches target block hash",
      ],
      open: [
        "independent trie proof verification against header.stateRoot",
        "GRANDPA finality for target block",
        "authority-set provenance/transition",
        "publisher-independent B3 closure",
      ],
    },
  };

  const outDir = join(__dir, "..", "out");
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, "MateriosB3AnchorStateWitness.json");
  writeFileSync(outPath, JSON.stringify(packet, null, 2) + "\n", "utf8");

  console.log("Materios B3-B anchor witness");
  console.log("RPC:", RPC);
  console.log("block:", blockNumber.toString());
  console.log("block hash:", BLOCK_HASH);
  console.log("state root:", header.stateRoot);
  console.log("storage value bytes:", (storageValue.length - 2) / 2);
  console.log("proof nodes:", readProof.proof.length);
  console.log("wrote:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
