# IMMORTAL ↔ Aegis Conformance Bridge v1

**Status:** research fixture contract; not certified and not a deployment claim.
**Target integration branch:** `b1-hardening`
**Aegis source inspected:** `realdecimalist/aegis-contracts` `main` at `6549246ff053457c93e6d68e44791efa2ef2f972`.
**Universal kernel source:** imported from `work/b3-materios-provenance-evidence`; see `UniversalEconomicState` and `UniversalEconomicKernel`.

## 1. Purpose and boundary

This contract defines what the first cross-project conformance tests must compare. It does not rewrite Aegis, reinterpret its validator, or promote Aegis accounting quantities to IMMORTAL normative fields without a declared profile.

Aegis remains the authority for its on-chain transition predicates. IMMORTAL supplies a chain-neutral economic invariant boundary. The bridge must compare canonical economic meaning after each transition, not merely terminal balances.

## 2. Accounting mapping is intentionally not inferred

The following values are **not interchangeable by name alone**:

- Aegis `backing`, `active_coverage`, `reserve`, `pool_total`, and LP supply;
- IMMORTAL EEV, unresolved reserve, worst-case exposure, crystallized liabilities, and ProtectedCapital.

In particular, do not set EEV equal to `pool_total(backing, active_coverage)` without an explicit qualified-value profile. Do not count an individual policy's coverage UTxO and the aggregate `active_coverage` counter as two obligations. Before an executable economic projection is certified, the profile must specify asset denomination, qualified UTxO/value perimeter, liability partition, reserve treatment, and evidence source.

The universal kernel currently defines:

`ProtectedCapital = crystallizedLiabilities + worstCaseExposure + safetyCapital + reserveProtection + mandatoryFutureCosts + additionalProtectedCapital`

The bridge must assign each protected obligation to exactly one component. If the evidence cannot distinguish unresolved reserve from worst-case exposure, the projection is `UNVERIFIABLE`, not a guessed sum.

## 3. Transition conformance matrix

| Aegis transition | Aegis-side invariants to capture | IMMORTAL cross-check |
|---|---|---|
| Underwrite | coverage and premium positive; net growth non-negative; exact vault lovelace continuation; active coverage increases by the policy coverage; LP supply and reserve remain unchanged; policy marker increases once; policy UTxO covers its coverage | projected post-state is non-negative; obligations are represented once; compare pre/post canonical state and declared liability/exposure delta |
| Claim | payout equals policy coverage; payout does not exceed active coverage; exact vault continuation equation; active coverage decreases by payout; LP supply unchanged; reserve draw follows Aegis rule; marker decreases once; validator's oracle, destination, freshness and alias predicates hold | obligation is released/crystallized according to the profile; protected-capital delta is explained; no double counting and no unexplained value creation |
| Expire | coverage is positive and no greater than active coverage; exact continuation equation; active coverage decreases by coverage; LP supply and reserve unchanged; marker decreases once; lower validity bound is strictly after expiry | expired obligation is removed exactly once; no payout is invented; post-state remains non-negative and satisfies any declared solvency gate |

These are differential-test obligations, not a claim that a test has already run.

## 4. Required fixture shape

Each fixture should include:

- source commit and validator/test identity;
- initial state and authenticated inputs;
- transition and redeemer;
- Aegis pre-state/post-state projections;
- IMMORTAL pre-state/post-state projections;
- exact asset units and qualified-value perimeter;
- expected classification and evidence references.

Compare after every transition. A final-state-only comparison can hide divergence followed by reconvergence.

## 5. Required negative cases

1. Underwrite where the continuation lovelace equation is off by one.
2. Underwrite where aggregate active coverage changes but the policy UTxO does not back the new coverage.
3. Claim whose payout differs from the policy coverage.
4. Claim where the policy coverage and aggregate active coverage are accidentally counted twice in the IMMORTAL projection.
5. Expire at the expiry boundary, not strictly after it.
6. Negative or stale economic evidence, or a missing qualified-value perimeter.
7. A projection that makes the same obligation appear in both unresolved reserve and worst-case exposure.
8. Any post-state where EEV is below ProtectedCapital, once the profile has authoritatively defined EEV.

## 6. Exit criteria

The bridge is not ready to certify until:
- a profile freezes the mapping of Aegis values to universal fields without double counting;
- fixtures are extracted from actual Aegis predicates/tests rather than hand-waved summaries;
- a runnable harness compares canonical pre/post states;
- positive and adversarial cases execute in CI;
- mismatches are classified as reference, fixture, projection, adapter, or chain-evidence defects.

**Current result:** the universal state and kernel have been imported and their local kernel test suite has been registered. The Aegis transition bridge remains research-only until the mapping and runnable differential fixtures are completed and executed.
