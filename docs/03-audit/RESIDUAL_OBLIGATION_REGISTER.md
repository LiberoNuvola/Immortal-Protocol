# Residual Obligation Register — R1–R9, discharge attempt
**Status:** Audit | **Version:** 3.0.0

For each obligation: the normative requirement, what would count as sufficient evidence,
whether that evidence exists in the package, whether it is derivable mathematically, whether
it needs external evidence, what was discharged, and the exact missing artifact.

Categories are used strictly per `08` §1: MATHEMATICAL PROOF · NORMATIVE CLOSURE ·
MODEL-LEVEL CERTIFICATE · MECHANICAL EVIDENCE · IMPLEMENTATION CONFORMANCE ·
ADAPTER CONFORMANCE · GOVERNANCE CONFORMANCE.

---

## R1 — Certificate evidence
- **Requirement:** `07` C5/C5a; `03` §4.4 CK1–CK8 — execution gates on a declared `K_c` with
  `K_c ⊆ Safe`, `K_c ⊆ Pre(K_c)`.
- **Sufficient evidence:** E1–E10 of `CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` §5.
- **In the package?** No — `𝒮, A, Ω, T, Safe` are deliberately uninstantiated.
- **Derivable?** Partially. Discharged here: **T4** (soundness), **T-CHAR** (maximality),
  **T-CERT**, **T-MARGIN** (a proved certificate schema), **T-EROSION** (obstruction test),
  the certificate format, and VC1–VC6.
- **External evidence needed?** Yes — a profile instantiation plus a decision procedure for `χ`.
- **Discharged:** the mathematics and the format. **Not** an actual certificate.
- **Missing artifact:** E1 (profile instantiation) + E2–E8.
- **Status:** **PARTIALLY DISCHARGED** — theory closed, instance requires deployment.

## R2 — Refinement evidence
- **Requirement:** `07` C5b (C-EXEC), C18; `08` T8.
- **Sufficient evidence:** RF1–RF11 discharges with an explicit separation between proof, mechanical evidence, tests/replay and audit findings, per
  `REFINEMENT_CONFORMANCE_SPECIFICATION.md` §4–§5.
- **In this package?** No implementation-conformance evidence is included; this register defines what must be evidenced externally.
- **Derivable?** The transfer theorem only: **T-REFINE-FWD** proved as an implication.
- **External evidence needed?** Yes — the implementation itself.
- **Discharged:** the theorem and an exhaustive obligation list; RF8 (no side door) isolated
  as the load-bearing, non-sampleable obligation.
- **Missing evidence:** RF1–RF11 implementation-conformance evidence for the concrete deployment.
- **Status:** **NOT DISCHARGEABLE HERE.**

## R3 — Ω perimeter and completeness
- **Requirement:** `01` §6; `07` C14/C23; `16`.
- **Sufficient evidence:** P1–P8 of `OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md` §5.
- **In the package?** No adapter, no `Env`.
- **Derivable?** The formal definition of `Ω-COMPLETE(Env,Ω)`, its failure condition, and
  **T-OMEGA-ADMIT**: the correct admission condition is **containment, not equality** —
  equality is too strong and would forbid sound over-approximation.
- **External evidence needed?** Yes — adapter conformance.
- **Discharged:** the formalisation, the admission-condition question (answered), the
  soundness direction (T9), and mechanical evidence that narrowing falsely certifies in
  138/400 systems.
- **Missing artifact:** P1–P8 for a real `Env`.
- **Status:** **PARTIALLY DISCHARGED.** Ceiling reached: no procedure can verify that a
  published perimeter matches the world.

## R4 — Liveness
- **Requirement:** `01` §12; `07` C19/C20; `13`.
- **Sufficient evidence:** L-E1–L-E5 of `LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md` §6.
- **In the package?** No environment, actors or substrate.
- **Derivable?** **T-PROG** (conditional, shallow), and two genuinely useful negatives:
  **T-NOLIVE** (safety never implies progress — so no gate strengthening can help) and
  **T-STALL-ATTRIB** (a stall inside a VC4-valid certificate is *always* an input-availability
  failure, which makes stall classification decidable).
- **External evidence needed?** Yes — substrate and actor behaviour.
- **Discharged:** definitions, the conditional theorem, both negatives, the FM1–FM10 failure
  taxonomy.
- **Missing artifact:** L-E1, L-E4.
- **Status:** **PARTIALLY DISCHARGED; liveness itself NOT CLAIMED.**

## R5 — Upgrade demonstration
- **Requirement:** `01` §14; `07` C21; `14` U1–U8.
- **Sufficient evidence:** UC1–UC10 of `UPGRADE_MIGRATION_PROOF_AND_CERTIFICATION.md` §5.
- **In the package?** No governance act exists to assess.
- **Derivable?** Substantially. **T-UPGRADE-NOMONO** (no general inclusion between
  `K*_old` and `K*_new`, with an executed witness), **T-UPGRADE-NEC** (U1 is *necessary*, via
  T-CHAR), **T-UPGRADE-FULL** (preservation under U1–U8), and the demonstration that U1 alone
  is **insufficient** — U7 is what prevents satisfying U1 by weakening `Safe`.
- **External evidence needed?** Yes — governance conformance.
- **Discharged:** the mathematics is now materially stronger than in v2.0.0.
- **Missing artifact:** a concrete `M_new`, `μ`, `K_c,new` and the UC1–UC10 package.
- **Status:** **PARTIALLY DISCHARGED.**

## R6 — Composed-system certificate
- **Requirement:** `01` §13; `07` C22; `15` X1–X7, X5b.
- **Sufficient evidence:** XC1–XC8 of `COMPOSITIONALITY_PROOF_AND_CERTIFICATION.md` §6.
- **In the package?** No second system.
- **Derivable?** Yes, in corrected form: **T-COMP-SOUND** (PROVEN), **T-COMP-INDEP** (PROVEN
  under strict independence; 0/120 mechanical failures), **T-COMP-GATE** (weakest sufficient
  condition), and the **corrected refutation** at the gate level (F1/F2/F3).
- **External evidence needed?** Yes, for any actual composition.
- **Discharged:** the theory, plus a correction to v2.0.0 found by mechanical checking.
- **Missing artifact:** a concrete `M_AB` and its joint certificate and joint gate.
- **Status:** **PARTIALLY DISCHARGED.**

## R7 — Exhaustive accounting partition
- **Requirement:** `05` §2–§3; `07` C17.
- **Sufficient evidence:** PA1–PA7 of `ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` §7.
- **In the package?** No profile economics.
- **Derivable?** A **general two-sided decomposition** (assets A1–A5 / liabilities L1–L6,
  with `RawSurplus` as the link rather than a cell), the permitted-delta set, PC1–PC7,
  **T-CONS-2** (conditional), and **T-CONS-GAP** (PROVEN): an omitted commitment class leaves
  the conservation identity intact while under-counting protection — a silent failure no
  internal check can detect. This also **corrects** a conflation in v2.0.0, which wrote
  conservation over a single partition while using an asset-vs-liability surplus formula.
- **External evidence needed?** Yes — exhaustiveness is a claim about a profile's economics.
- **Missing artifact:** PA2 (exhaustiveness enumeration) and PA7 (adversarial omission review).
- **Status:** **PARTIALLY DISCHARGED.**

## R8 — Non-vacuity / `S₀` witness
- **Requirement:** `01` §7; `07` C15.
- **Sufficient evidence:** NV1–NV6 of `NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md` §6.
- **In the package?** No profile values; no universal witness exists or was manufactured.
- **Derivable?** The four-claim separation N1–N4, **T-NV-CHAIN**, **T-NV-SUFF** (a safe,
  environment-stable quiescent state suffices), and **T-EROSION** as a runnable *obstruction
  test* — a deployment can falsify its own admissibility before building anything.
- **External evidence needed?** Yes.
- **Missing artifact:** NV1–NV5.
- **Status:** **PARTIALLY DISCHARGED.**

## R9 — EEV contract
- **Requirement:** `07` C16; `08` T21.
- **Sufficient evidence:** EV1–EV7 of `EEV_ORACLE_AND_VALUATION_CONTRACT.md` §5.
- **In the package?** No oracle or adapter.
- **Derivable?** **T-EEV-REL** (all safety results hold in `M[V]` for any `V` — and therefore
  are guarantees *relative to the supplied number*) and **T-EEV-MONO** (under-valuation
  shrinks the kernel, so "when uncertain, mark down" is the sound direction).
- **External evidence needed?** Yes.
- **Missing artifact:** EV1–EV7.
- **Status:** **PARTIALLY DISCHARGED. Correctness of a valuation is not a mathematical claim
  and cannot be discharged by any document.**

---

## Summary

| R | Theory closed here | Instance dischargeable here | Blocker class |
|---|---|---|---|
| R1 | yes | no | deployment certification |
| R2 | yes (theorem + checklist) | no | implementation execution / repository access |
| R3 | yes (incl. admission condition) | no | adapter evidence |
| R4 | yes (incl. two negatives) | no | environment/substrate evidence |
| R5 | yes (materially strengthened) | no | governance execution |
| R6 | yes (corrected) | no | second system + joint certification |
| R7 | yes (corrected, two-sided) | no | profile economics |
| R8 | yes (incl. obstruction test) | no | profile values |
| R9 | yes (both directions) | no | adapter/oracle evidence |

**Every remaining blocker is one of: repository access, implementation execution, external
adapter evidence, governance execution, or deployment-specific certification.** No blocker
remains that further documentation could remove.
