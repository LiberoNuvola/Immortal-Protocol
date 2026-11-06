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

## 29. External script candidate naming is not protocol authentication — 2026-10-27

A review of the independently re-queried external candidate `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0` found one native-asset name whose hex decodes to `HydraHeadV2`, under policy `4f7a59304309bf7059fe7a3ed4fb9daaaa842dd7da1521cf38d56faf`. This is **not** sufficient to attribute the UTxO to a genuine Hydra Head or to a DEX. The upstream Hydra repository includes a dedicated security scenario for a counterfeit `HydraHeadV2` token minted under a permissive policy; the real Head's policy ID must match, so asset-name matching alone is intentionally insufficient. See [Hydra's counterfeit Head state-token scenario](https://github.com/cardano-scaling/hydra/blob/e016d0a20d59ba1e7d34b7074ac0eeeed65201d1/hydra-cluster/src/Hydra/Cluster/SecurityScenarios.hs#L178-L186).

Accordingly, preserve the existing status `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL`: the exact out-reference, datum and assets matched the independent Koios re-read, but protocol identity and pool semantics have not been established. Do not classify this output as genuine Hydra, a DEX pool, or a price source until its exact policy/script derivation and applicable protocol witness are validated. The other external candidate remains similarly unidentified. This caution changes no economic or production semantics and does not affect the negative finding for the configured Minswap V1/V2/StableSwap pair scan.

## 30. Follow-up observation with exact external asset quantities and corrected name decoding — 2026-10-27

After correcting the observer's printable-ASCII name diagnostic, [Minswap Preprod run #10](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40459277681) completed successfully and uploaded [artifact ID 12713143990](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40459277681/artifacts/12713143990). The corrected observer confirms the same scoped result: `NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V1_V2_CONFIGURED_STABLESWAP`. Evidence SHA-256: `7d532a1fc50154543997e49c2d22a3a70b1264b9af1582debea3b0ff5f083002`.

The run scanned 969 live exact-Preprod-tUSDM UTxOs; found 0 Minswap V1 pool-credential rows, decoded 455 Minswap V2 pool-auth UTxOs with 0 parse rejects, found 0 exact pair candidates in V1/V2, and found 0 exact tUSDM membership among the 3 SDK-configured Preprod StableSwap pools. It also rechecked the same two external script outputs by exact out-reference; asset values and datum evidence matched:
- `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0`: `100000000` tUSDM atomic; `1015788430` lovelace; native assets include `BTC` quantity `129720`, one `HydraHeadV2`-named token under policy `4f7a59304309bf7059fe7a3ed4fb9daaaa842dd7da1521cf38d56faf`, a second token under the same policy, and 12 single-quantity assets under policy `5d09adde9fdf0bb0cbf14180fa490a32b4031c67e83f766806b540fe`. The exact token name does not authenticate a genuine Hydra Head; see §29 and the upstream counterfeit-token security scenario. This remains a script UTxO candidate, not a DEX pool or price source.
- `f27b6b913bebca852dfbb8ec4585ec5925c1d04ed05ea9cb96720712c9df11cd#1`: `123` tUSDM atomic; `2521350` lovelace; asset name / atomic quantity pairs are `SIRIUS-B` / `123`, `RIGEL` / `123`, `SIRIUS-A` / `246`, `VEGA` / `231`, and `USDr` / `14436931`. These native asset labels do not establish the script's protocol semantics. Its exact out-reference, assets, datum hash and inline datum matched the independent re-read; it remains `LIVE_SCRIPT_UTXO_RECHECKED_NOT_CLASSIFIED_AS_POOL`.

**Snapshot limitation:** this latest observer's tip advanced from block `5340390` / slot `137398081` (hash `849047ee5215722162fc3e72caacd5316967e12f2ac710335922ea7ac414b5a2`) to block `5340393` / slot `137398118` (hash `cde1849039290153cebe92ba057c37e96c77f4045eea04ccbaa44397919ac650`). Treat this as a bounded query interval, not an atomic same-slot snapshot. The second reads prove that the two selected external out-references still matched at their re-query times; they do not authenticate pool protocol or provide a market quote.

Disposition is unchanged: no exact ADA / pinned Preprod tUSDM pair was found in the configured Minswap V1/V2/StableSwap sets. The two external script candidates remain unidentified rather than being promoted to DEX pools. Option B remains the selected approach but the USD/USDM source and versioned consumer contract are not qualified; no parity is assumed, and EEV approval / Issue remain gated. No transaction was built, signed or submitted.

## 31. Mainnet Moneta-USDM pool discovery: provider timeouts and fail-closed retry — 2026-10-27

The new read-only Mainnet observer is deliberately separate from the Preprod tUSDM scan. It targets the canonical Mainnet Moneta unit `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d` (6 decimals) and never treats the Preprod test asset as equivalent.

Initial Mainnet run [#40459726791](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40459726791) failed closed on Koios `/asset_utxos` HTTP 504 while requesting the broad global USDM holder set; its tiny artifact records `OBSERVATION_FAILED_CLOSED`, not “pool absent”. Follow-up run [#40544836774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40544836774) exposed a syntax error in the new Koios request helper. Run [#40545003507](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40545003507) then timed out on the unbounded V1 script UTxO request and also failed closed. These attempts produced no Mainnet pool-discovery conclusion.

The observer has since been corrected to use valid request-label syntax, bounded retry/timeouts for Koios, 100-row pagination for the exact Mainnet USDM unit, and filtering by the pinned Minswap V1 payment credential. Latest run [#40546067834](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40546067834) is pending at the time of this memo update; its outcome must be read from the actual run/artifact before any conclusion is recorded. Do not infer a missing pool from a pending or failed observation. The Mainnet scan remains read-only: no transaction was built, signed or submitted.

The previous Preprod result is unchanged: the configured Minswap V1/V2/StableSwap scan found no exact ADA / pinned test-tUSDM pair, and `tUSDM = OBSERVED_NOT_QUALIFIED`. Neither Mainnet market discovery nor a live ADA/Moneta-USDM pool alone would qualify USD/USDM conversion; authenticated ADA/USD, freshness, manipulation/liquidity bounds, fee treatment, exact rational arithmetic, temporal/transaction coupling and a governed consumer contract remain mandatory.

## 31. Refine external candidate #1 identification: Hydra Head V2 validator hash matches official Preprod mapping — 2026-10-27

A follow-up check of the official `cardano-scaling/hydra` source changes one part of the earlier wording in §§29–30. The external output `50ac85a0fded8f8285c0ddcdf937f692ab8f63dcf74b4833e3659fd2f5ef719c#0` has payment credential `fd75e24c9ea915ce8e48d3ff1d0c54ad09cc01191c24416ad7dba4a3`. The official Hydra repository's `hydra-chain-observer/script-hashes.json` maps this exact script hash to the **Hydra Head validator for version 2.2.0**, and the upstream test suite uses the same hash to derive the Preprod Head address. This is materially stronger than recognizing the token name alone.

**Correct classification:** the address/payment script is consistent with the official Hydra Head V2.2.0 Preprod validator. This explains why the output has a `HydraHeadV2`-named state token and is consistent with a Hydra Head state output. However, the state-token minting policy is parameterized, and the asset name `HydraHeadV2` alone still does not authenticate that policy. The exact token policy / seed derivation and Hydra datum semantics have not yet been validated in this audit. Do not claim more than the official payment-script hash mapping establishes.

This candidate is therefore **not a DEX pool candidate**: it is an output at the official Hydra Head validator, and its BTC/tUSDM/ADA balances must not be interpreted as a market reserve or quote. Keep the out-reference and datum/value recheck as chain evidence, but exclude it from price-source discovery. The second candidate remains unclassified because its payment credential has not been mapped to an authenticated protocol.

Source: [official Hydra script hash mapping](https://github.com/cardano-scaling/hydra/blob/c304b9ad793836d4105d7ca38fcd8572b5cb9672/hydra-chain-observer/script-hashes.json) and [official Hydra Preprod address/hash test](https://github.com/v0d1ch/hydra.registry/blob/dd2baa3f154c1f787411cc17cd3216699db72588/api/test/L1HeadScanSpec.hs). No economic, conversion, or production qualification changes.

## 32. External candidate #2 identified as Seedelf wallet contract — 2026-10-27

A focused search of the exact payment credential for external out-ref `f27b6b913bebca852dfbb8ec4585ec5925c1d04ed05ea9cb96720712c9df11cd#1` found the same hash, `94bca9c099e84ffd90d150316bb44c31a78702239076a0a80ea4a469`, in the public **Seedelf Wallet** repository. Seedelf's own `seedelf-data/api/src/constants.rs` describes it as the wallet contract payment credential; its README identifies the associated Seedelf validator. The Cardano Contracts Registry independently lists the same hash as Seedelf's wallet contract. Seedelf's published address configuration explicitly includes Preprod.

Sources: [Seedelf contract constants](https://github.com/logical-mechanism/Seedelf-Wallet/blob/5abd547032782caeb5253229e86cc30204db0af5/seedelf-data/api/src/constants.rs), [Seedelf contract README](https://github.com/logical-mechanism/Seedelf-Wallet/blob/5abd547032782caeb5253229e86cc30204db0af5/seedelf-contracts/README.md), [Cardano Contracts Registry entry](https://github.com/StricaHQ/cardano-contracts-registry/blob/c72a37d31c4eddd31655f9386c70265b8795dd93/projects/seedelf.json).

**Correct classification:** the payment credential is consistent with the Seedelf Wallet validator v1. The exact output contains `123` atomic units of the pinned Preprod tUSDM, `2,521,350` lovelace, and assets named `SIRIUS-B`, `RIGEL`, `SIRIUS-A`, `VEGA`, and `USDr` under their respective policies. These are wallet holdings, not evidence of pool reserves or a price quote. The exact out-reference and datum/value witness still match the independent Koios re-read; no attempt is made here to infer the wallet owner's identity or to treat asset labels as verified issuer/oracle metadata.

Combined with §31, the two strongest non-Minswap script candidates are now explained as (1) a UTxO at the official Hydra Head V2.2.0 Preprod validator and (2) a UTxO at the Seedelf Wallet Preprod validator. Neither is a DEX pool. This narrows the current candidates but does not exhaust every protocol or establish a USD/USDM conversion source. Option B and all qualification gates remain unchanged.


## 33. Agent A — official Pyth Pro Cardano Preprod path now documented; first leg candidate only — 2026-11-03

A fresh review of the current official Cardano Developer Portal and Pyth deployment registry establishes a more concrete path for the **ADA/USD leg** than the October discovery notes. This is a source-discovery and integration-contract update only; it does not qualify a source for PRE-RICH settlement or authorize a transaction.

### Official network identity and feed

The official Pyth Pro contract-address registry currently lists the Cardano Preprod Pyth Pro policy ID (`pyth_id`) as:

`c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45`

The same registry lists a separate policy ID for Cardano Mainnet. Do not copy the Mainnet ID into Preprod or infer the identity from an asset name. See [Pyth Pro contract addresses](https://docs.pyth.network/pro/contract-addresses).

The official Cardano integration guide documents the `Crypto.ADA/USD` feed as Pyth Pro feed ID `16`. The Pyth Terminal metadata currently reports quote currency USD, exponent `-8`, minimum publisher count `3`, spot instrument and `fixed_rate@200ms` minimum channel. The displayed live price is a market display, not a transaction-bound settlement witness. See [Cardano Developer Portal — Pyth integration](https://developers.cardano.org/docs/build/integrate/oracles/pyth/) and [Pyth Terminal — ADA/USD](https://app.pyth.com/explore/Crypto.ADA%2FUSD).

### Transaction verification shape

The official Cardano guide describes a pull-based Pyth Pro flow:

1. The off-chain client fetches a signed Pyth Lazer update; the guide uses the `@pythnetwork/pyth-lazer-sdk` and requires a Pyth Pro access token.
2. The consuming transaction includes the Pyth State UTxO as a reference input.
3. The transaction performs a zero-withdrawal from the network-specific Pyth withdraw script, with the signed update bytes as redeemer.
4. A consuming validator reads the verified update from that same transaction using `pyth.get_updates`; the documented Cardano library is `pyth-network/pyth-lazer-cardano`.
5. The Pyth signature check proves update integrity, **not freshness**. The consumer must check `timestamp_us` against its own transaction validity interval and governed freshness rule. The guide explicitly notes that the zero-withdrawal and consuming validator must participate in the same transaction.

This makes Pyth a concrete **candidate ADA/USD authentication path** for Preprod. It does not prove that the repository's current Plutus V2 MintPolicy already consumes this Pyth Pro update, nor that its existing legacy Oracle State datum can be treated as equivalent. The documented Pyth Cardano example is Aiken-based; an exact Plutus V2 / current-settlement integration and native-ledger equivalence must be demonstrated rather than assumed.

### Boundaries that remain open

- **ADA/USD first leg:** official feed ID and official Preprod Pyth Pro policy ID are identified. The repo still needs an independently replayable Preprod transaction witness proving the exact policy/state UTxO, reference input, zero-withdrawal redeemer, verified feed ID, raw price/exponent/timestamps, publisher metadata and consumer freshness predicate all bind in one transaction.
- **USD/USDM second leg:** still OPEN / NOT QUALIFIED. The October Pyth catalogue result identified Mountain Protocol's inactive USDM/USD instrument and Moneta's USDM reserve-NAV feed, not a current exact Moneta USDM unit-price feed. No active, exact USD-per-Moneta-USDM feed is established by the current official ADA/USD integration documentation.
- **Unit conversion:** Option B remains selected. Do not insert `D = 1`, assume a peg, rename USD/ADA as USDM/ADA, or feed the ADA/USD result directly into `OracleQuote` / `Economic.totalUsdmValue`. The second ratio still needs exact issuer/asset identity, source qualification, precision/direction, freshness/skew, manipulation/liquidity limits, exact rational arithmetic and governed rounding.
- **Credential/access:** Pyth Pro fetching requires an access token. The official guide says Intersect has arranged access for Cardano projects and describes how to request a key; no project credential or permission is assumed in this record. No secret is requested, read or copied.
- **Integration compatibility:** the official Pyth guide's Aiken consumer example is not itself proof of compatibility with the repository's Haskell Plutus V2 MintPolicy. Any integration must preserve the existing Issue boundary and prove the Pyth update is consumed by the exact validator path that enforces the Treasury equality; an adjacent test validator or successful feed fetch is insufficient.

### Bounded next proof

The next safe experiment is a **read-only / isolated Preprod integration proof**, not an Issue or a production settlement change:

1. Confirm access to the official Pyth Pro Preprod policy `c7d51d...` and retrieve its exact Pyth State identity from the official documented discovery method.
2. Build a minimal test consumer that proves the same-transaction reference-input + zero-withdrawal + signed ADA/USD update path, with a freshness assertion anchored to the finite transaction validity upper bound. Keep the freshness value governed by the existing approved profile; do not import the illustrative value from the Pyth guide.
3. Capture and independently decode the submitted/simulated transaction and its redeemer/reference input on Preprod; preserve the raw signed payload and evidence digest. Do not call this a PRE-RICH settlement or Issue proof.
4. Separately continue the USD/USDM source search. The successful first leg must not be used to infer or synthesize the second leg.

**Disposition:** ADA/USD Pyth Pro — OFFICIAL PREPROD INTEGRATION PATH IDENTIFIED / PRE-RICH CONSUMER CONFORMANCE NOT YET PROVEN. USD/USDM Option B — OPEN / NOT QUALIFIED. Oracle State freshness and authorized publisher/update path — still BLOCKED. First Issue — BLOCKED.

No production code, Oracle datum/schema, `OracleQuote`, `Economic.totalUsdmValue`, MintPolicy, economic parameter, V3/Reveal semantics, deployment approval, wallet, signature, transaction, or ledger state was changed by this review.


## 34. Agent A — existing Pyth probe executed; access token lacks ADA/USD feed entitlement — 2026-11-03

The repository already contained the isolated Pyth Pro integration path. A review of the exact branch source and an automatic push-triggered probe establish the following:

### Existing integration artifacts — no duplicate consumer required

- `scripts/pythPreprodConfig.mts` already pins the official Cardano Preprod Pyth Pro `pyth_id` `c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45` and rejects any other policy ID. Its test verifies exact identity and rejects a same-length but incorrect ID.
- `poc/aiken-pyth-ada-usd/validators/pyth_signed_update_ledger_probe.ak` is an isolated Plutus V3 consumer requiring a Pyth update and freshness against a finite validity upper bound.
- `poc/aiken-pyth-ada-usd/validators/ada_usd_quote_carrier.ak` and its library implement a separate candidate carrier that binds the exact raw ADA/USD tuple from the same Pyth update to a unique continuing singleton.
- `plutus/PythQuoteCarrierBinding.hs` exposes a Haskell Plutus V2 view that checks the carrier input/output/singleton/address/value shape and extracts the raw quote tuple. It explicitly says it is not wired into production MintPolicy.
- `plutus/PythAdaUsdConversion.hs` is an exact-rational candidate helper; the USD-per-USDM ratio and exponent bound are caller inputs. It is not wired into `MintPolicy` or `Economic.totalUsdmValue`.

Direct comparison with current source confirms that `plutus/MintPolicy.hs` still imports `Economic` and calls `Economic.totalUsdmValue` inside `atomicTreasuryPaymentValid`. The production Treasury equality therefore still consumes the legacy Oracle State reference input. `PythQuoteCarrierBinding.hs` is not imported/called by `MintPolicy.hs`; presence in the Cabal module list and passing isolated tests do not close this source-to-economics binding. This is the concrete Gate B gap described in the design note above.

### Real Pyth access attempt — run #9

A push-triggered run of the existing [Pyth Signed Update — Preprod Ledger Probe #9](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41581346253) was made through the workflow's non-submitting path. On commit `861f5d1cb2ad8d5bff7e4fc0b5b21d04e7061ffb`:

- The pinned Aiken consumers compiled successfully.
- `PYTH_LAZER_TOKEN` was configured (the secret value was never printed or copied).
- Pyth returned HTTP 403: `Not entitled: feed 16 (no grant accepts this feed (asset type 'crypto', instrument type 'spot'))`.
- Artifact ID `13205682056`, ZIP digest `d209383a7aac0d8c6b675abd211eda6ba772a7ae6a6b98e3049022cff94d7cca`.
- Evidence status: `BLOCKED_PYTH_FEED_ENTITLEMENT`; `signedUpdateFetched=false`; `pythStateResolved=false`; `walletLoaded=false`; `transactionBuilt=false`; `transactionSigned=false`; `transactionSubmitted=false`; `ledgerGateA=NOT_PROVEN`.

Because the request was denied before the Pyth State lookup, this run does not establish a current live Preprod Pyth State UTxO or withdraw-script hash. It does establish that the configured token is not entitled to the requested ADA/USD feed. No production path or ledger state was affected.

### External access resolution

The current Pyth Pro FAQ says access tokens can be scoped by asset type, minimum channel and optional feed IDs, and that a 403/not-entitled response requires the token grant to be adjusted by the account manager. The Cardano onboarding offer published by Intersect says Cardano projects can request a one-year Pyth Pro API key and onboarding by contacting `genia@dourolabs.xyz` with the project name and a description of the build.

For this specific probe, the request must explicitly include:
- Cardano project: IMMORTAL / PRE-RICH;
- network: Cardano Preprod;
- feed: Pyth Pro `Crypto.ADA/USD`, feed ID `16`;
- asset type/instrument: `crypto / spot`;
- minimum channel required by the existing runner: `fixed_rate@200ms`;
- purpose: isolated, non-submit signed-update and Preprod verifier proof.

This is an entitlement request, not permission to alter protocol economics or submit a transaction. No request was sent by this pass. Sources: [Pyth Pro FAQ — access tokens and 403 entitlement](https://docs.pyth.network/pro/faq) · [Intersect — one-year Pyth Pro Cardano onboarding](https://intersectmbo.org/news/pyth-pro-on-cardano-subscription-offer).

### Updated disposition and next action

**Pyth ADA/USD:** integration code and official Preprod policy identity exist; the current API token is configured but lacks the feed 16 entitlement. No genuine signed update or live Pyth State was obtained. Gate A remains **NOT PROVEN**.

**Pyth → production settlement:** the quote-carrier candidate and Haskell extraction helper are not yet wired into `MintPolicy.atomicTreasuryPaymentValid`; Gate B remains **OPEN**. The USD/USDM second leg under Option B is still **NOT QUALIFIED**. Oracle State freshness and authorized publisher/update path remain blocked.

The next externally dependent step is to obtain the exact feed entitlement, then re-run the existing probe in its default non-submitting mode. Only after a signed update and Pyth State identity are observed should a separately reviewed native-ledger test be considered. Do not run the manual `submit_preprod=true` path, connect this probe to production MintPolicy, or treat ADA/USD as an USDM quote.

No change to production `MintPolicy`, `Economic.totalUsdmValue`, Oracle schema/datum, unit conversion, economic parameters, V3/Reveal, EEV approval, Issue authority, wallet, transaction or ledger state was made by this pass.


## 35. Agent A — DIA Cardano Oracle provider candidate reviewed; custom USDM/USD pair remains unqualified — 2026-11-06

A new provider architecture is now documented in the Option B source matrix: [DIA Cardano Oracle](https://github.com/diadata-org/dia-cardano-oracle). This is a concrete Cardano integration candidate, not a qualified USD/USDM reference.

### What is evidenced

- DIA documents an Aiken / Plutus V3 Cardano oracle, off-chain feeder, read-only indexer and consumer example. The consumer reads the live Pair UTxO as a reference input and authenticates it using the Pair NFT identity.
- The public close-out report records one published Mainnet pair for client-test-01, ARS/USDT, and 40 confirmed updates in its July 2026 reliability window. It records 16 live/queryable pairs on Cardano Preview. The public deployment evidence inspected does not establish a USDM/USD pair or a Cardano Preprod deployment; Preview is not Preprod.
- The indexer README describes a request/onboarding process to publish a feed from DIA's catalogue (2,500+ price feeds and 10,000+ RWA feeds). This makes a custom pair a plausible path to ask about, not an already deployed feed or a guaranteed service.
- The Cardano Pair datum contains pair_id, integer price, timestamp, nonce, intent hash and signer. The indexer describes price as DIA fixed-point encoding, but the inspected datum has no scale/exponent field and the reviewed docs do not define the exact multiplier/rounding rule. A versioned numeric encoding must be supplied before integration.
- DIA's security notes state that the on-chain protocol verifies an EIP-712 / secp256k1 intent against authorized DIA public keys but does not verify the underlying sources used by DIA's aggregation pipeline. Signature authenticity therefore proves authorized DIA publication, not independent correctness of the underlying market inputs. Admin and signer custody/rotation remain trust assumptions.
- The documented consumer is Aiken / Plutus V3. Compatibility with PRE-RICH's Plutus V2 settlement consumer and the same-transaction Treasury valuation path is not demonstrated.

The DIA Free API exposes an address-based lookup route and warns that symbol-based lookup can return the highest-volume asset with the same ticker. An exact live API observation for the Moneta Cardano USDM asset was not captured in this pass; no current DIA quote or volume is asserted.

Sources: [DIA indexer and feed-request process](https://github.com/diadata-org/dia-cardano-oracle/blob/e3344f6938b97e5bf0457551ac19a90ae4200531/offchain/indexer/README.md) · [DIA close-out / deployment evidence](https://github.com/diadata-org/dia-cardano-oracle/blob/e3344f6938b97e5bf0457551/docs/milestones/close-out-report.md) · [PairDatum / intent validation](https://github.com/diadata-org/dia-cardano-oracle/blob/e3344f6938b97e5bf0457551/contracts/aiken/lib/dia_cardano_oracle/oracle_logic.ak) · [DIA security notes](https://github.com/diadata-org/dia-cardano-oracle/blob/e3344f6938b97e5bf0457551/docs/security/security-notes.md) · [DIA API address-vs-symbol guidance](https://www.diadata.org/free-crypto-api/).

**Disposition:** DOCUMENTED CARDANO PROVIDER / CUSTOM FEED ONBOARDING POSSIBLE / EXISTING USDM-USD PAIR NOT ESTABLISHED / PREPROD DEPLOYMENT NOT ESTABLISHED / PRICE SCALE NOT SPECIFIED / NOT QUALIFIED.

A request to DIA, if authorized, must specify the exact issuer and asset unit, pair direction, network (including Preprod), price scale and precision, source methodology and venue coverage, liquidity/manipulation limits, freshness/update cadence, signer governance, Pair NFT policy/address and consumer artifacts. No request was sent.

## 36. Agent A — Mainnet USDM/ADA DEX market observed; not yet an admissible USD/USDM reference — 2026-11-06

A separate market leg is now evidenced on Cardano Mainnet. Cardanoscan's current-crawl Minswap V2 USDM/ADA pool page reports:
- Pool page identifier: `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171`.
- Reported reserves: about 363.7k USDM and 1.97m ADA; displayed rate 5.4029 ADA per USDM.
- Reported TVL about USD 727k, 24h volume about USD 87k, 201 trades / 62 unique wallets and 0.75% fee.
- Reported depth within ±1% is only about USD 4k. TVL is therefore not a substitute for executable depth or manipulation resistance.

The explorer labels the pair USDM/ADA, but this pass did not independently decode the pool UTxO, datum and full native-asset units against the canonical Moneta policy+asset name. Those checks are mandatory before the pool can be treated as the exact intended token pair. The exact Mainnet Moneta asset identity is separately documented by the issuer as policy c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad and asset name 0014df105553444d. The Preprod tUSDM used in the B1 Pool is a different test asset; no Mainnet pool observation can be assigned to that Preprod unit.

Sources: [Cardanoscan Minswap V2 USDM/ADA pool snapshot](https://cardanoscan.io/liquidityPool/f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171) · [Moneta canonical USDM identity](https://moneta.global/developers/) · [Minswap V2 pool contract source](https://github.com/minswap/minswap-dex-v2).

This market could contribute an observed USDM/ADA leg. It cannot independently produce USD/USDM: that would also require a separately qualified ADA/USD source, exact same-time observations and a governed composition rule. A spot reserve ratio is not a robust liability-bearing price; the displayed ±1% depth and the need for pool-UTxO replay make the current observation research evidence only.

A separate Cardano stablecoin tracker reads pools from its own db-sync node, but computes relative peg deviation against a stablecoin basket median and converts ADA using CoinGecko; it updates daily. Its own methodology says stable-swap reserve ratio is not price. This is useful cross-checking/market surveillance, not an independent USD/USDM authority. See [tracker and methodology](https://danonight.com/cardano/stablecoins).

**Disposition:** MAINNET USDM/ADA MARKET OBSERVED / RAW POOL UNIT+DATUM NOT YET REPLAYED / ADA-USD SECOND LEG NOT QUALIFIED / PREPROD TEST-ASSET MARKET NOT ESTABLISHED / NOT QUALIFIED.

Next bounded evidence is a raw Mainnet pool UTxO replay (exact Moneta asset unit, pool NFT, reserves/datum, DEX contract and pool type), cross-DEX and historical swap/TWAP analysis, quantified executable depth and manipulation cost, plus an independently qualified ADA/USD feed. A separate Preprod observation is required for any Preprod use. No protocol code, Oracle schema, MintPolicy, economic rule, V3/Reveal, wallet, approval or ledger state was changed by this research.


## 37. Agent A — Minswap V2 USDM/ADA pair cross-identified by independent indexers; no raw UTxO replay yet — 2026-11-06

The Mainnet USDM/ADA market candidate has stronger pair-identity evidence than the earlier pool-page-only note:

- Cardanoscan and DEX Screener return the same Minswap V2 pool identifier:
  `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171`.
- Cardanoscan identifies its LP asset as policy `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c`, asset name `7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171`, fingerprint `asset1kqcnr902hecg8zsxlk9knclr5yqvgazvchgh2c`. This is the pool's LP asset, not proof of the pool validator UTxO/datum itself.
- DEX Screener reports the USDM token identity with prefix `c48cb…444d`, consistent with the issuer's canonical Mainnet Moneta asset policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad` and asset name `0014df105553444d`. It therefore provides independent indexed metadata cross-identification of the asset pair. It is not yet a raw chain replay of the pool UTxO's native asset units.
- Latest-crawl Cardanoscan snapshot: approx. 363.7k USDM and 1.97m ADA reserves, pool rate 5.4029 ADA/USDM, TVL ~$727k, 24h volume ~$87k, 201 trades / 62 unique wallets, and depth ±1% ~$4k.
- Latest-crawl DEX Screener snapshot of the same pool: approx. 362.5k USDM and 1.971m ADA, liquidity ~$716k, quoted USDM price ~$0.9838 and pool rate 5.3970 ADA/USDM. This differs from Cardanoscan's reserve valuation label of ~$1.00 per USDM by about 1.62%. The snapshots, price-source conventions and indexing windows differ; this discrepancy is NOT by itself proof of a USDM depeg. It does show that a displayed $1 stablecoin mark is not an independent USD quote.
- Current search results identify real pool activity, but Cardanoscan and DEX Screener do not provide sufficient direct evidence to certify the exact on-chain datum, output reference, reserve accounting or pricing curve in this pass.

Sources: [Cardanoscan USDM/ADA pool snapshot](https://cardanoscan.io/liquidityPool/f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171) · [Cardanoscan LP asset identity](https://cardanoscan.io/token/asset1kqcnr902hecg8zsxlk9knclr5yqvgazvchgh2c) · [DEX Screener same pool + USDM asset prefix](https://dexscreener.com/cardano/f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171) · [Moneta canonical USDM identity](https://moneta.global/developers/).

**Disposition updated:** MAINNET USDM/ADA PAIR AND MONETA TOKEN IDENTITY CROSS-IDENTIFIED BY INDEXERS / RAW POOL UTxO+DATUM AND RESERVE VALIDATION STILL OPEN / USD MARKING DISAGREEMENT REQUIRES SOURCE RECONCILIATION / ±1% DEPTH LOW / ADA-USD SECOND LEG NOT QUALIFIED / NOT QUALIFIED.

Next bounded work is to query the Minswap V2 pool address using an independent mainnet chain provider, locate the exact live UTxO by LP/pool asset identity, decode the datum and reserve units, replay the output reference and compare to both indexers; then inspect historical swaps/TWAP and executable depth. Even after this, USD/USDM requires an independently qualified ADA/USD leg with a governed same-snapshot composition rule. No source-set, Oracle, economics, MintPolicy, V3/Reveal, approval, wallet or ledger state was changed.


## 38. Agent A — Charli3 Mainnet ADA/USD and Preprod ADA/USD + USDM/USD re-observed; all three stale — 2026-11-06

The existing read-only Charli3 workflow was extended to execute both the Mainnet ADA/USD observer and the Preprod ADA/USD + USDM/USD observer in one exact-commit run. The workflow [#42195466659](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42195466659) completed successfully on source SHA `5ba800fd59f3952f53c23bea372d978c0e7eea79`; decoder tests, both observers and artifact upload passed.

Artifact [13492175704](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42195466659/artifacts/13492175704), ZIP SHA-256 `fab759cb5e563b73dd37fe5dcf9143b0289da749c04b427e365f0bfa268c1806`.

### Observed feed identities and state

- **Mainnet ADA/USD:** exact configured address and OracleFeed NFT are present, unique, and the datum decodes. Latest statement timestamp `2026-05-27T05:21:30.404Z`, raw price `239761`, expiry six hours later, precision absent. At observation on 2026-11-06 the feed was expired/stale; `freshCount=0`, `staleOrExpiredCount=1`, no invalid datums.
- **Preprod USDM/USD:** exact Feed NFT unit `424f268a65632944ddfe17967208178082058cbe9044f53aee28697d4f7261636c6546656564` is unique at the configured address. Datum hash `931fccc82a5a51752142a33fe3a672f3cc5bb8b1449c048a79eaf01f7a7d5b69`; timestamp `2024-02-21T03:00:27.386Z`; expiry `2024-02-21T04:00:27.386Z`. Precision and pair symbols are not published in the datum; exact decimal price is unavailable. Blockers: stale timestamp, expired record, missing/unsupported precision.
- **Preprod ADA/USD:** exact Feed NFT unit `1116903479e7320b8e4592207aaebf627898267fcd80e2d9646cbf074f7261636c6546656564` is unique at its configured address. Datum hash `72ecfa0ff305b976cb769bf23ba782d18b1c6a89e4b15e092aeb047406280dae`; timestamp `2025-12-14T10:17:39.510Z`; expiry `2025-12-14T10:47:39.510Z`. Precision and pair symbols are absent; record is stale/expired.

The documented Charli3 network configurations identify the feed NFTs and publisher/node parameters; they do not establish current operation or make an expired datum usable. The Mainnet ADA/USD and Preprod ADA/USD/USDM/USD candidates are therefore **DOCUMENTED / EXACT NFT OBSERVED / CURRENT DATUM STALE OR EXPIRED / PRICE PRECISION UNQUALIFIED**. No USDM price, parity or source quorum is accepted.

Sources: [Charli3 Mainnet configuration](https://docs.charli3.io/oracles/resources/networks/mainnet) · [Charli3 Preprod configuration](https://docs.charli3.io/oracles/resources/networks/preprod) · [Charli3 datum standard](https://docs.charli3.io/oracles/overview/datum-standard).

## 39. Agent A — Orcfax Mainnet ADA-USD and ADA-USDM statements observed on-chain; both stale — 2026-11-06

Added a dedicated read-only workflow [Orcfax Mainnet CER Feeds — Read-Only Ledger Observation](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42195769567) using the existing exact-FSP/FS-token observer. Source SHA: `f70e758d8f4689ee31251f9d13a2c7d58cbc34be`. Syntax and decoder tests passed; the live observation and artifact upload completed.

Artifact [13492225756](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42195769567/artifacts/13492225756), ZIP SHA-256 `95ce9ef8bfa14caa9f0ae728b526131d36d8fab86956fddb991340cac840430e`, extracted JSON SHA-256 `635f370bafd3d214282a2b2599d7765f57ec5ea4b6ea957eae6f98732ad1e287`.

### On-chain publication identity / acquisition

- The unique mainnet FSP state NFT was found and decoded: policy `8793893b5dda6a513ba63c80e9d7b2d4f108060c11979bfc7d863ff0`, asset name `000de140`.
- FSP datum resolves the current FS payment script hash `193ee65211bb3b4e0ea5f751f415269355a650e2e3706f625cdf1a4b`.
- Koios returned 111 FS-token UTxOs; all 111 datums decoded, 0 malformed. The observer found 5 statements for each of the requested feed prefixes, and 5/5 in each feed passed the recorded FS payment-credential / token-quantity checks. Ten transaction contexts were acquired (five current/older statements per feed).
- The feed registry response was HTTP 200. Current configuration:
  - ADA-USD: `CER/ADA-USD/3`, CEX source, median calculation, one-hour heartbeat, 1% deviation, sponsored.
  - ADA-USDM: `CER/ADA-USDM/3`, DEX source, weighted-mean calculation, one-hour heartbeat, 2% deviation, sponsored.

### Latest valid statements

- **ADA-USD:** exact rational `163333 / 1000000` = 0.163333 USD per ADA; statement `2026-06-18T21:02:22.882Z`; age at capture `12,141,004,118 ms` (~140.52 days), against a 3,600,000 ms heartbeat. UTxO `a16b451afbb11198a0f179d79c5dc6ebe863e2c348783e088a3d8c0f5952b91f#0`.
- **ADA-USDM:** exact rational `325734549 / 2000000000` = 0.1628672745 USDM per ADA; statement `2026-06-18T21:20:32.150Z`; age `12,139,914,850 ms` (~140.51 days), against the same one-hour heartbeat. UTxO `ca83fdb2fffbcee1841a2adfeabf612e640162d07451457deb727a2800932e5e#2`.

Both statements are structurally valid, published under the expected versioned feed IDs and tied to current FS-token UTxOs. Both are nevertheless **STALE** by their own declared heartbeat. The observer classification is `READ_ONLY_ORCFAX_CER_FEEDS_STALE`.

### Direction and independence boundary

Orcfax CER feed naming is base currency followed by quote currency. Therefore ADA-USD denotes USD per ADA, while ADA-USDM denotes USDM per ADA. A mathematical composition would require dividing these exact ratios and then inverting to obtain USD per USDM. This review deliberately does **not** publish a cross-rate from two statements that are more than 140 days old. It does not use the feed label alone to claim asset redemption or an issuer peg.

The registry describes ADA-USD as CEX median and ADA-USDM as DEX weighted mean. This is a useful Cardano-native statement publication path, but not an independent DEX venue: it republishes upstream CEX/DEX observations. The statements' immutability and FS-token identity establish the publication surface; they do not by themselves verify the upstream venue universe, weights, manipulation resistance, archive completeness or truth of the inputs. No feed is active/fresh for settlement in this snapshot; no oracle/EEV approval or consumer integration is authorized.

Sources: [Orcfax CER feed overview and base/quote convention](https://docs.orcfax.io/feed-overview) · [Orcfax on-chain consumption and feed-id verification](https://docs.orcfax.io/consume) · [Orcfax ADA-USDM explorer record and stated direction](https://explorer.orcfax.io/feeds/CER/ADA-USDM/facts/5cbbb7ee-a232-4f36-844a-5c00ceaeb645) · [Mainnet feed registry](https://github.com/orcfax/cer-feeds/blob/main/feeds/mainnet/cer-feeds.json).

**Disposition:** ORCFAX MAINNET ADA-USD + ADA-USDM = ON-CHAIN IDENTITY OBSERVED / 5 VALID STATEMENTS PER FEED / BOTH STALE VS 1H HEARTBEAT / NO CROSS-RATE ACCEPTED / NOT QUALIFIED.

## 40. Agent A — correction: Minswap V2 raw Mainnet UTxO and datum structural reconciliation already exists

Correction to Sections 36–37: the earlier wording that the Minswap pool raw UTxO/datum had not yet been replayed described the particular Cardanoscan/DEX Screener page snapshot, not the repository's broader Minswap V2 Mainnet work. The branch already contains the dedicated read-only exact-asset observer and reproducible evidence:

- Run [41204050705](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204050705): 31 exact-Moneta-USDM current UTxOs at the official Minswap V2 pool address; all 31 passed the structural PoolDatum / Pool NFT / LP asset / reserve-vs-Value checks; decoder tests 12/12.
- Repeat [41204297344](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204297344): 31/31 MATCH after qualification-label correction.
- Same-run API ↔ Koios reconciliation [41204657669](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41204657669): 31/31 exact LP-asset identity and unordered pair matches between 31 Koios candidates and 31 Minswap V2 API pools; zero pair mismatches, zero API-only, zero on-chain-only.

This is strong **same-venue pool identity / structure / indexer reconciliation** for the observed Minswap V2 pool set. It is not a separate market venue, USD/USDM price, executable depth qualification, oracle statement, peg proof, EEV approval or settlement source. Minswap API and Koios both describe the same Minswap venue / Cardano state.

The Cardanoscan / DEX Screener pool-page snapshots in Section 37 remain indicative market-data displays only. Their $1 vs ~$0.9838 valuation labels must not be promoted to independent USD marks or read as proof of depeg. The missing gates remain historical trades/TWAP and executable depth/manipulation analysis, plus a fresh and independently qualified USD reference.

No production oracle, PriceReference, MintPolicy, economics, V3/Reveal, wallet, deployment approval, transaction or ledger state was modified by these observations.


## 41. Agent A — direct-USDM EV1–EV7 qualification repeated on memo HEAD; blockers unchanged — 2026-11-06

After the new source-observation sections were committed, [PRE-RICH Preprod EEV — Source Qualification Only #42196127786](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196127786) completed successfully on the exact memo HEAD `9bc4878297664632cf24efe6bcb383947c1d1237`.

- Profile status: `qualified`; qualified properties EV1–EV7.
- Exact B1 Pool physical source remains 1,000,000,000 atomic tUSDM → 100,000 USDM subunits.
- New qualification evidence hash: `18c7da77af578ca5376706b42e22b15eb483de3b95430209a0d80f3f1f6e7f63`.
- Deployment approval: `NOT_CREATED`.
- Oracle State remains `STALE`; observed datum age `2476562858` ms, well beyond 3,600,000 ms.
- ProtectedCapital census remains `INTERNAL_RECONCILIATION_ONLY`; PrizeValidator UTxO count 0, source completeness authority false, provider attestation false.

This is the third successful EV1–EV7 exact-head requalification across successive documentation/research commits, confirming reproducibility of the direct physical-source profile. It does not qualify the USD/USDM market reference, does not establish PA1–PA7 or full ProtectedCapital completeness, and does not close R1/Kc/QNE/Ω or authorize the first Issue.

On the same SHA, five general conformance workflows passed: Security Credential Boundary, Portability, Governance Adversarial Lab, Protocol Declaration and Cardano Adapter Sale. Documentation Link Check remains the single failure because of the already-known broken relative link in the Agent C B3 archive mission document; Agent A has not edited that file. No wallet, signature, transaction, deployment, approval or ledger mutation occurred.


## 42. Agent A — same-run Mainnet Minswap V2 / SuperCardano / ADA-USD market snapshot; indicative cross-rate only — 2026-11-06

The new read-only workflow [Agent A — USDM / ADA and ADA / USD Live Market Snapshot #42196843453](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196843453) completed successfully on exact source SHA `d3c58b89cdb047afceb27264508b8809899a75ad`. Its single artifact contains the raw Koios Minswap V2 UTxO/datum census, Minswap API pools, SuperCardano exact-USDM indexer/trade data, ADA/USD public references and the reconciliation result.

Artifact [13491269808](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196843453/artifacts/13491269808), ZIP SHA-256 `84c11e8678ae4253f888e062053e316a4db689f94b9cb8ff560136fa9da2f67c`.

### Exact Mainnet Minswap V2 pool — raw UTxO and datum

- Network: Cardano Mainnet; exact Moneta USDM asset policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`, asset name `0014df105553444d`, 6 decimals.
- UTxO: `4c309cdae12fd7c020d3bb6e22335dce9d97d9766b76b51da4f00cba1e476618#2`.
- Pool address: `addr1z84q0denmyep98ph3tmzwsmw0j7zau9ljmsqx6a4rvaau66j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq777e2a`.
- Datum hash: `14a0aa6b985a70faf518c68810a7368a2b2a42d0416ca177b76ee105c935c94d`.
- PoolDatum structural validation: `MATCH`; exact pool authentication NFT quantity 1; expected V2 payment credential and batching stake credential match; no decoder/identity/reserve-boundary reasons.
- Datum reserves used by the V2 pricing curve: ADA `1,969,235.300584` and USDM `363,045.499637` (both assets have 6 decimal places). Raw Value contains additional surplus above the datum reserves; the surplus is not included in the spot-price calculation.
- Fee fields: base fee numerator 75 / fee basis 10,000 (0.75%); dynamic fee disabled. No fee is subtracted from the indicative ratio below.
- The pool output's transaction context is block height 14,165,077, absolute slot 202,390,623, block time `2026-11-06T09:21:54Z`. Koios asset/UTxO collection was captured 09:42:03–09:43:19Z.

### Same-run cross-indexer reconciliation

- Koios: 31 exact-Moneta-USDM UTxO candidates at the official V2 validator address; 31/31 validated structurally.
- Minswap API: 43 pools across queried protocols, 31 Minswap V2 pools.
- Minswap API ↔ Koios: **31/31** exact LP identity and pair matches; zero API-only, zero on-chain-only, zero pair mismatches, zero unqualified on-chain candidates.
- SuperCardano: 81 exact-Moneta-USDM pool records across 9 venue labels; 31 Minswap V2 records. On the same pool set, exact pool identity + pair + reserve agreement is **31/31**, with zero pair mismatch and zero reserve mismatch.
- SuperCardano source watermark: block 14,165,112 / `2026-11-06T09:36:55Z`. The target pool's source transaction time was 09:21:54Z, 901 seconds before that watermark.

This is strong same-pool identity and datum/reserve reconciliation across the chain observer and two indexing/API views. These are not 31 independent DEX venues or 31 independent price observations.

### Current ADA/USD direct CEX references from the same workflow

The public collector returned 9/11 references: 5/7 CEX spot endpoints, 3/3 aggregators and 1/1 DIA Free test-only API. Gemini returned HTTP 404 and Bitfinex HTTP 500; both remain unavailable rather than being omitted.

Four direct CEX venues returned bid and ask, so their observed midpoint range is **0.184445–0.184520 USD per ADA**:
- Coinbase: 0.184450 (bid 0.184440 / ask 0.184460), source time 09:43:17.949Z.
- Kraken: 0.1844855 (bid 0.184451 / ask 0.184520); provider timestamp not supplied, capture 09:43:20.973Z.
- Bitstamp: 0.184445 (bid 0.184410 / ask 0.184480), provider epoch converted to 09:43:21Z.
- Crypto.com Exchange: 0.184520 (bid 0.184510 / ask 0.184530), source time 09:43:20.746Z.
- BTSE returned last price 0.184700 but no bid/ask, so it is not included in the midpoint range.

Aggregator references are kept separate: CoinPaprika 0.18460336 (provider time 09:40:14Z), CoinLore 0.184871 (no provider time), CoinGecko 0.184569 (provider time 09:42:15Z). DIA Free API returned 0.18456631 at 09:41:59Z, but it is explicitly test/evaluation only; the returned signature string was not cryptographically verified. None of these aggregate/test references is counted as another CEX venue.

### Indicative cross-rate arithmetic — not a qualified price

The exact Minswap V2 datum reserve ratio is:
- ADA per USDM = `1,969,235.300584 / 363,045.499637` = approximately **5.424210746457368**.
- USDM per ADA is the inverse, approximately 0.18435861856088734.

Combining that reserve ratio with each same-run direct CEX ADA/USD midpoint gives the following **pre-fee, zero-size indicative USD per USDM** values:

| CEX midpoint source | ADA/USD midpoint | Indicative USD/USDM |
| --- | ---: | ---: |
| Bitstamp | 0.184445 | 1.00046855 |
| Coinbase | 0.184450 | 1.00049567 |
| Kraken | 0.1844855 | 1.00068823 |
| Crypto.com | 0.184520 | 1.00087537 |

The resulting indicative range is **1.00046855–1.00087537 USD per USDM**. This is an arithmetic cross-reference, not a price oracle, executable quote, peg finding, reserve/redemption valuation or EEV input.

**Material limitations:**
1. The Minswap pool reserve ratio is a pre-fee marginal spot from a single ADA/USDM pool. The on-chain base fee is 0.75%; fees, curve impact, order size, route selection and execution slippage are not included. No ±1% depth or manipulation-cost bound was qualified by this workflow.
2. Pool transaction time is 09:21:54Z; CEX quotes are captured around 09:43:18–09:43:21Z. The approximately 21-minute time gap means the ratio is not a same-instant atomic market snapshot. The SuperCardano indexer watermark is 09:36:55Z and independently shows the pool datum reserves at that time, but not an atomic link to the later CEX midpoint.
3. CEX quotes are public spot references, not a Cardano ledger-bound authenticated ADA/USD oracle. Aggregator and DIA test-only observations are correlated classes and are deliberately not folded into the four-venue midpoint range.
4. The same-pool Minswap API and SuperCardano views corroborate one pool's identity and reserves; they are not independent trading venues. SuperCardano's broader token-level aggregate ADA price is not used in the calculation.
5. The formula does not imply USDM parity with USD. It does not establish source governance, manipulation resistance, finality/snapshot atomicity, authorized consumer binding, or a transaction-bound quote witness.

Artifact JSON SHA-256:
- raw Minswap V2 UTxOs: `94de4332f544765a31de4a741f5c283dfce53d7a2999260c5db64a21dab41433`
- Minswap API: `3e8b09a291d13c0ce4f9056d8670f2e77cb7e77f176a4da16527ade6ec2d0519`
- SuperCardano: `a05b2844db5ecdcd95d6f8eb1ac42fa41ec78d74f78793065e7668b9698287be`
- ADA/USD references: `35d9e3fcd618492d31825793ee589a5c4b8197aa64c13a456d3c39eee839a368`
- same-run reconciliation: `5c9e0e50e23456da410a04e88624bff931a8d9cab7e39380d34511f080e20384`

**Disposition:** CURRENT MAINNET ADA/USDM MARKET OBSERVED AND CROSS-INDEXER RECONCILED / INDICATIVE USD/USDM RANGE COMPUTED FROM FOUR CEX MIDPOINTS / PRE-FEE AND TIME-SKEWED / NOT QUALIFIED FOR SETTLEMENT OR EEV. The USD/USDM Option B qualification remains OPEN; no USD peg, oracle quorum, PA1–PA7, deployment approval or first-Issue authority is inferred. No wallet, signature, oracle refresh, transaction, deployment, or ledger mutation occurred.


## 43. Agent A — second on-chain ADA/USDM venue found; SundaeSwap V3 pool is structurally valid but older — 2026-11-06

The broader multi-source run [#42196712888](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196712888) captured further venue-specific evidence. The run's Minswap raw observer failed because Koios returned HTTP 504 on `/asset_utxos`; therefore its API-to-on-chain reconciliation and derived cross-reference steps were skipped. This failed attempt is not used in place of the successful exact Minswap raw observation in [run #42196843453](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196843453).

### SundaeSwap V3 — exact ADA/USDM pool structurally reconciled

The successful read-only observer [artifact #13493135435](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196712888/artifacts/13493135435), ZIP SHA-256 `9eec02d729acc89aa3b6f4928f075a018b09f66039cd56f7aef14b2b5ee57f86`, reports:
- 5 exact-USDM candidate pool UTxOs; all 5 payment credentials match; all 5 datums decode and structurally match; 0 unqualified; all 5 match same-run official SundaeSwap API; 0 API mismatches.
- Exact ADA/USDM candidate UTxO: `870d7a6fb2d6d38a821485a240beb6b5da60e0bec1e2dfb79a43e15e6138b2b0#0`.
- Datum pool identifier: `64f35d26b237ad58e099041bc14c687ea7fdc58969d7d5b66e2540ef`; exact ADA + Moneta USDM pair; Pool NFT quantity 1.
- Datum reserves: ADA `75,548.054946`; USDM `13,964.244136`; bid and ask fee numerators 60 / 10,000 (0.60%).
- Last pool transaction block height 14,163,727, timestamp `2026-11-06T02:02:07Z`.

Its pre-fee reserve ratio is approximately **5.4101069997 ADA per USDM**. The Minswap V2 pool observed in #42196843453 has **5.4242107465 ADA per USDM** at its last transaction time 09:21:54Z. The Sundae transaction is about 7 hours 20 minutes older than the Minswap pool transaction. Their 0.26% ratio difference is therefore **not** a simultaneous arbitrage spread or a current venue consensus; it is only a second on-chain venue observation whose last update is materially older.

### MuesliSwap and CSwap candidate disposition

- MuesliSwap read-only artifact [#13492262278](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196712888/artifacts/13492262278), ZIP SHA-256 `750cc6a705de30a7357b3ce73dd5e04c7bddd2c1fdb63c880d3dd7cfa1ea261a`: 3 exact-USDM Pool NFT candidates; 2 official payment-credential matches and structural matches; 1 unqualified. The ADA/USDM candidate `04f0130e2e907a48d1f8752e7a5e90ebeda91183808ab0ed3a7d50a53ed625c1#3` has an older block time `2026-10-30T00:22:51Z` and the observer reports LP-asset quantity 0. It is not used as a live price/depth input.
- CSwap artifact [#13492591337](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196712888/artifacts/13492591337), ZIP SHA-256 `2c55327669f65ffcc0d30dfd73673d21244682213441407e812415fd5b7bf2a3`: one exact-USDM candidate at the official payment credential and a datum-decoding discovery result. The observer explicitly classifies it as pool discovery, not full contract qualification; no price or executable depth is inferred.

**Updated market-source view:** a second structurally valid ADA/USDM DEX pool is present on-chain (Sundae V3), but its latest pool update is several hours older than Minswap. Muesli candidate is old with no LP unit in the observed Value, and CSwap remains discovery-only. The only contemporaneous indicative cross-rate retained in Section 42 remains the Minswap V2 datum reserve ratio combined with four same-run CEX midpoints; it is pre-fee, time-skewed and not qualified. No price averaging, same-time multi-venue consensus, peg, source quorum, or settlement/EEV qualification is claimed.


## 44. Agent A — exact-head EEV EV1–EV7 repeated on 6 Nov 2026; approval and full solvency gates remain open

After the Agent A market matrix commit, the workflow [PRE-RICH Preprod EEV — Source Qualification Only #42197942891](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42197942891) completed successfully on the exact preceding HEAD `61ac5825c8cc6c594d260b78628bf3c20ea16637`.

- Profile: `PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1`, status `qualified`.
- EV1–EV7: all passed.
- Direct tUSDM source: 1,000,000,000 atomic units → 100,000 USDM subunits.
- Qualification evidence hash: `6618d9c82a8dc8ac2fec276cf236de038fb4c0955101309972502d346da432b5`.
- Deployment approval: `NOT_CREATED`.
- Oracle State datum age: `2477440858` ms against the configured `3600000` ms max age — `STALE`.
- ProtectedCapital census: `INTERNAL_RECONCILIATION_ONLY`; PrizeValidator UTxO count 0; source completeness authority and provider attestation false.

This is another exact-head repeat of the direct physical-source profile. It does not qualify the external USD/USDM reference, establish PA1–PA7, full ProtectedCapital completeness, R1/Kc/QNE/Ω, or authorize first Issue. The current branch subsequently advanced by documentation-only commit `3143969d...`; this EEV PASS is explicitly bound to SHA `61ac5825...`, not claimed as a new exact-head PASS on `3143969d...`.

The same SHA's general conformance workflows passed for Declaration, Governance, Cardano Adapter Sale, Portability and Security Credential Boundary. Documentation Link Check remains a failure for the previously identified Agent C relative link to `docs/research/MATERIOS-B3-B-CHAIN-IDENTITY-AND-RPC-BOUNDARY-2026-11-04.md`; Agent A did not modify the Agent C file. No approval, transaction, signature, deployment, wallet action or ledger write occurred.


## 38. Agent A — Minswap V2 Mainnet USDM/ADA pool raw UTxO + datum replay PASS — 2026-11-06

The read-only observer [run #42207819141](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42207819141) completed **SUCCESS** on exact source SHA `10a49b61a156265555b6dbfb3573521e4bba7576`. It queried the exact LP asset UTxOs through Koios, selected the unique output at the Minswap V2 pool script credential carrying the singleton `MSP` Pool Validity token and the target LP unit, refreshed that exact out-reference with `utxo_info`, retrieved the datum CBOR, decoded it, and reconciled the output with the official Minswap V2 source invariants.

### Exact live identity and snapshot

- Network: Cardano Mainnet.
- Snapshot tip before and after all queries unchanged: block 14,165,353; absolute slot 202,396,914; hash `a52f89f8e37507f718350e889000786081fcccab0ee4f5d7acba236743ae7ad2`.
- Pool output: `1024f243033412f3969d8b6d07d19ecb9bdd51e9c26c2f45d2cd43ce7f483113#1`, at block 14,165,256.
- Pool address: `addr1z84q0denmyep98ph3tmzwsmw0j7zau9ljmsqx6a4rvaau66j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq777e2a`.
- Payment credential / script hash: `ea07b733d932129c378af627436e7cbc2ef0bf96e0036bb51b3bde6b`.
- Pool auth token: exact Minswap V2 policy `f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c`, name `4d5350` (`MSP`), quantity 1.
- Exact datum assets: ADA (empty policy/name) and Moneta USDM (policy `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`, asset name `0014df105553444d`). This is the Mainnet issuer asset, not the distinct Preprod tUSDM.

### Datum / Value reconciliation

The datum is 132 bytes (264 hex characters). Its BLAKE2b-256 hash matches the output's datum hash exactly: `07898890d719b73759a394beac5a277040ec48ba37d52aea5552243b7969c19f`.

Decoded PoolDatum:
- `totalLiquidity`: `642143897673`.
- Datum curve reserve A (ADA): `1964964463827` lovelace = 1,964,964.463827 ADA.
- Datum curve reserve B (USDM): `363838353372` atomic units = 363,838.353372 USDM.
- Base fee numerators A/B: 75 / 75.
- Fee-sharing numerator: `Some(3666)`.
- Dynamic fee: false.

Physical output Value:
- Total lovelace: `1965012653333`; after the official 4,500,000 lovelace minimum pool ADA, physical ADA reserve = 1,965,008.153333 ADA.
- Physical USDM reserve: 363,847.270586 USDM.
- Value-minus-Datum surplus: **43.689506 ADA** and **8.917214 USDM**.
- Locked LP asset quantity: `9223371394710878144`; it matches the official Minswap V2 formula `MAX_INT64 - (totalLiquidity - 10)`.
- LP name recomputed from the exact datum asset pair using the official SHA3-256 derivation: `7dd6988c5a86693c76aeec1ea94afa41770be0de21a775ca7a2a1eabdb6a0171`, exactly matching the canonical target LP unit.

Important semantic correction: Minswap V2 deliberately maintains two reserve views. The datum reserves are used by the swap curve; the physical output Value can exceed them by earned fee/profit-sharing amounts. The official `pool_validation.ak` passes both separately into `BatchingPool`; `validate_withdraw_fee_sharing` explicitly defines earned profit-sharing as `Reserve in Value - Reserve in Datum` and computes the exact withdrawal delta as `Datum - Value`. The prior observer version incorrectly required datum reserves to equal physical Value reserves. That equality check was removed and replaced with a bounded invariant that datum reserves do not exceed physical Value reserves. The observed positive deltas are now recorded separately rather than hidden or called an error.

### Spot reserve ratios — explicitly not an oracle quote

- Swap-curve ratio from PoolDatum: **5.400652365579 ADA per USDM** (inverse 0.185162815954 USDM per ADA).
- Physical Value ratio including Value-minus-Datum surplus: 5.400640082219 ADA per USDM (inverse 0.185163237093).
- These ratios are a current pool reserve snapshot, not executable depth, TWAP, a market-wide price, or a USD/USDM quote.

### Integrity and qualification boundary

- Observer status: `RAW_POOL_UTXO_AND_DATUM_MATCHED`; provider used: Koios.
- The Koios tip did not change during observation.
- All exact checks passed: exact datum assets, recomputed LP-name derivation, Pool Auth singleton, pool-held LP formula, minimum ADA, physical ADA/USDM asset quantities, non-negative Value-minus-Datum reserve deltas, and exact native-asset set.
- Artifact [13496094744](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42207819141/artifacts/13496094744), ZIP SHA-256 `bddb9fe0eeeac4ec4b3251dfd31ac9ac88c5eb50368f57a0d876448ba26d8815`.
- Evidence JSON digest: `3ac3f3f503b680d066cb6a3a7b690461d44784c57c08428f0a886716bbb6c758`; independently recomputed from the downloaded artifact and matched.
- This remains a single-indexer (Koios) observation; provider attestation and independent-node consensus proof are false. It is not an independent ledger consensus certificate.

**Disposition:** EXACT MAINNET MONETA USDM/ADA POOL UTxO + DATUM + VALUE RECONCILED / CURRENT SWAP-CURVE RESERVE RATIO OBSERVED / USD/USDM NOT QUALIFIED.

This closes the raw pool identity/replay subtask only. It does not provide the missing independently qualified ADA/USD leg, TWAP/history, executable depth or a manipulation-resistance bound. The pool cannot yet be consumed as a liability-bearing USD/USDM price; no 1:1 peg is assumed. The result is for the Mainnet Moneta USDM asset only and does not qualify the Preprod tUSDM source used by B1. No wallet, signing, transaction construction/submission, protocol economics, MintPolicy, Oracle schema, V3/Reveal, approval, or ledger write was performed.

Sources: [Minswap V2 PoolDatum / validation source](https://github.com/minswap/minswap-dex-v2/blob/main/lib/amm_dex_v2/pool_validation.ak) · [Minswap V2 swap accounting source](https://github.com/minswap/minswap-dex-v2/blob/main/lib/amm_dex_v2/order_validation.ak) · [Minswap V2 PoolDatum types](https://github.com/minswap/minswap-dex-v2/blob/main/lib/amm_dex_v2/types.ak) · [Moneta Mainnet token identity](https://moneta.global/developers/).


## 45. Agent A — Minswap V2 theoretical ±1% marginal-price depth computed from exact PoolDatum and official swap formula — 2026-11-06

Using the exact Mainnet PoolDatum snapshot already reconciled in §42 (ADA reserve x0=1,969,235.300584, USDM reserve y0=363,045.499637, base fee fn/fd=75/10,000=0.75%), a read-only arithmetic check estimates the one-sided trade size required to move the pool's marginal reserve price by 1% in either direction.

This uses the official Minswap V2 constant-product swap rule: k=x0*y0=(x0+(1-f)*grossInput)*(y0-output), with the fee deducted from the input before applying the invariant. The integer implementation is documented in lib/amm_dex_v2/math.ak::calculate_amount_out; the protocol specification is amm-v2-docs/formula.md.

### Results — theoretical curve only

| Direction | Gross input | Output | Marginal price movement |
|---|---:|---:|---|
| ADA → USDM | **9,895.902645 ADA** | **1,801.725760 USDM** | ADA per USDM rises 1% |
| USDM → ADA | **1,842.776985 USDM** | **9,870.915796 ADA** | ADA per USDM falls 1% |

For the ADA-input side only, applying the four CEX ADA/USD midpoint range from §42 gives an indicative input notional of approximately **$1,825.25–$1,825.99**. The reverse side remains expressed as USDM units; it is deliberately not converted into USD because that would assume the very USDM/USD relationship Option B is intended to qualify. The two sides are not summed into a USD depth figure.

### Interpretation and limitations

- This is a formula-derived one-sided amount to move the **marginal spot ratio** by 1%, not the amount that can execute with an average fill within ±1%, and not a bid/ask book depth.
- The fee is included using the exact 0.75% PoolDatum base fee. The model does not include batcher fee, order minimums, batching delay, competing orders, dynamic fee if future governance changes it, or route alternatives.
- The result is conditional on the §42 PoolDatum snapshot at block 14,165,077 / 2026-11-06T09:21:54Z; it is not a current quote at a later time.
- Cardanoscan's displayed depth ±1% (~$4k in its page snapshot) is of a similar order to a two-sided valuation of these one-sided curve amounts under a near-parity assumption, but that comparison is not an independent validation and must not be used to assume USDM = USD.
- No historical TWAP, manipulation-cost bound over an attack horizon, external venue execution, or independent USD/USDM quote is established.

**Disposition:** EXACT POOLDATUM + OFFICIAL SWAP FORMULA SUPPORT A REPRODUCIBLE THEORETICAL 1%-MARGINAL-MOVE SIZE / EXECUTABLE ±1% DEPTH AND MANIPULATION RESISTANCE NOT QUALIFIED / USD/USDM NOT QUALIFIED.

Source references: [Minswap V2 formula specification](https://github.com/minswap/minswap-dex-v2/blob/c3293ad435792ba502f5a2b1691c6736e5f167e6/amm-v2-docs/formula.md) · [Minswap V2 integer swap implementation](https://github.com/minswap/minswap-dex-v2/blob/c3293ad435792ba502f5a2b1691c6736e5f167e6/lib/amm_dex_v2/math.ak) · [Exact Minswap V2 observation and artifact in §42](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42196843453).
