# IMMORTAL Governance Implementation Contract — Phase 2

**Source of truth:** GOV-01 → GOV-18, with final closure recorded by GOV-18.
**Status:** implementation-facing contract; not a conformance certificate.

## Frozen canonical parameters

| Parameter | Canonical rule |
|---|---|
| Representation | Eligible ledger entities at snapshot |
| Voting weight | `V(P) = P` |
| Delegation | Direct, non-recursive, weight-conserving, snapshot-bound |
| Quorum | `Q/E >= 1/4`, where `Q = Y + N + A` |
| Ordinary approval | `Y/(Y+N) > 1/2` |
| Kernel approval | `Y/(Y+N) >= 2/3` |
| Abstention | Counts toward quorum; excluded from approval denominator |
| Snapshot | Voting start |
| Community review | 7 days |
| Voting window | 5 days |
| Finalization/challenge | 3 days |
| Material amendment | New lifecycle |
| Emergency | Maximum 72-hour active period unless separately renewed |
| Canonical history | Ordered immutable replayable events with ruleset version |

## Required implementation properties

1. Eligibility and weight are frozen by the voting-start snapshot.
2. PRE is counted linearly; splitting/aggregation must preserve total weight.
3. Delegation cannot recurse or multiply weight.
4. A delegated weight cannot also be counted directly.
5. Quorum and approval are deterministic integer/rational predicates.
6. Abstention affects quorum but never the `Y+N` approval denominator.
7. Voting cannot remain valid after the canonical voting close.
8. Challenge/finalization must be deterministic and finite.
9. Emergency authority expires automatically at its declared limit unless a valid renewal exists.
10. Material proposal changes cannot mutate an active vote.
11. Canonical events are immutable, ordered and replayable.
12. Invalid events must not mutate canonical state.
13. Governance approval cannot substitute for evidence, conformance or canonicalization.
14. The Cardano adapter maps these semantics; it does not redefine them.

## Canonical event schema

Abstract event:

`Event = {event_id, proposal_id, ruleset_version, event_type, actor_class, timestamp, payload_commitment, predecessor, evidence_refs, status}`

Canonical event types:

`PROPOSAL_CREATED`
`PROPOSAL_CLASSIFIED`
`IMPACT_REVIEW_COMPLETED`
`EVIDENCE_RECORDED`
`COMMUNITY_REVIEW_OPENED`
`VOTING_OPENED`
`VOTE_CAST`
`VOTING_CLOSED`
`CHALLENGE_OPENED`
`CHALLENGE_RESOLVED`
`DECISION_FINALIZED`
`ADOPTION_RECORDED`
`CONFORMANCE_RECORDED`
`CANONICALIZED`
`REJECTED`
`RETURNED_FOR_REVISION`
`CANCELLED`
`EMERGENCY_ACTIVATED`
`EMERGENCY_RENEWED`
`EMERGENCY_EXPIRED`

Event validity:

`ValidEvent = SchemaValid ∧ AuthorizedTransition ∧ RulesetValid ∧ EvidenceValid ∧ PredecessorValid`

Canonical state:

`G_n = Replay(G_0, e_1, ..., e_n, Ruleset_v)`

## Conformance gate

The implementation cannot claim governance conformance until it supplies evidence for the
corresponding GOV-C requirements, including deterministic snapshot, delegation
conservation/non-recursion, 25% quorum, ordinary and kernel thresholds, temporal
windows, challenge/finality, emergency expiry, canonical replay and invalid-event
rejection.

No economic-kernel semantics are changed by this contract.
