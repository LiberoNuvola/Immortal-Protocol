# JEV Materios Evidence Ingress Contract v0.1

**Status:** Draft contract for IMMORTAL-owned integration. It does not modify Materios.
**Scope:** Read-only ingestion of evidence produced by the existing Materios RPC / PRE-RICH adapter boundary into JEV.
**Non-goal:** This contract does not establish GRANDPA finality, storage inclusion, canonicality, economic solvency, or authorization by itself.

## 1. Ownership boundary

- Materios remains an external system. IMMORTAL MUST NOT require changes to Materios internals or its consensus implementation.
- The IMMORTAL-owned ingress adapter reads outputs exposed by Materios' existing interfaces and/or the existing PRE-RICH Materios adapter.
- JEV records and validates evidence metadata and verification outcomes. JEV MUST NOT pretend that recording an artifact cryptographically verifies its claims.
- The economic kernel remains the source of normative economic rules. An Admission Gate is responsible for applying the required policy and failing closed.

## 2. Evidence classes (must not be conflated)

### `materios-checkpoint-observation`

An extracted checkpoint, such as the existing PoC-0 `CanonicalCheckpoint.json`, can provide:
- chain/network identifier and runtime version;
- finalized-head response and block/header fields;
- state root and block hash;
- observed GRANDPA authority list and set ID;
- authority-list commitment and extraction metadata.

This class is **observation/extraction only**. It MUST NOT be represented as proof of independently verified finality, storage inclusion, or canonicality. A deterministic hash/commitment establishes reproducibility/integrity of the committed bytes, not the truth of the source claims.

### `materios-verified-proof`

This class may be used only when a separately identified verifier has actually validated the required cryptographic proof(s) against the exact checkpoint and policy version. The evidence packet MUST identify:
- verifier name and immutable/versioned build or source reference;
- verification policy/version;
- exact checkpoint identity (chain ID, genesis identity where available, block number and hash);
- proof type and digest/reference;
- explicit verification result and machine-readable report;
- any trust assumptions or unresolved limitations.

A field named `proof`, `verified`, or a successful extraction command is not sufficient by itself.

## 3. Minimum ingress envelope

The IMMORTAL-owned adapter SHOULD emit a normalized envelope with the following logical fields. This is an ingress contract, not a replacement for Materios' native format.

```json
{
  "contract": "immortal.jev-materios-ingress.v1",
  "source": {
    "system": "materios",
    "interface": "json-rpc",
    "chainId": "materios-preprod",
    "endpointId": "configured-source-alias"
  },
  "evidenceClass": "materios-checkpoint-observation",
  "checkpoint": {
    "genesisHash": "0x...",
    "blockNumber": "123",
    "blockHash": "0x...",
    "stateRoot": "0x...",
    "runtimeSpecVersion": 238
  },
  "artifact": {
    "mediaType": "application/json",
    "uri": "artifact-or-immutable-reference",
    "sha256": "64 lowercase hex characters"
  },
  "observation": {
    "observedAt": "ISO-8601 timestamp",
    "extractorVersion": "immutable version/source reference"
  },
  "verification": {
    "status": "OBSERVED",
    "verifier": null,
    "policyVersion": null,
    "reportUri": null
  },
  "limitations": [
    "Extraction only; no independent GRANDPA finality verification",
    "No storage proof or canonicality claim"
  ]
}
```

Values above are illustrative, not real network data. The adapter MUST compute the artifact digest from the actual bytes; it MUST NOT copy an invented digest.

## 4. Validation requirements

The ingress adapter MUST reject or quarantine evidence when:
- required identifiers, checkpoint fields, timestamps, or artifact references are missing or malformed;
- the chain/network identity is not the configured expected network;
- the artifact digest does not match the retrieved bytes;
- a checkpoint number/hash changes between linked records without an explicit new checkpoint identity;
- an observation is outside the consumer's explicitly configured freshness policy;
- a caller labels extraction-only evidence as cryptographically verified;
- evidence provenance cannot be preserved.

Freshness duration is a consumer policy parameter; this contract does not invent a universal timeout. If the consumer requires a fresh observation and freshness cannot be established, the result is BLOCKED, not PASS.

Raw RPC credentials, private keys, secret headers, and sensitive endpoint query parameters MUST NOT be written into the JEV registry or evidence packet. Store a configured source alias and sanitized URI instead.

## 5. Mapping into the JEV Verification Registry

The generic JEV registry remains the canonical normalized record of checks. The ingress adapter creates check entries only for checks actually performed.

Suggested stable check IDs:
- `MATERIOS.CHECKPOINT.EXTRACTION` — PASS only if extraction validation completed and its artifact is referenced; limitations must say that this is not finality proof.
- `MATERIOS.ARTIFACT.INTEGRITY` — PASS only if digest was computed from the artifact bytes and a later comparison matched.
- `MATERIOS.GRANDPA.FINALITY` — NOT_RUN or BLOCKED until an independent verifier actually runs and produces evidence.
- `MATERIOS.STORAGE.PROOF` — NOT_RUN or BLOCKED until a storage proof is checked against the exact checkpoint root.
- `MATERIOS.CANONICALITY` — MUST NOT PASS merely because extraction or hash comparison succeeded.

Every PASS/FAIL needs an explicit evidence reference. Unknown, unavailable, stale, or unverified prerequisites MUST NOT be upgraded to PASS. The existence of a registry artifact is not an overall IMMORTAL conformance result.

## 6. Admission Gate integration

The gate consumes a versioned policy listing mandatory evidence checks for the specific operation. It MUST:
1. bind evidence to the operation, network, checkpoint, and relevant protocol/configuration version;
2. verify that all mandatory checks exist and have acceptable results;
3. reject missing, stale, malformed, mismatched, or untrusted evidence;
4. distinguish `OBSERVED` from cryptographically `VERIFIED`;
5. preserve the exact registry/policy/evidence references used for the decision.

JEV itself does not authorize a transaction. A registry with PASS entries is not a substitute for economic-kernel checks or the Admission Gate.

## 7. Existing implementation boundary and rollout

The repository already contains a Materios PoC-0 extraction path and a separate Materios GRANDPA evidence-adapter PoC. Their claims must remain scoped to the tests and proof boundaries they actually implement. In particular, the PoC-0 README explicitly says it does not verify GRANDPA finality, storage proofs, or canonicality.

Rollout sequence:
1. Review this contract against the actual output of the existing Materios PoC-0 and adapter; do not change Materios.
2. Add contract/schema tests for valid observation, digest mismatch, wrong network, stale observation, and attempted promotion from observation to verified proof.
3. Implement the IMMORTAL-owned ingress mapper as a separate module.
4. Emit JEV registry entries with source artifact references and explicit limitations.
5. Connect a policy-enforcing Admission Gate only after its mandatory checks are explicitly specified and tested.
6. Keep production/preprod claims separate from mock/devnet results.

## 8. Explicit non-claims

This contract does not claim:
- Materios itself has been modified;
- the existing PoC-0 proves canonicality or finality;
- JEV verifies cryptography merely by recording evidence;
- the Materios adapter or the JEV-to-Admission-Gate integration is production-ready;
- any existing Reveal, V3, or economic-kernel behavior has changed.
