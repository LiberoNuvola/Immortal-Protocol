# IMMORTAL — Mainnet Evidence Gate v0.1

> Operational closure matrix. This document is non-normative.
> It does not change economics, validator semantics, governance rules, or architecture authority.
> A gate is green only when the required evidence exists; source inspection alone does not promote a gate.

## 1. Closure principle

Mainnet readiness is an evidence-continuity problem, not a document-count problem.

For every critical transition, the target chain is:

canonical action
→ authenticated pre-state
→ authoritative profile/application policy
→ candidate post-state
→ Economic Gate / viability decision
→ generated artifact identity
→ signed transaction identity
→ observed ledger result
→ post-state reconstruction
→ persisted evidence packet.

Cardano transaction validation is deterministic, and minting actions are validated against the corresponding minting policy; therefore the evidence packet must preserve the exact transaction context used for the claimed result. citeturn0search3turn0search2

## 2. Gate matrix

| Gate | Requirement | Current status | Closure evidence |
|---|---|---|---|
| M1 | Canonical economic semantics frozen | 🟢 | Current canonical specs + decision register |
| M2 | Universal/application boundary | 🟡 | Field classification + typed bridge + consumer/conformance mapping |
| M3 | V3 transition correctness | 🟡 | Action-by-action transition tests and persisted witnesses |
| M4 | Concrete refinement | 🟡 | Exact refinement witnesses for all supported actions |
| M5 | Cardano semantic encoding | 🟡 | Semantic encoding witness tied to exact transaction/artifact |
| M6 | Composition of M3–M5 | 🟡 | Composed transition certificate backed by real artifacts |
| M7 | B4 ProtectedCapital preservation | 🟡 | Transition-level preservation evidence, including real ledger provenance |
| M8 | B5 Economic Gate → Viability → Atomic Transition | 🟡 | Admission witness + atomic execution + post-state evidence |
| M9 | B6 V3 ↔ Cardano equivalence | 🟡 | Action-by-action correspondence on real Cardano execution |
| M10 | Cardano observation completeness (Ω) | 🔴 | Demonstrated coverage of all economically relevant ledger outcomes |
| M11 | Oracle / external observation integrity | 🔴 | Authenticated observation inputs + deterministic evaluation + replay evidence |
| M12 | Liveness assumptions/evidence | 🟡 | Explicit hypotheses plus execution evidence where testable |
| M13 | Governance execution/finality | 🟡 | Current-head CI + authenticated lifecycle/finality replay |
| M14 | Materios authority/finality provenance | 🔴 | Authenticated authority-set transition + finalized GRANDPA ancestry/quorum linkage |
| M15 | Genesis / C10–C15 production provenance | 🟡 | Fresh execution + deployment/provenance correlation |
| M16 | Security review | 🔴 | Independent external review and disposition of findings |
| M17 | Historical Gate 41 evidence | 🟡 | Historical PRE mint redeemer + serialized transaction CBOR + provenance packet |
| M18 | Controlled mainnet deployment | 🔴 | All critical gates closed, deployment controls and rollback/incident procedures |

## 3. Status interpretation

### 🟢 Closed
Required evidence is present, reproducible, and linked to the canonical requirement.

### 🟡 Partially discharged / needs evidence
Implementation or tests exist, but the evidence chain is incomplete or not yet tied to the required external/ledger observation.

### 🔴 Open blocker
A required capability or independent evidence source is absent.

## 4. Critical blocker rule

The following are **mainnet-critical** and cannot be treated as documentation-only gaps:

- M6 composition;
- M7 ProtectedCapital preservation;
- M8 Economic Gate / atomic transition;
- M9 V3 ↔ Cardano equivalence;
- M10 observation completeness;
- M11 oracle integrity;
- M14 Materios authority/finality provenance;
- M16 independent security review.

M17 Gate 41 is important historical provenance but is not, by itself, a reason to block the core protocol if all canonical economic and execution requirements are independently satisfied.

## 5. Evidence packet minimum

For each critical real-ledger transition, preserve at minimum:

1. canonical action identifier;
2. canonical pre-state hash;
3. authoritative profile/application identifier;
4. authenticated external observations;
5. candidate post-state hash;
6. Economic Gate decision and reason;
7. generated transaction/artifact hash;
8. signed transaction identifier;
9. exact transaction/UTxO context used for evaluation;
10. observed ledger transaction ID and inclusion/finality evidence;
11. reconstructed post-state hash;
12. evaluator output / ExUnits / failure classification;
13. raw source artifacts and cryptographic hashes;
14. provenance describing acquisition method, provider, timestamp and version.

## 6. Gate 41 containment

Gate 41 remains a historical evidence front.

Target:
- transaction: `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`
- PRE policy: `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4`
- purpose: `mint`

The observed Koios tx_utxos material establishes transaction/UTxO facts but does not by itself establish the historical mint redeemer or serialized witness set. The acquisition helper must therefore fail closed until those artifacts are actually acquired and preserved.

No interpretation of the historical 3 ADA observation is promoted to seed/min-ADA semantics without transaction-level evidence.

## 7. Immediate work order

### Priority A — real transition evidence
Close one complete Issue/Reveal/Claim/Expire path end-to-end:

pre-state
→ transition witness
→ refinement witness
→ Cardano encoding
→ signed transaction
→ real ledger observation
→ post-state reconstruction.

### Priority B — B4/B5/B6
Use the same evidence packet to prove:

- ProtectedCapital preservation;
- Economic Gate admissibility;
- atomicity;
- V3 ↔ Cardano correspondence.

### Priority C — observation/oracle
Define and test the completeness boundary for Ω and the authenticated observation path.

### Priority D — Materios/governance
Close authenticated authority/finality and governance replay evidence without replacing authoritative upstream selectors with local reimplementations.

### Priority E — Gate 41
Run the reproducible historical acquisition when a network-capable provider environment is available. Preserve raw CBOR/redeemer responses before interpreting them.

## 8. Non-regression

This matrix does not authorize reopening or changing:

- KA/KC/KD;
- PRE-RICH ticket ladder;
- PRE-RICH 500× ceiling;
- Jackpot ownership/funding semantics;
- expiry semantics;
- ProtectedCapital formula;
- Genesis threshold.

Evidence failures must be fixed at the smallest justified implementation/tooling boundary.

## 9. Mainnet criterion

Do not declare “mainnet ready” from aggregate test counts.

The criterion is:

**all mainnet-critical gates have reproducible evidence, the evidence chains are mutually consistent, unresolved findings are explicitly dispositioned, and the complete deployed transition path has been demonstrated on the target Cardano environment.**

## 10.1 Golden Reveal packet

Priority A now has a concrete packet manifest at `audit/transition-evidence/PRE-RICH-REVEAL-GOLDEN-PACKET.md`.

The manifest is deliberately evidence-only: it does not create a new economic rule and it does not claim a real transaction. It binds the existing Reveal implementation, EconomicAdmission boundary and B1/PrizeValidator state updates to the minimum artifacts required for real-ledger closure.

Current status: **YELLOW / REAL-LEDGER PACKET OPEN**.

The next closure action is to populate this packet from one fresh target-environment Reveal execution and verify the reconstructed post-state against the canonical transition witness.