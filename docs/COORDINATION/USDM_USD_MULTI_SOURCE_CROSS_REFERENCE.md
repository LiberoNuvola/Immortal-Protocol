# USDM/USD — multi-source cross-reference (read-only)

**Snapshot:** 2026-10-31, Actions run [41232463082](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41232463082)  
**Source commit:** `f2999efecd32311bba79d6a6472014040c1a43ff`  
**Classification:** indicative cross-rate only; no peg/oracle/EEV/deployment qualification.

## Inputs

Four structurally checked constant-product pools from four distinct Cardano DEX venues:

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
7. Danogo CLMM and SundaeSwap stable pools remain excluded until their curve-specific math and reserve semantics are independently implemented and tested.
8. No USDM/USD peg, redemption guarantee, issuer reserve backing, oracle suitability, EEV valuation, economic parameter, or deployment approval is asserted.

## Next work

- Preserve age and timestamp per pool; do not silently average.
- Finish SaturnSwap CLOB pagination/coverage classification before using its orderbook as market evidence.
- Add Danogo CLMM only after curve-specific price math and validation are reviewed.
- Keep aggregator observations separate from actual venue observations.
