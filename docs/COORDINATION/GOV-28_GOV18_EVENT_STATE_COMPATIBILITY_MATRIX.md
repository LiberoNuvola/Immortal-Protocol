# GOV-28 — GOV-18 Canonical Event → State Compatibility Matrix

## Purpose

This handoff triangulates the closed GOV-18 canonical event vocabulary against GOV-01 lifecycle semantics and the current implementation on `work/immortal-green-closure`.

It is an implementation/conformance artifact. It introduces no normative parameter and does not redefine GOV-18.

## Sources checked

- GOV-18 — Canonical Event Schema + Final Governance Specification Closure v0.1.
- GOV-01 — Governance State Machine & Proposal Lifecycle v0.1.
- `IMMORTAL/governance/Governance.hs`.
- `IMMORTAL/governance/GovernanceFinality.hs`.
- `IMMORTAL/governance/GovernanceEventSchema.hs`.
- `IMMORTAL/governance/GovernanceCanonicalReplay.hs`.
- `IMMORTAL/governance/GovernanceAuthorization.hs`.
- `IMMORTAL/governance/GovernanceConformance.hs`.
- `IMMORTAL/governance/GovernancePhase6Test.hs`.
- `IMMORTAL/governance/GovernanceConformanceTest.hs`.

## Triangulation result

### 1. Events that already have a direct implementation analogue

| GOV-18 event | Current analogue | Status |
|---|---|---|
| PROPOSAL_CREATED | `ProposalSubmitted` | representable |
| PROPOSAL_CLASSIFIED | `ProposalClassified` | representable |
| VOTE_CAST | `VoteCast` | representable |
| REJECTED | `StatusChanged ... Rejected ...` | representable only through generic status event |
| RETURNED_FOR_REVISION | `StatusChanged ... ReturnedForRevision ...` | representable only through generic status event |
| CANCELLED | `StatusChanged ... Cancelled ...` | representable only through generic status event |

The last three are not distinct canonical event identities today; they are encoded through `EStatusChanged`.

### 2. Events whose semantic effect exists only as an implementation state transition

| GOV-18 event | Current implementation | Gap |
|---|---|---|
| IMPACT_REVIEW_COMPLETED | `Classified → ImpactReview` | no distinct event identity |
| EVIDENCE_RECORDED | `GatesSet` / EvidenceReview state | no canonical evidence-record event identity |
| COMMUNITY_REVIEW_OPENED | `StatusChanged ... CommunityReview ...` | no distinct event identity |
| VOTING_OPENED | `StatusChanged ... Voting ...` | no distinct event identity |
| VOTING_CLOSED | `StatusChanged ... DecisionRecorded ...` and `votingClosedAt` | current state conflates closure with decision recording |
| CHALLENGE_OPENED | `GovernanceFinality.openChallenge` | auxiliary, not part of GovernanceState/canonical replay |
| CHALLENGE_RESOLVED | `GovernanceFinality.resolveChallenge` | auxiliary, not part of GovernanceState/canonical replay |

These are implementation/conformance gaps, not missing design decisions.

### 3. Events that cannot currently be represented without collapsing GOV-18 distinctions

| GOV-18 event | Required semantic boundary from closed sources | Current state | Classification |
|---|---|---|---|
| DECISION_FINALIZED | Finality occurs only after successful challenge resolution or challenge expiry; it is distinct from governance approval | `DecisionRecorded` → `Accepted`; no canonical finalization event/witness | missing canonical representation + enforcement |
| ADOPTION_RECORDED | Adoption is post-decision and distinct from canonicalization; GOV-01 says mandatory post-vote adoption requirements must be satisfied | `Accepted → Adopted` | state exists, canonical event identity absent; finalization dependency not enforced |
| CONFORMANCE_RECORDED | Conformance is distinct from governance approval and canonicalization; implementation must satisfy applicable conformance gates | no distinct ProposalStatus or event | missing representation |
| CANONICALIZED | Durable canonical record/version is distinct from adoption and conformance | `Adopted → Canonical` | state exists, canonical event identity and conformance witness absent |

## Exact closed-source constraints

GOV-18 states:

- finalization/challenge window is 3 days;
- GOV-C-13 requires finalization after successful challenge resolution or challenge expiry;
- governance approval cannot substitute for evidence/conformance;
- conformance is distinct from governance approval;
- canonicalization is distinct from implementation merge;
- invalid events must not mutate canonical state;
- canonical state is reconstructed by replay of canonical events and ruleset version.

GOV-01 states:

- ACCEPTED means the governance decision passed and is not canonical adoption;
- ADOPTED means all mandatory post-vote adoption requirements are satisfied, including repository protections, evidence/proof-register updates, conformance updates and versioning requirements where applicable;
- CANONICAL means the adopted change has entered the durable canonical record and has an effective version/status;
- governance decision, conformance and canonicalization are separate predicates.

## Critical implementation findings

1. `Governance.hs` still uses:
   `Voting → DecisionRecorded → Accepted → Adopted → Canonical`.
2. `GovernanceFinality.finalize` directly produces `Canonical` from `DecisionRecorded`. This is auxiliary conformance code and cannot be the authoritative GOV-18 canonical path.
3. `GovernanceEventSchema.EventType` has only six constructors:
   `EProposalSubmitted`, `EProposalClassified`, `EStatusChanged`, `EVoteCast`, `EDelegationSet`, `EGatesSet`.
4. `GovernanceCanonicalReplay` converts canonical payloads into legacy `GovernanceEvent` and then calls `applyEvent`. Therefore a generic `StatusChanged` remains the semantic authority and collapses distinct GOV-18 acts.
5. `GovernanceConformance.conformanceChecklist` validates envelope/authorization/evidence/ruleset/commitment but does not apply lifecycle admissibility against current `GovernanceState`.
6. Existing tests prove temporal review/voting windows and challenge mechanics, but do not prove the full GOV-18 finalization → adoption → conformance → canonicalization sequence.

## Safe mapping boundary

The evidence supports this minimal ordering constraint without inventing new semantics:

`VOTING_CLOSED → CHALLENGE_OPENED / CHALLENGE_RESOLVED-or-EXPIRY → DECISION_FINALIZED → ADOPTION_RECORDED → CONFORMANCE_RECORDED → CANONICALIZED`.

The precise state representation for the four missing semantic acts must be derived from the existing closed specifications and consumers before changing the authoritative Haskell types.

Do not solve the gap by making `StatusChanged` more permissive, or by making `GovernanceFinality.finalize` authoritative.

## Required negative twins before authoritative replay change

1. Accepted before finality completion → reject; state unchanged.
2. Accepted with an upheld/open blocking challenge → reject; state unchanged.
3. Adoption before decision finalization → reject.
4. Canonicalization without adoption → reject.
5. Canonicalization without the required conformance witness → reject.
6. Generic structurally valid `StatusChanged` that bypasses a required GOV-18 act identity → reject.
7. Same canonical predecessor with incompatible canonical successor → reject.
8. Invalid canonical event → replay state unchanged.

## Next minimum delta

Inspect every consumer of `DecisionRecorded`, `Accepted`, `Adopted`, `Canonical`, `finalizationAt`, and `GovernanceFinality.finalize`. Derive the smallest compatibility-preserving representation from those consumers and the closed GOV-01/GOV-18 semantics. Only then modify the canonical event algebra and authoritative replay together.

No new economic or governance parameter is introduced by this handoff.
