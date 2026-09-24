# GOV-28 — GOV-18 Lifecycle Mapping Gate

Date: 2026-09-24
Branch: work/immortal-green-closure
Status: OPEN — implementation/conformance reconciliation, no new normative decision

## Triangulation

Authoritative Notion:
- GOV-01 — Governance State Machine & Proposal Lifecycle v0.1
- GOV-18 — Canonical Event Schema + Final Governance Specification Closure v0.1

Live implementation:
- IMMORTAL/governance/Governance.hs
- IMMORTAL/governance/GovernanceCanonicalReplay.hs
- IMMORTAL/governance/GovernanceFinality.hs
- IMMORTAL/governance/GovernanceConformanceTest.hs

## Confirmed semantic boundary

GOV-18 requires the canonical sequence after voting close to distinguish:
VOTING_CLOSED
→ CHALLENGE_OPENED
→ CHALLENGE_RESOLVED
→ DECISION_FINALIZED
→ ADOPTION_RECORDED
→ CONFORMANCE_RECORDED
→ CANONICALIZED

GOV-01 separately defines:
ACCEPTED = governance decision passed, not canonical adoption
ADOPTED = post-vote adoption requirements satisfied
CANONICAL = durable canonical record/version

The current implementation instead exposes:
Voting → DecisionRecorded → Accepted/Rejected → Adopted → Canonical

GovernanceFinality.finalize currently performs:
DecisionRecorded → Canonical

Therefore the current helper cannot be treated as the authoritative GOV-18 finalization path.

## Mapping that is safe to assert now

| GOV-18 event | Existing implementation evidence | Closure status |
|---|---|---|
| VOTING_CLOSED | DecisionRecorded + votingClosedAt | Mappable |
| CHALLENGE_OPENED | GovernanceFinality.openChallenge | Mappable |
| CHALLENGE_RESOLVED | GovernanceFinality.resolveChallenge | Mappable |
| DECISION_FINALIZED | no explicit authoritative state/event | OPEN |
| ADOPTION_RECORDED | Adopted exists, but current path is Accepted → Adopted | Partially mappable |
| CONFORMANCE_RECORDED | GateResult/conformanceGate exists, but no explicit lifecycle event/state | OPEN |
| CANONICALIZED | Canonical exists, but auxiliary finalize reaches it directly | Partially mappable / unsafe |

## Important non-inference

Do NOT infer that:
- DecisionRecorded == DecisionFinalized;
- Accepted == DecisionFinalized;
- Adopted == ConformanceRecorded;
- Canonical == Canonicalized without the missing intermediate predicates/events.

Those equivalences would erase distinctions explicitly required by GOV-18.

## Minimal next implementation gate

Before changing ProposalStatus or adding event constructors, inspect all consumers of:
- DecisionRecorded
- Accepted
- Adopted
- Canonical
- finalizationAt
- proposalGates / conformanceGate

Then derive the smallest mapping that preserves GOV-01 and GOV-18 simultaneously.

Required negative twins after wiring:
1. DecisionRecorded cannot directly produce Canonical.
2. Canonical cannot be reached without Adoption.
3. Adoption cannot be reached without the required post-vote gates.
4. Conformance cannot be silently inferred from Vote/Acceptance.
5. A finalization event cannot bypass the challenge/finality boundary.
6. Canonical replay must reject the same canonical predecessor receiving incompatible successor identities.
7. Two independent replays of the same canonical event sequence must produce identical governance state.

## Architectural constraint

Canonical replay must remain canonical-event-only at its public boundary. The existing payload→GovernanceEvent conversion is an internal compatibility mechanism and must not become a second authoritative event source.

External architecture cross-check: event-sourced systems conventionally treat the immutable event stream as the historical source and derive state by replay; optimistic concurrency/versioning is used to reject conflicting successors. This supports the direction but is not normative for IMMORTAL.

## Decision gate

No new normative decision is requested. GOV-18 and GOV-01 already provide the semantics. If implementation discovers that an exact mapping requires a genuinely new semantic parameter or changes a closed rule, stop and escalate rather than inventing it.
