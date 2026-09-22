import { describe, expect, it } from "vitest";

import {
  encodeLocalizedPrecommitPayload
} from "../src/grandpa.js";

import {
  nobleEd25519
} from "../src/crypto.js";

import {
  verifyFinality
} from "../src/verifier.js";

import type {
  GrandpaJustification
} from "../src/grandpa.js";

import type {
  TrustedAuthorityState
} from "../src/authority.js";

import {
  bytesToHex,
  hexToBytes
} from "../src/scale.js";

/*
 * B3-03C — deterministic Ed25519 verification vector.
 *
 * The vector uses the canonical GRANDPA localized payload layout
 * confirmed against sp_consensus_grandpa:
 *
 *   SCALE(message, round, set_id)
 *
 * For this PoC, message is the GRANDPA Precommit:
 *
 *   target_hash || target_number
 *
 * The signatures below are deterministic Ed25519 signatures over that exact
 * 53-byte payload. No test crypto stub is used.
 *
 * The key identities are RFC 8032 Ed25519 test-vector public keys. The
 * signatures in this fixture are freshly generated over the canonical
 * GRANDPA localized payload and are therefore a synthetic cryptographic
 * conformance vector, not a claim of real Materios ledger provenance.
 *
 * IMPORTANT:
 * A real Materios signed GRANDPA justification remains a separate evidence
 * obligation. This fixture proves the local payload/signature verifier only.
 */

const targetHash = Uint8Array.from(
  Array.from({ length: 32 }, (_, i) => i)
);

const targetNumber = 42n;
const round = 7n;
const setId = 3n;

const expectedPayloadHex =
  "000102030405060708090a0b0c0d0e0f" +
  "101112131415161718191a1b1c1d1e1f" +
  "2a00000000000000" +
  "0700000000000000" +
  "0300000000000000";

const authorities = [
  {
    publicKey: hexToBytes(
      "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"
    ),
    weight: 1n
  },
  {
    publicKey: hexToBytes(
      "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c"
    ),
    weight: 1n
  },
  {
    publicKey: hexToBytes(
      "fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025"
    ),
    weight: 1n
  }
];

const signatures = [
  hexToBytes(
    "471aa58dbf8733dca0b0d3bf1d542f59bfc540b1ae40e99cd94373a95bbe02d954a6076303f0fde13c98291d7be12461a55bb9d6ce8cfdb67c6d9f752ddd180e"
  ),
  hexToBytes(
    "ff5004c2f0b5e73c843e80720cf36ebe586a0f5b97d7d528c21b3e5f42ec34cb3a2519bc7e0e90aaadc6a2778a5a144c3a54c7762f60331da1d07a2cf400410e"
  ),
  hexToBytes(
    "0d83f33330d39a1dc452fab8201d92bf3b54d373f2b732f0664a4473e141b527e009c8fcfd22818a3297a418fd3a428fc651d91f2647d01eb32c259dd5ec030b"
  )
];

function makeState(
  currentSetId = setId
): TrustedAuthorityState {
  return {
    chainId: "materios",
    genesisHash: new Uint8Array(32).fill(0x01),
    setId: currentSetId,
    authorities
  };
}

function makeJustification(
  currentRound = round,
  currentTargetHash = targetHash
): GrandpaJustification {
  return {
    round: currentRound,
    commit: {
      targetHash: currentTargetHash,
      targetNumber,
      precommits: authorities.map(
        (authority, index) => ({
          precommit: {
            targetHash: currentTargetHash,
            targetNumber
          },
          signer: authority.publicKey,
          signature: signatures[index]!
        })
      )
    },
    votesAncestries: []
  };
}

function makeCheckpoint(
  currentTargetHash = targetHash
) {
  return {
    chainId: "materios",
    genesisHash: new Uint8Array(32).fill(0x01),
    blockHash: currentTargetHash,
    blockNumber: targetNumber
  };
}

describe("B3-03C — real GRANDPA Ed25519 vector", () => {
  it("encodes the localized precommit payload exactly", () => {
    const payload = encodeLocalizedPrecommitPayload(
      {
        targetHash,
        targetNumber
      },
      round,
      setId
    );

    expect(payload.length).toBe(53);
    expect(bytesToHex(payload)).toBe(
      expectedPayloadHex
    );
  });

  it("accepts a real Ed25519 signature over the localized payload", async () => {
    const payload =
      encodeLocalizedPrecommitPayload(
        {
          targetHash,
          targetNumber
        },
        round,
        setId
      );

    const valid =
      await nobleEd25519.verify(
        signatures[0]!,
        payload,
        authorities[0]!.publicKey
      );

    expect(valid).toBe(true);
  });

  it("verifies a real GRANDPA quorum without a crypto stub", async () => {
    const result = await verifyFinality(
      makeCheckpoint(),
      makeJustification(),
      makeState(),
      nobleEd25519,
      {
        verifyAncestry: false
      }
    );

    expect(result.verified).toBe(true);
    expect(result.round).toBe(round);
    expect(result.setId).toBe(setId);
    expect(result.signedWeight).toBe(3n);
    expect(result.totalWeight).toBe(3n);
  });

  it("rejects the same signatures when the round changes", async () => {
    await expect(
      verifyFinality(
        makeCheckpoint(),
        makeJustification(round + 1n),
        makeState(),
        nobleEd25519,
        {
          verifyAncestry: false
        }
      )
    ).rejects.toMatchObject({
      code: "INVALID_SIGNATURE"
    });
  });

  it("rejects the same signatures when trusted setId changes", async () => {
    await expect(
      verifyFinality(
        makeCheckpoint(),
        makeJustification(),
        makeState(setId + 1n),
        nobleEd25519,
        {
          verifyAncestry: false
        }
      )
    ).rejects.toMatchObject({
      code: "INVALID_SIGNATURE"
    });
  });

  it("rejects the same signatures when the precommit target changes", async () => {
    const changedTarget = new Uint8Array(32).fill(0xff);

    await expect(
      verifyFinality(
        makeCheckpoint(changedTarget),
        makeJustification(round, changedTarget),
        makeState(),
        nobleEd25519,
        {
          verifyAncestry: false
        }
      )
    ).rejects.toMatchObject({
      code: "INVALID_SIGNATURE"
    });
  });

  it("rejects a mutated signature", async () => {
    const justification = makeJustification();
    justification.commit.precommits[0]!.signature =
      Uint8Array.from(signatures[0]!);

    justification.commit.precommits[0]!.signature[0] ^=
      0x01;

    await expect(
      verifyFinality(
        makeCheckpoint(),
        justification,
        makeState(),
        nobleEd25519,
        {
          verifyAncestry: false
        }
      )
    ).rejects.toMatchObject({
      code: "INVALID_SIGNATURE"
    });
  });

  it("rejects an authority key that is not the signing key", async () => {
    const state = makeState();

    state.authorities[0] = {
      publicKey: new Uint8Array(32).fill(0x99),
      weight: 1n
    };

    await expect(
      verifyFinality(
        makeCheckpoint(),
        makeJustification(),
        state,
        nobleEd25519,
        {
          verifyAncestry: false
        }
      )
    ).rejects.toMatchObject({
      code: "INVALID_SIGNATURE"
    });
  });

  it("does not allow trusted weight to turn an invalid signature into quorum", async () => {
    const state = makeState();

    state.authorities[0]!.weight = 100n;

    const justification = makeJustification();
    justification.commit.precommits[0]!.signature =
      new Uint8Array(64);

    await expect(
      verifyFinality(
        makeCheckpoint(),
        justification,
        state,
        nobleEd25519,
        {
          verifyAncestry: false
        }
      )
    ).rejects.toMatchObject({
      code: "INVALID_SIGNATURE"
    });
  });
});
