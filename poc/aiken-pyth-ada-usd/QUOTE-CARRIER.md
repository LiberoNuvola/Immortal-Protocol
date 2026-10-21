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
