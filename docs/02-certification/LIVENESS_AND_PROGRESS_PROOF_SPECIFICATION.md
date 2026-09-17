# Liveness and Progress Proof Specification — R4
**Status:** Normative (certification layer) | **Version:** 3.0.0
**Relation to package:** `13_LIVENESS_AND_PROGRESS_SPECIFICATION.md` establishes the
safety/viability/liveness separation and the assumptions L1–L4. This document formalises the
definitions, states the strongest available theorem, and proves the negative results that
bound what can be claimed.

---

## 1. Definitions

| Term | Definition |
|---|---|
| **Eligible state** | `S` is eligible iff `χ(S) = 1` (i.e. `S ∈ K_c`) and the deployment is not in an activation or migration window |
| **Eligible action** | `a` is eligible at `S` iff `a ∈ A_exec^spec(S;K_c)`, i.e. `Accept(S,a)` holds and `∀ω ∈ Ω(S,a): T(S,a,ω) ∈ K_c` |
| **Progress condition** | at least one eligible action exists at `S` |
| **Fairness/progress assumption** | the environmental assumptions L1–L4 of `13` §4 |
| **Eventual execution** | `∃ t′ > t` at which some eligible action is committed |

## 2. T-PROG — conditional progress

**Statement.** Assume:

1. `S_t ∈ K_c` and `K_c` is a valid certificate satisfying VC4 (CK3′);
2. an eligible action exists at `S_t` (equivalently, required authoritative inputs are
   present — by T15 this then follows from (1));
3. authoritative inputs become available infinitely often within the declared freshness
   window (**L2**);
4. the environment satisfies **L1** (a proposer exists and acts within a declared bound),
   **L3** (delivery and inclusion fairness), **L4** (decider availability).

Then `∃ t′ > t` at which an eligible action is committed.

**Proof.** By (1) and VC4, `A_exec^spec(S_t;K_c) ≠ ∅` whenever inputs are present (T15).
(3) supplies the inputs; (4)(L1) supplies a proposer; (4)(L3) supplies delivery and
inclusion; (4)(L4) supplies a decider willing to schedule an admissible proposal. Composing
the four bounds yields a finite `t′`. ∎

**Status:** **CONDITIONALLY PROVEN.** The proof is shallow and this register does not
pretend otherwise: every step is an appeal to an assumption. The theorem's function is to
make the assumption set finite, named and auditable rather than implicit.

## 3. T-NOLIVE — safety does not imply progress (negative result)

**Statement.** There exists a system `M` and a valid certificate `K_c` with `K_c ≠ ∅` such
that every gated execution from `S₀ ∈ K_c` is safe forever and no economic state change ever
occurs.

**Proof (witness).** Take `𝒮 = {s}`, `A(s) = {idle}`, `Ω(s,idle) = {ω}`,
`T(s,idle,ω) = s`, `Safe = {s}`. Then `K_c = {s}` satisfies VC2 and VC3, and the unique
execution is the constant one. ∎

**Status:** PROVEN. Consequence: **no strengthening of the safety gate can yield liveness.**
Progress is not derivable from the economic safety machinery, in principle and not merely in
this package. Any claim of progress must cite L1–L4 or an equivalent.

## 4. T-STALL-ATTRIB — stall attribution

**Statement.** If `S ∈ K_c`, `K_c` satisfies VC4, and no eligible action exists at `S`, then
required authoritative inputs are unavailable at `S`.

**Proof.** Contrapositive of T15: with inputs present, VC4 gives `Accept(S, Wit(S))` and VC3
gives the successor condition, so `Wit(S)` is eligible. ∎

**Consequence.** A stall inside a VC4-valid certificate is **always** attributable to input
unavailability (an L2 violation), never to the gate. A stall inside `K_c` that is *not*
explained by input unavailability is therefore proof that VC4 fails — i.e. a **certificate
defect**, not an environmental fault. This makes the stall taxonomy below decidable in
practice rather than a matter of opinion.

## 5. Failure modes

| # | Failure mode | Detection | Classification | Correct response |
|---|---|---|---|---|
| **FM1** | No viable action: `S ∉ K_c` and no gated action exists | gate rejects all candidates | genuine viability boundary | refuse; do **not** widen `K_c` |
| **FM2** | Certificate invalid (VC3 fails) | successor observed outside `K_c`, or proof gap found | **certificate defect — safety-critical** | halt; re-certify; treat prior gated commits as unverified |
| **FM3** | Certificate blocks inside itself (VC4 fails) | stall at `S ∈ K_c` with inputs present (T-STALL-ATTRIB) | certificate defect — liveness | re-certify with an acceptance-compatible witness |
| **FM4** | Actor unavailable | no proposals observed | L1 violation | environmental; incentive/operational fix |
| **FM5** | Communication unavailable | proposals not delivered | L3 violation | environmental |
| **FM6** | External truth unavailable / stale | EEV or evidence fails freshness | L2 violation; fail-closed by C16 | wait; never substitute a value |
| **FM7** | Governance lock | upgrade window open, or U1–U8 undemonstrable | `14` §6 | remain under `M_old`, including in permanent stall |
| **FM8** | Scheduler/decider failure | admissible proposals never scheduled | L4 violation | environmental |
| **FM9** | Censorship | all admissible proposals suppressed | L3 violation, adversarial | out of scope for IMMORTAL; substrate concern |
| **FM10** | Over-conservative certificate | action was `K*`-viable but not `K_c`-viable | accepted conservatism (`03` §4.3) | optionally re-certify a larger `K_c` **with a new VC3 proof** |

FM2 and FM3 are the only entries that indicate a defect in the deployment's own
certification. FM1 is correct behaviour. FM4–FM9 are environmental. FM10 is a design
trade-off. A deployment that cannot place an observed stall in this table has an
observability gap, which is itself a conformance finding (`13` §5).

## 6. Evidence a deployment must provide (R4)

| # | Artifact |
|---|---|
| L-E1 | Published L1–L4 instances with concrete bounds, and the statement that safety does not depend on them (C19) |
| L-E2 | VC4 discharge for `K_c` (shared with R1/E6) |
| L-E3 | Stall observability: instrumentation sufficient to classify any stall into FM1–FM10 |
| L-E4 | Evidence for each assumed bound (proposer incentives, delivery/inclusion behaviour, decider availability) — substrate-specific, outside the universal model |
| L-E5 | A declared statement of what happens if progress never resumes |

## 7. Status

| Item | Category | Status |
|---|---|---|
| Definitions §1 | NORMATIVE CLOSURE | **CLOSED** |
| T-PROG | MATHEMATICAL PROOF, conditional | **CONDITIONALLY PROVEN** (shallow, by construction) |
| T-NOLIVE | MATHEMATICAL PROOF | **PROVEN** |
| T-STALL-ATTRIB | MATHEMATICAL PROOF | **PROVEN** |
| L1–L4 holding for a real deployment | ADAPTER/ENVIRONMENT CONFORMANCE | **NOT DISCHARGEABLE HERE** |
| Liveness of IMMORTAL as such | — | **NOT CLAIMED** |
