# IMMORTAL Final Audit & Closure Matrix
**Status:** Audit | **Version:** 3.0.0

Legend for **Final status**: CLOSED · CONDITIONALLY CLOSED · PARTIALLY CLOSED · UNPROVEN · REFUTED.

## 1. Property matrix

| Property | Universal semantics | Mathematical proof | Concrete implementation | External / profile dependency | Final status |
|---|---|---|---|---|---|
| Authority hierarchy | Constitution §2 | n/a (rule) | design + audit (C2) | none | CLOSED (normative) |
| Canonical truth | `02` §1, C11 | n/a (rule) | verification predicate (C1, C11) | truth sources | CLOSED (normative) |
| Obligation representation | Constitution §3, I1 | n/a (rule) | C3 | none | CLOSED (normative) |
| Protected capital | Constitution §4, I2 | n/a (rule) | C4 | valuation source | CLOSED (normative) |
| Raw surplus | `02` §3 | definitional | C4 | EEV | CLOSED (definition) |
| CAR abstraction | `02` §4 | n/a | profile mapping | profile | CLOSED |
| Safety predicate `Safe` | `02` §1 | consumed by T6 | C5, C5b | profile defines instance | CLOSED (normative) |
| Ω authority (no narrowing) | Constitution §6 | **T9** | C14 | adapter | CLOSED |
| **Ω completeness** | `16` §2.1 | **not provable universally** | C14, C23 | **adapter/profile obligation** | **CONDITIONALLY CLOSED** |
| Viability kernel `K*` | `03` §1–§3 | **T1–T3, T5** | not computed at runtime | none | CLOSED (semantics) |
| **Concrete kernel under-approximation** | `03` §4 | **T4 (T-KUNDER)** | CK1–CK8, C5a | certifier evidence | **CLOSED (semantics) / EVIDENCE REQUIRED (instance)** |
| Execution gate (definition) | `02` §2 (D4) | DEFINITIONAL | — | — | CLOSED (definition only) |
| **Implementation execution conformance** | C5b, C18 | **T8 conditional** | refinement evidence | codebase | **PARTIALLY CLOSED — EVIDENCE REQUIRED** |
| Infinite-horizon safety | `03` §6 | **T6** | via T8 | Ω, C-EXEC | CLOSED (model) / CONDITIONAL (deployment) |
| Adaptive adversarial safety | `06` | **T7** (corollary of T6) | via T8 | Ω, C-EXEC | CLOSED under stated premises |
| Expiry finality | Constitution §9, I9 | T12 conditional | C8 | none | CLOSED (semantics) / EVIDENCE REQUIRED |
| Atomicity | Constitution §8, I6 | T13 normative | C6 | substrate | CLOSED (semantics) / EVIDENCE REQUIRED |
| EEV correctness | C16 | T21 | fail-closed path | **adapter/oracle** | CONDITIONALLY CLOSED |
| **Liveness** | `13` | **T16 conditional (L1–L4)** | C19, C20 | actors, delivery, inclusion | **CONDITIONALLY CLOSED — not claimed by IMMORTAL** |
| Non-blocking certificate | `13` §3, CK3′ | **T15 conditional** | C20 | certifier | CONDITIONALLY CLOSED |
| **Upgrades** | `14` | **T17 (U1–U8)** | C21 | governance execution | **CONDITIONALLY CLOSED** |
| **Composition** | `15` | **T18 REFUTED**, T19 conditional, **T20 PROVEN** | C22, X1–X7 | joint certificate | **CONDITIONALLY CLOSED (naive form REFUTED)** |
| Conservation | `05` §2–§3 | **T14 conditional (C17)** | C17 | partition completeness | CONDITIONALLY CLOSED |
| Non-vacuity | Constitution §7 | **T11 NOT CLAIMED universally** | C15 witness | profile values | CLOSED as deployment obligation |
| Implementation conformance | — | **T22** | — | codebase, traces | **UNPROVEN — EVIDENCE REQUIRED** |
| PRE-RICH separation | Constitution §1, `02` §7 | n/a | contamination audit | application layer | CLOSED |

## 2. What changed from v1.0.0

v1.0.0 reported 16 domains "CLOSED" and 1 "EVIDENCE REQUIRED". That matrix conflated
*normative closure* with *mathematical proof* and did not distinguish the abstract kernel
from anything an implementation can evaluate. This matrix separates the five columns and, as
a result, reports fewer unqualified closures — one line (`composition`, naive form) is now
**REFUTED** rather than absent.

## 3. R1–R9 discharge matrix (v3.0.0)

| ID | Property | Mathematically provable? | Can this package discharge it? | External evidence required? | Exact missing artifact | Status |
|---|---|---|---|---|---|---|
| **R1** | Certified kernel `K_c` | **Yes, the theory** — T4, T-CHAR, T-CERT, T-MARGIN, T-EROSION | theory **YES**, instance **NO** | deployment certification | E1 profile instantiation + E2–E8 | **PARTIALLY DISCHARGED** |
| **R2** | Refinement / execution-gate conformance | theorem only — T-REFINE-FWD | **NO** | implementation | the implementation + RF1–RF11, esp. RF8 | **NOT DISCHARGEABLE HERE** |
| **R3** | Ω perimeter and completeness | **admission condition settled** — T-OMEGA-ADMIT, T9 | theory **YES**, instance **NO** | adapter | P1–P8 for a real `Env` | **PARTIALLY DISCHARGED** |
| **R4** | Liveness | conditional + two negatives — T-PROG, T-NOLIVE, T-STALL-ATTRIB | theory **YES**, instance **NO** | environment/substrate | L-E1, L-E4 | **PARTIALLY DISCHARGED; liveness NOT CLAIMED** |
| **R5** | Upgrade migration | **strengthened** — T-UPGRADE-NEC, -NOMONO, -FULL; T-U1-SUFF refuted | theory **YES**, instance **NO** | governance execution | `M_new`, `μ`, `K_c,new`, UC1–UC10 | **PARTIALLY DISCHARGED** |
| **R6** | Composed-system certificate | **corrected** — T-COMP-SOUND, -INDEP, -GATE; T18 refuted at the gate | theory **YES**, instance **NO** | second system | `M_AB`, joint certificate, **joint gate** | **PARTIALLY DISCHARGED** |
| **R7** | Accounting partition | **corrected, two-sided** — T-CONS-2, T-CONS-GAP | theory **YES**, instance **NO** | profile economics | PA2 exhaustiveness, PA7 omission review | **PARTIALLY DISCHARGED** |
| **R8** | Non-vacuity / `S₀` | **obstruction test added** — T-NV-CHAIN, T-NV-SUFF, T-EROSION | theory **YES**, instance **NO** | profile values | NV1–NV5 | **PARTIALLY DISCHARGED** |
| **R9** | EEV contract | **both directions** — T-EEV-REL, T-EEV-MONO | theory **YES**, instance **NO** | adapter/oracle | EV1–EV7 | **PARTIALLY DISCHARGED** |

Detail in `RESIDUAL_OBLIGATION_REGISTER.md`. **Every remaining blocker is repository access,
implementation execution, adapter evidence, governance execution, or deployment-specific
certification.** None can be removed by further documentation.

## 4. Final multidimensional verdict

| Dimension | Verdict | Basis |
|---|---|---|
| **A. Mathematical model** | **CLOSED** | 20 PROVEN entries incl. T-CHAR, T-EROSION, T-OMEGA-ADMIT, T-EEV-MONO, T-NOLIVE; limits (computability, non-vacuity) explicitly not claimed; 5 flagged shallow |
| **B. Normative specification** | **CLOSED** | Constitution + `02`–`05`, `07`, `13`–`16` internally consistent; every obligation identified |
| **C. Implementation conformance** | **EVIDENCE REQUIRED** | T8 is conditional; this documentation baseline does not certify the repository implementation |
| **D. Adapter / Ω** | **CONDITIONALLY CLOSED** | T9 proven; completeness is a profile admission obligation (T10) |
| **E. Liveness** | **CONDITIONALLY CLOSED** | T15/T16 under L1–L4 + CK3′; not claimed by IMMORTAL alone |
| **F. Upgrade** | **CONDITIONALLY CLOSED** | T17 under U1–U8; governance execution unverifiable here |
| **G. Composition** | **CONDITIONALLY CLOSED; naive form REFUTED at the gate** | T18 refuted (corrected level); T18a withdrawn as too strong; T20 proven; T19 under strict independence; T-COMP-GATE conditional |
| **H. Open-source documentation** | **CLOSED as SPECIFICATION, not as verified implementation** | see `VERIFICATION_STATUS.md` §5 for the two claims and which one is supported |

**This is not a claim that any existing implementation conforms.** It is a claim about the
crystallized universal normative model and its explicitly stated premises.
