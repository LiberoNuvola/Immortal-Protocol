# GOV-18 → Phase 5 Canonical Event Schema

## Closed in this package
The implementation now has an explicit canonical event representation containing:

- `event_id`
- `proposal_id`
- `ruleset_version`
- `event_type`
- `actor_class`
- `timestamp`
- `payload_commitment`
- `predecessor`
- `evidence_refs`
- `status`

A deterministic textual canonical representation is defined for the event body.

Replay is defined over ordered `(CanonicalEvent, GovernanceEvent)` pairs and rejects an invalid predecessor chain before applying the event.

## Important boundary

This phase does NOT claim cryptographic hashing, because the current package deliberately uses a deterministic payload representation rather than introducing an unverified external hashing dependency.

It also does not yet close:
- cryptographic commitment/hash algorithm;
- actor authorization policy;
- evidence reference resolution;
- challenge-state semantics;
- finality resolution/expiry state machine;
- ruleset immutability enforcement;
- independent second implementation.

Therefore this remains an implementation/conformance candidate, not a conformance certificate.

## 2026-11-04 — replay integration correction

The earlier statement that replay is defined over ordered `(CanonicalEvent, GovernanceEvent)` pairs is a historical phase snapshot and is no longer the current replay API.

Current source exposes:

```haskell
replayCanonical
  :: RulesetRegistry
  -> GovernanceState
  -> [CanonicalEvent]
  -> Either String GovernanceState
```

Payloads that have a direct legacy transition are mapped internally by `canonicalPayloadToGovernanceEvent`. The four distinct lifecycle payloads (`DecisionFinalized`, `AdoptionRecorded`, `ConformanceRecorded`, `Canonicalized`) use dedicated handlers; they are not represented as paired caller-supplied semantic events. The replay maintains canonical history for predecessor, duplicate-ID, timestamp and finalized-decision-reference checks.

Evidence on source SHA `9c5b6276f7ca132c3fcaaf170439747236a39d53`:
- standalone five-suite package: PASS, [run 41885987731](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987731);
- Plutus Haskell semantic conformance, including canonical replay: PASS, [run 41885987733](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987733);
- Kernel fail-closed regression suite: PASS, [run 41885987774](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41885987774).

This supersedes the old paired-event replay description for the implemented event subset. It does not assert that all 20 event identities in the GOV-18 implementation contract have dedicated constructors; see the 2026-11-04 scope note in `IMMORTAL/governance/README.md`.
