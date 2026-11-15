# Agent A — R1 alternative certificate feasibility: lifecycle-anchored inductive set

**Date:** 2026-11-15  
**Branch:** `work/immortal-green-closure`  
**Inspected HEAD:** `e149f52e2371acc8d7baa810703ecaf972ba730e`  
**Classification:** SOURCE-BASED ECONOMIC / VIABILITY FEASIBILITY AUDIT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Scope:** Determine whether a general R1 certificate (VC1–VC6) can replace the S0 T-MARGIN obstruction without changing PRE-RICH V1 500×, and whether the existing lifecycle actions offer a reachable witness.  
**Non-effects:** no source, test, workflow, action ABI, validator, V3, Reveal, EEV profile, wallet, deployment, or ledger state changed or executed.

## 1. Executive disposition

**No alternative certificate is currently dischargeable on the deployed source boundary.** A different characteristic predicate `χ` cannot fix a missing action in the concrete action set. The current V3-only economic transition graph is well-founded: with finite class caps, every one of its four actions strictly decreases a lexicographic rank. Under the explicit assumption that those four actions are the complete `A(S)`, no non-empty inductive certificate exists — not only T-MARGIN.

There is, however, a concrete **candidate expansion of the action model** using the existing `EnterQuiescent` and `MaintainQuiescent` lifecycle transitions. It could provide the recurrent conservative witness while leaving Issue as a separate, buffer-consuming action. Under this model:

- `Issue(P)` remains subject to the full frozen WCE increment of `500 × P`;
- Issue is admitted only if its exact candidate post-state remains in `K_c` (for a one-ticket class-0 Issue, the pre-Issue margin must cover the full 500× increment);
- the witness selector is a lifecycle action, not Issue;
- Quiescent does not mean that existing ticket rights are cancelled or that Reveal/Claim/Expire semantics are changed.

This is a candidate architecture, **not a current certificate**. Four independent execution/evidence gaps remain: lifecycle reachability from the actual S0, lack of a combined on-chain lifecycle/Pool action, non-monotone gaps in the direct-USDM physical-EEV boundary for B1 actions, and the absence of an authoritative deployment Ω proof.

The first real Preprod Issue remains **NO-GO**. B1 Registry identity P0 is a separate blocker owned by Agent B.

## 2. General R1 cannot be solved by changing χ alone under the four-action V3 closure

The current `IMMORTAL/kernel/EconomicTransitionV3.hs` action constructors are:

- `Issue TicketClass Integer`;
- `Reveal TicketClass Integer`;
- `Claim Integer`;
- `Expire TicketClass`.

The deployed PRE-RICH profile uses finite class caps (the current Preprod profile sets 10 per class across eight classes). Define:

```text
I(S) = Σ_i max(0, cap_i − issued_i)
U(S) = unresolved ticket count
L(S) = crystallized liabilities
R(S) = (I(S), U(S), L(S))
```

Order `R` lexicographically over non-negative integer triples.

- A valid Issue strictly decreases `I`, because `issued_i < cap_i` is required and `issued_i` increases by one.
- Reveal and Expire leave `I) unchanged and strictly decrease `U`.
- Claim leaves `I` and `U` unchanged and strictly decreases positive `L`.

Thus every valid transition in the literal four-action closure strictly decreases `R`. No infinite sequence of such transitions exists. An inductive certificate containing S0 would require repeatedly selecting an available witness action whose every successor remains in that certificate; iterating `Wit` would produce an infinite accepted sequence, contradicting strict descent.

**Conditional theorem:** if `A(S)` is exactly the four V3 actions above and class caps are finite, then `K* = ∅` for that restricted transition system. No alternative non-margin `χ/Wit` can change this result.

**Important boundary:** this is not a theorem that the entire intended IMMORTAL deployment is non-viable. The concrete PRE-RICH system also contains B1 Pool actions and lifecycle machinery outside this four-constructor V3 module. Those actions must be explicitly incorporated into the full `A / Accept / Ω / T` model. The restricted rank proof cannot be used as a substitute for that complete action inventory.

## 3. Candidate: lifecycle-anchored inductive set

### 3.1 Joint state required

A valid certificate cannot reason about an isolated V3 datum or an isolated lifecycle record. The candidate joint state must bind, at minimum:

```text
S = (
  PRE-RICH V3 economic state,
  lifecycle regime and lifecycle state/version,
  exact B1 PrizePool UTxO reference and complete Value,
  direct-USDM unit identity and physical quantity,
  Counter / control / carrier references,
  complete ticket-right and obligation representation,
  expiry and ledger-time context
)
```

The direct-USDM value is the physical quantity of the exact qualified tUSDM unit in the exact B1 Pool UTxO, converted by the declared integer unit conversion. It is not the Oracle-valued `ppTotalLiquidity` and does not establish USD parity.

Let:

```text
b(S) = EEV_direct_USDM(S) − ProtectedCapital(S)
```

A candidate characteristic predicate is:

```text
χ(S) = Rep(S)
    ∧ b(S) >= 0
    ∧ exact Pool / asset / deployment identity is authenticated
    ∧ all live obligations and ticket rights are represented
    ∧ lifecycle state is Active or Quiescent
```

This is only a schema. Every term must be a deterministic, deployment-bound predicate; references or booleans alone are not a proof.

### 3.2 Candidate witness selector

The existing pure lifecycle module defines:

- `Active + EnterQuiescent → Quiescent`;
- `Quiescent + MaintainQuiescent → Quiescent`.

A candidate total selector over the represented lifecycle states is:

```text
Wit(S) =
  EnterQuiescent,   when regime(S) = Active
  MaintainQuiescent, when regime(S) = Quiescent
```

Both lifecycle transitions currently leave the economic V3 fields unchanged and advance a lifecycle nonce. If — and only if — the concrete transaction atomically binds the lifecycle state to the exact PrizePool and V3 state, preserves the qualified direct-USDM balance, and excludes unmodelled Pool outflows, these actions are candidates for a T-MARGIN QNE witness.

This is the important distinction for the first ticket: **Issue itself need not be the QNE witness.** An Issue can be a separately accepted transition when its exact post-state remains in `K_c`; the candidate witness from that successor is `EnterQuiescent`. A non-eroding lifecycle action would preserve viability after the ticket has been issued without lowering the 500× floor.

For an Issue of price `P`, current V1 semantics produce:

```text
ΔEEV_direct = 0
ΔProtectedCapital = +500 × P
Δb = −500 × P
```

Therefore Issue can remain inside the candidate `K_c` only when the pre-Issue margin is at least `500 × P` (plus any other independently required post-state headroom). This condition does not reduce or replace the payout guarantee.

### 3.3 Transition algebra under the exact direct-USDM perimeter

The following algebra identifies what must be proven against the physical direct-USDM EEV, not merely against the Oracle-valued B1 accounting field.

| Action | ProtectedCapital delta | Direct-EEV condition for non-erosion | Current source finding |
|---|---:|---|---|
| Issue(P) | `+500P` | Issue is not QNE; require pre-margin `b ≥ 500P` so candidate post-state remains safe | The Issue carrier requires same physical Pool Value; face reserve increases and the separate 500× WCE is enforced. |
| Reveal(P, x), `0 ≤ x ≤ 500P` | `x − 500P ≤ 0` | Require `ΔEEV_direct ≥ x − 500P`; exact physical Pool Value preservation would make `ΔEEV_direct = 0` | B1 checks `ppTotalLiquidity` unchanged and PrizeDatum consistency, but does not require the B1 Pool input Value to equal the continuing Pool output Value. |
| Expire pending(P) | `−500P` | Require `ΔEEV_direct ≥ −500P` | B1 explicitly requires the complete Pool Value to be preserved; the direct-EEV delta is zero. |
| Expire revealed(x) | `−x` | Require `ΔEEV_direct ≥ −x` | B1 explicitly requires the complete Pool Value to be preserved; the direct-EEV delta is zero. |
| Claim(x) | `−x` | Require `ΔEEV_direct ≥ −x` (physical direct-USDM outflow cannot exceed the claimed amount) | B1 compares the change in `Economic.poolUsdmValue`, an Oracle-valued total, with `x`; this does not bind the physical tUSDM quantity change. |
| FundTreasury | Normally unchanged PC | Require direct-USDM EEV not to decrease | Current B1 requires Oracle-valued Pool liquidity to increase; it does not require physical tUSDM monotonicity. Prior Agent A falsification rejected this action as a direct-USDM QNE witness. |
| Enter/MaintainQuiescent | `0` | Require the same qualified direct-USDM Pool value and represented obligations after every Ω successor | Presently only a pure lifecycle transition/predicate; no atomic deployed Pool/V3/lifecycle transaction exists. |

The table shows why the lifecycle idea is promising but not certifiable yet. The physical Pool Value is explicitly preserved by Expire and by the Issue sale carrier; the required same guarantee has not been established for Reveal, Claim, and FundTreasury. Since `EEV_direct` is not Oracle-valued `ppTotalLiquidity`, an unchanged/reconciled Oracle total cannot be used as a substitute for the missing physical-asset delta proof.

For example, Claim currently checks:

```text
poolInputUsdm − poolOutputUsdm == claimedAmount
```

where both values come from Oracle-based `Economic.poolUsdmValue`. The direct-USDM QNE condition instead needs to bound the change in the exact physical tUSDM quantity. The former does not imply the latter when asset composition can change.

## 4. Current source boundary: why this candidate is not reachable or accepted today

1. **Genesis-to-Active reachability is missing.** `PreRichLifecycleTransition.hs` only accepts Active/Quiescent inputs. The separate `PreRichRegimeState.hs` has a PRE_GENESIS → GENESIS transition; it does not define an authenticated Genesis → Active edge. The current Preprod deployment profile declares the economic class-0 S0, but does not materialize a lifecycle state bound to it. The pure `activeLifecycleState` constructor does not prove deployed reachability.
2. **Lifecycle is outside the current Issue admission boundary.** `PreRichEconomicAdmission` accepts `V3Action`; it does not accept a lifecycle action or joint certificate.
3. **The V3 carrier rejects lifecycle action classes.** Its current `bindingEnvelopeValid` accepts only `Issue`, `Reveal`, `Claim`, or `Expire`. There is no deployed lifecycle transaction path that atomically updates the lifecycle state, V3 carrier, and exact B1 Pool.
4. **The pure QNE helper does not authenticate Ω.** `qneAcrossOmega` checks a non-empty list supplied by the caller. Its `LifecycleOmegaWitness` carries post-EEV, post-ProtectedCapital and representation/safety booleans; it does not establish the list's completeness, authority, or transaction/ledger binding.
5. **The physical EEV transition contract is incomplete for B1.** Reveal, Claim and FundTreasury have the direct-USDM gaps summarized above. A lifecycle witness cannot preserve a buffer if another accepted Pool action may erode the physical tUSDM balance without the same direct-EEV gate.
6. **The maintenance state needs a resource/replay design.** `MaintainQuiescent` increments an unbounded Integer nonce. An infinite-horizon proof cannot simply assume this record remains representable and affordable forever under finite Cardano transaction-size/execution limits. A bounded recurrent carrier state and UTxO-spend replay protection, or a formal all-horizon resource argument, are required.

## 5. Minimum closure package before a certificate can be claimed

| Gate | Required evidence | Owner / review |
|---|---|---|
| Full action inventory | Enumerate every accepted V3, B1 Pool, lifecycle, governance and deployment transition in `A(S)`; do not certify only the V3 projection | Agent A, with Agent B source reconciliation |
| Initial joint state | Versioned, deployed S0 binding the exact lifecycle regime to the declared Preprod economic state and exact Pool UTxO | Agent A + deployment owner |
| Lifecycle transaction | Permissionless, replay-safe, atomic transition that consumes/continues the lifecycle and economic carriers plus the exact Pool singleton; it must serialize competing Pool mutations | Agent B |
| Direct-EEV transition closure | Prove or enforce the direct-tUSDM delta predicates for Reveal, Claim and FundTreasury, with exact same-cut physical Value evidence; preserve current 500× | Agent B, independent review |
| QNE / Ω | Authenticated perimeter and over-approximation covering ledger concurrency, UTxO replacement, source unavailability, expiry/time, rollback/finality, asset identity and every permitted Pool mutation | Agent A + adapter review |
| Resource/replay | Prove the maintenance action remains encodable/evaluable across the certified horizon, with bounded state and non-replay | Agent B |
| Formal certificate | Total deterministic χ/Wit, S1, VC1–VC6, NV1–NV5 and E1–E10, all bound to one deployment version and ledger cut | Agent A; Agent B independent review |

A single reference input to the Pool is not sufficient for a perpetual lifecycle lock if another transaction can spend the Pool independently. The proposed maintenance transition must share the Pool's spend/continuation boundary (or otherwise prove equivalent serialization) and all other permitted transitions must remain inside the certified region. A lifecycle UTxO that can be updated separately from the Pool would leave the critical race open.

## 6. Decision and next action

- **Rejected:** trying to construct a different `χ` over the present four-action V3-only graph. The finite-rank theorem rules it out.
- **Candidate to pursue:** a lifecycle-anchored joint-state certificate using `EnterQuiescent` / `MaintainQuiescent`, with Issue admitted only when the post-Issue 500×-protected state remains in `K_c`.
- **Not yet proven:** reachability from S0, direct-USDM monotonicity of all B1 actions, atomic lifecycle/Pool enforcement, authoritative Ω, all-horizon resource bounds, VC1–VC6 and E1–E10.

No RiskMode, coefficient, capital rule, new payout rule, action ABI or permissionless claim is selected by this report. Agent B's latest Counter lookalike Yaci success is test-harness/Counter evidence only; it does not close the separate B1 Registry counterfeit-Pending issue. The first real Preprod Issue remains **NO-GO** until both B1 Registry identity and R1/Kc/Ω close.

**Final disposition:** a general R1 certificate is mathematically possible only after the concrete action model is correctly completed. The most grounded path found reuses the existing lifecycle transition as the persistent witness; it is not implemented or deployment-bound, and current B1 direct-EEV paths prevent certification today.
