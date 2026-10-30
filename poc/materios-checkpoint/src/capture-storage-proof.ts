import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";

import { blake2b } from "@noble/hashes/blake2.js";
import { MateriosRpc } from "./rpc.js";
import { bytesToHex, hexToBytes } from "./scale.js";
import {
  decodeAttestationThresholdScale,
  decodeCommitteeMembersScale,
  verifyIndexedSignerSetAgainstCommittee,
} from "./attestationEvidence.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const RPC =
  process.env.MATERIOS_RPC ??
  "https://materios.fluxpointstudios.com/preprod-rpc";
const INDEXER =
  process.env.MATERIOS_EVENTS ??
  "https://materios.fluxpointstudios.com/preprod-events";

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

function plainStorageKey(storageName: string): string {
  return bytesToHex(
    concat([
      twox128("OrinqReceipts"),
      twox128(storageName),
    ]),
  );
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

type CertificationSigner = {
  attester: string;
  rewardBase: string;
};

type IndexedCertification = {
  block: number;
  hash: string;
  certHash: string;
  signerCount: number;
  signers: CertificationSigner[];
  source: "materios-preprod-events/receipt-attestors";
};

async function getCertification(
  receiptId: string,
): Promise<IndexedCertification> {
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
      if (
        typeof body.receipt_id !== "string" ||
        body.receipt_id.toLowerCase() !== receiptId.toLowerCase()
      ) {
        throw new Error("indexer receipt_id does not match requested receipt");
      }

      const block = body.certified_at_block;
      const hash = body.certified_at_hash;
      const certHash = body.cert_hash;
      const signerCount = body.signer_count;
      const rawSigners = body.signers;

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
        !/^0x[0-9a-fA-F]{64}$/.test(certHash)
      ) {
        throw new Error("indexer cert_hash is invalid");
      }
      if (
        typeof signerCount !== "number" ||
        !Number.isSafeInteger(signerCount) ||
        signerCount <= 0
      ) {
        throw new Error("indexer signer_count must be a positive integer");
      }
      if (!Array.isArray(rawSigners)) {
        throw new Error("indexer signers must be an array");
      }

      const signers: CertificationSigner[] = rawSigners.map((entry, index) => {
        if (typeof entry !== "object" || entry === null) {
          throw new Error(`indexer signers[${index}] is invalid`);
        }
        const signer = entry as Record<string, unknown>;
        if (
          typeof signer.attester !== "string" ||
          !/^[1-9A-HJ-NP-Za-km-z]{40,60}$/.test(signer.attester)
        ) {
          throw new Error(`indexer signers[${index}].attester is invalid`);
        }
        if (
          typeof signer.reward_base !== "string" ||
          !/^[0-9]+$/.test(signer.reward_base)
        ) {
          throw new Error(`indexer signers[${index}].reward_base is invalid`);
        }
        return {
          attester: signer.attester,
          rewardBase: signer.reward_base,
        };
      });

      const uniqueAttesters = new Set(signers.map((signer) => signer.attester));
      if (uniqueAttesters.size !== signers.length) {
        throw new Error("indexer signers contains duplicate attesters");
      }
      if (signers.length !== signerCount) {
        throw new Error(
          `indexer signer_count ${signerCount} does not match signers array length ${signers.length}`,
        );
      }

      return {
        block,
        hash: hash.toLowerCase(),
        certHash: certHash.toLowerCase(),
        signerCount,
        signers,
        source: "materios-preprod-events/receipt-attestors",
      };
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

function parsedAvailabilityCertHashIsNonZero(
  storageValue: string,
): boolean {
  const parsed = parseReceiptRecord(storageValue);
  return (
    parsed.availabilityCertHash !==
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
}

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

function isHistoricalStateUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UnknownBlock|state already discarded|historical state.*(?:pruned|discarded|unavailable)|state.*(?:pruned|discarded)/i.test(message);
}

async function discoverRecentCertifiedReceipt(
  rpc: MateriosRpc,
): Promise<{
  receiptId: string;
  certification: IndexedCertification;
  storageKey: string;
  storageValue: string;
  committeeMembersValue: string;
  attestationThresholdValue: string;
}> {
  const finalizedHeadHash = await rpc.getFinalizedHead();
  const finalizedHead = await rpc.getHeader(finalizedHeadHash);
  const finalizedNumber = BigInt(finalizedHead.number);
  const prefix = bytesToHex(
    concat([twox128("OrinqReceipts"), twox128("Receipts")]),
  );

  const rawKeys: string[] = [];
  let startKey: string | null = null;

  for (;;) {
    const page = await rpc.call<unknown>("state_getKeysPaged", [
      prefix,
      1000,
      startKey,
      finalizedHeadHash,
    ]);
    if (
      !Array.isArray(page) ||
      !page.every(
        (key) =>
          typeof key === "string" && /^0x[0-9a-fA-F]+$/.test(key),
      )
    ) {
      throw new Error("state_getKeysPaged returned invalid receipt keys");
    }
    rawKeys.push(...(page as string[]));
    if (page.length < 1000) break;

    const nextStart = page[page.length - 1] as string;
    if (nextStart === startKey) {
      throw new Error("state_getKeysPaged pagination made no progress");
    }
    startKey = nextStart;
  }

  const uniqueKeys = [...new Set(rawKeys)];
  console.log("finalized_head:", finalizedHeadHash);
  console.log("finalized_block:", finalizedNumber.toString());
  console.log("receipt_keys:", uniqueKeys.length);

  const candidates: ReceiptCandidate[] = [];
  for (let start = 0; start < uniqueKeys.length; start += 500) {
    const batch = uniqueKeys.slice(start, start + 500);
    const response = await rpc.call<unknown>("state_queryStorageAt", [
      batch,
      finalizedHeadHash,
    ]);
    if (
      !Array.isArray(response) ||
      response.length !== 1 ||
      typeof response[0] !== "object" ||
      response[0] === null ||
      !Array.isArray((response[0] as Record<string, unknown>).changes)
    ) {
      throw new Error("state_queryStorageAt returned invalid receipt storage data");
    }

    const changes =
      (response[0] as Record<string, unknown>).changes as unknown[];
    for (const change of changes) {
      if (
        !Array.isArray(change) ||
        change.length !== 2 ||
        typeof change[0] !== "string" ||
        typeof change[1] !== "string"
      ) continue;

      const storageKey = change[0];
      const storageValue = change[1];
      if (
        !/^0x[0-9a-fA-F]{160}$/.test(storageKey) ||
        !/^0x[0-9a-fA-F]+$/.test(storageValue)
      ) continue;

      try {
        const parsed = parseReceiptRecord(storageValue);
        if (
          parsed.availabilityCertHash ===
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        ) continue;

        candidates.push({
          receiptId: bytesToHex(hexToBytes(storageKey).slice(-32)),
          storageKey,
          createdAtMillis: parsed.createdAtMillis,
          availabilityCertHash: parsed.availabilityCertHash,
        });
      } catch {
        // Ignore records that cannot be strictly decoded.
      }
    }
    console.log(
      "storage page:",
      Math.min(start + 500, uniqueKeys.length),
      "/",
      uniqueKeys.length,
    );
  }

  candidates.sort((a, b) =>
    a.createdAtMillis === b.createdAtMillis
      ? a.receiptId.localeCompare(b.receiptId)
      : a.createdAtMillis > b.createdAtMillis
        ? -1
        : 1,
  );
  console.log("certified receipt candidates:", candidates.length);

  const configuredLimit = Number(
    process.env.MATERIOS_B3B_MAX_DISCOVERY_CANDIDATES ?? "25",
  );
  if (
    !Number.isSafeInteger(configuredLimit) ||
    configuredLimit < 1 ||
    configuredLimit > 100
  ) {
    throw new Error(
      "MATERIOS_B3B_MAX_DISCOVERY_CANDIDATES must be an integer from 1 to 100",
    );
  }

  const committeeMembersKey = plainStorageKey("CommitteeMembers");
  const attestationThresholdKey = plainStorageKey("AttestationThreshold");
  const attempts = candidates.slice(0, configuredLimit);
  let prunedStateCandidates = 0;
  let missingIndexerCandidates = 0;

  for (const [index, candidate] of attempts.entries()) {
    console.log(
      `historical-state availability probe ${index + 1}/${attempts.length}:`,
      candidate.receiptId,
    );

    let certification: IndexedCertification;
    try {
      certification = await getCertification(candidate.receiptId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/did not materialize within retry window|not certified/i.test(message)) {
        missingIndexerCandidates += 1;
        console.log("skip: certification indexer has no complete record");
        continue;
      }
      throw error;
    }

    if (
      certification.certHash.toLowerCase() !==
      candidate.availabilityCertHash.toLowerCase()
    ) {
      throw new Error(
        `events-indexer cert_hash does not match current ReceiptRecord for ${candidate.receiptId}`,
      );
    }
    if (BigInt(certification.block) > finalizedNumber) {
      throw new Error(
        `indexer certification block ${certification.block} is above finalized head ${finalizedNumber}`,
      );
    }

    const hashAtHeight = await rpc.call<unknown>(
      "chain_getBlockHash",
      [certification.block],
    );
    if (
      typeof hashAtHeight !== "string" ||
      hashAtHeight.toLowerCase() !== certification.hash.toLowerCase()
    ) {
      throw new Error(
        `indexer certification hash does not match chain_getBlockHash at block ${certification.block}`,
      );
    }

    const header = await rpc.getHeader(certification.hash);
    if (BigInt(header.number) !== BigInt(certification.block)) {
      throw new Error(
        `certification header number mismatch at block ${certification.block}`,
      );
    }

    try {
      const [
        historicalReceiptValue,
        committeeMembersValue,
        attestationThresholdValue,
      ] = await Promise.all([
        rpc.getStorage(candidate.storageKey, certification.hash),
        rpc.getStorage(committeeMembersKey, certification.hash),
        rpc.getStorage(attestationThresholdKey, certification.hash),
      ]);

      if (
        historicalReceiptValue === null ||
        committeeMembersValue === null ||
        attestationThresholdValue === null
      ) {
        console.log("skip: one or more certification-block storage values are absent");
        prunedStateCandidates += 1;
        continue;
      }

      const historicalRecord = parseReceiptRecord(historicalReceiptValue);
      if (
        historicalRecord.availabilityCertHash.toLowerCase() !==
        certification.certHash.toLowerCase()
      ) {
        throw new Error(
          "historical ReceiptRecord cert_hash does not match the events indexer",
        );
      }

      // Probe the native proof provider before selecting this receipt. A successful
      // state_getStorage alone is insufficient if historical proof material was pruned.
      const historicalProof = await rpc.getReadProof(
        [
          candidate.storageKey,
          committeeMembersKey,
          attestationThresholdKey,
        ],
        certification.hash,
      );
      if (historicalProof.at.toLowerCase() !== certification.hash.toLowerCase()) {
        throw new Error("historical read proof is not bound to the certification block");
      }

      console.log("selected_receipt:", candidate.receiptId);
      console.log("certified_block:", certification.block);
      console.log("certified_hash:", certification.hash);
      console.log("preflight_proof_nodes:", historicalProof.proof.length);

      return {
        receiptId: candidate.receiptId,
        certification,
        storageKey: candidate.storageKey,
        storageValue: historicalReceiptValue,
        committeeMembersValue,
        attestationThresholdValue,
      };
    } catch (error) {
      if (isHistoricalStateUnavailable(error)) {
        prunedStateCandidates += 1;
        console.log(
          `skip: historical state/proof pruned at certification block ${certification.block}`,
        );
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `no certified receipt with retrievable historical state/proof found among ${attempts.length} newest candidates (indexer-missing=${missingIndexerCandidates}, pruned-or-absent=${prunedStateCandidates}); an archive-capable Materios RPC or a newer certified receipt is required`,
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

  const envReceiptId =
    process.env.MATERIOS_RECEIPT_ID;
  const envCertifiedBlock =
    process.env.MATERIOS_CERTIFIED_BLOCK;
  const envCertHash =
    process.env.MATERIOS_CERT_HASH;

  let receiptId: string;
  let certification: IndexedCertification;
  let storageKey: string;
  let storageValue: string | null = null;
  let discoveredCommitteeMembersValue: string | null = null;
  let discoveredAttestationThresholdValue: string | null = null;

  if (
    envReceiptId &&
    envCertifiedBlock &&
    envCertHash
  ) {
    const block = Number(BigInt(envCertifiedBlock));

    if (
      !Number.isSafeInteger(block) ||
      block < 0 ||
      !/^0x[0-9a-fA-F]{64}$/.test(envReceiptId) ||
      !/^0x[0-9a-fA-F]{64}$/.test(envCertHash)
    ) {
      throw new Error("invalid chain-event certification inputs");
    }

    receiptId = envReceiptId.toLowerCase();
    certification = await getCertification(receiptId);

    if (
      certification.block !== block ||
      certification.certHash !== envCertHash.toLowerCase()
    ) {
      throw new Error(
        "explicit certification inputs do not match Materios events indexer",
      );
    }
    storageKey = receiptStorageKey(receiptId);
  } else {
    console.log(
      "Discovering a recent certified receipt from finalized state...",
    );

    const discovered = await discoverRecentCertifiedReceipt(rpc);
    receiptId = discovered.receiptId;
    certification = discovered.certification;
    storageKey = discovered.storageKey;
    storageValue = discovered.storageValue;
    discoveredCommitteeMembersValue = discovered.committeeMembersValue;
    discoveredAttestationThresholdValue = discovered.attestationThresholdValue;
  }

  const rpcHashAtCertificationBlock = await rpc.call<unknown>(
    "chain_getBlockHash",
    [certification.block],
  );
  if (
    typeof rpcHashAtCertificationBlock !== "string" ||
    rpcHashAtCertificationBlock.toLowerCase() !== certification.hash
  ) {
    throw new Error(
      "events-indexer certified_at_hash does not match chain_getBlockHash at certified_at_block",
    );
  }

  const header = await rpc.getHeader(certification.hash);
  if (BigInt(header.number) !== BigInt(certification.block)) {
    throw new Error(
      "certified_at_hash header number does not match events-indexer certified_at_block",
    );
  }

  const finalizedHeadHash = await rpc.getFinalizedHead();
  const finalizedHead = await rpc.getHeader(finalizedHeadHash);
  const finalizedBlockNumber = Number(BigInt(finalizedHead.number));

  if (
    !Number.isSafeInteger(finalizedBlockNumber) ||
    finalizedBlockNumber < certification.block
  ) {
    throw new Error(
      `certified block ${certification.block} is ahead of finalized head ${finalizedBlockNumber}`,
    );
  }

  storageValue ??=
    (await rpc.getStorage(storageKey, certification.hash)) ?? "";
  if (!storageValue) {
    throw new Error(
      "receipt storage is absent at the indexed certification block",
    );
  }

  const parsed = parseReceiptRecord(storageValue);
  if (
    parsed.availabilityCertHash.toLowerCase() !==
    certification.certHash.toLowerCase()
  ) {
    throw new Error(
      "events-indexer cert_hash does not match ReceiptRecord availability_cert_hash at certified block",
    );
  }

  // Read the exact on-chain committee and threshold at the certification block.
  // These are block-end storage values: same-block event ordering is not
  // independently reconstructed here.
  const committeeMembersKey = plainStorageKey("CommitteeMembers");
  const attestationThresholdKey = plainStorageKey("AttestationThreshold");
  const [committeeMembersValue, attestationThresholdValue] = await Promise.all([
    discoveredCommitteeMembersValue !== null
      ? Promise.resolve(discoveredCommitteeMembersValue)
      : rpc.getStorage(committeeMembersKey, certification.hash),
    discoveredAttestationThresholdValue !== null
      ? Promise.resolve(discoveredAttestationThresholdValue)
      : rpc.getStorage(attestationThresholdKey, certification.hash),
  ]);
  if (committeeMembersValue === null) {
    throw new Error("CommitteeMembers storage is absent at certification block");
  }
  if (attestationThresholdValue === null) {
    throw new Error("AttestationThreshold storage is absent at certification block");
  }

  const committeeMembers = decodeCommitteeMembersScale(committeeMembersValue);
  const attestationThreshold =
    decodeAttestationThresholdScale(attestationThresholdValue);
  const verifiedAttesters = verifyIndexedSignerSetAgainstCommittee(
    certification.signers.map((signer) => signer.attester),
    committeeMembers,
    attestationThreshold,
  );

  const committeeReadProof = await rpc.getReadProof(
    [committeeMembersKey, attestationThresholdKey],
    certification.hash,
  );
  const committeeProofScaleHex = encodeStorageProofScale(
    committeeReadProof.proof,
  );

  console.log("indexed AvailabilityCertified evidence:", receiptId);
  console.log("on-chain committee size:", committeeMembers.length);
  console.log("on-chain attestation threshold:", attestationThreshold);
  console.log("indexer signers present in on-chain committee:", verifiedAttesters.length);
  console.log("indexer signer count meets on-chain threshold:", true);
  console.log("certified_block:", certification.block);
  console.log("certified_hash:", certification.hash);
  console.log("cert_hash:", certification.certHash);
  console.log("indexer_signer_count:", certification.signerCount);
  console.log(
    "indexer_signers:",
    certification.signers.map((signer) => signer.attester).join(","),
  );
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
    certification_indexer: {
      source: certification.source,
      certified: true,
      signer_count: certification.signerCount,
      signers: certification.signers.map((signer) => ({
        ...signer,
        account_id: verifiedAttesters.find(
          (entry) => entry.address === signer.attester,
        )?.accountId ?? null,
      })),
      signer_count_matches_signer_list:
        certification.signerCount === certification.signers.length,
      signatures_independently_verified: false,
      quorum_threshold_independently_verified: false,
      signer_list_independently_compared_to_on_chain_committee: true,
    },
    on_chain_committee_snapshot: {
      at_block: certification.block,
      at_hash: certification.hash,
      state_root: header.stateRoot,
      committee_members_storage_key: committeeMembersKey,
      committee_members_storage_value: committeeMembersValue,
      committee_member_count: committeeMembers.length,
      committee_members_account_ids: committeeMembers,
      attestation_threshold_storage_key: attestationThresholdKey,
      attestation_threshold_storage_value: attestationThresholdValue,
      attestation_threshold: attestationThreshold,
      signer_membership_matches: true,
      signer_count_meets_threshold:
        verifiedAttesters.length >= attestationThreshold,
      snapshot_semantics: "BLOCK_END_STATE",
      same_block_committee_update_order_independently_checked: false,
      attestation_recorded_events_independently_verified: false,
      signatures_independently_verified: false,
    },
    committee_read_proof: {
      at: committeeReadProof.at,
      node_count: committeeReadProof.proof.length,
      proof_nodes: committeeReadProof.proof,
      proof_scale_hex: committeeProofScaleHex,
    },
    transport_checks: {
      finalized_head_covers_observed_block:
        true,
      certified_at_hash_matches_chain_hash_at_height:
        true,
      certified_at_hash_header_number_matches_indexer_block:
        true,
      indexer_cert_hash_matches_authenticated_receipt_storage:
        true,
      indexer_signer_count_matches_signer_list:
        certification.signerCount === certification.signers.length,
      committee_members_and_threshold_read_at_certification_block:
        true,
      indexer_signers_are_members_of_on_chain_committee_snapshot:
        true,
      indexer_signer_count_meets_on_chain_threshold:
        verifiedAttesters.length >= attestationThreshold,
      committee_snapshot_proof_at_matches_certification_block:
        committeeReadProof.at.toLowerCase() ===
        certification.hash.toLowerCase(),
      storage_value_present:
        true,
      storage_key_derived_from_receipt_id:
        true,
      receipt_state_has_nonzero_availability_cert_hash:
        parsedAvailabilityCertHashIsNonZero(storageValue),
      proof_at_matches_observed_block_hash:
        readProof.at.toLowerCase() ===
        certification.hash.toLowerCase(),
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

  await writeFile(
    join(outputDir, "b3b-committee-members-key.hex"),
    committeeMembersKey + "\n",
    "utf8",
  );
  await writeFile(
    join(outputDir, "b3b-committee-members-value.hex"),
    committeeMembersValue + "\n",
    "utf8",
  );
  await writeFile(
    join(outputDir, "b3b-attestation-threshold-key.hex"),
    attestationThresholdKey + "\n",
    "utf8",
  );
  await writeFile(
    join(outputDir, "b3b-attestation-threshold-value.hex"),
    attestationThresholdValue + "\n",
    "utf8",
  );
  await writeFile(
    join(outputDir, "b3b-committee-proof-scale.hex"),
    committeeProofScaleHex + "\n",
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
