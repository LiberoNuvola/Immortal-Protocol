# GOV-28 — Phase 6 Wiring / Authoritative Transition Handoff

Date: 2026-09-23
Branch: `work/immortal-green-closure`

## Finding

Current-branch inspection found a substantial GOV-18 Phase 5/6 package:

- `GovernanceCanonicalReplay.hs`
- `GovernanceFinality.hs`
- `GovernanceConformance.hs`
- `GovernanceCanonicalEventTest.hs`
- `GovernanceCanonicalReplayTest.hs`
- `PHASE5-CANONICAL-EVENT-STATUS.md`
- `PHASE6-FINALITY-RULESET-STATUS.md`
- `GOV-22-SPEC.md`

This is useful implementation work, but it is not yet the authoritative governance transition path.

## Critical wiring observation

The authoritative `Governance.hs` still exposes:

`GovernanceState + GovernanceEvent -> GovernanceState`

and its `GovernanceEvent` algebra remains:

`ProposalSubmitted | ProposalClassified | StatusChanged | VoteCast | DelegationSet | GatesSet`.

`GovernanceCanonicalReplay.hs` validates a `CanonicalEvent` and then converts its payload into that older `GovernanceEvent` before calling `applyEvent`.

Therefore the package currently has a **canonical-event layer over the old transition function**, rather than a single canonical-event semantic source of truth.

This is exactly the remaining Phase 6 gate described by `PHASE6-FINALITY-RULESET-STATUS.md`: wire the canonical event object directly into the authoritative state transition function.

## Finality observation

`GovernanceFinality.hs` provides explicit challenge objects and deterministic expiry, but `finalize` currently moves:

`DecisionRecorded -> Canonical`

directly.

That is not sufficient by itself to prove the GOV-18 separation:

`DECISION_FINALIZED -> ADOPTION -> CONFORMANCE -> CANONICALIZED`.

It must therefore be treated as a conformance component until its semantics are reconciled with the authoritative lifecycle.

## What is actually closed

- Explicit challenge data structure exists.
- Challenge opening is bounded by the existing 3-day finality window.
- Challenge resolution is one-way.
- Expiry is deterministic.
- Independent replay module exists.
- Canonical event payload validation exists.
- Deterministic canonical-event body exists.

## What remains open

1. CanonicalEvent must become the semantic input to the authoritative transition, without a parallel GovernanceEvent source of truth.
2. Finalization, adoption, conformance and canonicalization must remain distinct semantic witnesses.
3. The existing finality helper must not silently collapse those states.
4. Independent replay must compare the resulting authoritative state, not only successful application of the wrapper.
5. Conflict protection / one-shot canonicalization remains separate and must use an existing canonical identity rather than inventing one.

## Next minimum delta

Do not add new governance parameters.

First reconcile `GovernanceFinality.hs` and `GovernanceCanonicalReplay.hs` with `Governance.hs` and GOV-22/GOV-18. Then add the smallest negative tests proving that:

- canonical event payload is the only semantic transition input;
- finalization without resolved/expired challenge is rejected;
- adoption is not canonicalization;
- conformance is not approval;
- canonicalization cannot be repeated with a conflicting root/identity.

## Classification

**Implementation/conformance gap, not an open normative decision.**
