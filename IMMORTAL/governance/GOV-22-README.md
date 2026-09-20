# GOV-22 — Canonical Event → State Wiring

Baseline:
`7a1a3b0fe9a7775d54009872d0d72468eb1ec578`

This package closes the specific Phase-6 gap in which replay consumed a
`(CanonicalEvent, GovernanceEvent)` pair.

The new model stores the semantic payload inside `CanonicalEvent` and
replays `[CanonicalEvent]`.

Files:

- `GovernanceEventSchema.hs`
- `GovernanceCanonicalReplay.hs`
- `GovernanceCanonicalReplayTest.hs`
- `GOV-22-SPEC.md`

This package is prepared for manual application to `b1-hardening`.
No GitHub commit is claimed by this package.
