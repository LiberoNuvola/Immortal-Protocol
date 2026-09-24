# GOV-28 — GOV-18 Lifecycle Compatibility Mapping Gate

## Purpose
Operational/conformance handoff for reconciling the closed GOV-18 canonical event algebra with the current green-branch `ProposalStatus` implementation. This file is not normative and introduces no governance parameter.

## Sources triangulated
- GOV-01 — Governance State Machine & Proposal Lifecycle v0.1
- GOV-18 — Canonical Event Schema + Final Governance Specification Closure v0.1
- GOV-21-FINALITY-SPEC.md
- GOV-22-SPEC.md
- IMMORTAL/governance/Governance.hs
- IMMORTAL/governance/GovernanceFinality.hs
- IMMORTAL/governance/GovernanceCanonicalReplay.hs
- IMMORTAL/governance/GovernanceEventSchema.hs
- GovernancePhase6Test.hs / GovernanceConformanceTest.hs

## Current implementation boundary
The authoritative state transition remains:
`GovernanceState -> GovernanceEvent -> GovernanceState`
through `applyEvent`.

Canonical replay currently validates a `CanonicalEvent`, converts its payload through `canonicalPayloadToGovernanceEvent`, then invokes `applyEvent`.

Finality currently lives in `GovernanceFinality`; its `finalize` helper still maps `DecisionRecorded -> Canonical` directly.

## Minimal compatibility mapping — evidence only

| GOV-18 canonical act | Current implementation witness | Classification |
|---|---|---|
| VOTING_CLOSED | `Voting -> DecisionRecorded`, records `votingClosedAt` | existing implementation state; compatible candidate |
| CHALLENGE_OPENED | `GovernanceFinality.openChallenge` | auxiliary finality witness; not canonical event |
| CHALLENGE_RESOLVED | `GovernanceFinality.resolveChallenge` | auxiliary finality witness; not canonical event |
| DECISION_FINALIZED | **no distinct current state/event** | OPEN implementation gap |
| ADOPTION_RECORDED | `Accepted -> Adopted` | existing state; requires explicit post-finalization compatibility proof |
| CONFORMANCE_RECORDED | **no distinct current state/event**; gate predicates exist | OPEN implementation gap |
| CANONICALIZED | `Adopted -> Canonical` | existing state; must remain distinct from adoption/conformance |

This mapping is descriptive only. It does not assert that the current witnesses are sufficient.

## Required negative twins before authoritative wiring

1. `DecisionRecorded + finality still open -> Accepted` rejects.
2. `DecisionRecorded + upheld/open blocking challenge -> Accepted` rejects.
3. `DecisionRecorded -> Canonical` rejects through the authoritative lifecycle.
4. `Accepted/Adopted` without the required finalization/conformance witness rejects canonicalization.
5. A structurally valid canonical event with valid authorization, commitment and predecessor but illegal lifecycle position rejects without state mutation.
6. Same canonical predecessor + incompatible canonical successor rejects the second successor once the existing canonicalization identity is located.

## Safe implementation sequence

1. Locate every live consumer of `DecisionRecorded`, `Accepted`, `Adopted`, `Canonical`, `finalize`, `finalizationAt`, and `GovernanceFinality`.
2. Identify whether an existing evidence/gate structure already witnesses finalization/conformance. Do not invent fields before this audit.
3. Derive the smallest compatibility mapping from GOV-01 + GOV-18.
4. Update canonical replay and authoritative transition together, preserving deterministic replay.
5. Add negative twins before changing production semantics.
6. Only then consider whether a new explicit event/state constructor is required by the already-closed GOV-18 algebra.

## Non-regression
- Do not weaken challenge validation.
- Do not reinterpret GOV-18.
- Do not add timing, quorum, approval, hash, storage, or serialization parameters.
- Do not use `GovernanceFinality.finalize` as proof of GOV-18 closure.
- Do not claim governance CI green without observed governance workflow evidence.

## Current status
**RED/YELLOW — implementation/conformance reconciliation open.**

The useful finality work is preserved: bounded challenge opening, one-way resolution, expiry, upheld-challenge blocking, empty-ID rejection and expiry-boundary rejection.

External event-sourcing prior art supports the general engineering principle that immutable ordered events can be replayed to reconstruct state and that versioning/conflict handling matters, but it is non-normative for IMMORTAL. AWS documents these patterns explicitly. 

## Handoff
Next agent/session: complete the consumer audit and evidence/gate provenance map. Do not modify the lifecycle until the existing representation has been exhausted.
