# GOV-28 — Phase 6 False-Closure Test Handoff

Date: 2026-09-23
Branch: `work/immortal-green-closure`

## New finding

`IMMORTAL/governance/GovernancePhase6Test.hs` explicitly asserts:

`finalize p [rejectedChallenge] expiry == Proposal{proposalStatus = Canonical}`.

This test therefore certifies the very semantic collapse identified in the previous pass:

`DecisionRecorded -> Canonical`.

It does **not** test the GOV-18 lifecycle:

`DECISION_FINALIZED -> ADOPTION_RECORDED -> CONFORMANCE_RECORDED -> CANONICALIZED`.

## Consequence

The Phase 6 test is a useful challenge-expiry test, but its assertion named `finalize produces Canonical` is a false closure for GOV-18. It proves only the auxiliary `GovernanceFinality` helper's current behavior.

Likewise, `GovernanceCanonicalReplayTest.hs` proves deterministic replay of the wrapper, not equivalence between canonical replay and an independent authoritative live transition.

## Required correction

Do not weaken or delete the existing tests merely to turn them green.

Instead, classify them explicitly:

- challenge open/resolve/expiry: valid auxiliary conformance evidence;
- `finalize -> Canonical`: evidence of the current implementation model, NOT GOV-18 closure;
- canonical replay determinism: partial evidence;
- authoritative canonical-event transition equivalence: OPEN;
- finalization/adoption/conformance/canonicalization separation: OPEN.

## Minimum next tests

1. A challenge-window-expired decision cannot directly become canonical unless the required adoption and conformance witnesses exist.
2. Adoption alone cannot produce canonical state.
3. Conformance alone cannot replace governance approval.
4. Canonical replay and authoritative application of the same semantic event sequence must yield identical governance state.

No new economic or governance parameter is introduced by this finding.

## 2026-11-04 — updated distinction after canonical handler implementation

The 2026-09-23 observation above is historical. The previous `finalize -> Canonical` behavior is no longer the current helper behavior: `GovernanceFinality.finalize` now returns an `Accepted` proposal with `finalizationAt`. It does not itself set `Canonical`.

The current canonical path separates:
- `DECISION_FINALIZED`: finalization witness and challenge/finality prerequisites; projection to `Accepted`;
- `ADOPTION_RECORDED`: requires finalization; projection to `Adopted`;
- `CONFORMANCE_RECORDED`: requires `Adopted` and a valid non-failing witness;
- `CANONICALIZED`: requires applicable gates, any required conformance predecessor and the matching finalized DecisionRecord reference; projection to `Canonical`.

The complete four-event sequence is now exercised through `replayCanonical`, with negative cases. Exact executable evidence on SHA `9c5b6276f7ca132c3fcaaf170439747236a39d53` is green in standalone Governance [41885987731](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987731), Haskell Semantic Conformance [41885987733](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987733), and Kernel Invalid-Class Fail-Closed [41885987774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774).

The remaining gap is not the absence of those four handlers. It is the wider GOV-18 event vocabulary: the normative contract lists 20 event identities and the current `EventType` has ten constructors. Several lifecycle and emergency operations still lack dedicated event identity. Therefore this false-closure note is superseded for the four-event replay/finality slice, but the broader GOV-28 event-vocabulary scope is not declared closed.
