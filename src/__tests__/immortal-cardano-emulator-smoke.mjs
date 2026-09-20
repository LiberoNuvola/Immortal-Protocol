/**
 * P2.8-B.0 — isolated ESM smoke test
 *
 * Lucid 0.10.11 is ESM-only.
 * This test deliberately bypasses the repository CommonJS/tsx boundary.
 *
 * Scope:
 *   - Lucid + Cardano Emulator
 *   - deterministic wallet
 *   - seeded UTxO
 *   - real transaction construction
 *   - signing
 *   - submission
 *   - real emulator ledger mutation
 */

import { Emulator, Lucid, generateSeedPhrase } from "lucid-cardano";

const seed = generateSeedPhrase();

const probe = await Lucid.new(
  new Emulator([]),
  "Preprod",
);

probe.selectWalletFromSeed(seed);

const address = await probe.wallet.address();

const emulator = new Emulator([
  {
    address,
    assets: {
      lovelace: 20_000_000n,
    },
  },
]);

const lucid = await Lucid.new(
  emulator,
  "Preprod",
);

lucid.selectWalletFromSeed(seed);

const before = await lucid.wallet.getUtxos();

if (before.length !== 1) {
  throw new Error(
    `Expected exactly one seeded UTxO, got ${before.length}`,
  );
}

if (before[0].assets.lovelace !== 20_000_000n) {
  throw new Error(
    `Unexpected initial lovelace: ${before[0].assets.lovelace}`,
  );
}

const tx = await lucid
  .newTx()
  .payToAddress(address, {
    lovelace: 1_000_000n,
  })
  .complete();

const signed = await tx.sign().complete();

const txHash = await signed.submit();

await emulator.awaitTx(txHash);

const after = await lucid.wallet.getUtxos();

if (after.length < 1) {
  throw new Error(
    "Emulator returned no wallet UTxOs after submission",
  );
}

const totalLovelace = after.reduce(
  (sum, utxo) => sum + utxo.assets.lovelace,
  0n,
);

if (
  totalLovelace <= 0n ||
  totalLovelace >= 20_000_000n
) {
  throw new Error(
    `Unexpected post-transaction wallet value: ${totalLovelace}`,
  );
}

console.log("P2.8-B.0 OK");
console.log("LUCID_EMULATOR_OK", true);
console.log("TX_HASH", txHash);
console.log("PRE_UTXO_COUNT", before.length);
console.log("POST_UTXO_COUNT", after.length);
console.log(
  "POST_TOTAL_LOVELACE",
  totalLovelace.toString(),
);