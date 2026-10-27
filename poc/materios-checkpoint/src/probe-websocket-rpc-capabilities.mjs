#!/usr/bin/env node
/**
 * Read-only Materios WebSocket RPC capability/witness probe.
 * Every endpoint response remains untrusted. No transactions are submitted,
 * and this probe never claims cryptographic finality.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const __dir = dirname(fileURLToPath(import.meta.url));
const ENDPOINT = process.env.MATERIOS_WS || "wss://materios.fluxpointstudios.com/preprod-rpc";
const CHAIN_ID = process.env.MATERIOS_CHAIN_ID || "materios_preprod_v6";
const TIMEOUT_MS = Number(process.env.MATERIOS_WS_TIMEOUT_MS || 12000);
const SUBSCRIPTION_WAIT_MS = Number(process.env.MATERIOS_WS_SUBSCRIPTION_WAIT_MS || 15000);
const OUT_PATH = process.env.MATERIOS_WS_EVIDENCE_OUT ||
  join(__dir, "..", "out", "MateriosWebSocketRpcProbe.json");

const TARGET_GRANDPA_METHODS = [
  "grandpa_proveFinality",
  "grandpa_subscribeJustifications",
  "grandpa_unsubscribeJustifications",
];

// A configured candidate is a hint, never a trust anchor. The runtime
// selection below replaces it if it has fallen more than 1024 blocks behind
// the observed finalized head; this keeps the candidate in the bounded HTTP
// scan used to cross-check the WebSocket header. The target's FRNK payload is
// always treated as untrusted until the local verifier validates it.
const CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER = Number(
  process.env.MATERIOS_FINALITY_CANDIDATE_BLOCK_NUMBER || "0"
);
let FINALITY_CANDIDATE_BLOCK_NUMBER = CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER;
if (!Number.isSafeInteger(FINALITY_CANDIDATE_BLOCK_NUMBER) ||
    FINALITY_CANDIDATE_BLOCK_NUMBER < 0) {
  throw new Error("MATERIOS_FINALITY_CANDIDATE_BLOCK_NUMBER must be a non-negative safe integer");
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}
function redactedEndpoint(value) {
  const parsed = new URL(value);
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("MATERIOS_WS must not contain credentials, query parameters, or a fragment");
  }
  if (parsed.protocol !== "wss:" && parsed.protocol !== "ws:") {
    throw new Error("MATERIOS_WS must use ws:// or wss://");
  }
  return parsed.protocol + "//" + parsed.host + parsed.pathname.replace(/\/$/, "");
}
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function methodError(response) {
  if (!response || !response.error) return null;
  const code = response.error.code;
  const message = String(response.error.message || "JSON-RPC error");
  return {
    code,
    message,
    classification:
      code === -32601 || /method not found|unknown method/i.test(message)
        ? "METHOD_NOT_FOUND"
        : "RPC_ERROR",
  };
}
function normalizeEngineId(value) {
  if (typeof value === "string" && /^0x[0-9a-f]{8}$/i.test(value)) {
    return value.toLowerCase();
  }
  if (value === "FRNK") return "0x46524e4b";
  if (Array.isArray(value) && value.length === 4 &&
      value.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
    return "0x" + Buffer.from(value).toString("hex");
  }
  return null;
}
function normalizeBytes(value) {
  if (typeof value === "string" && /^0x(?:[0-9a-f]{2})*$/i.test(value)) {
    return Buffer.from(value.slice(2), "hex");
  }
  if (Array.isArray(value) &&
      value.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
    return Buffer.from(value);
  }
  return null;
}
function describeJustifications(value) {
  if (value === null || value === undefined) {
    return { field: "null", entryCount: 0, frnkEntryCount: 0, entries: [] };
  }
  if (!Array.isArray(value)) {
    return { field: typeof value, entryCount: null, frnkEntryCount: null, entries: [] };
  }
  let frnkEntryCount = 0;
  const entries = [];
  for (const tuple of value) {
    if (!Array.isArray(tuple) || tuple.length !== 2) {
      entries.push({ validTuple: false });
      continue;
    }
    const engineId = normalizeEngineId(tuple[0]);
    const bytes = normalizeBytes(tuple[1]);
    if (engineId === "0x46524e4b") frnkEntryCount++;
    const entry = {
      validTuple: true,
      engineId,
      payloadFormat: typeof tuple[1] === "string" ? "hex" :
        Array.isArray(tuple[1]) ? "byte-array" : typeof tuple[1],
      payloadBytes: bytes ? bytes.length : null,
      payloadSha256: bytes ? sha256Bytes(bytes) : null,
    };
    if (engineId === "0x46524e4b" && bytes) {
      entry.rawPayloadHex = "0x" + bytes.toString("hex");
    }
    entries.push(entry);
  }
  return { field: "array", entryCount: value.length, frnkEntryCount, entries };
}
function summarizeRpcMethods(response) {
  if (response && response.error) {
    return { status: methodError(response).classification, error: methodError(response) };
  }
  const value = response && response.result;
  if (!isObject(value) || !Array.isArray(value.methods) ||
      !value.methods.every(method => typeof method === "string")) {
    return { status: "MALFORMED", methodCount: null, methods: [], grandpaMethods: {} };
  }
  const methods = Array.from(new Set(value.methods)).sort();
  const set = new Set(methods);
  return {
    status: "available",
    method_count: methods.length,
    methods,
    grandpa_methods: Object.fromEntries(
      TARGET_GRANDPA_METHODS.map(method => [method, set.has(method) ? "listed" : "not-listed"])
    ),
  };
}

async function fetchGatewayDiscovery() {
  const urls = [
    process.env.MATERIOS_CHAIN_INFO_URL || "https://materios.fluxpointstudios.com/chain-info",
    "https://materios.fluxpointstudios.com/preprod-blobs/chain-info",
  ];
  const sources = [];
  const discoveredBootnodes = [];
  for (const url of [...new Set(urls)]) {
    const record = {
      url,
      fetched_at: new Date().toISOString(),
      status: "NOT_ATTEMPTED",
    };
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      record.http_status = response.status;
      const raw = await response.text();
      record.response_bytes = Buffer.byteLength(raw, "utf8");
      record.response_sha256 = sha256Bytes(Buffer.from(raw, "utf8"));
      if (!response.ok) {
        record.status = "HTTP_ERROR";
        record.error = "HTTP " + response.status;
        sources.push(record);
        continue;
      }
      let data;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        record.status = "INVALID_JSON";
        record.error = String(error);
        sources.push(record);
        continue;
      }
      if (!isObject(data)) {
        record.status = "MALFORMED";
        record.error = "chain-info result is not an object";
        sources.push(record);
        continue;
      }
      const bootnodes = Array.isArray(data.bootnodes)
        ? data.bootnodes.filter(value => typeof value === "string" && value.length > 0)
        : [];
      record.status = "available";
      record.chain = data.chain ?? data.chain_name ?? null;
      record.genesis = typeof data.genesis === "string" ? data.genesis : null;
      record.spec_version = Number.isSafeInteger(data.spec_version) ? data.spec_version : null;
      record.best_block = Number.isSafeInteger(data.best_block) ? data.best_block : null;
      record.finalized_block = Number.isSafeInteger(data.finalized_block) ? data.finalized_block : null;
      record.finalized = typeof data.finalized === "string" ? data.finalized : null;
      record.chain_spec_url = typeof data.chain_spec_url === "string" ? data.chain_spec_url : null;
      record.bootnodes = bootnodes;
      record.trust_scope = "Untrusted peer-discovery metadata only; never a finality/header/state/authority trust anchor";
      for (const bootnode of bootnodes) {
        if (!discoveredBootnodes.includes(bootnode)) discoveredBootnodes.push(bootnode);
      }
      sources.push(record);
    } catch (error) {
      record.status = "TRANSPORT_ERROR";
      record.error = error instanceof Error ? error.message : String(error);
      sources.push(record);
    }
  }
  return {
    schema_version: "materios-gateway-peer-discovery-v1",
    captured_at: new Date().toISOString(),
    status: discoveredBootnodes.length > 0 ? "BOOTNODES_DISCOVERED" :
      sources.some(source => source.status === "available") ? "NO_BOOTNODES_LISTED" : "UNAVAILABLE",
    sources,
    unique_bootnodes: discoveredBootnodes,
    bootnode_count: discoveredBootnodes.length,
    trust_scope: "Bootnode candidates improve transport discovery only. Every proof/claim returned by a candidate remains untrusted and must be independently verified.",
  };
}

async function main() {
  const endpoint = redactedEndpoint(ENDPOINT);
  const startedAt = new Date().toISOString();
  let socket;
  let id = 0;
  const pending = new Map();
  const notifications = [];
  const eventErrors = [];
  let closeInfo = null;

  const evidence = {
    schema_version: "materios-websocket-rpc-probe-v1",
    captured_at: null,
    started_at: startedAt,
    chain_id: CHAIN_ID,
    endpoint,
    mode: "read-only WebSocket RPC; no transaction submission",
    websocket: { connected: false, protocol: null, opened_at: null, closed: null },
    gateway_discovery: {
      status: "NOT_ATTEMPTED",
      sources: [],
      unique_bootnodes: [],
      bootnode_count: 0,
      trust_scope: "Untrusted transport discovery only",
    },
    catalogue: {
      status: "NOT_ATTEMPTED",
      method_count: null,
      methods: [],
      grandpa_methods: {},
    },
    identity: {
      system_chain: null,
      genesis_hash: null,
      expected_genesis_hash: (process.env.MATERIOS_GENESIS_HASH ||
        "0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf").toLowerCase(),
      genesis_hash_match: false,
      finalized_head: null,
      finalized_head_number: null,
      finalized_head_source: "untrusted WebSocket RPC observation only",
    },
    finality_probe: {
      prove_finality: { status: "NOT_ATTEMPTED" },
      subscribe_justifications: { status: "NOT_ATTEMPTED" },
      unsubscribe_justifications: { status: "NOT_ATTEMPTED" },
      notifications_waited_ms: SUBSCRIPTION_WAIT_MS,
      notifications_received: [],
    },
    head_block_justifications: {
      block_hash: null,
      block_number: null,
      state_root: null,
      field: "unknown",
      entry_count: null,
      frnk_entry_count: null,
      entries: [],
      error: null,
    },
    historical_candidate_probe: {
      requested_block_number: FINALITY_CANDIDATE_BLOCK_NUMBER,
      status: "NOT_ATTEMPTED",
      requested_block_hash: null,
      returned_block_number: null,
      state_root: null,
      header: null,
      justifications: {
        field: "unknown",
        entry_count: null,
        frnk_entry_count: null,
        entries: [],
      },
      error: null,
      trust_scope: "Untrusted public WebSocket RPC transport; a raw FRNK payload is not finality until IMMORTAL independently verifies its target header, ancestry, signatures/quorum and authenticated authority history.",
    },
    errors: eventErrors,
    claims: {
      public_websocket_connection_available: false,
      existing_peer_candidates_discovered: false,
      websocket_advertises_grandpa_methods: false,
      grandpa_method_call_accepted: false,
      raw_grandpa_finality_payload_captured: false,
      raw_grandpa_justification_captured: false,
      raw_payload_hashes_recorded: false,
      grandpa_signatures_verified_by_immortal: false,
      authority_set_provenance_verified: false,
      b3_a_closed: false,
    },
    required_follow_up: [
      "If a raw justification is captured, feed it into the existing IMMORTAL verifier against the pinned genesis trust anchor and authenticated authority history.",
      "A WebSocket head, set ID, or authority list is an untrusted observation and must not be used as an authority trust anchor.",
      "Valid GRANDPA finality alone does not prove Materios-specific selector/execution evidence or VerifiedAuthoritySetTransition.",
    ],
  };

  const onNotification = message => {
    if (!isObject(message)) return;
    const item = {
      captured_at: new Date().toISOString(),
      method: message.method || null,
      subscription: message.params && message.params.subscription !== undefined
        ? message.params.subscription : null,
      result_type: message.params ? typeof message.params.result : "undefined",
      result: message.params ? (message.params.result === undefined ? null : message.params.result) : null,
    };
    notifications.push(item);
    evidence.finality_probe.notifications_received = notifications.slice(0, 10);
  };

  function rpc(method, params = [], timeoutMs = TIMEOUT_MS) {
    const requestId = ++id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(String(requestId));
        reject(new Error("timeout after " + timeoutMs + " ms: " + method));
      }, timeoutMs);
      pending.set(String(requestId), {
        method,
        resolve: response => {
          clearTimeout(timer);
          resolve(response);
        },
        reject: error => {
          clearTimeout(timer);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }), error => {
        if (!error) return;
        const waiter = pending.get(String(requestId));
        if (waiter) {
          pending.delete(String(requestId));
          waiter.reject(error);
        }
      });
    });
  }

  try {
    evidence.gateway_discovery = await fetchGatewayDiscovery();
    evidence.claims.existing_peer_candidates_discovered =
      evidence.gateway_discovery.bootnode_count > 0;
    socket = new WebSocket(endpoint, { handshakeTimeout: TIMEOUT_MS, perMessageDeflate: false });
    socket.on("message", raw => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch (error) {
        eventErrors.push({
          at: new Date().toISOString(),
          kind: "MALFORMED_WEBSOCKET_JSON",
          message: String(error),
        });
        return;
      }
      if (message && message.id !== undefined && message.id !== null) {
        const key = String(message.id);
        const waiter = pending.get(key);
        if (waiter) {
          pending.delete(key);
          waiter.resolve(message);
        }
      } else {
        onNotification(message);
      }
    });
    socket.on("error", error => {
      eventErrors.push({
        at: new Date().toISOString(),
        kind: "WEBSOCKET_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
    });
    socket.on("close", (code, reason) => {
      closeInfo = { code, reason: reason.toString() };
      evidence.websocket.closed = closeInfo;
      for (const [key, waiter] of pending) {
        pending.delete(key);
        waiter.reject(new Error("WebSocket closed before response: " + waiter.method));
      }
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("WebSocket open timeout")), TIMEOUT_MS);
      socket.once("open", () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once("error", error => {
        clearTimeout(timer);
        reject(error);
      });
    });

    evidence.websocket.connected = true;
    evidence.websocket.opened_at = new Date().toISOString();
    evidence.websocket.protocol = socket.protocol || null;
    evidence.claims.public_websocket_connection_available = true;

    const catalogueResponse = await rpc("rpc_methods", []);
    evidence.catalogue = summarizeRpcMethods(catalogueResponse);
    if (evidence.catalogue.status === "available") {
      evidence.claims.websocket_advertises_grandpa_methods =
        TARGET_GRANDPA_METHODS.some(method => evidence.catalogue.grandpa_methods[method] === "listed");
    }

    try {
      const systemChain = await rpc("system_chain", []);
      if (!systemChain.error) evidence.identity.system_chain = systemChain.result;
      else evidence.identity.system_chain_error = methodError(systemChain);
    } catch (error) {
      evidence.identity.system_chain_error = String(error);
    }

    try {
      const genesis = await rpc("chain_getBlockHash", [0]);
      if (!genesis.error && typeof genesis.result === "string") {
        evidence.identity.genesis_hash = genesis.result.toLowerCase();
        evidence.identity.genesis_hash_match =
          evidence.identity.genesis_hash === evidence.identity.expected_genesis_hash;
      } else {
        evidence.identity.genesis_hash_error = methodError(genesis);
      }
    } catch (error) {
      evidence.identity.genesis_hash_error = String(error);
    }

    try {
      const head = await rpc("chain_getFinalizedHead", []);
      if (head.error) {
        evidence.identity.finalized_head_error = methodError(head);
      } else if (typeof head.result === "string") {
        evidence.identity.finalized_head = head.result;
        const header = await rpc("chain_getHeader", [head.result]);
        if (!header.error && isObject(header.result)) {
          const number = header.result.number;
          if (typeof number === "string" && /^0x[0-9a-f]+$/i.test(number)) {
            evidence.identity.finalized_head_number = Number(BigInt(number));
          }
          const block = await rpc("chain_getBlock", [head.result]);
          if (block.error) {
            evidence.head_block_justifications.error = methodError(block);
          } else if (isObject(block.result)) {
            const headerBody = block.result.block && block.result.block.header;
            const justifications = describeJustifications(block.result.justifications);
            Object.assign(evidence.head_block_justifications, {
              block_hash: head.result,
              block_number: evidence.identity.finalized_head_number,
              state_root: headerBody && headerBody.stateRoot ? headerBody.stateRoot : null,
              field: justifications.field,
              entry_count: justifications.entryCount,
              frnk_entry_count: justifications.frnkEntryCount,
              entries: justifications.entries,
            });
            if ((justifications.frnkEntryCount || 0) > 0) {
              evidence.claims.raw_grandpa_finality_payload_captured = true;
              evidence.claims.raw_grandpa_justification_captured = true;
              evidence.claims.raw_payload_hashes_recorded = true;
            }
          }
        } else {
          evidence.identity.finalized_head_header_error = methodError(header);
        }
      } else {
        evidence.identity.finalized_head_result_type = typeof head.result;
      }
    } catch (error) {
      evidence.identity.finalized_head_error = error instanceof Error ? error.message : String(error);
    }

    // Select a recent 512-block GRANDPA boundary from the observed finalized
    // head unless a configured candidate is still ahead or within the bounded
    // 1024-block HTTP cross-route scan. This prevents a pinned historical target
    // from becoming stale as the chain advances.
    const observedFinalizedHeight = evidence.identity.finalized_head_number;
    if (!Number.isSafeInteger(observedFinalizedHeight) || observedFinalizedHeight < 0) {
      throw new Error("FINALIZED_HEAD_HEIGHT_UNAVAILABLE_FOR_CANDIDATE_SELECTION");
    }
    const currentFinalityBoundary =
      Math.floor(observedFinalizedHeight / 512) * 512;
    const configuredCandidateIsUsable =
      CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER > observedFinalizedHeight ||
      observedFinalizedHeight - CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER <= 1024;
    FINALITY_CANDIDATE_BLOCK_NUMBER =
      CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER > 0 && configuredCandidateIsUsable
        ? CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER
        : currentFinalityBoundary;
    evidence.historical_candidate_probe.requested_block_number =
      FINALITY_CANDIDATE_BLOCK_NUMBER;
    evidence.historical_candidate_probe.target_selection = {
      configured_candidate_block_number: CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER,
      observed_finalized_head_number: observedFinalizedHeight,
      selected_boundary_block_number: currentFinalityBoundary,
      selected_block_number: FINALITY_CANDIDATE_BLOCK_NUMBER,
      reason: FINALITY_CANDIDATE_BLOCK_NUMBER === CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER &&
          CONFIGURED_FINALITY_CANDIDATE_BLOCK_NUMBER > 0
        ? "CONFIGURED_CANDIDATE_STILL_WITHIN_RANGE"
        : "LATEST_FINALIZED_512_BLOCK_BOUNDARY",
      trust_scope: "UNTRUSTED CANDIDATE SELECTION ONLY",
    };

    // Probe the selected recent GRANDPA boundary. This may expose stored FRNK
    // bytes even though this public endpoint does not implement grandpa_proveFinality.
    try {
      const waitSeconds = Number(process.env.MATERIOS_FINALITY_WAIT_SECONDS || "900");
      const waitDeadline = Date.now() + Math.max(0, waitSeconds) * 1000;
      while (
        (!Number.isSafeInteger(evidence.identity.finalized_head_number) ||
         evidence.identity.finalized_head_number < FINALITY_CANDIDATE_BLOCK_NUMBER) &&
        Date.now() < waitDeadline
      ) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const finalized = await rpc("chain_getFinalizedHead", []);
        const finalizedError = methodError(finalized);
        if (finalizedError || typeof finalized.result !== "string") {
          throw new Error("Unable to refresh finalized head while waiting for candidate");
        }
        const finalizedHeader = await rpc("chain_getHeader", [finalized.result]);
        const headerError = methodError(finalizedHeader);
        if (headerError || !isObject(finalizedHeader.result) ||
            typeof finalizedHeader.result.number !== "string" ||
            !/^0x[0-9a-f]+$/i.test(finalizedHeader.result.number)) {
          throw new Error("Unable to read current finalized height while waiting for candidate");
        }
        evidence.identity.finalized_head = finalized.result;
        evidence.identity.finalized_head_number = Number(BigInt(finalizedHeader.result.number));
      }
      evidence.historical_candidate_probe.finalized_head_number_at_probe =
        evidence.identity.finalized_head_number;
      evidence.historical_candidate_probe.wait_seconds_configured = waitSeconds;
      const hashResponse = await rpc("chain_getBlockHash", [FINALITY_CANDIDATE_BLOCK_NUMBER]);
      const hashError = methodError(hashResponse);
      if (hashError) {
        evidence.historical_candidate_probe.status = hashError.classification;
        evidence.historical_candidate_probe.error = hashError;
      } else if (typeof hashResponse.result !== "string" ||
          !/^0x[0-9a-f]{64}$/i.test(hashResponse.result)) {
        evidence.historical_candidate_probe.status =
          hashResponse.result === null ? "BLOCK_HASH_UNAVAILABLE" : "MALFORMED_BLOCK_HASH";
        evidence.historical_candidate_probe.result_type = typeof hashResponse.result;
      } else {
        evidence.historical_candidate_probe.requested_block_hash = hashResponse.result.toLowerCase();
        const blockResponse = await rpc("chain_getBlock", [hashResponse.result]);
        const blockError = methodError(blockResponse);
        if (blockError) {
          evidence.historical_candidate_probe.status = blockError.classification;
          evidence.historical_candidate_probe.error = blockError;
        } else if (!isObject(blockResponse.result) ||
            !isObject(blockResponse.result.block) ||
            !isObject(blockResponse.result.block.header)) {
          evidence.historical_candidate_probe.status = "BLOCK_BODY_UNAVAILABLE";
          evidence.historical_candidate_probe.response_type = typeof blockResponse.result;
        } else {
          const header = blockResponse.result.block.header;
          const headerNumber = typeof header.number === "string" && /^0x[0-9a-f]+$/i.test(header.number)
            ? Number(BigInt(header.number))
            : null;
          const justifications = describeJustifications(blockResponse.result.justifications);
          evidence.historical_candidate_probe.returned_block_number = headerNumber;
          evidence.historical_candidate_probe.state_root =
            typeof header.stateRoot === "string" ? header.stateRoot.toLowerCase() : null;
          evidence.historical_candidate_probe.header = {
            parentHash: header.parentHash ?? null,
            number: header.number ?? null,
            stateRoot: header.stateRoot ?? null,
            extrinsicsRoot: header.extrinsicsRoot ?? null,
            digest: header.digest ?? null,
          };
          evidence.historical_candidate_probe.justifications = justifications;
          evidence.historical_candidate_probe.status =
            headerNumber !== FINALITY_CANDIDATE_BLOCK_NUMBER
              ? "HEADER_NUMBER_MISMATCH"
              : (justifications.frnkEntryCount > 0
                  ? "FRNK_JUSTIFICATION_CAPTURED_UNVERIFIED"
                  : "BLOCK_RETURNED_NO_FRNK_JUSTIFICATION");
          if (justifications.frnkEntryCount > 0) {
            evidence.claims.raw_grandpa_finality_payload_captured = true;
            evidence.claims.raw_grandpa_justification_captured = true;
            evidence.claims.raw_payload_hashes_recorded = true;
          }
        }
      }
    } catch (error) {
      evidence.historical_candidate_probe.status = "TRANSPORT_OR_RPC_ERROR";
      evidence.historical_candidate_probe.error =
        error instanceof Error ? error.message : String(error);
    }

    // Directly invoke proof RPC even if omitted by the WebSocket catalogue.
    // Only a read-only finality request is made.
    try {
      const number = Number.isSafeInteger(evidence.identity.finalized_head_number)
        ? evidence.identity.finalized_head_number : 2381856;
      const response = await rpc("grandpa_proveFinality", [number]);
      const err = methodError(response);
      if (err) {
        evidence.finality_probe.prove_finality = {
          status: err.classification,
          error: err,
          requested_block_number: number,
        };
      } else if (typeof response.result === "string" && /^0x(?:[0-9a-f]{2})*$/i.test(response.result)) {
        const proofBytes = Buffer.from(response.result.slice(2), "hex");
        evidence.finality_probe.prove_finality = {
          status: "RAW_PROOF_CAPTURED_UNVERIFIED",
          requested_block_number: number,
          raw_proof_hex: response.result,
          raw_proof_bytes: proofBytes.length,
          raw_proof_sha256: sha256Bytes(proofBytes),
        };
        evidence.claims.grandpa_method_call_accepted = true;
        evidence.claims.raw_grandpa_finality_payload_captured = true;
        evidence.claims.raw_payload_hashes_recorded = true;
      } else {
        evidence.finality_probe.prove_finality = {
          status: response.result === null ? "NULL_RESULT" : "UNEXPECTED_RESULT_TYPE",
          result_type: typeof response.result,
          requested_block_number: number,
        };
      }
    } catch (error) {
      evidence.finality_probe.prove_finality = {
        status: "TRANSPORT_OR_RPC_ERROR",
        message: error instanceof Error ? error.message : String(error),
      };
    }

    // Exercise the actual WebSocket subscription path. If it accepts the subscription,
    // wait a bounded time for a live justification and then unsubscribe using its real ID.
    let subscriptionId = null;
    try {
      const response = await rpc("grandpa_subscribeJustifications", []);
      const err = methodError(response);
      if (err) {
        evidence.finality_probe.subscribe_justifications = {
          status: err.classification,
          error: err,
        };
      } else if (typeof response.result === "string" || typeof response.result === "number") {
        subscriptionId = response.result;
        evidence.finality_probe.subscribe_justifications = {
          status: "SUBSCRIPTION_ACCEPTED",
          subscription_id: subscriptionId,
          notification_received: false,
        };
        evidence.claims.grandpa_method_call_accepted = true;

        const deadline = Date.now() + SUBSCRIPTION_WAIT_MS;
        while (Date.now() < deadline &&
          !notifications.some(item => item.method === "grandpa_justifications" &&
            String(item.subscription) === String(subscriptionId))) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
        const found = notifications.find(item => item.method === "grandpa_justifications" &&
          String(item.subscription) === String(subscriptionId));
        evidence.finality_probe.subscribe_justifications.notification_received = Boolean(found);
        evidence.finality_probe.notifications_received = notifications.slice(0, 10);
        if (found) {
          const proofBytes = normalizeBytes(found.result);
          if (proofBytes) {
            found.result_bytes = proofBytes.length;
            found.result_sha256 = sha256Bytes(proofBytes);
            if (typeof found.result === "string") found.result_hex = found.result;
            evidence.claims.raw_grandpa_finality_payload_captured = true;
            evidence.claims.raw_grandpa_justification_captured = true;
            evidence.claims.raw_payload_hashes_recorded = true;
          }
        }
      } else {
        evidence.finality_probe.subscribe_justifications = {
          status: response.result === null ? "NULL_RESULT" : "UNEXPECTED_RESULT_TYPE",
          result_type: typeof response.result,
        };
      }
    } catch (error) {
      evidence.finality_probe.subscribe_justifications = {
        status: "TRANSPORT_OR_RPC_ERROR",
        message: error instanceof Error ? error.message : String(error),
      };
    }

    if (subscriptionId !== null) {
      try {
        const response = await rpc("grandpa_unsubscribeJustifications", [subscriptionId]);
        const err = methodError(response);
        evidence.finality_probe.unsubscribe_justifications = err
          ? { status: err.classification, error: err }
          : { status: response.result === true ? "SUCCESS" : "UNEXPECTED_RESULT", result: response.result };
      } catch (error) {
        evidence.finality_probe.unsubscribe_justifications = {
          status: "TRANSPORT_OR_RPC_ERROR",
          message: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      evidence.finality_probe.unsubscribe_justifications = {
        status: "NOT_ATTEMPTED_NO_SUBSCRIPTION_ID",
      };
    }
  } catch (error) {
    evidence.websocket.error = error instanceof Error ? error.message : String(error);
    evidence.errors.push({
      at: new Date().toISOString(),
      kind: "FATAL_PROBE_ERROR",
      message: evidence.websocket.error,
    });
  } finally {
    evidence.captured_at = new Date().toISOString();
    evidence.websocket.closed = closeInfo;
    mkdirSync(dirname(OUT_PATH), { recursive: true });
    writeFileSync(OUT_PATH, JSON.stringify(evidence, null, 2) + "\n", "utf8");
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "probe complete");
    }
  }

  console.log("Materios WebSocket RPC capability probe");
  console.log("Endpoint:", endpoint);
  console.log("Gateway peer discovery:", evidence.gateway_discovery.status,
    "unique bootnodes:", evidence.gateway_discovery.bootnode_count);
  console.log("Connected:", evidence.websocket.connected);
  console.log("RPC catalogue:", evidence.catalogue.status, evidence.catalogue.method_count || "");
  console.log("GRANDPA proveFinality:", evidence.finality_probe.prove_finality.status);
  console.log("GRANDPA subscribeJustifications:", evidence.finality_probe.subscribe_justifications.status);
  console.log("Raw finality payload captured:", evidence.claims.raw_grandpa_finality_payload_captured);
  console.log("Raw FRNK justification captured:", evidence.claims.raw_grandpa_justification_captured);
  console.log("Wrote:", OUT_PATH);
  console.log("Scope: WebSocket capability/acquisition only; B3-A remains OPEN.");
}

await main();
