# Semantic Review — B2 Control Carrier Single-Signer Boundary

**Review date:** 2026-10-21  
**Review ID:** `SEM-B2-CONTROL-SINGLE-SIGNER-BOUNDARY-2026-10-21`  
**Protocol-source snapshot:** `3373b3044b9c251da1ec217d128f5dcb3c87c894`  
**Current documentation HEAD observed during review:** `d3096af33b3d5694dead6512eeb580c7e7c2cdfc`  
**Scope:** static source/workflow review of PRE-RICH B2 control-token genesis, on-chain state transitions, off-chain observation, threshold-attestation service, deployment workflow and related test source. No tests were run and no workflow was dispatched by this review.

## Disposition

**B2 is not evidenced as a trustless / permissionless control-transition path.** The Plutus carrier currently authorizes transitions through one configured `PubKeyHash`. Its observation/decision references are checked for non-emptiness but are not authenticated or bound to a verified threshold-attestation payload by the validator. The repository also contains an off-chain Ed25519 committee/quorum verifier, but the reviewed on-chain carrier does not consume or verify that result.

This can constitute a deliberately trusted, single-key application authority, but it must not be described as an on-chain threshold / trustless control mechanism. The PRE-RICH B2 design already labels itself a closure candidate and says implementation is not closed. This review does not invent a replacement authority protocol or change class-control semantics; it makes the current boundary explicit.

## Findings

### F-B2-01 — State transitions are authorized by one configured signer, not committee quorum

At `PRE-RICH/onchain/PreRichControlCarrier.hs`, `authoritySigned` searches `txInfoSignatories` for exactly the configured `PubKeyHash authority`. The validator then checks one own script input and output, singleton token conservation, equal input/output `Value`, datum identity/bounds, and incremented state version and transition nonce. Those are useful state-integrity checks, but the authorization primitive is a single configured signing key. The script does not verify the Ed25519 quorum attestations implemented by `services/beacon-b2-verifier/server.mjs`.

The deployment script `scripts/deployPreRichControlCarrier.mts` parameterizes the validator with `PREPROD_CONTROL_AUTHORITY_PKH`; if omitted, it defaults to the deploying wallet's payment key hash. Thus the exact trust boundary is fixed by a deployment parameter and a single signer, not by an on-chain committee threshold.

### F-B2-02 — Decision and observation references are only non-empty byte strings

For `ActivateControl`, the validator enforces monotonic current/highest class values, `newHighest >= newCurrent`, and non-empty decision/observation references. For `ContractControl`, it enforces a non-increasing current class, preserves `HighestClassEverActivated`, and again checks only non-empty references.

The validator does not hash these references to a canonical decision/observation payload, prove their provenance, or bind them to a threshold verification result. It also does not evaluate the PRE-RICH activation predicate described by `PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md`; a configured authority signature can authorize any in-bounds monotonic activation. Therefore the code proves state-transition shape and single-key authorization, not truth of the referenced observation or authorization under a permissionless predicate.

### F-B2-03 — The committee verifier is off-chain and disconnected from the Plutus transition guard

`services/beacon-b2-verifier/server.mjs` supports a configurable Ed25519 committee and threshold, rejects duplicate/unknown member attestations, verifies signatures over a canonical envelope, and returns `valid` / `quorumReached`. Its test starts this HTTP server locally, creates synthetic keys, checks a two-of-three positive case, and rejects a changed beacon payload.

This is scoped evidence that an off-chain verifier and synthetic tests exist. The reviewed `PreRichControlCarrier.hs` does not consume the envelope, proof digest or quorum output and contains no equivalent signature/quorum verification. No reviewed B2 transaction path binds the service's result to the datum transition. An HTTP response, test pass, or configured threshold is not on-chain enforcement.

### F-B2-04 — Mint policy fixes the singleton quantity, not its destination

`PreRichControlCarrierMintPolicy.hs` requires the configured seed UTxO to be consumed and requires the complete mint field to equal one unit of the policy's configured token name. This supports a one-time singleton-token identity and rejects additional mint entries in that policy execution. It does not inspect `txInfoOutputs`, constrain the minted token to the configured carrier script address, or authenticate the initial datum in the minting transaction. Placement into the intended carrier is performed by `deployPreRichControlCarrier.mts`, which attaches the policy and pays the token plus inline datum to the derived script address.

That is a deployment/bootstrap boundary, not a claim that the mint policy itself binds token genesis to the carrier destination. The one-time deployment transaction and its observed output must remain part of the evidence packet.

### F-B2-05 — Off-chain observation is fail-closed, but it is not a ledger proof or transition authorization

`PreprodB2ControlObservation.ts` re-queries UTxOs at the configured address and requires exactly one matching singleton with inline datum, decodes six fields, checks class/version/nonce bounds, and validates the configured policy and token-name identity. The tests exercise this helper against mocked UTxO responses and constructed datum CBOR (single match, duplicates, missing datum, binding mismatch, and invalid class bounds).

These checks are useful read-side admission safeguards. They do not execute the Plutus validator, prove a committee quorum, or alone prove that the same exact control UTxO is included as the reference input in a real Issue transaction.

### F-B2-06 — The conformance workflow can miss changes to the actual on-chain source and reuse stale artifacts

`.github/workflows/pre-rich-b2-control-conformance.yml` has a push path filter for the workflow, Plutus files, `src/**`, `Adapter/**`, `relayer/**` and other application paths, but omits `PRE-RICH/onchain/**`, where both reviewed Plutus control scripts live. Its artifact cache key likewise hashes `plutus/**/*.hs`, Cabal files, setup action and lockfile, but not the two `PRE-RICH/onchain` files. Consequently, changing only `PreRichControlCarrier.hs` or `PreRichControlCarrierMintPolicy.hs` need not trigger this push workflow, and a manual run can restore cached artifacts whose key does not change with those source blobs.

The separate `.github/workflows/pre-rich-b2-control-preprod.yml` is manual-only and its cache key does include both on-chain source files. This review did not dispatch it or deploy a new singleton. The conformance job builds/exports Plutus artifacts and runs TypeScript/Node observation/provider tests; the workflow steps do not run a dedicated Plutus negative-vector suite for the carrier transition validator.

## SHA-pinned evidence register

All source identities below are from the fixed protocol-source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`, unless otherwise noted.

| Path | Blob SHA | Classification |
|---|---|---|
| `PRE-RICH/onchain/PreRichControlCarrier.hs` | `ce5a73dd29894367f031924e5a282935d8d3d66f` | `REVIEWED_STATIC_SINGLE_SIGNER_AUTHORITY_NOT_COMMITTEE_PROOF` |
| `PRE-RICH/onchain/PreRichControlCarrierMintPolicy.hs` | `03e6b4bc9caf8866eca57c4ba1e987799cb49b15` | `REVIEWED_STATIC_SEED_AND_MINT_QUANTITY_NOT_DESTINATION_BINDING` |
| `Adapter/CARDANO/observation/PreprodB2ControlObservation.ts` | `0a55665be48e1af5cd181a5f63c5fcc0b6fff7ff` | `REVIEWED_STATIC_FAIL_CLOSED_OFFCHAIN_OBSERVATION_ONLY` |
| `src/__tests__/preprodB2ControlObservation.test.ts` | `d0db4e1f76420efa85894928897a1d0c87a6bad5` | `REVIEWED_TEST_SOURCE_MOCKED_UTXO_OBSERVATION` |
| `.github/workflows/pre-rich-b2-control-conformance.yml` | `4f64cd83f78530fd707a91071d4fe7687a73f5d1` | `REVIEWED_WORKFLOW_PATH_AND_CACHE_KEY_OMIT_ONCHAIN_SOURCES` |
| `.github/workflows/pre-rich-b2-control-preprod.yml` | `b2b38a8007a15d293884453b6751b38eb7368d67` | `REVIEWED_WORKFLOW_MANUAL_DEPLOYMENT_NOT_DISPATCHED` |
| `scripts/deployPreRichControlCarrier.mts` | `90878b0790e9ea404028b340ede9239888b8d6eb` | `REVIEWED_STATIC_DEPLOYMENT_SELECTED_SINGLE_AUTHORITY_AND_OUTPUT` |
| `PRE-RICH/docs/B2-AUTHENTICATED-CONTROL-DESIGN-v0.1.md` | `82365b9175599ae35ce9ae5f1f4d240c9291a4bc` | `REVIEWED_DESIGN_CLOSURE_CANDIDATE_NOT_APPROVED` |
| `services/beacon-b2-verifier/server.mjs` | `f5236dc5c0f8f4f675ec338f367dc67433fae085` | `REVIEWED_STATIC_OFFCHAIN_QUORUM_VERIFIER_NOT_BOUND_ONCHAIN` |
| `services/beacon-b2-verifier/test.mjs` | `62dea9dbbfc4b90302eb9d16d1780f25eedf6b1a` | `REVIEWED_TESTS_SYNTHETIC_OFFCHAIN_QUORUM_ONLY` |

The B1 Issue-admission files `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` and `src/preRichIssueAdmissionBridge.ts` were reviewed separately in semantic slice 2. That earlier review does not elevate the B2 transition to committee-authorized or on-chain trustless status.

## Required closure gates — no policy change authorized here

1. Freeze the intended B2 authority model in the existing source-of-truth hierarchy: explicitly permissioned single-key application governance, or an already-approved on-chain-verifiable threshold/proof path. Do not silently present the present single-signer script as the latter.
2. If trustless/permissionless operation is required, bind the exact decision/observation commitment and authority/quorum proof to the consumed control datum transition under an approved proof contract. Do not treat a service response or a non-empty reference as proof.
3. Reconcile the documented PRE-RICH activation predicate with the actual on-chain acceptance boundary; do not invent or port new thresholds/rules in this audit.
4. Make the B2 conformance workflow react to changes in `PRE-RICH/onchain/**` and include those source identities in artifact cache invalidation; add dedicated on-chain negative vectors for unauthorized signer, fabricated/unbound references, invalid class transitions, datum/token substitution and replay.
5. Keep the manual Preprod deployment separate. Require a new exact-source build, submitted transaction, observed singleton UTxO, deployment evidence packet and post-deployment adversarial transition evidence before marking B2 live/green.

**Current verdict:** B2 control carrier source exists and enforces state-shape plus single-key authorization. **Threshold / trustless transition binding is not established; real Preprod deployment/transition acceptance is not established by this review.** Static review only; no tests rerun, no workflow dispatch, no mint/submit/deployment, and no protocol source or transition semantics changed.
