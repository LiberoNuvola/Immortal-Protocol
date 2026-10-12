# IMMORTAL Reference Conformance Methodology

**Semantic status:** DRAFT / OPEN DECISION
**Role:** differential-testing methodology only.

## 1. Principle
Every real Adapter should consume the same canonical transition fixtures and demonstrate equivalence with the Reference execution. The Reference Adapter is derived from EconomicKernel.hs.

## 2. Fixture
A fixture identifies initial canonical state, applicable profile parameters, ordered transitions, authenticated external inputs, terminal status and canonical state projection after every transition. Fixtures MUST be deterministic and versioned.

## 3. Differential loop
fixture → Reference execution → canonical states S0...Sn; fixture → Adapter execution → observed projections S'0...S'n; compare every transition.

Terminal-only comparison is insufficient because implementations may diverge and later reconverge.

## 4. Comparison boundary
Compare canonical economic semantics: liabilities, reserves/exposure, protected-capital components, executable liquidity, gate predicates, viability/safe-action result and universal lifecycle/history fields where applicable.

Chain-specific transaction IDs, addresses, script hashes, gas/CU and block identifiers are not equality targets unless explicitly declared as evidence dimensions.

## 5. Failure classification
Every mismatch is classified as reference/harness defect, fixture defect, adapter semantic divergence, representation/encoding divergence, chain-specific execution failure, missing external evidence, or unsupported transition.

## 6. Adversarial corpus
Include solvent, boundary, insolvent, negative-state, stale/unverified input, incomplete obligations, insufficient liquidity, unsafe post-state, uncertified viability/Ω, replay, conflict, duplicate transition, expiry, late reveal, unsupported version and malformed external evidence cases.

## 7. Evidence layers
A passing Reference execution proves only reference semantics. Adapter tests prove only implementation behavior. Live-chain observation proves only runtime/deployment behavior. Certification composes the applicable layers explicitly.

## 8. Implementation gate
Before implementation settle fixture serialization, canonical-state projection, kernel invocation, versioning, mismatch taxonomy and evidence packet format.