# Semantic Review — P-06 On-chain Ticket Expiry Policy Binding

**Review date:** 2026-10-21  
**Review ID:** `SEM-P06-ONCHAIN-EXPIRY-POLICY-BINDING-2026-10-21`  
**Reviewed protocol-source snapshot:** `3373b3044b9c251da1ec217d128f5dcb3c87c894`  
**Issue:** [#20 — PRE-RICH: define authoritative ticket expiry policy for first Preprod Issue](https://github.com/LiberoNuvola/Immortal-Protocol/issues/20)  
**Scope:** static review of expiry policy derivation, Issue builder, MintPolicy/PrizeDatum creation, B1 PrizePool TicketIssued, later PrizeValidator time checks, and current expiry tests/workflow. No code change, CI dispatch, Preprod transaction, redeployment or policy redesign was performed.

## Disposition

**P-06 remains OPEN / INTEGRATION_BLOCKED.** The PRE-RICH V1 application policy and time-window mechanics exist, and the on-chain validator enforces the datum's crystallized `expiresAt` at Reveal/Claim/Expire. However, the issuance transaction does not prove that `issuedAt` and `expiresAt` were derived from the authorized `preRichExpiryPolicyV1` and the exact authenticated pre-Issue snapshot. This is an issuance provenance/binding gap, not an unresolved request to invent a universal lifetime or to change PRE-RICH's closed policy.

## F-EXP-01 — The DApp requires an expiry policy, but accepts a caller-supplied policy object

`src/mint.ts` fails closed if `opts.expiryPolicy` is missing. It takes `issuedAtMs = BigInt(Date.now())` from the DApp process and calls `crystallizeTicketExpiry(opts.expiryPolicy, expiryIssuanceState, issuedAtMs)`.

The state input is either:
- caller-supplied `opts.expiryIssuanceState`, for which the builder type says the caller is responsible for sourcing/verifying it; or
- a fallback projection of `authoritativeAdmission.stateHash`, EEV and the V3 carrier observation, only when both `requireCarrierBinding` and `carrierObservation` are present.

`PreRichExpiryPolicy.ts` verifies that the supplied state hash is non-empty, scalar inputs are non-negative, and the supplied `deriveHorizonMs` function is deterministic for two calls. Those are useful structural constraints. They do not authenticate the state hash, prove it represents the exact pre-Issue chain snapshot, or establish that the policy object itself is the authorized policy version. A deterministic, caller-injected policy with a plausible ID/version also satisfies this generic function.

The current PRE-RICH V1 policy is present and versioned: `preRichExpiryPolicyV1`, policy ID `pre-rich-expiry-v1`, version 1, with the application bounds 2 hours–300 days. Its state-derived horizon uses the unresolved-reserve/EEV ratio. Those bounds and semantics must remain PRE-RICH application policy, not IMMORTAL universal constants.

## F-EXP-02 — MintPolicy and B1PrizePool do not bind the issued timestamps to the policy/snapshot

`PrizeDatum` in `plutus/Types.hs` contains `pdIssuedAt` and `pdExpiresAt` (POSIX milliseconds), but does **not** encode the expiry policy ID/version, horizon, issuance-state hash or a digest/certificate tying those timestamps to the authorized policy.

`plutus/MintPolicy.hs` function `newPrizeDatumValid` validates:
- ticket currency/token identity;
- Pool script hash binding;
- commitment equality;
- a clean Pending/BeaconPending datum with zero result/tier/payment-derived fields;
- a matching not-yet-revealed registry target/round.

It does **not** check `pdIssuedAt`, `pdExpiresAt`, their order, the transaction validity interval relative to `pdIssuedAt`, the selected policy version, or any issuance-snapshot digest. The sale path calls this validator before accepting the ticket mint.

`plutus/B1PrizePool.hs`, `TicketIssued priceUsdm`, binds exactly one minted ticket to one Pending PrizeDatum, binds the ticket price/reserve and enforces Pool solvency. It does not validate the ticket expiry derivation or source snapshot.

As a result, a datum may be created with arbitrary timestamp fields while satisfying the reviewed on-chain issuance checks. The transaction is not proven to use the app's output from `crystallizeTicketExpiry`; the builder's local clock and deterministic helper remain off-chain facts unless an explicitly authorized datum/evidence binding is enforced by the transaction validators.

## F-EXP-03 — On-chain lifetime checks correctly enforce the supplied boundary after issuance, but not its provenance

`plutus/PrizeValidator.hs` does the following after issuance:
- `claimBeforeExpiry` requires the transaction validity upper bound to be at or before `pdExpiresAt`;
- `expireAtOrAfter` requires the validity lower bound to be at or after `pdExpiresAt`;
- `identityFieldsEq` preserves `pdIssuedAt` and `pdExpiresAt` when a continuing PrizeDatum is created, preventing later transitions from rewriting the expiry datum.

This is meaningful enforcement of the **stored boundary**. It does not prove that the stored boundary was authorized at mint time. A perfectly enforced arbitrary timestamp is still an arbitrary timestamp.

The local refinement modules `PreRichExpiryEvidence.ts` and `PreRichExpireRefinement.ts` similarly check field ordering, temporal eligibility, exact one-ticket reserve release and aggregate correspondence. They receive already-constructed `issuedAt`/`expiresAt` values; they do not independently validate the original issuance policy or witness against on-chain source data.

## F-EXP-04 — Tests establish application policy and lifecycle predicates, not the production on-chain binding

The current expiry policy test checks deterministic state-derived horizons, clamp bounds, missing hash, negative output, and a generic non-deterministic test policy. Expiry evidence tests check validity-boundary inclusivity, late-reveal inertness and one synthetic connection from a fixture-derived horizon to the timestamp verifier. Expire refinement tests check one-ticket count/reserve release and timestamp threshold. Those are valid unit-level goals, but none proves that production MintPolicy compares the datum timestamps with an authorized policy result or checks the exact authoritative snapshot at the issue transaction.

The workflow `.github/workflows/pre-rich-expiry-conformance.yml` runs the TypeScript/Vitest policy and lifecycle test files only; it does not run the Plutus MintPolicy/B1PrizePool validators or a provider-backed Cardano Issue. Its push path filters refer to `src/__tests__/preRichExpiryEvidence.test.ts` and `preRichExpiryPolicy.test.ts`, while its `pull_request` path filters instead name `PRE-RICH/tests/conformance/PreRichExpiryEvidence.test.ts` and `PreRichExpiryPolicy.test.ts`. On the reviewed tree, the actual test sources are under `src/__tests__`; therefore a PR that only changes those actual source files may not trigger this workflow through the declared PR path filter. This review did not establish a fresh successful run at the current source SHA.

## SHA-pinned source register

The following identities were read at source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`.

| Path | Blob SHA | Classification |
|---|---|---|
| `PRE-RICH/src/PreRichExpiryPolicy.ts` | `4191763a53124f7d6736bd09694eab660d1faef4` | `REVIEWED_STATIC_STATE_DERIVATION_CALLER_POLICY_BOUNDARY` |
| `PRE-RICH/src/PreRichExpiryEvidence.ts` | `b206c09e987787db848e291073294e0fa37af1f2` | `REVIEWED_STATIC_STORED_TIMESTAMP_BOUNDARY_ONLY` |
| `PRE-RICH/src/PreRichExpireRefinement.ts` | `72598762a7a9d29d5a1ecc1a4d475c0121f4cde8` | `REVIEWED_STATIC_AGGREGATE_EXPIRE_REFINEMENT` |
| `PRE-RICH/src/PreRichIssueRefinement.ts` | `2cb717101adc65899e8cf14b8c390fcdec2ebe6c` | `REVIEWED_STATIC_ISSUE_EVIDENCE_EXCLUDES_EXPIRY_BINDING` |
| `PRE-RICH/src/PreRichIssueEvidence.ts` | `6029300879c08e56630a3a0172fef61a5e483f22` | `REVIEWED_STATIC_CLASS_ISSUE_EVIDENCE` |
| `src/mint.ts` | `b9b1a7f4846e4cfdf8862368421b8ce7cf8b1534` | `REVIEWED_STATIC_CALLER_POLICY_AND_LOCAL_CLOCK_BUILDER` |
| `plutus/Types.hs` | `a10b2ce9b74b2e91dc7d75577996dc9abb555930` | `REVIEWED_STATIC_DATUM_HAS_TIMES_BUT_NO_POLICY_OR_SNAPSHOT_ID` |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `REVIEWED_STATIC_ISSUANCE_VALIDATOR_DOES_NOT_BIND_EXPIRY_POLICY` |
| `plutus/B1PrizePool.hs` | `106368b510a52447aa3de7ce951cf615466fc5e8` | `REVIEWED_STATIC_TICKETISSUED_BINDS_PRICE_NOT_EXPIRY_PROVENANCE` |
| `plutus/PrizeValidator.hs` | `3e35eeadf3fbb6ace4e8b288106a5ed8f687e66b` | `REVIEWED_STATIC_POST_ISSUE_BOUNDARY_ENFORCEMENT` |
| `src/__tests__/preRichExpiryPolicy.test.ts` | `304244f8189423d21f80bde312ef6ce6b1a6bff2` | `REVIEWED_TEST_SOURCE_NOT_RERUN` |
| `src/__tests__/preRichExpiryEvidence.test.ts` | `3607ac07a4131d53e7e3d1c74a3f22d277092268` | `REVIEWED_TEST_SOURCE_NOT_RERUN` |
| `src/__tests__/preRichExpireRefinement.test.ts` | `6a0f32eaacfef97486e5ef1d68c2abe4ce8e9507` | `REVIEWED_TEST_SOURCE_NOT_RERUN` |
| `src/__tests__/preRichIssueRefinement.test.ts` | `94ed597a962cb0a1f2926710083d6c3ef960f181` | `REVIEWED_TEST_SOURCE_NOT_RERUN` |
| `.github/workflows/pre-rich-expiry-conformance.yml` | `a5b5019c85fe3b18abdefcdef7060c9bfe95e553` | `REVIEWED_WORKFLOW_TS_ONLY_AND_PR_PATH_FILTER_DRIFT` |
| `audit/cardano-integration/expire-ledger-trace.ts` | `d734c59ec43bdcc4c5c6fcb52bd2b4fe4f9b3bc5` | `REVIEWED_EXPIRE_TRACE_FIXTURE_ONLY` |

## Closure gates — preserve semantics, bind issuance provenance

1. Select and enforce the authorized PRE-RICH V1 policy at the authoritative Issue boundary; do not accept an arbitrary caller-supplied policy merely because its derivation is deterministic.
2. Bind `issuedAt` to the transaction's authoritative validity/issuance-time contract and bind `expiresAt` to the exact policy result computed from the same authenticated pre-Issue snapshot. The concrete contract must be approved at the PRE-RICH source-of-truth layer before implementation.
3. Represent/verify a canonical policy/version + issuance-snapshot reference or digest in a way the minting validators actually enforce. Do not assume off-chain `issuanceStateHash` is authenticated because it is non-empty, and do not trust an unconstrained datum field.
4. Add negative on-chain transaction vectors: arbitrary future `issuedAt`; `expiresAt < issuedAt`; duration outside the authorized V1 min/max; altered policy version or state hash; same timestamps paired with a different pre-Issue state; and datum timestamps not matching the policy-derived result.
5. Correct the expiry workflow PR path filters so changes to the current `src/__tests__` files trigger the expected gate, then run the suite on the exact protocol-source SHA.
6. Only after the issuance binding tests pass, execute a fresh provider-backed Preprod Issue followed by Reveal/Expire acceptance with archived transaction CBOR, observed source UTxOs, chain slot/time and Ticket NFT output. Do not reuse or alter the already-expired historic Prize UTxO.

**Current verdict:** policy implementation present; temporal lifecycle predicates present; authorized policy/snapshot → on-chain `issuedAt`/`expiresAt` binding **NOT ESTABLISHED**; issue #20 remains **OPEN**; first real ticket Issue remains independently unproven. Overall audit remains **PARTIAL / OPEN**. This review changed documentation only; no protocol logic, test, workflow, branch topology, V3/Reveal semantics or ledger state was modified.
