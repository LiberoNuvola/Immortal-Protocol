import {
  describe,
  expect,
  it
} from "vitest";

import {
  trustedAuthorityStateFromVerifiedTransition,
  validateAuthoritySetEvidence,
  validateAuthoritySetTransitionEvidence,
  type TrustedAuthorityState
} from "../src/authority.js";

import {
  hashSelectionInputs,
  verifyActivationBlockBinding,
  verifyAuthoritySetTransition,
  type AuthoritySetTransitionStatement
} from "../src/authority-transition.js";

import {
  verifyFinality
} from "../src/verifier.js";

import type {
  GrandpaJustification
} from "../src/grandpa.js";

import type {
  Ed25519Verifier
} from "../src/crypto.js";

const alwaysValidCrypto: Ed25519Verifier = {
  async verify() {
    return true;
  }
};

function authority(
  value: number
) {
  return {
    publicKey: new Uint8Array(32).fill(value),
    weight: 1n
  };
}

function currentTrustedState(): TrustedAuthorityState {
  return {
    chainId: "materios",
    genesisHash: new Uint8Array(32).fill(0xaa),
    setId: 7n,
    authorities: [
      authority(1),
      authority(2),
      authority(3),
      authority(4)
    ]
  };
}

function baseStatement(): AuthoritySetTransitionStatement {
  return {
    kind: "materios-authority-set-transition",
    protocolVersion: 1,
    chainId: "materios",
    genesisHash: new Uint8Array(32).fill(0xaa),
    genesisUtxo: Uint8Array.from([1, 2, 3, 4]),
    fromSetId: 7n,
    fromAuthorities: [
      authority(1),
      authority(2),
      authority(3),
      authority(4)
    ],
    sidechainEpoch: 42n,
    authoritySelectionRegime: {
      kind: "l1-ariadne" as const,
      evidenceHash: new Uint8Array(32).fill(0xdd)
    },
    selectionInputs: Uint8Array.from([9, 8, 7, 6]),
    selectionInputsHash: hashSelectionInputs(
      Uint8Array.from([9, 8, 7, 6])
    ),
    toAuthorities: [
      authority(5),
      authority(6),
      authority(7),
      authority(8)
    ],
    activationBlock: {
      hash: new Uint8Array(32).fill(0xbb),
      number: 1234n
    },
    toSetId: 8n,
    proofSystem: "test-proof-boundary",
    proofBytes: Uint8Array.from([0xde, 0xad])
  };
}

function finalizedCheckpoint() {
  return {
    chainId: "materios",
    genesisHash: new Uint8Array(32).fill(0xaa),
    blockHash: new Uint8Array(32).fill(0xcc),
    blockNumber: 1234n
  };
}

function justification(signers = [5, 6, 7]): GrandpaJustification {
  return {
    round: 19n,
    commit: {
      targetHash: new Uint8Array(32).fill(0xcc),
      targetNumber: 1234n,
      precommits: signers.map(signer => ({
        precommit: {
          targetHash: new Uint8Array(32).fill(0xcc),
          targetNumber: 1234n
        },
        signer: new Uint8Array(32).fill(signer),
        signature: new Uint8Array(64).fill(0x55)
      }))
    },
    votesAncestries: []
  };
}

describe("authority trust boundary integration", () => {
  it("keeps adapter evidence untrusted", () => {
    const evidence = {
      trust: "untrusted-evidence",
      chainId: "materios",
      genesisHash: new Uint8Array(32).fill(0xaa),
      setId: 7n,
      authorities: [authority(1), authority(2)],
      provenance: {
        status: "unverified",
        source: "adapter"
      }
    } as const;

    expect(() =>
      validateAuthoritySetEvidence(evidence)
    ).not.toThrow();

    const transition = {
      kind: "authority-set-transition-evidence",
      from: evidence,
      to: {
        ...evidence,
        setId: 8n,
        authorities: [authority(3), authority(4)]
      },
      transition: {
        status: "unverified",
        setId: 7n,
        nextSetId: 8n,
        format: "unresolved"
      }
    } as const;

    expect(() =>
      validateAuthoritySetTransitionEvidence(transition)
    ).not.toThrow();
  });

  it("fails closed when the supplied transition proof verifier rejects", async () => {
    const statement = baseStatement();

    await expect(
      verifyAuthoritySetTransition(statement, {
        verify() {
          return false;
        }
      })
    ).rejects.toThrow("AUTHORITY_TRANSITION_PROOF_NOT_VERIFIED");
  });

  it("requires the proof boundary before producing trusted state", async () => {
    const statement = baseStatement();

    const verified = await verifyAuthoritySetTransition(
      statement,
      {
        verify() {
          return true;
        }
      }
    );

    const trusted =
      trustedAuthorityStateFromVerifiedTransition(
        currentTrustedState(),
        verified
      );

    expect(trusted.setId).toBe(8n);
    expect(trusted.authorities[0].publicKey[0]).toBe(5);
  });

  it("rejects a forged verified transition before finality state can be updated", () => {
    const forged = {
      kind: "verified-materios-authority-set-transition",
      __verifiedAuthoritySetTransition: "forged",
      publicStatement: {
        protocolVersion: 1,
        chainId: "materios",
        genesisHash: new Uint8Array(32).fill(0xaa),
        genesisUtxo: Uint8Array.from([1]),
        fromSetId: 7n,
        fromAuthorities: [authority(1)],
        sidechainEpoch: 42n,
        selectionInputsHash: new Uint8Array(32).fill(0x11),
        toAuthorities: [authority(2)],
        activationBlock: {
          hash: new Uint8Array(32).fill(0xbb),
          number: 1234n
        },
        toSetId: 8n
      }
    } as never;

    expect(() =>
      trustedAuthorityStateFromVerifiedTransition(
        currentTrustedState(),
        forged
      )
    ).toThrow("INVALID_VERIFIED_AUTHORITY_SET_TRANSITION");
  });

  it("uses the transition-derived trusted set when verifying a finalized checkpoint", async () => {
    const statement = baseStatement();

    const verified = await verifyAuthoritySetTransition(
      statement,
      {
        verify() {
          return true;
        }
      }
    );

    const trusted =
      trustedAuthorityStateFromVerifiedTransition(
        currentTrustedState(),
        verified
      );

    const checkpoint = finalizedCheckpoint();

    expect(() =>
      verifyActivationBlockBinding(statement, checkpoint)
    ).toThrow("ACTIVATION_BLOCK_FINALITY_HASH_MISMATCH");

    const matchingCheckpoint = {
      ...checkpoint,
      blockHash: new Uint8Array(statement.activationBlock.hash)
    };

    expect(() =>
      verifyActivationBlockBinding(statement, matchingCheckpoint)
    ).not.toThrow();

    const result = await verifyFinality(
      checkpoint,
      justification(),
      trusted,
      alwaysValidCrypto,
      { verifyAncestry: false }
    );

    expect(result.verified).toBe(true);
    expect(result.setId).toBe(8n);
    expect(result.signedWeight).toBe(3n);
    expect(result.totalWeight).toBe(4n);
  });
});
