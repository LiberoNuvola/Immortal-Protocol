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
