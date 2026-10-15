# PRE-RICH Reveal — Aiken parity prototype

**Status:** isolated first-stage parity harness; not a production validator and not deployable.

This package starts a controlled Aiken implementation path for Cardano without changing the IMMORTAL normative kernel, the existing Haskell validator, V3 carrier, Reveal semantics, or any deployed artifact.

## Why this exists

The current Integration Lab failed at Reveal with a transaction size of 18,051 bytes against Cardano's 16,384-byte limit. The run's diagnostic output confirmed the reference-script publication path was reached. Aiken is being evaluated as an alternative implementation language for the Cardano on-chain validator, not as a change to IMMORTAL's economic rules.

## Important compatibility constraint

Aiken currently supports Plutus V3 only. The existing Haskell Reveal validator is explicitly compiled as Plutus V2. Therefore an Aiken port is **not a drop-in language replacement**: a complete Aiken Reveal implementation would be a Plutus V3 script and must pass a separately gated V2-to-V3 compatibility review, including target-ledger support, context encoding, cost model, transaction behavior, and datum/redeemer compatibility. The existing V3 carrier is not being changed by this experiment.

## Current scope

- `lib/immortal/reveal_rules.ak` mirrors `GameRules.classifyRowTier`, `prizeAmountForTier`, `rowPayoutTotal` (including the existing 500x cap), and the pure PrizePool accounting checks used by Reveal.
- `lib/immortal/beacon.ak` ports the current `Beacon.hs` field encoding, player/ticket commitments, beacon derivation, ticket seed, and symbols seed.
- Fixed SHA-256 test vectors guard the byte encoding and hash outputs. These vectors are independent constants and do not yet establish full validator equivalence.

The prize table values and formulas are copied from the current Haskell source. They are not new economic decisions.

## Explicitly not implemented yet

This is **not yet a port of the full Reveal validator**. In particular, the next parity work must port and verify:

1. deterministic row generation and row-tier/result encoding;
2. datum identity and continuing-output checks;
3. unique Prize and PrizePool input/output checks, value preservation, expiry, and transaction-context bindings;
4. cross-language fixtures generated from the Haskell implementation and full negative twins.

No production artifact may be switched to this package until the complete behavior is tested against Haskell vectors and native-ledger integration tests.

## Reproducibility

Compiler is pinned to Aiken `v1.1.22`; this isolated harness targets Plutus V3 because Aiken does not support V2. This target-version difference must remain explicit in every size/cost comparison. CI runs `aiken check` and `aiken build` only. It does not deploy, mint, or submit transactions.

## Acceptance gates

- All Aiken parity tests pass.
- Fixed vectors from Haskell and Aiken produce identical outputs.
- Negative tests reject the same invalid states.
- V2-to-V3 compatibility review passes for the intended target ledger.
- Compiled script and complete transaction sizes are measured against the current baseline, with script versions labelled.
- CPU and memory costs are recorded with their cost model/version.
- Yaci ledger integration passes.
- IMMORTAL economic invariants and the existing V3 carrier remain unchanged.
