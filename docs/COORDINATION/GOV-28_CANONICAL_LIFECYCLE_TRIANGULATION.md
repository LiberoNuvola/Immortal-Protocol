# GOV-28 — Canonical Lifecycle Representation Triangulation

## New finding

The repository contains a stronger written implementation contract than the live Haskell state model.

### Normative/implementation contract
`docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md` explicitly defines the GOV-18 event vocabulary, including distinct:
- `DECISION_FINALIZED`
- `ADOPTION_RECORDED`
- `CONFORMANCE_RECORDED`
- `CANONICALIZED`

It also requires ordered immutable replay and invalid-event rejection.

### GOV-28 / GOV-29 status documents
`docs/GOV-28-FULL-GOVERNANCE-CONFORMANCE.md` states that canonical replay should consume canonical events rather than a hidden parallel semantic event source.

`docs/GOV-29-EXECUTABLE-CANONICAL-REPLAY.md` claims the replay API consumes only `GovernanceState + [CanonicalEvent]`.

### Live Haskell contradiction
The live `IMMORTAL/governance/Governance.hs` still has:
- only six `GovernanceEvent` constructors;
- no `DecisionFinalized`, `AdoptionRecorded`, `ConformanceRecorded`, or `Canonicalized` event constructors;
- `DecisionRecorded -> Accepted -> Adopted -> Canonical` as the operational lifecycle;
- finality represented separately by `GovernanceFinality`;
- canonical replay conversion through the old semantic `GovernanceEvent` layer.

Therefore GOV-29 is a **declared target/status document, not evidence that the live state transition has reached that target**.

## Important consequence

This resolves the earlier search question: an existing canonical lifecycle representation **does exist in the repository documentation/specification**, but it is not yet represented in the authoritative live Haskell lifecycle.

So the next work is not to invent a lifecycle. It is to reconcile the implementation with the already-defined GOV-18 event algebra.

## Safety boundary

Do not add ad-hoc fields to `GateResult` or reinterpret `finalizationAt`.

Do not silently rename existing statuses into canonical event types.

The implementation delta must preserve the already-closed GOV-18 distinctions:
- decision finalization
- adoption
- conformance
- canonicalization

and must wire them into replay/state admission without introducing new governance parameters.

## External engineering cross-check

Event-sourcing guidance independently supports the architectural requirement that immutable ordered events form the source history and that state be reconstructible by replay; it also highlights explicit versioning/conflict handling as important implementation concerns. This is supporting engineering evidence only, not IMMORTAL normative authority. citeturn0search0
