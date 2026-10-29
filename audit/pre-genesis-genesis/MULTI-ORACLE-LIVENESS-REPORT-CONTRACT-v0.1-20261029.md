# Multi-Oracle Liveness Report Contract v0.1

Status: **PROPOSED OBSERVATIONAL CONTRACT — NON-NORMATIVE / NO PRODUCTION WIRING AUTHORIZED**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Scope: adapter/observer boundary only.

## 1. Purpose and safety boundary

Define a versioned report that can describe registry currentness, endpoint availability, observation integrity, measured freshness, and optional cross-source divergence without collapsing them into one ambiguous `healthy` flag.

This report is observational evidence. It is not a registry, source-admission authority, cryptographic verifier, aggregator, price selector, fallback mechanism, or economic decision. Producing a report must never activate a source, authorize settlement, choose a replacement feed, or override a consumer's already-approved acceptance policy.

The authority decision gate remains OPEN. No currentness provider, source/feed tuple, quorum, aggregation rule, freshness limit, divergence limit, confidence rule, fallback, or USD/USDM conversion is selected here.

## 2. Design invariants

1. **Keep dimensions separate.** Registry authority/currentness, transport availability, observation integrity, freshness measurement, divergence measurement, and policy acceptance are independent fields.
2. **Unknown is not healthy.** Missing, unverified, unavailable, malformed, contradictory, or ambiguous evidence is represented explicitly and must not be coerced to success.
3. **Evidence is not authority.** A liveness observer can report what it verified or measured; it cannot create the authorization predicate for a registry update.
4. **No silent fallback.** Failure of one source does not select another source or an older observation automatically.
5. **No invented thresholds.** Ages, differences, and counts may be measured, but this contract sets no pass/fail limits for them.
6. **No source truth from transport alone.** HTTP success, a fresh response time, a valid signature over historical data, or an on-chain datum alone does not prove that an external market source is correct.
7. **Kernel isolation.** The report is adapter/observer evidence and must not alter IMMORTAL's universal economic kernel or existing economic consumers.

## 3. Proposed report envelope

The following is a conceptual field contract, not a frozen wire schema:

```json
{
  "schema": "IMMORTAL-MULTI-ORACLE-LIVENESS-V1",
  "reportId": "<observer-generated unique identifier>",
  "observedAt": "<observer timestamp with explicit timezone>",
  "registryBinding": {
    "policyVersion": "<exact policy identifier>",
    "registryVersion": "<exact version>",
    "registrySequence": "<canonical non-negative decimal string>",
    "registryDigest": "<digest>",
    "authorityStatus": "VERIFIED | UNAVAILABLE | STALE | REVOKED | UNVERIFIABLE | AMBIGUOUS",
    "authorityReference": "<evidence reference or null>",
    "checkpointReference": "<evidence reference or null>"
  },
  "sources": [
    {
      "sourceId": "<registry-bound source identity>",
      "feedId": "<registry-bound feed identity>",
      "observationStatus": "NOT_ATTEMPTED | AVAILABLE | UNAVAILABLE | MALFORMED | UNVERIFIED | CONTRADICTORY",
      "integrityStatus": "NOT_CHECKED | VALID | INVALID | UNVERIFIABLE",
      "freshness": {
        "sourceTimestamp": "<raw source timestamp>",
        "timestampUnit": "<explicit unit>",
        "observerReferenceTime": "<explicit time basis>",
        "measuredAge": "<value and unit, or null>",
        "measurementStatus": "MEASURED | FUTURE_TIMESTAMP | MISSING | UNCOMPARABLE"
      }
    }
  ],
  "divergence": {
    "status": "NOT_COMPUTED | COMPUTED | INCOMPARABLE",
    "methodVersion": "<method identifier or null>",
    "measurements": []
  },
  "policyEvaluation": {
    "status": "NOT_EVALUATED | ACCEPTED_BY_EXTERNAL_POLICY | REJECTED_BY_EXTERNAL_POLICY",
    "policyReference": "<approved policy reference or null>"
  }
}
```

Implementations must use strict schema validation and explicit units/types. The illustrative enum labels above are candidate vocabulary only; final serialized enums and required/optional fields require review before code or production use. `reportId`, timestamps and evidence references must not be mistaken for authority proofs.

## 4. Dimension semantics

### 4.1 Registry authority and currentness

Report whether the exact registry head and revocation state were independently verified, and bind the report to the policy version, registry sequence/version/digest, authority reference and checkpoint reference.

- `VERIFIED` is permitted only when the configured verifier has validated the current-state evidence under an explicitly approved trust model.
- `UNAVAILABLE`, `STALE`, `REVOKED`, `UNVERIFIABLE`, and `AMBIGUOUS` are non-success states.
- A provider response that merely asserts `VERIFIED` without an independent verification path is insufficient.
- Currentness cannot be inferred from endpoint liveness, a snapshot signature alone, or a process-local high-water mark.
- This report does not determine who is allowed to activate, revoke, or reactivate a source.

### 4.2 Endpoint and retrieval availability

Record the retrieval attempt/result, provider identity, response metadata, and error class where available. Keep transport reachability separate from content validity. Do not treat an HTTP 200 or successful JSON parse as evidence that the observation is authentic or authorized.

Do not require every source to be reachable at every observation cycle as a protocol rule here; any availability objective belongs to a separately approved operational policy.

### 4.3 Observation integrity and binding

Record whether the observation was checked against the exact active registry tuple, including source ID, feed ID, base/quote assets and direction, timestamp unit, policy version, and applicable normalization version.

Integrity checks may establish structural binding, canonical payload/digest consistency, and source-specific authentication only when an appropriate verifier actually performs those checks. A provenance URL or `authenticationReference` by itself is not authentication.

Structural mismatch, malformed payload, invalid digest/signature, wrong asset direction, or missing required evidence must be reported as failure/unknown—not repaired by guessing or substituting another feed.

### 4.4 Freshness as measurement

Record the source timestamp, its declared unit, the reference time used for comparison, and the measured age with units. Identify the time basis (for example, an independently verified ledger time or a named observer clock) and its evidence reference.

A negative age should be represented as a future/incomparable timestamp condition, not as fresh data. Missing or incomparable clocks remain unknown. This contract does not choose a maximum age or turn an age measurement into acceptance automatically.

The existing Preprod Oracle State observer demonstrates why this separation matters: it can inspect the exact live singleton and classify timestamp age while explicitly recording that external price-source truth is not proven by the datum alone. That legacy singleton is not promoted to a multi-oracle registry by this report.

### 4.5 Divergence as optional measurement

A report may carry raw, reproducible divergence measurements only when the observations are comparable under an identified method/version and compatible units, pair direction, and time basis. Otherwise set the divergence status to not-computed/incomparable and explain why.

No outlier rule, deviation threshold, quorum, aggregation formula, weighting, confidence score, or source-preference rule is defined here. Divergence is evidence for a separately approved policy, not an implicit instruction to discard a source or choose a winner.

### 4.6 Policy evaluation is downstream

If an independently approved consumer policy is evaluated, record its immutable reference and result separately from observations. The liveness report itself must not invent or mutate that policy.

A report with healthy transport but unverifiable registry authority is not accepted merely because its endpoints respond. Likewise, a source that is unavailable cannot be silently replaced by a different source unless a separately approved policy explicitly authorizes that behavior.

## 5. Aggregation of report status

Do not define a single global `healthy` boolean in v0.1. Consumers must inspect the dimensions they require and apply their own explicitly approved policy. If a later UI needs a summary, it must be a derived presentation with a documented rule and must preserve the underlying dimension statuses.

No source count or report status alone is proof of quorum, source independence, market truth, solvency, or permission to issue a PRE-RICH ticket.

## 6. Minimum conformance cases

A future implementation should include positive and negative fixtures for:

1. exact registry-head binding and independently verified currentness;
2. missing/unavailable currentness provider;
3. stale checkpoint, revoked registry digest, sequence rollback and same-sequence equivocation;
4. transport success with invalid or unverified observation;
5. transport failure with no substitution of another feed;
6. source/feed/policy mismatch;
7. wrong base/quote direction or timestamp unit;
8. malformed digest, signature or payload;
9. missing timestamp, future timestamp, and incomparable time bases;
10. freshness measurement with no configured threshold and no implicit acceptance;
11. divergence skipped for incompatible pairs/units/time bases;
12. divergence computed without silently becoming an outlier-selection rule;
13. registry/source revocation reported independently of endpoint availability;
14. report schema/version mismatch and unknown enum values fail closed;
15. a downstream policy result remains distinct from raw observation measurements;
16. restart/rollback behavior verified by the authoritative currentness mechanism, not only in-memory state.

Unit tests using fixtures are necessary but not sufficient. Any claim of production authority requires evidence from the actual authority verifier and its current-state source.

## 7. Non-regression and exclusions

- Documentation only: no production code, consumer wiring, source activation, deployment, signing or transaction submission.
- Do not alter existing Oracle State datum, publisher semantics, liveness script behavior, economic consumers, V3, Reveal, EEV, Issue Admission, or canonical economic rules.
- Do not select any source/feed, source authority, signer set, quorum, threshold, aggregation, confidence, fallback, or USD/USDM conversion.
- Do not treat the report as an authority registry or as proof of external price-source truth.
- Do not use Materios as an oracle registry; its proof design remains analogy only unless a concrete mapping is established.

## 8. Exit criteria before implementation

Before converting this proposal into code, review and approve:
1. the exact registry-currentness proof and trust root;
2. the authorization predicate for source/feed activation, replacement, revocation and reactivation;
3. the final report schema, canonical encoding, timestamp units and evidence-reference semantics;
4. which verifier is responsible for each `VERIFIED` result;
5. downstream policy ownership and explicit fail-closed behavior;
6. conformance vectors and authoritative-state test environment.

Until those decisions are evidenced, this contract remains observational and non-normative.
