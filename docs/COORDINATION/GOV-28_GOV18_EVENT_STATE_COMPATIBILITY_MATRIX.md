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

## 2026-11-04 — current source and evidence delta (supersedes the earlier live-source tables)

The earlier tables accurately describe the source snapshot inspected when this matrix was authored. The four dedicated lifecycle acts are now represented and exercised as follows:

| GOV-18 act | Current canonical event/payload | Replay handler and tested effect |
|---|---|---|
| `DECISION_FINALIZED` | `EDecisionFinalized / PayloadDecisionFinalized` | Validates `DecisionRecord` and finality prerequisites; records `finalizationAt`, projects to `Accepted` |
| `ADOPTION_RECORDED` | `EAdoptionRecorded / PayloadAdoptionRecorded` | Requires finalized `Accepted`; projects to `Adopted` |
| `CONFORMANCE_RECORDED` | `EConformanceRecorded / PayloadConformanceRecorded` | Requires `Adopted` and valid non-failing `ConformanceRecord`; records the event in replay history |
| `CANONICALIZED` | `ECanonicalized / PayloadCanonicalized` | Requires valid canonicalization witness/mandatory gates, applicable conformance predecessor and matching finalized DecisionRecord reference; projects to `Canonical` |

The end-to-end replay sequence is tested through `replayCanonical`, not only by calling the handlers independently. Negative cases include a mismatched DecisionRecord reference, absent conformance predecessor, unresolved mandatory gate, failed conformance, premature finalization/adoption, invalid challenge set, and timestamp regression.

Exact evidence on `9c5b6276f7ca132c3fcaaf170439747236a39d53`:
- Standalone Governance [41885987731](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987731), SUCCESS — five suites;
- Haskell Semantic Conformance [41885987733](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987733), SUCCESS — canonical replay step included;
- Kernel Invalid-Class Audit [41885987774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774), SUCCESS — eight regression suites; artifact [13353226524](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774/artifacts/13353226524), ZIP SHA-256 `5cd35d7d93ba18ffacd6f45d2f293811ac9aa728eb15d9bbb130113276085a52`.

### Remaining event-identity gap

Do not treat the four implemented acts as proof that the entire GOV-18 event vocabulary is implemented. The Phase-2 contract lists 20 event identities; the current `GovernanceEventSchema.EventType` has ten constructors. The following normative identities still lack dedicated event constructors: `IMPACT_REVIEW_COMPLETED`, `EVIDENCE_RECORDED`, `COMMUNITY_REVIEW_OPENED`, `VOTING_OPENED`, `VOTING_CLOSED`, `CHALLENGE_OPENED`, `CHALLENGE_RESOLVED`, `REJECTED`, `RETURNED_FOR_REVISION`, `CANCELLED`, `EMERGENCY_ACTIVATED`, `EMERGENCY_RENEWED`, and `EMERGENCY_EXPIRED`. Some outcomes are represented by `EStatusChanged`; challenge operations remain helper/witness paths. That representation boundary requires a separate specification/consumer review, not inferred closure from the four-act tests.

No economic or governance parameters have been introduced by this update. The four-act replay conformance slice is GREEN; the broader event-vocabulary milestone remains OPEN.

## 2026-11-04 — exact HEAD verification

The four-act replay status above was revalidated on the branch/PR exact HEAD `ff5cf47ae0c83c8305e6a0e0ddb3626d55232e06`:

- Standalone Governance [41893028158](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028158): SUCCESS (five suites).
- Haskell Semantic Conformance [41893028165](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028165): SUCCESS (canonical replay conformance included).
- Kernel Invalid-Class Fail-Closed [41893028203](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028203): SUCCESS (canonical replay regression included), artifact [13356812140](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41893028203/artifacts/13356812140), SHA-256 `c1cbc16b5ad3709548e1377086c3bb57bc306920ec5162f59bdd173b9b2b5bb1`.

This supersedes the need to rely on source-equivalence from the earlier `9c5b627` test SHA for the current branch tip. It does not change the remaining event-identity gap listed above.

## 2026-11-04 — legacy vocabulary source clarification

The 20 normative GOV-18 event names are already present in `IMMORTAL/governance/CanonicalEvent.hs`, whose `EventType` has the complete 20-constructor list and a simple ordered-transition validator. That module explicitly marks itself **LEGACY / PARALLEL GOVERNANCE MODEL** and says it is not the authoritative semantic source for GOV-22 replay.

Consequently, “13 missing identities” means **13 normative identities do not yet have dedicated constructors/payloads in the authoritative `GovernanceEventSchema.EventType` algebra**; it does not mean the names/design are absent from the repository. The source-of-truth migration target remains `GovernanceEventSchema.hs` + `GovernanceCanonicalReplay.hs`. Preserve one public replay API and one semantic stream.

The legacy module may be used as a migration inventory/reference for:
- identity spelling and its proposed ordering constraints;
- the prior lifecycle sequence, including challenges and emergency operations;
- identification of cases currently collapsed into `EStatusChanged`.

It must **not** be imported as a second transition system or copied wholesale: its envelope, actor vocabulary, opaque payload commitment and simplified predecessor validator are not equivalent to the current typed GOV-22 contract. Each event needs a typed payload or an explicit normative reason to remain envelope-only, plus compatibility review against the closed actor/evidence/ruleset semantics and every live consumer.

This refines the earlier gap label: **legacy vocabulary exists; authoritative-schema migration and conformance remain OPEN**. No lifecycle or authorization semantics are inferred by this clarification.


## 2026-11-04 — full 20-event mapping and replay-integrity audit

See [GOV-28 Event Vocabulary Migration Audit](GOV-28_EVENT_VOCABULARY_MIGRATION_AUDIT.md) for the event-by-event comparison of the Phase-2 20-event contract against the authoritative GOV-22 schema/replay and the legacy inventory.

Two additional high-priority defects were confirmed on source SHA `b49d0c7dea33a4adb251604e8eae4e958d789552`:

1. **GOV28-EV-01 — ProposalSubmitted commitment gap.** `PayloadProposalSubmitted Proposal` serializes only proposal id/class, snapshot id/time/weights and creation time, but replay inserts the full Proposal record. Mutable status, lifecycle timestamps, votes, delegations and gates are not bound by the payload commitment or constrained by an initial-state predicate.
2. **GOV28-EV-02 — Rejected finality bypass.** Generic `EStatusChanged -> Rejected` is not blocked by `canonicalLifecycleAdmission`; the underlying `DecisionRecorded -> Rejected` transition does not enforce the dedicated DecisionRecord/finality/challenge checks.

The audit also confirms that challenge open/resolve are helper-returned values rather than canonical history events; emergency activation/renewal/expiry are not represented in the active replay, and `EmergencyAuthority` remains reserved under GOV-27. EDelegationSet/EGatesSet exist as active-only extras outside the normative 20-name inventory.

These are source findings, not implemented fixes. The single authoritative GOV-22 event stream must be retained; GOV-28 remains OPEN.


## 2026-11-05 — replay-integrity remediation source status

Commit [98da1f892fd40b0d9a1b73745622e41c16f1d8e7](https://github.com/LiberoNuvola/Immortal-Protocol/commit/98da1f892fd40b0d9a1b73745622e41c16f1d8e7) applies the two high-priority replay fixes:

- GOV28-EV-01: preserve the existing GOV-24/GOV-25 ProposalSubmitted canonical payload bytes; restrict the submitted object to the normative DRAFT/pre-activation state with fixed initial gate/timestamp/vote/delegation fields. The DRAFT → PROPOSED transition is now represented as its own subsequent event. Tests verify frozen payload bytes and reject every state-field mutation not represented in the payload.
- GOV28-EV-02: generic EStatusChanged → Rejected remains blocked at the canonical replay boundary; the rejected outcome is admitted through EDecisionFinalized and its existing witness/finality path only.

Exact-HEAD core validation on 98da1f8 is pending at last observation: Governance Standalone #41973239788 IN PROGRESS; Haskell Semantic #41973239636 QUEUED; Kernel Invalid-Class #41973239774 IN PROGRESS. Portability #41973239542, Algorithmic Governability #41973239703 and Documentation Link Check #41973239608 are SUCCESS.

Status: the two source fixes are implemented; CI evidence is pending; GOV-28 remains OPEN. The full GOV-18 vocabulary migration, challenge history events and emergency lifecycle remain open as documented above.
