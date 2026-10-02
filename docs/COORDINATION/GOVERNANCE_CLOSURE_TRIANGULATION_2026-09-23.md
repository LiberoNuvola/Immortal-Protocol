# Governance front — 2026-09-23 coordinated closure pass

## Triangulated baseline

The repository governance chain currently contains GOV-23 through GOV-29, with GOV-27 defining independent Authorization/Evidence/Ruleset gates and GOV-28 defining canonical event vocabulary, predecessor continuity, lifecycle/finality requirements and canonical replay. GOV-29 moves semantic payload into CanonicalEvent and states that replay should consume only GovernanceState + [CanonicalEvent].

The Constitution Gap Matrix independently states that governance/conformance documents are subordinate to the canonical Constitution and specifications, and that implementation/evidence gaps must not be promoted into normative authority.

The Notion master "IMMORTAL — Algorithmic Governability Boundary & Adaptive Incentive System v0.1" independently defines the research boundary:
Constitution -> governance approves functions/limits -> algorithm derives -> adapter realizes -> observed/canonical state.
It explicitly keeps ProtocolUsageFee, governance threshold, vote/review/code rewards and numeric limits OPEN/non-decisions.

## New concrete finding: GOV-28 reference is narrower than its stated conformance surface

`verification/gov28_reference.py` currently proves:
- event status;
- event-type/actor authorization;
- evidence presence/uniqueness;
- ruleset registration;
- ruleset commitment;
- event-id uniqueness;
- predecessor continuity.

It does NOT implement the full lifecycle/finality predicates listed in GOV-28, despite GOV-28 naming:
- challenge set validity;
- finality-window expiry;
- upheld/open challenge blocking;
- DecisionRecorded prerequisite;
- concrete semantic payload decoding;
- repository Haskell replay integration.

Therefore GOV-28 must remain a reference/conformance package, not a green production conformance claim.

## New concrete finding: GOV-29 reference is commitment-only

`verification/gov29_reference.py` currently demonstrates deterministic UTF-8 encoding and SHA-256 for one canonical event fixture. It does not independently replay the event, verify predecessor continuity, reconstruct semantic state, or prove the CanonicalEvent payload decoder.

Therefore GOV-29 cryptographic boundary is demonstrated, but executable canonical replay remains an implementation/evidence gap until the repository Haskell path is built and exercised.

## Governance non-sovereignty boundary

The adaptive-incentive master research provides the correct separation:
- algorithmically measurable;
- algorithmically derivable inside an authorized function;
- institutionally decided.

No reward/fee/threshold algorithm may define its own domain, bounds, evidence admissibility, authority, or amendment mechanism.

The Fee Incentive Adversarial Lab adds explicit attack classes:
Sybil, participation farming, review/self-review/collusion, contribution inflation, fee/reward circularity and result-dependent authority.

## Immediate governance test matrix

1. Authorization twin: valid payload + wrong actor -> reject.
2. Evidence twin: valid actor + missing/duplicate evidence -> reject.
3. Ruleset twin: valid event + unknown/mismatched ruleset commitment -> reject.
4. Replay twin: same event id twice -> reject.
5. Predecessor twin: valid event naming non-current predecessor -> reject.
6. Payload substitution: canonical event envelope unchanged but semantic payload changed -> commitment/replay mismatch -> reject.
7. Challenge finality: DecisionRecorded + open/upheld challenge -> reject finalization.
8. Challenge expiry: finality before expiry -> reject; after valid expiry -> permit only if all other predicates hold.
9. Stale governance basis: event admitted under generation g but finalized against g+1 -> reject or explicitly revalidate.
10. Result-dependent authority: reward receipt must not mutate quorum, approval threshold, evidence authority, actor class or ruleset authority.
11. Self-modifying function: reward/fee function cannot modify its own domain, bounds or governance authority.
12. Parameter laundering: declared "derived" parameter must expose function, domain, bounds and input provenance separately.

## Classification

- GOV-27: structural package prepared; authenticity/identity/temporal/semantic lifecycle/deployment evidence still open.
- GOV-28: reference conformance useful and executable at Python level; full Haskell/repository/cryptographic/lifecycle conformance open.
- GOV-29: canonical serialization/commitment reference demonstrated; executable replay integration open.
- Algorithmic Governability: research boundary consolidated; all concrete adaptive parameters remain open/non-canonical.
- Fee/Reward governance: research/open; no numeric policy introduced.

No economic constants or governance policy has been changed.
