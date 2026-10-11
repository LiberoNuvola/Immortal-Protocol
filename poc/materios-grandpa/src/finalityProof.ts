import {
  decodeGrandpaJustification
} from "./grandpa.js";

import {
  decodeMateriosHeaderFromReader,
  verifyHeaderEvidence,
  type GrandpaAncestryHeader,
  type VerifiedHeader
} from "./ancestry.js";

import {
  bytesToHex,
  equalBytes,
  ScaleDecodeError,
  ScaleReader,
  encodeCompact
} from "./scale.js";

import {
  verifyFinality,
  verifyJustificationAncestry,
  type CanonicalCheckpoint,
  type VerificationResult
} from "./verifier.js";

import type {
  TrustedAuthorityState
} from "./authority.js";

import type {
  Ed25519Verifier
} from "./crypto.js";

/**
 * Standard Substrate sc_consensus_grandpa::FinalityProof<Header> transport:
 *   block: Header::Hash
 *   justification: Vec<u8>
 *   unknown_headers: Vec<Header>
 *
 * The bytes are untrusted evidence until the inner justification and the
 * checkpoint-to-finalized-target ancestry are independently verified.
 */
export interface GrandpaFinalityProof {
  readonly block: Uint8Array;
  readonly justification: Uint8Array;
  readonly unknownHeaders: readonly GrandpaAncestryHeader[];
}

export interface FinalityProofVerificationResult {
  readonly verified: true;
  readonly checkpoint: CanonicalCheckpoint;
  readonly finalizedBlock: VerificationResult;
}

/**
 * Decode a standard SCALE FinalityProof without assigning trust to its source.
 */
export function decodeFinalityProof(
  encoded: Uint8Array
): GrandpaFinalityProof {
  const reader =
    new ScaleReader(encoded);

  try {
    const block =
      reader.readBytes(32);

    const justification =
      readBoundedBytes(
        reader,
        8 * 1024 * 1024,
        "FINALITY_JUSTIFICATION_TOO_LARGE"
      );

    const headerCount =
      readBoundedCount(
        reader,
        100_000,
        "FINALITY_UNKNOWN_HEADERS_TOO_MANY"
      );

    const unknownHeaders:
      GrandpaAncestryHeader[] = [];

    for (
      let index = 0;
      index < headerCount;
      index++
    ) {
      unknownHeaders.push(
        decodeMateriosHeaderFromReader(
          reader
        )
      );
    }

    reader.assertEof();

    return {
      block,
      justification,
      unknownHeaders
    };
  } catch (error) {
    if (error instanceof ScaleDecodeError) {
      throw error;
    }

    throw new ScaleDecodeError(
      "MALFORMED_FINALITY_PROOF"
    );
  }
}

/**
 * Verify a decoded FinalityProof against an already authenticated authority
 * state and an exact IMMORTAL checkpoint.
 *
 * This verifies:
 *   1. outer FinalityProof target == inner GRANDPA justification target;
 *   2. inner signatures and quorum;
 *   3. inner precommit ancestry;
 *   4. outer unknown-header bridge from the requested checkpoint to the
 *      actually justified descendant.
 *
 * Authority-set provenance itself remains the responsibility of the trusted
 * authority-state boundary and is deliberately not invented here.
 */
export async function verifyFinalityProof(
  checkpoint: CanonicalCheckpoint,
  proof: GrandpaFinalityProof,
  trusted: TrustedAuthorityState,
  crypto: Ed25519Verifier
): Promise<FinalityProofVerificationResult> {
  if (proof.block.length !== 32) {
    throw new FinalityProofVerificationError(
      "INVALID_PROOF_BLOCK_HASH"
    );
  }

  const justification =
    decodeGrandpaJustification(
      proof.justification
    );

  if (
    !equalBytes(
      justification.commit.targetHash,
      proof.block
    )
  ) {
    throw new FinalityProofVerificationError(
      "JUSTIFICATION_TARGET_MISMATCH"
    );
  }

  const finalizedCheckpoint:
    CanonicalCheckpoint = {
    chainId:
      checkpoint.chainId,
    genesisHash:
      checkpoint.genesisHash,
    blockHash:
      proof.block,
    blockNumber:
      justification.commit.targetNumber
  };

  const finalizedBlock =
    await verifyFinality(
      finalizedCheckpoint,
      justification,
      trusted,
      crypto,
      {
        verifyAncestry: false
      }
    );

  verifyJustificationAncestry(
    justification
  );

  verifyCheckpointBridge(
    checkpoint,
    proof.block,
    justification.commit.targetNumber,
    proof.unknownHeaders
  );

  return {
    verified: true,
    checkpoint,
    finalizedBlock
  };
}

export type FinalityProofVerificationErrorCode =
  | "INVALID_PROOF_BLOCK_HASH"
  | "JUSTIFICATION_TARGET_MISMATCH"
  | "CHECKPOINT_BRIDGE_REQUIRED"
  | "CHECKPOINT_BRIDGE_TARGET_MISMATCH"
  | "CHECKPOINT_BRIDGE_BLOCK_NUMBER_MISMATCH"
  | "CHECKPOINT_BRIDGE_PARENT_MISMATCH"
  | "CHECKPOINT_BRIDGE_NON_SEQUENTIAL"
  | "CHECKPOINT_BRIDGE_DUPLICATE_HEADER"
  | "CHECKPOINT_BRIDGE_MALFORMED_HEADER"
  | "CHECKPOINT_BRIDGE_REDUNDANT_HEADER";

export class FinalityProofVerificationError
  extends Error {
  readonly code:
    FinalityProofVerificationErrorCode;

  constructor(
    code:
      FinalityProofVerificationErrorCode
  ) {
    super(code);
    this.name =
      "FinalityProofVerificationError";
    this.code = code;
  }
}

function verifyCheckpointBridge(
  checkpoint: CanonicalCheckpoint,
  finalizedHash: Uint8Array,
  finalizedNumber: bigint,
  unknownHeaders:
    readonly GrandpaAncestryHeader[]
): void {
  if (
    checkpoint.blockHash.length !== 32
  ) {
    throw new FinalityProofVerificationError(
      "CHECKPOINT_BRIDGE_TARGET_MISMATCH"
    );
  }

  if (
    checkpoint.blockNumber < 0n ||
    checkpoint.blockNumber >
      0xffffffffn
  ) {
    throw new FinalityProofVerificationError(
      "CHECKPOINT_BRIDGE_BLOCK_NUMBER_MISMATCH"
    );
  }

  if (
    equalBytes(
      checkpoint.blockHash,
      finalizedHash
    )
  ) {
    if (
      checkpoint.blockNumber !==
      finalizedNumber
    ) {
      throw new FinalityProofVerificationError(
        "CHECKPOINT_BRIDGE_BLOCK_NUMBER_MISMATCH"
      );
    }

    if (
      unknownHeaders.length !== 0
    ) {
      throw new FinalityProofVerificationError(
        "CHECKPOINT_BRIDGE_REDUNDANT_HEADER"
      );
    }

    return;
  }

  if (
    unknownHeaders.length === 0
  ) {
    throw new FinalityProofVerificationError(
      "CHECKPOINT_BRIDGE_REQUIRED"
    );
  }

  let previousHash =
    checkpoint.blockHash;

  let previousNumber =
    checkpoint.blockNumber;

  const seen =
    new Set<string>();

  for (
    const evidence of unknownHeaders
  ) {
    const key =
      bytesToHex(evidence.hash);

    if (
      seen.has(key)
    ) {
      throw new FinalityProofVerificationError(
        "CHECKPOINT_BRIDGE_DUPLICATE_HEADER"
      );
    }

    seen.add(key);

    let verified:
      VerifiedHeader;

    try {
      verified =
        verifyHeaderEvidence(
          evidence
        );
    } catch {
      throw new FinalityProofVerificationError(
        "CHECKPOINT_BRIDGE_MALFORMED_HEADER"
      );
    }

    if (
      verified.number !==
      previousNumber + 1n
    ) {
      throw new FinalityProofVerificationError(
        "CHECKPOINT_BRIDGE_NON_SEQUENTIAL"
      );
    }

    if (
      !equalBytes(
        verified.parentHash,
        previousHash
      )
    ) {
      throw new FinalityProofVerificationError(
        "CHECKPOINT_BRIDGE_PARENT_MISMATCH"
      );
    }

    previousHash =
      verified.hash;

    previousNumber =
      verified.number;
  }

  if (
    !equalBytes(
      previousHash,
      finalizedHash
    )
  ) {
    throw new FinalityProofVerificationError(
      "CHECKPOINT_BRIDGE_TARGET_MISMATCH"
    );
  }

  if (
    previousNumber !==
    finalizedNumber
  ) {
    throw new FinalityProofVerificationError(
      "CHECKPOINT_BRIDGE_BLOCK_NUMBER_MISMATCH"
    );
  }
}

function readBoundedBytes(
  reader: ScaleReader,
  maximum: number,
  errorCode: string
): Uint8Array {
  const before =
    reader.position;

  const length =
    reader.readCompact();

  const consumed =
    reader.position - before;

  if (
    consumed !==
    encodeCompact(length).length
  ) {
    throw new ScaleDecodeError(
      "NON_CANONICAL_COMPACT"
    );
  }

  if (
    length > BigInt(maximum)
  ) {
    throw new ScaleDecodeError(
      errorCode
    );
  }

  if (
    length >
    BigInt(reader.remaining)
  ) {
    throw new ScaleDecodeError(
      "BYTE_LENGTH_EXCEEDS_INPUT"
    );
  }

  return reader.readBytes(
    Number(length)
  );
}

function readBoundedCount(
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
    value > BigInt(maximum)
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
