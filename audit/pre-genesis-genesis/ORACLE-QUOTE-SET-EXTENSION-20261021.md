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


## 8. Supersession and live publisher gap — 2026-10-21

### 8.1 Correction to §4 implementation summary

The §4 sentence that says the current Issue amount builder “still derives ADA only” is a historical status statement and is superseded by §6.1 and the current branch source. The current TypeScript path includes `buildIssueSettlementAssets`, the explicit buyer-selected basket UI, exact completed Treasury `Value` comparison, quote-derived finite transaction TTL, and the final-output min-ADA guard. This correction is about the working-tree code only; it is not a statement that the live Oracle singleton or a real transaction has been updated or verified.

### 8.2 Missing operational quote-set publisher / migration evidence

The repository surface census identified `audit/cardano-integration/preprod-direct-oracle-state-bootstrap.mjs` as the only clearly named Oracle State bootstrap writer. Its new-state path creates legacy constructor 0 with one ADA quote. Its existing-state path explicitly reuses the singleton and does not migrate or update its datum. The current DApp reads the datum already present at the configured Oracle State singleton; the UI does not publish or update Oracle state. No other current-branch file discovered in the Oracle/quote/settlement path materializes constructor 1 on the active singleton.

**Classification: OPEN — LIVE DATUM FORMAT / QUOTE PRODUCER / UPDATE AUTHORITY NOT QUALIFIED.**

The branch has an additive on-chain and TypeScript decoder for `OracleQuoteSet`, but the existence of that constructor in source does not prove the currently configured Preprod singleton has it. This inspection did not query or change any live Oracle UTxO, and the current datum constructor and quote inventory remain unverified.

### 8.3 Safe closure sequence

1. Read the exact configured Oracle State singleton UTxO from the live intended network. Record network, singleton policy/name, address, UTxO reference, inline datum hash/bytes, and the decoded constructor; fail closed on zero/multiple matches or missing datum.
2. For each proposed asset quote, require an independently qualified source artifact under the already-adopted Oracle trust contract, the exact policy/name identity, price units, source timestamp, publisher identity, and a reproducible evidence reference. Do not generate a quote from frontend balances, wallet ownership, synthetic vectors, a locally generated timestamp, or this audit's assumptions.
3. Establish whether the existing singleton can be updated by the configured, already-authorized publisher and what exact signed state transition preserves the singleton identity. Do not create a second singleton, replace the configured address, silently mint another oracle NFT, or use an unqualified key as an upgrade path.
4. Validate the proposed datum and output Value against the existing decoder, on-chain quote lookup, transaction-relative freshness predicate, duplicate/missing quote rejection, exact USDM integer conversion and output-specific min-ADA requirement. Run the canonical pinned Plutus build/export, hash/size checks and local-ledger negative/positive twins at the exact candidate head.
5. Only after the publisher/source and datum are qualified should a separately authorized Preprod update be planned. After any authorized update, independently observe the resulting singleton UTxO and its datum before considering a wallet Issue. This audit did not sign or submit any update.

### 8.4 What this does and does not close

- **Code capability:** legacy one-quote datum and additive quote-set decoding/lookup are implemented on the working branch.
- **Application capability:** the Issue UI can express a basket and blocks it unless selected quantities satisfy the current canonical integer conversion.
- **Live operational capability:** not proven until the actual singleton's quote format and asset quote set are observed and source-qualified.
- **Trustlessness:** not established. Under the current schema the configured publisher remains a trust assumption. A quote-set container solves the single-record data-shape limit; it does not authenticate the truth of external market prices or decentralize the publisher.
- **EEV:** unchanged. Payment-asset eligibility does not expand the direct-USDM EEV perimeter.

Do not mark the first real Issue or multi-asset settlement GREEN merely because frontend and pure conformance CI pass.


### 8.5 Read-only live-state observation tool added

The working branch now includes `audit/cardano-integration/observe-preprod-oracle-quote-set.mjs` and its pure decoder `oracleQuoteSetObservation.mjs`. The CLI requires the configured Preprod Blockfrost endpoint/project ID, Oracle State address, singleton policy/token name, and expected publisher identity. It reads the exact configured UTxO and emits a digest-bearing JSON observation containing the datum hash/reference, legacy-vs-quote-set constructor, quote identities, duplicate units, publisher-field matches, slot-derived freshness checks, and eligible units.

This is explicitly **read-only**: it has no wallet seed/key, transaction builder, signer, submit path or state-update code. Its status does not claim source truth; it always reports that external price-source qualification remains unproven by datum bytes alone. Focused synthetic tests exercise the legacy and quote-set decoder through the existing settlement conformance suite. The live CLI itself has not been run in this checkpoint, so it has not produced evidence for the actual Preprod singleton.


### 8.6 Concrete Preprod wallet-singleton observation — 2026-10-21

The read-only wallet UTxO evidence uploaded by [IMMORTAL Cardano Preprod Context run 39594377501](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39594377501) was retrieved and inspected. The evidence packet is bound to head `993f1a8fb95682b0eacf56f19fb8e68e1706e898`; its observation timestamp is `2026-10-21T11:46:53.758Z`, network tip slot `136900008`, tip block `3ecf19a19d5b47737019056eb1210019ff6885c8299bcf0eefeec41371c73727`, wallet-UTxO packet SHA-256 `126b1e6d9f8db89a8cb1584012fa3ab0f060a7c91a48540c5e3fde4fc84afca2`.

That snapshot contains this output at the workflow's configured Preprod wallet address:

- UTxO reference: `cardano:tx/fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`.
- Value: 2,000,000 lovelace plus one `ORACLE` token, policy `9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e`, name hex `4f5241434c45`.
- Inline datum CBOR SHA-256: `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`.
- Datum constructor: legacy constructor 0, not `OracleQuoteSet`. The single quote is ADA (empty policy/name), integer price `100`, timestamp `1791481130142` (`2026-10-08T17:38:50.142Z`), publisher `69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89`.
- The publisher hash matches the payment credential decoded from the observed wallet address. This establishes who the observed datum claims as publisher; it does not prove the quote's external market truth.

At the snapshot time the quote was `1,102,083,616 ms` old, approximately `306.13 hours`, against the existing one-hour maximum age. **This observed quote was stale by more than 12 days and cannot authorize an Issue under the existing transaction-relative freshness predicate.** Even apart from freshness, this legacy datum contains no PRE/NIGHT quotes, so it cannot support an ADA+PRE/NIGHT basket.

**Binding caveat:** this is a concrete observation of the singleton carried by the workflow's configured Preprod wallet address. The repository's public Pages Oracle address/policy/token values are supplied through repository variables that this read-only artifact does not disclose, so an exact equality between that deployed DApp configuration and this observed address/unit has not been independently proved here. Treat the evidence as the strong current-wallet finding, then run the new read-only `observe-preprod-oracle-quote-set.mjs` against the exact public-runtime Oracle identity to close that last configuration binding.

This new observation supersedes the earlier statement in §8.2 that no live wallet singleton had yet been inspected; it does not supersede the still-open exact DApp-binding and source-qualification gates. No state was changed, no quote refreshed, and no ticket issued.


## 8.7 Public Pages is a separate release blocker — verified 2026-10-21

The current working branch's additive quote-set and buyer-entered basket code is not present in the current default-branch DApp or in the latest recorded Pages deployment:

- Latest successful Pages run: [38182109071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38182109071), head `876bc54f8ee8f6e1dede226db8c367cca3ae620c`, dated 2026-10-11.
- Current main ref: `97b09a38742098f17a61eb07734c401aeedccc06`.
- `src/main.ts` at the deployment commit and current main points to the same blob `d55ba61dab9377b338989eb56b23b8825c9f6335`, without the authoritative Issue consumer or settlement basket selector; `src/issueSettlement.ts` is not present on main.
- Main's Pages workflow blob `88ee733b7f05d1eb4eb88844ca4056923225e82b` lacks the current `VITE_ISSUE_AUTHORITY_ENDPOINT` runtime wiring. The working branch's newer Pages workflow blob `ccd5642e91083d7779d2d434f9547c24be7de1b5` includes it but is not the deployed/default-branch workflow.
- PR #19 currently contains 1,664 commits / 381 changed files / +45,734/-2,204 and is not mergeable. Do not use it as a deployment shortcut.

This confirms the current public DApp cannot be treated as a release of the branch's guarded Issue/quote-set flow. Promotion must be curated and dependency-complete; its Pages build should expose only public config, preserve fail-closed behavior if any runtime identity is missing, and then be verified against the exact configured Preprod Oracle singleton. No values from hidden repository variables were read, and no public deployment was changed here.


## 8.8 Fresh read-only Koios observation — 2026-10-21T12:46:12Z

The new [Oracle Quote-Set Read-Only Observation run 39602227985](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602227985) completed its bootstrap-wallet observation job successfully and uploaded [bootstrap-wallet-oracle-observation-708120cbaddb3ebf1b1b56a3f347bac19e13f1c7](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602227985/artifacts/12346467535). Evidence manifest hash: `769e855696b40d191a05325ec0b18082b56af681968dbf33aa93806979be809a`.

The observation is read-only and independently re-queries Koios for the exact bootstrap wallet address and Oracle unit previously recorded in §8.6. It observed:

- UTxO: `cardano:tx/fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`.
- Inline datum hash: `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`.
- Schema: legacy `OracleDatum`, constructor 0, one ADA quote; there is no `OracleQuoteSet` and no PRE/NIGHT quote.
- Price field: `100` in the existing integer quote field; timestamp: `1791481130142` (`2026-10-08T17:38:50.142Z`); publisher-field matches the expected publisher.
- Observation clock: runner wall clock `2026-10-21T12:46:12.590Z`. The decoder reports quote age `1,105,642,448 ms`, approximately `307.12 hours`, and `fresh: false` under the already-existing one-hour rule. Eligible quote units are empty; blockers include `ADA_STALE_TIMESTAMP` and `LEGACY_SCHEMA_SUPPORTS_ONLY_ONE_ASSET_QUOTE`.

The successful Koios job does **not** establish source truth, does not qualify the configured publisher as permissionless, and is not a valid Issue admission witness (the timestamp was classified against the CI runner clock, not used to authorize a transaction). It also does not prove that this bootstrap-wallet Oracle State is the same address/policy/name configured in public Pages.

The same workflow's strict job for the intended public-runtime Oracle identity failed before querying chain state because *that workflow job's configured GitHub environment* supplied none of `BLOCKFROST_PROJECT_ID`, `ORACLE_STATE_ADDRESS`, `ORACLE_STATE_POLICY_ID`, `ORACLE_STATE_TOKEN_NAME_HEX`, or `ORACLE_PUBLISHER_PKH`: [run 39602227985](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602227985). This failure alone does **not** prove that repository-level variables used by a separate Pages workflow are absent; the two variable scopes were not shown to be identical.

The separate, independently verified deployment gap is stronger: the current `main` Pages workflow at [`88ee733b`](https://github.com/LiberoNuvola/Immortal-Protocol/blob/main/.github/workflows/immortal-preprod-pages.yml) has no `VITE_*` runtime-variable injection block, while the working-branch Pages workflow does. The most recent successful Pages deployment observed at this checkpoint is [run 38182109071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38182109071), built from older `main` SHA `876bc54f8ee8f6e1dede226db8c367cca3ae620c` on 2026-10-11. Current `main` source `src/main.ts` at blob `d55ba61d` also lacks `createRemoteAuthoritativeIssueAdmissionProvider` and `mintSerialNFTWithAuthoritativeAdmission`. So the public deployment cannot be assumed to contain the working-branch Issue consumer or its runtime wiring. The exact Oracle identity used by the public deployed DApp still has not been established; this is a deployment/source-evidence gap, not a ledger rejection.

**Result:** the fallback observation confirms that the already-identified bootstrap wallet singleton has not visibly migrated and its single quote is stale. It does not authorize refreshing that quote, inventing PRE/NIGHT quotes, updating the singleton, or issuing a ticket. The operational quote-source and public-runtime identity gates remain OPEN.


## 8.9 Chain-tip-time confirmation — 2026-10-21T12:51:28Z

The Koios fallback was hardened to use the Preprod chain tip's `block_time` for stale/fresh classification rather than the GitHub runner's wall clock. On the next workflow run, [Oracle Quote-Set Read-Only Observation 39603184562](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39603184562), the Koios job passed and uploaded [bootstrap-wallet-oracle-observation-fd71136ed688231072f2c041c67aa5c63a2262b1](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39603184562/artifacts/12346578534).

Chain tip recorded in the manifest:
- `block_time = 1792587088` seconds = `2026-10-21T12:51:28Z`;
- block `5318224`, absolute slot `136903888`, epoch `320`, hash `e6aba53968d335ac5edbe0873ff7ecedf90ec6e826313f07d0238520038121c4`.

The Oracle singleton is still the same output `cardano:tx/fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`, with unchanged inline datum hash `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`. It remains legacy constructor 0, one ADA quote, price field `100`, timestamp `1791481130142`, publisher field `69fe256b67d8f11822a34b250ab8ba271bdedb513daf99e618b6bc89`. The observed quote age relative to that tip is `1,105,957,858 ms` (approximately `307.21 hours`), and the inspection returns `fresh: false`, no eligible units, and blockers `ADA_STALE_TIMESTAMP` + `LEGACY_SCHEMA_SUPPORTS_ONLY_ONE_ASSET_QUOTE`. Manifest hash: `0b1eb9039542eb8f3eedadebc8c944c7a8472d87ddcb748e7fb95bfce9fecd3c`.

This is stronger age classification than the preceding runner-clock observation, but it remains a read-only Koios observation, not an Issue validity proof or a source-truth certificate. The separate strict public-runtime job again failed before the chain query because its Blockfrost project ID and Oracle State / publisher variables are unset. The public Pages singleton remains unbound. No quote update, signature, deployment, or Issue was performed.


## 8.10 Exact-source Haskell conformance confirmation — 2026-10-21T12:52:21Z

[IMMORTAL Haskell Semantic Conformance run 39599364846](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39599364846) completed with `success` on commit `edb61d74c2aa5a076fbda5d11941c119776f87d1`. Its `Oracle conformance` step succeeded.

A blob comparison against the current working branch confirms byte-for-byte equality for the relevant sources at that tested SHA:
- `Adapter/CARDANO/observation/OracleTypes.hs`: `fd9b59d59d3f536d4113fe781909688157a92c59`;
- `plutus/Economic.hs`: `e50366a65ce34e9433d5ff179dfc03a35a24c1a1`;
- `plutus/test/EconomicOracleTest.hs`: `5dc7b482332bae942fd06312beeab50bb8a086dc`;
- `plutus/MintPolicy.hs`: `0d59fc05b4c11873984fffd10014bd46d8470509`.

The same comparison confirmed the TypeScript settlement implementation, focused settlement tests, mint builder and predeploy gate also had identical blobs at the Haskell-tested SHA; the independent Cardano Adapter Sale Conformance subsequently passed on the later working-branch head `fd71136ed688231072f2c041c67aa5c63a2262b1` in [run 39603184582](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39603184582).

This establishes **source-level Haskell build/conformance and TypeScript settlement/build evidence** for these exact files. It does not establish native-ledger execution of a Pyth signature-verifying withdrawal, does not bind the Pyth carrier quote into the production V2 MintPolicy, and does not make the stale legacy Oracle State usable. The Integration Lab remained in progress at the last check, so these results are not a full live Cardano Issue proof.


## 8.11 Pyth carrier state-transition guards now have adversarial vectors

The isolated Pyth Aiken carrier now calls a shared `quote_carrier_transition_shape_is_valid` predicate from the actual transition validator and tests four grouped negative cases: missing/duplicate carrier script inputs and outputs, missing/duplicate singleton authority quantity, changed continuing address/value, and invalid input datum or an output quote not matched to the update.

[Isolated Pyth ADA USD Probe run 39604431999](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39604431999) passed on exact commit `5c35530e813e1a2ed43d8486eebae1dd058ee1ed`, including `aiken check` and Plutus V3 compilation. This strengthens the synthetic state-transition boundary but is not a signed-update ledger transaction. The existing Haskell MintPolicy is still not wired to consume the carrier quote, and USD↔USDM conversion remains unresolved.


## 8.12 Exact-rational Pyth conversion is now a tested design candidate, not a deployed valuation path

The Pyth feasibility probe now contains a pure helper `pyth_ada_usd_to_usdm_subunits` that converts the signed ADA/USD raw price and exponent into integer USDM sub-units without floating point or early price rounding. The helper accepts the ratio `D = USD per 1 USDM` explicitly as numerator/denominator; the code does not silently assume parity. It reuses the existing lovelace/ADA and USDM-subunit scaling conventions, while bounding the exponent as an explicit caller-supplied resource parameter.

[Isolated Pyth ADA USD Probe run 39604543598](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39604543598) passed on SHA `c05267ca202bae85332870ef4c98b8972175d283`, the same probe and carrier source blobs now present on this branch:
- raw feed/freshness/conversion module: 15 tests passed;
- quote-carrier module: 12 tests passed;
- Aiken summary: 27 checks, 0 errors, 0 warnings;
- Plutus V3 build: success;
- quote-carrier compiled validator code field: 8,363 bytes (not the full transaction size).

**Still OPEN:** `D) is not yet selected or authenticated by a governing source-of-truth rule, and the helper is not invoked by the carrier transition or Haskell Plutus V2 MintPolicy. It is neither price-oracle evidence nor authority to treat USD as USDM. Integrating it into production requires the canonical rule for `D), an on-chain binding from the Pyth-verified raw quote to the exact converted value consumed by `MintPolicy.atomicTreasuryPaymentValid`, and native-ledger positive/tamper-negative transactions including the Pyth zero-withdrawal verification in the same transaction. No production validator or state was changed by this test candidate.


## 8.13 Explicit decision boundary for USD↔USDM (no normative choice made)

The new rational helper makes the unresolved input visible as `D = USD per USDM`; it does not decide what `D) means or who authenticates it. The reviewed source-of-truth documents define USDM as the canonical economic denomination and define 100 sub-units per USDM, but the inspected material does not explicitly establish that a USDM accounting unit is always exactly USD 1, nor does the active deployment expose a canonical USDM asset policy/name and an authenticated USDM/USD feed.

| Possible contract | What it means | Additional burden | Status |
|---|---|---|---|
| **A. Abstract unit-of-account identity** | The constitution defines one USDM accounting unit as exactly USD 1 by semantics; this is not a claim that any stablecoin trades at parity. Use `D = 1) only after that definition is explicitly normative. | Requires a source-of-truth amendment or an existing authoritative clause proving the equivalence. | Not established by the reviewed files. |
| **B. External USDM/USD valuation** | USDM is valued as a real token whose USD market price may depart from 1. | Requires an authenticated, fresh USDM/USD observation and explicit asset identity/source qualification; depeg must change conversion. | No qualified feed or live identity observed. |
| **C. Direct ADA/USDM price** | Settlement uses a direct quote in the target accounting unit without interposing USD. | Requires a genuine source for ADA/USDM, authenticated on-chain and freshness-bounded. Pyth ADA/USD alone cannot establish it. | No direct quote-source evidence found. |
| **D. Fail closed until decided** | Do not use USD/ADA to infer USDM/ADA; reject settlement needing the missing conversion. | Reduces liveness but introduces no parity assumption. | **Current safe operational posture.** |

Recommendation for the current branch is **D** until the canonical meaning of USDM and the authoritative source for any required conversion are identified. If USDM is strictly an abstract accounting unit, option A is likely the smallest architecture, but only the constitutional/source-of-truth owner can authorize that identity. If USDM is a physical token, option B is required to account for a depeg. These alternatives are not interchangeable. No production constant, mint-policy branch, oracle update or deployment should choose between them by implementation convenience.

The raw Pyth quote may continue to be verified and preserved in its isolated carrier while this decision is open. It must not be allowed to satisfy `Economic.totalUsdmValue` merely because its publisher signature and timestamps validate.
