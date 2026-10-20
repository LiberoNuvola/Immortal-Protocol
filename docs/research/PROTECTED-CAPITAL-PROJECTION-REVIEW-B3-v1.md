# IMMORTAL — ProtectedCapital Projection Review (B3)

**Branch:** `work/b3-materios-provenance-evidence`  
**Classification:** non-normative implementation/conformance review  
**Date:** 2026-10-20  
**Scope:** R2 of `ADVERSARIAL-REVIEW-TRACEABILITY-B3-v1.md`. Read-only review of the existing projection and tests; no economic semantics or implementation code changed.

## 1. Finding

The present implementation provides a meaningful **PRE-RICH V3 → UniversalEconomicState aggregate-equivalence check**, including negative cases for malformed class aggregates. It does not, by itself, prove the universal C17 accounting obligation for every possible profile or deployment, nor authenticate the origin of the projected values.

The distinction is important:
- the projection tests can establish that this PRE-RICH profile maps the tested V3 states into the same ProtectedCapital/RawSurplus/solvency result;
- the normative universal partition requires exhaustive, pairwise-disjoint representation of all protected economic content;
- authenticity, freshness, authority and completeness of the source state/EEV are separate evidence-boundary obligations.

## 2. Field-to-boundary map

| Source / field | Projection destination | Included directly in universal ProtectedCapital? | Current interpretation / check |
|---|---|---:|---|
| `v3CrystallizedLiabilities` | `uesCrystallizedLiabilities` | Yes | Direct protected liability; negative value rejected. |
| Class `price × unresolved` aggregate | `uesUnresolvedReserve` | No, not directly | Accounting aggregate preserved and checked against `v3UnresolvedReserve`. It is not automatically added to ProtectedCapital because the maximum exposure is separately represented. |
| Sum of class unresolved counts | `uesUnresolvedTicketCount` | No | Structural/accounting aggregate; checked against `v3UnresolvedTicketCount`. |
| Profile payout multiplier × class price × unresolved count | `uesWorstCaseExposure` | Yes | Independently derived from profile bound and class state; class-level stored exposure is checked against `price × unresolved`. Unknown/duplicate classes and inconsistent totals fail closed. |
| `v3SafetyCapital` | `uesSafetyCapital` | Yes | Direct component; non-negativity checked. |
| `v3ReserveProtection` | `uesReserveProtection` | Yes | Direct component; non-negativity checked. |
| `v3MandatoryFutureCosts` | `uesMandatoryFutureCosts` | Yes | Direct component; non-negativity checked. |
| `jsLockedAmount (v3Jackpot)` | `uesAdditionalProtectedCapital` | Yes | Locked Jackpot amount crosses the boundary as a protected amount; Jackpot lifecycle/status remains application-specific. Non-negativity checked. |
| Class identifiers, issuance/caps/saleability, control/history, Jackpot status/threshold/cycle | Not projected as universal fields | No | Remain PRE-RICH profile/application state. They may affect derivation/validation before projection but are not universal kernel semantics. |
| EEV | Separate argument to boundary-equivalence check / kernel | Not part of ProtectedCapital | Must come from an authoritative, fresh and appropriately qualified observation; projection alone cannot authenticate it. |

## 3. Accounting equation represented by the code

The universal implementation computes:

`ProtectedCapital = crystallizedLiabilities + worstCaseExposure + safetyCapital + reserveProtection + mandatoryFutureCosts + additionalProtectedCapital`

The implementation does **not** directly add `unresolvedReserve` to that sum. The code treats it as a separate accounting aggregate and protects unresolved units through the derived `worstCaseExposure`. This is not evidence of a missing term by itself; adding both without a normative reason could double-count the same unresolved economic content.

For PRE-RICH, the intended relationship is:
- `unresolvedReserve = Σ(price(class) × unresolved(class))`;
- `worstCaseExposure = Σ(profile.maxNormalPayoutMultiplier × price(class) × unresolved(class))`;
- crystallized liabilities represent already committed payouts;
- the remaining protected components represent separately classified non-discretionary capital.

The profile-specific multiplier is not universal IMMORTAL law. The Notion Economic Canon register explicitly treats 500× as PRE-RICH policy and the exposure bound as supplied by the profile.

## 4. Existing executable evidence found

The branch contains `plutus/test/ProtectedCapitalConformanceTest.hs` and `plutus/test/ProjectionBoundaryConformanceTest.hs`. Their visible assertions include:
- exact preservation of all projected aggregate fields;
- `ProtectedCapital` partition arithmetic with an omission rejected;
- Issue increases worst-case exposure by the profile payout bound;
- Reveal exchanges unresolved worst-case exposure for crystallized liability without changing ProtectedCapital in the maximum-payout case;
- Claim decreases ProtectedCapital by the settled liability;
- Expire releases the unresolved exposure;
- mismatched unresolved reserve/count, duplicate classes, unknown classes, inconsistent class exposure and negative protected components fail closed;
- locked Jackpot value projects into `uesAdditionalProtectedCapital`;
- the V3 and universal ProtectedCapital/RawSurplus/solvency functions agree on tested fixtures.

These are valuable differential/conformance tests. This review did **not** execute the test suite, so it does not claim a fresh passing CI result.

## 5. Remaining gaps (specific, not speculative)

1. **Partition-to-field completeness:** the tests prove selected fixtures and arithmetic identities, not a universal proof that every profile's protected content is represented exactly once. Keep C17 classified as a conformance obligation.
2. **Source authority and freshness:** the projection accepts a V3 state and profile. It does not itself prove that those values came from canonical, authenticated, fresh observations. That binding must be evidenced upstream.
3. **Overflow / arithmetic domain:** the reviewed Plutus kernel uses `Integer`, but cross-runtime and adapter realizations still need explicit arithmetic/encoding bounds and equivalent vectors; this file alone does not close multi-chain arithmetic portability.
4. **Deployment-specific non-vacuity and Ω:** equality of accounting functions does not prove `K_c` is non-empty or that Ω is authoritative and complete.
5. **Statistical reserve:** the current mapping does not imply that a statistical reserve is interchangeable with deterministic worst-case exposure. Any such profile policy must be explicit and must not weaken the universal protection predicate.

## 6. R2 status

**Status: PARTIALLY EVIDENCED — PRE-RICH projection equivalence has concrete test coverage; universal accounting completeness and authenticated source binding remain open conformance obligations.**

### Next action
Proceed to R3: trace the authoritative Ω / verified economic observation into the actual execution-admissibility boundary, and identify which tests prove fail-closed behavior versus which remain only interface-level contracts.

## Sources

- [UniversalEconomicState.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/IMMORTAL/state/UniversalEconomicState.hs)
- [UniversalEconomicKernel.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/IMMORTAL/kernel/UniversalEconomicKernel.hs)
- [PreRichEconomicProjection.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/PRE-RICH/onchain/PreRichEconomicProjection.hs)
- [ProtectedCapitalConformanceTest.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/plutus/test/ProtectedCapitalConformanceTest.hs)
- [ProjectionBoundaryConformanceTest.hs](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/plutus/test/ProjectionBoundaryConformanceTest.hs)
- [IMMORTAL Economic Canon & Parameter Boundary Register v0.1](https://app.notion.com/p/3e2c4454d6d581e39ad6e764d162dbd7?pvs=204)
