# IMMORTAL Universal Economic Model
**Status:** Normative | **Version:** 3.0.0

## 1. Canonical components

| Component | Type | Function |
|---|---|---|
| `𝒮` | set | Canonical economic state space |
| `S` | `∈ 𝒮` | Canonical economic state |
| `A(S)` | `⊆ Act` | Candidate admissible actions |
| `Accept(S,a)` | predicate | Authoritative-input and admissibility acceptance |
| `Ω(S,a)` | set | Authoritative event envelope, relative to perimeter `E` |
| `T(S,a,ω)` | `𝒮` | Total state transition on accepted inputs |
| `Safe(S)` | predicate | Immediate safety predicate |
| `K*` | `⊆ 𝒮` | Maximal viability semantics, `νF` |
| `K_c` | `⊆ 𝒮` | Certified concrete kernel (deployment-supplied) |
| `ProtectedCapital(S)` | value | Non-distributable protected value |
| `EEV(S)` | value | Verified executable economic value |
| `CAR` | value | Conditional Allocation Reserve |
| `History` | — | Canonical historical state |

## 2. Derived definitions

```
A_safe(S,K)      = { a ∈ A(S) | ∀ ω ∈ Ω(S,a) : T(S,a,ω) ∈ K }
A_exec^spec(S;K) = { a ∈ A_safe(S,K) | Accept(S,a) }
```

**D-4 (definitional, NOT a theorem).** `A_exec^spec(S;K) ⊆ A_safe(S,K)` holds by
construction. It carries no security content on its own. The security content is the
*conformance* claim **C-EXEC**: that an implementation commits only actions in
`A_exec^spec`. See `07` C5/C5b and `08` T8.

## 3. Surplus

```
RawSurplus = max(0, EEV − ProtectedCapital)
```

This is a **state-local accounting boundary**, not a distribution instruction and not a
viability test. A positive `RawSurplus` never by itself authorises execution.

## 4. Conditional Allocation Reserve

**CAR (Conditional Allocation Reserve)** is the universal abstraction for value
conditionally committed to a future allocation. `Jackpot` is application-specific PRE-RICH
terminology and does not appear in universal semantics.

CAR is a component of `ProtectedCapital` whenever the applicable protection predicate
classifies it as non-discretionary.

## 5. Accounting

Protected obligations and exposures form an **exhaustive, mutually exclusive canonical
partition** `P = {P_1,…,P_n}` of protected economic content. Missing categories cannot be
treated as surplus; the dependent action fails closed.

`ProtectedCapital(S) = Σ_i value(P_i(S))`, with `P_i` pairwise disjoint and jointly
exhaustive over represented protected content. Exhaustiveness is a **conformance
obligation** (C17), not a theorem.

## 6. Gates

```
Economic Gate → Viability Gate (K_c) → Policy Selector → Atomic Execution
```

Policy chooses only among already-safe executable actions; it cannot enlarge the safe
action set. Enlargement by a policy selector is non-conforming (C5b).

## 7. Separation of layers

| Layer | Owns | Does not own |
|---|---|---|
| Constitution | mandatory predicates | mechanism choice |
| Universal model | `𝒮,A,Ω,T,Safe,K*` semantics | concrete values |
| Profile / adapter | `E`, Ω instance, EEV source, `K_c` | constitutional predicates |
| Implementation | code, data structures | normative authority |
| Evidence | conformance demonstration | normative authority |

## 8. Cross-references
- Kernel mathematics: `03`
- Transition discipline: `04`
- Invariants: `05`
- Conformance IDs: `07`
- Proofs: `08`
- Liveness: `13` · Upgrade: `14` · Composition: `15` · Ω: `16`
