# Governance Core — Implementation Status

Baseline: `b7a182c8a7b1c7cb39e7d8c7a86e2092894106a2`

This patch converges the governance implementation actually present in the
repository with the current GOV-18 core rules before introducing the
canonical-event/finality layers.

## Changes

- Uses the explicit `Snapshot` type everywhere.
- Makes snapshot validity explicit.
- Makes abstention semantics explicit.
- Adds effective delegated voting weight.
- Rejects self-delegation, recursive delegation and cycles.
- Rejects direct voting by a delegator.
- Rejects ineligible voters.
- Makes delegation time-bound to the voting window.
- Makes gate mutation lifecycle-bound.
- Updates the repository governance test to the current API.
- Adds adversarial checks for the corrected core behavior.

## Deliberately not included

Canonical event schema, cryptographic commitment, challenge/finality state,
ruleset immutability and independent replay remain separate next layers.

This is a convergence patch, not a conformance certificate.

## Algorithmic governability

- `ALGORITHMIC-GOVERNABILITY-GAP.md` — AG-01 cross-cutting conformance boundary: the algorithm may adapt within an authorized rule space but cannot self-authorize or rewrite constitutional authority.
