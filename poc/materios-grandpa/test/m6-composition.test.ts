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
      authoritySelectionRegime: {
        kind: "l1-ariadne" as const,
        evidenceHash: new Uint8Array(32).fill(10)
      },
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

  it("passes the full verified transition and finality artifacts to the external proof boundary", async () => {
    let receivedTransition: unknown;
    let receivedFinality: unknown;

    await verifyM6Composition(
      transition(),
      finality(),
      {
        verify: (_statement, receivedTransitionArg, receivedFinalityArg) => {
          receivedTransition = receivedTransitionArg;
          receivedFinality = receivedFinalityArg;
          return true;
        }
      },
      "external-composition-proof",
      Uint8Array.from([0xcc])
    );

    expect(receivedTransition).toBeDefined();
    expect(receivedFinality).toBeDefined();
    expect(
      (receivedTransition as ReturnType<typeof transition>).publicStatement.sidechainEpoch
    ).toBe(42n);
    expect(
      (receivedTransition as ReturnType<typeof transition>).publicStatement.toSetId
    ).toBe(8n);
    expect(
      (receivedFinality as ReturnType<typeof finality>).targetNumber
    ).toBe(122n);
  });

  it("leaves epoch/committee/activation mismatch rejection to the external proof", async () => {
    const transitionArtifact = transition();
    const finalityArtifact = finalityArtifact();
    const seen: {
      sidechainEpoch: bigint;
      toSetId: bigint;
      activationBlockNumber: bigint;
      committeeSize: number;
    } = {
      sidechainEpoch: -1n,
      toSetId: -1n,
      activationBlockNumber: -1n,
      committeeSize: -1,
    };

    await expect(
      verifyM6Composition(
        transitionArtifact,
        finalityArtifact,
        {
          verify: (_statement, receivedTransition) => {
            const publicStatement =
              receivedTransition.publicStatement;

            seen.sidechainEpoch = publicStatement.sidechainEpoch;
            seen.toSetId = publicStatement.toSetId;
            seen.activationBlockNumber = publicStatement.activationBlock.number;
            seen.committeeSize = publicStatement.toAuthorities.length;

            return (
              publicStatement.sidechainEpoch === 42n &&
              publicStatement.toSetId === 8n &&
              publicStatement.activationBlock.number === 123n &&
              publicStatement.toAuthorities.length === 0
            );
          }
        },
        "external-composition-proof",
        Uint8Array.from([0xdd])
      )
    ).resolves.toBeDefined();

    expect(seen).toEqual({
      sidechainEpoch: 42n,
      toSetId: 8n,
      activationBlockNumber: 123n,
      committeeSize: 0,
    });

    await expect(
      verifyM6Composition(
        {
          ...transitionArtifact,
          publicStatement: {
            ...transitionArtifact.publicStatement,
            sidechainEpoch: 43n
          }
        },
        finalityArtifact,
        {
          verify: (_statement, receivedTransition) =>
            receivedTransition.publicStatement.sidechainEpoch === 42n,
        },
        "external-composition-proof",
        Uint8Array.from([0xee])
      )
    ).rejects.toThrow("M6_COMPOSITION_PROOF_NOT_VERIFIED");
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
