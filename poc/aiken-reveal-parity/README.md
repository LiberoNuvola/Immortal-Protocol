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

The latest completed CI run (#55) passed the original isolated Aiken check/build, seven initial Haskell-derived serialization fixtures, semantic vectors, and the fail-closed evidence gate. Newer commits add Haskell-derived winning/loss transition snapshots and expiry-boundary vectors; their status must be established by the CI run for those commits. Even when those tests pass, the evidence is **partial Haskell-to-Aiken parity** for selected Plutus Data encodings and pure predicates, not full Reveal validator parity. Current paired references and remaining gaps are:

| Behavior | Canonical Haskell reference | Aiken seam | Current evidence |
|---|---|---|---|
| Row outcome boundaries and rejection sampling | `plutus/GameRules.hs` | `lib/immortal/game_rules.ak` | Fixed-vector tests exist on both sides; automated single-source fixture consumption is still missing |
| Prize tier and payout formula / 500x cap | `plutus/GameRules.hs` | `lib/immortal/reveal_rules.ak` | Aiken tests and Haskell golden-vector assertions; shared fixture runner still missing |
| Reveal validity upper bound | `plutus/PrizeValidator.hs` (`claimBeforeExpiry`) | `lib/immortal/reveal_context_guards.ak` | Predicate-level boundary tests only |
| Reveal pool accounting | `plutus/PrizeValidator.hs` (`validateReveal.poolOk`) | `lib/immortal/reveal_context_guards.ak` | Predicate-level positive/negative tests only |
| Typed Cardano context, unique inputs/outputs, continuing value | `plutus/PrizeValidator.hs` | `lib/immortal/reveal_context.ak` | Structural typed-context guard only; not full validator parity |
| Datum/redeemer serialization | `plutus/Types.hs` | `lib/immortal/reveal_types.ak` | CI-generated Haskell fixtures are consumed by generated Aiken tests for `PrizeDatum.pending`, all four `PrizeAction` constructors, `BeaconTarget`, and `B1PrizePoolDatum`; broader datum/state coverage and full round-trip coverage remain open |

### Next acceptance gate

1. Construct test-only `ScriptContext` fixtures and exercise the canonical `PrizeValidator.mkValidator` for valid Reveal and negative twins for every failed guard. Current transition fixtures calculate and serialize canonical state snapshots but deliberately do not claim to invoke the validator.
2. Extend the Haskell/Aiken shared schema with relevant transaction-context counts, value-preservation facts, and explicit expected accept/reject classifications produced by the canonical validator evaluation.
3. Record the Haskell source revision and fixture schema version; never treat hand-copied constants as differential evidence.
4. Expand serialization coverage to additional datum states and round-trip/decoder checks before validator wiring.
5. Keep full validator equivalence, V2-to-V3 compatibility, size/cost measurement, and Yaci integration as separate gates.

Current evidence remains **partial differential parity** for selected serialization, crypto, derived win/loss state snapshots, accounting predicates, and expiry boundaries; **full validator-evaluated Reveal parity is NOT YET RUN**. No validator deployment or protocol-wide GREEN claim follows from these tests.

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
