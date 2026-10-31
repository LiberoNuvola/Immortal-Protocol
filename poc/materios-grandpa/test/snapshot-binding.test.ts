import { describe, expect, it } from "vitest";
import {
  isValidSnapshotStateProbeEvidence,
  sameSubstrateHeader,
} from "../src/snapshot-binding.js";

const expected = {
  chainId: "materios_preprod_v6",
  genesisHash: "0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf",
  authorityRpc: "http://127.0.0.1:9945",
  blockNumber: 2509824,
  blockHash: "0x" + "ab".repeat(32),
};

const evidence = {
  schema_version: "materios-snapshot-state-probe-v1",
  status: "PASS",
  classification: "SNAPSHOT_WINDOW_HISTORICAL_STATE_QUERY_PASS",
  network: expected.chainId,
  genesis_hash: expected.genesisHash,
  local_rpc_url: expected.authorityRpc,
  snapshot: { requested_pruning_mode: "Constrained(256)" },
  target: { block_number: expected.blockNumber, expected_block_hash: expected.blockHash },
  trust_boundary: "Isolated FULL-role diagnostic; no peers, no block import.",
};

const header = {
  parentHash: "0x" + "01".repeat(32),
  number: "0x00263800",
  stateRoot: "0x" + "02".repeat(32),
  extrinsicsRoot: "0x" + "03".repeat(32),
  digest: { logs: ["0x0102", "0xAABB"] },
};

describe("snapshot-bound historical candidate", () => {
  it("accepts only the exact successful isolated snapshot probe", () => {
    expect(isValidSnapshotStateProbeEvidence(evidence, expected)).toBe(true);
  });

  it.each([
    ["failed status", { ...evidence, status: "FAIL" }],
    ["wrong block number", { ...evidence, target: { ...evidence.target, block_number: 2509823 } }],
    ["wrong block hash", { ...evidence, target: { ...evidence.target, expected_block_hash: "0x" + "cd".repeat(32) } }],
    ["wrong genesis", { ...evidence, genesis_hash: "0x" + "ef".repeat(32) }],
    ["wrong rpc", { ...evidence, local_rpc_url: "https://remote.example/rpc" }],
    ["wrong pruning mode", { ...evidence, snapshot: { requested_pruning_mode: "ArchiveAll" } }],
    ["not isolated", { ...evidence, trust_boundary: "Peers connected and blocks imported." }],
  ])("rejects %s", (_label, mutated) => {
    expect(isValidSnapshotStateProbeEvidence(mutated, expected)).toBe(false);
  });

  it("compares Substrate header fields case-insensitively for hashes", () => {
    const upper = {
      ...header,
      parentHash: header.parentHash.toUpperCase().replace("0X", "0x"),
      stateRoot: header.stateRoot.toUpperCase().replace("0X", "0x"),
      extrinsicsRoot: header.extrinsicsRoot.toUpperCase().replace("0X", "0x"),
    };
    expect(sameSubstrateHeader(header, upper)).toBe(true);
  });

  it("rejects a header whose state root or digest differs", () => {
    expect(sameSubstrateHeader(header, { ...header, stateRoot: "0x" + "04".repeat(32) })).toBe(false);
    expect(sameSubstrateHeader(header, { ...header, digest: { logs: ["0x0102"] } })).toBe(false);
  });
});
