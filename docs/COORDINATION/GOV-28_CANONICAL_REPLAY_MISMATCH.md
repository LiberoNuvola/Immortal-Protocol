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
