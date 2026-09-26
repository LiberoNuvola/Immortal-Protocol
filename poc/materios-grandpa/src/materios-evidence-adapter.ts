import {
  type AuthoritySetTransitionStatement,
  type AuthoritySelectionRegime,
  type VerifiedAuthoritySetTransition,
  type AuthoritySetTransitionProofVerifier,
  verifyAuthoritySetTransition,
  verifyActivationBlockBinding,
  verifySelectionInputsCommitment
} from "./authority-transition.js";
import type { GrandpaAuthority } from "./authority.js";
import type { CanonicalCheckpoint } from "./verifier.js";

const HASH_LENGTH = 32;
const MAX_JSON_BYTES = 32 * 1024 * 1024;

export interface MateriosExecutionProofEnvelope {
  readonly version: 1;
  readonly chainId: string;
  readonly runtimeSpecVersion: number;
  readonly blockHash: Uint8Array;
  readonly method: string;
  readonly callData: Uint8Array;
  readonly result: Uint8Array;
  readonly proofSystem: string;
  readonly proofBytes: Uint8Array;
  readonly proofCommitment: Uint8Array;
}

export interface MateriosExecutionProofVerifier {
  verify(
    proof: MateriosExecutionProofEnvelope,
    checkpoint: CanonicalCheckpoint
  ): Promise<boolean> | boolean;
}

export interface MateriosEvidenceEnvelope {
  readonly version: 1;
  readonly evidenceClass: "external-runtime";
  readonly checkpoint: CanonicalCheckpoint;
  readonly authorityTransition: AuthoritySetTransitionStatement;
  readonly executionProof: MateriosExecutionProofEnvelope;
  readonly selectionCommitment: {
    readonly blockHash: Uint8Array;
    readonly blockNumber: bigint;
    readonly selectionInputsHash: Uint8Array;
  };
}

export interface MateriosEvidenceAdapter {
  readonly decode: (input: unknown) => MateriosEvidenceEnvelope;
  readonly verifyTransition: (
    evidence: MateriosEvidenceEnvelope,
    proofVerifier: AuthoritySetTransitionProofVerifier,
    executionProofVerifier: MateriosExecutionProofVerifier
  ) => Promise<VerifiedAuthoritySetTransition>;
}

/**
 * IMMORTAL-side transport/refinement boundary for evidence emitted by the
 * external Materios system.
 *
 * This module deliberately does not select authorities, verify GRANDPA
 * signatures, execute a runtime call, or manufacture a Verified... value.
 * Cryptographic verification remains delegated to explicit verifier
 * boundaries supplied by the caller.
 */
export function createMateriosEvidenceAdapter(): MateriosEvidenceAdapter {
  return {
    decode: decodeMateriosEvidence,
    verifyTransition: async (
      evidence,
      proofVerifier,
      executionProofVerifier
    ) => {
      verifyActivationBlockBinding(
        evidence.authorityTransition,
        evidence.checkpoint
      );

      verifySelectionInputsCommitment(
        evidence.authorityTransition,
        evidence.selectionCommitment
      );

      if (
        evidence.executionProof.chainId !== evidence.checkpoint.chainId
      ) {
        throw new Error("EXECUTION_PROOF_CHAIN_MISMATCH");
      }

      if (
        evidence.executionProof.blockHash.length !== HASH_LENGTH ||
        !equalBytes(
          evidence.executionProof.blockHash,
          evidence.checkpoint.blockHash
        )
      ) {
        throw new Error("EXECUTION_PROOF_BLOCK_MISMATCH");
      }

      if (
        evidence.executionProof.proofSystem !==
        evidence.authorityTransition.proofSystem
      ) {
        throw new Error("EXECUTION_PROOF_SYSTEM_MISMATCH");
      }

      if (
        !await executionProofVerifier.verify(
          evidence.executionProof,
          evidence.checkpoint
        )
      ) {
        throw new Error("EXECUTION_PROOF_NOT_VERIFIED");
      }

      return verifyAuthoritySetTransition(
        evidence.authorityTransition,
        proofVerifier
      );
    }
  };
}

export function decodeMateriosEvidence(
  input: unknown
): MateriosEvidenceEnvelope {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error("INVALID_MATERIOS_EVIDENCE");
  }

  const root = input as Record<string, unknown>;

  if (root.version !== 1) {
    throw new Error("UNSUPPORTED_MATERIOS_EVIDENCE_VERSION");
  }

  if (root.evidenceClass !== "external-runtime") {
    throw new Error("NON_RUNTIME_MATERIOS_EVIDENCE");
  }

  const checkpoint = decodeCheckpoint(root.checkpoint);
  const transition = decodeTransition(root.authorityTransition);
  const executionProof = decodeExecutionProof(root.executionProof);
  const commitment = decodeSelectionCommitment(root.selectionCommitment);

  if (executionProof.proofBytes.length === 0) {
    throw new Error("EMPTY_EXECUTION_PROOF");
  }

  return {
    version: 1,
    evidenceClass: "external-runtime",
    checkpoint,
    authorityTransition: transition,
    executionProof,
    selectionCommitment: commitment
  };
}

function decodeCheckpoint(value: unknown): CanonicalCheckpoint {
  const object = requireObject(value, "INVALID_CHECKPOINT");

  return {
    chainId: requireString(object.chainId, "INVALID_CHECKPOINT_CHAIN_ID"),
    genesisHash: decodeHex(
      object.genesisHash,
      "INVALID_CHECKPOINT_GENESIS_HASH",
      HASH_LENGTH
    ),
    blockHash: decodeHex(
      object.blockHash,
      "INVALID_CHECKPOINT_BLOCK_HASH",
      HASH_LENGTH
    ),
    blockNumber: decodeU64(
      object.blockNumber,
      "INVALID_CHECKPOINT_BLOCK_NUMBER"
    )
  };
}

function decodeExecutionProof(
  value: unknown
): MateriosExecutionProofEnvelope {
  const object = requireObject(value, "INVALID_EXECUTION_PROOF");

  const runtimeSpecVersion = object.runtimeSpecVersion;
  if (
    typeof runtimeSpecVersion !== "number" ||
    !Number.isSafeInteger(runtimeSpecVersion) ||
    runtimeSpecVersion < 0
  ) {
    throw new Error("INVALID_EXECUTION_PROOF_RUNTIME_VERSION");
  }

  const envelope: MateriosExecutionProofEnvelope = {
    version: 1,
    chainId: requireString(
      object.chainId,
      "INVALID_EXECUTION_PROOF_CHAIN_ID"
    ),
    runtimeSpecVersion,
    blockHash: decodeHex(
      object.blockHash,
      "INVALID_EXECUTION_PROOF_BLOCK_HASH",
      HASH_LENGTH
    ),
    method: requireString(
      object.method,
      "INVALID_EXECUTION_PROOF_METHOD"
    ),
    callData: decodeHex(
      object.callData,
      "INVALID_EXECUTION_PROOF_CALL_DATA"
    ),
    result: decodeHex(
      object.result,
      "INVALID_EXECUTION_PROOF_RESULT"
    ),
    proofSystem: requireString(
      object.proofSystem,
      "INVALID_EXECUTION_PROOF_SYSTEM"
    ),
    proofBytes: decodeHex(
      object.proofBytes,
      "INVALID_EXECUTION_PROOF_BYTES"
    ),
    proofCommitment: decodeHex(
      object.proofCommitment,
      "INVALID_EXECUTION_PROOF_COMMITMENT",
      HASH_LENGTH
    )
  };

  if (envelope.method.length === 0) {
    throw new Error("INVALID_EXECUTION_PROOF_METHOD");
  }

  return envelope;
}

function decodeTransition(
  value: unknown
): AuthoritySetTransitionStatement {
  const object = requireObject(value, "INVALID_AUTHORITY_TRANSITION");

  const regimeObject = requireObject(
    object.authoritySelectionRegime,
    "INVALID_AUTHORITY_SELECTION_REGIME"
  );

  let regime: AuthoritySelectionRegime;
  const kind = regimeObject.kind;
  const evidenceHash = decodeHex(
    regimeObject.evidenceHash,
    "INVALID_AUTHORITY_SELECTION_REGIME_EVIDENCE_HASH",
    HASH_LENGTH
  );

  if (kind === "l1-ariadne") {
    regime = { kind, evidenceHash };
  } else if (kind === "pinned-committee") {
    regime = {
      kind,
      evidenceHash,
      untilEpoch: decodeU64(
        regimeObject.untilEpoch,
        "INVALID_PINNED_COMMITTEE_UNTIL_EPOCH"
      )
    };
  } else {
    throw new Error("INVALID_AUTHORITY_SELECTION_REGIME");
  }

  const activationBlock = requireObject(
    object.activationBlock,
    "INVALID_ACTIVATION_BLOCK"
  );

  return {
    kind: requireString(object.kind, "INVALID_TRANSITION_KIND") as
      "materios-authority-set-transition",
    protocolVersion: requireNumber(
      object.protocolVersion,
      "INVALID_TRANSITION_PROTOCOL"
    ),
    chainId: requireString(
      object.chainId,
      "INVALID_TRANSITION_CHAIN_ID"
    ),
    genesisHash: decodeHex(
      object.genesisHash,
      "INVALID_TRANSITION_GENESIS_HASH",
      HASH_LENGTH
    ),
    genesisUtxo: decodeHex(
      object.genesisUtxo,
      "INVALID_TRANSITION_GENESIS_UTXO"
    ),
    fromSetId: decodeU64(
      object.fromSetId,
      "INVALID_FROM_SET_ID"
    ),
    fromAuthorities: decodeAuthorities(
      object.fromAuthorities,
      "INVALID_FROM_AUTHORITY_SET"
    ),
    sidechainEpoch: decodeU64(
      object.sidechainEpoch,
      "INVALID_SIDECHAIN_EPOCH"
    ),
    authoritySelectionRegime: regime,
    selectionInputs: decodeHex(
      object.selectionInputs,
      "INVALID_SELECTION_INPUTS"
    ),
    selectionInputsHash: decodeHex(
      object.selectionInputsHash,
      "INVALID_SELECTION_INPUTS_HASH",
      HASH_LENGTH
    ),
    proofSystem: requireString(
      object.proofSystem,
      "INVALID_PROOF_SYSTEM"
    ),
    toAuthorities: decodeAuthorities(
      object.toAuthorities,
      "INVALID_TO_AUTHORITY_SET"
    ),
    activationBlock: {
      hash: decodeHex(
        activationBlock.hash,
        "INVALID_ACTIVATION_BLOCK_HASH",
        HASH_LENGTH
      ),
      number: decodeU64(
        activationBlock.number,
        "INVALID_ACTIVATION_BLOCK_NUMBER"
      )
    },
    toSetId: decodeU64(
      object.toSetId,
      "INVALID_TO_SET_ID"
    ),
    proofBytes: decodeHex(
      object.proofBytes,
      "INVALID_PROOF_BYTES"
    )
  };
}

function decodeSelectionCommitment(value: unknown) {
  const object = requireObject(
    value,
    "INVALID_SELECTION_COMMITMENT"
  );

  return {
    blockHash: decodeHex(
      object.blockHash,
      "INVALID_SELECTION_COMMITMENT_BLOCK_HASH",
      HASH_LENGTH
    ),
    blockNumber: decodeU64(
      object.blockNumber,
      "INVALID_SELECTION_COMMITMENT_BLOCK_NUMBER"
    ),
    selectionInputsHash: decodeHex(
      object.selectionInputsHash,
      "INVALID_SELECTION_COMMITMENT_HASH",
      HASH_LENGTH
    )
  };
}

function decodeAuthorities(
  value: unknown,
  error: string
): GrandpaAuthority[] {
  if (!Array.isArray(value)) {
    throw new Error(error);
  }

  return value.map((entry) => {
    const object = requireObject(entry, error);
    return {
      publicKey: decodeHex(
        object.publicKey,
        `${error}_KEY`,
        HASH_LENGTH
      ),
      weight: decodeU64(
        object.weight,
        `${error}_WEIGHT`
      )
    };
  });
}

function requireObject(
  value: unknown,
  error: string
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(error);
  }

  return value as Record<string, unknown>;
}

function requireString(
  value: unknown,
  error: string
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(error);
  }

  return value;
}

function requireNumber(
  value: unknown,
  error: string
): number {
  if (!Number.isSafeInteger(value)) {
    throw new Error(error);
  }

  return value as number;
}

function decodeU64(
  value: unknown,
  error: string
): bigint {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error(error);
  }

  const parsed = BigInt(value);
  if (parsed < 0n || parsed > 0xffffffffffffffffn) {
    throw new Error(error);
  }

  return parsed;
}

function decodeHex(
  value: unknown,
  error: string,
  exactLength?: number
): Uint8Array {
  if (
    typeof value !== "string" ||
    !/^[0-9a-fA-F]*$/.test(value) ||
    value.length % 2 !== 0
  ) {
    throw new Error(error);
  }

  const bytes = new Uint8Array(value.length / 2);

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(
      value.slice(i * 2, i * 2 + 2),
      16
    );
  }

  if (
    bytes.length === 0 ||
    (exactLength !== undefined && bytes.length !== exactLength)
  ) {
    throw new Error(error);
  }

  return bytes;
}

function equalBytes(
  left: Uint8Array,
  right: Uint8Array
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Allows callers to reject oversized raw JSON before decoding. This is an
 * operational guard, not a cryptographic verification step.
 */
export function assertMateriosEvidenceJsonSize(
  json: string
): void {
  if (
    new TextEncoder().encode(json).length > MAX_JSON_BYTES
  ) {
    throw new Error("MATERIOS_EVIDENCE_TOO_LARGE");
  }
}
