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
7. Challenge finalization requires `DecisionRecorded`, a valid challenge set, and expiry of the finality window.
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

The repository's older `GovernanceCanonicalReplay` API accepts a parallel semantic `GovernanceEvent`. GOV-28 deliberately removes that model from the replay API. The canonical replay path now also retains the canonical event history needed to compare `CanonicalizationRecord.canonicalizationDecisionRecordReference` with the exact `DecisionRecord.decisionCanonicalizationReference` for the same proposal; a mismatch fails closed. A concrete payload decoder and a real Cabal build/test run are still required before the Haskell replay can be declared fully executable-conformant.

This is an explicit implementation boundary, not a hidden gap. The current reference verifier also confirms that finality/challenge lifecycle is not yet implemented in that verifier.

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
