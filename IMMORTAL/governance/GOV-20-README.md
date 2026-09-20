# GOV-20 — Ruleset Registry + Immutability

Baseline: `5e699eace1608d5879a278016242154177656339`

GOV-18 requires `ruleset_version` to identify the exact normative rules used by a canonical event. GOV-19 introduced the field. GOV-20 makes its meaning immutable.

## Normative properties

1. Ruleset versions are positive and monotonically increasing.
2. Every ruleset has a non-empty canonical commitment.
3. A successor explicitly references the immediately preceding version.
4. Registration is append-only.
5. Re-registering an identical definition is idempotent.
6. Re-registering an existing version with different content is rejected.
7. Historical versions cannot be overwritten or deleted by registration.
8. Active ruleset selection at a timestamp is deterministic.
9. A version is compatible only with its registered commitment.

`rulesetCommitment` is intentionally opaque here. Cryptographic hash choice and serialization remain a later canonical-serialization/adapter concern; GOV-20 closes the semantic immutability invariant without inventing those primitives.

## Next
GOV-21: challenge/finality. GOV-22: canonical events to governance-state replay. GOV-23: independent replay/conformance evidence.
