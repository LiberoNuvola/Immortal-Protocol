# GOV-18 → Phase 5 Canonical Event Schema

## Closed in this package
The implementation now has an explicit canonical event representation containing:

- `event_id`
- `proposal_id`
- `ruleset_version`
- `event_type`
- `actor_class`
- `timestamp`
- `payload_commitment`
- `predecessor`
- `evidence_refs`
- `status`

A deterministic textual canonical representation is defined for the event body.

Replay is defined over ordered `(CanonicalEvent, GovernanceEvent)` pairs and rejects an invalid predecessor chain before applying the event.

## Important boundary

This phase does NOT claim cryptographic hashing, because the current package deliberately uses a deterministic payload representation rather than introducing an unverified external hashing dependency.

It also does not yet close:
- cryptographic commitment/hash algorithm;
- actor authorization policy;
- evidence reference resolution;
- challenge-state semantics;
- finality resolution/expiry state machine;
- ruleset immutability enforcement;
- independent second implementation.

Therefore this remains an implementation/conformance candidate, not a conformance certificate.
