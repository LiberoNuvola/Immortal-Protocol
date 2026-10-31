/**
 * Capture a real Materios GRANDPA witness from the public RPC.
 *
 * Evidence extraction + independent verification only:
 * - current public RPC is the project-documented /rpc endpoint;
 * - finds a real FRNK justification attached to a recent block;
 * - reads the GRANDPA authority set/set-id at that exact block;
 * - verifies signatures, quorum and GRANDPA vote ancestry with the existing verifier;
 * - also probes recent session-committee inherent blocks for a real
 *   selection_inputs_hash commitment.
 *
 * IMPORTANT:
 * Verification against an authority set returned by state_call is not, by
 * itself, authenticated authority-set provenance. The B3-A authority-transition
 * boundary therefore remains OPEN unless the transition proof is independently
 * authenticated.
 *
 * Historical candidate binding prefers public HTTP. If that route disagrees,
 * a separately labeled checksum-verified local snapshot may bind the candidate;
 * this does not authenticate authority-set provenance.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  decodeGrandpaJustification,
  encodeLocalizedPrecommitPayload,
} from "./grandpa.js";
import {
  verifyFinality,
} from "./verifier.js";
import {
  nobleEd25519,
  verifyEd25519,
} from "./crypto.js";
import {
  bytesToHex,
} from "./scale.js";
import {
  isValidSnapshotStateProbeEvidence,
  sameSubstrateHeader,
} from "./snapshot-binding.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));

const RPC =
  process.env.MATERIOS_RPC ??
  "https://materios.fluxpointstudios.com/rpc";

// Historical state may be available only from an archive node. This endpoint
// is used solely for GRANDPA authority-state reads; block/header acquisition
// and cross-route binding continue to use the public RPC above.
const AUTHORITY_RPC =
  process.env.MATERIOS_AUTHORITY_RPC?.trim() || RPC;

const CHAIN_ID =
  process.env.MATERIOS_CHAIN_ID ??
  "materios_preprod_v6";

const GRANDPA_ENGINE_ID = "0x46524e4b";

const JUSTIFICATION_PERIOD = Number(
  process.env.MATERIOS_GRANDPA_PERIOD ?? "512",
);

const PREPROD_SLOTS_PER_EPOCH = Number(
  process.env.MATERIOS_SLOTS_PER_EPOCH ?? "600",
);

const WITNESS_LOOKBACK = Number(
  process.env.MATERIOS_WITNESS_LOOKBACK ?? "768",
);

const BLOCK_BATCH_SIZE = Number(
  process.env.MATERIOS_BLOCK_BATCH_SIZE ?? "64",
);

type JsonRpcResponse<T> = {
  jsonrpc?: string;
  id?: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

type SignedBlock = {
  block: {
    header: SubstrateHeader;
    extrinsics: string[];
  };
  justifications: [string, string][] | null;
};

type SubstrateHeader = {
  parentHash: string;
  number: string;
  stateRoot: string;
  extrinsicsRoot: string;
  digest: { logs: string[] };
};

function requireHash(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !/^0x[0-9a-fA-F]{64}$/.test(value)
  ) {
    throw new Error(field + ": expected 32-byte 0x hash");
  }
  return value.toLowerCase();
}

function hexToBytes(value: string, field: string): Uint8Array {
  if (
    typeof value !== "string" ||
    !/^0x[0-9a-fA-F]*$/.test(value) ||
    (value.length - 2) % 2 !== 0
  ) {
    throw new Error(field + ": invalid hex");
  }
  return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
}

function parseBlockNumber(value: string, field: string): bigint {
  if (
    typeof value !== "string" ||
    !/^0x[0-9a-fA-F]+$/.test(value)
  ) {
    throw new Error(field + ": invalid SCALE number");
  }
  return BigInt(value);
}

function sha256Hex(value: string): string {
  return (
    "0x" +
    createHash("sha256")
      .update(Buffer.from(value.slice(2), "hex"))
      .digest("hex")
  );
}

async function rpc<T>(
  method: string,
  params: unknown[] = [],
  endpoint: string = RPC,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(
      "RPC HTTP " + response.status + " " + response.statusText + " for " + method,
    );
  }

  const body = (await response.json()) as JsonRpcResponse<T>;

  if (body.error) {
    throw new Error(
      "RPC " +
        method +
        ": " +
        body.error.code +
        " " +
        body.error.message,
    );
  }

  if (!Object.prototype.hasOwnProperty.call(body, "result")) {
    throw new Error("RPC " + method + ": missing result");
  }

  return body.result as T;
}

function extractGrandpaJustification(
  signed: SignedBlock,
): string | null {
  if (signed.justifications == null) {
    return null;
  }

  const matches = signed.justifications.filter(
    ([engine, bytes]) =>
      typeof engine === "string" &&
      engine.toLowerCase() === GRANDPA_ENGINE_ID &&
      typeof bytes === "string" &&
      /^0x[0-9a-fA-F]+$/.test(bytes),
  );

  if (matches.length > 1) {
    throw new Error("multiple GRANDPA justifications on one block");
  }

  return matches.length === 1 ? matches[0]![1].toLowerCase() : null;
}

function extractSelectionInputsHash(
  extrinsics: readonly string[],
): {
  extrinsicIndex: number;
  extrinsicHex: string;
  selectionInputsHash: string;
} | null {
  const EXTRINSIC_VERSION_UNSIGNED = 0x04;
  const SESSION_COMMITTEE_PALLET_INDEX = 14;
  const SET_CALL_INDEX = 0;
  const HASH_BYTES = 32;

  let found:
    | {
        extrinsicIndex: number;
        extrinsicHex: string;
        selectionInputsHash: string;
      }
    | undefined;

  for (let index = 0; index < extrinsics.length; index += 1) {
    const raw = extrinsics[index];
    if (
      typeof raw !== "string" ||
      !/^0x[0-9a-fA-F]*$/.test(raw) ||
      (raw.length - 2) % 2 !== 0
    ) {
      throw new Error("malformed extrinsic[" + index + "]");
    }

    const bytes = Buffer.from(raw.slice(2), "hex");

    if (
      bytes[0] !== EXTRINSIC_VERSION_UNSIGNED ||
      bytes[1] !== SESSION_COMMITTEE_PALLET_INDEX ||
      bytes[2] !== SET_CALL_INDEX
    ) {
      continue;
    }

    if (bytes.length < 3 + HASH_BYTES) {
      throw new Error(
        "SessionCommitteeManagement::set extrinsic[" +
          index +
          "] is truncated",
      );
    }

    const selectionInputsHash =
      "0x" +
      bytes.subarray(bytes.length - HASH_BYTES).toString("hex");

    if (found !== undefined) {
      throw new Error(
        "multiple SessionCommitteeManagement::set inherent extrinsics",
      );
    }

    found = {
      extrinsicIndex: index,
      extrinsicHex: raw.toLowerCase(),
      selectionInputsHash,
    };
  }

  return found ?? null;
}

function decodeAuthorityList(hex: string): {
  publicKey: Uint8Array;
  weight: bigint;
}[] {
  const bytes = hexToBytes(hex, "GrandpaApi_grandpa_authorities");
  let offset = 0;

  const readCompact = (): bigint => {
    if (offset >= bytes.length) {
      throw new Error("authority list: compact EOF");
    }

    const first = bytes[offset];
    if (first === undefined) {
      throw new Error("authority list: compact EOF");
    }
    const mode = first & 3;

    if (mode === 0) {
      offset += 1;
      return BigInt(first >> 2);
    }

    if (mode === 1) {
      if (offset + 2 > bytes.length) {
        throw new Error("authority list: compact EOF");
      }
      const value =
        (BigInt(bytes[offset]!) |
          (BigInt(bytes[offset + 1]!) << 8n)) >>
        2n;
      offset += 2;
      return value;
    }

    if (mode === 2) {
      if (offset + 4 > bytes.length) {
        throw new Error("authority list: compact EOF");
      }
      const value =
        (BigInt(bytes[offset]!) |
          (BigInt(bytes[offset + 1]!) << 8n) |
          (BigInt(bytes[offset + 2]!) << 16n) |
          (BigInt(bytes[offset + 3]!) << 24n)) >>
        2n;
      offset += 4;
      return value;
    }

    const byteLength = (first >> 2) + 4;
    if (byteLength > 67 || offset + 1 + byteLength > bytes.length) {
      throw new Error("authority list: invalid big compact");
    }

    let value = 0n;
    for (let i = 0; i < byteLength; i += 1) {
      value |=
        BigInt(bytes[offset + 1 + i]!) <<
        BigInt(8 * i);
    }
    offset += 1 + byteLength;
    return value;
  };

  const count = readCompact();
  if (count > 10_000n) {
    throw new Error("authority list: unreasonable count " + count);
  }

  const authorities = [];

  for (let i = 0n; i < count; i += 1n) {
    if (offset + 32 + 8 > bytes.length) {
      throw new Error("authority[" + i + "]: EOF");
    }

    const publicKey = bytes.slice(offset, offset + 32);
    offset += 32;

    let weight = 0n;
    for (let j = 0; j < 8; j += 1) {
      weight |= BigInt(bytes[offset + j]!) << BigInt(8 * j);
    }
    offset += 8;

    authorities.push({ publicKey, weight });
  }

  if (offset !== bytes.length) {
    throw new Error(
      "authority list: trailing bytes " + (bytes.length - offset),
    );
  }

  return authorities;
}

function decodeSetId(hex: string): bigint {
  const bytes = hexToBytes(hex, "GrandpaApi_current_set_id");

  if (bytes.length !== 8) {
    throw new Error("set id must be exactly u64");
  }

  let value = 0n;
  for (let i = 0; i < 8; i += 1) {
    value |= BigInt(bytes[i]!) << BigInt(8 * i);
  }
  return value;
}

const GRANDPA_CURRENT_SET_ID_STORAGE_KEY =
  "0x5f9cc45b7a00c5898a2d09463effcc78";

function decodeStorageU64(hex: string): bigint {
  const bytes = hexToBytes(hex, "Grandpa.CurrentSetId storage");
  if (bytes.length !== 8) {
    throw new Error("Grandpa.CurrentSetId storage must be exactly u64");
  }
  let value = 0n;
  for (let i = 0; i < 8; i += 1) {
    value |= BigInt(bytes[i]!) << BigInt(8 * i);
  }
  return value;
}


type RpcBatchCall = {
  method: string;
  params: unknown[];
};

async function rpcBatch<T>(
  calls: readonly RpcBatchCall[],
): Promise<T[]> {
  if (calls.length === 0) {
    return [];
  }

  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      calls.map((call, index) => ({
        jsonrpc: "2.0",
        id: index + 1,
        method: call.method,
        params: call.params,
      })),
    ),
  });

  if (!response.ok) {
    throw new Error(
      "RPC batch HTTP " +
        response.status +
        " " +
        response.statusText,
    );
  }

  const body = (await response.json()) as
    | JsonRpcResponse<T>[]
    | JsonRpcResponse<T>;

  if (!Array.isArray(body)) {
    throw new Error("RPC batch endpoint did not return an array");
  }

  if (body.length !== calls.length) {
    throw new Error(
      "RPC batch response length mismatch: expected " +
        calls.length +
        ", got " +
        body.length,
    );
  }

  const ordered = new Array<T>(calls.length);

  for (const item of body) {
    if (
      typeof item?.id !== "number" ||
      item.id < 1 ||
      item.id > calls.length
    ) {
      throw new Error("RPC batch returned an invalid id");
    }

    const call = calls[item.id - 1]!;
    if (item.error) {
      throw new Error(
        "RPC " +
          call.method +
          ": " +
          item.error.code +
          " " +
          item.error.message,
      );
    }

    if (!Object.prototype.hasOwnProperty.call(item, "result")) {
      throw new Error(
        "RPC " + call.method + ": missing result",
      );
    }

    ordered[item.id - 1] = item.result as T;
  }

  return ordered;
}

async function getRecentBlocks(
  startNumber: number,
  endNumber: number,
): Promise<Array<{
  number: number;
  hash: string;
  signed: SignedBlock;
}>> {
  if (
    startNumber < 0 ||
    endNumber < startNumber ||
    !Number.isSafeInteger(startNumber) ||
    !Number.isSafeInteger(endNumber)
  ) {
    throw new Error("invalid dense block scan range");
  }

  const out: Array<{
    number: number;
    hash: string;
    signed: SignedBlock;
  }> = [];

  for (
    let start = startNumber;
    start <= endNumber;
    start += BLOCK_BATCH_SIZE
  ) {
    const batchEnd = Math.min(
      endNumber,
      start + BLOCK_BATCH_SIZE - 1,
    );

    const numbers: number[] = [];
    for (let number = start; number <= batchEnd; number += 1) {
      numbers.push(number);
    }

    const hashes = await rpcBatch<string>(
      numbers.map((number) => ({
        method: "chain_getBlockHash",
        params: [number],
      })),
    );

    for (const hash of hashes) {
      requireHash(hash, "chain_getBlockHash");
    }

    const blocks = await rpcBatch<SignedBlock>(
      hashes.map((hash) => ({
        method: "chain_getBlock",
        params: [hash],
      })),
    );

    for (let i = 0; i < blocks.length; i += 1) {
      const signed = blocks[i]!;
      const requestedNumber = numbers[i]!;
      if (
        !signed ||
        typeof signed !== "object" ||
        !signed.block ||
        !signed.block.header
      ) {
        throw new Error(
          "chain_getBlock returned malformed block at height " +
            requestedNumber,
        );
      }

      const header = signed.block.header;
      const headerNumber = parseBlockNumber(
        header.number,
        "dense header number",
      );

      if (headerNumber !== BigInt(requestedNumber)) {
        throw new Error(
          "dense block number mismatch at requested height " +
            requestedNumber,
        );
      }

      const hash = hashes[i]!.toLowerCase();
      if (requireHash(header.parentHash, "parentHash") === hash) {
        throw new Error(
          "self-parented block at height " + requestedNumber,
        );
      }

      out.push({
        number: requestedNumber,
        hash,
        signed,
      });
    }
  }

  return out;
}

async function getBlockByNumber(
  number: number,
): Promise<{
  hash: string;
  signed: SignedBlock;
}> {
  const hash = requireHash(
    await rpc<unknown>("chain_getBlockHash", [number]),
    "chain_getBlockHash",
  );

  const signed = await rpc<SignedBlock>(
    "chain_getBlock",
    [hash],
  );

  if (
    !signed ||
    typeof signed !== "object" ||
    !signed.block ||
    !signed.block.header
  ) {
    throw new Error(
      "chain_getBlock(" + hash + "): malformed block",
    );
  }

  const header = signed.block.header;

  if (
    requireHash(header.parentHash, "parentHash") === hash
  ) {
    throw new Error("self-parented block");
  }

  return { hash, signed };
}

async function getHeader(
  hash: string,
): Promise<SubstrateHeader> {
  const header = await rpc<SubstrateHeader>(
    "chain_getHeader",
    [hash],
  );

  if (!header || typeof header !== "object") {
    throw new Error(
      "chain_getHeader(" + hash + "): malformed header",
    );
  }

  requireHash(header.parentHash, "header.parentHash");
  requireHash(header.stateRoot, "header.stateRoot");
  requireHash(header.extrinsicsRoot, "header.extrinsicsRoot");
  parseBlockNumber(header.number, "header.number");

  return header;
}

async function main(): Promise<void> {
  console.log("Materios real GRANDPA witness capture");
  console.log("RPC:", RPC);
  console.log("chain:", CHAIN_ID);

  const finalizedHash = requireHash(
    await rpc<unknown>("chain_getFinalizedHead"),
    "chain_getFinalizedHead",
  );

  const finalizedHeader = await getHeader(finalizedHash);
  const finalizedHeight = parseBlockNumber(
    finalizedHeader.number,
    "finalized block number",
  );

  console.log(
    "finalized:",
    finalizedHeight.toString(),
    finalizedHash,
  );

  const genesisHash = requireHash(
    await rpc<unknown>("chain_getBlockHash", [0]),
    "genesis block hash",
  );

  const finalizedHeightNumber = Number(finalizedHeight);
  if (!Number.isSafeInteger(finalizedHeightNumber)) {
    throw new Error("finalized height exceeds JavaScript safe integer range");
  }

  const scanStart = Math.max(
    0,
    finalizedHeightNumber - Math.max(1, WITNESS_LOOKBACK),
  );

  console.log(
    "dense scan:",
    scanStart + ".." + finalizedHeightNumber,
    "batch=" + BLOCK_BATCH_SIZE,
  );

  const recentBlocks = await getRecentBlocks(
    scanStart,
    finalizedHeightNumber,
  );

  recentBlocks.sort((a, b) => b.number - a.number);

  const witnessedBlocks = recentBlocks.filter(
    (block) => extractGrandpaJustification(block.signed) !== null,
  );

  // The public WebSocket route may retain a historical FRNK justification
  // even when its HTTP route strips the same field. Consume that independent
  // acquisition only after binding the exact target header across both routes
  // and recomputing its Substrate header hash locally.
  const websocketEvidencePath = process.env.MATERIOS_WS_EVIDENCE_PATH?.trim();
  let websocketFallbackStatus = websocketEvidencePath ? "NOT_ATTEMPTED" : "NOT_CONFIGURED";
  let websocketFallbackError: string | null = null;
  let websocketFallbackBindingSource: "PUBLIC_HTTP" | "LOCAL_SNAPSHOT_RPC" | null = null;
  let publicHttpCrossRouteMatched: boolean | null = null;
  let snapshotStateEvidence: unknown = null;
  const snapshotEvidencePath = process.env.MATERIOS_SNAPSHOT_STATE_EVIDENCE_PATH?.trim();
  if (snapshotEvidencePath) {
    try {
      snapshotStateEvidence = JSON.parse(readFileSync(snapshotEvidencePath, "utf8"));
    } catch {
      snapshotStateEvidence = null;
    }
  }
  if (websocketEvidencePath) {
    try {
      const websocketEvidence = JSON.parse(
        readFileSync(websocketEvidencePath, "utf8"),
      ) as {
        chain_id?: unknown;
        identity?: { genesis_hash_match?: unknown };
        historical_candidate_probe?: {
          requested_block_number?: unknown;
          returned_block_number?: unknown;
          requested_block_hash?: unknown;
          status?: unknown;
          header?: unknown;
          justifications?: { entries?: Array<Record<string, unknown>> };
        };
      };
      const candidate = websocketEvidence.historical_candidate_probe;
      if (websocketEvidence.chain_id !== CHAIN_ID ||
          websocketEvidence.identity?.genesis_hash_match !== true) {
        throw new Error("WEBSOCKET_CHAIN_IDENTITY_NOT_CONFIRMED");
      }
      if (candidate?.status !== "FRNK_JUSTIFICATION_CAPTURED_UNVERIFIED") {
        throw new Error("WEBSOCKET_HISTORICAL_FRNK_NOT_CAPTURED");
      }
      const candidateNumber = Number(candidate.returned_block_number);
      if (!Number.isSafeInteger(candidateNumber) ||
          candidateNumber !== Number(candidate.requested_block_number)) {
        throw new Error("WEBSOCKET_CANDIDATE_NUMBER_MISMATCH");
      }
      const candidateHash = requireHash(
        candidate.requested_block_hash,
        "WebSocket candidate block hash",
      );
      const frnkEntries = (candidate.justifications?.entries ?? []).filter(
        entry => entry.engineId === GRANDPA_ENGINE_ID &&
          typeof entry.rawPayloadHex === "string",
      );
      if (frnkEntries.length !== 1) {
        throw new Error("WEBSOCKET_FRNK_PAYLOAD_COUNT_MISMATCH");
      }
      const rawPayloadHex = frnkEntries[0]!.rawPayloadHex as string;
      const rawPayload = hexToBytes(rawPayloadHex, "WebSocket FRNK payload");
      if (rawPayload.length === 0) {
        throw new Error("WEBSOCKET_FRNK_PAYLOAD_EMPTY");
      }
      const observedPayloadHash = String(frnkEntries[0]!.payloadSha256 ?? "").toLowerCase();
      if (observedPayloadHash !== sha256Hex(rawPayloadHex).slice(2)) {
        throw new Error("WEBSOCKET_FRNK_PAYLOAD_SHA256_MISMATCH");
      }

      const websocketHeader = candidate.header as SubstrateHeader;
      let rpcCandidate = recentBlocks.find(block => block.number === candidateNumber);
      let candidateBindingSource: "PUBLIC_HTTP" | "LOCAL_SNAPSHOT_RPC" = "PUBLIC_HTTP";
      const httpCandidateMatched = Boolean(rpcCandidate && rpcCandidate.hash === candidateHash);
      publicHttpCrossRouteMatched = httpCandidateMatched;

      if (!rpcCandidate || rpcCandidate.hash !== candidateHash) {
        const localSnapshotBindingAllowed = isValidSnapshotStateProbeEvidence(
          snapshotStateEvidence,
          {
            chainId: CHAIN_ID,
            genesisHash,
            authorityRpc: AUTHORITY_RPC,
            blockNumber: candidateNumber,
            blockHash: candidateHash,
          },
        );
        if (!localSnapshotBindingAllowed) {
          throw new Error("WEBSOCKET_CANDIDATE_HASH_NOT_MATCHED_BY_HTTP_OR_VERIFIED_LOCAL_SNAPSHOT");
        }

        const localGenesisHash = requireHash(
          await rpc<unknown>("chain_getBlockHash", [0], AUTHORITY_RPC),
          "local snapshot genesis hash",
        );
        if (localGenesisHash !== genesisHash) {
          throw new Error("LOCAL_SNAPSHOT_GENESIS_HASH_MISMATCH");
        }
        const localCandidateHash = requireHash(
          await rpc<unknown>("chain_getBlockHash", [candidateNumber], AUTHORITY_RPC),
          "local snapshot candidate hash",
        );
        if (localCandidateHash !== candidateHash) {
          throw new Error("LOCAL_SNAPSHOT_CANDIDATE_HASH_MISMATCH");
        }
        const localSigned = await rpc<SignedBlock>(
          "chain_getBlock",
          [candidateHash],
          AUTHORITY_RPC,
        );
        if (!localSigned?.block?.header ||
            !sameSubstrateHeader(websocketHeader, localSigned.block.header)) {
          throw new Error("WEBSOCKET_LOCAL_SNAPSHOT_HEADER_FIELDS_MISMATCH");
        }
        rpcCandidate = {
          number: candidateNumber,
          hash: candidateHash,
          signed: localSigned,
        };
        candidateBindingSource = "LOCAL_SNAPSHOT_RPC";
      } else if (!sameSubstrateHeader(websocketHeader, rpcCandidate.signed.block.header)) {
        throw new Error("WEBSOCKET_HTTP_HEADER_FIELDS_MISMATCH");
      }

      // Dynamic import avoids adding a compile-time dependency on a sibling PoC
      // package; the workflow installs the pinned checkpoint package first.
      const bridgeModuleSpecifier = "../../materios-smoldot/target-ancestry-bridge.mjs";
      const bridgeModule = await import(bridgeModuleSpecifier);
      const computedHeaderHash = String(
        bridgeModule.hashMateriosHeader(websocketHeader),
      ).toLowerCase();
      if (computedHeaderHash !== candidateHash) {
        throw new Error("WEBSOCKET_HEADER_HASH_BINDING_FAILED");
      }

      const signedWithJustification: SignedBlock = {
        ...rpcCandidate.signed,
        justifications: [[GRANDPA_ENGINE_ID, rawPayloadHex]] as [string, string][],
      };
      websocketFallbackBindingSource = candidateBindingSource;
      const existingIndex = witnessedBlocks.findIndex(
        block => block.number === candidateNumber,
      );
      if (existingIndex >= 0) {
        witnessedBlocks[existingIndex] = {
          number: candidateNumber,
          hash: candidateHash,
          signed: signedWithJustification,
        };
        websocketFallbackStatus = candidateBindingSource === "LOCAL_SNAPSHOT_RPC"
          ? "CAPTURED_LOCAL_SNAPSHOT_BINDING_HTTP_ROUTE_MISMATCH"
          : "CAPTURED_HEADER_HASH_AND_CROSS_ROUTE_MATCH_VERIFIED";
      } else if (
        witnessedBlocks.length === 0 ||
        candidateNumber > witnessedBlocks[0]!.number
      ) {
        // Prefer a newer, independently cross-bound WebSocket candidate over
        // an older HTTP witness whose historical runtime state may already be
        // pruned. Keep the list in descending block-number order for firstWitness.
        witnessedBlocks.unshift({
          number: candidateNumber,
          hash: candidateHash,
          signed: signedWithJustification,
        });
        websocketFallbackStatus = candidateBindingSource === "LOCAL_SNAPSHOT_RPC"
          ? "CAPTURED_LOCAL_SNAPSHOT_BINDING_HTTP_ROUTE_MISMATCH"
          : "CAPTURED_HEADER_HASH_AND_CROSS_ROUTE_MATCH_VERIFIED";
      } else {
        websocketFallbackStatus = "CAPTURED_BUT_OLDER_THAN_HTTP_WITNESS_NOT_SELECTED";
      }
    } catch (error) {
      websocketFallbackStatus = "REJECTED";
      websocketFallbackError = error instanceof Error ? error.message : String(error);
    }
  }

  if (witnessedBlocks.length === 0) {
    // Preserve a machine-readable, bounded negative observation before failing.
    // This is diagnostic evidence only: absence in this RPC scan does not imply
    // that GRANDPA did not finalize the chain or that no external proof exists.
    const outDir = join(HERE, "..", "out");
    mkdirSync(outDir, { recursive: true });

    const diagnostics = {
      schema_version: "materios-real-grandpa-witness-v1",
      chain_id: CHAIN_ID,
      rpc_endpoint: RPC,
      captured_at: new Date().toISOString(),
      status: "BLOCKED_NO_PUBLIC_GRANDPA_WITNESS",
      finalized_head: {
        block_number: finalizedHeight.toString(),
        block_hash: finalizedHash,
        state_root: finalizedHeader.stateRoot,
      },
      witness: null,
      probes: {
        dense_scan_start: scanStart,
        dense_scan_end: finalizedHeightNumber,
        dense_scan_blocks: recentBlocks.length,
        blocks_with_grandpa_justification: [],
        websocket_fallback: {
          status: websocketFallbackStatus,
          error: websocketFallbackError,
          binding_source: websocketFallbackBindingSource,
          public_http_cross_route_matched: publicHttpCrossRouteMatched,
          evidence_path_configured: Boolean(websocketEvidencePath),
        },
        scan_manifest: recentBlocks.map((block) => ({
          block_number: block.number,
          block_hash: block.hash,
          justification_field:
            block.signed.justifications === null
              ? "null"
              : Array.isArray(block.signed.justifications)
                ? "array"
                : typeof block.signed.justifications,
          grandpa_justification_present: false,
        })),
        limitation:
          "The configured public RPC exposed no FRNK GRANDPA justification via chain_getBlock in this bounded scan window. This does not prove absence of GRANDPA consensus finality or absence of a proof from another source.",
      },
      b3a_claim: {
        cryptographic_finality: false,
        authority_transition_provenance: false,
        overall_status: "OPEN_NO_PUBLIC_WITNESS",
      },
    };

    writeFileSync(
      join(outDir, "MateriosRealGrandpaWitness.json"),
      JSON.stringify(diagnostics, null, 2) + "\n",
      "utf8",
    );

    console.error(
      "B3-A OPEN: wrote bounded no-witness diagnostic; proof remains required",
    );
    throw new Error(
      "NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_DENSE_SCAN",
    );
  }

  const firstWitness = witnessedBlocks[0]!;
  const witnessJustification = extractGrandpaJustification(
    firstWitness.signed,
  );

  if (witnessJustification === null) {
    throw new Error("internal witness extraction race");
  }

  const witness = {
    blockNumber: BigInt(firstWitness.number),
    blockHash: firstWitness.hash,
    header: firstWitness.signed.block.header,
    justificationHex: witnessJustification,
    justificationSha256: sha256Hex(witnessJustification),
  };

  console.log(
    "found GRANDPA justification at:",
    firstWitness.number,
    firstWitness.hash,
  );

  const justification = decodeGrandpaJustification(
    hexToBytes(
      witness.justificationHex,
      "GRANDPA justification",
    ),
  );

  let authorityStateSource = witness.blockHash;
  let authorityStateFallback = false;
  let authorityStateOriginalError: string | null = null;
  let authoritiesHex: string;
  let setIdHex: string;

  try {
    authoritiesHex = await rpc<string>(
      "state_call",
      [
        "GrandpaApi_grandpa_authorities",
        "0x",
        witness.blockHash,
      ],
      AUTHORITY_RPC,
    );
    setIdHex = await rpc<string>(
      "state_call",
      [
        "GrandpaApi_current_set_id",
        "0x",
        witness.blockHash,
      ],
      AUTHORITY_RPC,
    );
  } catch (historicalError) {
    authorityStateOriginalError =
      historicalError instanceof Error
        ? historicalError.message
        : String(historicalError);
    // Public RPC has demonstrated state pruning for historical blocks. A
    // current-state fallback is diagnostic only: signatures/quorum may be
    // checked against the returned set, but this does NOT authenticate that
    // set's historical provenance. Never silently label it as target state.
    authorityStateSource = finalizedHash;
    authorityStateFallback = true;
    try {
      authoritiesHex = await rpc<string>(
        "state_call",
        [
          "GrandpaApi_grandpa_authorities",
          "0x",
          finalizedHash,
        ],
        AUTHORITY_RPC,
      );
      setIdHex = await rpc<string>(
        "state_call",
        [
          "GrandpaApi_current_set_id",
          "0x",
          finalizedHash,
        ],
        AUTHORITY_RPC,
      );
    } catch (fallbackError) {
      const outDir = join(HERE, "..", "out");
      mkdirSync(outDir, { recursive: true });
      const diagnostics = {
        schema_version: "materios-real-grandpa-witness-v1",
        chain_id: CHAIN_ID,
        status: "BLOCKED_AUTHORITY_STATE_PRUNED",
        finalized_head: {
          block_number: finalizedHeight.toString(),
          block_hash: finalizedHash,
          state_root: finalizedHeader.stateRoot,
        },
        witness: {
          block_number: witness.blockNumber.toString(),
          block_hash: witness.blockHash,
          parent_hash: witness.header.parentHash,
          state_root: witness.header.stateRoot,
          extrinsics_root: witness.header.extrinsicsRoot,
          justification_engine: GRANDPA_ENGINE_ID,
          justification_hex: witness.justificationHex,
          justification_sha256: witness.justificationSha256,
          justification_round: justification.round.toString(),
          commit_target_hash: bytesToHex(justification.commit.targetHash),
          commit_target_number: justification.commit.targetNumber.toString(),
        },
        authority_state: {
          target_state_error: authorityStateOriginalError,
          fallback_state_source: finalizedHash,
          fallback_state_error:
            fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          provenance_verified: false,
        },
        b3a_claim: {
          cryptographic_finality: false,
          authority_transition_provenance: false,
          overall_status: "OPEN_AUTHORITY_STATE_UNAVAILABLE",
        },
      };
      const outDirPath = join(outDir, "MateriosRealGrandpaWitness.json");
      writeFileSync(outDirPath, JSON.stringify(diagnostics, null, 2) + "\n", "utf8");
      console.error("B3-A OPEN: raw FRNK captured, but no authority state was available for verification");
      process.exitCode = 1;
      return;
    }
  }

  const authorities = decodeAuthorityList(authoritiesHex);
  const setId = decodeSetId(setIdHex);

  const cryptoVerification = {
    status: "FAIL" as "PASS" | "FAIL",
    signedWeight: null as string | null,
    totalWeight: null as string | null,
    round: justification.round.toString(),
    error: null as string | null,
  };

  try {
    const result = await verifyFinality(
      {
        chainId: CHAIN_ID,
        genesisHash: hexToBytes(
          genesisHash,
          "genesis hash",
        ),
        blockHash: hexToBytes(
          witness.blockHash,
          "witness block hash",
        ),
        blockNumber: witness.blockNumber,
      },
      justification,
      {
        chainId: CHAIN_ID,
        genesisHash: hexToBytes(
          genesisHash,
          "genesis hash",
        ),
        setId,
        authorities,
      },
      nobleEd25519,
      {
        verifyAncestry: true,
      },
    );

    cryptoVerification.status = "PASS";
    cryptoVerification.signedWeight =
      result.signedWeight.toString();
    cryptoVerification.totalWeight =
      result.totalWeight.toString();
  } catch (error) {
    cryptoVerification.error =
      error instanceof Error
        ? error.name + ": " + error.message
        : String(error);
  }

  // Test the localized GRANDPA signing payload against each embedded signer key
  // for the observed current set ID and its predecessor. This is only a
  // cryptographic encoding/set-ID diagnostic: signer IDs are supplied by the
  // untrusted justification, and no authority membership, weight, quorum, or
  // authority-transition provenance is inferred from a match.
  // Search the entire non-negative set-id range up to the observed ID.
  // This is still diagnostic only: it narrows the signing-payload hypothesis,
  // but cannot authenticate any historical authority set or transition.
  const signatureSearchFloor = 0n;
  const localizedSignatureDiagnostic = {
    status: "DIAGNOSTIC_ONLY" as const,
    observed_set_id: setId.toString(),
    search_window: {
      min_set_id: signatureSearchFloor.toString(),
      max_set_id: setId.toString(),
      candidates_tested: 0,
      matching_set_ids: [] as string[],
    },
    candidates: [] as Array<{
      candidate_set_id: string;
      valid_signatures: number;
      total_signatures: number;
      invalid_signer_indexes: number[];
    }>,
    trust_scope: "Untrusted signer IDs from raw justification; bounded set-id search tests only localized-payload hypothesis. A matching set ID is not authority authentication, quorum, or finality.",
  };
  // GRANDPA set IDs are monotonic. Search every candidate ID from genesis
  // (0) through the observed current ID to distinguish a localized-payload
  // set-ID mismatch from a malformed payload. Never accept a discovered ID
  // as trusted state without proving the authority transition from genesis.
  for (let candidateSetId = setId; candidateSetId >= signatureSearchFloor; candidateSetId--) {
    let validSignatures = 0;
    const invalidSignerIndexes: number[] = [];
    for (let index = 0; index < justification.commit.precommits.length; index++) {
      const signed = justification.commit.precommits[index]!;
      try {
        const payload = encodeLocalizedPrecommitPayload(
          signed.precommit,
          justification.round,
          candidateSetId,
        );
        const valid = await verifyEd25519(
          nobleEd25519,
          signed.signer,
          signed.signature,
          payload,
        );
        if (valid) validSignatures++;
        else invalidSignerIndexes.push(index);
      } catch {
        invalidSignerIndexes.push(index);
      }
    }
    localizedSignatureDiagnostic.search_window.candidates_tested++;
    if (validSignatures > 0) {
      localizedSignatureDiagnostic.search_window.matching_set_ids.push(candidateSetId.toString());
    }
    if (validSignatures > 0 || candidateSetId === setId || candidateSetId === setId - 1n) {
      localizedSignatureDiagnostic.candidates.push({
        candidate_set_id: candidateSetId.toString(),
        valid_signatures: validSignatures,
        total_signatures: justification.commit.precommits.length,
        invalid_signer_indexes: invalidSignerIndexes,
      });
    }
  }

  // Run the existing full verifier under each set ID that makes one or more
  // embedded signatures valid. This remains diagnostic because both the
  // candidate set ID and the authority list's historical provenance are
  // untrusted; this result must never flip the authoritative crypto gate.
  const candidateSetVerification = {
    status: "DIAGNOSTIC_ONLY" as const,
    results: [] as Array<{
      candidate_set_id: string;
      status: string;
      signed_weight: string | null;
      total_weight: string | null;
      error: string | null;
    }>,
    trust_scope: "Uses an inferred candidate set ID and the currently observed authority list. Even a signature/quorum/ancestry pass is not authenticated historical finality.",
  };
  for (const candidateSetId of localizedSignatureDiagnostic.search_window.matching_set_ids) {
    try {
      const candidateResult = await verifyFinality(
        {
          chainId: CHAIN_ID,
          genesisHash: hexToBytes(genesisHash, "genesis hash"),
          blockHash: hexToBytes(witness.blockHash, "witness block hash"),
          blockNumber: witness.blockNumber,
        },
        justification,
        {
          chainId: CHAIN_ID,
          genesisHash: hexToBytes(genesisHash, "genesis hash"),
          setId: BigInt(candidateSetId),
          authorities,
        },
        nobleEd25519,
        { verifyAncestry: true },
      );
      candidateSetVerification.results.push({
        candidate_set_id: candidateSetId,
        status: "SIGNATURE_QUORUM_ANCESTRY_PASS_UNTRUSTED",
        signed_weight: candidateResult.signedWeight.toString(),
        total_weight: candidateResult.totalWeight.toString(),
        error: null,
      });
    } catch (error) {
      candidateSetVerification.results.push({
        candidate_set_id: candidateSetId,
        status: "SIGNATURE_QUORUM_ANCESTRY_FAIL_UNTRUSTED",
        signed_weight: null,
        total_weight: null,
        error: error instanceof Error ? error.name + ": " + error.message : String(error),
      });
    }
  }

  // Diagnostic only: the authority set visible at the target's post-state
  // can differ from the set that signed finality for the target if a set change
  // is enacted at this boundary. Never treat a parent-state match as authenticated
  // transition provenance; it only helps classify INVALID_SIGNATURE.
  let parentStateDiagnostic: {
    status: string;
    source_block_hash: string;
    source_kind?: "LOCAL_SNAPSHOT_RPC" | "PUBLIC_RPC";
    set_id?: string;
    authority_count?: number;
    authority_public_keys?: string[];
    verification_error?: string | null;
    signed_weight?: string | null;
    total_weight?: string | null;
    error?: string;
    trust_scope: string;
  } = {
    status: "NOT_ATTEMPTED",
    source_block_hash: witness.header.parentHash,
    trust_scope: "UNTRUSTED DIAGNOSTIC ONLY; parent-state signatures/quorum do not authenticate the authority transition or finality",
  };

  const snapshotWindowBindingValid = isValidSnapshotStateProbeEvidence(
    snapshotStateEvidence,
    {
      chainId: CHAIN_ID,
      genesisHash,
      authorityRpc: AUTHORITY_RPC,
      blockNumber: Number(witness.blockNumber),
      blockHash: witness.blockHash,
    },
  );
  const parentStateEndpoint = snapshotWindowBindingValid ? AUTHORITY_RPC : RPC;

  const directStorageSetIdDiagnostic: {
    status: string;
    storage_key: string;
    source_block_hash: string;
    raw_value?: string | null;
    decoded_set_id?: string | null;
    runtime_api_set_id?: string;
    matches_runtime_api?: boolean;
    error?: string;
    trust_scope: string;
  } = {
    status: "NOT_ATTEMPTED",
    storage_key: GRANDPA_CURRENT_SET_ID_STORAGE_KEY,
    source_block_hash: witness.blockHash,
    trust_scope: "Diagnostic comparison only; storage/runtime state is not independently bound to GRANDPA finality.",
  };
  if (snapshotWindowBindingValid) {
    try {
      const rawStorageValue = await rpc<string | null>(
        "state_getStorage",
        [GRANDPA_CURRENT_SET_ID_STORAGE_KEY, witness.blockHash],
        AUTHORITY_RPC,
      );
      directStorageSetIdDiagnostic.raw_value = rawStorageValue;
      if (rawStorageValue === null) {
        directStorageSetIdDiagnostic.status = "STORAGE_VALUE_NULL";
      } else {
        const directSetId = decodeStorageU64(rawStorageValue);
        directStorageSetIdDiagnostic.decoded_set_id = directSetId.toString();
        directStorageSetIdDiagnostic.runtime_api_set_id = setId.toString();
        directStorageSetIdDiagnostic.matches_runtime_api = directSetId === setId;
        directStorageSetIdDiagnostic.status = directSetId === setId
          ? "DIRECT_STORAGE_MATCHES_RUNTIME_API"
          : "DIRECT_STORAGE_RUNTIME_API_MISMATCH";
      }
    } catch (error) {
      directStorageSetIdDiagnostic.status = "QUERY_FAILED";
      directStorageSetIdDiagnostic.error = error instanceof Error ? error.message : String(error);
    }
  } else {
    directStorageSetIdDiagnostic.status = "NOT_ATTEMPTED_NO_VERIFIED_SNAPSHOT";
  }

  const observeGrandpaRoundState = async (endpoint: string) => {
    try {
      const rawResult = await rpc<unknown>("grandpa_roundState", [], endpoint);
      const record = typeof rawResult === "object" && rawResult !== null
        ? rawResult as Record<string, unknown>
        : null;
      const rawSetId = record?.setId ?? record?.set_id ?? null;
      return {
        status: "OBSERVED_UNTRUSTED",
        set_id: rawSetId === null || rawSetId === undefined ? null : String(rawSetId),
        raw_result: rawResult,
        trust_scope: "Untrusted live GRANDPA voter RPC observation; not authority provenance",
      };
    } catch (error) {
      return {
        status: "UNAVAILABLE",
        error: error instanceof Error ? error.message : String(error),
        trust_scope: "Untrusted live GRANDPA voter RPC observation; not authority provenance",
      };
    }
  };

  const grandpaRoundStateDiagnostic = {
    public_http_rpc: await observeGrandpaRoundState(RPC),
    local_snapshot_rpc: snapshotWindowBindingValid
      ? await observeGrandpaRoundState(AUTHORITY_RPC)
      : { status: "NOT_AVAILABLE_NO_VERIFIED_LOCAL_SNAPSHOT" },
  };

  if (cryptoVerification.status === "FAIL") {
    try {
      const parentNumber = Number(witness.blockNumber - 1n);
      if (snapshotWindowBindingValid) {
        const localParentHash = requireHash(
          await rpc<unknown>("chain_getBlockHash", [parentNumber], parentStateEndpoint),
          "local snapshot parent hash",
        );
        if (localParentHash !== witness.header.parentHash) {
          throw new Error("LOCAL_SNAPSHOT_PARENT_HASH_MISMATCH");
        }
      }
      const parentAuthoritiesHex = await rpc<string>(
        "state_call",
        [
          "GrandpaApi_grandpa_authorities",
          "0x",
          witness.header.parentHash,
        ],
        parentStateEndpoint,
      );
      const parentSetIdHex = await rpc<string>(
        "state_call",
        [
          "GrandpaApi_current_set_id",
          "0x",
          witness.header.parentHash,
        ],
        parentStateEndpoint,
      );
      const parentAuthorities = decodeAuthorityList(parentAuthoritiesHex);
      const parentSetId = decodeSetId(parentSetIdHex);
      parentStateDiagnostic = {
        status: "CAPTURED_UNTRUSTED",
        source_block_hash: witness.header.parentHash,
        source_kind: snapshotWindowBindingValid ? "LOCAL_SNAPSHOT_RPC" : "PUBLIC_RPC",
        set_id: parentSetId.toString(),
        authority_count: parentAuthorities.length,
        authority_public_keys: parentAuthorities.map(authority => bytesToHex(authority.publicKey)),
        verification_error: null,
        signed_weight: null,
        total_weight: null,
        trust_scope: "UNTRUSTED DIAGNOSTIC ONLY; parent-state signatures/quorum do not authenticate the authority transition or finality",
      };
      try {
        const parentResult = await verifyFinality(
          {
            chainId: CHAIN_ID,
            genesisHash: hexToBytes(genesisHash, "genesis hash"),
            blockHash: hexToBytes(witness.blockHash, "witness block hash"),
            blockNumber: witness.blockNumber,
          },
          justification,
          {
            chainId: CHAIN_ID,
            genesisHash: hexToBytes(genesisHash, "genesis hash"),
            setId: parentSetId,
            authorities: parentAuthorities,
          },
          nobleEd25519,
          { verifyAncestry: true },
        );
        parentStateDiagnostic.status = "SIGNATURE_QUORUM_PASS_UNTRUSTED";
        parentStateDiagnostic.signed_weight = parentResult.signedWeight.toString();
        parentStateDiagnostic.total_weight = parentResult.totalWeight.toString();
      } catch (error) {
        parentStateDiagnostic.status = "SIGNATURE_QUORUM_FAIL_UNTRUSTED";
        parentStateDiagnostic.verification_error =
          error instanceof Error ? error.name + ": " + error.message : String(error);
      }
    } catch (error) {
      parentStateDiagnostic.status = "PARENT_STATE_UNAVAILABLE";
      parentStateDiagnostic.source_kind = snapshotWindowBindingValid ? "LOCAL_SNAPSHOT_RPC" : "PUBLIC_RPC";
      parentStateDiagnostic.error = error instanceof Error ? error.message : String(error);
    }
  }

  const authoritySetStateWindow: Array<{
    block_number: number;
    block_hash?: string;
    set_id?: string;
    authority_count?: number;
    signature_status: string;
    signed_weight?: string;
    total_weight?: string;
    error?: string;
    trust_scope: string;
  }> = [];

  if (snapshotWindowBindingValid && cryptoVerification.status === "FAIL") {
    const targetNumber = Number(witness.blockNumber);
    for (let blockNumber = Math.max(0, targetNumber - 5); blockNumber <= targetNumber; blockNumber += 1) {
      try {
        const blockHash = requireHash(
          await rpc<unknown>("chain_getBlockHash", [blockNumber], AUTHORITY_RPC),
          "snapshot set-window block hash",
        );
        const [windowAuthoritiesHex, windowSetIdHex] = await Promise.all([
          rpc<string>(
            "state_call",
            ["GrandpaApi_grandpa_authorities", "0x", blockHash],
            AUTHORITY_RPC,
          ),
          rpc<string>(
            "state_call",
            ["GrandpaApi_current_set_id", "0x", blockHash],
            AUTHORITY_RPC,
          ),
        ]);
        const windowAuthorities = decodeAuthorityList(windowAuthoritiesHex);
        const windowSetId = decodeSetId(windowSetIdHex);
        const diagnosticEntry: (typeof authoritySetStateWindow)[number] = {
          block_number: blockNumber,
          block_hash: blockHash,
          set_id: windowSetId.toString(),
          authority_count: windowAuthorities.length,
          signature_status: "FAIL",
          trust_scope: "UNTRUSTED LOCAL SNAPSHOT DIAGNOSTIC ONLY; no authority transition or finality provenance is inferred",
        };
        try {
          const windowResult = await verifyFinality(
            {
              chainId: CHAIN_ID,
              genesisHash: hexToBytes(genesisHash, "genesis hash"),
              blockHash: hexToBytes(witness.blockHash, "witness block hash"),
              blockNumber: witness.blockNumber,
            },
            justification,
            {
              chainId: CHAIN_ID,
              genesisHash: hexToBytes(genesisHash, "genesis hash"),
              setId: windowSetId,
              authorities: windowAuthorities,
            },
            nobleEd25519,
            { verifyAncestry: true },
          );
          diagnosticEntry.signature_status = "SIGNATURE_QUORUM_ANCESTRY_PASS_UNTRUSTED";
          diagnosticEntry.signed_weight = windowResult.signedWeight.toString();
          diagnosticEntry.total_weight = windowResult.totalWeight.toString();
        } catch (error) {
          diagnosticEntry.signature_status =
            error instanceof Error ? error.name + ": " + error.message : String(error);
        }
        authoritySetStateWindow.push(diagnosticEntry);
      } catch (error) {
        authoritySetStateWindow.push({
          block_number: blockNumber,
          signature_status: "STATE_QUERY_FAILED",
          error: error instanceof Error ? error.message : String(error),
          trust_scope: "UNTRUSTED LOCAL SNAPSHOT DIAGNOSTIC ONLY",
        });
      }
    }
  }

  let transitionWitness:
    | {
        blockNumber: number;
        blockHash: string;
        extrinsicIndex: number;
        extrinsicHex: string;
        selectionInputsHash: string;
        finalityEvidenceOnSameBlock: boolean;
      }
    | null = null;

  for (const block of recentBlocks) {
    if (block.number > Number(witness.blockNumber)) {
      continue;
    }

    const selection = extractSelectionInputsHash(
      block.signed.block.extrinsics,
    );

    if (selection !== null) {
      transitionWitness = {
        blockNumber: block.number,
        blockHash: block.hash,
        extrinsicIndex: selection.extrinsicIndex,
        extrinsicHex: selection.extrinsicHex,
        selectionInputsHash: selection.selectionInputsHash,
        finalityEvidenceOnSameBlock:
          extractGrandpaJustification(block.signed) !== null,
      };
      break;
    }
  }

  const packet = {
    schema_version: "materios-real-grandpa-witness-v1",
    chain_id: CHAIN_ID,
    rpc_endpoint: RPC,
    captured_at: new Date().toISOString(),
    finalized_head: {
      block_number: finalizedHeight.toString(),
      block_hash: finalizedHash,
      state_root: finalizedHeader.stateRoot,
    },
    parent_state_diagnostic: parentStateDiagnostic,
    authority_set_state_window: authoritySetStateWindow,
    direct_storage_set_id_diagnostic: directStorageSetIdDiagnostic,
    grandpa_round_state_diagnostic: grandpaRoundStateDiagnostic,
    authority_state: {
      source_block_hash: authorityStateSource,
      source_kind: authorityStateFallback ? "CURRENT_FINALIZED_STATE_FALLBACK" : "EXACT_PROOF_TARGET_STATE",
      target_state_error: authorityStateOriginalError,
      provenance_verified: false,
      note: authorityStateFallback
        ? "Signatures/quorum are checked against a runtime API set returned at the current finalized head because historical target state was pruned. This is diagnostic cryptographic evidence only; it does not authenticate the authority set at the proof target."
        : "Runtime API authority state was returned at the exact proof target but remains untrusted until an authenticated authority transition is verified."
    },
    witness: {
      block_number: witness.blockNumber.toString(),
      block_hash: witness.blockHash,
      parent_hash: witness.header.parentHash,
      state_root: witness.header.stateRoot,
      extrinsics_root: witness.header.extrinsicsRoot,
      justification_engine: GRANDPA_ENGINE_ID,
      justification_hex: witness.justificationHex,
      justification_sha256: witness.justificationSha256,
      justification_round:
        justification.round.toString(),
      commit_target_hash:
        bytesToHex(justification.commit.targetHash),
      commit_target_number:
        justification.commit.targetNumber.toString(),
      signer_count:
        justification.commit.precommits.length,
      authority_set: {
        set_id: setId.toString(),
        authorities: authorities.map((authority) => ({
          public_key: bytesToHex(authority.publicKey),
          weight: authority.weight.toString(),
        })),
      },
      cryptographic_verification: cryptoVerification,
      localized_signature_diagnostic: localizedSignatureDiagnostic,
      candidate_set_verification: candidateSetVerification,
    },
    transition: {
      status:
        transitionWitness === null
          ? "NOT_FOUND_IN_PROBE_WINDOW"
          : "OBSERVED_ON_CHAIN_UNVERIFIED_PROVENANCE",
      witness: transitionWitness,
      note:
        "The selection_inputs_hash is a real on-chain commitment, but this capture does not claim independent selector execution or authenticated authority-set provenance.",
    },
    probes: {
      dense_scan_start: scanStart,
      dense_scan_end: finalizedHeightNumber,
      dense_scan_blocks: recentBlocks.length,
      websocket_fallback: {
        status: websocketFallbackStatus,
        error: websocketFallbackError,
        evidence_path_configured: Boolean(websocketEvidencePath),
      },
      blocks_with_grandpa_justification: witnessedBlocks.map(
        (block) => ({
          blockNumber: block.number,
          blockHash: block.hash,
        }),
      ),
    },
    b3a_claim: {
      cryptographic_finality:
        cryptoVerification.status === "PASS",
      authority_transition_provenance: false,
      overall_status:
        cryptoVerification.status === "PASS" &&
        transitionWitness !== null
          ? "OPEN_AUTHORITY_PROVENANCE"
          : "OPEN",
    },
  };

  const outDir = join(HERE, "..", "out");
  mkdirSync(outDir, { recursive: true });

  const outPath = join(
    outDir,
    "MateriosRealGrandpaWitness.json",
  );

  writeFileSync(
    outPath,
    JSON.stringify(packet, null, 2) + "\n",
    "utf8",
  );

  if (cryptoVerification.status !== "PASS") {
    console.error(
      "GRANDPA CRYPTOGRAPHIC VERIFICATION: FAIL",
    );
    process.exitCode = 1;
  } else if (transitionWitness === null) {
    console.error(
      "AUTHORITY TRANSITION COMMITMENT: NOT FOUND IN WITNESS WINDOW",
    );
    process.exitCode = 1;
  }

  console.log("\n=== Real witness ===");
  console.log(
    "block:",
    witness.blockNumber.toString(),
  );
  console.log("hash:", witness.blockHash);
  console.log("round:", justification.round.toString());
  console.log("set_id:", setId.toString());
  console.log(
    "precommits:",
    justification.commit.precommits.length,
  );
  console.log(
    "crypto verification:",
    cryptoVerification.status,
  );
  console.log(
    "signed/total weight:",
    cryptoVerification.signedWeight ??
      "unavailable",
    "/",
    cryptoVerification.totalWeight ??
      "unavailable",
  );
  console.log(
    "transition witness:",
    transitionWitness?.blockNumber ??
      "not found",
  );
  console.log("wrote:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
