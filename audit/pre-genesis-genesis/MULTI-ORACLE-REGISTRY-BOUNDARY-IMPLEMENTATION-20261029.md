# Multi-Oracle Registry Boundary — implementation record

Status: **SIGNED SNAPSHOT + CURRENTNESS/REVOCATION BOUNDARY IMPLEMENTED; TARGETED TESTS PASS; NOT PRODUCTION-WIRED**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Normative status: non-normative; no economic or oracle-source policy approved

## Verified test evidence

The focused suite passed against commit `51f372d12e8eaf671e6042bc9c70d3b8faa2e327`, including signed-snapshot verification, exact source/feed/policy resolution, currentness/checkpoint matching, revocation checks, terminal revoked-digest rejection, sequence rollback and same-sequence equivocation checks.

GitHub Actions: [Multi-Oracle Registry Boundary Conformance run #40823847938](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40823847938).

Result:
- 3 test files passed
- 53 tests passed
- Test command: `npm run test:multi-oracle -- --reporter=verbose`
- Locked dependency installation via `npm ci --no-audit --no-fund` passed.

## Files and behavior

- `relayer/multiOracleObservation.js`: normalizes canonical integer fields, checks source/feed/pair/timestamp-unit consistency, validates the payload digest, and requires observation `policyVersion` to match the supplied registry entry.
- `relayer/multiOracleRegistrySnapshot.js`: verifies an `IMMORTAL-MULTI-ORACLE-REGISTRY-V1` snapshot using canonical JSON, SHA-256 digest checking, and an Ed25519 signature against a caller-supplied public key. Snapshot payloads now include a canonical decimal `registrySequence`.
- The signed snapshot provider requires an injected `currentnessProvider.resolveCurrentRegistryState`. On every source lookup it checks that the independently verified currentness result has the same policy version, registry sequence, registry version and digest as the signed snapshot; requires the registry status to be `CURRENT`; and checks the current revocation overlay before returning an entry.
- Source/feed/policy resolution is exact. Wrong feeds, ambiguous entries, inactive entries and revoked tuples fail closed; no alternate feed or legacy quote is selected.
- A process-local high-water mark rejects a decreasing currentness control sequence or registry sequence, and rejects different registry version/digest data at the same registry sequence. Different currentness state at the same control sequence is rejected as equivocation. A newer authoritative checkpoint is recorded before a stale candidate snapshot is rejected, so a later read cannot silently roll back within the same provider process.
- Source/feed/policy revocation tombstones are monotonic within a policy version: once observed as revoked, a tuple cannot silently disappear from later overlays. An explicitly revoked registry digest is terminal for that provider instance. These local guards are defense-in-depth and are not durable across process restarts.
- `relayer/multiOracleRegistryBoundary.js` returns the currentness authority/checkpoint references and sequence together with the registry version, sequence, digest, signature scheme and exact source identity, so this evidence remains bound in the normalized result.
- `relayer/multiOracleObservation.test.js`, `relayer/multiOracleRegistryBoundary.test.js`, `relayer/multiOracleRegistrySnapshot.test.js`: 53 focused tests, including tampered snapshots, invalid signatures, wrong trust key, duplicate entries, wrong policy/feed, stale/ahead sequence, checkpoint digest mismatch, revoked entries and registry digests, unverified currentness, control/registry sequence rollback, same-sequence equivocation, revocation tombstone removal, and currentness read on every lookup.
- `audit/pre-genesis-genesis/MULTI-ORACLE-REGISTRY-CURRENTNESS-CONTRACT-v0.1-20261029.md`: describes the provider interface, monotonicity requirements, revocation rules and open authority decision.
- `.github/workflows/multi-oracle-conformance.yml`: dedicated conformance workflow.
- `package.json`: exposes `test:multi-oracle`.

All source/feed/key identities in unit tests are generated fixtures. No production key, real source, or feed was activated.

## Currentness security boundary

**A valid registry signature is not proof that the signed snapshot is still current.** The adapter now requires a separate currentness provider and compares its checkpoint to the signed snapshot, but the provider's `verificationStatus: "VERIFIED"` is still an assertion that must be backed by a real authentication and anti-replay implementation.

The currentness provider MUST, for each lookup:
1. authenticate the current registry head and current revocation state using a separately approved trust path;
2. verify that this result cannot be replayed or rolled back to an older valid checkpoint;
3. return a canonical control sequence, checkpoint reference, policy version, registry sequence/version/digest, current status and complete revocation overlay;
4. fail closed on missing proof, stale/ambiguous state, source unavailability, or an unknown status.

The in-memory sequence high-water mark only detects rollback/equivocation while that provider instance is alive. It resets on restart and is not a durable anti-rollback root. A production currentness provider must anchor monotonic state outside this process (or verify a current state proof from an authoritative system). The exact authority mechanism has **not** been chosen; no synthetic endpoint, trust root, or source has been designated.

The `trustRootReference` and `currentnessAuthorityReference` are provenance identifiers, not proof of authority by themselves. The caller still must securely obtain and rotate the approved public key and authenticate the currentness provider. No freshness or expiry threshold has been chosen.

Ed25519 is the implemented snapshot envelope scheme for this technical adapter. This is not approval of a specific oracle source, registry publisher, committee, quorum, aggregation method or economic policy.

## Production and governance status

No production relayer/consumer is wired to this provider. No Plutus consumer, deployed Oracle State, V3, Reveal, economic constant, Issue rule, fallback, source allowlist, oracle quorum, aggregation function, USD/USDM source, or conversion policy was changed or approved. No on-chain transaction or deployment was initiated.

## Remaining gates

1. Select and approve the actual authority of current registry state and revocations. Evaluate rollback-resistant, proof-verifiable state first; any trusted-server fallback must be explicit about its trust assumptions.
2. Define public-key publication, pinning, rotation and revocation for snapshot signatures and currentness evidence.
3. Specify a durable monotonic/checkpoint rule or a verifiable current-state proof that survives process restart, including how to reject stale reads, rollback and equivocation.
4. Approve source identities, feed IDs, authentication methods and dependency/independence classifications; a feed catalog alone is not qualification.
5. Implement source-specific adapters and validate source publication timestamps, pair direction, integer scale and evidence binding.
6. Keep aggregation, quorum, divergence/freshness policy, USD/USDM composition, and production consumer migration separate until explicitly approved.

The 53 passing tests establish the behavior of the technical adapter and its fail-closed boundaries for the tested revision. They do not qualify an oracle source for PRE-RICH or clear the existing Issue Admission blocker.
