# B5/B6 — Action-by-Action Economic Gate / Cardano Evidence Contract v1

**Classification:** conformance / evidence contract, non-normative  
**Branch:** `work/b3-materios-provenance-evidence`  
**Date:** 2026-10-11

## Purpose

Freeze the evidence relation required to close the remaining B5/B6 boundary without changing
IMMORTAL economic semantics, V3 transition semantics, or Cardano validator economics.

The contract separates:

```
V3 structural transition
→ verified economic observation
→ ProtectedCapital / RawSurplus
→ Economic Gate / Viability
→ Adapter execution envelope
→ Cardano validation
→ observed post-state
```

A green unit test, simulation, or UI result is not a deployment witness.

## Canonical action set

The action set is fixed to the lifecycle already mapped by the existing conformance register:

- Issue
- Reveal
- Claim
- Expire

The evidence contract does not add actions and does not change their economic meaning.

## Required evidence packet per action

For each tested action, the packet must bind:

| Field | Requirement |
|---|---|
| Canonical pre-state | exact V3 state fingerprint |
| Action | canonical action and parameters |
| Candidate post-state | deterministic V3 candidate fingerprint |
| ProtectedCapital | full component values on candidate state |
| EEV | verified observation, when the Gate requires it |
| Executable liquidity | verified immediate-settlement envelope when required by the action |
| Gate result | exact evaluated admissibility result |
| Viability result | the existing certified predicate/result, where applicable |
| Adapter input | exact serialized chain input |
| Ledger state | exact transaction/UTxO/protocol-parameter references |
| Cardano predicate | validator acceptance/rejection result |
| Post-state | observed/refined successor state |
| Evidence provenance | commit/source/observation references |

The packet must allow an independent rerun from frozen inputs.

## Action-specific closure obligations

### Issue

The evidence must show:

`profile/class validity + saleability boundary → candidate state → economic admission → Cardano issue`.

The Cardano validator's price/NFT/solvency checks are not, by themselves, proof that the V3
class-saleability predicate was enforced.

Do not add class-control logic to the validator merely to close this evidence gap. The
refinement boundary must carry the already-defined application predicate or explicitly
record the remaining divergence.

### Reveal

The evidence must distinguish:

1. V3 payout admissibility;
2. ProtectedCapital/post-state solvency;
3. immediate executable liquidity;
4. the Cardano pre-reveal liquidity predicate.

The existing Cardano condition

`payout <= effectivePool(pre)`

must be represented as an execution-liquidity/refinement obligation rather than promoted
to a new universal economic formula.

Required negative vector:

- V3 structural/post-state conditions pass;
- immediate executable liquidity is insufficient;
- Cardano rejects.

This vector demonstrates the predicates are not identical and prevents accidental
equivalence claims.

### Claim

The evidence must include the environment predicates already present in the Cardano path:

- ownership/signature;
- expiry eligibility;
- exact settlement-value equivalence under the active oracle;
- atomic liability/liquidity reduction;
- ticket-NFT preservation.

These are execution/refinement facts. They must not be silently absorbed into the universal
economic transition predicate.

### Expire

The evidence must bind the specific ticket's crystallized `expiresAt` to the observed
state.

A class-level aggregate expiry action is insufficient as a standalone proof of the
per-ticket timing obligation.

Required negative vectors:

- pre-expiry attempt rejected;
- post-expiry transition accepted only when the existing lifecycle predicates hold;
- late reveal produces zero economic effect;
- expired claim is rejected.

No numeric expiry duration is introduced by this contract.

## ProtectedCapital preservation vectors

Every action-level packet must include both positive and mutation cases for:

- SafetyCapital;
- ReserveProtection;
- MandatoryFutureCosts;
- Locked Jackpot state.

The mutation cases must fail closed at the representation/refinement boundary rather than
being silently projected away.

The existing `ProtectedCapitalConformance` and projection-boundary tests are reusable
evidence; they are not duplicated here.

## Equivalence rule

B5/B6 may be called **closed for a tested action/state domain** only if:

`same canonical inputs + same observation + same action`

produce agreement across:

`V3 candidate → Gate/Viability → adapter admission → Cardano predicate → observed post-state`.

Agreement means either both paths admit or both reject for the tested case, with any
intentional execution-specific predicate explicitly represented in the refinement/evidence
envelope.

This is not a proof over all possible states.

## Explicit non-claims

This contract does not:

- change KA/KC/KD;
- change 500×;
- change ticket prices;
- change Jackpot policy;
- change expiry policy;
- redefine ProtectedCapital;
- make Cardano the economic authority;
- make EEV authoritative merely because a boolean is present;
- declare K* or Kc certified;
- declare full V3↔Cardano equivalence before the evidence exists.

## Current status

- V3 → Universal aggregate differential evidence: **PRESENT**
- Economic Gate interface: **PRESENT**
- ProtectedCapital component preservation tests: **PRESENT**
- B5/B6 action-by-action evidence packet: **CONTRACT FROZEN**
- Real ledger-aligned equivalence evidence: **OPEN**
- Full V3↔Cardano equivalence: **OPEN**
- Real Preprod execution witness: **OPEN**
