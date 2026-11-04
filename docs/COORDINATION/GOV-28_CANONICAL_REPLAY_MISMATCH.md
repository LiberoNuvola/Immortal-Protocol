# GOV-28 — Canonical Replay Mismatch Proof

## Concrete mismatch now isolated

The live canonical replay path is:

`CanonicalEvent -> CanonicalPayload -> GovernanceEvent -> Governance.applyEvent`

Evidence:
- `GovernanceCanonicalReplay.canonicalPayloadToGovernanceEvent` maps all six payloads directly into the six legacy `GovernanceEvent` constructors.
- `GovernanceEventSchema.EventType` contains only six event types.
- `GovernanceAuthorization.authorizationValid` authorizes only those six event types.
- `Governance.applyEvent` remains the final lifecycle/state mutation authority.

Therefore the current replay implementation cannot consume the already-defined GOV-18 events `DECISION_FINALIZED`, `ADOPTION_RECORDED`, `CONFORMANCE_RECORDED`, or `CANONICALIZED` as canonical events.

## Additional important finding

The current `canonicalGovernanceEventValid` is still envelope-level validation:
schema + predecessor + accepted status + actor authorization + evidence presence + ruleset/commitment.

It does not evaluate the event against the current `GovernanceState`.

Thus even after extending the event vocabulary, replay must not simply add constructors; it needs a state-aware lifecycle admission boundary.

## Safe implementation seam

The existing code gives a clear seam:

`applyCanonicalEvent :: RulesetRegistry -> GovernanceState -> Maybe CanonicalEvent -> CanonicalEvent -> Either String GovernanceState`

This is the natural point to enforce:

1. envelope validity;
2. state-aware lifecycle admissibility;
3. only then state mutation.

The current conversion function should eventually cease being the semantic authority for the canonical lifecycle, because it necessarily collapses GOV-18-distinct events into the old six-event algebra.

## No semantic invention

The four missing event types are already specified by the GOV-18 implementation contract. Their exact state effects must be derived from the existing normative lifecycle and evidence, not guessed.

No timing, quorum, approval, economic, or emergency parameter is changed by this finding.

## 2026-11-04 — superseding implementation and evidence update

The concrete mismatch above is a historical source finding and is **superseded for the four lifecycle payloads it identified as missing**.

Current source inspection at `work/immortal-green-closure` shows:
- `GovernanceEventSchema.EventType` includes `EDecisionFinalized`, `EAdoptionRecorded`, `EConformanceRecorded`, and `ECanonicalized`, with corresponding canonical payload types.
- `GovernanceCanonicalReplay.applyCanonicalEvent` dispatches those payloads to dedicated handlers after envelope/ruleset/authorization validation and lifecycle admission.
- `replayCanonical` accepts the complete `[CanonicalEvent]` history and checks duplicate identifiers, predecessor continuity and the canonicalization-to-finalized-DecisionRecord reference.
- The test now supplies `[e1c, e2c]` to replay rather than combining a projected `st1` with an event whose predecessor is absent from the supplied sequence.

The end-to-end four-act sequence is exercised by `plutus/test/GovernanceCanonicalReplayTest.hs`; negative tests cover reference mismatch, missing conformance, unresolved mandatory gates, failed conformance, premature finalization/adoption and challenge conditions.

Executable evidence on source SHA `9c5b6276f7ca132c3fcaaf170439747236a39d53`:
- standalone Governance [41885987731](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987731): SUCCESS, five of five suites;
- Haskell Semantic Conformance [41885987733](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987733): SUCCESS, including canonical replay;
- Kernel Invalid-Class Fail-Closed [41885987774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774): SUCCESS, including the canonical replay regression suite.

This supersedes the statements above that the four dedicated handlers were absent. It does **not** close the broader 20-event GOV-18 vocabulary: the current event algebra has ten constructors, and several normative lifecycle/operational event identities remain represented through generic status changes or auxiliary helpers. See the updated compatibility matrix. No governance parameters or economic semantics were changed by this evidence refresh.
