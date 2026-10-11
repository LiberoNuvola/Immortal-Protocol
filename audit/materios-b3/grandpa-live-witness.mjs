#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ENDPOINTS = [
  process.env.MATERIOS_RPC,
  process.env.MATERIOS_ALT_RPC,
  "https://materios.fluxpointstudios.com/preprod-rpc",
  "https://materios.fluxpointstudios.com/rpc",
].filter((v, i, a) => typeof v === "string" && v.length > 0 && a.indexOf(v) === i);

const GRANDPA_ENGINE_ID = "0x46524e4b";
const SCAN_BLOCKS = Number(process.env.MATERIOS_GRANDPA_SCAN_BLOCKS ?? "1024");
const BATCH_SIZE = Number(process.env.MATERIOS_GRANDPA_BATCH_SIZE ?? "32");

if (!Number.isSafeInteger(SCAN_BLOCKS) || SCAN_BLOCKS < 1 || SCAN_BLOCKS > 4096) {
  throw new Error("MATERIOS_GRANDPA_SCAN_BLOCKS must be an integer in [1,4096]");
}
if (!Number.isSafeInteger(BATCH_SIZE) || BATCH_SIZE < 1 || BATCH_SIZE > 64) {
  throw new Error("MATERIOS_GRANDPA_BATCH_SIZE must be an integer in [1,64]");
}

function assertHash(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(label + ": expected 32-byte hash");
  }
  return value;
}

function assertHex(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new Error(label + ": expected hex");
  }
  return value;
}

function sha256Hex(hex) {
  const bytes = Buffer.from(hex.slice(2), "hex");
  return "0x" + createHash("sha256").update(bytes).digest("hex");
}

async function post(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function rpc(endpoint, method, params = []) {
  const id = Math.floor(Math.random() * 1_000_000_000);
  const json = await post(endpoint, {
    jsonrpc: "2.0",
    id,
    method,
    params,
  });

  if (json.error) {
    throw new Error(`${method}: ${json.error.code} ${json.error.message}`);
  }

  if (!Object.prototype.hasOwnProperty.call(json, "result")) {
    throw new Error(`${method}: missing result`);
  }

  return json.result;
}

async function rpcBatch(endpoint, requests) {
  const json = await post(
    endpoint,
    requests.map((request, index) => ({
      jsonrpc: "2.0",
      id: index + 1,
      method: request.method,
      params: request.params ?? [],
    })),
  );

  if (!Array.isArray(json)) {
    throw new Error("JSON-RPC batch response is not an array");
  }

  const byId = new Map();
  for (const item of json) {
    if (item && typeof item.id === "number") {
      byId.set(item.id, item);
    }
  }

  return requests.map((_, index) => byId.get(index + 1) ?? {
    error: { code: -1, message: "missing batch response" },
  });
}

function extractGrandpaJustification(blockResult) {
  if (!blockResult || typeof blockResult !== "object") return null;
  const justifications = blockResult.justifications;
  if (!Array.isArray(justifications)) return null;

  const matches = [];
  for (const entry of justifications) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [engineId, proof] = entry;
    if (
      typeof engineId === "string" &&
      engineId.toLowerCase() === GRANDPA_ENGINE_ID &&
      typeof proof === "string" &&
      /^0x[0-9a-fA-F]+$/.test(proof)
    ) {
      matches.push(proof);
    }
  }

  if (matches.length > 1) {
    throw new Error("multiple GRANDPA justifications attached to one block");
  }

  return matches[0] ?? null;
}

async function findWitness(endpoint) {
  const finalizedHash = assertHash(
    await rpc(endpoint, "chain_getFinalizedHead"),
    "chain_getFinalizedHead",
  );
  const finalizedHeader = await rpc(endpoint, "chain_getHeader", [finalizedHash]);
  const finalizedNumber = BigInt(assertHex(finalizedHeader.number, "finalized header number"));

  const start = finalizedNumber;
  const min = finalizedNumber - BigInt(SCAN_BLOCKS - 1);
  const numbers = [];
  for (let n = start; n >= (min > 0n ? min : 0n); n -= 1n) {
    numbers.push(n);
  }

  console.log("endpoint:", endpoint);
  console.log("finalized head:", finalizedHash);
  console.log("finalized number:", finalizedNumber.toString());
  console.log("scanning:", numbers.length, "blocks");

  let hashes = [];
  for (let i = 0; i < numbers.length; i += BATCH_SIZE) {
    const batch = numbers.slice(i, i + BATCH_SIZE).map((number) => ({
      method: "chain_getBlockHash",
      params: [Number(number)],
    }));

    let responses;
    try {
      responses = await rpcBatch(endpoint, batch);
    } catch {
      responses = [];
      for (const request of batch) {
        try {
          responses.push({
            result: await rpc(endpoint, request.method, request.params),
          });
        } catch (error) {
          responses.push({ error: { code: -1, message: error instanceof Error ? error.message : String(error) } });
        }
      }
    }

    for (let j = 0; j < responses.length; j += 1) {
      const hash = responses[j]?.result;
      if (typeof hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(hash)) {
        hashes.push({ number: numbers[i + j], hash });
      }
    }
  }

  for (let i = 0; i < hashes.length; i += BATCH_SIZE) {
    const batch = hashes.slice(i, i + BATCH_SIZE).map(({ hash }) => ({
      method: "chain_getBlock",
      params: [hash],
    }));

    let responses;
    try {
      responses = await rpcBatch(endpoint, batch);
    } catch {
      responses = [];
      for (const request of batch) {
        try {
          responses.push({
            result: await rpc(endpoint, request.method, request.params),
          });
        } catch (error) {
          responses.push({ error: { code: -1, message: error instanceof Error ? error.message : String(error) } });
        }
      }
    }

    for (let j = 0; j < responses.length; j += 1) {
      const item = hashes[i + j];
      const response = responses[j];
      if (!item || !response || response.error) continue;

      const proof = extractGrandpaJustification(response.result);
      if (!proof) continue;

      const blockResult = response.result;
      const block = blockResult?.block;
      const header = block?.header;

      if (!block || !header || typeof header !== "object") {
        throw new Error("chain_getBlock returned a malformed block");
      }

      const blockHash = item.hash;
      const blockNumber = BigInt(assertHex(header.number, "block header number"));

      if (blockNumber !== item.number) {
        throw new Error(
          `chain_getBlock number mismatch: requested ${item.number.toString()}, got ${blockNumber.toString()}`,
        );
      }

      assertHash(header.parentHash, "parentHash");
      assertHash(header.stateRoot, "stateRoot");
      assertHash(header.extrinsicsRoot, "extrinsicsRoot");

      return {
        endpoint,
        capturedAt: new Date().toISOString(),
        source: "chain_getBlock",
        engineId: GRANDPA_ENGINE_ID,
        finalizedHead: {
          hash: finalizedHash,
          number: finalizedNumber.toString(),
        },
        witness: {
          blockHash,
          blockNumber: blockNumber.toString(),
          parentHash: header.parentHash,
          stateRoot: header.stateRoot,
          extrinsicsRoot: header.extrinsicsRoot,
          digestLogs: Array.isArray(header.digest?.logs) ? header.digest.logs : [],
          justificationHex: proof,
          justificationByteLength: (proof.length - 2) / 2,
          justificationSha256: sha256Hex(proof),
        },
        verificationScope: {
          transport: "captured_from_public_Materios_RPC",
          cryptographicFinalityVerified: false,
          authorityProvenanceVerified: false,
          ancestryVerified: false,
          authorityTransitionVerified: false,
          rawBytesRemainUntrusted: true,
        },
      };
    }
  }

  return null;
}

async function main() {
  const failures = [];

  for (const endpoint of ENDPOINTS) {
    try {
      const witness = await findWitness(endpoint);
      if (!witness) {
        failures.push(`${endpoint}: no GRANDPA justification found in scan window`);
        continue;
      }

      const outDir = join(process.cwd(), "audit", "materios-b3", "out");
      mkdirSync(outDir, { recursive: true });
      const outPath = join(outDir, "MateriosGrandpaLiveWitness.json");
      writeFileSync(outPath, JSON.stringify(witness, null, 2) + "\n", "utf8");

      console.log("\n=== GRANDPA witness captured ===");
      console.log("block:", witness.witness.blockNumber);
      console.log("hash:", witness.witness.blockHash);
      console.log("justification bytes:", witness.witness.justificationByteLength);
      console.log("justification sha256:", witness.witness.justificationSha256);
      console.log("wrote:", outPath);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${endpoint}: ${message}`);
      console.error(`${endpoint}: ${message}`);
    }
  }

  throw new Error(
    "No public Materios endpoint yielded a live GRANDPA justification witness. " +
    failures.join(" | "),
  );
}

await main();
