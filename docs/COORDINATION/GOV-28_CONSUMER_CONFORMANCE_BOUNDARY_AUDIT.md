# GOV-28 — Consumer / Conformance Boundary Audit

## Verified live branch
`work/immortal-green-closure`

## Findings

### 1. GovernanceConformance is not yet a lifecycle authority
Current `GovernanceConformance.hs` defines:
- `conformanceChecklist rs prev e = canonicalGovernanceEventValid rs prev e && eventTypeMatchesActor e`
- `lifecycleTransitionValid = transition`
- `challengeSetValid = validChallenges`

Therefore the conformance checklist currently validates canonical envelope/authorization properties, but does **not** apply `lifecycleTransitionValid` to the event payload/state pair. A canonical event can be structurally/cryptographically valid without the conformance checklist proving that its transition is admissible in the current governance state.

This is direct evidence for GOV-28-B. No new semantics are needed.

### 2. GovernanceAuthorization is an envelope gate, not lifecycle admission
`canonicalGovernanceEventValid` composes:
schema validity + AcceptedEvent + authorization + evidence + ruleset/commitment.

It does not inspect the current `GovernanceState` or proposal status.

Conclusion: authorization/evidence/ruleset/commitment and lifecycle admissibility remain distinct planes, as already indicated by GOV-18. They must not be conflated.

### 3. GovernanceCanonicalReplay delegates lifecycle to old Governance.hs
`applyCanonicalEvent`:
1. validates the canonical event envelope;
2. converts payload via `canonicalPayloadToGovernanceEvent`;
3. calls `applyEvent`.

This means lifecycle admissibility is ultimately whatever `Governance.hs/statusChangeAllowed` accepts. The conversion itself is not a second source of truth, consistent with the resolved GOV-22 interpretation, but the lifecycle model remains the old status algebra.

### 4. Reference Python is explicitly structural-only
`verification/gov28_reference.py` checks:
- actor;
- evidence;
- ruleset;
- commitment;
- predecessor;
- duplicate event IDs.

It explicitly reports finality/challenge lifecycle as NOT IMPLEMENTED.

Therefore it cannot currently serve as the independent full-state replay implementation required by GOV-C-16 / GOV-22.

### 5. Current tests expose the same boundary
`GovernancePhase6Test.hs` verifies challenge-window behavior and the auxiliary `finalize` helper, but its positive assertion that `finalize -> Canonical` must remain classified as auxiliary behavior.

`GovernanceConformanceTest.hs` verifies voting/quorum/approval/gates and `Accepted -> Adopted`, but does not prove finality before acceptance or conformance before canonicalization.

## Resulting minimal architecture target

Do not immediately add fields.

First establish one authoritative lifecycle admission function that can evaluate:

`current canonical governance state + canonical event -> admissible/reject`

while preserving the existing separation:

`schema/authorization/evidence/ruleset/commitment`
≠
`lifecycle admissibility`
≠
`effectuation/observation`.

Then canonical replay and live transition must invoke the same authoritative lifecycle semantics.

## Required next negatives

1. Structurally valid `StatusChanged Accepted` before finality → reject/no mutation.
2. Same with upheld/open blocking challenge → reject/no mutation.
3. Structurally valid `StatusChanged Canonical` from `DecisionRecorded` → reject/no mutation.
4. `Adopted → Canonical` without the required conformance witness → reject/no mutation once the existing conformance representation is identified.
5. Same canonical predecessor with incompatible successor → reject at canonicalization boundary, after locating existing canonical identity.
6. Python reference must reject the same illegal lifecycle sequences after its lifecycle model is extended.

## Classification

**Concrete implementation/conformance gap.**

No normative decision, timing parameter, threshold, event identity, hash scheme, or storage model introduced.

## External engineering triangulation

Event-sourcing guidance independently treats the ordered immutable event sequence as the source from which state is reconstructed, and notes that event collisions require explicit conflict/version handling. This supports the engineering direction but does not define IMMORTAL semantics. citeturn0search0turn0search1
