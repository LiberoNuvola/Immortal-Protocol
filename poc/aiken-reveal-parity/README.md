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
