# Pyth USD/ADA → IMMORTAL USDM Settlement — Unit/Conversion Decision

**Status:** RESEARCHED / NORMATIVE DECISION OPEN / NO IMPLEMENTATION AUTHORIZED  
**Date:** 2026-10-21  
**Scope:** conversion units at the Pyth-to-MintPolicy boundary only.

## 1. Existing contract from repository evidence

The canonical application specification defines **USDM as the unit of account** and fixes the representation `1 USDM = 100 sub-units`. It states that ADA or another supported asset may settle a ticket only through a verified conversion that preserves its frozen USDM value, and Article 46 of the archived Constitution requires the oracle contract to define asset identity, precision, freshness, authorization, rounding and failure behavior.

Relevant sources on this branch:
- [Archived Constitution — Articles 5 and 46](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/archive/Constitution.md)
- [PRE-RICH Complete System Specification — §16 settlement and payout units](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md)
- [PRE-RICH Economic Algorithm — §10 settlement conversion](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/PRE-RICH/docs/ECONOMIC-ALGORITHM.md)
- [Economic Oracle/Valuation Contract R9](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md)
- [Yaci FundTreasury/Oracle valuation trace](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/cardano-integration/fund-treasury-oracle-valuation-trace.ts)

The inspected normative sources do **not explicitly state** that one USDM is defined as exactly one USD. They also do not supply a canonical USD/USDM conversion source. A unit-of-account label and a sub-unit representation, by themselves, are not proof of USD parity.

## 2. Current on-chain quote semantics

The current `Economic.totalUsdmValue` applies the per-asset integer ceiling conversion:

`valueSubunits = ceil(economicQuantity × quotePrice / 1,000,000)`

For ADA, `economicQuantity = max(0, lovelace − 1,600,000)`. Existing Haskell/Yaci evidence uses an integer test quote `ADA_PRICE_USDM_SUBUNITS = 80`; with 1,000,000 economic lovelace the value is 80 USDM sub-units. In the current usage, that integer is an effective sub-unit price per whole ADA, not a raw USD/ADA rational.

By contrast, a Pyth feed exposes raw integer `p` and exponent `e`, where `p × 10^e` expresses USD per ADA. Pyth's `price` is not already the integer expected by the legacy `OracleQuote.price` field.

## 3. Conversion formula if — and only if — USDM/USD parity is governed

If the canonical hierarchy explicitly establishes `D = 1 USD per 1 USDM`, the rational value of `L` economic lovelace can be calculated without rounding the price first:

`subunits = ceil((L / 1,000,000) × (p × 10^e USD/ADA) × 100 / D)`

For a negative exponent `e = -k`, this is equivalent to:

`ceilDiv(L × p × 100, 1,000,000 × 10^k × D)`

where `D` is expressed as the approved USD-per-USDM ratio and must itself be represented exactly as an integer rational. The exact integer numerator/denominator form must be fixed in the implementation spec, including supported exponent bounds and overflow/resource limits.

This is a **candidate dimensional formula**, not a new protocol rule and not yet approved. The Pyth carrier must retain the raw signed price and exponent; it must not truncate them to an integer sub-unit quote off-chain.

### Why premature quote rounding is dangerous

For illustration only, suppose a synthetic Pyth price is `69,508,700 × 10^-8 = 0.695087 USD/ADA`, with the hypothetical parity assumption `D=1`. It is tempting to round `0.695087 × 100 = 69.5087` to the integer quote `70` before valuation. That can alter the validator's equality result: for `1,438,000` economic lovelace, the direct rational conversion is `ceil(99.9545…)=100` sub-units, whereas an integer pre-rounded quote of `70` gives `ceil(100.66)=101`. One path may accept a payment the other rejects. This is a synthetic unit-test example, not a live feed observation.

The safer candidate is to retain the exact integer/exponent pair and apply the established final `ceilingDiv` once to the complete asset quantity. This still needs source-of-truth approval as a versioned PriceReference representation and actual Plutus/TypeScript parity tests; it must not be introduced as an undocumented semantic upgrade.

## 4. Unresolved unit binding

The source-of-truth hierarchy must choose one of the following. This document does not silently select it.

| Option | Rule | Consequence | Trust / unresolved issue |
|---|---|---|---|
| **A. Define USD/USDM parity** | Normatively define `1 USDM = 1 USD` for all settlement valuation, or give an exact fixed ratio and boundary | ADA/USD can be converted into USDM under the rational formula above | This is a constitutional/economic definition, not an implementation assumption; must be explicitly governed and independently reviewed |
| **B. Verify USD/USDM separately** | Require a source-qualified, fresh USD/USDM conversion and compute the exact ratio with ADA/USD | Does not assume parity | Adds a second source/feed, another freshness/precision path and another availability dependency |
| **C. Use a quote already denominated in USDM** | The source itself publishes the asset/USDM price, with authenticated exact asset identity | Uses legacy unit without an implicit USD bridge | The checked Pyth ADA/USD feed is not such a quote; current legacy Oracle State is publisher-authorized but source truth is not proven by its datum |

Do not create a fourth implicit option by labelling `USD/ADA` as `USDM/ADA` in an off-chain adapter. That merely moves the trust claim out of sight.

## 5. Multi-asset consequences

The buyer basket must be valued for every nonzero asset in the actual Treasury output, including ADA held for the output-specific minimum UTxO. For each asset, the system needs:
1. an exact ledger asset identity (policy ID and asset name);
2. a source-qualified feed mapping;
3. governed token-unit/decimal semantics;
4. a raw price with an exact scale and timestamp;
5. the canonical conversion formula/rounding and failure predicate.

ADA/USD feed ID 16 is documented by the Pyth consumer guide. This checkpoint has not qualified Pyth feeds for PRE or NIGHT, nor established their token-unit conversion metadata. The ADA probe cannot make those assets eligible by implication. Each basket lacking one valid quote must reject.

## 6. Consequence for the current Pyth quote-carrier probe

The isolated Pyth/quote-carrier project now proves that the continuation datum can be bound to the raw ADA/USD price/exponent/timestamps selected from the same transaction update (synthetic code-level tests). The proposed cross-script design then requires Haskell Plutus V2 MintPolicy to consume that exact continuation output.

However, **source authenticity and unit conversion are distinct obligations**:
- carrier binding answers “did this datum equal the price authenticated by the transaction's Pyth verifier?”;
- the unit-conversion decision answers “what exact amount of USDM sub-units does this raw USD/ADA quote represent?”;
- MintPolicy binding answers “did the Treasury equality use that exact source-bound price rather than the old Oracle State quote?”.

All three must hold in the same accepted Issue transaction. Passing any one of them does not close the other two.

## 7. Recommended next step

Under the current source-of-truth hierarchy, do not change the Oracle singleton schema, `OracleQuote`, `Economic.totalUsdmValue`, or MintPolicy price semantics until the parity/quote denomination choice is approved. The most conservative engineering route is:

1. propose Option A only if the intended meaning of “USDM” is indeed a one-to-one USD accounting unit; otherwise evaluate Option B or C;
2. freeze the exact rational field representation, exponent bounds, numerator/denominator calculation and rounding behavior in a versioned PriceReference contract;
3. implement the conversion as a separate pure Haskell/TypeScript/Aiken differential test surface and show that every accepted value is consistent with the approved formula;
4. only then bind the Aiken carrier output into Plutus V2 MintPolicy and verify both together on a native Cardano ledger.

No parity rule, source, conversion constant, oracle update, production code, deployment or real Issue is changed by this memo.


## 8. External source and token-identity cross-check — 2026-10-22

This check adds current external evidence; it does **not** select an option or authorize implementation.

### 8.1 The repository's accounting unit and a Cardano token are different claims

The archived Constitution identifies USDM as PRE-RICH's canonical economic unit and requires verified conversion for other payment assets (Articles 5 and 16). The PRE-RICH system specification separately fixes the representation at 100 sub-units per USDM and requires asset identity, price validity, freshness, decimal handling, deterministic rounding, minimum-UTxO treatment and stale/malformed-data rejection. Neither source explicitly defines the accounting unit as exactly one USD or proves that a token carrying the ticker `USDM` is always worth one accounting USDM.

The normative EEV Oracle/Valuation Contract R9 is also explicit that universal safety is relative to the valuation supplied by the adapter: the adapter must establish source authority, verification, freshness, deterministic derivation, conservative direction and failure behavior. It does not certify the market truth of a supplied price.

### 8.2 Current issuer documentation makes ticker-only identity unsafe

- Cardano's ecosystem page describes USDM as a fiat-backed stablecoin whose units are backed 1:1 by USD reserves and whose on-chain proof-of-reserves is delivered through Charli3: [Cardano — Stablecoins](https://cardano.org/stablecoins/).
- NBX's issuer terms, updated 17 July 2026, are more specific for the EEA: NBX-issued USDM and Moneta-issued USDM are distinct issuance obligations, with separate reserves and no cross-liability/cross-coverage. Redemption rights also differ by issuer and eligibility: [NBX USDM Terms](https://nbx.com/en/usdm-terms).

These statements are about issuer backing/redemption obligations; they are not a cryptographic proof that every on-chain token named USDM is interchangeable, or that its secondary-market price is continuously exactly $1. A production valuation must bind the exact network asset identity (policy ID + asset name) and source contract to the intended semantics.

### 8.3 Pyth feed identity is product- and asset-specific

Pyth's official documentation distinguishes Pyth Core and Pyth Pro (formerly Lazer) and maintains separate feed-ID catalogs. The Pro catalog exposes the symbol, feed ID, exponent, status and minimum channel for each feed: [Pyth Pro Price Feed IDs](https://docs.pyth.network/price-feeds/pro/price-feed-ids). The repository's current native-ledger candidate uses Pyth Pro/Lazer with the raw ADA/USD feed. This review did not establish a Pyth Pro feed whose provenance and definition are explicitly tied to the exact Cardano USDM asset policy intended by PRE-RICH. A generic `USDM/USD` symbol or a feed available on another chain would not satisfy that asset-identity requirement by itself.

A DEX-derived ADA/USDM observation can avoid an implicit USD bridge only if its exact source, asset policy, freshness, execution/market constraints and on-chain verification path are qualified under the existing source-of-truth hierarchy. A displayed or historical feed record alone is not such qualification.

### 8.4 Engineering disposition and decision recommendation

The key ambiguity to remove from the source-of-truth hierarchy is whether `USDM` names:

1. a **protocol accounting unit** used to denominate the frozen economic obligations; or
2. a **particular Cardano-native token** whose market/redeemable value must be observed.

The robust architecture should keep those identities explicit even if governance ultimately chooses a one-to-one relationship for valuation. Do not conflate a protocol rule defining its accounting unit with a guarantee about any token's secondary-market price or issuer/redemption path.

**Recommendation for normative review (not an approved decision):** define the accounting-unit meaning and its relationship to USD explicitly, independently of native-token identity. If governance intends USDM sub-units to be USD-denominated accounting units, state that rule normatively; convert raw Pyth ADA/USD data using the exact rational price/exponent and the already-governed conservative rounding contract. If instead USDM denotes a token-relative unit, require an independently verified USD/USDM ratio or an exact asset/USDM quote. In either case, physical USDM tokens accepted as assets must still be bound by exact policy ID/name and an authorized valuation source; ticker-only parity is insufficient.

Until the relevant normative owner adopts one route, Options A/B/C in §4 remain OPEN. No `D = 1` constant, feed ID, rounding update, or production compatibility path is authorized by this research. The production `MintPolicy` must continue to be classified as not Pyth-bound until the exact quote consumed by the Treasury equality check is verified in the same transaction.
