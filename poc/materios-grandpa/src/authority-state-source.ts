export type GrandpaAuthorityStateMethod =
  | "GrandpaApi_current_set_id"
  | "GrandpaApi_grandpa_authorities";

export interface ParentAuthorityReadClient {
  chainGetBlockHash(blockNumber: number): Promise<string>;
  chainGetHeader(blockHash: string): Promise<{ number: string }>;
  stateCall(
    method: GrandpaAuthorityStateMethod,
    atBlockHash: string,
  ): Promise<string>;
}

export interface ExactParentAuthorityState {
  readonly blockNumber: bigint;
  readonly blockHash: string;
  readonly setIdHex: string;
  readonly authoritiesHex: string;
}

function normalizeHash(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^0x[0-9a-f]{64}$/i.test(value)) {
    throw new Error(field + ": expected 32-byte hash");
  }
  return value.toLowerCase();
}

function parseBlockNumber(value: unknown, field: string): bigint {
  if (typeof value !== "string") {
    throw new Error(field + ": invalid block number");
  }
  if (/^0x[0-9a-f]+$/i.test(value) || /^\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new Error(field + ": invalid block number");
}

/**
 * Reads the GRANDPA authority state that finalized target block B.
 *
 * GRANDPA's authority set for a justification targeting B is the set in
 * the exact parent state B-1. The parent hash is cross-checked against the
 * height lookup and the returned parent header before any state call is made.
 *
 * This function has deliberately no target-state or current-head fallback.
 * Any unavailable/mismatched parent evidence rejects the capture.
 */
export async function readExactParentAuthorityState(
  targetBlockNumber: bigint,
  parentHashInput: string,
  client: ParentAuthorityReadClient,
): Promise<ExactParentAuthorityState> {
  if (targetBlockNumber <= 0n) {
    throw new Error("TARGET_BLOCK_NUMBER_MUST_BE_POSITIVE");
  }

  const parentNumber = targetBlockNumber - 1n;
  if (parentNumber > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("PARENT_BLOCK_NUMBER_UNSAFE");
  }

  const parentHash = normalizeHash(parentHashInput, "parent hash");

  const hashAtParentHeight = normalizeHash(
    await client.chainGetBlockHash(Number(parentNumber)),
    "parent height block hash",
  );
  if (hashAtParentHeight !== parentHash) {
    throw new Error("PARENT_HASH_MISMATCH");
  }

  const parentHeader = await client.chainGetHeader(parentHash);
  const returnedParentNumber = parseBlockNumber(
    parentHeader?.number,
    "parent header number",
  );
  if (returnedParentNumber !== parentNumber) {
    throw new Error("PARENT_HEADER_NUMBER_MISMATCH");
  }

  const [setIdHex, authoritiesHex] = await Promise.all([
    client.stateCall("GrandpaApi_current_set_id", parentHash),
    client.stateCall("GrandpaApi_grandpa_authorities", parentHash),
  ]);

  if (typeof setIdHex !== "string" || !/^0x[0-9a-f]*$/i.test(setIdHex)) {
    throw new Error("PARENT_STATE_SET_ID_RESPONSE_INVALID");
  }
  if (
    typeof authoritiesHex !== "string" ||
    !/^0x[0-9a-f]*$/i.test(authoritiesHex)
  ) {
    throw new Error("PARENT_STATE_AUTHORITIES_RESPONSE_INVALID");
  }

  return {
    blockNumber: parentNumber,
    blockHash: parentHash,
    setIdHex,
    authoritiesHex,
  };
}
