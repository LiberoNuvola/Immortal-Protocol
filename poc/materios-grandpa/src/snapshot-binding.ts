export type SnapshotProbeExpected = {
  chainId: string;
  genesisHash: string;
  authorityRpc: string;
  blockNumber: number;
  blockHash: string;
};

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedHash(value: unknown): string | null {
  return typeof value === "string" && /^0x[0-9a-f]{64}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

function normalizedNumber(value: unknown): string | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
  if (typeof value === "string" && /^0x[0-9a-f]+$/i.test(value)) {
    return BigInt(value).toString();
  }
  return null;
}

export function isValidSnapshotStateProbeEvidence(
  evidence: unknown,
  expected: SnapshotProbeExpected,
): boolean {
  if (!isRecord(evidence)) return false;
  const snapshot = isRecord(evidence.snapshot) ? evidence.snapshot : null;
  const target = isRecord(evidence.target) ? evidence.target : null;
  const trustBoundary = typeof evidence.trust_boundary === "string"
    ? evidence.trust_boundary.toLowerCase()
    : "";
  if (!snapshot || !target) return false;

  const rpcIsLoopback = /^http:\/\/127\.0\.0\.1:\d+$/.test(expected.authorityRpc);
  return (
    rpcIsLoopback &&
    evidence.schema_version === "materios-snapshot-state-probe-v1" &&
    evidence.status === "PASS" &&
    evidence.classification === "SNAPSHOT_WINDOW_HISTORICAL_STATE_QUERY_PASS" &&
    evidence.network === expected.chainId &&
    normalizedHash(evidence.genesis_hash) === normalizedHash(expected.genesisHash) &&
    evidence.local_rpc_url === expected.authorityRpc &&
    snapshot.requested_pruning_mode === "Constrained(256)" &&
    normalizedNumber(target.block_number) === String(expected.blockNumber) &&
    normalizedHash(target.expected_block_hash) === normalizedHash(expected.blockHash) &&
    trustBoundary.includes("no peers") &&
    trustBoundary.includes("no block import")
  );
}

export function sameSubstrateHeader(a: unknown, b: unknown): boolean {
  if (!isRecord(a) || !isRecord(b)) return false;
  const digestA = isRecord(a.digest) ? a.digest.logs : null;
  const digestB = isRecord(b.digest) ? b.digest.logs : null;
  if (!Array.isArray(digestA) || !Array.isArray(digestB)) return false;
  const logsA = digestA.map((entry) => typeof entry === "string" ? entry.toLowerCase() : null);
  const logsB = digestB.map((entry) => typeof entry === "string" ? entry.toLowerCase() : null);
  return (
    normalizedHash(a.parentHash) !== null &&
    normalizedHash(a.parentHash) === normalizedHash(b.parentHash) &&
    normalizedNumber(a.number) !== null &&
    normalizedNumber(a.number) === normalizedNumber(b.number) &&
    normalizedHash(a.stateRoot) !== null &&
    normalizedHash(a.stateRoot) === normalizedHash(b.stateRoot) &&
    normalizedHash(a.extrinsicsRoot) !== null &&
    normalizedHash(a.extrinsicsRoot) === normalizedHash(b.extrinsicsRoot) &&
    JSON.stringify(logsA) === JSON.stringify(logsB)
  );
}
