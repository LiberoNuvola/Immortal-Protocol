import {
  blake2b
} from "@noble/hashes/blake2.js";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  decodeFinalityProof,
  verifyFinalityProof
} from "../src/finalityProof.js";

import {
  encodeGrandpaJustification,
  type GrandpaJustification
} from "../src/grandpa.js";

import {
  encodeMateriosHeader,
  MATERIOS_HEADER_ENCODING,
  type GrandpaAncestryHeader
} from "../src/ancestry.js";

import {
  concatBytes,
  encodeCompact,
  bytesToHex
} from "../src/scale.js";

import type {
  TrustedAuthorityState
} from "../src/authority.js";

import type {
  Ed25519Verifier
} from "../src/crypto.js";

const alwaysValidCrypto: Ed25519Verifier = {
  verify() {
    return true;
  }
};

function header(
  number: bigint,
  parentHash: Uint8Array
): GrandpaAncestryHeader {
  const decoded = {
    parentHash,
    number,
    stateRoot:
      new Uint8Array(32).fill(0x22),
    extrinsicsRoot:
      new Uint8Array(32).fill(0x33),
    digest: {
      logs: []
    }
  };

  const rawHeader =
    encodeMateriosHeader(
      decoded
    );

  return {
    ...decoded,
    rawHeader,
    hash:
      blake2b(
        rawHeader,
        { dkLen: 32 }
      ),
    encoding:
      MATERIOS_HEADER_ENCODING
  };
}

function state(): TrustedAuthorityState {
  return {
    chainId: "materios",
    genesisHash:
      new Uint8Array(32).fill(0x01),
    setId: 3976n,
    authorities: [
      1,
      2,
      3,
      4
    ].map(index => ({
      publicKey:
        new Uint8Array(32).fill(index),
      weight: 1n
    }))
  };
}

function justificationFor(
  target: GrandpaAncestryHeader
): GrandpaJustification {
  return {
    round: 12n,
    commit: {
      targetHash:
        target.hash,
      targetNumber:
        target.number,
      precommits: [
        1,
        2,
        3
      ].map(index => ({
        precommit: {
          targetHash:
            target.hash,
          targetNumber:
            target.number
        },
        signer:
          new Uint8Array(32).fill(
            index
          ),
        signature:
          new Uint8Array(64).fill(
            0x55
          )
      }))
    },
    votesAncestries: []
  };
}

function encodeFinalityProofForTest(
  block: Uint8Array,
  justification: Uint8Array,
  unknownHeaders: readonly GrandpaAncestryHeader[]
): Uint8Array {
  return concatBytes(
    block,
    encodeCompact(
      BigInt(
        justification.length
      )
    ),
    justification,
    encodeCompact(
      BigInt(
        unknownHeaders.length
      )
    ),
    ...unknownHeaders.map(
      value => value.rawHeader
    )
  );
}

describe("B3 standard GRANDPA FinalityProof decoder", () => {
  it("decodes the exact outer SCALE structure and embedded justification", () => {
    const target =
      header(
        100n,
        new Uint8Array(32)
      );

    const justification =
      justificationFor(
        target
      );

    const encodedJustification =
      encodeGrandpaJustification(
        justification
      );

    const encoded =
      encodeFinalityProofForTest(
        target.hash,
        encodedJustification,
        []
      );

    const decoded =
      decodeFinalityProof(
        encoded
      );

    expect(
      bytesToHex(
        decoded.block
      )
    ).toBe(
      bytesToHex(
        target.hash
      )
    );

    expect(
      bytesToHex(
        decoded.justification
      )
    ).toBe(
      bytesToHex(
        encodedJustification
      )
    );

    expect(
      decoded.unknownHeaders
    ).toHaveLength(0);
  });

  it("verifies a proof whose FinalityProof target is the exact checkpoint", async () => {
    const checkpoint =
      header(
        100n,
        new Uint8Array(32)
      );

    const justification =
      justificationFor(
        checkpoint
      );

    const proof =
      decodeFinalityProof(
        encodeFinalityProofForTest(
          checkpoint.hash,
          encodeGrandpaJustification(
            justification
          ),
          []
        )
      );

    const result =
      await verifyFinalityProof(
        {
          chainId: "materios",
          genesisHash:
            state().genesisHash,
          blockHash:
            checkpoint.hash,
          blockNumber:
            checkpoint.number
        },
        proof,
        state(),
        alwaysValidCrypto
      );

    expect(
      result.verified
    ).toBe(true);

    expect(
      result.finalizedBlock.targetNumber
    ).toBe(100n);
  });

  it("verifies a proof for a descendant and authenticates the checkpoint bridge", async () => {
    const checkpoint =
      header(
        100n,
        new Uint8Array(32)
      );

    const middle =
      header(
        101n,
        checkpoint.hash
      );

    const finalized =
      header(
        102n,
        middle.hash
      );

    const justification =
      justificationFor(
        finalized
      );

    const proof =
      decodeFinalityProof(
        encodeFinalityProofForTest(
          finalized.hash,
          encodeGrandpaJustification(
            justification
          ),
          [
            middle,
            finalized
          ]
        )
      );

    const result =
      await verifyFinalityProof(
        {
          chainId: "materios",
          genesisHash:
            state().genesisHash,
          blockHash:
            checkpoint.hash,
          blockNumber:
            checkpoint.number
        },
        proof,
        state(),
        alwaysValidCrypto
      );

    expect(
      result.verified
    ).toBe(true);

    expect(
      result.finalizedBlock.targetHash
    ).toEqual(
      finalized.hash
    );
  });

  it("rejects an outer block hash that disagrees with the inner justification", async () => {
    const finalized =
      header(
        102n,
        new Uint8Array(32)
      );

    const proof =
      decodeFinalityProof(
        encodeFinalityProofForTest(
          new Uint8Array(
            32
          ).fill(0xff),
          encodeGrandpaJustification(
            justificationFor(
              finalized
            )
          ),
          []
        )
      );

    await expect(
      verifyFinalityProof(
        {
          chainId: "materios",
          genesisHash:
            state().genesisHash,
          blockHash:
            finalized.hash,
          blockNumber:
            finalized.number
        },
        proof,
        state(),
        alwaysValidCrypto
      )
    ).rejects.toMatchObject({
      code:
        "JUSTIFICATION_TARGET_MISMATCH"
    });
  });

  it("rejects a non-sequential checkpoint bridge", async () => {
    const checkpoint =
      header(
        100n,
        new Uint8Array(32)
      );

    const finalized =
      header(
        102n,
        new Uint8Array(
          32
        ).fill(0xee)
      );

    const proof =
      decodeFinalityProof(
        encodeFinalityProofForTest(
          finalized.hash,
          encodeGrandpaJustification(
            justificationFor(
              finalized
            )
          ),
          [finalized]
        )
      );

    await expect(
      verifyFinalityProof(
        {
          chainId: "materios",
          genesisHash:
            state().genesisHash,
          blockHash:
            checkpoint.hash,
          blockNumber:
            checkpoint.number
        },
        proof,
        state(),
        alwaysValidCrypto
      )
    ).rejects.toMatchObject({
      code:
        "CHECKPOINT_BRIDGE_NON_SEQUENTIAL"
    });
  });

  it("rejects redundant headers when the checkpoint is already the finalized target", async () => {
    const checkpoint =
      header(
        100n,
        new Uint8Array(32)
      );

    const extra =
      header(
        101n,
        checkpoint.hash
      );

    const proof =
      decodeFinalityProof(
        encodeFinalityProofForTest(
          checkpoint.hash,
          encodeGrandpaJustification(
            justificationFor(
              checkpoint
            )
          ),
          [extra]
        )
      );

    await expect(
      verifyFinalityProof(
        {
          chainId: "materios",
          genesisHash:
            state().genesisHash,
          blockHash:
            checkpoint.hash,
          blockNumber:
            checkpoint.number
        },
        proof,
        state(),
        alwaysValidCrypto
      )
    ).rejects.toMatchObject({
      code:
        "CHECKPOINT_BRIDGE_REDUNDANT_HEADER"
    });
  });

  it("rejects truncated embedded header evidence", () => {
    const target =
      header(
        101n,
        new Uint8Array(32)
      );

    const justification =
      encodeGrandpaJustification(
        justificationFor(
          target
        )
      );

    const encoded =
      encodeFinalityProofForTest(
        target.hash,
        justification,
        [target]
      );

    const truncated =
      encoded.slice(
        0,
        encoded.length - 1
      );

    expect(() =>
      decodeFinalityProof(
        truncated
      )
    ).toThrow(
      /UNEXPECTED_EOF/
    );
  });
});
