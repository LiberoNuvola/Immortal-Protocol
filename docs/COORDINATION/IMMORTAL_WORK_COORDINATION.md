# IMMORTAL — Cross-Session Work Coordination

> **Role:** shared operational handoff / anti-regression register between concurrent engineering sessions.
>
> **Authority:** this file is **not normative** and cannot change protocol semantics. Canonical Constitution/specifications and consolidated decisions remain authoritative.

**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Working branch:** `work/immortal-green-closure`  
**Snapshot:** 2026-09-21  
**Latest observed commit:** `9fa9dd68ec5be9060e419326d891dd5505094b81` — `docs: close economic decision-boundary interface`

---

## 1. Mission

Bring IMMORTAL to technical, mathematical, architectural and documentary closure without regression.

Primary goals:

- make IMMORTAL / Adapter / PRE-RICH separation real, not merely nominal;
- formalize the economic state, obligations, exposure, liquidity and transitions;
- connect Economic Gate → Viability → Safe Action → Atomic Transition;
- prove local safety properties without overclaiming infinite-horizon viability;
- establish V3 ↔ Cardano semantic equivalence;
- close evidence/conformance fronts;
- isolate application-specific policy from the universal kernel;
- keep code, specifications, tests, proofs and documentation mutually consistent.

---

## 2. Authority hierarchy

When sources conflict, use:

1. current Constitution / canonical specifications;
2. consolidated Decision Register / explicit normative decisions;
3. current technical specifications;
4. implementation (evidence of what exists);
5. tests, proofs and verification artifacts;
6. checkpoints / simulations;
7. this coordination file;
8. chat / working notes;
9. legacy material.

Every substantive change must be triangulated against the relevant available sources before promotion.

---

## 3. Architecture boundary

### IMMORTAL — universal protocol/kernel

Only semantics that must remain true independently of a concrete application:

- canonical state;
- obligations;
- exposure;
- executable liquidity;
- ProtectedCapital;
- RawSurplus;
- Economic Gate;
- viability;
- safe actions;
- atomic transitions;
- state history;
- universal lifecycle semantics;
- universal economic safety properties.

### Adapter

Concrete realization of IMMORTAL in an execution environment (currently Cardano):

- state translation / serialization;
- UTxO, datum, redeemer and validity interval handling;
- external-input transport;
- transaction construction/signing/submission;
- observation and evidence production.

Adapter must not independently decide economic admissibility.

### PRE-RICH

Application/profile policy:

- ticket ladder;
- payout multipliers;
- GameRules and outcome distribution;
- Jackpot;
- economic parameters such as KA/KC/KD;
- application-specific expiry/funding policy.

---

## 4. Closed decisions — do not silently reopen

### Ticket expiry

- `365 days` is **not** a canonical IMMORTAL constant.
- DApp/profile determines a deterministic horizon from authoritative issuance state and declared policy.
- The crystallized horizon belongs to the ticket at issuance.
- Terminal semantics: `UNRESOLVED → EXPIRED`.
- After expiry: no claimability, new liability, resurrection or new payment commitment.
- Late reveal has zero economic effect.
- Exact DApp function and implementation/conformance remain implementation work.

### Jackpot

Jackpot is PRE-RICH/application policy, not a mandatory IMMORTAL primitive.

Current PRE-RICH floor:

`J_floor(S) = 500 × max(ΣP_normal, ΣP_saleable(S))`

Funding need:

`FundingNeed(S) = max(0, J_floor(S) − J_locked(S))`

Funding must be atomically admissible.

Do not resurrect the historical 10M / 20M / 50M / 100M / 250M ladder as universal law.

### Jackpot allocation

No canonical universal `JackpotAllocationRate`. Funding is determined by the required state-derived amount subject to economic admissibility.

### PRE-RICH ticket ladder

`1 / 2 / 3 / 5 / 10 / 25 / 50 / 100` is application policy, not IMMORTAL law.

### PRE-RICH payout ceiling

`500×` is a PRE-RICH parameter, not a universal IMMORTAL constant.

---

## 5. Core economic chain

Do not collapse solvency into safety or viability.

Required semantic chain:

`Canonical State`
→ `Economic Delta`
→ `Candidate Post-State`
→ `ProtectedCapital`
→ `RawSurplus`
→ `Economic Gate`
→ `Viability`
→ `Safe Action`
→ `Atomic Transition`
→ `Post-State`
→ `State History`

Local invariant preservation is not, by itself, an infinite-horizon viability proof.

---

## 6. Active fronts

| ID | Front | Status | Objective |
|---|---|---|---|
| IMMORTAL-STATE-BOUNDARY-001 | Universal/application state boundary | **IN_PROGRESS / NEEDS-EVIDENCE** | Classify every relevant type/field in `IMMORTAL/state/EconomicStateV3.hs`, `IMMORTAL/kernel/EconomicKernel.hs`, profile code and PRE-RICH state as UNIVERSAL / PROFILE PARAMETER / APPLICATION STATE-RULE / ADAPTER REPRESENTATION / EVIDENCE / LEGACY before refactoring. |
| B2 | Numerical hysteresis | OPEN | Derive and verify exact semantics; do not promote application values into IMMORTAL constants. |
| B4 | ProtectedCapital preservation | OPEN | Formalize and test preservation through relevant transitions. |
| B5 | Economic Gate → Viability → Atomic Transition | OPEN | Make the complete admissibility chain explicit and testable. |
| B6 | V3 ↔ Cardano semantic equivalence | OPEN | Establish transition-level semantic correspondence for Issue / Reveal / Claim / Expire / Jackpot-related application transitions. |
| C1–C6 | Evidence / conformance | OPEN | Close evidence matrix without confusing tests/simulations with proofs. |
| 3D | Certified persistent NFT binding | OPEN | Close certified persistence/binding semantics and evidence. |
| VIABILITY-INF | Infinite-horizon viability | OPEN | Distinguish local safety from existence of a continuation strategy; no overclaiming. |
| BOUNDARY-SEPARATION | Complete IMMORTAL / PRE-RICH separation | OPEN | Remove or isolate PRE-RICH-shaped concepts from the universal kernel where evidence requires it. |

---

## 7. Current verified architectural concern

The current branch still contains PRE-RICH-shaped state concepts inside the V3 economic state/kernel, including concepts such as:

- `TicketClass`;
- `TicketClassState`;
- `EconomicControlState`;
- `JackpotStatus`;
- `JackpotState`;
- current/highest class activation.

The kernel also uses structures such as `TicketClassState`, `classExposure` and `totalClassExposure`.

**Interpretation:** parameter separation has improved, but conceptual/state separation may still be incomplete.

**Rule:** do not refactor these blindly. First classify consumers, semantics, tests and documentation; then isolate/remove only what the evidence supports.

---

## 8. Current session claim

### SESSION CLAIM

**Session:** autonomous coordination session — 2026-09-21  
**Front:** IMMORTAL-STATE-BOUNDARY-001  
**Objective:** establish a shared handoff protocol and begin evidence-based classification of universal vs application-shaped state without changing economic canon.  
**Files likely affected:** `docs/COORDINATION/IMMORTAL_WORK_COORDINATION.md` initially; later state/kernel files only after consumer/evidence audit.  
**Current evidence:** latest branch commit `9fa9dd68`; current architecture/decision records; Notion A1/A2/A3 closure; prior cross-source audit.  
**Expected output:** synchronized work register plus classification evidence for the next implementation pass.  
**Status:** IN_PROGRESS

---

## 9. Handoff protocol

Before substantive work, append a session claim:

```text
SESSION CLAIM

Session:
Front:
Objective:
Files likely affected:
Current evidence:
Expected output:
Status: IN_PROGRESS
```

On completion, append:

```text
SESSION RESULT

Session:
Front:
Result:
Files changed:
Tests run:
Evidence:
Remaining uncertainty:
Status: DONE / NEEDS-EVIDENCE / BLOCKED
```

For a significant handoff:

```text
HANDOFF

Completed:
- ...

Changed:
- ...

Verified:
- ...

Important findings:
- ...

Do not redo:
- ...

Next recommended action:
- ...

Open uncertainty:
- ...

Evidence:
- ...

Commit:
- ...
```

Never overwrite another session's entry. Append or make a clearly attributable update.

---

## 10. Conflict protocol

If sources disagree, record:

```text
CONFLICT

Source A:
Source B:
Date/version:
Authority:
Technical implication:
Required evidence:
Proposed resolution:
```

Resolve autonomously when the canonical evidence determines the answer. Escalate only irreducible normative/product choices.

---

## 11. Non-regression rules

Before moving, renaming or deleting an artifact:

1. find all consumers;
2. inspect tests;
3. inspect documentation/references;
4. inspect dependencies;
5. inspect this register for concurrent work;
6. classify the artifact as canonical / implementation / legacy / evidence / duplicate / incompatible;
7. make the smallest reversible change that preserves semantics.

Never weaken an invariant merely to make a test pass. If a fixture contradicts the economic model, fix the fixture unless new canonical evidence says the model is wrong.

---

## 12. Recent repository activity

The current branch recently recorded:

- `9fa9dd68` — close economic decision-boundary interface;
- `bdf39a63` — add end-to-end IMMORTAL system continuity map;
- `e79bcd46` — register GameRules replay vectors;
- `5a4f87f5` — add PRE-RICH GameRules replay vectors;
- `71860e98` — reconcile B3 payout-unit interpretation.

These are implementation/documentation evidence, not a replacement for the normative hierarchy.

---

## 13. Change log

### 2026-09-21 — Coordination register created

- Established cross-session handoff mechanism.
- Recorded current branch and latest observed commit.
- Recorded closed economic policy boundaries.
- Registered state-boundary audit as the active front.
- No protocol semantics changed by this file.
- Next action: classify V3/kernel state concepts against canonical responsibilities and consumer evidence.

---

## 14. Important rule

**The coordination file coordinates work; it does not define IMMORTAL.**

If this file ever conflicts with canonical specifications or consolidated normative decisions, the canonical source wins and this register must be corrected.
