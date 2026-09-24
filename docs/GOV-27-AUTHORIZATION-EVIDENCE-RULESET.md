# GOV-27 — Authorization, Evidence & Ruleset Binding

## Status

**GOV-27 PACKAGE PREPARED — POLICY SURFACE FROZEN AT BASELINE LEVEL**

GOV-27 adds three independent gates after canonical integrity:

1. **Authorization** — the actor class is permitted to emit the event type.
2. **Evidence** — the event carries the required evidence references.
3. **Ruleset** — the event's ruleset version exists in the immutable registry and
   its commitment matches the registry entry.

The combined validity predicate is:

`CanonicalValid ∧ AuthorizationValid ∧ EvidenceValid ∧ RulesetAuthorizationValid`

## Why the gates remain independent

A valid SHA-256 commitment does not establish authority.
An authorized actor does not establish evidence.
Evidence does not establish that the referenced ruleset is active or compatible.

Each condition is therefore checked separately.

## Current baseline policy

The event-type/actor matrix is:

| Event | Authorized actor |
|---|---|
| ProposalSubmitted | Proposer |
| ProposalClassified | System |
| StatusChanged | System |
| VoteCast | Voter |
| DelegationSet | Delegate |
| GatesSet | Reviewer |

`Auditor` and `EmergencyAuthority` are reserved classes and must receive
explicit event-specific rules before being accepted for production semantics.

## Evidence baseline

Every event type currently requires at least one `EvidenceRef`.

This is a structural gate only. It does not claim that the referenced evidence
exists, is authentic, or satisfies the substantive gate. Evidence resolution is
a subsequent contract.

## Ruleset baseline

The existing append-only `RulesetRegistry` is used. A canonical event is
ruleset-compatible only when its ruleset version is registered and its
declared commitment equals the registry commitment.

## Non-claims

GOV-27 does not yet prove:

- cryptographic authenticity of evidence references;
- actor identity authentication;
- temporal activation policy beyond registry compatibility;
- semantic authorization of every possible lifecycle transition;
- deployment conformance.

Those remain explicit closure work.
