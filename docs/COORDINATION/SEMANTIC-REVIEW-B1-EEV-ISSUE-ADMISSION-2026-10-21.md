# Semantic Review — B1 Direct-USDM EEV and Authoritative Issue Admission

**Review date:** 2026-10-21  
**Review ID:** `SEM-B1-EEV-ISSUE-ADMISSION-2026-10-21`  
**Protocol source snapshot for current green implementation:** `3373b3044b9c251da1ec217d128f5dcb3c87c894`  
**Scope:** source and evidence review of direct-USDM observation, EEV approval, authoritative Issue admission composition, and the boundary between an approved EEV candidate and a real Issue. Static review only; this is not a new Preprod observation or transaction submission.

## Executive disposition

**EEV profile qualification and deployment approval: CONFIRMED for the exact historical candidate observed in workflow run #39552468679. First real Issue admission/mint: NOT ESTABLISHED.**

The run produced a real evidence artifact from a live Preprod observation at a specific point in time. Its own governance section explicitly limits what that approval proves: admission must revalidate the exact source UTxO and bind authenticated control state, ProtectedCapital provenance, viability/liquidity evidence and the authoritative Issue decision. The review did not re-query the UTxO at current time, dispatch a current conformance workflow, or submit an Issue transaction.

## Verified historical Preprod evidence

Workflow run: [#39552468679 — PRE-RICH B1 EEV Deployment Approval](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679)  
Workflow head: `main` / `97b09a38742098f17a61eb07734c401aeedccc06`  
Workflow's explicit protocol checkout: `0e5fa575f84e3759655b6d0a3492b2f0b79aa446`  
Result: run and all listed steps completed successfully; artifact `immortal-preprod-eev-approved`, ID `12324421376`, 8,831 bytes.

The artifact was downloaded and inspected read-only. It reports:

| Property | Recorded value |
|---|---|
| Profile | `PRE-RICH-EEV-USDM-DIRECT-V1` |
| Qualification schema | `PRE-RICH-EEV-USDM-DIRECT-V1-QUALIFICATION-v0.1` |
| Contract / derivation | `3.0.0` / `direct-usdm-v1` |
| Qualified properties | EV1–EV7 |
| Deployment status | `DEPLOYMENT_APPROVED` |
| Approval valid-from | `2026-10-21T05:57:26.889Z` |
| Freshness / revalidation rule | `LIVE_UTXO_REVALIDATION` |
| Observed source time | `2026-10-21T05:57:26.613Z` |
| Source UTxO | `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0` |
| Physical direct-USDM quantity | `1,000,000,000` atomic units |
| Derived EEV | `100,000` IMMORTAL USDM sub-units |
| Derivation | `floor(atomicQuantity × 100 / 1,000,000)` |
| Observed Preprod chain tip | height `5,317,135`, absolute slot `136,879,045` |
| Approved candidate | `PRE-RICH-EEV-USDM-DIRECT-V1:b84f…b020#0` |

The source-set artifact itself remains labelled `OBSERVED_NOT_QUALIFIED` and carries deployment approval `PENDING`; the final approved qualification combines that source observation with the separate EEV deployment-approval record. This staged state is intentional, not an inconsistency.

The deployment and Oracle State manifests state `reusedExisting: true` and have no bootstrap transaction hash, so this particular run records reuse/observation rather than a newly submitted bootstrap transaction. The artifact's `verificationReference` names workflow run #39552468679 at its workflow HEAD; the workflow YAML separately pins the code used for the observation/qualification pipeline to commit `0e5fa575…`. These are two distinct source references and should remain separately recorded.

**Freshness limitation:** the source observation is a time-bounded snapshot, not evidence that the same UTxO remains unspent now. Its declared policy requires live UTxO revalidation immediately before admission and consumption of that exact reference. Current liveness was not re-queried by this review.

## Findings

### F-EEV-01 — The direct-USDM valuation path is separate from the legacy oracle-valued pool function

`Adapter/CARDANO/observation/DirectUsdmEev.ts` reads the quantity under the exact configured native-asset unit and converts the ledger's six-decimal atomic quantity into the protocol's 100 sub-units per USDM using downward `FLOOR` rounding. It does not call `Economic.poolUsdmValue`, request an oracle price, liquidate ADA/PRE, or infer token values. The Preprod observer binds the reading to an exact `txHash#outputIndex`, requires a single live UTxO and the deployed Pool singleton quantity of exactly one, and fails closed if that UTxO or the target direct-USDM asset is absent.

This is the correct separation for profile `PRE-RICH-EEV-USDM-DIRECT-V1`: direct physical USDM only, no unproven liquidation route or invented haircut.

### F-EEV-02 — The EEV approval is real but is not Issue authorization

The recorded approval identifies a specific candidate and source-set hash, includes EV1–EV7, and sets `LIVE_UTXO_REVALIDATION`. The workflow output's governance text says it does **not** itself authorize Issue admission. The current Issue bridge also rejects a qualification without `DEPLOYMENT_APPROVED`, the wrong profile, a source/candidate bound to a different Pool UTxO, missing EV1–EV7 evidence, or an approval with an invalid digest.

Therefore the historical EEV blocker should be described as **qualified/approved for that candidate at the recorded snapshot**, not as “no EEV approval exists.” Its current usability still depends on exact live-source revalidation and current admission bindings.

### F-EEV-03 — The current Issue boundary is deliberately multi-certificate and fail-closed

The inspected green source enforces, in combination:

- exact Pool, Counter, B2 control and V3 carrier references;
- matching direct-USDM approval profile and Pool candidate;
- signed authority result bound to the exact observation and state/action/post-state hashes produced independently by the Haskell Issue decision path;
- matching class and price coordinates plus `truthVerified`, freshness, obligations and Ω certification flags;
- six non-negative ProtectedCapital components whose sum matches the declared total, bound to the same carrier;
- a viability certificate with VC1–VC6 proofs, E1–E10 evidence and deployment binding to the same network, carrier, state hash and EEV snapshot;
- liquidity observation whose exact source-input list, observed Pool UTxO and declared value match the admission witness and required immediate liquidity.

The signed authority endpoint and current chain observations remain external runtime dependencies. Static code containing these gates does not prove that the production DApp/relayer is configured to use them, that an external signature verified in a live request, or that a specific user transaction was admitted.

### F-EEV-04 — EEV approval run did not itself execute the separate Direct-USDM conformance suite

Run #39552468679 successfully performed source-set observation, EV1–EV7 artifact generation, deployment approval and artifact consistency checks. It did not list a Vitest, TypeScript strict typecheck or browser-build step. A separate workflow, `.github/workflows/pre-rich-direct-usdm-conformance.yml`, defines those checks; this review did not establish a completed successful run of that workflow against the exact current green source SHA. Do not interpret test-file digests included in the EEV artifact as proof that the corresponding test suite executed and passed.

### F-EEV-05 — First Issue transaction readiness remains independently blocked

The repo checkpoint's prior readiness analysis identifies a builder/economic-value boundary that still needs an exact completed transaction body: requested ADA settlement quantity, the minimum-UTxO requirement and the Genesis target of 100 USDM sub-units must reconcile in the actual Treasury output evaluated by the production MintPolicy. The direct-USDM EEV certificate values the physical Pool asset; it does not prove the ticket sale payment equality, minimum-UTxO compliance, live DApp `/issue-admission` endpoint, personal wallet signature or a confirmed on-chain Ticket NFT.

No successful first-Issue transaction, intended-wallet mint or matching on-chain output was recovered by this static/evidence review. Keep P-01 **BLOCKED for end-to-end Issue** while preserving the narrower EEV qualification result.

## SHA-pinned source register

All source SHAs below are blob identities observed at green protocol-source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`, unless noted as run-only provenance:

| Path | Blob SHA | Classification |
|---|---|---|
| `Adapter/CARDANO/observation/DirectUsdmEev.ts` | `10616024e007cf9a18707047e89e84990cfc093b` | `REVIEWED_STATIC_DIRECT_USDM_DERIVATION` |
| `Adapter/CARDANO/observation/DirectUsdmEev.test.ts` | `3bfcce27425c04f91ee80b9326fa8a0d165490ee` | `REVIEWED_TEST_SOURCE_NOT_RUN_BY_EEV_APPROVAL` |
| `Adapter/CARDANO/observation/PreprodDirectUsdmObservation.ts` | `fab85c4a601e2d8cf54a51c0bab5b29f65cd75de` | `REVIEWED_STATIC_LIVE_UTXO_BINDING` |
| `Adapter/CARDANO/observation/PreprodDirectUsdmObservation.test.ts` | `2acbf841c4318fdf7bc502f715129b06e8623079` | `REVIEWED_TEST_SOURCE_NOT_RUN_BY_EEV_APPROVAL` |
| `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.ts` | `886f8b62ea001c4d822777f4cc6e8a440dd57320` | `REVIEWED_STATIC_EXTERNAL_AUTHORITY_BOUNDARY` |
| `Adapter/CARDANO/observation/PreprodAuthoritativeIssueProvider.test.ts` | `ca98eaf28d8096aa78b5f9fe2c2932b243db3bd4` | `REVIEWED_TEST_SOURCE_NOT_RUN_BY_EEV_APPROVAL` |
| `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts` | `f0c794892104b25e64e94f402c1dd0f5d604364e` | `REVIEWED_STATIC_SIGNED_DECISION_BINDING` |
| `Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.test.ts` | `dfef3bfd2d519f4cc7706d8e32b80015165a9617` | `REVIEWED_TEST_SOURCE_NOT_RUN_BY_EEV_APPROVAL` |
| `Adapter/CARDANO/observation/AuthoritativeIssueAdmissionDecision.ts` | `c90da58f18a12d13e4e8cd3af32947f71f9d5a92` | `REVIEWED_STATIC_INPUT_AND_LIQUIDITY_BINDING` |
| `Adapter/CARDANO/runtime/AuthoritativeIssueAdmission.ts` | `e3cc7af807972fd361e109c182092566b0c9cd62` | `REVIEWED_STATIC_FAIL_CLOSED_CERTIFICATE_GATE` |
| `Adapter/CARDANO/runtime/__tests__/AuthoritativeIssueAdmission.test.ts` | `116213506619410de4e549385c18899556c86b2c` | `REVIEWED_TEST_SOURCE_NOT_RUN_BY_EEV_APPROVAL` |
| `src/preRichIssueAdmissionBridge.ts` | `8e594655f68fb3c9f267703a85474e6fd1f25f8e` | `REVIEWED_STATIC_POOL_CANDIDATE_AND_CERTIFICATE_BINDING` |
| `src/__tests__/preRichIssueAdmissionBridge.test.ts` | `54ce98b56e456e969dfa80f32821d58058c7a4ae` | `REVIEWED_TEST_SOURCE_NOT_RUN_BY_EEV_APPROVAL` |
| `plutus/export/IssueAdmission.hs` | `3d282f4317dcdf2064149f871801948facfcab4c` | `REVIEWED_STATIC_CANONICAL_HASKELL_DECISION_INTERFACE` |
| `audit/cardano-integration/preprod-direct-usdm-source-set.mjs` | `9cf28d31bf72e0aea6c077538e97e7399ed0d04b` | `REVIEWED_STATIC_LIVE_SOURCE_SET` |
| `audit/cardano-integration/preprod-direct-usdm-qualification.mjs` | `bb88050e3ccb0b349eb01afd013ecb22e8027502` | `REVIEWED_STATIC_EV1_EV7_QUALIFICATION_ARTIFACT` |
| `audit/cardano-integration/preprod-direct-usdm-approve.mjs` | `464999e4eb62cbe8e8cde8e697aa03ab0c42ac06` | `REVIEWED_STATIC_SEPARATE_DEPLOYMENT_APPROVAL` |
| `audit/cardano-integration/preprod-direct-usdm-bootstrap.mjs` | `0cd6a2182dfbcc832c150822c8bc037f42b06689` | `REVIEWED_STATIC_BOOTSTRAP_GUARD` |
| `.github/workflows/pre-rich-b1-eev-approval.yml` | `a9d9efe08cf34ac5c67db29dc78088f60c44ebee` | `REVIEWED_WORKFLOW_SUCCESS_RUN_39552468679` |
| `.github/workflows/pre-rich-direct-usdm-conformance.yml` | `47cbd5247bf39045c9ddef195b1a21609a0f8897` | `REVIEWED_WORKFLOW_RUN_NOT_RECONFIRMED_ON_CURRENT_GREEN_SHA` |
| `docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md` | `292a2adb4137209f02e5a55477a5eef676d974e9` | `REVIEWED_NORMATIVE_ADAPTER_CONFORMANCE_BOUNDARY` |

## Closure gates

1. Before admission, revalidate the exact live Pool UTxO, singleton token, direct-USDM quantity and observation time; stop if it has been spent, changed or become ambiguous.
2. Re-run the current green Direct-USDM conformance suite and record the exact commit/run/artifact; a successful approval workflow is not a substitute for unit/type/build conformance.
3. Refresh the authoritative control-state and V3 carrier observations, verify the configured signed authority endpoint/key at runtime, and capture the same authenticated state/action/post-state hashes as the Haskell Issue producer.
4. Reconcile the actual built Treasury output against Cardano minimum-UTxO and the production MintPolicy price equality at exact transaction CBOR; do not submit an Issue just to mark progress.
5. Prove the complete wallet → DApp → live admission → signature → submitted transaction → on-chain Ticket NFT path, and archive the packet with source SHA, input UTxO references, slot/time, tx body/hash, transaction size and observed effects.

**Current verdict:** direct-USDM EEV qualification and candidate deployment approval **CONFIRMED at the recorded snapshot**; exact current source liveness **NOT RE-OBSERVED HERE**; authoritative Issue source is statically guarded but live endpoint / current authority evidence **NOT QUALIFIED BY THIS REVIEW**; end-to-end first Issue/mint **NOT ESTABLISHED**. This review changed documentation only; no protocol source, workflow, V3/Reveal semantics, branch topology or ledger state was modified.
