# Multi-Oracle External Candidate Boundary Audit — 2026-10-29

Status: **READ-ONLY CANDIDATE TRIAGE / NON-NORMATIVE / NO SOURCE APPROVED**
Branch: `work/immortal-green-closure`
Scope: distinguish provider/feed authentication from IMMORTAL source-admission and registry-currentness authority. No production code changed.

## 1. Question

Does an existing oracle provider's authenticated feed data or feed catalog also provide the independently verifiable authority over IMMORTAL's allowed `sourceId + feedId + policyVersion` tuples, including activation, revocation, reactivation and canonical currentness?

These are separate questions:

- **Data authenticity:** is this observation authenticated under the provider's protocol?
- **Feed identity/metadata:** what asset pair, direction, scale and provider feed ID does it represent?
- **IMMORTAL admission authority:** why is this source/feed permitted by the active IMMORTAL policy?
- **Registry currentness:** what is the canonical current allowlist/revocation state, and how is rollback rejected?
- **Economic policy:** how are fresh, missing, stale or divergent observations accepted or rejected?

Evidence for the first two does not automatically prove the latter three.

## 2. Candidate A — Pyth

### Publicly documented capabilities

The Cardano Developer Portal's Pyth integration guide describes a pull-based flow in which an off-chain transaction builder fetches a signed price update and the Cardano validator verifies it on-chain through a zero-withdrawal from the Pyth withdraw script. The validator reads verified updates from the transaction being validated. The documentation also states that deployments are network-specific and use a network-specific Pyth policy ID.

Reference: https://developers.cardano.org/docs/build/integrate/oracles/pyth/

Pyth's feed-ID documentation describes a Symbology & Reference Data API that returns feed catalog metadata such as symbol, feed ID, exponent and channel information. This is a discovery/metadata surface; the documentation does not establish that this API is the governance authority for an application's allowed-source policy.

Reference: https://docs.pyth.network/pro/price-feed-ids

Pyth's price-feed API documentation describes price, confidence, exponent and publish time. Freshness acceptance remains caller-dependent in the documented consumer interface; a feed ID or a successful lookup is not by itself an IMMORTAL policy decision.

Reference: https://api-reference.pyth.network/price-feeds/evm/getPriceNoOlderThan

### Result for the IMMORTAL authority gate

Pyth is a concrete candidate for **source-specific observation authentication** where the relevant Cardano deployment, signed update format, feed identity, verifier, and resource fit are established. It is not established by these documents as a canonical external registry that governs IMMORTAL's `sourceId + feedId + policyVersion` admission/revocation tuples.

In particular, a signed Pyth update can authenticate a price observation under Pyth's rules without deciding whether IMMORTAL has approved that feed, which policy version applies, or whether IMMORTAL has revoked it. The public feed catalog is not a substitute for an independently verified current IMMORTAL registry head.

**Classification:** useful source-authentication candidate; does not close registry update authority/currentness gate.

## 3. Candidate B — Charli3

Charli3's public documentation describes a decentralized oracle network and separate integration paths for on-chain feeds, data APIs, and partner-chain deployments.

Reference: https://docs.charli3.io/

This establishes that Charli3 is a relevant Cardano oracle provider to investigate for source observations. The reviewed public documentation does not, by itself, establish a protocol-level, independently verifiable current registry whose admission and revocation decisions are authoritative for IMMORTAL's exact source/feed/policy tuples.

A provider's internal source selection, stake/reputation model, API catalog, or published quote should not be silently promoted into IMMORTAL's source-admission authority. A more specific contract/state object and proof path would be required to qualify this candidate.

**Classification:** relevant observation-provider candidate; IMMORTAL registry authority not established by the reviewed evidence.

## 4. Candidate C — Pyth or Charli3 catalog as registry authority

Neither the fact that a catalog is public nor the fact that it is served over HTTPS proves:
- who may change the catalog;
- which update is canonical and current;
- how deactivation/revocation is represented;
- whether changes can be replayed or rolled back;
- whether the external catalog is intended to govern IMMORTAL's policy;
- whether the exact IMMORTAL tuple and policy version are bound by proof.

The external provider can be the authority for its own feed format or signed observation protocol while IMMORTAL separately governs which feeds it accepts. That split is architecturally valid and does not require pretending that the provider owns IMMORTAL's allowlist.

## 5. Consequence: separate two registries/concepts

Keep these concepts distinct:

1. **Provider feed catalogue / observation verifier:** identifies a provider feed and verifies source-specific update evidence.
2. **IMMORTAL source-admission registry:** identifies the exact provider/feed/pair/direction/policy tuples IMMORTAL accepts, and records activation/revocation/currentness under an explicit authorization predicate.

A future implementation may use the first to verify observations and a separately governed, ledger-verifiable mechanism for the second. The second cannot be inferred from the first.

This also avoids a false requirement that the oracle vendor must govern IMMORTAL's policy. Source authentication and protocol authorization can compose without being the same authority.

## 6. Remaining evidence required before selecting a candidate

For a concrete candidate, capture reproducible evidence for:
1. exact network deployment and verifier artifact;
2. signed observation format and verification predicate;
3. feed identity, asset pair/direction, exponent/units and timestamp semantics;
4. provider key/authority rotation and revocation, where relevant;
5. exact contract/state object, if claimed as an external registry;
6. canonical-currentness and anti-rollback proof, including after restart;
7. an explicit authorization rule for IMMORTAL feed activation/revocation, or a clearly separate IMMORTAL registry authority;
8. negative vectors for wrong feed, wrong pair/direction, stale data, revoked tuple, replay and unavailable proof;
9. Cardano transaction size, validator size and execution budget for the actual verification path;
10. independent verification that the exact accepted transaction uses the authenticated observation.

The current repository's Pyth/USDM decision remains separate: Option B (verify USD/USDM separately) was selected, but no USD/USDM source is thereby approved. This audit does not qualify ADA/USD, USD/USDM, PRE, NIGHT or any other feed for production valuation.

## 7. Decision

**No external provider or catalog is approved as IMMORTAL's source-admission registry by this audit.** Pyth remains a plausible observation-authentication candidate for a separate technical qualification pass; Charli3 remains another candidate. Neither closes the source-update authorization predicate.

The next productive step is to qualify the *observation verifier* independently from the *IMMORTAL admission authority*, then evaluate whether a ledger-verifiable IMMORTAL registry can bind the accepted tuples without a hidden privileged updater. Do not create a fixed-admin registry, quorum, challenge window, source allowlist, or aggregation threshold merely to close the gap.

## 8. Non-regression

- Read-only research/documentation only.
- No provider/feed/source is activated or approved for IMMORTAL.
- No signer set, quorum, freshness/divergence threshold, aggregation rule, fallback, or USD/USDM conversion is selected.
- No changes to Oracle State, economic consumers, the universal kernel, V3, Reveal, EEV, Issue Admission, or Materios.
- No transaction signed, submitted, minted, or deployed; no new branch created.


## 9. Exact repository follow-up — Pyth observation verifier (2026-10-29)

Read-only inspection was repeated against the existing `work/immortal-green-closure` branch, not the default branch. This is a source-boundary check; no new probe, deployment, or ledger action was performed.

| Path | Current blob SHA | What the source establishes | What it does not establish |
|---|---|---|---|
| `scripts/testPythSignedUpdatePreprod.mts` | `0a2c62dab3296b7209bf9812f251254069ee082e` | Uses the pinned Pyth Pro Preprod policy guard, resolves the Pyth State via the Pyth SDK/Koios, fetches a genuine signed ADA/USD update, and records its digest. Default path returns `PREPARED_NOT_SUBMITTED` before loading a wallet or building/signing/submitting a transaction. | No confirmed ledger verification; no source liveness/truth; no USDM conversion; no IMMORTAL registry admission; no MintPolicy binding. |
| `.github/workflows/pyth-native-ledger-probe.yml` | `5c0a4264ab48878a54b21f18a1188e4126a3a37d` | Manual `workflow_dispatch`; `submit_preprod` defaults to false; uses repository secrets for Lazer access and, only for submission, a dedicated Preprod wallet and Blockfrost. | This workflow has not been dispatched in this review. A successful source review is not a run result. |
| `scripts/pythPreprodConfig.mts` | `5458fec9cc0dcd1762c4acef68d4cce74215fddf` | Fails closed unless the policy ID matches the documented Pyth Pro Cardano Preprod deployment. | Deployment identity does not prove a live state UTxO, accepted signature, or feed approval. |
| `poc/aiken-pyth-ada-usd/lib/immortal/ada_usd_probe.ak` | `9f314ddcde19fb7a795dc282bb7a076791a685a9` | Isolated consumer selects exactly one feed ID 16 (ADA/USD), preserves raw price/exponent, and checks both timestamps against the transaction validity upper bound. | It is an isolated probe, not the production oracle path; its one-hour bound is probe behavior, not a new policy decision. |
| `plutus/PythQuoteCarrierBinding.hs` | `669b99a0e4564504012bda8402b706d0ae7a9a9b` | Checks carrier topology/continuity and extracts a raw quote tuple; documentation explicitly delegates signature verification to the same-transaction Pyth consumer. | Does not independently authenticate the Pyth update and is not wired into production MintPolicy. |
| `plutus/MintPolicy.hs` | `0d59fc05b4c11873984fffd10014bd46d8470509` | The current inspected source retains the existing Treasury valuation call path through `Economic.totalUsdmValue`. | Does not consume the Pyth quote carrier or candidate conversion. |

### Qualification result

The repository already has the isolated observation-authentication probe and a safe preparation-only path. Do **not** create another parser, quote carrier, synthetic conversion test, or duplicate workflow to make progress. The next distinct evidence gate is an explicitly dispatched, preparation-only run of the existing manual workflow, bound to an exact branch commit, producing `PREPARED_NOT_SUBMITTED` evidence with the Pyth State identity, withdrawal-script hash, payload byte length and digest. That run needs the configured Pyth Lazer credential; this review has neither accessed nor emitted secrets.

A preparation-only artifact would establish successful resolution/fetch for that run only. It would still not prove native-ledger signature acceptance/rejection, feed liveness/truth, IMMORTAL source admission, USD/USDM denomination, or production MintPolicy binding. The `submit_preprod=true` path is a separate wallet-funded transaction action and is not authorized or performed by this audit.

**Operational limitation:** the connected GitHub actions available to this review expose repository/file inspection and workflow-run inspection/rerun functions, but no workflow-dispatch creation action. Therefore the next step cannot honestly be reported as executed from this interface. An authorized operator must manually dispatch the existing workflow with `submit_preprod=false`; no new branch or workflow is needed.

### Non-regression

- No new branch; only the existing `work/immortal-green-closure` branch is in scope.
- No workflow dispatch, wallet access, signature, transaction, deployment, or on-chain state change.
- No provider/feed approved for IMMORTAL, no source registry authority selected, and no freshness/aggregation/quorum/fallback policy invented.
- No USD/USDM parity or conversion assumed; feed 16 remains ADA/USD.
- No change to Oracle State, `MintPolicy`, economic consumers, V3, Reveal, EEV, Issue Admission, universal-kernel semantics, or Materios.
