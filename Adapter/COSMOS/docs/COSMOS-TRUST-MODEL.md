# Cosmos / CosmWasm Adapter — Trust Model

**Role:** normative trust-boundary specification for a future CosmWasm-based Adapter under IMMORTAL.
**Semantic status:** DRAFT / OPEN DECISION. Nothing in this document is canonical. It does not authorize implementation.

## 1. Execution profile
CosmWasm provides expressive stateful contract execution with atomic transaction semantics. The distinctive Cosmos boundary is the possibility of using IBC light-client verification for authenticated remote state/finality.

## 2. Same-chain versus cross-chain
If the ticket/Beacon source and deployment chain are the same chain, the remaining trust surface is that chain's consensus, validator-set security, randomness and governance/upgrade path.

If the source is another chain, an IBC light client can potentially verify authenticated remote consensus/state claims without trusting a named publisher. This is a candidate B3-class boundary for that specific remote-state/finality claim, not an automatic declaration that the whole system is B3. A light client is not a randomness primitive.

## 3. Requirements
### COSMOS-R1 — Relayer non-authority
No economic transition MAY depend on trusting a relayer's statement about remote state. The transition MUST depend on locally verified light-client evidence. Relayer absence may affect liveness but MUST NOT permit an invalid transition.

### COSMOS-R2 — Light-client state transitions
The trust model MUST specify initial trust anchor, consensus-state updates, validator-set evolution, finality/header verification, client upgrades, misbehaviour evidence and expiry/failure behavior where applicable.

### COSMOS-R3 — Materios compatibility
A future Materios→Cosmos construction MUST establish, rather than assume, consensus compatibility, exact proof surface, authority-set transitions, finalized checkpoint binding, ancestry/quorum linkage and required state/storage evidence.

Existing Materios selector and B3 work MUST NOT be reimplemented or weakened to fit Cosmos. The Cosmos adapter MUST NOT modify Materios B3 research solely to facilitate an IBC adapter.

### COSMOS-R4 — Governance and upgrades
Cosmos runtime/parameter upgrades, CosmWasm migrations and light-client upgrades MUST have an explicit authority model. Governance/timelock assumptions must be observable and auditable.

## 4. Randomness
B1-Cosmos may include chain-specific threshold/drand-style randomness where its exact operator/key assumptions are explicit. Otherwise commit-then-future-block with an explicit economic grinding cap may be evaluated as a B1-style candidate.

B3-Cosmos may apply to remote finality/state authenticity through publisher-independent IBC verification. It does not automatically provide B3 randomness.

Finality authenticity, state authenticity and randomness authenticity MUST be tested separately.

## 5. Research gate
Before implementation: complete Materios↔IBC compatibility research; define light-client trust and validator-set transitions; define randomness separately; wire the Reference Adapter corpus; demonstrate execution and adversarial evidence.

## 6. Non-contamination firewall
This document does not alter IMMORTAL economics, EconomicKernel.hs, PRE-RICH, Materios B3 research, or other adapter semantics.