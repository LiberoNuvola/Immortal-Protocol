# Oracle Quote-Set Extension — 2026-10-21

**Status:** IMPLEMENTED ON WORKING BRANCH FOR CONFORMANCE; NOT RELEASED, NOT DEPLOYED, NOT YET PROVEN BY FULL PLUTUS CI.

**Branch:** `work/immortal-green-closure`

## 1. Evidence-led problem statement

The existing settlement invariant is already asset-generic:

`MintPolicy.atomicTreasuryPaymentValid` selects the one Treasury script output and requires `Economic.totalUsdmValue(outputValue) == pdPriceUsdm`. The canonical valuation walks every non-zero asset, looks up its price from the authenticated Oracle State reference input, rejects stale or publisher-mismatched quotes, excludes the ADA minimum-UTxO quantity from ADA's economic amount, applies the existing integer `ceilingDiv`, and sums the results.

The limitation is the data shape, not a missing asset selector. The deployed-schema `OracleDatum` carries one (policy, asset name, price, timestamp, publisher) record. A genuine singleton NFT cannot be present with quantity one in several distinct reference UTxOs simultaneously. Therefore a Treasury basket containing ADA plus PRE/NIGHT cannot supply all of its needed prices using the old one-record datum.

This extension reuses the existing verification predicate. It introduces neither another price source nor a new conversion formula, haircut, tolerance, precision, freshness window, economic threshold, or valuation perimeter.

## 2. Additive datum schema

The current Plutus `OracleDatum` has a deliberately preserved first constructor:

- **Constructor 0 — legacy:** the existing five fields and their order are unchanged. Old single-quote data remains decodable.
- **Constructor 1 — quote set:** a list of `OracleQuote` records. Each record contains asset policy bytes, asset-name bytes, integer quote price, POSIX-millisecond timestamp, and publisher key hash.

The `OracleQuote` data constructor is index 0 with the five fields above. Constructor indices and field order are compatibility surfaces; changing them requires a separately reviewed migration.

The singleton NFT continues to authenticate one Oracle State UTxO. A quote-set entry is not independently trusted just because it appears in the list: the on-chain consumer still requires the singleton to be on that exact reference UTxO, then checks the selected quote's exact asset identity, configured publisher, transaction-relative freshness, and non-negative price.

## 3. Lookup and failure semantics

For each non-zero asset that `Economic.totalUsdmValue` encounters:

1. Search the authenticated Oracle datum for the exact policy ID and asset name.
2. Legacy constructor 0 is treated as a one-entry set and matches only its declared asset.
3. Constructor 1 must contain exactly one entry for the requested asset. Missing and duplicate target entries fail closed.
4. The selected entry must match the configured publisher, pass the existing `validOracleTimestamp`, and have a non-negative price.
5. Convert each entry using the unchanged `ceilingDiv(asset quantity × selected quote, precision)`; ADA first excludes the unchanged `minUtxoLovelace`. Sum the integer sub-unit values and preserve the existing exact equality predicate against `pdPriceUsdm`.

A quote's publisher field is checked under the current Oracle trust contract. This extension does **not** independently establish market-source truth or decentralize the publisher; oracle-source qualification/permissionlessness remains a separate obligation.

## 4. Implemented surface on this branch

- `Adapter/CARDANO/observation/OracleTypes.hs`: new `OracleQuote`, additive `OracleQuoteSet`, unique asset lookup; legacy constructor retained.
- `plutus/Economic.hs`: use asset-specific quote lookup for the canonical value conversion.
- `PRE-RICH/onchain/GenesisRegimeCarrier.hs`: select the PRE quote from either legacy or quote-set form without changing the Genesis predicate.
- `src/issueSettlement.ts`: decode the requested asset from either datum constructor. The current Issue amount builder still derives ADA only and rejects a selected non-ADA quote; the decoder capability does not claim the multi-asset DApp flow is enabled.
- `src/genesisTreasuryObservation.ts`: share the same asset-specific datum decoder.
- Tests add a synthetic on-chain ADA+PRE basket whose ADA amount equals the min-UTxO floor, and reject duplicated PRE quote identities.

## 5. Explicit non-claims and release gates

This is an additive schema/code change on the working branch only. It has not been deployed to Preprod, and the existing on-chain Oracle State datum remains whatever its current deployed transaction holds until an authorized state update is separately planned and verified.

Before promotion:

- Run the Haskell economic-oracle suite and full Plutus compile/export against the canonical pinned toolchain.
- Re-export and hash every script whose compiled dependency graph includes `Economic`; compare script hashes and serialized sizes.
- Check the 16,384-byte Cardano transaction limit and script-witness/reference-script packaging. Do not regress or silently replace the existing Reveal reference-script path.
- Run TypeScript tests, frontend build, predeploy structural gate, and native-ledger/Yaci integration checks on the exact head.
- Update all live datum readers/writers and a migration/bootstrap procedure only after verifying how the active Oracle State UTxO is currently encoded. Do not overwrite/recreate a live singleton or deploy automatically from this patch.
- Only after the above passes should a separately tested asset-basket amount builder be wired into Issue. The builder must select concrete asset quantities but never decide their economic worth; the on-chain equality predicate remains authoritative.

The EEV perimeter is unchanged. This does not expand `PRE-RICH-EEV-USDM-DIRECT-V1` to count ADA, PRE, NIGHT, or other assets toward VerifiedUSDM merely because they can be used as settlement assets.
