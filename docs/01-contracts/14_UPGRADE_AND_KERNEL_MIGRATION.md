# IMMORTAL Upgrade & Kernel Migration
**Status:** Normative | **Version:** 3.0.0 | **Introduced in v2.0.0; retained in v3.0.0**

## 1. The problem

Let `M_old = (𝒮_o, A_o, Ω_o, T_o, Safe_o)` and `M_new = (𝒮_n, A_n, Ω_n, T_n, Safe_n)`.
Changing any component changes `F` and therefore `K*`:

```
K*_old = νF_old        K*_new = νF_new
```

There is **no general inclusion** between them. An upgrade can therefore strand the live
state outside the new kernel, or silently extinguish crystallized rights. Neither is
detected by any single-model theorem in `03`.

This document defines the migration predicate. It does **not** define a governance
mechanism; who may propose or ratify an upgrade is profile-scoped.

## 2. Migration objects

| Object | Meaning |
|---|---|
| `S_act ∈ 𝒮_o` | canonical state at the activation instant |
| `μ : 𝒮_o ⇀ 𝒮_n` | deterministic, versioned migration map (may be identity) |
| `K_c,old ⊆ K*_old` | certified kernel of the old system |
| `K_c,new ⊆ K*_new` | certified kernel of the new system (CK1–CK8 re-established) |
| `Cryst(S)` | crystallized rights and represented obligations at `S` |
| `Reach_live` | states reachable from the declared `S0` under conforming old-system execution |

## 3. Migration predicate U1–U8

| ID | Condition | Kind |
|---|---|---|
| **U1** | **Kernel admission.** `μ(S_act) ∈ K_c,new`. By T4 this gives `μ(S_act) ∈ K*_new`. | MUST, PROOF |
| **U1′** | *(stronger, optional)* **Fleet admission.** `μ(K_c,old ∩ Reach_live) ⊆ K_c,new`. Required when activation timing is not known in advance, or when multiple instances/states migrate under one specification change. | SHOULD, PROOF |
| **U2** | **Rights preservation.** For every crystallized right/obligation `r ∈ Cryst(S_act)` there is an image in `Cryst(μ(S_act))` of equal or protocol-defined-equivalent economic content. No `r` is reduced or extinguished except through its own permitted settlement or expiry transition. | MUST, PROOF |
| **U3** | **Protection non-regression.** `ProtectedCapital_new(μ(S_act)) ≥` the carried-over protected content, and the new obligation partition remains exhaustive and mutually exclusive (C17) over it. | MUST, PROOF |
| **U4** | **Historical monotonicity.** Defined historical monotone facts are preserved under `μ`; history is not rewritten because operating conditions contracted. | MUST |
| **U5** | **Ω non-narrowing at migration.** If the environment perimeter `E` is unchanged, `Ω_n(μ(S),·)` must not exclude an economically material event class represented in `Ω_o(S,·)`. Any perimeter change is a disclosure event under C23. | MUST |
| **U6** | **Activation atomicity.** Activation is a single canonical transition subject to the ordinary gate: precondition, validation, complete post-state check, atomic commit. A half-migrated economic state is non-conforming. | MUST |
| **U7** | **Anti-trivialisation.** `Safe_n` retains every clause of the Constitution marked **[M]**. An upgrade may not satisfy U1 by weakening `Safe_n` toward `𝒮_n`. Formally: the mandatory predicate `Mand` satisfies `Safe_n ⊆ Mand_n` and `Mand_n` is the image under `μ` of `Mand_o` restricted to preserved content. | MUST |
| **U8** | **Determinism and disclosure.** `μ`, `M_new`, `K_c,new` and the CK8 evidence are published, versioned, domain-separated and reproducible before activation. | MUST |

## 4. T-UPGRADE — Safe kernel migration

**Statement.** Suppose U1, U3, U5, U6, U7, U8 hold at activation time `t_act`; `K_c,new`
satisfies CK1–CK8 for `M_new`; and post-activation execution conforms to C-EXEC with respect
to `M_new` and `K_c,new`. Then

```
∀ t ≥ t_act :  S_t ∈ K_c,new ⊆ K*_new ⊆ Safe_n
```

and, if U2 and U4 additionally hold, every right crystallized at `S_act` persists in the
post-activation history except through its own permitted settlement or expiry transition.

**Proof.** U1 supplies the base case `μ(S_act) ∈ K_c,new`. CK2/CK3 for `K_c,new` supply the
hypotheses of T6 in `M_new`. C-EXEC supplies hypothesis 2 of T6. U5 supplies hypothesis 4.
T6 then gives `S_t ∈ K_c,new ⊆ Safe_n` for all `t ≥ t_act`, and T4 gives `K_c,new ⊆ K*_new`.
The rights clause is immediate from U2 (image existence) and U4 (no historical rewrite),
since by U6 the activation itself is a single transition and thus cannot produce an
intermediate state in which a right exists in neither system. ∎

**Status:** CONDITIONALLY PROVEN. Every hypothesis is either a conformance obligation
(C21, C5b) or a certificate obligation (CK1–CK8). **Nothing here proves that a particular
governance action satisfies them.**

## 5. What T-UPGRADE does NOT establish

| Non-claim |
|---|
| That an upgrade is economically *desirable*, fair, or well-motivated |
| That `K*_new ⊇ K*_old` (generally false and not required) |
| That holders are no worse off in market terms — only that crystallized protocol rights survive |
| That governance is legitimate, authorised or correctly executed |
| That `K_c,new` exists; if no certificate can be produced for `M_new`, the upgrade is inadmissible |
| That a stranded state can be repaired; if `μ(S_act) ∉ K_c,new`, the upgrade MUST NOT activate |

## 6. Inadmissible-upgrade behaviour

If U1–U8 cannot all be demonstrated before activation, the upgrade MUST NOT activate. The
system continues under `M_old`, including in permanent stall. "Activate anyway and repair
later" is non-conforming: it is exactly the class of action the gate exists to prevent, and
it cannot be authorised by governance (Constitution §10, §14).

## 7. Changing `K_c` alone
Replacing the certificate while leaving `M` unchanged is still an upgrade event (CK7) and
requires U1, U6, U8 at minimum, plus re-established CK1–CK8. Enlarging `K_c` without a new
CK3 proof is the canonical unsound upgrade.
