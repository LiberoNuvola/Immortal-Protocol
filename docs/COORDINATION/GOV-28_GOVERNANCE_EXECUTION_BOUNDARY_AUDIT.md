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

## 2026-11-04 correction — active Cabal integration and standalone package

The earlier statement above that Governance modules were outside the active Cabal package boundary was incomplete and is superseded by this source-level clarification:

- plutus/pre-rich-plutus.cabal already includes ../IMMORTAL/governance in the library hs-source-dirs, exposes the canonical Governance modules and includes the Haskell crypto/text dependencies.
- That Cabal file already declares governance-tests, governance-canonical-replay-tests, governance-ruleset-tests and governance-phase6-tests.
- .github/workflows/immortal-haskell-conformance.yml already invokes those four suites as part of the larger Plutus/Cardano semantic conformance workflow.

Therefore Governance was not absent from compilation or CI. The actual limitation was that it had no independent package/CI target: its existing suites were coupled to the pre-rich-plutus library, the wider package resolver and the Plutus native dependency bootstrap.

A separate package has now been added at IMMORTAL/governance/immortal-governance.cabal with its own cabal.project, pinned to the repository's GHC 9.6.7 toolchain. It compiles the Governance library using only base, bytestring, base16-bytestring, cryptohash-sha256 and text, and runs five focused suites:

- GovernanceConformanceTest.hs
- GovernanceCanonicalEventTest.hs (its existing let layout was corrected; no assertion or protocol semantics changed)
- GovernanceCanonicalReplayTest.hs
- RulesetRegistryTest.hs
- GovernancePhase6Test.hs

The new .github/workflows/immortal-governance-standalone-conformance.yml runs cabal build all --enable-tests and cabal test all --test-show-details=direct from the standalone Governance directory, without installing Plutus native dependencies.

Scope: this separates build and test execution only. It does not change Governance semantics, actor authentication, GOV-02 permissions, GOV-25–30 authority choices, finality/adoption policy, any economic rule, Cardano V3/Reveal behavior, deployment or ledger state. The new exact-head workflow run is required before treating this standalone target as CI-green.
