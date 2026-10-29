# Multi-Oracle Registry Boundary — implementation record

Status: **SIGNED-SNAPSHOT VERIFICATION AND SOURCE/FEED RESOLUTION IMPLEMENTED; TARGETED TESTS PASS; NOT PRODUCTION-WIRED**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Normative status: non-normative; no economic or oracle-source policy approved

## Verified test evidence

The focused suite ran against commit `eb59f109542ea904873127f9747ad1131b59234c`, which includes the new signed-snapshot verifier, provider, source/feed/policy-bound resolver, and all three test files.

GitHub Actions: [Multi-Oracle Registry Boundary Conformance run #40820207176](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820207176).

Result:
- 3 test files passed
- 36 tests passed
- Test command: `npm run test:multi-oracle -- --reporter=verbose`
- Locked dependency installation via `npm ci --no-audit --no-fund` passed.

A later commit added the same two registry snapshot files to the workflow's path filters and is running separately: [run #40820221542](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40820221542). The test result above belongs to the exact SHA identified above, not to every later commit.

## Files and behavior

- `relayer/multiOracleObservation.js`: normalizes canonical integer fields, checks source/feed/pair/timestamp-unit consistency, validates the payload digest, and requires observation `policyVersion` to match the supplied registry entry.
- `relayer/multiOracleRegistrySnapshot.js`: verifies an `IMMORTAL-MULTI-ORACLE-REGISTRY-V1` snapshot using canonical JSON bytes, SHA-256 payload digest checking, and an Ed25519 signature against a caller-supplied public key. It rejects invalid signatures, digest mismatches, wrong schemas, unsupported key types, duplicate source/feed/policy entries and entries whose policy version differs from the signed snapshot.
- The signed snapshot provider resolves by the exact triple `sourceId + feedId + policyVersion`; it does not silently choose a different feed. Resolution returns the registry digest/version, signature scheme and caller-supplied trust-root reference.
- `relayer/multiOracleRegistryBoundary.js`: connects a trusted provider to the structural normalizer and returns a frozen registry-binding envelope.
- `relayer/multiOracleObservation.test.js`, `relayer/multiOracleRegistryBoundary.test.js`, `relayer/multiOracleRegistrySnapshot.test.js`: 36 focused tests, including rejection of a wrong signing key, a tampered payload, a recomputed digest without a matching signature, malformed signature material, duplicate entries, mismatched policies, inactive sources and a wrong requested feed.
- `.github/workflows/multi-oracle-conformance.yml`: dedicated conformance workflow.
- `package.json`: exposes `test:multi-oracle`.

The test registry identities and keys are generated fixtures only. No production registry key, real source, or feed was activated.

## Security boundary — do not overstate this result

The verifier now checks that a snapshot is correctly signed by the **public key supplied to it**, and that the payload digest matches the canonical signed payload. It does **not** establish that the supplied public key is itself authoritative. The `trustRootReference` is provenance metadata supplied by the caller, not proof of the key's governance. The caller must obtain the trust anchor through an approved, authenticated channel.

The snapshot verifier also does not determine whether a signed snapshot is the latest authoritative version, whether a later revocation exists, or whether an activation was properly authorized. Those require a separately specified trust-root distribution, registry publication/version/currentness rule, and governed activation/revocation process. No freshness or expiry threshold has been selected.

Ed25519 is the implemented envelope scheme for this initial technical adapter, consistent with the existing Node crypto signature pattern in the repository. This is an implementation format, not approval of any oracle source, signing authority, committee, quorum, or economic policy.

No production relayer/consumer was wired to this provider. No Plutus consumer, deployed Oracle State, V3, Reveal, economic constant, Issue rule, fallback, freshness bound, quorum, aggregation function, USD/USDM source, or conversion policy was changed or approved. No on-chain transaction or deployment was initiated.

## Remaining gates

1. Approve how the trusted public key is distributed, pinned, rotated and revoked, and identify who is authorized to sign registry snapshots.
2. Define how the consumer identifies the current registry version and detects stale snapshots, rollback and revocation; add the relevant negative tests.
3. Freeze source-specific verification contracts and dependency/independence classifications through the proper governance decision; do not infer them from feed catalogs.
4. After the source authority gates, implement source-specific adapters for the actual authentication evidence and check source publication timestamps, pair direction, integer scale and valuation binding.
5. Keep aggregation, quorum, divergence/freshness policy, USD/USDM composition, and production consumer migration separate until explicitly approved.

The 36 passing tests establish the behavior of the signed-snapshot technical adapter and the existing structural boundary for the tested revision. They do not qualify an oracle source for PRE-RICH or clear the existing Issue Admission blocker.
