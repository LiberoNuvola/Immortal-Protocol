# Multi-Oracle Liveness and Registry Boundary v0.1

Status: **PROPOSED TECHNICAL CONTRACT — NON-NORMATIVE**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Scope: read-only audit and interface boundary. No source activation, economic policy, or production wiring is approved.

## 1. Decision

Multi-oracle liveness SHOULD orchestrate and report registry-currentness verification as one health dimension, but MUST NOT become the authority that defines source eligibility, authorizes registry changes, or resolves disputes.

The intended separation is:

1. **Registry authority/currentness:** determines which registry state is authoritative now, including activation and effective revocations.
2. **Liveness observation:** checks whether required evidence and source observations are currently available, well-formed, correctly bound, and timely according to an already approved policy.
3. **Acceptance decision:** a fail-closed consumer applies its explicit policy to the verified registry binding and health evidence. Liveness alone cannot authorize a source or silently select a replacement.

This avoids two disconnected systems duplicating checks while preserving the distinction between authorization and availability.

## 2. Existing evidence reviewed

### 2.1 Cardano Oracle State liveness

`audit/cardano-integration/preprod-oracle-state-liveness.mjs` currently verifies:
- the configured Preprod deployment and Oracle State identity;
- policy/token unit consistency and manifest agreement;
- the unique live singleton and exact UTxO reference;
- presence and decoding of the inline datum;
- quote timestamp age against the configured `maxAgeMs`, using Cardano chain-tip time;
- an observation manifest and evidence digest.

It explicitly records:
- `externalPriceSourceVerified: false`;
- `configuredPublisherTrustIndependentlyEliminated: false`;
- `sourceQualificationStatus: NOT_PROVEN_BY_DATUM_ALONE`.

Therefore, current liveness proves a bounded set of on-chain state and freshness facts. It does not prove external source truth, registry authority, or permissionless source qualification.

### 2.2 Quote-set observation

`audit/cardano-integration/observe-preprod-oracle-quote-set.mjs` is a read-only observation of the configured singleton and visible quote records. It explicitly does not claim external market-price truth or source qualification. It is evidence collection, not a currentness authority.

### 2.3 Multi-oracle structural boundary

`relayer/multiOracleObservation.js` validates observation structure, identity/pair/direction/timestamp-unit/policy binding and payload digest. It explicitly does not provide source authentication or choose freshness, quorum, aggregation, fallback, or USD/USDM conversion policy.

`relayer/multiOracleRegistryBoundary.js` requires an injected registry provider to return a verified, current registry binding before structural normalization. The adapter does not authenticate that provider by itself.

`relayer/multiOracleRegistrySnapshot.js` verifies a signed snapshot against a caller-supplied key and requires an independently trusted currentness provider. Its in-process high-water marks are defense-in-depth only; durable rollback protection must be provided externally.

## 3. Proposed liveness dimensions

A future versioned report MAY expose these dimensions independently. This list is a schema proposal, not an approved set of source-selection rules.

- **registryCurrentness:** `VERIFIED_CURRENT`, `STALE`, `REVOKED`, `UNVERIFIED`, `UNAVAILABLE`, or `INCONSISTENT`.
- **registryBinding:** the exact policy version, registry version/sequence/digest, authority reference, checkpoint reference and currentness control sequence returned by the trusted provider.
- **sourceReachability:** whether the configured endpoint or evidence source could be queried during this observation.
- **observationIntegrity:** whether the response was parseable and its declared source/feed/assets/timestamp units bind to the registry entry.
- **observationFreshness:** measured source timestamp age and the applicable policy reference, without inventing a new duration or threshold.
- **authenticationEvidence:** reference and verification result from the source-specific authentication mechanism, distinct from a mere provenance string.
- **observationIdentity:** source ID, feed ID, base/quote asset, timestamp unit and payload digest.
- **observedAt:** observation time and clock/chain-time basis, clearly distinguished from source-provided time.
- **evidenceReferences:** immutable references or digests for the registry proof, currentness proof and raw/normalized observation evidence.

A report must distinguish “not checked” from “checked and failed”; missing proof must never be represented as success.

## 4. Responsibilities and invariants

### Registry/currentness authority MUST

- establish the currently authoritative registry head and effective revocation overlay;
- authenticate its authority and checkpoint evidence independently;
- prevent rollback/replay across process restarts;
- bind currentness to the exact policy and registry sequence/version/digest;
- fail closed when currentness evidence is missing, stale, ambiguous, conflicting or unavailable.

### Liveness observer MUST

- consume, not invent, the authoritative registry binding;
- check that each observation's source/feed/pair/direction/timestamp-unit identity matches that binding;
- report availability, integrity, freshness measurements and authentication evidence as separate fields;
- preserve evidence references and the time basis used;
- avoid silently substituting another source, feed, registry snapshot or legacy quote;
- avoid treating endpoint reachability, datum presence, a fresh timestamp, or a signature alone as proof of source truth/currentness.

### Acceptance consumer MUST

- require a verified current registry binding before considering an observation;
- fail closed if required liveness dimensions are unavailable, unverified, stale, revoked or inconsistent under the applicable approved policy;
- make any source-selection, quorum, aggregation, divergence, confidence, freshness and fallback decisions only under separately approved policy;
- preserve existing consumer semantics until a separate reviewed change authorizes otherwise.

## 5. State interpretation

The report should expose independent dimensions rather than compress all conditions into one ambiguous “live” boolean. A convenience overall status may be derived only by a documented consumer policy.

Suggested interpretation:
- **usable candidate:** current registry binding verified and required observation checks passed; this is not, by itself, settlement authorization;
- **unavailable:** a required endpoint/evidence provider could not be reached;
- **stale:** an observation or registry checkpoint fails its already-approved freshness/currentness rule;
- **revoked:** the authoritative currentness state marks the exact source/feed/policy tuple or registry digest revoked;
- **unverified:** required authenticity/currentness evidence is absent or cannot be independently verified;
- **inconsistent:** identity, sequence, digest, policy, timestamp-unit, or other required bindings conflict.

These are reporting categories; they do not set thresholds or create fallback behavior.

## 6. Unresolved dependencies

- A production-authoritative `currentnessProvider.resolveCurrentRegistryState` does not yet exist.
- No trust root, authority endpoint, on-chain registry state, light-client proof, signer set, quorum, revocation authority, or proof format has been approved.
- The existing Oracle State publisher is deployment-wallet configured and does not independently establish external price-source truth.
- No feed/source is activated by this document.
- No aggregation, quorum, divergence/confidence threshold, freshness duration, fallback, or USD/USDM conversion policy is selected.
- No production consumer wiring is authorized.

## 7. Non-regression

This contract is documentation-only. It does not authorize changes to the universal IMMORTAL economic kernel, economic constants, Cardano Oracle State semantics, V3, Reveal, Issue Admission, or any deployed validator. It does not authorize signing, submitting, or approving an on-chain transaction. Do not create another branch for this work.

## 8. Recommended next step

Before implementing a shared liveness component, first select and independently verify the registry-currentness authority model in the project's trust-minimizing order: direct verifiable current state, then proof-backed/governed attestation, and only then an explicitly declared trusted-service fallback. Once that authority contract exists, map its verified output into a versioned liveness report and test fail-closed behavior. Until then, the common contract can be specified, but production liveness cannot honestly report registry currentness as verified.
