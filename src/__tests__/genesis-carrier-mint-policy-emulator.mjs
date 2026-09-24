/**
 * Genesis carrier singleton authority — emulator ledger evidence.
 *
 * This is a non-production fixture. It proves the one-shot minting policy
 * against a real Lucid/Cardano emulator using the exported Plutus artifact:
 *
 *   seed TxOutRef -> mint exactly one carrier -> carrier UTxO
 *   same seed again -> rejected
 *   burn -> rejected
 *
 * It does not prove deployment identity or ActivateGenesis semantics.
 */

import {
  Constr,
  Data,
  Emulator,
  Lucid,
  applyParamsToScript,
  generateSeedPhrase,
} from "lucid-cardano";
import { readFileSync } from "node:fs";

const CARRIER_NAME_HEX = "47454e45534953"; // GENESIS — fixture only
const SEED_LOVELACE = 50_000_000n;
const CARRIER_LOVELACE = 2_000_000n;

function loadPolicy() {
  const envelope = JSON.parse(
    readFileSync("plutus/out/genesisCarrierMintPolicy.plutus.json", "utf8"),
  );
  if (envelope.type !== "PlutusScriptV2" || !envelope.cborHex) {
    throw new Error("invalid exported Genesis carrier mint policy");
  }
  return { type: "PlutusV2", script: envelope.cborHex };
}

function txOutRefData(utxo) {
  return new Constr(0, [utxo.txHash, BigInt(utxo.outputIndex)]);
}

function tokenNameData() {
  return new Constr(0, [CARRIER_NAME_HEX]);
}

function applyPolicy(factory, seedUtxo) {
  return {
    type: "PlutusV2",
    script: applyParamsToScript(factory.script, [
      txOutRefData(seedUtxo),
      tokenNameData(),
    ]),
  };
}

async function expectRejected(label, fn) {
  try {
    await fn();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error(label + " was unexpectedly accepted");
}

async function main() {
  const seed = generateSeedPhrase();
  const bootstrap = await Lucid.new(new Emulator([]), "Preprod");
  bootstrap.selectWalletFromSeed(seed);
  const address = await bootstrap.wallet.address();

  const emulator = new Emulator([
    {
      address,
      assets: { lovelace: SEED_LOVELACE },
    },
  ]);
  const lucid = await Lucid.new(emulator, "Preprod");
  lucid.selectWalletFromSeed(seed);

  const seedUtxos = await lucid.utxosAt(address);
  if (seedUtxos.length !== 1) throw new Error("expected one deterministic seed UTxO");
  const seedUtxo = seedUtxos[0];

  const factory = loadPolicy();
  const policy = applyPolicy(factory, seedUtxo);
  const policyId = lucid.utils.mintingPolicyToId(policy);
  const carrierUnit = policyId + CARRIER_NAME_HEX;

  const mintTx = await lucid
    .newTx()
    .collectFrom([seedUtxo])
    .mintAssets({ [carrierUnit]: 1n }, Data.void())
    .attachMintingPolicy(policy)
    .payToAddress(address, {
      lovelace: CARRIER_LOVELACE,
      [carrierUnit]: 1n,
    })
    .complete();

  const mintHash = await (await mintTx.sign().complete()).submit();
  await lucid.awaitTx(mintHash);

  const carrierUtxos = await lucid.utxosAt(address);
  const carrierUtxo = carrierUtxos.find((u) => u.assets[carrierUnit] === 1n);
  if (!carrierUtxo) throw new Error("minted carrier UTxO not found");

  const duplicateError = await expectRejected("duplicate one-shot mint", async () => {
    await lucid
      .newTx()
      .mintAssets({ [carrierUnit]: 1n }, Data.void())
      .attachMintingPolicy(policy)
      .payToAddress(address, {
        lovelace: CARRIER_LOVELACE,
        [carrierUnit]: 1n,
      })
      .complete()
      .then((tx) => tx.sign().complete())
      .then((tx) => tx.submit());
  });

  const burnError = await expectRejected("carrier burn", async () => {
    await lucid
      .newTx()
      .collectFrom([carrierUtxo])
      .mintAssets({ [carrierUnit]: -1n }, Data.void())
      .attachMintingPolicy(policy)
      .payToAddress(address, { lovelace: CARRIER_LOVELACE })
      .complete()
      .then((tx) => tx.sign().complete())
      .then((tx) => tx.submit());
  });

  const result = {
    fixture: "GENESIS-CARRIER-SINGLETON-EMULATOR-001",
    production: false,
    policyId,
    carrierNameHex: CARRIER_NAME_HEX,
    carrierUnit,
    seedRef: seedUtxo.txHash + "#" + seedUtxo.outputIndex,
    mintTransactionRef: mintHash,
    carrierUtxoRef: carrierUtxo.txHash + "#" + carrierUtxo.outputIndex,
    mintedQuantity: "1",
    duplicateMintRejected: true,
    duplicateMintError: duplicateError,
    burnRejected: true,
    burnError,
    conclusion:
      "one-shot policy accepts exactly one configured carrier mint tied to the consumed seed UTxO; replay and burn are rejected",
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
