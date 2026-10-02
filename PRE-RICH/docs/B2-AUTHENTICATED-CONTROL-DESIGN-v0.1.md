# B2 — PRE-RICH authenticated on-chain control state

**Status:** DESIGN CLOSURE CANDIDATE — implementation intentionally not claimed closed  
**Branch:** `work/immortal-green-closure`  
**Date:** 2026-09-26

## Purpose

Close the remaining B2 gap without promoting PRE-RICH class control into the universal IMMORTAL kernel.

The required authority is:

`CurrentActiveClass` + `HighestClassEverActivated`

as an authenticated Cardano state, rather than values supplied only by an off-chain projection.

## Canonical boundary

The universal IMMORTAL state continues to treat these fields as application policy.

The Cardano implementation therefore introduces no universal `EconomicControlDatum`.

Instead PRE-RICH owns a dedicated singleton control carrier:

`PRE-RICH Control UTxO`

authenticated by a deployment-specific singleton asset.

This is separate from:

- B1 PrizePool accounting state;
- legacy Treasury;
- Genesis Regime Carrier;
- Oracle State.

No existing economic constant changes.

## Candidate datum

Minimal application datum:

```
PreRichControlDatum
  currentActiveClass         :: Integer
  highestClassEverActivated  :: Integer
  stateVersion               :: Integer
  transitionNonce             :: Integer
  controlPolicy              :: BuiltinByteString
  controlTokenName           :: BuiltinByteString
```

The control token identity is a deployment parameter and MUST NOT be invented in source.

The singleton token must have exactly one unit across the relevant transaction.

## On-chain authentication invariant

A control observation is authoritative only when all are true:

1. exactly one control UTxO is selected;
2. the UTxO contains exactly one configured control singleton token;
3. its datum decodes as `PreRichControlDatum`;
4. `0 <= CurrentActiveClass <= HighestClassEverActivated <= 7`;
5. the control token is preserved through control-state transitions;
6. no second control singleton is introduced;
7. the observed datum is the datum actually carried by the authenticated UTxO.

A TypeScript object, frontend state, relayer state, or projection without this UTxO is never authoritative.

## Activation / contraction

Only a control-state transition may change the two fields.

Required transition rules:

- activation:
  - `newCurrent >= oldCurrent`;
  - `newHighest >= oldHighest`;
  - `newHighest >= newCurrent`;
  - `newHighest` may increase only when the existing PRE-RICH activation predicate is satisfied;
- contraction:
  - `newCurrent <= oldCurrent`;
  - `newHighest == oldHighest`;
  - contraction cannot erase historical activation;
- unrelated economic actions:
  - current/highest control state is preserved exactly.

The existing PRE-RICH hysteresis implementation remains the normative policy calculation. The Cardano validator is the enforcement boundary, not a second policy engine.

## Read authority for Issue

A ticket Issue transaction must read the authenticated control carrier and independently verify:

`ticketClass <= CurrentActiveClass`

and the relevant PRE-RICH class/capacity predicates.

The transaction must not accept a caller-supplied CurrentActiveClass as authority.

The control UTxO is a reference input for ordinary Issue operations; it is consumed only by an authorized control-state transition.

## What does NOT move into the control carrier

The carrier MUST NOT become a generic economic state.

It does not contain:

- EEV;
- ProtectedCapital;
- RawSurplus;
- Treasury balance;
- Jackpot liquidity;
- ticket liabilities;
- payout amounts;
- Oracle price;
- governance state.

Those remain under their existing owners.

## Failure modes

The control boundary must fail closed for:

- missing control UTxO;
- zero/multiple singleton tokens;
- multiple candidate control UTxOs;
- malformed datum;
- class outside 0..7;
- current > highest;
- attempted highest decrease;
- attempted current increase without valid activation predicate;
- attempted control mutation during Issue/Reveal/Claim/Expire;
- replacement of the authenticated control UTxO with an attacker-controlled datum.

## Required adversarial tests

### Positive

- exact singleton control observation;
- Issue against authenticated active class;
- valid class contraction;
- valid class activation;
- monotonic highest-ever increase.

### Negative

- forged off-chain control values;
- wrong singleton token;
- duplicate singleton;
- duplicate control UTxO;
- current > highest;
- highest decrease;
- current increase without predicate;
- control datum mutation during Issue;
- control datum mutation during Reveal;
- stale control reference;
- attacker-controlled reference UTxO;
- missing control datum.

## Deployment blocker

The repository does not currently establish a canonical deployment-specific control singleton policy/name.

Therefore implementation MUST NOT hard-code one.

Closure requires:

`deployment control singleton identity → real UTxO → authenticated datum → adversarial ledger trace`

Until that identity and ledger instance exist, B2 remains **architecturally specified but not GREEN**.

## Closure criterion

B2 closes only when a real Cardano transaction demonstrates:

`authenticated control UTxO`
→ `independent on-chain validation`
→ `Issue/activation/contraction enforcement`
→ `monotonic HighestClassEverActivated`
→ `rejection of forged/replaced control state`

No source-level projection or unit-test-only result is sufficient.
