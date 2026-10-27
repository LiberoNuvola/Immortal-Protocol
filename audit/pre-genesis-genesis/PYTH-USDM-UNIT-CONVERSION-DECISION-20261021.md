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


## 12. Agent A — live public feed-catalogue check — 2026-10-26

A further inspection of the providers' current public catalogue surfaces narrowed, but did not close, the source search:

- **Charli3 feed portal:** the public [Market Data Feeds portal](https://portal.charli3.io/dev/feeds) rendered “Active Feeds: 00” / “0 Total Records” during this check. This is only what the public portal exposed at check time; it may reflect a portal/catalogue issue, network filter, or no currently listed feeds, and must not be treated as proof that the provider has no feeds or cannot configure one.
- **Charli3 documented examples:** its [node-operator configuration docs](https://docs.charli3.io/oracles/node-operators/push-oracle/configuration) list ADA/USD, BTC/ADA, and ETH/USD as supported feed examples. They do not document USD/USDM in that page. This is insufficient to claim a custom USD/USDM feed is impossible; it does mean no existing qualifying feed has been evidenced.
- **Pyth Pro:** the official [symbol reference documentation](https://docs.pyth.network/pro/price-feed-ids) confirms that the feed catalogue is programmatically discoverable through the Symbology & Reference Data API. This research pass did not retrieve and inspect a successful live API response, so the exact USD/USDM symbol remains **unverified**, not absent.

### Updated conclusion

There is still **no identified, source-qualified USD-per-USDM feed** ready for IMMORTAL. The next evidence-bearing action is to obtain (a) a successful programmatic Pyth catalogue response and search its canonical symbol/instrument metadata for USD/USDM or an equivalent pair with unambiguous direction, and (b) a concrete Charli3 answer/feed specification rather than inferring availability from general provider capability. If either candidate is found, it must still pass exact pair direction, source provenance, aggregation/manipulation policy, precision/exponent, freshness and timestamp-skew rules, verifier/deployment identity on Preprod, and reproducible on-chain witness checks. Until then, Option B remains selected architecturally but unimplemented; fail closed when either price observation is unavailable or stale. No production code, feed ID, schema, V3, Reveal, deployment, EEV approval or Issue authorization changed.


## 13. Agent A — successful live Pyth catalogue query — 2026-10-26

This check successfully queried Pyth Pro's public Symbology & Reference Data endpoint using its documented `query=USDM` filter:
- [Pyth catalogue query for USDM](https://pyth.dourolabs.app/v1/symbols?query=USDM)
- [Pyth Symbology & Reference Data documentation](https://docs.pyth.network/pro/symbology-reference)

The returned results included:
- `Crypto.USDM/USD`, Pyth Pro ID `609`, description **MOUNTAIN PROTOCOL USD / US DOLLAR**, state **inactive**, exponent `-8`, minimum publishers `1`. This is a different asset and is inactive; it is not a valid feed for the Cardano Moneta USDM token.
- `Crypto.NAV.USDM/RESERVES`, Pyth Pro ID `3326`, description **US DOLLAR MONETA / RESERVES**, state **stable**, exponent `-8`, minimum publishers `2`. Its pair is USDM/reserves, not USD per USDM, so it does not satisfy Option B's required conversion quote.
- `Crypto.NAV.USDM1/USD`, Pyth Pro ID `3324`, description **US DOLLAR M1 / US DOLLAR**, state **stable**, exponent `-8`. This is not the Moneta USDM token's market price and must not be substituted for it.
- No returned result identified a stable, active, exact Moneta USDM/USD or USD/Moneta-USDM market feed.

The result demonstrates why symbol-name matching alone is unsafe: the short name `USDMUSD` refers to Mountain Protocol USD, not Moneta USDM. Per Pyth's documentation, the fully qualified symbol describes the instrument and `pyth_lazer_id` is the stable identifier; nevertheless, neither name nor identifier alone establishes that the source meets IMMORTAL's contract.

**Finding:** the live catalogue did not reveal an immediately usable Pyth Pro feed for Moneta USDM/USD. This is a scoped finding about the public Pyth Pro catalogue response at check time, not a claim that no provider can ever create such a feed. Pyth is not qualified for the second leg of Option B on this evidence. Continue to require a concrete Charli3 specification/provider confirmation or another independently sourced, governed USD-per-Moneta-USDM feed, with exact source and Preprod verifier evidence.

No production code, price schema, feed ID, MintPolicy, V3, Reveal, deployment, EEV approval, or Issue authorization changed. Option B remains selected; the conversion remains unimplemented and must fail closed when either quote is missing, stale, misdirected, or unqualified.


## 14. Agent A — Charli3 operational status re-check — 2026-10-26

The current official Charli3 website states: **“Although Charli3 Oracle ceased operations in May 2026, our open source solutions are still available.”** It says the site is down for maintenance and directs users to its official X account for contract support. See [official Charli3 site](https://charli3.io/). A contemporaneous 29 May 2026 ecosystem report independently reproduced the provider's May 25 announcement that it was pausing services; this is corroborating context, while the current provider site is the primary source.

**Implication:** Charli3 should no longer be treated as an available hosted feed provider or as the preferred next contact for a live production feed. Its open-source code may remain an implementation reference for a separately governed, independently operated oracle, but that would require an explicit operator set, source configuration, operational funding, deployment ownership, monitoring, upgrade/security responsibility, and verifiable Preprod evidence. It is not a ready-made source or permissionless guarantee.

Combined with section 13, neither Pyth's public catalogue query nor Charli3's currently advertised service establishes a qualified USD-per-exact-Moneta-USDM quote. Do not infer the USD/USDM conversion from Moneta's reserve feed, from USDM/USD symbol strings referring to another asset, or from issuer peg statements. Keep Option B selected but blocked on source architecture and qualification.

**Next bounded action:** inventory currently operational Cardano-compatible oracle/source paths and the exact Moneta USDM market pairs available on-chain, without choosing one as normative authority yet. For each candidate, determine whether it can deliver both required legs (ADA/USD and USD/USDM) with authenticated observations, unambiguous pair direction, source provenance, aggregation/manipulation controls, exact precision, freshness/skew policy, and an independently verifiable Preprod witness. A DEX-derived cross-rate is only a candidate if its pool identity, liquidity/depth, manipulation bounds, and atomic observation semantics can be governed and verified. Do not use a single pool/dashboard as settlement authority by default.

No production code, price schema, feed ID, MintPolicy, V3, Reveal, deployment, EEV approval, or Issue authorization changed. Materios remains PAUSED.


## 15. Agent A — Orcfax two-leg candidate identified; liveness/qualification unresolved — 2026-10-26

The official Orcfax CER feed repository contains both required pair names in its Mainnet configuration:
- `ADA-USD`: source `cex`, calculation `median`, interval 3600 seconds, deviation 1%, status `sponsored`.
- `ADA-USDM`: source `dex`, calculation `weighted mean`, interval 3600 seconds, deviation 2%, status `sponsored`.
The configuration is version `2026.05.18.0001`. The Preview configuration also lists both pairs, but marks them `showcase` (version `2025.10.09.0002`), which is not production sponsorship. See the [Orcfax Mainnet feed configuration](https://raw.githubusercontent.com/orcfax/cer-feeds/main/feeds/mainnet/cer-feeds.json), [Preview feed configuration](https://raw.githubusercontent.com/orcfax/cer-feeds/main/feeds/preview/cer-feeds.json), and [Orcfax feed policy documentation](https://docs.orcfax.io/feed-overview).

### Potential conversion, only if both observations are authenticated and compatible

Under Orcfax's base-quote naming convention, `ADA-USD` represents USD per ADA and `ADA-USDM` represents USDM per ADA. In principle:

`USD per USDM = (USD per ADA) / (USDM per ADA)`

This is a **candidate derivation**, not an implementation approval. The two values must be read from exact, authenticated feed identities, with compatible timestamps/freshness, precision, and validity windows. Mainnet configuration status `sponsored` implies provider support depends on sponsorship; the Preview pair status `showcase` is not production qualification.

### Important liveness gap

The public Orcfax Explorer could not be fetched successfully during this pass, and the visible index material showed last facts/collection timestamps several months old. The repository's feed configuration is dated 2026-05-18 and does not prove current publication, Preprod deployment, current datum identity, or usable fresh values. The next evidence gate is therefore to verify current Mainnet and Preprod publication of both exact feed IDs, datum layouts, timestamps, publisher/support status, and a reproducible fresh on-chain witness. If either leg is stale/unavailable, conversion must fail closed.

This makes Orcfax the **first concrete pair-path candidate** found after Charli3 ceased operations, but not yet a qualified source for IMMORTAL. Do not infer USD/USDM from the issuer's 1:1 claim or from a dashboard. No production code, price schema, feed ID, MintPolicy, V3, Reveal, deployment, EEV approval, or Issue authorization changed.


## 16. Agent A — Orcfax exact feed IDs found; publication too stale for settlement — 2026-10-26

The public Orcfax Explorer search results identify the configured feeds as:
- `CER/ADA-USDM/3` — Moneta USDM quoted in ADA terms; latest-value display `0.1628` with age shown as 27 days at retrieval. The page's selected fact is dated 2026-06-14 and states 1 ADA = 0.1684 USDM.
- `CER/ADA-USD/3` — ADA priced in USD; latest-value display `0.1633` with age shown as about 2 months at retrieval. The selected fact is dated 2026-06-18.

Sources: [ADA-USDM feed explorer result](https://explorer.orcfax.io/feeds/CER/ADA-USDM/facts/5cbbb7ee-a232-4f36-844a-5c00ceaeb645) and [ADA-USD feed explorer result](https://explorer.orcfax.io/feeds/CER/ADA-USD/facts/11aa4839-0760-4079-8d0d-524e16d8d3eb). These values are evidence of prior publication, not current rates.

The configured heartbeat is 3600 seconds for both feeds. The displayed ages are far outside that interval, so neither quote can currently satisfy a one-hour freshness requirement on the available evidence. Do not use these stale values in a ticket-price calculation.

The candidate cross-rate remains mathematically:
`USD per USDM = (USD per ADA from CER/ADA-USD/3) / (USDM per ADA from CER/ADA-USDM/3)`
but only after both exact feed observations are independently verified, fresh, precision-normalized without premature rounding, and compatible under an explicit timestamp-skew rule. Current evidence fails the freshness gate. The Explorer itself was not directly retrievable through the web fetcher in this pass; feed details above come from indexed feed-specific search results and must be revalidated against the live chain before any implementation.

**Finding:** Orcfax is the only concrete exact two-feed path identified so far, but it is **not presently qualified** because current liveness/freshness and Preprod witnesses are not established. Next, investigate whether the feed publisher is still publishing and whether a fresh Preprod or Mainnet observation can be verified from the ledger; if not, abandon this candidate for settlement and evaluate a separately governed source. No production code, schema, feed ID, MintPolicy, V3, Reveal, deployment, EEV approval, or Issue authorization changed.

## 17. Agent A — coordinated source-gate reconciliation — 2026-10-26

This entry aligns the memo with the shared repository checkpoint. It updates source status only; it does not change the selected conversion architecture or authorize implementation.

- **Pyth:** The live `query=USDM` catalogue returned Mountain Protocol's inactive `Crypto.USDM/USD` (ID 609), Moneta's `Crypto.NAV.USDM/RESERVES` (ID 3326, a reserves pair), and `Crypto.NAV.USDM1/USD` (ID 3324, a different instrument). None is an active, qualified market USD-per-exact-Moneta-USDM quote.
- **Charli3:** Hosted operations ceased in May 2026 per its official site. Open-source components are not a live qualified source without a separately governed operator/source/deployment arrangement.
- **Orcfax:** `CER/ADA-USD/3` and `CER/ADA-USDM/3` form a concrete *candidate pair path*. Under the configured base/quote semantics, `USD/USDM = (USD/ADA)/(USDM/ADA)`. The explorer surfaced ADA-USDM data 27 days old at retrieval and ADA-USD data around two months old, far outside the configured 3600-second heartbeat. This candidate therefore fails the current freshness gate on available evidence.
- **Disposition:** Option B remains selected; source qualification remains OPEN/BLOCKED. Do not modify production valuation or MintPolicy until both observations can be authenticated and exact-asset-bound, with approved timestamp-skew/freshness, precision, manipulation controls, and a reproducible Preprod witness. Any missing, stale, mismatched, or unqualified leg must fail closed.
- **Next evidence:** obtain fresh on-chain feed-specific facts/UTxOs and verifier/deployment identity for both Orcfax legs, or find a different operational source and qualify it from primary evidence. Do not repeat static catalogue searches without a new input or treat the existence of a configured pair as current publication.

See the [shared repository checkpoint](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/REPO-WIDE-BRANCH-CHECKPOINT-2026-10-21.md) for the coordinated routing and no-repeat boundary. No production code, schema, Oracle quote semantics, economic formulas, V3, Reveal, deployment, EEV approval or Issue authorization changed.

## 18. Agent A — fresh Orcfax explorer liveness re-check — 2026-10-26

A fresh public-web re-check of the Orcfax Explorer still lists the two configured candidate feeds, `CER/ADA-USDM/3` and `CER/ADA-USD/3`, as sponsored, but their latest-value entries are now surfaced as **4 months old**, and the explorer reports **+0 published facts today (UTC)**. Source: [Orcfax Explorer](https://explorer.orcfax.io/). This is an indexed/public explorer observation, not direct ledger proof; it must not be overstated as proof that no fresh on-chain UTxO exists.

This makes the source gate more restrictive, not less: current surfaced evidence does not meet the configured 3600-second heartbeat. Do not use either displayed value in settlement or derive a USD/USDM ratio from them. Next evidence must be the exact on-chain feed UTxOs/facts, datum/feed identities and publication timestamps, independently checked against the relevant Cardano ledger/network. If no fresh fact can be obtained, record the candidate as blocked for lack of fresh evidence and move to another operational source candidate without weakening the freshness contract.

Option B remains selected, but source qualification and implementation remain OPEN/BLOCKED. No code, schema, conversion formula, rounding rule, V3/Reveal semantics, deployment, EEV approval or Issue authorization changed.



## 19. Agent A — Preprod deployment evidence gap confirmed in Orcfax integration docs — 2026-10-26

A second source check found an additional qualification gap beyond freshness: Orcfax's published “Consuming Orcfax Statements” deployment table lists the Fact Statement Pointer deployment for **mainnet**, lists a hash for **preview**, and records **preprod: n/a**. The preview configuration's feed status is `showcase`, not evidence of an operational Preprod deployment. Source: [Orcfax consuming statements / deployment table](https://docs.orcfax.io/consume) and [Orcfax feed overview](https://docs.orcfax.io/feed-overview).

This documentation is not a live ledger query and may lag the network, so it does not prove that no independently deployed or newer deployment exists. It does mean the existing evidence bundle cannot claim a canonical Orcfax Preprod integration: no exact current Preprod FSP identity, publisher/validation identity, feed UTxO, or fresh datum witness has been established. The mainnet Explorer evidence also continues to surface the two candidate feeds as months stale ([ADA-USDM fact](https://explorer.orcfax.io/feeds/CER/ADA-USDM/facts/5cbbb7ee-a232-4f36-844a-5c00ceaeb645), [ADA-USD fact](https://explorer.orcfax.io/feeds/CER/ADA-USD/facts/11aa4839-0760-4079-8d0d-524e16d8d3eb)).

**Disposition:** keep Orcfax blocked for IMMORTAL settlement until direct ledger evidence establishes both exact feed identities, the authentic publication mechanism/current validator identity, fresh timestamps within the approved 3600-second heartbeat, compatible timestamps, and a reproducible network-specific witness. Do not treat Preview `showcase` status as Preprod qualification, and do not relax freshness to accommodate old data. If this evidence cannot be obtained, classify the candidate `BLOCKED_NO_FRESH_ORCFAX_FACT` / no qualified Preprod deployment and move to another separately governed operational source. Option B remains selected; implementation remains blocked. No production code, schema, conversion formula, MintPolicy, V3/Reveal, deployment, EEV approval or Issue authorization changed.


## 20. Agent A — Orcfax consumer verification contract tightened from primary docs — 2026-10-27

The official Orcfax consumer guide clarifies that a feed label or Explorer row is not enough to authenticate a statement. A safe consumer must verify the FSP reference-input token and extract the FS script hash from its inline datum; verify the FS UTxO/token; locate the fact-statement input carrying the FS token; parse its inline datum; check the expected feed ID; enforce `created_at` freshness against the transaction validity interval/business rule; and decode the CER body as an exact rational `num/denom`. The guide explicitly says the FS token is what authenticates the statement, because arbitrary data can be placed at the script address without it. See [Orcfax consuming statements, §§ Verify FSP/FS, feed ID, created_at and Rational body](https://docs.orcfax.io/consume).

The same guide's deployment table currently lists the FSP hash for Preview and Mainnet, but `preprod: n/a`. The feed overview says Mainnet/Preview feeds are monitored through the Explorer and describes sponsored support as dependent on the sponsorship agreement; this is not evidence of a Preprod deployment or of fresh publication. See [deployment table](https://docs.orcfax.io/consume#deployments) and [feed overview](https://docs.orcfax.io/feed-overview).

**Acceptance gate for any future Orcfax implementation:** do not trust ticker, script address, Explorer status or datum shape alone. Require exact current network deployment identities; FSP/FS token-based authenticity; expected versioned feed-ID prefix with delimiter; rational numerator/denominator validation and scale direction; exact Moneta USDM asset identity; `created_at` freshness; bounded timestamp skew between `CER/ADA-USD/3` and `CER/ADA-USDM/3`; and a reproducible direct-ledger witness for both legs. The cross-rate remains only a candidate: `(USD/ADA) / (USDM/ADA) = USD/USDM`, and must not be calculated for settlement until all those gates pass. Do not relax the 3600-second heartbeat. No production code, Oracle schema, economic semantics, MintPolicy, V3/Reveal, deployment, EEV approval or Issue authorization changed.


## 21. Agent A — alternate permissionless USD/USDM evidence route: DEX reserves + authenticated ADA/USD — 2026-10-27

Because the current Orcfax candidate is stale on publicly surfaced evidence and its documented FSP deployment table says `preprod: n/a`, a separate research route is worth testing before declaring that no operational source exists: derive a market-implied USD/USDM ratio from a governed on-chain ADA/USDM pool observation and an independently authenticated ADA/USD price. This still respects Option B and does **not** assume a 1:1 peg. Public trackers report recent Moneta USDM market estimates from Cardano DEX liquidity, but they are discovery signals only, not qualified settlement inputs: [Cardanoscan stablecoin dashboard](https://cardanoscan.io/stablecoins) currently reports a USDM price estimate and liquidity; [DanoNight's Cardano peg tracker](https://danonight.com/cardano/stablecoins) describes its estimate as derived from the deepest ADA pool and a CoinGecko ADA price, with its displayed data last updated 2026-10-23. These are not substitutes for a transaction-bound, directly verified Preprod witness.

Candidate dimensional path: observe exact reserves/price from one or more explicitly approved ADA/USDM pool UTxOs; derive ADA per USDM (or its exact inverse) from the pool's actual datum/reserve semantics; combine with the same-transaction authenticated ADA/USD price to produce USD per USDM as an exact rational. The route is **not approved** and must not be implemented until the source contract freezes exact pool identity, AMM variant/datum decoding, reserve and LP/token identity, decimals, fee/spot-vs-executable quote semantics, minimum liquidity, manipulation/flash-trade resistance, multi-pool aggregation or selection, freshness and transaction binding, rounding/overflow, and fail-closed behavior. Do not use a website's displayed price or a spot reserve ratio alone as settlement truth.

**Next research step:** identify the canonical current Preprod pool candidates for exact Moneta USDM and ADA, verify their live UTxOs/datum and protocol identity directly, and measure whether a governed liquidity/manipulation policy can be satisfied. If no pool or approved policy meets requirements, retain `BLOCKED_NO_QUALIFIED_USD_USDM_SOURCE`. No production code, oracle schema, `OracleQuote`, `Economic.totalUsdmValue`, `MintPolicy`, V3/Reveal, deployment, EEV approval or Issue authorization changed.


## 22. Agent A — concrete DEX discovery lead, mainnet only; Preprod remains unproven — 2026-10-27

Fresh research narrowed the DEX investigation to Minswap's ADA/USDM market as the first pool family to inspect, not as an approved settlement source. Moneta's 2026-04-29 guide calls Minswap the deepest USDM/ADA liquidity venue and directs readers to its verified USDM token page; the official Minswap API docs identify verified USDM with 6 decimals and the Moneta asset identity (`currency_symbol` + token name). See [Moneta's Minswap guide](https://moneta.global/learn/swap-to-usdm-on-minswap/) and [Minswap API docs](https://docs.minswap.org/developer/minswap-apis).

A public GeckoTerminal result exposes one Minswap ADA/USDM pool contract-address lead `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171`, with a displayed liquidity estimate around USD 0.9M and last transaction described as recent at the time indexed. This is third-party discovery metadata, not the pool's canonical UTxO/out-reference, current datum, validator version or a Preprod identity; the source page was indexed last month. See [GeckoTerminal pool page](https://www.geckoterminal.com/cardano/pools/f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171).

**Disposition:** mainnet DEX candidate discovery is more concrete, but it does not close the Preprod settlement gate. The next valid step is to map the exact Moneta asset identity on Preprod, query actual Preprod ADA/USDM pools and their live UTxOs directly, and separately document the mainnet pool only as a future-network candidate. Never copy mainnet pool IDs/addresses into Preprod, and do not treat API or Explorer liquidity/price as authenticated chain evidence. All manipulation, freshness, fee, rational-price and ADA/USD transaction-binding gates from §21 remain. No production code or protocol semantics changed.


## 23. Preprod pool discovery method verified; live pool evidence still outstanding — 2026-10-27

The official Minswap SDK repository contains a testnet example configured for `NetworkId.TESTNET` and the Blockfrost Preprod endpoint, and calls `adapter.getV2PoolByPair(assetA, assetB)` to retrieve a V2 pool before using its reserves and fee fields. This establishes a concrete, protocol-native discovery method for Preprod rather than copying a Mainnet pool address. See [Minswap SDK](https://github.com/minswap/sdk). The public Minswap Preprod interface is also reachable at [testnet-preprod.minswap.org](https://testnet-preprod.minswap.org/), but UI availability does not prove the exact USDM pair exists on Preprod.

Moneta's official developer page and policy-ID page currently state the USDM identity with policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`, asset name `0014df105553444d`, six decimals, and explicitly label it **Cardano Mainnet**. Do not reuse this asset unit as a Preprod identity without independent Preprod ledger evidence. See [Moneta developer token information](https://moneta.global/developers/) and [Moneta policy ID](https://moneta.global/policy-id/).

**Execution result:** source review only. No live Preprod pool lookup or direct ledger UTxO/datum witness was produced in this step, so no pool is qualified. The next admissible action is a read-only query using the Minswap SDK configured for Preprod and the independently verified Preprod USDM asset unit; record exact pool variant, LP asset, pool UTxO/out-ref, inline datum, reserves, fee fields, block/slot and response digest. If the official asset has no Preprod deployment, classify the Minswap route as unavailable on Preprod. No production code or economic semantics changed; Option B remains unimplemented and Issue remains fail-closed.


## 24. Repository confirms Preprod tUSDM identity; do not confuse it with Moneta Mainnet USDM — 2026-10-27

A review of the existing B1 EEV workflow and `preprod-direct-usdm-source-set.mjs` found the repository's explicitly approved Preprod test asset unit: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d` (policy `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`, token name `0014df10745553444d`, six atomic decimals). The workflow names this `PREPROD_TUSDM_UNIT`; the source-set verifier hard-pins the same value. This resolves the local test-network asset identity for the existing direct-tUSDM EEV test profile, but it does **not** establish that this test token is Moneta's Mainnet USDM or provide a USD/USDM market conversion. Moneta's Mainnet unit remains policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad` + asset name `0014df105553444d`; never substitute one for the other.

Minswap's official SDK supports querying V2 pools on Cardano Preprod by exact asset pair, and the Minswap V2 repository documents a Preprod deployment. Thus a test-only next step is feasible: query the ADA / exact `PREPROD_TUSDM_UNIT` pair using a read-only Preprod adapter and capture exact live pool UTxO, datum, reserves, fee parameters, protocol variant and chain-tip slot. No such live pool observation was produced in this review. Even if found, this would validate testnet integration mechanics only; it must not qualify a market USD/USDM conversion or alter the Option B settlement-source gate. No production code or economic semantics changed.


## 25. Preprod pool lookup: do not use Minswap's public metrics API as testnet evidence — 2026-10-27

A fresh check of Minswap's official API documentation states the documented base URL as `https://api-mainnet-prod.minswap.org`; its asset and pool metric endpoints are therefore Mainnet analytics, not a Preprod ledger interface. They cannot establish whether an ADA/Preprod-tUSDM pool exists or provide canonical Preprod UTxO/datum evidence. The official SDK example does support `NetworkId.TESTNET`, a Preprod provider, and `getV2PoolByPair(assetA, assetB)`, while the official V2 contract repository says V2 is deployed on Preprod. Sources: [Minswap APIs](https://docs.minswap.org/developer/minswap-apis), [Minswap SDK](https://github.com/minswap/sdk), [Minswap V2 contract deployment](https://github.com/minswap/minswap-dex-v2).

The repository's open issue [#37](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37) remains the governing no-assumption gate: its current disposition says tUSDM is `OBSERVED_NOT_QUALIFIED` and explicitly prohibits qualification by ticker, balance, issuer branding or CI pass. Keep this unchanged. This step did not query the Preprod ledger or acquire a pool witness; the next executable operation requires a configured Preprod SDK provider (e.g. Blockfrost or Maestro) and must be read-only, then independently re-check the exact returned pool UTxO and inline datum against Koios/direct ledger. Even a successful tUSDM pool observation is test integration evidence only, not a qualified USD/USDM conversion. No production code or economic semantics changed.

## 26. Read-only Minswap Preprod observer added; execution evidence still required — 2026-10-27

A dedicated read-only observation path has been added on `work/immortal-green-closure`:

- `audit/cardano-integration/observe-minswap-preprod-tusdm-pool.mjs` uses the official `@minswap/sdk@0.5.0` Blockfrost adapter on Cardano Preprod to query the exact `lovelace` / pinned Preprod tUSDM pair.
- `.github/workflows/minswap-preprod-tusdm-observation.yml` runs on a matching branch push or manual dispatch and stores the JSON observation as a workflow artifact.
- For a returned pool, the script re-queries the exact address/out-reference through Koios and compares the inline datum bytes, lovelace value and tUSDM atomic quantity. Missing or mismatched witnesses fail closed. A missing V2 pair is reported as a scoped V2 lookup miss, not proof that no Minswap pool exists in every protocol variant.
- The observer is read-only: it does not build, sign or submit a transaction. Its explicit status remains `OBSERVED_NOT_QUALIFIED`; the Preprod token must not be confused with Moneta Mainnet USDM.

The initial Blockfrost-backed workflow was executed twice and stopped before the chain query because `BLOCKFROST_PROJECT_ID` was absent from the GitHub Actions environment; those failures are provider-configuration failures, not pool findings. Agent A then replaced that dependency with direct public Koios discovery using the exact Minswap V2 pool-authentication asset and SDK-configured testnet payment credential. This removed the credential blocker and generated the live result recorded in §27.

The decision record remains: Option B is the selected approach, but no qualifying USD/USDM source or versioned conversion-consumer contract has been approved. No change was made to OracleQuote, `Economic.totalUsdmValue`, MintPolicy, V3, Reveal, economic constants, deployment approval, or Issue authorization.


## 27. Live Koios check: no exact ADA / Preprod-tUSDM pair in Minswap V2 — 2026-10-27

The public-Koios observer completed successfully in GitHub Actions:

- Workflow run [#40457199176](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457199176), completed **success**; artifact [ID 12713226154](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40457199176/artifacts/12713226154).
- Observed at `2026-10-27T05:46:39.548Z`. Koios tip before and after the query was unchanged: block `5340313`, absolute slot `137396789`, hash `52889995bf1e22c56180aa76e41475684832b4af24693030ac6f7fdd6285f93f`.
- The query enumerated `455` live UTxOs carrying Minswap V2's testnet pool-authentication asset under payment credential `d6ba9b7509eac866288ff5072d2a18205ac56f744bc82dcd808cb8fe`; all `455` decoded as V2 pool states, with `0` parse rejects.
- Exact pair candidates for `lovelace` + Preprod tUSDM `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`: `0`. Therefore no exact pool out-reference existed to perform the second address/out-reference witness query against. The emitted status is `NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V2`; evidence SHA-256: `aeb1559b58961a2d9b3be0dce2eebafc04af1cbfb3d0eb1edfe7731bfc0fa689`.

**Scope of the finding:** this is a successful, live query and a negative finding for the exact pair within Minswap V2's configured Preprod pool credential. It does not prove that no ADA/tUSDM pool exists in Minswap V1, Stableswap, another DEX, or another test asset deployment. In particular, it is not a USD/USDM conversion witness or price quote. The DEX route for this exact Preprod pair remains unavailable in V2 and should not be developed further against a guessed pool.

The workflow and observer remain read-only: no transaction was built, signed or submitted. Qualification remains `OBSERVED_NOT_QUALIFIED`; the Option B source and consumer contract are still unqualified. No parity is assumed, and EEV approval/Issue remain separately gated.

## 28. Expanded live Preprod scan: Minswap V1/V2/StableSwap and non-Minswap script candidates — 2026-10-27

The expanded read-only observer completed successfully in [GitHub Actions run #40458245138](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458245138), with [artifact ID 12713512727](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40458245138/artifacts/12713512727). It ran from the current `work/immortal-green-closure` source and queried public Koios endpoints only.

**Minswap coverage:**
- Exact configured Preprod tUSDM UTxOs scanned for Minswap V1: 969; rows at the pinned V1 pool payment credential: 0; parsed V1 states: 0.
- Minswap V2 pool-authentication UTxOs at the configured testnet pool credential: 455; V2 pool states decoded: 455; parse rejects: 0; exact ADA / pinned Preprod-tUSDM candidates: 0.
- SDK-configured Preprod StableSwap pools: 3; exact pinned-tUSDM membership: 0.
- Overall result: `NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V1_V2_CONFIGURED_STABLESWAP`.

**Same-tip consistency for run #8:** before and after the scan, Koios returned block `5340350`, absolute slot `137397443`, hash `61c6385399a9b1601f1c535cc848272d3b1f12bffd94afc9ae0c75865f44c7b6`. The snapshot reports `chainTipUnchanged: true`; observation interval was `2026-10-27T05:55:29.834Z`–`2026-10-27T05:55:33.198Z`. Evidence SHA-256: `ef572fbfeaae493ed6e065b7e79d552358f4ce168153260c81ebc8b2adac659d`.

**Other script UTxOs containing the exact test tUSDM:** the observer checked Shelley address checksums and reconciled all 969 encoded payment credentials with Koios `payment_cred`; address decode failures: 0, credential mismatches: 0. It found 15 non-Minswap script-credential groups. Two external outputs with tUSDM + ADA + other assets + datum evidence, after excluding the known Immortal/B1 PrizePool singleton, were independently re-queried by exact address/out-reference:
- `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0`, payment credential `fd75e24c9ea915ce8e48d3ff1d0c54ad09cc01191c24416ad7dba4a3`, held `100000000` tUSDM atomic units, `1015788430` lovelace and 14 other asset units. Inline datum/hash and asset quantities matched the independent second read.
- `f27b6b913bebca852dfbb8ec4585ec5925c1d04ed05ea9cb96720712c9df11cd#1`, payment credential `94bca9c099e84ffd90d150316bb44c31a78702239076a0a80ea4a469`, held `123` tUSDM atomic units, `2521350` lovelace and 5 other asset units. Inline datum/hash and asset quantities matched the independent second read.

Both were recorded as `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL`. These reads establish only that the exact outputs and datum/value witnesses were still live and matched at re-query time. They do not identify the scripts' protocol semantics and are **not** evidence that either output is a DEX pool. The known B1 PrizePool at `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` was explicitly excluded from these external candidates by its exact Pool singleton unit.

**Disposition:** this closes the current configured Minswap V1/V2/StableSwap discovery attempt for this exact Preprod asset pair; it does not exhaust every DEX/protocol or prove any other script UTxO to be a market. Do not derive a price from these balances. Option B is still selected as an approach only: no qualified USD/USDM source or versioned consumer contract was found, no parity is assumed, and `tUSDM = OBSERVED_NOT_QUALIFIED` remains the qualification state for USD/USDM conversion. No transaction was built, signed or submitted; no EEV approval or Issue is authorized.
