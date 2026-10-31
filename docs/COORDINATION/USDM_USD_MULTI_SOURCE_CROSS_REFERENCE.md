# USDM/USD — multi-source cross-reference (read-only)

**Snapshot:** 2026-10-31, Actions run [41232463082](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41232463082)  
**Source commit:** `f2999efecd32311bba79d6a6472014040c1a43ff`  
**Classification:** indicative cross-rate only; no peg/oracle/EEV/deployment qualification.

## Inputs

Four structurally checked constant-product pools from four distinct Cardano DEX venues (the snapshot predates the Danogo CLMM math integration):

| DEX venue | Pool spot (ADA per USDM) | Pool UTxO age at calculation |
|---|---:|---:|
| Minswap V2 | 5.14704289 | 3,640 s (~1.0 h) |
| SundaeSwap V3 | 5.11782952 | 68,809 s (~19.1 h) |
| WingRiders V2 | 5.17286012 | 122,656 s (~34.1 h) |
| MuesliSwap | 5.27796218 | 153,854 s (~42.7 h) |

Three independent centralized-exchange ADA/USD spot references were successfully captured:

| Exchange | ADA/USD bid | ADA/USD ask | Mid |
|---|---:|---:|---:|
| Coinbase Exchange | 0.19356 | 0.19361 | 0.193585 |
| Kraken | 0.193532 | 0.193566 | 0.193549 |
| Bitstamp | 0.19357 | 0.19362 | 0.193595 |

The calculator forms the cross product of 4 DEX pool spots × 3 CEX ADA/USD mids = **12 derived combinations**. These are not 12 independent oracles: there are four distinct DEX venues and three distinct centralized exchange markets.

## Result

- Direct constant-product pools: **4**
- Distinct DEX venues: **4**
- Successful ADA/USD exchange references: **3**
- Derived USDM/USD cross-rates: **12**
- Indicative cross-rate range: **0.99055079–1.02178709 USD per USDM**

The lower result is SundaeSwap V3 × Kraken; the upper result is MuesliSwap × Bitstamp. No average, outlier rule, freshness threshold or peg band is applied.

## Evidence artifact

Artifact ID `13054296365`; ZIP SHA-256 `f058af4c0cadfd36a89ba2a0907e3aa6e7fc1ea24ad424863eb98bf0781454ce`; extracted JSON SHA-256 `67bdc6da9932b7f44752c3e0a2215fdc5e54a94fcfa027b7a8b5e723fb348274`.

## Interpretation limits

1. These are AMM reserve-ratio spots before fees and slippage, not guaranteed execution prices.
2. Pool snapshots are not atomic with the CEX snapshots. Each source has its own timestamp.
3. Minswap's pool is ~1 hour old; SundaeSwap ~19 hours; WingRiders ~34 hours; MuesliSwap ~43 hours. No pool is automatically excluded by age in this run. The older pools may materially widen the observed range.
4. MuesliSwap's public API DNS was unavailable. Its on-chain spot was validated against its official pool datum/value rules; the second Muesli pool is USDM/USADA and not a direct ADA/USDM quote.
5. SaturnSwap CLOB is a separate venue but its first scan had incomplete pagination and no direct orders in the scanned rows; it is not included in the cross-rate.
6. SuperCardano, GeckoTerminal and DexScreener are indexers/aggregators, not additional DEX venues. They are not counted as independent markets.
7. Danogo CLMM is now wired to a separate official-SDK virtual-reserve marginal-price calculator; its live inclusion is pending the next CI run. Pools with unresolved current-epoch ADA rewards remain excluded. SundaeSwap stable pools remain excluded until their curve-specific math and reserve semantics are independently implemented and tested.
8. No USDM/USD peg, redemption guarantee, issuer reserve backing, oracle suitability, EEV valuation, economic parameter, or deployment approval is asserted.

## Next work

- Preserve age and timestamp per pool; do not silently average.
- Finish SaturnSwap CLOB pagination/coverage classification before using its orderbook as market evidence.
- Verify the new Danogo CLMM official-SDK virtual-reserve calculation in CI and against live same-run pool evidence; keep reward-unresolved ADA pools excluded.
- Keep aggregator observations separate from actual venue observations.


## Danogo CLMM curve math implementation — unit CI green; live inclusion pending

The official [`dano-finance/clmm-sdk`](https://github.com/dano-finance/clmm-sdk) `src/utils.ts` implements `calculateConcentratedPoolSwap` using active reserves and virtual reserves derived from the pool's lower/upper square-root price bounds. Its internal formula is:

- `L = calcLiquidity(activeX, activeY, lower, upper)` (exact integer numerator/denominator);
- `virtualX = ceil(L / upper) + activeX`;
- `virtualY = ceil(L × lower) + activeY`;
- marginal `Y per X = virtualY / virtualX` (invert when the pool's X/Y orientation is ADA/USDM rather than USDM/ADA).

Added `scripts/lib/danogoClmmMath.mjs` as an integer-only read-only port, with tests in `scripts/lib/danogoClmmMath.test.mjs`. The cross-reference now reads the same-run Danogo observer artifact and includes only direct ADA/USDM pools passing structural MATCH. If `rewardEpochBehind` is true, the pool is excluded unless a reward amount was actually read and applied; the current observer does not yet resolve that amount, so it remains fail-closed. The focused CI suite now passes 43/43 tests (5 files) in Actions run [41238996378](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41238996378), including 9 Danogo math tests and 6 CSWAP provisional reconstruction tests. The same run's live Danogo observer is still pending its upstream Mainnet and WingRiders dependencies; no Danogo spot has been published yet.

The resulting value is a marginal spot before trade execution fees/slippage, not a finite-size executable quote. No Danogo pool is included in the prior four-DEX snapshot above.


## CSWAP candidate discovery — not yet price-qualified

A separate exact-USDM Koios scan at the official CSWAP ADA pool address completed in Actions run [41238599020](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41238599020). It returned one current UTxO with the pinned official payment credential and one decoded eight-field datum. The UTxO holds 198.980533 USDM and 1,041.525670 ADA; datum fields include balance `424221685` and fee numerator `85`. Artifact ID `13055464167`.

This is only a candidate discovery. The current parser is based on reverse-engineered field positions. The deployed PlutusV3 fee denominator, swap arithmetic, balance semantics, LP token name encoding and pool Value invariants are not independently validated. Do not calculate or include a CSWAP ADA/USDM spot until those are resolved against contract behavior. Third-party references report an 0.85% pool fee for this pair, but that does not replace contract-level verification.

The same Actions run's SundaeSwap V3 observer timed out during Koios acquisition after 45 seconds; the result is `SOURCE_UNAVAILABLE_OR_INCOMPLETE`. Earlier 5/5 structural evidence remains the last successful snapshot and is not refreshed by this failed attempt.


## CSWAP provisional AMM spot — third-party SDK reconstruction only

Reviewed the MIT-licensed [Flux-Point-Studios Dexter SDK](https://github.com/Flux-Point-Studios/dexter), specifically `src/dex/cswap.ts`, `src/pricing/cswap-pricing.ts` and `src/dex/definitions/cswap/pool.ts`. Its pool parser expects an eight-field datum (`lp`, `lp_fee_10k`, token A/B policy/name, LP policy/name), accepts ADA as token A, subtracts 2 ADA minimum pool deposit from the lovelace balance, treats `lp_fee_10k` as a 10,000-basis denominator, and computes a constant-product reserve ratio. The SDK separately documents 690,000 lovelace batcher fee, 2 ADA order deposit, and 15/10,000 platform fee on target minimum output.

For the captured Mainnet candidate, this reconstruction yields active reserve ADA `1,039.525670`, USDM reserve `198.980533`, datum fee numerator `85` (0.85% per the SDK), and marginal reserve-ratio spot `5.22425814 ADA/USDM`. This is emitted only in `cswapProvisional` and `provisionalCswapCrossRates`, never in the qualified `dexPools` or primary `indicativeCrossRates` series.

**Important boundary:** Dexter is a third-party SDK, not CSWAP's official PlutusV3 source. Its math/field interpretation has not been verified by contract execution or a source-level audit of the deployed script. The balance field semantics, pool NFT, LP name and reserve invariants remain unverified. Treat this as a provisional reference only; it cannot contribute to Oracle/EEV qualification until those gaps are closed.


## Latest SundaeSwap V3 snapshot — 5/5 structurally and API reconciled

The transient 45-second Koios timeout in run 41238599020 was not persistent. In run [41238996378](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41238996378), the SundaeSwap V3 observer completed successfully: **5 rows, 5 payment credential matches, 5 inline datums, 5 structural matches, 0 unqualified, 5 API matches, 0 API mismatches, 0 API-only pools**. Artifact ID `13056956033`, ZIP SHA-256 `a368f846268a65c5ef131edfd3672045b4aafacb88a9254c6904fe347e19cb19`; extracted JSON SHA-256 `1e1577af21e3b7bd83fda706c937218c8aaf49e2bb4aa9e50b4d29e433355f87`.

This is a new successful structural/API snapshot, not a new USD price or independent venue: it confirms the same five on-chain V3 pools match the same-run official SundaeSwap API. The downstream USDM/USD cross-reference in this run remains pending the other pool and market-data dependencies.


## Integrated multi-venue / CEX snapshot — Actions run 41238996378

The full read-only workflow completed successfully in [run 41238996378](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41238996378). The resulting cross-reference artifact is `usdm-usd-cross-reference-readonly-41238996378` (artifact ID `13056627144`, ZIP SHA-256 `734820927de6375a0d80b7bbdcd2d7e2a8644da15f82dba8dad90e7c767acfac`; extracted JSON SHA-256 `e3bcb527ca8fb2991e3bcf89ffa5c98a61335c42750531f7a557a6b5ee3001fe`).

Primary observations:

- **6 structurally checked ADA/USDM pools across 5 DEX venues:** 4 constant-product pools (Minswap V2, SundaeSwap V3, WingRiders V2, MuesliSwap) plus 2 Danogo CLMM pools using the official SDK virtual-reserve marginal formula.
- **18 indicative cross-rates:** each of the six DEX pool observations crossed with three separate ADA/USD CEX references (Coinbase Exchange, Kraken, Bitstamp).
- ADA/USDM marginal spot range: **4.99999919–5.27796218 ADA per USDM**. Indicative cross-rate range from the full Cartesian set: approximately **0.9630–1.0167 USD per USDM**. No average, peg band, outlier filter or qualification decision is made.
- Danogo observer discovered 12 pool NFTs and matched all 12 current UTxOs structurally. Two direct ADA/USDM pools had reward state resolved by epoch and entered the CLMM calculation. Three additional ADA/USDM pools were excluded because the ADA-side reward amount is unresolved; seven other matched pools were not direct ADA/USDM pairs.
- Pool UTxO ages at calculation ranged from **589 seconds to 158,844 seconds (~44.1 hours)**. Age is reported but no freshness threshold is applied. The cross-market observations are not atomic and the oldest pool observations must not be interpreted as fresh quotes.
- CSWAP produced three separate provisional cross-rates (about **1.00619–1.00632 USD/USDM**) using the third-party Dexter SDK reconstruction. These are excluded from the primary 18 cross-rates and remain unverified against the deployed PlutusV3 validator.

SaturnSwap CLOB result in the same run: 20,026 order UTxOs scanned across three deployments; no direct ADA/USDM orders were detected in the scanned rows, but the `saturn-v2-mainnet-4pct-runoff` deployment hit the pagination cap. Overall status remains `READ_ONLY_SATURNSWAP_ORDERBOOK_PARTIAL`, with 8 invalid rows and no best bid/ask. Therefore **zero detected orders is not proof of zero orders** and this source contributes no CLOB quote yet.

These observations broaden the market reference set, but they are still research cross-rates—not an issuer redemption quote, not proof of a 1 USD peg, not a qualified oracle and not EEV evidence. Staleness, market depth, venue independence and reserve risk remain explicit limitations.


## Float — additional confirmed-chain cross-DEX indexer (2026-10-31)

Added a read-only collector for the public [Float API](https://api.float.sundae.fi/v1), associated with Sundae Labs. The official Sundae Labs site lists Float among its Cardano DeFi analytics products, and describes its aggregate market statistics as on-chain sourced. Float's API reports a confirmed-chain watermark (slot, height, hash) and serves per-market reserves, pool metadata, stale flags and venue identifiers. It is a **separate indexer/data plane**, not a separate DEX venue or independent USD oracle.

The first live collector run [41239314212](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41239314212) succeeded:
- exact Moneta USDM identity verified, decimals 6;
- HTTP 200, provider finality confirmed, watermark height 14,141,197 / slot 201,912,408;
- 58 exact-USDM markets across 12 venue families;
- 18 direct ADA/USDM markets, of which 12 were not marked stale and 6 were marked stale by Float;
- raw response SHA-256 295331e0878c1f9b6529fff100671bda89c3d7ddb9ef5ae76f07193aa3eb5e8f;
- artifact ID 13057135662, ZIP SHA-256 9c9b6126d3c56524af457a133afcff8460314302b5063c53b4510114263a6083, extracted JSON SHA-256 c6c39376f31a6831fb12318c9fb9a8a86c3be272587adb1b30226aa2a6272900.

Venue census in that snapshot: Minswap V2 14, Danogo 11, Splash 8, Sundae V3 5, WingRiders V2 5, Minswap Stable 4, Sundae Stable 2, VyFi 2, MuesliSwap 2, WingRiders V1 2, Minswap V1 2, CSWAP 1. The 18 direct ADA/USDM market rows include stale and thin pools; these counts are a provider coverage census, not 18 qualified or executable quotes. The collector requests quote=ada and preserves raw reserves; it does not use Float's USD conversion.

A same-run reconciler is now added to compare Float's Minswap V2 pool keys and unordered asset pairs with the Koios UTxO set and Minswap API, while separately reporting Float venue coverage and stale direct pairs. It deliberately does not require Float to enumerate every on-chain pool: missing rows are coverage differences, not proof of absent pools. Automated cross-indexer result is pending.

Source boundaries:
- Float is operated in the Sundae Labs ecosystem; its data is not independent of the underlying Cardano ledger and it is not a second DEX venue.
- Koios, SuperCardano and Float are distinct indexer observations, but all describe the same on-chain state. Agreement is corroboration of decoding/coverage, not market independence.
- Do not merge Float's price, deviation, liquidity USD or ADA/USD-derived fields into the primary cross-rate until reserve semantics, venue curve math, freshness and the independent ADA/USD reference are validated.


## Latest refreshed cross-reference — Actions run 41239270654

The count-label correction was rerun successfully in [Actions run 41239270654](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41239270654). The corrected summary now explicitly reports **6 direct DEX pools = 4 constant-product + 2 concentrated-liquidity**, across five DEX venues, with three successful ADA/USD references and 18 primary cross-rates.

Latest snapshot:

- ADA/USDM marginal spot range: **4.99999919–5.27796218**.
- Indicative USDM/USD cross-rate range: **0.96181734–1.01547992** across the 18 DEX × CEX combinations.
- CEX mid references: Coinbase Exchange **0.19240000**, Kraken **0.19236350**, Bitstamp **0.19240000** USD/ADA.
- Pool observation age range: **130–159,026 seconds** (~44.2 hours). The MuesliSwap and one Danogo observation are old relative to the CEX snapshot; no age threshold is applied and no averaging is performed.
- Danogo remains 12/12 structurally matched; two direct ADA/USDM CLMM pools included, three direct ADA/USDM pools excluded for unresolved ADA rewards, and seven non-direct pairs excluded.
- CSWAP remains one provisional SDK-only pool; its three separate cross-rates are **1.00495658–1.00514727 USD/USDM**, not included in the primary 18.

Artifact ID `13056533033`, ZIP SHA-256 `5b7c8895d8cc6131d0e27374c96b003c239dae5dfb604718a4f836b9f4425009`; extracted JSON SHA-256 `8bad2dac7b34cd4eada0bde7ebb4c12bf78b14468ede818e6371cd3e4603cc7f`.

The cross-rate spread is a diagnostic dispersion, not a peg band. Pool source times are materially older than the CEX observations for some venues; the output must remain an unsmoothed observation matrix until freshness, depth, venue-independence and risk policies are explicitly governed.


## SaturnSwap CLOB coverage retry

The previous run scanned 20,026 order UTxOs across three deployment scripts but reached the 20-page cap on `saturn-v2-mainnet-4pct-runoff`. The observer now permits 50 pages per deployment and the GitHub Actions job timeout has been raised to 45 minutes. This is only an acquisition-coverage extension; it does not alter order parsing or price logic. The next run must still show a short final page for all three deployments before the orderbook can be called complete. Until then, no direct bid/ask is available from this partial CLOB scan.


## Orcfax on-chain CER feeds — ADA/USD and ADA/USDM discovery gate

A further native Cardano oracle path is now implemented as a **read-only** observer: `scripts/observeOrcfaxCerFeedsReadOnly.mjs`. It resolves the Orcfax-publish FactStatement script hash through the official FSP state token, then queries the corresponding FS-token UTxOs through Koios and decodes only the documented CER statement shape. It checks the FS token, payment credential, exact feed-id prefixes (`CER/ADA-USD/` and `CER/ADA-USDM/`), millisecond `created_at`, and positive exact rational numerator/denominator. It records the current UTxO, datum CBOR, tx/block context, raw Koios response hashes and the official feed-registry snapshot.

Official Orcfax documentation describes CER statements as on-chain oracle outputs; CEX-sourced and DEX-sourced feeds are distinct source classes. The live feed registry identifies ADA/USD as a CEX/median feed and ADA/USDM as a DEX/weighted-mean feed, each with a one-hour interval. This is a potentially valuable oracle aggregate, but it is **not** a new independent market venue: ADA/USDM inherits the DEX venues and their liquidity/quality limitations, while ADA/USD inherits its CEX inputs.

The observer and a dedicated five-case decoder test suite are wired into the read-only workflow. First live CI result is pending. No Orcfax rational is used in the primary cross-rate until actual mainnet datum serialization, feed-id, freshness, sign/scale and pair orientation are verified against captured UTxOs.

### Pyth feed availability

Pyth's public Hermes feed directory can be queried without authentication and identifies `Crypto.ADA/USD` feed ID `2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d`. The latest price-update endpoint currently requires an API key, so metadata discovery is free/public but live price access is not treated as a permanent unauthenticated source. The previous Pyth trial remains a possible temporary test path only; do not commit credentials or put keys in workflow files.

### Charli3 mainnet ADA/USD feed

Charli3 documents a mainnet ADA/USD oracle feed at address `addr1wyvxns52tsgz8ggvrh4np5gjyfk0g5fshqq2ytvu9t7pe8qp3adw6`, feed NFT policy `08c56c0fa73748a23c3bc1d9e6a60a4187416fc4ff8fe3475506990e`, token name `4f7261636c6546656564`. Its published network configuration uses five contributing nodes, a 60% update threshold (3/5), six-hour freshness and six-hour generation cadence, with a 15% deviation threshold and two required signatories. This is a real on-chain oracle feed, but the freshness cadence and source composition must be inspected before using it as a current reference. A read-only observer is now implemented at scripts/observeCharli3AdaUsdReadOnly.mjs, with a decoder based on the official Charli3 oracle-datum CDDL and a focused synthetic test suite. The first live Mainnet observation is pending.

Source references: [Orcfax CER feed documentation](https://github.com/orcfax/docs/blob/main/docs/developer-manual/consume.md), [Orcfax mainnet feed registry](https://raw.githubusercontent.com/orcfax/cer-feeds/main/feeds/mainnet/cer-feeds.json), [Pyth Hermes feed list](https://docs.pyth.network/api-reference/hermes/price-feeds), [Pyth latest updates](https://docs.pyth.network/api-reference/hermes/latest-price-updates), [Charli3 mainnet feeds](https://docs.charli3.io/oracles/resources/networks/mainnet).


### Float cross-indexer reconciliation result

Same-run Float/Koios/Minswap API reconciliation completed successfully in Actions run [41239467040](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41239467040):
- Float exact-USDM market census: 58 markets / 12 venue families;
- Float direct ADA/USDM: 18 rows (12 not marked stale, 6 stale);
- Float Minswap V2 pool rows: 14;
- Koios Minswap V2 exact-USDM UTxOs: 31;
- Float-to-Koios Minswap V2 LP-key + unordered pair matches: **14/14**;
- Float-only vs Koios: 0; Koios-only vs Float: **17**;
- Float pair mismatches: 0; Minswap API pair mismatches: 0; duplicate Float keys: 0; on-chain unqualified: 0.

Reconciliation artifact ID 13056244341, ZIP SHA-256 b00032a14423db2aa4824506dfa13790f4f8048409ab8ac9056f11401d836870. The 17 Koios-only rows are a **Float coverage gap**, not missing on-chain pools: the same-run Minswap API and Koios reconciliation still agree on 31/31. Float confirms all 14 rows it does expose, but its Minswap V2 list is not exhaustive. This further demonstrates why multiple indexers are useful and why an indexer's omission must never be treated as evidence of no pool.


### Orcfax first live Mainnet observation — structurally valid but stale

The first live run [41239730829](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41239730829) found and decoded both on-chain feeds. It resolved the official FSP policy/token and FS script hash, scanned 111 FS-token UTxOs, decoded 111 statements, and found five valid statements for each target feed. All five rows per feed passed the FS token/payment credential and datum checks.

However, the latest ADA/USD statement was created at 2026-06-18 21:02:22.882 UTC and the latest ADA/USDM statement at 2026-06-18 21:20:32.150 UTC. At capture time (2026-10-31 20:37 UTC), both were approximately 135 days old, against the feed registry's 3600-second interval. Therefore both feeds are **STALE** and must be excluded from current cross-rate/price evidence. The previous CI job returned nonzero because it mistakenly treated five unspent historical statement UTxOs as duplicate outputs. Those are preserved as five historical statements, not five duplicate copies. The observer has been corrected to report olderStatementCount, compare the newest statement age with the source-defined interval, persist READ_ONLY_ORCFAX_CER_FEEDS_STALE in the artifact, and keep acquisition success separate from feed freshness.

Artifact ID 13056972087, ZIP SHA-256 7586d6f1f9568d9b591d05e587ed48e3b8dd9f85688e96d614c8bd191fe58823, extracted JSON SHA-256 28c96a745b4f0b8e1de769a32ea7ed7839dc92155345b2f2a479dad8682772f1. The next rerun will verify the corrected freshness classification and that the CI job remains green while explicitly reporting the feed as stale.


## ADA/USD public CEX reference expansion

The unauthenticated direct ADA/USD collector now includes seven exchange endpoints: Coinbase, Kraken, Bitstamp, Gemini, Bitfinex, Crypto.com Exchange and BTSE Spot. Crypto.com exposes last/bid/ask plus a ticker timestamp; BTSE exposes last and index prices but no bid/ask, so it is recorded without manufacturing a midpoint. The collector now permits absent bid/ask fields and reports midpoint ranges only for venues that actually provide both sides.

This remains **CEX market data**, not a decentralized oracle. ADA/USDT and ADA/USDC markets are intentionally not counted as USD pairs; any conversion through those stablecoins would require a separately qualified USDT/USD or USDC/USD reference. First seven-source live run pending.


## Float confirmed-chain indexer — 58 markets across 12 venues

Float's read-only API returned an exact Moneta USDM record with 6 decimals, provider confidence `high`, finality `confirmed`, and an `as_of` watermark at block height `14,141,207` / slot `201,912,620` (`2026-10-31T20:35:11Z`). The response contained **58 exact-USDM markets across 12 DEX venue labels**. Of these, **18 were direct ADA/USDM pairs: 12 provider-marked fresh and 6 provider-marked stale**. The provider's stale flag is preserved; it is not treated as live liquidity.

Same-run Float/Koios/Minswap API reconciliation initially found 14 Float Minswap V2 market keys matching Koios UTxO pool names and exact asset pairs; there were 0 Float-only keys, 17 Koios-only keys, 0 pair mismatches and 0 duplicate Float keys. This indicates incomplete Float coverage (14 of 31 Minswap V2 pools), not missing on-chain pools. The initial API identity join was not valid: Float keys are pool/LP-name suffixes, whereas Minswap API exposes the full LP policy+asset-name unit. The first reconciliation therefore did not establish API matches despite reporting zero API pair mismatches.

Corrective work now joins the API through the candidate's full LP unit and adds exact Float-reserve-vs-PoolDatum reserve comparison (including reversed pair orientation). Six focused tests cover the identity join and reserve comparison. The new CI run is pending; no reserve-equality or API-match count is asserted until that rerun completes. Float remains an indexer of existing DEX venues, not a 13th independent market venue or a second node quorum.


### Charli3 first live Mainnet datum — optional metadata and stale feed

The first live Charli3 attempt [41240028319](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41240028319) found the exact mainnet ADA/USD feed UTxO (one OracleFeed NFT at the pinned address), but the decoder initially required precision and asset-symbol fields that the Charli3 standard explicitly marks optional. The captured datum contains only price, timestamp and expiry keys; it omits precision and symbols. The decoder now accepts that documented minimal form, records the pair as identified by the pinned mainnet feed address/NFT, and leaves decimal price conversion null when precision is absent. It does not invent a six-decimal scale.

The captured raw values were price integer 239761, timestamp 2026-05-27T05:21:30.404Z, expiry 2026-05-27T11:21:30.404Z. At capture on 2026-10-31, the statement was expired by more than five months. Therefore Charli3 is a validly identified on-chain oracle feed but **not a current price reference** in this snapshot. A corrected observer/test rerun is pending; even after the rerun, the feed remains stale unless a newer statement is published.


The Float reconciliation's API-side pair join now normalizes Minswap API `currency_symbol`/`token_name` separately from Plutus datum `policyId`/`assetNameHex`; the earlier draft used the datum schema for API objects and could not produce a meaningful API pair comparison. This schema correction is covered by a focused unit test. The workflow also serializes same-branch evidence runs, cancelling superseded pending/in-progress runs so the newest snapshot is the one that completes. Corrected Float/API/reserve results remain pending the next CI run.


## Additional public ADA/USD market aggregators

The same read-only reference collector has been expanded with three public aggregator endpoints: CoinPaprika, CoinLore and CoinGecko. These are kept in a separate MARKET_DATA_AGGREGATOR category, distinct from the seven direct CEX spot venues. CoinPaprika provides a provider update timestamp; CoinGecko can provide last_updated_at; CoinLore's current ticker response provides no provider timestamp, so its capture time is not a freshness guarantee.

These three aggregators may reuse or weight the same underlying CEX/DEX venue data. They are useful independent API observations, but not independent trading venues and not decentralized oracle networks. Their values must not be counted as three more CEX venues or averaged blindly with the seven spot sources. The ten-source live rerun is pending.


## Orcfax on-chain CER statements — new independent publication path

The current Mainnet feed registry at [`orcfax/cer-feeds`](https://github.com/orcfax/cer-feeds) declares:

- `ADA-USD`: source `cex`, calculation `median`, heartbeat `3600` seconds, deviation `1%`, status `sponsored`.
- `ADA-USDM`: source `dex`, calculation `weighted mean`, heartbeat `3600` seconds, deviation `2%`, status `sponsored`.

The registry is version `2026.05.18.0001`. Orcfax's consumer documentation specifies the on-chain trust chain: resolve the FS script hash through the FSP state NFT; verify the FS token UTxO; check the feed-id prefix (including trailing slash); then read the CER rational numerator/denominator and statement `created_at`. The FS token authenticates the statement, while the feed registry documents the upstream sourcing/calculation methodology.

This is a distinct Cardano-native oracle publication path, but its upstream data is still aggregated CEX data for ADA/USD and DEX data for ADA/USDM. It is therefore not an independent market venue and the ADA-USDM feed is not issuer redemption or a direct USDM/USD peg. The new read-only observer validates the FSP/FS token and payment credentials, exact feed prefixes, positive rational and provider heartbeat. It records both feeds separately; no ratio/orientation conversion is applied until the published pair convention is confirmed from actual feed statements and documentation.

The observer/workflow has been added, but no successful live artifact has yet been inspected. The next run must establish current UTxO, feed timestamps, rational values, finality context and freshness for both feeds before they can be included as an additional on-chain reference.


### Ten-source ADA/USD reference run

The expanded collector succeeded in run [41240334298](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41240334298): **8/10** references available — 5/7 direct CEX sources and 3/3 market aggregators. Gemini returned HTTP 404 and Bitfinex HTTP 500; they remain explicit unavailable rows, not silently removed.

- CEX bid/ask midpoint range (five venues with both sides): 0.19240900–0.19245500 USD/ADA.
- Last-price range across all eight successful sources: 0.19238600–0.19276400 USD/ADA. This is a range, not an average or consensus.
- Direct CEX successful: Coinbase, Kraken, Bitstamp, Crypto.com, BTSE. BTSE has last/index only, so it is not in the midpoint range.
- Aggregators successful: CoinPaprika, CoinLore, CoinGecko. CoinLore has no provider timestamp; its capture timestamp is not a provider freshness guarantee.

Artifact ID 13057132705, ZIP SHA-256 1f9cc9756474ced7ae5be8e82fc2408715d3faf31cd4e8ec56da5a4e989ca82a, extracted JSON SHA-256 8e298c6cc47021f0f0a8074e1e8548621d1c496954f1cc37dd031de345ab31c2. These are ADA/USD references only and do not establish USDM/USD.


### Float cross-indexer rerun note

The same-run Float reconciliation job in run 41240334298 failed before producing its artifact with a JavaScript scope error (`v is not defined`) in the join path. The decoder, Float collector, Koios observer and Minswap API collector artifacts all downloaded successfully; the failure is in the local reconciler, not the source providers. The scope reference was corrected to use the current candidate's `datumValidation.lpAsset` (commit 3b52da14a06fab42c5c554927402c19f6b4ddcfd). The rerun is pending; do not carry forward the previous 14/14 result as if it were produced by this updated reconciler.


## DIA free ADA/USD reference API (test-only)

Added a fourth non-CEX reference class using DIA's public, keyless Cardano native ADA endpoint: GET /v1/assetQuotation/cardano/0x0000000000000000000000000000000000000000. It returns the Cardano ADA quote, provider timestamp, source and 24h volume fields. DIA states that the free API aggregates raw trades from 100+ CEX/DEX sources, with no API key required, but is intended for testing/evaluation rather than production. It is therefore classified as ORACLE_REFERENCE_API_TEST_ONLY, not as a separate CEX venue and not as a production on-chain oracle.

This source may overlap with the seven direct CEX venues, the three market aggregators, and the Float/DEX data. Its raw provenance and timestamp must be retained; it must not be blindly averaged with those inputs. The first live CI observation is pending.

Official references: [DIA free API](https://www.diadata.org/free-crypto-api/), [Cardano ADA endpoint](https://www.diadata.org/app/price/asset/cardano/0x0000000000000000000000000000000000000000/), [DIA API endpoint specification](https://github.com/diadata-org/diadata/blob/master/documentation/api-1/api-endpoints.md).


### Float reserve-aware reconciliation result

The corrected reserve-aware reconciler completed successfully in run [41240680438](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41240680438):
- Float exact-USDM markets: 58 / 12 venues; direct ADA/USDM 18 (12 not stale, 6 stale);
- Float Minswap V2 rows: 14; Koios Minswap V2 rows: 31; Minswap API V2 rows: 31;
- Float-to-Koios LP identity + unordered pair: 14/14;
- Float reserve values exactly match decoded Minswap V2 datum reserves: **14/14**, zero reserve mismatches;
- Minswap API LP pool found for Float rows: 14/14; API pair matches: 14/14;
- Float-only vs Koios: 0; Koios-only vs Float: 17 (provider coverage gap); pair mismatches 0; duplicate keys 0; on-chain unqualified 0.

Artifact ID 13056909111, ZIP SHA-256 037ff05c0f3a7e42486843272a008cbb08510248c94ae37df1ebb8365ca31bbf. This is strong cross-indexer evidence for the 14 Float-listed Minswap V2 pools, including exact datum reserve agreement. It does not mean Float covers all 31 pools, and it does not validate USD conversion, price, peg, or executable depth. The 17 absent Float rows remain known on-chain pools, not absent liquidity.


### DIA endpoint case correction

The first CI attempt used lowercase path segment `cardano` and returned HTTP 404 (no rows). The official API is case-sensitive for the blockchain slug: the correct endpoint is `/v1/assetQuotation/Cardano/0x0000000000000000000000000000000000000000`. A live API probe returned ADA / Cardano, exact native-asset address, USD price, timestamp, source, previous-day volume and a provider signature. The collector has been corrected to use the capitalized slug and preserve the signature and volume-yesterday field separately. Rerun pending.
