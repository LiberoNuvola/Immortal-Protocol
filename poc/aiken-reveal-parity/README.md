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
- `lib/immortal/reveal_context.ak`: first typed-context increment over Aiken's actual `cardano/transaction` types. It resolves the own input by output reference, derives the spent Prize script credential, checks unique Prize input/continuing output, compares actual typed `Value` equality, and checks exactly one PrizePool input/output by configured script hash. This is still a structural guard, not a complete Reveal validator; datum/redeemer decoding and all Reveal semantics remain unimplemented.

The guard module tests logical predicates only. It does **not** decode a real Cardano transaction context, prove that a byte string is the canonical encoding of a Cardano Value, locate actual UTxOs, or establish full validator equivalence.

## Not implemented yet

1. Decode and validate PrizeDatum, B1PrizePoolDatum and the Reveal redeemer from the actual Plutus V3 transaction context; bind the pool hash from authenticated datum/configuration rather than an untrusted caller; verify unique Prize and PrizePool UTxOs and actual value preservation.
2. Wire the existing beacon, player secret, ticket commitment, generated result, payout and pool predicates into the validator.
3. Build cross-language fixtures from Haskell and negative twins.
4. Compile the complete validator and measure script size, full transaction size, CPU and memory against a version-labelled baseline.

No production artifact may be switched to this package until full behavior passes Haskell differential tests and native-ledger integration tests.

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
