import {
  concatBytes,
  encodeCompact,
  encodeU32,
  encodeU64,
  ScaleDecodeError,
  ScaleReader
} from "./scale.js";

import {
  decodeMateriosHeaderFromReader,
  type GrandpaAncestryHeader
} from "./ancestry.js";

export interface GrandpaPrecommit {
  targetHash: Uint8Array;
  targetNumber: bigint;
}

export interface GrandpaSignedPrecommit {
  precommit: GrandpaPrecommit;
  signer: Uint8Array;
  signature: Uint8Array;
}

export interface GrandpaCommit {
  targetHash: Uint8Array;
  targetNumber: bigint;
  precommits: GrandpaSignedPrecommit[];
}

export interface GrandpaJustification {
  readonly round: bigint;
  readonly commit: GrandpaCommit;
  readonly votesAncestries?: readonly GrandpaAncestryHeader[];
}

export const MAX_GRANDPA_PRECOMMITS = 10_000;
export const MAX_GRANDPA_ANCESTRY_HEADERS = 10_000;

/**
 * Materios uses the standard finality-grandpa Message encoding.
 *
 * Message::Precommit has SCALE enum discriminant 1, followed by:
 *   - target_hash: H256, 32 bytes
 *   - target_number: BlockNumber, u32 little-endian
 */
export function encodeGrandpaPrecommitMessage(
  precommit: GrandpaPrecommit
): Uint8Array {
  if (precommit.targetHash.length !== 32) {
    throw new Error("INVALID_PRECOMMIT_TARGET_HASH");
  }

  if (
    precommit.targetNumber < 0n ||
    precommit.targetNumber > 0xffffffffn
  ) {
    throw new Error("INVALID_PRECOMMIT_TARGET_NUMBER");
  }

  return concatBytes(
    Uint8Array.of(1),
    precommit.targetHash,
    encodeU32(precommit.targetNumber)
  );
}

/**
 * Exact GRANDPA localized signing payload used by Materios.
 *
 * sp_consensus_grandpa constructs:
 *
 *   (message, round, set_id).encode()
 *
 * and signs those bytes directly with the GRANDPA ed25519 key.
 *
 * There is no additional Blake2 hash in this function.
 */
export function encodeLocalizedPrecommitPayload(
  precommit: GrandpaPrecommit,
  round: bigint,
  setId: bigint
): Uint8Array {
  if (
    round < 0n ||
    round > 0xffffffffffffffffn
  ) {
    throw new Error("INVALID_ROUND");
  }

  if (
    setId < 0n ||
    setId > 0xffffffffffffffffn
  ) {
    throw new Error("INVALID_SET_ID");
  }

  return concatBytes(
    encodeGrandpaPrecommitMessage(precommit),
    encodeU64(round),
    encodeU64(setId)
  );
}

/**
 * Decode the standard SCALE GRANDPA justification emitted by Substrate.
 *
 * Layout:
 *   round: u64
 *   commit:
 *     target_hash: H256
 *     target_number: BlockNumber (u32)
 *     precommits: Vec<SignedPrecommit>
 *   votes_ancestries: Vec<Header>
 *
 * The bytes are untrusted transport evidence. Signature, quorum and ancestry
 * semantics are verified separately by the GRANDPA verifier.
 */
export function decodeGrandpaJustification(
  encoded: Uint8Array
): GrandpaJustification {
  const reader = new ScaleReader(encoded);

  try {
    const round = reader.readU64();

    const targetHash =
      reader.readBytes(32);

    const targetNumber =
      reader.readU32();

    const precommitCount =
      readBoundedCompactCount(
        reader,
        MAX_GRANDPA_PRECOMMITS,
        "TOO_MANY_GRANDPA_PRECOMMITS"
      );

    const precommits:
      GrandpaSignedPrecommit[] = [];

    for (
      let index = 0;
      index < precommitCount;
      index++
    ) {
      const precommitTargetHash =
        reader.readBytes(32);

      const precommitTargetNumber =
        reader.readU32();

      const signature =
        reader.readBytes(64);

      const signer =
        reader.readBytes(32);

      precommits.push({
        precommit: {
          targetHash:
            precommitTargetHash,
          targetNumber:
            precommitTargetNumber
        },
        signer,
        signature
      });
    }

    const ancestryCount =
      readBoundedCompactCount(
        reader,
        MAX_GRANDPA_ANCESTRY_HEADERS,
        "TOO_MANY_GRANDPA_ANCESTRY_HEADERS"
      );

    const votesAncestries:
      GrandpaAncestryHeader[] = [];

    for (
      let index = 0;
      index < ancestryCount;
      index++
    ) {
      votesAncestries.push(
        decodeMateriosHeaderFromReader(
          reader
        )
      );
    }

    reader.assertEof();

    return {
      round,
      commit: {
        targetHash,
        targetNumber,
        precommits
      },
      votesAncestries
    };
  } catch (error) {
    if (error instanceof ScaleDecodeError) {
      throw error;
    }

    throw new ScaleDecodeError(
      "MALFORMED_GRANDPA_JUSTIFICATION"
    );
  }
}

/**
 * Re-encode a decoded justification using the canonical SCALE representation.
 *
 * This is used only for transport decoding conformance and diagnostics.
 * It does not confer any trust on the evidence.
 */
export function encodeGrandpaJustification(
  justification: GrandpaJustification
): Uint8Array {
  if (
    justification.commit.targetHash.length !== 32
  ) {
    throw new Error("INVALID_COMMIT_TARGET_HASH");
  }

  if (
    justification.commit.targetNumber < 0n ||
    justification.commit.targetNumber > 0xffffffffn
  ) {
    throw new Error("INVALID_COMMIT_TARGET_NUMBER");
  }

  if (
    justification.commit.precommits.length >
    MAX_GRANDPA_PRECOMMITS
  ) {
    throw new Error("TOO_MANY_GRANDPA_PRECOMMITS");
  }

  const encodedPrecommits =
    justification.commit.precommits.map(
      signed => {
        if (
          signed.precommit.targetHash.length !==
          32
        ) {
          throw new Error(
            "INVALID_PRECOMMIT_TARGET_HASH"
          );
        }

        if (
          signed.precommit.targetNumber < 0n ||
          signed.precommit.targetNumber >
            0xffffffffn
        ) {
          throw new Error(
            "INVALID_PRECOMMIT_TARGET_NUMBER"
          );
        }

        if (
          signed.signature.length !== 64
        ) {
          throw new Error(
            "INVALID_PRECOMMIT_SIGNATURE"
          );
        }

        if (
          signed.signer.length !== 32
        ) {
          throw new Error(
            "INVALID_PRECOMMIT_SIGNER"
          );
        }

        return concatBytes(
          signed.precommit.targetHash,
          encodeU32(
            signed.precommit.targetNumber
          ),
          signed.signature,
          signed.signer
        );
      }
    );

  const ancestries =
    justification.votesAncestries ?? [];

  if (
    ancestries.length >
    MAX_GRANDPA_ANCESTRY_HEADERS
  ) {
    throw new Error(
      "TOO_MANY_GRANDPA_ANCESTRY_HEADERS"
    );
  }

  return concatBytes(
    encodeU64(justification.round),
    justification.commit.targetHash,
    encodeU32(
      justification.commit.targetNumber
    ),
    encodeCompact(
      BigInt(
        encodedPrecommits.length
      )
    ),
    ...encodedPrecommits,
    encodeCompact(
      BigInt(ancestries.length)
    ),
    ...ancestries.map(
      header => header.rawHeader
    )
  );
}

function readBoundedCompactCount(
  reader: ScaleReader,
  maximum: number,
  errorCode: string
): number {
  const before =
    reader.position;

  const value =
    reader.readCompact();

  const consumed =
    reader.position - before;

  if (
    consumed !==
    encodeCompact(value).length
  ) {
    throw new ScaleDecodeError(
      "NON_CANONICAL_COMPACT"
    );
  }

  if (
    value >
    BigInt(maximum)
  ) {
    throw new ScaleDecodeError(
      errorCode
    );
  }

  if (
    value >
    BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new ScaleDecodeError(
      "COMPACT_COUNT_NOT_SAFE"
    );
  }

  return Number(value);
}

export function hasGrandpaQuorum(
  signedWeight: bigint,
  totalWeight: bigint
): boolean {
  if (signedWeight < 0n) {
    return false;
  }

  if (totalWeight <= 0n) {
    return false;
  }

  if (signedWeight > totalWeight) {
    return false;
  }

  /*
   * Strictly greater than 2/3:
   *
   * signed / total > 2 / 3
   *
   * => 3 * signed > 2 * total
   *
   * Everything stays as bigint.
   */
  return (
    3n * signedWeight >
    2n * totalWeight
  );
}
