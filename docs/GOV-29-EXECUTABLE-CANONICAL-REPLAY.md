# GOV-29 — Executable Canonical Replay & Commitment Binding

GOV-29 closes the implementation boundary left open by GOV-28.

The semantic payload is now carried by `CanonicalEvent`. Canonical replay converts
that payload internally to the existing governance transition and applies it.
The replay API therefore consumes only `GovernanceState + [CanonicalEvent]`.

The event schema binds payload identity, event type and timestamp, while the
existing authorization, evidence and ruleset gates remain mandatory.

The cryptographic boundary is explicit: the canonical event representation is
encoded as UTF-8 before SHA-256.

## Verification boundary

The package contains an executable Haskell test and a language-neutral reference
script. A repository Cabal build must still be run before claiming compiled
repository conformance.
