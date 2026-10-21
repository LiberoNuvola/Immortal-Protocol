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

### A4. Make the first purchase deliberately small and observable

Use the intended user's Preprod wallet and the Genesis / 1 USDM economic class only if the live authoritative state says that class is saleable and all admission checks pass. The current `src/mint.ts` specifies **1 ADA (1,000,000 lovelace) as the current B1 launch settlement payment**; `pdPriceUsdm` records the separate economic price in USDM sub-units. The UI must show this distinction before the user signs. Do not imply that this first transaction transfers USDM.

On approval, have the wallet sign and submit the actual transaction. A successful function return is not sufficient evidence until the chain confirms the transaction and an independent read establishes:
1. the ticket NFT policy ID and serial asset name in the intended wallet;
2. Counter continuation to (n+1);
3. exactly one matching Pending PrizeDatum, bound to the expected B1 Pool;
4. exact Treasury settlement output;
5. B1 Pool reserve/count transition and solvency checks;
6. V3 carrier continuation to the expected version/state; and
7. transaction inclusion, actual inputs and outputs, and no duplicate/replayed issuance.

Record the transaction ID, current input references, policy ID, asset name, resulting PrizeDatum reference, state-before/state-after, and evidence digests in a redacted evidence packet. Never include the buyer's secret, seed phrase, private key, or sensitive endpoint credentials.

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
