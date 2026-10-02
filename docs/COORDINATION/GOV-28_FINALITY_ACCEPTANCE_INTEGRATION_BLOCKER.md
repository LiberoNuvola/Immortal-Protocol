# GOV-28 — Finality-to-Acceptance Integration Blocker

Date: 2026-09-24
Branch: work/immortal-green-closure

## Triangulated conclusion

GOV-18 states that finalization follows successful challenge resolution or challenge expiry (GOV-C-13), while GOV-18 also defines ACCEPT predicates as governance approval predicates.

The live implementation separates these concerns across modules:
- Governance.hs owns ProposalStatus and the Accepted transition;
- GovernanceFinality.hs owns challenges, expiry and canFinalize;
- GovernanceFinality.finalize currently writes Canonical directly.

Governance.hs cannot safely make Accepted depend on challenge outcome without an authoritative finality result crossing the module boundary. A simple timestamp check is insufficient because GOV-C-13 permits finalization after challenge expiry only when unresolved challenge state does not block finalization; an upheld challenge must not be silently ignored.

## Safe architectural implication

The missing piece is not a new governance rule. It is an authoritative integration boundary between finality evidence and the lifecycle transition.

Candidate implementation shapes to evaluate against existing architecture, without choosing one yet:
1. make finality outcome an explicit canonical event consumed by the lifecycle reducer;
2. extract challenge/finality predicates into a dependency-neutral module used by the reducer and finality tests;
3. represent finality result in canonical event payload/evidence and let replay validate the transition.

Do not implement a new choice until the existing package/test structure and canonical event schema show which shape is least invasive.

## Required negative twins before closure

- DecisionRecorded → Accepted before finality must reject.
- DecisionRecorded → Canonical must reject.
- an upheld challenge must block finalization.
- expiry with only rejected/no blocking challenges may finalize.
- Accepted cannot be produced merely by quorum/approval if GOV-C-13 finality has not occurred.
- Conformance and canonicalization remain separate from acceptance.

## Status

OPEN implementation/conformance blocker; no normative escalation.