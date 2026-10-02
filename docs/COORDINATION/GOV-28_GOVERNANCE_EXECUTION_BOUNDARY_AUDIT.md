# GOV-28 — Governance Consumer / Execution Boundary Audit

Date: 2026-09-24
Branch: work/immortal-green-closure

## Finding

The GOV-18 lifecycle states are currently confined to the standalone governance implementation/test cluster under IMMORTAL/governance/.

The repository root cabal.project currently declares only ./plutus as a Cabal package. Therefore the governance Haskell modules are not part of the active Cabal package boundary.

The workflow directory contains no dedicated governance conformance workflow. The existing algorithmic-governability.yml runs a Node adversarial lab and does not compile/replay the governance Haskell modules.

## Consequence

The lifecycle reconciliation is currently a governance conformance/test-layer gap, not an already-integrated production runtime path.

This means governance evidence must distinguish: (1) standalone Haskell transition/replay tests; (2) canonical governance specification; (3) any future integrated execution boundary.

## State consumer audit

Directly inspected: Governance.hs, GovernanceFinality.hs, GovernanceCanonicalReplay.hs, GovernanceConformance.hs, GovernanceConformanceTest.hs, GovernancePhase6Test.hs, GovernanceIndependentReplay.py, GovernanceEventSchema.hs, GovernanceAuthorization.hs.

Relevant lifecycle behavior is concentrated in Governance.hs (ProposalStatus, transition, statusChangeAllowed, recordTime), GovernanceFinality.hs (challenge lifecycle and the unsafe DecisionRecorded → Canonical helper), the governance tests, and canonical replay.

## No silent implementation change made

Because GOV-18 explicitly separates decision finalization, adoption, conformance and canonicalization, this audit does not justify adding a guessed status/event mapping.

The next safe implementation step remains: define the authoritative canonical-event lifecycle representation from the already-closed GOV-18/GOV-01 semantics; wire negative tests first; then integrate that path into the standalone governance test surface; separately decide whether/when governance should enter an executable package/CI boundary.

## Evidence classification

Current governance tests are implementation/conformance evidence, not production integration evidence.

External event-sourcing references support treating immutable event history and replay as the source-of-truth architecture and using version/conflict checks for competing successors; they do not determine IMMORTAL normative lifecycle.