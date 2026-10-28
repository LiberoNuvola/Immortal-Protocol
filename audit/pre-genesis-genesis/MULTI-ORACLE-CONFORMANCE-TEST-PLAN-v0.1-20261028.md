# Multi-oracle conformance test plan v0.1 — 2026-10-28

**Status:** AUDIT / TEST PLAN — NON-NORMATIVE  
**Branch:** `work/immortal-green-closure`  
**Related:** `MULTI-ORACLE-IMPLEMENTATION-GAP-20261028.md`; `MULTI-ORACLE-SOURCE-REGISTRY-SPEC-v0.1-20261028.md`; `docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md`; `PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md`.

## Purpose and guardrails

Turn the source-registry proposal into a bounded implementation/test backlog while preserving the existing economic kernel and current deployed Oracle State path. This plan does not authorize source activation, quorum, an aggregation algorithm, USD/USDM feed selection, schema migration, or a production consumer change.

No changes to V3, Reveal, economic constants, legacy Oracle datum semantics, or on-chain state are authorized by this plan. No new branch is required.

## What current tests actually establish

Inspection of `plutus/test/EconomicOracleTest.hs`, `plutus/OracleTypes.hs`, and `plutus/Economic.hs` on this branch shows that the current suite covers:
- legacy single-quote decoding and timestamp/publisher checks through `oraclePriceFor`;
- a single `OracleQuoteSet` holding multiple asset quotes;
- rejection of duplicate quotes for the requested asset;
- per-asset lookup and fail-closed behavior when a required quote is missing;
- the current configured Oracle State remaining the authoritative price path in the existing characterization case;
- integer ceiling conversion and basket valuation cases.

These tests do **not** demonstrate multiple independent oracle-source aggregation. `OracleQuoteSet` is a multi-asset container; `oraclePriceFor` still receives one configured publisher and accepts a matching quote under that publisher. Nor do these tests qualify Pyth, a USD/USDM source, source independence, quorum, or a governed aggregation result.

## Test layers

### Layer A — policy-independent parsing and canonicalization (can be implemented without choosing governance parameters)

| ID | Input / fault | Required assertion |
|---|---|---|
| A01 | Unknown `sourceId` | Registry lookup fails; no implicit registration |
| A02 | Inactive source | Observation cannot enter verified set |
| A03 | Feed ID mismatch | Reject |
| A04 | Base/quote identity mismatch | Reject |
| A05 | Reversed pair direction | Reject; do not auto-invert |
| A06 | Missing source publication timestamp | Reject; transport time cannot substitute |
| A07 | Timestamp unit/encoding mismatch | Reject |
| A08 | Malformed price, exponent, or scale | Reject |
| A09 | Unsupported integer bounds / overflow | Reject before canonical output |
| A10 | Authentication evidence absent or invalid | Reject |
| A11 | Evidence digest differs from payload | Reject |
| A12 | Duplicate observation for same source/feed/time | Never count as a second independent source |
| A13 | Same source under two aliases | Independence classifier must not count aliases as independent by default |
| A14 | Deterministic identical inputs, registry and policy versions | Byte-identical canonical output |
| A15 | Legacy quote and candidate quote disagree | No implicit fallback or precedence change |

These tests should target a pure parser/normalizer/verifier boundary. They must not mutate `OracleTypes`, `Economic.totalUsdmValue`, MintPolicy, or the live singleton merely to make the tests pass.

### Layer B — policy-injected verification (test framework can be prepared now; expected values require approved policy)

The verifier should accept an explicit immutable policy object. Tests must not embed guessed policy defaults. For each case below, use a test-supplied policy and assert that the verifier follows that policy exactly:

- freshness window and future timestamp allowance;
- maximum timestamp skew between observations;
- eligible source IDs and dependency groups;
- quorum threshold;
- divergence/confidence/outlier rule;
- missing/stale-source disposition;
- duplicate/equivocation disposition;
- canonical scale, rounding and output direction;
- approved fallback permissions (default remains none unless explicitly governed).

Until those policy fields are approved, tests must label the expected outcome as **policy-unresolved**, not silently encode a value in production or call it normative.

### Layer C — USD/USDM composition (blocked on source and representation contract)

Option B is selected: USD/USDM must be verified separately; parity is not authorized. Do not implement a production conversion until exact source/feed, pair direction, timestamps/coherence, precision, exponent bounds, arithmetic limits and final rounding are approved.

Once approved, differential test vectors must cover:
- both legs valid and time-coherent;
- either leg missing, stale, future-dated or unauthenticated;
- reversed USD/USDM direction;
- non-unit USD/USDM rate (to catch accidental parity);
- zero/negative price and unsupported exponent;
- integer overflow and ceiling-rounding boundaries;
- mismatched observations and digest/policy-version mismatch;
- identical Haskell and TypeScript canonical results.

### Layer D — ledger integration (blocked on Layers B/C and explicit approval)

Only after the policy and source contracts are approved:
1. Bind accepted source evidence to the exact transaction/reference input.
2. Add native-ledger positive and negative vectors for the approved representation.
3. Compare adapter and Plutus results from identical evidence.
4. Measure serialized transaction size and execution budget.
5. Run read-only Preprod qualification and preserve evidence artifacts.
6. Review any production consumer migration separately; no implicit legacy fallback.

## Acceptance gates

- [ ] Layer A parser/normalizer tests pass without changing economic semantics.
- [ ] Each Layer B policy field has an explicit approved owner/version and tests.
- [ ] USD/USDM source and versioned rational representation are approved (Option B).
- [ ] Haskell/TypeScript differential vectors agree exactly.
- [ ] Native-ledger size/budget measurements pass for the proposed carrier.
- [ ] Source qualification evidence is reproducible and bound to registry/policy digests.
- [ ] Explicit review authorizes any production consumer change.

## Current disposition

**Proceedable:** source-registry types, parser/normalizer boundary, digest binding and policy-injected test scaffolding.  
**Not yet authorized:** choosing sources/feed IDs, quorum, aggregation/rounding/freshness values, USD/USDM provider, fallback, or modifying production price consumers.  
**Current on-chain Oracle State:** do not replace or refresh synthetically as part of this work. A stale source remains stale and must continue to block actions requiring it.
