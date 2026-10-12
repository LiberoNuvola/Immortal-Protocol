# IMMORTAL ↔ Aegis Conformance Bridge v1

**Status:** research fixture contract; not certified and not a deployment claim.
**Target integration branch:** `b1-hardening`
**Aegis source inspected:** `realdecimalist/aegis-contracts` `main` at commit `6549246ff053457c93e6d68e44791efa2ef2f972`; file blob SHAs below identify the inspected source.
**Aegis source anchors:** `contracts/validators/pool_vault.ak` blob `b36f7579bf81fc82a84841718f91cd0cfd3245cd`; `contracts/lib/aegis/vault.ak` blob `4f3f948ec2cd25a4b2669b0ee8938c83a44bd5cb`; `contracts/lib/aegis/test_helpers/fixtures.ak` blob `e5c54c0fcc8ac931ea170799ce61fac415ef1485`.
**Universal kernel source:** imported from `work/b3-materios-provenance-evidence`; on `b1-hardening`, `UniversalEconomicState.hs` blob `f89fe04c8aad8ca9c5e544fa9c145a38d157826f` and `UniversalEconomicKernel.hs` blob `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785`.

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

## 7. Source-grounded fixture inventory and compatibility gate

The following Aegis artifacts were inspected on `main`:

- `contracts/lib/aegis/test_helpers/security_tests.ak`, blob `97a77c1dc86aed96c5494aa854af4d23e92c2635`: Aiken-native regression tests. Its A-001 case explicitly checks that Claim payout equals the consumed policy's `coverage_amount` and that the policy targets the pool being drained.
- `docs/audit/round-9-T2/symbolic_executor/tests/fixtures/underwrite_positive.json`, blob `aeb93446488878e93ccb4f45fd62813fb28fe625`.
- `docs/audit/round-9-T2/symbolic_executor/tests/fixtures/underwrite_negative_A024_negative_coverage.json`, blob `1228ca8c3504555a685a8657ef77a2c5abac924b`.
- `docs/audit/round-9-T2/symbolic_executor/tests/fixtures/process_claim_positive.json`, blob `b537409679d618c4d0073d250fa6a9717a7c2115`.
- `docs/audit/round-9-T2/symbolic_executor/tests/fixtures/process_claim_negative_overpayment.json`, blob `0de7accf9982aa21f7a9724aa2ee2b3f595e1616`.

**Compatibility finding:** the symbolic JSON fixtures use the older `PoolDatum` shape (`total_liquidity`, `active_coverage`, `lp_supply`) and the legacy ProcessClaim/Underwrite flow. The currently inspected V8 `pool_vault.ak` uses `VaultState` with `lp_supply`, `active_coverage`, `reserve`, and a registry NFT; its Underwrite/Claim/Expire arms call the pure predicates in `aegis/vault.ak`. Therefore these JSON fixtures are useful as adversarial intent/reference examples, but **must not be presented as direct fixtures for the current V8 validator** or fed into a differential harness without an explicit version adapter.

**Current-V8 discovery:** the current `pool_vault.ak` does contain wired `Underwrite`, `Claim`, and `Expire` arms that call `underwrite_ok`, `claim_ok`, and `expire_ok`. This is more specific than the stale WIP wording in the introductory comments of `vault.ak`. The validator arms are present in the inspected commit; this inspection is not a claim that Aiken tests or a full transaction simulation were executed.

A first set of source-grounded accounting fixtures has now been added under `docs/research/fixtures/`:

- `AEGIS-V8-UNDERWRITE-ACCOUNTING-HAPPY-001.json` — source test `underwrite_happy_path`, including continuation, backing, pool-total, accumulation-cap, and policy-funding arithmetic.
- `AEGIS-V8-CLAIM-ACCOUNTING-HAPPY-001.json` — source test `claim_happy_path`, including payout equality, active-coverage reduction, zero-reserve draw, and marker burn.
- `AEGIS-V8-CLAIM-RESERVE-FIRST-001.json` — source test `claim_draws_reserve_first`, exercising `min(payout, reserve)` and the reserve reduction.
- `AEGIS-V8-EXPIRE-ACCOUNTING-HAPPY-001.json` — source test `expire_returns_coverage_and_burns_marker`, including full policy return, coverage release, unchanged reserve/supply, and marker burn.
- `AEGIS-V8-ACCOUNTING-ADVERSARIAL-001.json` — negative Claim-underpayment and Expire-skim cases sourced from `claim_rejects_payout_not_equal_coverage` and `expire_rejects_skimmed_return`.

Each pins the Aegis repository commit and source blob. These are **source-grounded predicate-accounting fixtures**, not full validator transaction fixtures, and the JSON has not yet been consumed by a runnable harness. Their IMMORTAL projection remains `UNVERIFIABLE` pending the qualified-value profile.

**Source-comment inconsistency to resolve:** around `claim_ok`, a comment says reserve-first handling is not modelled and Claim stays fail-closed, but the current function body computes `from_reserve = min(payout, reserve)` and enforces `nr == reserve - from_reserve`; current validator code also contains a Claim arm invoking `claim_ok`. This discrepancy is recorded as a source-documentation issue, not silently interpreted as a behavioral failure or proof that the full transaction path passes.

An initial standard-library Python harness now exists at `scripts/aegis_immortal_fixture_harness.py`, with a CI workflow at `.github/workflows/aegis-immortal-fixtures.yml`. Run it from the repository root with `python3 scripts/aegis_immortal_fixture_harness.py`. It checks fixture schema, arithmetic equations, transition deltas, marker quantities, reserve-first arithmetic, and the two adversarial cases' intended violated invariants. It deliberately does **not** claim to execute Aiken or the full validator, and it preserves `immortal_projection: UNVERIFIABLE`. This is fixture-consistency validation, not yet a differential harness. Next: run it in CI/local checkout, then wire source predicates into executable Aiken tests and expand negative cases around reserve deltas, marker quantities, and over-release. No Aegis source files have been modified by this bridge work.

## 6. Exit criteria

The bridge is not ready to certify until:
- a profile freezes the mapping of Aegis values to universal fields without double counting;
- fixtures are extracted from actual Aegis predicates/tests rather than hand-waved summaries;
- a runnable harness compares canonical pre/post states;
- positive and adversarial cases execute in CI;
- mismatches are classified as reference, fixture, projection, adapter, or chain-evidence defects.

**Current result:** the universal state and kernel have been imported and the kernel test suite is registered on `b1-hardening`; its explicit Prelude import was corrected, but the suite has not been executed here because this environment cannot resolve `github.com` to clone the repository. Current-V8 Underwrite, Claim (including reserve-first), Expire, and two adversarial accounting cases are recorded as JSON fixtures. A fixture-consistency harness has been committed at `scripts/aegis_immortal_fixture_harness.py` and a dedicated GitHub Actions workflow has been added, but a successful run has **not** yet been verified in this session; it is not a differential harness or an Aiken test. Aegis source fixtures have a pinned source commit and their legacy/V8 schema mismatch is documented; the bridge remains research-only until the harness is executed, Aiken predicates/validator tests run, an approved economic mapping exists, and a genuine differential harness is completed.
