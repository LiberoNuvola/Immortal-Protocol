# Pyth → PRE-RICH MintPolicy Price Binding — Design Gate

**Status:** DESIGN / NOT APPROVED / NOT IMPLEMENTED IN PRODUCTION  
**Date:** 2026-10-21  
**Scope:** Issue settlement price provenance only. No source selection, economic rule, oracle datum, or deployment is changed by this document.

## 1. Decision in one sentence

A Pyth signature-verification check elsewhere in the transaction is **not enough** while the existing Haskell Plutus V2 MintPolicy independently obtains its price from the legacy configured Oracle State datum. Before Pyth can authorize an Issue payment, the exact quote that the Pyth consumer verifies must be the same quote that the MintPolicy uses to value the completed Treasury output.

## 2. What is actually established

- The current sale predicate in `plutus/MintPolicy.hs` (`atomicTreasuryPaymentValid`) finds exactly one Treasury-script output and calls `Economic.totalUsdmValue`; the result must equal `pdPriceUsdm`.
- `plutus/Economic.hs` currently looks for asset quotes in transaction **reference inputs**. It requires the configured Oracle State singleton on the selected UTxO and checks publisher identity, a finite transaction upper validity bound, the existing one-hour age bound and non-negative price. It then applies the existing `ceilingDiv` conversion and ADA minimum-UTxO exclusion.
- The existing `OracleQuoteSet` solves the one-singleton/multiple-asset data-shape problem. It does not prove where a quote came from. A publisher-matching datum can still contain a price unrelated to any market.
- The Pyth Lazer library `pyth.get_updates` reads the Pyth State reference UTxO and the signed update bytes from the Pyth zero-withdrawal redeemer. Pyth's withdrawal script must execute in the same transaction; it verifies the signature. The library parses the update, but does not itself establish signature validity, freshness, or anti-replay. See the [official Cardano integration guide](https://developers.cardano.org/docs/build/integrate/oracles/pyth/) and [Pyth consumer guide](https://docs.pyth.network/price-feeds/pro/integrate-as-consumer/cardano).
- Feed ID 16 is officially documented as ADA/USD. The Pyth value has a raw integer and exponent; neither is already the current IMMORTAL `OracleQuote.price` unit.

## 3. Invalid shortcut — reject

The following transaction is **not** trustlessly priced, even if every script succeeds:

1. include a Pyth State reference input;
2. include a signed Pyth zero-withdrawal, which is verified;
3. run a consumer validator that reads ADA/USD;
4. let `MintPolicy.atomicTreasuryPaymentValid` continue valuing the Treasury output using an unrelated, pre-existing `OracleQuoteSet` reference input.

In this construction, the Pyth consumer and the economic equality check are parallel facts, not a binding. The consumer can verify one price while MintPolicy uses another. This is a price-substitution gap, and must be rejected by architecture and negative tests.

## 4. Candidate architecture — transaction-bound quote carrier

The preferred experiment is an isolated carrier design that deliberately joins the two facts inside one atomic transaction. This is a candidate to test, not a production decision.

### 4.1 Required transaction components

1. **Pyth State reference input.** Exactly one configured Pyth deployment state UTxO, with its singleton identity verified and the deployment identity bound to the test configuration.
2. **Pyth zero-withdrawal.** Include the signed update bytes as the redeemer of the exact Pyth withdraw script. The ledger must evaluate this script; an Aiken unit test, a caller-supplied boolean or a parsed payload alone cannot stand in for signature verification.
3. **Quote-carrier state transition.** Spend exactly one canonical quote-carrier singleton UTxO and produce exactly one continuing output containing the same authority token. Its Plutus V3 validator calls `pyth.get_updates`, selects only explicitly configured feed IDs, rejects missing/duplicate feeds, validates timestamps against the same transaction validity upper bound and checks every output quote against the raw signed update observed in that transaction.
4. **MintPolicy price binding.** The Haskell Plutus V2 MintPolicy must value the Treasury output from the quote-carrier continuation output (or another exactly specified transaction-bound representation), not independently select a potentially unrelated legacy Oracle State datum. It must check the configured carrier script hash and singleton identity, exactly one carrier input/output, valid datums, unique asset identities and the on-chain conversion/equality conditions. Since the carrier input is spent in that same transaction, the ledger must also validate its V3 script; if the Pyth signature is invalid, the whole transaction fails.
5. **Atomic sale invariant.** Ticket mint, Counter progression, Pending PrizeDatum, B1 PrizePool reservation, Treasury payment, quote-carrier transition and Pyth verification all occur in the same transaction. No ticket can be issued by combining a Pyth-valid transaction with a separate stale/legacy quote.

The source-of-price binding is an on-chain cross-script invariant. The MintPolicy must not accept a client claim that the Pyth validator ran: it must require the exact script input/output topology that makes that validation mandatory under Cardano ledger rules.

### 4.2 Why the carrier output is the binding point

The signed update is present in the transaction, while the Pyth library exposes the decoded price to Aiken. The carrier's validator can require the output datum to be a deterministic, field-for-field function of the verified update. The Haskell MintPolicy then reads that very output datum to evaluate the Treasury value. Both validations observe the same immutable transaction body, and a failure in either validator rejects the transaction.

The implementation must define a typed datum and stable output identity. It must not:
- accept a quote supplied only in a reference datum that was not validated against this transaction's signed update;
- allow a different quote-carrier output to be chosen by list order;
- accept duplicate inputs, outputs or asset quote identities;
- have a legacy-oracle fallback when Pyth/quote-carrier evidence is absent or invalid;
- infer source authenticity from a 64-character digest, feed name or off-chain response.

## 5. The economic unit conversion is a separate blocker

This carrier idea is not sufficient until the quote scale is defined.

Pyth ADA/USD returns a raw integer `p` with exponent `e`, representing approximately `p × 10^e USD per ADA`. The existing IMMORTAL conversion expects an integer `OracleQuote.price` and applies:

`ceil((economic asset quantity × quote price) / 1,000,000)`

with the existing ADA minimum-UTxO exclusion. A Pyth USD/ADA rational is not itself an integer USDM-subunit quote. The conversion must not silently assume that 1 USDM equals exactly 1 USD, round raw prices to an arbitrary sub-unit, change token decimal semantics, or introduce a slippage/haircut parameter.

Before implementation, the normative/source-of-truth documents must answer:
- what relationship, if any, is established between the USDM unit of account and USD;
- how a Pyth price/exponent and native asset unit are represented in the existing economic integer domain;
- whether the exact existing ceiling conversion is applied once per asset after rational normalization and how that equivalence is proven;
- what happens if a feed is unavailable, stale, has unexpected exponent/metadata or cannot represent an exact ticket price;
- which exact, source-qualified feeds cover each enabled payment asset.

For ADA, Pyth feed ID 16 is documented. Availability of source-qualified Pyth feeds for the desired PRE and NIGHT assets is **not established** by this checkpoint. A basket may be enabled only when every non-zero asset in the Treasury output has a verified quote with a governed asset-unit mapping, including the ADA minimum-UTxO component. The quote carrier must not manufacture missing token prices.

## 6. Script boundary and compatibility cost

The existing MintPolicy is Plutus V2 and is parameterized with five script hashes, an `OracleStateId`, and an oracle publisher. The Pyth library is an Aiken/Plutus V3 dependency. The architecture above keeps the quote verification and quote conversion roles explicit:

- Aiken/Plutus V3 is responsible for validating the signed Pyth update and binding the raw source data to the quote-carrier continuation.
- Haskell/Plutus V2 MintPolicy is responsible for selecting the exact carrier continuation and checking that the actual Treasury output equals the ticket's USDM-subunit price under the selected governed conversion rule.
- The transaction must force both scripts to be evaluated. Neither implementation may infer the other passed from caller-provided data alone.

The design likely requires an additive Pyth quote-carrier validator and new, explicitly parameterized MintPolicy/Economic entrypoints, or a separately reviewed equivalent. It must not replace the old deployed script or reinterpret the legacy five-field OracleDatum in place. The existing constructor-0 compatibility surface must remain unchanged; deployment migration and a new quote-set instance are separate governed operations.

## 7. Acceptance gates before any Issue integration

### Gate A — signed payload on local/native ledger
- Use a genuine Pyth-signed ADA/USD update, not a fabricated `PriceUpdate` object.
- Include Pyth State reference input, Pyth zero-withdrawal and the consumer/carrier validator in one transaction.
- Positive ledger acceptance for a valid signed update.
- Ledger rejection for altered signature/payload, wrong Pyth State identity, wrong feed ID, missing feed, duplicate feed identity, stale/future timestamps, invalid exponent and missing withdrawal.
- Record exact transaction CBOR size, reference-script identities, execution units and network cost model.

### Gate B — source-to-economics binding
- Change the Pyth-derived raw price by one field while leaving the carrier output unchanged: reject.
- Change the carrier output quote while keeping the signed update unchanged: reject.
- Include a valid Pyth withdrawal but a valid-looking stale legacy OracleDatum with a different price: reject.
- Omit or duplicate the quote carrier input/output/singleton: reject.
- Include an unsupported asset in Treasury, or a basket with any missing/duplicate quote: reject.
- Demonstrate that the exact Treasury `Value` read by MintPolicy is valued using the precise quote carrier whose V3 validation binds it to the signed update.

### Gate C — economics, resources and compatibility
- Approve the price scale/unit conversion in the source-of-truth hierarchy before coding it into an authoritative validator.
- Run canonical Haskell quote/value tests and cross-language differential tests; run the actual Plutus V2/V3 ledger transaction, not only synthetic context/unit tests.
- Rebuild and hash every dependent Plutus artifact; record script hashes, sizes, CPU/memory and transaction CBOR. Respect the 16,384-byte limit and do not touch existing Reveal semantics/reference-script arrangements.
- Review liveness, Pyth API access, source/provider assumptions, replay behavior and fail-closed behavior. A signed feed is an integrity guarantee under Pyth's trust model, not a proof of perpetual liveness or unqualified market truth.
- Verify the exact Pyth deployment policy/state token on the intended network through independent on-chain observation before using it. Feed ID 16 alone does not identify the deployment.

## 8. Decision

**Proceed only with the isolated carrier/native-ledger proof once the conversion contract is answered. Do not switch the production Issue path yet.** The completed probe proves that the pinned Pyth library compiles with the isolated freshness and quote-selection checks. It does not yet prove signature verification, quote-to-MintPolicy binding, an approved USDM conversion, PRE/NIGHT coverage, transaction resource fit, or public DApp runtime deployment.

No Oracle singleton, quote-carrier state, MintPolicy, V3 carrier, Reveal, public Pages deployment, or Preprod transaction is changed by this design document.


## 9. Isolated quote-carrier code probe — PASS, production binding still OPEN

The proposed carrier boundary has now been implemented as an isolated Aiken/Plutus V3 candidate under `poc/aiken-pyth-ada-usd/lib/immortal/ada_usd_quote_carrier.ak` and `poc/aiken-pyth-ada-usd/validators/ada_usd_quote_carrier.ak`.

On [CI run #12](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602416931), commit `7298455cd01ee73915d294e713fbb8ef355f7e8a`:
- `aiken check`: 13/13 synthetic tests pass, including exact quote-carrier continuation binding, altered price/exponent rejection, stale update rejection and missing quote rejection;
- `aiken build`: success for both the raw quote marker consumer and the quote-carrier validator;
- artifact: [`pyth-ada-usd-probe-7298455cd01ee73915d294e713fbb8ef355f7e8a`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602416931/artifacts/12346542438), ID `12346542438`;
- compiled code fields: marker consumer 6,806 bytes; quote carrier 8,289 bytes.

This moves the code feasibility boundary forward, but does not close any ledger/protocol acceptance gate. The tests use synthetic `PriceUpdate` fixtures. No Pyth zero-withdrawal signature has been evaluated against a genuine signed update on a native Cardano ledger; no final transaction CBOR or combined execution units were measured. The current Haskell Plutus V2 MintPolicy still calculates Treasury value from the configured Oracle State reference input and is not bound to the quote-carrier continuation. No conversion from raw Pyth USD/ADA price/exponent into the current USDM-unit quote has been frozen. The production price source is therefore **NOT QUALIFIED**.

## 10. Haskell cross-module candidate regression — added, CI confirmation pending

Commit [`9ae2bfb85efbd5501aa89f8ffc595be91a26fc21`](https://github.com/LiberoNuvola/Immortal-Protocol/commit/9ae2bfb85efbd5501aa89f8ffc595be91a26fc21) extends `plutus/test/PythQuoteCarrierBindingTest.hs` with a cross-module assertion:
- extract the raw quote from the candidate carrier transaction context;
- pass the extracted `price` and `exponent` directly into `PythAdaUsdConversion.pythAdaUsdToUsdmSubunitsCandidate`;
- use a synthetic 1,000,000-lovelace economic quantity, explicit test ratio `D=1/1`, and test-only exponent bound 18;
- expect 70 USDM sub-units from the fixture quote `69,500,000 × 10^-8`.

The Haskell conformance run [39647416504](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39647416504) passed the existing quote-carrier and conversion test suites on preceding commit `fb51e0201061e2510f0ed7f2b278f1b16d45c797`. That run predates the new cross-module assertion; the assertion's own CI result has not yet been verified and is not classified as PASS here.

**Scope limit:** this demonstrates only the candidate Haskell data path using a synthetic context and unit ratio. It neither executes Pyth's real zero-withdrawal signature verifier on a native Cardano ledger nor proves that production MintPolicy reads the carrier output. The ratio/bound remain test inputs, not approved parameters. Gate A, Gate B, and the normative unit-conversion decision remain open.


## 11. Guarded native-ledger probe harness — prepared, not yet executed

The repository now includes a manual, Preprod-only path to test the isolated Pyth consumer against an actual signed update:

- Consumer: `poc/aiken-pyth-ada-usd/validators/pyth_signed_update_ledger_probe.ak`. It spends a no-datum probe UTxO and requires exactly one `pyth.get_updates` result, a fresh ADA/USD feed (ID 16) and a positive price. It is independent of PRE-RICH Issue and does not calculate Treasury value.
- Runner: `scripts/testPythSignedUpdatePreprod.mts`. It fetches a Lazer signed update and the configured Pyth State, verifies the State reference-script identity against its datum, fingerprints the exact submitted payload without archiving raw signed bytes, funds a temporary probe UTxO if needed, and proposes a single verification transaction containing both the Pyth zero-withdrawal and this consumer spend.
- Workflow: [`.github/workflows/pyth-native-ledger-probe.yml`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/.github/workflows/pyth-native-ledger-probe.yml). It is manual-dispatch only. `submit_preprod` defaults to `false`, which fetches the update and resolves state metadata without building/signing/submitting a transaction. Real submission requires explicit opt-in and a dedicated funded Preprod test wallet secret.

The isolated runner records a local rejection attempt for a one-byte-mutated payload, but deliberately does not submit that invalid transaction (which could forfeit collateral/fees). **A local evaluator rejection is not an on-chain negative proof.** The positive Preprod transaction has also not been run by this commit. The Gate A status therefore remains:

- Harness source present; automated Aiken compilation is the first software gate.
- Genuine signed-update positive acceptance on Preprod: **not yet observed**.
- Tampered-signature rejection on the native ledger: **not yet observed**.
- CBOR size and on-chain execution units: pending submitted transaction; execution units are fetched best-effort from Blockfrost evidence.
- Pyth state/withdraw-script identity is checked fail-closed by the runner, but its successful runtime observation is still pending.

No Pyth state, deployed script, production Oracle, `MintPolicy`, Issue path, economic conversion, V3 semantics or Reveal semantics is changed. This harness advances the evidence path only; it does not close the USD/USDM unit decision or Gate B source-to-economics binding.
