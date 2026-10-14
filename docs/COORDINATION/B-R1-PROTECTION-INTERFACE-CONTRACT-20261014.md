# B-R1 — Risk Assessment → Protection Requirement: interface contract and conformance matrix

**Date:** 2026-10-14  
**Branch:** work/immortal-green-closure  
**Status:** CONTRACT DRAFT — NON-SEMANTIC; IMPLEMENTATION NOT CLOSED  
**Related audit:** [B-R1 Protection Bridge Audit](./B-R1-PROTECTION-BRIDGE-AUDIT-20261014.md)

## 1. Purpose and scope

This document turns the existing canonical B-R1 boundary into an implementable contract and test matrix. It does **not** choose a new risk formula, change the PRE-RICH payout cap, introduce a regime selector, or modify V3/Reveal semantics.

Canonical chain:

Candidate trajectory → Risk Assessment → Protection Requirement → ProtectedCapital → RawSurplus → CAR → Allocation Admissibility → Economic Gate → Viability → Atomic Transition

B-R1 owns only the mapping from declared risk-assessment outputs to a protection requirement. B-R2 owns the composition and provenance of ProtectedCapital; downstream gates remain authoritative for admissibility.

## 2. Normative constraints inherited from the canon

1. **Worst-Case Analysis and Statistical Risk Analysis are distinct mechanisms.**
2. **The PRE-RICH 500× payout cap remains an application-level parameter** unless the canonical decision register changes it. It must not be silently removed or discounted by this interface.
3. No universal WorstCase + StatisticalReserve formula is introduced.
4. A statistical output such as N·μ + Z·σ·√N is not, by itself, a deterministic guarantee over all admissible outcomes.
5. A deterministic bound does not become a statistical estimate merely because a probability model exists.
6. Where both mechanisms apply to a trajectory, the applicable profile must declare their roles, common units, horizon/perimeter, assumptions, and non-double-counting rule before both can constrain admissibility.
7. Statistical capital is not automatically a constitutional hard barrier and cannot silently substitute for a deterministic requirement.
8. Unknown, stale, unauthenticated, incomplete, or profile-incompatible evidence must not weaken an already-required protection.
9. The adapter does not select the risk model or authorize an economically unsafe action.
10. The interface must preserve the source-of-truth hierarchy and must not promote historical/proposed AWRA or risk-envelope behavior into canonical policy.

## 3. Contract boundary

The bridge must be a pure, deterministic derivation over authenticated inputs. Its output must be traceable to the candidate trajectory and the applicable declared profile.

### Required input categories

| Input | Minimum requirement |
|---|---|
| Candidate trajectory | Identified pre-state, proposed action, and candidate post-state; same trajectory identity used by downstream admission |
| Applicable profile | Stable profile/version identity and declared scope |
| Worst-case assessment | Either a valid bound with its exposure perimeter and derivation provenance, or an explicit not-applicable status justified by the profile |
| Statistical assessment | Either a valid model output with model/version, horizon, distribution/assumptions, confidence criterion, units, and provenance, or an explicit not-applicable status |
| Evidence quality | Authentication, freshness, completeness, and consistency status for every assessment used |
| Combination semantics | Profile-declared role and non-double-counting rule whenever multiple outputs constrain the same trajectory |

A missing field is not equivalent to zero, safe, or not applicable. “Not applicable” must be explicit and justified by the applicable profile.

### Required output categories

The bridge must produce a typed, auditable result containing:

- candidate trajectory identity and applicable profile/version;
- the risk-assessment mode(s) actually applied;
- references to each assessment and its provenance;
- the derived protection requirement, including units and scope;
- the rule/version that derived the requirement;
- an explicit outcome: Accepted, Rejected, or Indeterminate;
- a machine-checkable reason code for Rejected and Indeterminate.

This is a shape contract, not a declaration of final Haskell type names. Concrete types must follow the repository's existing serialization, Plutus, and canonicalization constraints.

## 4. Required behavior

- A valid deterministic assessment must continue to enforce the profile-declared worst-case bound wherever current rules require it.
- A statistical assessment may affect the protection requirement only according to an explicit applicable profile rule. The bridge must not invent thresholds, coefficients, confidence levels, or fallback values.
- If both assessments apply, the bridge must use only the declared combination semantics. It must not add, max, substitute, or otherwise combine values by an undocumented default.
- Invalid or absent evidence cannot lower protection or turn an indeterminate result into an accepted transition.
- The resulting requirement must be passed into the B-R2 composition of ProtectedCapital; its components must remain provenance-traceable and non-overlapping.
- The candidate post-state must still pass the existing Economic Gate and viability checks. B-R1 cannot bypass, replace, or weaken them.
- No transition is authorized by the bridge alone; final admission and atomic execution remain downstream responsibilities.

## 5. Conformance matrix

| ID | Scenario | Required result | Evidence / assertion |
|---|---|---|---|
| BR1-01 | PRE-RICH profile declares deterministic worst-case protection; valid assessment | Requirement preserves the declared bound | Requirement traces to profile/version and assessment |
| BR1-02 | Statistical output changes while deterministic inputs and applicable profile rule remain unchanged | Deterministic protection does not decrease merely because the statistical output changed | Differential test over requirement and resulting ProtectedCapital |
| BR1-03 | Statistical-only model output is present but the profile does not authorize it to replace deterministic protection | No substitution; existing deterministic requirement remains | Negative substitution test |
| BR1-04 | Both assessments are applicable and profile declares their semantics | Apply exactly the declared rule; do not infer a universal additive formula | Golden vector plus rule/version trace |
| BR1-05 | Both assessments are present but combination semantics are absent or ambiguous | Indeterminate / fail closed for the affected transition | Negative test; no lower protection emitted |
| BR1-06 | Required assessment missing, stale, unauthenticated, malformed, or profile-incompatible | Indeterminate or Rejected; never treat missing data as zero | One negative vector per failure class |
| BR1-07 | Profile or derivation version unknown | Reject/indeterminate; no default profile or implicit version | Unknown-version negative vector |
| BR1-08 | Risk output has mismatched units, horizon, or exposure perimeter | Reject/indeterminate until a declared conversion/alignment rule exists | Unit/horizon/perimeter mismatch tests |
| BR1-09 | Duplicate or overlapping protected components would count the same obligation twice | B-R2 completeness/disjointness check rejects the candidate composition | Provenance overlap test |
| BR1-10 | Derived requirement is valid but EEV is below resulting ProtectedCapital | Economic Gate rejects the candidate | Existing gate conformance test |
| BR1-11 | Economic Gate passes but Ω/viability evidence fails or is absent | Transition remains unauthorized | Existing viability/admission negative test |
| BR1-12 | Adapter attempts to alter the risk result or protection requirement | Reject; adapter cannot become a second economic authority | Adapter boundary test |
| BR1-13 | PRE-RICH 500× parameter changes without a canonical profile-version change | Reject inconsistent profile/evidence binding | Profile provenance consistency test |
| BR1-14 | Existing Issue/Reveal/Claim/Expire transitions under the current profile | Existing transition semantics and projection equivalence remain unchanged | Existing V3/Universal boundary suite; do not modify Reveal/V3 semantics in this work |

## 6. Closure criteria

B-R1 is not implementation-closed until all of the following are true:

1. The concrete typed interface is defined in the canonical implementation layer without duplicating economic authority.
2. Every applicable risk output is authenticated and bound to the candidate trajectory and profile version.
3. The mapping to a protection requirement is explicit, versioned, deterministic, and traceable.
4. The matrix above is implemented as conformance tests, including fail-closed cases.
5. The requirement is demonstrably consumed by B-R2 and the existing Economic Gate/viability path.
6. Differential and negative tests demonstrate that missing/invalid statistical evidence cannot reduce deterministic protection.
7. The relevant Haskell suite passes in a recorded local or CI run.
8. No V3/Reveal semantic change is included without a separate, justified decision and review.

## 7. Current status and next action

**Current status:** the repository has a deterministic worst-case path and a regression test proving that uesUnresolvedReserve is not substituted for uesWorstCaseExposure. That test does not implement or prove the risk-assessment → protection-requirement bridge.

**Next action:** map each contract field to existing repository types and provenance sources; identify what can be reused and what is genuinely absent. Then add the smallest typed interface and focused conformance tests only where the canonical profile supplies sufficient semantics. If a needed policy rule is absent, keep the affected path fail-closed and record the decision as open rather than inventing it.

## 8. Explicit non-goals

- Do not change epMaxNormalPayoutMultiplier = 500.
- Do not replace worst-case protection with N·μ + Z·σ·√N.
- Do not invent a universal combined reserve formula, confidence threshold, haircut, coefficient, or fallback.
- Do not change V3 Carrier, Reveal validator semantics, or Cardano transaction construction as part of B-R1.
- Do not create a new branch for this work.


## 9. Current implementation mapping (verified on branch)

| Contract element | Existing implementation | Coverage / gap |
|---|---|---|
| Profile identity | PRE-RICH EconomicProfile has epVersion and class prices | Version exists, but no cryptographic/profile evidence binding is carried by the universal state |
| Deterministic bound | PreRichEconomicProjection.foldClassesSeen multiplies class price × unresolved count × epMaxNormalPayoutMultiplier | Present for PRE-RICH; remains the existing deterministic path |
| Universal protected components | UniversalEconomicState carries liabilities, unresolved accounting reserve/count, worst-case exposure, safety capital, reserve protection, future costs and additional protected capital | Accounting state exists; no first-class ProtectionRequirement or provenance partition |
| Statistical assessment | No statistical assessment record in UniversalEconomicState or PreRichEconomicAdmission | Missing from the inspected execution path |
| Risk mode / applicability | No mode/status identifying deterministic, statistical, both, or explicitly not applicable | Missing |
| Evidence provenance/freshness | EconomicGateInput carries truthVerified, EEVFresh and obligationsComplete booleans | Generic gate attestations exist; they do not identify risk assessment source, model, horizon or confidence |
| Candidate trajectory binding | PreRichEconomicAdmission carries action and candidate V3/universal states | Candidate is represented, but no risk-output reference is bound to it |
| Protection Requirement | No typed result between projection and ProtectedCapital | Missing B-R1 interface |
| Economic Gate | economicGate checks authoritative truth, EEV freshness, obligation completeness, liquidity and solvency | Existing downstream gate; it consumes the state but does not derive the risk requirement |
| Viability | viabilityGate requires safe post-state and all Ω successors inside the certified kernel | Explicit Boolean boundary exists; certificate provenance/completeness remains external |
| Atomic execution | Admission returns a witness; commit/history are downstream | Not part of B-R1 and not proven by this audit |

### Mapping conclusion

The minimum safe next implementation is **not** to add a statistical number directly to UniversalEconomicState. First define the typed assessment/result boundary and how it is bound to the profile and candidate trajectory. Then connect the resulting requirement to the existing projection/ProtectedCapital path. Until an applicable profile supplies authorized statistical semantics, the bridge must preserve the current deterministic PRE-RICH bound and return a fail-closed outcome for any attempted regime switch that would weaken it.

This mapping is based on the named files above and is not a claim that no prototype exists anywhere else in the repository.
