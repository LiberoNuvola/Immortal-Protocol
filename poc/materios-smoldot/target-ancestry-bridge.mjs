import { blake2b } from "../materios-checkpoint/node_modules/@noble/hashes/blake2.js";

const U32_MAX = 0xffffffffn;
const HASH_RE = /^0x[0-9a-f]{64}$/i;

function normalizeHash(value, field) {
  if (typeof value !== "string" || !HASH_RE.test(value)) {
    throw new Error(field + ": expected a 32-byte 0x-prefixed hash");
  }
  return value.toLowerCase();
}

function hexBytes(value, field) {
  if (typeof value !== "string" || !/^0x(?:[0-9a-f]{2})*$/i.test(value)) {
    throw new Error(field + ": expected even-length 0x-prefixed hex");
  }
  return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
}

function toHex(value) {
  return "0x" + Buffer.from(value).toString("hex");
}

function encodeCompactU32(value, field) {
  const n = BigInt(value);
  if (n < 0n || n > U32_MAX) throw new Error(field + ": block number outside u32");
  if (n < 64n) return Uint8Array.of(Number(n << 2n));
  if (n < 16384n) {
    const v = (n << 2n) | 1n;
    return Uint8Array.of(Number(v & 0xffn), Number((v >> 8n) & 0xffn));
  }
  if (n < 1073741824n) {
    const v = (n << 2n) | 2n;
    return Uint8Array.of(
      Number(v & 0xffn),
      Number((v >> 8n) & 0xffn),
      Number((v >> 16n) & 0xffn),
      Number((v >> 24n) & 0xffn)
    );
  }
  throw new Error(field + ": unsupported compact u32 encoding");
}

function concat(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

/** Encode the canonical Substrate header SCALE layout from an RPC header. */
export function encodeMateriosHeader(header) {
  if (!header || typeof header !== "object") throw new Error("HEADER_MISSING");
  if (typeof header.number !== "string" || !/^0x[0-9a-f]+$/i.test(header.number)) {
    throw new Error("HEADER_NUMBER_INVALID");
  }
  const number = BigInt(header.number);
  if (number < 0n || number > U32_MAX) throw new Error("HEADER_NUMBER_OUTSIDE_U32");
  if (!Array.isArray(header.digest?.logs)) throw new Error("HEADER_DIGEST_LOGS_MISSING");
  if (header.digest.logs.length > 1024) throw new Error("HEADER_DIGEST_TOO_LARGE");
  const parentHash = hexBytes(header.parentHash, "header.parentHash");
  const stateRoot = hexBytes(header.stateRoot, "header.stateRoot");
  const extrinsicsRoot = hexBytes(header.extrinsicsRoot, "header.extrinsicsRoot");
  if (parentHash.length !== 32 || stateRoot.length !== 32 || extrinsicsRoot.length !== 32) {
    throw new Error("HEADER_HASH_FIELD_LENGTH_INVALID");
  }
  const logs = header.digest.logs.map((log, index) => hexBytes(log, "header.digest.logs[" + index + "]"));
  return concat([
    parentHash,
    encodeCompactU32(number, "header.number"),
    stateRoot,
    extrinsicsRoot,
    encodeCompactU32(logs.length, "header.digest.logs.length"),
    ...logs
  ]);
}

export function hashMateriosHeader(header) {
  return toHex(blake2b(encodeMateriosHeader(header), { dkLen: 32 }));
}

function inspectHeader(header, expectedNumber, expectedHash, label) {
  const raw = encodeMateriosHeader(header);
  const hash = toHex(blake2b(raw, { dkLen: 32 })).toLowerCase();
  const numberBig = BigInt(header.number);
  const number = Number(numberBig);
  if (!Number.isSafeInteger(number) || numberBig > U32_MAX) {
    throw new Error(label + ": HEADER_NUMBER_OUTSIDE_U32");
  }
  const parentHash = normalizeHash(header.parentHash, label + ".parentHash");
  const stateRoot = normalizeHash(header.stateRoot, label + ".stateRoot");
  const extrinsicsRoot = normalizeHash(header.extrinsicsRoot, label + ".extrinsicsRoot");
  if (expectedNumber !== undefined && number !== expectedNumber) {
    throw new Error(label + ": BLOCK_NUMBER_MISMATCH expected=" + expectedNumber + " observed=" + number);
  }
  if (expectedHash !== undefined && hash !== normalizeHash(expectedHash, label + ".expectedHash")) {
    throw new Error(label + ": HEADER_HASH_MISMATCH computed=" + hash);
  }
  return {
    number,
    hash,
    parentHash,
    stateRoot,
    extrinsicsRoot,
    rawHeaderScaleHex: toHex(raw)
  };
}

/**
 * Verify an exact sequential parent chain from the storage-proof checkpoint
 * header to the header named by a raw GRANDPA justification.
 *
 * This checks header encoding/hash binding and ancestry continuity only. It
 * does not verify GRANDPA signatures, quorum, authority provenance or finality.
 */
export function verifySequentialHeaderBridge({
  checkpointHeader,
  checkpointNumber,
  checkpointHash,
  intermediateHeaders,
  proofTargetHeader,
  proofTargetNumber,
  proofTargetHash,
  maxSpan = 512
}) {
  if (!Number.isSafeInteger(checkpointNumber) || checkpointNumber < 0) {
    throw new Error("CHECKPOINT_NUMBER_INVALID");
  }
  if (!Number.isSafeInteger(proofTargetNumber) || proofTargetNumber < checkpointNumber) {
    throw new Error("PROOF_TARGET_NUMBER_INVALID");
  }
  if (!Number.isSafeInteger(maxSpan) || maxSpan < 0 || maxSpan > 4096) {
    throw new Error("MAX_SPAN_INVALID");
  }
  if (!Array.isArray(intermediateHeaders)) throw new Error("INTERMEDIATE_HEADERS_INVALID");

  const span = proofTargetNumber - checkpointNumber;
  if (span > maxSpan) {
    throw new Error("ANCESTRY_SPAN_EXCEEDS_LIMIT span=" + span + " max=" + maxSpan);
  }

  const checkpoint = inspectHeader(
    checkpointHeader,
    checkpointNumber,
    checkpointHash,
    "checkpoint"
  );
  const proofTarget = inspectHeader(
    proofTargetHeader,
    proofTargetNumber,
    proofTargetHash,
    "proofTarget"
  );

  if (span === 0) {
    if (intermediateHeaders.length !== 0) throw new Error("ZERO_SPAN_HAS_INTERMEDIATE_HEADERS");
    if (checkpoint.hash !== proofTarget.hash) throw new Error("ZERO_SPAN_TARGET_HASH_MISMATCH");
    return {
      schema_version: "materios-b3-header-ancestry-bridge-v1",
      status: "ANCESTRY_LINK_VERIFIED",
      checkpoint: { block_number: checkpoint.number, block_hash: checkpoint.hash, state_root: checkpoint.stateRoot },
      proof_target: { block_number: proofTarget.number, block_hash: proofTarget.hash, state_root: proofTarget.stateRoot },
      block_span: 0,
      header_count: 1,
      headers: [{ block_number: checkpoint.number, block_hash: checkpoint.hash, parent_hash: checkpoint.parentHash, state_root: checkpoint.stateRoot, extrinsics_root: checkpoint.extrinsicsRoot, header_scale_hex: checkpoint.rawHeaderScaleHex }]
    };
  }

  if (intermediateHeaders.length !== span - 1) {
    throw new Error("ANCESTRY_HEADER_COUNT_MISMATCH expected=" + (span - 1) + " observed=" + intermediateHeaders.length);
  }

  const normalized = [checkpoint];
  for (let index = 0; index < intermediateHeaders.length; index++) {
    const item = intermediateHeaders[index];
    const header = item && item.header ? item.header : item;
    const expectedHash = item && item.header ? item.expectedHash : undefined;
    normalized.push(inspectHeader(
      header,
      checkpointNumber + index + 1,
      expectedHash,
      "intermediate[" + index + "]"
    ));
  }
  normalized.push(proofTarget);

  for (let index = 1; index < normalized.length; index++) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (current.number !== previous.number + 1) {
      throw new Error("ANCESTRY_NON_SEQUENTIAL_BLOCKS at_index=" + index);
    }
    if (current.parentHash !== previous.hash) {
      throw new Error("ANCESTRY_PARENT_HASH_MISMATCH at_block=" + current.number);
    }
  }

  return {
    schema_version: "materios-b3-header-ancestry-bridge-v1",
    status: "ANCESTRY_LINK_VERIFIED",
    checkpoint: { block_number: checkpoint.number, block_hash: checkpoint.hash, state_root: checkpoint.stateRoot },
    proof_target: { block_number: proofTarget.number, block_hash: proofTarget.hash, state_root: proofTarget.stateRoot },
    block_span: span,
    header_count: normalized.length,
    headers: normalized.map(header => ({
      block_number: header.number,
      block_hash: header.hash,
      parent_hash: header.parentHash,
      state_root: header.stateRoot,
      extrinsics_root: header.extrinsicsRoot,
      header_scale_hex: header.rawHeaderScaleHex
    }))
  };
}
