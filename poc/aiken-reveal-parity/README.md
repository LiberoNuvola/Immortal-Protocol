# PRE-RICH Reveal — Aiken parity prototype

**Status:** isolated parity harness; not a production validator and not deployable.

This package starts a controlled Aiken implementation path for Cardano without changing the IMMORTAL normative kernel, the existing Haskell validator, the existing V3 carrier, Reveal semantics, or any deployed artifact.

## Why this exists

The current Integration Lab failed at Reveal with a transaction size of 18,051 bytes against Cardano's 16,384-byte limit. Aiken is being evaluated as an alternative implementation language for the Cardano on-chain validator, not as a change to IMMORTAL's economic rules.

## Important compatibility constraint

Aiken currently supports Plutus V3 only. The existing Haskell Reveal validator is explicitly compiled as Plutus V2. Therefore an Aiken port is **not a drop-in language replacement**: a complete Aiken Reveal implementation would be a Plutus V3 script and must pass a separately gated V2-to-V3 compatibility review, including target-ledger support, context encoding, cost model, transaction behavior, and datum/redeemer compatibility. The existing V3 carrier is not being changed by this experiment.

## Current scope

- `lib/immortal/reveal_rules.ak` mirrors `GameRules.classifyRowTier`, `prizeAmountForTier`, `rowPayoutTotal` (including the existing 500x cap), and the pure PrizePool accounting checks used by Reveal.
- `lib/immortal/beacon.ak` ports the current `Beacon.hs` field encoding, player/ticket commitments, beacon derivation, ticket seed, and symbols seed.
- `lib/immortal/game_rules.ak` ports row outcome rejection sampling, tier boundaries, deterministic row-symbol construction, and the six-symbol summary tier.
- `lib/immortal/reveal_context_guards.ak` ports pure parity seams for finite validity bounds, unique input/output counts, and immutable Prize datum identity fields. These functions do not yet decode or validate a real Cardano transaction context.
- Fixed SHA-256 and game-rule test vectors plus negative guard cases cover byte encoding, hash outputs, rejection sampling, row generation, expiry boundaries, and identity preservation. They do not yet establish full validator equivalence.

The prize table values and formulas are copied from the current Haskell source. They are not new economic decisions.

## Explicitly not implemented yet

This is **not yet a port of the full Reveal validator**. Remaining work includes:

1. Aiken decoding and validation of the actual Plutus V3 transaction context, including unique Prize/PrizePool input/output checks, datum decoding, continuing output identity and value preservation.
2. Exact Reveal-specific checks for beacon, player secret, ticket commitment, generated result, prize amount, and atomic PrizePool accounting, wired to the real context.
3. Cross-language fixtures generated from the Haskell implementation and full negative twins.
4. Compiled validator and full transaction size/cost measurements; pure modules are not a meaningful replacement-size comparison.

No production artifact may be switched to this package until the complete behavior is tested against Haskell vectors and native-ledger integration tests.

## CI artifact reuse

The Aiken workflow caches validated build outputs with a key derived from the manifest/lockfile, all Aiken source files, and the workflow itself. An exact key hit reuses previously successful artifacts and skips both `aiken check` and `aiken build`; a relevant source/config/workflow change creates a new key and reruns both. The cache is saved only after a successful job. Compiler remains pinned to `v1.1.22`.

## Reproducibility and acceptance gates

- All Aiken parity tests pass on a cache miss; an exact cache hit references the same previously validated source/config hash.
- Fixed vectors from Haskell and Aiken produce identical outputs.
- Negative tests reject the same invalid states.
- V2-to-V3 compatibility review passes for the intended target ledger.
- Compiled script and complete transaction sizes are measured against the current baseline, with script versions labelled.
- CPU and memory costs are recorded with their cost model/version.
- Yaci ledger integration passes.
- IMMORTAL economic invariants and the existing V3 carrier remain unchanged.

CI does not deploy, mint, or submit transactions.
