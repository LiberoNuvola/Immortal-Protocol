# IMMORTAL Formal Proof Register — Rebuilt (v3.0.0)
**Status:** Proof record | **Version:** 3.0.0
**Rebuilt in v2.0.0 and again in v3.0.0. IDs are not v1.0.0-compatible.**

## 1. Status vocabulary

| Status | Meaning |
|---|---|
| **PROVEN** | Consequence of stated assumptions, all internal to the model. Proof cited. |
| **PROVEN UNDER STRUCTURAL ASSUMPTIONS** | Proof valid, but the assumptions are strong and rarely hold in practice. Flagged as such. |
| **CONDITIONALLY PROVEN** | Valid implication with at least one external obligation as a hypothesis. |
| **DEFINITIONAL** | True by construction; no security content. |
| **NORMATIVE REQUIREMENT** | A rule a conforming design must follow. |
| **CONFORMANCE OBLIGATION** | Something an implementation must demonstrate. |
| **PROFILE/ADAPTER OBLIGATION** | Something the environment adapter or profile must demonstrate. |
| **GOVERNANCE OBLIGATION** | Something an upgrade process must demonstrate. |
| **MECHANICAL EVIDENCE** | Checked on finite instances; not a proof for the general case. |
| **EVIDENCE REQUIRED** | Not settleable from this corpus. |
| **REFUTED** | Counterexample given. |
| **NOT CLAIMED** | Deliberately not asserted. |

## 2. Anti-circularity rules applied

1. `A_exec ⊆ A_safe` is **D4, DEFINITIONAL**, never a theorem.
2. Implementation conformance (C-EXEC) is an obligation; the theorem consuming it (T8,
   T-REFINE-FWD) states it as an explicit hypothesis.
3. Ω completeness is never evidence for itself. The only PROVEN Ω results (T9,
   T-OMEGA-ADMIT) do not presuppose completeness.
4. T-UPGRADE does not assume the new kernel is safe; it requires a re-established certificate.
5. T-COMP-* does not assume product viability; the naive form is refuted.
6. No entry cites the audit matrix, the explainer or the mechanical report as proof.
7. Mechanical evidence is never promoted to PROVEN, and proofs are never demoted to evidence.

---

## 3. Section A — Theorems about the abstract model

| ID | Name | Statement | Assumptions | Deps | Proof | Counterexample boundary | Status |
|---|---|---|---|---|---|---|---|
| **T1** | Monotonicity | `K ⊆ K′ ⇒ Pre(K) ⊆ Pre(K′), F(K) ⊆ F(K′)` | signature of `M` | — | `03` §2 | fails for a universally-quantified `Pre` | **PROVEN** |
| **T2** | Existence of `νF` | `K* = νF` exists | complete lattice, T1 | T1 | `03` §3 | says nothing about emptiness/computability | **PROVEN** |
| **T3** | Characterisation | `K* = ⋃{K | K ⊆ F(K)}`, `K* = F(K*) ⊆ Safe ∩ Pre(K*)` | T1, T2 | T1,T2 | `03` §3 | — | **PROVEN** |
| **T4** | **T-KUNDER** | `K_c ⊆ Safe ∧ K_c ⊆ Pre(K_c) ⇒ K_c ⊆ K*` | CK2, CK3 | T1–T3 | `03` §4 | gives `⊆` only; `K_c` may be empty | **PROVEN** |
| **T4a** | **T-CHAR** *(new v3)* | `K*` = set of states from which a strategy keeps every Ω-history in `Safe` forever | choice principle for the positional strategy | T4 | `03` §4A | — | **PROVEN** |
| **T4b** | **T-EROSION** *(new v3)* | uniform buffer erosion by `ε>0` over all actions ⇒ `K* = ∅` | `Safe ⊆ {b ≥ 0}` | T5 | `03` §4B | needs erosion under *every* action, not merely some | **PROVEN** |
| **T5** | Kernel invariance | `∀S ∈ K* ∃a ∀ω: T(S,a,ω) ∈ K*` | T3 | T3 | `03` §5 | **existence only** — not acceptance, proposal or execution | **PROVEN** |
| **T6** | Infinite-horizon safety | gated execution from `K` never leaves `K ⊆ Safe` | `S₀∈K`, C-EXEC, Ω authority | T4 | `03` §6 | premises are obligations; violation voids the conclusion entirely | **PROVEN** (implication) |
| **T7** | Adversarial closure | any adaptive strategy confined to the gate preserves T6 | T6 | T6 | `03` §7 | shallow corollary; proves nothing about breaking the gate | **PROVEN** (corollary) |
| **T9** | **T-OMEGA-MONO** | `Ω ⊆ Ω′ ⇒ K*_{Ω′} ⊆ K*_Ω` | — | T1,T3 | `03` §8 | says nothing about completeness of any `Ω` | **PROVEN** |
| **D4** | Gate inclusion | `A_exec^spec ⊆ A_safe` | — | — | by construction | records the v1.0.0 tautology so it is not re-read as a result | **DEFINITIONAL** |

## 4. Section B — Certification theorems (statements *about certificates*)

| ID | Name | Statement | Assumptions | Proof | Status |
|---|---|---|---|---|---|
| **T-CERT** | Certificate validity | VC2∧VC3 ⇒ `K_c ⊆ K*`; +VC6 ⇒ `K* ≠ ∅`; +VC4 ⇒ gate non-empty | VC1–VC6 | `CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` §3 | **PROVEN** |
| **T-MARGIN** | Buffer certificate schema | `{Rep ∧ b ≥ 0}` is a valid certificate | (S1) safety sufficiency, (QNE) quiescence non-erosion | `CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` §4 | **CONDITIONALLY PROVEN** (S1, QNE are profile obligations) |
| **T-NV-CHAIN** | Non-vacuity chain | `χ(S₀)=1 ∧ VC2 ∧ VC3 ⇒ S₀ ∈ K* ≠ ∅` | — | `NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md` §2 | **PROVEN** |
| **T-NV-SUFF** | Quiescent witness | a safe, Ω-stable quiescent state ⇒ `K* ≠ ∅` | `T(S_q,a_q,ω)=S_q` for **every** ω | `NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md` §3 | **PROVEN** |
| **T-OMEGA-ADMIT** | Envelope admission | containment `Ω ⊇ Real_Env`, not equality, is the correct condition; coarsening never requires re-proof | T9, T4 | `OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md` §3 | **PROVEN** |
| **T-EEV-REL** | Valuation relativisation | all kernel results hold in `M[V]` for any oracle `V` | — | `EEV_ORACLE_AND_VALUATION_CONTRACT.md` §2 | **PROVEN** (and transfers, not discharges, the burden) |
| **T-EEV-MONO** | Conservative valuation | `V′ ≤ V ⇒ K*_{V′} ⊆ K*_V` | `Safe` monotone in valuation | `EEV_ORACLE_AND_VALUATION_CONTRACT.md` §3 | **PROVEN** |
| **T-CONS-2** | Two-sided conservation | asset/liability identities; no reclassification to surplus | PC1–PC7 | `ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` §5 | **CONDITIONALLY PROVEN** |
| **T-CONS-GAP** | Silent under-counting | an omitted commitment class leaves the conservation identity intact while under-counting protection | — | `ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` §6 | **PROVEN** |

## 5. Section C — Conditional guarantees (external assumptions in the hypotheses)

| ID | Name | Conditional on | Proof | Status |
|---|---|---|---|---|
| **T8** | **T-REFINE-FWD** | C18 refinement, C5b gate conformance, **RF8 no-side-door**, valid `K_c` | `REFINEMENT_CONFORMANCE_SPECIFICATION.md` §3 | **CONDITIONALLY PROVEN**; premise **EVIDENCE REQUIRED** |
| **T15** | **T-NOBLOCK** | CK3′/VC4, input availability | `03`, `LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md` | **CONDITIONALLY PROVEN** |
| **T16** | **T-PROG** | L1–L4, VC4 | `LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md` §2 | **CONDITIONALLY PROVEN** (shallow by construction) |
| **T17** | **T-UPGRADE-FULL** | U1–U8, valid `K_c,new`, C-EXEC under `M_new` | `UPGRADE_MIGRATION_PROOF_AND_CERTIFICATION.md` §3 | **CONDITIONALLY PROVEN** |
| **T-UPGRADE-NEC** | U1 necessity | T-CHAR | `UPGRADE_MIGRATION_PROOF_AND_CERTIFICATION.md` §2 | **PROVEN** |
| **T-UPGRADE-NOMONO** | No general inclusion `K*_old` vs `K*_new` | — | `UPGRADE_MIGRATION_PROOF_AND_CERTIFICATION.md` §1, witness executed | **PROVEN** |
| **T19** | **T-COMP-INDEP** | disjoint content, product action set, **product envelope**, componentwise `T`, product `Safe` | `15` §6 | **PROVEN UNDER STRUCTURAL ASSUMPTIONS** (correlation alone defeats it) |
| **T20** | **T-COMP-SOUND** | — | `15` §5 | **PROVEN** |
| **T-COMP-GATE** | weakest sufficient composition condition | G1–G3, esp. **G3 joint action closure** | `COMPOSITIONALITY_PROOF_AND_CERTIFICATION.md` §5 | **CONDITIONALLY PROVEN** |
| **T-NOLIVE** | safety ⇏ progress | — | `LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md` §3 (witness) | **PROVEN** |
| **T-STALL-ATTRIB** | stall inside a VC4-valid certificate ⇒ input unavailability | VC4 | `LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md` §4 | **PROVEN** |
| **T12** | Expiry finality | expiry axioms E1–E3 | `04` §3/§5 | **CONDITIONALLY PROVEN** |
| **T24** | Single settlement | canonical consumption axioms | `04` §5 | **CONDITIONALLY PROVEN** |

## 6. Section D — Refuted

| ID | Statement | Status |
|---|---|---|
| **T18** | *Corrected in v3.* Naive compositionality, at the **gate** level: `A_safe_A(K_A) × A_safe_B(K_B) ⊆ A_safe_AB(K_A×K_B)` | **REFUTED**, executed counterexample (`15` §3 F2) |
| **T18a** | *Superseded phrasing.* v2.0.0's set-level form `K_A × K_B ⊄ Pre_AB(K_A×K_B)` | **WITHDRAWN — too strong**; with idle actions the product set can be inductive (`15` §3 F3) |
| **T-U1-SUFF** | U1 alone suffices for an admissible upgrade | **REFUTED** (`UPGRADE_MIGRATION_PROOF_AND_CERTIFICATION.md` §4): without U7 it is satisfiable by weakening `Safe` |

## 7. Section E — Normative requirements and obligations

| ID | Statement | Class |
|---|---|---|
| **T10** | `Ω`-completeness over `Env` | **PROFILE/ADAPTER OBLIGATION** (semantic form: NORMATIVE REQUIREMENT) |
| **T11** | Non-vacuity: `K* ≠ ∅` universally | **NOT CLAIMED**; deployment form `S₀ ∈ K_c` is a **CONFORMANCE OBLIGATION** |
| **T13** | Atomicity | **NORMATIVE REQUIREMENT** |
| **T21** | EEV oracle soundness and freshness | **PROFILE/ADAPTER OBLIGATION** |
| **T22** | Implementation conformance | **EVIDENCE REQUIRED** — this documentation baseline does not certify a concrete implementation |
| **T23** | Determinism of derivations | **NORMATIVE REQUIREMENT** + C7 |
| **T25** | Historical monotonicity | **NORMATIVE REQUIREMENT** |
| **CK1–CK8 / VC1–VC6** | Certificate obligations | **CONFORMANCE OBLIGATION** |
| **RF1–RF11** | Refinement obligations | **IMPLEMENTATION CONFORMANCE** |
| **P1–P8** | Perimeter package | **ADAPTER CONFORMANCE** |
| **L1–L4** | Progress assumptions | **ENVIRONMENT ASSUMPTION** (never a result) |
| **U1–U8 / UC1–UC10** | Upgrade migration | **GOVERNANCE OBLIGATION** |
| **X1–X7, X5b / XC1–XC8** | Composition contract | **CONFORMANCE OBLIGATION** |
| **PC1–PC7 / PA1–PA7** | Accounting partition | **PROFILE OBLIGATION** |
| **EV1–EV7** | EEV adapter evidence | **ADAPTER CONFORMANCE** |

## 8. Section F — Mechanical evidence (not proof)

| Check | Scope | Result |
|---|---|---|
| T1, T3, T4, T6, T9 | 400 finite systems; T3/T4 exhaustive over all subsets | 0 failures; 1 588 certificates examined |
| Certificate strictness | 400 systems | strict certificate found in 196 |
| Ω narrowing unsoundness | 400 systems | false certification witnessed in 138 |
| Composition F1/F2/F3 | fixture | all three confirmed |
| T-COMP-INDEP | 120 independent products | 0 failures |
| Upgrade non-monotonicity | fixture | `stranded = {0,1}` |
| Expiry absorbing | fixture | no path back to live or settled |
| Conservation algebra | 2 000 delta vectors | 0 violations |

Recorded in `MECHANICAL_VERIFICATION_REPORT.md`. **None of this is proof for infinite state
spaces and none of it is evidence about any implementation.**

## 9. Count

| Status | Count | Entries |
|---|---|---|
| PROVEN | 20 | T1,T2,T3,T4,T4a,T4b,T5,T6,T7,T9,T-CERT,T-NV-CHAIN,T-NV-SUFF,T-OMEGA-ADMIT,T-EEV-REL,T-EEV-MONO,T-CONS-GAP,T-UPGRADE-NEC,T-UPGRADE-NOMONO,T20,T-NOLIVE,T-STALL-ATTRIB |
| PROVEN UNDER STRUCTURAL ASSUMPTIONS | 1 | T19 |
| CONDITIONALLY PROVEN | 9 | T8,T12,T15,T16,T17,T24,T-MARGIN,T-CONS-2,T-COMP-GATE |
| DEFINITIONAL | 1 | D4 |
| REFUTED / WITHDRAWN | 3 | T18, T18a, T-U1-SUFF |
| NORMATIVE / CONFORMANCE / ADAPTER / GOVERNANCE OBLIGATIONS | 15 groups | Section E |
| NOT CLAIMED | 1 | T11 (universal form) |
| EVIDENCE REQUIRED | 1 | T22 |

Of the PROVEN entries, **T7, T15, T16, T20 and T-NV-CHAIN are shallow** — immediate
corollaries or one-line arguments. They are listed as proven because they are, and flagged as
shallow because inflating the count would misrepresent the work.
