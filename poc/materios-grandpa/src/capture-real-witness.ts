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
import {
  verifyFinality,
} from "./verifier.js";
import {
  nobleEd25519,
} from "./crypto.js";
import {
  bytesToHex,
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

const JUSTIFICATION_LOOKBACK = Number(
  process.env.MATERIOS_JUSTIFICATION_LOOKBACK ?? "8",
);

const TRANSITION_LOOKBACK_EPOCHS = Number(
  process.env.MATERIOS_TRANSITION_LOOKBACK_EPOCHS ?? "12",
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

  return matches.length === 1 ? matches[0][1].toLowerCase() : null;
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
        (BigInt(bytes[offset]) |
          (BigInt(bytes[offset + 1]) << 8n)) >>
        2n;
      offset += 2;
      return value;
    }

    if (mode === 2) {
      if (offset + 4 > bytes.length) {
        throw new Error("authority list: compact EOF");
      }
      const value =
        (BigInt(bytes[offset]) |
          (BigInt(bytes[offset + 1]) << 8n) |
          (BigInt(bytes[offset + 2]) << 16n) |
          (BigInt(bytes[offset + 3]) << 24n)) >>
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
        BigInt(bytes[offset + 1 + i]) <<
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
      weight |= BigInt(bytes[offset + j]) << BigInt(8 * j);
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
    value |= BigInt(bytes[i]) << BigInt(8 * i);
  }
  return value;
}

function compactCandidates(
  finalizedHeight: bigint,
): number[] {
  const out: number[] = [];
  const seen = new Set<number>();

  const add = (height: bigint) => {
    if (
      height < 0n ||
      height > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      return;
    }

    const n = Number(height);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };

  const base =
    finalizedHeight -
    (finalizedHeight % BigInt(JUSTIFICATION_PERIOD));

  for (
    let i = 0;
    i < JUSTIFICATION_LOOKBACK;
    i += 1
  ) {
    add(base - BigInt(i * JUSTIFICATION_PERIOD));
  }

  for (let delta = -8; delta <= 8; delta += 1) {
    add(base + BigInt(delta));
  }

  return out
    .filter((height) => BigInt(height) <= finalizedHeight)
    .sort((a, b) => b - a);
}

function transitionCandidates(
  finalizedHeight: bigint,
): number[] {
  const out: number[] = [];
  const seen = new Set<number>();

  const add = (height: bigint) => {
    if (
      height < 0n ||
      height > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      return;
    }

    const n = Number(height);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };

  const period = BigInt(PREPROD_SLOTS_PER_EPOCH);
  const base = finalizedHeight - (finalizedHeight % period);

  for (
    let epoch = 0;
    epoch < TRANSITION_LOOKBACK_EPOCHS;
    epoch += 1
  ) {
    const boundary =
      base - BigInt(epoch * PREPROD_SLOTS_PER_EPOCH);

    for (let delta = -4; delta <= 4; delta += 1) {
      add(boundary + BigInt(delta));
    }
  }

  return out
    .filter(
      (height) =>
        height >= 0 &&
        BigInt(height) <= finalizedHeight,
    )
    .sort((a, b) => b - a);
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

  let witness:
    | {
        blockNumber: bigint;
        blockHash: string;
        header: SubstrateHeader;
        justificationHex: string;
        justificationSha256: string;
      }
    | undefined;

  const justificationProbeLog: Array<{
    blockNumber: number;
    hash?: string;
    hasGrandpa?: boolean;
    error?: string;
  }> = [];

  for (const candidate of compactCandidates(finalizedHeight)) {
    try {
      const block = await getBlockByNumber(candidate);
      const justificationHex = extractGrandpaJustification(
        block.signed,
      );

      justificationProbeLog.push({
        blockNumber: candidate,
        hash: block.hash,
        hasGrandpa: justificationHex !== null,
      });

      if (justificationHex !== null) {
        const header = block.signed.block.header;
        const blockNumber = parseBlockNumber(
          header.number,
          "witness header",
        );

        if (BigInt(candidate) !== blockNumber) {
          throw new Error(
            "block number mismatch: requested " +
              candidate +
              ", header " +
              blockNumber,
          );
        }

        witness = {
          blockNumber,
          blockHash: block.hash,
          header,
          justificationHex,
          justificationSha256:
            sha256Hex(justificationHex),
        };
        break;
      }
    } catch (error) {
      justificationProbeLog.push({
        blockNumber: candidate,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  if (witness === undefined) {
    throw new Error(
      "NO_REAL_GRANDPA_JUSTIFICATION_FOUND_IN_PROBE_WINDOW",
    );
  }

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

  const transitionProbeLog: Array<{
    blockNumber: number;
    hash?: string;
    found?: boolean;
    error?: string;
  }> = [];

  for (const candidate of transitionCandidates(finalizedHeight)) {
    try {
      const block = await getBlockByNumber(candidate);
      const selection = extractSelectionInputsHash(
        block.signed.block.extrinsics,
      );

      transitionProbeLog.push({
        blockNumber: candidate,
        hash: block.hash,
        found: selection !== null,
      });

      if (selection !== null) {
        transitionWitness = {
          blockNumber: candidate,
          blockHash: block.hash,
          extrinsicIndex: selection.extrinsicIndex,
          extrinsicHex: selection.extrinsicHex,
          selectionInputsHash:
            selection.selectionInputsHash,
          finalityEvidenceOnSameBlock:
            extractGrandpaJustification(block.signed) !== null,
        };
        break;
      }
    } catch (error) {
      transitionProbeLog.push({
        blockNumber: candidate,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
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
      justification: justificationProbeLog,
      transition: transitionProbeLog,
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
