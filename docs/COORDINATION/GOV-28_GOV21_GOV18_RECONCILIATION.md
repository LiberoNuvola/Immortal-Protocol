# GOV-28 — GOV-21 / GOV-18 Reconciliation Finding

Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Exact finding

The repository contains `IMMORTAL/governance/GOV-21-FINALITY-SPEC.md`, whose normative state relation still models:

`DecisionRecorded -> finality expiry -> Canonical`.

Its closure criterion also says finality/canonicalization is closed when that boundary is enforced by the authoritative transition layer.

Current GOV-18 baseline, however, requires distinct canonical governance event types/stages for:

`DECISION_FINALIZED`,
`ADOPTION_RECORDED`,
`CONFORMANCE_RECORDED`,
`CANONICALIZED`.

A repository search on the current `work/immortal-green-closure` branch found no implementation occurrences of those four event names.

## Classification

This is not a reason to invent a new governance rule. It is a **spec/implementation reconciliation gap**.

The existing GOV-21 package must not be treated as sufficient evidence for the current GOV-18 closure criterion until its finality model is reconciled with the current canonical event lifecycle.

The existing `GovernanceFinality.finalize` behavior and `GovernancePhase6Test.hs` assertion are therefore evidence of the older/partial finality model, not proof of current GOV-18 canonicalization closure.

## Safe next step

1. Treat GOV-18 as the current normative baseline.
2. Preserve GOV-21 challenge-window invariants that remain compatible: bounded challenge period, one-way challenge resolution, upheld/open challenge blocks finalization, expiry is deterministic.
3. Reconcile the state/event model before changing authoritative transitions.
4. Add negative tests for direct `DecisionRecorded -> Canonical`, adoption-without-conformance, and conformance-without-adoption.
5. Only then wire canonical events directly into the authoritative transition layer.

No new threshold, timing, economic parameter, or governance policy is introduced by this finding.
