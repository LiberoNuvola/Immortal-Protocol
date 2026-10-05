# V3 Viability / Non-Vacuity Audit — 2026-10-05

Repository: LiberoNuvola/Immortal-Protocol
Branch: work/immortal-green-closure
Audited HEAD: b67ef198873fc40c1959283f449a2d1ee3f6add4
Classification: architectural audit / deterministic probe
Production code changes: none
Economic-rule changes: none
Reveal changes: none
V3 carrier changes: none

## 1. Verdict

The IMMORTAL mathematical viability semantics are intact. The greatest fixed point K* exists mathematically, but non-emptiness is a deployment property.

The currently implemented V3 economic action type contains only four actions:

    Issue
    Reveal
    Claim
    Expire

No lifecycle action is present in EconomicTransitionV3.hs.

The PRE-RICH application layer contains lifecycle vocabulary and controller outputs, including Quiescent, RETAIN, CONTRACT and HALT, but those are not currently represented as a canonical V3 economic action with a transition T(S,a,omega).

Therefore:

1. The current four-action V3 graph is not an adequate infinite-horizon action space.
2. If those four actions are treated as the complete A(S), the action graph is well-founded and K* is empty.
3. The intended PRE-RICH deployment is not yet fully instantiated, so its final K* cannot honestly be declared empty or non-empty.
4. No concrete non-vacuity/QNE witness is currently discharged.
5. No concrete K_c certificate is currently discharged.
6. The gap is architectural, not economic.

## 2. Source-of-truth conclusions

The Constitution and Economic Kernel define:

    Pre(K) = { S | exists a in A(S) such that for all omega in Omega(S,a),
               T(S,a,omega) is in K }

    F(K) = Safe intersect Pre(K)
    K* = nu F

They also require executable viability to use a certified concrete K_c with K_c subset Safe and K_c subset Pre(K_c).

References:
- docs/00-normative/01_CONSTITUTION_FINAL.md lines 34-63
- docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md lines 1-8 and 55-72

QNE is explicitly a concrete/profile obligation. The normative recipe is:

    exists a0(S) in A(S)
    such that for all omega in Omega(S,a0):
        buffer(T(S,a0,omega)) >= buffer(S)
        and represented obligations remain represented

with:

    buffer(S) = EEV(S) - ProtectedCapital(S)

References:
- docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md lines 70-92
- docs/02-certification/NONVACUITY_AND_INITIAL_STATE_CERTIFICATION.md lines 30-66

## 3. Concrete action space A(S)

Economic action surface:

IMMORTAL/kernel/EconomicTransitionV3.hs lines 18-26

    V3Action =
      Issue TicketClass Integer
      Reveal TicketClass Integer
      Claim Integer
      Expire TicketClass

The reference adapter replays this same V3Action surface:

Adapter/REFERENCE/ReferenceAdapter.hs lines 8-27

No lifecycle action is defined there.

The functioning V3 carrier also accepts only these economic classes:

PRE-RICH/onchain/V3EconomicStateCarrier.hs lines 210-218

    Issue | Reveal | Claim | Expire

This audit does not alter that carrier.

## 4. RETAIN

src/preRichHysteresis.ts explicitly describes itself as application-level rather than part of the IMMORTAL universal kernel.

Its result type includes:

    ACTIVATE | UPGRADE | RETAIN | CONTRACT | HALT

The RETAIN path simply returns the current class unchanged.

References:
- src/preRichHysteresis.ts lines 1-12
- src/preRichHysteresis.ts lines 203-221
- src/__tests__/preRichHysteresis.test.ts lines 60-90

There is no canonical economic transition constructor named RETAIN.

Classification:

    RETAIN = controller output only
    RETAIN is NOT a verified IMMORTAL action
    RETAIN cannot be used as the QNE witness

## 5. QUIESCENT

PRE-RICH/onchain/PreRichRegimeState.hs defines:

    PreGenesis | Genesis | Active | Quiescent

But the module is explicitly described as a minimal regime carrier and the only implemented transition is:

    PreGenesis -> Genesis

Reference:
- PRE-RICH/onchain/PreRichRegimeState.hs lines 20-60

No Active -> Quiescent transition is implemented in this module.

The complete application specification contains the lifecycle vocabulary:

    PRE_GENESIS -> GENESIS -> ACTIVE -> QUIESCENT / HALT

Reference:
- PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md lines 110-140

This is specification/state vocabulary, not yet a concrete action/transition system.

## 6. HALT

The hysteresis controller returns HALT when no lower class is maintainable and represents that result with currentActiveClass = null.

References:
- src/preRichHysteresis.ts lines 222-230
- src/__tests__/preRichHysteresis.test.ts lines 104-116

That is a controller result, not a V3Action.

There is a second structural mismatch: the current V3 carrier state validation requires currentActiveClass to be an integer in 0..7 and to exist in the class list.

Reference:
- PRE-RICH/onchain/V3EconomicStateCarrier.hs lines 153-174

Therefore the current HALT representation cannot currently refine directly into the V3 carrier state.

Classification:

    HALT = controller output
    HALT = no canonical V3 economic action
    HALT state representation is incompatible with current V3 carrier state validation

## 7. Deterministic termination proof for the current four-action graph

This is the decisive probe.

Assume only for this subsection that:

    A(S) = {Issue, Reveal, Claim, Expire}

and that the stored class capacities are finite integers.

Define:

    I(S) = sum over classes of max(0, cap - issued)
    U(S) = unresolved ticket count
    L(S) = crystallized liabilities

and order:

    R(S) = (I(S), U(S), L(S))

lexicographically over non-negative integers.

For a valid Issue:
- issued increases by one;
- the affected class must still have issued < cap;
- therefore I decreases by one.

Reference:
- IMMORTAL/kernel/EconomicTransitionV3.hs lines 28-50
- IMMORTAL/kernel/EconomicTransitionV3.hs lines 84-91

For Reveal and Expire:
- issued counts do not increase;
- unresolved count decreases by one;
- therefore I is unchanged and U decreases by one.

Reference:
- IMMORTAL/kernel/EconomicTransitionV3.hs lines 52-80
- IMMORTAL/kernel/EconomicTransitionV3.hs lines 104-125

Reveal can increase liabilities, but U is compared before L in the lexicographic rank.

For Claim:
- amount must be positive;
- amount cannot exceed liabilities;
- liabilities decrease by the claimed amount;
- therefore I and U are unchanged and L strictly decreases.

Reference:
- IMMORTAL/kernel/EconomicTransitionV3.hs lines 82-103

Thus every valid transition strictly decreases R(S).

A strictly descending sequence in non-negative integer triples cannot be infinite.

Therefore, under the literal four-action closure:

    no infinite V3 execution strategy exists
    K*_(V3-four-actions) = empty set

This conclusion does NOT depend on assuming constant EEV.

It is a theorem about the restricted implemented action space, not a refutation of IMMORTAL itself.

## 8. EEV and Omega

EEV is intentionally external to the V3 state.

References:
- docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md lines 9-20
- IMMORTAL/state/UniversalEconomicState.hs lines 5-26

The admission boundary receives EEV as an external verified input:

PRE-RICH/onchain/PreRichEconomicAdmission.hs lines 21-27 and 46-70

It also receives an already-produced boolean named allOmegaSuccessorsInCertifiedKernel.

The current implementation does not construct or compute a full:

    Omega(S,a)
    T(S,a,omega)

environment model for a quiescent action.

The EEV contract requires:
- deterministic authoritative valuation;
- fail-closed handling of unavailable/stale/equivocating values;
- adverse valuation moves represented in Omega.

Reference:
- docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md lines 47-62

Therefore this audit does NOT assume:

    EEV' = EEV

and does NOT invent a valuation decay or appreciation process.

Classification:

    CONCRETE MODEL INCOMPLETE

for the quiescent/lifecycle viability problem.

## 9. Terminal economic states

With only the four economic actions, a state can reach a point where:
- no Issue is possible because there is no remaining sale capacity or no saleable class;
- no Reveal or Expire is possible because there are no unresolved tickets;
- no Claim is possible because crystallized liabilities are zero.

The controller also has a HALT result when no maintainable class remains.

There is currently no accepted lifecycle transition that continues the economic system from such a terminal region.

The PRE-RICH specification correctly distinguishes a safe stall from a committed economic transition. Rejection and SAFE STALL cannot be promoted into an action witness.

Reference:
- PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md lines 760-780
- docs/00-normative/01_CONSTITUTION_FINAL.md lines 34-48

## 10. QNE result

QNE is currently ABSENT.

Reason:

1. No concrete lifecycle action a0 is present in the V3 action surface.
2. No Active -> Quiescent/HALT transition defines T(S,a0,omega).
3. No lifecycle Omega envelope is instantiated.
4. No lifecycle EEV shock semantics are instantiated.
5. No representation-preservation proof exists for that transition.
6. The current economic admission boundary consumes a boolean certificate input; it does not manufacture the underlying CK3 proof.

The existing viabilityGate only checks:

    safePostState
    and allOmegaSuccessorsInCertifiedKernel

and explicitly states that the concrete CK1-CK8 certificate remains external.

Reference:
- IMMORTAL/kernel/EconomicGate.hs
- PRE-RICH/onchain/PreRichEconomicAdmission.hs
- docs/02-certification/CONCRETE_KERNEL_CERTIFICATION_SPECIFICATION.md

## 11. Four-level diagnosis

### K* mathematical semantics

STATUS: SOUND / NOT REFUTED

The fixed-point theory and T-CHAR remain valid.

### Concrete V3 action-space viability

STATUS: NON-VIABLE under literal four-action closure

If the four V3 actions are the complete A(S), then the deterministic ranking proves K* is empty.

### PRE-RICH lifecycle semantics

STATUS: PARTIALLY SPECIFIED / NOT CLOSED

Lifecycle vocabulary exists and the controller can emit HALT/RETAIN/CONTRACT, but a concrete lifecycle action/transition is missing.

### Concrete K_c certification

STATUS: NOT CERTIFIED

The repository already records concrete K_c, Omega completeness and concrete refinement as open evidence boundaries.

Reference:
- docs/architecture/CAES-CLOSURE-UPDATE-2026-09-28.md

## 12. ROOT CAUSE

ACTION-SPACE / LIFECYCLE MODEL INCOMPLETENESS

The V3 economic transition graph currently models finite economic work:
- Issue creates unresolved exposure;
- Reveal/Expire remove unresolved exposure;
- Claim removes crystallized liabilities.

It does not yet model an accepted conservative lifecycle action that can maintain represented safe economic state indefinitely.

PRE-RICH has the vocabulary for such a mode, but it has not been lifted into a canonical action with complete Accept, Omega, T, Safe and QNE semantics.

## 13. MINIMAL ARCHITECTURAL CHANGE

Do not implement this in this audit.

The minimum conceptual change is:

    define a concrete PRE-RICH lifecycle action
    outside the existing four economic constructors
    and specify its Accept / Omega / T / Safe / QNE / refinement semantics.

The action name is deliberately undecided. It may be application-specific; the IMMORTAL requirement is not the word used but the existence of a real action satisfying the proof obligations.

The least disruptive architecture is likely a separate lifecycle/regime transition boundary rather than changing EconomicTransitionV3.hs.

A future design must also decide how the lifecycle state composes with the V3 economic state for refinement and how the lifecycle action is represented on-chain. That decision is not made here.

## 14. FILES AFFECTED BY A FUTURE CLOSURE

Potential future files, subject to the architecture decision:

- PRE-RICH/onchain/PreRichRegimeState.hs, or a dedicated lifecycle transition module
- PRE-RICH/onchain/PreRichEconomicAdmission.hs
- IMMORTAL/conformance/RefinementV3.hs or a combined PRE-RICH lifecycle refinement artifact
- a concrete QNE / CK1-CK8 certification artifact under docs/02-certification or docs/architecture
- the declared Omega/perimeter and EEV evidence package

Not changed and not required to change for this audit:

- IMMORTAL/kernel/EconomicTransitionV3.hs
- EconomicProfile and economic constants
- payout, reserve, expiry, jackpot and solvency rules
- PRE-RICH/onchain/V3EconomicStateCarrier.hs
- Cardano Reveal implementation

## 15. NORMATIVE IMPACT

NONE at this stage.

The audit does not modify A, Omega, T, Safe, obligation partition, thresholds or economic rules.

If the final lifecycle specification requires changing any normative definition, that must be an explicit architectural/normative decision and not an implementation-side workaround.

## 16. ECONOMIC IMPACT

NONE.

No price, payout, reserve, jackpot, expiry or solvency semantics are changed.

## 17. Final architectural conclusion

The exact obstruction is:

    no true conservative lifecycle action
        ->
    no QNE witness
        ->
    no CK3 witness for the intended concrete kernel
        ->
    no non-vacuity proof for the intended deployment

Separately:

    if A(S) is restricted to Issue/Reveal/Claim/Expire
        ->
    the graph is well-founded
        ->
    no infinite strategy exists
        ->
    K* is empty

This audit therefore does not justify adding NoOp, weakening Safe, narrowing Omega, assuming constant EEV, or treating SAFE STALL/rejection as an economic action.

The next step is an explicit architectural decision on the lifecycle action and its full IMMORTAL semantics. No production patch is warranted before that decision.
