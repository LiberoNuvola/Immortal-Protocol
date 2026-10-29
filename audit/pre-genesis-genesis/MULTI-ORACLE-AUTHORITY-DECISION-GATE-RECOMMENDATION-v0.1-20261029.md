# Multi-Oracle Authority Decision Gate — Recommendation v0.1

Status: **RECOMMENDATION FOR REVIEW / NON-NORMATIVE / NO IMPLEMENTATION AUTHORIZED**
Date: 2026-10-29
Branch: `work/immortal-green-closure`

## 1. Decision required

The registry snapshot verifier and liveness boundary are implemented as adapter-level components, but no production-authoritative source/feed admission and currentness mechanism has been established. The next decision must choose the authority model before any implementation or consumer wiring.

This note turns the existing candidate evaluation into a concrete recommendation while preserving the user's trust-minimizing design preference. It does not silently approve a signer, quorum, source, or privileged service.

## 2. Recommendation

**Adopt proof-backed, ledger-verifiable registry state as the target architecture, but keep the authority gate OPEN until the update-authorization predicate can be independently verified.**

Target separation:

1. A dedicated registry state on Cardano provides a unique, versioned, ledger-visible current head and deterministic transition rules.
2. Each source/feed/policy activation, replacement, deactivation, revocation, or reactivation must carry evidence satisfying an explicit authorization predicate.
3. A liveness observer checks currentness proof, registry binding, source observation integrity, availability, and freshness as distinct dimensions.
4. Consumers fail closed unless the required registry state and observation predicates pass under an already approved policy.

The on-chain state carrier is a target for current-head and transition integrity, **not** a claim that source-admission authority is permissionless. The authorization predicate is a separate proof obligation. If it cannot be defined without a hidden privileged party, the system must say so rather than label it trustless.

## 3. Why not implement a simple open proposal registry now?

Letting anyone submit a proposed source is permissionless submission, not permissionless acceptance.

A deterministic validator can check well-formedness, identifiers, sequence increments, uniqueness, and proof validity. It cannot infer that a proposed oracle is honest or authorized unless there is an objectively verifiable rule/evidence source for that claim. An unchallenged proposal, elapsed timer, bond, or majority vote does not establish price-source truth by itself. Those mechanisms may govern process, but each introduces additional assumptions and needs an explicit design.

Therefore do not implement a challenge window, bond, vote, signer threshold, or fixed admin key merely to close the gap. Such a mechanism would encode a new authority policy without a decision.

## 4. Candidate ordering and exit conditions

| Priority | Candidate | Required exit condition | Current decision |
|---|---|---|---|
| 1 | External proof-backed authority, if a concrete candidate exists | Exact source/feed admission and revocation state, canonical currentness, and update authorization independently verifiable | No candidate established; keep investigating only when concrete evidence is available |
| 2 | Dedicated Cardano registry state with proof-gated updates | On-chain state transitions and update-authorization predicate both verified; no hidden admin authority | Target architecture, not approved for implementation |
| 3 | Explicit governed attestation / threshold authority | Named governance rules, signer/threshold, rotation/revocation, failure and compromise semantics approved | Not selected |
| 4 | Trusted currentness service | Named operator/key, durable anti-rollback, operational assumptions and fallback status explicitly approved | Last-resort fallback only; not selected |

The ordering is about minimizing implicit trust, not a claim that option 1 or 2 is already feasible.

## 5. Minimum predicates for a future Cardano registry

The implementation specification must independently define and test:

- **Identity:** exact registry singleton asset and script/address binding.
- **Transition:** exactly one prior state and one successor; singleton conserved; canonical schema; sequence strictly increases; digest/version bind the exact payload.
- **Authorization:** a proof/predicate authorizes the specific change to the source/feed/policy tuple.
- **Currentness:** consumers bind to the canonical current state; stale or spent prior states cannot be accepted as current.
- **Revocation:** effective revocations cannot disappear by replay, rollback, or same-version equivocation; reactivation requires an explicitly defined transition.
- **Observation binding:** the observed source/feed/pair/direction/timestamp-unit matches the registry entry.
- **Failure:** missing, malformed, ambiguous, stale, revoked, contradictory, or unverifiable evidence rejects.
- **Resource fit:** measure datum, redeemer, reference-input, transaction CBOR, script size and execution budget before production wiring.

No field layout, digest encoding, authority predicate, signer set, quorum, source list, or threshold is frozen by this note.

## 6. Conformance plan once the authority predicate is approved

The first test harness should be isolated from existing Oracle State and economic consumers. It should cover at least:

1. valid authorized update advances sequence and current digest;
2. unauthorized activation/revocation fails;
3. missing or invalid authority proof fails;
4. stale reference to a spent prior state fails as current;
5. same sequence with a different digest fails;
6. rollback across restart is rejected by the authoritative mechanism, not only an in-memory map;
7. revocation cannot be removed under the same policy version without a valid reactivation transition;
8. duplicate tuple, wrong policy version, malformed datum, missing singleton, and multiple singleton candidates fail;
9. observation with mismatched source/feed/asset pair/direction/timestamp unit fails;
10. currentness provider unavailable or ambiguous fails closed;
11. all positive and negative vectors run against ledger-level or equivalent authoritative-state evidence, not just JavaScript mocks;
12. transaction and execution budgets are measured against Cardano's constraints.

Existing 53 multi-oracle unit tests remain useful structural/conformance tests, but do not satisfy these authority or ledger-level criteria.

## 7. Scope protections

- No changes to existing Oracle State datum, publisher, liveness semantics, or consumers.
- No changes to V3, Reveal, EEV, Issue Admission, economic constants, or the universal IMMORTAL kernel.
- No source/feed activation, aggregation/quorum policy, freshness/confidence threshold, fallback, or USD/USDM conversion.
- No new branch, transaction signing/submission, minting, deployment, or production consumer wiring.
- Materios remains out of scope for this oracle-authority gate; its proof architecture is only an analogy unless a specific protocol mapping is later established.

## 8. Current recommendation in one sentence

Build neither a fixed-key registry nor a nominally permissionless proposal system yet; first define and prove the source-update authorization predicate. Then bind it to a dedicated, versioned Cardano registry state and expose its verified currentness as a health dimension in the shared multi-oracle liveness report.
