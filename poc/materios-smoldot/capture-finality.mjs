#!/usr/bin/env node
/**
 * Read-only Materios P2P proof-source probe using a pinned Smoldot light client.
 *
 * This is acquisition/transport evidence only. It does not close B3-A or
 * verify IMMORTAL's authenticated authority-transition boundary.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { blake2b } from "../materios-checkpoint/node_modules/@noble/hashes/blake2.js";

const DEFAULTS = {
  chainSpecUrl: "https://materios.fluxpointstudios.com/releases/chain-spec-v6-raw.json",
  chainSpecSha256: "77877aa63358af6cf0c78a3b106ac2d295da575973bec1c3ff51d53b3fa65aaa",
  chainId: "materios_preprod_v6",
  genesisHash: "0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf",
  bootNode: "/dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM",
  targetNumber: 1856408,
  targetHash: "0x7db6da35478aa3b56cba56bfbff4feeab7287f2d580df03548528d894cfdf44e",
  waitSeconds: 360,
};

const config = {
  chainSpecUrl: process.env.MATERIOS_CHAIN_SPEC_URL || DEFAULTS.chainSpecUrl,
  chainSpecSha256: (process.env.MATERIOS_CHAIN_SPEC_SHA256 || DEFAULTS.chainSpecSha256).toLowerCase(),
  chainId: process.env.MATERIOS_CHAIN_ID || DEFAULTS.chainId,
  genesisHash: (process.env.MATERIOS_GENESIS_HASH || DEFAULTS.genesisHash).toLowerCase(),
  bootNode: process.env.MATERIOS_BOOTNODE || DEFAULTS.bootNode,
  targetNumber: Number(process.env.MATERIOS_TARGET_BLOCK_NUMBER || DEFAULTS.targetNumber),
  targetHash: (process.env.MATERIOS_TARGET_BLOCK_HASH || DEFAULTS.targetHash).toLowerCase(),
  waitSeconds: Number(process.env.SMOLDOT_MAX_WAIT_SECONDS || DEFAULTS.waitSeconds),
  entry: process.env.SMOLDOT_ENTRY,
  out: process.env.SMOLDOT_EVIDENCE_OUT || path.resolve("poc/materios-smoldot/out/smoldot-finality-capture.json"),
  smoldotCommit: process.env.SMOLDOT_COMMIT || "c898452405be712c6037ad956464b3fe9f9907f4",
};

const startedAt = new Date().toISOString();
const logTail = [];
function log(message) {
  const line = new Date().toISOString() + " " + message;
  console.log(line);
  logTail.push(line);
  if (logTail.length > 200) logTail.shift();
}
function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}
function fromHex(value, field) {
  if (typeof value !== "string" || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) {
    throw new Error(field + ": expected even-length 0x-prefixed hex");
  }
  return Uint8Array.from(Buffer.from(value.slice(2), "hex"));
}
function toHex(bytes) {
  return "0x" + Buffer.from(bytes).toString("hex");
}
function encodeCompactU32(n) {
  const value = BigInt(n);
  if (value < 0n || value > 0xffffffffn) throw new Error("header.number outside u32");
  if (value < 64n) return Uint8Array.of(Number(value << 2n));
  if (value < 16384n) {
    const v = (value << 2n) | 1n;
    return Uint8Array.of(Number(v & 255n), Number((v >> 8n) & 255n));
  }
  if (value < 1073741824n) {
    const v = (value << 2n) | 2n;
    return Uint8Array.of(
      Number(v & 255n), Number((v >> 8n) & 255n),
      Number((v >> 16n) & 255n), Number((v >> 24n) & 255n)
    );
  }
  throw new Error("header.number requires unsupported big-integer compact encoding");
}
function concat(parts) {
  const length = parts.reduce((n, part) => n + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
function encodeHeaderFromJson(header) {
  if (!header || typeof header !== "object") throw new Error("header missing");
  const numberHex = header.number;
  if (typeof numberHex !== "string" || !/^0x[0-9a-f]+$/i.test(numberHex)) {
    throw new Error("header.number is not a hex string");
  }
  const number = BigInt(numberHex);
  if (!Array.isArray(header.digest?.logs)) throw new Error("header.digest.logs missing");
  const logs = header.digest.logs.map((log, index) => fromHex(log, "digest.logs[" + index + "]"));
  return concat([
    fromHex(header.parentHash, "header.parentHash"),
    encodeCompactU32(number),
    fromHex(header.stateRoot, "header.stateRoot"),
    fromHex(header.extrinsicsRoot, "header.extrinsicsRoot"),
    encodeCompactU32(logs.length),
    ...logs,
  ]);
}
function parseJustificationTarget(encodedHex) {
  const bytes = fromHex(encodedHex, "GRANDPA justification");
  if (bytes.length < 44) throw new Error("GRANDPA justification is too short");
  let round = 0n;
  for (let i = 0; i < 8; i++) round |= BigInt(bytes[i]) << BigInt(8 * i);
  const targetHash = toHex(bytes.slice(8, 40));
  const targetNumber = (
    bytes[40] |
    (bytes[41] << 8) |
    (bytes[42] << 16) |
    (bytes[43] << 24)
  ) >>> 0;
  return { round: round.toString(), targetHash, targetNumber, bytes: bytes.length };
}
function normalizeEngineId(engine) {
  if (typeof engine === "string") {
    if (/^0x[0-9a-f]{8}$/i.test(engine)) return engine.toLowerCase();
    if (engine === "FRNK") return "0x46524e4b";
  }
  if (Array.isArray(engine) && engine.length === 4 && engine.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
    return toHex(Uint8Array.from(engine));
  }
  return null;
}
function parseHeaderNumber(header) {
  if (typeof header?.number !== "string" || !/^0x[0-9a-f]+$/i.test(header.number)) {
    throw new Error("header.number unavailable");
  }
  return Number(BigInt(header.number));
}

async function downloadChainSpec() {
  const response = await fetch(config.chainSpecUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error("chain-spec HTTP " + response.status);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = sha256(bytes);
  if (digest !== config.chainSpecSha256) {
    throw new Error("CHAIN_SPEC_DIGEST_MISMATCH expected=" + config.chainSpecSha256 + " observed=" + digest);
  }
  const original = JSON.parse(Buffer.from(bytes).toString("utf8"));
  if (original.id !== config.chainId) throw new Error("CHAIN_ID_MISMATCH: " + String(original.id));
  if (!original.genesis?.raw?.top || typeof original.genesis.raw.top !== "object") {
    throw new Error("chain spec is not a raw genesis chain spec");
  }
  // Add the documented public P2P bootnode in-memory only. Never rewrite genesis storage.
  const effective = { ...original, bootNodes: [config.bootNode] };
  return {
    originalBytes: bytes,
    originalDigest: digest,
    original,
    effectiveText: JSON.stringify(effective),
    effectiveDigest: sha256(Buffer.from(JSON.stringify(effective), "utf8")),
  };
}

let client;
let chain;
let alive = true;
let rpcId = 0;
const pending = new Map();
const captured = [];
const candidateErrors = [];
let proofSubscriptionId = null;
let finalizedSubscriptionId = null;
let proofSignalResolvers = [];
let lastFinalizedHead = null;
let lastHealth = null;
let targetProbe = {
  status: "NOT_ATTEMPTED",
  blockHash: config.targetHash,
  blockNumberExpected: config.targetNumber,
  responseShape: null,
  frnkJustificationFound: false,
  headerHashVerified: false,
  reason: null,
};

function signalProof() {
  const waiting = proofSignalResolvers;
  proofSignalResolvers = [];
  for (const resolve of waiting) resolve();
}
function waitForProofSignal(ms) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      proofSignalResolvers = proofSignalResolvers.filter(fn => fn !== onProof);
      resolve();
    }, ms);
    function onProof() {
      clearTimeout(timer);
      resolve();
    }
    proofSignalResolvers.push(onProof);
  });
}

async function processJustification(source, encodedHex, suppliedEngineId = "0x46524e4b") {
  try {
    const engineId = normalizeEngineId(suppliedEngineId);
    if (engineId && engineId !== "0x46524e4b") {
      log("ignoring non-GRANDPA justification engine " + engineId);
      return;
    }
    const target = parseJustificationTarget(encodedHex);
    const header = await rpc("chain_getHeader", [target.targetHash], 15000);
    if (!header || typeof header !== "object") throw new Error("target header unavailable");
    const headerNumber = parseHeaderNumber(header);
    if (headerNumber !== target.targetNumber) throw new Error("justification/header number mismatch");
    const rawHeader = encodeHeaderFromJson(header);
    const headerHash = toHex(blake2b(rawHeader, { dkLen: 32 }));
    if (headerHash.toLowerCase() !== target.targetHash.toLowerCase()) {
      throw new Error("SCALE header hash mismatch: computed=" + headerHash + " target=" + target.targetHash);
    }
    if (!captured.some(item => item.targetHash === target.targetHash && item.justificationHex === encodedHex)) {
      captured.push({
        source,
        engineId: engineId || suppliedEngineId,
        targetHash: target.targetHash,
        targetNumber: target.targetNumber,
        round: target.round,
        justificationHex: encodedHex.toLowerCase(),
        justificationBytes: target.bytes,
        justificationSha256: sha256(fromHex(encodedHex, "justification")),
        headerJson: header,
        headerScaleHex: toHex(rawHeader),
        headerHashComputed: headerHash,
        headerHashVerified: true,
        stateRoot: String(header.stateRoot || "").toLowerCase(),
        capturedAt: new Date().toISOString(),
        verificationScope: "P2P transport + local header hash binding only; IMMORTAL GRANDPA signature/quorum/authority-transition verification not performed by this script",
      });
      log("captured GRANDPA proof target=" + target.targetNumber + " hash=" + target.targetHash + " source=" + source);
      signalProof();
    }
  } catch (error) {
    candidateErrors.push({
      source,
      error: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
    });
    if (candidateErrors.length > 30) candidateErrors.shift();
    log("candidate proof could not be bound: " + (error instanceof Error ? error.message : String(error)));
  }
}

async function handleNotification(message) {
  if (!message || typeof message !== "object") return;
  if (message.method === "grandpa_justifications") {
    const params = message.params;
    if (!params || String(params.subscription) !== String(proofSubscriptionId)) return;
    const proofHex = params.result;
    if (typeof proofHex !== "string") {
      log("ignoring malformed grandpa_justifications notification");
      return;
    }
    void processJustification("grandpa_subscribeJustifications", proofHex);
  }
  if (message.method === "chain_finalizedHead") {
    const params = message.params;
    if (params && String(params.subscription) === String(finalizedSubscriptionId)) {
      const header = params.result;
      if (header && typeof header === "object") {
        try {
          lastFinalizedHead = {
            hash: toHex(blake2b(encodeHeaderFromJson(header), { dkLen: 32 })).toLowerCase(),
            number: parseHeaderNumber(header),
            stateRoot: String(header.stateRoot || "").toLowerCase(),
            observedAt: new Date().toISOString(),
          };
        } catch (error) {
          candidateErrors.push({ source: "chain_subscribeFinalizedHeads", error: String(error), at: new Date().toISOString() });
        }
      }
    }
  }
}
async function pumpResponses() {
  try {
    while (alive) {
      const raw = await chain.nextJsonRpcResponse();
      let message;
      try { message = JSON.parse(raw); } catch { continue; }
      if (message && Object.prototype.hasOwnProperty.call(message, "id") && message.id !== null) {
        const key = String(message.id);
        const waiter = pending.get(key);
        if (waiter) {
          pending.delete(key);
          clearTimeout(waiter.timer);
          if (message.error) waiter.reject(new Error("RPC " + waiter.method + ": " + message.error.code + " " + message.error.message));
          else waiter.resolve(message.result);
        }
      } else {
        void handleNotification(message);
      }
    }
  } catch (error) {
    if (alive) {
      const message = error instanceof Error ? error.message : String(error);
      log("JSON-RPC response pump stopped: " + message);
      for (const waiter of pending.values()) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error("Smoldot JSON-RPC pump failed: " + message));
      }
      pending.clear();
    }
  }
}

function rpc(method, params = [], timeoutMs = 15000) {
  if (!chain) return Promise.reject(new Error("Smoldot chain is not initialized"));
  const id = ++rpcId;
  const key = String(id);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(key);
      reject(new Error("RPC timeout: " + method));
    }, timeoutMs);
    pending.set(key, { resolve, reject, timer, method });
    try {
      chain.sendJsonRpc(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    } catch (error) {
      clearTimeout(timer);
      pending.delete(key);
      reject(error);
    }
  });
}

async function tryTargetBlock() {
  try {
    const value = await rpc("chain_getBlock", [config.targetHash], 20000);
    targetProbe.responseShape = value && typeof value === "object" ? Object.keys(value) : String(value);
    if (!value || typeof value !== "object" || !value.block || typeof value.block !== "object") {
      targetProbe.status = "BLOCK_NOT_RETURNED";
      targetProbe.reason = "chain_getBlock returned no block object for pinned historical target";
      return;
    }
    const header = value.block.header;
    const number = parseHeaderNumber(header);
    const rawHeader = encodeHeaderFromJson(header);
    const computedHash = toHex(blake2b(rawHeader, { dkLen: 32 })).toLowerCase();
    if (number !== config.targetNumber || computedHash !== config.targetHash) {
      targetProbe.status = "TARGET_HEADER_MISMATCH";
      targetProbe.reason = "number/hash mismatch number=" + number + " hash=" + computedHash;
      return;
    }
    targetProbe.headerHashVerified = true;
    targetProbe.headerScaleHex = toHex(rawHeader);
    targetProbe.headerJson = header;
    targetProbe.stateRoot = String(header.stateRoot || "").toLowerCase();
    const list = Array.isArray(value.justifications) ? value.justifications : [];
    for (const tuple of list) {
      if (!Array.isArray(tuple) || tuple.length !== 2 || typeof tuple[1] !== "string") continue;
      const engineId = normalizeEngineId(tuple[0]);
      if (engineId === "0x46524e4b") {
        await processJustification("chain_getBlock.justifications", tuple[1], tuple[0]);
      }
    }
    targetProbe.frnkJustificationFound = captured.some(item => item.targetHash === config.targetHash);
    targetProbe.status = targetProbe.frnkJustificationFound ? "TARGET_GRANDPA_JUSTIFICATION_CAPTURED" : "TARGET_HEADER_VERIFIED_NO_GRANDPA_JUSTIFICATION";
    if (!targetProbe.frnkJustificationFound) {
      targetProbe.reason = "Smoldot supplied the target header, but no FRNK justification was returned for this historical block";
    }
  } catch (error) {
    targetProbe.status = "TARGET_QUERY_UNAVAILABLE";
    targetProbe.reason = error instanceof Error ? error.message : String(error);
  }
}

async function main() {
  let spec;
  const finalErrors = [];
  try {
    if (!config.entry) throw new Error("SMOLDOT_ENTRY is required");
    log("downloading and pinning the official Materios raw chain spec");
    spec = await downloadChainSpec();
    log("official raw chain spec SHA256 verified: " + spec.originalDigest);
    const smoldot = await import(config.entry);
    client = smoldot.start({
      maxLogLevel: 3,
      cpuRateLimit: 1,
      forbidTcp: false,
      forbidWs: false,
      forbidNonLocalWs: false,
      forbidWss: false,
      logCallback: (_level, target, message) => log("[smoldot " + target + "] " + message),
    });
    chain = await client.addChain({ chainSpec: spec.effectiveText });
    const pumpPromise = pumpResponses();

    const systemName = await rpc("system_name");
    const systemChain = await rpc("system_chain");
    const observedGenesis = String(await rpc("chain_getBlockHash", [0])).toLowerCase();
    if (observedGenesis !== config.genesisHash) {
      throw new Error("GENESIS_HASH_MISMATCH expected=" + config.genesisHash + " observed=" + observedGenesis);
    }
    if (systemChain !== "Materios Preprod v6") {
      throw new Error("SYSTEM_CHAIN_MISMATCH expected=Materios Preprod v6 observed=" + String(systemChain));
    }
    log("Smoldot reports the pinned Materios genesis hash and chain name");

    try {
      proofSubscriptionId = await rpc("grandpa_subscribeJustifications", [], 15000);
      log("grandpa_subscribeJustifications subscription=" + String(proofSubscriptionId));
    } catch (error) {
      finalErrors.push("grandpa_subscribeJustifications failed: " + (error instanceof Error ? error.message : String(error)));
    }
    try {
      finalizedSubscriptionId = await rpc("chain_subscribeFinalizedHeads", [], 15000);
      log("chain_subscribeFinalizedHeads subscription=" + String(finalizedSubscriptionId));
    } catch (error) {
      finalErrors.push("chain_subscribeFinalizedHeads failed: " + (error instanceof Error ? error.message : String(error)));
    }

    let initialHead = null;
    try {
      const hash = String(await rpc("chain_getFinalizedHead", [], 15000)).toLowerCase();
      const header = await rpc("chain_getHeader", [hash], 15000);
      initialHead = { hash, number: parseHeaderNumber(header), stateRoot: header.stateRoot };
      lastFinalizedHead = {
        hash,
        number: initialHead.number,
        stateRoot: String(header.stateRoot || "").toLowerCase(),
        observedAt: new Date().toISOString(),
      };
    } catch (error) {
      log("initial finalized head not ready: " + (error instanceof Error ? error.message : String(error)));
    }

    const deadline = Date.now() + config.waitSeconds * 1000;
    let nextTargetProbe = 0;
    let nextHealthProbe = 0;
    while (Date.now() < deadline && captured.length === 0) {
      const now = Date.now();
      if (now >= nextTargetProbe) {
        await tryTargetBlock();
        nextTargetProbe = Date.now() + 30000;
      }
      if (now >= nextHealthProbe) {
        try { lastHealth = await rpc("system_health", [], 10000); }
        catch (error) { lastHealth = { error: error instanceof Error ? error.message : String(error) }; }
        try {
          const hash = String(await rpc("chain_getFinalizedHead", [], 10000)).toLowerCase();
          const header = await rpc("chain_getHeader", [hash], 10000);
          const observation = {
            hash,
            number: parseHeaderNumber(header),
            stateRoot: String(header.stateRoot || "").toLowerCase(),
            observedAt: new Date().toISOString(),
          };
          if (!lastFinalizedHead || observation.number >= lastFinalizedHead.number) lastFinalizedHead = observation;
        } catch (error) {
          log("finalized head not ready: " + (error instanceof Error ? error.message : String(error)));
        }
        nextHealthProbe = Date.now() + 15000;
      }
      if (captured.length > 0) break;
      await waitForProofSignal(3000);
    }

    const targetProof = captured.find(item => item.targetHash === config.targetHash) || null;
    const evidence = {
      schema_version: "materios-smoldot-p2p-finality-capture-v1",
      captured_at: new Date().toISOString(),
      started_at: startedAt,
      status: captured.length > 0 ? "RAW_GRANDPA_PROOF_CAPTURED" : "NO_RAW_GRANDPA_PROOF_CAPTURED",
      source: {
        kind: "P2P_LIGHT_CLIENT",
        client: "smoldot",
        client_commit: config.smoldotCommit,
        upstream_pr: "https://github.com/paritytech/smoldot/pull/3369",
        bootnode: config.bootNode,
        chain_spec_url: config.chainSpecUrl,
        downloaded_chain_spec_sha256: spec.originalDigest,
        downloaded_chain_spec_bytes: spec.originalBytes.length,
        effective_chain_spec_sha256: spec.effectiveDigest,
        effective_chain_spec_note: "Only bootNodes is added in-memory; original downloaded bytes are preserved and separately SHA-256 pinned",
      },
      chain: {
        chain_id: config.chainId,
        system_name: String(systemName),
        system_chain: String(systemChain),
        expected_genesis_hash: config.genesisHash,
        observed_genesis_hash: observedGenesis,
        genesis_hash_match: observedGenesis === config.genesisHash,
        initial_finalized_head: initialHead,
        latest_finalized_head_observed: lastFinalizedHead,
        latest_system_health: lastHealth,
      },
      target_probe: targetProbe,
      captured_justifications: captured.slice(0, 10),
      capture_errors: [...finalErrors, ...candidateErrors.slice(-30)],
      claims: {
        raw_grandpa_justification_transport_available: captured.length > 0,
        p2p_light_client_reports_expected_genesis: observedGenesis === config.genesisHash,
        header_hash_reconstructed_and_verified_for_each_captured_justification: captured.length > 0 && captured.every(item => item.headerHashVerified),
        historical_target_justification_captured: Boolean(targetProof),
        grandpa_signatures_verified_by_immortal: false,
        authenticated_authority_transition_verified_by_immortal: false,
        materios_native_execution_proof_captured: false,
        b3_a_closed: false,
      },
      required_follow_up: [
        "Feed captured raw justification and reconstructed header into the existing IMMORTAL GRANDPA verifier.",
        "Authenticate the applicable authority set/set ID from the genesis trust anchor and ordered transitions.",
        "Capture and independently verify the Materios-native authority-selection execution proof and selection-input commitment.",
        "Do not promote this acquisition artifact itself to VerifiedAuthoritySetTransition.",
      ],
      smoldot_log_tail: logTail.slice(-100),
    };
    fs.mkdirSync(path.dirname(config.out), { recursive: true });
    fs.writeFileSync(config.out, JSON.stringify(evidence, null, 2) + "\n");
    log("evidence written to " + config.out);
    if (captured.length === 0) {
      process.exitCode = 2;
      log("no raw proof was captured during the bounded observation window");
    } else {
      log("proof transport probe PASS; B3-A remains OPEN");
    }
    alive = false;
    try { await chain.remove(); } catch {}
    try { await client.terminate(); } catch {}
    await Promise.race([pumpPromise.catch(() => {}), new Promise(resolve => setTimeout(resolve, 250))]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("fatal: " + message);
    fs.mkdirSync(path.dirname(config.out), { recursive: true });
    fs.writeFileSync(config.out, JSON.stringify({
      schema_version: "materios-smoldot-p2p-finality-capture-v1",
      captured_at: new Date().toISOString(),
      started_at: startedAt,
      status: "PROBE_FAILED",
      error: message,
      config: {
        chainSpecUrl: config.chainSpecUrl,
        chainSpecSha256: config.chainSpecSha256,
        chainId: config.chainId,
        genesisHash: config.genesisHash,
        bootNode: config.bootNode,
        targetNumber: config.targetNumber,
        targetHash: config.targetHash,
        smoldotCommit: config.smoldotCommit,
      },
      captured_justifications: captured,
      capture_errors: candidateErrors,
      claims: { raw_grandpa_justification_transport_available: false, b3_a_closed: false },
      smoldot_log_tail: logTail.slice(-100),
    }, null, 2) + "\n");
    process.exitCode = 1;
    alive = false;
    try { if (chain) await chain.remove(); } catch {}
    try { if (client) await client.terminate(); } catch {}
  }
}

await main();
