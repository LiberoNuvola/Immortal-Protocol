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

## 2026-10-21 follow-up — exact-rational conversion candidate, not yet an economic decision

The isolated `lib/immortal/ada_usd_probe.ak` now includes a pure `pyth_ada_usd_to_usdm_subunits` candidate. It keeps the signed Pyth raw price/exponent until one exact integer conversion, uses the existing `1,000,000` lovelace-per-ADA and `100` USDM-subunits-per-USDM conventions, and accepts an explicit rational parameter `D = USD per 1 USDM` as numerator/denominator. It does **not** default `D` to 1:1, does not select the ratio, and is not called by the quote-carrier or production settlement validators.

The new vectors cover:
- an explicit synthetic `D = 1 USD/USDM` case;
- a raw-price boundary where rounding the feed price first would change the answer;
- synthetic `D = 2` and `D = 3/2) cases proving that the code does not silently assume USD/USDM parity;
- a non-negative feed exponent and invalid ratios/amounts/exponents.

[Run 39604543598](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39604543598) passed on commit `c05267ca202bae85332870ef4c98b8972175d283`, whose probe source is byte-identical to this working branch. The run reports 15 tests passed in the raw-feed/conversion module, 12 passed in the quote-carrier module, and 27 Aiken checks with zero errors/warnings. Both `aiken check` and `aiken build` passed. The quote-carrier compiled-code field is now 8,363 bytes; this is validator code size, not full transaction CBOR.

**The key blocker has narrowed, not closed:** the function’s `D) parameter is still a fixture/config input. No authoritative source, on-chain singleton, governance policy, precision/freshness contract, or conservative admissibility rule for USD per USDM has been qualified. It must not be copied into the real MintPolicy as an off-chain value, and raw ADA/USD may not be used as if it were USDM price. The helper remains an isolated design/conformance candidate.


## Gate A — controlled Preprod ledger probe

A manual workflow, `.github/workflows/pyth-native-ledger-probe.yml`, and a separate consumer validator were added to make a real signed-update test reproducible without wiring Pyth into Issue.

- `validators/pyth_signed_update_ledger_probe.ak` is a minimal Plutus V3 consumer. It demands the configured Pyth State, a single update, ADA/USD feed ID 16, a positive price, and the existing freshness window; it is not connected to Treasury or production economics.
- `scripts/testPythSignedUpdatePreprod.mts` obtains an actual signed Lazer payload, resolves the configured Cardano Preprod Pyth State, and fingerprints the payload without storing the raw bytes. In submission mode it funds a no-datum probe UTxO and then submits a consumer spend with the Pyth zero-withdrawal in the same transaction.
- The workflow is `workflow_dispatch` only. Its `submit_preprod` input defaults to `false`; this mode only fetches the update/state and writes a `PREPARED_NOT_SUBMITTED` evidence record. No automatic push runs submit transactions.
- To run the on-chain positive case, configure repository secrets `PYTH_LAZER_TOKEN`, `PYTH_PREPROD_TEST_MNEMONIC` (a dedicated, funded testnet wallet only) and `PREPROD_BLOCKFROST_PROJECT_ID` or `VITE_BLOCKFROST_PROJECT_ID`. Enter the 56-hex Preprod Pyth deployment policy ID as the manual workflow input, review that it resolves to the intended Pyth State, and explicitly set `submit_preprod=true`. The first run may submit a separate 5 ADA funding transaction, followed by the verification transaction.
- The runner also evaluates a one-byte-mutated payload locally and never submits it. This is only a local negative result, **not** an on-chain rejection proof. On successful submission, an evidence artifact records the state reference, payload digest, transaction hashes, serialized CBOR size and best-effort redeemer/execution-unit observation.

**Gate A status after adding the harness: IMPLEMENTATION PREPARED, REAL LEDGER EVIDENCE NOT YET OBSERVED.** A source commit or green compilation must not be labelled as a successful native-ledger signature test. Even after a successful Preprod positive case, the on-chain negative case, USD/USDM unit decision and MintPolicy-to-carrier binding remain open.
