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
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  decodeGrandpaJustification,
} from "./grandpa.js";
import { decodeMateriosHeaderFromReader } from "./ancestry.js";
import {
  verifyFinality,
} from "./verifier.js";
import {
  nobleEd25519,
} from "./crypto.js";
import {
  bytesToHex,
  ScaleReader,
} from "./scale.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));

const RPC =
  process.env.MATERIOS_RPC ??
  "https://materios.fluxpointstudios.com/rpc";

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
): Promise<T> {
  const response = await fetch(RPC, {
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

async function waitForJustificationNotification(
  timeoutMs = 120_000,
): Promise<{ blockHash: string; justificationHex: string }> {
  const endpoint =
    process.env.MATERIOS_WS_RPC ??
    RPC.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

  return await new Promise((resolve, reject) => {
    let settled = false;
    let subscribed = false;
    const socket = new WebSocket(endpoint);
    const timeout = setTimeout(() => {
      finish(new Error("GRANDPA_WEBSOCKET_JUSTIFICATION_TIMEOUT"));
    }, timeoutMs);

    function finish(error?: Error, result?: { blockHash: string; justificationHex: string }): void {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try { socket.close(); } catch {}
      if (error) reject(error);
      else if (result) resolve(result);
      else reject(new Error("GRANDPA_WEBSOCKET_EMPTY_RESULT"));
    }

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 7001,
        method: "grandpa_subscribeJustifications",
        params: [],
      }));
    });

    socket.addEventListener("message", (event) => {
      let message: any;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        finish(new Error("GRANDPA_WEBSOCKET_INVALID_JSON"));
        return;
      }

      if (message?.id === 7001) {
        if (message.error) {
          finish(new Error(
            "grandpa_subscribeJustifications: " +
            String(message.error.code) + " " +
            String(message.error.message),
          ));
          return;
        }
        subscribed = true;
        console.log("GRANDPA justification subscription accepted");
        return;
      }

      if (message?.method !== "grandpa_justifications") return;
      const result = message?.params?.result;
      const blockHash =
        Array.isArray(result) ? result[0] :
        result && typeof result === "object" ? result.block :
        undefined;
      const justificationHex =
        Array.isArray(result) ? result[1] :
        result && typeof result === "object" ? result.justification :
        undefined;

      if (
        !subscribed ||
        typeof blockHash !== "string" ||
        !/^0x[0-9a-fA-F]{64}$/.test(blockHash) ||
        typeof justificationHex !== "string" ||
        !/^0x[0-9a-fA-F]+$/.test(justificationHex) ||
        (justificationHex.length - 2) % 2 !== 0
      ) {
        finish(new Error("GRANDPA_WEBSOCKET_MALFORMED_JUSTIFICATION_NOTIFICATION"));
        return;
      }

      finish(undefined, {
        blockHash: blockHash.toLowerCase(),
        justificationHex: justificationHex.toLowerCase(),
      });
    });

    socket.addEventListener("error", () => {
      finish(new Error("GRANDPA_WEBSOCKET_CONNECTION_ERROR: " + endpoint));
    });

    socket.addEventListener("close", () => {
      if (!settled) {
        finish(new Error("GRANDPA_WEBSOCKET_CLOSED_BEFORE_JUSTIFICATION"));
      }
    });
  });
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

  let witness: {
    blockNumber: bigint;
    blockHash: string;
    header: SubstrateHeader;
    justificationHex: string;
    justificationSha256: string;
  };
  let witnessSource: "chain_getBlock.justifications" | "grandpa_proveFinality" | "grandpa_subscribeJustifications";

  if (witnessedBlocks.length > 0) {
    const firstWitness = witnessedBlocks[0]!;
    const witnessJustification = extractGrandpaJustification(
      firstWitness.signed,
    );

    if (witnessJustification === null) {
      throw new Error("internal witness extraction race");
    }

    witness = {
      blockNumber: BigInt(firstWitness.number),
      blockHash: firstWitness.hash,
      header: firstWitness.signed.block.header,
      justificationHex: witnessJustification,
      justificationSha256: sha256Hex(witnessJustification),
    };
    witnessSource = "chain_getBlock.justifications";
  } else {
    console.log("dense scan found no attached justification; probing grandpa_proveFinality");
    let encodedProof: unknown = null;
    let proveFinalityError: string | null = null;
    try {
      encodedProof = await rpc<unknown>(
        "grandpa_proveFinality",
        [finalizedHeightNumber],
      );
    } catch (error) {
      proveFinalityError =
        error instanceof Error ? error.message : String(error);
      if (!proveFinalityError.includes("-32601 Method not found")) throw error;
      console.log("grandpa_proveFinality is not exposed; trying GRANDPA justification subscription");
    }

    if (
      typeof encodedProof === "string" &&
      /^0x[0-9a-fA-F]+$/.test(encodedProof) &&
      (encodedProof.length - 2) % 2 === 0
    ) {
      const proofReader = new ScaleReader(hexToBytes(encodedProof, "grandpa_proveFinality"));
      const proofBlockHash = "0x" + bytesToHex(proofReader.readBytes(32));
      const justificationLength = proofReader.readCompact();
      if (
        justificationLength <= 0n ||
        justificationLength > BigInt(proofReader.remaining) ||
        justificationLength > 16n * 1024n * 1024n
      ) {
        throw new Error("grandpa_proveFinality returned invalid justification length");
      }
      const proofJustification = proofReader.readBytes(Number(justificationLength));
      const unknownHeaderCount = proofReader.readCompact();
      if (unknownHeaderCount > 10_000n) {
        throw new Error("grandpa_proveFinality returned too many unknown headers");
      }
      const proofHeaders = [];
      for (let i = 0n; i < unknownHeaderCount; i += 1n) {
        proofHeaders.push(decodeMateriosHeaderFromReader(proofReader));
      }
      proofReader.assertEof();

      const proofHeader = await getHeader(proofBlockHash);
      const proofBlockNumber = parseBlockNumber(
        proofHeader.number,
        "grandpa_proveFinality target block number",
      );
      const proofBlock = await rpc<SignedBlock>("chain_getBlock", [proofBlockHash]);
      if (!proofBlock?.block?.header) {
        throw new Error("grandpa_proveFinality target header unavailable");
      }
      if (parseBlockNumber(proofBlock.block.header.number, "proof target header number") !== proofBlockNumber) {
        throw new Error("grandpa_proveFinality target header number mismatch");
      }
      const decodedProofJustification = decodeGrandpaJustification(proofJustification);
      if (
        decodedProofJustification.commit.targetNumber !== proofBlockNumber ||
        "0x" + bytesToHex(decodedProofJustification.commit.targetHash) !== proofBlockHash
      ) {
        throw new Error("grandpa_proveFinality proof target does not match justification commit");
      }

      witness = {
        blockNumber: proofBlockNumber,
        blockHash: proofBlockHash,
        header: proofBlock.block.header,
        justificationHex: "0x" + bytesToHex(proofJustification),
        justificationSha256: sha256Hex("0x" + bytesToHex(proofJustification)),
      };
      witnessSource = "grandpa_proveFinality";
      console.log(
        "decoded GRANDPA finality proof:",
        "target=" + proofBlockNumber.toString(),
        "unknownHeaders=" + proofHeaders.length,
        "justificationBytes=" + proofJustification.length,
      );
    } else {
      let liveWitness: { blockHash: string; justificationHex: string };
      try {
        liveWitness = await waitForJustificationNotification();
      } catch (error) {
        const subscriptionError =
          error instanceof Error ? error.message : String(error);
        const proveFinalityMissing =
          proveFinalityError !== null &&
          proveFinalityError.includes("-32601 Method not found");
        const subscriptionMethodMissing =
          subscriptionError.includes("-32601 Method not found");
        const diagnosticStatus =
          proveFinalityMissing && subscriptionMethodMissing
            ? "BLOCKED_GRANDPA_RPC_METHODS_NOT_EXPOSED"
            : "BLOCKED_NO_GRANDPA_JUSTIFICATION_SOURCE";
        const outDir = join(HERE, "..", "out");
        mkdirSync(outDir, { recursive: true });
        const diagnosticPath = join(
          outDir,
          "MateriosGrandpaRpcCapabilityDiagnostic.json",
        );
        const diagnostic = {
          schema_version: "materios-grandpa-rpc-capability-diagnostic-v1",
          status: diagnosticStatus,
          captured_at: new Date().toISOString(),
          chain_id: CHAIN_ID,
          rpc_endpoint: RPC,
          finalized_head: {
            block_number: finalizedHeight.toString(),
            block_hash: finalizedHash,
            state_root: finalizedHeader.stateRoot,
          },
          genesis_hash: genesisHash,
          probes: {
            chain_getBlock_justifications: {
              lookback_start: scanStart,
              lookback_end: finalizedHeightNumber,
              blocks_scanned: recentBlocks.length,
              blocks_with_grandpa_justification: witnessedBlocks.map((block) => ({
                block_number: block.number,
                block_hash: block.hash,
              })),
              status:
                witnessedBlocks.length > 0
                  ? "AVAILABLE"
                  : "NO_FRNK_JUSTIFICATION_IN_SCANNED_BLOCKS",
            },
            grandpa_proveFinality: {
              status:
                encodedProof !== null
                  ? "RETURNED"
                  : proveFinalityMissing
                    ? "METHOD_NOT_FOUND"
                    : proveFinalityError
                      ? "ERROR"
                      : "NO_PROOF_RETURNED",
              error: proveFinalityError,
            },
            grandpa_subscribeJustifications: {
              status: subscriptionMethodMissing
                ? "METHOD_NOT_FOUND"
                : "ERROR",
              error: subscriptionError,
            },
          },
          claim: {
            cryptographic_finality_verified: false,
            authority_set_provenance_verified: false,
            overall_b3a_status: "OPEN",
          },
          non_claim:
            "This diagnostic records RPC capability responses only. It is not a GRANDPA justification, a finality proof, or evidence that the finalized head is independently authenticated.",
        };
        writeFileSync(
          diagnosticPath,
          JSON.stringify(diagnostic, null, 2) + "\n",
          "utf8",
        );
        console.error(
          "GRANDPA_WITNESS_UNAVAILABLE:",
          diagnosticStatus,
          "diagnostic:",
          diagnosticPath,
        );
        throw new Error(
          "No verifiable GRANDPA justification source is available. " +
          "A machine-readable diagnostic was written to " +
          diagnosticPath,
        );
      }

      const liveHeader = await getHeader(liveWitness.blockHash);
      const liveBlockNumber = parseBlockNumber(
        liveHeader.number,
        "GRANDPA subscription target block number",
      );
      const liveJustification = decodeGrandpaJustification(
        hexToBytes(liveWitness.justificationHex, "GRANDPA subscription justification"),
      );
      if (
        liveJustification.commit.targetNumber !== liveBlockNumber ||
        "0x" + bytesToHex(liveJustification.commit.targetHash) !== liveWitness.blockHash
      ) {
        throw new Error("GRANDPA subscription target does not match justification commit");
      }

      witness = {
        blockNumber: liveBlockNumber,
        blockHash: liveWitness.blockHash,
        header: liveHeader,
        justificationHex: liveWitness.justificationHex,
        justificationSha256: sha256Hex(liveWitness.justificationHex),
      };
      witnessSource = "grandpa_subscribeJustifications";
      console.log(
        "captured live GRANDPA justification:",
        liveBlockNumber.toString(),
        liveWitness.blockHash,
      );
    }
  }

  console.log(
    "found GRANDPA justification via:",
    witnessSource,
    witness.blockNumber.toString(),
    witness.blockHash,
  );

  const authoritiesHex = await rpc<string>(
    "state_call",
    [
      "GrandpaApi_grandpa_authorities",
      "0x",
      witness.blockHash,
    ],
  );

  const setIdHex = await rpc<string>(
    "state_call",
    [
      "GrandpaApi_current_set_id",
      "0x",
      witness.blockHash,
    ],
  );

  const authorities = decodeAuthorityList(authoritiesHex);
  const setId = decodeSetId(setIdHex);

  const justification = decodeGrandpaJustification(
    hexToBytes(
      witness.justificationHex,
      "GRANDPA justification",
    ),
  );

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
    witness: {
      source: witnessSource,
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
