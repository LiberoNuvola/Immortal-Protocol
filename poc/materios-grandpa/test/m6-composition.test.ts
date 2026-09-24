import { describe, expect, it } from "vitest";

import {
  buildM6CompositionStatement,
  verifyM6Composition,
  validateVerifiedM6Composition
} from "../src/m6-composition.js";

function transition() {
  return {
    kind: "verified-materios-authority-set-transition" as const,
    publicStatement: {
      protocolVersion: 1 as const,
      chainId: "materios",
      genesisHash: new Uint8Array(32).fill(1),
      genesisUtxo: Uint8Array.from([1, 2, 3]),
      fromSetId: 7n,
      fromAuthorities: [],
      sidechainEpoch: 42n,
      selectionInputsHash: new Uint8Array(32).fill(2),
      proofSystem: "upstream-proof",
      toAuthorities: [],
      activationBlock: {
        hash: new Uint8Array(32).fill(3),
        number: 123n
      },
      toSetId: 8n
    },
    statementHash: new Uint8Array(32).fill(4),
    __verifiedAuthoritySetTransition: "verified" as const
  };
}

function finality() {
  return {
    verified: true as const,
    chainId: "materios",
    genesisHash: new Uint8Array(32).fill(1),
    targetHash: new Uint8Array(32).fill(9),
    targetNumber: 122n,
    round: 5n,
    setId: 7n,
    signedWeight: 3n,
    totalWeight: 4n
  };
}

describe("Materios M6 composition boundary", () => {
  it("binds chain, genesis and source authority-set identity", () => {
    const statement = buildM6CompositionStatement(
      transition(),
      finality(),
      "composition-proof",
      Uint8Array.from([0xaa])
    );

    expect(statement.chainId).toBe("materios");
    expect(statement.finalitySetId).toBe(7n);
    expect(Array.from(statement.transitionStatementHash))
      .toEqual(new Array(32).fill(4));
  });

  it("rejects finality from a different chain", () => {
    expect(() =>
      buildM6CompositionStatement(
        transition(),
        { ...finality(), chainId: "other" },
        "composition-proof",
        Uint8Array.from([0xaa])
      )
    ).toThrow("M6_CHAIN_ID_MISMATCH");
  });

  it("rejects finality from a different genesis", () => {
    expect(() =>
      buildM6CompositionStatement(
        transition(),
        {
          ...finality(),
          genesisHash: new Uint8Array(32).fill(8)
        },
        "composition-proof",
        Uint8Array.from([0xaa])
      )
    ).toThrow("M6_GENESIS_HASH_MISMATCH");
  });

  it("rejects a finality proof authenticated by the wrong source set", () => {
    expect(() =>
      buildM6CompositionStatement(
        transition(),
        { ...finality(), setId: 6n },
        "composition-proof",
        Uint8Array.from([0xaa])
      )
    ).toThrow("M6_FINALITY_SET_ID_MISMATCH");
  });

  it("does not create a verified M6 certificate without an external composition proof", async () => {
    await expect(
      verifyM6Composition(
        transition(),
        finality(),
        { verify: () => false },
        "composition-proof",
        Uint8Array.from([0xaa])
      )
    ).rejects.toThrow("M6_COMPOSITION_PROOF_NOT_VERIFIED");
  });

  it("creates the verified certificate only after the composition verifier accepts", async () => {
    const result = await verifyM6Composition(
      transition(),
      finality(),
      { verify: () => true },
      "composition-proof",
      Uint8Array.from([0xaa])
    );

    validateVerifiedM6Composition(result);
    expect(result.statement.kind).toBe("materios-m6-composition");
  });

  it("does not invent selector semantics", async () => {
    let received: unknown;
    await verifyM6Composition(
      transition(),
      finality(),
      {
        verify: (statement) => {
          received = statement;
          return true;
        }
      },
      "external-selector-proof",
      Uint8Array.from([0xbb])
    );

    const statement = received as ReturnType<typeof buildM6CompositionStatement>;
    expect(statement.finalityTargetNumber).toBe(122n);
    expect(statement.compositionProofSystem).toBe("external-selector-proof");
    // No committee derivation is performed here.
  });
});
