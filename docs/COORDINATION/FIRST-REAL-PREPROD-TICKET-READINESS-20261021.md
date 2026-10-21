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

There is a second concrete limit for the requested ADA/NIGHT/PRE settlement choices. `OracleDatum` contains one `odAssetPolicy`/`odAssetName` quote, `MintPolicy` is parameterized with one Oracle State singleton identity, and `Economic.totalUsdmValue` asks that oracle lookup for every nonzero asset before excluding ADA's minimum-UTxO quantity from economic value. A Treasury output containing PRE or NIGHT must also carry ADA for its UTxO minimum; the current path would need authenticated price matches for both assets, but the current one-quote/one-singleton schema does not provide a demonstrated way to supply them simultaneously. That means multi-asset baskets are not merely missing a UI selector; the evidence/reference contract must be designed and tested first. No alternative oracle layout is selected here.\n\nThis also shows why a non-permissionless real Issue would not be useful *yet*: it would combine a known settlement mismatch with an authority-dependent V3 transition. After settlement correctness is restored, a controlled authority-backed Issue may be useful as a narrowly scoped Adapter/ledger-integration experiment (transaction inclusion, actual fee, serialized size and StateBefore/StateAfter). It still cannot substantiate the paper's permissionless claim and must not be presented as doing so.

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
