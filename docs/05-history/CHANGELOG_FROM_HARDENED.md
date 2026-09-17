# CHANGELOG — v2.0.0-hardened → v3.0.0-verification
**Date:** 17 September 2026

## 1. Corrections to previously published claims

| # | Location | Was | Now | Found by |
|---|---|---|---|---|
| 1 | `15` §3, `08` T18 | naive compositionality refuted at the **set** level: `K_A × K_B ⊄ Pre_AB(K_A × K_B)` | **too strong; withdrawn** as T18a. Refutation restated at the **gate** level (F2), with F1 (type failure) and F3 (inductive product set is a trap, not a defence) distinguished. **X5b joint-gate** added to C-COMP. | mechanical checking |
| 2 | `05` §2–§3 | conservation over a single partition, alongside an asset-minus-liability surplus formula | two-sided decomposition (assets A1–A5 / liabilities L1–L6); `RawSurplus` is the link between sides, not a cell | review |
| 3 | `14` §3–§4 | U1 presented as the migration condition | U1 shown **necessary** (T-UPGRADE-NEC) and **insufficient** (T-U1-SUFF REFUTED); certification order changed so U7 is checked before U1 | review |

## 2. New theorems

| ID | Result | Status |
|---|---|---|
| **T4a / T-CHAR** | `K*` is exactly the winning region of the safety game against `Ω` | PROVEN |
| **T4b / T-EROSION** | uniform buffer erosion ⇒ `K* = ∅` | PROVEN |
| **T-CERT** | VC2∧VC3 ⇒ valid certificate; +VC6 ⇒ non-vacuity; +VC4 ⇒ non-empty gate | PROVEN |
| **T-MARGIN** | buffer certificate schema `{Rep ∧ b ≥ 0}` | CONDITIONALLY PROVEN (S1, QNE) |
| **T-OMEGA-ADMIT** | containment, not equality, is the correct Ω admission condition | PROVEN |
| **T-EEV-REL** | all kernel results hold in `M[V]` for any valuation oracle | PROVEN |
| **T-EEV-MONO** | under-valuation shrinks the kernel — conservatism is the safe direction | PROVEN |
| **T-CONS-2** | two-sided conservation identities | CONDITIONALLY PROVEN |
| **T-CONS-GAP** | an omitted commitment class is invisible to the conservation check | PROVEN |
| **T-NV-CHAIN**, **T-NV-SUFF** | non-vacuity chain; quiescent-state sufficiency | PROVEN |
| **T-NOLIVE** | safety never implies progress (witness) | PROVEN |
| **T-STALL-ATTRIB** | a stall inside a VC4-valid certificate is input unavailability | PROVEN |
| **T-UPGRADE-NEC** | U1 is necessary, via T-CHAR | PROVEN |
| **T-UPGRADE-NOMONO** | no general inclusion between `K*_old` and `K*_new` | PROVEN, witness executed |
| **T-UPGRADE-FULL** | full preservation theorem under U1–U8 | CONDITIONALLY PROVEN |
| **T-COMP-GATE** | weakest sufficient composition condition (G1–G3) | CONDITIONALLY PROVEN |
| **T-REFINE-FWD** | forward-simulation transfer of the gate | CONDITIONALLY PROVEN |

## 3. New documents

| File | Discharges |
|---|---|
| `RESIDUAL_OBLIGATION_REGISTER.md` | Part I — R1–R9 reconstruction and discharge attempt |
| `CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md` | R1 |
| `REFINEMENT_CONFORMANCE_SPECIFICATION.md` | R2 |
| `OMEGA_COMPLETENESS_AND_PERIMETER_SPECIFICATION.md` | R3 |
| `LIVENESS_AND_PROGRESS_PROOF_SPECIFICATION.md` | R4 |
| `UPGRADE_MIGRATION_PROOF_AND_CERTIFICATION.md` | R5 |
| `COMPOSITIONALITY_PROOF_AND_CERTIFICATION.md` | R6 |
| `ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md` | R7 |
| `NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md` | R8 |
| `EEV_ORACLE_AND_VALUATION_CONTRACT.md` | R9 |
| `MECHANICAL_VERIFICATION_REPORT.md` | Part XII |
| `CLAIM_AUDIT.md` | Part XV |
| `VERIFICATION_STATUS.md` | Parts XIV, XVI |
| `verification/finite_model_checks.py` | executable harness |
| `verification/FINITE_MODEL_CHECK_RESULTS.txt` | its output |

Documents `13`–`16` are retained as the **normative contracts**; the new specifications are
the **certification layer** (proof obligations and evidence formats) built on them. Each new
document states this relationship in its header. No document duplicates another's authority.

## 4. Mechanical verification added

`verification/finite_model_checks.py` (deterministic, seed 20260917) checks T1, T3, T4, T6,
T9 over 400 finite systems — T3 and T4 **exhaustively over every subset**, 1 588 certificates
examined — plus fixtures for composition, upgrade non-monotonicity, expiry absorption and the
conservation algebra. 0 failures. Findings that changed the documentation are listed in
`MECHANICAL_VERIFICATION_REPORT.md` §3; the composition correction above came from this.

Calibration results worth recording: certificates were strictly smaller than `K*` in 196/400
systems; Ω narrowing produced false certification in 138/400; and 129/400 random systems
admitted no non-empty certificate at all.

## 5. Register and matrix

- `08` rebuilt again, now in six sections: theorems about the model, certification theorems,
  conditional guarantees, refuted/withdrawn, obligations, mechanical evidence. Five PROVEN
  entries are explicitly flagged **shallow** rather than padding the count.
- `10` gains the R1–R9 discharge matrix (§3) with an "exact missing artifact" column, and the
  verdict row for documentation now distinguishes *specification* from *verified
  implementation*.

## 6. What was deliberately not done

- No implementation evidence was invented, and no test was described as run against absent code.
- No adapter, perimeter, partition, valuation or initial state was invented for any profile.
- No governance act was assessed.
- No universal non-vacuity witness was manufactured.
- No mechanical result was promoted to PROVEN, and no proof was demoted to evidence.
- The verdict was not made cleaner than the evidence supports.
