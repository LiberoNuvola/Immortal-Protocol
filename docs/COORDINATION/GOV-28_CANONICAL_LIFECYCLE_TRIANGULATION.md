# GOV-28 — Canonical Lifecycle Representation Triangulation

## New finding

The repository contains a stronger written implementation contract than the live Haskell state model.

### Normative/implementation contract
`docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md` explicitly defines the GOV-18 event vocabulary, including distinct:
- `DECISION_FINALIZED`
- `ADOPTION_RECORDED`
- `CONFORMANCE_RECORDED`
- `CANONICALIZED`

It also requires ordered immutable replay and invalid-event rejection.

### GOV-28 / GOV-29 status documents
`docs/01-formal-records/governance/GOV-28-FULL-GOVERNANCE-CONFORMANCE.md` states that canonical replay should consume canonical events rather than a hidden parallel semantic event source.

`docs/01-formal-records/governance/GOV-29-EXECUTABLE-CANONICAL-REPLAY.md` claims the replay API consumes only `GovernanceState + [CanonicalEvent]`.

### Live Haskell contradiction
The live `IMMORTAL/governance/Governance.hs` still has:
- only six `GovernanceEvent` constructors;
- no `DecisionFinalized`, `AdoptionRecorded`, `ConformanceRecorded`, or `Canonicalized` event constructors;
- `DecisionRecorded -> Accepted -> Adopted -> Canonical` as the operational lifecycle;
- finality represented separately by `GovernanceFinality`;
- canonical replay conversion through the old semantic `GovernanceEvent` layer.

Therefore GOV-29 is a **declared target/status document, not evidence that the live state transition has reached that target**.

## Important consequence

This resolves the earlier search question: an existing canonical lifecycle representation **does exist in the repository documentation/specification**, but it is not yet represented in the authoritative live Haskell lifecycle.

So the next work is not to invent a lifecycle. It is to reconcile the implementation with the already-defined GOV-18 event algebra.

## Safety boundary

Do not add ad-hoc fields to `GateResult` or reinterpret `finalizationAt`.

Do not silently rename existing statuses into canonical event types.

The implementation delta must preserve the already-closed GOV-18 distinctions:
- decision finalization
- adoption
- conformance
- canonicalization

and must wire them into replay/state admission without introducing new governance parameters.

## External engineering cross-check

Event-sourcing guidance independently supports the architectural requirement that immutable ordered events form the source history and that state be reconstructible by replay; it also highlights explicit versioning/conflict handling as important implementation concerns. This is supporting engineering evidence only, not IMMORTAL normative authority. citeturn0search0

## 2026-11-04 — implementation status supersession

The "live Haskell contradiction" above is now partly resolved. Current source no longer has only six canonical event types: it includes explicit event/payload identities and dedicated replay handlers for `DECISION_FINALIZED`, `ADOPTION_RECORDED`, `CONFORMANCE_RECORDED`, and `CANONICALIZED`. These events are applied through `GovernanceCanonicalReplay.applyCanonicalEvent`; the public replay function consumes `GovernanceState + [CanonicalEvent]`.

The exact four-act replay is covered in `plutus/test/GovernanceCanonicalReplayTest.hs`, including DecisionRecord-reference binding and rejection of missing conformance or unresolved mandatory gates. The fixture defect in `GovernanceCanonicalEventTest.hs` was corrected to provide the complete predecessor history, not to weaken predecessor validation.

Evidence on SHA `9c5b6276f7ca132c3fcaaf170439747236a39d53`:
- Governance standalone [41885987731](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987731): SUCCESS (5/5 suites);
- Haskell Semantic Conformance [41885987733](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987733): SUCCESS;
- Kernel Invalid-Class Audit [41885987774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774): SUCCESS.

The earlier finding remains valid only as a historical snapshot. The broader GOV-18 vocabulary still exceeds the current `EventType` enum: the normative contract defines 20 identities while the implementation currently exposes ten. Generic `EStatusChanged` still represents multiple state acts; challenge-open/resolved and other lifecycle/operational identities do not yet all have dedicated event constructors. Consequently the four-act replay slice is GREEN, but this addendum does not declare the complete grouped GOV-28/GOV-18 event-vocabulary scope closed.
