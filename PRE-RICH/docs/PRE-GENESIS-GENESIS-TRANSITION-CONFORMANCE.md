# PRE-RICH — PRE-GENESIS → GENESIS Transition Conformance Boundary

**Status:** CLOSING — semantics frozen; operational conformance still open  
**Branch:** `work/immortal-green-closure`  
**Scope:** PRE-RICH application transition; no IMMORTAL-wide economic change

## 1. Source triangulation

The current Notion transition specifications establish:

- the Genesis predicate is based on **verified PRE Treasury value >= 4,000 USDM**;
- execution of the transition is **permissionless**;
- PRE-GENESIS remains a safe state if nobody submits the transition;
- the transition must be independently revalidated on-chain;
- the Genesis bootstrap is **not automatically PrizePool liquidity**;
- PRE-GENESIS is not terminal and recovery remains possible.

The current repository constitution independently freezes Genesis at 1 USDM and the verified PRE Treasury bootstrap threshold at >= 4,000 USDM.

This document does **not** introduce a new threshold, price, duration, allocation rule, or authority.

## 2. Critical accounting distinction

The Genesis predicate must not be interpreted as:

`PRE bootstrap balance = Genesis PrizePool liquidity`

The verified Treasury condition is evidence that the application may cross the Genesis boundary. It does not by itself reclassify the bootstrap balance as PrizePool liquidity, nor does it create an automatic transfer.

Therefore:

`Verified PRE Treasury State >= Genesis Predicate`

is a **transition predicate**, not an instruction to count the same balance twice.

## 3. Canonical transition contract

The operational chain is:

`Canonical PRE-GENESIS state`
→ `verified Genesis predicate`
→ `observable eligible state`
→ `permissionless candidate transaction`
→ `independent on-chain revalidation`
→ `atomic PRE-GENESIS → GENESIS transition`
→ `canonical Genesis state`

The submitter does not determine whether the predicate is true.

## 4. Required revalidation

The transition implementation must independently verify, at execution time:

1. source regime is PRE-GENESIS;
2. the referenced Treasury state is the canonical protocol-controlled destination;
3. the PRE value used by the predicate is verified and current under the applicable freshness rules;
4. the Genesis predicate is satisfied;
5. no already-consumed transition/state is reused;
6. the resulting state is exactly GENESIS;
7. no unauthorized transfer or reclassification of protected/application balances occurs;
8. concurrent stale submissions cannot duplicate the transition.

## 5. Bootstrap non-double-counting invariant

A successful Genesis transition must preserve the accounting distinction between:

- **bootstrap evidence / Treasury balance**;
- **PrizePool liquidity**;
- **ProtectedCapital**;
- **RawSurplus**;
- any other application-specific reserve.

A balance may participate in more than one derived calculation only where the canonical accounting explicitly defines that relationship. Mere custody in Treasury is not sufficient.

In particular, the Genesis transition must not silently perform:

`Treasury bootstrap → PrizePool liquidity`

unless a separate canonical application rule and atomic ledger transition explicitly authorize that movement.

## 6. Permissionless liveness

P0 defines the common execution fabric:

`Condition → Observation/Discovery → Wake-up → Permissionless Invocation → On-chain Revalidation → Atomic Transition → Canonical State`

If nobody acts after the predicate becomes true:

`PRE-GENESIS canonical safe state → SAFE STALL`

The protocol must remain safe and the transition must remain rediscoverable. No operator, relayer, backend or frontend is economic authority.

## 7. What remains OPEN

The semantic predicate itself is not an open economic decision. Remaining conformance questions are operational:

- exact observable source/state discovery for the verified Treasury predicate;
- exact candidate transaction shape;
- precise on-chain state transition and datum binding;
- stale-state and concurrent-submission rejection;
- evidence that the bootstrap balance is not double-counted;
- permissionless invocation evidence;
- SAFE STALL and later rediscovery evidence;
- recovery interaction with GENESIS/ACTIVE.

## 8. Closure evidence required

The front can be promoted from CLOSING to CLOSED only with a reproducible transition trace containing:

`source state → predicate evidence → candidate tx → validator revalidation → committed destination state → accounting delta`

and explicit negative cases for:

- threshold not reached;
- stale Treasury evidence;
- wrong Treasury destination;
- wrong source regime;
- duplicate/concurrent transition;
- attempted unauthorized bootstrap-to-PrizePool reclassification.

## 9. Non-regression rules

- Do not change the frozen Genesis price.
- Do not change the frozen Treasury threshold.
- Do not treat PRE bootstrap as PrizePool liquidity merely because Genesis becomes active.
- Do not import PRE-RICH Genesis semantics into IMMORTAL universal economics.
- Do not create a privileged Genesis operator.
- Do not infer completion from an off-chain observation.
- Do not weaken the Economic Gate or ProtectedCapital invariants to make the transition executable.

**Current classification:** semantic boundary **CLOSED**; transition-level operational conformance **OPEN/CLOSING**.
