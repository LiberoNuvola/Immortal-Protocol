import { blake2b } from "@noble/hashes/blake2.js";
import { describe, expect, it } from "vitest";

import {
  hashSelectionInputs,
  verifyAuthoritySetTransition,
  type AuthoritySetTransitionStatement
} from "../src/authority-transition.js";
import {
  verifyMateriosFinalityAgainstTransition
} from "../src/materios-evidence-adapter.js";
import {
  encodeGrandpaJustification,
  type GrandpaJustification
} from "../src/grandpa.js";
import {
  encodeMateriosHeader,
  MATERIOS_HEADER_ENCODING,
  type GrandpaAncestryHeader
} from "../src/ancestry.js";
import type { TrustedAuthorityState } from "../src/authority.js";
import type { Ed25519Verifier } from "../src/crypto.js";

const alwaysValidCrypto: Ed25519Verifier = {
  verify() {
    return true;
  }
};

function authority(index: number) {
  return {
    publicKey: new Uint8Array(32).fill(index),
    weight: 1n
  };
}

function trusted(): TrustedAuthorityState {
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

function activationHeader(): GrandpaAncestryHeader {
  const decoded = {
    parentHash: new Uint8Array(32).fill(0x11),
    number: 1234n,
    stateRoot: new Uint8Array(32).fill(0x22),
    extrinsicsRoot: new Uint8Array(32).fill(0x33),
    digest: { logs: [] }
  };

  const rawHeader = encodeMateriosHeader(decoded);

  return {
    ...decoded,
    rawHeader,
    hash: blake2b(rawHeader, { dkLen: 32 }),
    encoding: MATERIOS_HEADER_ENCODING
  };
}

function statement(
  header: GrandpaAncestryHeader
): AuthoritySetTransitionStatement {
  const selectionInputs = Uint8Array.from([1, 2, 3, 4]);

  return {
    kind: "materios-authority-set-transition",
    protocolVersion: 1,
    chainId: "materios",
    genesisHash: new Uint8Array(32).fill(0xaa),
    genesisUtxo: Uint8Array.from([9, 8, 7]),
    fromSetId: 7n,
    fromAuthorities: trusted().authorities,
    sidechainEpoch: 42n,
    authoritySelectionRegime: {
      kind: "l1-ariadne",
      evidenceHash: new Uint8Array(32).fill(0xbb)
    },
    selectionInputs,
    selectionInputsHash: hashSelectionInputs(
      selectionInputs
    ),
    proofSystem: "test-authoritative-proof",
    toAuthorities: [
      authority(5),
      authority(6),
      authority(7),
      authority(8)
    ],
    activationBlock: {
      hash: header.hash,
      number: header.number
    },
    toSetId: 8n,
    proofBytes: Uint8Array.from([0xde, 0xad])
  };
}

function finalityProof(
  header: GrandpaAncestryHeader
) {
  const justification: GrandpaJustification = {
    round: 19n,
    commit: {
      targetHash: header.hash,
      targetNumber: header.number,
      precommits: [1, 2, 3].map(index => ({
        precommit: {
          targetHash: header.hash,
          targetNumber: header.number
        },
        signer: new Uint8Array(32).fill(index),
        signature: new Uint8Array(64).fill(0x55)
      }))
    },
    votesAncestries: []
  };

  return {
    block: header.hash,
    justification: encodeGrandpaJustification(
      justification
    ),
    unknownHeaders: []
  };
}

describe(
  "B3 verified finality / authority transition boundary",
  () => {
    it(
      "accepts finality only when bound to the verified transition's fromSetId",
      async () => {
        const header = activationHeader();
        const verifiedTransition =
          await verifyAuthoritySetTransition(
            statement(header),
            {
              verify() {
                return true;
              }
            }
          );

        const result =
          await verifyMateriosFinalityAgainstTransition(
            {
              chainId: "materios",
              genesisHash: trusted().genesisHash,
              blockHash: header.hash,
              blockNumber: header.number
            },
            finalityProof(header),
            trusted(),
            verifiedTransition,
            alwaysValidCrypto
          );

        expect(result.finality.finalizedBlock.verified)
          .toBe(true);
        expect(result.finality.finalizedBlock.setId)
          .toBe(7n);
        expect(result.transition.publicStatement.toSetId)
          .toBe(8n);
      }
    );

    it(
      "fails closed when current trusted authority state does not match the transition",
      async () => {
        const header = activationHeader();
        const verifiedTransition =
          await verifyAuthoritySetTransition(
            statement(header),
            {
              verify() {
                return true;
              }
            }
          );

        await expect(
          verifyMateriosFinalityAgainstTransition(
            {
              chainId: "materios",
              genesisHash: trusted().genesisHash,
              blockHash: header.hash,
              blockNumber: header.number
            },
            finalityProof(header),
            {
              ...trusted(),
              setId: 6n
            },
            verifiedTransition,
            alwaysValidCrypto
          )
        ).rejects.toThrow(
          "AUTHORITY_TRANSITION_FROM_SET_ID_MISMATCH"
        );
      }
    );
  }
);
