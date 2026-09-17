# Ω Completeness and Perimeter Specification — R3
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** `16_OMEGA_COMPLETENESS_CONTRACT.md` states the contract. This
document formalises the perimeter, answers whether exact completeness is the right
admission condition, and gives the audit format.

---

## 1. The perimeter

A deployment declares an **environment perimeter** `Env`: a finite, published list of event
classes the deployment asserts its model covers, together with the boundary conditions that
delimit them.

```
Events(Env)          all events the environment may produce within Env
Material(S,a)        events that can change the economic content of T(S,a,·)
Real_Env(S,a)  =  Events(Env) ∩ Material(S,a)
```

Everything not in `Events(Env)` is **out of perimeter**: it is not covered, not modelled,
and not claimed about.

## 2. Ω-COMPLETE, formally

```
Ω-COMPLETE(Env, Ω)  ⟺  ∀ S, ∀ a ∈ A(S):
       { T(S,a,e) | e ∈ Real_Env(S,a) }  ⊆  { T(S,a,ω) | ω ∈ Ω(S,a) }
```

Note the quantification is over **induced successors**, not over event names. Two differently
named events with the same economic successor are the same event for this purpose; this is
what makes the condition checkable against a finite abstraction rather than against an
open-ended list of real-world occurrences.

**Failure condition.**

```
Ω-INCOMPLETE(Env, Ω)  ⟺  ∃ S, a, e ∈ Real_Env(S,a):
       T(S,a,e) ∉ { T(S,a,ω) | ω ∈ Ω(S,a) }
```

Such an `e` is a **witness of incompleteness**. Its existence voids T5, T6, T7, T-UPGRADE and
T-COMP-* for the affected `(S,a)` — it does not weaken them, it removes them.

## 3. Should admission require `Ω = CompleteEvents(Env)`?

**No.** Exact equality is both too strong and the wrong direction.

**Argument.** By **T9 / T-OMEGA-MONO** (`03` §8), enlarging `Ω` shrinks `K*`. So:

- `Ω ⊇ Real_Env` is what safety needs, and it is *all* safety needs.
- `Ω ⊋ Real_Env` (strict over-approximation) is **sound but conservative**: it shrinks the
  kernel, costing liveness and economic efficiency, never safety.
- `Ω ⊊ Real_Env` is **unsound**.
- Demanding equality would forbid the conservative over-approximation that is the only
  honest engineering response to partial knowledge of the environment — and would require
  proving a *negative* (that no modelled event is impossible), which is not auditable.

**Therefore the strongest defensible admission condition is containment:**

```
ADMIT(Env, Ω)  ⟺  Ω-COMPLETE(Env, Ω)              [containment, not equality]
              ∧  Env and its exclusions are published
              ∧  a residual-risk statement is published
              ∧  the failure path for newly discovered witnesses is defined
```

**T-OMEGA-ADMIT (PROVEN, given T9).** If `Ω ⊇ Ω′ ⊇ Real_Env` then any certificate valid
under `Ω` is valid under `Ω′`, and `K*_Ω ⊆ K*_{Ω′} ⊆ K*_{Real_Env}`. Hence a deployment may
always retreat to a coarser (larger) envelope without re-proving safety, but never to a finer
one. *Proof:* immediate from T9 and T4. ∎

This gives a useful operational rule: **enlarging the envelope is a safe unilateral move;
narrowing it is an upgrade requiring full re-certification** (`14`).

## 4. Mechanically witnessed

The finite-model harness searched random systems for cases where a narrowed envelope
certifies a state that is not viable under the true envelope. It found such witnesses in
**138 of 400** systems (`verification/FINITE_MODEL_CHECK_RESULTS.txt`). Narrowing is
therefore not a theoretical concern: in this sample it produced false certification about a
third of the time.

## 5. Perimeter audit package

| # | Artifact |
|---|---|
| P1 | `Env` — the enumerated event classes, with boundary conditions |
| P2 | Exclusions — what is deliberately outside `Env`, and why |
| P3 | For each of the thirteen contract elements of `16` §4, the modelled representation: authority source, event domain, actor independence, adaptive adversaries, repetition, correlation, timing, concurrency, liquidity shocks, oracle failure, boundary, unknown events, failure behaviour |
| P4 | Correlation justification — if `Ω` has product form, an argument that the components are genuinely independent, since correlation alone defeats T-COMP-INDEP and understates joint adversity |
| P5 | Abstraction soundness — if the implementation checks a finite abstraction of `Ω`, a proof that the abstraction over-approximates |
| P6 | Residual-risk statement, in the words of `16` §6 |
| P7 | Discovery procedure — how a newly found witness of incompleteness is reported, and the fail-closed behaviour on discovery |
| P8 | Re-certification trigger — any change to `Env` or `Ω` that narrows coverage is an upgrade (U5, `14`) |

## 6. Fail-closed on discovery

When a witness of incompleteness is found, the deployment MUST, before further execution
exposed to that class:

1. enlarge `Ω` to cover it and re-establish VC3 for `K_c` (sound by T-OMEGA-ADMIT); **or**
2. fail closed on all actions exposed to it; **or**
3. contract `Env` and re-issue P6, accepting that the class is uncovered.

It MUST NOT continue on the grounds that the event has not recurred, is improbable, or was
absent historically. `Ω` is a set, not a measure; the theorems take no probabilities as
input (`16` §5).

## 7. Status

| Item | Category | Status |
|---|---|---|
| Formal definition of Ω-COMPLETE and its failure condition | NORMATIVE CLOSURE | **CLOSED** |
| Containment (not equality) is the right admission condition | MATHEMATICAL PROOF | **PROVEN** (T-OMEGA-ADMIT, from T9) |
| Unsoundness of narrowing | MATHEMATICAL PROOF + MECHANICAL EVIDENCE | **PROVEN**; witnessed 138/400 |
| `Ω-COMPLETE(Env, Ω)` for a real adapter | ADAPTER CONFORMANCE | **NOT DISCHARGEABLE HERE** — requires P1–P8 |
| Coverage of events outside `Env` | — | **NOT CLAIMED, AND NOT CLAIMABLE** |

**Honest limit.** No procedure in this or any document can verify that a published `Env`
matches the real world. The most this package achieves is to make the assumption explicit,
bounded, auditable and fail-closed — which is what was asked, and is the ceiling.
