# IMMORTAL / PRE-RICH — Economic Algorithm Conformance Matrix

**Status:** OPERATIONAL / NON-NORMATIVE  
**Repository reference:** current PRE-RICH closure lineage  
**Purpose:** track implementation, proof and evidence against canonical economic semantics.  
**Authority:** this matrix does not create or modify economic policy.

## 1. Authority hierarchy

```text
IMMORTAL CONSTITUTION
        ↓
IMMORTAL ECONOMIC KERNEL
        ↓
IMMORTAL ECONOMIC ALGORITHM
        ↓
IMMORTAL ARCHITECTURE / CONFORMANCE
        ↓
CARDANO ADAPTER
        ↓
PRE-RICH PROJECT CONSTITUTION
        ↓
PRE-RICH APPLICATION SPECIFICATION
        ↓
PRE-RICH GAME ECONOMY
        ↓
PRE-RICH ECONOMIC ALGORITHM
        ↓
PRE-RICH CONFORMANCE
        ↓
IMPLEMENTATION
        ↓
TESTS / PROOFS / EVIDENCE
```

This matrix is a measurement layer, not a second authority.

## 2. Status model

| Status | Meaning |
|---|---|
| CLOSED — NORMATIVE | normative choice is settled |
| CLOSED — MODEL | formula/structure is settled |
| VALIDATED — SCOPE BOUNDED | result demonstrated within a declared scope |
| CLOSING — PROOF | structure is settled; proof remains |
| CLOSING — CONFORMANCE | rule is settled; implementation/evidence remains |
| IMPLEMENTATION GAP/FAIL | implementation does not satisfy a settled rule |
| EVIDENCE GAP | conformance evidence is missing or incomplete |
| DEPLOYMENT PARAMETER | deliberately profile/application-specific; not universal IMMORTAL law |
| HISTORICAL CLOSED | retained for traceability, not authority |

**Critical rule:** `GAP/FAIL ≠ OPEN DECISION`.

## 3. Core conformance matrix

| Area | Semantic | Model | Proof/Validation | Implementation | Evidence |
|---|---|---|---|---|---|
| Liability-first accounting | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| ProtectedCapital | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| `RawSurplus=max(0, EEV-ProtectedCapital)` | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| CurrentActiveClass | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| HighestClassEverActivated | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Class contraction | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Hysteresis semantics/structure | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Hysteresis numerical parametrization | CLOSED baseline/structure | CLOSED | CLOSING | CLOSING | OPEN |
| KA/KC/KD roles | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| KA/KC/KD baseline `8/4/4` | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Deterministic exposure | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Expiry finality | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Exact ticket lifetime mechanism | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Exact expiry numeric value | DEPLOYMENT PARAMETER | — | — | TARGET | OPEN |
| Jackpot ownership/isolation/protection | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Jackpot payout mode | CLOSED — full current locked-balance payout exactly once | CLOSED | CLOSING | CLOSING | OPEN |
| Fixed future Jackpot allocation | CLOSED — no fixed percentage; minimum state-derived gap is canonical | CLOSED | CLOSING | CLOSING | OPEN |
| Ticket transfer / identity | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Voluntary burn / CLAIM != BURN | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Sale atomicity | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Treasury → PrizePool invariants | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Settlement-value preservation | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Reveal → result → crystallization | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Crystallized payout immutability | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Jackpot selection/reset/liability | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Liveness boundary | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Multi-asset verified conversion | CLOSED | CLOSED | CLOSING | CLOSING | OPEN |
| Relayer/backend economic authority | CLOSED — prohibited | CLOSED | CLOSING | CLOSING | OPEN |

## 4. Frozen economic baseline

The following are not OPEN DECISIONS:

- `KA=8`
- `KC=4`
- `KD=4`
- ladder `1/2/3/5/10/25/50/100 USDM`
- Genesis `1 USDM`
- verified PRE Treasury bootstrap `>= 4000 USDM`
- maximum normal payout `500×P`
- liability-first accounting
- `ProtectedCapital`
- `RawSurplus=max(0, EEV-ProtectedCapital)`
- `CurrentActiveClass` may contract
- `HighestClassEverActivated` is monotonic non-decreasing
- expiry finality and dissolution of expired payment commitment
- exact expiry is crystallized at issuance from a declared DApp/profile horizon
- protected/isolated Jackpot owned by PRE-RICH
- `NewJackpot <= RawSurplus`
- Jackpot payout `<= LockedJackpotLiquidity`
- Jackpot payout mode = full current locked-balance payout exactly once
- no fixed Jackpot allocation percentage; funding is the minimum state-derived gap to the current floor
- five normal payout tiers: `2→1×P`, `5→2.5×P`, `10→5×P`, `200→100×P`, `1000→500×P`
- Jackpot probability independence
- ticket transferability / identity preservation
- voluntary burn
- `CLAIM != BURN`
- sale atomicity
- Treasury → PrizePool invariants
- settlement-value preservation
- reveal → result → crystallization
- crystallized payout immutability
- Jackpot selection/reset/liability
- liveness boundary
- verified multi-asset settlement conversion

## 5. True OPEN DECISION SET

**There are currently no unresolved normative economic decisions in the PRE-RICH Game Economy baseline represented here.**

The former three-item list is superseded by the current PRE-RICH policy closure:

- Jackpot payout mode: **CLOSED** — full current locked-balance payout exactly once.
- Ticket expiry mechanism: **CLOSED** — deterministic DApp/profile horizon crystallized at issuance.
- Exact expiry numeric value: **DEPLOYMENT/APPLICATION PARAMETER**, not a universal IMMORTAL constant.
- Fixed future Jackpot allocation percentage: **CLOSED as unnecessary for the current policy**; funding uses the minimum state-derived gap and surplus remains RawSurplus.

Remaining work is implementation, proof, conformance or deployment evidence. None of it reopens these semantics.

## 6. Historical / non-canonical material

- `75/10/10/5` = HISTORICAL / NON-CANONICAL.
- V25 = HISTORICAL CLOSED.
- `K*=1.482` = historical numerical oracle/reference.
- old Constitution / Architecture / Economic Algorithm documents = ARCHIVE / non-authoritative.
- Beacon B1/B3 historical research = evidence/research, not economic authority.
- historical Jackpot maturity ladders and fixed allocation splits are non-canonical.

Historical material may remain useful for regression, comparison and evidence.

## 7. Conformance rule

A failing implementation does not authorize changing the rule it failed to implement.

A normative change requires a new explicit decision. A proof gap requires proof work. An implementation gap requires implementation work. An evidence gap requires reproducible evidence.

```text
DOCUMENTED ≠ IMPLEMENTED
IMPLEMENTED ≠ VERIFIED
REFERENCE MODEL ≠ ON-CHAIN PROOF
GAP/FAIL ≠ OPEN DECISION
```

## 8. Release/conformance gate

A row may be marked `IMPLEMENTED / VERIFIED` only when the relevant semantic rule, model, implementation and reproducible evidence agree on the same repository state.

This matrix deliberately reports implementation/conformance work as open where evidence is incomplete. That does not reopen the frozen economic baseline.
