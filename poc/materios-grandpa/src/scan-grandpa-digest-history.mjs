import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const GENESIS_HASH = "0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf";
const GENESIS_AUTHORITIES = [
  { public_key: "0xc05b56dab7a8701871a8be75aed6e2ad8c5eb5ff935ddd2b00eeca7299af35b1", weight: "1" },
  { public_key: "0x4558853422164939eca690f21f76a614f7957352e01a448a4986ca3d55d98f23", weight: "1" },
  { public_key: "0x4dc9c8f9bd37df2bb9223458c897b000fe4362958da6eeb6413b93dcfbabe2ba", weight: "1" },
  { public_key: "0x750d4ba2a831a30d419009f2d8bc1ef1e6fc6f673c7a2b5b500a2b7f2a68458e", weight: "1" }
];
const GENESIS_AUTHORITIES_SOURCE =
  "Flux-Point-Studios/materios partnerchain/node/src/chain_spec_preprod.rs@ea86448d4aed4c1fc99d4e355e09ac280a3e4bbe; GRANDPA genesis session initializes set id 0";

function hexBuffer(value, label) {
  if (typeof value !== "string" || !/^0x(?:[0-9a-f]{2})*$/i.test(value)) {
    throw new Error(label + ": invalid even-length hex");
  }
  return Buffer.from(value.slice(2), "hex");
}

function decodeCompact(bytes, offset) {
  if (offset >= bytes.length) throw new Error("SCALE_COMPACT_TRUNCATED");
  const first = bytes[offset];
  const mode = first & 3;
  if (mode === 0) return { value: BigInt(first >> 2), next: offset + 1 };
  if (mode === 1) {
    if (offset + 2 > bytes.length) throw new Error("SCALE_COMPACT_U16_TRUNCATED");
    return {
      value: BigInt((first | (bytes[offset + 1] << 8)) >> 2),
      next: offset + 2
    };
  }
  if (mode === 2) {
    if (offset + 4 > bytes.length) throw new Error("SCALE_COMPACT_U32_TRUNCATED");
    const value =
      BigInt(first >> 2) |
      (BigInt(bytes[offset + 1]) << 6n) |
      (BigInt(bytes[offset + 2]) << 14n) |
      (BigInt(bytes[offset + 3]) << 22n);
    return { value, next: offset + 4 };
  }
  const byteLength = (first >> 2) + 4;
  if (byteLength > 8 || offset + 1 + byteLength > bytes.length) {
    throw new Error("SCALE_COMPACT_BIGINT_TRUNCATED_OR_UNSUPPORTED");
  }
  let value = 0n;
  for (let i = 0; i < byteLength; i++) {
    value |= BigInt(bytes[offset + 1 + i]) << BigInt(8 * i);
  }
  return { value, next: offset + 1 + byteLength };
}

function decodeAuthorityList(bytes, offset) {
  const compact = decodeCompact(bytes, offset);
  const count = Number(compact.value);
  if (!Number.isSafeInteger(count) || count < 0 || count > 1024) {
    throw new Error("GRANDPA_AUTHORITY_COUNT_INVALID");
  }
  let cursor = compact.next;
  const authorities = [];
  for (let i = 0; i < count; i++) {
    if (cursor + 40 > bytes.length) throw new Error("GRANDPA_AUTHORITY_ENTRY_TRUNCATED");
    authorities.push({
      public_key: "0x" + bytes.subarray(cursor, cursor + 32).toString("hex"),
      weight: bytes.readBigUInt64LE(cursor + 32).toString()
    });
    cursor += 40;
  }
  return { authorities, next: cursor };
}

export function decodeAuthorityListHex(value) {
  const bytes = hexBuffer(value, "authority list");
  const decoded = decodeAuthorityList(bytes, 0);
  if (decoded.next !== bytes.length) throw new Error("GRANDPA_AUTHORITY_LIST_TRAILING_BYTES");
  return decoded.authorities;
}

export function decodeU64LeHex(value) {
  const bytes = hexBuffer(value, "u64");
  if (bytes.length !== 8) throw new Error("SCALE_U64_LENGTH_INVALID");
  return bytes.readBigUInt64LE(0);
}

function readU32(bytes, offset, label) {
  if (offset + 4 > bytes.length) throw new Error(label + "_TRUNCATED");
  return bytes.readUInt32LE(offset);
}

function decodeScheduledChange(payload, offset) {
  const list = decodeAuthorityList(payload, offset);
  const delay = readU32(payload, list.next, "GRANDPA_CHANGE_DELAY");
  return { authorities: list.authorities, delay, next: list.next + 4 };
}

export function decodeFrnkDigestLog(log) {
  if (typeof log !== "string" || !/^0x(?:[0-9a-f]{2})+$/i.test(log)) return null;
  const bytes = Buffer.from(log.slice(2), "hex");
  // DigestItem::Consensus = SCALE variant 4; engine id = ASCII "FRNK".
  if (bytes.length < 7 || bytes[0] !== 4 || bytes.subarray(1, 5).toString("ascii") !== "FRNK") {
    return null;
  }
  const outerLength = decodeCompact(bytes, 5);
  const payloadLength = Number(outerLength.value);
  const payloadStart = outerLength.next;
  const payloadEnd = payloadStart + payloadLength;
  if (payloadEnd !== bytes.length) throw new Error("FRNK_DIGEST_OUTER_LENGTH_MISMATCH");
  const payload = bytes.subarray(payloadStart, payloadEnd);
  if (payload.length < 1) throw new Error("FRNK_CONSENSUS_LOG_EMPTY");
  const variant = payload[0];
  let cursor = 1;
  if (variant === 1) {
    const change = decodeScheduledChange(payload, cursor);
    if (change.next !== payload.length) throw new Error("FRNK_SCHEDULED_CHANGE_TRAILING_BYTES");
    return { kind: "ScheduledChange", delay: change.delay, authorities: change.authorities };
  }
  if (variant === 2) {
    const median = readU32(payload, cursor, "FRNK_FORCED_CHANGE_MEDIAN");
    cursor += 4;
    const change = decodeScheduledChange(payload, cursor);
    if (change.next !== payload.length) throw new Error("FRNK_FORCED_CHANGE_TRAILING_BYTES");
    return {
      kind: "ForcedChange",
      median_last_finalized: median,
      delay: change.delay,
      authorities: change.authorities
    };
  }
  if (variant === 3) {
    const authorityIndex = readU32(payload, cursor, "FRNK_ON_DISABLED_INDEX");
    cursor += 4;
    if (cursor !== payload.length) throw new Error("FRNK_ON_DISABLED_TRAILING_BYTES");
    return { kind: "OnDisabled", authority_index: authorityIndex };
  }
  if (variant === 4 || variant === 5) {
    const delay = readU32(payload, cursor, "FRNK_PAUSE_RESUME_DELAY");
    cursor += 4;
    if (cursor !== payload.length) throw new Error("FRNK_PAUSE_RESUME_TRAILING_BYTES");
    return { kind: variant === 4 ? "Pause" : "Resume", delay };
  }
  return { kind: "UnknownConsensusLog", variant, payload_hex: "0x" + payload.toString("hex") };
}

function normalizeHash(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-f]{64}$/i.test(value)) {
    throw new Error(label + ": invalid 32-byte hash");
  }
  return value.toLowerCase();
}

async function rpcBatch(endpoint, method, paramsList) {
  const requests = paramsList.map((params, index) => ({
    jsonrpc: "2.0",
    id: index + 1,
    method,
    params
  }));
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requests),
    signal: AbortSignal.timeout(60000)
  });
  const body = await response.text();
  if (!response.ok) throw new Error("RPC_HTTP_" + response.status + " " + method);
  let decoded;
  try {
    decoded = JSON.parse(body);
  } catch {
    throw new Error("RPC_BATCH_INVALID_JSON " + method);
  }
  if (!Array.isArray(decoded)) throw new Error("RPC_BATCH_UNSUPPORTED_OR_REJECTED " + method);
  const byId = new Map(decoded.map(item => [item.id, item]));
  return requests.map(request => {
    const item = byId.get(request.id);
    if (!item) throw new Error("RPC_BATCH_RESPONSE_ID_MISSING " + method + " id=" + request.id);
    if (item.error) throw new Error("RPC_" + method + "_ERROR " + JSON.stringify(item.error));
    return item.result;
  });
}

function compareAuthorities(a, b) {
  return JSON.stringify(a.map(x => ({
    public_key: x.public_key.toLowerCase(),
    weight: String(x.weight)
  }))) === JSON.stringify(b.map(x => ({
    public_key: x.public_key.toLowerCase(),
    weight: String(x.weight)
  })));
}

function voterSetIdFromEvidence(evidence) {
  const raw = evidence.grandpa_voter_start_logs;
  const text = Array.isArray(raw) ? raw.join("\n") : String(raw ?? "");
  const match = text.match(/Starting new voter with set ID ([0-9]+)/);
  return match ? BigInt(match[1]) : null;
}

async function main() {
  const endpoint = process.env.MATERIOS_SNAPSHOT_RPC || "http://127.0.0.1:9945";
  const evidencePath = process.env.MATERIOS_SNAPSHOT_STATE_EVIDENCE_PATH ||
    resolve("out/MateriosSnapshotStateProbe.json");
  const outputPath = process.env.MATERIOS_GRANDPA_DIGEST_HISTORY_OUT ||
    resolve("out/MateriosGrandpaDigestHistory.json");
  const batchSize = Number(process.env.MATERIOS_HEADER_SCAN_BATCH_SIZE || "256");
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 1024) {
    throw new Error("HEADER_SCAN_BATCH_SIZE_INVALID");
  }

  const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
  if (evidence.status !== "PASS" || evidence.network !== "materios_preprod_v6") {
    throw new Error("SNAPSHOT_STATE_EVIDENCE_NOT_PASS");
  }
  const targetNumber = Number(evidence.target?.block_number);
  const targetHash = normalizeHash(evidence.target?.expected_block_hash, "target hash");
  const genesisHash = normalizeHash(evidence.genesis_hash, "genesis hash");
  if (genesisHash !== GENESIS_HASH) throw new Error("GENESIS_HASH_EVIDENCE_MISMATCH");
  if (!Number.isSafeInteger(targetNumber) || targetNumber < 1) throw new Error("TARGET_BLOCK_NUMBER_INVALID");

  const runtimeSetId = decodeU64LeHex(evidence.historical_state_query?.set_id_hex);
  const runtimeAuthorities = decodeAuthorityListHex(evidence.historical_state_query?.authorities_hex);
  const voterSetId = voterSetIdFromEvidence(evidence);
  const pendingChange = evidence.grandpa_storage_diagnostic?.pending_change_raw_storage ?? null;
  const stalled = evidence.grandpa_storage_diagnostic?.stalled_raw_storage ?? null;

  const genesisProbe = await rpcBatch(endpoint, "chain_getBlockHash", [[0], [1]]);
  if (normalizeHash(genesisProbe[0], "genesis block hash") !== GENESIS_HASH) {
    throw new Error("GENESIS_BLOCK_HASH_MISMATCH");
  }
  const genesisHeaderProbe = await rpcBatch(endpoint, "chain_getHeader", [
    [genesisProbe[0]], [genesisProbe[1]]
  ]);
  if (!genesisHeaderProbe[0] || !genesisHeaderProbe[1]) {
    throw new Error("GENESIS_OR_BLOCK_ONE_HEADER_UNAVAILABLE");
  }

  const { hashMateriosHeader } = await import("../../materios-smoldot/target-ancestry-bridge.mjs");
  const hashDigest = createHash("sha256");
  const frnkEvents = [];
  let headerCount = 0;
  let scheduledChangeCount = 0;
  let forcedChangeCount = 0;
  let onDisabledCount = 0;
  let pauseCount = 0;
  let resumeCount = 0;
  let unknownFrnkCount = 0;
  let previousHash = null;
  let latestAuthorityChange = null;
  let targetHasFrnkDigest = false;
  let targetChangeEvents = [];
  const startedAt = Date.now();

  console.log("Starting genesis-anchored raw header scan 0.." + targetNumber +
    " using batch size " + batchSize);

  for (let start = 0; start <= targetNumber; start += batchSize) {
    const end = Math.min(targetNumber, start + batchSize - 1);
    const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const hashes = await rpcBatch(endpoint, "chain_getBlockHash", numbers.map(n => [n]));
    const headers = await rpcBatch(endpoint, "chain_getHeader", hashes.map(h => [h]));

    for (let i = 0; i < numbers.length; i++) {
      const blockNumber = numbers[i];
      const blockHash = normalizeHash(hashes[i], "block hash " + blockNumber);
      const header = headers[i];
      if (!header || typeof header !== "object") throw new Error("HEADER_UNAVAILABLE block=" + blockNumber);
      const headerNumber = Number(BigInt(header.number));
      if (headerNumber !== blockNumber) {
        throw new Error("HEADER_NUMBER_MISMATCH block=" + blockNumber + " header=" + headerNumber);
      }
      const computedHash = normalizeHash(hashMateriosHeader(header), "computed header hash");
      if (computedHash !== blockHash) {
        throw new Error("HEADER_HASH_MISMATCH block=" + blockNumber +
          " expected=" + blockHash + " computed=" + computedHash);
      }
      const parentHash = normalizeHash(header.parentHash, "parent hash " + blockNumber);
      if (blockNumber === 0) {
        if (blockHash !== GENESIS_HASH) throw new Error("GENESIS_HEADER_HASH_MISMATCH");
      } else if (parentHash !== previousHash) {
        throw new Error("HEADER_PARENT_LINK_MISMATCH block=" + blockNumber +
          " expected_parent=" + previousHash + " observed_parent=" + parentHash);
      }

      const digestLogs = Array.isArray(header.digest?.logs) ? header.digest.logs : [];
      const decodedFrnk = [];
      for (let logIndex = 0; logIndex < digestLogs.length; logIndex++) {
        const event = decodeFrnkDigestLog(digestLogs[logIndex]);
        if (!event) continue;
        const record = {
          block_number: blockNumber,
          block_hash: blockHash,
          log_index: logIndex,
          raw_log: digestLogs[logIndex],
          ...event
        };
        decodedFrnk.push(record);
        frnkEvents.push(record);
        if (event.kind === "ScheduledChange") {
          scheduledChangeCount++;
          latestAuthorityChange = record;
        } else if (event.kind === "ForcedChange") {
          forcedChangeCount++;
          latestAuthorityChange = record;
        } else if (event.kind === "OnDisabled") {
          onDisabledCount++;
        } else if (event.kind === "Pause") {
          pauseCount++;
        } else if (event.kind === "Resume") {
          resumeCount++;
        } else {
          unknownFrnkCount++;
        }
      }
      if (blockNumber === targetNumber) {
        targetHasFrnkDigest = decodedFrnk.length > 0;
        targetChangeEvents = decodedFrnk.filter(e =>
          e.kind === "ScheduledChange" || e.kind === "ForcedChange"
        );
        if (blockHash !== targetHash) throw new Error("TARGET_HEADER_HASH_MISMATCH");
      }

      hashDigest.update(Buffer.from(
        blockNumber + "|" + blockHash + "|" + parentHash + "|" +
        normalizeHash(header.stateRoot, "state root") + "|" +
        normalizeHash(header.extrinsicsRoot, "extrinsics root") + "|" +
        digestLogs.join(",") + "\n",
        "utf8"
      ));
      previousHash = blockHash;
      headerCount++;
    }

    if (end % 25000 < batchSize || end === targetNumber) {
      console.log("Header scan " + headerCount + "/" + (targetNumber + 1) +
        "; FRNK logs=" + frnkEvents.length +
        "; set changes=" + (scheduledChangeCount + forcedChangeCount));
    }
  }

  const replayedSetId = BigInt(scheduledChangeCount + forcedChangeCount);
  const replayedAuthorities = latestAuthorityChange?.authorities || GENESIS_AUTHORITIES;
  const signingBoundaryEvents = frnkEvents.filter(event =>
    event.kind === "ScheduledChange" &&
    event.block_number + event.delay === targetNumber
  );
  const targetSigningSetIdCandidate = replayedSetId - BigInt(signingBoundaryEvents.length);
  const authorityMatchesRuntime = compareAuthorities(replayedAuthorities, runtimeAuthorities);

  const result = {
    schema_version: "materios-grandpa-digest-history-v1",
    status: "PASS",
    classification: "GENESIS_ANCHORED_HEADER_CHAIN_AND_FRNK_DIGEST_SCAN_PASS",
    chain_id: "materios_preprod_v6",
    genesis_hash: GENESIS_HASH,
    target: {
      block_number: targetNumber,
      block_hash: targetHash,
      runtime_set_id: runtimeSetId.toString(),
      voter_set_id_from_snapshot_aux: voterSetId === null ? null : voterSetId.toString(),
      pending_change: pendingChange,
      stalled
    },
    scan: {
      start_block: 0,
      end_block: targetNumber,
      header_count: headerCount,
      expected_header_count: targetNumber + 1,
      batch_size: batchSize,
      all_header_hashes_verified: true,
      all_parent_links_verified: true,
      genesis_hash_verified: true,
      target_hash_verified: previousHash === targetHash,
      header_chain_sha256: "0x" + hashDigest.digest("hex"),
      elapsed_ms: Date.now() - startedAt
    },
    genesis_authorities: GENESIS_AUTHORITIES,
    genesis_authorities_source: GENESIS_AUTHORITIES_SOURCE,
    digest_history: {
      frnk_consensus_log_count: frnkEvents.length,
      scheduled_change_count: scheduledChangeCount,
      forced_change_count: forcedChangeCount,
      on_disabled_count: onDisabledCount,
      pause_count: pauseCount,
      resume_count: resumeCount,
      unknown_frnk_count: unknownFrnkCount,
      replayed_set_id_from_change_logs: replayedSetId.toString(),
      replayed_set_id_matches_runtime: replayedSetId === runtimeSetId,
      replayed_set_id_matches_snapshot_voter: voterSetId === null ? null : replayedSetId === voterSetId,
      replayed_authorities: replayedAuthorities,
      replayed_authorities_match_runtime: authorityMatchesRuntime,
      target_has_frnk_digest: targetHasFrnkDigest,
      target_change_event_count: targetChangeEvents.length,
      scheduled_change_enactment_boundary_at_target: signingBoundaryEvents.length > 0,
      candidate_signing_set_id_from_digest_replay: targetSigningSetIdCandidate.toString(),
      last_authority_change: latestAuthorityChange,
      events: frnkEvents
    },
    interpretation: {
      runtime_set_id: runtimeSetId.toString(),
      snapshot_voter_set_id: voterSetId === null ? null : voterSetId.toString(),
      digest_replay_set_id: replayedSetId.toString(),
      authority_list_matches_runtime: authorityMatchesRuntime,
      note: "Header hash/parent continuity and FRNK digest replay are verified against the pinned genesis and exact target hash. This does not by itself prove finality; the captured GRANDPA justification must verify under the replayed authority set and the authority transition chain must be independently accepted."
    },
    trust_scope: "Read-only local snapshot header scan. Every header hash and parent link is recomputed from genesis to the exact proof target. Digest replay is evidence for authority-set reconstruction, not finality by itself."
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
  console.log("Digest scan complete: replayed set ID " + replayedSetId +
    "; runtime set ID " + runtimeSetId +
    "; snapshot voter set ID " + (voterSetId === null ? "unknown" : voterSetId));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const outputPath = process.env.MATERIOS_GRANDPA_DIGEST_HISTORY_OUT ||
      resolve("out/MateriosGrandpaDigestHistory.json");
    const result = {
      schema_version: "materios-grandpa-digest-history-v1",
      status: "FAIL",
      classification: "GENESIS_ANCHORED_HEADER_SCAN_FAILED",
      error: error instanceof Error ? error.message : String(error),
      trust_scope: "No finality or authority-set provenance claim."
    };
    try {
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
    } catch {}
    console.error("GRANDPA digest history scan failed:", error);
    process.exitCode = 1;
  });
}
