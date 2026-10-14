# JEV Verification Registry v0.1

## Purpose

The registry normalizes verification outcomes so JEV can compare runs, report regressions, and prevent evidence collection from being mistaken for protocol conformance. It records claims and evidence; it does not make economic decisions, authorize deployment, or modify protocol rules.

## Files

- `verification-registry.schema.json`: machine-readable data contract.
- `scripts/validate-jev-verification-registry.mjs`: dependency-free runtime validator.
- `scripts/test-jev-verification-registry.mjs`: positive and negative regression cases.

## Result vocabulary

- `PASS`: the specific check ran and passed with at least one evidence reference.
- `FAIL`: the specific check ran and failed with at least one evidence reference.
- `BLOCKED`: the check could not be completed because a prerequisite was missing or unavailable.
- `NOT_RUN`: the check was not executed.

These values apply to an individual check, not automatically to the entire protocol. An overall result must not be inferred from the existence of an artifact or from a subset of passing checks.

## Execution context

Every registry declares exactly one context: `unit-test`, `static-analysis`, `emulator`, `devnet`, `preprod`, or `mainnet`. Evidence from one context does not prove behavior in another context.

## Evidence and limits

Each check names a stable `checkId`, a `requirementRef`, a result, evidence references, and limitations. A PASS or FAIL without an evidence reference is invalid. Evidence can reference a workflow run, log, artifact, commit, on-chain observation, metric, or test report. A digest is optional when the source does not provide one; it must never be invented.

Limitations are required so a local result can state what it does not prove. For example, a V3 carrier PASS does not prove Reveal PASS, and a devnet result does not establish Preprod/mainnet behavior.

## Non-goals and safety boundaries

- No new economic rules, coefficients, thresholds, or scoring are introduced.
- No validator, Reveal, or V3 semantics are modified.
- JEV does not infer root cause solely from temporal correlation.
- JEV does not promote an overall status to PASS unless a separate, versioned Gate policy explicitly defines the required checks and all are supported by evidence.
- Notion remains a human-readable evidence ledger; the canonical code and normative requirements remain in their existing sources of truth.

## Initial rollout

1. Validate this contract and its negative cases.
2. Add one registry entry for an already-observed Integration Lab run, clearly labelled as a historical example.
3. Compare the registry against the original logs and packet.
4. Only after that, wire registry production into CI and Notion publication.
