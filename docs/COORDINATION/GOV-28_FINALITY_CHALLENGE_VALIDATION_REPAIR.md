# GOV-28 — Finality Challenge Validation Repair

Date: 2026-09-24
Branch: work/immortal-green-closure

## Repair

GovernanceFinality.validChallenges previously checked only proposal identity, uniqueness and lower timestamp bound. It did not enforce two requirements already present in GOV-21:
- challenge identifiers must be non-empty;
- challenge opening must occur strictly inside the finite finality window.

Therefore a manually reconstructed/replayed challenge could have an empty ID or be opened at/after the expiry boundary and still pass validChallenges.

## Change

Commit `a7e760a58a17db2d4f3e1a862df522aa79fe38f1` hardens `validChallenges` with both constraints.

Commit `adc6ab48de857511c47e00463b681f0268bbff34` adds regression negatives:
- upheld challenge blocks finalization;
- challenge opened exactly at expiry is invalid;
- empty challenge ID is invalid.

## Classification

This is an implementation/conformance repair against already documented GOV-21/GOV-C-12/GOV-C-13 semantics. No new parameter or normative rule was introduced.

## Verification state

GitHub Actions was observed triggering on the latest commit. At inspection time the latest Adapter Sale Conformance run was `pending` and Algorithmic Governability run was `queued`; no green result is claimed yet.

A local clone/test attempt was unavailable because the execution environment could not resolve github.com. CI remains the execution evidence source.