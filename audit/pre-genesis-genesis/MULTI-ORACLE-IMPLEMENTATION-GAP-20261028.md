# Multi-oracle implementation gap — 2026-10-28

**Status:** READ-ONLY CODE AUDIT / NON-NORMATIVE DESIGN PROPOSAL  
**Branch:** `work/immortal-green-closure`  
**Scope:** Oracle consumer wiring and a safe path toward multiple independently verified sources.  
**Explicit exclusions:** no economic rule changes, no threshold/quorum choice, no live transaction, no deployment approval, no V3/Reveal edits.

## 1. Findings from the current source

### Existing support: multiple asset quotes in one Oracle State datum

`Adapter/CARDANO/observation/OracleTypes.hs` defines:
- the legacy five-field `OracleDatum`;
- `OracleQuote`, with asset policy/name, integer price, timestamp and publisher;
- additive `OracleQuoteSet [OracleQuote]`;
- `lookupOracleQuote`, which treats a duplicate match for the same asset identity as ambiguous and returns `Nothing`.

This is multi-asset quote storage, not yet multi-oracle aggregation.

### Current consumer is still single-publisher

`plutus/Economic.hs` resolves each requested asset through `oraclePriceFor`. The resolver requires the configured Oracle State singleton to be present in the reference input, then accepts a matching quote only when:
- its publisher equals the single `PubKeyHash` passed by the caller;
- its timestamp is not after the transaction validity upper bound and is within `maxOracleAge`;
- its price is non-negative.

The current signature accepts one authorized publisher, not a governed set of independent publishers. Therefore a quote set containing observations from different publishers cannot currently be consumed as a quorum: quotes from other publishers are rejected.

### Consumer map established by source search

`Economic.totalUsdmValue` is used by:
- `plutus/MintPolicy.hs` for the Treasury payment equality;
- `plutus/B1PrizePool.hs` for pool valuation;
- `plutus/PrizeValidator.hs` for settlement valuation.

These are protocol-critical consumers. A future change to oracle resolution must be checked for consistent behavior across all three, with differential/conformance tests. The universal IMMORTAL kernel should remain valuation-agnostic.

### Existing regression evidence

`plutus/test/EconomicOracleTest.hs` includes:
- legacy single-quote rejection for a mixed-asset basket without all required quotes;
- a positive multi-asset `OracleQuoteSet` basket case;
- duplicate quote identity rejection;
- a characterization test named `runLegacyOracleStateRemainsSoleConfiguredPriceSourceCase`, which explicitly documents that the current configured Oracle State remains authoritative even when an unqualified candidate quote disagrees.

The last test documents an integration gap; it is not proof of Pyth verification or multi-oracle aggregation.

## 2. Design boundary

The existing singleton NFT can remain the unique state container. A datum may carry several source observations, but each observation needs its own source identity and provenance. The consumer must not simply accept any datum-provided publisher: the authorized source set and the aggregation policy must be fixed by a protocol-governed verification predicate.

A multi-oracle implementation must distinguish:
1. **Source authenticity:** why each source observation is authoritative and bound to the correct asset/feed.
2. **Freshness:** each observation's publication/update time and any approved timestamp-skew rule.
3. **Unit semantics:** exact asset identity, price direction, scale/exponent and USD/USDM conversion.
4. **Independence:** evidence that sources are not merely duplicated views of the same underlying publisher/data.
5. **Aggregation:** deterministic policy and version, including treatment of missing, stale, duplicate, divergent and out-of-range observations.
6. **On-chain binding:** the exact accepted transaction must use the verified observations and the approved derived value, not fall back to a different legacy quote.
7. **Resource feasibility:** datum/transaction size, Plutus execution budget and Cardano transaction-size limit.

## 3. Candidate architecture (proposal only)

`SourceObservation[] -> SourceVerification -> Freshness/Unit checks -> Governed AggregationPolicy -> Canonical PriceReference -> Economic valuation`

The canonical price reference should be deterministic, versioned and reproducible. If an aggregator is computed off-chain, its result alone is insufficient: the on-chain verifier must validate a proof/attestation whose trust model is explicitly governed. Otherwise, an on-chain deterministic aggregator may consume individually authenticated source observations, subject to transaction-size and execution-cost limits.

Do not choose quorum size, maximum deviation, freshness windows, timestamp skew, source weights, or fallback behavior in this document. These are policy parameters requiring a separate normative decision and evidence-based justification.

## 4. USD/USDM remains a separate unresolved source gate

The repository decision `audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md` records Option B: verify USD/USDM separately. The source and implementation contract remain open. An ADA/USD quote must not be relabelled as ADA/USDM, and no implicit 1:1 parity may be assumed.

Both conversion legs must have exact pair direction, unit/scale semantics, timestamps and a governed rule for temporal coherence. Missing or invalid either leg must fail closed.

## 5. Recommended next implementation gates

1. Freeze a source registry data model and verification predicate without selecting quorum/threshold values.
2. Specify a versioned `PriceReference` representation preserving raw source units, timestamp and provenance; do not truncate prices before the canonical final conversion.
3. Add unit tests for source identity, unauthorized publisher, stale/future observations, duplicates, divergent observations, missing legs, incorrect pair direction and fallback-to-legacy attempts.
4. Add Plutus ledger-level positive/negative vectors for the exact transaction-bound source observations and compare results against the TypeScript adapter.
5. Measure script size, transaction CBOR size and execution budget before any integration into production consumers.
6. Only after the source contract and policy are approved, update all affected consumers and run the existing conformance/Preprod qualification workflows.

## 6. Non-regression rules

- Do not change IMMORTAL economic constants or kernel semantics.
- Do not alter V3 or Reveal.
- Do not infer USD/USDM parity.
- Do not treat a multi-asset quote set as evidence of multiple independent oracles.
- Do not bypass stale Oracle State by inserting a fresh-looking timestamp or selecting an unqualified candidate.
- Do not create a new branch or submit/approve an on-chain transaction as part of this audit.

## Conclusion

The repository has a useful additive data structure for multiple asset quotes, but the currently inspected valuation path still authorizes one configured publisher. The next engineering task is therefore not to bolt on more feeds: it is to specify and test the governed source-verification and aggregation boundary, while preserving the existing single-oracle path until the new path is qualified.

## 7. Follow-up contracts recorded on 2026-10-29

The subsequent adapter-level audit refined the authority and liveness gaps without approving a source, governance model, threshold, or production integration:

- [Multi-Oracle Registry Currentness Contract v0.1](MULTI-ORACLE-REGISTRY-CURRENTNESS-CONTRACT-v0.1-20261029.md): defines the proposed exact registry-head/currentness binding, revocation checks, and fail-closed boundary. A production-authoritative currentness provider remains unimplemented.
- [Multi-Oracle Authority Decision Gate Recommendation v0.1](MULTI-ORACLE-AUTHORITY-DECISION-GATE-RECOMMENDATION-v0.1-20261029.md): recommends investigating proof-backed, ledger-verifiable registry state while keeping the authority gate open until the update-authorization predicate can be independently verified.
- [Multi-Oracle Liveness Report Contract v0.1](MULTI-ORACLE-LIVENESS-REPORT-CONTRACT-v0.1-20261029.md): proposes a non-authoritative report separating registry currentness, endpoint availability, observation integrity, measured freshness, optional divergence, and downstream policy evaluation.

These are follow-up proposals, not implementation approval. They do not change the earlier constraints: no source/feed activation, no aggregation or freshness/divergence threshold, no fallback or USD/USDM conversion, and no changes to the economic kernel, V3, Reveal, EEV or Issue Admission. The liveness report must not be used as source-admission authority or as an automatic fallback selector.

