# Multi-Oracle Registry Boundary — implementation record

Status: **STRUCTURAL BOUNDARY IMPLEMENTED; TARGETED TESTS PASS; NOT PRODUCTION-WIRED**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Normative status: non-normative; no economic or oracle-source policy approved

## Verified change

Commit tested by the dedicated workflow: `0fb890ce4b2bdc12cc56e06b5cda2f1d960cb181`.

GitHub Actions: [Multi-Oracle Registry Boundary Conformance run #40817028676](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40817028676).

Result:
- 2 test files passed
- 21 tests passed
- Test command: `npm run test:multi-oracle -- --reporter=verbose`
- Locked dependency installation via `npm ci --no-audit --no-fund` passed.

## Files and behavior

- `relayer/multiOracleObservation.js`: normalizes canonical integer fields, checks source/feed/pair/timestamp-unit consistency, validates the payload digest, and now requires observation `policyVersion` to match the supplied registry entry.
- `relayer/multiOracleRegistryBoundary.js`: requires an injected `resolveVerifiedRegistrySnapshot` provider; resolves by exact source and policy version; rejects absent or non-verified resolutions, invalid registry digests, missing entries, inactive entries, and policy mismatches; returns the normalized observation alongside a frozen registry-binding envelope.
- `relayer/multiOracleObservation.test.js` and `relayer/multiOracleRegistryBoundary.test.js`: cover positive normalization and fail-closed cases.
- `.github/workflows/multi-oracle-conformance.yml`: runs the focused tests on relevant pushes and pull requests.
- `package.json`: exposes `test:multi-oracle`.

## Security boundary — do not overstate this result

This is **not yet an authoritative registry implementation**. The registry provider is an injected dependency. Its `verificationStatus: "VERIFIED"` is a trusted assertion by that provider; this module does not itself establish a trust root, validate a registry signature, verify the digest against a canonical signed snapshot, or prove that the provider is authoritative. The digest format is checked here, but its authenticity and relationship to the snapshot must be verified by the provider.

No real source/feed identities are activated by these test fixtures. They are test-only values.

No production relayer/consumer was wired to this boundary. No Plutus consumer, deployed Oracle State, V3, Reveal, economic constant, Issue rule, fallback, freshness bound, quorum, aggregation function, USD/USDM source, or conversion policy was changed or approved. No on-chain transaction or deployment was initiated.

## Remaining gates

1. Define the authoritative registry artifact and out-of-band trust root / authenticated read method.
2. Specify and test canonical snapshot encoding and digest/signature verification, including policy version and activation state.
3. Add negative tests for invalid signatures, wrong trust root, tampered registry snapshot, source deactivation/revocation, and stale registry versions.
4. Freeze source-specific verification contracts and dependency/independence classifications through the proper governance decision; do not infer them from feed catalogs.
5. Only after those gates, build source-specific adapters and verify publication timestamps, pair direction, integer scale, and evidence binding.
6. Keep aggregation, quorum, divergence/freshness policy, USD/USDM composition, and production consumer migration separate until explicitly approved.

The green result demonstrates only that the current structural boundary and its 21 unit tests behave as specified. It does not qualify an oracle source for PRE-RICH or clear the existing Issue Admission blocker.
