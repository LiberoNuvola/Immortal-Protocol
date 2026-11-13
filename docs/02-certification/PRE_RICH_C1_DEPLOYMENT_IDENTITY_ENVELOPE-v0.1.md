# PRE-RICH C1 Deployment Identity Envelope — Addendum v0.1

**Status:** NON-NORMATIVE IMPLEMENTATION / EVIDENCE CONTRACT  
**Owner:** Agent A — C1 / ProtectedCapital source identity  
**Branch:** `work/immortal-green-closure`  
**Baseline:** `b835bc3e342ac1471e93fd70ae27b542591404af`  
**Purpose:** Specify the authority and identity boundary required before the acquired-point C1 observer may query the five PRE-RICH state surfaces as one deployment.

This addendum supplements `PRE_RICH_C1_ACQUIRED_POINT_CENSUS_CONTRACT-v0.1.md`. It does not alter economic rules, 500×, V3/Reveal, datum ABI, admission ABI, validator behavior, Treasury accounting, Genesis, or ledger state. It authorizes no signature, transaction, deployment, funding, or admission.

## 1. Two distinct questions

The observer must not collapse these claims:

1. **Identity consistency:** do the address, payment credential, script bytes/parameters, policy ID, token name, and observed UTxO agree with one another?
2. **Deployment authority:** is this the deployment that the protocol's authorized governance/deployment process approved?

A self-hash, address/payment-credential match, policy/token match, or successful live query can support identity consistency. None independently authenticates who authorized the deployment.

The existing `preprod-protected-capital-deployment-identity.mjs` explicitly returns:

- `manifestIntegrity = SELF_HASH_MATCH_NOT_SIGNATURE_AUTHENTICATION`;
- `manifestAuthorityCryptographicallyVerified = false`.

This status must remain visible in every derived packet until an independent trust chain is verified. Do not rename it to “verified deployment”.

## 2. Required authority chain

A deployment identity envelope is eligible for C1 only when all of the following are independently verifiable:

1. **Governed trust root:** the public verification key or attestation trust policy is anchored outside the deployment manifest being verified. Its fingerprint, purpose, owner, validity interval and rotation/revocation procedure must be recorded in a reviewed governance-controlled source.
2. **Authorized workflow provenance:** the deployment evidence is bound to the exact repository, protected deployment workflow path/ref, source commit, workflow run ID, and protected-environment approval record. A generic Actions run or a self-asserted JSON field is insufficient.
3. **Cryptographic artifact attestation:** verify a detached signature or GitHub artifact attestation over the exact canonical manifest bytes and artifact digest. Verify issuer, repository identity, workflow identity, subject digest and run/source commit. Preserve the verification result and trust-root version.
4. **On-chain materialization:** verify deployment transaction references and exact live UTxO identities at the acquired Preprod point. A signed manifest does not prove that the deployment remains live or unspent.
5. **Re-derivation:** independently rebuild the relevant Plutus scripts and policies from the pinned source commit and deployment parameters. Compare resulting hashes/IDs and addresses to the signed record and live UTxOs.

A signature by a wallet key is evidence that the key signed; it does not by itself establish that the key was authorized to select the canonical deployment. The governance trust root must authorize that signer/workflow for this deployment purpose.

If the repository does not yet have a governed trust root and a verifiable deployment attestation path, report `deploymentAuthorityVerified=false` and stop before treating any address as canonical. Do not bootstrap trust by trusting a key or fingerprint supplied only inside the manifest.

## 3. Canonical envelope fields

The signed/attested payload must be canonical JSON (UTF-8, deterministic key ordering, no duplicate keys, integers represented without floating-point conversion). The exact canonical bytes are the signed subject.

Minimum top-level fields:

- `schema`: `IMMORTAL-PREPROD-DEPLOYMENT-IDENTITY-v0.1`;
- `network`: `cardano-preprod` and network ID 0;
- `deploymentId`: stable identifier for this exact deployment generation;
- `source`: repository, branch/ref, full 40-hex commit SHA, relevant script/profile source paths and content digests;
- `workflow`: workflow path, immutable workflow ref/commit, run ID, run attempt, protected environment name and approval evidence reference;
- `authority`: trust-root ID/version, signer identity, signature/attestation format, verification algorithm, signature/attestation reference and verification status;
- `deploymentTransactions`: exact transaction hashes and output indices for every materialized deployment output;
- `components`: the five component records below;
- `createdAt`: informational timestamp only; never a substitute for a ledger point;
- `supersedes`: prior deployment ID, or explicit null for the first authorized generation.

The verifier must reject unknown schema versions, missing required fields, duplicate component IDs, non-Preprod network IDs, malformed hashes, stale/revoked trust roots, unverified signatures, workflow/source mismatch, and an ambiguous or superseded deployment.

## 4. Five component identity records

Every component record carries `componentId`, `address`, `paymentCredentialKind`, `paymentCredentialHash`, `scriptArtifactDigest`, `derivedScriptHash`, `sourceCommit`, `parameterDigest`, `deploymentTxOutRef`, and `liveObservationRequired=true`. The exact type-specific fields follow.

### 4.1 PrizeValidator

- Derive the parameterized Plutus V2 validator from the pinned source commit and exact Prize parameters.
- Bind the Preprod address payment script credential to the derived PrizeValidator hash.
- Bind the configured Ticket policy ID and the Pool script hash used in the PrizeDatum schema.
- This is a **population address**, not a singleton carrier. Do not require one PrizeValidator UTxO or invent a PrizeValidator singleton token.
- Query and preserve the complete provider-returned UTxO population at the acquired point; every item is classified or blocks as L6.

### 4.2 B1 PrizePool

- Derive the parameterized Plutus V2 validator and bind its payment credential to the Preprod address.
- Bind the exact B1 authority singleton `policyId + tokenNameHex`; live state must contain exactly one UTxO carrying quantity 1 of that unit at the expected address.
- Preserve the exact configured direct-tUSDM unit separately from the B1 authority singleton.
- Decode the current B1 datum schema and bind its PrizeValidator hash to the independently derived PrizeValidator identity.

### 4.3 Counter

- Derive the Counter validator hash and Preprod address from the pinned script source/topology.
- The current Issue reader's contract is exactly one UTxO at the configured Counter address. Do **not** invent a Counter singleton policy/name: the inspected reader does not select Counter by an authority asset unit.
- Preserve the sole Counter out-ref, address, value and datum evidence. Zero or more than one UTxO is an identity/state ambiguity and blocks this C1 observation.

### 4.4 V3 economic-state carrier

- Bind the deployed V3 carrier validator address to its derived script hash.
- Bind the exact carrier minting policy ID and token name; require exactly one live UTxO with quantity 1 of that unit at the expected address.
- Preserve the carrier deployment transaction reference, script artifact digest, parameter digest, authority public-key binding and initial/current datum evidence.
- The V3 carrier identity must be tied to the same authorized deployment generation as the PrizeValidator/B1/Counter records, not merely to a separate environment variable.

### 4.5 B2 control carrier

- Bind the B2 control validator address to its derived script hash.
- Bind the exact B2 control policy ID and token name; require exactly one live UTxO with quantity 1 of that unit at the expected address.
- Preserve its deployment transaction reference, authority payment-key identity, script/parameter digest and datum evidence.
- Record B2 as a separate control identity. Do not infer that a reader-side reference or matching V3 projection proves on-chain Issue enforcement; that is a distinct Agent B / ABI boundary.

## 5. Cross-component consistency checks

Before the acquired-point observer may query all five addresses, require:

- all five records have the same authorized `deploymentId`, network and source deployment generation;
- PrizeValidator and B1 addresses are re-derived from exact script source and parameters;
- Counter address is re-derived from the same deployment topology, not copied only from a stale environment file;
- V3 and B2 script/policy/token identities match their independently attested deployment artifacts;
- every configured address decodes as a Preprod address and its payment credential matches the expected derived hash;
- every singleton unit is a 28-byte policy ID plus a valid 1–32-byte token name, quantity exactly one in exactly one UTxO;
- Counter has exactly one UTxO at its address under the current reader contract;
- all five live queries occur within one acquired Ogmios ledger state, with exact acquire acknowledgement, point checks and successful release;
- B1's Prize hash equals the derived PrizeValidator hash;
- V3 aggregates reconcile with B1 at the same point;
- PrizeValidator items classify through the existing item-ledger implementation and reconcile L1/L3 with B1/V3.

Any missing or mismatched component blocks the whole C1 packet. Do not partially certify a four-of-five observation as C1.

## 6. Explicit current gaps

At the reviewed baseline, the existing ProtectedCapital deployment identity loader binds the historical PrizeValidator and B1 Pool deployment manifest plus Oracle identity. It does not establish a cryptographically authenticated authority chain and does not provide one unified, authorized five-component identity envelope.

The existing V3 and B2 deployment scripts write separate deployment evidence files. Their existence does not automatically bind those artifacts to the same authorized generation as PrizeValidator/B1/Counter. The Issue reader observes Counter as one address UTxO, while B1, V3 and B2 use their own configured singleton units.

The acquired-point Ogmios observer already proves the mechanics of acquiring one point and querying selected addresses in one session. Its existing Preprod evidence used historical PrizeValidator/B1 candidate addresses; it is not evidence that the five identities above have been revalidated together.

Therefore, at this baseline:

- `acquiredPointMechanicsPreviouslyDemonstrated=true`;
- `fiveComponentIdentityEnvelopeVerified=false`;
- `deploymentAuthorityVerified=false`;
- `C1Qualified=false`;
- `PA1toPA7Qualified=false`.

These values describe evidence status, not protocol economic state.

## 7. Required negative tests

The envelope verifier and C1 adapter must reject:

1. a valid self-hash with no external trust-root verification;
2. signature valid under an unapproved, expired or revoked key;
3. attestation from the wrong repository, workflow path/ref, commit, run ID or artifact digest;
4. a deployment manifest superseded by a later authorized generation;
5. one component sourced from a different deployment ID or source commit;
6. address/payment credential mismatch or non-Preprod network ID;
7. changed script bytes, parameter digest, validator hash or minting policy ID;
8. missing/duplicate B1, V3 or B2 singleton; wrong token name or quantity other than one;
9. Counter with zero or multiple UTxOs at its configured address;
10. PrizeValidator incorrectly treated as a singleton, or an unclassified PrizeValidator UTxO omitted from the population;
11. any component queried outside the acquired point or after release;
12. a live UTxO reference/value/datum that differs from the signed deployment record's expected materialization.

## 8. Ownership and non-goals

This document defines evidence and identity prerequisites only. It does not create a trust root, sign a manifest, approve a deployment, or make the deployment canonical. Establishing the trust root and protected deployment-attestation process requires an explicit governance/maintainer decision.

Agent A owns the C1 identity/evidence producer. Agent B must review the on-chain binding consequences before any attempt to make the census a production Issue precondition. Do not change `PreprodAuthoritativeIssueProvider`, `readPreprodIssueObservation`, validators, V3/Reveal, or admission ABI as part of this addendum.

**Disposition:** first establish an authorized five-component deployment envelope; then implement the five-address acquired-point observer using the existing Ogmios acquire/release lifecycle. Until both exist and are independently tested, C1 remains OPEN and no first-Issue readiness claim follows.


## 9. Governance dependency — no trust mechanism is selected

The repository's `GOV-30-AUTHORITY-ROLE-AND-KEY-LIFECYCLE-OPTIONS.md` is explicitly a **DISCUSSION DRAFT — NO NORMATIVE DECISION / NO IMPLEMENTATION AUTHORIZED**. It records open alternatives for issuer identity, key binding, verifier/appraiser, relying authority, activation, rotation, revocation, compromise and historical verification.

Accordingly, this C1 addendum states the evidence properties that a future authorized deployment identity process must satisfy; it does **not** select or authorize a concrete trust-root product, key registry, signer, certificate authority, GitHub artifact-attestation profile, custody model, quorum, or revocation mechanism. GitHub workflow provenance and artifact attestation are candidate evidence mechanisms only until their issuer, relying authority, appraisal policy and governance binding are explicitly approved.

The C1 producer must therefore remain fail-closed while GOV-30's relevant authority decisions are unresolved. It may continue read-only source inspection and identity-consistency checks, but must not label a deployment authority-authenticated or promote a self-hash, wallet signature, workflow run, branch protection setting, or artifact attestation alone into deployment authorization.

This dependency is deliberately separate from the five-address acquired-point mechanics. The latter can be implemented and fixture-tested as a read-only observer once its input identity records are supplied; a successful observer run still cannot close deployment authority or PA1–PA7 without the governed reliance decision.
