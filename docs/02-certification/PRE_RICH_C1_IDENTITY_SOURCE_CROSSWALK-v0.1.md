# PRE-RICH C1 — Deployment Identity Source Crosswalk v0.1

**Status:** READ-ONLY SOURCE AUDIT / NON-NORMATIVE  
**Owner:** Agent A — C1 identity and evidence  
**Branch:** `work/immortal-green-closure`  
**Reviewed source commit:** `d58c17b6c572fc54a7d00919c9bcc6bc14902407`  
**Purpose:** Map the identity fields currently emitted by the separate deployment producers to the five-component C1 identity envelope. This document records evidence gaps; it does not authorize a deployment, select a trust root, or change protocol semantics.

## 1. Executive result

The repository has separate producers for the historical direct-USDM/B1 deployment, V3 carrier, and B2 control carrier. The current C1 observer accepts a structurally complete five-component candidate envelope, but deliberately does not authenticate its authority or independently re-derive all scripts.

The producers do not yet emit one unified, cryptographically authorized five-component deployment generation. In particular:

- the direct-USDM manifest supplies PrizeValidator and B1 topology hashes/addresses, but does not supply a Counter address or a complete five-component deployment identity;
- the V3 and B2 deployment evidence records are separate and do not, in the inspected producer code, bind themselves to the same authorized deployment ID/source commit as the B1/Prize generation;
- the current observer's structural envelope fields include source commit, payment credential, derived script hash, parameter digest and deployment out-ref for every component, but those values are not all emitted by the current deployment producers;
- a self-hash, wallet signer address, successful workflow, or live UTxO query does not establish deployment authority.

Therefore **C1 remains OPEN**. Do not fill missing fields with inferred or copied values merely to make the envelope pass.

## 2. Source-to-envelope crosswalk

| C1 component | Existing source | Fields evidenced by producer | Material gaps |
|---|---|---|---|
| PrizeValidator | `audit/cardano-integration/preprod-direct-usdm-bootstrap.mjs` → direct-USDM deployment manifest; B1 script provenance artifact | Prize script hash, Prize address, Ticket policy ID, deployment manifest hash | No external authority attestation; no unified C1 deployment ID; script artifact digest and parameter digest not emitted as a governed identity record; historical address provenance still requires revalidation |
| B1 Pool | Same direct-USDM deployment manifest and live B1 Pool observation | B1 script hash/address, Pool singleton policy/name/unit, bootstrap transaction, observed Pool UTxO ref and direct-USDM unit | Manifest self-hash is not signature authentication; no complete signed/attested five-component generation; parameter and artifact digests not bound into a common authority record |
| Counter | Direct-USDM manifest topology includes `counterHash` and `counterAddress`; Counter validator source is `plutus/CounterValidator.hs` | Counter script hash and address derived by `buildScriptsFromLucid()` are now persisted in the topology record | No Counter deployment transaction/out-ref for script materialization in the inspected manifest; no common deployment-generation binding; the address is derived identity only, not authority or proof of a live UTxO. Do not invent a Counter singleton token |
| V3 carrier | `scripts/deployV3Carrier.mts` → `audit/preprod-issue/v3-carrier-deployment.json` | Preprod network, seed ref, policy ID, token name, unit, carrier address, deployment transaction, state UTxO ref, signer address, authority public key, initial datum | Separate deployment record; no shared C1 deployment ID/source commit/attestation; no explicit script artifact digest or parameter digest in emitted evidence; no governed binding to Prize/B1/Counter/B2 |
| B2 control | `scripts/deployPreRichControlCarrier.mts` → `audit/preprod-issue/b2-control-deployment.json` | Preprod network, seed ref, policy ID, token name, unit, control address, deployment transaction, state UTxO ref, signer address, control authority PKH, initial datum/state | Separate deployment record; no shared C1 deployment ID/source commit/attestation; no explicit script artifact digest or parameter digest in emitted evidence; no governed binding to Prize/B1/Counter/V3 |

## 3. Concrete source observations

### 3.1 Direct-USDM / Prize / B1

The direct-USDM producer writes a manifest with schema `IMMORTAL-PREPROD-DIRECT-USDM-DEPLOYMENT-v0.1`, network `cardano-preprod`, profile candidate `PRE-RICH-EEV-USDM-DIRECT-V1`, bootstrap transaction, B1 singleton policy/name, direct-USDM unit, topology hashes and Prize/B1 addresses, plus the B1 Pool UTxO reference.

The topology object now contains `counterHash`, `counterAddress`, `registryHash`, `treasuryHash`, `prizeHash`, `b1PrizePoolHash`, `ticketPolicyId`, `prizeAddress` and `b1PrizePoolAddress`. `counterAddress` is copied from the address already derived by `buildScriptsFromLucid()`; it is not a Counter deployment out-ref, live observation, or authorization proof. The manifest still does not contain a Counter materialization reference.

The existing identity loader explicitly labels manifest integrity as `SELF_HASH_MATCH_NOT_SIGNATURE_AUTHENTICATION` and `manifestAuthorityCryptographicallyVerified=false`. This is the correct fail-closed interpretation.

### 3.2 V3

The V3 producer derives the minting policy from its selected seed reference and token name, derives the carrier validator/address from the policy, token name and authority public key, then writes a separate evidence file. Its emitted evidence includes the deployment transaction and carrier state reference. It does not emit a C1 deployment ID, source commit, script artifact digest, or parameter digest in the inspected evidence object.

### 3.3 B2

The B2 producer derives the minting policy from its selected seed reference and token name, derives the carrier validator/address from the policy, token name and control authority PKH, then writes a separate evidence file. It records the deployment transaction, state reference, signer and control authority. It does not emit a C1 deployment ID, source commit, script artifact digest, or parameter digest in the inspected evidence object.

### 3.4 Counter

The C1 cardinality contract correctly treats Counter as exactly one UTxO at its configured/re-derived address and does not invent a Counter singleton asset. The direct-USDM manifest now contributes the Counter validator hash and the address derived alongside it by `buildScriptsFromLucid()`. Counter materialization provenance remains absent and must be independently observed; this is not a reason to add a new token convention.

## 4. Observer boundary

`audit/cardano-integration/preprod-c1-acquired-point-observer.mjs` performs structural validation of the supplied five-component envelope and queries all five addresses through one active acquired Ogmios ledger session. Its output explicitly retains:

- `identityConsistency: STRUCTURAL_INPUT_CHECKS_ONLY`;
- `deploymentAuthorityVerified: false`;
- `c1Qualified: false`.

The observer does not authenticate the deployment, re-derive scripts, classify PrizeDatum rows, or qualify C1. The cardinality decoder handles B1/V3/B2 singleton quantities, Counter's one-UTxO rule, and PrizeValidator's population-census shape. PrizeDatum classification and B1/V3 reconciliation remain separate gates.

## 5. Safe next work

The next implementation should be limited to a **read-only evidence normalizer/validator** for the three existing deployment evidence formats. It should:

1. load the direct-USDM, V3 and B2 evidence artifacts without modifying them;
2. preserve their original digests and provenance references;
3. expose which required C1 fields are present, absent, or only inferred;
4. reject any attempt to synthesize Counter address, deployment ID, source commit, parameter digest, artifact digest, or authority status;
5. emit a gap report, not an authenticated identity envelope;
6. leave `deploymentAuthorityVerified=false` and `c1Qualified=false` unconditionally until GOV-30 is resolved and an independently verified trust chain exists.

Before implementing even that normalizer, obtain the exact Counter address/materialization source from an authoritative deployment artifact or derive it from the pinned topology and preserve the derivation evidence. Do not use the historical candidate address as canonical solely because it was queried successfully.

## 6. Explicit non-actions

This audit does not:

- choose a signer, CA, key registry, trust root, quorum, custody model, or revocation policy;
- authorize or sign any manifest;
- create or deploy a contract, mint or spend a token, or submit a transaction;
- alter V3, Reveal, ABI, validator/economic semantics, EEV, ProtectedCapital, or Issue admission;
- change the production `PreprodAuthoritativeIssueProvider` or the Agent B boundary;
- qualify C1, PA1–PA7, or first-Issue readiness.

**Disposition:** separate deployment evidence is sufficient to identify the missing integration fields, but not sufficient to assert one authorized deployment generation. C1 remains OPEN.
