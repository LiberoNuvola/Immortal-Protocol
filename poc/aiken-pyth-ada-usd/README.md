# Isolated Pyth Lazer ADA/USD Probe

**Status: feasibility probe only — not a production oracle, not wired to Issue, not deployed.**

This project tests one narrow question: can an on-chain Plutus V3 consumer bind a candidate datum to the exact ADA/USD price/exponent/timestamps extracted by Pyth's official Aiken library from a transaction carrying the Pyth State reference input and the Pyth zero-withdrawal verification redeemer?

## Boundary

- Pyth feed: ADA/USD, feed ID 16, as documented by the [Cardano Developer Portal](https://developers.cardano.org/docs/build/integrate/oracles/pyth/) and [Pyth's Cardano consumer guide](https://docs.pyth.network/price-feeds/pro/integrate-as-consumer/cardano).
- Library: `pyth-network/pyth-lazer-cardano`, pinned in `aiken.toml` to upstream commit [`217b5917228b17f015719b27dd616a75ad6bd800`](https://github.com/pyth-network/pyth-lazer-cardano/commit/217b5917228b17f015719b27dd616a75ad6bd800), used through `pyth.get_updates`. The consumer does not implement signature verification itself. Pyth's verification script must execute in the same transaction for the signed update supplied as the zero-withdrawal redeemer to be authenticated.
- Freshness: reuses the current protocol's one-hour maximum age. Update timestamp and feed-specific timestamp are both required, must not exceed the finite transaction upper validity bound, and must lie within that existing window. The validator rejects absent/non-finite upper bounds, missing fields, stale/future timestamps, non-positive price, and duplicate/missing ADA/USD feed identities.
- Binding: the probe's marker datum repeats the raw price, exponent and both timestamps. The consumer only accepts when those fields match the quote extracted from the Pyth update. This tests whether a caller-supplied value can be substituted without also matching the signed update.

## Deliberate non-goals

This does **not** convert Pyth's raw price/exponent into the existing `OracleQuote.price` integer. The current B1 economic contract values a ledger quantity with the fixed precision and `ceilingDiv` rule; the exact quote scale, token-unit semantics and conservatism of conversion from USD/ADA into USDM sub-units must be justified without adding an ungoverned rounding rule. Until that mapping is specified and proven, this probe's raw price is not admissible as an IMMORTAL settlement or EEV value.

It also does not:
- update or replace the existing Oracle singleton;
- author a new OracleQuoteSet or publish a price;
- change Plutus V2 `MintPolicy`, its equality check, V3 carrier or Reveal;
- claim Pyth signed-data verification because of `aiken check` alone;
- prove a full native-ledger transaction has executed the actual Pyth verifier, the probe validator and an existing IMMORTAL settlement predicate in the same transaction;
- claim NIGHT/USD or PRE/USD feeds exist;
- establish Pyth liveness, full market-source truth, or the project's 100% permissionless goal.

## CI contract

`aiken check` exercises only synthetic pure vectors for freshness/feed selection/binding; the fixtures are not price observations and do not validate a signature. `aiken build` verifies the isolated Plutus V3 consumer compiles against the exact Pyth Git commit and stdlib/compiler versions specified by the manifest. The CI workflow preserves `aiken.lock`, `plutus.json`, their hashes and a build manifest as a short-lived artifact. A pass is only a code-level feasibility result.

Further gates before considering integration:
1. Resolve and retain the exact upstream Pyth package revision in the generated lockfile/evidence.
2. Supply a genuine signed ADA/USD update and demonstrate the Pyth zero-withdrawal verifier rejects a tampered payload on a controlled native ledger.
3. Demonstrate the same transaction supplies Pyth State reference, signature-verifying withdrawal, consumer validator and raw-quote binding, and capture final CBOR size plus CPU/memory.
4. Define and verify the exact existing-contract unit conversion from Pyth raw USD/ADA price to the quote integer consumed by `Economic.totalUsdmValue`. No implicit rounding/scale guess is authorized.
5. Verify that the on-chain value used by `MintPolicy.atomicTreasuryPaymentValid` is exactly the Pyth-derived, source-verified value, not a separate stale legacy OracleDatum quote. If this cannot be proven without changing normative semantics, stop at this probe.

No production source, deployment or protocol state is changed by this package.