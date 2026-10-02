# Solana Adapter — Trust Model

**Role:** normative trust-boundary specification for a future Solana Adapter under IMMORTAL.
**Semantic status:** DRAFT / OPEN DECISION. Nothing in this document is canonical. It does not authorize implementation.

## 1. Execution profile
Solana programs are expressive enough to enforce rich economic relationships, but the Adapter inherits chain-specific execution constraints that are not part of IMMORTAL's universal economics.

Primary surfaces: bounded compute-unit execution, persistent account/rent-exemption requirements, CPI authority, transaction ordering, and finality.

## 2. Requirements
### SOL-R1 — Bounded compute
Every economically relevant transition MUST have bounded compute cost under attacker-controlled inputs. Conformance MUST use measured execution against the actual program/runtime configuration. Static estimates alone are insufficient.

### SOL-R2 — State-account persistence
Every persistent economic state account MUST satisfy the runtime's current rent-exemption/persistence requirements. Rent-exemption is separate from solvency, conservation, ProtectedCapital, RawSurplus, Economic Gate and Viability Gate.

### SOL-R3 — CPI authority
Every CPI participating in an IMMORTAL economic transition MUST have an explicit authority boundary covering invoked program identity, account ownership, signer/PDA authority, writable accounts, token-program assumptions, failure propagation and CPI-induced state transitions.

### SOL-R4 — Finality
The Adapter MUST explicitly define the consensus/finality condition sufficient before an economically irreversible transition is treated as finalized. A generic confirmation count MUST NOT substitute for a documented finality condition.

### SOL-R5 — Ordering and leader information
The Adapter MUST model information available to a prospective slot leader before inclusion and MUST ensure economically material randomness cannot be advantageously conditioned on that information. Private relays, if used, are part of the trust boundary.

## 3. Randomness
B1-Solana candidates include explicitly authorized external verifiable-randomness providers or threshold beacons. The provider, authentication mechanism and failure semantics MUST be explicit.

B3-Solana remains a protocol-native randomness research target. No activation or native B3 primitive is assumed.

Finality and randomness are separate properties: finality does not imply unpredictability or bias resistance.

## 4. Operational liveness
Network congestion, interruption, external-provider failure and CPI dependency failure are liveness conditions. No fallback MAY silently weaken the economic trust boundary.

## 5. Conformance
Commit, Lock, Reveal, Expiration, Settlement, Dissolution, Economic Gate, CU boundedness, account persistence, CPI authority, randomness, finality and ordering remain OPEN until evidence exists.

## 6. Implementation gate
Before implementation: accepted trust model; canonical fixture corpus; Reference Adapter differential harness; measured CU evidence; account-persistence evidence; CPI authority analysis; finality evidence; accepted randomness boundary.

## 7. Non-contamination firewall
This document does not alter IMMORTAL economic semantics, EconomicKernel.hs, PRE-RICH policy, Cardano/Bitcoin/Substrate/Ethereum semantics, or Materios B3 research.