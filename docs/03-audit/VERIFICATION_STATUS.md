# IMMORTAL — Verification Status
**Version:** 3.0.0 | **Date:** 17 September 2026
**Verification baseline:** IMMORTAL v3.0.0-verification, crystallized 17 September 2026

This is the single document to read if you want to know what is actually established.

---

## 1. One-paragraph summary

**Repository note:** This document records the v3.0.0 mathematical/certification baseline. It does not certify the current repository implementation; implementation conformance is assessed separately through RF1–RF11.


The universal safety model is mathematically closed: twenty proven results, including a full
game-theoretic characterisation of the viability kernel, a soundness theorem making the gate
implementable without computing a greatest fixed point, an obstruction theorem that rules out
whole classes of deployment before they are built, and proved directions of conservatism for
both the uncertainty envelope and the valuation oracle. The remaining obligations require evidence outside the mathematical corpus — for example implementation conformance, adapter/profile evidence, governance execution, or a second system. Two documentation-level errors from v2.0.0 were found and
corrected in this pass, one of them by mechanical checking.

## 2. What was discharged in this pass

| Result | Kind | Why it matters |
|---|---|---|
| **T-CHAR** | PROVEN | `K*` is exactly the winning region of the safety game, so the kernel is not an artefact of a convenient definition. Makes T-UPGRADE-NEC possible. |
| **T-EROSION** | PROVEN | Uniform buffer erosion ⇒ `K* = ∅`. A deployment can falsify its own admissibility before building anything. |
| **T-CERT, T-MARGIN** | PROVEN / conditional | A certificate format with discharged verification conditions, plus a proved buffer schema a profile can inherit. |
| **T-OMEGA-ADMIT** | PROVEN | Settles the open question: the admission condition is **containment, not equality**. Equality would be unsound to require and unauditable. |
| **T-EEV-REL, T-EEV-MONO** | PROVEN | Safety is relative to the supplied valuation; under-valuation is the safe direction. |
| **T-UPGRADE-NEC / -NOMONO** | PROVEN | U1 is exactly the boundary of admissibility; no monotonicity may be assumed between old and new kernels. |
| **T-U1-SUFF** | REFUTED | U1 alone is satisfiable by weakening `Safe`; U7 must be checked first. |
| **T-NOLIVE, T-STALL-ATTRIB** | PROVEN | Safety never implies progress; and a stall inside a valid certificate is always input unavailability, which makes stall classification decidable. |
| **T-CONS-2, T-CONS-GAP** | conditional / PROVEN | Two-sided conservation, and the proof that an omitted commitment class is invisible to every internal check. |
| **T-COMP-GATE** | conditional | The weakest sufficient composition condition, with joint action closure (G3) isolated as the one deployments omit. |

## 3. What was corrected

| # | Error in v2.0.0 | How found | Correction |
|---|---|---|---|
| 1 | The composition counterexample was stated at the **set** level (`K_A × K_B ⊄ Pre_AB(...)`). With idle actions the product set can be inductive, so the claim was too strong. | **mechanical checking** | Refutation restated at the **gate** level (F2); F1 (type) and F3 (set-inductiveness trap) distinguished; **X5b joint-gate** requirement added to C-COMP. Old phrasing recorded as **T18a, WITHDRAWN**. |
| 2 | Conservation was written over a single partition while `RawSurplus` used an asset-minus-liability formula — a conflation that permits double counting. | review | Two-sided decomposition (assets A1–A5 / liabilities L1–L6); `RawSurplus` is the **link**, not a cell. |

Finding and publishing these is the substance of the pass. A verification pass that produces
no corrections has usually not been performed.

## 4. What remains open, and why

| ID | Blocker | Class |
|---|---|---|
| R1 | profile instantiation + decision procedure for `χ` | deployment certification |
| R2 | implementation conformance evidence | repository implementation audit |
| R3 | a published `Env` and its audit package | adapter evidence |
| R4 | substrate and actor behaviour | environment evidence |
| R5 | a concrete governance act | governance execution |
| R6 | a second system and a joint certificate | deployment-specific |
| R7 | the profile's economics | profile evidence |
| R8 | the profile's `S₀` | profile evidence |
| R9 | the valuation oracle | adapter evidence |

**No remaining blocker can be removed by writing more documentation.** That is the intended
end state of this pass.

## 5. Open-source readiness — the two claims

These are different claims and only one is supported.

> **SUPPORTED.** "IMMORTAL has a mathematically specified safety model with formally stated
> assumptions, proved soundness of its implementable safety gate, explicit certification and
> conformance requirements, and an audited account of what it does not claim."

> **NOT SUPPORTED.** "This implementation has been formally verified."

The second claim requires R2 at minimum, and in practice R1, R3, R7, R8 and R9 as well. No
implementation was supplied to this pass, so the second claim cannot be made, and any
publication of this package must not imply it.

**Recommended publication framing:** publish as a **SPECIFICATION** with the certification
layer attached, stating plainly that conformance of any implementation is future work with a
defined evidence format.

## 6. Verdict

| Dimension | Verdict |
|---|---|
| **A. Mathematical model** | **CLOSED** |
| **B. Normative specification** | **CLOSED** |
| **C. Implementation conformance** | **UNPROVEN — EVIDENCE REQUIRED** |
| **D. Adapter / Ω completeness** | **CONDITIONALLY CLOSED** (theory closed; instance is an adapter obligation) |
| **E. Liveness** | **CONDITIONALLY CLOSED**; liveness itself **NOT CLAIMED** |
| **F. Upgrade / governance** | **CONDITIONALLY CLOSED** (theory strengthened; execution unverifiable here) |
| **G. Composition** | **CONDITIONALLY CLOSED**; naive form **REFUTED** at the gate |
| **H. Documentation** | **CLOSED as specification**, not as verified implementation |

## 7. What this package still does not claim

- That `K*` is computable, or non-empty for any deployment.
- That any certificate, perimeter, partition, valuation or initial state exists for any profile.
- That any implementation conforms, or that any code path was inspected.
- That progress will ever occur.
- That any governance upgrade is admissible.
- That two conforming deployments compose.
- That events outside a declared perimeter are covered.

These are not gaps in the work. They are the boundary between what mathematics can settle and
what evidence must.
