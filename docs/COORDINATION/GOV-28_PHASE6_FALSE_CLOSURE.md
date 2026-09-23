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
