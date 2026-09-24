# GOV-28 — Lifecycle Consumer Scan

## Scope

Consumer scan performed on `work/immortal-green-closure` for the authoritative governance state symbols and finality helper:

- `DecisionRecorded`
- `Accepted`
- `Adopted`
- `Canonical`
- `finalizationAt`
- `GovernanceFinality.finalize`

## Result

The green governance cluster is effectively self-contained.

### Governance.hs

These states are consumed by the local transition predicate and `applyEvent`:

`DecisionRecorded → Accepted → Adopted → Canonical`.

The current acceptance path is:

- `DecisionRecorded → Accepted`: quorum + approval + proposal-class gates.
- `Accepted → Adopted`: status-only.
- `Adopted → Canonical`: status-only.

No independent finality/challenge witness is consulted by `Accepted`.

### GovernanceFinality.hs

`finalize` consumes `Proposal + [Challenge] + Timestamp` and, after challenge validation + expiry, directly returns:

`DecisionRecorded → Canonical`.

This is the strongest local evidence that the helper cannot become the authoritative GOV-18 transition: it bypasses the required intermediate semantic acts.

### GovernanceCanonicalReplay.hs

Canonical replay delegates the payload to the legacy `GovernanceEvent` algebra and then to `applyEvent`. Consequently all lifecycle states remain governed by the legacy generic transition path.

### GovernanceConformance.hs

The conformance checklist validates canonical envelope properties, authorization, evidence and ruleset/commitment binding. Its lifecycle predicate is exported separately and is not incorporated into `conformanceChecklist`.

### Tests

`GovernancePhase6Test.hs` and `GovernanceConformanceTest.hs` exercise the same cluster. They establish temporal review/voting boundaries and challenge mechanics, but the finality test still treats `finalize` producing `Canonical` as valid auxiliary behavior.

## Compatibility conclusion

The consumer scan found no external consumer that forces preservation of `DecisionRecorded → Accepted → Adopted → Canonical` as the canonical event semantics.

That materially reduces the migration constraint.

However, it does **not** justify deleting the states or inventing replacements. GOV-01 gives them established meanings:

- ACCEPTED = governance decision passed, not canonical adoption.
- ADOPTED = post-vote adoption requirements satisfied.
- CANONICAL = durable canonical record/version.

Therefore the smallest safe direction is to preserve these states as implementation/projection states while introducing the missing canonical event semantics at the replay boundary, with explicit witnesses for finalization and conformance.

## No-change conclusion

No consumer evidence was found requiring a new governance parameter, a new timeout, or a reinterpretation of GOV-01/GOV-18.

No code semantics were changed in this pass.

## External architectural cross-check

Generic event-sourcing guidance likewise treats immutable ordered events as the source from which state is reconstructed by replay, while warning that event-version evolution requires an explicit compatibility strategy. This is corroboration only; IMMORTAL's normative semantics remain GOV-01/GOV-18. citeturn0search0

## Next minimum delta

Before modifying `GovernanceEventSchema`:

1. add negative tests around the existing authoritative path where they can be expressed without inventing state;
2. define the smallest internal witness needed for finalization/challenge and conformance;
3. change canonical replay so lifecycle admission is evaluated against current `GovernanceState`;
4. only then expand the canonical event algebra to the GOV-18 vocabulary.

No normative decision reopened.
