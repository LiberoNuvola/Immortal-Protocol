/**
 * Genesis carrier singleton authority — emulator ledger evidence.
 *
 * This is a non-production fixture. It proves the one-shot minting policy
 * against a real Lucid/Cardano emulator using the exported Plutus artifact:
 *
 *   seed TxOutRef -> mint exactly one carrier -> carrier UTxO
 *   same seed again -> rejected
 *   burn -> rejected
 *   two other seeds -> two independent policies and candidate carrier UTxOs
 *     at the same unparameterized Genesis validator address
 *
 * The parallel-carrier probe demonstrates that one-shot is per seed, not a
 * global singleton identity. It does not execute ActivateGenesis or prove a
 * production deployment.
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
    { address, assets: { lovelace: SEED_LOVELACE } },
    { address, assets: { lovelace: SEED_LOVELACE } },
    { address, assets: { lovelace: SEED_LOVELACE } },
  ]);
  const lucid = await Lucid.new(emulator, "Preprod");
  lucid.selectWalletFromSeed(seed);

  const seedUtxos = await lucid.utxosAt(address);
  if (seedUtxos.length !== 3) throw new Error("expected three deterministic seed UTxOs");
  const [seedUtxo, independentSeedUtxoA, independentSeedUtxoB] = seedUtxos;

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

  const carrierValidatorEnvelope = JSON.parse(
    readFileSync("plutus/out/genesisRegimeCarrier.plutus.json", "utf8"),
  );
  if (carrierValidatorEnvelope.type !== "PlutusScriptV2" || !carrierValidatorEnvelope.cborHex) {
    throw new Error("invalid exported Genesis regime carrier validator");
  }
  const carrierValidator = { type: "PlutusV2", script: carrierValidatorEnvelope.cborHex };
  const carrierAddress = lucid.utils.validatorToAddress(carrierValidator);
  const carrierValidatorHash = lucid.utils.validatorToScriptHash(carrierValidator);

  function candidateGenesisDatum(candidatePolicyId) {
    return new Constr(0, [
      0n,                         // PRE_GENESIS
      0n,                         // transition nonce
      "00".repeat(28),           // datum-supplied Treasury ScriptHash (fixture)
      "11".repeat(28),           // datum-supplied PRE policy (fixture)
      "5052452d52494348",        // PRE-RICH asset name
      "22".repeat(28),           // datum-supplied Oracle policy (fixture)
      "4f5241434c45",            // ORACLE token name
      "33".repeat(28),           // datum-supplied Oracle publisher (fixture)
      candidatePolicyId,
      CARRIER_NAME_HEX,
      "44".repeat(28),           // datum-supplied PrizePool ScriptHash (fixture)
      1n,                         // state version
    ]);
  }

  async function mintIndependentCandidate(seedInput) {
    const candidatePolicy = applyPolicy(factory, seedInput);
    const candidatePolicyId = lucid.utils.mintingPolicyToId(candidatePolicy);
    const candidateUnit = candidatePolicyId + CARRIER_NAME_HEX;
    const tx = await lucid
      .newTx()
      .collectFrom([seedInput])
      .mintAssets({ [candidateUnit]: 1n }, Data.void())
      .attachMintingPolicy(candidatePolicy)
      .payToContract(
        carrierAddress,
        { inline: Data.to(candidateGenesisDatum(candidatePolicyId)) },
        { lovelace: CARRIER_LOVELACE, [candidateUnit]: 1n },
      )
      .complete();
    const txHash = await (await tx.sign().complete()).submit();
    await lucid.awaitTx(txHash);
    return { candidatePolicyId, candidateUnit, txHash };
  }

  const independentA = await mintIndependentCandidate(independentSeedUtxoA);
  const independentB = await mintIndependentCandidate(independentSeedUtxoB);
  if (
    independentA.candidatePolicyId === independentB.candidatePolicyId ||
    independentA.candidatePolicyId === policyId ||
    independentB.candidatePolicyId === policyId
  ) {
    throw new Error("independent seed references did not derive distinct carrier policies");
  }

  const parallelCarrierUtxos = await lucid.utxosAt(carrierAddress);
  const parallelCarrierA = parallelCarrierUtxos.find(
    (utxo) => (utxo.assets[independentA.candidateUnit] ?? 0n) === 1n,
  );
  const parallelCarrierB = parallelCarrierUtxos.find(
    (utxo) => (utxo.assets[independentB.candidateUnit] ?? 0n) === 1n,
  );
  if (!parallelCarrierA || !parallelCarrierB) {
    throw new Error("independent candidate carrier UTxOs were not both found at the same validator address");
  }

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
    parallelCarrierProbe: {
      production: false,
      validatorAddress: carrierAddress,
      validatorPaymentScriptHash: carrierValidatorHash,
      candidatePolicyIds: [independentA.candidatePolicyId, independentB.candidatePolicyId],
      candidateCarrierUnits: [independentA.candidateUnit, independentB.candidateUnit],
      candidateSeedRefs: [
        independentSeedUtxoA.txHash + "#" + independentSeedUtxoA.outputIndex,
        independentSeedUtxoB.txHash + "#" + independentSeedUtxoB.outputIndex,
      ],
      candidateMintTransactionRefs: [independentA.txHash, independentB.txHash],
      candidateCarrierUtxoRefs: [
        parallelCarrierA.txHash + "#" + parallelCarrierA.outputIndex,
        parallelCarrierB.txHash + "#" + parallelCarrierB.outputIndex,
      ],
      distinctPolicies: independentA.candidatePolicyId !== independentB.candidatePolicyId,
      bothAtSameValidatorAddress: parallelCarrierA.address === carrierAddress && parallelCarrierB.address === carrierAddress,
      parallelCandidateUtxosObserved: true,
      activateGenesisExecuted: false,
      interpretation: "Two different seed references produce two independently valid one-shot policies and two PRE_GENESIS-shaped carrier outputs at the same unparameterized Genesis validator address; the mint policy does not provide global singleton uniqueness.",
    },
    conclusion:
      "one-shot policy rejects replay and burn for one seed, while different seeds create distinct candidate carrier policies that coexist at the same Genesis validator address; this does not establish a globally canonical Genesis regime singleton",
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
