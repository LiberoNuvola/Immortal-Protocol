# IMMORTAL Ω Completeness Contract
**Status:** Normative | **Version:** 3.0.0 | **Introduced in v2.0.0; retained in v3.0.0**

## 1. Why Ω is a first-class dependency

Every safety result in this package (T5, T6, T7, T-UPGRADE, T-COMP-*) is stated *relative
to* `Ω`. If an economically material event is not in `Ω`, the theorems are silent about it —
they are not weakened, they simply do not apply. Writing "Ω is complete" in a specification
does not make it so. This document makes the dependency explicit, splits it into the part
that is a rule and the part that is an obligation, and states the failure behaviour.

## 2. Two distinct notions

### 2.1 Semantic completeness (normative requirement)
Given a declared **environment perimeter** `E`, `Ω` is semantically complete iff for every
`S`, every accepted `a`, and every event `e` permitted by `E` that is economically material
(i.e. can change the economic content of `T(S,a,·)`), the resulting successor is contained
in `{ T(S,a,ω) | ω ∈ Ω(S,a) }`.

Equivalently, writing `Real_E(S,a)` for the true event set permitted by the environment
within `E`:

```
Real_E(S,a) ⊆ Ω(S,a)      (modulo economic equivalence of successors)
```

### 2.2 Adapter/environment conformance (obligation)
A concrete deployment must **demonstrate** that its supplied `Ω` satisfies §2.1 for its
published `E`. This demonstration is not universally algorithmic and is therefore classified
as a **profile/adapter admission obligation** (C14), never as a theorem.

## 3. Soundness direction (T9)

By **T-OMEGA-MONO** (`03` §8): enlarging `Ω` shrinks `K*`; narrowing `Ω` enlarges it.

- **Over-approximation is always sound.** When in doubt, include the event class.
- **Narrowing is unsound**, not merely prohibited: a certificate proved against a narrowed
  envelope certifies membership in a superset of the true kernel.

This converts "Ω cannot be narrowed by an actor, caller, adapter or operator" from a rule
into a consequence.

## 4. Required contents of the Ω contract

A deployment MUST publish, for its declared `E`:

| # | Element | Requirement |
|---|---|---|
| 1 | **Authority source** | who/what fixes `Ω`; demonstrably not the caller, operator, frontend or adapter acting in its own interest |
| 2 | **Event-domain definition** | the enumeration or schema of event classes in `E` |
| 3 | **Actor independence** | no actor may select a convenient sub-envelope for its own action |
| 4 | **Adaptive adversaries** | worst-case adversarial resolution of `ω` is included; `Ω` is not a distribution over benign behaviour |
| 5 | **Repeated events** | repetition, including unbounded repetition, is within envelope |
| 6 | **Correlated events** | joint/correlated occurrence is represented; a product-form envelope MUST be justified, not assumed |
| 7 | **Timing** | delay, reordering, expiry-boundary timing, freshness lapse |
| 8 | **Concurrency** | interleaving and race outcomes of coupled changes |
| 9 | **Liquidity shocks** | adverse moves in EEV and in protected-content valuation |
| 10 | **External truth / oracle failure** | unavailability, staleness, equivocation, and the resulting fail-closed path |
| 11 | **Environment boundary** | what `E` deliberately excludes, and why |
| 12 | **Unknown / out-of-model events** | explicit statement that events outside `E` are uncovered |
| 13 | **Failure behaviour** | what the system does when completeness cannot be established for a class |

## 5. Failure behaviour (item 13, expanded)

When completeness for an event class cannot be established, a conforming deployment MUST do
one of:

1. **Enlarge `Ω`** to over-approximate the class and re-establish CK3 for `K_c`
   (sound by T9, possibly shrinking `K_c` and reducing liveness); or
2. **Fail closed** — treat actions exposed to the class as non-executable; or
3. **Contract `E`** and issue the residual-risk statement of C23, accepting that the class
   is outside the guarantee.

It MUST NOT: assume the class away, assign it negligible probability as a substitute for
representation, or rely on the absence of historical occurrence.

Small probability is not a ground for exclusion. `Ω` is a set of permitted events, not a
measure; the results are worst-case over `Ω` and take no probabilities as input.

## 6. The explicit limitation statement

> **If an economically material event lies outside the declared Ω, the universal safety
> theorems of this package do not cover it.** The guarantee is conditional on the perimeter,
> and the perimeter is a deployment declaration, not a mathematical fact.

Every deployment MUST reproduce this statement, together with its `E` and residual-risk
list, in its public materials (C23).

## 7. Classification

| Item | Classification |
|---|---|
| Ω authority (no narrowing) | NORMATIVE REQUIREMENT, backed by T9 |
| Ω monotonicity / conservatism of enlargement | **PROVEN** (T9) |
| Ω semantic completeness over `E` | NORMATIVE REQUIREMENT |
| Ω completeness of a concrete adapter | **PROFILE/ADAPTER OBLIGATION — evidence required** |
| Coverage of events outside `E` | **NOT CLAIMED** |

## 8. Anti-circularity
Ω completeness may not be cited as evidence for itself, nor inferred from the fact that the
protocol has not yet experienced an out-of-model event (Constitution §15, C24).
