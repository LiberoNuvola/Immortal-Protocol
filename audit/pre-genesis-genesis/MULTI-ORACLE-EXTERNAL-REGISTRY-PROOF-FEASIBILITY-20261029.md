# Multi-Oracle External Registry Proof — Read-Only Feasibility Result

Status: **FEASIBILITY GATE / NON-NORMATIVE / NO IMPLEMENTATION AUTHORIZED**
Date: 2026-10-29
Branch: `work/immortal-green-closure`
Scope: repository-evidence review of authority model C (proof-backed external registry). No external source is selected by this report.

## 1. Question

Can IMMORTAL rely on a concrete existing external registry as the authority for the allowed oracle source/feed set, while independently verifying its canonical current state and update authority, rather than introducing a privileged registry administrator?

## 2. Result

**Not established from the current repository evidence. Model C remains unproven, not rejected.**

The inspected multi-oracle contracts define a source/feed/policy registry shape and require a separately authenticated currentness provider. The authority candidate audit and update-authority evaluation explicitly leave the external registry, trust root, canonicality/finality verifier, and update authorization rule unselected.

Repository searches for concrete Pyth, Charli3, and Minswap oracle registry/source qualification surfaces did not identify an existing external registry that is already designated to govern IMMORTAL's allowed source/feed/policy tuples. This is a bounded repository audit, not proof that no such registry exists elsewhere.

Consequently, there is no grounded external state object, authority policy, proof format, or verifier target from which to construct a real feasibility proof at this stage. Selecting a known oracle provider or its feed catalog by name would not close the gap: a feed catalog is not necessarily an authority registry for IMMORTAL source admission/revocation, and an API response is not proof of canonical current state.

## 3. Relevant existing surfaces and their limits

### 3.1 Multi-oracle registry contracts

- `relayer/multiOracleRegistrySnapshot.js` verifies a signed snapshot against a caller-supplied public key, but does not establish who authorizes that key or prove currentness itself.
- It requires `currentnessProvider.resolveCurrentRegistryState`; a production-authoritative provider has not been identified.
- Its in-process high-water marks reset on restart and are explicitly defense-in-depth, not durable rollback protection.
- `relayer/multiOracleRegistryBoundary.js` requires the provider's verified binding but does not authenticate the provider itself.
- `relayer/multiOracleObservation.js` validates observation structure and binding, not external source truth.

### 3.2 Existing Cardano Oracle State

The existing Oracle State is deployment-wallet configured and its liveness observation explicitly says external source truth is not proven by the datum alone. Its datum and consumer semantics are quote-oriented, not a versioned registry/currentness state machine. It must not be repurposed as the registry authority.

### 3.3 Materios canonicality work

`docs/archive/B1-B3_evidence/beacon-canonicality-spec.md` describes a proof architecture for canonical Materios checkpoints and storage state, with an untrusted evidence-fetch adapter and a future independent Cardano verifier.

That is a useful architectural analogy for separating evidence retrieval from proof verification. It is **not** an existing oracle source registry and does not establish source/feed admission or revocation authority for multi-oracle. No direct reuse is justified without a separate, concrete protocol mapping.

### 3.4 Existing singleton patterns

The Genesis carrier and V3 carrier demonstrate state identity/version patterns in their own domains. They are not oracle registry authorities and must not be reused or modified for this purpose.

## 4. What would count as a successful Model C proof

Before any code is written, a candidate must be named and provide evidence for all of the following:

1. **Authority identity:** the exact protocol or registry that has authority over the relevant source/feed set.
2. **Admission semantics:** how that authority decides additions, feed identity/direction, deactivation, revocation, and reactivation.
3. **Canonical current state:** a precise state object or checkpoint and a way to prove that it is the canonical current head, not a stale API/indexer response.
4. **Update authorization:** a verifiable proof of the protocol's actual authorization rules, including key/authority rotation where applicable.
5. **Proof verifier feasibility:** a reproducible proof vector and a credible independent verification path for the chosen deployment boundary.
6. **Rollback/replay resistance:** evidence that old checkpoints and removed revocations cannot be silently accepted after restart.
7. **Failure semantics:** explicit fail-closed behavior when the proof, authority history, or currentness source is unavailable or ambiguous.
8. **Exact tuple binding:** proof binding to IMMORTAL's `sourceId + feedId + policyVersion`, without assuming that an external provider's identifiers automatically match IMMORTAL's semantics.

A valid signed document or a reachable API is insufficient unless the signer/authority and canonical-currentness claims are independently verified.

## 5. Decision matrix after this audit

| Candidate | Finding | Next action |
|---|---|---|
| Existing external oracle registry | No designated candidate or proof path established in the repository evidence reviewed | Do not select a provider by assumption; require a concrete candidate and evidence |
| Dedicated Cardano registry singleton | Could establish ledger-visible state transitions, but update authorization remains unresolved | Keep as a separate candidate; do not implement/deploy yet |
| Materios proof architecture | Demonstrates a useful proof-boundary pattern, not oracle-registry authority | Use as an architectural reference only, not as a drop-in source |
| Signed currentness service | Interface-compatible but introduces operator/key trust unless independently anchored | Explicit fallback only, not permissionless by default |

## 6. Conclusion and gate

The trust-minimizing search has not yet produced an implementable Model C target. The next dependency is not more liveness code; it is an explicit, evidence-backed choice of what governs oracle source/feed admission and revocation.

If a concrete external registry is later identified, run the eight proof checks above against that exact protocol. If none qualifies, return to the authority decision gate and compare a new ledger-bound registry with explicitly governed or trusted-service alternatives. Do not call any of these alternatives permissionless unless the source-admission and revocation authority is itself independently verifiable.

## 7. Non-regression

- Documentation-only result; no production code or workflow changed.
- No source/feed activated or trusted by implication.
- No signer, key, quorum, aggregation rule, freshness/confidence threshold, fallback, or USD/USDM conversion selected.
- No changes to the universal IMMORTAL kernel, Oracle State, V3, Reveal, EEV, Issue Admission, or Materios.
- No transaction signed, submitted, minted, or deployed.
- No new branch created.
