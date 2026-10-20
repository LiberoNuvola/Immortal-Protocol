# IMMORTAL — Adversarial Review Traceability Matrix (B3)

**Branch:** `work/b3-materios-provenance-evidence`  
**Classification:** research / conformance-triage; non-normative  
**Date:** 2026-10-20  
**Purpose:** reconcile the external adversarial assessment in `Testo incollato(20261020-170221).txt` with the normative economic model, the generalized-derivation contract, and the Notion Economic Canon register. This document does not amend economic semantics.

## Executive result

The critique is partly based on a short kernel summary rather than the complete normative corpus. The specific claim that the viability-kernel section lacks a safe set and a greatest-fixed-point construction is **outdated against the current branch's normative v3.0.0 files**: `03_ECONOMIC_KERNEL_FINAL.md` defines `Pre`, `F(K)=Safe ∩ Pre(K)`, `K*=νF`, proves monotonicity and Knaster–Tarski existence/characterisation, and explicitly does **not** claim non-emptiness, computability, finite convergence, or decidable membership.

That does not mean the universal protocol is fully proven or empirically portable. The Notion adversarial audit preserves open obligations around non-vacuity, completeness/authority of the event envelope Ω, and execution conformance. The external assessment is therefore best classified claim-by-claim, not accepted or rejected wholesale.

## Traceability matrix

| ID | Adversarial claim / concern | Current branch evidence | Assessment | Residual closure required |
|---|---|---|---|---|
| A1 | Viability-kernel formula is vacuous / not anchored to safety | Normative `03_ECONOMIC_KERNEL_FINAL.md`: `F(K)=Safe ∩ Pre(K)`, `K*=νF`; T1 monotonicity and T2/T3 fixed-point theorem are proved. | **OUTDATED AS STATED** | Correct the assessment's source baseline. Do not infer `K* ≠ ∅`: non-vacuity is separately open. |
| A2 | The greatest fixed point proves a non-empty viable region | Kernel cautions explicitly that existence of the fixed point does not imply non-emptiness. Notion adversarial audit rejects SAFE STALL, generic no-op/HALT, and PRE-RICH as universal witnesses. | **OPEN — MATHEMATICAL / NORMATIVE LIMIT** | Keep universal non-vacuity unclaimed. A deployment/profile claiming live viability must provide a concrete non-empty initial/recurrent witness and prove closure under authoritative Ω. |
| A3 | Ω can be actor-selected or omit adverse continuations | Universal Model defines Ω as an authoritative event envelope relative to perimeter E. Notion audit identifies authority principle as present but completeness of all economically possible continuations as not yet crystallized. | **PARTLY ADDRESSED; OPEN** | Normatively specify and test (i) canonical authority of Ω inputs and (ii) completeness relative to the declared environment/perimeter, including permitted correlated, adaptive, repeated, timing/order and concurrency effects. |
| A4 | ProtectedCapital has no formal relationship to obligations/exposure; names can be double-counted | Universal Model v3.0.0 defines an exhaustive, mutually exclusive partition of protected content and `ProtectedCapital = Σ value(P_i)`. C17 explicitly makes exhaustiveness a conformance obligation, not a theorem. Canon register separates unresolved reserve, worst-case exposure, statistical reserve, CAR and ProtectedCapital. | **SPECIFICATION PRESENT; IMPLEMENTATION CONFORMANCE OPEN** | Demonstrate the concrete state projection is exhaustive and pairwise disjoint, with no omissions or duplicate representation. In particular, explain the semantic relationship between `uesUnresolvedReserve` and `uesWorstCaseExposure`; do not assume they should both be summed. |
| A5 | A profile could understate ProtectedCapital and still pass | Normative model makes completeness C17 a conformance obligation; Economic Gate states it does not manufacture truth, freshness or obligation coverage. | **RISK IDENTIFIED; EVIDENCE REQUIRED** | Add/verify executable negative tests where an omitted obligation, stale EEV, unauthenticated input or incomplete coverage must fail closed. Prove the producer/projection cannot self-certify its own completeness. |
| A6 | “Conservation” is a list of prose properties, not executable predicates | Universal model points to C17 and implementation conformance clauses; Cardano conformance matrix documents open closure work. | **PARTLY ADDRESSED** | Map each claimed property (single settlement, non-discretionary rights, expiry finality, conservation, protected liquidity) to a named predicate/test/vector and evidence artifact. A prose invariant alone is not closure evidence. |
| A7 | Worst-case exposure `B(P)×N` only works for bounded/additive exposure; statistical reserve assumes a model | Canon register says 500× is PRE-RICH-specific; worst-case exposure is universal as a concept, bound supplied by profile. Statistical reserve is distinct, requires an explicit risk/confidence model, and is not interchangeable with deterministic protection. | **BOUNDARY CLARIFIED; DOMAIN LIMIT MUST BE EXPLICIT** | Paper must state the supported domain: economically bounded obligations and the declared exposure model. Do not claim the same guarantees for volatile collateral, derivatives or AMMs without a different model and evidence. Statistical reserve must not be presented as deterministic solvency. |
| A8 | CurrentActiveClass / HighestClassEverActivated and hysteresis may be PRE-RICH semantics disguised as universal economics | Universal state and ownership docs separate universal aggregates/obligations from ticket classes, class activation, payout tables and Jackpot lifecycle. | **ARCHITECTURAL SEPARATION PRESENT; REVIEW IMPLEMENTATION** | Verify universal modules do not import PRE-RICH class constants/policy. Treat any remaining literal 500 or class lifecycle logic in a universal module as a scope/conformance defect, not as a reason to silently redefine the norm. |
| A9 | Determinism is insufficient for multi-chain portability: integer domains, overflow, rounding, square root, time, serialization and concurrency differ | Generalized Derivation Contract requires same semantic result for same certified inputs/rule version before adapter-specific encoding; Adapter may vary in representation/fees/validity/settlement but must not redefine the universal function. | **CONTRACTUAL PRINCIPLE PRESENT; CONFORMANCE NOT PROVEN** | Freeze arithmetic semantics per function (numeric domain, overflow, rounding direction, bounds); define time/finality inputs in the environment/adapter contract; create shared cross-runtime vectors and test equivalent semantic outputs. Do not universalize the statistical square-root formula unless it is in the adopted rule set. |
| A10 | EEV and ProtectedCapital are inputs with a trust/authority problem | Universal Model treats EEV and ProtectedCapital as canonical state values; Economic Gate requires authoritative truth/freshness/coverage flags. EEV qualification and source provenance remain profile/adapter obligations. | **INTERFACE PRINCIPLE PRESENT; SOURCE TRUST MODEL MUST BE CONCRETE** | For each profile, identify source, asset/UTxO or ledger perimeter, derivation, timestamp/slot, version, verification reference and fail-closed behavior. Clearly distinguish ledger-derived facts from off-chain signed attestations and state the trust assumptions. |
| A11 | One app and one UTxO adapter do not prove universality | Generalized Derivation Contract explicitly says multiple function families and adapter semantic equivalence are closure criteria; current contract status is OPEN RESEARCH / PROTOTYPE-READY. Canon register defines boundaries but does not establish an independent second implementation. | **VALID CRITIQUE — OPEN EMPIRICAL CLAIM** | Demonstrate (1) a materially different non-lottery application reusing the kernel unchanged, (2) a materially different non-UTxO adapter passing shared conformance vectors, and (3) an independent runner/audit. Until then say “designed for chain neutrality”, not “empirically chain-agnostic”. |
| A12 | On-chain costs can prevent enforcement even if the formal invariant is correct | Cardano conformance matrix explicitly distinguishes semantic transition validity from the economic gate and identifies a typed economic-admissibility boundary as the missing integration point. Prior Reveal-size evidence is a deployment/adapter limitation, not a counterexample to the abstract theorem. | **VALID IMPLEMENTATION RISK; NOT A UNIVERSAL-THEOREM REFUTATION** | Keep formal safety claims separate from ledger-enforcement claims. Produce reproducible cost/size evidence and prove that the adapter fails closed if enforcement cannot fit. This report authorizes no changes to V3 or Reveal semantics. |
| A13 | Generalized algorithmic derivation could become a second authority or bypass governance | `GENERALIZED-DERIVATION-CONTRACT-v1.md` specifies `Explore → CandidateSet → Certify → ADMISSIBLE/REJECTED/UNVERIFIABLE → Adopt`, and forbids self-expanding domain, weakening safety, changing rule/evidence versions, budget increases or bypassing atomic transitions. | **ARCHITECTURAL CONTRACT PRESENT; STATUS OPEN** | Add conformance tests proving candidate generation/certification cannot mutate authorized rule space and that only the existing authorized adoption path can enact a candidate. Multiple function families must share the machinery before promotion. |
| A14 | Materios provenance may be mistaken for proof of the universal economic protocol | B3/Materios work concerns canonicality/provenance and external evidence; it does not by itself prove the universal economic kernel, a second adapter, or application portability. | **SCOPE BOUNDARY REQUIRED** | Use Materios as an evidence/provenance case study only. Label each artifact as source observation, proof verification, semantic conformance or deployment evidence; do not promote one category into another. |

## Source-of-truth reconciliation

1. **Normative mathematical kernel:** [03_ECONOMIC_KERNEL_FINAL.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md)
2. **Normative universal model:** [02_UNIVERSAL_ECONOMIC_MODEL.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md)
3. **Generalized derivation research contract:** [GENERALIZED-DERIVATION-CONTRACT-v1.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/b3-materios-provenance-evidence/docs/research/GENERALIZED-DERIVATION-CONTRACT-v1.md) — explicitly non-normative and OPEN RESEARCH / PROTOTYPE-READY.
4. **Notion reconciliation point:** [IMMORTAL — Economic Canon & Parameter Boundary Register v0.1](https://app.notion.com/p/3e2c4454d6d581e39ad6e764d162dbd7?pvs=204) — closed semantic baseline; implementation conformance continues.
5. **Notion adversarial audit:** [IMMORTAL GENERAL ECONOMIC MODEL — MASTER ADVERSARIAL AUDIT](https://app.notion.com/p/3dcc4454d6d581e39d48cf940cedf67d?pvs=204) — records unresolved non-vacuity and Ω/execution bridges.

## Recommended closure sequence

### Gate R1 — Correct the critique baseline
Reclassify the missing-fixed-point objection as outdated for normative v3.0.0. Preserve the separate non-vacuity objection as open.

### Gate R2 — Protected-content accounting proof
Produce a field-to-partition map from the canonical state through the concrete projection to every (P_i). Demonstrate exhaustive coverage, pairwise disjointness, units, authority and no double counting. Include adversarial omissions and duplicate-count tests.

### Gate R3 — Ω and execution conformance
Specify authoritative derivation and completeness of Ω relative to each deployment perimeter. Prove/test that the implementation commits only accepted actions in the certified concrete kernel (K_c), and that inability to establish the condition fails closed.

### Gate R4 — Portability vectors
Freeze arithmetic and time semantics where relevant; run identical certified inputs and rule versions through at least two materially different realizations. Compare semantic results before chain-specific encoding.

### Gate R5 — Generalized derivation boundary
Test the same Explore/Certify/Adopt machinery against at least two materially different function families. Assert that candidates cannot alter domain, bounds, rule/evidence versions, budgets or authority.

### Gate R6 — Claim discipline for the paper
Separate:
- theorem proven by the normative model;
- conformance obligation specified but not yet evidenced;
- implementation result observed in CI/devnet;
- deployment result independently reproduced;
- portability/generalization hypothesis not yet demonstrated.

## Explicit non-actions

- No new branch created.
- No normative economic semantics changed.
- No changes to V3 or Reveal semantics.
- No claim that (K^*) is non-empty universally.
- No claim of multi-chain portability based solely on the generalized contract or Materios provenance.
- No claim that a green CI run is, by itself, independent certification.

## Paper-safe conclusion

The defensible contribution is not “a universally proven economic protocol.” It is a formalized liability-first economic kernel with a greatest-fixed-point safety semantics, a concrete-kernel under-approximation principle, an explicit evidence/conformance discipline, and a proposed generalized derivation boundary that separates candidate computation from authorized adoption. The universal theorem has precise limits; implementation completeness, non-vacuity for a concrete deployment, independent reproduction and materially different adapter/application demonstrations remain distinct obligations.
