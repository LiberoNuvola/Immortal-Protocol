/**
 * P2.8-B.1 — REAL PRE-RICH Reveal against Lucid/Cardano Emulator
 *
 * Primo test emulator-backed che tenta di spendere i due validator Plutus V2
 * reali di PRE-RICH:
 *
 *   Prize UTxO
 *       ↓ Reveal(secret)
 *   PrizeValidator
 *
 *   B1PrizePool UTxO
 *       ↓ TicketRevealed(priceUsdm)
 *   B1PrizePool
 *
 * Il test NON usa IMMORTAL per rendere valida la transazione.
 * Prima deve essere il ledger emulator ad accettarla.
 *
 * Nota:
 * questo è un fixture sintetico ma costruito sulla struttura reale di
 * src/gameFlow.ts. Non è una transazione Preprod.
 */

import {
  Constr,
  Data,
  Emulator,
  Lucid,
  applyParamsToScript,
  generateSeedPhrase,
} from "lucid-cardano";
import { CML } from "@lucid-evolution/lucid";

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadScript(name) {
  const path = join(ROOT, "src", "plutusScripts", name);
  return JSON.parse(readFileSync(path, "utf8"));
}

function hex(value) {
  const clean = value.startsWith("0x")
    ? value.slice(2)
    : value;

  if (clean.length % 2 !== 0) {
    throw new Error("odd hex length");
  }

  return Uint8Array.from(
    clean.match(/../g)?.map((x) => parseInt(x, 16)) ?? [],
  );
}

function text(value) {
  return new TextEncoder().encode(value);
}

function toHex(bytes) {
  return Array.from(bytes)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function integerToBytes(n) {
  let x = BigInt(n);

  if (x < 0n) {
    x = 0n;
  }

  if (x === 0n) {
    return Uint8Array.of(48);
  }

  const digits = [];

  while (x > 0n) {
    digits.unshift(48 + Number(x % 10n));
    x /= 10n;
  }

  return Uint8Array.from(digits);
}

function field(bytes) {
  const len = integerToBytes(bytes.length);

  return Uint8Array.from([
    ...len,
    ...bytes,
  ]);
}

function fieldInteger(n) {
  return field(integerToBytes(n));
}

function concat(...parts) {
  return Uint8Array.from(
    parts.flatMap((p) => [...p]),
  );
}

async function sha256(bytes) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    ),
  );
}

function constr(index, fields = []) {
  return new Constr(index, fields);
}

function bytesData(value) {
  return value.toLowerCase();
}

/* ------------------------------------------------------------------ */
/* PRE-RICH canonical constants                                       */
/* ------------------------------------------------------------------ */

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
const poolToken = "504f4f4c"; // POOL

const ticketPolicy = "22".repeat(28);
const ticketName = "5449434b45542d32"; // TICKET-2

const oraclePublisher = "33".repeat(28);

const target = {
  networkId: 1,
  round: 7,
  mainchainRef: hex("aa".repeat(16)),
  version: hex("01"),
};

const playerSecret = hex(
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
);

let ticketNonce = 42;

/*
 * 200 USDM sub-units = 2 RU = IMMORTAL class 1.
 */
const priceUsdm = 200;

const gameVersion = hex("01");

const mcHash = hex("bb".repeat(32));
const materiosContext = hex("cc".repeat(16));

/* ------------------------------------------------------------------ */
/* Beacon / commitment / game derivation                              */
/* ------------------------------------------------------------------ */

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

async function playerCommitment() {
  return sha256(
    concat(
      field(DOMAIN.player),
      fieldInteger(target.round),
      fieldInteger(ticketNonce),
      field(playerSecret),
    ),
  );
}

async function ticketCommitment(
  playerCommitmentValue,
) {
  return sha256(
    concat(
      field(DOMAIN.ticket),
      field(hex(ticketName)),
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
  return sha256(
    concat(
      field(DOMAIN.symbols),
      field(ticketSeed),
    ),
  );
}

// Mirror the current on-chain GameRules.hs exactly. The old fixture
// sampled six bytes globally; the canonical profile samples two independent
// three-symbol rows from the accepted 16-bit outcome space.
async function rowOutcomeIndex(symbolsSeed, row) {
  for (let attempt = 0; attempt < 256; attempt++) {
    const h = await sha256(
      concat(Uint8Array.of(row, attempt), symbolsSeed),
    );
    const draw = h[0] * 256 + h[1];
    if (draw < 60_000) return draw % 20_000;
  }
  throw new Error("GameRules row randomness exhausted");
}

function rowTierFromIndex(outcome) {
  if (outcome < 0 || outcome >= 20_000) {
    throw new Error("GameRules row outcome index out of range");
  }
  if (outcome < 17_500) return 0;
  if (outcome < 19_200) return 1;
  if (outcome < 19_800) return 2;
  if (outcome < 19_980) return 3;
  if (outcome < 19_999) return 4;
  return 5;
}

function rowSymbolsFromIndex(outcome) {
  const rowTier = rowTierFromIndex(outcome);
  if (rowTier > 0) {
    return Uint8Array.of(rowTier, rowTier, rowTier);
  }

  // Equivalent to GameRules.lossTriple: enumerate the 5x5 ordered pair
  // space and skip the diagonal so a loss row cannot become a triple.
  const rank = outcome % 120;
  const first = Math.floor(rank / 24) + 1;
  const pairRank = rank % 24;
  const excluded = (first - 1) * 6;
  const pairIndex = pairRank < excluded ? pairRank : pairRank + 1;
  const second = Math.floor(pairIndex / 5) + 1;
  const third = pairIndex % 5 + 1;
  return Uint8Array.of(first, second, third);
}

async function generateSymbols(symbolsSeed) {
  const row1 = rowSymbolsFromIndex(await rowOutcomeIndex(symbolsSeed, 1));
  const row2 = rowSymbolsFromIndex(await rowOutcomeIndex(symbolsSeed, 2));
  return concat(row1, row2);
}

function classifyRowTier(row) {
  if (row.length < 3) return 0;
  return row[0] === row[1] && row[1] === row[2] &&
    row[0] >= 1 && row[0] <= 5
    ? row[0]
    : 0;
}

function classifyTier(symbols) {
  if (symbols.length < 6) return 0;
  return Math.max(
    classifyRowTier(symbols.slice(0, 3)),
    classifyRowTier(symbols.slice(3, 6)),
  );
}

function prizeAmountForTier(tier) {
  const bases = { 1: 2, 2: 5, 3: 10, 4: 200, 5: 1000 };
  if (tier <= 0) return 0;
  return Math.floor((bases[tier] * priceUsdm) / 2);
}

function rowPayoutTotal(row1Tier, row2Tier) {
  return Math.min(
    prizeAmountForTier(row1Tier) + prizeAmountForTier(row2Tier),
    500 * priceUsdm,
  );
}

/* ------------------------------------------------------------------ */
/* PrizeDatum / B1PrizePool datum                                    */
/* ------------------------------------------------------------------ */

function prizeDatum({
  playerCommitmentValue,
  ticketCommitmentValue,
  beacon,
  prizeAmount = 0,
  status = 0,
  result = "",
  tier = 0,
  row1Tier = 0,
  row2Tier = 0,
  prizePoolHash,
}) {
  return constr(0, [
    bytesData(ticketPolicy),
    bytesData(ticketName),

    bytesData(
      toHex(playerCommitmentValue),
    ),

    BigInt(priceUsdm),

    bytesData(
      toHex(ticketCommitmentValue),
    ),

    bytesData(
      toHex(gameVersion),
    ),

    BigInt(ticketNonce),

    BigInt(prizeAmount),

    bytesData(""),
    bytesData(""),

    constr(status),

    bytesData(result),

    BigInt(tier),

    constr(0, [
      BigInt(target.networkId),
      BigInt(target.round),

      bytesData(
        toHex(target.mainchainRef),
      ),

      bytesData(
        toHex(target.version),
      ),
    ]),

    /*
     * BeaconReady
     */
    constr(1),

    bytesData(toHex(beacon)),

    bytesData(toHex(mcHash)),

    bytesData(
      toHex(materiosContext),
    ),

    bytesData(prizePoolHash),

    /*
     * issuedAt
     */
    BigInt(1_000),

    /*
     * expiresAt
     */
    BigInt(4_000_000_000_000),

    // Appended fields in the current PrizeDatum schema (Types.hs).
    BigInt(row1Tier),
    BigInt(row2Tier),
  ]);
}

function poolDatum({
  prizeHash,
  totalLiquidity = 1_000_000,
  pendingLiabilities = 500,
  unresolvedReserve = 600,
  unresolvedCount = 3,
}) {
  return constr(0, [
    BigInt(totalLiquidity),
    BigInt(pendingLiabilities),
    BigInt(unresolvedReserve),
    BigInt(unresolvedCount),

    /*
     * locked jackpot
     */
    0n,

    /*
     * jackpot threshold
     */
    10_000n,

    /*
     * cycle
     */
    0n,

    /*
     * prize validator hash
     */
    bytesData(prizeHash),
  ]);
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  /*
   * --------------------------------------------------------------
   * 1. Emulator + wallet
   * --------------------------------------------------------------
   */

  const seed =
    generateSeedPhrase();

  const probe =
    await Lucid.new(
      new Emulator([]),
      "Preprod",
    );

  probe.selectWalletFromSeed(seed);

  const walletAddress =
    await probe.wallet.address();

  const baseEmulatorParams =
    await new Emulator([]).getProtocolParameters();

  /*
   * Diagnostic-only budget probe.
   *
   * Default CI keeps Lucid's Cardano-like limits. When explicitly enabled,
   * the probe raises ONLY the emulator execution ceilings so we can
   * distinguish "validator intrinsically exceeds the current limit" from
   * "validator would execute but the emulator stops before completion".
   * It never changes the canonical/default CI path.
   */
  const budgetProbe = process.env.P2_8_B1_BUDGET_PROBE === "1";
  const sizeProbe = process.env.P2_8_B1_SIZE_PROBE === "1";
  const emulatorProtocolParameters = {
    ...baseEmulatorParams,
    ...(budgetProbe
      ? {
          maxTxExMem: 100_000_000_000n,
          maxTxExSteps: 100_000_000_000n,
        }
      : {}),
    // Diagnostic only: lift the serialization ceiling to inspect the actual
    // completed transaction. This mode is never acceptance/conformance evidence.
    ...(sizeProbe ? { maxTxSize: 100_000 } : {}),
  };

  const emulator =
    new Emulator(
      [
        {
          address: walletAddress,

          assets: {
            lovelace: 300_000_000n,

            [ticketPolicy + ticketName]:
              1n,

            [poolPolicy + poolToken]:
              1n,
          },
        },
      ],
      emulatorProtocolParameters,
    );

  const lucid =
    await Lucid.new(
      emulator,
      "Preprod",
    );

  const emulatorParams = await emulator.getProtocolParameters();
  console.log(
    "P2.8-B.1 emulator params",
    JSON.stringify({
      maxTxSize: emulatorParams.maxTxSize,
      maxTxExMem: emulatorParams.maxTxExMem,
      maxTxExSteps: emulatorParams.maxTxExSteps,
      priceMem: emulatorParams.priceMem,
      priceStep: emulatorParams.priceStep,
      budgetProbe,
      sizeProbe,
      plutusV2CostModelLength: emulatorParams.costModels?.PlutusV2
        ? Object.keys(emulatorParams.costModels.PlutusV2).length
        : 0,
    }, (_, value) => typeof value === "bigint" ? value.toString() : value),
  );

  lucid.selectWalletFromSeed(seed);

  // Keep reference-script outputs outside the spending wallet's coin-selection
  // address. Otherwise the second publishing transaction can consume the first
  // reference output as its funding input before the Reveal test reads it.
  const referenceLucid = await Lucid.new(emulator, "Preprod");
  referenceLucid.selectWalletFromSeed(generateSeedPhrase());
  const referenceAddress = await referenceLucid.wallet.address();

  /*
   * --------------------------------------------------------------
   * 2. Load actual PRE-RICH Plutus artifacts
   * --------------------------------------------------------------
   */

  const prizeFactory =
    loadScript(
      "prizeValidatorFactory.plutus.json",
    );

  const poolFactory =
    loadScript(
      "b1PrizePoolFactory.plutus.json",
    );

  const registryScript =
    loadScript(
      "beaconRegistry.plutus.json",
    );

  const counterScript =
    loadScript(
      "counterValidator.plutus.json",
    );

  const treasuryScript =
    loadScript(
      "treasury.plutus.json",
    );

  /*
   * --------------------------------------------------------------
   * 3. Derive real script hashes
   * --------------------------------------------------------------
   */

  const counterHash =
    lucid.utils.validatorToScriptHash({
      type: "PlutusV2",
      script: counterScript.cborHex,
    });

  const registryHash =
    lucid.utils.validatorToScriptHash({
      type: "PlutusV2",
      script: registryScript.cborHex,
    });

  const treasuryHash =
    lucid.utils.validatorToScriptHash({
      type: "PlutusV2",
      script: treasuryScript.cborHex,
    });

  /*
   * Silence unused-variable warnings while keeping the topology explicit.
   */
  void counterHash;
  void treasuryHash;

  /*
   * --------------------------------------------------------------
   * 4. Parameterize PrizeValidator
   * --------------------------------------------------------------
   *
   * This follows the repository's actual adapter architecture:
   *
   *   factory
   *      ↓
   *   applyParamsToScript
   *      ↓
   *   PlutusV2 validator
   */

  const prizeScript = {
    type: "PlutusV2",

    script:
      applyParamsToScript(
        prizeFactory.cborHex,

        [
          registryHash,

          new Constr(
            0,
            [
              2n,
              5n,
              10n,
              200n,
              1000n,
            ],
          ),

          new Constr(
            0,
            [
              zeroPolicy,
              zeroToken,
            ],
          ),

          oraclePublisher,
        ],
      ),
  };

  const prizeHash =
    lucid.utils.validatorToScriptHash(
      prizeScript,
    );

  /*
   * --------------------------------------------------------------
   * 5. Parameterize B1PrizePool
   * --------------------------------------------------------------
   */

  const poolScript = {
    type: "PlutusV2",

    script:
      applyParamsToScript(
        poolFactory.cborHex,

        [
          prizeHash,

          new Constr(
            0,
            [
              zeroPolicy,
              zeroToken,
            ],
          ),

          oraclePublisher,

          poolPolicy,
          poolToken,
        ],
      ),
  };

  const poolHash =
    lucid.utils.validatorToScriptHash(
      poolScript,
    );

  const prizeAddress =
    lucid.utils.validatorToAddress(
      prizeScript,
    );

  const poolAddress =
    lucid.utils.validatorToAddress(
      poolScript,
    );

  /*
   * --------------------------------------------------------------
   * 6. Derive real PRE-RICH Reveal data
   * --------------------------------------------------------------
   */

  const beacon = await deriveBeacon();

  // Select the first deterministic nonce that yields a winning fixture under
  // the canonical two-row GameRules (the original fixed nonce 42 is a loss
  // under the current source). Recompute both commitments for that nonce.
  let playerCommitmentValue;
  let ticketCommitmentValue;
  let ticketSeed;
  let symbolsSeed;
  let symbols;
  let row1Tier;
  let row2Tier;
  let tier;
  let payout;
  const fixtureNonceStart = 42;

  for (let candidateNonce = fixtureNonceStart; candidateNonce < fixtureNonceStart + 256; candidateNonce++) {
    ticketNonce = candidateNonce;
    playerCommitmentValue = await playerCommitment();
    ticketCommitmentValue = await ticketCommitment(playerCommitmentValue);
    ticketSeed = await deriveTicketSeed(beacon);
    symbolsSeed = await deriveSymbolsSeed(ticketSeed);
    symbols = await generateSymbols(symbolsSeed);
    row1Tier = classifyRowTier(symbols.slice(0, 3));
    row2Tier = classifyRowTier(symbols.slice(3, 6));
    tier = Math.max(row1Tier, row2Tier);
    payout = rowPayoutTotal(row1Tier, row2Tier);
    if (payout > 0) break;
  }

  if (
    !symbols ||
    row1Tier === undefined ||
    row2Tier === undefined ||
    tier <= 0 ||
    payout <= 0
  ) {
    throw new Error("Could not derive a winning canonical two-row Reveal fixture");
  }

  console.log("P2.8-B.1 canonical Reveal fixture", JSON.stringify({
    ticketNonce,
    symbols: Array.from(symbols),
    row1Tier,
    row2Tier,
    summaryTier: tier,
    payoutUsdmSubunits: payout,
  }));

  const digest =
    await sha256(symbolsSeed);

  const result =
    await sha256(
      concat(
        field(digest),
        field(symbols),
      ),
    );

  /*
   * --------------------------------------------------------------
   * 7. Construct pre/post PrizeDatum
   * --------------------------------------------------------------
   */

  const prePrizeDatum =
    prizeDatum({
      playerCommitmentValue,
      ticketCommitmentValue,
      beacon,
      prizePoolHash:
        poolHash,
    });

  const postPrizeDatum =
    prizeDatum({
      playerCommitmentValue,
      ticketCommitmentValue,
      beacon,

      prizeAmount:
        payout,

      status: 1,

      result:
        toHex(result),

      tier,
      row1Tier,
      row2Tier,

      prizePoolHash:
        poolHash,
    });

  /*
   * --------------------------------------------------------------
   * 8. Construct pre/post B1PrizePool
   * --------------------------------------------------------------
   */

  const prePoolDatum =
    poolDatum({
      prizeHash,
    });

  const postPoolDatum =
    poolDatum({
      prizeHash,

      pendingLiabilities:
        500 + payout,

      unresolvedReserve:
        600 - priceUsdm,

      unresolvedCount:
        2,
    });

  /*
   * --------------------------------------------------------------
   * 9. Create script UTxOs
   * --------------------------------------------------------------
   *
   * This setup transaction is deliberately separate.
   * The validators are executed by the subsequent Reveal tx.
   */

  console.log("P2.8-B.1 stage: setup-tx-complete:start");
  const setupTx =
    await lucid
      .newTx()

      .payToContract(
        prizeAddress,

        {
          inline:
            Data.to(prePrizeDatum),
        },

        {
          lovelace:
            5_000_000n,

          [ticketPolicy + ticketName]:
            1n,
        },
      )

      .payToContract(
        poolAddress,

        {
          inline:
            Data.to(prePoolDatum),
        },

        {
          lovelace:
            5_000_000n,

          [poolPolicy + poolToken]:
            1n,
        },
      )

      .complete();
  console.log("P2.8-B.1 stage: setup-tx-complete:done");

  console.log("P2.8-B.1 stage: setup-tx-sign:start");
  const setupSigned =
    await setupTx
      .sign()
      .complete();

  console.log("P2.8-B.1 stage: setup-tx-sign:done");
  console.log("P2.8-B.1 stage: setup-tx-submit:start");
  const setupHash =
    await setupSigned.submit();

  await emulator.awaitTx(
    setupHash,
  );
  console.log("P2.8-B.1 stage: setup-tx-submit:done");

  console.log("P2.8-B.1 stage: prize-reference-complete:start");
  const prizeReferenceTx =
    await lucid
      .newTx()
      .payToAddressWithData(
        referenceAddress,
        { scriptRef: prizeScript },
        { lovelace: 2_000_000n },
      )
      .complete();

  console.log("P2.8-B.1 stage: prize-reference-complete:done");
  console.log("P2.8-B.1 stage: prize-reference-submit:start");
  const prizeReferenceSigned = await prizeReferenceTx.sign().complete();
  const prizeReferenceHash = await prizeReferenceSigned.submit();
  await emulator.awaitTx(prizeReferenceHash);
  console.log("P2.8-B.1 stage: prize-reference-submit:done");

  console.log("P2.8-B.1 stage: pool-reference-wallet-utxos:inspect");
  try {
    if (typeof lucid.wallet.getUtxos === "function") {
      const walletUtxosBeforePoolReference = await lucid.wallet.getUtxos();
      console.log(
        "P2.8-B.1 wallet UTxOs before pool reference",
        JSON.stringify(
          walletUtxosBeforePoolReference.map((utxo) => ({
            txHash: utxo.txHash,
            outputIndex: utxo.outputIndex,
            assets: utxo.assets,
          })),
          (_key, value) => typeof value === "bigint" ? value.toString() : value,
          2,
        ),
      );
    } else {
      console.log(
        "P2.8-B.1 wallet UTxO inspection unavailable",
        Object.keys(lucid.wallet ?? {}),
      );
    }
  } catch (diagnosticError) {
    console.log(
      "P2.8-B.1 wallet UTxO inspection failed",
      diagnosticError instanceof Error ? diagnosticError.stack : String(diagnosticError),
    );
  }

  console.log("P2.8-B.1 stage: pool-reference-complete:start");
  let poolReferenceTx;
  try {
    poolReferenceTx =
      await lucid
        .newTx()
        .payToAddressWithData(
          referenceAddress,
          { scriptRef: poolScript },
          { lovelace: 2_000_000n },
        )
        .complete();
  } catch (poolReferenceBuildError) {
    console.error(
      "P2.8-B.1 pool-reference-complete error details",
      poolReferenceBuildError instanceof Error
        ? poolReferenceBuildError.stack
        : String(poolReferenceBuildError),
    );
    throw poolReferenceBuildError;
  }

  console.log("P2.8-B.1 stage: pool-reference-complete:done");
  console.log("P2.8-B.1 stage: pool-reference-submit:start");
  const poolReferenceSigned = await poolReferenceTx.sign().complete();
  const poolReferenceHash = await poolReferenceSigned.submit();
  await emulator.awaitTx(poolReferenceHash);
  console.log("P2.8-B.1 stage: pool-reference-submit:done");

  /*
   * --------------------------------------------------------------
   * 10. Locate the actual script UTxOs
   * --------------------------------------------------------------
   */

  const prizeUtxos =
    await lucid.utxosAt(
      prizeAddress,
    );

  const poolUtxos =
    await lucid.utxosAt(
      poolAddress,
    );

  const referenceUtxos = await lucid.utxosAt(referenceAddress);

  /*
   * Lucid/Emulator may normalize the scriptRef representation when it
   * rehydrates a wallet UTxO. Identify each reference output by the
   * transaction that created it, then retain the returned UTxO object
   * (including its decoded reference script) for readFrom().
   */
  const prizeReferenceUtxo = referenceUtxos.find(
    (u) => u.txHash === prizeReferenceHash,
  );
  const poolReferenceUtxo = referenceUtxos.find(
    (u) => u.txHash === poolReferenceHash,
  );

  if (!prizeReferenceUtxo || !poolReferenceUtxo) {
    console.error(
      "P2.8-B.1 reference UTxOs",
      JSON.stringify(
        referenceUtxos.map((u) => ({
          txHash: u.txHash,
          outputIndex: u.outputIndex,
          assets: u.assets,
          scriptRef: u.scriptRef,
        })),
        (_key, value) => typeof value === "bigint" ? value.toString() : value,
        2,
      ),
    );
    throw new Error("Expected both PRE-RICH reference script UTxOs");
  }

  /*
   * The Lucid 0.10.11 emulator provider may rehydrate a reference-script
   * output without decoding the scriptRef field. The UTxO is still the
   * exact output created by the reference-script transaction above, so
   * restore the already-known script bytes on the provider object before
   * readFrom(). This is a provider-decoding repair, not validator bypass:
   * the reference-script UTxOs remain real ledger outputs and are selected
   * by their creating transaction hashes.
   */
  const prizeReferenceInput = {
    ...prizeReferenceUtxo,
    scriptRef: prizeReferenceUtxo.scriptRef ?? prizeScript,
  };
  const poolReferenceInput = {
    ...poolReferenceUtxo,
    scriptRef: poolReferenceUtxo.scriptRef ?? poolScript,
  };

  if (prizeUtxos.length !== 1) {
    throw new Error(
      `Expected one Prize UTxO, got ${prizeUtxos.length}`,
    );
  }

  if (poolUtxos.length !== 1) {
    throw new Error(
      `Expected one B1PrizePool UTxO, got ${poolUtxos.length}`,
    );
  }

  /*
   * --------------------------------------------------------------
   * 11. OPTIONAL DIAGNOSTIC: POOL-ONLY VALUE PATH ISOLATION
   * --------------------------------------------------------------
   *
   * Enable explicitly with P2_8_B1_POOL_VALUE_PROBE=1. The probe spends the
   * real Pool UTxO and deliberately omits the Prize output. Under a generous
   * emulator budget, reaching the ordinary "no prize output" failure proves
   * the Value path evaluated; NonConstrScrutinized isolates the evaluator
   * failure to singletonPoolTokenValid/valueOf. The transaction is never
   * accepted, so it does not mutate emulator state.
   */
  if (process.env.P2_8_B1_POOL_VALUE_PROBE === "1") {
    try {
      const poolValueProbeTx =
        await lucid
          .newTx()
          .collectFrom(
            [poolUtxos[0]],
            Data.to(
              constr(
                2,
                [BigInt(priceUsdm)],
              ),
            ),
          )
          .readFrom([poolReferenceInput])
          .payToContract(
            poolAddress,
            { inline: Data.to(prePoolDatum) },
            poolUtxos[0].assets,
          )
          .addSigner(walletAddress)
          .validTo(4_000_000_000_000)
          .complete();

      const poolValueProbeSigned =
        await poolValueProbeTx.sign().complete();

      await poolValueProbeSigned.submit();

      throw new Error(
        "P2.8-B.1 Pool-only Value probe unexpectedly succeeded",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const evaluatorFailure =
        /attempted to case a non-const|NonConstrScrutinized|non-const/i.test(
          message,
        );

      const budgetOverrun =
        /execution went over budget|went over budget|Mem -\d+|CPU -\d+/i.test(
          message,
        );

      const semanticFailure =
        /no prize output/i.test(message);

      const classification =
        evaluatorFailure
          ? "EVALUATOR_VALUE_FAILURE"
          : budgetOverrun
            ? "BUDGET_OVERRUN"
            : semanticFailure
              ? "SEMANTIC_VALIDATOR_FAILURE"
              : "UNCLASSIFIED_FAILURE";

      console.log(
        "P2.8-B.1 POOL_VALUE_PROBE",
        classification,
      );

      console.log(
        "P2.8-B.1 POOL_VALUE_PROBE_ERROR",
        message,
      );

      if (evaluatorFailure) {
        console.log(
          "P2.8-B.1 ISOLATION",
          "B1PrizePool singletonPoolTokenValid/valueOf path reaches evaluator failure before action semantics",
        );
      } else if (budgetOverrun) {
        console.log(
          "P2.8-B.1 ISOLATION",
          "Pool-only diagnostic reached script evaluation but exhausted the configured execution budget; this probe result is non-semantic and must not block the real Reveal",
        );
      } else if (semanticFailure) {
        console.log(
          "P2.8-B.1 ISOLATION",
          "Pool-only diagnostic reached the validator's ordinary semantic failure after the unconditional Value path",
        );
      } else {
        throw error;
      }
    }
  }

  /*
   * --------------------------------------------------------------
   * 11. NEGATIVE INPUT-BINDING TWINS
   * --------------------------------------------------------------
   *
   * The canonical Reveal is not sufficient after the B1 hardening:
   * the validator now binds the transition to the actual Prize input.
   * These three transactions deliberately violate that binding and
   * must be rejected by the real parameterized validator.
   */

  function isBudgetOverrun(message) {
    return /execution went over budget|went over budget|Mem -\d+|CPU -\d+|execution budget|budget.{0,30}(?:exceed|exhaust|limit)|exceed.{0,30}budget/i.test(message);
  }

  const inconclusiveNegativeProbes = [];

  async function expectRejected(label, txBuilder) {
    let rejected = false;
    let stage = "build";

    try {
      const tx = await txBuilder();
      stage = "sign";
      const signed = await tx.sign().complete();
      stage = "submit";
      const hash = await signed.submit();
      stage = "await";
      await emulator.awaitTx(hash);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (isBudgetOverrun(message)) {
        inconclusiveNegativeProbes.push({
          label,
          stage,
          classification: "BUDGET_OVERRUN",
          error: message.split(/\r?\n/)[0],
        });
        console.log(label, "INCONCLUSIVE_BUDGET_OVERRUN", "stage=" + stage);
        console.log(label, "ERROR", message.split(/\r?\n/)[0]);
        return;
      }

      // A builder-side CEK error is not a ledger rejection. In particular,
      // lucid-cardano 0.10.11 performs native UPLC evaluation in .complete()
      // by default; failures at build/sign/await stages must stay inconclusive.
      if (stage !== "submit") {
        inconclusiveNegativeProbes.push({
          label,
          stage,
          classification: "PRE_SUBMISSION_OR_AWAIT_FAILURE",
          error: message.split(/\r?\n/)[0],
        });
        console.log(label, "INCONCLUSIVE_NOT_SUBMIT_REJECTION", "stage=" + stage);
        console.log(label, "ERROR", message.split(/\r?\n/)[0]);
        return;
      }

      const scriptFailure =
        /failed script execution|PlutusFailure|PlutusV[12] script failed|script evaluation failed|validator failure|script failure|script failed|CekError/i.test(message);

      if (!scriptFailure) {
        inconclusiveNegativeProbes.push({
          label,
          stage,
          classification: "UNCLASSIFIED_ERROR",
          error: message.split(/\r?\n/)[0],
        });
        console.log(label, "INCONCLUSIVE_NON_SCRIPT_ERROR", "stage=" + stage);
        console.log(label, "ERROR", message.split(/\r?\n/)[0]);
        return;
      }

      rejected = true;
      console.log(label, "REJECTED", true, "stage=" + stage);
      console.log(label, "ERROR", message.split(/\r?\n/)[0]);
    }

    if (!rejected) {
      throw new Error(label + " unexpectedly accepted");
    }
  }

  /* No Prize input: the Pool transition cannot be authorized in isolation. */
  await expectRejected(
    "NEGATIVE_REVEAL_NO_PRIZE_INPUT",
    async () => lucid
      .newTx()
      .collectFrom(
        [poolUtxos[0]],
        Data.to(constr(2, [BigInt(priceUsdm)])),
      )
      .readFrom([poolReferenceInput])
      .payToContract(
        poolAddress,
        { inline: Data.to(postPoolDatum) },
        poolUtxos[0].assets,
      )
      .addSigner(walletAddress)
      .validTo(4_000_000_000_000)
      .complete(),
  );

  /* Prize input/output ticket identity is deliberately substituted. */
  const substitutedPrizeFields = [
    ...postPrizeDatum.fields,
  ];
  substitutedPrizeFields[1] = "ff";
  const substitutedPrizeDatum = constr(
    0,
    substitutedPrizeFields,
  );

  await expectRejected(
    "NEGATIVE_REVEAL_TICKET_SUBSTITUTION",
    async () => lucid
      .newTx()
      .collectFrom(
        [prizeUtxos[0]],
        Data.to(constr(1, [bytesData(toHex(playerSecret))])),
      )
      .collectFrom(
        [poolUtxos[0]],
        Data.to(constr(2, [BigInt(priceUsdm)])),
      )
      .readFrom([prizeReferenceInput, poolReferenceInput])
      .payToContract(
        prizeAddress,
        { inline: Data.to(substitutedPrizeDatum) },
        prizeUtxos[0].assets,
      )
      .payToContract(
        poolAddress,
        { inline: Data.to(postPoolDatum) },
        poolUtxos[0].assets,
      )
      .addSigner(walletAddress)
      .validTo(4_000_000_000_000)
      .complete(),
  );

  /* Pool redeemer price is deliberately different from the Prize price. */
  await expectRejected(
    "NEGATIVE_REVEAL_PRICE_MISMATCH",
    async () => lucid
      .newTx()
      .collectFrom(
        [prizeUtxos[0]],
        Data.to(constr(1, [bytesData(toHex(playerSecret))])),
      )
      .collectFrom(
        [poolUtxos[0]],
        Data.to(constr(2, [BigInt(priceUsdm + 1)])),
      )
      .readFrom([prizeReferenceInput, poolReferenceInput])
      .payToContract(
        prizeAddress,
        { inline: Data.to(postPrizeDatum) },
        prizeUtxos[0].assets,
      )
      .payToContract(
        poolAddress,
        { inline: Data.to(postPoolDatum) },
        poolUtxos[0].assets,
      )
      .addSigner(walletAddress)
      .validTo(4_000_000_000_000)
      .complete(),
  );

  /*
   * --------------------------------------------------------------
   * 12. REAL PRE-RICH REVEAL
   * --------------------------------------------------------------
   * --------------------------------------------------------------
   *
   * This mirrors src/gameFlow.ts:
   *
   * collect Prize + Reveal(secret)
   * collect B1PrizePool + TicketRevealed(price)
   * recreate both continuing outputs
   */

  let revealTx;
  try {
    revealTx = await lucid
      .newTx()

      .collectFrom(
        [prizeUtxos[0]],

        Data.to(
          constr(
            1,

            [
              bytesData(
                toHex(playerSecret),
              ),
            ],
          ),
        ),
      )

      .collectFrom(
        [poolUtxos[0]],

        Data.to(
          constr(
            2,

            [
              BigInt(
                priceUsdm,
              ),
            ],
          ),
        ),
      )

      .readFrom([
        prizeReferenceInput,
        poolReferenceInput,
      ])

      .payToContract(
        prizeAddress,

        {
          inline:
            Data.to(postPrizeDatum),
        },

        prizeUtxos[0].assets,
      )

      .payToContract(
        poolAddress,

        {
          inline:
            Data.to(postPoolDatum),
        },

        poolUtxos[0].assets,
      )

      .addSigner(
        walletAddress,
      )

      .validTo(
        4_000_000_000_000,
      )

      // Size-probe mode must serialize the transaction even if the local UPLC
      // evaluator has an independent CEK failure. This mode is diagnostic-only:
      // it returns before signing/submission and cannot count as acceptance.
      .complete(
        process.env.P2_8_B1_SIZE_PROBE === "1"
          ? { nativeUplc: false }
          : undefined,
      );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      isBudgetOverrun(message)
        ? "P2.8-B.1 REVEAL INCONCLUSIVE_BUDGET_OVERRUN"
        : "P2.8-B.1 REVEAL BUILD FAILED",
    );
    console.error(error);
    process.exitCode = 1;
    return;
  }

  if (process.env.P2_8_B1_SIZE_PROBE === "1") {
    const txCbor = revealTx.toString().replace(/^0x/, "");
    if (!/^[0-9a-fA-F]+$/.test(txCbor) || txCbor.length % 2 !== 0) {
      throw new Error("Size probe could not obtain valid transaction CBOR");
    }
    const parsedTx = CML.Transaction.from_cbor_hex(txCbor);
    const body = parsedTx.body();
    const witnessSet = parsedTx.witness_set();
    const bodyBytes = body.to_cbor_bytes().length;
    const witnessSetBytes = witnessSet.to_cbor_bytes().length;
    const txInputs = [];
    const inputCollection = body.inputs();
    for (let i = 0; i < Number(inputCollection.len()); i++) {
      const input = inputCollection.get(i);
      txInputs.push(input.transaction_id().to_hex().toLowerCase() + "#" + Number(input.index()));
    }
    const referenceInputs = [];
    const referenceCollection = body.reference_inputs?.();
    if (referenceCollection) {
      for (let i = 0; i < Number(referenceCollection.len()); i++) {
        const input = referenceCollection.get(i);
        referenceInputs.push(input.transaction_id().to_hex().toLowerCase() + "#" + Number(input.index()));
      }
    }
    const scriptCollectionStats = (method) => {
      const collection = witnessSet[method]?.();
      return {
        count: collection == null ? 0 : Number(collection.len()),
        bytes: collection == null ? 0 : (() => {
          let total = 0;
          for (let i = 0; i < Number(collection.len()); i++) {
            total += collection.get(i).to_cbor_bytes().length;
          }
          return total;
        })(),
      };
    };
    const embeddedScripts = {
      plutus_v1: scriptCollectionStats("plutus_v1_scripts"),
      plutus_v2: scriptCollectionStats("plutus_v2_scripts"),
      plutus_v3: scriptCollectionStats("plutus_v3_scripts"),
    };
    const embeddedScriptCount = Object.values(embeddedScripts).reduce((sum, x) => sum + x.count, 0);
    const datumBytes = {
      prePrize: Data.to(prePrizeDatum).length / 2,
      postPrize: Data.to(postPrizeDatum).length / 2,
      prePool: Data.to(prePoolDatum).length / 2,
      postPool: Data.to(postPoolDatum).length / 2,
    };
    const redeemerBytes = {
      prizeReveal: Data.to(constr(1, [bytesData(toHex(playerSecret))])).length / 2,
      poolTicketRevealed: Data.to(constr(2, [BigInt(priceUsdm)])).length / 2,
    };
    const referenceScriptBytes = {
      prize: prizeScript.script.length / 2,
      pool: poolScript.script.length / 2,
    };
    console.log("P2.8-B.1 SIZE PROBE (diagnostic only)", JSON.stringify({
      txBytes: txCbor.length / 2,
      maxTxSizeCanonical: baseEmulatorParams.maxTxSize,
      bodyBytes,
      witnessSetBytes,
      overheadBytes: txCbor.length / 2 - bodyBytes - witnessSetBytes,
      spendingInputs: txInputs.sort(),
      referenceInputs: referenceInputs.sort(),
      embeddedScripts,
      embeddedScriptCount,
      datumBytes,
      redeemerBytes,
      referenceScriptBytes,
      note: "Diagnostic-only CBOR inspection. Reference-witness conversion is supported only when both expected reference inputs are present and embedded Plutus script count is zero; this probe does not establish ledger acceptance.",
    }));
    return;
  }

  let revealSigned;
  try {
    revealSigned = await revealTx
      .sign()
      .complete();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      isBudgetOverrun(message)
        ? "P2.8-B.1 REVEAL INCONCLUSIVE_BUDGET_OVERRUN"
        : "P2.8-B.1 REVEAL SIGNED-COMPLETION FAILED",
    );
    console.error(error);
    process.exitCode = 1;
    return;
  }

  let revealHash;

  try {
    revealHash =
      await revealSigned.submit();

    await emulator.awaitTx(
      revealHash,
    );

  } catch (error) {
    console.error(
      "P2.8-B.1 REVEAL REJECTED",
    );

    console.error(error);

    process.exitCode = 1;

    return;
  }

  /*
   * --------------------------------------------------------------
   * 12. Verify continuing outputs
   * --------------------------------------------------------------
   */

  const postPrize =
    await lucid.utxosAt(
      prizeAddress,
    );

  const postPool =
    await lucid.utxosAt(
      poolAddress,
    );

  if (postPrize.length !== 1) {
    throw new Error(
      `Expected one continuing Prize UTxO, got ${postPrize.length}`,
    );
  }

  if (postPool.length !== 1) {
    throw new Error(
      `Expected one continuing Pool UTxO, got ${postPool.length}`,
    );
  }

  if (inconclusiveNegativeProbes.length > 0) {
    console.error(
      "P2.8-B.1 NEGATIVE_PROBES_INCONCLUSIVE",
      JSON.stringify(inconclusiveNegativeProbes),
    );
    throw new Error("P2.8-B.1 cannot claim semantic negative coverage while a probe is inconclusive");
  }

  /*
   * --------------------------------------------------------------
   * GREEN
   * --------------------------------------------------------------
   */

  console.log(
    "P2.8-B.1 OK",
  );

  console.log(
    "REAL_PRIZE_VALIDATOR_EXECUTED",
    true,
  );

  console.log(
    "REAL_B1_PRIZE_POOL_EXECUTED",
    true,
  );

  console.log(
    "SETUP_TX_HASH",
    setupHash,
  );

  console.log(
    "REVEAL_TX_HASH",
    revealHash,
  );

  console.log(
    "PRIZE_HASH",
    prizeHash,
  );

  console.log(
    "POOL_HASH",
    poolHash,
  );

  console.log(
    "TIER",
    tier,
  );

  console.log(
    "PAYOUT_USDM_SUBUNITS",
    payout,
  );

  console.log(
    "PRE_RESERVE",
    600,
  );

  console.log(
    "POST_RESERVE",
    600 - priceUsdm,
  );

  console.log(
    "PRE_COUNT",
    3,
  );

  console.log(
    "POST_COUNT",
    2,
  );

  console.log(
    "PRE_LIABILITIES",
    500,
  );

  console.log(
    "POST_LIABILITIES",
    500 + payout,
  );

  console.log(
    "SYMBOLS_HEX",
    toHex(symbols),
  );

  console.log(
    "RESULT_HEX",
    toHex(result),
  );
}

main().catch((error) => {
  console.error(
    "P2.8-B.1 FAILED",
  );

  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));

  process.exitCode = 1;
});