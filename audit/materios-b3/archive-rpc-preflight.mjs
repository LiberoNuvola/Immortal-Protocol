#!/usr/bin/env node
/**
 * Fail-closed preflight for the Materios historical RPC required by B3-B.
 *
 * This does not prove canonicality. It proves that the supplied RPC can
 * actually serve the exact historical state witness needed by the existing
 * capture + independent verifier pipeline.
 */

const RPC = process.env.MATERIOS_ARCHIVE_RPC;
const BLOCK_HASH =
  process.env.MATERIOS_B3_ANCHOR_BLOCK_HASH ??
  "0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e";
const STORAGE_KEY =
  process.env.MATERIOS_B3_ANCHOR_STORAGE_KEY ??
  "0xf2f45ef88f71bc25f444a160450145be2893c8b379803be566c94f4bfeab5cb26c42575af239d32de4c42a85bada380301b459db196564ea1768e71663b4caa2439279839c52e758f605a5fbd6026b55";

if (!RPC) throw new Error("MATERIOS_ARCHIVE_RPC is required");

let id = 0;
async function rpc(method, params = []) {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  if (!response.ok) {
    throw new Error(`${method}: HTTP ${response.status}`);
  }
  const body = await response.json();
  if (body.error) {
    throw new Error(`${method}: ${body.error.code} ${body.error.message}`);
  }
  if (!Object.prototype.hasOwnProperty.call(body, "result")) {
    throw new Error(`${method}: missing result`);
  }
  return body.result;
}

function requireHash(value, field) {
  if (typeof value !== "string" || !/^0x[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${field}: expected 32-byte lowercase hex hash`);
  }
  return value;
}

function requireHex(value, field) {
  if (typeof value !== "string" || !/^0x[0-9a-f]*$/.test(value)) {
    throw new Error(`${field}: expected hex string`);
  }
  return value;
}

const header = await rpc("chain_getHeader", [BLOCK_HASH]);
if (!header || typeof header !== "object") throw new Error("chain_getHeader: invalid header");
const stateRoot = requireHash(header.stateRoot, "header.stateRoot");
const blockNumber = requireHash(BLOCK_HASH, "target block hash") && header.number;

const storageValue = await rpc("state_getStorage", [STORAGE_KEY, BLOCK_HASH]);
if (storageValue === null) throw new Error("state_getStorage: exact historical key returned null");
requireHex(storageValue, "state_getStorage");

const proof = await rpc("state_getReadProof", [[STORAGE_KEY], BLOCK_HASH]);
if (!proof || typeof proof !== "object") throw new Error("state_getReadProof: invalid response");
if (requireHash(proof.at, "state_getReadProof.at").toLowerCase() !== BLOCK_HASH) {
  throw new Error("state_getReadProof.at does not match target block hash");
}
if (!Array.isArray(proof.proof) || proof.proof.length === 0) {
  throw new Error("state_getReadProof.proof is empty");
}
for (let i = 0; i < proof.proof.length; i++) requireHex(proof.proof[i], `state_getReadProof.proof[${i}]`);

console.log("B3-B archive RPC preflight: PASS");
console.log("block_hash=", BLOCK_HASH);
console.log("block_number=", blockNumber);
console.log("state_root=", stateRoot);
console.log("storage_value_bytes=", (storageValue.length - 2) / 2);
console.log("proof_nodes=", proof.proof.length);
