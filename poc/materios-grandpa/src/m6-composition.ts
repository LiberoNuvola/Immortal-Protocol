import type { VerifiedAuthoritySetTransition } from "./authority-transition.js";
import type { VerificationResult } from "./verifier.js";

export interface MateriosM6CompositionStatement {
  readonly kind: "materios-m6-composition";
  readonly protocolVersion: 1;
  readonly transitionStatementHash: Uint8Array;
  readonly finalityTargetHash: Uint8Array;
  readonly finalityTargetNumber: bigint;
  readonly finalitySetId: bigint;
  readonly chainId: string;
  readonly genesisHash: Uint8Array;
  readonly compositionProofSystem: string;
  readonly compositionProofBytes: Uint8Array;
}

/**
 * M6 is a composition boundary, not a selector implementation.
 *
 * This module deliberately does not derive the committee. It only binds
 * independently verified transition/finality artifacts and requires an
 * explicit external composition proof to establish the protocol-specific
 * relationship between them.
 */
export interface M6CompositionProofVerifier {
  verify(
    statement: MateriosM6CompositionStatement,
    transition: VerifiedAuthoritySetTransition,
    finality: VerificationResult
  ): Promise<boolean> | boolean;
}

export interface VerifiedMateriosM6Composition {
  readonly kind: "verified-materios-m6-composition";
  readonly statement: MateriosM6CompositionStatement;
  readonly __verifiedM6Composition: "verified";
}

export function buildM6CompositionStatement(
  transition: VerifiedAuthoritySetTransition,
  finality: VerificationResult,
  compositionProofSystem: string,
  compositionProofBytes: Uint8Array
): MateriosM6CompositionStatement {
  if (compositionProofSystem.length === 0) {
    throw new Error("INVALID_M6_PROOF_SYSTEM");
  }
  if (compositionProofBytes.length === 0) {
    throw new Error("INVALID_M6_PROOF_BYTES");
  }

  const t = transition.publicStatement;

  if (t.chainId !== finality.chainId) {
    throw new Error("M6_CHAIN_ID_MISMATCH");
  }
  if (!equalBytes(t.genesisHash, finality.genesisHash)) {
    throw new Error("M6_GENESIS_HASH_MISMATCH");
  }
  if (t.fromSetId !== finality.setId) {
    throw new Error("M6_FINALITY_SET_ID_MISMATCH");
  }

  return {
    kind: "materios-m6-composition",
    protocolVersion: 1,
    transitionStatementHash: new Uint8Array(transition.statementHash),
    finalityTargetHash: new Uint8Array(finality.targetHash),
    finalityTargetNumber: finality.targetNumber,
    finalitySetId: finality.setId,
    chainId: finality.chainId,
    genesisHash: new Uint8Array(finality.genesisHash),
    compositionProofSystem,
    compositionProofBytes: new Uint8Array(compositionProofBytes)
  };
}

export async function verifyM6Composition(
  transition: VerifiedAuthoritySetTransition,
  finality: VerificationResult,
  proofVerifier: M6CompositionProofVerifier,
  compositionProofSystem: string,
  compositionProofBytes: Uint8Array
): Promise<VerifiedMateriosM6Composition> {
  const statement = buildM6CompositionStatement(
    transition,
    finality,
    compositionProofSystem,
    compositionProofBytes
  );

  const verified = await proofVerifier.verify(
    statement,
    transition,
    finality
  );

  if (!verified) {
    throw new Error("M6_COMPOSITION_PROOF_NOT_VERIFIED");
  }

  return {
    kind: "verified-materios-m6-composition",
    statement,
    __verifiedM6Composition: "verified"
  };
}

export function validateVerifiedM6Composition(
  composition: VerifiedMateriosM6Composition
): void {
  if (
    composition.kind !== "verified-materios-m6-composition" ||
    composition.__verifiedM6Composition !== "verified"
  ) {
    throw new Error("INVALID_VERIFIED_M6_COMPOSITION");
  }
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
