# Semantic Review — Pyth Quote to PRE-RICH MintPolicy Binding

**Review date:** 2026-10-21  
**Review ID:** `SEM-PYTH-MINTPOLICY-BINDING-2026-10-21`  
**Protocol-source snapshot:** `3373b3044b9c251da1ec217d128f5dcb3c87c894`  
**Scope:** static source review of the Pyth quote provenance/conversion path into the PRE-RICH ticket-sale MintPolicy. This is not a runtime acceptance, release approval, or normative unit decision.

## Disposition

**BLOCKER CONFIRMED — the Pyth-verified quote candidate is not bound to the price currently consumed by production `MintPolicy`.** The separate USD/USDM conversion decision also remains open. Do not switch the Issue path or introduce a parity assumption on the strength of the candidate modules or their synthetic tests.

## Findings

### F-PYTH-01 — Treasury valuation uses the legacy Oracle State path, not the Pyth carrier

At `plutus/MintPolicy.hs` lines 379–400, `atomicTreasuryPaymentValid` calls `Economic.totalUsdmValue info oracleState oraclePublisher outputValue` and compares the result to `pdPriceUsdm`. The sale path invokes this predicate at lines 619–625. The MintPolicy import and call graph do not call `extractBoundPythAdaUsdQuote` or `pythAdaUsdToUsdmSubunitsCandidate`; the quote carrier is not a production dependency of that predicate.

`plutus/Economic.hs` lines 92–137 selects an asset-specific `OracleQuote` from transaction reference inputs, checks the configured oracle-state singleton, publisher, timestamp/freshness and non-negative price; `totalUsdmValue` values the actual supplied `Value` using that legacy quote domain. A transaction containing a valid Pyth verification path plus an unrelated publisher-matching legacy Oracle datum can therefore establish two parallel facts without proving they are the same price. This is the exact price-substitution gap described in the design gate.

**Acceptance consequence:** MintPolicy must require the exact configured carrier input and continuation, extract its exact output quote, and use that quote for the Treasury valuation so ledger validation of the required carrier spend forces the quote-binding validator to execute in the same transaction. No legacy-oracle fallback may silently satisfy the Pyth-enabled path. The exact reviewed implementation design remains a candidate, not approved production behavior.

### F-PYTH-02 — USD/ADA → USDM integer conversion is not governed

Pyth supplies raw integer price (p) and exponent (e), representing (p \times 10^e) USD per ADA. The current `OracleQuote.price`/economic valuation path consumes an integer in the existing USDM-subunit quote domain. `plutus/PythAdaUsdConversion.hs` and `Adapter/CARDANO/observation/PythAdaUsdConversionCandidate.ts` are explicitly candidate/differential surfaces: they take the USD-per-USDM ratio and exponent bound as caller inputs and are not wired into production `MintPolicy`, `Economic.totalUsdmValue`, or the Issue settlement builder.

The current normative conversion decision identifies three choices (governed USD/USDM parity, an independently verified USD/USDM ratio, or a source quote already denominated in USDM) and records that none has been authorized. A unit-of-account label and sub-unit representation do not prove USD parity.

**Acceptance consequence:** do not freeze (D=1), an exponent bound, a new rounding behavior, or a replacement quote schema in implementation without the decision made in the source-of-truth hierarchy. Keep raw Pyth price/exponent intact until the governed rational conversion contract and differential tests are approved.

### F-PYTH-03 — The carrier helper is not itself Pyth signature proof

`plutus/PythQuoteCarrierBinding.hs` checks the transaction shape and continuation: unique configured carrier-script input/output, conserved authority singleton, no mint/burn of the authority token, same address and physical `Value`, valid datums, and a positive raw quote with non-negative timestamps. The helper comments explicitly limit it: its own result is not proof of Pyth authenticity.

The isolated Aiken carrier calls `pyth.get_updates`, selects the raw ADA/USD tuple and compares the continuation datum to that tuple. Its documented security model requires the Pyth zero-withdrawal verification script to execute in the same transaction; parsing/selecting a Pyth update alone must not be treated as signature verification. The current Haskell MintPolicy does not enforce the carrier spend, so this mechanism cannot authorize Issue yet.

### F-PYTH-04 — Candidate tests do not close production or native-ledger acceptance

The Haskell and TypeScript conversion tests are synthetic/differential vectors. The Haskell carrier test passes the extracted fixture price/exponent into the candidate conversion with a test-only (D=1/1); that tests plumbing, not governance of parity. The Aiken carrier tests likewise use constructed `PriceUpdate` fixtures. The reviewed sources and design notes do not establish a genuine Pyth-signed positive transaction and tampered-signature rejection on the native Cardano ledger for the production Issue transaction, nor combined production CBOR/execution-unit fit.

The native-ledger probe workflow is manual and gated by its `submit_preprod` input. This review did not dispatch the workflow or submit a transaction. Historical run references in the design memo were not refreshed here and are not reclassified as current acceptance evidence.

## SHA-pinned evidence register

All SHAs below are blob identities observed in the protocol-source snapshot `3373b3044b9c251da1ec217d128f5dcb3c87c894`.

| Path | Blob SHA | Review classification |
|---|---|---|
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | `REVIEWED_STATIC_OPEN_BLOCKER` |
| `plutus/Economic.hs` | `e50366a65ce34e9433d5ff179dfc03a35a24c1a1` | `REVIEWED_STATIC_OPEN_BLOCKER` |
| `plutus/PythQuoteCarrierBinding.hs` | `669b99a0e4564504012bda8402b706d0ae7a9a9b` | `REVIEWED_STATIC_OPEN_BLOCKER` |
| `plutus/PythAdaUsdConversion.hs` | `43dbe58ab19c3e748bf34af2c77ff97cdd42253c` | `REVIEWED_STATIC_CONVERSION_OPEN` |
| `Adapter/CARDANO/observation/PythAdaUsdConversionCandidate.ts` | `ee2b4600c41ddde1b6f0ddf3c9b973259b395a16` | `REVIEWED_STATIC_CONVERSION_OPEN` |
| `poc/aiken-pyth-ada-usd/lib/immortal/ada_usd_quote_carrier.ak` | `00a417789c4b9a11c7a0bcef8682fcc638183456` | `REVIEWED_STATIC_POC_ONLY` |
| `poc/aiken-pyth-ada-usd/validators/ada_usd_quote_carrier.ak` | `00473b44fd6bdff9b28551ae72758fcc21ee8172` | `REVIEWED_STATIC_POC_ONLY` |
| `poc/aiken-pyth-ada-usd/lib/immortal/ada_usd_probe.ak` | `9f314ddcde19fb7a795dc282bb7a076791a685a9` | `REVIEWED_STATIC_POC_ONLY` |
| `plutus/test/PythQuoteCarrierBindingTest.hs` | `d494f7cf8966cc92ecb120d1c16b8881414651ab` | `REVIEWED_TESTS_SYNTHETIC` |
| `plutus/test/PythAdaUsdConversionTest.hs` | `e30ff098e7b7db32950efac3633dfcb70c49573f` | `REVIEWED_TESTS_SYNTHETIC` |
| `Adapter/CARDANO/observation/PythAdaUsdConversionCandidate.test.ts` | `0e21939d349e6b8331cfc4849836f8639ffcdad6` | `REVIEWED_TESTS_SYNTHETIC` |
| `audit/pre-genesis-genesis/PYTH-MINTPOLICY-PRICE-BINDING-DESIGN-20261021.md` | `0db67eceec333ec4ba4339d8b927eb5d7bc4dc69` | `REVIEWED_DESIGN_NOT_APPROVED` |
| `audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md` | `2651f3c23f5f9e41ccd8275fa239da49a84ded51` | `REVIEWED_DECISION_OPEN` |
| `plutus/pre-rich-plutus.cabal` | `3f06a8d28fc121ea19aa591db73f7ff19ef12c31` | `REVIEWED_STATIC_BUILD_SURFACE` |
| `poc/aiken-pyth-ada-usd/QUOTE-CARRIER.md` | `f5492ac40a8593fce757d0ad38a2d7cb9c9efa7f` | `REVIEWED_STATIC_SCOPE_LIMITS` |
| `.github/workflows/pyth-native-ledger-probe.yml` | `5c0a4264ab48878a54b21f18a1188e4126a3a37d` | `REVIEWED_WORKFLOW_MANUAL_GATED` |

## Closure gates — no semantic changes authorized here

1. Approve one USD/USDM denomination policy and exact rational/rounding/bounds contract in the normative source-of-truth hierarchy.
2. Wire the exact transaction-bound carrier quote into the Treasury valuation predicate, without a legacy fallback for the Pyth-authoritative path, and preserve existing compatibility surfaces through an explicitly reviewed versioned path.
3. Add adversarial cross-binding transaction tests: valid Pyth update plus differing legacy quote; substituted carrier price/exponent; missing/duplicate carrier input, continuation or singleton; missing/duplicate asset quote; unsupported non-zero asset.
4. Execute the actual Plutus V2/V3 combined transaction on a native Cardano ledger using a genuine signed Pyth update, record the exact transaction/script hashes, CBOR size, execution units and positive/negative observations. Keep the 16,384-byte transaction ceiling in force.
5. Only after these gates, refresh CI evidence against the exact tested source SHA and reassess Issue admission.

**Current verdict:** source-to-MintPolicy price binding **OPEN / BLOCKED**; USD/USDM contract **OPEN / NOT AUTHORIZED**; carrier authenticity on the native ledger **NOT YET EVIDENCED**; real Issue qualification **NOT ESTABLISHED**. This review changed documentation only; it did not modify protocol source, economic constants, V3/Reveal semantics, deployment or ledger state.
