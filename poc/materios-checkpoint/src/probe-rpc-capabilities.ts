/**
 * Read-only capability probe for the existing Materios JSON-RPC route.
 *
 * This records which RPC methods the endpoint advertises. It does not invoke
 * the custom execution-proof method with fabricated call data and does not
 * establish the validity of any returned proof.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { MateriosRpc } from "./rpc.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const RPC =
  process.env.MATERIOS_RPC ??
  "https://materios.fluxpointstudios.com/preprod-rpc";
const CHAIN_ID = process.env.MATERIOS_CHAIN_ID ?? "materios_preprod_v6";

export const TARGET_RPC_METHODS = [
  "chain_getFinalizedHead",
  "chain_getHeader",
  "chain_getBlock",
  "state_getRuntimeVersion",
  "state_getCode",
  "state_getStorage",
  "state_getReadProof",
  "state_call",
  "grandpa_proveFinality",
  "materios_b3_calculateCommitteeProof",
] as const;

export type RpcMethodCatalogue =
  | {
      status: "available";
      version: number | null;
      methodCount: number;
      methods: string[];
      targets: Record<string, "listed" | "not-listed">;
    }
  | {
      status: "malformed";
      reason: string;
      version: null;
      methodCount: null;
      methods: [];
      targets: Record<string, "unknown">;
    };

function emptyTargets(): Record<string, "unknown"> {
  return Object.fromEntries(
    TARGET_RPC_METHODS.map((name) => [name, "unknown" as const]),
  );
}

/** Pure decoder, exported for fixture tests. */
export function summarizeRpcMethodCatalogue(value: unknown): RpcMethodCatalogue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      status: "malformed",
      reason: "rpc_methods result must be an object",
      version: null,
      methodCount: null,
      methods: [],
      targets: emptyTargets(),
    };
  }

  const object = value as Record<string, unknown>;
  if (
    !Array.isArray(object.methods) ||
    !object.methods.every((entry) => typeof entry === "string" && entry.length > 0)
  ) {
    return {
      status: "malformed",
      reason: "rpc_methods.methods must be an array of non-empty strings",
      version: null,
      methodCount: null,
      methods: [],
      targets: emptyTargets(),
    };
  }

  const methods = [...new Set(object.methods as string[])].sort();
  const methodSet = new Set(methods);
  const version =
    typeof object.version === "number" && Number.isSafeInteger(object.version)
      ? object.version
      : null;

  return {
    status: "available",
    version,
    methodCount: methods.length,
    methods,
    targets: Object.fromEntries(
      TARGET_RPC_METHODS.map((name) => [
        name,
        methodSet.has(name) ? "listed" as const : "not-listed" as const,
      ]),
    ),
  };
}

function safeEndpointForReport(value: string): string {
  const parsed = new URL(value);
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(
      "MATERIOS_RPC must not contain credentials, query parameters, or a fragment",
    );
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("MATERIOS_RPC must use HTTP or HTTPS");
  }
  return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, "")}`;
}

function classifyError(error: unknown): {
  status: "method-not-found" | "rpc-error";
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  if (/-32601|method not found|unknown method|method .* not found/i.test(message)) {
    return { status: "method-not-found", message };
  }
  return { status: "rpc-error", message };
}

async function main(): Promise<void> {
  const endpoint = safeEndpointForReport(RPC);
  const rpc = new MateriosRpc(RPC);
  let catalogue: RpcMethodCatalogue | {
    status: "method-not-found" | "rpc-error";
    message: string;
    version: null;
    methodCount: null;
    methods: [];
    targets: Record<string, "unknown">;
  };

  try {
    catalogue = summarizeRpcMethodCatalogue(await rpc.call<unknown>("rpc_methods", []));
  } catch (error) {
    const classified = classifyError(error);
    catalogue = {
      ...classified,
      version: null,
      methodCount: null,
      methods: [],
      targets: emptyTargets(),
    };
  }

  const packet = {
    schema_version: "materios-rpc-capability-probe-v1",
    chain_id: CHAIN_ID,
    rpc_endpoint: endpoint,
    captured_at: new Date().toISOString(),
    mode: "read-only method catalogue; no transaction submission",
    catalogue,
    scope: {
      establishes: [
        "what the selected endpoint advertises through rpc_methods, if that method is available",
      ],
      does_not_establish: [
        "that an advertised method returns a valid proof",
        "that any returned proof is cryptographically verified",
        "GRANDPA finality or authority-set provenance",
        "historical-state availability for the required anchor",
        "canonical anchorId-to-round/checkpoint binding",
        "B3 conformance",
      ],
      note:
        "The execution-proof method is not invoked with dummy call data. A valid proof request requires the exact canonical SCALE input bytes and epoch.",
    },
  };

  const outDir = join(__dir, "..", "out");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "MateriosRpcCapabilityProbe.json");
  writeFileSync(outPath, JSON.stringify(packet, null, 2) + "\n", "utf8");

  console.log("Materios existing-route RPC capability probe");
  console.log("RPC:", endpoint);
  console.log("Catalogue status:", catalogue.status);
  if (catalogue.status === "available") {
    console.log("Advertised method count:", catalogue.methodCount);
    for (const name of TARGET_RPC_METHODS) {
      console.log(`${catalogue.targets[name].toUpperCase()}: ${name}`);
    }
  } else {
    const diagnostic =
      catalogue.status === "malformed"
        ? catalogue.reason
        : "message" in catalogue
          ? catalogue.message
          : "unknown";
    console.log("Catalogue result:", diagnostic);
    console.log("Target method status: UNKNOWN (no catalogue)");
  }
  console.log("Wrote:", outPath);
  console.log("Scope: method availability only; no proof verified.");
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
