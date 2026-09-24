# GOV-28 — Lifecycle Order Closure from GOV-10/GOV-17/GOV-18

## Finding

The previously identified relationship between finality, adoption and conformance is no longer ambiguous after triangulating the closed Notion governance records.

### Closed sources

- GOV-10 — Governance Canonical State, Audit Trail & Conformance Boundary.
- GOV-11 — Governance Conformance Specification & Integration Map.
- GOV-12 — Governance Open-Decision Closure Plan.
- GOV-17 — Temporal + Emergency Rules Decision Closure.
- GOV-18 — Canonical Event Schema + Final Governance Specification Closure.
- Governance Specification v0.1 — Release Candidate.

## Canonical sequence

The closed records independently converge on:

`VOTING → DECISION_FINALIZED → ADOPTION → CONFORMANCE → CANONICALIZATION`

GOV-17 expresses the temporal form as:

`... → VOTING(5d) → FINALIZATION/CHALLENGE(3d) → FINAL → ADOPTION → CONFORMANCE → ...`

GOV-10 states:

`VOTING → DECISION_RECORDED → ADOPTION → CONFORMANCE → CANONICALIZATION`

and separately defines finalization as the deterministic fixing of the voting result.

The GOV-18 release candidate resolves the canonical boundary explicitly as:

`VOTING → DECISION_FINALIZED → ADOPTION → CONFORMANCE → CANONICALIZATION`.

Therefore the implementation must not use the legacy shortcut:

`DecisionRecorded → Accepted → Adopted → Canonical`

as the canonical event semantics.

## What can be represented with existing state

The existing states are still useful as projections:

- `DecisionRecorded` corresponds to the recorded voting result / voting closure boundary.
- `Accepted` represents the governance decision passing its acceptance predicate.
- `Adopted` represents the post-decision adoption state.
- `Canonical` represents durable canonicalization.

These states do not need to become the canonical event vocabulary.

## Required canonical witnesses

### DECISION_FINALIZED

Must be a distinct canonical event after the deterministic 3-day challenge/finality condition. GOV-18 requires the finalized decision record to preserve challenge result and canonicalization reference.

Existing `finalizationAt` is a possible projection field but is currently written only by the auxiliary `GovernanceFinality.finalize`, which incorrectly jumps directly to `Canonical`. It cannot by itself serve as the full finality witness because challenge facts remain outside `GovernanceState`.

### ADOPTION_RECORDED

Must be a distinct canonical event after `DECISION_FINALIZED`. Existing `Accepted → Adopted` is a compatible projection transition, but the current implementation does not enforce the finalization predecessor.

### CONFORMANCE_RECORDED

Must remain distinct from both governance approval and canonicalization. GOV-10 requires conformance evidence for implementation-affected canonicalization. The current `GateResult.conformanceGate` is insufficient as a post-decision conformance record because it participates in the acceptance predicate rather than recording the later conformance event.

### CANONICALIZED

Must be a distinct canonical event after the applicable adoption/conformance boundary. Existing `Adopted → Canonical` is a compatible projection transition, but current code does not require a distinct conformance record.

## Important implementation consequence

This is now an implementation gap, not an open governance decision.

The next code change can safely introduce the missing canonical lifecycle representation without changing any frozen governance parameter.

The minimal design direction is:

1. retain the existing proposal states as projections;
2. introduce explicit canonical event types/payloads for the GOV-18 lifecycle acts;
3. store enough deterministic state to prove finality/challenge outcome and post-decision conformance;
4. make one lifecycle-admission predicate authoritative for canonical replay;
5. reject invalid lifecycle events before mutation;
6. keep `GovernanceFinality.finalize` auxiliary until its semantics are reconciled with the canonical path;
7. preserve legacy state-machine behavior only where it is a projection of canonical events.

## Negative invariants to encode

- `ADOPTION_RECORDED` before `DECISION_FINALIZED` → reject/no mutation.
- `CONFORMANCE_RECORDED` without its required evidence → reject/no mutation.
- `CANONICALIZED` before adoption → reject/no mutation.
- `CANONICALIZED` without required conformance → reject/no mutation.
- finalization with an upheld challenge → reject/no mutation.
- finalization before challenge expiry/resolution → reject/no mutation.
- invalid canonical event envelope → reject/no mutation.
- same predecessor with an incompatible successor → reject/no mutation.

## Boundary

No new duration, threshold, actor class, voting rule, economic rule or emergency parameter is introduced.

This closes the semantic research pass and authorizes the implementation pass against already-closed GOV-01/GOV-18 semantics.
