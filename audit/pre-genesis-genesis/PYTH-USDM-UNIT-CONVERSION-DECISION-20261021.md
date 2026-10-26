# Pyth USD/ADA → IMMORTAL USDM Settlement — Unit/Conversion Decision

**Status:** OPTION B SELECTED BY PROTOCOL AUTHORITY ON 2026-10-26 — SEPARATE USD/USDM CONVERSION REQUIRED / SOURCE AND IMPLEMENTATION CONTRACT STILL OPEN  
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

## 4. Unit binding decision — Option B selected on 2026-10-26

The protocol authority selected **Option B: verify USD/USDM separately**. This is a normative selection of the conversion approach, not a claim that a suitable feed has already been identified or qualified. Option A (implicit/fixed parity) is not authorized. Option C is not selected. The implementation and source qualification remain open.

| Option | Rule | Consequence | Trust / unresolved issue |
|---|---|---|---|
| **A. Define USD/USDM parity** | Normatively define `1 USDM = 1 USD` for all settlement valuation, or give an exact fixed ratio and boundary | ADA/USD can be converted into USDM under the rational formula above | This is a constitutional/economic definition, not an implementation assumption; must be explicitly governed and independently reviewed |
| **B. Verify USD/USDM separately — SELECTED** | Require a source-qualified, fresh USD/USDM conversion and compute the exact ratio with ADA/USD | Does not assume parity | Adds a second source/feed, another freshness/precision path and another availability dependency; exact provider/feed and contract remain unqualified |
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

## 7. Next implementation gates after Option B selection

The selected approach is B, but do not change the Oracle singleton schema, `OracleQuote`, `Economic.totalUsdmValue`, or MintPolicy price semantics until the source and versioned contract are specified. Required gates:

1. Identify a candidate USD/USDM source and verify that its exact pair direction is **USD per USDM** (or define the exact inverse rational), its network/deployment, source identity, asset/issuer identity, precision, timestamp semantics, update cadence, and access/licensing constraints.
2. Qualify the source against manipulation/liquidity risk and freshness. A signature verifier alone is insufficient: the consuming validator must enforce a governed freshness window and fail closed when either leg is missing, stale, invalid, or outside supported bounds.
3. Bind ADA/USD and USD/USDM observations to the same accepted Issue transaction, or define a formally approved bounded timestamp-skew rule. Never silently combine observations from incompatible time windows.
4. Freeze an exact integer-rational representation, pair direction, exponent bounds, overflow/resource limits, final rounding rule and failure predicates in a versioned PriceReference contract. Preserve raw price/exponent data; do not pre-round the quote off-chain.
5. Implement pure Haskell/TypeScript/Aiken differential tests for the complete two-feed conversion, including reciprocal/direction mistakes, zero/negative/overflow prices, stale or mismatched timestamps, missing feed, confidence/spread bounds where supported, and ceiling-rounding boundaries.
6. Only after those gates, bind the source-authenticated observations into the canonical Plutus V2 MintPolicy settlement path and validate on the native ledger. Keep the existing Pyth carrier and MintPolicy semantics unchanged until the contract is approved.

This decision does **not** define USDM as always equal to USD, guarantee redemption or a market peg, choose a feed provider, authorize a production oracle update, approve deployment, or authorize a real Issue.


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
## 9. Normative decision by the specification authority — Preprod physical asset eligibility — 2026-10-24

**Decision status: ACCEPTED for the explicitly scoped Cardano Preprod EEV profile.** The specification authority has explicitly decided that the configured Preprod tUSDM candidate may be admitted for its intended purpose: it may count as the physical `VerifiedUSDM` asset in the exact qualified B1 PrizePool UTxO, subject to live identity/out-reference verification and the remaining EV1–EV7 and deployment/admission gates.

### 9.1 Exact scope and identity

- Network: **Cardano Preprod only**.
- Policy ID: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`.
- Asset name (hex): `0014df10745553444d`.
- Full asset unit: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`.
- Permitted role: count the physically present quantity of this exact asset in the exact, currently revalidated, qualified B1 PrizePool UTxO for the Preprod direct-USDM EEV profile.
- Rationale recorded by the authority: this candidate is intentionally configured for this Preprod use case; admission is a governed protocol choice, not an inference from the ticker or from a passing CI run.

### 9.2 Explicit limits

This decision:
- does **not** make this Preprod asset identical to any mainnet USDM asset;
- does **not** establish issuer-backed USD redemption or a continuously fixed secondary-market price;
- does **not** define `1 USDM = 1 USD` or select a USD/USDM conversion route;
- does **not** by itself qualify a live source-set, certify EV1–EV7, create EEV deployment approval, satisfy authoritative Issue admission, or authorize a real Issue.

The physical asset's exact policy ID and asset name remain mandatory; ticker-only matches are not accepted. Live UTxO identity, quantity, freshness, datum/source references and all evidence digests must be revalidated for the exact Pool out-reference before qualification.

### 9.3 Decision boundary still open

The specification authority has **not yet selected** Option A, B or C in §4 for any valuation path that converts USD-denominated observations into protocol USDM units. No USD/USDM parity is inferred. The conversion contract, source authority, freshness/precision bounds, rounding, failure behavior and review gate remain open until the authority records that separate decision.

**Operational consequence:** remove the normative *asset-eligibility* blocker for this exact Preprod profile and proceed with source-set/EV1–EV7 qualification work using this exact unit. Keep the USD/USDM conversion decision open; keep any workflow that requires an unselected USD/USDM conversion fail-closed. This is not a blanket production or mainnet authorization.


## 9. Agent A source-availability check — 2026-10-26

A bounded inspection of the current `work/immortal-green-closure` source found no qualified direct ADA/USDM quote path that can currently be promoted as Option C:

- The documented Pyth input is ADA/USD, whose raw integer price and exponent are USD-denominated; it is not a direct USDM quote.
- The existing B1 FundTreasury valuation trace uses a fixed synthetic `ADA_PRICE_USDM_SUBUNITS = 80` for its bounded valuation test. That fixture is not evidence of a live ADA/USDM source, nor does it qualify a feed for settlement.
- The current branch's cited Oracle/valuation contract and unit-conversion decision do not identify an authenticated, freshness-bounded ADA/USDM feed with frozen asset identity, precision, rounding and failure semantics.

**Finding:** Option C is architecturally preferable only if an actual source can be qualified, but it is **not implementation-ready on current evidence**. No direct ADA/USDM feed is selected or claimed to exist. The next non-normative investigation is to inventory candidate Cardano market/oracle sources and test whether one can satisfy the canonical source-authentication, manipulation/liquidity, freshness, exact asset identity, decimal and fail-closed requirements. If no candidate meets those requirements, return to the authority for an explicit choice between B and another governed route; do not relabel ADA/USD as ADA/USDM.

This entry changes no protocol semantics, oracle schema, `OracleQuote`, `Economic.totalUsdmValue`, MintPolicy, deployment state, or Issue authorization.


## 10. Option B decision recorded — 2026-10-26

The protocol authority explicitly selected **Option B** in the operating conversation on 2026-10-26. This supersedes the earlier statement that A/B/C remained undecided. The selection is limited to the architecture of settlement conversion: use an independently verified USD/USDM rate alongside ADA/USD, rather than assuming parity or using a direct ADA/USDM quote.

### External integration constraints checked

- Pyth's Cardano Pro integration guide documents ADA/USD feed ID 16 and explains that its transaction-level signature verification does **not** itself enforce price freshness; the consuming validator must check timestamps. See [Pyth — Use Prices on Cardano](https://docs.pyth.network/price-feeds/pro/use-prices-on-blockchain/cardano).
- Pyth's published Cardano material describes an institutional pricing layer and expansion of feed coverage, but this does not prove that a USD/USDM feed is currently available or approved for this application. See [Pyth Pro on Cardano](https://www.pyth.network/blog/pyth-pro-is-live-on-cardano-the-pricing-layer-cardano-defi-has-been-waiting-for).
- Public issuer material distinguishes reserve/redemption mechanics from secondary-market price behavior. It is context, not an oracle input or protocol guarantee. See [Moneta USDM Lite Paper](https://moneta.global/USDM%20Lite%20Paper.pdf).

**Source qualification status:** no concrete USD/USDM feed ID/provider, authenticated Cardano verifier path, or source freshness contract is qualified by this memo. The source-selection task remains open. Do not infer feed availability from the existence of Pyth Pro, an issuer reserve statement, or an observed market price.


## 11. Agent A source-provider inventory — 2026-10-26

This is a source discovery result, not feed qualification.

| Candidate / evidence | What it establishes | Why it does not yet satisfy Option B |
|---|---|---|
| **Pyth Pro** — official [Cardano integration](https://docs.pyth.network/price-feeds/pro/use-prices-on-blockchain/cardano) and [feed catalogue](https://docs.pyth.network/pro/price-feed-ids) | Cardano integration supports signed price updates; the documented example uses ADA/USD feed ID 16. The contract must enforce freshness itself. | The inspected material did not identify a concrete USD/USDM feed ID or a Cardano-verifiable deployment for this application. Do not invent an ID. |
| **Charli3** — [official site](https://charli3.io/) and [technical docs](https://docs.charli3.io/) | Charli3 advertises Cardano-native oracle services, configurable feeds and multi-DEX/API-source integration capabilities. This makes it a plausible provider to ask about a custom USD/USDM feed. | No exact USD/USDM feed, source list, deployment address, datum schema, freshness rule, security/economic specification or Preprod witness has been verified for IMMORTAL. Provider capability is not an existing qualified feed. |
| **Public DEX/market dashboards** — e.g. [USDM market overview](https://realtap.app/token/c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d) and [Cardano stablecoin peg tracker](https://danonight.com/cardano/stablecoins) | Market prices and liquidity can be observed; USDM can trade away from USD parity. These are useful discovery/monitoring references. | A website/API snapshot is not, by itself, an authenticated on-chain oracle datum or a governed source. A single DEX pool or dashboard must not be promoted to settlement authority without manipulation, depth, outlier, freshness and exact asset-identity qualification. |
| **Issuer / reserve disclosures** — [Moneta USDM product information](https://moneta.global/products/usdm/) | Issuer material describes the intended USD peg, reserve and redemption framework. | That describes issuer/contractual design and reserves, not an independently verified, transaction-time market USD/USDM rate. Treating it as the numeric conversion would silently revert to Option A. |

### Finding and next action

No candidate is qualified yet. **Charli3 is the first Cardano-native provider candidate for a bounded technical/source inquiry**, because its public technical material describes configurable Cardano oracle feeds and multiple source adapters; this is not an endorsement or a claim that it already publishes USD/USDM. The required inquiry is whether it can supply an independently sourced USD-per-USDM observation with documented underlying sources, aggregation/outlier policy, exact feed and datum identity, freshness semantics, deployment addresses, and a verifiable Preprod example. In parallel, verify Pyth's current programmatic feed catalogue for an exact USD/USDM symbol before ruling it out; the web UI/catalogue evidence reviewed here was not enough to prove universal absence.

Until a provider returns concrete artifacts, the integration remains blocked: no guessed feed ID, no hardcoded 1:1 ratio, no off-chain-only quote accepted as authoritative, and no fallback to a stale Oracle State. The current task is provider/source qualification, not code modification.
