# Semantic Review — P2.8 / Reveal Reference-Script Witness and Ledger Evidence

**Review date:** 2026-10-21  
**Review ID:** `SEM-P28-REVEAL-REFERENCE-SCRIPTS-2026-10-21`  
**Current protocol-source snapshot:** `3373b3044b9c251da1ec217d128f5dcb3c87c894`  
**Prior exact-source failure snapshot:** `1300b79d7460f2abcd79767d5d16dd2564aad064`  
**Scope:** source and Actions evidence review only. No workflow rerun, transaction submission, maximum-size change, or Reveal/V3 semantic modification was performed.

## Disposition

**P-03 Reveal size/reference-witness binding and P-04 native Cardano-ledger P2.8 evidence remain `INTEGRATION_BLOCKED`.**

The latest exact-source runs are conclusive enough to retain the blocker, not to close it, but the 16,782-byte failure must be classified correctly: the canonical emulator run failed while completing the transaction that publishes the PrizeValidator reference script, before the final Reveal spending transaction was built. In diagnostic-only mode with an enlarged local size ceiling, script publication passed but Reveal construction failed in local evaluation before final CBOR was emitted. The Integration Lab was cancelled before the real economic Reveal and P2.8 gates. Relevant protocol builders/workflows/validators are blob-identical between source snapshot `1300b79d…` and `3373b3044b9c…`; do not rerun the unchanged diagnosis.

## Live Actions evidence inspected

### Run #39646783971 — PRE-RICH Emulator Reveal Conformance

[Run details](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646783971)

- Exact source SHA: `1300b79d7460f2abcd79767d5d16dd2564aad064`; conclusion `failure`.
- Fresh Plutus build/export, artifact binding and isolated emulator smoke completed successfully.
- Reference-script publication failed at `2026-10-21T17:51:08Z`: completing the transaction carrying the PrizeValidator reference script hit `maxTxSize=16384`, with **16,782 bytes** — 398 bytes over. The canonical Reveal spending transaction was not built by this run.
- The following budget probe used enlarged diagnostic ExUnit limits but still failed the same byte limit, so it is not acceptance evidence.
- The diagnostic-only size probe then increased its local test parameter to `maxTxSize=100000`, allowing publication of the two reference scripts; construction then advanced to Reveal and failed with `Spend[0] attempted to instantiate a non-polymorphic term` before final CBOR/counters were emitted. This is an evaluator/build failure, not a final Reveal size result.
- The no-prize-input, ticket-substitution and price-mismatch negative scenarios reported `INCONCLUSIVE_NOT_SUBMIT_REJECTION stage=build`; they did not reach a ledger-originated rejection.

### Run #39646784077 — IMMORTAL Cardano Integration Lab

[Run details](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077) · [uploaded evidence artifact](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39646784077/artifacts/12367697468)

- Exact source SHA: `1300b79d7460f2abcd79767d5d16dd2564aad064`; conclusion `cancelled`.
- Yaci Store startup, generated validator binding and isolated Aiken Reveal positive/negative fixture twins completed.
- The real Cardano ledger smoke, V3 carrier execution, active economic Reveal trace, FundTreasury/Issue/Expire/Claim traces, raw-context materialization, typed UTxO decode and P2.8 evidence gate were skipped.
- The artifact proves setup and isolated candidate-fixture execution/evidence plumbing only; it is not a canonical Haskell Reveal, real economic transition, or native P2.8 pass.

The prior checkpoint also recorded a separate Preprod Reveal builder measurement of 17,571 bytes against 16,384 in an earlier run family. Do not merge that measurement with the 16,782-byte PrizeValidator reference-script publication transaction: they are different evidence paths and different transaction types. Neither authorizes a protocol-limit increase.

## Source findings

### F-P28-01 — The reference-script validation helper exists, but the real Preprod runner does not invoke it

`audit/cardano-integration/revealReferenceScripts.ts` implements two useful checks:

1. `bindPublishedReferenceScript` binds a provider-returned reference UTxO to the exact publication transaction CBOR, transaction/body hash, output index/address and expected script bytes; a provider's `scriptRef` by itself is explicitly not treated as proof.
2. `assertRevealUsesReferenceScripts` inspects the final serialized Reveal CBOR and fail-closes unless the exact two reference inputs, the expected spending inputs/redeemers and continuing outputs are present, embedded Plutus script count is zero, and the transaction fits the active protocol `maxTxSize`.

The Yaci `audit/cardano-integration/reveal-ledger-trace.ts` path calls both helpers and records preflight/CBOR diagnostics. In contrast, the production-like Preprod runner `audit/cardano-integration/preprod-real-reveal.mjs` resolves provider UTxOs, compares their `scriptRef.script` bytes to the expected scripts, calls `.readFrom([prizeReferenceUtxo, poolReferenceUtxo])`, serializes and sizes the final transaction, and rejects if it exceeds `maxTxSize`. It does **not** import/call either helper, does not prove the provider reference UTxOs against their publishing transaction CBOR, and does not assert that the final witness set has zero embedded Plutus scripts.

Consequently, `.readFrom` appearing in a builder is not by itself proof that Lucid selected reference witnesses in the final CBOR. The actual serialized transaction has to establish that fact.

### F-P28-02 — The source-level test does not establish final witness conversion

`src/__tests__/referenceScriptSpendingBoundary.test.ts` verifies that the application `gameFlow.ts` Reveal/Claim/Expire sections contain `.readFrom` and do not contain the inspected inline attachment calls. This is a useful structural regression guard; it does not build a signed transaction, decode its witness set, count embedded scripts, verify publication-transaction outputs, or measure the final transaction against live protocol parameters.

The failed emulator run establishes that the PrizeValidator reference-script publication transaction is over the byte limit. It does not establish the final serialized size of the Reveal spending transaction on this snapshot.

### F-P28-03 — Native P2.8 closure requires a real context packet, not successful setup or local candidates

The required evidence tuple remains:

`tx.cbor + exact utxo.json + pparams.json + epoch-info.json + system-start.json + manifest.json`

The raw context must match the exact transaction and source UTxOs, then be run through native Cardano-ledger evaluation and yield ExUnits or a ledger-originated failure. The latest Integration Lab cancelled before the steps that materialize this context and execute the P2.8 gate. Do not substitute synthetic contexts, local Aiken fixture twins, an emulator success, or generated evidence metadata.

### F-P28-04 — No safe semantic shortcut is authorized

Reference scripts address witness-size pressure; they do not establish validator correctness, ExUnit feasibility, successful evaluation, ledger acceptance, or full lifecycle conformance. Preserve the 16,384-byte limit. Do not alter V3/Reveal semantics, datum/redeemer rules, economic constants, or the ledger limit as part of this blocker.

## SHA-pinned source register

The following identities were read at source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`. A comparison against `1300b79d7460f2abcd79767d5d16dd2564aad064` found the listed Reveal/P2.8 builders/workflows and core validators blob-identical.

| Path | Blob SHA | Classification |
|---|---|---|
| `.github/workflows/pre-rich-emulator-reveal.yml` | `07aca75f949115b2512a435b0b2e1b47d7f50671` | `REVIEWED_WORKFLOW_LATEST_RUN_FAILED_ACCEPTANCE` |
| `.github/workflows/p2-8-b1-cardano-ledger-runner.yml` | `14507e96c490ba93576dc0c169229790733f1bf4` | `REVIEWED_WORKFLOW_P2_8_EVIDENCE_GATE` |
| `.github/workflows/immortal-cardano-preprod.yml` | `799f550c265d8fcc152441df9819d7cc5637b56f` | `REVIEWED_WORKFLOW_REAL_PREPROD_RUNNER` |
| `audit/cardano-integration/preprod-real-reveal.mjs` | `996e8615af2902f2d254fb99a7b4a620b6e74fd4` | `REVIEWED_STATIC_FINAL_SIZE_CHECK_WITHOUT_REFERENCE_WITNESS_ASSERTION` |
| `audit/cardano-integration/revealReferenceScripts.ts` | `cec307edc46d1c2e4aaa653fb95ac3959981c981` | `REVIEWED_STATIC_FINAL_CBOR_REFERENCE_WITNESS_GATE` |
| `audit/cardano-integration/reveal-ledger-trace.ts` | `89958e2c7b026ea9f680cbd24dff78cedc15aaab` | `REVIEWED_STATIC_YACI_PATH_USES_CBOR_GATE` |
| `src/__tests__/referenceScriptSpendingBoundary.test.ts` | `a800fc6fb13cd63c73ab43f80f38942f49540569` | `REVIEWED_STRUCTURAL_TEST_NOT_FINAL_CBOR_EVIDENCE` |
| `src/__tests__/immortal-cardano-reveal-emulator-b1.mjs` | `d9112597f1c0d534604df238738e043522cc0670` | `REVIEWED_RUNNER_REFERENCE_PUBLICATION_FAILURE_16782_BYTES` |
| `src/__tests__/immortal-prerich-reveal-transaction-fixture.test.ts` | `decd1046c5b3c8f8c72775febd88a27dbadb0f94` | `REVIEWED_FIXTURE_SOURCE` |
| `src/__tests__/immortal-reveal-conformance.test.ts` | `f7cff6732ffe20a2ae47b12f05ba49a5abbd9bda` | `REVIEWED_APP_BOUNDARY_CONFORMANCE_SOURCE` |
| `docs/audits/P2.8-REVEAL-REFERENCE-SCRIPT-REMEDIATION-v0.1.md` | `c3438877b4bef88b25768e8fc9ebfd5e3a6a8705` | `REVIEWED_ACCEPTANCE_CRITERIA` |
| `audit/cardano-integration/materialize-p28-ledger-context.mjs` | `4978257d28f2104c5fc9b96a9b37f2f0ba4a4816` | `REVIEWED_STATIC_CONTEXT_MATERIALIZER` |
| `audit/cardano-integration/materialize-preprod-p28-context.mjs` | `a3e965ff1aad9649d636dc5a5f98ee01eb414045` | `REVIEWED_STATIC_PREPROD_CONTEXT_MATERIALIZER` |
| `docs/audits/P2.8-B.1-cardano-ledger-runner.md` | `0c8c1812018995fac12b6b88a41528f9264f8578` | `REVIEWED_RUNNER_EVIDENCE_CONTRACT` |
| `plutus/B1PrizePool.hs` | `106368b510a52447aa3de7ce951cf615466fc5e8` | `UNCHANGED_PROTOCOL_VALIDATOR_NO_SEMANTIC_REVIEW_CLAIM` |
| `plutus/PrizeValidator.hs` | `3e35eeadf3fbb6ace4e8b288106a5ed8f687e66b` | `UNCHANGED_PROTOCOL_VALIDATOR_NO_SEMANTIC_REVIEW_CLAIM` |

## Next dispatch criteria — no unchanged rerun

Do not dispatch another identical emulator or Integration Lab run merely to reproduce these outcomes. The next attempt becomes useful after a narrow, reviewable builder/evidence change that:

1. uses the verified published reference UTxOs in the actual Preprod path and invokes the same final-CBOR reference-script assertions before signing/submission;
2. captures `revealDiag` output that includes final CBOR bytes, active `maxTxSize`, exact reference-input set, embedded script counts and spending redeemer/input checks;
3. verifies the transaction is within 16,384 bytes without a local size-limit override or inline fallback;
4. only then proceeds to exact-context materialization and native Cardano-ledger evaluation for P2.8.

The user-facing dispatch still requires an explicit decision to run `run_reveal=true`, because that path submits a real Preprod transaction; no dispatch was performed in this review.

**Corrected verdict (2026-10-22):** Reveal reference-script conversion in the actual Preprod runner **NOT PROVEN**; the emulator's canonical path **FAILED at reference-script publication** (16,782 / 16,384 bytes), not at final Reveal spending; diagnostic-mode Reveal construction failed local evaluation before final CBOR measurement; the prior 17,571-byte Preprod builder result remains a separate evidence path; native P2.8 context / ledger gate **NOT RUN** in the latest Integration Lab. P-03 and P-04 remain **OPEN / INTEGRATION_BLOCKED**. No protocol validator or ledger transaction was changed or submitted by this correction.
