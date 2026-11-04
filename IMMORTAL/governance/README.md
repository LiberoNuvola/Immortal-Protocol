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


## Standalone Governance package — 2026-11-04

The Governance core now has an independent Cabal project in this directory. It compiles the Governance modules using only the package's own Haskell dependencies; it does not load the Plutus/Cardano package or its native build dependencies.

Run locally:

~~~~sh
cd IMMORTAL/governance
cabal update
cabal build all --enable-tests
cabal test all --test-show-details=direct
~~~~

The standalone target includes the governance conformance, canonical-event, canonical-replay, ruleset-registry and Phase-6 suites. It runs alongside the existing pre-rich-plutus Governance suites; it does not replace them.

This target proves only compilation and bounded Haskell conformance of the current Governance source/tests. It does not authenticate production actors or credentials, establish a live governance authority, prove production evidence authenticity, or certify deployment/on-chain governance.

Workflow: .github/workflows/immortal-governance-standalone-conformance.yml.
