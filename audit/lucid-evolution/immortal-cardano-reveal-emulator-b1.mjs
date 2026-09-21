/**
 * P2.8-B.1 — Lucid Evolution diagnostic harness
 *
 * PURPOSE
 *   Re-run the same real PRE-RICH Plutus V2 Reveal semantics used by the
 *   canonical Lucid 0.10.11 fixture, but on the maintained
 *   @lucid-evolution/lucid 0.6.2 execution substrate.
 *
 * NON-GOALS
 *   - no economic changes
 *   - no validator edits
 *   - no DApp/Adapter wiring
 *   - no substitution of this Emulator for a Cardano testnet
 *
 * TRACEABILITY
 *   canonical commit:
 *   1e64ec9f31ba50e04e36b4576ba66d73bfefc0a8
 *
 *   same real artifacts:
 *   - src/plutusScripts/prizeValidatorFactory.plutus.json
 *   - src/plutusScripts/b1PrizePoolFactory.plutus.json
 *   - src/plutusScripts/beaconRegistry.plutus.json
 *
 * The Reveal path uses reference scripts so the execution transaction does
 * not carry the full validator programs. Reference-script setup is split into
 * separate transactions, matching the size constraint observed previously.
 */

import {
  Lucid,
  Emulator,
  generateEmulatorAccount,
  PROTOCOL_PARAMETERS_DEFAULT,
  Constr,
  Data,
  applyParamsToScript,
  validatorToScriptHash,
  validatorToAddress,
} from "@lucid-evolution/lucid";

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function loadScript(name) {
  return JSON.parse(
    readFileSync(join(ROOT, "src", "plutusScripts", name), "utf8"),
  );
}

function bytes(value) {
  return String(value).toLowerCase();
}

function toData(constr) {
  return Data.to(constr);
}

function c(index, fields = []) {
  return new Constr(index, fields);
}

function hexBytes(value) {
  const clean = value.startsWith("0x") ? value.slice(2) : value;
  if (clean.length % 2 !== 0) throw new Error("odd hex length");
  return Uint8Array.from(clean.match(/../g)?.map((x) => parseInt(x, 16)) ?? []);
}

function text(value) {
  return new TextEncoder().encode(value);
}

function concat(...parts) {
  return Uint8Array.from(parts.flatMap((p) => [...p]));
}

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", value));
}

function integerToBytes(n) {
  let x = BigInt(n);
  if (x < 0n) x = 0n;
  if (x === 0n) return Uint8Array.of(48);

  const digits = [];
  while (x > 0n) {
    digits.unshift(48 + Number(x % 10n));
    x /= 10n;
  }
  return Uint8Array.from(digits);
}

function field(value) {
  const len = integerToBytes(value.length);
  return Uint8Array.from([...len, ...value]);
}

function fieldInteger(n) {
  return field(integerToBytes(n));
}

function toHex(value) {
  return Array.from(value)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

const DOMAIN = {
  beacon: text("PRE-RICH/BEACON/V1"),
  player: text("PRE-RICH/PLAYER/V1"),
  game: text("PRE-RICH/GAME/V1"),
  symbols: text("PRE-RICH/SYMBOLS/V1"),
  ticket: text("PRE-RICH/TICKET/V2"),
};

const zeroPolicy = "00".repeat(28);
const zeroToken = "00";

const poolPolicy = "11".repeat(28);
const poolToken = "504f4f4c";

const ticketPolicy = "22".repeat(28);
const ticketName = "5449434b45542d32";

const oraclePublisher = "33".repeat(28);

const target = {
  networkId: 1,
  round: 7,
  mainchainRef: hexBytes("aa".repeat(16)),
  version: hexBytes("01"),
};

const playerSecret = hexBytes(
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
);

const ticketNonce = 42;
const priceUsdm = 200;
const gameVersion = hexBytes("01");
const mcHash = hexBytes("bb".repeat(32));
const materiosContext = hexBytes("cc".repeat(16));
const expiresAt = 4_000_000_000_000;

async function deriveBeacon() {
  return sha256(
    concat(
      field(DOMAIN.beacon),
      fieldInteger(target.networkId),
      fieldInteger(target.round),
      field(target.mainchainRef),
      field(mcHash),
      field(materiosContext),
      field(target.version),
    ),
  );
}

async function derivePlayerCommitment() {
  return sha256(
    concat(
      field(DOMAIN.player),
      fieldInteger(target.round),
      fieldInteger(ticketNonce),
      field(playerSecret),
    ),
  );
}

async function deriveTicketCommitment(playerCommitmentValue) {
  return sha256(
    concat(
      field(DOMAIN.ticket),
      field(hexBytes(ticketName)),
      field(playerCommitmentValue),
      field(gameVersion),
      field(integerToBytes(ticketNonce)),
      field(integerToBytes(priceUsdm)),
      field(
        concat(
          fieldInteger(target.networkId),
          fieldInteger(target.round),
          field(target.mainchainRef),
          field(target.version),
        ),
      ),
    ),
  );
}

async function deriveTicketSeed(beacon) {
  return sha256(
    concat(
      field(DOMAIN.game),
      fieldInteger(target.round),
      fieldInteger(ticketNonce),
      field(playerSecret),
      field(beacon),
      field(gameVersion),
    ),
  );
}

async function deriveSymbolsSeed(ticketSeed) {
  return sha256(concat(field(DOMAIN.symbols), field(ticketSeed)));
}

async function generateSymbols(symbolsSeed) {
  const out = new Uint8Array(6);
  let count = 0;
  let hashPos = 0;

  while (count < 6) {
    if (hashPos >= 32) throw new Error("generateSymbols exhausted");

    const h = await sha256(
      concat(Uint8Array.of(count), symbolsSeed),
    );

    const byte = h[hashPos];

    if (byte === 255) {
      hashPos++;
    } else {
      out[count] = (byte % 5) + 1;
      count++;
      hashPos = 0;
    }
  }

  return out;
}

function classifyTier(symbols) {
  if (symbols.length < 6) return 0;

  for (let sym = 5; sym >= 1; sym--) {
    let count = 0;
    for (let i = 0; i < 6; i++) {
      if (symbols[i] === sym) count++;
    }
    if (count >= 3) return sym;
  }

  return 0;
}

function prizeAmountForTier(tier) {
  const bases = { 1: 2, 2: 5, 3: 10, 4: 200, 5: 1000 };
  if (tier <= 0) return 0;
  return Math.floor((bases[tier] * priceUsdm) / 2);
}

const EARLY_FAIL = process.env.P2_8_DIAG_EARLY_FAIL === "1";
const ADA_ONLY_PRIZE = process.env.P2_8_DIAG_ADA_ONLY_PRIZE === "1";

function prizeDatum({
  playerCommitmentValue,
  ticketCommitmentValue,
  beacon,
  prizePoolHash,
  prizeAmount = 0,
  status = 0,
  result = "",
  tier = 0,
}) {
  return c(0, [
    bytes(ticketPolicy),
    bytes(ticketName),
    bytes(toHex(playerCommitmentValue)),
    BigInt(priceUsdm),
    bytes(toHex(ticketCommitmentValue)),
    bytes(toHex(gameVersion)),
    BigInt(ticketNonce),
    BigInt(prizeAmount),
    bytes(""),
    bytes(""),
    c(status),
    bytes(result),
    BigInt(tier),
    c(0, [
      BigInt(target.networkId),
      BigInt(target.round),
      bytes(toHex(target.mainchainRef)),
      bytes(toHex(target.version)),
    ]),
    c(1),
    bytes(toHex(beacon)),
    bytes(toHex(mcHash)),
    bytes(toHex(materiosContext)),
    bytes(prizePoolHash),
    1_000n,
    BigInt(expiresAt),
  ]);
}

function poolDatum({
  prizeHash,
  totalLiquidity = 1_000_000,
  pendingLiabilities = 500,
  unresolvedReserve = 600,
  unresolvedCount = 3,
}) {
  return c(0, [
    BigInt(totalLiquidity),
    BigInt(pendingLiabilities),
    BigInt(unresolvedReserve),
    BigInt(unresolvedCount),
    0n,
    10_000n,
    0n,
    bytes(prizeHash),
  ]);
}

function revealRedeemer() {
  return toData(
    c(1, [bytes(toHex(playerSecret))]),
  );
}

function poolRevealRedeemer() {
  return toData(
    c(2, [BigInt(priceUsdm)]),
  );
}

function assetsEqual(a, b) {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  for (const key of keys) {
    if ((a?.[key] ?? 0n) !== (b?.[key] ?? 0n)) return false;
  }
  return true;
}

function evidence(name, value) {
  console.log(
    name,
    JSON.stringify(value, (_key, entry) =>
      typeof entry === "bigint" ? entry.toString() : entry,
    ),
  );
}

function txSize(hexCbor) {
  return Math.floor(hexCbor.length / 2);
}

async function main() {
  const app = generateEmulatorAccount({
    lovelace: 150_000_000n,
    [ticketPolicy + ticketName]: 1n,
    [poolPolicy + poolToken]: 1n,
  });

  const refs = generateEmulatorAccount({
    lovelace: 100_000_000n,
  });

  // Diagnostic-only: raise the execution envelope to distinguish a real
  // over-budget execution from a hard evaluator/runtime failure. This does
  // not alter any validator, datum, redeemer, or economic rule.
  const diagnosticProtocol = {
    ...PROTOCOL_PARAMETERS_DEFAULT,
    maxTxExMem: 100_000_000_000n,
    maxTxExSteps: 100_000_000_000n,
  };
  const emulator = new Emulator([app, refs], diagnosticProtocol);
  const lucid = await Lucid(emulator, "Custom");
  lucid.selectWallet.fromSeed(app.seedPhrase);

  const protocol = await emulator.getProtocolParameters();

  evidence("EVOLUTION_VERSION_REQUESTED", "0.6.2");
  evidence("NODE_ENV", process.version);
  evidence("MAX_TX_SIZE", protocol.maxTxSize);
  evidence("MAX_TX_EX_MEM", protocol.maxTxExMem);
  evidence("MAX_TX_EX_STEPS", protocol.maxTxExSteps);
  evidence("DIAGNOSTIC_MAX_TX_EX_MEM", diagnosticProtocol.maxTxExMem);
  evidence("DIAGNOSTIC_MAX_TX_EX_STEPS", diagnosticProtocol.maxTxExSteps);
  evidence("MIN_FEE_A", protocol.minFeeA);
  evidence("MIN_FEE_B", protocol.minFeeB);
  evidence("COINS_PER_UTXO_BYTE", protocol.coinsPerUtxoByte);

  const prizeFactory = loadScript("prizeValidatorFactory.plutus.json");
  const poolFactory = loadScript("b1PrizePoolFactory.plutus.json");
  const registryScript = loadScript("beaconRegistry.plutus.json");

  const registryHash = validatorToScriptHash({
    type: "PlutusV2",
    script: registryScript.cborHex,
  });

  const prizeScript = {
    type: "PlutusV2",
    script: applyParamsToScript(
      prizeFactory.cborHex,
      [
        registryHash,
        c(0, [2n, 5n, 10n, 200n, 1000n]),
        c(0, [zeroPolicy, zeroToken]),
        oraclePublisher,
      ],
    ),
  };

  const prizeHash = validatorToScriptHash(prizeScript);

  const poolScript = {
    type: "PlutusV2",
    script: applyParamsToScript(
      poolFactory.cborHex,
      [
        prizeHash,
        c(0, [zeroPolicy, zeroToken]),
        oraclePublisher,
        poolPolicy,
        poolToken,
      ],
    ),
  };

  const poolHash = validatorToScriptHash(poolScript);

  const prizeAddress = validatorToAddress("Custom", prizeScript);
  const poolAddress = validatorToAddress("Custom", poolScript);
  const referenceAddress = refs.address;

  evidence("PRIZE_FACTORY_BYTES", Math.floor(prizeFactory.cborHex.length / 2));
  evidence("POOL_FACTORY_BYTES", Math.floor(poolFactory.cborHex.length / 2));
  evidence(
    "COMBINED_FACTORY_BYTES",
    Math.floor((prizeFactory.cborHex.length + poolFactory.cborHex.length) / 2),
  );

  const beacon = await deriveBeacon();
  const playerCommitmentValue = await derivePlayerCommitment();
  const ticketCommitmentValue =
    await deriveTicketCommitment(playerCommitmentValue);
  const ticketSeed = await deriveTicketSeed(beacon);
  const symbolsSeed = await deriveSymbolsSeed(ticketSeed);
  const symbols = await generateSymbols(symbolsSeed);
  const tier = classifyTier(symbols);
  const payout = prizeAmountForTier(tier);

  if (tier <= 0 || payout <= 0) {
    throw new Error(
      `Fixture generated losing ticket: tier=${tier}, payout=${payout}`,
    );
  }

  const digest = await sha256(symbolsSeed);
  const result = await sha256(
    concat(field(digest), field(symbols)),
  );

  const prePrize = prizeDatum({
    playerCommitmentValue,
    ticketCommitmentValue,
    beacon,
    prizePoolHash: poolHash,
    status: EARLY_FAIL ? 1 : 0,
  });

  evidence("EARLY_FAIL_MODE", EARLY_FAIL);

  const postPrize = prizeDatum({
    playerCommitmentValue,
    ticketCommitmentValue,
    beacon,
    prizePoolHash: poolHash,
    prizeAmount: payout,
    status: 1,
    result: toHex(result),
    tier,
  });

  const prePool = poolDatum({ prizeHash });
  const postPool = poolDatum({
    prizeHash,
    pendingLiabilities: 500 + payout,
    unresolvedReserve: 600 - priceUsdm,
    unresolvedCount: 2,
  });

  evidence("TIER", tier);
  evidence("PAYOUT_USDM_SUBUNITS", payout);
  evidence("SYMBOLS_HEX", toHex(symbols));

  /*
   * A) Separate reference-script setup transactions.
   *
   * Keeping them separate is intentional: the two scripts together exceed the
   * observed old maxTxSize even before ordinary transaction overhead.
   */

  const prizeRefTx = await lucid
    .newTx()
    .pay.ToAddressWithData(
      referenceAddress,
      { kind: "inline", value: Data.to(0n) },
      { lovelace: 20_000_000n },
      prizeScript,
    )
    .complete();

  const prizeRefUnsignedCbor = prizeRefTx.toCBOR();
  const prizeRefSigned = await prizeRefTx.sign.withWallet().complete();
  const prizeRefSignedCbor = prizeRefSigned.toCBOR();
  const prizeRefHash = await prizeRefSigned.submit();
  await emulator.awaitTx(prizeRefHash);

  const poolRefTx = await lucid
    .newTx()
    .pay.ToAddressWithData(
      referenceAddress,
      { kind: "inline", value: Data.to(0n) },
      { lovelace: 20_000_000n },
      poolScript,
    )
    .complete();

  const poolRefUnsignedCbor = poolRefTx.toCBOR();
  const poolRefSigned = await poolRefTx.sign.withWallet().complete();
  const poolRefSignedCbor = poolRefSigned.toCBOR();
  const poolRefHash = await poolRefSigned.submit();
  await emulator.awaitTx(poolRefHash);

  evidence("PRIZE_REFERENCE_UNSIGNED_BYTES", txSize(prizeRefUnsignedCbor));
  evidence("PRIZE_REFERENCE_SIGNED_BYTES", txSize(prizeRefSignedCbor));
  evidence("POOL_REFERENCE_UNSIGNED_BYTES", txSize(poolRefUnsignedCbor));
  evidence("POOL_REFERENCE_SIGNED_BYTES", txSize(poolRefSignedCbor));

  /*
   * B) Application script UTxOs, deliberately without reference scripts.
   */

  const prizeSetupAssets = ADA_ONLY_PRIZE
    ? { lovelace: 5_000_000n }
    : {
        lovelace: 5_000_000n,
        [ticketPolicy + ticketName]: 1n,
      };

  evidence("ADA_ONLY_PRIZE", ADA_ONLY_PRIZE);

  const setupTx = await lucid
    .newTx()
    .pay.ToAddressWithData(
      prizeAddress,
      { kind: "inline", value: toData(prePrize) },
      prizeSetupAssets,
    )
    .pay.ToAddressWithData(
      poolAddress,
      { kind: "inline", value: toData(prePool) },
      {
        lovelace: 5_000_000n,
        [poolPolicy + poolToken]: 1n,
      },
    )
    .complete();

  const setupSigned = await setupTx.sign.withWallet().complete();
  const setupHash = await setupSigned.submit();
  await emulator.awaitTx(setupHash);

  const prizeUtxos = await lucid.utxosAt(prizeAddress);
  const poolUtxos = await lucid.utxosAt(poolAddress);
  if (prizeUtxos.length !== 1) {
    throw new Error(`Expected one Prize UTxO, got ${prizeUtxos.length}`);
  }
  if (poolUtxos.length !== 1) {
    throw new Error(
      `Expected one B1PrizePool UTxO, got ${poolUtxos.length}`,
    );
  }

  const refsAtAddress = await lucid.utxosAt(referenceAddress);
  const prizeReference = refsAtAddress.find(
    (u) => u.txHash === prizeRefHash,
  );
  const poolReference = refsAtAddress.find(
    (u) => u.txHash === poolRefHash,
  );

  if (!prizeReference) throw new Error("Missing Prize reference UTxO");
  if (!poolReference) throw new Error("Missing Pool reference UTxO");

  /*
   * C) Evolution Reveal with reference scripts.
   */

  const revealBuilder = lucid
    .newTx()
    .collectFrom([prizeUtxos[0]], revealRedeemer())
    .readFrom([prizeReference])
    .collectFrom([poolUtxos[0]], poolRevealRedeemer())
    .readFrom([poolReference])
    .pay.ToAddressWithData(
      prizeAddress,
      { kind: "inline", value: toData(postPrize) },
      prizeUtxos[0].assets,
    )
    .pay.ToAddressWithData(
      poolAddress,
      { kind: "inline", value: toData(postPool) },
      poolUtxos[0].assets,
    )
    .addSigner(app.address)
    .validTo(expiresAt);

  let revealTx;
  try {
    revealTx = await revealBuilder.complete();
  } catch (error) {
    evidence("REVEAL_BUILD_FAILED", String(error));
    throw error;
  }

  const unsignedCbor = revealTx.toCBOR();
  const unsignedBytes = txSize(unsignedCbor);

  evidence("REVEAL_UNSIGNED_BYTES", unsignedBytes);
  evidence(
    "REVEAL_SIZE_UTILIZATION",
    Number((unsignedBytes / protocol.maxTxSize).toFixed(6)),
  );
  evidence(
    "REVEAL_SIZE_HEADROOM_BYTES",
    protocol.maxTxSize - unsignedBytes,
  );

  const evaluation = await emulator.evaluateTx(
    unsignedCbor,
    [prizeUtxos[0], poolUtxos[0], prizeReference, poolReference],
  );

  evidence("REVEAL_EVALUATION", evaluation);

  const signedTx = await revealTx.sign.withWallet().complete();
  const signedCbor = signedTx.toCBOR();
  const signedBytes = txSize(signedCbor);
  const fee = signedTx.toTransaction().body().fee();

  evidence("REVEAL_SIGNED_BYTES", signedBytes);
  evidence(
    "REVEAL_SIGNED_SIZE_UTILIZATION",
    Number((signedBytes / protocol.maxTxSize).toFixed(6)),
  );
  evidence(
    "REVEAL_SIGNED_SIZE_HEADROOM_BYTES",
    protocol.maxTxSize - signedBytes,
  );
  evidence("REVEAL_FEE_LOVELACE", fee.toString());

  if (signedBytes > protocol.maxTxSize) {
    throw new Error(
      `FAIL-CLOSED: signed Reveal is ${signedBytes} bytes > maxTxSize ${protocol.maxTxSize}`,
    );
  }

  const revealHash = await signedTx.submit();
  await emulator.awaitTx(revealHash);

  const postPrizeUtxos = await lucid.utxosAt(prizeAddress);
  const postPoolUtxos = await lucid.utxosAt(poolAddress);

  if (postPrizeUtxos.length !== 1) {
    throw new Error(
      `Expected one continuing Prize UTxO, got ${postPrizeUtxos.length}`,
    );
  }

  if (postPoolUtxos.length !== 1) {
    throw new Error(
      `Expected one continuing Pool UTxO, got ${postPoolUtxos.length}`,
    );
  }

  const observedPrizeAssets = postPrizeUtxos[0].assets;
  const observedPoolAssets = postPoolUtxos[0].assets;

  if (
    !assetsEqual(
      observedPrizeAssets,
      prizeUtxos[0].assets,
    )
  ) {
    throw new Error("Prize continuing value changed unexpectedly");
  }

  if (
    !assetsEqual(
      observedPoolAssets,
      poolUtxos[0].assets,
    )
  ) {
    throw new Error("Pool continuing value changed unexpectedly");
  }

  evidence("P2_8_B1_REFERENCE_REVEAL_OK", true);
  evidence("SETUP_TX_HASH", setupHash);
  evidence("PRIZE_REFERENCE_TX_HASH", prizeRefHash);
  evidence("POOL_REFERENCE_TX_HASH", poolRefHash);
  evidence("REVEAL_TX_HASH", revealHash);
  evidence("PRIZE_HASH", prizeHash);
  evidence("POOL_HASH", poolHash);
  evidence("PRE_RESERVE", 600);
  evidence("POST_RESERVE", 600 - priceUsdm);
  evidence("PRE_COUNT", 3);
  evidence("POST_COUNT", 2);
  evidence("PRE_LIABILITIES", 500);
  evidence("POST_LIABILITIES", 500 + payout);
}

main().catch((error) => {
  console.error("P2.8-B.1 LUCID EVOLUTION FAILED");
  console.error(error);
  process.exitCode = 1;
});
