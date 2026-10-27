import {
  findAuthority,
  totalAuthorityWeight,
  validateAuthorityState,
  type TrustedAuthorityState
} from "./authority.js";

import {
  verifyEd25519,
  type Ed25519Verifier
} from "./crypto.js";

import {
  encodeLocalizedPrecommitPayload,
  hasGrandpaQuorum,
  type GrandpaJustification
} from "./grandpa.js";

import {
  bytesToHex,
  equalBytes
} from "./scale.js";

import {
  verifyHeaderEvidence,
  type GrandpaAncestryHeader,
  type VerifiedHeader
} from "./ancestry.js";

export interface CanonicalCheckpoint {
  chainId: string;
  genesisHash: Uint8Array;
  blockHash: Uint8Array;
  blockNumber: bigint;
}

export type VerificationErrorCode =
  | "INVALID_AUTHORITY_STATE"
  | "CHAIN_ID_MISMATCH"
  | "GENESIS_HASH_MISMATCH"
  | "SET_ID_MISMATCH"
  | "TARGET_HASH_MISMATCH"
  | "TARGET_NUMBER_MISMATCH"
  | "INVALID_SIGNER"
  | "UNKNOWN_AUTHORITY"
  | "DUPLICATE_SIGNER"
  | "INVALID_SIGNATURE"
  | "INSUFFICIENT_WEIGHT"
  | "INVALID_ANCESTRY"
  | "ANCESTRY_NOT_VERIFIED"
  | "DUPLICATE_ANCESTRY_HEADER"
  | "REDUNDANT_ANCESTRY_HEADER"
  | "PRECOMMIT_TARGET_MISSING"
  | "PRECOMMIT_TARGET_NUMBER_MISMATCH"
  | "PRECOMMIT_TARGET_NOT_DESCENDANT";

export class VerificationError extends Error {
  readonly code: VerificationErrorCode;

  constructor(
    code: VerificationErrorCode,
    message = code
  ) {
    super(message);
    this.name = "VerificationError";
    this.code = code;
  }
}

export interface VerificationResult {
  verified: true;
  chainId: string;
  genesisHash: Uint8Array;
  targetHash: Uint8Array;
  targetNumber: bigint;
  round: bigint;
  setId: bigint;
  signedWeight: bigint;
  totalWeight: bigint;
}

export interface VerificationOptions {
  verifyAncestry: boolean;
}

/**
 * Verify that every GRANDPA precommit target is structurally connected to the
 * commit target through the supplied vote ancestry headers.
 *
 * This is deliberately exported for FinalityProof verification; it does not
 * alter the existing verifier's authority-set trust boundary.
 */
export function verifyJustificationAncestry(
  justification: GrandpaJustification
): void {
  verifyPrecommitAncestry(
    justification.votesAncestries,
    justification.commit.precommits,
    justification.commit.targetHash,
    justification.commit.targetNumber
  );
}

/**
 * Verify the ancestry semantics of a GRANDPA justification.
 *
 * Materios uses the standard Substrate GRANDPA justification shape:
 * `votesAncestries` contains the headers needed to connect precommit targets
 * to the commit target. The commit target itself is the base and is therefore
 * not required to appear in `votesAncestries`.
 *
 * A precommit on the commit target is valid without an ancestry header. A
 * precommit on a descendant must have every intermediate header required to
 * walk back to the commit target. Headers may be shared by several routes.
 *
 * This mirrors the upstream AncestryChain model: duplicate ancestry headers
 * are invalid, and headers that are not consumed by a successful route are
 * redundant in strict verification.
 */
function verifyPrecommitAncestry(
  headers: readonly GrandpaAncestryHeader[] | undefined,
  precommits: GrandpaJustification["commit"]["precommits"],
  baseHash: Uint8Array,
  baseNumber: bigint
): void {
  if (baseHash.length !== 32) {
    throw new VerificationError("TARGET_HASH_MISMATCH");
  }

  if (baseNumber < 0n || baseNumber > 0xffffffffn) {
    throw new VerificationError("TARGET_NUMBER_MISMATCH");
  }

  const evidence = headers ?? [];
  const verified = new Map<string, VerifiedHeader>();

  for (const header of evidence) {
    let checked: VerifiedHeader;

    try {
      checked = verifyHeaderEvidence(header);
    } catch {
      throw new VerificationError("INVALID_ANCESTRY");
    }

    const key = bytesToHex(checked.hash);

    if (verified.has(key)) {
      throw new VerificationError("DUPLICATE_ANCESTRY_HEADER");
    }

    verified.set(key, checked);
  }

  const used = new Set<string>();

  for (const signed of precommits) {
    const targetHash = signed.precommit.targetHash;
    const targetNumber = signed.precommit.targetNumber;

    if (targetHash.length !== 32) {
      throw new VerificationError("PRECOMMIT_TARGET_MISSING");
    }

    if (targetNumber < 0n || targetNumber > 0xffffffffn) {
      throw new VerificationError("PRECOMMIT_TARGET_NUMBER_MISMATCH");
    }

    if (equalBytes(targetHash, baseHash)) {
      if (targetNumber !== baseNumber) {
        throw new VerificationError(
          "PRECOMMIT_TARGET_NUMBER_MISMATCH"
        );
      }

      continue;
    }

    if (targetNumber < baseNumber) {
      throw new VerificationError(
        "PRECOMMIT_TARGET_NOT_DESCENDANT"
      );
    }

    let currentHash = targetHash;
    let currentNumber = targetNumber;
    const routeSeen = new Set<string>();

    while (!equalBytes(currentHash, baseHash)) {
      const key = bytesToHex(currentHash);

      if (routeSeen.has(key)) {
        throw new VerificationError("INVALID_ANCESTRY");
      }
      routeSeen.add(key);

      const header = verified.get(key);

      if (!header) {
        throw new VerificationError(
          "PRECOMMIT_TARGET_NOT_DESCENDANT"
        );
      }

      if (header.number !== currentNumber) {
        throw new VerificationError(
          "PRECOMMIT_TARGET_NUMBER_MISMATCH"
        );
      }

      used.add(key);

      const parentNumber = currentNumber - 1n;
      if (parentNumber < baseNumber) {
        throw new VerificationError(
          "PRECOMMIT_TARGET_NOT_DESCENDANT"
        );
      }

      currentHash = header.parentHash;
      currentNumber = parentNumber;

      if (equalBytes(currentHash, baseHash)) {
        if (currentNumber !== baseNumber) {
          throw new VerificationError(
            "PRECOMMIT_TARGET_NUMBER_MISMATCH"
          );
        }
        break;
      }
    }
  }

  for (const key of verified.keys()) {
    if (!used.has(key)) {
      throw new VerificationError("REDUNDANT_ANCESTRY_HEADER");
    }
  }
}

function snapshotCheckpoint(input: CanonicalCheckpoint): CanonicalCheckpoint {
  return {
    chainId: input.chainId,
    genesisHash: new Uint8Array(input.genesisHash),
    blockHash: new Uint8Array(input.blockHash),
    blockNumber: input.blockNumber
  };
}

function snapshotTrustedAuthorityState(input: TrustedAuthorityState): TrustedAuthorityState {
  return {
    chainId: input.chainId,
    genesisHash: new Uint8Array(input.genesisHash),
    setId: input.setId,
    authorities: input.authorities.map(authority => ({
      publicKey: new Uint8Array(authority.publicKey),
      weight: authority.weight
    }))
  };
}

function snapshotJustification(input: GrandpaJustification): GrandpaJustification {
  return {
    round: input.round,
    commit: {
      targetHash: new Uint8Array(input.commit.targetHash),
      targetNumber: input.commit.targetNumber,
      precommits: input.commit.precommits.map(signed => ({
        precommit: {
          targetHash: new Uint8Array(signed.precommit.targetHash),
          targetNumber: signed.precommit.targetNumber
        },
        signer: new Uint8Array(signed.signer),
        signature: new Uint8Array(signed.signature)
      }))
    },
    votesAncestries: (input.votesAncestries ?? []).map(header => ({
      hash: new Uint8Array(header.hash),
      parentHash: new Uint8Array(header.parentHash),
      number: header.number,
      stateRoot: new Uint8Array(header.stateRoot),
      extrinsicsRoot: new Uint8Array(header.extrinsicsRoot),
      digest: {
        logs: header.digest.logs.map(log => {
          if (log.kind === "RuntimeEnvironmentUpdated") return { kind: log.kind };
          if (log.kind === "Other") return { kind: log.kind, data: new Uint8Array(log.data) };
          return { kind: log.kind, engineId: new Uint8Array(log.engineId), data: new Uint8Array(log.data) };
        })
      },
      rawHeader: new Uint8Array(header.rawHeader),
      encoding: header.encoding
    }))
  };
}

export async function verifyFinality(
  checkpointInput: CanonicalCheckpoint,
  justificationInput: GrandpaJustification,
  trustedInput: TrustedAuthorityState,
  crypto: Ed25519Verifier,
  optionsInput: VerificationOptions
): Promise<VerificationResult> {
  // Match Orynq's immutable-input hardening: own every verification input
  // before the first asynchronous signature check can yield control.
  const checkpoint = snapshotCheckpoint(checkpointInput);
  const justification = snapshotJustification(justificationInput);
  const trusted = snapshotTrustedAuthorityState(trustedInput);
  const options = { verifyAncestry: optionsInput.verifyAncestry };

  try {
    validateAuthorityState(trusted);
  } catch {
    throw new VerificationError(
      "INVALID_AUTHORITY_STATE"
    );
  }

  if (
    checkpoint.chainId !==
    trusted.chainId
  ) {
    throw new VerificationError(
      "CHAIN_ID_MISMATCH"
    );
  }

  if (
    !equalBytes(
      checkpoint.genesisHash,
      trusted.genesisHash
    )
  ) {
    throw new VerificationError(
      "GENESIS_HASH_MISMATCH"
    );
  }

  /*
   * PoC-1A deliberately gets set_id only
   * from trusted authority state.
   *
   * There is no justification.setId field
   * to trust.
   */
  const setId = trusted.setId;

  if (
    checkpoint.blockHash.length !== 32 ||
    justification.commit.targetHash.length !== 32
  ) {
    throw new VerificationError(
      "TARGET_HASH_MISMATCH"
    );
  }

  if (
    !equalBytes(
      justification.commit.targetHash,
      checkpoint.blockHash
    )
  ) {
    throw new VerificationError(
      "TARGET_HASH_MISMATCH"
    );
  }

  if (
    justification.commit.targetNumber !==
    checkpoint.blockNumber
  ) {
    throw new VerificationError(
      "TARGET_NUMBER_MISMATCH"
    );
  }

  let signedWeight = 0n;

  const totalWeight =
    totalAuthorityWeight(trusted);

  const seen = new Set<string>();

  for (
    const signed of
    justification.commit.precommits
  ) {
    if (
      signed.signer.length !== 32
    ) {
      throw new VerificationError(
        "INVALID_SIGNER"
      );
    }

    if (
      signed.signature.length !== 64
    ) {
      throw new VerificationError(
        "INVALID_SIGNATURE"
      );
    }

    const signerId =
      bytesToHex(signed.signer);

    if (
      seen.has(signerId)
    ) {
      throw new VerificationError(
        "DUPLICATE_SIGNER"
      );
    }

    seen.add(signerId);

    const authority =
      findAuthority(
        trusted,
        signed.signer
      );

    if (!authority) {
      throw new VerificationError(
        "UNKNOWN_AUTHORITY"
      );
    }

    const payload =
      encodeLocalizedPrecommitPayload(
        signed.precommit,
        justification.round,
        setId
      );

    const valid =
      await verifyEd25519(
        crypto,
        signed.signer,
        signed.signature,
        payload
      );

    if (!valid) {
      throw new VerificationError(
        "INVALID_SIGNATURE"
      );
    }

    signedWeight += authority.weight;
  }

  if (
    !hasGrandpaQuorum(
      signedWeight,
      totalWeight
    )
  ) {
    throw new VerificationError(
      "INSUFFICIENT_WEIGHT"
    );
  }

  /*
   * A successful signature + quorum check
   * is NOT enough for finality when ancestry
   * verification has been requested.
   */
  if (options.verifyAncestry) {
    verifyPrecommitAncestry(
      justification.votesAncestries,
      justification.commit.precommits,
      justification.commit.targetHash,
      justification.commit.targetNumber
    );

    /*
     * The ancestry and precommit-target
     * relationships are now structurally
     * verified.
     *
     * Authority-set authentication remains a
     * separate proof obligation, enforced at the
     * TrustedAuthorityState construction boundary.
     */
  }

  return {
    verified: true,
    chainId: trusted.chainId,
    genesisHash: trusted.genesisHash,
    targetHash: checkpoint.blockHash,
    targetNumber: checkpoint.blockNumber,
    round: justification.round,
    setId,
    signedWeight,
    totalWeight
  };
}
