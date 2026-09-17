# Non-Vacuity and Initial State Certification — R8
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** Constitution §7, `03` §9 and T11. This document separates four
distinct claims that are routinely conflated, and supplies both a **sufficient recipe** and
a **necessary obstruction test** that a deployment can actually run.

---

## 1. Four distinct claims

| # | Claim | Status |
|---|---|---|
| **N1** | `K*` **exists** | **PROVEN** (T2, Knaster–Tarski). Says nothing about content. |
| **N2** | `K* ≠ ∅` | **NOT CLAIMED universally.** False for some systems (e.g. `Safe = ∅`; see also T-EROSION). |
| **N3** | a valid certificate `K_c` exists, `K_c ≠ ∅` | **DEPLOYMENT OBLIGATION.** Implies N2 by T4. |
| **N4** | the deployment's actual initial state is admissible: `χ(S₀) = 1` | **DEPLOYMENT ADMISSION** (C15). Implies N3 and N2. |

They form a strict chain `N4 ⇒ N3 ⇒ N2`, and `N1` is independent of all of them. Conflating
N1 with N2 — "the kernel exists, therefore the protocol is viable" — is the error this
document exists to prevent.

## 2. T-NV-CHAIN (PROVEN)

```
χ(S₀) = 1  ∧  VC2  ∧  VC3      ⇒      S₀ ∈ K_c ⊆ K*      ⇒      K* ≠ ∅
```

*Proof:* T4 gives `K_c ⊆ K*`; `S₀ ∈ K_c` gives non-emptiness of both. ∎

This is the whole of what the universal model can contribute. The work is producing `S₀` and
`χ`, which is profile-specific.

## 3. T-NV-SUFF — a sufficient recipe

**Statement.** Suppose there exists a state `S_q` and an action `a_q ∈ A(S_q)` with

- `Safe(S_q)`, and
- `T(S_q, a_q, ω) = S_q` for **every** `ω ∈ Ω(S_q, a_q)`  (a *true quiescent state*: the
  action is available and the environment cannot move the state away from it).

Then `{S_q}` is a valid certificate for VC2/VC3, hence `S_q ∈ K*` and `K* ≠ ∅`.

**Proof.** `{S_q} ⊆ Safe` by hypothesis; `{S_q} ⊆ Pre({S_q})` witnessed by `a_q`. Apply T4. ∎

**Status:** PROVEN.

**Practical reading.** The cheapest honest route to non-vacuity is to prove that a
**"do nothing forever" state is safe and environment-stable**. If a deployment cannot
exhibit such a state — because obligations accrue, valuations decay, or the environment can
move the state even under quiescence — then it must supply a substantive certificate
instead, and should first run the obstruction test in §4.

## 4. T-EROSION as an obstruction test (necessary condition)

From `03` §4B: if there is `ε > 0` such that for every `S` and every `a ∈ A(S)` some
`ω ∈ Ω(S,a)` satisfies `b(T(S,a,ω)) ≤ b(S) − ε`, where `b` is the protection buffer and
`Safe ⊆ {b ≥ 0}`, then **`K* = ∅`** and the deployment is inadmissible outright.

**Contrapositive — the usable form.** Admissibility requires an action that is
**non-eroding against the worst case**:

```
QNE:  ∃ a₀(S) ∈ A(S) : ∀ ω ∈ Ω(S,a₀): b(T(S,a₀,ω)) ≥ b(S)
```

**This is a test a deployment can run before building anything else.** It asks one question:
*is there any move we can always make that the worst case cannot erode?* A "no" is fatal and
is better discovered before certification than after deployment.

Note the interaction with worst-case semantics: because `Ω` carries no probabilities, "erodes
slowly but usually recovers" is not a defence. If the adversary can always choose the eroding
event, T-EROSION applies.

## 5. Recurrent witness

Non-vacuity at `S₀` guarantees admission but not that the system remains admissible in the
economically interesting sense: a deployment can be in `K_c` while only quiescent actions are
ever gated (`T-NOLIVE`). A deployment that requires ongoing economic activity should also
supply a **recurrent witness**:

```
∃ a recurrent set R ⊆ K_c, reachable from S₀ under gated execution, such that every S ∈ R
has a gated action that is not merely quiescent.
```

This is a **liveness-adjacent** obligation (R4), not a safety one, and must not be confused
with C15. Its absence is not a safety defect.

## 6. Evidence a deployment must provide (R8)

| # | Artifact |
|---|---|
| **NV1** | The concrete `S₀`, fully specified in canonical state terms |
| **NV2** | Evaluation of `χ(S₀)` with its derivation trace |
| **NV3** | The certificate package (R1/E1–E10), on which NV2 depends |
| **NV4** | The QNE check of §4: either the non-eroding action `a₀`, or an explicit argument that T-EROSION does not apply |
| **NV5** | If a true quiescent state is claimed (T-NV-SUFF), proof that `T(S_q,a_q,ω) = S_q` for **every** `ω` — not merely for the expected ones |
| **NV6** | Optional recurrent witness per §5, clearly labelled as a liveness claim |

## 7. Status

| Item | Category | Status |
|---|---|---|
| N1 (`K*` exists) | MATHEMATICAL PROOF | **PROVEN** |
| N2 (`K* ≠ ∅`) universally | — | **NOT CLAIMED; false in general** |
| T-NV-CHAIN, T-NV-SUFF | MATHEMATICAL PROOF | **PROVEN** |
| T-EROSION obstruction | MATHEMATICAL PROOF | **PROVEN** |
| N3/N4 for a deployment | MODEL-LEVEL CERTIFICATE + DEPLOYMENT ADMISSION | **NOT DISCHARGEABLE HERE** — requires NV1–NV5 |

**No universal witness has been manufactured**, and none can be: `S₀` is a profile object.
