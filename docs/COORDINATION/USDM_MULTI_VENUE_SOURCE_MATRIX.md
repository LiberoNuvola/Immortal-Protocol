# USDM Multi-Venue and Oracle Source Matrix

Date: 2026-10-31  
Owner: Agent A  
Status: discovery inventory — **no additional venue or oracle is qualified**

## 1. Scope and exact asset identity

This matrix concerns only Cardano Mainnet Moneta USDM:

- Policy ID: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad'
- Asset name hex: '0014df105553444d'
- Decimals: 6

Ticker/name matching is never sufficient. Every candidate must be verified against this exact policy/name pair on-chain.

## 2. Existing verified result — Minswap V2

The same-run read-only pipeline now acquires Koios UTxOs, validates Minswap V2 PoolDatum/Value structure, acquires Minswap API metrics, and reconciles exact LP asset identity and unordered asset pair.

Run 41204657669 result:

- 31 Koios exact-USDM candidates; 31 structural MATCH.
- 31 Minswap API V2 pools.
- 31/31 LP identity matches and 31/31 exact asset-pair matches.
- 0 on-chain-only, 0 API-only, 0 pair mismatches, 0 unqualified, 0 duplicate API LP IDs.
- Reconciliation artifact ID 13044411182.

This is one venue observed through two data channels. Minswap API and Koios are not two independent market venues or two independent price oracles. This does not qualify USD price, peg, EEV or deployment.

## 3. Additional venue discovery

| Venue / protocol | Discovery evidence | Candidate route | Qualification status |
|---|---|---|---|
| SundaeSwap V3 / Stable | Moneta lists SundaeSwap as an official USDM DEX partner and says USDM pairs were tradable from mainnet launch. Sundae's own site advertises ADA/USDM V3 and modular/stable pools. | Identify exact-USDM pools, read pool state on-chain, decode each pool type separately (V3 concentrated liquidity vs stable pool), reconcile with venue API/GraphQL. | **Candidate confirmed; exact live pool IDs/reserves not yet independently captured.** |
| WingRiders V2 / Stable | Moneta ecosystem lists WingRiders; third-party DEX Screener currently shows a USDM/NIGHT pair, but it reports very low liquidity. WingRiders publishes an open-source Rapid DEX SDK and its own tRPC pool data interface. | Use official SDK/tRPC or direct UTxO observation; enumerate all USDM pairs, not only USDM/ADA; decode V2 and StableSwap separately. | **Candidate; exact official pool state and current liquidity unverified.** |
| Danogo CLMM | Third-party DanoNight tracker reports USDM/USDCx and USDM/USDA CLMM pools. Danogo publishes an open-source CLMM SDK and integration documentation. | Discover protocol/config and pool script identifiers from official SDK/constants; exact-asset UTxO scan; implement a dedicated CLMM decoder and tick/liquidity-aware quote logic. | **Candidate only; third-party inventory is not sufficient evidence.** |
| Splash | Official Cardano directory identifies Splash as an active DEX; no exact USDM pair confirmed in reviewed sources. | Query public pool registry/API and exact-asset on-chain state; only retain if exact USDM appears in a live pool. | **Venue discovery only; USDM listing unconfirmed.** |
| NBX / centralized market | NBX publishes USDM issuer/trading information; current USDM market pair and public quote API not established by this scan. | Check public order book/trades, jurisdiction/access constraints, API availability, timestamps, depth and withdrawal/deposit status. | **Potential external market, not yet confirmed.** |

## 4. Oracle and reference-price pathways

| Source | What it can establish | Independence / cost notes | Qualification status |
|---|---|---|---|
| Pyth Lazer on Cardano | Signed external feeds with price, confidence, EMA, bid/ask and exponent; Cardano integration verifies signed updates on-chain. | Potentially independent of Cardano DEX venues, but Pyth Pro/Lazer access and pricing must be confirmed. A free trial is not a durable free production source. | **Integration path documented; access, feed coverage, terms and cost must be verified.** |
| Charli3 | Moneta/NBX describes Charli3 as reporting daily USDM reserve value on-chain. | Issuer reserve/proof-of-reserves observation, not an independent executable market price. It must not be conflated with USDM/USD market price. | **Reserve evidence path only; current feed datum and verification pipeline need a separate audit.** |
| CoinGecko / CoinPaprika | External reference/aggregated market observations, where a valid USDM market listing exists. | Aggregators may ingest the same DEX venues already observed. Must inspect exchange/pair lineage before counting as independent. | **Candidate; lineage and exact asset mapping unverified.** |
| Cardano DEX aggregators / routing APIs | Can discover executable routes and quoted output across venues. | A route aggregator is not an independent price oracle; underlying venues and pool overlap must be deduplicated. | **Discovery/quote cross-check only.** |
| Direct on-chain venue readers | Independent venue state for SundaeSwap, WingRiders, Danogo, etc. | Independent venue, but still endogenous market pricing; not an independent fiat reference. | **To be implemented venue by venue.** |

## 5. Required evidence for every venue

A venue can be counted only after all of the following:

1. Exact USDM policy ID + asset name hex appears in the pool pair, not only in a ticker or API display name.
2. Official venue identity is anchored to a deployed script/config/pool NFT or equivalent immutable on-chain identifier.
3. Raw UTxO, datum CBOR/hash, output Value, tx/block/slot, response headers/body hash and observation timestamp are preserved.
4. Pool datum decoder is protocol/version-specific and tested against at least one real captured datum.
5. Reserves/active liquidity and fee treatment follow the actual contract semantics; concentrated-liquidity pools require tick/range-aware depth, not a simple reserve ratio.
6. API/SDK observation is reconciled with on-chain pool identity and state; discrepancies are classified, never silently averaged.
7. Liquidity and executable quote are measured for explicit trade sizes and directions; TVL alone is insufficient.
8. Market observations are freshness- and manipulation-filtered. A venue with dust liquidity or stale state is not a usable price source.
9. Venue lineage is recorded so aggregators, indexers, APIs and DEXs are not falsely counted as independent.
10. Source failures remain explicit (SOURCE_UNAVAILABLE, UNKNOWN, etc.); absence of data is not evidence of zero liquidity.

## 6. Multi-source design principle

Do not set a target of 'two oracles'. Build a source graph with distinct roles:

- **Market venues:** multiple independently operated DEX/CEX pools, each on-chain verified.
- **Fiat reference:** signed external USD reference feed(s), with confidence and age limits.
- **Issuer reserve evidence:** Charli3/issuer reserve attestations, kept separate from price.
- **Independent indexers:** Koios plus other providers can corroborate ledger observations, but do not add independent market venues.
- **Aggregators:** useful for discovery and cross-checks only after underlying market lineage is resolved.

No new weighted average, confidence coefficient, threshold, economic parameter or oracle-consumer behavior is introduced by this document. Any future consumer integration remains subject to the existing governance and qualification gates.

## 7. Immediate next work

1. SundaeSwap first: official Moneta partnership + Sundae's own ADA/USDM V3 listing make it the strongest next venue candidate.
2. WingRiders second: inspect official Rapid DEX tRPC/SDK and identify exact USDM pool records.
3. Danogo third: use official CLMM SDK and decode real on-chain state; third-party pool lists are only discovery hints.
4. Check NBX public order book/API and CoinGecko/CoinPaprika listing lineage.
5. Separately audit Pyth access/cost and Charli3 reserve-feed evidence.

All work remains read-only. No wallet, signing, transactions, deployment, oracle refresh, or changes to IMMORTAL economic rules.
