import { blake2b } from "@noble/hashes/blake2.js";

import {
  bytesToHex,
  concatBytes,
  encodeCompact,
  encodeU32,
  encodeU64,
  equalBytes
} from "./scale.js";

import type {
  GrandpaAuthority
} from "./authority.js";

const HASH_LENGTH = 32;
const PUBLIC_KEY_LENGTH = 32;
const U32_MAX = 0xffffffffn;
const U64_MAX = 0xffffffffffffffffn;
const MAX_GENESIS_UTXO_BYTES = 256;
const MAX_SELECTION_INPUTS_BYTES = 4 * 1024 * 1024;
const MAX_PROOF_BYTES = 16 * 1024 * 1024;
const MAX_AUTHORITIES = 1024;

const TRANSITION_DOMAIN =
  "PRE-RICH/MATERIOS/AUTHORITY-TRANSITION/V1";

export interface OnChainSelectionInputsCommitment {
  /** Canonical finalized block containing the SessionValidatorManagement::set call. */
  readonly blockHash: Uint8Array;
  /** Optional block number when the statement form is used. */
  readonly blockNumber?: bigint;
  /** Exact 32-byte selection_inputs_hash emitted by that call. */
  readonly selectionInputsHash: Uint8Array;
}

/**
 * Binds recovered AuthoritySelectionInputs to the commitment emitted by
 * Materios' SessionValidatorManagement::set inherent.
 *
 * Two proof-boundary forms are supported:
 *  - raw selection-input bytes + on-chain commitment: hashes the exact bytes;
 *  - transition statement + on-chain commitment: checks the statement's
 *    canonical activation block and selection-input hash against the commitment.
 *
 * This helper does not reproduce Materios' selector.
 */
export function verifySelectionInputsCommitment(
  selectionInputs: Uint8Array,
  commitment: OnChainSelectionInputsCommitment
): void;
export function verifySelectionInputsCommitment(
  statement:
    | AuthoritySetTransitionStatement
    | AuthoritySetTransitionPublicStatement,
  commitment: OnChainSelectionInputsCommitment & { readonly blockNumber: bigint }
): void;
export function verifySelectionInputsCommitment(
  subject:
    | Uint8Array
    | AuthoritySetTransitionStatement
    | AuthoritySetTransitionPublicStatement,
  commitment: OnChainSelectionInputsCommitment
): void {
  if (commitment.blockHash.length !== HASH_LENGTH) {
    throw new Error("SELECTION_INPUTS_COMMITMENT_BLOCK_HASH");
  }

  if (commitment.selectionInputsHash.length !== HASH_LENGTH) {
    throw new Error("SELECTION_INPUTS_COMMITMENT_HASH");
  }

  if (commitment.blockNumber !== undefined &&
      (commitment.blockNumber < 0n || commitment.blockNumber > U32_MAX)) {
    throw new Error("SELECTION_INPUTS_COMMITMENT_BLOCK_NUMBER");
  }

  if (subject instanceof Uint8Array) {
    const expected = hashSelectionInputs(subject);
    if (!equalBytes(expected, commitment.selectionInputsHash)) {
      throw new Error("SELECTION_INPUTS_ONCHAIN_COMMITMENT_MISMATCH");
    }
    return;
  }

  const publicStatement =
    "proofBytes" in subject
      ? authoritySetTransitionPublicStatement(subject)
      : subject;

  validateAuthoritySetTransitionPublicStatement(publicStatement);

  if (commitment.blockNumber === undefined) {
    throw new Error("SELECTION_INPUTS_COMMITMENT_BLOCK_NUMBER");
  }

  if (!equalBytes(
    commitment.blockHash,
    publicStatement.activationBlock.hash
  )) {
    throw new Error("SELECTION_INPUTS_COMMITMENT_BLOCK_HASH_MISMATCH");
  }

  if (commitment.blockNumber !== publicStatement.activationBlock.number) {
    throw new Error("SELECTION_INPUTS_COMMITMENT_BLOCK_NUMBER_MISMATCH");
  }

  if (!equalBytes(
    commitment.selectionInputsHash,
    publicStatement.selectionInputsHash
  )) {
    throw new Error("SELECTION_INPUTS_COMMITMENT_HASH_MISMATCH");
  }
}

export interface FinalityCheckpointBinding {
  readonly blockHash: Uint8Array;
  readonly blockNumber: bigint;
}

/**
 * Binds the authority-set transition activation block to the independently
 * verified GRANDPA checkpoint. Equality is required for both hash and number;
 * matching the number alone is insufficient.
 */
export function verifyActivationBlockBinding(
  statement: AuthoritySetTransitionStatement | AuthoritySetTransitionPublicStatement,
  checkpoint: FinalityCheckpointBinding
): void {
  const publicStatement =
    "proofBytes" in statement
      ? authoritySetTransitionPublicStatement(statement)
      : statement;

  validateAuthoritySetTransitionPublicStatement(publicStatement);

  if (checkpoint.blockHash.length !== HASH_LENGTH) {
    throw new Error("ACTIVATION_BLOCK_FINALITY_HASH_MISMATCH");
  }

  if (checkpoint.blockNumber !== publicStatement.activationBlock.number) {
    throw new Error("ACTIVATION_BLOCK_FINALITY_NUMBER_MISMATCH");
  }

  if (!equalBytes(checkpoint.blockHash, publicStatement.activationBlock.hash)) {
    throw new Error("ACTIVATION_BLOCK_FINALITY_HASH_MISMATCH");
  }
}

export function hashSelectionInputs(
  selectionInputs: Uint8Array
): Uint8Array {
  if (
    selectionInputs.length === 0 ||
    selectionInputs.length > MAX_SELECTION_INPUTS_BYTES
  ) {
    throw new Error("INVALID_SELECTION_INPUTS");
  }

  return blake2b(selectionInputs, {
    dkLen: HASH_LENGTH
  });
}

/**
 * Validates the transition evidence and all bindings that are locally
 * checkable without pretending to verify the Materios authority-selection
 * function or its finality proof.
 *
 * This function does NOT establish that `toAuthorities` is the canonical
 * Materios committee. That requires the future cryptographic proof verifier.
 */
export function validateAuthoritySetTransitionStatement(
  statement: AuthoritySetTransitionStatement
): void {
  if (
    statement.kind !==
    "materios-authority-set-transition"
  ) {
    throw new Error("INVALID_TRANSITION_KIND");
  }

  if (statement.protocolVersion !== 1) {
    throw new Error("UNSUPPORTED_TRANSITION_PROTOCOL");
  }

  validateChainId(statement.chainId);
  validateHash(
    statement.genesisHash,
    "INVALID_GENESIS_HASH"
  );
  validateBytes(
    statement.genesisUtxo,
    MAX_GENESIS_UTXO_BYTES,
    "INVALID_GENESIS_UTXO"
  );

  validateU64(
    statement.fromSetId,
    "INVALID_FROM_SET_ID"
  );
  validateU64(
    statement.toSetId,
    "INVALID_TO_SET_ID"
  );

  if (
    statement.toSetId !==
    statement.fromSetId + 1n
  ) {
    throw new Error(
      "INVALID_AUTHORITY_SET_ID_TRANSITION"
    );
  }

  validateAuthoritySet(
    statement.fromAuthorities,
    "INVALID_FROM_AUTHORITY_SET"
  );
  validateAuthoritySet(
    statement.toAuthorities,
    "INVALID_TO_AUTHORITY_SET"
  );

  validateU64(
    statement.sidechainEpoch,
    "INVALID_SIDECHAIN_EPOCH"
  );

  validateAuthoritySelectionRegime(
    statement.authoritySelectionRegime,
    statement.sidechainEpoch
  );

  const expectedInputsHash =
    hashSelectionInputs(
      statement.selectionInputs
    );

  if (
    !equalBytes(
      expectedInputsHash,
      statement.selectionInputsHash
    )
  ) {
    throw new Error(
      "SELECTION_INPUTS_HASH_MISMATCH"
    );
  }

  validateActivationBlock(
    statement.activationBlock
  );

  if (statement.proofSystem.length === 0) {
    throw new Error("INVALID_PROOF_SYSTEM");
  }

  validateBytes(
    statement.proofBytes,
    MAX_PROOF_BYTES,
    "INVALID_PROOF_BYTES"
  );
}

export function validateAuthoritySetTransitionPublicStatement(
  statement: AuthoritySetTransitionPublicStatement
): void {
  if (statement.protocolVersion !== 1) {
    throw new Error("UNSUPPORTED_TRANSITION_PROTOCOL");
  }

  validateChainId(statement.chainId);
  validateHash(
    statement.genesisHash,
    "INVALID_GENESIS_HASH"
  );
  validateBytes(
    statement.genesisUtxo,
    MAX_GENESIS_UTXO_BYTES,
    "INVALID_GENESIS_UTXO"
  );
  validateU64(
    statement.fromSetId,
    "INVALID_FROM_SET_ID"
  );
  validateU64(
    statement.toSetId,
    "INVALID_TO_SET_ID"
  );

  if (
    statement.toSetId !==
    statement.fromSetId + 1n
  ) {
    throw new Error(
      "INVALID_AUTHORITY_SET_ID_TRANSITION"
    );
  }

  validateAuthoritySet(
    statement.fromAuthorities,
    "INVALID_FROM_AUTHORITY_SET"
  );
  validateAuthoritySet(
    statement.toAuthorities,
    "INVALID_TO_AUTHORITY_SET"
  );
  validateU64(
    statement.sidechainEpoch,
    "INVALID_SIDECHAIN_EPOCH"
  );
  validateAuthoritySelectionRegime(
    statement.authoritySelectionRegime,
    statement.sidechainEpoch
  );
  validateHash(
    statement.selectionInputsHash,
    "INVALID_SELECTION_INPUTS_HASH"
  );
  if (statement.proofSystem.length === 0) {
    throw new Error("INVALID_PROOF_SYSTEM");
  }
  validateActivationBlock(
    statement.activationBlock
  );
}

export function authoritySetIdentity(
  authorities: readonly GrandpaAuthority[]
): string {
  validateAuthoritySet(
    authorities,
    "INVALID_AUTHORITY_SET"
  );

  return bytesToHex(
    blake2b(
      encodeAuthoritySet(authorities),
      { dkLen: HASH_LENGTH }
    )
  );
}

function validateAuthoritySelectionRegime(
  regime: AuthoritySelectionRegime,
  sidechainEpoch: bigint
): void {
  if (regime.kind !== "l1-ariadne" && regime.kind !== "pinned-committee") {
    throw new Error("INVALID_AUTHORITY_SELECTION_REGIME");
  }

  validateHash(
    regime.evidenceHash,
    "INVALID_AUTHORITY_SELECTION_REGIME_EVIDENCE_HASH"
  );

  if (regime.kind === "pinned-committee") {
    validateU64(
      regime.untilEpoch,
      "INVALID_PINNED_COMMITTEE_UNTIL_EPOCH"
    );

    if (sidechainEpoch > regime.untilEpoch) {
      throw new Error("PINNED_COMMITTEE_EXPIRED");
    }
  }
}

function cloneAuthoritySelectionRegime(
  regime: AuthoritySelectionRegime
): AuthoritySelectionRegime {
  if (regime.kind === "pinned-committee") {
    return {
      kind: regime.kind,
      evidenceHash: new Uint8Array(regime.evidenceHash),
      untilEpoch: regime.untilEpoch
    };
  }

  return {
    kind: regime.kind,
    evidenceHash: new Uint8Array(regime.evidenceHash)
  };
}

function encodeAuthoritySelectionRegime(
  regime: AuthoritySelectionRegime
): Uint8Array {
  if (regime.kind === "pinned-committee") {
    return concatBytes(
      Uint8Array.of(1),
      encodeBytes(regime.evidenceHash),
      encodeU64(regime.untilEpoch)
    );
  }

  return concatBytes(
    Uint8Array.of(0),
    encodeBytes(regime.evidenceHash)
  );
}

function validateChainId(
  chainId: string
): void {
  if (chainId.length === 0) {
    throw new Error("INVALID_CHAIN_ID");
  }
}

function validateHash(
  value: Uint8Array,
  error: string
): void {
  if (value.length !== HASH_LENGTH) {
    throw new Error(error);
  }
}

function validateBytes(
  value: Uint8Array,
  maximum: number,
  error: string
): void {
  if (
    value.length === 0 ||
    value.length > maximum
  ) {
    throw new Error(error);
  }
}

function validateU64(
  value: bigint,
  error: string
): void {
  if (value < 0n || value > U64_MAX) {
    throw new Error(error);
  }
}

function validateAuthoritySet(
  authorities: readonly GrandpaAuthority[],
  prefix: string
): void {
  if (
    authorities.length === 0 ||
    authorities.length > MAX_AUTHORITIES
  ) {
    throw new Error(
      `${prefix}_SIZE`
    );
  }

  const seen = new Set<string>();

  for (const authority of authorities) {
    if (
      authority.publicKey.length !==
      PUBLIC_KEY_LENGTH
    ) {
      throw new Error(
        `${prefix}_KEY`
      );
    }

    if (
      authority.weight <= 0n ||
      authority.weight > U64_MAX
    ) {
      throw new Error(
        `${prefix}_WEIGHT`
      );
    }

    const identity =
      bytesToHex(authority.publicKey);

    if (seen.has(identity)) {
      throw new Error(
        `${prefix}_DUPLICATE`
      );
    }

    seen.add(identity);
  }
}

function validateActivationBlock(
  block: AuthorityActivationBlock
): void {
  validateHash(
    block.hash,
    "INVALID_ACTIVATION_BLOCK_HASH"
  );

  if (
    block.number < 0n ||
    block.number > U32_MAX
  ) {
    throw new Error(
      "INVALID_ACTIVATION_BLOCK_NUMBER"
    );
  }
}

function encodeString(
  value: string
): Uint8Array {
  return encodeBytes(
    new TextEncoder().encode(value)
  );
}

function encodeBytes(
  value: Uint8Array
): Uint8Array {
  return concatBytes(
    encodeCompact(BigInt(value.length)),
    value
  );
}

function encodeAuthoritySet(
  authorities: readonly GrandpaAuthority[]
): Uint8Array {
  return concatBytes(
    encodeCompact(BigInt(authorities.length)),
    ...authorities.map(authority =>
      concatBytes(
        encodeBytes(authority.publicKey),
        encodeU64(authority.weight)
      )
    )
  );
}
