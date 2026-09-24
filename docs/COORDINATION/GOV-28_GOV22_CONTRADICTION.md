# GOV-28 — GOV-22 Internal Contradiction Isolated

Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Finding

The current `GOV-22-SPEC.md` contains an internal wording contradiction.

Objective says to remove the parallel representation `(CanonicalEvent, GovernanceEvent)`.

Normative property then defines the transition as:

`CanonicalEvent -> payloadToGovernanceEvent -> applyEvent -> GovernanceState'`.

Current implementation does exactly this through:
`canonicalPayloadToGovernanceEvent` followed by `applyEvent`.

Therefore the implementation currently conforms to the **literal transition diagram**, while still retaining the old `GovernanceEvent` as the semantic transition algebra. It does not satisfy the stronger objective of making `CanonicalEvent` the sole authoritative semantic input.

## Classification

This is a **spec clarification/reconciliation issue**, not permission to invent a new event model.

The next authoritative step must determine which already-approved interpretation of GOV-22 is intended:

1. CanonicalEvent is merely the transport envelope and conversion to GovernanceEvent is authoritative; or
2. CanonicalEvent itself is the authoritative semantic transition input and GovernanceEvent must disappear from the replay boundary.

The current GOV-18/Phase-6 closure work has been operating under (2), but the GOV-22 text currently contains language supporting (1).

## Evidence

Current implementation:
- `GovernanceCanonicalReplay.applyCanonicalEvent` validates CanonicalEvent and then calls `applyEvent st (canonicalPayloadToGovernanceEvent ...)`.
- `Governance.replay` still consumes `[GovernanceEvent]`.

No code change is made here because resolving this contradiction would change the interpretation of an existing specification.

## Safe continuation

Search the coordination/decision register for the latest GOV-22 closure decision before changing the authoritative replay API. If no newer decision exists, flag this as an explicit normative reconciliation item rather than silently choosing an interpretation.
