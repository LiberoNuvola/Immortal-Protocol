# Algorithmic Governability — Adversarial Executable Lab v0.1

**Status:** NON-NORMATIVE / EVIDENCE HARNESS  
**Purpose:** executable evidence for the boundary already defined by the Algorithmic Governability canon.

## Scope

This lab does not define new economic or governance rules. It checks two already-stated candidate properties:

1. **No Result-Dependent Authority:** a monitor result may not alter normative authority, the governing metric, the evidence contract, or the admissibility rule unless an explicitly pre-authorized institutional rule already permits that change.
2. **Search non-escalation:** a partial/adaptive search may not convert a partial coverage claim into a complete normative universe, widen its candidate domain, or weaken the immutable safe set merely because of search results.

The harness uses deliberately small immutable toy objects. Passing it is evidence that the implementation preserves these boundaries in the modeled cases; it is not a proof of the entire protocol.

## Evidence model

```text
Immutable Boundary
  ├─ Domain
  ├─ Rule
  ├─ Inputs
  ├─ Limits
  ├─ EvidenceContract
  ├─ Version
  ├─ Contestability
  └─ Exit

Explore → CandidateSet
Certify → admissible / rejected / unverifiable
Adopt → only if Certify(admissible)
```

The lab intentionally gives two monitors identical observations but different derived metrics. The selection rule is predeclared and does not grant either monitor new authority.

## Run

```bash
node audit/algorithmic-governability/no-result-dependent-authority.mjs
```

Expected result: all assertions PASS.

## Non-goals

- no new reward formula;
- no fee formula;
- no governance threshold;
- no economic parameter;
- no claim of cryptographic proof;
- no substitution for AG-01 canonical replay/finality evidence.


## EXP-01 — C17 structural partition boundary

Run:

```bash
node audit/algorithmic-governability/exp-01-c17-structural-partition-boundary.mjs
```

The checker exercises identity uniqueness, declared-bucket membership, exact single assignment, no unclassified source item, snapshot/manifest binding and fail-closed outcomes. Its only positive result is `STRUCTURALLY_VALID_ONLY`. It does not authenticate source completeness, valuation or authority and never declares C17 certified. It is a non-normative conformance prototype, not a production obligation model.


## EXP-06 / EXP-12 — existing signed-binding reuse boundary

Run:

```bash
node audit/algorithmic-governability/exp-06-12-existing-binding-boundary.mjs
node relayer/signedIssueAuthority.test.js
```

The first check audits the already-existing PRE-RICH Issue path; it does not create a new evidence schema or authority service. It verifies that the consumer composes the external Ed25519 authority verifier, exact Cardano input/observation references, EEV approval/source-set digest binding, independent Haskell recomputation of the signed state/action/post-state digests, and the existing economic-admission ↔ canonical-transition evidence binding.

The Ed25519 unit test exercises the verifier's real positive and negative signature cases with ephemeral test keys. No production key or signer is created.

**Scope is deliberately narrow:** this is evidence of the PRE-RICH Issue consumer's existing binding path, not a universal EXP-06 verifier, a generic EXP-12 authority lifecycle, a GOV-27 evidence authenticator, or a live deployment certificate. The audit explicitly retains generic authenticated appraisal and authority lifecycle as OPEN. The Economic Gate continues to consume externally verified conditions; it does not manufacture their truth. GOV-27 evidence references remain structural unless resolved by their separate evidence contract.


## EXP-06 / EXP-12 — trust root and issuer lifecycle boundary

Run:

```bash
node audit/algorithmic-governability/exp-06-12-trust-root-lifecycle-boundary.mjs
```

This source-level guard makes the current PRE-RICH Issue trust model explicit:

- the off-chain verifier receives one externally configured Ed25519 public key and uses it for both the signed Issue payload and the carrier-binding signature;
- the V3 deployment helper embeds the same configured public key into the parameterized carrier validator; the on-chain validator verifies the carrier-binding signature against that parameter;
- the verifier does not currently bind a signed issuer identity/key ID, relying-party audience, appraisal-policy identity, key validity interval, revocation or supersession claim;
- the current freshness check uses the verifier host's `Date.now()`;
- GOV-27 evidence references and the governance RulesetRegistry are not issuer-key authentication or key-lifecycle infrastructure.

The output deliberately distinguishes existing Issue-specific cryptographic reuse from the open universal EXP-06/12 lifecycle. It does not establish production key custody, signer deployment, current live carrier deployment, or a generic trust-root registry. No keys are created, rotated or revoked by this harness.


### Internal prior art mapped by the EXP-06/12 trust-root guard

The guard also checks two adjacent mechanisms without merging their domains:

- **Materios GRANDPA authority-set transition:** `AuthoritySetEvidence` is explicitly untrusted; `TrustedAuthorityState` can only be created from the branded result of an injected `AuthoritySetTransitionProofVerifier`. The transition binds chain/genesis identity, previous and next set IDs, authority-set identity and an activation block. This is a useful transition-boundary pattern, but the POC explicitly says the concrete cryptographic proof verifier is not yet supplied. It is not an issuer-key registry and is not imported as one.
- **PRE-RICH B2 Beacon committee verifier:** it supports configured member IDs/public keys and a threshold, rejecting duplicate or unknown attestations. It remains a separate application-specific off-chain verifier and is not wired into the V3 Issue trust root or the B2 Plutus transition validator.

The guard labels Materios as a transition-boundary pattern only and B2 as a separate application mechanism. Neither is silently promoted to a generic IMMORTAL trust-root lifecycle.
