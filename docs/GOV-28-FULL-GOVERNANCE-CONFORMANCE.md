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

This package does **not** claim that the repository's current Haskell build is compiled and passing. It provides the coherent conformance layer and a language-neutral reference check.

The existing repository state still requires integration of the semantic payload decoder with the concrete canonical event representation and a real Cabal build/test run.

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
8. Upheld or open challenges block finalization.
9. Canonical replay must consume canonical events rather than a parallel hidden `(event, semantic-event)` source.
10. Conformance is evidence about an implementation; it does not create normative authority.

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

The remaining boundary is therefore **executable conformance evidence**, not absence of a payload decoder: a real Cabal build/test run of the current Haskell replay is still required, together with full lifecycle/finality coverage in the compiled suite. The reference verifier remains deliberately incomplete for finality/challenge lifecycle and does not constitute a theorem proof.

This is an explicit implementation boundary, not a hidden gap.

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

**GOV-28 PACKAGE PREPARED**

Not claimed:

- full Haskell compilation;
- full repository integration;
- cryptographic identity authentication beyond the exact reference equality enforced in canonical replay;
- real evidence authenticity;
- semantic authorization of every governance transition;
- production deployment certification.


## 2026-09-26 — canonical event identity/time hardening

The executable replay boundary now fail-closes on two previously unbound history properties:

- duplicate eventId values within a canonical replay history;
- timestamp regression relative to the immediately preceding canonical event.

The immediate predecessor identifier is also required to differ from the current event identifier, preventing a self-referential predecessor edge.

Existing SHA-256 commitment semantics and serialized commitment bytes are unchanged by this hardening; no commitment migration is introduced.


## 2026-09-26 — GOV-28 ruleset binding hardening

The canonical event boundary now binds `ruleset_version` in three places: registry registration, timestamp-effective activation, and embedded Decision/Conformance witness records. A future-effective ruleset cannot be used before its registry effective timestamp, and a witness cannot silently carry a different ruleset version from the canonical event.
