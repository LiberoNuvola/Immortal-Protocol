# IMMORTAL Economic Kernel — Hardened
**Status:** Normative | **Version:** 3.0.0

All results in this document are stated over a fixed system
`M = (𝒮, Act, A, Accept, Ω, T, Safe)` with `Ω(S,a) ≠ ∅` for accepted `(S,a)` and `T` total
on `{(S,a,ω) | Accept(S,a), ω ∈ Ω(S,a)}`.

---

## 1. Definitions

```
Pre(K) = { S ∈ 𝒮 | ∃ a ∈ A(S) : ∀ ω ∈ Ω(S,a), T(S,a,ω) ∈ K }
F(K)   = Safe ∩ Pre(K)
K*     = νF
```

`(P(𝒮), ⊆)` is a complete lattice.

---

## 2. T1 — Monotonicity

**Statement.** If `K ⊆ K'` then `Pre(K) ⊆ Pre(K')`, hence `F(K) ⊆ F(K')`.

**Proof.** Let `S ∈ Pre(K)`. There is `a ∈ A(S)` with `T(S,a,ω) ∈ K` for all `ω ∈ Ω(S,a)`.
Since `K ⊆ K'`, the same `a` witnesses `T(S,a,ω) ∈ K'` for all `ω`. So `S ∈ Pre(K')`.
Intersecting with the fixed set `Safe` preserves inclusion. ∎

**Status:** PROVEN.

---

## 3. T2/T3 — Existence and characterisation of `K*`

**Statement.** `F` is monotone on a complete lattice, so by Knaster–Tarski the greatest
fixed point exists and

```
K* = νF = ⋃ { K ⊆ 𝒮 | K ⊆ F(K) }
```

Consequently `K* = F(K*)`, hence `K* ⊆ Safe` and `K* ⊆ Pre(K*)`.

**Proof.** Standard Knaster–Tarski, using T1. Let `U = ⋃{K | K ⊆ F(K)}`. For any
post-fixed `K`, `K ⊆ F(K) ⊆ F(U)` by T1, so `U ⊆ F(U)`; applying `F` and T1 again gives
`F(U) ⊆ F(F(U))`, so `F(U)` is post-fixed and `F(U) ⊆ U`. Hence `U = F(U)` and `U` is the
greatest fixed point. ∎

**Status:** PROVEN.

**Caution.** Existence does **not** imply: non-emptiness, computability, finite
convergence of the decreasing iteration `K_0 = 𝒮, K_{α+1} = F(K_α)`, or decidability of
`S ∈ K*`. On an infinite `𝒮` the iteration may require transfinite ordinals and the
limit may be non-recursive. No claim to the contrary is made anywhere in this package.

---

## 4. T4 / **T-KUNDER** — Soundness of concrete post-fixed-point under-approximation

**Statement.** Let `K_c ⊆ 𝒮` satisfy

```
(CK2)  K_c ⊆ Safe
(CK3)  K_c ⊆ Pre(K_c)
```

Then `K_c ⊆ F(K_c)`, and therefore `K_c ⊆ K*`.

**Proof.** `F(K_c) = Safe ∩ Pre(K_c) ⊇ K_c ∩ K_c = K_c` by CK2 and CK3. So `K_c` is a
post-fixed point of `F`. By the characterisation in T3, `K_c ⊆ ⋃{K | K ⊆ F(K)} = K*`. ∎

**Status:** PROVEN. (This is the coinduction principle for `F`.)

### 4.1 Why this is a *sound* under-approximation
Every state certified by `K_c` is genuinely `K*`-viable. Safety conclusions drawn from
`K_c` therefore hold in the maximal semantics: an execution that never leaves `K_c` never
leaves `K*` and never leaves `Safe`.

### 4.2 Why membership in `K_c` is sufficient for the guarantee
The infinite-horizon argument (T6) requires only that the region used by the gate is
(i) contained in `Safe` and (ii) closed under the chosen action's Ω-successors. `K_c`
satisfies both by CK2/CK3. `K*`-maximality is never needed for safety — only for
optimality.

### 4.3 Why membership in `K_c` is NOT complete w.r.t. `K*`
In general `K_c ⊊ K*`. A state `S ∈ K* \ K_c` is genuinely viable yet rejected by the
gate. Likewise an action whose successors land in `K* \ K_c` is rejected although it was
`K*`-safe. This is **conservatism**: it can cost liveness and economic efficiency, and can
cause a safe stall, but it can never cause an unsafe commit.

Asymmetry to remember:
```
K_c too small  →  conservative, possibly illiquid/stalling, still SAFE
K_c too large  →  CK3 fails  →  certificate invalid  →  UNSOUND
```
Only CK3 stands between the two. Its demonstration is the whole burden of certification.

### 4.4 Required properties of a certified concrete kernel

| ID | Requirement |
|---|---|
| **CK1** | Membership `S ∈ K_c` is effectively checkable by the implementation with the resources available at decision time. |
| **CK2** | `K_c ⊆ Safe`. |
| **CK3** | `K_c ⊆ Pre(K_c)` — inductiveness under the **authoritative** Ω. |
| **CK3′** | *Acceptance-compatible inductiveness:* for every `S ∈ K_c` the witnessing action additionally satisfies `Accept(S,a)`, i.e. `A_exec^spec(S;K_c) ≠ ∅` whenever required authoritative inputs are available. (Required for non-blocking; see `13`.) |
| **CK4** | Non-vacuity witness: a declared `S0 ∈ K_c` (and, where applicable, a recurrent witness). |
| **CK5** | The Ω used in checking CK3 is the authoritative Ω of the declared perimeter `E`; no narrowing (see T9, `16`). |
| **CK6** | The check `∀ω ∈ Ω(S,a): T(S,a,ω) ∈ K_c` is evaluated over the whole envelope, or over a sound over-approximation of it. |
| **CK7** | `K_c` is deterministic, domain-separated, versioned and reproducible; changing `K_c` is an upgrade event (see `14`). |
| **CK8** | The certificate is accompanied by evidence (proof, model-checking, inductive-invariant argument, exhaustive analysis) that CK2, CK3, CK3′ hold. |

**CK1–CK8 are conformance obligations, not theorems.** T4 is the theorem that makes them
*sufficient*.

### 4.5 Operational reading of conformance requirement C5
C5 ("execution checks viability") MUST be read as:

> Execution checks membership of every authoritative Ω-successor in the deployment's
> declared, evidenced certified kernel `K_c`, where `K_c` satisfies CK1–CK8.

C5 MUST NOT be read as "compute `νF` at runtime".

---

## 4A. T-CHAR — Game-theoretic characterisation of `K*`
**New in v3.0.0.**

**Statement.** `K*` is exactly the set of states from which the protocol has a strategy
that keeps every `Ω`-history inside `Safe` forever:

```
K* = { S | ∃ strategy σ : every Ω-history from S under σ stays in Safe indefinitely }
```

**Proof.** Write `W` for the right-hand side.

*(W ⊆ K*)* Let `S ∈ W` with witnessing strategy `σ`. Then `S ∈ Safe`, and `σ` prescribes an
action `a` all of whose `Ω`-successors again admit a winning continuation (the residual
strategy), so `S ∈ Pre(W)`. Hence `W ⊆ Safe ∩ Pre(W) = F(W)`, and by **T4** `W ⊆ K*`.

*(K* ⊆ W)* `K* ⊆ Pre(K*)`, so for each `S ∈ K*` choose (AC) an action `a(S)` with all
`Ω`-successors in `K*`. The positional strategy `σ(S) = a(S)` keeps every history in
`K* ⊆ Safe` forever. ∎

**Status:** PROVEN (uses a choice principle to select the positional strategy).

**Why this matters.** It upgrades `K*` from "a greatest fixed point that happens to be
useful" to a complete characterisation: `K*` is the winning region of the safety game
against `Ω`. Consequences used elsewhere in this package:

- `S ∉ K*` means **no** conforming infinite continuation exists from `S` — so a deployment
  outside `K*` is already committed to eventual unsafety or permanent stall. This is what
  makes the upgrade condition **U1** *necessary*, not merely sufficient (`14`, T-UPGRADE-NEC).
- It makes T5/T6 non-vacuous in the strong sense: the invariant is not an artefact of a
  conveniently chosen region, it is the maximal region with the property.

## 4B. T-EROSION — Quiescent erosion empties the kernel
**New in v3.0.0.**

**Statement.** Let `b : 𝒮 → ℝ` be a *buffer* (for example `b(S) = EEV(S) − ProtectedCapital(S)`)
with `Safe ⊆ {S | b(S) ≥ 0}`. Suppose there is `ε > 0` such that for **every** `S` and every
`a ∈ A(S)` there exists `ω ∈ Ω(S,a)` with

```
b(T(S,a,ω)) ≤ b(S) − ε
```

Then `K* = ∅`.

**Proof.** Suppose `S_0 ∈ K*`. By T5 pick `a` with all `Ω`-successors in `K*`; by hypothesis
one of them, `S_1`, has `b(S_1) ≤ b(S_0) − ε`, and `S_1 ∈ K*`. Iterating gives
`b(S_n) ≤ b(S_0) − nε`, and `S_n ∈ K* ⊆ Safe` forces `b(S_n) ≥ 0` for all `n` — impossible
for `n > b(S_0)/ε`. ∎

**Status:** PROVEN.

**Practical reading.** Under worst-case `Ω` semantics there is no such thing as "slowly
losing ground but staying viable". If the adversary can always erode the protection buffer
by a fixed amount — including while the protocol is quiescent, e.g. through accruing
obligations, carry costs or unavoidable valuation decay — then the viability kernel is
**empty** and the deployment cannot be admitted at all. Contrapositive, which is the usable
form: **non-vacuity requires a non-eroding conservative action** (see `NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md`, QNE).

## 5. T5 — Kernel invariance

**Statement.** For every `S ∈ K*` there exists `a ∈ A(S)` with `T(S,a,ω) ∈ K*` for all
`ω ∈ Ω(S,a)`. Likewise for `K_c` under CK3.

**Proof.** `K* = F(K*) ⊆ Pre(K*)`, which is exactly the assertion. For `K_c`, CK3 is the
assertion. ∎

**Status:** PROVEN.

**Scope note.** T5 asserts *existence* of a safe continuation. It does not assert that the
continuation is accepted, offered, submitted or executed. See `13`.

---

## 6. T6 — Infinite-horizon safety under a certified kernel

**Statement.** Let `K` satisfy `K ⊆ Safe` and `K ⊆ Pre(K)` (e.g. `K = K_c` or `K = K*`).
Suppose

1. `S_0 ∈ K`;
2. for every `t`, the committed action `a_t ∈ A_exec^spec(S_t; K)`;
3. the realised event `ω_t ∈ Ω(S_t,a_t)` and `S_{t+1} = T(S_t,a_t,ω_t)`;
4. Ω is authoritative for the declared perimeter (no narrowing).

Then `∀ t ≥ 0 : S_t ∈ K ⊆ Safe`.

**Proof.** Induction on `t`. Base: hypothesis 1. Step: assume `S_t ∈ K`. By hypothesis 2,
`a_t ∈ A_safe(S_t,K)`, so `T(S_t,a_t,ω) ∈ K` for **every** `ω ∈ Ω(S_t,a_t)`, in particular
for the realised `ω_t`. Hence `S_{t+1} ∈ K`. Since `K ⊆ Safe`, `S_t ∈ Safe` for all `t`. ∎

**Status:** PROVEN (as an implication). Hypothesis 2 is a **conformance obligation**
(C-EXEC); hypothesis 4 is an **adapter obligation** (`16`). The theorem is valid; its
*applicability* to a given system is exactly as strong as those obligations.

---

## 7. T7 — Adversarial strategy closure

**Statement.** Let `σ` be any history-dependent, adaptive strategy selecting, at each step,
an action from the set the implementation will actually commit. If that set is contained in
`A_exec^spec(S_t;K)` at every step and the hypotheses of T6 hold, then `∀t : S_t^σ ∈ K`.

**Proof.** The induction of T6 never refers to how `a_t` was chosen — only to the fact that
`a_t ∈ A_exec^spec(S_t;K)`. Adaptation, repetition, optional stopping, randomisation and
optimisation therefore do not affect it. ∎

**Status:** PROVEN, **as a corollary of T6**.

**Honest characterisation.** T7 is mathematically shallow: given the gate, it is immediate.
Its value is diagnostic — it localises *all* adversarial risk into two places: the gate
conformance premise (C-EXEC) and Ω completeness (`16`). An adversary that cannot break
those cannot break the invariant; an adversary that breaks either is outside the theorem.

---

## 8. T9 / **T-OMEGA-MONO** — Ω monotonicity; narrowing is unsound

**Statement.** Let `Ω` and `Ω′` be envelopes with `Ω(S,a) ⊆ Ω′(S,a)` for all `S,a`. Then
for every `K`:

```
Pre_{Ω′}(K) ⊆ Pre_Ω(K)      and      K*_{Ω′} ⊆ K*_Ω
```

**Proof.** If `a` witnesses `S ∈ Pre_{Ω′}(K)` then `T(S,a,ω) ∈ K` for all `ω ∈ Ω′(S,a) ⊇
Ω(S,a)`, so the same `a` witnesses `S ∈ Pre_Ω(K)`. Hence `F_{Ω′} ⊆ F_Ω` pointwise, and by
T1/T3 the greatest fixed points are ordered the same way. ∎

**Status:** PROVEN.

**Consequences.**
- **Enlarging Ω is always sound** (it shrinks the kernel). Over-approximating an uncertain
  environment is the conservative and permitted direction.
- **Narrowing Ω is unsound**: a certificate proved against a narrowed `Ω` establishes
  membership in `K*_narrow ⊇ K*_true`, which does not imply true viability. This is why
  Ω narrowing is non-conforming — a mathematical fact, not an arbitrary rule.

---

## 9. Non-vacuity

**Not claimed:** `K* ≠ ∅`. Fixed-point existence is compatible with `K* = ∅` (e.g. if
`Safe = ∅`, or if every state has an Ω-successor outside every candidate region).

**Deployment admission (C15).** A live deployment must exhibit `S0 ∈ K_c` for a certified
`K_c` satisfying CK1–CK8. By T4 this yields `S0 ∈ K*` and, with T6, the infinite-horizon
guarantee. No universal witness is manufactured here, because the supplied corpus contains
none and none can be derived without profile-specific values.

---

## 10. Results deliberately NOT asserted

| Non-claim |
|---|
| `K*` is computable or decidable in general |
| the `F`-iteration converges in finitely many steps |
| `K* ≠ ∅` universally |
| a certified `K_c` exists for every profile |
| `K_c = K*` |
| safety implies progress |
| conformance of any implementation |
| Ω completeness of any adapter |
| `K_A × K_B` is a certified kernel of a composed system (see `15`, refuted) |
