/**
 * P2.8-B.1 — REAL PRE-RICH Reveal with Lucid/Cardano Emulator + Reference Scripts
 *
 * Reference-script variant: test emulator-backed che tenta di spendere i due validator Plutus V2
 * reali di PRE-RICH:
 *
 * Reference scripts are deployed in separate setup transactions and then
 * supplied through reference inputs:
 *
 *   Reference UTxO (PrizeValidator)
 *       ↓ readFrom
 *   Prize UTxO
 *       ↓ Reveal(secret)
 *   PrizeValidator
 *
 *   Reference UTxO (B1PrizePool)
 *       ↓ readFrom
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
 *
 * The reference-script comparison changes only transaction realization:
 * validator semantics, datum, redeemers, payout, timing and continuing
 * outputs remain the same as the inline baseline.
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

const ticketNonce = 42;

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

async function generateSymbols(symbolsSeed) {
  const out = new Uint8Array(6);

  let count = 0;
  let hashPos = 0;

  while (count < 6) {
    if (hashPos >= 32) {
      throw new Error(
        "generateSymbols exhausted",
      );
    }

    const h = await sha256(
      concat(
        Uint8Array.of(count),
        symbolsSeed,
      ),
    );

    const byte = h[hashPos];

    if (byte === 255) {
      hashPos++;
    } else {
      out[count] =
        (byte % 5) + 1;

      count++;
      hashPos = 0;
    }
  }

  return out;
}

function classifyTier(symbols) {
  if (symbols.length < 6) {
    return 0;
  }

  for (
    let sym = 5;
    sym >= 1;
    sym--
  ) {
    let count = 0;

    for (
      let i = 0;
      i < 6;
      i++
    ) {
      if (symbols[i] === sym) {
        count++;
      }
    }

    if (count >= 3) {
      return sym;
    }
  }

  return 0;
}

function prizeAmountForTier(tier) {
  const bases = {
    1: 2,
    2: 5,
    3: 10,
    4: 200,
    5: 1000,
  };

  if (tier <= 0) {
    return 0;
  }

  return Math.floor(
    (bases[tier] * priceUsdm) / 2,
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

  const emulator =
    new Emulator([
      {
        address: walletAddress,

        assets: {
          lovelace: 100_000_000n,

          [ticketPolicy + ticketName]:
            1n,

          [poolPolicy + poolToken]:
            1n,
        },
      },
    ]);

  const lucid =
    await Lucid.new(
      emulator,
      "Preprod",
    );

  lucid.selectWalletFromSeed(seed);

  /*
   * Dedicated address for reference-script UTxOs.
   * It is intentionally different from the spending wallet so reference
   * script outputs cannot be accidentally selected as ordinary inputs.
   */
  const referenceProbe =
    await Lucid.new(
      new Emulator([]),
      "Preprod",
    );

  referenceProbe.selectWalletFromSeed(
    generateSeedPhrase(),
  );

  const referenceAddress =
    await referenceProbe.wallet.address();

  const emulatorProtocolParameters =
    await emulator.getProtocolParameters();

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

  const beacon =
    await deriveBeacon();

  const playerCommitmentValue =
    await playerCommitment();

  const ticketCommitmentValue =
    await ticketCommitment(
      playerCommitmentValue,
    );

  const ticketSeed =
    await deriveTicketSeed(
      beacon,
    );

  const symbolsSeed =
    await deriveSymbolsSeed(
      ticketSeed,
    );

  const symbols =
    await generateSymbols(
      symbolsSeed,
    );

  const tier =
    classifyTier(symbols);

  const payout =
    prizeAmountForTier(tier);

  if (
    tier <= 0 ||
    payout <= 0
  ) {
    throw new Error(
      `Fixture generated losing ticket: tier=${tier}, payout=${payout}`,
    );
  }

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
            4_000_000n,

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
            4_000_000n,

          [poolPolicy + poolToken]:
            1n,
        },
      )

      .complete();

  const setupSigned =
    await setupTx
      .sign()
      .complete();

  const setupHash =
    await setupSigned.submit();

  await emulator.awaitTx(
    setupHash,
  );

  /*
   * The two large reference scripts are deployed in separate transactions.
   * Keeping them separate is deliberate: the combined factory script bytes
   * already exceed the 16 KiB transaction-size ceiling.
   */

  const prizeReferenceSetupTx =
    await lucid
      .newTx()
      .payToContract(
        referenceAddress,
        {
          asHash:
            Data.to(0n),
          scriptRef:
            prizeScript,
        },
        {
          lovelace:
            48_000_000n,
        },
      )
      .complete();

  const prizeReferenceSetupSigned =
    await prizeReferenceSetupTx
      .sign()
      .complete();

  const prizeReferenceSetupHash =
    await prizeReferenceSetupSigned.submit();

  await emulator.awaitTx(
    prizeReferenceSetupHash,
  );

  const poolReferenceSetupTx =
    await lucid
      .newTx()
      .payToContract(
        referenceAddress,
        {
          asHash:
            Data.to(0n),
          scriptRef:
            poolScript,
        },
        {
          lovelace:
            40_000_000n,
        },
      )
      .complete();

  const poolReferenceSetupSigned =
    await poolReferenceSetupTx
      .sign()
      .complete();

  const poolReferenceSetupHash =
    await poolReferenceSetupSigned.submit();

  await emulator.awaitTx(
    poolReferenceSetupHash,
  );

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
   * 11. REAL PRE-RICH REVEAL
   * --------------------------------------------------------------
   *
   * This mirrors src/gameFlow.ts:
   *
   * collect Prize + Reveal(secret)
   * collect B1PrizePool + TicketRevealed(price)
   * recreate both continuing outputs
   */

  const prizeUtxos =
    await lucid.utxosAt(
      prizeAddress,
    );

  const poolUtxos =
    await lucid.utxosAt(
      poolAddress,
    );

  const referenceUtxos =
    await lucid.utxosAt(
      referenceAddress,
    );

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

  const prizeReferenceUtxos =
    referenceUtxos.filter(
      (utxo) =>
        utxo.scriptRef?.type === "PlutusV2" &&
        utxo.scriptRef.script === prizeScript.script,
    );

  const poolReferenceUtxos =
    referenceUtxos.filter(
      (utxo) =>
        utxo.scriptRef?.type === "PlutusV2" &&
        utxo.scriptRef.script === poolScript.script,
    );

  if (prizeReferenceUtxos.length !== 1) {
    throw new Error(
      `Expected one Prize reference-script UTxO, got ${prizeReferenceUtxos.length}`,
    );
  }

  if (poolReferenceUtxos.length !== 1) {
    throw new Error(
      `Expected one B1PrizePool reference-script UTxO, got ${poolReferenceUtxos.length}`,
    );
  }

  const revealTx =
    await lucid
      .newTx()

      /*
       * Reference-script execution path:
       * read both script-bearing UTxOs, then spend the application UTxOs
       * without attaching the full validator bytecode to the transaction.
       */
      .readFrom([
        prizeReferenceUtxos[0],
        poolReferenceUtxos[0],
      ])

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

      .complete();

  const revealSigned =
    await revealTx
      .sign()
      .complete();

  /*
   * --------------------------------------------------------------
   * 11a. Transaction size / execution instrumentation
   * --------------------------------------------------------------
   *
   * Lucid 0.10.11 exposes the exact serialized transaction through
   * TxComplete/TxSigned.toString() (hex CBOR). Measure the actual
   * unsigned and signed transaction rather than estimating from script
   * artifact sizes. maxTxSize comes from the same emulator provider that
   * the fixture uses for construction and submission.
   */

  const revealUnsignedCbor = revealTx.toString();
  const revealSignedCbor = revealSigned.toString();
  const revealUnsignedBytes = revealUnsignedCbor.length / 2;
  const revealSignedBytes = revealSignedCbor.length / 2;
  const revealMaxTxSize = emulatorProtocolParameters.maxTxSize;
  const revealHeadroom = revealMaxTxSize - revealSignedBytes;
  const revealUtilization =
    revealSignedBytes / revealMaxTxSize;

  console.log(
    "REFERENCE_SCRIPT_MODE",
    true,
  );
  console.log(
    "REFERENCE_SCRIPT_UTXO_COUNT",
    2,
  );
  console.log(
    "REFERENCE_PRIZE_SCRIPT_BYTES",
    prizeReferenceUtxos[0].scriptRef?.script.length / 2,
  );
  console.log(
    "REFERENCE_POOL_SCRIPT_BYTES",
    poolReferenceUtxos[0].scriptRef?.script.length / 2,
  );
  console.log(
    "REVEAL_TX_SIZE_UNSIGNED_BYTES",
    revealUnsignedBytes,
  );
  console.log(
    "REVEAL_TX_SIZE_SIGNED_BYTES",
    revealSignedBytes,
  );
  console.log(
    "REVEAL_MAX_TX_SIZE_BYTES",
    revealMaxTxSize,
  );
  console.log(
    "REVEAL_TX_HEADROOM_BYTES",
    revealHeadroom,
  );
  console.log(
    "REVEAL_TX_UTILIZATION",
    revealUtilization,
  );
  console.log(
    "REVEAL_TX_FEE_LOVELACE",
    revealTx.fee,
  );
  console.log(
    "REVEAL_TX_EX_UNITS",
    JSON.stringify(revealTx.exUnits),
  );

  if (revealSignedBytes > revealMaxTxSize) {
    throw new Error(
      "P2.8-B.1 SIZE SAFETY STALL: signed Reveal transaction exceeds emulator maxTxSize; submission intentionally blocked.",
    );
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

  console.error(error);

  process.exitCode = 1;
});