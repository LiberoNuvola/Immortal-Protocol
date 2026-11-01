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
| SundaeSwap V3 / Stable | Official SundaeSwap GraphQL API returned 8 exact-USDM pools in run 41225082594: 5 V3, 2 Stableswaps, 1 V1. Five V3 pool IDs and reserves matched the independent SuperCardano indexer (5/5); the other five SuperCardano V3 records were old/zero-reserve. | Direct Koios exact-USDM UTxO capture at official V3 script hash `e0302560...`; decode real PoolDatum and validate pool NFT, asset pair, circulating LP, protocol fees and reserves. StableSwaps and V1 need separate protocol-specific readers. | **5/5 V3 pools decoded and reconciled live against official API + Koios Mainnet; 2 Stableswaps and 1 V1 remain unqualified.** |
| WingRiders V2 / Stable | Moneta ecosystem lists WingRiders; third-party DEX Screener currently shows a USDM/NIGHT pair, but it reports very low liquidity. WingRiders publishes an open-source Rapid DEX SDK and its own tRPC pool data interface. | Use official SDK/tRPC or direct UTxO observation; enumerate all USDM pairs, not only USDM/ADA; decode V2 and StableSwap separately. | **Candidate; exact official pool state and current liquidity unverified.** |
| Danogo CLMM | Same-run read-only Koios observer found 12 exact-USDM pool NFTs; 12/12 current UTxOs, payment credentials, NFT identities and SuperCardano active-reserve values matched. Pairs include 5 ADA/USDM, 2 USDM/USDCx, 1 USDM/USDA and 4 USDM/other-token pools. | Decode the CLMM curve/tick state and derive tick-aware quotes; resolve the three ADA-pool potential reward amounts currently marked unverified. | **12/12 structural matches; not yet a price source because CLMM quote math/reward completeness is not qualified.** |
| SaturnSwap CLOB | Three official deployments were read; 20,026 order UTxOs scanned. No direct USDM/ADA orders were found in the scanned rows. The 4%-runoff deployment hit its 20,000-row cap with incomplete pagination and 20 invalid rows; V3 had 8 invalid rows. | Finish pagination, repair/understand invalid datum variants, and establish funded active bid/ask levels before calculating order-book mid/depth. | **No direct order found in partial scan; NOT evidence of zero liquidity.** |
| Splash | Official Cardano directory identifies Splash as an active DEX; no exact USDM pair confirmed in reviewed sources. | Query public pool registry/API and exact-asset on-chain state; only retain if exact USDM appears in a live pool. | **Venue discovery only; USDM listing unconfirmed.** |
| NBX / centralized market | NBX publishes USDM issuer/trading information; current USDM market pair and public quote API not established by this scan. | Check public order book/trades, jurisdiction/access constraints, API availability, timestamps, depth and withdrawal/deposit status. | **Potential external market, not yet confirmed.** |

## 4. Oracle and reference-price pathways

| Source | What it can establish | Independence / cost notes | Qualification status |
|---|---|---|---|
| Pyth Lazer on Cardano | Signed external feeds with price, confidence, EMA, bid/ask and exponent; Cardano integration verifies signed updates on-chain. | Potentially independent of Cardano DEX venues, but Pyth Pro/Lazer access and pricing must be confirmed. A free trial is not a durable free production source. | **Integration path documented; access, feed coverage, terms and cost must be verified.** |
| Charli3 | Moneta/NBX describes Charli3 as reporting daily USDM reserve value on-chain. | Issuer reserve/proof-of-reserves observation, not an independent executable market price. It must not be conflated with USDM/USD market price. | **Reserve evidence path only; current feed datum and verification pipeline need a separate audit.** |
| GeckoTerminal / DexScreener | GeckoTerminal returned 20 exact-USDM pair observations: 19 Minswap and 1 SaturnSwap. DexScreener returned 6/31 exact Minswap pair lookups; 25 were missing. | Secondary indexers useful for discovery/price cross-check only; underlying DEX and pool IDs must be deduplicated against direct on-chain evidence. | **Not independent venues/oracles; GeckoTerminal coverage is mostly Minswap.** |
| MuesliSwap API / AMM | Official API DNS lookup failed (`ENOTFOUND api.muesliswap.com`); official docs say API use is private-only and commercial use requires contacting MuesliSwap. Official MuesliSwap contract repo publishes two Mainnet pool addresses, pool NFT policy `909133...`, LP policy `af3d70...`; PoolDatum has 4 fields and the contract enforces a constant-product invariant. | API unavailable and usage terms may restrict commercial use; direct Koios exact-USDM scans at both official pool addresses are now queued. Capture raw datum first, then decode the 4-field PoolDatum and compare with any recovered API data. | **API SOURCE_UNAVAILABLE; direct on-chain acquisition pending.** |
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

1. SundaeSwap next: API census found 8 exact-USDM pools (5 V3, 2 Stableswaps, 1 V1); 5 V3 UTxOs with real datums have been captured. Finish decoder/API reconciliation, then implement separate Stableswaps and V1 decoders.
2. WingRiders second: inspect official Rapid DEX tRPC/SDK and identify exact USDM pool records.
3. Danogo third: use official CLMM SDK and decode real on-chain state; third-party pool lists are only discovery hints.
4. Check NBX public order book/API and CoinGecko/CoinPaprika listing lineage.
5. Separately audit Pyth access/cost and Charli3 reserve-feed evidence.

All work remains read-only. No wallet, signing, transactions, deployment, oracle refresh, or changes to IMMORTAL economic rules.


## 8. SundaeSwap API census — 2026-10-31

Actions run [41225082594](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41225082594) successfully queried the official SundaeSwap GraphQL API using the official SDK's `byAsset(asset: $assetId)` query shape and the exact USDM `policyId.assetNameHex` ID.

- 8 returned pools, all 8 exact-USDM pair matches.
- Versions: 5 V3, 2 Stableswaps, 1 V1; the API returned deployed protocol anchors for Stableswaps, V4, V3 and V1.
- Five V3 pool identifiers were matched against SuperCardano's independent indexer records; all five pair identities and raw reserve quantities matched exactly. The remaining five SuperCardano V3 records were not in the current API result and had zero reserve values; they are treated as stale/inactive indexer records, not live quote sources.
- API artifact ID `13051886487`, ZIP SHA-256 `b2b2de4d333ca177ab3d1c435cbdf8fbc6ac8318ff9856f50f9b11a98d2b19e4`.
- The API result is discovery/venue data only; it is not direct UTxO validation. The 2 Stableswaps pools and 1 V1 pool have not been decoded or qualified.

A read-only Koios acquisition job has now been added for the official SundaeSwap V3 pool payment credential `e0302560ced2fdcbfcb2602697df970cd0d6a38f94b32703f51c312b`, filtered by exact USDM and `payment_cred`. It preserves raw inline datum CBOR/JSON first; no decoder is assumed until a real fixture is captured. Workflow run pending.


## 9. SundaeSwap V3 — real Mainnet UTxO capture and decoder gate

Read-only Actions run [41225473861](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41225473861) queried Koios `POST /asset_utxos` with exact USDM and `payment_cred=eq.e0302560...` (official V3 pool script). It returned **5 UTxOs**, all with the expected payment credential, exact USDM and inline datum JSON/CBOR. Artifact ID `13051362189`, ZIP SHA-256 `448da612257d58ac4613423b44ab22e792602da5b4546404322dc15b040ce220`; raw Koios page body SHA-256 `b42e028163e6e7e3e79b82c0a639543794793b1244eb6c77837be66e82736185`.

The real datum shape is `Constr 0` with 8 fields: identifier bytes; a list of two asset-pair lists (each `[policy bytes, asset-name bytes]`); circulating LP; bid fee; ask fee; fee-manager Option; market-open slot; protocol-fee lovelace. This differs from Minswap's constructor layout and has its own decoder.

Official SundaeSwap V3 contract semantics reviewed from `lib/calculation/process.ak`, `lib/shared.ak` and `validators/pool.ak`:
- CIP-68 222 pool NFT name is `000de140 || identifier`; CIP-68 333 LP asset name is `0014df10 || identifier`.
- If asset A is ADA, subtract datum `protocol_fees` from lovelace to derive the ADA reserve. If asset A is not ADA, the lovelace component is protocol fees only.
- The pool UTxO Value contains ADA, the two pair assets (unless one is ADA), and exactly one pool NFT. LP supply is represented by datum `circulating_lp` and the CIP-68 333 asset; it is not an extra asset in the pool UTxO.

The one ADA/USDM pool (identifier `64f35d26b237ad58e099041bc14c687ea7fdc58969d7d5b66e2540ef`) has raw Value lovelace `75817851679`, protocol fees `1239772000`, therefore ADA reserve `74578079679`; USDM reserve is `14572208659`; circulating LP is `25568555601`. The datum/Value arithmetic is directly supported by the captured UTxO, but the new validator/API reconciliation job has not yet produced its green run.

Added `scripts/lib/sundaeV3PoolDatum.mjs`, observer integration and real-fixture Vitest tests. The fixture is stored in `scripts/fixtures/sundaeswap-v3-usdm-mainnet-2026-10-31.json`. The observer will reconcile pool identifier, CIP-68 333 LP identity, pair, reserves and circulating LP against the same-run official API artifact. This is structural evidence only, not a market price or peg qualification. Stableswaps and V1 remain separate unqualified protocol types.


## 10. Indicative USDM/USD cross-reference with source ages — 2026-10-31

The cross-reference job in run [41225927034](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41225927034) now emits actual pool UTxO block times and ages. It reports 2 ADA/USDM constant-product venues × 3 CEX ADA/USD midpoint references (Coinbase, Kraken, Bitstamp) = 6 indicative rates.

- Minswap V2 pool UTxO updated at 2026-10-31 17:36:08Z; age 554 seconds at calculation 17:45:22Z. Spot 5.14514955 ADA/USDM.
- WingRiders V2 pool UTxO updated at 2026-10-30 09:02:49Z; age 117,753 seconds (~32.7 hours) at calculation. Spot 5.17286012 ADA/USDM.
- CEX references were observed around 17:43:54Z. Resulting indicative USDM/USD cross-rates: Minswap 0.99427442–0.99473749; WingRiders 0.99962935–1.00009491.

These are reserve-ratio × CEX-midpoint calculations, not executable quotes. The WingRiders state is materially older than the CEX observations; the source ages are exposed, but no arbitrary freshness threshold is applied. The 6 values must not be averaged or represented as a peg proof. The Minswap ADA/USDM reserve ratio also changed between successive snapshots, reinforcing the need for timestamp-aware evidence.


## 11. SundaeSwap V3 live structural reconciliation — green

Actions run [41226055552](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41226055552) completed all 15 jobs successfully, including the 26-test suite and same-run Sundae V3 API/Koios observer.

- Koios exact-USDM UTxOs: 5; official V3 payment credential matches: 5; inline datum: 5.
- Strict V3 PoolDatum/Value validation: **5 MATCH, 0 UNQUALIFIED**.
- Same-run SundaeSwap API V3 pool count: 5; API reconciliations: **5 MATCH, 0 MISMATCH, 0 API-only**.
- Compared fields: pool identifier, CIP-68 222 NFT, CIP-68 333 LP asset ID, ordered pair, Value-derived reserves, protocol fees and circulating LP quantity.
- Observer artifact ID `13051323349`, ZIP SHA-256 `8d7f9695567386e96e936e39f4cb59f74bb95e09193ce42c1537e6e0fb607669`.

This establishes structural on-chain/API consistency for the five Sundae V3 pools at the captured time. It does not qualify the two Stableswaps pools or the V1 pool, nor any market price, USDM/USD peg, oracle, EEV or deployment. Sundae V3 ADA/USDM is now a third independently operated DEX venue with direct on-chain structural evidence, but its spot reserve ratio remains a pre-fee, pre-slippage indicative observation.


## 12. Other venue and indexer observations — run 41226055552

- **Danogo CLMM:** 12 exact-USDM pool NFTs discovered; 12 current UTxOs, 12/12 payment-credential/NFT/datum/Value matches and 12/12 active-reserve matches against SuperCardano. Pair count: 5 ADA/USDM, 2 USDM/USDCx, 1 USDM/USDA, 4 USDM/other tokens. Three ADA pools carry a potential unverified reward amount. The CLMM's current price is not a simple reserve ratio; no USDM/USD cross-rate is produced until official tick/sqrt-price math and reward completeness are verified. Artifact ID `13051933069`.
- **SaturnSwap CLOB:** 3 deployments successfully queried; 20,026 order UTxOs scanned. No direct USDM/ADA orders found in the returned rows. The 4%-runoff deployment reached its 20,000-row cap and pagination is incomplete; 20 invalid rows there, plus 8 invalid V3 rows. This is not evidence of zero liquidity. Artifact ID `13051103586`.
- **GeckoTerminal:** 20 exact-USDM pair observations: 19 Minswap, 1 SaturnSwap. It is a secondary indexer, not an additional 20 venues. Artifact ID `13050998396`.
- **DexScreener:** 6 of 31 Minswap V2 pair lookups returned exact pair/address matches; 25 responses were missing. Secondary indexer only. Artifact ID `13052042341`.
- **MuesliSwap:** both exact policy/name API queries failed DNS resolution (`ENOTFOUND api.muesliswap.com`); status is `SOURCE_UNAVAILABLE`, not zero pools. Artifact ID `13051492777`.


Official MuesliSwap API documentation lists `/liquidity/pools`, `/price`, `/trades` and `/orderbook`; its terms state private use only and require contacting MuesliSwap for commercial use. Therefore the direct public-chain observer is the preferred no-license-dependency route until the API terms are clarified.


## 13. Danogo USDM/USDCx — exact on-chain stable-pair marginal spot candidate (2026-11-01)

### Source evidence

Read-only multi-source run [41241048258](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41241048258) captured the exact Moneta USDM UTxO set and discovered 12 Danogo CLMM pool NFTs. Its artifact [13057745621](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41241048258/artifacts/13057745621) reports 12/12 structural MATCH: current UTxO cardinality, NFT quantity, official pool payment credential, exact datum pair, and active reserves reconciled against SuperCardano. Two pools are exact Moneta USDM / Circle USDCx pairs; both use only stable tokens, so the unresolved ADA staking-reward path does not apply.

USDCx exact Cardano Mainnet identity (Cardanoscan/CIP-14 resolution):
- Policy ID: `1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e34`
- Asset name hex: `5553444378` (USDCx)
- Full unit: `1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e345553444378`
- Decimals: 6
- CIP-14 fingerprint: `asset1e7eewpjw8ua3f2gpfx7y34ww9vjl63hayn80kl`
- References: [Circle launch announcement](https://www.circle.com/blog/usdcx-on-cardano-now-available-via-circle-xreserve), [Cardano Foundation launch notice](https://cardano.org/news/2026-02-27-usdcx-goes-live-on-mainnet/), [Cardanoscan token record](https://cardanoscan.io/token/1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e345553444378).

### Pinned SDK marginal calculation

A separate read-only derivation script was added. It uses the official Danogo CLMM integer `calcLiquidity` and virtual-reserve calculation, pinned to SDK commit [0416dc1f3531ce77eec7664ea3947f192a3aca40](https://github.com/dano-finance/clmm-sdk/blob/0416dc1f3531ce77eec7664ea3947f192a3aca40/src/utils.ts). It does **not** use the raw reserve ratio. Both assets have six decimals and the observed datum order is USDM (X) → USDCx (Y); marginal output/input is therefore virtualY / virtualX.

| Pool UTxO | Block time (UTC) | Active reserves | LP fee | Marginal USDCx / USDM |
|---|---|---|---:|---:|
| `c8ca882352dc5267b24de82abbaed09bbe19d6c6fcf993b1fc5150333d1d091b#2` | 2026-10-31 15:39:04 | 119,092.520614 USDM / 52,293.107305 USDCx | 5 bps | **0.99499497** |
| `e28aae486e31175b935382d9b657f44b4680a0d95fe936dd85a2d37dd0ef8588#1` | 2026-10-31 20:16:11 | 122,506.229924 USDM / 55,288.255462 USDCx | 10 bps | **0.99425159** |

The first pool datum hash is `9ad95c01aa567ccf079fe413b72e8fa5c0cb98067ac29cbb8ae68c7ba0f9e121`; the second is `678b94f28ef40983f81ffc069d17cb48d9e5c38c660898e79d1b4f26502b42c4`. Both reserve pairs match the same-run Koios/SuperCardano active-reserve observations exactly. Source freshness classification was `UNDER_24H` for both at capture.

### Reproducibility status

- Added `scripts/deriveDanogoUsdmUsdcxCrossReferenceReadOnly.mjs`.
- Preserved two real pool records and inline datum CBOR in `scripts/fixtures/danogo-usdm-usdcx-mainnet-2026-10-31.json`; original artifact ZIP SHA-256: `77c3c0c338f28deb70ff2a18186df334cacc0605d4b371e7f6ca5bff9f78795c`; full source JSON SHA-256: `deba3391f24d6bc30cc79a294d75ea23a05fe0458ad4df7ece8b5f00a9e8dc68`.
- Added `scripts/deriveDanogoUsdmUsdcxCrossReferenceReadOnly.test.mjs`: local Node test run **5/5 PASS**, including identity, script-credential, pool-pair and unresolved-reward fail-closed cases.
- Added dedicated workflow `.github/workflows/danogo-usdm-usdcx-cross-reference.yml`; source commit: `12db30be0af0ae52a8951f0633125bebe2dce1e8`. At the time of this matrix update, GitHub combined commit status had not yet returned a check result; do not claim hosted CI passed until separately observed.

### USD leg and qualification boundary

Circle states that USDCx on Cardano is issued by a Cardano protocol and backed by USDC held in Circle xReserve, with xReserve attestations and burn/mint interoperability; Circle describes 1:1 transfers between USDC and xReserve-backed stablecoins across supported chains. This is a promising, separately governed USDCx→USDC leg, **not an independently observed redemption**. The exact xReserve/partner deployment, live reserve/attestation state, conversion route and operational fees must still be inspected before treating USDCx as USD.

Therefore the two Danogo pools provide a stronger exact on-chain USDM/USDCx market observation, but **do not yet qualify USD/USDM**. No 1:1 USDCx/USD parity is inserted by the script; no rate is forwarded into OracleQuote, PriceReference, Kernel, EEV or Issue admission. The marginal spot is pre-LP-fee and not an executable quote; pool observations are asynchronous; no pool weighting, averaging, freshness threshold or peg rule is introduced.

**Disposition:** Option B remains OPEN/NOT QUALIFIED; P-01 remains BLOCKED and P-16 NOT ISSUED. This is additional evidence and a read-only research path only. No contract, economic, V3 or Reveal changes; no wallet signature, transaction, approval or deployment.
