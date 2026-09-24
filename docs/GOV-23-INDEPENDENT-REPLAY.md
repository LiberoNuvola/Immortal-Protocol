# GOV-23 — Independent Replay & Deterministic Conformance Vectors

## Status

**GOV-23 PACKAGE PREPARED — NOT YET CANONICAL**

This milestone extends GOV-22 by introducing a language-neutral canonical
replay vector and an independent reference implementation.

## Objective

GOV-22 removed the parallel `(CanonicalEvent, GovernanceEvent)` replay input.
GOV-23 makes that boundary testable outside the Haskell implementation.

A conforming replay implementation consumes:

`InitialGovernanceState + [CanonicalEvent] -> GovernanceState`

The vector therefore carries semantic payloads inside each event and a single
expected final state.

## What is tested

1. Required canonical event fields are present.
2. Event type and semantic payload agree.
3. Proposal identity is consistent between envelope and payload.
4. Predecessor chaining is deterministic.
5. Rejected events are not replayed.
6. Replay from the same initial state and same event list is deterministic.
7. The resulting state equals the published expected vector.

## Deliberate boundary

This package does **not** yet claim:

- cryptographic verification of `payload_commitment`;
- a finalized cross-language canonical serialization;
- actor authorization;
- evidence resolution;
- complete ruleset authorization;
- equivalence of the Haskell implementation and this reference for all event
  types;
- deployment conformance.

Those are separate closure obligations.

## Important GOV-22 issue carried forward

The current GOV-22 Haskell proposal serializes semantic payloads through
Haskell `show`. That is useful as an implementation placeholder but is not a
sufficient language-neutral canonical serialization standard.

Therefore GOV-23 uses explicit JSON vectors as test fixtures, while leaving
the final canonical byte encoding for a subsequent grouped milestone.

## Acceptance criteria

- The vector is committed under `verification/`.
- The independent reference replay runs deterministically.
- At least one positive vector and negative validation cases exist.
- The package clearly separates mechanical evidence from implementation
  conformance claims.
- No governance semantic is silently invented for event types not covered by
  the vector contract.
