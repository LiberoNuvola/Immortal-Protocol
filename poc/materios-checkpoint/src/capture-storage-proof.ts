import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";

import { blake2b } from "@noble/hashes/blake2.js";
import { MateriosRpc } from "./rpc.js";
import { bytesToHex, hexToBytes } from "./scale.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const RPC =
  process.env.MATERIOS_RPC ??
  "https://materios.fluxpointstudios.com/preprod-rpc";
const FIREHOSE =
  process.env.MATERIOS_FIREHOSE ??
  "https://materios.fluxpointstudios.com/api/firehose/stream";
const INDEXER =
  process.env.MATERIOS_EVENTS ??
  "https://materios.fluxpointstudios.com/preprod-events";
const RECEIPT_TIMEOUT_MS = Number(
  process.env.MATERIOS_RECEIPT_TIMEOUT_MS ?? "120000",
);

const MASK64 = (1n << 64n) - 1n;
const P1 = 11400714785074694791n;
const P2 = 14029467366897019727n;
const P3 = 1609587929392839161n;
const P4 = 9650029242287828579n;
const P5 = 2870177450012600261n;

function rotl64(x: bigint, r: bigint): bigint {
  return ((x << r) & MASK64) | (x >> (64n - r));
}

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  let out = 0n;
  for (let i = 0; i < 8; i++) {
    out |= BigInt(bytes[offset + i]) << BigInt(i * 8);
  }
  return out;
}

function writeU64LE(value: bigint): Uint8Array {
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    out[i] = Number((value >> BigInt(i * 8)) & 0xffn);
  }
  return out;
}

function xxh64(input: Uint8Array, seed: bigint): bigint {
  let p = 0;
  let h: bigint;

  if (input.length >= 32) {
    let v1 = (seed + P1 + P2) & MASK64;
    let v2 = (seed + P2) & MASK64;
    let v3 = seed & MASK64;
    let v4 = (seed - P1) & MASK64;

    while (p <= input.length - 32) {
      v1 =
        (rotl64(
          (v1 + ((readU64LE(input, p) * P2) & MASK64)) & MASK64,
          31n,
        ) *
          P1) &
        MASK64;
      p += 8;
      v2 =
        (rotl64(
          (v2 + ((readU64LE(input, p) * P2) & MASK64)) & MASK64,
          31n,
        ) *
          P1) &
        MASK64;
      p += 8;
      v3 =
        (rotl64(
          (v3 + ((readU64LE(input, p) * P2) & MASK64)) & MASK64,
          31n,
        ) *
          P1) &
        MASK64;
      p += 8;
      v4 =
        (rotl64(
          (v4 + ((readU64LE(input, p) * P2) & MASK64)) & MASK64,
          31n,
        ) *
          P1) &
        MASK64;
      p += 8;
    }

    h =
      (rotl64(v1, 1n) +
        rotl64(v2, 7n) +
        rotl64(v3, 12n) +
        rotl64(v4, 18n)) &
      MASK64;

    for (const v of [v1, v2, v3, v4]) {
      h ^= (rotl64((v * P2) & MASK64, 31n) * P1) & MASK64;
      h = ((h * P1) + P4) & MASK64;
    }
  } else {
    h = (seed + P5) & MASK64;
  }

  h = (h + BigInt(input.length)) & MASK64;

  while (p + 8 <= input.length) {
    const k1 =
      (rotl64((readU64LE(input, p) * P2) & MASK64, 31n) * P1) &
      MASK64;
    h ^= k1;
    h = (rotl64(h, 27n) * P1 + P4) & MASK64;
    p += 8;
  }

  if (p + 4 <= input.length) {
    const lane =
      BigInt(input[p]) |
      (BigInt(input[p + 1]) << 8n) |
      (BigInt(input[p + 2]) << 16n) |
      (BigInt(input[p + 3]) << 24n);
    h ^= (lane * P1) & MASK64;
    h = (rotl64(h, 23n) * P2 + P3) & MASK64;
    p += 4;
  }

  while (p < input.length) {
    h ^= (BigInt(input[p]) * P5) & MASK64;
    h = (rotl64(h, 11n) * P1) & MASK64;
    p += 1;
  }

  h ^= h >> 33n;
  h = (h * P2) & MASK64;
  h ^= h >> 29n;
  h = (h * P3) & MASK64;
  h ^= h >> 32n;
  return h & MASK64;
}

function twox128(value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  return Uint8Array.from([
    ...writeU64LE(xxh64(bytes, 0n)),
    ...writeU64LE(xxh64(bytes, 1n)),
  ]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

function scaleCompact(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0 || value >= 1 << 30) {
    throw new Error(`unsupported SCALE compact value: ${value}`);
  }
  if (value < 1 << 6) return Uint8Array.of(value << 2);
  if (value < 1 << 14) {
    const v = (value << 2) | 1;
    return Uint8Array.of(v & 0xff, (v >>> 8) & 0xff);
  }
  const v = (value << 2) | 2;
  return Uint8Array.of(
    v & 0xff,
    (v >>> 8) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 24) & 0xff,
  );
}

function encodeStorageProofScale(nodes: string[]): string {
  const encoded = [
    scaleCompact(nodes.length),
    ...nodes.map((node) => {
      const bytes = hexToBytes(node);
      return concat([scaleCompact(bytes.length), bytes]);
    }),
  ];
  return bytesToHex(concat(encoded));
}

function receiptStorageKey(receiptId: string): string {
  const id = hexToBytes(receiptId);
  if (id.length !== 32) {
    throw new Error(`receiptId must be 32 bytes, got ${id.length}`);
  }

  const key = concat([
    twox128("OrinqReceipts"),
    twox128("Receipts"),
    blake2b(id, { dkLen: 16 }),
    id,
  ]);

  if (key.length !== 80) {
    throw new Error(`receipt storage key must be 80 bytes, got ${key.length}`);
  }

  return bytesToHex(key);
}

async function waitForReceiptId(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    RECEIPT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(FIREHOSE, {
      signal: controller.signal,
      headers: { accept: "text/event-stream" },
    });

    if (!response.ok || !response.body) {
      throw new Error(
        `firehose HTTP ${response.status} ${response.statusText}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;

        let event: unknown;
        try {
          event = JSON.parse(raw);
        } catch {
          continue;
        }

        if (
          typeof event === "object" &&
          event !== null &&
          (event as Record<string, unknown>).kind ===
            "receipt:certified"
        ) {
          const receiptId = (event as Record<string, unknown>).receiptId;
          if (typeof receiptId === "string") return receiptId;
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  throw new Error("firehose ended without a receipt:certified event");
}

async function getCertification(
  receiptId: string,
): Promise<{
  block: number;
  hash: string;
  certHash: string;
  signers: number;
}> {
  const url =
    `${INDEXER}/receipt-attestors?receiptId=${encodeURIComponent(
      receiptId,
    )}`;

  for (let attempt = 1; attempt <= 12; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      const body = (await response.json()) as Record<string, unknown>;

      if (body.certified !== true) {
        throw new Error("indexer says receipt is not certified");
      }

      const block = body.certified_at_block;
      const hash = body.certified_at_hash;
      const certHash = body.cert_hash;
      const signers = body.signer_count;

      if (typeof block !== "number" || !Number.isSafeInteger(block) || block < 0) {
        throw new Error("indexer certified_at_block is invalid");
      }
      if (
        typeof hash !== "string" ||
        !/^0x[0-9a-fA-F]{64}$/.test(hash)
      ) {
        throw new Error("indexer certified_at_hash is invalid");
      }
      if (
        typeof certHash !== "string" ||
        !/^0x[0-9a-fA-F]+$/.test(certHash)
      ) {
        throw new Error("indexer cert_hash is invalid");
      }
      if (
        typeof signers !== "number" ||
        !Number.isSafeInteger(signers) ||
        signers < 0
      ) {
        throw new Error("indexer signer_count is invalid");
      }

      return { block, hash, certHash, signers };
    }

    if (response.status !== 404) {
      throw new Error(
        `indexer HTTP ${response.status} for receipt-attestors`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    "indexer did not materialize receipt certification within retry window",
  );
}

type ReceiptCandidate = {
  receiptId: string;
  storageKey: string;
  createdAtMillis: bigint;
  availabilityCertHash: string;
};

function parseReceiptRecord(
  storageValue: string,
): {
  createdAtMillis: bigint;
  availabilityCertHash: string;
} {
  const bytes = hexToBytes(storageValue);
  let offset = 96;

  for (let option = 0; option < 2; option++) {
    if (offset >= bytes.length) {
      throw new Error("ReceiptRecord option flag is missing");
    }

    const flag = bytes[offset++];

    if (flag === 1) {
      if (offset + 32 > bytes.length) {
        throw new Error("ReceiptRecord option payload is truncated");
      }
      offset += 32;
    } else if (flag !== 0) {
      throw new Error(
        `ReceiptRecord option flag is invalid: ${flag}`,
      );
    }
  }

  const requiredHashes = 6 * 32;
  if (offset + requiredHashes + 8 > bytes.length) {
    throw new Error(
      "ReceiptRecord is truncated before created_at_millis",
    );
  }

  const availabilityCertOffset = offset + 5 * 32;
  const availabilityCertHash = bytesToHex(
    bytes.slice(
      availabilityCertOffset,
      availabilityCertOffset + 32,
    ),
  );

  offset += requiredHashes;

  let createdAtMillis = 0n;
  for (let i = 0; i < 8; i++) {
    createdAtMillis |=
      BigInt(bytes[offset + i]) <<
      BigInt(i * 8);
  }

  return {
    createdAtMillis,
    availabilityCertHash,
  };
}

async function discoverRecentCertifiedReceipt(
  rpc: MateriosRpc,
): Promise<{
  receiptId: string;
  certification: {
    block: number;
    hash: string;
    certHash: string;
    signers: number;
  };
  storageKey: string;
  storageValue: string;
}> {
  const finalizedHeadHash =
    await rpc.getFinalizedHead();
  const finalizedHead =
    await rpc.getHeader(finalizedHeadHash);

  const prefix = bytesToHex(
    concat([
      twox128("OrinqReceipts"),
      twox128("Receipts"),
    ]),
  );

  const rawKeys = await rpc.call<unknown>(
    "state_getKeysPaged",
    [
      prefix,
      2500,
      null,
      finalizedHeadHash,
    ],
  );

  if (
    !Array.isArray(rawKeys) ||
    !rawKeys.every(
      (key) =>
        typeof key === "string" &&
        /^0x[0-9a-fA-F]+$/.test(key),
    )
  ) {
    throw new Error(
      "state_getKeysPaged returned invalid receipt keys",
    );
  }

  console.log(
    "finalized_head:",
    finalizedHeadHash,
  );
  console.log(
    "finalized_block:",
    BigInt(finalizedHead.number).toString(),
  );
  console.log(
    "receipt_keys:",
    rawKeys.length,
  );

  const candidates: ReceiptCandidate[] = [];

  for (let start = 0; start < rawKeys.length; start += 250) {
    const batch = rawKeys.slice(start, start + 250);

    const values = await Promise.all(
      batch.map(async (storageKey) => {
        const storageValue =
          await rpc.getStorage(
            storageKey,
            finalizedHeadHash,
          );

        if (storageValue === null) {
          return null;
        }

        try {
          const parsed =
            parseReceiptRecord(storageValue);

          if (
            parsed.availabilityCertHash ===
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          ) {
            return null;
          }

          return {
            receiptId: bytesToHex(
              hexToBytes(storageKey).slice(-32),
            ),
            storageKey,
            storageValue,
            createdAtMillis:
              parsed.createdAtMillis,
            availabilityCertHash:
              parsed.availabilityCertHash,
          };
        } catch {
          return null;
        }
      }),
    );

    for (const value of values) {
      if (value !== null) candidates.push(value);
    }
  }

  candidates.sort((a, b) =>
    a.createdAtMillis === b.createdAtMillis
      ? a.receiptId.localeCompare(b.receiptId)
      : a.createdAtMillis > b.createdAtMillis
        ? -1
        : 1,
  );

  console.log(
    "certified receipt candidates:",
    candidates.length,
  );

  for (const candidate of candidates.slice(0, 24)) {
    try {
      const certification =
        await getCertification(
          candidate.receiptId,
        );

      const chainHash =
        await rpc.call<string>(
          "chain_getBlockHash",
          [certification.block],
        );

      if (
        chainHash.toLowerCase() !==
        certification.hash.toLowerCase()
      ) {
        continue;
      }

      const certificationHeader =
        await rpc.getHeader(
          certification.hash,
        );

      const finalizedNumber =
        Number(BigInt(finalizedHead.number));

      if (
        !Number.isSafeInteger(finalizedNumber) ||
        finalizedNumber <
          certification.block
      ) {
        continue;
      }

      const historicalValue =
        await rpc.getStorage(
          candidate.storageKey,
          certification.hash,
        );

      if (historicalValue === null) {
        continue;
      }

      console.log(
        "selected_receipt:",
        candidate.receiptId,
      );
      console.log(
        "selected_certified_block:",
        certification.block,
      );
      console.log(
        "selected_certified_hash:",
        certification.hash,
      );
      console.log(
        "selected_state_root:",
        certificationHeader.stateRoot,
      );

      return {
        receiptId: candidate.receiptId,
        certification,
        storageKey: candidate.storageKey,
        storageValue: historicalValue,
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    "no recent certified receipt has a still-queryable certified block/state",
  );
}

async function main(): Promise<void> {
  const outputDir = join(__dir, "..", "out");
  mkdirSync(outputDir, { recursive: true });

  const systemPrefix = bytesToHex(twox128("System"));
  if (
    systemPrefix !==
    "0x26aa394eea5630e07c48ae0c9558cef7"
  ) {
    throw new Error(
      `Twox128 self-check failed: got ${systemPrefix}`,
    );
  }

  const knownReceiptId =
    "0xb157c4ba8101f972b1850f1aaa3f7c9a034c385b73386ce841f8a1217c1ba009";
  const knownReceiptKey =
    receiptStorageKey(knownReceiptId);
  const expectedReceiptKey =
    "0xf2f45ef88f71bc25f444a160450145be5087a88ab53079a394ab62a465d461833657966cc15aa1d2b23158dd0c61e4e2b157c4ba8101f972b1850f1aaa3f7c9a034c385b73386ce841f8a1217c1ba009";

  if (knownReceiptKey !== expectedReceiptKey) {
    throw new Error(
      `receipt storage key self-check failed: got ${knownReceiptKey}`,
    );
  }

  const rpc = new MateriosRpc(RPC);
  console.log(
    "B3-B live storage proof capture",
  );
  console.log("RPC:", RPC);
  console.log(
    "Discovering a recent certified receipt from finalized state...",
  );

  const discovered =
    await discoverRecentCertifiedReceipt(rpc);

  const receiptId =
    discovered.receiptId;
  const certification =
    discovered.certification;
  const storageKey =
    discovered.storageKey;
  const storageValue =
    discovered.storageValue;

  const header =
    await rpc.getHeader(
      certification.hash,
    );

  const finalizedHeadHash =
    await rpc.getFinalizedHead();
  const finalizedHead =
    await rpc.getHeader(
      finalizedHeadHash,
    );

  const finalizedBlockNumber =
    Number(
      BigInt(finalizedHead.number),
    );

  if (
    !Number.isSafeInteger(
      finalizedBlockNumber,
    ) ||
    finalizedBlockNumber <
      certification.block
  ) {
    throw new Error(
      `certified block ${certification.block} is ahead of finalized head ${finalizedBlockNumber}`,
    );
  }

  const readProof =
    await rpc.getReadProof(
      [storageKey],
      certification.hash,
    );

  const proofScaleHex =
    encodeStorageProofScale(
      readProof.proof,
    );

  const evidence = {
    schema_version:
      "materios-b3b-live-storage-proof-v1",
    network: "materios_preprod",
    receipt: {
      receipt_id: receiptId,
      certification,
      storage_key: storageKey,
      storage_value: storageValue,
    },
    certified_block: {
      number: certification.block,
      hash: certification.hash,
      parent_hash: header.parentHash,
      state_root: header.stateRoot,
      extrinsics_root:
        header.extrinsicsRoot,
    },
    finalized_head_observation: {
      number:
        finalizedBlockNumber,
      hash: finalizedHeadHash,
      state_root:
        finalizedHead.stateRoot,
      covers_certified_block:
        true,
    },
    read_proof: {
      at: readProof.at,
      node_count:
        readProof.proof.length,
      proof_nodes:
        readProof.proof,
      proof_scale_hex:
        proofScaleHex,
    },
    transport_checks: {
      block_hash_matches_indexer:
        true,
      block_hash_matches_chain_getBlockHash:
        true,
      finalized_head_covers_certified_block:
        true,
      storage_value_present:
        true,
      storage_key_bytes:
        hexToBytes(storageKey).length,
      storage_value_bytes:
        hexToBytes(storageValue).length,
      proof_node_count:
        readProof.proof.length,
    },
  };

  const evidenceText =
    JSON.stringify(
      evidence,
      null,
      2,
    ) + "\n";

  const evidenceSha256 =
    createHash("sha256")
      .update(evidenceText)
      .digest("hex");

  await writeFile(
    join(
      outputDir,
      "MateriosB3BLiveStorageProof.json",
    ),
    JSON.stringify(
      {
        ...evidence,
        evidence_sha256:
          `0x${evidenceSha256}`,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  await writeFile(
    join(
      outputDir,
      "b3b-state-root.hex",
    ),
    header.stateRoot + "\n",
    "utf8",
  );

  await writeFile(
    join(
      outputDir,
      "b3b-storage-key.hex",
    ),
    storageKey + "\n",
    "utf8",
  );

  await writeFile(
    join(
      outputDir,
      "b3b-storage-value.hex",
    ),
    storageValue + "\n",
    "utf8",
  );

  await writeFile(
    join(
      outputDir,
      "b3b-proof-scale.hex",
    ),
    proofScaleHex + "\n",
    "utf8",
  );

  console.log(
    "proof_nodes:",
    readProof.proof.length,
  );
  console.log(
    "proof_scale_bytes:",
    (proofScaleHex.length - 2) / 2,
  );
  console.log(
    "evidence_sha256:",
    `0x${evidenceSha256}`,
  );
  console.log("capture: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
