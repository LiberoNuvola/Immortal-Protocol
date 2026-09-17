# IMMORTAL Conformance Specification
**Status:** Normative | **Version:** 3.0.0

Each requirement carries an **evidence class**:
`DESIGN` (specification review) · `PROOF` (mathematical/mechanised) ·
`TEST` (tests, replay, traces) · `MODEL` (model checking / inductive invariant) ·
`DISCLOSURE` (published declaration) · `AUDIT` (independent review).

---

## 1. Core requirements

| ID | Requirement | Evidence |
|---|---|---|
| C1 | Canonical state represented or deterministically derivable | DESIGN, TEST |
| C2 | No forbidden infrastructure authority (Constitution §2) | DESIGN, AUDIT |
| C3 | Obligations represented before the creating action is executable | DESIGN, TEST |
| C4 | Protected amounts non-discretionary | DESIGN, TEST |
| **C5** | **Execution checks viability against a declared certified concrete kernel `K_c`** (see C5a) | MODEL/PROOF |
| **C5a** | `K_c` satisfies **CK1–CK8** of `03` §4.4; the certificate and its evidence are published | PROOF, MODEL, DISCLOSURE |
| **C5b** | **C-EXEC:** every action actually committed by the implementation lies in `A_exec^spec(S;K_c)` under the declared refinement relation (see §2) | PROOF, MODEL, TEST, AUDIT |
| C6 | Coupled transitions atomic | DESIGN, TEST |
| C7 | Derivations deterministic, domain-separated, versioned | DESIGN, TEST |
| C8 | Expiry final | DESIGN, TEST |
| C9 | Settlement consumes the canonical right exactly once | DESIGN, TEST |
| C10 | Liveness subordinate to safety | DESIGN, AUDIT |
| C11 | Canonical truth uses a verification predicate | DESIGN |
| C12 | Historical and current state separated | DESIGN |
| C13 | Crystallized rights not silently recomputed | DESIGN, TEST |
| **C14** | **Ω authority and completeness demonstrated against a published perimeter `E`**, per `16_OMEGA_COMPLETENESS_CONTRACT.md` | DISCLOSURE, AUDIT, MODEL |
| C15 | Live deployment supplies a witness `S0 ∈ K_c` (hence `S0 ∈ K*` by T4) | PROOF, DISCLOSURE |
| C16 | EEV verification, freshness and failure contract; fail closed | DESIGN, TEST |
| C17 | Obligation/exposure partition exhaustive and non-overlapping | PROOF, AUDIT |

## 2. Additional conformance requirements retained in v3.0.0

| ID | Requirement | Evidence |
|---|---|---|
| **C18** | **Refinement disclosure.** The deployment declares a relation `ρ ⊆ Impl × 𝒮` mapping implementation states to canonical states, with: (i) `ρ` relates the implementation's initial state to a declared `S0 ∈ K_c`; (ii) every committed implementation step is related to exactly one canonical transition `T(S,a,ω)` with `a ∈ A_exec^spec(S;K_c)`; (iii) no committed implementation step is unrelated to a canonical transition. | PROOF, MODEL, TEST |
| **C19** | **Liveness contract disclosure.** The deployment publishes its progress assumptions L1–L4 (`13`) and states plainly that safety does not depend on them. | DISCLOSURE |
| **C20** | **Non-blocking certificate.** `K_c` satisfies CK3′ (acceptance-compatible inductiveness), so that a stall inside `K_c` is attributable to an assumption violation rather than to the gate. | PROOF, MODEL |
| **C21** | **Upgrade migration admissibility.** Any change to `Safe`, `Ω`, `T`, `A`, the obligation partition or `K_c` satisfies U1–U8 (`14`) and is itself an atomic canonical transition. | PROOF, AUDIT, DISCLOSURE |
| **C22** | **Composition contract.** Any economic interaction with another IMMORTAL instance or external economic system satisfies X1–X6 (`15`) and is certified on the **joint** system. | PROOF, AUDIT |
| **C23** | **Perimeter residual-risk statement.** Published statement naming event classes outside `E` and therefore outside the guarantee. | DISCLOSURE |
| **C24** | **Anti-circularity.** No conformance artefact cites, as its evidence, the claim it is meant to establish. | AUDIT |

## 3. Status of evidence

Evidence may consist of formal proofs, mechanised proofs, model checking, inductive
invariant certificates, deterministic replay, tests, traces and independent review.

**Evidence establishes implementation conformance. Evidence does not create normative
authority, and conformance evidence is never a substitute for a proof about the model
(nor a proof about the model a substitute for conformance evidence).**

## 4. Non-conformance
Failure of any MUST requirement makes the deployment non-conforming. A non-conforming
deployment may not cite the theorems of `08` as applying to it.
