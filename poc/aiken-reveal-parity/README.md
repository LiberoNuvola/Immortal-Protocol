# PRE-RICH Reveal — Aiken parity prototype

**Status:** isolated parity harness; not a production validator and not deployable.

This package starts a controlled Aiken implementation path for Cardano without changing the IMMORTAL normative kernel, the existing Haskell validator, the existing V3 carrier, Reveal semantics, or any deployed artifact.

## Why this exists

The Integration Lab previously failed at Reveal with a transaction size of 18,051 bytes against Cardano's 16,384-byte limit. Aiken is being evaluated as an alternative implementation language for the Cardano on-chain validator, not as a change to IMMORTAL's economic rules.

## Compatibility constraint

The existing Haskell Reveal validator targets Plutus V2. The isolated Aiken package targets Plutus V3 because the pinned Aiken compiler does not support Plutus V2. It is not a drop-in replacement: a complete port must pass a separately gated V2-to-V3 compatibility review covering target-ledger support, context encoding, cost model, transaction behavior, and datum/redeemer compatibility. The existing V3 carrier is not changed by this experiment.

## Current scope

- `lib/immortal/reveal_rules.ak`: current tier classification, prize formula, 500x payout cap and basic pool accounting predicate.
- `lib/immortal/beacon.ak`: Haskell-compatible field encoding, player/ticket commitments, beacon derivation, ticket seed and symbols seed.
- `lib/immortal/game_rules.ak`: row outcome rejection sampling, tier boundaries, deterministic row-symbol construction and summary tier.
- `lib/immortal/reveal_context_guards.ak`: pure parity seams for expiry bounds, unique input/output counts, immutable identity fields, continuing value equality, and Reveal PrizePool accounting deltas.
- `lib/immortal/reveal_types.ak` and `lib/immortal/reveal_transition.ak`: Aiken datum types and a pure Reveal state-transition predicate composed from canonical beacon, game, payout, identity, expiry and PrizePool rules. CI builds generated positive/negative transition tests from Haskell-produced winning/loss snapshots. Separately, the Haskell producer executes the compiled Plutus V2 validator against synthetic `ScriptContext` values; neither harness submits a ledger-valid transaction.
- `lib/immortal/reveal_context.ak`: typed-context guards over Aiken's actual `cardano/transaction` types. `lib/immortal/reveal_transaction.ak` now wires those guards to datum resolution, unique Prize/PrizePool inputs and outputs, the canonical pure Reveal transition predicate, and pool before/after accounting. The entrypoint is a complete isolated prototype over Aiken's typed transaction context, but it is not yet proven equivalent to the production Haskell validator or validated against ledger-valid transactions.
- `lib/immortal/claim_transition.ak`: pure Claim state-transition predicate used for explicit parity tests; caller-supplied booleans are not on-chain evidence.
- `lib/immortal/claim_transaction.ak`: new typed-context Claim candidate. It resolves Prize/Pool datums, checks the ticket-owner signature, aggregates outputs to the enterprise claimant address, values each non-zero asset through the configured Oracle State singleton/publisher with the existing precision, ADA min-UTxO deduction and freshness boundary, and checks the Prize/Pool Claim transition. Unit tests now cover exact settlement, expiry-bound and oracle identity/freshness/price edges. It has **not** yet been compiled or proven against ledger-valid Claim fixtures; treat it as a migration candidate only.

The guard module tests logical predicates only. It does **not** decode a real Cardano transaction context, prove that a byte string is the canonical encoding of a Cardano Value, locate actual UTxOs, or establish full validator equivalence.

## Remaining acceptance gates

The typed-context entrypoint and representative adversarial tests now exist in the isolated Aiken prototype. The following gates remain open before this can be considered a rewrite candidate:

1. Expand canonical Haskell/Aiken differential fixtures across all datum/redeemer states and edge cases; compare full validator decisions and state effects, not only serialization or pure predicates.
2. Verify hashed-datum resolution and datum-witness binding against canonical, ledger-valid transaction fixtures.
3. Complete ledger-valid positive, nonzero-payout, and adversarial twins through Yaci/native-ledger validation. A loss and a nonzero-payout Reveal have now passed the integrated Aiken V3 + real B1PrizePool V2 fixture; the wrong-secret rejection so far uses a test-only pool stub, so the integrated negative case remains open.
4. Review the production Haskell Plutus V2 to Aiken Plutus V3 compatibility boundary separately. Aiken's current package target does not make this a drop-in replacement.
5. Measure compiled script size and complete transaction size, CPU, and memory against a version-labelled baseline. The historical 16,384-byte Reveal transaction blocker is not closed by passing this harness.
6. Preserve the existing Haskell validator, IMMORTAL economic rules, and V3 carrier until all acceptance gates pass and an explicit migration decision is made.

No production artifact may be switched to this package until full behavior passes Haskell differential tests and native-ledger integration tests.

## Differential parity status (2026-10-16)

CI run [#71](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38944055843) passed the canonical Haskell fixture producer, the compiled Plutus V2 CEK harness, generated Haskell-to-Aiken fixtures, Aiken tests, and the fail-closed JEV evidence gate. The producer evaluated the actual `compiledValidatorFactory` from `plutus/PrizeValidator.hs` against test-only synthetic `ScriptContext` values. All 11 outcomes matched expectations: two accepted Reveal paths (positive payout and zero-payout loss) and nine representative rejected cases (wrong secret, expiry, liability delta, changed identity, value preservation, duplicate pool input, missing pool output, duplicate Prize output, and pool script-hash binding).

The run reports **61 Aiken tests passed, 0 failed**, **120 JEV checks passed, 0 failed**, an uploaded evidence artifact, a Notion ledger update, and `PARITY_EVIDENCE_GATE=success`.

This is stronger evidence than pure predicate tests, but is **not full Haskell/Aiken validator equivalence**: the Haskell CEK run uses synthetic contexts rather than a ledger-valid transaction, while the Aiken harness still does not implement/evaluate the entire Reveal validator. Current paired references and remaining gaps are:

| Behavior | Canonical Haskell reference | Aiken seam | Current evidence |
|---|---|---|---|
| Row outcome boundaries and rejection sampling | `plutus/GameRules.hs` | `lib/immortal/game_rules.ak` | Canonical Haskell vectors are generated in CI and consumed by Aiken tests, including rejection-sampling and row outcome indices |
| Prize tier and payout formula / 500x cap | `plutus/GameRules.hs` | `lib/immortal/reveal_rules.ak` | Canonical Haskell prize/payout vectors are consumed by Aiken tests; the shared vector checks cover the listed formula and cap cases, not the complete on-chain transition |
| Reveal validity upper bound | `plutus/PrizeValidator.hs` (`claimBeforeExpiry`) | `lib/immortal/reveal_context_guards.ak` | Exact-before/equal/after pure boundary vectors plus CEK accept/reject coverage at the expiry cutoff |
| Reveal pool accounting | `plutus/PrizeValidator.hs` (`validateReveal.poolOk`) | `lib/immortal/reveal_context_guards.ak` | Haskell-derived before/after pool snapshots, Aiken accounting-predicate tests, and CEK positive/negative pool-accounting cases |
| Typed Cardano context, unique inputs/outputs, continuing value | `plutus/PrizeValidator.hs` | `lib/immortal/reveal_context.ak` | Actual compiled Haskell validator is CEK-tested against synthetic contexts for representative guards; Aiken still has structural context guards rather than the complete validator |
| Datum/redeemer serialization | `plutus/Types.hs` | `lib/immortal/reveal_types.ak` | CI-generated fixtures cover `PrizeDatum.pending`, all `PrizeAction` constructors, `BeaconTarget`, `B1PrizePoolDatum`, and generated before/after transition snapshots; more states and full round trips remain open |

### Next acceptance gate

1. Port the full Reveal decision to Aiken against the same canonical fixture schema, then compare accept/reject decisions and datum/pool effects to the 11 Haskell CEK outcomes. The current Aiken harness does not yet claim this parity.
2. Extend local Yaci testing to a wrong-secret transaction using the integrated Aiken V3 Reveal and the real B1PrizePool V2 validator, then compare positive/negative decisions and state effects to canonical Haskell results. The integrated zero-payout and nonzero-payout cases now pass; the standalone wrong-secret twin still uses a test-only pool stub.
3. Keep the Plutus V2 to Aiken/Plutus V3 compatibility review separate; the existing V3 carrier remains unchanged.
4. Measure the compiled validator and complete transaction size, CPU, and memory against version-labelled baselines. The previously observed Reveal transaction-size blocker remains unresolved by this harness.
5. Expand datum/redeemer serialization states and round-trip/decoder checks; record canonical source revision and fixture schema version in evidence.

Latest completed CI run [#103](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38998330279) passed the serialization parity tests, Aiken checks/build, smoke tests, fail-closed evidence gate, and JEV/Notion evidence registration. The follow-up run for commit [`91b02c0`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/91b02c0f6d0255a17bd24d7663aa184531021e60), [run #104](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38998685445), also completed successfully after adding adversarial cases for duplicate continuing Prize outputs and changed PrizePool accounting (14 pure transition tests plus 18 complete typed-context tests generated from canonical winning/loss fixtures). These runs establish that the isolated harness compiles and its included tests pass; they do not establish full Haskell/Aiken validator equivalence, native-ledger/Yaci parity, V2-to-V3 compatibility, or closure of the 16,384-byte transaction-size blocker. No validator deployment or protocol-wide GREEN claim follows from this evidence.

## CI artifact reuse

The Aiken workflow caches build outputs using a key derived from the manifest/lockfile, Aiken source files, both fixture generators, and workflow. An exact key hit reuses previously validated artifacts and skips the separate full `aiken check` logging step and `aiken build`; the fixture-driven `aiken check` still runs on every generated fixture set. Relevant input changes create a new key. The cache is saved only after a successful job. Compiler remains pinned to `v1.1.22`.

## Acceptance gates

- Parity tests pass on a cache miss; an exact cache hit references identical previously validated inputs.
- Haskell/Aiken vectors match and negative tests reject the same invalid states.
- V2-to-V3 compatibility review passes for the intended target ledger.
- Compiled script and complete transaction sizes are measured against the baseline, with versions labelled.
- CPU and memory costs are recorded with their cost model/version.
- Yaci ledger integration passes.
- IMMORTAL economic invariants and the existing V3 carrier remain unchanged.

CI may publish scripts and submit fixture-only transactions to an ephemeral local Yaci Conway ledger for conformance evidence. It does not deploy or submit production tickets on Cardano Preprod/mainnet, and these local fixtures do not establish production USDM/oracle qualification.

## Compiled script-size checkpoint (2026-10-17)

CI run [#120](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39011176926) measured the compiled Aiken `reveal.pre_rich_reveal.spend` entrypoint at **5,502 bytes**. Evidence:

- Validator hash: `0fc30c0b1779b0cf028b3b523f710757696a5ec108d419ff2ba8da82`
- SHA-256 of decoded `compiledCode` bytes: `75ec3a7574dc754774942b7e056dedf28e8b9750ad7e1755cb347b3935ee278a`
- Cardano transaction size ceiling used by the measurement: **16,384 bytes**
- JEV artifact: [`jev-aiken-reveal-parity-39011176926-1`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39011176926/artifacts/12092194510), SHA-256 `9d2792cd6e9677ccbc463d61e81454afdad550b672862772816a2f1c75763ea7`

Interpretation: the compiled script alone is below the transaction ceiling, so it is not disqualified by that simple lower-bound test. This is **not** a transaction-size pass. The measurement explicitly records complete transaction CBOR size, CPU/memory, and native-ledger acceptance as not measured; the deployment gate remains closed. It also does not establish behavioral equivalence between this Plutus V3 prototype and the current Plutus V2 validator.

### Next gate

Build and serialize a ledger-valid Aiken V3 reference-script publication transaction and a positive/negative Reveal pair in the controlled Yaci/Conway lab. Capture the actual final CBOR byte lengths, reference-script bindings, execution units and node acceptance/rejection, then compare the same semantic cases against the canonical Haskell CEK fixture. Do this in the isolated Aiken path: do not change the existing V3 carrier, Haskell Reveal validator, economic semantics, or the 16,384-byte limit.



## Integrated local Yaci checkpoint (2026-10-17, run #1778)

Evidence: [IMMORTAL Cardano Integration Lab run #1778](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39022514833), commit [`0a1d783`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/0a1d78321095ffd5d82bca144fc4998ee8e7cd75). The JEV registry and sanitized evidence artifact were uploaded and registered in Notion by the workflow.

### Passed in the isolated candidate path

- Aiken Reveal V3 compiled with Aiken v1.1.22; the target remains explicitly Plutus V3.
- The Aiken reference-script publication was accepted by local Yaci and bound to the exact output UTxO. The Aiken spend entrypoint is 5,502 bytes; the signed publication transaction was 5,809 bytes.
- The integrated Reveal transaction used the Aiken V3 PrizeValidator reference script and the real parameterized Plutus V2 B1PrizePool validator, bound to the Aiken PrizeValidator hash. The signed transaction was **1,245 bytes** against the observed 16,384-byte limit.
- The integrated fixture used deterministic ticket nonce 7, producing a nonzero payout of **200 sub-units** (tier 1 on each row). Yaci confirmed the transaction, observed Prize and Pool outputs, and the replay was rejected.
- A separate isolated probe also passed a zero-payout loss and wrong-secret rejection. Caveat: the standalone wrong-secret case uses a **test-only pool stub**, not the real B1PrizePool validator. The integrated path has therefore proved real-pool acceptance for loss and win, but not yet an integrated wrong-secret rejection using the real pool.

Integrated winning Reveal transaction: `c85513e887853d050388ab6f526ee9c27a0b91a5b785db1699efe33a5bb1acea`. Evidence artifact: [`immortal-cardano-lab-evidence`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39022514833/artifacts/12096873041), SHA-256 `64d18b359cea468f87dc2bb0c5aacc6b3f9b734eca3da67812f068b29afb3f9f`.

### Still open — do not infer production readiness

- **Canonical Reveal V2 still fails.** The same run reports the parameterized Haskell PrizeValidator at 17,954 bytes and the complete transaction at 18,051 bytes, exceeding the fixed 16,384-byte ceiling. The overall Cardano Lab therefore correctly remains FAIL.
- **Full Haskell/Aiken equivalence is not established.** The local Yaci fixture proves only the exercised states. More datum/redeemer edge cases, cross-implementation decision/state-effect comparisons, and an integrated wrong-secret rejection using the actual B1PrizePool validator remain required.
- **Execution-cost qualification is incomplete.** Yaci/Lucid reported ExUnits and the assigned budgets covered those measured values, but the evidence did not expose the protocol execution ceilings in that run. Do not mark CPU/memory limits qualified from those figures alone.
- **No production economic source was qualified by this fixture.** Liquidity is a synthetic test asset with identity-only 1:1 fixture valuation; `productionOracleQualified=false`. This is not authenticated canonical USDM evidence, does not close the EEV blocker, and is not a Preprod/mainnet test.
- **V2/V3 compatibility and migration remain open.** The modern pinned Aiken compiler's isolated V2-target probe failed; the production Haskell validator remains the canonical V2 reference. The working Aiken candidate is V3 and must not be substituted into production without an explicit migration decision and full acceptance evidence.
- The existing V3 carrier, IMMORTAL economic semantics, canonical Haskell validator, and 16,384-byte size ceiling remain unchanged. The gate to production remains closed.

### Next acceptance gate

1. Add a negative twin to the integrated Aiken V3 + B1PrizePool V2 local-Yaci path and prove that the wrong-secret transaction reaches ledger submission and is rejected.
2. Preserve the Haskell V2 CEK fixtures as the behavior reference and broaden differential coverage for all relevant datum/redeemer states, including accounting and state effects.
3. Capture resource usage plus active protocol execution limits from an authoritative source, then qualify CPU/memory separately from transaction size.
4. Define and evidence the production economic input/USDM source independently of this synthetic fixture; do not reuse this run as an EEV certificate.
5. Keep canonical V2 failure visible until a behavior-preserving implementation fits the hard limit. No branch, adapter, carrier, or economic-rule change is implied by this experiment.


## Claim migration checkpoint (2026-10-17)

The first isolated Aiken Claim parity seam is in `lib/immortal/claim_transition.ak`. It encodes the state/accounting invariants shared by `PrizeValidator.validateClaim` and B1PrizePool's `TicketClaimed` branch: Revealed → Claimed, positive frozen payout, finite upper validity bound, immutable Prize identity/result/tiers, exactly one Prize and pool input/output, exact reductions in liquidity and pending liabilities, unchanged reserve/count/jackpot configuration, and the pool's basic post-transition solvency inequality.

**This is not yet a migrated or deployable Claim validator.** Owner signature, exact oracle-valued settlement, actual UTxO/datum resolution, continuing-value equality, and the complete B1 pool context must still be wired to Aiken's typed transaction context and proven with Haskell differential fixtures and ledger-valid Yaci twins. The three external booleans in the parity seam are intentionally explicit; they are not evidence that those checks have already been implemented.

The existing `validators/reveal.ak` entrypoint and the production Haskell validators are unchanged. The fixed 16,384-byte ceiling remains in force. Before choosing Aiken as the fix, the Claim reference-CBOR diagnostic must establish whether the 16,461-byte transaction actually embeds Plutus scripts or whether its size is dominated by redeemers/datums/other witnesses. A smaller compiled script alone does not prove the complete Claim transaction will fit.

## Claim migration gate — 2026-10-18

### Confirmed blocker

The Claim Integration Lab trace currently fails before it constructs the Claim spending transaction. It first tries to publish the parameterized Haskell `PrizeValidator` as a reference script. The normal Lucid construction path reports 16,461 bytes against the unchanged 16,384-byte Cardano transaction limit. The diagnostic-only path can serialize a candidate, but ledger submission rejects the 16,525-byte signed transaction. This diagnostic allowance is not a protocol-limit change and is not a successful Claim test.

### Validator-hash coupling

A standalone Aiken Claim script cannot be substituted into the existing flow without a coordinated migration: `PrizeDatum.prize_pool_hash` and `B1PrizePoolDatum.prize_hash` bind the ticket and pool to the same Prize validator hash. A second Claim-only script would break this binding unless the datum/address/parameter deployment is redesigned coherently. Any migration candidate must therefore establish one canonical parameterized Prize validator hash and use it consistently for Reveal, Claim, Expire, pool datum bindings, reference scripts, and test fixtures.

### Claim implementation acceptance gates

The current `claim_transition.ak` is a pure predicate seam, not a transaction validator. Its booleans for owner signature, exact payout, and value preservation are caller-supplied and cannot be treated as on-chain proof. A production candidate must, at minimum:

1. Resolve exactly one own Prize input and its datum; resolve exactly one B1 PrizePool input and its datum, and their required continuing outputs.
2. Verify the owner signature from the actual transaction signatories, not a supplied boolean.
3. Verify the canonical finite upper validity bound against the existing expiry rule.
4. Verify the exact settlement asset/amount and recipient from transaction outputs, and preserve the Prize output value as required by the existing Claim semantics.
5. Authenticate any oracle state and publisher required by the existing economic predicate, including asset identity and freshness; do not replace this with an unqualified payout boolean or an invented direct-USDM valuation.
6. Preserve the existing Prize datum identity and exact PrizePool accounting deltas; reject missing or duplicate inputs/outputs and malformed/unbounded contexts.
7. Wire the opt-in Claim trace so it chooses the candidate validator **before** reference-script publication, avoiding publication of the oversized Haskell PrizeValidator on that route.
8. Pass Aiken tests, canonical Haskell differential fixtures, ledger-valid Yaci/native-ledger positive and adversarial twins, and measured script/transaction size checks. Keep the 16,384-byte limit unchanged.

Until these gates pass, this package remains an isolated migration prototype. No production validator selection, deployment, or GREEN status is implied by this note.



## Claim typed-context implementation — 2026-10-18

The isolated Aiken Prize entrypoint now accepts three configuration parameters matching the Claim oracle perimeter: Oracle State policy ID, Oracle State token name, and publisher verification-key hash. The existing Reveal and Expire branches still dispatch to their pre-existing transition predicates; Claim dispatches to `claim_transaction.ak`.

The Claim trace has an environment-gated `IMMORTAL_CLAIM_AIKEN_V3=1` route, and the Cardano Integration Lab workflow opts into it for its isolated Claim fixture. The workflow runs `aiken check` before `aiken build`. The route selects Aiken before publishing the Prize reference script, then rebinds the real Plutus V2 B1PrizePool validator to the exact parameterized Aiken Prize hash. The offchain Aiken Reveal probe, Reveal trace and Expire trace were also updated to apply identical parameters before computing the executable script hash; the publication probe verifies its materialized reference script against the **parameterized** hash.

These changes address loader/hash consistency and allow the lab to exercise the candidate without first publishing the oversized Haskell PrizeValidator. They do **not** close Claim until the pinned Aiken build/check passes, the full final transaction fits the unchanged 16,384-byte limit, the real Yaci ledger accepts a valid Claim and rejects adversarial twins, and datum/oracle/pool behavior is differentially compared with the canonical Haskell V2 path. Oracle data used by the current lab is synthetic and is not production economic qualification. No production deployment or V2-to-V3 migration approval follows from this work.

### Claim owner-scan parity correction (2026-10-18)

The production-shaped candidate in `lib/immortal/claim_transaction.ak` and the helper in `lib/immortal/claim_context.ak` now use the same owner-selection behavior as `PrizeValidator.ticketOwnerPkh`: scan inputs in order, select the first input with exactly one ticket NFT, and require that input to have a public-key credential. If the first matching input is script-locked, lookup fails closed; it does not skip to a later matching input. This avoids introducing a duplicate-ticket rejection rule absent from the Haskell reference.

The helper's tests cover absent-ticket inputs. They do not yet prove first-match behavior with constructed transaction fixtures. No Aiken compilation or CI result is asserted for this correction until a workflow run for the exact resulting commit is inspected.

This is a parity correction only. It does not establish complete Haskell/Aiken equivalence, native-ledger acceptance, the 16,384-byte transaction-size gate, or approval for deployment. The Haskell validator and existing V3 carrier remain unchanged.

### Claim oracle decoder parity correction (2026-10-18)

A source-to-source comparison of `lib/immortal/claim_transaction.ak::oracle_price_for` with the canonical `plutus/Economic.hs::oraclePriceFor` found that a hard Aiken `expect OracleDatum = raw` would abort on a malformed candidate, whereas Haskell's `fromBuiltinData` returns `Nothing` and continues scanning.

The candidate now uses Aiken's non-aborting soft cast through `decode_oracle_datum` and recurses to the next reference input on decode failure. A unit test, `claim_oracle_decoder_returns_none_for_malformed_data`, was added for malformed integer data. This is source-level progress, **not yet confirmed by compilation or differential runtime evidence**.

The Yaci Claim trace now contains a transaction-level candidate for the scan boundary: the synthetic bootstrap places a malformed Oracle State datum before a valid matching datum, the default positive Claim reads both references, and a malformed-only negative Claim must be rejected. The fixture deliberately duplicates the configured singleton unit across two synthetic UTxOs; this is test-only state to force the scan behavior and is not a production singleton deployment or economic evidence.

This is **not yet a canonical Haskell/Aiken differential result**: the current trace selects the isolated Aiken V3 candidate, while the canonical Haskell PrizeValidator reference-script publication is oversized. The fixture and pinned Aiken `v1.1.22` checks/build still need to run on the exact commit, and Yaci must confirm that the malformed-first/valid-second Claim is accepted while malformed-only is rejected. Then compare equivalent decisions against canonical Haskell CEK fixtures when that path can be exercised without violating the 16,384-byte limit. Do not weaken authentication, skip the configured singleton requirement, or replace the oracle check with a caller-supplied value. This isolated Claim-candidate work does not justify changes to Reveal, Expire, the existing V3 carrier, economic rules, or the size limit.

No CI/compilation or ledger pass is claimed for this correction or the current Claim candidate.

## Integrated real-pool wrong-secret twin — source status (2026-10-22)

The earlier 2026-10-17 checkpoint correctly recorded that the standalone `aiken-reveal-ledger-probe.ts` uses a test-only pool stub. A separate integrated negative twin is now present in `audit/cardano-integration/reveal-ledger-trace.ts`: when `IMMORTAL_REVEAL_AIKEN_V3=1`, it uses the parameterized Aiken V3 Prize validator together with the real B1PrizePool V2 validator bound to the Aiken Prize hash. The wrong-secret transaction is constructed and submitted before the valid Reveal spends the shared fixture inputs; the trace requires a validator/ledger rejection and confirms the original Prize and Pool UTxOs remain unspent.

The existing `.github/workflows/immortal-cardano-lab.yml` invokes this trace in the Aiken V3 preflight and active Reveal steps. This is a **source-level implementation finding only**. Do not treat the integrated-negative gate as passed until a run on the exact current commit produces logs/evidence showing that the wrong-secret transaction reached Yaci submission and was rejected by validator execution. If a run is missing or predates this code, run the existing lab workflow once; do not create a duplicate probe.

The negative twin reuses ExUnits from the valid twin only to construct the intentionally invalid transaction. It is not CPU/memory qualification. All fixtures remain synthetic local Yaci evidence; the Haskell V2 size blocker, full Haskell/Aiken state-effect parity, V2/V3 compatibility, production USDM/EEV qualification, and deployment approval remain open. The Haskell validator, existing V3 carrier, Reveal/economic semantics, and 16,384-byte ceiling remain unchanged.

