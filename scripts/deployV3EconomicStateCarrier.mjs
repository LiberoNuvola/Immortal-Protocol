/**
 * Preprod V3 Economic State Carrier deployment.
 *
 * This script deliberately FAILS CLOSED unless the operator supplies:
 *   - a real local deployment seed (V3_DEPLOYMENT_SEED);
 *   - an explicit canonical initial V3 state JSON file (V3_INITIAL_STATE_FILE).
 *
 * It never invents caps, saleability, protected capital, jackpot values or
 * economic state. It only derives the deployment-specific singleton policy,
 * parameterizes the validator with that policy identity, mints exactly one
 * carrier token from the consumed seed UTxO, and creates the initial carrier
 * UTxO.
 *
 * Provider credentials and the deployment seed are local secrets and MUST NOT
 * be committed.
 */

import {
  Constr,
  Data,
  Lucid,
  Blockfrost,
  applyParamsToScript,
} from "lucid-cardano";
import { readFileSync } from "node:fs";

const NETWORK = "Preprod";
const CARRIER_NAME_HEX = "563345434f4e4f4d49435354415445"; // V3ECONOMICSTATE
const CARRIER_LOVELACE = 5_000_000n;

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function loadEnvelope(path, label) {
  const envelope = JSON.parse(readFileSync(path, "utf8"));
  if (!envelope?.cborHex) throw new Error(`invalid ${label} artifact: ${path}`);
  return { type: "PlutusV2", script: envelope.cborHex };
}

function txOutRefData(utxo) {
  return new Constr(0, [utxo.txHash, BigInt(utxo.outputIndex)]);
}

function tokenNameData() {
  return new Constr(0, [CARRIER_NAME_HEX]);
}

function boolData(value) {
  return value ? new Constr(1, []) : new Constr(0, []);
}

function parseInteger(value, field) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`${field} must be an integer encoded as a JSON number/string`);
  }
  if (!/^-?\\d+$/.test(String(value))) throw new Error(`${field} must be an integer`);
  return BigInt(value);
}

function parseState(path) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const s = raw.state ?? raw;
  const requiredFields = [
    "crystallizedLiabilities",
    "unresolvedReserve",
    "unresolvedTicketCount",
    "safetyCapital",
    "reserveProtection",
    "mandatoryFutureCosts",
    "classes",
    "control",
    "jackpot",
  ];
  for (const field of requiredFields) {
    if (s[field] === undefined) throw new Error(`initial V3 state missing ${field}`);
  }
  if (!Array.isArray(s.classes) || s.classes.length !== 8) {
    throw new Error("initial V3 state must contain exactly 8 canonical classes");
  }

  const prices = [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n];
  const classes = s.classes.map((c, i) => {
    for (const field of ["classId", "issued", "unresolved", "exposure", "cap", "saleable"]) {
      if (c[field] === undefined) throw new Error(`class ${i} missing ${field}`);
    }
    const classId = parseInteger(c.classId, `class ${i}.classId`);
    const issued = parseInteger(c.issued, `class ${i}.issued`);
    const unresolved = parseInteger(c.unresolved, `class ${i}.unresolved`);
    const exposure = parseInteger(c.exposure, `class ${i}.exposure`);
    const cap = parseInteger(c.cap, `class ${i}.cap`);
    if (classId !== BigInt(i)) throw new Error(`class IDs must be exactly 0..7; found ${classId} at index ${i}`);
    if (issued < 0n || unresolved < 0n || exposure < 0n || cap < 0n) throw new Error(`class ${i} contains a negative value`);
    if (unresolved > issued) throw new Error(`class ${i}: unresolved > issued`);
    if (exposure !== prices[i] * unresolved) throw new Error(`class ${i}: exposure != canonical price × unresolved`);
    return new Constr(0, [classId, issued, unresolved, exposure, cap, boolData(Boolean(c.saleable))]);
  });

  const ints = [
    "crystallizedLiabilities",
    "unresolvedReserve",
    "unresolvedTicketCount",
    "safetyCapital",
    "reserveProtection",
    "mandatoryFutureCosts",
  ].map((f) => parseInteger(s[f], f));
  if (ints.some((v) => v < 0n)) throw new Error("initial V3 state contains a negative economic value");

  const unresolvedReserve = ints[1];
  const unresolvedCount = ints[2];
  const derivedReserve = s.classes.reduce((sum, c) => sum + parseInteger(c.exposure, "class.exposure"), 0n);
  const derivedCount = s.classes.reduce((sum, c) => sum + parseInteger(c.unresolved, "class.unresolved"), 0n);
  if (unresolvedReserve !== derivedReserve) throw new Error("unresolvedReserve does not equal class exposure sum");
  if (unresolvedCount !== derivedCount) throw new Error("unresolvedTicketCount does not equal class unresolved sum");

  const current = parseInteger(s.control.currentActiveClass, "control.currentActiveClass");
  const highest = parseInteger(s.control.highestClassEverActivated, "control.highestClassEverActivated");
  if (current < 0n || current > 7n || highest < current || highest > 7n) throw new Error("invalid V3 control state");

  const jackpotStatus = s.jackpot.status;
  if (jackpotStatus !== "inactive" && jackpotStatus !== "locked") {
    throw new Error("initial V3 jackpot status must be explicitly inactive or locked");
  }
  const jackpotStatusIndex = jackpotStatus === "inactive" ? 0 : 1;
  const lockedAmount = parseInteger(s.jackpot.lockedAmount, "jackpot.lockedAmount");
  const threshold = parseInteger(s.jackpot.threshold, "jackpot.threshold");
  const cycle = parseInteger(s.jackpot.cycle, "jackpot.cycle");
  if (lockedAmount < 0n || threshold < 0n || cycle < 0n) throw new Error("invalid initial V3 jackpot state");

  const state = new Constr(0, [
    ...ints,
    classes,
    new Constr(0, [current, highest]),
    new Constr(0, [lockedAmount, threshold, new Constr(jackpotStatusIndex, []), cycle]),
  ]);
  return state;
}

async function main() {
  const blockfrostUrl = required("VITE_BLOCKFROST_PREPROD_URL");
  const projectId = required("VITE_BLOCKFROST_PROJECT_ID");
  const seed = required("V3_DEPLOYMENT_SEED");
  const stateFile = required("V3_INITIAL_STATE_FILE");

  const lucid = await Lucid.new(new Blockfrost(blockfrostUrl, projectId), NETWORK);
  lucid.selectWalletFromSeed(seed);

  const address = await lucid.wallet.address();
  const seedUtxos = await lucid.utxosAt(address);
  if (seedUtxos.length === 0) throw new Error("deployment wallet has no Preprod UTxO");
  if (seedUtxos.length !== 1) throw new Error("refusing ambiguous deployment seed: expected exactly one seed UTxO");
  const seedUtxo = seedUtxos[0];

  const policyFactory = loadEnvelope(
    "plutus/out/v3EconomicStateCarrierMintPolicy.plutus.json",
    "V3 carrier mint policy",
  );
  const validatorFactory = loadEnvelope(
    "plutus/out/v3EconomicStateCarrier.plutus.json",
    "V3 carrier validator",
  );

  const policy = {
    type: "PlutusV2",
    script: applyParamsToScript(policyFactory.script, [
      txOutRefData(seedUtxo),
      tokenNameData(),
    ]),
  };
  const policyId = lucid.utils.mintingPolicyToId(policy);
  const unit = policyId + CARRIER_NAME_HEX;

  const validator = {
    type: "PlutusV2",
    script: applyParamsToScript(validatorFactory.script, [
      policyId,
      CARRIER_NAME_HEX,
    ]),
  };
  const carrierAddress = lucid.utils.validatorToAddress(validator);
  const initialState = parseState(stateFile);
  const datum = new Constr(0, [0n, initialState]);

  const tx = await lucid
    .newTx()
    .collectFrom([seedUtxo])
    .mintAssets({ [unit]: 1n }, Data.void())
    .attachMintingPolicy(policy)
    .payToContract(
      carrierAddress,
      { inline: Data.to(datum) },
      { lovelace: CARRIER_LOVELACE, [unit]: 1n },
    )
    .complete();

  const signed = await tx.sign().complete();
  const txHash = await signed.submit();
  await lucid.awaitTx(txHash);

  const carrierUtxos = await lucid.utxosAt(carrierAddress);
  const matches = carrierUtxos.filter((u) => u.assets[unit] === 1n);
  if (matches.length !== 1) throw new Error(`expected exactly one deployed carrier UTxO, found ${matches.length}`);

  console.log(JSON.stringify({
    production: true,
    network: NETWORK,
    seedRef: seedUtxo.txHash + "#" + seedUtxo.outputIndex,
    policyId,
    carrierNameHex: CARRIER_NAME_HEX,
    carrierUnit: unit,
    carrierAddress,
    deploymentTransactionRef: txHash,
    carrierUtxoRef: matches[0].txHash + "#" + matches[0].outputIndex,
    stateVersion: "0",
    initialStateFile: stateFile,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
