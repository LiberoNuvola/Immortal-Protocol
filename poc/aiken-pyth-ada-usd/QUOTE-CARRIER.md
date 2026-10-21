# Isolated Pyth Lazer ADA/USD Quote Carrier

**Status: POC only. Not a production oracle and not wired into PRE-RICH Issue or MintPolicy.**

This second-stage probe tests the state transition that the simple marker consumer did not prove: the unique carrier singleton is consumed, the same singleton and physical Value are preserved at its continuing output, and the output datum's raw ADA/USD price/exponent/timestamps must match the Pyth update read in the same transaction.

## Transaction contract

- Exactly one input and one output use the current quote-carrier script hash.
- The carrier authority NFT must be present exactly once in the transaction inputs and outputs.
- The continuing output has the same address and exact Value as the consumed state.
- Its datum contains exactly the tuple returned by `pyth.get_updates` through the Pyth policy/state reference and its signed-update withdrawal redeemer.
- The Pyth signature-verification withdrawal must execute in the same ledger transaction. This source does not validate signatures by itself.
- Both the transaction update timestamp and the feed-specific timestamp must be within the currently used one-hour maximum and not later than the finite transaction validity upper bound.

The carrier intentionally adds no sequence, nonce, anti-replay rule or economic constant. Pyth's signed update can be reused while it remains fresh, in line with the upstream integration model; the probe does not decide whether a stricter replay policy should govern production.

## What remains unproved

The current Haskell Plutus V2 MintPolicy still values Treasury from an Oracle State reference input. This POC has **not** made MintPolicy read the continuing carrier output, and a parallel valid Pyth withdrawal does not prove the old OracleQuote was derived from the Pyth update. A separate Haskell/Economic binding and a positive/negative native-ledger transaction are still required.

The Pyth ADA/USD price/exponent also still needs a governed conversion into the current USDM-subunit domain; the POC preserves the raw quote and does not introduce an off-chain or ungoverned rounding rule. This does not qualify PRE/USD or NIGHT/USD feeds, update the Oracle singleton, deploy scripts, or authorize Issue.

CI uses synthetic datum/context tests and compilation only. It does not prove a signature or ledger acceptance.


## Latest isolated carrier CI

Run [Isolated Pyth ADA USD Probe #12](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602416931) passed on commit `7298455cd01ee73915d294e713fbb8ef355f7e8a`. The `aiken check` phase reports 13 synthetic tests passing, including the original nine price/feed/freshness checks plus:
- exact fresh quote tuple accepted;
- substituted price or exponent rejected;
- stale update rejected even when output tuple matches;
- missing output quote rejected.

The compiled Plutus V3 blueprint artifact is [`pyth-ada-usd-probe-7298455cd01ee73915d294e713fbb8ef355f7e8a`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602416931/artifacts/12346542438), artifact ID `12346542438`. Manifest hashes: `aiken.toml` `ecd2615377622857982fea7de81e81eb664d8fc31866a8067ed976fc5054397b`; `aiken.lock` `bfecbc5440e3c386bcc8e382daa13d1d6695c8d0ede8003cf88bc19a4e423e07`; `plutus.json` `3b7fb17a17061e586ed26523b85bfdd01a4ff70f148f7dfd20bbc239ce3c0914`. Compiled code size: marker-consumer spend 6,806 bytes; quote-carrier spend 8,289 bytes. These are individual compiled validator fields, not full transaction CBOR.

**Scope limit unchanged:** the carrier validator binds its continuation datum to the pure quote selection in the Aiken model and is compiled, but no genuine Pyth-signed update has been tested on a native Cardano ledger. The existing MintPolicy still does not consume this carrier price.


## 2026-10-21 follow-up — adversarial state-transition guard coverage

Commit `5c35530e813e1a2ed43d8486eebae1dd058ee1ed` factors the carrier transition's preserved-state/identity requirements into `quote_carrier_transition_shape_is_valid`, the same predicate called by `quote_carrier_transition_is_valid`. This ensures the negative vectors exercise the guard predicate that the validator actually uses rather than testing unrelated stand-alone conditions.

Added four grouped adversarial vectors for: (1) missing/duplicate carrier script input or output; (2) missing/duplicate authority singleton quantity across inputs/outputs; (3) substituted continuation address or physical Value; and (4) malformed input datum or an output quote not bound to the authenticated update.

[Isolated Pyth ADA USD Probe run 39604431999](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39604431999) passed on the exact commit, including both `aiken check` and Plutus V3 compilation. The updated suite now reports four additional transition-shape tests on top of the existing synthetic quote/freshness cases.

This remains synthetic code-level evidence: it does not construct or submit an actual Cardano transaction with a genuine Pyth-signed update and zero-withdrawal verification. Production MintPolicy binding and governed USD↔USDM conversion remain open.


## 2026-10-21 follow-up — unit-conversion candidate is now tested but not wired

`lib/immortal/ada_usd_probe.ak` contains the pure helper `pyth_ada_usd_to_usdm_subunits` for reviewing exact rational conversion of raw Pyth price/exponent into USDM sub-units. The conversion is expressed as:

```text
ceil(
  economic_lovelace
  × raw_price
  × 10^raw_exponent
  × 100 subunits/USDM
  ÷ (1,000,000 lovelace/ADA × D USD/USDM)
)
```

Here `D) is an explicit positive rational `usd_per_usdm_numerator / usd_per_usdm_denominator`. The helper never chooses it and does not default it to unity. New synthetic vectors verify exact-rational arithmetic, conversion after retaining the raw price/exponent, non-parity parameter examples, non-negative exponents, and invalid input rejection.

[Run 39604543598](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39604543598) passed on commit `c05267ca202bae85332870ef4c98b8972175d283`: 15 tests in the source-selection/conversion module, 12 in the carrier module, 27 checks with no errors/warnings, and successful Plutus V3 compilation. The current branch’s two Aiken source files are byte-identical to the tested revision.

This does **not** close conversion qualification. `D) is not yet a governed/authenticated on-chain parameter and this helper is not called from the carrier validator, the production Haskell Plutus V2 MintPolicy, or the Issue settlement builder. Until a source-of-truth decision fixes how `D) is supplied/authenticated and the production predicate consumes the verified quote, the helper is only a mathematical candidate—not admissible Issue price evidence.
