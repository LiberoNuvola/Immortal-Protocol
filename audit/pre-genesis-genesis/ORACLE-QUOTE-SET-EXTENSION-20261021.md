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


## 6.1 Current application settlement builder seam

The current branch has now added a programmatic amount-construction path in `src/issueSettlement.ts`:

- `buildIssueSettlementAssets` accepts a buyer-selected asset-unit/quantity map; quantities are not inferred from untrusted fiat estimates.
- It decodes the authenticated datum as a quote list, checks that every output asset has exactly one quote (including ADA for the min-UTxO value map), and applies the current publisher, timestamp, non-negative-price, precision, ADA floor and `ceilingDiv` semantics.
- The total must equal the exact ticket `pdPriceUsdm` sub-unit target. There is no tolerance or client-selected valuation.
- `src/mint.ts` accepts this via optional `settlementAssetQuantities` and now calls `assertCompletedTreasurySettlement` after Lucid completion. This assertion compares the full final Treasury asset map with the prevalidated expected map before the signing/submission adapter is called.
- Focused TypeScript fixtures include ADA-only, PRE-only with ADA floor, mixed ADA+NIGHT, missing ADA quote, stale quote, duplicate quote identity, wrong total, and final completed-output asset quantity mismatch.

This is a **programmatic opt-in interface**, not proof that the consumer UI, deployed quote source, or current Preprod Oracle State UTxO supplies a constructor-1 quote set. It also has not been declared green until the exact-head Cardano Adapter Sale workflow passes and the Haskell build/test plus generated-artifact and ledger integration evidence closes.

## 7.1 Promotion check-list update

Before promotion, in addition to the original requirements above:

- Run the actual TypeScript settlement conformance test and frontend build at the exact branch head; the structural predeploy gate must enforce the general full-Value assertion, not just ADA equality.
- Build the modified Plutus library and execute `economic-oracle-tests`; confirm the ADA+PRE quote-set vector returns the unchanged canonical integer value and duplicate identity fails closed.
- Re-export every dependent Plutus artifact because `Economic` is shared by several validators/policies. Record hashes and serialized sizes for every changed artifact; reject promotion if any transaction exceeds the protocol's 16,384-byte limit or relies on an unverified replacement for the existing Reveal reference-script path.
- Establish how the live singleton datum would be updated and signed, with a before/after UTxO trace and a rollback/recovery plan. No automatic update/deployment is authorized by this branch patch.
- Exercise basket payment on a local native ledger with the newly built artifacts before any wallet-driven Preprod Issue. The actual on-chain `MintPolicy` equality remains final; passing the off-chain amount builder is not ledger acceptance.


## 6.2 DApp settlement selector and current evidence — 2026-10-21

Implementation head: `0754de3c9f8677ad485f55dfac52f16bcc2cf1eb`.

The actual PRE-RICH Issue consumer now exposes a settlement-asset selector, based on the unique configured Oracle State singleton and the connected wallet's observed UTxOs. It offers a single economic payment asset at a time, and only if the selected ticket price has an exact integer-valued conversion under the current quote data and the wallet has sufficient quantity. Every non-ADA choice requires a matching ADA quote because the completed Treasury output also carries ADA for min-UTxO. The selected amount is passed into the mint builder, which performs a second preflight value calculation and verifies the full completed Treasury Value before signing/submission. The on-chain MintPolicy equality predicate remains authoritative.

This is **not** a mixed-basket DApp. The lower-level builder can validate mixed quantities but there is no governed buyer-allocation rule or UI for choosing the composition; this implementation does not invent one. It also does not create quote records. A token can only be offered when the active, authenticated Oracle State datum already contains exactly one eligible quote for that token and one for ADA. The current single-quote legacy datum supports only its one quoted asset; using constructor 1 is a separate data-state requirement.

Exact-head bounded results on the commit above:
- Cardano Adapter Sale Conformance #4192 passed (settlement vectors plus frontend build): https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231864
- Protocol Declaration #2998, PRE-RICH Action Refinement #306, Portability #1793, Governability #4157 and Documentation Link Check #1857 passed at the same head.
- PRE-RICH B2 Conformance #424 and the full IMMORTAL Cardano Integration Lab #1997 were still in Plutus toolchain setup when checked. No exact-head completion was observed.

Therefore the DApp implementation slice has TypeScript/build conformance, but the quote-set schema and resulting scripts are still **not release-certified**. Native Plutus compile/export, actual compiled artifact hash/size audit, quote-set ledger execution, predeploy gate, current Preprod datum identity/contents and a wallet-signed transaction are outstanding. No oracle UTxO or deployed script was modified by this code-only work. Do not label this as enabled multi-asset settlement on live Preprod or as completion of the trustless/permissionless goal.


## 6.3 DApp now accepts an explicitly composed basket — 2026-10-21

Implementation head: `2f82743741e451fb8e6c03f228d2378c7c2e5b21`.

The Issue UI now has an explicit quantity field for each currently wallet-held, uniquely quoted asset. A user can enter ADA economic lovelace and/or quantities of multiple quoted token assets without the application inventing an allocation rule. Token amounts are interpreted as whole raw ledger units because token-decimal metadata is not used to infer quantities.

The application basket preflight:
- requires a current configured singleton quote for ADA because the Treasury output includes the minimum-UTxO ADA value;
- rejects missing/duplicate target quote identities, stale/future quote timestamps, publisher mismatch and non-positive selected asset prices;
- checks each selected quantity against the observed wallet balance and checks ADA can fund the output's minimum amount plus any entered economic ADA;
- uses the existing integer conversion and requires exact equality with the ticket price, with no tolerance/haircut introduced;
- snapshots the selected quantity map before requesting authoritative Issue admission; and
- inspects the whole completed Treasury value before the adapter can sign/submit.

The on-chain `MintPolicy` and `Economic.totalUsdmValue` remain authoritative; the UI/preflight is not the ledger proof. The schema remains additive with legacy constructor 0 unchanged, while constructor 1 supplies the quotes needed for multiple payment assets.

Latest exact-head bounded evidence: Cardano Adapter Sale Conformance #4194 passed (settlement tests plus frontend build), Protocol Declaration #3000 passed, Security Credential Boundary #638 passed, and Documentation Link Check #1859 passed. PRE-RICH Action Refinement #307, IMMORTAL Portability #1795, Governability #4159 and B2 Conformance #425 were still in progress during the last status check, while Integration Lab #1998 was queued/pending.

The compiled Plutus quote-set path, real native-ledger basket, predeploy structural gate, active Preprod quote-set datum, script resource footprint and end-to-end wallet Issue are still not certified. No live singleton or script was updated by this UI change, and no real ticket was emitted. The quote publisher remains a trust assumption; this does not substantiate full permissionlessness. The EEV perimeter is unchanged.


## 7.2 — final transaction construction: TTL and size-dependent minimum ADA (2026-10-21)

A final-body inspection must use the resolved `TxComplete`, not the `Promise` returned by Lucid's asynchronous `Tx.complete()`. The Issue builder now awaits completion, then independently verifies:

- the Treasury address has exactly one output whose full asset map equals the quote-derived settlement;
- the body has a finite TTL matching the slot selected from the earliest quote deadline among every asset in that output;
- the output contains at least the minimum ADA calculated over that final serialized CML output and the provider's live `coinsPerUtxoByte` parameter.

The TTL bound is derived from the already established `maxOracleAge`, with one whole slot of conservative margin. This aligns the Plutus freshness predicate—which uses the transaction's finite upper validity bound—with the same authenticated quotes used by the builder. It does not establish source truth or introduce a second freshness rule.

The output-specific minimum is calculated using Lucid 0.10.11's pinned CML `min_ada_required(output, coinsPerUtxoByte)` primitive, rather than assuming that `1,600,000` lovelace is sufficient for every value and inline datum. Keep the economic rule distinct: `Economic.totalUsdmValue` still excludes exactly the normative 1,600,000 lovelace floor from ADA's valued quantity. If a final output needs more ADA than that floor, the additional ADA remains part of the canonical economic valuation. The application does not silently top up an output, alter user-entered asset quantities, waive integer equality, or hide economic surplus. A basket that cannot satisfy both the exact USDM equality and the serialized-output ADA minimum is rejected.

The current Cardano Adapter Sale Conformance run `39591153488` passed at `80da6d2b72ff387e758f9ea01c2b6cd7d86b1fa5`, including the then-current settlement suite and browser build. This predates the latest CML min-ADA guard and is **not** evidence that the new output-specific runtime check has passed. Re-run the focused suite/build and predeploy check at the exact current head before promotion; then re-export every affected Plutus artifact and measure script/transaction sizes before native-ledger basket validation.
