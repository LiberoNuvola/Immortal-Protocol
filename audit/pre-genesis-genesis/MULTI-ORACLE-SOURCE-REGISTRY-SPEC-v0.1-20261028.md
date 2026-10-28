# Multi-oracle source registry and verification boundary v0.1

Status: PROPOSED TECHNICAL SPECIFICATION — NON-NORMATIVE
Branch: work/immortal-green-closure
Date: 2026-10-28
Depends on: MULTI-ORACLE-IMPLEMENTATION-GAP-20261028.md

## Purpose

Define a testable adapter boundary for multiple oracle sources without approving any source, quorum, threshold, freshness bound, fallback, or USD/USDM conversion feed.

This document does not change IMMORTAL economic rules, V3, Reveal, deployed Oracle State, or transaction flows.

## 1. Registry entry

Every source registry entry must include:

- stable sourceId;
- source kind and exact verification method;
- exact feedId and base/quote asset identifiers;
- authorized key, policy/token identity, or attestation authority;
- timestamp meaning and unit;
- numeric encoding, exponent/scale, precision and arithmetic bounds;
- known shared provider or data dependencies;
- activation state and immutable policy version;
- evidence package reference and registry digest.

A feed catalog listing alone does not qualify a source for activation.

## 2. Normalized observation

A normalized observation must preserve:

- sourceId and feedId;
- exact base and quote asset identities and direction;
- raw integer value and exponent/scale;
- source publication/update timestamp, separately from observation/transport time;
- confidence/uncertainty data if supplied;
- authenticated identity and verification evidence;
- payload digest or immutable source reference;
- normalization version and policy version.

An observer-generated timestamp must not replace a missing source timestamp. A recently received response does not prove that the underlying price was recently updated.

## 3. Verification predicate

An observation is eligible only when the source is active under the requested policy version, the declared authentication method passes, the exact feed and asset pair match, the numeric encoding is valid, the source timestamp passes the approved freshness rules, and the evidence is bound to the valuation being checked.

Missing, ambiguous, malformed, stale, unauthorized or unverifiable required data must fail closed. The adapter must not silently switch to a different feed or legacy quote.

## 4. Aggregation contract

Aggregation accepts only verified observations and an immutable policy version. The eventual normative policy must specify:

- eligible source identities and dependency groups;
- quorum requirement;
- aggregation function and integer rounding;
- divergence, confidence and outlier handling;
- freshness and timestamp-coherence bounds;
- missing/stale source handling;
- duplicate and equivocation handling;
- fallback permissions, if any;
- canonical output units and price direction.

No parameter value is selected by this document.

An off-chain aggregation result requires a verifiable proof or governed attestation binding the result to the accepted observations and policy. A plain JSON result or a publisher field supplied by a datum is insufficient by itself. An on-chain aggregation must pass transaction-size and execution-budget measurement.

## 5. Canonical PriceReference

The resulting versioned reference should carry exact base/quote assets, integer mantissa and scale, algorithm/version, policy version and registry digest, accepted source identities and observation digests, source timestamps, derivation digest, evidence reference, and validity classification.

It must not imply USD/USDM parity unless a separate governed conversion observation and rule explicitly support that conversion.

## 6. USD/USDM composition

If a valuation requires ADA/USD and USD/USDM, each leg must be independently verified with exact pair direction, scale, timestamps and provenance. Composition must use exact integer/rational arithmetic and an approved rounding rule. The policy must define timestamp coherence. If either required leg is unavailable or invalid, the composed price is unavailable.

No USD/USDM source is approved here.

## 7. Required negative and conformance tests

| Test | Expected disposition |
|---|---|
| Unknown or inactive source | Reject |
| Wrong feed or reversed pair | Reject |
| Missing, stale or future timestamp | Reject under approved time policy |
| Invalid exponent or arithmetic overflow | Reject |
| Unauthorized publisher/key | Reject |
| Duplicate source observation | Never count twice by default |
| Aliases for the same underlying source | Do not count as independent by default |
| Shared data dependency | Apply the approved independence rule |
| Divergent fresh observations | Apply the approved policy; no ad hoc averaging |
| Insufficient eligible sources | Fail closed |
| Missing USD/USDM leg | Reject composed price |
| Legacy quote disagrees with candidate | No silent fallback |
| Evidence digest mismatch | Reject |
| Same inputs and policy across implementations | Identical canonical result |

## 8. Implementation sequence

1. Approve source identities, feed IDs and verification methods.
2. Approve aggregation and USD/USDM policies.
3. Implement adapter parsing and verification tests.
4. Add Plutus ledger-level positive/negative vectors that bind the exact source observations.
5. Compare adapter and Plutus results for identical evidence.
6. Measure datum/transaction size and execution budget.
7. Qualify selected source state on Preprod read-only.
8. Consider production consumer changes only after evidence review and explicit approval.

## 9. Open governance decisions

Source identities and feed IDs; verification method; dependency classification; quorum and aggregation function; divergence/confidence handling; freshness and timestamp-coherence bounds; USD/USDM source; rounding rule; on-chain versus proof/attestation architecture; migration and activation procedure.

## Non-regression

Preserve legacy datum decoding until a separately approved migration. Do not treat multi-asset quote storage as multi-oracle aggregation. Do not change kernel semantics, economic constants, V3 or Reveal. Do not create a new branch, mutate live Oracle State, or initiate a transaction or deployment approval.

Conclusion: this is a testable design boundary, not authorization to accept new sources or replace the current Oracle State path.
