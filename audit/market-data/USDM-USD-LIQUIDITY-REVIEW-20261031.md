# USDM/USD Cross-Rate — Preliminary Liquidity Review

**Date:** 2026-10-31  
**Branch:** `work/immortal-green-closure`  
**Input run:** [41241048258](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41241048258)  
**Input artifact:** `usdm-usd-cross-reference-readonly.json`  
**Classification:** `EXPLORATORY_READ_ONLY_CONSTANT_PRODUCT_DEPTH_NO_EXECUTION_CLAIM`

## Purpose

This note extends the run-41241048258 indicative ADA/USDM × ADA/USD cross-reference with a deliberately limited constant-product depth sensitivity. It does **not** qualify a USD/USDM source, establish parity, create a peg band, or authorize EEV valuation or Issue admission.

## Exact asset and source binding

Mainnet USDM observed in the input artifact:

- Policy ID: `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad`
- Asset name hex: `0014df105553444d`
- Decimals: 6

The ADA/USD comparison set contains five direct CEX spot references (Coinbase, Kraken, Bitstamp, Crypto.com, BTSE), three market aggregators, and one DIA test/evaluation-only API reference. Gemini and Bitfinex were unavailable. The successful five-CEX bid/ask midpoint range was 0.192365–0.192445 USD/ADA; the nine-source last-price range was 0.192350–0.192700 USD/ADA. These are separate observations, not an average or consensus. DIA remains test-only and its preserved signature was not cryptographically verified.

## Constant-product depth sensitivity

For the four constant-product pools with structurally qualified ADA/USDM reserves, the following gross, fee-free sensitivity was calculated from the captured reserves:

- Spot marginal price: (P_0 = R_{ADA}/R_{USDM}).
- Gross ADA output for a hypothetical USDM input (q): (ADA_{out}=R_{ADA}\times q/(R_{USDM}+q)).
- Average execution rate: (ADA_{out}/q).
- Price impact: (1-(ADA_{out}/q)/P_0).

All quantities are converted from raw units using the asset decimal scales in the source observation. No transaction was built, signed, submitted, or simulated against a live protocol.

| Venue | ADA reserve | USDM reserve | Pool observation age at calculation | Gross impact at 10 USDM | at 100 USDM | at 1,000 USDM |
|---|---:|---:|---:|---:|---:|---:|
| Minswap V2 | 1,925,346.514692 | 371,652.565378 | 0.35 h | 0.003% | 0.027% | 0.268% |
| SundaeSwap V3 | 74,578.079679 | 14,572.208659 | 20.97 h | 0.069% | 0.682% | 6.422% |
| WingRiders V2 | 6,719.886199 | 1,299.065900 | 35.93 h | 0.764% | 7.148% | 43.496% |
| MuesliSwap | 1,605.647750 | 304.217365 | 44.59 h | 3.183% | 24.739% | 76.674% |

**Interpretation:** this is a mathematical reserve-ratio sensitivity only. It excludes venue-specific swap fees, protocol/platform fees, batcher costs, minimum-output rules, order routing, transaction costs, and any execution constraints. It must not be described as an executable quote or realized slippage. The age is the elapsed time since the source block timestamp / pool UTxO update, not proof of the last trade time.

The spread in depth is material: Minswap's captured reserves imply much lower gross price impact than the smaller WingRiders and MuesliSwap pools at the same notional. However, SundaeSwap, WingRiders and MuesliSwap observations are approximately 21, 36 and 45 hours old respectively at calculation time. This makes the comparison temporally non-atomic and unsuitable as a current unified market snapshot.

## Exclusions and unresolved work

- Danogo CLMM: do not apply the constant-product formula. The two included pools expose active and virtual reserves; the captured SDK marginal ratio is not an executable quote. A separate SDK-based quote/depth method must reproduce tick traversal, liquidity changes, fee treatment, price limits and reward handling before sensitivity can be compared.
- CSWAP: keep separate and provisional. The captured method relies on a third-party SDK formula not independently verified against Plutus V3 semantics.
- MuesliSwap: one of three exact-USDM candidates was unqualified in the source reconciliation; only the structurally qualified candidate appears in this comparison.
- No pool freshness threshold has been adopted. This note reports ages and does not invent a normative cutoff.
- ADA/USD and ADA/USDM timestamps differ; there is no atomic cross-market snapshot.
- No redemption, issuer reserve, USD bank backing, parity, peg confidence, oracle suitability, EEV approval, or R1/Kc certificate is established.

## Next read-only gate

1. Re-observe all included pool UTxOs and ADA/USD sources in one bounded collection window; preserve raw responses, provider timestamps, block context, hashes and exact asset identities.
2. Report per-source observation age and cross-source time skew as raw measurements. Do not silently drop observations or add policy thresholds.
3. For constant-product pools, add venue-specific fee and minimum-output semantics only after checking official contract/SDK sources and reconcile them to current on-chain datum/configuration.
4. For Danogo CLMM, build a separate official-SDK quote path and test it against known SDK vectors; retain the current marginal-price result as a distinct metric.
5. Keep source categories separate: direct CEX, aggregator, test-only API, on-chain DEX pool, oracle publication, issuer redemption/attestation.
6. Update Issue #37 and the central checkpoint only with evidence-backed status; Option B remains unqualified until an operational, trusted USD/USDM source or separately governed two-leg derivation meets the existing gates.

## Scope guard

No changes to V3, Reveal, Materios, Kernel, EEV, R1/Kc, Oracle schema, `OracleQuote`, `Economic.totalUsdmValue`, MintPolicy semantics, economic constants, or normative valuation policy. No deployment, privileged approval, signature, or on-chain transaction.
