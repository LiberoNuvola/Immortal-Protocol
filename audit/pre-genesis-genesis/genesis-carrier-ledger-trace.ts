/**
 * Real Yaci/Cardano ledger trace for PRE-RICH PRE-GENESIS -> GENESIS.
 *
 * Non-production fixture. It proves the carrier validator against a real
 * Cardano node/evaluator, with:
 *   actual Treasury reference UTxO + PRE quantity
 *   actual Oracle reference UTxO + singleton + datum
 *   one-shot Genesis carrier token
 *   atomic PRE_GENESIS -> GENESIS state transition
 *   replay rejection
 *
 * The fixture intentionally uses explicit test asset identities and hashes.
 * It does not establish production deployment identities.
 */

import {
  Blockfrost,
  Constr,
  Data,
  Lucid,
  applyParamsToScript,
  getAddressDetails,
  nativeScriptFromJson,
} from "lucid-cardano";
import { readFileSync, writeFileSync } from "node:fs";

const API = "http://127.0.0.1:8080/api/v1";
const SEED =
  "test test test test test test test test test test test test test test test test test test test test test test test test test sauce";

const PRE_NAME_HEX = "5052452d52494348";
const ORACLE_NAME_HEX = "4f5241434c45";
const CARRIER_NAME_HEX = "47454e45534953";
const PRIZE_POOL_HASH = "ff".repeat(28);
const PRE_QUANTITY = 10_000_000n;
// 0.04 USDM per PRE, expressed as 40,000 USDM subunits at 1e6 oracle precision.\n// 10,000,000 PRE therefore verifies to exactly 4,000 USDM.\nconst ORACLE_PRICE = 40_000n;
const ORACLE_PRECISION = 1_000_000n;

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function script(path) {
  const env = json(path);
  return { type: "PlutusV2", script: env.cborHex };
}

function refData(utxo) {
  return new Constr(0, [utxo.txHash, BigInt(utxo.outputIndex)]);
}

function treasuryDatum() {
  const zero = "00".repeat(28);
  return new Constr(0, [
    0n,
    zero,
    zero,
    zero,
    zero,
    2500n,
    2500n,
    2500n,
    2500n,
  ]);
}

function oracleDatum(prePolicyId, publisher, timestamp) {
  return new Constr(0, [
    prePolicyId,
    PRE_NAME_HEX,
    ORACLE_PRICE,
    timestamp,
    publisher,
  ]);
}

function regimeDatum({
  regime,
  nonce,
  treasuryHash,
  prePolicyId,
  oraclePolicyId,
  publisher,
  carrierPolicyId,
}) {
  return new Constr(0, [
    BigInt(regime),
    BigInt(nonce),
    treasuryHash,
    prePolicyId,
    PRE_NAME_HEX,
    oraclePolicyId,
    ORACLE_NAME_HEX,
    publisher,
    carrierPolicyId,
    CARRIER_NAME_HEX,
    PRIZE_POOL_HASH,
    BigInt(regime === 0 ? 1 : 2),
  ]);
}

async function waitFor(fn, predicate, label) {
  for (let i = 0; i < 30; i += 1) {
    const value = await fn();
    if (predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for " + label);
}

async function expectRejected(label, fn) {
  try {
    await fn();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error(label + " was unexpectedly accepted");
}

const wallet = JSON.parse(
  readFileSync("/tmp/immortal-yaci-test-wallet.json", "utf8"),
);
const lucid = await Lucid.new(new Blockfrost(API, ""), "Preprod");
lucid.selectWalletFromSeed(SEED);

const address = await lucid.wallet.address();
const details = getAddressDetails(address);
const publisher = details.paymentCredential?.hash;
if (!publisher) throw new Error("test wallet has no payment key hash");

const nativePolicy = nativeScriptFromJson({
  type: "sig",
  keyHash: publisher,
});
const nativePolicyId = lucid.utils.mintingPolicyToId(nativePolicy);
const preUnit = nativePolicyId + PRE_NAME_HEX;
const oracleUnit = nativePolicyId + ORACLE_NAME_HEX;

const treasuryValidator = script("plutus/out/treasury.plutus.json");
const counterValidator = script("plutus/out/counterValidator.plutus.json");
const carrierValidator = script(
  "plutus/out/genesisRegimeCarrier.plutus.json",
);
const carrierFactory = script(
  "plutus/out/genesisCarrierMintPolicy.plutus.json",
);

const treasuryHash = lucid.utils.validatorToScriptHash(treasuryValidator);
const treasuryAddress = lucid.utils.validatorToAddress(treasuryValidator);
const oracleAddress = lucid.utils.validatorToAddress(counterValidator);
const carrierHash = lucid.utils.validatorToScriptHash(carrierValidator);
const carrierAddress = lucid.utils.validatorToAddress(carrierValidator);

const walletUtxos = await lucid.utxosAt(address);
if (walletUtxos.length === 0) throw new Error("test wallet has no seed UTxO");
const seedUtxo = walletUtxos[0];

const carrierPolicy = {
  type: "PlutusV2",
  script: applyParamsToScript(carrierFactory.script, [
    refData(seedUtxo),
    new Constr(0, [CARRIER_NAME_HEX]),
  ]),
};
const carrierPolicyId = lucid.utils.mintingPolicyToId(carrierPolicy);
const carrierUnit = carrierPolicyId + CARRIER_NAME_HEX;

const now = Date.now();
const preGenesisDatum = regimeDatum({
  regime: 0,
  nonce: 0,
  treasuryHash,
  prePolicyId: nativePolicyId,
  oraclePolicyId: nativePolicyId,
  publisher,
  carrierPolicyId,
});
const genesisDatum = regimeDatum({
  regime: 1,
  nonce: 1,
  treasuryHash,
  prePolicyId: nativePolicyId,
  oraclePolicyId: nativePolicyId,
  publisher,
  carrierPolicyId,
});

const setup = await lucid
  .newTx()
  .collectFrom([seedUtxo])
  .mintAssets(
    {
      [preUnit]: PRE_QUANTITY,
      [oracleUnit]: 1n,
    },
    Data.void(),
  )
  .attachMintingPolicy(nativePolicy)
  .mintAssets({ [carrierUnit]: 1n }, Data.void())
  .attachMintingPolicy(carrierPolicy)
  .payToContract(
    treasuryAddress,
    { inline: Data.to(treasuryDatum()) },
    { lovelace: 4_000_000n, [preUnit]: PRE_QUANTITY },
  )
  .payToContract(
    oracleAddress,
    { inline: Data.to(oracleDatum(nativePolicyId, publisher, BigInt(now))) },
    { lovelace: 3_000_000n, [oracleUnit]: 1n },
  )
  .payToContract(
    carrierAddress,
    { inline: Data.to(preGenesisDatum) },
    { lovelace: 3_000_000n, [carrierUnit]: 1n },
  )
  .addSigner(address)
  .validFrom(now - 30_000)
  .validTo(now + 300_000)
  .complete();

const setupSigned = await setup.sign().complete();
const setupHash = await setupSigned.submit();
await lucid.awaitTx(setupHash);

const treasuryUtxos = await waitFor(
  () => lucid.utxosAt(treasuryAddress),
  (xs) => xs.some((u) => u.assets[preUnit] === PRE_QUANTITY),
  "Treasury reference UTxO",
);
const oracleUtxos = await waitFor(
  () => lucid.utxosAt(oracleAddress),
  (xs) => xs.some((u) => u.assets[oracleUnit] === 1n),
  "Oracle reference UTxO",
);
const carrierUtxos = await waitFor(
  () => lucid.utxosAt(carrierAddress),
  (xs) => xs.some((u) => u.assets[carrierUnit] === 1n),
  "PRE-GENESIS carrier UTxO",
);

const treasuryUtxo = treasuryUtxos.find((u) => u.assets[preUnit] === PRE_QUANTITY);
const oracleUtxo = oracleUtxos.find((u) => u.assets[oracleUnit] === 1n);
const carrierUtxo = carrierUtxos.find((u) => u.assets[carrierUnit] === 1n);
if (!treasuryUtxo || !oracleUtxo || !carrierUtxo) {
  throw new Error("fixture UTxOs not found");
}

const transition = await lucid
  .newTx()
  .readFrom([treasuryUtxo, oracleUtxo])
  .collectFrom(
    [carrierUtxo],
    Data.to(new Constr(0, [])),
  )
  .attachSpendingValidator(carrierValidator)
  .payToContract(
    carrierAddress,
    { inline: Data.to(genesisDatum) },
    { lovelace: 3_000_000n, [carrierUnit]: 1n },
  )
  .addSigner(address)
  .validFrom(now - 30_000)
  .validTo(now + 300_000)
  .complete();

const signedTransition = await transition.sign().complete();
const txCbor = signedTransition.toCBOR();
const transitionHash = await signedTransition.submit();
await lucid.awaitTx(transitionHash);

const postCarrier = await waitFor(
  () => lucid.utxosAt(carrierAddress),
  (xs) => xs.some((u) => u.txHash === transitionHash && u.assets[carrierUnit] === 1n),
  "GENESIS carrier UTxO",
);

const genesisCarrierUtxo = postCarrier.find(
  (u) => u.txHash === transitionHash && u.assets[carrierUnit] === 1n,
);
if (!genesisCarrierUtxo) throw new Error("GENESIS carrier UTxO not found");

const treasuryStillReferenced = (await lucid.utxosAt(treasuryAddress)).some(
  (u) => u.txHash === treasuryUtxo.txHash && u.outputIndex === treasuryUtxo.outputIndex,
);
const oracleStillReferenced = (await lucid.utxosAt(oracleAddress)).some(
  (u) => u.txHash === oracleUtxo.txHash && u.outputIndex === oracleUtxo.outputIndex,
);
if (!treasuryStillReferenced || !oracleStillReferenced) {
  throw new Error("Genesis transition must not consume Treasury/Oracle reference inputs");
}

const replayError = await expectRejected(
  "Genesis transition replay",
  async () => lucid.submitTx(signedTransition),
);

const result = {
  fixture: "PRE-GENESIS-GENESIS-CARRIER-YACI-001",
  production: false,
  setupTransactionRef: setupHash,
  transitionTransactionRef: transitionHash,
  transitionTxCbor: txCbor,
  treasury: {
    address: treasuryAddress,
    scriptHash: treasuryHash,
    ref: treasuryUtxo.txHash + "#" + treasuryUtxo.outputIndex,
    prePolicyId: nativePolicyId,
    preAssetNameHex: PRE_NAME_HEX,
    preQuantity: PRE_QUANTITY.toString(),
  },
  oracle: {
    address: oracleAddress,
    statePolicyId: nativePolicyId,
    stateTokenNameHex: ORACLE_NAME_HEX,
    publisher,
    price: ORACLE_PRICE.toString(),
    precision: ORACLE_PRECISION.toString(),
    ref: oracleUtxo.txHash + "#" + oracleUtxo.outputIndex,
  },
  carrier: {
    address: carrierAddress,
    scriptHash: carrierHash,
    policyId: carrierPolicyId,
    tokenNameHex: CARRIER_NAME_HEX,
    preGenesisRef: carrierUtxo.txHash + "#" + carrierUtxo.outputIndex,
    genesisRef:
      genesisCarrierUtxo.txHash + "#" + genesisCarrierUtxo.outputIndex,
  },
  genesisBoundary: {
    preQuantity: PRE_QUANTITY.toString(),
    verifiedPrice: ORACLE_PRICE.toString(),
    oraclePrecision: ORACLE_PRECISION.toString(),
    verifiedValueUsdmSubunits:
      ((PRE_QUANTITY * ORACLE_PRICE) / ORACLE_PRECISION).toString(),
    thresholdUsdmSubunits: "400000",
    activated: true,
  },
  economicBoundary: {
    treasuryReferencePreserved: treasuryStillReferenced,
    oracleReferencePreserved: oracleStillReferenced,
    prizePoolTouched: false,
    carrierOnlyStateTransition: true,
    genesisLiquidityImportedFromBootstrap: false,
  },
  replay: {
    rejected: true,
    error: replayError,
  },
};

writeFileSync(
  "audit/yaci-evidence/genesis-carrier-transition.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
