# GOV-28 — Full Governance Event Vocabulary & State Conformance

## Purpose

GOV-28 is a grouped conformance milestone. It closes the structural governance boundary across:

- canonical event vocabulary;
- actor authorization;
- evidence presence and uniqueness;
- ruleset registration/commitment compatibility;
- predecessor continuity;
- lifecycle transition validity;
- challenge/finality preconditions;
- canonical replay entry point;
- positive and negative reference vectors.

## Important boundary

The canonical event schema, authorization, ruleset binding, replay integration, and challenge/finality handlers are implemented and covered by reference vectors. The remaining certification boundary is executable evidence on the current repository head: a fresh Cabal build/test run must pass, including the full canonical replay suite. Production evidence authenticity and deployment certification remain separate instance-dependent gates.

## Normative invariants

1. Accepted canonical events require valid schema and predecessor.
2. Every accepted event has at least one unique evidence reference.
3. Event type and actor class must match the authorization matrix.
4. The event ruleset version must exist in the registry.
5. The event commitment must equal the registered ruleset commitment.
6. The first event has no predecessor; every subsequent event names the immediately previous event.
7. Canonical event identifiers are unique within a replay history, and an event cannot reuse the predecessor's identifier.
8. Canonical event timestamps are monotone non-decreasing along the predecessor chain.
9. An event may reference only a ruleset version that is registered and active at the event timestamp.
10. Decision and conformance witnesses must carry the same ruleset version as the containing canonical event.
11. Challenge finalization requires `DecisionRecorded`, a valid challenge set, and expiry of the finality window.
12. Upheld or open challenges block finalization.
13. Canonical replay must consume canonical events rather than a parallel hidden `(event, semantic-event)` source.
14. Conformance is evidence about an implementation; it does not create normative authority.

## Authorization baseline

| Event | Required actor |
|---|---|
| ProposalSubmitted | Proposer |
| ProposalClassified | System |
| StatusChanged | System |
| VoteCast | Voter |
| DelegationSet | Delegate |
| GatesSet | Reviewer |

`Auditor` and `EmergencyAuthority` remain reserved for explicit future event rules.

## Remaining integration boundary

The canonical replay integration boundary has advanced beyond the original package-preparation note. `GovernanceCanonicalReplay.hs` now exposes `canonicalPayloadToGovernanceEvent`: canonical payloads that map to the legacy semantic vocabulary are decoded there, while the distinct finalization/adoption/conformance/canonicalization payloads are handled by dedicated replay handlers. The replay retains canonical history and fail-closes when the `CanonicalizationRecord` reference does not match the finalized `DecisionRecord` reference for the same proposal.

The remaining boundary is therefore **fresh executable conformance evidence**, not absence of a payload decoder: the current Haskell replay and full lifecycle/finality suite must still produce a successful exact-head build/test artifact. The standalone reference verifier remains supplemental and is not treated as a substitute for compiled evidence.

This is an explicit certification boundary, not a hidden implementation gap.

## Reference verification

Run:

```text
python verification/gov28_reference.py
```

Observed from `verification/gov28_reference.py`:

```text
GOV-28 reference conformance: PASS
positive replay: PASS
negative authorization/evidence/ruleset gates: PASS
finality/challenge lifecycle: NOT IMPLEMENTED IN THIS REFERENCE
```

The finality/challenge lifecycle therefore remains an explicit implementation gap and must not be represented as closed by the reference script.

## Status

**GOV-28 IMPLEMENTATION COMPLETE; EXACT-HEAD EXECUTABLE EVIDENCE PENDING**

Not yet certified:

- current-head Haskell/Cabal build and full replay suite result;
- external authenticity/availability of referenced evidence objects;
- production deployment certification;
- canonical serialization migration (the current SHA-256 preimage format remains unchanged and any future replacement requires explicit versioning).


## 2026-09-26 — canonical event identity/time hardening

The executable replay boundary now fail-closes on two previously unbound history properties:

- duplicate eventId values within a canonical replay history;
- timestamp regression relative to the immediately preceding canonical event.

The immediate predecessor identifier is also required to differ from the current event identifier, preventing a self-referential predecessor edge.

Existing SHA-256 commitment semantics and serialized commitment bytes are unchanged by this hardening; no commitment migration is introduced.


## 2026-09-26 — GOV-28 ruleset binding hardening

The canonical event boundary now binds `ruleset_version` in three places: registry registration, timestamp-effective activation, and embedded Decision/Conformance witness records. A future-effective ruleset cannot be used before its registry effective timestamp, and a witness cannot silently carry a different ruleset version from the canonical event.
