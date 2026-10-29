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
