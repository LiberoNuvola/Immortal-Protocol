# IMMORTAL Constitution — Hardened Crystallization
**Status:** Normative (root authority) | **Version:** 3.0.0 | **Date:** 17 September 2026

Clauses marked **[M]** are *mandatory safety predicates* in the sense of §10 and §14: they
may not be bypassed, suspended or weakened by governance, policy, liveness machinery or
upgrade.

---

## 1. Purpose
IMMORTAL is a general economic protocol whose validity derives from canonical state,
verified evidence, obligations, executable/protected liquidity and admissible transitions
rather than discretionary personal authority. It is chain- and application-neutral.

## 2. Authority **[M]**
No founder, developer, administrator, operator, relayer, publisher, adapter or frontend
acquires discretionary economic authority merely by operating infrastructure. Canonical
truth derives from defined verification predicates.

## 3. Obligations **[M]**
Every accepted obligation and economically material unresolved exposure must be represented
before the action creating or accepting it becomes executable. Unrepresentable exposure
blocks execution.

## 4. Protection **[M]**
`RawSurplus = max(0, EEV − ProtectedCapital)`. Protected capital cannot become discretionary
surplus merely because current liquidity is positive.

## 5. Viability semantics
```
Pre(K) = { S | ∃ a ∈ A(S) : ∀ ω ∈ Ω(S,a), T(S,a,ω) ∈ K }
F(K)   = Safe ∩ Pre(K)
K*     = νF
```
`K*` defines the **maximal viability semantics** of the protocol. It is a semantic object.

## 5a. Executable viability **[M]**
Economic execution is gated on a **certified concrete kernel** `K_c` satisfying
`K_c ⊆ Safe` and `K_c ⊆ Pre(K_c)`, hence `K_c ⊆ K*` (Proof Register **T4**).

```
A_exec(S) ⊆ A_safe(S, K_c) ⊆ A_safe(S, K*)
```

A deployment MUST declare its `K_c`. A deployment MUST NOT claim to test membership in an
uncomputed `K*`. Conservatism of `K_c` (rejecting actions that were `K*`-viable) is
permitted; unsoundness is not.

## 6. Ω authority and completeness **[M]**
Ω is authoritative relative to a **declared environment perimeter** `E`. It cannot be
narrowed by an actor, caller, adapter or operator. Narrowing is unsound — not merely
forbidden by fiat (Proof Register **T9**). Enlarging Ω is always sound and conservative.

Ω completeness relative to `E` is an **adapter/profile admission obligation**, not a
theorem. The perimeter `E` and the residual-risk statement MUST be published.
See `16_OMEGA_COMPLETENESS_CONTRACT.md`.

## 7. Non-vacuity
A deployment claiming live viability MUST provide a witness `S0 ∈ K_c` for its certified
kernel, whence `S0 ∈ K*`. No universal witness is claimed. `K* = ∅` is mathematically
possible and is not excluded by fixed-point existence.

## 8. Atomicity **[M]**
```
PRECONDITION → VALIDATE → COMPUTE DELTA → CHECK POST-STATE → COMMIT ATOMICALLY → POSTCONDITION
```
A partial economic state is non-conforming.

## 9. Expiry **[M]**
After expiry: no claimability, no new liability, no resurrection, no economic effect from
late reveal, and expiry-dissolving commitments dissolve.

## 10. Liveness and governance **[M]**
Liveness mechanisms cannot override economic safety. Governance cannot bypass mandatory
safety predicates or rewrite crystallized rights.

## 11. Determinism **[M]**
Protocol-defined derivations are deterministic, domain-separated, versioned, reproducible
and independently verifiable.

## 12. Safety, viability and liveness are distinct
- **Safety:** no committed action leaves the certified kernel.
- **Viability:** from every state of the certified kernel a safe continuation *exists*.
- **Liveness:** under separately declared assumptions, some viable action is *eventually
  executed*.

IMMORTAL guarantees safety and viability. It does **not** guarantee liveness by itself.
A permanent safe stall is safety-conforming. See `13_LIVENESS_AND_PROGRESS_SPECIFICATION.md`.

## 13. Composition
Individually conforming deployments do **not** automatically compose. Any interaction
between IMMORTAL instances requires an explicit composition contract (**C-COMP**).
See `15_COMPOSITION_CONTRACT.md`.

## 14. Upgrade **[M]**
A change to `Safe`, `Ω`, `T`, `A` or the obligation partition changes `F` and therefore
`K*`. An upgrade is economically admissible only if it satisfies the migration predicate
**U1–U8** of `14_UPGRADE_AND_KERNEL_MIGRATION.md`, including:

- the activation state lies in the new certified kernel;
- crystallized rights and represented obligations are preserved;
- the mandatory clauses of this Constitution (marked **[M]**) are retained, so that an
  upgrade cannot trivially satisfy migration by weakening `Safe` toward `𝒮`.

## 15. Anti-circularity **[M]**
No conformance claim may be supported by an assumption it is intended to establish. In
particular: implementation conformance is not a theorem about the abstract model, and Ω
completeness may not be cited as evidence for itself. See `08` §2.
