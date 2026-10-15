# PRE-RICH Reveal — Aiken parity prototype

**Status:** isolated first-stage parity harness; not a production validator and not deployable.

This package starts a controlled Aiken implementation path for Cardano without changing the IMMORTAL normative kernel, the existing Haskell validator, V3, Reveal semantics, or any deployed artifact.

## Why this exists

The current Integration Lab failed at Reveal with a transaction size of 18,051 bytes against Cardano's 16,384-byte limit. The run's diagnostic output confirmed the reference-script publication path was reached. Aiken is being evaluated as an alternative implementation language for the Cardano on-chain validator, not as a change to IMMORTAL's economic rules.

## Current scope

`lib/immortal/reveal_rules.ak` mirrors a small, testable subset of the existing Haskell implementation:

- `GameRules.classifyRowTier`
- `GameRules.prizeAmountForTier`
- `GameRules.rowPayoutTotal`, including the existing 500x cap
- the pure PrizePool accounting equalities/inequalities checked by Reveal

The prize table values and formulas are copied from the current Haskell source. They are not new economic decisions.

## Explicitly not implemented yet

This is **not yet a port of the full Reveal validator**. In particular, the next parity work must port and verify:

1. byte-for-byte commitment encoding and player commitment checks;
2. beacon re-derivation and Materios context binding;
3. ticket seed and symbol seed derivation;
4. deterministic row generation and row-tier/result encoding;
5. datum identity and continuing-output checks;
6. unique Prize and PrizePool input/output checks, value preservation, expiry, and transaction-context bindings.

No production artifact may be switched to this package until the complete behavior is tested against Haskell vectors and native-ledger integration tests.

## Reproducibility

Compiler is pinned to Aiken `v1.1.22`; the package targets Plutus V2 to match the current Reveal implementation. CI runs `aiken check` and `aiken build` only. It does not deploy, mint, or submit transactions.

## Acceptance gates

- All Aiken parity tests pass.
- Fixed vectors from Haskell and Aiken produce identical outputs.
- Negative tests reject the same invalid states.
- Compiled script and complete transaction sizes are measured against the current baseline.
- CPU and memory costs are recorded.
- Yaci ledger integration passes.
- IMMORTAL economic invariants and V3 remain unchanged.
