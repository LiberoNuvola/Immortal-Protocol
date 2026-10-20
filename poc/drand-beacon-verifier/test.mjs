import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fetchBeacon } from "drand-client";
import { QUICKNET, createQuicknetClient, verifyFixedRound } from "./verify.mjs";

const FIXED_ROUND = 42;

test("pinned Quicknet identity and fixed historical round verify", async () => {
  const verified = await verifyFixedRound(FIXED_ROUND);
  assert.equal(verified.verification, "PASS");
  assert.equal(verified.round, FIXED_ROUND);
  assert.equal(verified.chainHash, QUICKNET.chainHash);
  assert.equal(verified.publicKey, QUICKNET.publicKey);
  assert.equal(verified.schemeID, QUICKNET.schemeID);
  assert.match(verified.signature, /^[0-9a-f]+$/i);
  assert.match(verified.randomness, /^[0-9a-f]{64}$/i);
});

test("rejects a beacon returned for a different round", async () => {
  const base = createQuicknetClient();
  const client = {
    options: base.options,
    chain: () => base.chain(),
    get: async (round) => {
      const beacon = await base.get(round);
      return { ...beacon, round: round + 1 };
    },
  };
  await assert.rejects(() => fetchBeacon(client, FIXED_ROUND), /not valid|expected round/i);
});

test("rejects a forged signature even when randomness is recomputed", async () => {
  const base = createQuicknetClient();
  const client = {
    options: base.options,
    chain: () => base.chain(),
    get: async (round) => {
      const beacon = await base.get(round);
      const otherRoundBeacon = await base.get(round + 1);
      // Use a genuine, well-formed signature from the adjacent round and keep
      // randomness consistent with that signature. Only the signed round is wrong.
      const signature = otherRoundBeacon.signature;
      const randomness = createHash("sha256").update(Buffer.from(signature, "hex")).digest("hex");
      return { ...beacon, signature, randomness };
    },
  };
  await assert.rejects(() => fetchBeacon(client, FIXED_ROUND), /not valid/i);
});
