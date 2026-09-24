# Refinement Conformance Specification — R2
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** `07` C5b/C18 state the obligation; `08` T8 states the transfer
theorem. This document states the **proof obligations and evidence format**.

---

## 1. Scope of this certification specification

This document does **not** discharge implementation conformance. It defines the refinement
theorem and the RF1–RF11 evidence obligations that a concrete implementation must satisfy.
The implementation snapshot and its conformance evidence are assessed separately.

**Evidence boundary:** the transfer theorem is proved here; RF1–RF11 remain implementation
conformance obligations until supported by concrete repository evidence.

## 2. The refinement relation

```
ρ ⊆ Impl × 𝒮
```

`ρ(σ, S)` reads: implementation state `σ` *represents* canonical state `S`. `ρ` must be:

- **total on reachable implementation states** — every reachable `σ` represents some `S`;
- **functional up to canonical equality** — `ρ(σ,S) ∧ ρ(σ,S′) ⇒ S = S′`;
- **deterministic and versioned**, like any protocol-defined derivation (C7).

## 3. T-REFINE-FWD — forward simulation transfer

**Statement.** Suppose:

1. **(Init)** the implementation's initial state `σ₀` satisfies `ρ(σ₀, S₀)` with `χ(S₀) = 1`;
2. **(Step)** for every committed implementation step `σ → σ′` with `ρ(σ,S)`, there exist
   `a` and `ω ∈ Ω(S,a)` such that `a ∈ A_exec^spec(S; K_c)` and `ρ(σ′, T(S,a,ω))`;
3. **(NoSideDoor)** no reachable implementation step commits economic effect outside the
   steps covered by (Step);
4. `K_c` is a valid certificate (VC1–VC6).

Then every reachable implementation state `σ` satisfies `ρ(σ,S)` for some `S ∈ K_c ⊆ K* ⊆ Safe`.

**Proof.** Induction on the number of committed steps. Base: (Init) and VC6. Step: assume
`ρ(σ,S)` with `S ∈ K_c`. By (Step), `σ′` represents `T(S,a,ω)` with `a ∈ A_exec^spec(S;K_c)`,
so by the gate definition `T(S,a,ω) ∈ K_c` for **every** `ω ∈ Ω(S,a)`, in particular the
realised one. (NoSideDoor) guarantees no other step can change the economic state. ∎

**Status:** PROVEN as an implication. Premises (1)–(3) are **IMPLEMENTATION CONFORMANCE**
and are exactly what R2 requires. (3) is the premise most often false in practice and least
often stated, so it is called out separately here.

## 4. Refinement checklist RF1–RF11

Each row states what must be shown and what counts as evidence.

| RF | Obligation | Formal content | Evidence |
|---|---|---|---|
| **RF1 State correspondence** | every reachable `σ` maps to exactly one canonical `S` | totality + functionality of `ρ` | abstraction function in code + proof/tests |
| **RF2 Action correspondence** | every implementation operation maps to a canonical `a ∈ A(S)`, and every `a` the implementation can commit is in `A(S)` | surjectivity onto committed actions; no unmapped operation | operation-to-action table + coverage argument |
| **RF3 Transition correspondence** | `ρ(σ,S) ∧ σ→σ′ ⇒ ρ(σ′, T(S,a,ω))` | the (Step) premise | step-level proof, model check, or deterministic replay over a covering test set |
| **RF4 Obligation correspondence** | implementation obligation records are in bijection with canonical obligations; none is created or destroyed outside a canonical transition | `Oblig(σ) ≅ Oblig(ρ(σ))` | schema mapping + invariant tests |
| **RF5 Protected-capital correspondence** | `ProtectedCapital_impl(σ) = ProtectedCapital(ρ(σ))`, computed over the same partition | valuation agreement | differential replay against the spec formula |
| **RF6 Ω correspondence** | the envelope the implementation quantifies over over-approximates the authoritative `Ω` | `Ω_impl(S,a) ⊇ Ω(S,a)` | perimeter package (R3) + abstraction soundness proof |
| **RF7 Safety preservation** | the implementation's safety check implies `Safe` | `Safe_impl ⇒ Safe` | proof or exhaustive check over the abstract domain |
| **RF8 Gate preservation** | the implementation commits only `a ∈ A_exec^spec(S;K_c)`; **no side door** | the (NoSideDoor) premise | whole-program argument: enumeration of every state-mutating path, each shown to pass the gate |
| **RF9 Expiry preservation** | expired rights are absorbing in the implementation as in the model | no reachable path from expired to claimable | reachability analysis (cf. the finite check in `verification/`) |
| **RF10 Atomicity** | coupled deltas commit together under concurrency and failure | no observable intermediate economic state | crash/interleaving tests, transactional argument |
| **RF11 Determinism & history** | identical authoritative inputs yield identical derived results; historical monotone facts never decrease; crystallized rights are not recomputed | C7, C12, C13 | replay determinism, history invariants |

**RF8 is the load-bearing obligation.** T-REFINE-FWD is worthless without it, and it cannot
be discharged by sampling: a single unmapped mutation path falsifies it. Acceptable evidence
is an argument over *all* economic-state-mutating paths, not a test suite that exercises
some of them.

## 5. Evidence format

A conforming implementation audit must record, at minimum:

- the abstraction/refinement relation `ρ`, including its totality and functionality argument;
- the mapping from implementation operations to canonical actions (RF2);
- transition correspondence evidence (RF3);
- obligation correspondence evidence (RF4);
- protected-capital correspondence evidence (RF5);
- Ω/perimeter correspondence evidence (RF6);
- safety and gate/no-side-door evidence (RF7–RF8);
- expiry, atomicity, and determinism/history evidence (RF9–RF11);
- the exact implementation snapshot to which the evidence applies, including a reproducible
  identifier or digest where available.

The evidence record MUST distinguish mathematical proof, mechanical/model evidence, tests or
replay, and implementation-audit findings. This distinction is required by C24 and `08` §1.

## 6. Status

| Item | Category | Status |
|---|---|---|
| T-REFINE-FWD | MATHEMATICAL PROOF | **PROVEN** (as implication) |
| RF1–RF11, evidence format | NORMATIVE CLOSURE | **CLOSED** |
| Any implementation satisfying them | IMPLEMENTATION CONFORMANCE | **EVIDENCE REQUIRED** |
