# Compositionality Proof and Certification — R6
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** `15_COMPOSITION_CONTRACT.md` carries the contract X1–X7, X5b and
the corrected counterexample. This document derives the strongest available theorem and
gives the certification procedure.

---

## 1. What the counterexample actually refutes (corrected)

v2.0.0 stated the shared-reserve refutation as `K_A × K_B ⊄ Pre_AB(K_A × K_B)`. Mechanical
checking showed that phrasing is too strong: with idle actions available, the product state
set **can** be inductive in the joint system. The refutation survives, one level down:

```
REFUTED:  A_safe_A(S_A,K_A) × A_safe_B(S_B,K_B)  ⊆  A_safe_AB(S_AB, K_A × K_B)
```

Each factor is locally gated; the joint action they constitute is not. Safety is delivered
by the **gate**, so this is the refutation that matters. See `15` §3 F1–F3 and
`verification/FINITE_MODEL_CHECK_RESULTS.txt`.

**Three failure levels, kept distinct:**

| Level | Failure | Status |
|---|---|---|
| Type | shared economic content means `𝒮_AB ≠ 𝒮_A × 𝒮_B` | structural |
| Gate | product of local gates admits an unsafe joint action | **REFUTED claim** |
| Set | product state set may still be inductive — and this does not help | **shown; a trap** |

## 2. The composed system

```
𝒮_AB      composed state space (a quotient of 𝒮_A × 𝒮_B identifying shared content)
A_AB      joint actions, including the simultaneous combinations
Ω_AB      joint envelope over the union perimeter Env_A ∪ Env_B ∪ interaction surface
T_AB      joint transition
Safe_AB   joint safety predicate (⊆, not =, the conjunction of the local ones when content is shared)
```

`Safe_AB` deserves emphasis: with a shared reserve, joint safety is **strictly stronger**
than the conjunction of local safety predicates evaluated on local projections, because the
local predicates each assume exclusive use.

## 3. T-COMP-SOUND (PROVEN)

For any `K_AB ⊆ Safe_AB` with `K_AB ⊆ Pre_AB(K_AB)`: `K_AB ⊆ K*_AB`, and T6 applies to the
composed system. *Proof:* instance of T4 on `M_AB`. ∎

This remains the only unconditional route: **certify the composed system.**

## 4. T-COMP-INDEP (PROVEN under assumptions)

If the composition is fully independent — (1) disjoint economic content, (2) product action
set, (3) **product envelope** `Ω_AB = Ω_A × Ω_B`, (4) componentwise transition, (5) product
safety predicate — then `K_A × K_B ⊆ Safe_AB ∩ Pre_AB(K_A × K_B)`, hence `⊆ K*_AB`.
*Proof:* `15` §6. ∎

**Mechanically confirmed:** 0 failures across 120 randomly generated independent products
(72 vacuous trials where no non-empty certificate existed).

**Scope, restated because it is routinely overstated:** assumption (3) fails under any
environmental correlation — a common liquidity shock is not a product event. Assumption (1)
fails for any shared reserve, CAR, collateral or oracle. In economic systems, correlation is
the normal case, so T-COMP-INDEP is the exception, not the rule.

## 5. T-COMP-GATE — the weakest sufficient composition condition

This is the strongest general statement available short of full joint certification.

**Statement.** Let `K_AB ⊆ 𝒮_AB` with `K_AB ⊆ Safe_AB`. Let `G_AB(S)` be the set of joint
actions the composed deployment can commit. Suppose:

- **(G1) Gate soundness.** `∀S ∈ K_AB, ∀a ∈ G_AB(S), ∀ω ∈ Ω_AB(S,a): T_AB(S,a,ω) ∈ K_AB`.
- **(G2) Gate non-emptiness.** `∀S ∈ K_AB: G_AB(S) ≠ ∅` (or the composition accepts joint stall).
- **(G3) Closure of the joint action space.** `G_AB(S)` covers every action combination the
  two systems can *actually* perform concurrently — including simultaneous combinations that
  neither local model enumerated.

Then every composed execution from `K_AB` remains in `K_AB ⊆ K*_AB ⊆ Safe_AB`.

**Proof.** (G1) makes `K_AB` inductive w.r.t. the committable actions; T4 gives
`K_AB ⊆ K*_AB`; T6 gives the invariant. ∎

**Status:** **CONDITIONALLY PROVEN.** (G3) is the condition the shared-reserve
counterexample violates and is the one a deployment is most likely to omit, because the
offending action (`both draw at once`) is not an action of *either* system considered alone.

**Corollary (sufficient conditions in the familiar vocabulary).** (G1)–(G3) hold if X1–X7 of
`15` §4 hold: environment compatibility (X1) gives (G1) locally; single-owner resource
accounting (X2) removes the double-draw; non-interference (X3) preserves protected content;
cross-system atomicity (X4) removes half-committed obligations; joint certification (X5) and
joint gating (X5b) give (G1)/(G2) globally; stutter admissibility (X6) handles interleaving;
perimeter union (X7) gives the `Ω_AB` needed by (G1).

## 6. Certification procedure

| Step | Action |
|---|---|
| **XC1** | Enumerate shared economic content; if any exists, the product state space is invalid — build `𝒮_AB` as an explicit quotient (X2) |
| **XC2** | Enumerate the **joint action space**, including simultaneous combinations and interleavings; this is (G3) and must be argued exhaustively |
| **XC3** | Build `Ω_AB` over `Env_A ∪ Env_B ∪ interaction`, with a correlation justification (X7, P4) |
| **XC4** | Define `Safe_AB`; show it is at least as strong as the conjunction of local predicates wherever content is shared |
| **XC5** | Produce `K_AB` and discharge VC1–VC6 on `M_AB` (X5) |
| **XC6** | Produce the **joint gate** and discharge (G1)/(G2) against it (X5b) |
| **XC7** | Show cross-system atomicity for every coupled obligation (X4), or represent it as unresolved exposure in both |
| **XC8** | Re-issue the residual-risk statement for the composed system (X7, C23) |

A composition that presents only local certificates plus an inductive product *set* has
satisfied none of XC2, XC6 or XC7, and is non-conforming (C22).

## 7. Status

| Item | Category | Status |
|---|---|---|
| Naive gate compositionality | — | **REFUTED**, mechanically witnessed |
| T-COMP-SOUND | MATHEMATICAL PROOF | **PROVEN** |
| T-COMP-INDEP | MATHEMATICAL PROOF under (1)–(5) | **PROVEN under assumptions**; 0/120 mechanical failures |
| T-COMP-GATE | MATHEMATICAL PROOF, conditional | **CONDITIONALLY PROVEN** |
| XC1–XC8 | NORMATIVE CLOSURE | **CLOSED** |
| Any actual composition | IMPLEMENTATION + ADAPTER CONFORMANCE | **NOT DISCHARGEABLE HERE** |
