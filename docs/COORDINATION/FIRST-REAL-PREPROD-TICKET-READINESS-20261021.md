# First Real PRE-RICH Issue on Cardano Preprod — Readiness and Trustless Closure

**Status date:** 2026-10-21  
**Working branch:** `work/immortal-green-closure`  
**Scope:** delivery/readiness checkpoint and design boundary only. No Plutus, V3, Reveal, economic policy, key, or deployment changes are authorized by this document.

## Executive finding

The first real ticket is no longer primarily blocked by the absence of an Issue application flow or by the initial EEV qualification work. The repository has a guarded wallet-to-transaction Issue path, focused admission/conformance tests, and a successful EEV deployment-approval workflow artifact. However, there is still **no verified end-to-end Issue transaction from the intended user's wallet**.

Do not equate a passed qualification workflow, a successful frontend build, or an approval artifact with a ticket minted to the user's wallet.

## Evidence observed

- GitHub Actions run [39552468679](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39552468679) completed the approval job successfully, including live direct-USDM source re-observation, EV1–EV7 re-qualification, deployment-approval materialization, and result verification. Artifact: `immortal-preprod-eev-approved`, created 2026-10-21 05:57 UTC. Its workflow metadata identifies branch `main` and head SHA `97b09a38742098f17a61eb07734c401aeedccc06`; this evidence must still be correlated to the exact current on-chain UTxOs and Issue candidate used for the first transaction.
- The consumer flow is present on `work/immortal-green-closure`: `src/main.ts` observes the deployed V3 carrier, loads its validator artifact through the configured factory URL, obtains authoritative admission, then calls `mintSerialNFTWithAuthoritativeAdmission`.
- The atomic Issue transaction assembles the Counter continuation, ticket NFT mint and delivery, Pending PrizeDatum, Treasury payment, B1 PrizePool continuation, authenticated Oracle State reference, B2 control reference and V3 carrier continuation. The adapter's current path requires the authoritative witness; V3 additionally requires the configured carrier-authority signature.
- The Pages workflow has public runtime-variable wiring on the working branch, but the inspected `main` DApp source is older and does not import the authoritative Issue consumer. A build/deployment of the intended branch and verified runtime configuration have not been demonstrated here.
- `relayer/issueAuthorityServer.js` implements the downstream `/issue-admission` HTTP adapter, but requires a configured upstream `ISSUE_AUTHORITY_SOURCE_URL` (or alias), the authority public key and live deployment inputs. No verified public endpoint, upstream signed response, or ready live server was established during this check.
- The exact Issue path has not yet been shown to succeed from the intended user's CIP-30 wallet through wallet signature, ledger inclusion, and independent reconciliation of the minted asset and state transitions.

## Track A — first real Preprod ticket using the current guarded admission model

This is a **test of the current authority-dependent implementation**, not proof that the final permissionless goal has been achieved. Keep every existing fail-closed check. Do not fake, bypass, or hand-author admission evidence.

### A1. Bind the approval to the live candidate

Before requesting a witness, re-observe the exact Counter, B1 PrizePool, Oracle State, V3 carrier and B2 control singleton references. Check token identities, script addresses/hashes, and the evidence/deployment-approval binding against those exact current references. Stop if any candidate identity or reference differs or if an evidence source is unavailable.

### A2. Verify the complete admission service chain

Verify the public DApp `VITE_ISSUE_AUTHORITY_ENDPOINT` is configured to an HTTPS `/issue-admission` route and that the route is healthy. Separately verify the route's configured upstream authority source is reachable and supplies a cryptographically valid response for the exact current Issue request. Verify deployment secrets/server variables without exposing their values. A `/healthz` response alone is not proof that a signed Issue admission can be produced.

### A3. Publish the intended DApp/runtime configuration

Promote the current Issue consumer code through the repository's approved release path; do not assume the current public Pages artefact contains it. The configured public runtime must consistently identify the deployed Counter, Treasury, ticket policy, Oracle State, B1 Pool, V3 carrier, B2 control, reference-script addresses, Blockfrost project, and V3 carrier factory URL. Confirm the factory artifact reconstructs the expected configured V3 carrier address. Keep authority private keys and credentials server-side.

### A4. Decision: do not issue a real ticket merely to create a milestone

**Do not run the first real Issue with the current builder.** The on-chain payment contract and the current transaction builder are provably inconsistent.

The exact code path is:
- Genesis `pdPriceUsdm = 100` USDM sub-units (`1 USDM`);
- `src/config.ts` sets `TICKET_PAYMENT_LOVELACE = 1_000_000`;
- `src/mint.ts` requests that ADA-only value for the Treasury output via `payToContract`;
- the final completed transaction body has not yet been independently captured to verify whether that requested output is preserved or rejected during completion;
- `Adapter/CARDANO/observation/OracleTypes.hs` sets `minUtxoLovelace = 1_600_000`;
- `plutus/Economic.hs` calculates the ADA economic quantity as `max(0, amt - minUtxoLovelace)`;
- `plutus/MintPolicy.hs` requires `Economic.totalUsdmValue(TreasuryOutput) == pdPriceUsdm`.

For an ADA-only Treasury output whose final value is exactly the amount requested by the builder, the tested Plutus valuation function returns:

```text
economicAda = max(0, 1,000,000 - 1,600,000) = 0
valuedTreasuryOutput = 0 USDM sub-units
requiredGenesisPrice = 100 USDM sub-units
```

The direct Haskell regression exercises the actual `Economic.totalUsdmValue` function with that value and a valid ADA-specific Oracle fixture; it does not execute the entire MintPolicy or prove the value in a final Lucid transaction body. If Lucid rejects the under-minimum explicit output or yields another final value, that must be measured. Therefore the proven blocker is that the builder does not yet have an explicit, tested settlement amount derived from the USDM target, nor a final-body equality check. Do not relax the validator or fabricate admission: first establish the exact completed Treasury Value and its canonical valuation.

There is a second concrete limit for the requested ADA/NIGHT/PRE settlement choices. `OracleDatum` contains one `odAssetPolicy`/`odAssetName` quote, `MintPolicy` is parameterized with one Oracle State singleton identity, and `Economic.totalUsdmValue` asks that oracle lookup for every nonzero asset before excluding ADA's minimum-UTxO quantity from economic value. A Treasury output containing PRE or NIGHT must also carry ADA for its UTxO minimum; the current path would need authenticated price matches for both assets, but the current one-quote/one-singleton schema does not provide a demonstrated way to supply them simultaneously. That means multi-asset baskets are not merely missing a UI selector; the evidence/reference contract must be designed and tested first. No alternative oracle layout is selected here.

This also shows why a non-permissionless real Issue would not be useful *yet*: it would combine a known settlement mismatch with an authority-dependent V3 transition. After settlement correctness is restored, a controlled authority-backed Issue may be useful as a narrowly scoped Adapter/ledger-integration experiment (transaction inclusion, actual fee, serialized size and StateBefore/StateAfter). It still cannot substantiate the paper's permissionless claim and must not be presented as doing so.

The next useful evidence can be obtained without issuing a real ticket: differential tests over actual Treasury `Value` candidates and authenticated Oracle datum fixtures, followed by Plutus execution/conformance evidence. A real Issue becomes optional empirical evidence only after those gates pass, not a milestone in itself.

### A5. Keep Issue and Reveal acceptance separate

A successful Issue proves ticket creation, not successful Reveal. The reported Reveal/transaction-size failure remains an explicit downstream blocker for the complete ticket lifecycle. Do not infer either that it necessarily blocks Issue or that Issue is safe from the same size constraints: measure the fully completed Issue transaction and its actual script-witness/reference-script arrangement against the Cardano transaction limit before calling the first purchase verified.

## Track B — actual permissionless/trustless closure

The current V3 carrier validator requires an Ed25519 signature from its configured authority key over the action/state-binding message. This is an active authorization veto, not merely a remote data lookup. The signed envelope also supplies economic evidence the ledger does not fully recompute today.

A first ticket issued under Track A must therefore be labelled accurately as **Preprod Issue with authority-backed economic admission**. It is not the final 100% permissionless/trustless outcome.

### Design alternatives to evaluate; none selected

1. **Direct on-chain transition verification.** The carrier validator derives or verifies the permitted Issue state transition from authenticated transaction context and the canonical state rules, rather than accepting a signer's assertion of arbitrary pre/post hashes. Before selecting this route, map every state field that is allowed to change and every predicate already frozen in the source-of-truth hierarchy; measure validator execution cost, script size and transaction size. Do not invent a new transition rule or coefficient.
2. **On-chain-verifiable proof of the canonical decision.** A proof could attest that the canonical economic decision was correctly derived, but the verifier, public inputs, proof-system assumptions, setup/trust model, data availability, and exact correspondence to the canonical Haskell/economic specification must be independently specified and budgeted. A proof that authenticates only caller-supplied, unauthenticated values does not solve source authenticity.
3. **Do not treat a new signer/quorum as permissionlessness.** A committee or another service may improve operations or resilience but leaves a trust/availability assumption unless the chain itself verifies the authorization rule and its evidence. It is not an automatic replacement for the existing key.

For either selected design, require adversarial evidence for forged state endpoints, wrong Issue delta, replay, stale/future observation, evidence tampering, transaction-input mismatch, extra unexpected script inputs, and post-state divergence. Keep V3/Reveal semantics unchanged until a design is specified against the canonical rules, costed, reviewed, and tested. No signature bypass is an acceptable interim implementation.

## Closure criteria

### First real ticket (Track A)
- [ ] Current evidence and approval are bound to the exact live candidate references.
- [ ] Public DApp contains the intended guarded Issue consumer and required runtime config.
- [ ] Public admission route and upstream signed source both return a valid live response; failure remains closed.
- [ ] Issue transaction is built and measured; wallet signs it.
- [ ] Confirmed transaction is independently reconciled against the asset, Counter, PrizeDatum, Treasury, B1 Pool, and V3 state.
- [ ] Evidence packet records exact SHA/refs, transaction ID, state transition and result.

### Permissionless goal (Track B)
- [ ] The external carrier authority signature is no longer indispensable for a valid Issue.
- [ ] Every economic input is authenticated or accompanied by an on-chain-verifiable proof under the canonical rules.
- [ ] Focused adversarial tests, relevant full CI, and real Preprod state-transition evidence pass.
- [ ] Reveal has its own passing real transaction and independent reconciliation before the end-to-end ticket lifecycle is claimed complete.

## Current distance assessment

For a first ticket under the existing guarded model, the remaining work is concentrated in **(1) live admission-service readiness, (2) publishing/configuring the correct DApp and deployed artefacts, and (3) one real wallet Issue transaction plus independent reconciliation**. These are not yet closed, so the first ticket cannot responsibly be called one click away.

For a ticket that is already fully permissionless and trustless, the distance is larger: Track B requires a designed and verified replacement for both the mandatory signer and the authenticated-evidence gap. Track A must never be reported as completion of Track B.

No validator, economic rule, deployment, private key, or Reveal behavior was changed by this checkpoint.


## Follow-up correction — USDM is the unit of account, not the required payment asset

This distinction is normative for the first-ticket path and supersedes any wording above that could imply the buyer must pay in ADA.

- **Ticket price / accounting unit:** `pdPriceUsdm` and the B1 unresolved reservation are denominated in USDM sub-units.
- **Settlement asset:** a payment may be made with eligible assets such as ADA, NIGHT, and PRE, individually or in a permitted combination, when the authenticated on-chain valuation path proves that the Treasury output's aggregate value equals the ticket's USDM price. The examples are not an authorization to accept an asset without a configured, valid Oracle State price for its exact policy ID and asset name.
- **On-chain mechanism already present:** `plutus/MintPolicy.hs` calls `Economic.totalUsdmValue` on the Treasury script output and requires the result to equal `pdPriceUsdm`. `plutus/Economic.hs` walks all nonzero assets in the output, requires an authorized/fresh Oracle datum matching each asset, applies protocol precision and excludes the configured ADA minimum-UTxO amount from ADA's economic quantity. This is the relevant value-equivalence boundary; the buyer need not hold USDM itself if the accepted payment assets and the exact output value satisfy it.
- **Current builder gap:** `src/config.ts` defines `TICKET_PAYMENT_LOVELACE = 1_000_000`, and `src/mint.ts` currently constructs the Treasury output using only that fixed lovelace amount. The builder does not currently let the buyer select/compose ADA, NIGHT and PRE quantities to match the USDM price. This fixed-ADA builder path must not be presented as the completed multi-asset settlement experience.
- **Acceptance requirement:** before the first real purchase, reconcile the builder's actual Treasury output value with the same authenticated Oracle State and ensure `Economic.totalUsdmValue(outputValue) == pdPriceUsdm` under the exact transaction validity range. Add transaction-level tests for each enabled payment asset and any enabled basket, including unsupported/missing/stale oracle records and rounding/precision boundaries. Do not derive a quantity from a market quote off-chain and trust it without the validator's equality check.
- **Do not conflate settlement with EEV qualification:** receiving ADA, NIGHT or PRE in Treasury does not automatically make those assets eligible for the B1 `VerifiedUSDM` / EEV perimeter. The established `PRE-RICH-EEV-USDM-DIRECT-V1` profile only counts canonical USDM physically present in the exact qualified B1 PrizePool UTxO. Do not broaden that perimeter by implication, and do not introduce ADA liquidation, PRE liquidation, NIGHT valuation or liquidity assumptions into EEV without a separate normative decision.

Thus the immediate first-ticket blocker is more precise than “pay 1 ADA”: **the actual settlement output must satisfy the ticket's USDM-denominated price through the authenticated on-chain Oracle conversion**. If the current fixed-lovelace builder does not satisfy that equality, the existing on-chain check should reject the transaction; do not bypass the check to make a demo pass.


## Paper evidence addendum — integer equality, rounding and bounded-conversion status

The B1 sale predicate compares `pdPriceUsdm` with the integer result of `Economic.totalUsdmValue`. That function currently applies `ceilingDiv(amount × oraclePrice, precision)` per nonzero asset entry, then sums the integer USDM-sub-unit results. Accordingly, the current predicate establishes **equality in the canonical integer-valued conversion domain**, not by itself equality of the unrounded rational exchange value.

A synthetic conformance vector makes the distinction concrete (not a live quote): with `precision = 1,000,000`, `minUtxoLovelace = 1,600,000` and a fixture quote of 100 USDM sub-units per ADA, an output containing 2,600,000 lovelace values to 100 sub-units, while 2,599,999 lovelace has raw conversion 99.9999 and is rounded up to the same integer result of 100. The new Haskell cases exercise the actual Plutus `totalUsdmValue` function for the fixed builder value, an exact-value positive control, this rounding boundary, and rejection of a mixed ADA+PRE value when only a single PRE quote is available in the singleton Oracle datum.

This does not authorize changing the implementation's rounding behavior. The relevant PriceReference/rounding research still leaves a general bounded-conversion/error contract open; the paper must not claim arbitrary-asset continuous-value equivalence merely from the current integer equality check. A multi-asset design would need an explicitly governed quote-set/reference contract and a bounded rounding/representation rule, with tests for asset granularity and conversion boundaries.

## Decision on a real authority-backed Issue

A non-permissionless real Issue is **not the next useful experiment** with the current source. It would not test a valid full sale while the builder does not derive/verify the completed Treasury value and the single-asset Oracle schema cannot supply the required quote set for token+ADA settlement. After those conformance issues are resolved, a specifically scoped authority-backed Issue could measure Adapter/ledger integration, cost, size and StateBefore/StateAfter; it still would not prove permissionlessness. Until then, prefer the actual Plutus valuation tests and formal transition-refinement work over a real ticket issued merely for a milestone.

No on-chain rule, signature check, V3/Reveal behavior, settlement coefficient, or deployment was changed by this addendum.

## Predeploy gate hardening — 2026-10-21

`scripts/predeploy-check.mjs` previously treated the presence/use of `TICKET_PAYMENT_LOVELACE` as a positive configuration check. That was insufficient: it did not connect the requested Treasury asset quantity to the USDM-denominated `pdPriceUsdm` using the exact value the Plutus validator will evaluate.

The gate now fails closed when the Issue builder still supplies `TICKET_PAYMENT_LOVELACE` directly to the Treasury output, and requires a focused `src/__tests__/issueSettlementConformance.test.ts` evidence surface before predeploy. The currently missing test file intentionally keeps the gate blocked; the static guard is a release blocker, **not** a replacement for implementing the settlement builder or for running tests.

This change does not alter the Plutus equality check, select a new oracle layout, define a rounding tolerance, enable NIGHT/PRE baskets, or create a deployment. It prevents the legacy fixed-ADA value from being mistaken for verified settlement conformance.

## 2026-10-21 follow-up — settlement builder now derives and inspects the completed ADA output

The current working branch now contains a scoped implementation slice; this does **not** close the first-ticket gate and does not authorize a live Issue.

- `src/issueSettlement.ts` derives the Treasury lovelace quantity from the authenticated Oracle State UTxO's `OracleDatum`, the ticket's USDM-subunit target, and the same `precision = 1,000,000` / `minUtxoLovelace = 1,600,000` parameters used by the Plutus valuation function. It uses the existing `ceilingDiv` integer conversion and fails closed if a target cannot be represented under that conversion.
- `src/mint.ts` now decodes the OracleDatum fields and derives the ADA amount instead of using `TICKET_PAYMENT_LOVELACE`. After `tx.complete()`, it inspects the actual completed transaction body and requires exactly one Treasury output with the derived lovelace amount and no non-ADA assets before adapter submission.
- `src/__tests__/issueSettlementConformance.test.ts` covers canonical synthetic quote vectors, precision/rounding boundaries, stale/future/zero/mismatched quote rejection, unsupported non-ADA quotes, and completed-body output mismatches. `scripts/predeploy-check.mjs` now checks this settlement path and its constants.
- The quote is synthetic test evidence only. No real live OracleDatum was asserted to be an ADA quote, no test suite or typecheck was executed in this patch, no workflow result has been observed, and no Preprod transaction was constructed, signed, or submitted.

### Explicit limit remains open

This implementation slice supports only an ADA-valued Treasury output, and only when the single authenticated OracleDatum quotes ADA (empty policy/name). If the live singleton currently quotes PRE, the builder will reject the Issue rather than reinterpret that quote. NIGHT/PRE settlement and mixed baskets remain unsupported by this slice: each nonzero asset, including ADA required for min-UTxO, needs an authenticated price under `Economic.totalUsdmValue`, while the current OracleDatum/singleton boundary does not demonstrate simultaneous quotes. The production requirement that the ticket may be paid with eligible ADA, NIGHT, PRE, or a permitted basket is therefore **not closed**. It needs a governed on-chain quote-set/reference-input contract and conformance evidence; this patch does not change Oracle or economic semantics.

The old A4 statement that the builder still uses a fixed 1 ADA output describes the pre-patch state. It is superseded only on `work/immortal-green-closure` by this update; `main` has not been promoted, and the first real Issue remains blocked until focused CI/typecheck passes, the live quote is verified, the completed-body and on-chain conversion match, and all other admission/deployment gates are closed.


## 2026-10-21 follow-up — additive on-chain OracleQuoteSet working-branch implementation

The former statement that no quote-set layout had been selected is superseded by this implementation experiment on `work/immortal-green-closure`. The detail and exact compatibility rules are recorded in [ORACLE-QUOTE-SET-EXTENSION-20261021.md](../../audit/pre-genesis-genesis/ORACLE-QUOTE-SET-EXTENSION-20261021.md).

The Plutus datum now retains legacy constructor 0 unchanged and adds constructor 1 with a list of asset-specific quotes. `Economic.totalUsdmValue` resolves each non-zero asset against that list, with exact identity matching and fail-closed behavior for a missing or duplicate requested quote; the existing publisher, freshness, precision, ADA minimum-UTxO and integer-ceiling rules remain in place. Genesis's PRE observation can select its quote from the same datum shape.

**This is not yet multi-asset Issue completion.** The application settlement amount builder still constructs ADA-only payment and explicitly requires an ADA quote. A quote-set datum must first be built/published through a verified source path, and Plutus tests/build/export must pass on the exact head. Since `Economic` is shared by protocol scripts, every dependent script hash/size and the current 16,384-byte transaction/resource constraints must be re-audited before promotion. No live Oracle UTxO was updated; no main merge, deployment or Preprod Issue occurred.


## 2026-10-21 follow-up — programmatic multi-asset Issue settlement path

The earlier statement that the builder remained strictly ADA-only is superseded as a source-code statement by the current working-branch implementation:

- `src/issueSettlement.ts` now offers `buildIssueSettlementAssets`. It takes buyer-selected economic asset quantities, decodes the requested quotes from the authenticated Oracle State datum, requires exactly one matching quote per non-zero asset **including ADA carried for the min-UTxO floor**, applies the existing per-asset integer ceiling conversion, and rejects the basket unless the sum equals the exact `pdPriceUsdm` target. It adds the fixed min-UTxO ADA floor; an optional `lovelace` input represents additional economic ADA over that floor.
- `src/mint.ts` exposes an opt-in `settlementAssetQuantities` field and sends that map to the Treasury output. After `tx.complete()`, the new `assertCompletedTreasurySettlement` compares the **entire completed Treasury Value**—ADA and every token identity/quantity—to the expected map before signing/submission.
- The Plutus schema/helper was extended compatibly: legacy `OracleDatum` constructor 0 preserves the old five fields; constructor 1 stores an `OracleQuoteSet`. `Economic.totalUsdmValue` resolves every asset by exact policy/name and preserves the existing configured-publisher, freshness, precision, minimum-UTxO and ceiling rules. Genesis's PRE observation uses the same quote decoder and on-chain lookup contract. Design: [Oracle Quote-Set Extension](../../audit/pre-genesis-genesis/ORACLE-QUOTE-SET-EXTENSION-20261021.md).

**Limits remain material:** this is not yet a released DApp experience. The buyer UI has not been shown to supply or optimize asset baskets; the active Preprod Oracle State UTxO has not been updated/verified as the new quote-set constructor; the quote publisher remains an existing trust boundary; and the new Haskell sources/scripts have not yet passed a completed full compile/export/integration run at this checkpoint. Changes to `Economic` affect script artifacts/hashes and must be measured against the 16,384-byte transaction limit before deployment. The new helper does not broaden the direct-USDM EEV perimeter.

No real Issue transaction was built, signed, submitted or reconciled; no deployed Oracle datum, validator, V3 or Reveal semantics were changed. Main remains unchanged.


## 2026-10-21 follow-up — DApp exposes an authenticated single-asset settlement choice

**Implementation head:** `0754de3c9f8677ad485f55dfac52f16bcc2cf1eb` on `work/immortal-green-closure`.

The Issue UI now has an explicit settlement-asset selector. It does not assume that the USDM accounting unit is the required payment token.

- On wallet connection and on ticket-class changes, the DApp reads the unique configured Oracle State singleton and the currently connected wallet's UTxOs.
- It derives options only from wallet-held assets having exactly one matching quote under the current Oracle datum, configured publisher, freshness checks and an integer quantity that reproduces the selected `pdPriceUsdm` target using the canonical conversion. For non-ADA payment it additionally requires the ADA quote for the Treasury output's min-UTxO component.
- The buyer must select an option explicitly. The selected unit/quantity flows to `mintSerialNFTWithAuthoritativeAdmission` as `settlementAssetQuantities`. The completed Lucid transaction is checked against the full expected Treasury `Value` before the adapter can sign or submit it; the Plutus equality predicate is still the final authority.
- The UI presently constructs **single-asset economic payment choices** (ADA or one quoted token), not a buyer-composed mixed basket. The lower-level amount builder validates mixed baskets, but the DApp does not invent an allocation/splitting rule to compose one. Any future basket UI needs a separately specified allocation interaction and must continue to require exact ledger-side equality.
- This interface can only offer assets that the active Oracle singleton datum actually quotes. A legacy single-quote datum will not magically enable PRE/NIGHT; a quote set containing only token quotes but no ADA quote cannot support an output that carries ADA min-UTxO. Unsupported, duplicate, stale or mismatched quotes cause options to be omitted and Issue stays disabled unless the buyer selects a valid available option.

### Exact-head evidence

- [Cardano Adapter Sale Conformance #4192](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231864) — **success** on the implementation head; both the settlement conformance tests and frontend build passed.
- [Protocol Declaration Conformance #2998](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231841) — **success**.
- [PRE-RICH Action Refinement Conformance #306](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231851) — **success**.
- [IMMORTAL Portability Conformance #1793](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231961) — **success**.
- [Algorithmic Governability Adversarial Lab #4157](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231821) and [Documentation Link Check #1857](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231802) — **success**.
- [PRE-RICH B2 Control Carrier Conformance #424](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231828) and [IMMORTAL Cardano Integration Lab #1997](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39589231840) — still in progress at the last inspection, both in canonical Plutus toolchain setup with no recorded failing step.

### Still not certified

The exact-head Plutus compilation/export, the quote-set vector executed by the intended Plutus artifacts, predeploy structural gate, serialized script/transaction sizes, and a native-ledger execution of a real basket remain unproven by the above completed UI/TypeScript workflow. The live Preprod Oracle singleton was not rewritten, no script was redeployed, no wallet transaction was signed/submitted, and no ticket was created. The UI option is a guarded construction surface, not evidence that a selected asset is currently enabled on Preprod.

The publisher remains the existing oracle trust boundary. This work does not establish fully permissionless market-price production and does not change the direct-USDM EEV perimeter: ADA/PRE/NIGHT settlement acceptance does not make those assets eligible as `VerifiedUSDM` in the B1 PrizePool profile. The giant PR #19 remains unmerged and should not be merged wholesale.


## 2026-10-21 follow-up — DApp permits explicitly composed settlement baskets

**Implementation head:** `2f82743741e451fb8e6c03f228d2378c7c2e5b21`.

The Issue UI has progressed from a one-asset chooser to explicit user-entered quantities for all currently wallet-held assets whose exact quotes are present in the authenticated Oracle State datum. The buyer, not a heuristic, chooses the basket amounts.

- The selector reads the configured singleton and wallet UTxOs; it lists an asset only when its exact quote is unique, fresh under the existing one-hour source window, publisher-matched, and positive. Since every Treasury output must carry ADA min-UTxO, a valid ADA quote is mandatory even for token-only economic contributions.
- The buyer may enter whole integer ledger units for ADA-above-min-UTxO and/or multiple token assets. No token-decimal metadata is inferred; the UI states that token quantities are raw ledger units. Blank or zero token quantities are omitted.
- The application calls the existing basket builder, which mirrors the unchanged per-asset `ceilingDiv` conversion and rejects all quantities unless the aggregate integer USDM result is exactly the selected ticket price. It also checks per-asset wallet balance and ADA min-UTxO funding.
- Only an exact basket enables the Issue button. The selected quantities are snapshotted before the admission request. After Lucid balances and completes the transaction, the whole Treasury `Value` is compared against the prevalidated basket before the Cardano adapter may sign or submit. The Plutus `MintPolicy` equality check remains authoritative.
- This is a manual quantity editor, not a price-allocation algorithm. It does not split the ticket price between assets or decide a basket on the buyer's behalf.

### Exact-head evidence

- [Cardano Adapter Sale Conformance #4194](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321049) — **success** on this head; settlement tests and frontend build passed.
- [Protocol Declaration Conformance #3000](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321004) — **success**.
- [PRE-RICH Action Refinement Conformance #307](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321132) — was running at the last status check.
- [IMMORTAL Portability Conformance #1795](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321288) and [Governability #4159](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321017) — were running at the last status check.
- [Security Credential Boundary #638](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321092) and [Documentation Link Check #1859](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321076) — **success**.
- [PRE-RICH B2 Control Carrier Conformance #425](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321091) — still in canonical Plutus toolchain setup.
- [IMMORTAL Cardano Integration Lab #1998](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39590321405) — queued/pending at the last status check.

### Release limit remains unchanged

Even if every frontend test passes, the live Oracle State UTxO still needs to be inspected to learn whether it actually contains the additive quote-set constructor and unique valid ADA/token records. No active Oracle UTxO or validator was updated. Exact-head Plutus compile/export, quote-set execution by compiled validators, the predeploy structural gate, generated script hash/size review, real native-ledger basket acceptance and ledger reconciliation remain unproven. This commit is a code-only change: no wallet transaction was signed or submitted and no ticket was issued.

The quote set remains validated under the existing configured publisher/freshness trust model; it does not itself make price production permissionless. The EEV boundary remains USDM physically present in the qualified B1 PrizePool UTxO. Accepting an asset as payment does not qualify it as EEV. PR #19 remains a 1,600+ commit / hundreds-of-files integration branch and must not be merged wholesale.


## 2026-10-21 follow-up — Issue transaction-body, oracle-window and min-ADA conformance

This follow-up records three construction-boundary requirements now enforced in the working branch. It does not authorize a wallet Issue or deployment.

1. **Await completion before inspecting the body.** The Lucid v0.10.11 `Tx.complete()` API is asynchronous. The Issue path now awaits it before reading the completed CML outputs or passing the candidate to the adapter. Previously, checking the Promise as if it were a completed body was not a valid final-body conformance test.
2. **Bind the body TTL to the quotes actually used.** Plutus `Economic.validOracleTimestamp` checks each selected quote against the transaction validity upper bound. The builder now derives the earliest existing deadline `quote.timestamp + maxOracleAge` for every asset in the exact Treasury Value, sets a finite `validTo` with one whole slot of conservative margin, and verifies the completed transaction body's TTL equals the selected slot. This reuses the existing `maxOracleAge`; it does not introduce a new economic or freshness threshold. A too-short window fails closed.
3. **Check output-specific minimum ADA.** After the final output is built, the Issue path calculates the required ADA against the actual CML Treasury output—including its complete asset map and inline datum—using Lucid's pinned `min_ada_required(output, coinsPerUtxoByte)` primitive and the provider's protocol parameter. It rejects if the final output's ADA is below that amount. The pre-existing 1.6M lovelace constant remains the economic ADA exclusion applied by Plutus; it is not treated as a universal ledger minimum for every serialized Treasury output.

Focused TypeScript test vectors now cover finite/missing/mismatched TTL and the minimum-ADA boundary. Exact-head CI must pass after these latest edits. No output amount is silently increased, no surplus is hidden from the canonical USDM valuation, and no ADA/PRE/NIGHT basket is authorized merely because a quote exists.

### Evidence and remaining limits

The Cardano Adapter Sale Conformance workflow passed on earlier code revision `80da6d2` (including its settlement conformance test and browser build), before the output-specific minimum-ADA guard was added. That result is not evidence for the newest commit. The output-specific runtime CML call, full predeploy gate, Haskell/Plutus re-export, script hash/size review and native-ledger basket execution remain subject to current-head verification.

The quote-set schema is still code on a working branch only. The currently deployed Oracle State UTxO has not been shown to contain the additive quote-set constructor, and no Oracle State UTxO was updated. Multi-asset settlement, the real wallet Issue, and the fully permissionless/trustless V3 transition therefore remain open.


## 2026-10-21 follow-up — active Oracle quote-set state remains unobserved

The current branch can decode the legacy five-field Oracle datum and the additive multi-quote constructor, and the Issue UI surfaces only assets for which the exact singleton datum supplies a unique, fresh quote from the configured publisher. That is an application fail-closed boundary, not an Oracle deployment or price-source qualification.

The currently identified bootstrap script `audit/cardano-integration/preprod-direct-oracle-state-bootstrap.mjs` creates a **legacy ADA-only** datum when the singleton is absent and merely reuses an existing singleton when one is present. It does not upgrade an existing singleton to `OracleQuoteSet`; the DApp consumes the active datum and does not publish one. A repository-wide branch-tree review found no separate current-branch quote-set publisher in the obvious Oracle/quote/settlement surfaces. No live singleton was queried or changed in this step, so the active network's actual datum shape remains UNKNOWN.

### Resulting first-Issue gate

- A controlled ADA-only Issue can be evaluated only after the exact live singleton is observed and proven to contain a valid ADA quote, the quote window/TTL is compatible, and the final completed Treasury output passes exact integer-value and dynamic min-ADA checks.
- A PRE/NIGHT/mixed basket remains locked unless the live singleton contains exactly one qualified quote for every nonzero asset in the final Treasury Value, including ADA, and the quote set is tied to the configured publisher/source contract.
- A quote list is not automatically trustless: the selected quote still relies on the configured publisher and does not prove external market truth. Do not describe this additive schema as achieving the project's 100% permissionless/trustless target.
- The next operational evidence is an exact live singleton read + source-qualification packet. Only after that evidence exists should a state-update transaction be prepared; any live signature/submission remains separately authorized. No quote price was fabricated and no Preprod transaction was signed or sent during this work.

This gap is independent of the successful TypeScript sale conformance/build. B2 carrier and Integration Lab results are still tracked separately and are not substituted for Oracle source, live-state or wallet-Issue evidence.


## 2026-10-21 follow-up — read-only Oracle observation path prepared

A read-only observer is available at `audit/cardano-integration/observe-preprod-oracle-quote-set.mjs`. It reads the configured Preprod Oracle State singleton and records its exact UTxO reference, datum hash/format, decoded quote inventory, publisher-field matches, duplicate identities, and slot-derived freshness findings. It does not load a signing key or submit a transaction. The pure decoder has targeted synthetic regression tests, but the live observer has not yet been run, so the real singleton's datum constructor and available assets remain unobserved.

When running it, use the same address, policy ID, token name and publisher identity configured for the actual DApp deployment. Preserve the complete JSON output and digest as evidence. A `QUOTE_SET` shape is not enough to authorize a basket: source qualification remains a separate obligation, and the current publisher trust model is not fully permissionless.


## 2026-10-21 follow-up — live wallet evidence reveals a stale legacy Oracle datum

Artifact [IMMORTAL Cardano Preprod Context #39594377501](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39594377501), observed at `2026-10-21T11:46:53.758Z`, records an Oracle-token UTxO in the workflow's configured Preprod wallet:

- Reference: `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`.
- Value: 2,000,000 lovelace + one `ORACLE` token (policy `9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e`, name `4f5241434c45`).
- Datum hash: `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`.
- Datum: constructor 0, one ADA quote at price `100`, timestamp `2026-10-08T17:38:50.142Z`; its publisher field matches the payment credential of that wallet address.
- Quote age at observation: `1,102,083,616 ms` (about `306.13 hours`), versus the existing one-hour freshness bound.

Therefore this observed wallet singleton is **not currently eligible for Issue** under the implemented freshness rule and does not contain a quote set for PRE/NIGHT. The observation is concrete but was taken from the workflow's wallet address; the hidden repository variables used by the deployed Pages DApp still need an exact address/policy/token match before asserting that the public runtime points to this exact UTxO. See §8.6 of `audit/pre-genesis-genesis/ORACLE-QUOTE-SET-EXTENSION-20261021.md` for the full reference and digest.

Do not refresh this datum using a synthetic price or a locally invented timestamp. The next gate is to bind the configured DApp identity to the observed singleton, then obtain a qualified quote source and authorized publisher update under the existing trust contract. Neither this evidence collection nor the new observer script signs or submits a transaction.


## 2026-10-21 follow-up — public Pages release does not contain the working-branch Issue consumer

A read-only comparison of the live deployment history, the current default branch and this working branch establishes a separate release gate:

- The latest successful `IMMORTAL Public Pages` run on `main` returned by the repository Actions API is [run 38182109071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38182109071), built from commit `876bc54f8ee8f6e1dede226db8c367cca3ae620c` on 2026-10-11.
- The current `main` ref remains `97b09a38742098f17a61eb07734c401aeedccc06`. At both the recorded Pages build commit and current `main`, `src/main.ts` resolves to blob `d55ba61dab9377b338989eb56b23b8825c9f6335`: it does **not** contain `mintSerialNFTWithAuthoritativeAdmission` or the settlement basket selector. The `src/issueSettlement.ts` module is absent from `main`.
- The current `main` copy of `.github/workflows/immortal-preprod-pages.yml` is blob `88ee733b7f05d1eb4eb88844ca4056923225e82b` and does not inject `VITE_ISSUE_AUTHORITY_ENDPOINT` or the newer required public Issue runtime variables. The working-branch version is blob `ccd5642e91083d7779d2d434f9547c24be7de1b5` and contains the corresponding variable-presence/HTTPS checks. That workflow/source version is not the deployed `main` version.
- The current working branch head is `21889aad27b36fff9c253454aa82933c08948c0d`; PR [#19](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) remains open, not draft, and not mergeable; GitHub reports 1,664 commits, 381 changed files, 45,734 additions and 2,204 deletions. It is not a safe deployment vehicle to merge wholesale.

**Result: PUBLIC DAPP RELEASE / RUNTIME BINDING OPEN.** A green TypeScript/build workflow on the working branch proves only that branch builds. It does not change GitHub Pages. Do not merge PR #19 to force a deployment. The Issue consumer and its Pages runtime workflow need a curated, dependency-complete promotion reviewed separately from the B3 work and from the Oracle state-update decision.

The live wallet observation in §8.6 remains evidence for the workflow-configured wallet only. Without comparing the exact configured Pages Oracle address, policy ID and token-name with the on-chain observation, do not state that the stale wallet singleton is definitively the singleton the currently deployed site would use. Regardless, the public Pages build does not contain the working-branch Issue consumer and its current workflow does not bind its Issue authority endpoint.

### Current bounded CI evidence

- [Cardano Adapter Sale Conformance #4229](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39595060006) passed on the docs-only head `21889aad27b36fff9c253454aa82933c08948c0d`; it includes the branch's focused TS settlement tests and frontend build, but is not Plutus ledger proof.
- [IMMORTAL Cardano Integration Lab #2020](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39594377482) is still reported `in_progress` on older code head `993f1a8fb95682b0eacf56f19fb8e68e1706e898`, last updated at 11:47:34Z, with native Yaci UTxO decoder conformance running and subsequent resource/predeploy/evidence steps not completed.
- [PRE-RICH B2 Control Carrier Conformance #441](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39594299630) ended `cancelled` on `39e983a472be03b567a2d95a5461a035f190867d`. Its build log shows `OracleTypes` and `Economic` compiled before cancellation, but the workflow did not finish and is not a complete conformance pass.

No merge, Pages deployment, Oracle-state change, signature, or Issue transaction was performed in this checkpoint.


## 2026-10-21 follow-up — isolated Pyth ADA/USD probe is code-level GREEN only

A separate, non-production Aiken/Plutus V3 project now tests the exact ADA/USD feed selection, update timestamp and feed timestamp freshness, duplicate/missing feed rejection, and equality binding between the raw quote and a consumer datum. It is isolated under `poc/aiken-pyth-ada-usd/`; it does not change the deployed Oracle State, the Haskell Plutus V2 MintPolicy, V3 carrier or Reveal.

- Source pinned to Pyth Lazer Cardano commit `217b5917228b17f015719b27dd616a75ad6bd800`, Aiken v1.1.21 / stdlib v3.0.0. The generated `aiken.lock` is committed.
- [CI run #5](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39600694371), head `75c9c89a9b00d26ff662000a7b1cfea1f68b038d`, passed nine synthetic tests, Aiken build, lockfile/hash capture and blueprint artifact upload.
- Artifact [pyth-ada-usd-probe-75c9c89a9b00d26ff662000a7b1cfea1f68b038d](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39600694371/artifacts/12345837738) contains manifest/lockfile/blueprint/SHA256SUMS. The isolated script's compiled-code field is 6,806 bytes; full transaction CBOR and execution on a ledger were not measured.

**This is not a closure of the Issue oracle blocker.** The tests fabricate `PriceUpdate` data and only establish pure freshness/selection/binding logic. They do not exercise a genuine signed payload, a Pyth zero-withdrawal verification in the same transaction, or the exact value used by `MintPolicy.atomicTreasuryPaymentValid`. The quote-scale conversion into current `OracleQuote.price` remains deliberately unspecified. No live Issue, Pages deployment or Oracle State migration is authorized by this probe.


## 2026-10-21 follow-up — re-observed bootstrap Oracle singleton; public runtime identity still unavailable

Read-only Koios observation run [39602227985](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602227985), uploaded as [bootstrap-wallet-oracle-observation-708120cbaddb3ebf1b1b56a3f347bac19e13f1c7](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602227985/artifacts/12346467535), manifest SHA-256 `769e855696b40d191a05325ec0b18082b56af681968dbf33aa93806979be809a`.

At `2026-10-21T12:46:12.590Z`, Koios returned exactly one configured Oracle token in the previously observed bootstrap wallet UTxO `fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`. Its inline datum hash was unchanged (`aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`) and it still decodes as legacy constructor 0 containing only an ADA quote at price field `100`, timestamp `1791481130142`, publisher field matching the expected publisher. Quote age was `1,105,642,448 ms` (about `307.12 hours`); the existing one-hour predicate classifies it stale. This observation neither signed nor submitted a transaction or changed the UTxO.

The workflow's separate strict observation of the exact public Pages runtime identity failed before querying Cardano because the workflow environment has no `BLOCKFROST_PROJECT_ID`, `ORACLE_STATE_ADDRESS`, `ORACLE_STATE_POLICY_ID`, `ORACLE_STATE_TOKEN_NAME_HEX`, or `ORACLE_PUBLISHER_PKH`. Consequently we **cannot yet state** that the bootstrap wallet singleton is the singleton used by the public DApp.

Current closure status:
- **On-chain code capability:** quote-set constructor and asset-specific lookups exist on the working branch; Haskell exact-head proof remains separate.
- **Basket builder/UI:** explicit basket quantities and exact integer USDM preflight are implemented in source; no authorized quote set is live-observed.
- **Live Oracle operational readiness:** BLOCKED — the wallet singleton observed by Koios is legacy and stale; exact public runtime identity has not been furnished to the read-only observer.
- **Oracle source trustlessness:** OPEN — datum publisher matching alone is not external-price verification or permissionless sourcing.
- **First real Issue:** still blocked. No transaction was built, signed or submitted, and no Oracle datum update is authorized by this note.


## 2026-10-21 follow-up — price-carrier feasibility probe passed

The isolated Pyth project now also compiles a quote-carrier continuation validator. [CI run #12](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602416931) passed on commit `7298455cd01ee73915d294e713fbb8ef355f7e8a`: 13 synthetic Aiken tests and Plutus V3 compilation both succeed. Artifact: [`pyth-ada-usd-probe-7298455cd01ee73915d294e713fbb8ef355f7e8a`](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39602416931/artifacts/12346542438). The compiled carrier validator field is 8,289 bytes (not transaction size).

This is code-level proof only. The probe checks unique script input/output, same continuing address and Value, singleton token preservation and exact match between the output quote tuple and the fresh ADA/USD tuple selected from synthetic Pyth update data. It does not constitute native-ledger Pyth signature verification, does not yet bind the price consumed by Haskell Plutus V2 MintPolicy, and does not answer the governed USD→USDM conversion. First real Issue remains blocked. No Pyth State, legacy Oracle State, production MintPolicy, V3 carrier or Reveal was changed.


## 2026-10-21 follow-up — stale quote confirmed against Preprod chain tip

The read-only workflow now uses Koios `/tip.block_time` for classification instead of the CI runner's local clock. In [run 39603184562](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39603184562), the fallback observation passed and recorded tip hash `e6aba53968d335ac5edbe0873ff7ecedf90ec6e826313f07d0238520038121c4`, block `5318224`, absolute slot `136903888`, epoch `320`, block time `2026-10-21T12:51:28Z`.

The same singleton UTxO and datum hash are observed: `cardano:tx/fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`; datum hash `aeb64ac953285ef1dcf2aa017ee09bbe94ffc93c7ddb177b29e579a9078191b2`. It remains legacy constructor 0 with only an ADA quote; quote age at the chain tip is `1,105,957,858 ms` (~`307.21 hours`), exceeding the existing one-hour freshness bound by more than twelve days. It cannot support a settlement under the existing predicate and does not expose PRE/NIGHT quotes.

The strict observer job still lacked all five values in its own GitHub environment: `BLOCKFROST_PROJECT_ID`, `ORACLE_STATE_ADDRESS`, `ORACLE_STATE_POLICY_ID`, `ORACLE_STATE_TOKEN_NAME_HEX`, and `ORACLE_PUBLISHER_PKH`. That does not by itself prove repository-level variables for Pages are unset. However, the current `main` Pages workflow (blob `88ee733b`) has no VITE runtime-variable injection block, the latest successful Pages deploy observed was run [38182109071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38182109071) from older SHA `876bc54f` on 2026-10-11, and the current main consumer at `src/main.ts` (blob `d55ba61d`) lacks the authoritative Issue provider and `mintSerialNFTWithAuthoritativeAdmission`. Therefore the deployed public DApp cannot be treated as containing the working branch's Issue consumer/runtime configuration until a new reviewed Pages build and exact runtime identity observation confirm it. No update was signed, submitted or deployed. First real Issue remains blocked.


## 2026-10-21 follow-up — exact-source Haskell and settlement CI confirmed

[IMMORTAL Haskell Semantic Conformance run 39599364846](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39599364846) is now `success` on `edb61d74c2aa5a076fbda5d11941c119776f87d1`, including the Oracle conformance step. The core quote-set sources `OracleTypes.hs`, `Economic.hs`, `EconomicOracleTest.hs` and `MintPolicy.hs` are byte-identical between that tested commit and the current working branch. The settlement builder, focused settlement test and predeploy gate are also byte-identical at that tested SHA. The later Cardano Adapter Sale Conformance run [39603184582](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39603184582) passed on `fd71136ed688231072f2c041c67aa5c63a2262b1`.

This raises the confidence of the quote-set and exact Treasury-body conformance code, but it is not a live Issue result. The bootstrap wallet's Oracle UTxO remains legacy/stale; the strict observation of the public Pages runtime still fails on missing config; the Pyth probe is still synthetic code-level evidence; and the Integration Lab did not yet finish in the last observation. No real Issue transaction was built, signed, or submitted.


## 2026-10-21 follow-up — Pyth exact-rational conversion candidate passes synthetic tests

The isolated Pyth project now has a mathematical candidate for converting the authenticated raw price/exponent to USDM sub-units while explicitly accepting `D = USD per USDM) as a rational parameter. It intentionally does not assume `D = 1); the new synthetic tests include `D = 2) and `D = 3/2), raw-price-first rounding, positive exponent, and invalid-input cases.

[Run 39604543598](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/39604543598) passed on commit `c05267ca202bae85332870ef4c98b8972175d283`; the current probe/carrier source blobs are the same. Reported output: 15 tests in the conversion/source module + 12 carrier tests = 27; 27 checks, 0 errors and 0 warnings; Plutus V3 build passed.

This narrows the conversion work from an unstated floating-point/scale guess to an explicit rational input, but it does not settle or authenticate that input. No current normative source establishes the live on-chain value of USD per USDM, and the helper is not connected to the existing Plutus V2 MintPolicy. No Issue, Oracle State update or deployment is authorized by this code-level result.


## 2026-11-02 — V3 build qualification and first-Issue blocker reconciliation

This entry supersedes only the historical build/settlement observations below where newer source and CI evidence is now available. It does not authorize a Preprod transaction.

### V3 artifact qualification

- [V3 Carrier Build Qualification run #4](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41465620005) completed **SUCCESS** on source commit `2f3f93b796598759aaf1e99d230227c62f9d4a42`.
- The workflow performed a fresh Plutus build, then validated both `PlutusScriptV2` envelopes, their CBOR hex and the 116-byte canonical initial datum. The verifier emitted a source-bound manifest explicitly classified `FRESH_BUILD_ONLY_NOT_DEPLOYMENT`.
- Artifact ID: `13154608156`; uploaded ZIP SHA-256: `6660bf2096c076369727816bcac6f667b2c5749ff79f4ebd757324fddba0ed17`.
- Validator CBOR: 4,483 bytes, SHA-256 `2c3ebe6d7bf2b76c6348bf842526e910603dbb3d727d9ccb285e0497d58b0cc1`.
- Mint-policy CBOR: 1,124 bytes, SHA-256 `74423c8aac4f9e7daa090bece3dd900efea9325e1fd0993686cbcef6a7745a97`.
- Initial datum: 116 bytes, SHA-256 `06f58b4bac3120cc7da2260542317172f9cb24484c611ecd05e2113ccf553da9`.
- All 14 source blob SHAs recorded by the run-#4 manifest were independently compared with GitHub at its source commit and matched.

The subsequent deployment-helper preflight hardening is on `work/immortal-green-closure`, commit `4b2dea881745f923ae20b8d9e161dd4417c37c3e`: it requires an Ed25519 OKP public key, explicit seed transaction hash plus output index, a 1–32-byte token name, and even-length non-empty CBOR envelopes. The existing evidence writer uses a valid single-newline JSON suffix. [Run #6](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41471194297) is rebuilding from this updated commit; at the time of this entry its Plutus build step is still in progress, so a fresh current-helper manifest is not yet claimed.

### Yaci proof is not Preprod deployment

[IMMORTAL V3 Carrier Fast Ledger Gate run #261](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41471194512) completed **SUCCESS** on commit `4b2dea881745f923ae20b8d9e161dd4417c37c3e`. It restored and verified a cached V3 artifact, started isolated Yaci DevKit, completed a native-ledger smoke transaction and executed the V3 carrier ledger probe. Its cache key is derived from the V3 Haskell sources, Plutus Cabal package, setup action and package lock. The fresh run-#4 build above independently compiled the same V3 source blobs. This is a Yaci/devnet ledger result only: it does not establish a Cardano Preprod address, policy ID, singleton UTxO, transaction reference or deployed Issue Authority key.

### Reconciliation of the historical Treasury-settlement blocker

The earlier A4 note describing a fixed 1,000,000-lovelace Treasury payment as incompatible with the on-chain valuation is historical for an older builder snapshot. On the current working branch, `src/mint.ts` no longer uses `TICKET_PAYMENT_LOVELACE` for the Issue Treasury output. It obtains the authenticated Oracle State singleton, constructs a settlement basket using `src/issueSettlement.ts`, and checks the completed transaction body for exact Treasury settlement, finite validity upper bound and output-specific minimum ADA before submission. The on-chain MintPolicy still requires `Economic.totalUsdmValue` to equal `pdPriceUsdm`; the valuation-excluded ADA floor remains 1,600,000 lovelace.

[Cardano Adapter Sale Conformance run](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41471194368) completed **SUCCESS** on the current helper-hardening commit and ran `issueSettlementConformance.test.ts`, `authoritativeIssueEntrypoint.test.ts`, the signed-authority tests and the related admission-boundary suite. This supersedes the old source-level claim that the current builder still hardcodes the 1,000,000-lovelace Treasury payment.

This is implementation and CI evidence, not a live settlement: it does not prove that the currently observed Preprod Oracle State is fresh, source-qualified, publisher-authorized or sufficient for a real user's Issue transaction. The live Oracle/EEV source and completed Preprod Issue remain separate gates.

### Remaining authority and deployment blockers

- `scripts/deployV3Carrier.mts` applies `ISSUE_AUTHORITY_PUBLIC_KEY` as a parameter of the validator. The on-chain carrier checks a 32-byte Ed25519 public key against a 64-byte signature over the canonical carrier-binding message. The production public key therefore cannot be selected merely because it parses as Ed25519; its custodian and corresponding production signer must be identified and verified before deployment.
- `relayer/issueAuthorityServer.js` is a downstream `POST /issue-admission` relay. It requires `ISSUE_AUTHORITY_SOURCE_URL` (or `ISSUE_AUTHORITY_URL`) and `ISSUE_AUTHORITY_PUBLIC_KEY`, fetches a signed envelope from that external source, and invokes the Haskell producer. It does not itself originate or sign the upstream economic decision.
- `relayer/preprodIssueAuthorityEnvelope.js` can sign an already-computed witness, but the inspected production call path does not invoke it; the checked uses are tests with ephemeral Ed25519 keys. That is not evidence of a production signer, key custodian or qualified external decision source.
- The Pages workflow reads `VITE_ISSUE_AUTHORITY_ENDPOINT` and `VITE_V3_CARRIER_FACTORY_URL` from repository variables and validates the public endpoint format. It explicitly allows the endpoint to be absent, in which case the build may succeed while ticket issuance remains disabled. The actual configured variable values and a production signed response have not been independently verified here.
- No inspected GitHub Actions workflow invokes `npm run deploy:v3-carrier`. The existing `preprod-v3-carrier-observation` job only observes a carrier after it already exists. The V3 Fast workflow is Yaci-only; the build-qualification workflow is non-deploying.

**Decision:** do not create or run the V3 Preprod deployment transaction yet. First qualify the production Issue Authority public key/custodian and external signed-decision source, re-observe the exact live Counter/Pool/Oracle/B2/V3 candidate identities and evidence bindings, and verify the deployment wallet/seed UTxO/token-name inputs without exposing secrets. Only then can a dedicated, separately reviewed GitHub deployment workflow be considered. No mnemonic or private key was read in this audit; no Cardano Preprod transaction, signing operation, mint or singleton creation was performed. V3 validator/policy semantics, Reveal semantics and economic rules were not changed.


## 2026-11-02 — Public Pages and production Issue consumer are still on different source snapshots

A direct comparison of the default branch with the current work branch confirms that the Issue consumer is not in the currently published source baseline:

| Path | `main` blob | `work/immortal-green-closure` blob | Difference |
|---|---|---|---|
| `.github/workflows/immortal-preprod-pages.yml` | `88ee733b7f05d1eb4eb88844ca4056923225e82b` | `ccd5642e91083d7779d2d434f9547c24be7de1b5` | main has no Issue/V3 public runtime-variable injection; work reads and validates the relevant repository variables |
| `src/config.ts` | `4e4dcf268c5ff01677922e2972a7e662ff87a760` | `37c75e237e4c47ab2ea3f04f43f76ad57bf71636` | main has no `VITE_ISSUE_AUTHORITY_ENDPOINT` or `VITE_V3_CARRIER_FACTORY_URL` |
| `src/main.ts` | `d55ba61dab9377b338989eb56b23b8825c9f6335` | `7841e9f75ac1bc136032e32770d41c310a25de73` | work constructs the remote authoritative Issue provider and calls `mintSerialNFTWithAuthoritativeAdmission()`; main does not |

The latest successful `IMMORTAL Public Pages` run found on `main` is [run 38182109071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38182109071), from 2026-10-11, source SHA `876bc54f8ee8f6e1dede226db8c367cca3ae620c`. No later successful Pages deployment appears in the inspected Actions history.

PR [#19](https://github.com/LiberoNuvola/Immortal-Protocol/pull/19) is currently open, not merged and reported non-mergeable. Its description says the site is not part of the PR, but GitHub's paginated changed-file list and exact patches confirm that this PR does include `.github/workflows/immortal-preprod-pages.yml`, `src/main.ts`, `src/config.ts` and `scripts/deployV3Carrier.mts`; treat the PR description as stale or ambiguous for the PRE-RICH DApp integration. The Pages workflow's push path filter includes `src/**`, `PRE-RICH/**`, package manifests and the workflow itself. Thus an approved merge after conflict resolution would be capable of triggering a Pages build, but the PR has not merged and no such deployment has been observed.

The working Pages workflow reads `VITE_ISSUE_AUTHORITY_ENDPOINT` and `VITE_V3_CARRIER_FACTORY_URL` from repository variables. It validates an Issue endpoint when supplied, but deliberately allows it to be absent and then leaves ticket issuance disabled. The actual variable values are not exposed by the inspected read-only repository evidence; no production signed Issue envelope has been observed. The latest successful Pages deployment found on `main` remains run [38182109071](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38182109071), source SHA `876bc54f8ee8f6e1dede226db8c367cca3ae620c`, dated 2026-10-11.

**Deployment consequence:** the first-ticket path has two separate release gates: (1) publish and verify the reviewed DApp/Pages consumer with the approved public endpoint and exact V3 factory identity; (2) independently qualify the server-side external signed-authority source, its Ed25519 public-key custodian and the corresponding production signer. Do not infer either gate from a green frontend build or from PR #19 metadata. No Pages deployment, merge, authority configuration change or Preprod transaction was performed by this audit.


## 2026-11-02 — Live EEV requalification and ProtectedCapital census result

A read-only qualification run completed today:

- [PRE-RICH Preprod EEV — Source Qualification Only, run 41431290207](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41431290207)
- Source commit: `cb720bf72d4f42de0c28da92f600f5ce1f48c66a`
- Artifact ID: `13135020137`
- Artifact SHA-256: `0c78e5a8321d50918ea24634ecdebd19e51e18d4ba6b84bbb340bd2f56454146`
- The workflow completed all steps, including exact Oracle State observation, read-only PrizeValidator/B1 Pool census, direct-USDM source-set observation, EV1–EV7 qualification, and evidence-integrity verification.

### Direct-USDM EEV result

The source-set was observed at Cardano Preprod tip slot `137933127`, block `5364510`, tip hash `89812e57ac214edcf946950e885a4a4a8c0edf6eb2d347c7ec5a11908a699529`, around `2026-11-02T10:45:27Z`.

- Exact B1 Pool singleton: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`
- Physical direct tUSDM: `1,000,000,000` atomic units
- Direct-USDM derivation: `floor(atomicQuantity × 100 / 1,000,000)`
- Derived EEV: `100,000` IMMORTAL USDM subunits = `1,000 USDM`
- Profile: `PRE-RICH-EEV-USDM-DIRECT-V1`
- Qualification: `qualified`, properties EV1–EV7
- Deployment approval: `null`; governance state remains `PENDING`
- Source-set state: `OBSERVED_NOT_QUALIFIED`; it is not an approval.

This is fresh source evidence for the exact candidate at that observation boundary, not a standing approval. The profile itself requires the exact out-reference to be revalidated as live immediately before admission and consumed by the Issue transaction. No deployment approval was materialized by run 41431290207.

### ProtectedCapital live census

The same run completed the read-only Koios census at the same reported tip:

- Derived PrizeValidator address: `addr_test1wzf7ctkjwysu3v94f0ccqjef63kdwy2gc4qj368x3a70lvsq6uygp`
- PrizeValidator scan: zero UTxOs, one page, exact `Content-Range: */0`
- B1 PrizePool scan: one UTxO, exact singleton reference above
- Pagination totals reconciled; tip remained stable during the scan; the inline B1 datum hash comparison matched.

Observed B1 aggregates at this snapshot:
- `ppPendingLiabilities = 0`
- `ppUnresolvedReserve = 0`
- `ppUnresolvedTicketCount = 0`
- `ppLockedJackpot = 0`
- item-ledger L1/L3 totals are zero and internally match those B1 aggregates; L2 is reported `ZERO_AT_THIS_SNAPSHOT`.

**Qualification boundary:** the census reports `ticketLedgerInternallyReconciled=true`, but it explicitly reports `sourceCompletenessAuthorityVerified=false`, `providerAttestationVerified=false`, `providerSnapshotPinned=false`, `sameBackendSnapshotVerified=false`, `fullProtectedCapitalQualified=false`, `r7L6EmptinessProven=false`, and `l2LifecycleProven=false`. The deployment manifests are hash-consistent but not signature-authenticated. A zero-row PrizeValidator scan is therefore an observed zero at this Koios snapshot, not proof that L6 is empty or that PA1–PA7 are certified.

### Oracle State and settlement blocker

The exact configured Oracle State singleton was observed live at:

`fab6b85906cb804830954f50882623ef8a963d18330dedcd33fb23f3a1902a7a#0`

Its datum still contains only the legacy ADA quote:
- quote timestamp: `1791481130142` ms;
- configured maximum age: `3,600,000` ms;
- age at the Cardano chain tip: `2,135,196,858` ms;
- result: `STALE`;
- external price source verified: `false`;
- publisher trust independently eliminated: `false`;
- multi-asset settlement authorized by this observation: `false`.

The datum is not refreshed or substituted by the observer. The current Issue builder requires one exact, fresh, publisher-matched Oracle quote for every asset in the Treasury settlement output, including ADA for its min-UTxO component. Its ADA-only fallback rejects the stale ADA quote; its multi-asset basket rejects tUSDM because the current legacy Oracle datum contains no tUSDM quote. Consequently there is currently **no qualified Treasury settlement basket** demonstrated for the owner's first purchase. Do not mint a new Oracle State or update this singleton without an independently qualified publisher/source and the existing authorized transition.

### Capacity / Kc / viability

The 2026-11-02 C1 reconciliation records the semantic mapping `C = EEV - ProtectedCapital` and the frozen `KA=8/KC=4/KD=4` baseline, but leaves SafetyCapital source, ReserveProtection source/disjointness, MandatoryFutureCosts bounds, PA1–PA7 certification, same-observation producer binding, and independent Hysteresis replay at Issue OPEN or UNPROVEN.

The available V3 viability audit records no concrete non-vacuity/QNE witness and no concrete `K_c` certificate. No new certificate or independently replayable viability packet was produced by the EEV run above. A boolean `allOmegaSuccessorsCertified` or an opaque `viabilityCertificate` object supplied by an external provider is not a substitute for that evidence.

### Resulting first-ticket gate

The new observation improves the evidence baseline but does not close first Issue:

1. EV1–EV7 direct-USDM qualification is green for the observed candidate; deployment approval remains pending and live UTxO revalidation is required immediately before admission.
2. The item census has zero rows and internally reconciles the Pool aggregates, but provider/source completeness, PA1–PA7, L6 emptiness and L2 lifecycle remain unproven.
3. The Oracle singleton is stale and supplies no tUSDM quote; no valid Treasury settlement basket is available.
4. The concrete ProtectedCapital producer and replayable `K_c`/Omega viability evidence remain unqualified.
5. The external signed Issue authority source and production Ed25519 signer/custodian remain to be qualified.

No code, approval, key, Oracle datum, wallet configuration or on-chain state was changed by run 41431290207. It did not build, sign or submit an Issue transaction.


## 2026-11-02 follow-up — Existing Oracle observation paths are not an authorized publisher/update path

The repository already contains separate read-only observation surfaces:

- `.github/workflows/oracle-quote-set-observation.yml`: observes the exact configured Oracle State singleton using the configured deployment identity; a second job observes the previously identified bootstrap-wallet singleton via Koios. The workflow comment explicitly excludes seed, signing key, transaction builder, submission and deployment.
- `.github/workflows/charli3-preprod-feed-observation.yml`: reads official Charli3 Preprod ADA/USD and USDM/USD feed NFT UTxOs and inline datums.
- `.github/workflows/orcfax-preprod-feed-observation.yml`: resolves the official Orcfax FSP pointer and reads exact Preprod CER feed UTxOs.
- `.github/workflows/multi-oracle-conformance.yml`: tests the structural/registry boundary; it is not a live feed attestation or an Oracle State publisher.

No recent run/artifact for these observation workflows was found in the inspected working-branch Actions history. Their presence in the repository is not evidence that the corresponding providers have been qualified or that any quote has been written into the configured singleton. The existing source-code separation is intentional: observation and feed decoding do not sign or submit an Oracle State transition.

The consulted Notion decisions further constrain source selection:
- [Gate 22 — PRE Oracle Source Set](https://app.notion.com/p/3e0c4454d6d581fc8d72c15ddd4919a6) explicitly does not canonize a PRE→USDM provider; the concrete source/provider, numerical parameters, quorum/independence classes, dispersion and depth evidence remain deployment evidence gates.
- [Gate 30 — PRE PriceReference Contract](https://app.notion.com/p/3e0c4454d6d581bd8987ca079abef1ea) records Snek as the current PRE-graduation market-source candidate, while the specific PRE pool identity and canonical PRE→USDM reference remain OPEN.

Those PRE market-source decisions are a separate question from the quote required to value tUSDM in the current Treasury basket; they do **not** authorize a tUSDM=1 USDM quote or any ADA/tUSDM conversion. They do, however, reinforce the existing non-assumption rule: a feed observation, a source's existence, or a plausible price is not sufficient to become the canonical publisher/reference.

**Next safe Oracle gate:** use the already-existing read-only observer(s) to acquire exact feed/singleton evidence; qualify source identity, publisher authorization, asset/quote direction, timestamp, freshness, and any required independence/depth constraints under the already-adopted contract; only the authorized publisher/transition may update the singleton. No direct datum edit, key generation, quote invention, or fallback to a stale/unauthorized source is permitted by this readiness record.

## 2026-11-02 follow-up — V3 build #6 complete; Oracle candidate-source review

### Fresh V3 build qualification

[V3 Carrier Build Qualification run #6](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41471194297) has now completed **SUCCESS** on exact source commit `4b2dea881745f923ae20b8d9e161dd4417c37c3e`.

- Artifact ID: `13157837592`
- Artifact ZIP SHA-256: `24df5e54cbe130e88b49d8295804a81f17d9cd2912f68407b24aa23d3cf40a2a`
- Qualification classification: `FRESH_BUILD_ONLY_NOT_DEPLOYMENT`
- Network: `none`
- The manifest records `deployment.attempted=false`, `transactionSubmitted=false`, `carrierSingletonCreated=false`, and `issueAuthorityPublicKeyApplied=false`.
- All 14 source blob SHAs in the manifest were independently compared with GitHub at the exact source commit: **14/14 matched**.
- Validator artifact: 4,483 CBOR bytes, SHA-256 `2c3ebe6d7bf2b76c6348bf842526e910603dbb3d727d9ccb285e0497d58b0cc1`.
- Mint-policy artifact: 1,124 CBOR bytes, SHA-256 `74423c8aac4f9e7daa090bece3dd900efea9325e1fd0993686cbcef6a7745a97`.
- Initial datum: 116 bytes, SHA-256 `06f58b4bac3120cc7da2260542317172f9cb24484c611ecd05e2113ccf553da9`.

The validator, mint-policy and initial-datum hashes match run #4. The new run therefore confirms a clean source-bound rebuild of the same on-chain artifacts after the deployment-helper preflight hardening; it does not create a parameterized deployment, V3 address, singleton UTxO, or Issue authority binding. The run's own limitations explicitly say that a build does not prove Preprod deployment or Issue authorization.

### Additional conformance results on the readiness-doc revision

The following runs on commit `dcc7e170d3234c532a20f8c17a646d56c573b139` have completed **SUCCESS**:

- [Cardano Adapter Sale Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41475976709): economic/admission conformance suite and frontend build.
- [Protocol Declaration Conformance](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41475976727): declaration tests and typecheck.
- [Flux Point DoD Pilot](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41475976622): local DoD harness and Materios verifier tests.

These are code and test results. None is a Preprod Issue transaction, V3 deployment, or Oracle State update.

### Oracle feed candidates — code-level review, not live qualification

A review of the existing read-only observers identifies concrete candidates, but does not close the current Oracle gate:

- **Charli3:** the observer pins exact Preprod feed identities for `USDM/USD` and `ADA/USD`, with documented maximum ages of one hour and thirty minutes respectively. Its decoder reports pair identity, timestamp/expiry interpretation, precision, and available provider/signatory metadata. Its resulting feed records remain `OBSERVED_NOT_QUALIFIED`; the script does not independently prove external source truth or the trustworthiness of the signatory/publisher set. Timestamp magnitude normalization is explicitly reported rather than treated as an authoritative unit decision.
- **Orcfax:** the observer resolves the FSP singleton and current FS script hash, then scans the exact script UTxOs for `CER/ADA-USD/` and `CER/ADA-USDM/`. It can derive an exact rational USDM-per-USD cross-rate without floating point, but the function returns `CANDIDATE_ONLY_NOT_QUALIFIED` and `authorizedForSettlement=false`. The observer's final status remains `OBSERVED_NOT_QUALIFIED`; blockers include an official-documentation conflict (Preprod marked Active in one table and N/A in the consumer table), archival package status TBA, missing independent external publisher/provenance verification, lack of exact binding to the IMMORTAL Moneta/tUSDM ledger asset identity, and no approved cross-rate/Issue-consumer contract.
- **Configured Oracle State:** the existing observer only inspects the exact configured singleton and its quotes. It explicitly does not assert external market truth or promote a quote to source-qualified status; it has no signer, transaction builder, submit, or state-update path.

The reviewed scripts are candidate-discovery and observation surfaces, not an authorized Oracle publisher. No newly qualified live feed artifact or authorized quote-set transition was produced by these checks. A cross-rate candidate cannot be substituted for the stale ADA quote, nor can a feed label be treated as proof that its token is the exact configured tUSDM asset.

### Updated readiness decision

V3 build qualification and the listed conformance runs are now green. The first purchase remains blocked by the independent gates already recorded above: fresh and source-qualified settlement quotes for every Treasury output asset; authorized publisher/transition for the configured Oracle singleton; full ProtectedCapital source coverage and PA1–PA7 evidence; replayable `K_c`/Omega viability and Hysteresis evidence; production Issue-authority source and signer qualification; and the reviewed DApp/Pages release path.

No V3/Reveal semantics, economic constant, Oracle datum, key, wallet configuration, or on-chain state was changed by this follow-up. No deployment, signature, transaction, or merge was performed.
