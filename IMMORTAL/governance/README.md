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

## 2026-11-04 — canonical lifecycle replay evidence refresh

The standalone Governance package and Plutus-side replay suite now exercise the dedicated GOV-18 lifecycle handlers. The current implementation path is:

`CanonicalEvent -> canonicalGovernanceEventValid -> canonicalLifecycleAdmission -> dedicated lifecycle handler / legacy-compatible payload handler`.

The public replay entry point is `replayCanonical :: RulesetRegistry -> GovernanceState -> [CanonicalEvent] -> Either String GovernanceState`. Four distinct lifecycle payloads are handled directly in `GovernanceCanonicalReplay.hs`:

- `EDecisionFinalized / PayloadDecisionFinalized`: validates the decision witness and finality prerequisites; records finalization and projects to `Accepted`, not `Canonical`.
- `EAdoptionRecorded / PayloadAdoptionRecorded`: requires the prior finalized `Accepted` projection and a non-regressing timestamp; advances to `Adopted`.
- `EConformanceRecorded / PayloadConformanceRecorded`: requires `Adopted` and a valid, non-failing conformance witness.
- `ECanonicalized / PayloadCanonicalized`: requires valid canonicalization evidence and mandatory gates, checks the required conformance predecessor by proposal class, and binds the canonicalization record to the prior finalized decision record.

The earlier replay fixture failure was a test-input defect: the test supplied a projected state while omitting the predecessor event from the replay sequence. The test now replays the complete canonical history and retains negative predecessor/lifecycle cases. No replay rule was weakened.

### Executable evidence

- Standalone Governance: [run 41885987731](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987731), **SUCCESS** on `9c5b6276f7ca132c3fcaaf170439747236a39d53`; all five standalone suites passed: `governance-ruleset-tests`, `governance-conformance-tests`, `governance-phase6-tests`, `governance-canonical-replay-tests`, and `governance-canonical-event-tests`.
- Haskell Semantic Conformance: [run 41885987733](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987733), **SUCCESS** on the same SHA; all workflow steps passed, including Governance and Governance canonical replay conformance.
- Kernel Invalid-Class Fail-Closed: [run 41885987774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774), **SUCCESS** on the same SHA; all eight registered regression suites passed, including `governance-canonical-replay-tests`.
- Kernel evidence artifact: [13353226524](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774/artifacts/13353226524), SHA-256 `5cd35d7d93ba18ffacd6f45d2f293811ac9aa728eb15d9bbb130113276085a52`.

This is executable conformance evidence for the implemented lifecycle slice. It is not production evidence authenticity, a live authority certificate, a deployment certificate, or an on-chain governance claim.

### Remaining scope — do not infer full GOV-18 vocabulary closure

The normative Phase-2 implementation contract lists 20 canonical event identities. The current `EventType` algebra exposes ten constructors. The dedicated finalization/adoption/conformance/canonicalization handlers are now present, but several other normative identities still do not have dedicated event constructors (including impact review, evidence recorded, community review opened, voting opened/closed, challenge opened/resolved, and emergency activation/renewal/expiry). Rejected/returned/cancelled outcomes remain representable through the generic status event rather than distinct event identities. Track that broader event-vocabulary work separately; these green suites do not close it.

## 2026-11-04 — exact-HEAD revalidation

The documentation reconciliation commit `ff5cf47ae0c83c8305e6a0e0ddb3626d55232e06` was checked out by all three Governance/Kernel gates; each completed **SUCCESS** on this exact SHA:

- Standalone Governance [41893028158](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028158): all five standalone suites passed, including `governance-canonical-replay-tests` and `governance-canonical-event-tests`.
- Haskell Semantic Conformance [41893028165](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028165): all workflow steps passed; the separately built `governance-canonical-replay-tests` suite passed.
- Kernel Invalid-Class Fail-Closed [41893028203](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028203): regression suite passed, including `governance-canonical-replay-tests`; artifact [13356812140](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028203/artifacts/13356812140), ZIP SHA-256 `c1cbc16b5ad3709548e1377086c3bb57bc306920ec5162f59bdd173b9b2b5bb1`.

Companion runs on the same SHA also passed: Adapter Sale [41893028151](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028151), Portability [41893028146](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028146), Algorithmic Governability [41893028150](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028150), Protocol Declaration [41893028233](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028233), Documentation Link Check [41893028154](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028154), and Flux Point DoD [41893028139](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028139).

The evidence closes the standalone fixture issue and revalidates the four dedicated lifecycle handlers on the exact branch HEAD. It does not close the broader 20-event GOV-18 identity gap described above.
