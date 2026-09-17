# IMMORTAL Composition Contract
**Status:** Normative | **Version:** 3.0.0 | **Introduced in v2.0.0; corrected and retained in v3.0.0**

## 1. The claim under examination

> Two individually conforming IMMORTAL deployments compose into a conforming product system.

**This claim is REFUTED.** §3 gives a counterexample. §4–§6 give the conditions under which
a correct compositional statement can be made.

## 2. Setup

Let `M_A = (𝒮_A, A_A, Ω_A, T_A, Safe_A)` and `M_B` likewise, with certified kernels `K_A`,
`K_B` satisfying CK2/CK3 in their own systems.

A **composed system** `M_AB` has state space `𝒮_A × 𝒮_B` (or a quotient thereof when the
systems share economic content), a joint action structure, a joint envelope `Ω_AB`, a joint
transition `T_AB` and a joint safety predicate `Safe_AB`.

The naive conjecture is `K_A × K_B ⊆ K*_AB`, i.e. that the product of certificates is a
certificate.

## 3. Counterexample (shared resource) — corrected in v3.0.0

> **Correction notice.** v2.0.0 stated this counterexample as
> `K_A × K_B ⊄ Pre_AB(K_A × K_B)`. Mechanical checking of a finite instance
> (`verification/finite_model_checks.py`) showed that phrasing is **too strong**: when both
> systems admit an idle action, the product *set* can still satisfy `K ⊆ Pre(K)` in the joint
> system, because "both idle" witnesses `Pre`. The refutation is real but lives one level
> down, at the **gate**. The corrected statement is below. Nothing else in the package
> depended on the superseded phrasing.

Let a single external reserve `R` with initial value `1` be economically visible to both
systems, and let local safety require each system's draw to keep `R ≥ 0`.

- `M_A` alone: `R = 1`, `drawA` costs 1. In `M_A`'s model nothing else draws on `R`, so
  `drawA` is locally gated: its unique successor has `R = 0`, which is locally safe.
- `M_B` alone: symmetric; `drawB` is locally gated.
- Compose: both systems are in their certified kernels, each independently commits its
  locally gated draw, and the joint post-state has `R = −1`.

Three distinct failures are involved, and they are **not** interchangeable.

### F1 — Type failure
With shared economic content, `𝒮_AB ≠ 𝒮_A × 𝒮_B`: both local state spaces contain the same
`R`, so the naive product is not even well formed. Condition 1 of T-COMP-INDEP fails
structurally, before any inductiveness question arises.

### F2 — Gate failure (the substantive one)
Force a mapping anyway. Then

```
A_safe_A(S_A, K_A) × A_safe_B(S_B, K_B)  ⊄  A_safe_AB(S_AB, K_A × K_B)
```

Each factor is individually gated; the joint action they jointly constitute is not. This is
the refutation: **the product of certificates does not yield a sound joint gate.**

### F3 — Set inductiveness does not rescue the gate
The product *state set* may still satisfy `K ⊆ Pre_AB(K)` — witnessed by "both systems
idle" — and the joint start state may lie in `K*_AB`. Neither fact makes the composition
safe, because safety is delivered by the **gate** (which actions are committable), not by
the existence of *some* safe continuation. F3 is the reason a deployment cannot discharge
C22 by exhibiting an inductive product set: it must exhibit a joint gate.

**Mechanically confirmed.** `verification/FINITE_MODEL_CHECK_RESULTS.txt` reports
F1 = True, F2 = True, F3 = True on the finite instance above, together with the existence of
a sound joint certificate that works precisely by excluding the simultaneous-draw action.

**Generalisation.** The same structure arises from shared collateral or liquidity, shared
CAR, cross-system obligations, mutually referencing EEV sources, and interleavings that
neither single-system model enumerated.

## 4. C-COMP — Composition Conformance Contract

Any economic interaction between an IMMORTAL deployment and another IMMORTAL instance or
external economic system MUST satisfy:

| ID | Condition |
|---|---|
| **X1** | **Environment compatibility.** For every jointly reachable state, the projection onto `A` of every joint transition lies within the envelope `Ω_A` already certified — i.e. `Ω_A` over-approximates `B`'s observable economic effect on `A`, and symmetrically. Where it does not, `Ω_A` MUST be enlarged (sound by T9) and the certificate re-established. |
| **X2** | **Resource accounting.** Every economic resource visible to both systems is represented in **one** canonical exhaustive partition with a designated owner or arbiter, or each system's protection is computed against an exclusive, non-overlapping share. Double-counting of a shared resource is non-conforming. |
| **X3** | **Non-interference on protected content.** No action of one system may reduce protected content of the other except through a represented cross-system obligation. |
| **X4** | **Cross-system atomicity.** A coupled cross-system obligation either commits atomically in both systems, or is represented in both as unresolved exposure until it settles. No conforming intermediate state may exist in which the obligation is real in one system and absent in the other. |
| **X5** | **Joint certification.** A certificate `K_AB` is established **on the composed system**, satisfying `K_AB ⊆ Safe_AB` and `K_AB ⊆ Pre_AB(K_AB)` under `Ω_AB`. `K_AB = K_A × K_B` may be *proposed* but must be *proved*; it is not inherited. |
| **X5b** | **Joint gate.** The set of jointly committable actions is certified against `K_AB`: `A_exec^spec_AB(S;K_AB) = {a | Accept_AB(S,a) ∧ ∀ω∈Ω_AB(S,a): T_AB(S,a,ω) ∈ K_AB}`. Exhibiting an inductive joint state *set* does **not** satisfy X5b (see §3 F3). Where the systems act concurrently, the joint action space must include the simultaneous combinations, and each must be gated. |
| **X6** | **Stutter admissibility.** Under interleaved (asynchronous) composition, each system admits an idle action, and each certificate is inductive under the other system's transitions as environment steps. |
| **X7** | **Perimeter union.** The composed perimeter is `E_A ∪ E_B` plus the interaction surface itself; the residual-risk statement (C23) is re-issued for the composed system. |

## 5. T-COMP-SOUND

**Statement.** For any `K_AB` with `K_AB ⊆ Safe_AB` and `K_AB ⊆ Pre_AB(K_AB)`, we have
`K_AB ⊆ K*_AB`, and T6 applies to the composed system.

**Proof.** Direct instance of T4 applied to `M_AB`. ∎

**Status:** PROVEN. Note what it says: the *only* sound route to composed safety is a
certificate on the composed system. Composition of certificates is never free.

## 6. T-COMP-INDEP — Conditional compositionality under independence

**Statement.** Suppose the composition is **fully independent**:

1. `𝒮_AB = 𝒮_A × 𝒮_B` with no shared economic content;
2. `A_AB(S_A,S_B) = A_A(S_A) × A_B(S_B)` (synchronous product);
3. `Ω_AB((S_A,S_B),(a_A,a_B)) = Ω_A(S_A,a_A) × Ω_B(S_B,a_B)`;
4. `T_AB((S_A,S_B),(a_A,a_B),(ω_A,ω_B)) = (T_A(S_A,a_A,ω_A), T_B(S_B,a_B,ω_B))`;
5. `Safe_AB = Safe_A × Safe_B`.

If `K_A ⊆ Safe_A`, `K_A ⊆ Pre_A(K_A)` and likewise for `B`, then

```
K_A × K_B ⊆ Safe_AB  and  K_A × K_B ⊆ Pre_AB(K_A × K_B)
```

hence `K_A × K_B ⊆ K*_AB` and T6 applies to the product.

**Proof.** Safety: immediate from (5). Inductiveness: let `(S_A,S_B) ∈ K_A × K_B`. By CK3
choose witnesses `a_A` for `S_A` and `a_B` for `S_B`. By (2), `(a_A,a_B) ∈ A_AB(S_A,S_B)`.
Let `(ω_A,ω_B) ∈ Ω_AB` be arbitrary; by (3), `ω_A ∈ Ω_A(S_A,a_A)` and `ω_B ∈ Ω_B(S_B,a_B)`.
By (4) the successor is `(T_A(S_A,a_A,ω_A), T_B(S_B,a_B,ω_B)) ∈ K_A × K_B` by the two
witnesses. So `(S_A,S_B) ∈ Pre_AB(K_A × K_B)`. Apply T4. ∎

**Status:** PROVEN **under assumptions 1–5**.

**Scope warning.** Assumptions 1–5 are strong and, in practice, rarely hold: assumption 1
fails for any shared reserve, CAR, collateral or oracle; assumption 3 fails for correlated
environments (a common liquidity shock is not a product event); assumption 2 fails under
interleaving, where X6 is needed instead. A deployment MUST NOT invoke T-COMP-INDEP without
demonstrating each of 1–5; in particular **correlation between the two environments is
sufficient to defeat assumption 3**, and correlation is the normal case in economic systems.

## 7. Correct universal statement

> IMMORTAL safety guarantees are compositional **only under an explicit composition
> contract**, and the strongest unconditional universal result is T-COMP-SOUND: the composed
> system requires its own certificate. Under strict independence (T-COMP-INDEP) the product
> of certificates is one; under correlation, shared resources or interleaving, it is not.
