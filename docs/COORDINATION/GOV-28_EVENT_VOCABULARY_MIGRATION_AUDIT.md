# GOV-28 — GOV-18 Event Vocabulary Migration & Consumer Audit

**Audit date:** 2026-11-04  
**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Audited source SHA:** `b49d0c7dea33a4adb251604e8eae4e958d789552`  
**Branch:** `work/immortal-green-closure`  
**Scope:** read-only source/specification audit; no Haskell implementation or governance semantics changed.

## Executive disposition

The 20-event vocabulary is normative in `docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md` and is also listed by the legacy `IMMORTAL/governance/CanonicalEvent.hs`. The latter is explicitly marked LEGACY / PARALLEL and is not compiled into the active governance package. The authoritative implementation remains `GovernanceEventSchema.hs` + `GovernanceCanonicalReplay.hs`, with one public API:

```haskell
replayCanonical
  :: RulesetRegistry -> GovernanceState -> [CanonicalEvent]
  -> Either String GovernanceState
```

The authoritative event algebra has ten constructors. Four lifecycle events — `DECISION_FINALIZED`, `ADOPTION_RECORDED`, `CONFORMANCE_RECORDED`, and `CANONICALIZED` — have dedicated typed payloads and replay handlers. The remaining Phase-2 identities are either represented by generic `EStatusChanged`, represented only as helper/state data, or absent from the replay stream.

**Important: this audit found two high-priority replay-integrity defects in the current path.**

1. `PROPOSAL_CREATED` / `EProposalSubmitted` accepts and inserts a complete mutable `Proposal` value, but the canonical payload serialization commits to only a subset of that value. Mutable lifecycle state and voting data can therefore be changed without changing the payload commitment.
2. Generic `EStatusChanged -> Rejected` is admitted by the current canonical lifecycle boundary. The legacy state transition `DecisionRecorded -> Rejected` has no finality-witness requirement, so this path can project rejection without the dedicated `EDecisionFinalized` witness and challenge-expiry checks.

These defects mean the green four-event lifecycle slice is not equivalent to full GOV-18 replay conformance. **GOV-28 remains OPEN.** The findings below are an implementation handoff, not authorization to create new actor policy, evidence semantics, emergency rules, or a second replay model.

## 1. Normative inventory versus active GOV-22 implementation

The Phase-2 contract defines the following 20 identities. "Generic" below means a current status/payload analogue exists, not that it is semantically identical to the normative event identity.

| # | Normative event | Current GOV-22 representation | Actor / effect currently visible | Audit disposition |
|---:|---|---|---|---|
| 1 | `PROPOSAL_CREATED` | `EProposalSubmitted / PayloadProposalSubmitted Proposal` | `Proposer`; inserts Proposal | Dedicated analogue exists, but payload/state commitment defect **GOV28-EV-01** below |
| 2 | `PROPOSAL_CLASSIFIED` | `EProposalClassified / PayloadProposalClassified` | `System`; Proposed → Classified | Dedicated event and typed payload exist |
| 3 | `IMPACT_REVIEW_COMPLETED` | `EStatusChanged / PayloadStatusChanged … ImpactReview …` | `System`; enters ImpactReview | Generic status analogue only; "completed" identity not represented |
| 4 | `EVIDENCE_RECORDED` | No dedicated event/payload. EvidenceReview status and envelope `evidenceRefs` exist | `EStatusChanged` can enter EvidenceReview; refs are structural strings | Not equivalent to recording/appraising evidence; GOV-27 says reference presence does not establish existence, authenticity or substantive validity |
| 5 | `COMMUNITY_REVIEW_OPENED` | `EStatusChanged / PayloadStatusChanged … CommunityReview …` | `System`; stores `communityReviewOpenedAt` | Generic status analogue; no distinct identity |
| 6 | `VOTING_OPENED` | `EStatusChanged / PayloadStatusChanged … Voting …` | `System`; enforces the 7-day review interval and stores `votingOpenedAt` | Generic status analogue; no distinct identity |
| 7 | `VOTE_CAST` | `EVoteCast / PayloadVoteCast Vote` | `Voter`; checks snapshot eligibility, voting window, duplicate vote and delegation constraints | Dedicated event/payload exists; actor-to-voter credential binding remains outside this implementation (see GOV-30) |
| 8 | `VOTING_CLOSED` | `EStatusChanged / PayloadStatusChanged … DecisionRecorded …` | `System`; enforces 5-day voting interval and stores `votingClosedAt` | Generic status analogue; no distinct identity |
| 9 | `CHALLENGE_OPENED` | No canonical event. `GovernanceFinality.openChallenge` returns a Challenge value | Requires DecisionRecorded and open finality window | Helper-only; not persisted in GovernanceState or canonical replay history |
| 10 | `CHALLENGE_RESOLVED` | No canonical event. `GovernanceFinality.resolveChallenge` returns an updated Challenge value | Open → Upheld/Rejected | Helper-only; resolution has no independent canonical event/history entry |
| 11 | `DECISION_FINALIZED` | `EDecisionFinalized / PayloadDecisionFinalized DecisionRecord` | `System`; verifies tally, gates, challenge set and expiry; records finalizationAt and Accepted/Rejected projection | Dedicated handler; part of the GREEN four-event slice |
| 12 | `ADOPTION_RECORDED` | `EAdoptionRecorded / PayloadAdoptionRecorded` | `System`; requires finalized Accepted and non-regressing timestamp; projects Adopted | Dedicated handler; part of the GREEN slice |
| 13 | `CONFORMANCE_RECORDED` | `EConformanceRecorded / PayloadConformanceRecorded ConformanceRecord` | `Reviewer`; requires Adopted and valid non-failing record | Dedicated handler; part of the GREEN slice |
| 14 | `CANONICALIZED` | `ECanonicalized / PayloadCanonicalized CanonicalizationRecord` | `System`; requires Adopted, valid record/gates, applicable conformance predecessor and matching finalized-decision reference | Dedicated handler; part of the GREEN slice |
| 15 | `REJECTED` | No distinct event type. Rejected is a DecisionRecord outcome; it is also reachable through generic `EStatusChanged` | Generic System status path can project DecisionRecorded → Rejected without finality witness | **GOV28-EV-02: high-priority finality bypass**; identity and ordering must be reconciled with Phase-2 |
| 16 | `RETURNED_FOR_REVISION` | `EStatusChanged / PayloadStatusChanged … ReturnedForRevision …` | `System`; transition from Proposed/Classified/ImpactReview/EvidenceReview/CommunityReview | Generic status analogue; no distinct identity or event-specific payload |
| 17 | `CANCELLED` | `EStatusChanged / PayloadStatusChanged … Cancelled …` | `System`; transition from Draft or Proposed | Generic status analogue; no distinct identity or event-specific payload |
| 18 | `EMERGENCY_ACTIVATED` | No canonical event. `EmergencyReview` and `emergencyActivatedAt` exist in Proposal | `EmergencyAuthority` exists as ActorClass but is not authorized by current authorization matrix | No canonical activation record; current transition graph has no incoming edge to EmergencyReview |
| 19 | `EMERGENCY_RENEWED` | No event, renewal timestamp/state, or renewal helper found | No active actor authorization | Missing; Phase-2 says 72-hour maximum unless separately renewed, but no renewal operation is modeled |
| 20 | `EMERGENCY_EXPIRED` | No event. `emergencyExpired` is a pure time predicate | No persisted transition from EmergencyReview to Expired | Predicate-only; no canonical expiry event or replay projection |

### Active-only event types outside the 20-name list

The authoritative schema also has `EDelegationSet` and `EGatesSet`. These are not names in the Phase-2 20-event list. Their presence does not cover any of the missing identities. Their normative placement, authority, evidence meaning and replay lifecycle must be made explicit rather than silently adding them to the Phase-2 vocabulary.

The active `EventStatus` value `RejectedEvent` is an envelope status, not a substitute for the normative `REJECTED` event identity.

## 2. High-priority finding GOV28-EV-01 — proposal creation commits to only part of the state it inserts

**Source path:** `IMMORTAL/governance/GovernanceEventSchema.hs`, `GovernanceCanonicalSerialization.hs`, `GovernanceCommitment.hs`, `Governance.hs`.

For `PayloadProposalSubmitted p`, `canonicalPayloadText` serializes only:

- proposal id and class;
- snapshot id, timestamp and weights;
- proposal creation timestamp.

It does **not** serialize the remaining mutable fields of the Proposal record, including:

- `proposalStatus`;
- community-review, voting-open, voting-close, finalization and emergency activation timestamps;
- votes and delegations;
- gate values.

The commitment preimage is derived from this canonical payload text. In contrast, `applyEvent (ProposalSubmitted p)` inserts the entire supplied Proposal after checking only snapshot validity and duplicate proposal id. No corresponding initial-state predicate constrains the omitted fields.

Therefore, two submitted events can have the same canonical payload/commitment while carrying different state-affecting values in the omitted Proposal fields. Replay applies those uncommitted values to GovernanceState. This breaks the binding between the committed event bytes and the state projection.

**Required fix boundary (do not implement by guess):**

1. Make the canonical ProposalSubmitted payload commit to every field that can affect state, or redesign the payload to carry only creation intent and have replay construct a deterministic initial Proposal.
2. Define and enforce the admissible initial Proposal state. At minimum, creation must not be allowed to seed later lifecycle states, finalization/emergency timestamps, votes or delegations.
3. Add a negative twin which mutates each omitted field while preserving the old commitment and proves that replay rejects it or that the committed bytes change.
4. Add a positive creation/replay test proving deterministic initial state and complete commitment binding.

Do not choose gate defaults, new status semantics, or new proposal fields without checking the normative contract and live consumers.

## 3. High-priority finding GOV28-EV-02 — generic Rejected status bypasses finalization

**Source path:** `IMMORTAL/governance/GovernanceCanonicalReplay.hs`, `Governance.hs`, `GovernanceConformance.hs`, `GovernanceCanonicalReplayTest.hs`.

The canonical lifecycle admission function rejects generic status changes to Accepted, Adopted and Canonical, but does not reject Rejected. The underlying legacy transition table admits `DecisionRecorded -> Rejected`. `statusChangeAllowed` adds no finality, challenge-expiry or DecisionRecord witness check for Rejected; those checks are performed by the dedicated `applyDecisionFinalized` path.

Consequently, a canonical `EStatusChanged / PayloadStatusChanged pid Rejected timestamp` can reach the generic `applyEvent` path and mutate the proposal to Rejected without `EDecisionFinalized`, a valid DecisionRecord, or the finality/challenge predicate. The current tests prove that a generic Accepted shortcut is rejected and separately prove that the dedicated finalization handler can produce a Rejected outcome, but they do not cover this generic Rejected shortcut.

**Required fix boundary:**

1. Block the generic status shortcut to Rejected at the canonical boundary unless a normative contract explicitly authorizes a different identity/path.
2. Preserve the dedicated finalization witness and challenge-expiry requirements for any final rejected outcome.
3. Add a negative replay test asserting the state remains unchanged when generic Rejected is attempted from DecisionRecorded.
4. Reconcile the separate Phase-2 `REJECTED` identity with the `decisionFinalOutcome = Rejected` projection. Do not assume these are equivalent: the legacy transition table places REJECTED directly after VotingClosed, while active replay places a Rejected outcome inside DECISION_FINALIZED.

## 4. Challenge and emergency event persistence gaps

### Challenge lifecycle

`openChallenge` and `resolveChallenge` are helper functions returning Challenge values. The canonical event algebra contains neither CHALLENGE_OPENED nor CHALLENGE_RESOLVED. Challenge values are later embedded in the `DecisionRecord` used by DECISION_FINALIZED. The replay can validate the supplied challenge set's identifiers, proposal binding, opening interval and statuses, but it cannot reconstruct an independently recorded sequence of challenge-open and challenge-resolution events from canonical history.

Required conformance work must bind opening and resolution facts to canonical history and ensure finalization consumes the exact resolved history. Do not invent challenge actors, appeal rights, payload fields or evidence policy; derive those from the closed GOV-18/GOV-21 documents and GOV-27 authorization/evidence boundary.

### Emergency lifecycle

The active Proposal model has `EmergencyReview`, `emergencyActivatedAt`, and 72-hour `emergencyActive/emergencyExpired` predicates. The transition table has outgoing edges from EmergencyReview to Voting/DecisionRecorded but no incoming transition into EmergencyReview. It has no renewal event, renewal timestamp or renewal operation, and no EmergencyReview → Expired transition. The current canonical authorization matrix does not authorize `EmergencyAuthority`; GOV-27 describes it as reserved pending explicit event-specific rules.

This is not a basis for assigning `EmergencyAuthority` to new event types in code. Emergency activation, renewal and expiry remain unimplemented in the authoritative replay and require a closed normative actor/authority/evidence treatment first.

## 5. Shared binding and authorization boundary

The current authoritative envelope validates event id, proposal id, event/payload type agreement, timestamp compatibility, predecessor, monotonic timestamp, event status, non-empty unique evidence references and commitment presence/match. Ruleset version registration/activation and event-type-to-ActorClass checks are also applied.

However:

- GOV-27 explicitly limits the current evidence check to structural reference presence; it does not resolve or authenticate the referenced evidence object.
- GOV-30 clarifies that `ActorClass` is a permission category, not actor identity or a credential. The generic Governance path does not authenticate actor identity or bind a signer/credential to a represented EntityId.
- `Auditor` and `EmergencyAuthority` are reserved in the current policy record. Do not assign them authority by inference.
- A non-empty evidence reference and a green CI run do not establish production evidence authenticity, live authority or deployment.

These boundaries remain independent from event identity migration. Do not collapse cryptographic integrity, actor authentication, event authorization, evidence appraisal, ruleset validity and state transition admission into one check.

## 6. Required migration method and conformance tests

Keep `GovernanceEventSchema.hs` + `GovernanceCanonicalReplay.hs` as the sole authoritative event algebra and replay API. Use `CanonicalEvent.hs` only as a historical identity/order inventory. Do not import its legacy event type, authorization table or replay fold into the active package.

For every Phase-2 identity, close this record before implementation:

1. normative identity and exact meaning;
2. typed payload and complete canonical serialization;
3. actor class and authority basis grounded in the closed governance policy;
4. evidence type/resolution/appraisal requirement;
5. ruleset and commitment binding;
6. allowed predecessor and timestamp constraints;
7. exact state projection (or explicit no-state-effect rationale);
8. live consumers and compatibility requirements;
9. positive test and negative twin proving invalid replay leaves state unchanged.

**Minimum regression set from this audit:**

- proposal creation: full payload commitment and strict initial-state validation;
- rejected outcome: generic Rejected shortcut rejected; dedicated finalization path remains required;
- impact/evidence/community/voting: identity-specific event history, not only status labels;
- evidence: distinguish a status change or EvidenceRef from a canonical evidence-recording fact;
- challenges: opened/resolved events reconstructable from history; finalization rejects missing, duplicate, wrong-proposal, out-of-window or unresolved challenge lineage;
- emergency: activation/renewal/expiry identity and state projection under an explicitly approved authority policy; expiry and renewal enforce the Phase-2 time rule;
- returned/cancelled: explicit identity semantics and predecessor restrictions;
- event extras: normative disposition of EDelegationSet and EGatesSet;
- all cases: wrong actor class, wrong proposal, invalid ruleset/commitment, missing evidence, bad predecessor and state-unchanged negative twins.

No new threshold, time interval, actor, authority root, evidence schema, appeal rule or economic parameter is proposed by this audit.

## 7. Exact-source evidence and status

All three core gates completed SUCCESS on the audited source SHA `b49d0c7dea33a4adb251604e8eae4e958d789552`:

- Governance Standalone Conformance [#41899743535](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41899743535): five standalone suites passed, including canonical event and canonical replay.
- Haskell Semantic Conformance [#41899743733](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41899743733): all workflow steps passed, including `governance-canonical-replay-tests`.
- Kernel Invalid-Class Fail-Closed [#41899744010](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41899744010): regression suites passed, including `governance-canonical-replay-tests`; artifact [13358492259](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41899744010/artifacts/13358492259), SHA-256 `36b9adb72d80f7d5bbee19f10cc2cc555108ccd4b9e1fb8ac37fc7a72eb2ba62`.

These runs establish that the existing bounded tests pass on the audited source. They do not establish the missing event identities, close the two newly identified negative cases, authenticate production actors/evidence, or certify deployment.

**Final disposition:** the four dedicated replay acts remain GREEN at the audited SHA; full GOV-18 event migration remains OPEN; GOV28-EV-01 and GOV28-EV-02 are HIGH-PRIORITY implementation blockers for a full canonical replay conformance claim. No code, governance semantics, economic constants, V3, Reveal, wallet or on-chain state was changed by this audit.
