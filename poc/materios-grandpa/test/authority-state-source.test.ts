import { describe, expect, it, vi } from "vitest";

import {
  readExactParentAuthorityState,
  type GrandpaAuthorityStateMethod,
  type ParentAuthorityReadClient,
} from "../src/authority-state-source.js";

const PARENT_HASH = "0x" + "ab".repeat(32);
const OTHER_HASH = "0x" + "cd".repeat(32);
const SET_ID_HEX = "0x0100000000000000";
const AUTHORITIES_HEX = "0x00";

function client(
  overrides: Partial<ParentAuthorityReadClient> = {},
): ParentAuthorityReadClient {
  return {
    chainGetBlockHash: vi.fn(async () => PARENT_HASH),
    chainGetHeader: vi.fn(async () => ({ number: "0x64" })),
    stateCall: vi.fn(async (method: GrandpaAuthorityStateMethod) =>
      method === "GrandpaApi_current_set_id"
        ? SET_ID_HEX
        : AUTHORITIES_HEX,
    ),
    ...overrides,
  };
}

describe("readExactParentAuthorityState", () => {
  it("uses only the exact B-1 hash for both GRANDPA runtime API reads", async () => {
    const rpc = client();

    const result = await readExactParentAuthorityState(
      101n,
      PARENT_HASH,
      rpc,
    );

    expect(rpc.chainGetBlockHash).toHaveBeenCalledTimes(1);
    expect(rpc.chainGetBlockHash).toHaveBeenCalledWith(100);
    expect(rpc.chainGetHeader).toHaveBeenCalledTimes(1);
    expect(rpc.chainGetHeader).toHaveBeenCalledWith(PARENT_HASH);
    expect(rpc.stateCall).toHaveBeenNthCalledWith(
      1,
      "GrandpaApi_current_set_id",
      PARENT_HASH,
    );
    expect(rpc.stateCall).toHaveBeenNthCalledWith(
      2,
      "GrandpaApi_grandpa_authorities",
      PARENT_HASH,
    );
    expect(result).toEqual({
      blockNumber: 100n,
      blockHash: PARENT_HASH,
      setIdHex: SET_ID_HEX,
      authoritiesHex: AUTHORITIES_HEX,
    });
  });

  it("fails closed before state calls when the B-1 height resolves to another hash", async () => {
    const stateCall = vi.fn(async () => SET_ID_HEX);
    const rpc = client({
      chainGetBlockHash: vi.fn(async () => OTHER_HASH),
      stateCall,
    });

    await expect(
      readExactParentAuthorityState(101n, PARENT_HASH, rpc),
    ).rejects.toThrow("PARENT_HASH_MISMATCH");
    expect(stateCall).not.toHaveBeenCalled();
  });

  it("fails closed when the header at the parent hash reports the wrong height", async () => {
    const stateCall = vi.fn(async () => SET_ID_HEX);
    const rpc = client({
      chainGetHeader: vi.fn(async () => ({ number: "0x65" })),
      stateCall,
    });

    await expect(
      readExactParentAuthorityState(101n, PARENT_HASH, rpc),
    ).rejects.toThrow("PARENT_HEADER_NUMBER_MISMATCH");
    expect(stateCall).not.toHaveBeenCalled();
  });

  it("does not fall back when historical parent state is unavailable", async () => {
    const stateCall = vi.fn(async () => {
      throw new Error("RPC state already discarded");
    });
    const rpc = client({ stateCall });

    await expect(
      readExactParentAuthorityState(101n, PARENT_HASH, rpc),
    ).rejects.toThrow("RPC state already discarded");
    expect(stateCall).toHaveBeenCalledTimes(2);
    expect(stateCall).toHaveBeenCalledWith(
      "GrandpaApi_current_set_id",
      PARENT_HASH,
    );
    expect(stateCall).toHaveBeenCalledWith(
      "GrandpaApi_grandpa_authorities",
      PARENT_HASH,
    );
  });
});
