# Multi-Oracle Registry Currentness and Revocation Contract v0.1

Status: **PROPOSED TECHNICAL CONTRACT — NON-NORMATIVE**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Scope: relayer/adapter boundary only; no source, quorum, valuation, or economic policy is approved.

## 1. Purpose

A valid signature proves only that a particular signing key signed a particular payload. It does not, by itself, prove that the payload is the latest registry snapshot, that a later revocation does not exist, or that the key is the currently authorized key.

The multi-oracle adapter therefore requires two distinct checks:

1. **Snapshot authenticity:** validate canonical payload bytes, digest, schema and the snapshot signature against an externally approved trust root.
2. **Currentness and revocation:** resolve a fresh, independently authenticated current-state record and require it to bind to the exact snapshot and source/feed/policy tuple being consumed.

A signed snapshot without a currentness result is insufficient. If the currentness provider is absent, unavailable, unverifiable, ambiguous or inconsistent, resolution must fail closed.

## 2. Snapshot versioning

The signed payload schema is `IMMORTAL-MULTI-ORACLE-REGISTRY-V1` and includes:

- `registryVersion`: human-readable version identifier;
- `registrySequence`: canonical non-negative decimal integer, monotonically increasing for each published registry snapshot under that policy;
- `policyVersion`: immutable policy identifier;
- `entries`: entries bound to that policy.

The sequence is an anti-rollback ordering field; it is not a source-selection rule, quorum parameter or economic threshold. It must be covered by the signed payload and digest. Duplicate `sourceId + feedId + policyVersion` entries are invalid.

The exact registry head is identified by the tuple:

`policyVersion + registrySequence + registryVersion + registryDigest`.

Currentness must match all four fields. Comparing version strings lexicographically is not sufficient.

## 3. Currentness provider interface

The production adapter is expected to call an authority-provider contract equivalent to:

```js
resolveCurrentRegistryState({ policyVersion }) => {
  verificationStatus: "VERIFIED",
  authorityReference,
  checkpointReference,
  policyVersion,
  controlSequence,       // canonical non-negative decimal string
  registrySequence,      // canonical non-negative decimal string
  registryVersion,
  registryDigest,        // SHA-256 hex digest
  registryStatus: "CURRENT",
  revokedEntries: [
    { sourceId, feedId, policyVersion }
  ]
}
```

This illustrates the data contract, not a selected implementation or a production payload. `verificationStatus` must mean that the provider has independently verified the current-state evidence; it must not merely echo a caller-supplied flag.

### Required provider guarantees

The provider must:

- authenticate its authority reference and the evidence for the checkpoint;
- establish that the checkpoint is current, not merely a correctly signed historical checkpoint;
- reject rollback/replay, including after process or machine restart;
- verify a canonical monotonic `controlSequence`;
- return the exact registry sequence/version/digest currently authoritative for the requested policy;
- return the complete revocation overlay effective at that checkpoint;
- fail closed when evidence is missing, stale, ambiguous, conflicting, revoked or unavailable.

An unverified HTTP response, a fresh transport timestamp, a valid signature over an old checkpoint, or a database row without an independently authenticated trust path does not satisfy these guarantees.

## 4. Consumer acceptance rules

Before returning a source observation to the normalizer, the adapter must:

1. verify the signed registry snapshot;
2. resolve currentness for the requested policy on every lookup;
3. reject a currentness result not explicitly verified by its trusted provider;
4. compare policy, registry sequence, version and digest exactly;
5. reject a snapshot whose sequence is lower than the current checkpoint as stale/rolled back;
6. reject a snapshot whose sequence is higher than the checkpoint as ahead of authoritative state;
7. reject a checkpoint whose registry status is not `CURRENT`;
8. reject the exact `sourceId + feedId + policyVersion` tuple if present in the current revocation overlay;
9. reject an entry whose activation state is not exactly `ACTIVE`;
10. return the currentness authority/checkpoint references and sequences alongside the registry binding for evidence tracing.

No alternate feed, legacy quote, or older snapshot may be substituted silently.

## 5. Sequence rollback and equivocation

The implementation maintains a process-local high-water mark per policy:

- lower `controlSequence` than previously accepted: reject;
- same `controlSequence` but changed currentness state: reject as equivocation;
- higher `controlSequence`: accept only if every currentness and source check also passes.

The fingerprint covers authority/checkpoint references, policy, control sequence, current registry sequence/version/digest, registry status and the canonical sorted revocation set.

This in-process guard is defence-in-depth only. It resets on restart and is not an authoritative monotonic store. Durable anti-rollback must come from the currentness provider's authenticated source or a separately persisted/consensus-backed checkpoint with an approved trust model.

The registry sequence advances when the registry snapshot changes. The control sequence must also advance when currentness/revocation state changes even if the registry snapshot itself stays the same. A changed revocation set at an unchanged control sequence is equivocation.

## 6. Revocation semantics

Revocation matching is exact on `sourceId + feedId + policyVersion`. A revoked tuple cannot be returned even if its snapshot signature remains valid. The authoritative currentness record must provide the effective revocation overlay. A newer registry snapshot may also mark an entry inactive, but the consumer must not rely on that alone if a separate revocation can become effective earlier.

This contract does not decide who may revoke a source, how disputes are resolved, or whether/when a revoked source can be reactivated. Those require explicit governance and a new accepted policy/version.

## 7. Authority mechanism — unresolved decision

The current repository code implements the consumer boundary and its test fixtures, but **does not yet contain a production currentness provider**. No authoritative endpoint, public key, on-chain state object, light client, signer set, checkpoint store or revocation source has been designated.

Evaluate candidate mechanisms in the project's trust-minimizing order:

1. **Permissionless/verifiable current state:** verify canonical current registry state directly from the authoritative ledger/protocol, or by a proof whose verifier establishes canonicality and finality. The adapter may fetch evidence but must not choose which state is canonical.
2. **Proof-backed or governed attestation:** if direct verification is infeasible, bind the exact registry head and revocation state to a verifiable proof or an explicitly governed attestation. Its trust assumptions must be documented.
3. **Trusted service with durable monotonic checkpoint:** only as an explicit fallback; document the operator, signing key lifecycle, durable anti-rollback storage, availability risks and source-revocation trust assumptions.

This is an evaluation order, not approval of a specific chain, contract, source, signer set, quorum or attestation scheme. The universal IMMORTAL economic kernel must remain independent of this adapter-level authority mechanism.

## 8. Implemented coverage and remaining proof gap

The focused GitHub Actions run [#40823474832](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/40823474832) passed 3 files / 50 tests, including rejection of stale/ahead snapshots, checkpoint digest mismatch, revoked source/feed/policy tuples, unverified currentness, local sequence rollback and same-sequence equivocation.

These tests verify boundary logic with generated fixtures. They do **not** prove that a real currentness provider exists, that the provider's response is cryptographically authentic, or that its monotonic state survives restart.

## 9. Explicit non-regression

- No source or feed is activated by this contract.
- No quorum, aggregation rule, confidence/divergence threshold, freshness duration, fallback or USD/USDM conversion is selected.
- No production relayer/consumer is wired to this provider.
- Do not change the universal IMMORTAL kernel, economic constants, V3, Reveal, deployed Oracle State semantics or Issue Admission rules here.
- Do not sign, submit or approve an on-chain transaction as part of this contract.

Conclusion: the anti-rollback/revocation boundary is now testable, but the actual source of currentness remains an open authority decision and must be implemented and independently verified before the multi-oracle registry can be considered production-authoritative.
