# IMMORTAL — EXP-05 Abstract Contingent Claims Boundary v1

**Classification:** research / conformance boundary, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Generalize the existing "established right → settlement" pattern into an abstract contingent-claim boundary without changing PRE-RICH Claim semantics.

The research candidate is:

`ClaimSpec = (triggerPredicate, payoffFunction, cap, settlementAsset)`

where the trigger and payoff are functions over an explicitly supplied event/state domain.

This is a candidate abstraction, not a new IMMORTAL normative object.

## Existing semantic anchor

IMMORTAL already defines the generic Claim pattern as:

`verify right → settle once → reduce liability once`

PRE-RICH implements Claim as settlement of an already established right. The current Claim path does not recalculate the game result during settlement.

That existing separation is the safe foundation for a generalized claim interface.

## Candidate layers

The research model separates:

### Claim definition

Declares:

- trigger predicate;
- payoff function;
- payoff cap, when applicable;
- settlement asset/domain.

### Claim establishment

Evaluates the trigger against a certified event/state and creates an **established claim instance** containing the resulting entitlement.

### Claim settlement

Consumes the established claim exactly once and settles the already-established entitlement.

The settlement layer must not acquire authority to redefine the trigger, payoff function, or cap.

## Required boundary properties

1. Missing claim definition is **UNVERIFIABLE**.
2. An unverified trigger cannot establish a claim.
3. A claim instance records its established entitlement explicitly.
4. Settlement uses the recorded entitlement rather than recomputing a mutable state-derived amount.
5. A cap, when declared by the applicable profile, is enforced at establishment/authorization rather than invented at settlement.
6. The settlement asset remains explicit.
7. A claim definition is not itself proof that its trigger occurred.
8. The abstraction must not bypass existing Economic Gate, liability, ownership, expiry, or evidence boundaries.

## PRE-RICH non-change rule

This expansion does **not**:

- replace `V3Action Claim`;
- change PRE-RICH payout formulas;
- change expiry;
- change ownership semantics;
- introduce a new universal cap;
- reinterpret `PrizeDatum`;
- make the renderer or DApp an authority.

PRE-RICH remains a concrete application instance of the existing established-right settlement pattern.

## Open semantic questions

Still OPEN:

- canonical event type for trigger evaluation;
- whether cap is part of universal claim semantics or profile policy;
- whether settlement asset can be a basket/multi-asset value;
- how claim identity/versioning is committed;
- how competing or overlapping claims are represented;
- whether all contingent claims must become explicit persisted rights before settlement.

No production claim-pluggability API should be introduced before these questions are settled.

## Minimal adversarial conformance

The bounded harness checks:

- explicit definition is required;
- trigger evaluation establishes an entitlement;
- settlement consumes the established entitlement;
- changing the post-establishment state does not silently change the recorded settlement amount;
- missing or invalid claim definition fails closed.

Passing the harness does not prove a production contingent-claims engine.

## Status

**EXP-05: RESEARCH BOUNDARY READY / CLAIM ABSTRACTION OPEN.**
