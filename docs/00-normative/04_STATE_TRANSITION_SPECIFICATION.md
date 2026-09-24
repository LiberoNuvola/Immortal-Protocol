# IMMORTAL State & Transition Specification
**Status:** Normative | **Version:** 3.0.0

## 1. Canonical transition

```
(S, a, ω) → S′ = T(S,a,ω)
```

`T` is total on accepted inputs. Undefinedness is not a transition; it is a rejection.

### Required sequence
1. canonical state;
2. authoritative input verification;
3. obligation / exposure derivation;
4. candidate delta;
5. complete post-state;
6. safety evaluation (`Safe`);
7. viability evaluation against the **certified concrete kernel `K_c`**;
8. accept / reject;
9. atomic commit;
10. history recording.

Steps 6–7 are distinct. `Safe` is a state-local predicate; `K_c` membership is the
continuation guarantee.

## 2. Acceptance and the execution predicate

```
Accept(S,a)      ⟺  a ∈ A(S) ∧ authoritative inputs complete, verified and fresh
                     ∧ obligation/exposure accounting exhaustive for a
A_exec^spec(S;K_c) = { a | Accept(S,a) ∧ ∀ ω ∈ Ω(S,a) : T(S,a,ω) ∈ K_c }
```

A conforming implementation commits `a` **only if** `a ∈ A_exec^spec(S;K_c)` — this is
conformance requirement **C-EXEC** (`07` C5b), not a theorem about the model.

`Ω(S,a)` used at step 7 MUST be the authoritative envelope of the declared perimeter, or a
sound over-approximation of it (T9 permits enlargement, forbids narrowing).

## 3. Failure behavior

| Failure | Result |
|---|---|
| Missing / unverified authoritative truth | Reject / safe stall |
| Stale EEV beyond freshness contract | Reject / safe stall |
| Unrepresented obligation | Reject |
| Unprotected material exposure | Reject |
| Unsafe post-state (`¬Safe`) | Reject |
| Some `ω` lands outside `K_c` | Reject |
| `K_c` membership not effectively checkable | Reject (fail closed); certificate defective |
| Ω narrowed by caller/adapter/operator | Non-conforming |
| Expired right invoked | No claimability, no economic effect |
| Second settlement of a settled right | Reject |
| Partial coupled commit | Non-conforming |
| Policy selector proposes action outside `A_exec^spec` | Non-conforming |
| Upgrade activation failing U1–U8 | Non-conforming (see `14`) |
| Cross-system obligation without composition contract | Non-conforming (see `15`) |

## 4. Rejection is not failure

Rejection keeps the system in `K_c`. A sequence of rejections is a **safe stall**. Safe
stall is safety-conforming and liveness-degrading; it is analysed in `13`, not repaired by
weakening the gate.

## 5. History and crystallization

- Current state and historical state are separate (C12).
- Crystallized rights are not silently recomputed (C13).
- Defined historical monotone facts never decrease (Invariant 10).
- An upgrade may re-express but not reduce crystallized economic content (U2, `14`).

## 6. Atomicity

```
PRECONDITION → VALIDATE → COMPUTE DELTA → CHECK POST-STATE → COMMIT ATOMICALLY → POSTCONDITION
```

All coupled deltas of one canonical transition commit together or not at all, including the
deltas of any CAR component and of any protected partition element affected.
