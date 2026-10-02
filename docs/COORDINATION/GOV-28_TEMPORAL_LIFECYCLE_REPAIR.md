# GOV-28 — Governance temporal lifecycle repair

Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Finding

The authoritative implementation path in `IMMORTAL/governance/Governance.hs` accepted lifecycle timestamps without enforcing the already-declared governance windows:

- CommunityReview = 7 days
- Voting = 5 days
- finality/challenge = 3 days

In particular, `StatusChanged` called `statusChangeAllowed` without passing the event timestamp, so:
- `CommunityReview -> Voting` could occur before 7 days;
- `Voting -> DecisionRecorded` could occur before 5 days.

This was an implementation/conformance gap, not a new normative decision.

## Repair

Commit `f24396c4836db0434a52b01f8fe7ae3076b2cab3`:
- passes the authoritative `StatusChanged` timestamp into lifecycle admissibility;
- rejects negative timestamps;
- requires CommunityReview to have been open for the full 7-day interval before Voting;
- requires Voting to have been open for the full 5-day interval before DecisionRecorded.

Commit `d5c0a3c9e8c0e5570830cab0eba2f6769e06a99a`:
- adds regression tests for both early-transition negatives and the exact 7-day boundary.

## Boundary deliberately left open

No attempt was made to force `DecisionRecorded -> Accepted` to wait a fixed 3 days. GOV-18's finalization/challenge semantics require challenge resolution or expiry, while the current `Governance.hs` proposal state does not carry challenge state. Imposing a blind fixed delay here would risk inventing/duplicating finality semantics already handled by `GovernanceFinality.hs`.

The existing Phase-6 assertion that auxiliary `finalize` yields `Canonical` remains classified as non-authoritative/false-closure evidence relative to GOV-18's distinct finalization/adoption/conformance/canonicalization stages.

## Evidence / external architecture cross-check

Event-sourcing references confirm that ordered immutable events plus replay are normally used to reconstruct state and that conflicting concurrent events require explicit collision/concurrency handling; this supports treating lifecycle timing and successor admissibility as replay-level transition constraints, not UI/documentation hints. This is background prior art only and does not alter IMMORTAL semantics.

## Next open governance target

Continue the GOV-18 reconciliation:
1. authoritative lifecycle event algebra;
2. finalization/challenge/adoption/conformance/canonicalization separation;
3. one-shot/conflicting canonical successor protection;
4. independent canonical replay conformance.

No economic constants or normative governance parameters were changed.
