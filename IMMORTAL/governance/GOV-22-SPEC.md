# GOV-22 — Canonical Event → Authoritative Governance State

## Objective

Remove the parallel replay representation:

`(CanonicalEvent, GovernanceEvent)`

A canonical event must contain the semantic payload required to perform
the authoritative governance transition.

## Normative property

A conforming replay implementation consumes:

`GovernanceState + [CanonicalEvent]`

and nothing else.

The transition is:

`CanonicalEvent -> payloadToGovernanceEvent -> applyEvent -> GovernanceState'`

The semantic conversion is deterministic and part of the canonical schema.

## Required bindings

Every canonical event must bind:

- event identity;
- proposal identity;
- ruleset version;
- event type;
- actor class;
- timestamp;
- semantic payload;
- payload commitment;
- predecessor;
- evidence references;
- event status.

The schema rejects a payload whose proposal identifier does not match
`eventProposalId` and rejects an event type/payload-type mismatch.

## Consequence

A second out-of-band `GovernanceEvent` cannot silently disagree with the
canonical event. There is no second semantic source of truth.

## Important remaining boundary

This milestone wires the semantic event directly into replay. It does not
yet claim that SHA-256 commitment verification, actor authorization,
evidence resolution, or full ruleset authorization are complete. Those
remain explicit follow-up requirements and must be enforced before
Phase 6 governance closure.

## Compatibility

This is intentionally a breaking internal schema change from the previous
parallel-pair replay API. Existing callers must migrate to the canonical
event list.
