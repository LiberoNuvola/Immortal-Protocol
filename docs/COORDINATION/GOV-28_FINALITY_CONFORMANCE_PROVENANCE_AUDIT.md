# GOV-28 — Finality / Conformance Provenance Audit

## Result
The consumer audit has now exhausted the existing governance evidence/gate structures visible in the live branch.

### Existing GateResult
`Governance.GateResult` contains:
- evidenceGate
- compatibilityGate
- conformanceGate
- applicationConformanceGate

It does **not** contain a finality/challenge witness.

### Existing GovernanceFinality
`GovernanceFinality` contains the actual challenge/finality facts:
- ChallengeStatus
- Challenge
- bounded opening
- one-way resolution
- validChallenges
- challengeExpired
- canFinalize
- finalize

But these facts are not represented in `GovernanceState` / `Proposal` and therefore are not available to `Governance.statusChangeAllowed` when evaluating `DecisionRecorded -> Accepted`.

### Consequence
A boolean `conformanceGate` cannot safely be reinterpreted as “finality completed”: that would collapse distinct GOV-18 predicates and invent semantics not present in the current model.

Likewise, `finalizationAt` is only a timestamp and is insufficient to prove:
- expiry;
- absence of an upheld challenge;
- resolution of open challenges;
- challenge identity validity.

The challenge objects themselves carry those facts, but currently live in the auxiliary `GovernanceFinality` module.

### Independent replay
`GovernanceIndependentReplay.py` is genuinely independent of Haskell, but currently only models event-chain structure plus a minimal proposal-created projection. It does not model finality, adoption, conformance or canonicalization semantics.

### Status-document reconciliation
`PHASE5-CANONICAL-EVENT-STATUS.md` and `PHASE6-FINALITY-RULESET-STATUS.md` contain historical/phase claims that are now broader than the live GOV-28 evidence. In particular, they describe earlier parallel-event/replay boundaries and call canonicalization “explicit” while the current GOV-18 lifecycle separation is still incomplete.

These documents should be treated as phase-status evidence, not as proof of GOV-18 closure.

## Classification
**Concrete implementation/conformance integration gap.**

The existing representation has been exhausted for the specific question “can finality be witnessed by an existing field/gate without inventing semantics?” Answer: **no**.

## Safe next step
The next implementation decision is now bounded by evidence: either an already-existing canonical event/lifecycle representation elsewhere in the repository can carry the finality/conformance witness, or a minimal explicit lifecycle representation must be introduced to reconcile the already-closed GOV-18 event algebra.

No new timing, quorum, approval, economic or governance parameter is implied by this finding.
