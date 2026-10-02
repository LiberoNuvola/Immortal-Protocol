# GOV-28 — GOV-18 lifecycle reconciliation: exact implementation gap

Date: 2026-09-24
Branch: `work/immortal-green-closure`

## Triangulation

The current normative GOV-18 page was fetched directly from Notion and compared with the live green-branch implementation.

GOV-18 explicitly defines canonical event types:

`VOTING_CLOSED`
→ `CHALLENGE_OPENED`
→ `CHALLENGE_RESOLVED`
→ `DECISION_FINALIZED`
→ `ADOPTION_RECORDED`
→ `CONFORMANCE_RECORDED`
→ `CANONICALIZED`

It also explicitly requires:
- conformance distinct from governance approval;
- canonicalization distinct from implementation merge;
- finalization after successful challenge resolution or challenge expiry;
- canonical state replay from canonical events;
- invalid events must not mutate canonical state.

GOV-01 remains the earlier structural state-machine description:

`VOTING → ACCEPTED/REJECTED → ADOPTED → CANONICAL`

and defines ACCEPTED as the governance decision passing, ADOPTED as satisfying post-vote requirements, and CANONICAL as entering the durable canonical record.

## Live implementation

`Governance.hs` currently models:

`Voting → DecisionRecorded → Accepted → Adopted → Canonical`

`GovernanceFinality.finalize` currently performs:

`DecisionRecorded → Canonical`

after challenge expiry/rejection.

The implementation therefore lacks explicit authoritative state/event representation for:
- DecisionFinalized;
- AdoptionRecorded as a distinct canonical event;
- ConformanceRecorded;
- Canonicalized.

There is no current branch occurrence of the four GOV-18 canonical event names in the governance implementation.

## Classification

This is an **implementation/conformance reconciliation gap**, not an unresolved normative decision.

Do NOT:
- invent a new governance parameter;
- reinterpret the 3-day window;
- simply rename existing constructors without tracing replay/schema semantics;
- make `GovernanceFinality.finalize` jump to a later state merely to satisfy a test.

The correct next step is to derive the minimal compatible state/event mapping from GOV-18 + GOV-01 + existing GOV-22 canonical replay architecture, then update conformance tests and replay together.

## Existing false-closure evidence

`GovernancePhase6Test.hs` still contains the assertion that auxiliary `finalize` produces `Canonical`. That assertion documents current auxiliary behavior, but it is not evidence of GOV-18 closure and must be replaced once the authoritative mapping is implemented.

## External architecture cross-check

Event-sourcing references independently support the relevant architectural boundary: immutable ordered events are the historical source, state is reconstructed by replay, and conflicting writes/successors require explicit concurrency/conflict handling. This supports treating the GOV-18 event sequence and predecessor constraints as replay-level semantics rather than as documentation labels. citeturn0search0turn0search1

## Next implementation target

Map the normative GOV-18 event sequence onto the existing canonical replay boundary without introducing a second authoritative event model. Then:
1. add lifecycle-negative twins for skipped Finalization/Adoption/Conformance;
2. make auxiliary finality produce only the appropriate finalization-stage result;
3. enforce that Canonicalized requires the preceding adoption/conformance stages;
4. add deterministic replay tests over the full canonical sequence;
5. preserve the already-fixed 7d/5d timing repair.

No economic constants or normative governance decisions changed.
