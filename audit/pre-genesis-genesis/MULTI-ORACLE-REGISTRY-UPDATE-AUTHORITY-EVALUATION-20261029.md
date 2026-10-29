# Multi-Oracle Registry Update-Authority Evaluation — 2026-10-29

Status: **DECISION GATE / NON-NORMATIVE / NO IMPLEMENTATION AUTHORIZED**
Branch: `work/immortal-green-closure`
Scope: adapter-level registry administration and currentness only.

## Executive conclusion

A dedicated Cardano registry singleton can make the *state transition* and current head ledger-verifiable. It does not answer who is authorized to activate a source, change a feed binding, or revoke/reactivate a tuple. That is a separate authority decision and cannot be inferred from the existence of a singleton token, a validator, or the existing Oracle State publisher.

No repository evidence reviewed here establishes an already-approved permissionless source-administration rule, signer set, quorum, governance process, or proof format for this new registry. Therefore none is selected in this document.

**Decision status: OPEN.** Do not implement, mint, deploy, or wire consumers until the authority rule and its proof are explicitly selected.

## Findings from reusable repository surfaces

1. `docs/COORDINATION/GENESIS-CARRIER-SINGLETON-AUTHORITY-v0.1.md` describes a one-shot token identity and a validator-constrained continuing state. This is a reusable *pattern*, not authorization to reuse the Genesis carrier or its identity for the oracle registry.
2. `audit/preprod-issue/V3-LIVE-STATE-CARRIER-GAP.md` documents a separate V3 state carrier and its singleton/version constraints. Its economic state and lifecycle must remain separate from the oracle registry.
3. `docs/archive/B1-B3_evidence/beacon-canonicality-spec.md` explicitly separates an untrusted evidence-fetching adapter from independent finality/storage-proof verification. The same separation applies here: fetching or normalizing a registry is not proving its authority/currentness.
4. The current Oracle State bootstrap and liveness observation use deployment-wallet authority, while the observation pipeline explicitly does not prove external source truth. That path is not suitable to silently inherit as the new registry's authority.

These surfaces establish implementation patterns and boundaries, not an approved registry governance rule.

## Authority models compared

| Model | What it can establish | Trust/authority that remains | Status |
|---|---|---|---|
| A. Ledger singleton + validator, updates authorized by a fixed key | Unique canonical state, exact successor transition, monotonic sequence, immutable state digest binding | Whoever controls the update key can alter active sources/revocations; key recovery/rotation is governance | **Not permissionless; not approved** |
| B. Ledger singleton + threshold/multisig authorization | Same state-transition properties, plus a threshold policy over updates | Signer membership, threshold, rotation, availability, compromise and dispute rules must be selected | **No signer set/threshold approved** |
| C. Ledger singleton + verifiable proof from an external canonical registry | Can make source-set changes depend on an independently verifiable external-state claim | Requires an identified external protocol, proof format, canonicality/finality verifier, and mapping from its rules to activation/revocation | **Preferred to investigate for permissionless updates, feasibility unproven** |
| D. Permissionless proposals with delayed challenge or dispute window | Can reduce reliance on a single administrator if challenge outcomes are objectively verifiable | Requires a defined challenge predicate, deadline, bond/incentives, resolution mechanism, and censorship/DoS analysis | **Not specified; do not invent parameters** |
| E. Signed attestation/currentness service with durable anti-rollback | Practical off-chain integration and a durable checkpoint if independently operated correctly | Explicit operator/key trust, availability, persistence, key rotation and revocation trust | **Fallback only; no service/key designated** |

A one-shot mint policy is useful for proving uniqueness of the state identity. It does **not** make subsequent state updates permissionless. Likewise, a validator that enforces `sequence' = sequence + 1` proves transition shape, not whether the proposed source-set change is legitimate.

## Required separation of predicates

The eventual design must not conflate these claims:

1. **State identity:** this is the one registry state object created under the expected policy.
2. **Transition validity:** the consumed state has exactly one valid successor, with monotonic sequence and digest/version consistency.
3. **Update authorization:** the change to source/feed/policy activation or revocation satisfies an explicitly approved authority rule.
4. **Currentness:** the referenced state is the canonical current head, not an old but well-formed state.
5. **Observation authenticity:** the external observation and its source/feed binding are independently authenticated.
6. **Protocol acceptance:** the relevant adapter/consumer is allowed to use the observation under its own already-approved policy.

Passing one predicate must not be treated as proof of the others.

## Minimum specification required before implementation

An authority decision must define, without relying on implicit defaults:

- who/what may propose an update and what evidence authorizes it;
- how source addition, feed replacement, deactivation, revocation, and reactivation differ;
- whether reactivation is forbidden under the same policy version or requires a new policy/version;
- the exact state transition and canonical encoding/digest;
- the source of canonical currentness and how stale/replayed state is rejected across restarts;
- signer/key or proof-verifier lifecycle, rotation and emergency response, where applicable;
- failure behavior when authority evidence is unavailable, contradictory or malformed;
- reproducible positive and negative test vectors, including unauthorized update, replay, rollback, equivocation and attempted revocation removal.

This list is a specification gate, not a proposed governance policy. It intentionally supplies no keys, signers, quorum, delay, bond, source, or threshold.

## Recommended next step

Continue with a **read-only feasibility proof** for Model C: identify whether any concrete external registry already governs the intended source/feed set and whether its canonical state plus update authority can be independently proven on Cardano. Do not presume Pyth, Orcfax, an indexer, or any currently observed source list is the registry authority merely because it exists in repository notes.

If no such external state/proof exists, return to the user for an explicit authority choice before implementing Model A, B, D or E. A fixed administrator key must be described honestly as privileged, not permissionless.

## Non-regression and scope

- No code, datum, minting policy, validator, or workflow is changed by this evaluation.
- Do not reuse or modify the existing Oracle State, Genesis carrier, V3 carrier, V3, Reveal, EEV, economic consumers, or Issue Admission.
- Do not choose or activate any source, aggregation/quorum rule, freshness/confidence threshold, or USD/USDM conversion.
- No transaction signing, submission, minting, deployment, or production consumer wiring is authorized.
- The IMMORTAL economic kernel remains independent of this adapter-level authority decision.

## Acceptance gate

The registry-authority gate remains **OPEN** until a specific authority model is explicitly approved, independently verifiable, and covered by ledger-level conformance evidence. The existing 53 multi-oracle unit tests qualify the adapter boundary only; they do not close this authority gate.
