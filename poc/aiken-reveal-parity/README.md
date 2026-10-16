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
- `lib/immortal/reveal_types.ak`: Aiken data declarations matching the Haskell `PrizeDatum`, `PrizeAction`, `BeaconTarget`, status enums and `B1PrizePoolDatum` constructor/field order. These declarations are a schema port. The CI generates canonical Haskell Plutus Data fixtures and Aiken tests for seven initial constructor/layout examples plus Haskell-derived winning and zero-payout-loss Pending-to-Revealed snapshots, PrizePool before/after snapshots, payout/accounting predicates, and expiry-boundary vectors. These are serialization and pure-predicate checks; they do not invoke the full Haskell validator against a real or constructed `ScriptContext`.
- `lib/immortal/reveal_context.ak`: typed-context guard over Aiken's actual `cardano/transaction` types. It resolves the own input by output reference, derives the spent Prize script credential, checks unique Prize input/continuing output, compares actual typed `Value` equality, and checks exactly one PrizePool input/output using the pool hash carried in the typed Prize datum. This is still a structural guard, not a complete Reveal validator; pool datum decoding and all Reveal semantics remain unimplemented.

The guard module tests logical predicates only. It does **not** decode a real Cardano transaction context, prove that a byte string is the canonical encoding of a Cardano Value, locate actual UTxOs, or establish full validator equivalence.

## Not implemented yet

1. Add Haskell/Aiken serialization fixtures proving the typed datum declarations decode the exact existing CBOR schema; decode and validate B1PrizePoolDatum from the unique matching pool input/output and verify the datum hash binding.
2. Wire the existing beacon, player secret, ticket commitment, generated result, payout and pool predicates into the validator.
3. Build cross-language fixtures from Haskell and negative twins.
4. Compile the complete validator and measure script size, full transaction size, CPU and memory against a version-labelled baseline.

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
2. Build ledger-valid Cardano/Yaci integration transactions with datum/redeemer/context encodings and test the same positive and negative twins at the native ledger boundary.
3. Keep the Plutus V2 to Aiken/Plutus V3 compatibility review separate; the existing V3 carrier remains unchanged.
4. Measure the compiled validator and complete transaction size, CPU, and memory against version-labelled baselines. The previously observed Reveal transaction-size blocker remains unresolved by this harness.
5. Expand datum/redeemer serialization states and round-trip/decoder checks; record canonical source revision and fixture schema version in evidence.

Current status: **synthetic-context Plutus V2 CEK conformance PASS for 11 representative cases; selected Haskell-to-Aiken fixture/predicate parity PASS; full Haskell/Aiken validator equivalence, native-ledger/Yaci parity, V2-to-V3 compatibility, and transaction-size closure NOT YET ESTABLISHED**. No validator deployment or protocol-wide GREEN claim follows from this evidence.

## CI artifact reuse

The Aiken workflow caches build outputs using a key derived from the manifest/lockfile, Aiken source files and workflow. An exact key hit reuses the previously successful artifacts and skips both `aiken check` and `aiken build`; any relevant input change creates a new key and runs both. The cache is saved only after a successful job. Compiler remains pinned to `v1.1.22`.

## Acceptance gates

- Parity tests pass on a cache miss; an exact cache hit references identical previously validated inputs.
- Haskell/Aiken vectors match and negative tests reject the same invalid states.
- V2-to-V3 compatibility review passes for the intended target ledger.
- Compiled script and complete transaction sizes are measured against the baseline, with versions labelled.
- CPU and memory costs are recorded with their cost model/version.
- Yaci ledger integration passes.
- IMMORTAL economic invariants and the existing V3 carrier remain unchanged.

CI does not deploy, mint, or submit transactions.
