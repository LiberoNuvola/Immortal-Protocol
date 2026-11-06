# Cardano Provider Qualification and Evidence Interoperability v0.1

**Status:** non-normative Adapter infrastructure contract  
**Scope:** provider identity, source provenance, collection completeness, observation quality and purpose-scoped provider-evidence qualification.

This document does not qualify any live provider, certify any endpoint, or establish economic or protocol authority. A structurally valid profile or observation is not proof that its operator declarations are truthful.

## 1. Boundary and intent

The Cardano Adapter is the translation, observation and realization layer between chain-neutral IMMORTAL semantics and Cardano execution. This contract makes provider-derived observations traceable and classifiable before another subsystem consumes them.

It does not:
- make a provider, endpoint, API response or indexer an authority;
- make an observation economically admissible or sufficient for PRE-RICH EEV, Oracle, Issue admission, ProtectedCapital or any other purpose;
- replace Cardano ledger validation, Plutus evaluation, transaction witness verification or an adopted finality rule;
- change EconomicObservation, transition evidence, Direct-USDM observation, execution, application policy or protocol semantics.

A ProviderQualificationDecision has the fixed provider-evidence-only scope and is bound to one named purposeId and purposeVersion. A qualification for one purpose cannot be reused as a qualification for another.

## 2. Static provider profile

CardanoProviderProfile identifies a configured service and its declared operator:
- profileId: stable profile identity/version selected by the integrator;
- serviceId and operatorId: provider service and service operator;
- mode: hosted, direct, community or composite;
- endpointUrl, apiVersion and clientVersion;
- network.networkId, networkMagic, and optional Cardano genesis hash;
- an exhaustive declaration for every v0.1 capability as supported or unsupported;
- the actual upstream/operator/endpoint/failure-domain mapping for each supported capability.

The v0.1 capability vocabulary is:

| Capability | Meaning |
|---|---|
| address-utxos | UTxO collection for an address |
| utxo-by-reference | Exact transaction-hash/output-index lookup |
| datum-by-hash | Datum retrieval by hash |
| asset-addresses | Addresses holding a requested asset |
| transaction-by-hash | Transaction lookup |
| chain-tip | Node/provider chain-tip observation |
| protocol-parameters | Protocol parameter retrieval |
| transaction-submit | Submission of a caller-prepared transaction |
| transaction-status | Transaction inclusion/status lookup |
| delegation-account | Delegation/account/reward observation |

A capability must never be omitted to imply support. If unsupported, the profile supplies a reason and no upstream route. Missing capability information is an invalid profile, not an optimistic default.

endpointUrl is an endpoint locator, not an authentication container. v0.1 rejects credentials, query parameters and fragments; HTTPS is required except for loopback development endpoints. Provider keys, bearer tokens, project IDs, signed request headers and raw cursor values do not belong in profile or observation records.

### 2.1 Composite providers and source identity

A composite service must declare which upstream actually serves each capability. For example, a service may read UTxOs from a Koios indexer and submit through an Ogmios node. The profile must not present both operations as if they came from one undifferentiated source.

Each capabilitySources entry records:
- upstreamId: stable identity for the actual upstream;
- operatorId: upstream operator;
- endpointId: stable, non-secret endpoint label;
- independenceGroup: operator-declared canonical upstream/failure-domain identity.

Each observation binds to the exact source entry used for that request. A fallback is a new, explicitly recorded source observation; it is not silent failover or source promotion.

areCardanoProviderSourcesIndependent is deliberately conservative: two sources are not counted as independent when they share an upstream ID, operator ID or declared independence group. Different hostnames, API keys, URLs or DNS aliases are not evidence of independent infrastructure. These identifiers are declarations and require external verification; the helper does not prove physical or corporate independence.

A non-composite profile has one upstream/operator/failure-domain identity across its capabilities. A composite profile identifies at least two distinct upstream IDs.

## 3. Per-request observation

CardanoProviderObservation records one operation against one profile and one capability. It binds:
- profile and observation IDs;
- capability;
- request method, relative route, digest of exact query/parameter material and a human-readable scope;
- actual upstream/operator/endpoint/failure-domain identity selected for that operation;
- observation start and completion timestamps;
- SHA-256 digest of the raw response bytes, when a response exists;
- normalized result class and collection coverage;
- chain tip before and after, plus explicit chain-change classification;
- an indexer watermark kept separate from the chain tip;
- failure kind, HTTP status where available, and retry-safety classification.

The request route excludes query strings and fragments. Exact query/parameter material is represented by parametersDigest; credentials and secret-bearing request data must be excluded from the persisted record. The digest binds the captured request evidence but does not reveal or validate the original secret-bearing request.

### 3.1 Result classes are not interchangeable

| Result class | Meaning |
|---|---|
| complete | A non-empty response whose declared collection reached its terminal condition |
| empty | A successful, complete response with exactly zero items |
| partial | Some result data exists but the requested collection/range is not complete |
| unavailable | Timeout, rate limit, transport failure or provider error prevented a response |
| malformed | A response was received but failed the response contract |
| stale | The observation is known stale by watermark or explicit stale-response classification |
| unsupported | The profile explicitly declares the capability unsupported |
| disagreement | Evidence from provider sources conflicts and remains unresolved |

An unavailable, malformed or unsupported response must not be normalized to empty. In particular:
- malformed/non-array Koios UTxO payloads are not successful empty UTxO sets;
- absent protocol parameters are not numeric zero defaults;
- synthetic delegation values such as poolId: null and rewards: 0 are not observed account state;
- missing pages/cursors are not complete collections.

failure.retrySafety is explicit (safe, unsafe or unknown). A consumer must not infer that replaying a request is safe merely because the transport returned an error.

### 3.2 Collection coverage

Coverage has an explicit mode:
- none: one atomic/non-paginated segment;
- page: contiguous page numbers and an explicit provider terminal condition;
- cursor: opaque cursor tokens represented only by their digests, linked page-to-page, with a null final cursor only when the provider reports end-of-results;
- range: ordered half-open range partitions that are contiguous and bounded by the requested interval.

Each segment carries an item count, normalized-item digest and raw-response digest. The aggregate itemCount must equal the sum of segment counts. itemsDigest is a deterministic digest-of-digests over the ordered segment item digests; coverageDigest commits to the complete coverage manifest. These are manifest-integrity checks, not proof that an upstream returned every real ledger item. Retain the referenced raw responses and the versioned normalization process in the evidence store.

A paginated response is complete only when its terminal condition is reached. A gap, repeated/cyclic cursor, count mismatch, range gap or unobserved terminal condition must remain partial or invalid. A request that returns no data because it is unavailable/unsupported is represented with no segments and not-reached, never as an empty successful collection.

### 3.3 Chain tip is not indexer freshness

chainTipBefore and chainTipAfter record the node/provider tip around a collection. A changed hash at the same height requires reorg; a decreasing slot or block number requires rollback. Where before/after tips are absent, chainChange is unknown.

indexerWatermark is a separate field (slot, block or timestamp) and includes its own observation time and declared freshness (current, stale, unknown). A stable node tip does not demonstrate that an indexer has indexed through that tip. Likewise, an indexer watermark does not establish canonical ledger truth or economic qualification.

### 3.4 Transaction inclusion is not protocol finality

The optional transaction lifecycle record may report unknown, mempool, included or confirmed and an observed confirmation count. In v0.1, protocolFinality is fixed to not-assessed. No number of provider-reported confirmations is promoted to protocol finality without a separately adopted, purpose-specific rule.

## 4. Purpose-scoped provider qualification

ProviderQualificationDecision records:
- profile ID;
- fixed evidence-only scope;
- purpose ID and purpose version;
- ruleset version;
- status (qualified, not-qualified, insufficient-evidence, disputed or expired);
- capability set;
- references and SHA-256 digests for supporting evidence;
- decision actor/process and timestamp;
- optional validity end and explicit limitations.

assertProviderQualificationForPurpose checks the exact profile, purpose and purpose version and requires status qualified. It does not authorize use of the data, establish source authority, prove currentness, or satisfy an economic/admission gate. A caller must perform its own purpose-specific validation and authority checks.

A new purpose, provider configuration, network, API version, capability set or ruleset requires a separately bound qualification decision. Provider reachability, HTTP 200, response shape, a stable tip, or approval for another purpose cannot auto-promote a source.

## 5. Operational guidance for Koios/Ogmios-style composites

The current audit integration uses distinct interfaces for Koios reads and Ogmios submission. The contract is intended to preserve that distinction and expose the actual upstream for each operation. It does not patch or certify the existing provider implementation.

Before any consumer treats an observation as complete, verify the concrete collector:
1. validates response shape before assigning an empty collection;
2. records every page/cursor and proves terminal coverage for the requested scope;
3. does not replace absent protocol parameters with zero;
4. treats synthetic/default delegation fields as unsupported or unresolved;
5. binds the exact source selected for each capability and each request;
6. keeps inclusion/confirmation separate from protocol finality;
7. preserves submit response evidence and binds the returned transaction reference to the submitted request.

No provider failover, retry or disagreement resolution rule is defined here. Those behaviors must be explicit in the consuming purpose profile and leave a provenance trail.

## 6. Validation API and test command

Implementation: Adapter/CARDANO/observation/CardanoProviderProfile.ts

- validateCardanoProviderProfile(profile)
- validateCardanoProviderObservation(observation, profile)
- validateProviderQualificationDecision(decision)
- assertProviderQualificationForPurpose(decision, expected)
- areCardanoProviderSourcesIndependent(left, right)
- computeCardanoProviderCoverageDigests(coverage)

Focused fixture command:

    npx vitest run Adapter/CARDANO/observation/CardanoProviderProfile.test.ts

The Cardano Adapter Sale Conformance workflow invokes this test as a named step. Passing fixtures establish validator behavior for the encoded contract only. They do not establish a live provider's completeness, security, availability, independence, freshness or purpose qualification.

## 7. Explicit non-claims

This v0.1 contract:
- does not contain provider credentials or make network calls;
- does not select or endorse a provider;
- does not declare Koios, Ogmios, Blockfrost or any other service qualified;
- does not change PRE-RICH Direct-USDM derivation or B1 PrizePool identity;
- does not confer EEV, Oracle, Issue admission, economic or protocol authority;
- does not replace existing observation/evidence records;
- does not define protocol finality;
- does not change IMMORTAL economics, V3, Reveal, MintPolicy, PrizeValidator or BeaconRegistry semantics.

A profile or observation that passes local validation is a well-formed evidence record, not an authoritative statement about Cardano state.
