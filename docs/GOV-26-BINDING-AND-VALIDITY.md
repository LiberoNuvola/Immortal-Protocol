# GOV-26 — Haskell Commitment Binding & Canonical Event Validity

## Status

**GOV-26 PACKAGE PREPARED — BUILD CONFORMANCE STILL REQUIRES REPOSITORY TEST EXECUTION**

## Closure achieved by this package

GOV-26 changes the architecture from:

`CanonicalEvent + separate GovernanceEvent`

to:

`CanonicalEvent → semantic payload → GovernanceEvent → authoritative state`

and adds the intended commitment boundary:

`CanonicalEvent → GOV-24 canonical bytes → SHA-256 → commitmentMatches`

The canonical event is rejected unless:

- schema is valid;
- payload identity matches the envelope;
- event type matches payload type;
- predecessor is valid;
- status is `AcceptedEvent`.

The replay API now consumes only `[CanonicalEvent]`.

## Haskell cryptographic binding

`GovernanceCommitment.hs` binds the frozen algorithm to
`cryptohash-sha256` (`Crypto.Hash.SHA256`) and lowercase hexadecimal output.

The package intentionally does not claim the repository build has passed:
the project's Cabal dependency graph and compiler test must confirm the backend
is available and the module compiles.

## Important remaining boundary

Commitment integrity is not authorization.

A valid SHA-256 commitment proves that the committed bytes match the event
being checked. It does not prove that the actor was authorized, the evidence
is valid, or the referenced ruleset permits the transition.

Those checks remain the next governance closure layer.
