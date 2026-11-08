# Agent A — Option B multi-oracle authority and first-Issue readiness

**Date:** 2026-11-08  
**Branch:** `work/immortal-green-closure`  
**Audit base HEAD:** `e25f9d16bcd9468e636fa5fd8bd3951103ff5b1a`  
**Classification:** READ-ONLY SOURCE AUDIT / DECISION-READY GAP RECONCILIATION — NON-NORMATIVE  
**Scope:** PRE-RICH first V1 Issue, USD/USDM Option B, multi-provider source verification. This report does not approve a source, registry authority, quorum, aggregation rule, threshold, fallback, price conversion, or production change.

## 1. Executive result

The repository has already implemented a meaningful **multi-oracle adapter and registry-boundary scaffold**. It is not merely a proposal:

- a canonical observation normalizer binds source/feed/pair/direction/raw-price/exponent/timestamp/policy-version fields and checks payload digests;
- a signed registry snapshot verifier checks canonical payload bytes, SHA-256 digest and Ed25519 signature;
- a registry boundary requires a separately verified currentness result, exact registry-head binding and revocation checks;
- focused tests cover invalid signatures, malformed entries, wrong identities, rollback, equivocation, revocation and missing currentness.

The focused workflow **#40823847938** completed successfully on `51f372d12e8eaf671e6042bc9c70d3b8faa2e327` with **53 tests passing**. I compared all six current relayer implementation/test blobs on audit HEAD `e25f9d16bcd9468e636fa5fd8bd3951103ff5b1a` with the exact tested revision: all six blob SHAs match. The 53-case result therefore still applies to those exact files on the current branch.

However, this work is **not a production multi-oracle price path**:

1. the trusted Ed25519 public key is supplied to the snapshot verifier by its caller;
2. the currentness provider is injected and its `VERIFIED` assertion is not authenticated by the boundary module itself;
3. anti-rollback high-water marks are process-local and reset on restart;
4. no independently verified, canonical IMMORTAL registry head/update-authority predicate has been established;
5. the Cardano settlement consumers are not wired to the relayer registry or a multi-provider verifier.

The existing `OracleQuoteSet` is multi-asset quote storage, not multi-provider consensus. `Economic.oraclePriceFor` still consumes one configured Oracle State singleton and one configured publisher for each asset. The production consumers remain single-source.

**Disposition:** the adapter scaffold is real and its targeted structural suite is green; source admission/currentness authority, exact Preprod source qualification, multi-provider aggregation and on-chain consumer integration remain open. No provider is currently qualified for the selected USD/USDM Option B on the exact Preprod asset.

## 2. What is implemented, and what remains an assertion

### 2.1 Implemented relayer boundary

The following files are present and were blob-identical between the current branch and the successful 53-test revision:

| File | Current blob SHA | Actual responsibility |
|---|---|---|
| `relayer/multiOracleObservation.js` | `c9d32054fd0081379f1d38b0268423ea4fad0f56` | Structural observation normalization, pair/direction/version binding and digest check; not a source cryptographic verifier |
| `relayer/multiOracleRegistrySnapshot.js` | `b8ee360403a237e6b00b65d7d0d8fcf692db950a` | Canonical snapshot digest and Ed25519 signature verification; caller supplies the trusted public key |
| `relayer/multiOracleRegistryBoundary.js` | `3af47724520b8f6cdefcf68b6d634ffa2b610e19` | Adapts a registry provider into the observation normalizer; explicitly says it is not the cryptographic verifier or registry of record |
| `relayer/multiOracleObservation.test.js` | `905bb020f2ed561e1817ae70f9a5626536a37bf5` | Structural and digest-negative cases |
| `relayer/multiOracleRegistrySnapshot.test.js` | `faaeaf4355b78ecdfec7af44f5b3104505602d9b` | Snapshot signature, digest and schema cases |
| `relayer/multiOracleRegistryBoundary.test.js` | `c71094444db2722d8b7953a4dd9bf7631e682e4f` | Exact registry binding, currentness and revocation cases |

The source makes its trust boundary explicit. `createSignedMultiOracleRegistryProvider` requires both `trustedPublicKeyPem` and `currentnessProvider.resolveCurrentRegistryState`. The currentness object must report `verificationStatus: "VERIFIED"`, but this module does not prove who authorized that provider or authenticate the provider itself. The process-local maps reject rollback/equivocation during one process lifetime; they are not durable authority after restart.

That is appropriate adapter scaffolding, but the currentness authority and trust-root distribution cannot be left as implicit operator inputs if the system is to claim permissionless, trust-minimized source admission.

### 2.2 Current Cardano consumer is still one publisher

The production source cross-check remains:

- `Adapter/CARDANO/observation/OracleTypes.hs` defines `OracleQuote` with asset policy/name, integer price, timestamp and publisher. `OracleDatum` supports the legacy single quote and additive `OracleQuoteSet [OracleQuote]`.
- `lookupOracleQuote` accepts exactly one match for an asset identity. Two quotes for the same asset—even if they have different publishers—are treated as ambiguous and rejected; they are not aggregated.
- `plutus/Economic.hs::oraclePriceFor` checks the configured Oracle State singleton, the one configured publisher, timestamp freshness and non-negative integer price. It has no source-set digest, provider-specific proof, second USD/USDM leg, raw exponent/rational denominator, confidence interval or multi-provider aggregation.
- `plutus/MintPolicy.hs`, `plutus/B1PrizePool.hs` and `plutus/PrizeValidator.hs` use the same single Oracle State / configured-publisher valuation path.

Therefore the current production MintPolicy cannot prove that its scalar was derived from a qualified USD/USDM feed or from an authorized multi-provider aggregation. An off-chain median or a relayer field marked `VERIFIED` is not a substitute for an on-chain-consumed proof.

## 3. Source candidates: exact-network qualification, not vendor preference

The target is the exact Cardano Preprod tUSDM unit already accepted by the specification authority for the narrow physical-accounting role:

- policy: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9`;
- asset name: `0014df10745553444d`;
- full unit: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`.

That identity acceptance does not establish USD parity, redemption or a market price. Option B remains the adopted conversion approach: USD/USDM must be verified separately.

| Candidate | What is established | Why it does not qualify this Option B path today |
|---|---|---|
| **Pyth Pro** | Pyth documents a Cardano signed-update flow: a transaction carries the signed update and a zero-withdrawal invokes Pyth's verifier. The verifier authenticates the update signature, but the consumer must enforce freshness itself. Pyth Pro is the supported Cardano product; Pyth Core's stored-price model is not listed for Cardano. | A current Pyth USD/USDM observation for the exact Preprod tUSDM policy/name, plus the required ADA/USD (if used) and a transaction-bound consumer proof, has not been established. A USDM reserve NAV is not a unit USD-per-USDM price. |
| **DIA Cardano Oracle** | The public project has Aiken Pair/Receiver/Config validators, a feeder, indexer and an example consumer. Its completion report describes its end-to-end deployment on Cardano Mainnet. | The reviewed evidence does not establish a live Preprod feed for the exact tUSDM asset or a verified Option B witness on this deployment. A custom feed route is a lead, not current qualification. |
| **Orcfax** | Prior repository work identified ADA/USD and ADA/USDM candidate feed legs. | The surfaced statements were stale relative to their declared heartbeat and a Preprod deployment for the exact target was not established. Two stale observations cannot form a fresh conversion. |
| **Charli3** | A historical Preprod USDM/USD Feed NFT/configuration is documented. The public operational statements are mixed. | The exact current live Preprod UTxO/datum, datum precision, approved tUSDM base identity, current provider provenance and consumer verifier path have not been proved. Classify it as NOT QUALIFIED, not categorically dead; do not make the project depend on it. |
| **DEX-derived cross-rate** | Mainnet Moneta USDM/ADA pool structures have been inspected in previous research. | They are not the exact configured Preprod tUSDM asset; venue independence, executable depth, manipulation cost, same-cut observation and a verifier-bound USD leg remain unqualified. |

Provider references are useful to establish technical capability, not IMMORTAL admission authority:
- [Pyth — Use Prices on Cardano](https://docs.pyth.network/price-feeds/pro/use-prices-on-blockchain/cardano)
- [Pyth — Price Feed IDs and Symbology API](https://docs.pyth.network/pro/price-feed-ids)
- [DIA Cardano Oracle repository](https://github.com/diadata-org/dia-cardano-oracle)
- [DIA Cardano Oracle close-out report](https://github.com/diadata-org/dia-cardano-oracle/blob/main/docs/milestones/close-out-report.md)
- [Charli3 Preprod network configuration](https://docs.charli3.io/oracles/resources/networks/preprod)

A feed catalogue, an API response, an indexer result or a provider's own service status does not establish that IMMORTAL has authorized the exact source/feed/policy tuple or that the observation is current and correctly denominated.

## 4. Permissionless target boundary

The existing authority recommendation remains the right boundary for the stated goals:

1. **Provider authentication:** verify each source according to its actual mechanism (e.g. signed Pyth pull update, DIA Pair NFT/datum, source-specific statement proof, or exact DEX pool UTxO and deterministic curve replay). A generic relayer response is not source authentication.
2. **Canonical observation:** bind network, exact base/quote asset identities and direction, source/feed ID, raw integer and exponent/scale, source timestamp and validity reference, provider authority, verifier version and evidence digest. Include confidence/spread or market-depth evidence where the source supplies it and the approved model requires it.
3. **IMMORTAL source admission:** separately bind which source/feed/policy versions are permitted. Provider feed authenticity does not authorize IMMORTAL to accept that provider.
4. **Canonical currentness/revocation:** evaluate a dedicated Cardano registry singleton as the leading trust-minimizing candidate only after its update-authorization predicate can be proven. The consumer must bind the exact live registry state and revocations; a deployment-wallet signature or a trusted HTTP currentness server is not permissionless by itself.
5. **Permissionless construction/submission:** any participant may assemble and submit the evidence packet. Validators decide admissibility from the source proofs and registry state. Relayers/indexers may improve acquisition and liveness only; they cannot choose the source set, quote, quorum, aggregation result or fallback.
6. **Atomic consumer binding:** the same versioned PriceReference/source-set commitment must be used consistently by MintPolicy Treasury valuation, B1 Pool valuation, PrizeValidator settlement and off-chain observation. Missing or rejected multi-source evidence must not silently fall back to the old publisher quote.

A permissionless proposal or transaction submission path is not the same as permissionless source activation. The latter still needs an objectively verifiable update-authorization predicate. Do not add a hidden admin key, committee, quorum, bond/challenge window or majority rule just to make a registry move.

## 5. First V1 Issue: independent blockers remain

This Option B/multi-oracle audit does not close the separate gates recorded in Issue #37:

- **USD/USDM settlement source:** no exact, live and transaction-verifiable source is qualified for the accepted Preprod tUSDM asset.
- **PriceReference contract:** pair direction, exact rational representation, scale/exponent bounds, observation-time compatibility, conservative rounding and fail-closed behavior are not frozen for Option B. No Oracle datum, `Economic.totalUsdmValue` or MintPolicy change is authorized yet.
- **EV1–EV7 / EEV:** previous read-only EV1–EV7 evidence exists, but the latest qualified evidence is not bound to a current deployment approval. Re-observe the exact B1 PrizePool out-reference and quantity at a stable ledger cut; approval must bind those current hashes.
- **R1/Kc/QNE:** the certificate remains missing. Agent B's independent review confirms that the current V1 Issue path keeps the deterministic 500× floor and has no caller-selectable RiskMode downgrade, but it is not the deployment-bound R1/Kc/Ω proof.
- **Expiry (#20):** builder-side snapshot and slot-boundary hardening exists; policy/profile pinning, datum/transaction provenance and the on-chain/deployment compatibility decision remain open.
- **Other admission/control evidence:** the exact deployed B2/control and authoritative Issue admission bindings must be present on the same accepted snapshot.

The direct-USDM EEV profile is deliberately a separate fact: it counts the physically present quantity of the exact Preprod tUSDM in the exact qualified B1 Pool UTxO. It does not prove USD parity and does not discharge the separate USD/USDM settlement conversion.

The sale/Pool distinction also remains material: the current `TicketIssued` transition does not credit PrizePool liquidity from the sale payment; that payment goes to Treasury. It is therefore invalid to use Treasury receipts or the 4,000-USDM Genesis Treasury bootstrap predicate as if they were current liquid PrizePool headroom. The issue-only S0 witness currently erodes the deterministic margin by 500 RU when EEV is unchanged; a statistical confidence bound cannot replace the universal R1/QNE witness.

## 6. Ordered next actions

1. Maintain the current production single-source path as fail-closed; do not edit production Oracle/MintPolicy/Pool/Prize code under this report.
2. Build a provider evidence matrix against the exact Preprod network and tUSDM policy/name. Separate: discovery lead → ledger object observed → fresh observation → provider proof verified → IMMORTAL source approved → consumer-bound qualified quote. No stage may be skipped.
3. In parallel, resolve the IMMORTAL source-registry trust root and update-authorization predicate. Prefer proof-backed, ledger-visible current state; do not silently substitute a fixed admin or trusted server.
4. Only after an explicit source-set and conversion decision, freeze the versioned PriceReference and exact Option B rational arithmetic, then implement provider-specific verification and differential Haskell/TypeScript/ledger tests in a separately authorized scope.
5. Independently refresh EV1–EV7 at one stable cut, obtain a human deployment approval bound to those exact hashes, and produce the deployment-bound R1/Kc/Ω certificate.
6. Close the expiry policy and same-snapshot authoritative Issue admission conditions. Only after every gate passes should the wallet-signed user Issue flow be considered.

## 7. Non-regression / execution record

- Audit base branch HEAD: `e25f9d16bcd9468e636fa5fd8bd3951103ff5b1a`.
- This report adds no new source, provider, feed, quorum, aggregation, freshness, divergence, confidence, ε, Z, policy or threshold.
- No production source, Oracle datum, MintPolicy, B1 datum/redeemer, V3, Reveal, 500×, ProtectedCapital, EEV source or Issue Admission semantics were changed.
- No workflow was dispatched, no CI was triggered for this documentation-only change, no Preprod/Mainnet query or transaction was run, no key/wallet action or deployment approval was performed.
- Existing test evidence is limited to the 53-case relayer boundary workflow and its byte-identical current files; it is not ledger-level source proof or production qualification.

**Final disposition:** MULTI-ORACLE ADAPTER SCAFFOLD = IMPLEMENTED / 53 TESTS PASS / NOT PRODUCTION-WIRED; IMMORTAL REGISTRY AUTHORITY = OPEN; EXACT PREPROD USD/USDM SOURCE = NOT QUALIFIED; EV1–EV7 DEPLOYMENT APPROVAL = NOT ESTABLISHED; R1/Kc/Ω = MISSING; FIRST V1 PREPROD ISSUE = BLOCKED.
