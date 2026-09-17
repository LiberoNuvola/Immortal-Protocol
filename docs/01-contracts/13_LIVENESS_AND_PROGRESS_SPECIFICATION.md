# IMMORTAL Liveness & Progress Specification
**Status:** Normative | **Version:** 3.0.0 | **Introduced in v2.0.0; retained in v3.0.0**

## 1. Why this document exists

`S ∈ K_c` means a viable continuation **exists**. It does not mean that someone will submit
it, that authoritative inputs will be available, that the environment will deliver it, or
that it will ever be committed. Conflating the two is the most common misreading of a
viability result. This document separates three properties and states exactly which ones
IMMORTAL guarantees.

## 2. The three properties

### 2.1 Safety
> No action committed by a conforming implementation leaves the certified kernel.

Guaranteed by T6 under C-EXEC and Ω authority. **IMMORTAL claims this.**

### 2.2 Viability (existence of continuation)
> For every `S ∈ K_c` there is an action whose authoritative Ω-successors all remain in `K_c`.

Guaranteed by CK3 (T5). **IMMORTAL claims this**, as a property of the certificate.

### 2.3 Liveness (progress)
> Some eligible viable action is eventually committed.

**IMMORTAL does not claim this.** It is assumption-relative. See §4.

## 3. The gap between viability and execution

For a viable witness `a` at `S ∈ K_c` to become a commit, all of the following must hold —
none of which is implied by `S ∈ K_c`:

| Gap | Description |
|---|---|
| G1 | Some actor must *propose* `a` (or an equivalent gated action). |
| G2 | `Accept(S,a)` must hold: authoritative inputs available, verified, fresh. |
| G3 | The proposal must be *delivered* to the deciding component. |
| G4 | The deciding component must be *available* and must schedule it. |
| G5 | The commit must be *included* / finalised by the underlying settlement substrate. |
| G6 | No competing transition may invalidate `a`'s preconditions faster than it can commit. |

CK3′ (C20) closes G2 at the certificate level *conditionally on input availability*: it
requires the witness action to be acceptance-compatible, so that `A_exec^spec(S;K_c) ≠ ∅`
whenever the required authoritative inputs are present. G1, G3–G6 are environmental and
cannot be discharged by the universal model.

## 4. The liveness contract

A deployment claiming progress MUST publish the following assumptions (C19). They are
**assumptions**, not results.

| ID | Assumption |
|---|---|
| **L1** | **Proposal availability.** For every `S ∈ K_c` in which a gated action exists, at least one actor able and incentivised to propose such an action exists and acts within a declared bound. |
| **L2** | **Input availability & freshness.** Required authoritative inputs (including EEV) become available within the declared freshness window, infinitely often. |
| **L3** | **Delivery & inclusion fairness.** Proposals are delivered and, if admissible, included within a declared bound; no party can suppress all admissible proposals indefinitely. |
| **L4** | **Decider availability.** The deciding/scheduling component is available infinitely often and does not discriminate among admissible gated actions in a way that starves every one of them. |

### L-PROG — Conditional Progress
**Statement.** Assume `S_0 ∈ K_c`; `K_c` satisfies CK3′; and L1–L4 hold. Then for every `t`
there exists `t′ > t` at which a gated action is committed.

**Proof sketch.** By CK3′, at every reachable `S_t ∈ K_c` there is `a` with `Accept(S_t,a)`
whenever inputs are present; L2 supplies the inputs infinitely often; L1 supplies a
proposer; L3 supplies delivery and inclusion; L4 supplies a decider. Hence commits recur. ∎

**Status:** CONDITIONALLY PROVEN — trivially so. The mathematical content is negligible;
the content is the *itemisation* of what a deployment must assume. L1–L4 are precisely the
assumptions IMMORTAL cannot discharge, and naming them is the point.

## 5. Safe stall

If no action passes the gate, the protocol stalls. Stalling is **safety-conforming**.

| Stall cause | Classification |
|---|---|
| Authoritative input unavailable | L2 violation — environmental |
| No proposer | L1 violation — environmental |
| Censorship / non-inclusion | L3 violation — environmental |
| Every candidate has an Ω-successor outside `K_c` | genuine viability boundary — correct refusal |
| `K_c` over-conservative: action was `K*`-viable but not `K_c`-viable | certificate conservatism (`03` §4.3) — correct but costly |
| `K_c` violates CK3′ | **certificate defect** — C20 breach, not environmental |

A deployment MUST be able to classify an observed stall into this table. Inability to do so
is itself a conformance finding.

## 6. What must never be done to restore progress

- Weakening `Safe`.
- Narrowing `Ω` (unsound by T9).
- Enlarging `K_c` without re-establishing CK3.
- Allowing a policy selector, relayer, operator or liveness mechanism to commit an action
  outside `A_exec^spec` (Constitution §10, C5b).
- Treating an unrepresented obligation as surplus to unblock a payment.

A permanent stall is a worse economic outcome than a continuing protocol but a better one
than an unsound commit, and the ordering is constitutional, not discretionary.

## 7. Public statement requirement
Public materials MUST NOT state or imply that membership in the viability kernel guarantees
that the protocol will act. See `12` §"What about waiting?".
