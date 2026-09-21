# Economic Gate ↔ Cardano Conformance Matrix

Status: OPEN — conformance closure work
Branch: `work/immortal-green-closure`

## Purpose

This document defines the exact proof boundary between the chain-neutral V3 economic kernel and the Cardano B1 validator. It does not introduce a new economic rule.

The required equivalence is:

```
V3 candidate post-state
  -> ProtectedCapital(post-state)
  -> RawSurplus(post-state)
  -> Economic Gate / viability
```

must preserve the same economic safety meaning as the Cardano validator's post-state solvency predicates.

## Current verified implementation

### Chain-neutral V3

`EconomicTransitionV3.transitionValid` currently verifies:

- profile validity;
- pre-state conservation;
- pre-state non-negativity;
- transition construction;
- post-state conservation;
- post-state non-negativity.

It does **not** receive EEV and therefore does not itself evaluate `solvencyInvariant`, `protectedCapital`, `rawSurplus`, or a viability predicate.

### Economic kernel

`EconomicKernel` defines:

- class-aware exposure;
- deterministic worst-case exposure;
- effective pool;
- ProtectedCapital;
- RawSurplus;
- solvencyInvariant;
- conservationInvariant.

ProtectedCapital is:

```
CrystallizedLiabilities
+ WorstCaseExposure
+ SafetyCapital
+ ReserveProtection
+ LockedJackpot
+ MandatoryFutureCosts
```

WorstCaseExposure is class-aware:

```
maxNormalPayoutMultiplier
× Σ(price(class) × unresolved(class))
```

Unknown classes fail closed through `classExposure`.

### Cardano B1

`plutus/B1PrizePool.hs` checks `solvencyInvariant` on the post-state for:

- TicketIssued;
- TicketRevealed;
- TicketClaimed;
- TicketExpired.

Therefore the remaining problem is **not absence of Cardano post-state solvency enforcement**.

## Closure matrix

| Action | V3 candidate state | Local V3 validation | ProtectedCapital on candidate | Economic Gate | Cardano post-state solvency | Equivalence evidence |
|---|---|---|---|---|---|---|
| Issue | YES | YES | defined by kernel | OPEN | YES | OPEN |
| Reveal | YES | YES | defined by kernel | OPEN | YES | OPEN |
| Claim | YES | YES | defined by kernel | OPEN | YES | OPEN |
| Expire | YES | YES | defined by kernel | OPEN | YES | OPEN |

## Adapter preservation boundary

The current legacy projection used by B1 maps:

```
SafetyCapital = 0
ReserveProtection = 0
MandatoryFutureCosts = 0
```

and cannot represent non-zero values through the legacy datum.

Conversely, `v3ToLegacyB1` correctly fails closed when unsupported protected-capital or jackpot state is non-zero.

Therefore this is an **adapter preservation gap**, not a reason to weaken V3 semantics.

## Required evidence to close

For every action:

1. Construct canonical V3 pre-state.
2. Construct candidate V3 post-state.
3. Compute full ProtectedCapital from the candidate.
4. Compute RawSurplus where EEV is available.
5. Evaluate the canonical Economic Gate.
6. Observe the corresponding Cardano post-state.
7. Evaluate Cardano's validator predicate.
8. Prove that accepted/rejected outcomes agree for the tested state domain.
9. Include adversarial cases for every protected-capital component.
10. Include class permutations and unknown-class rejection.
11. Include Jackpot locked-state preservation.
12. Include zero and boundary cases.

## Non-goals

This matrix does not:

- invent a statistical-reserve addend;
- change 500×;
- change PRE-RICH ticket prices;
- turn Cardano into the economic authority;
- weaken fail-closed adapter behavior;
- declare end-to-end conformance before evidence exists.

## Current closure statement

**Cardano post-state solvency enforcement: PRESENT.**

**Canonical V3 Economic Gate equivalence: OPEN.**

**Full V3 protected-capital preservation through B1 legacy projection: OPEN.**
