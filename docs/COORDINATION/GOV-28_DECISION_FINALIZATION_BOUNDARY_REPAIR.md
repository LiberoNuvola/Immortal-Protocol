# GOV-28 — DecisionRecorded / Finalization Boundary Repair

Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Concrete implementation defect repaired

`Governance.recordTime` previously assigned:

`DecisionRecorded -> finalizationAt = votingClosedAt + finalitySeconds`.

GOV-21 explicitly states that `finalizationAt` is assigned **only by finalization** and that recording a decision does not itself make it finalized/canonical.

The implementation was therefore encoding a future finalization timestamp at the moment of DecisionRecorded.

### Repair

`Governance.hs` now records:

`DecisionRecorded -> finalizationAt = Nothing`.

The existing `GovernanceFinality.finalize` path remains responsible for assigning the actual finalization time.

A Phase 6 test was added to lock this boundary.

Commits:
- `bb1fc0fd2308091ad88f9fe50d23c1d5697a7226` — implementation repair
- `b7e9cd82b1f6a77f48e61fe1e71cd181e46d85db` — regression test

## Status

This is a direct GOV-21 conformance repair with no new timing parameter or governance rule.

It does **not** close the larger GOV-18 issue: the finalization helper still collapses finalization into `Canonical`, and the canonical event algebra still lacks the distinct finalization/adoption/conformance/canonicalization events.
