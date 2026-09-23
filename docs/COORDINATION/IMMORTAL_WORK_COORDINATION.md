# IMMORTAL — Cross-Session Work Coordination

> **Role:** shared operational handoff / anti-regression register between concurrent engineering sessions.
>
> **Authority:** this file is **not normative** and cannot change protocol semantics. Canonical Constitution/specifications and consolidated decisions remain authoritative.

**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Working branch:** `work/immortal-green-closure`  
**Snapshot:** 2026-09-23  
**Latest observed commit:** `81a7933c6845939c71430f34dd5de174521bd402` — V3 refinement now enforces canonical control-state validity

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
| IMMORTAL-STATE-BOUNDARY-001 | Universal/application state boundary | **BRIDGE IMPLEMENTED / NEEDS-EVIDENCE** | Classify every relevant type/field in `IMMORTAL/state/EconomicStateV3.hs`, `IMMORTAL/kernel/EconomicKernel.hs`, profile code and PRE-RICH state as UNIVERSAL / PROFILE PARAMETER / APPLICATION STATE-RULE / ADAPTER REPRESENTATION / EVIDENCE / LEGACY before refactoring. |
| B2 | Numerical hysteresis | OPEN | Derive and verify exact semantics; do not promote application values into IMMORTAL constants. |
| B4 | ProtectedCapital preservation | OPEN | Formalize and test preservation through relevant transitions. |
| B5 | Economic Gate → Viability → Atomic Transition | OPEN | Make the complete admissibility chain explicit and testable. |
| B6 | V3 ↔ Cardano semantic equivalence | **PARTIAL / NEEDS-EVIDENCE** | Establish transition-level semantic correspondence for Issue / Reveal / Claim / Expire / Jackpot-related application transitions. |
| C1–C6 | Evidence / conformance | OPEN | Close evidence matrix without confusing tests/simulations with proofs. |
| 3D | Certified persistent NFT binding | OPEN | Close certified persistence/binding semantics and evidence. |
| VIABILITY-INF | Infinite-horizon viability | OPEN | Distinguish local safety from existence of a continuation strategy; no overclaiming. |
| BOUNDARY-SEPARATION | Complete IMMORTAL / PRE-RICH separation | OPEN | Remove or isolate PRE-RICH-shaped concepts from the universal kernel where evidence requires it. |

---

## 7A. V3 control-state hardening — current evidence

The current V3 transition boundary now rejects malformed control state before and after `EconomicTransitionV3.transition` through `EconomicKernel.controlStateValid` (current/highest class IDs must both belong to the supplied `EconomicProfile`).

`RefinementV3.refinementExact` now enforces the same control-state validity at the concrete→canonical refinement boundary.

This is a **boundary-hardening / conformance improvement**, not closure of automatic class control. The PRE-RICH application-level hysteresis reference already implements the closed `KA=8 / KC=4 / KD=4` predicates and direct contraction/recovery semantics in `src/preRichHysteresis.ts`, with dedicated conformance tests/workflow. The remaining architectural gap is the explicit binding of that application policy to authoritative V3/on-chain control-state transitions without promoting PRE-RICH policy into the universal IMMORTAL kernel.

No CI-green claim is made here unless a corresponding workflow run is observed.

`81a7933c6845939c71430f34dd5de174521bd402` records the refinement-boundary hardening.

## 7B. Control-state side-door closure

The PRE-RICH Cardano projection previously defaulted omitted `currentActiveClass` / `highestClassEverActivated` to `0`. That was a representational side-door: missing authoritative control could silently become class 0. The projection now requires both observations explicitly and rejects malformed control values and `CurrentActiveClass > HighestClassEverActivated`.

V3 transition validation additionally enforces monotonic `HighestClassEverActivated` across pre/post states and preserves the invariant `CurrentActiveClass <= HighestClassEverActivated`.

Commits: `020692921024a1ef4ffb8a0fec10f82f63d4c7f1`, `d5bf7e22b06674da2e4e56f6beb49d0667e8ac8b`, `bad410d2d90c560c0eeff7ec6e7d1d52400c7a96`.

This does **not** claim automatic class selection/hysteresis closure; it removes silent defaults and enforces the historical-control invariant while the authoritative PRE-RICH hysteresis controller remains the policy source.

## 7. Current verified architectural concern

The current branch still contains PRE-RICH-shaped state concepts inside the V3 economic state/kernel, including:

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

## 8. First triangulated state-boundary audit

### 8.1 Current branch implementation evidence

The live branch files were inspected directly:

- `IMMORTAL/state/EconomicStateV3.hs`
- `IMMORTAL/kernel/EconomicKernel.hs`
- `IMMORTAL/state/EconomicProfile.hs`
- `PRE-RICH/profile/PreRichEconomicProfile.hs`
- `plutus/B1LegacyAdapter.hs`

Observed facts:

1. `EconomicProfile` correctly externalizes concrete class prices and the maximum payout multiplier as application-supplied parameters.
2. PRE-RICH concretely supplies the ladder `1/2/3/5/10/25/50/100` and `500`.
3. `EconomicKernel.worstCaseExposure` consumes the profile multiplier rather than hard-coding 500 on this branch.
4. Nevertheless, `V3EconomicState` structurally embeds `v3Classes`, `v3Control` and `v3Jackpot`.
5. `EconomicKernel` derives exposure from `TicketClassState` and uses Jackpot/control state in economic calculations.
6. `B1LegacyAdapter` contains explicit fail-closed checks for unsupported protected-capital components, unsupported Jackpot state, historical control loss, and aggregate mismatch. This is evidence that the current legacy projection is not lossless for the full V3 state.

### 8.2 Triangulated Notion evidence

Current Notion sources searched/fetched include:

- **IMMORTAL — Economic Canon & Parameter Boundary Register v0.1**
- **Economic Rule Classification Matrix — Immortal Protocol / Adapter / PRE-RICH**
- **2026-09-21 — A1/A2/A3 Policy Closure — Ticket Expiry & Jackpot**
- **2026-09-21 — IMMORTAL Multi-Front Workflow Checkpoint**
- **IMMORTAL / PRE-RICH — End-to-End System Map & Continuity Checkpoint**
- **M3 — Chain Adapter & Serialization Boundary Design v0.1**

The economic canon confirms:

- worst-case exposure is a universal economic concept;
- the numeric payout bound is profile/application supplied;
- `500` is PRE-RICH policy, not IMMORTAL law;
- ProtectedCapital and RawSurplus are universal semantic concepts;
- implementation gaps must not reopen closed semantic decisions;
- the target architecture is a typed boundary between universal semantics and profile/application policy.

### 8.3 Preliminary classification

| Element | Current role | Preliminary classification | Action |
|---|---|---|---|
| `TicketClass` | profile key / identifier | **PROFILE-BOUND TYPE / UNIVERSAL IDENTIFIER PRIMITIVE** | Do not delete; consider renaming/abstracting only if consumer audit proves value. |
| `TicketClassState` | per-class issued/unresolved/exposure/cap/saleability state | **APPLICATION/PROFILE STATE** | Candidate for extraction from universal state. Preserve while consumers are mapped. |
| `EconomicControlState` | current/highest activated class | **APPLICATION STATE / POLICY STATE** | Not universal absent proof that all DApps require activation hysteresis. |
| `JackpotStatus` | Jackpot lifecycle enum | **APPLICATION STATE** | Strong candidate to move outside universal state. |
| `JackpotState` | locked amount/threshold/status/cycle | **APPLICATION STATE** | Strong candidate to move outside universal state; universal layer should protect economically material locked obligations without requiring a Jackpot concept. |
| `v3CrystallizedLiabilities` | authoritative protected liability | **UNIVERSAL ECONOMIC STATE** | Retain in universal model. |
| `v3UnresolvedReserve` | aggregate unresolved accounting representation | **UNIVERSAL SEMANTIC ACCOUNTING CONCEPT, implementation representation still under audit** | Retain semantic role; avoid assuming the class-list representation is universal. |
| `v3UnresolvedTicketCount` | aggregate unresolved count | **UNIVERSAL / DERIVED ACCOUNTING STATE** | Retain if canonical specs require it; otherwise derive from obligations. |
| `v3SafetyCapital` | protected capital component | **UNIVERSAL SEMANTIC COMPONENT** | Retain; prove provenance/preservation. |
| `v3ReserveProtection` | protected capital component | **UNIVERSAL SEMANTIC COMPONENT** | Retain; prove provenance/preservation. |
| `v3MandatoryFutureCosts` | protected future obligations | **UNIVERSAL SEMANTIC COMPONENT** | Retain; prove provenance/preservation. |
| `epClassPrices` | concrete profile values | **PROFILE PARAMETER** | Correctly outside concrete IMMORTAL constants. |
| `epMaxNormalPayoutMultiplier` | concrete payout bound | **PROFILE PARAMETER** | Correctly profile-supplied. |
| `classExposure` | price × unresolved count by class | **UNIVERSAL CONCEPT, APPLICATION-SHAPED REPRESENTATION** | Generalize toward obligations/exposure interface; do not prematurely delete. |
| `classSaleable` | class activation/capacity policy | **APPLICATION RULE** | Should not be a universal economic primitive. |

### 8.4 Important architectural conclusion

The evidence supports a **conceptual split**, but does **not yet justify a destructive immediate refactor**.

The most likely target is:

`UniversalEconomicState`
+
`Profile/ApplicationState`
+
`EconomicProfile`

with a typed economic projection/interface from application state into universal obligations/exposure.

The universal kernel should reason about economically material obligations/exposure and admissibility, not require a ticket ladder or Jackpot merely because PRE-RICH currently has them.

However, the exact new Haskell types and transition signatures must be derived from all consumers and current V3/Cardano conformance tests before changing code.

---

## 9. Important legacy finding

`plutus/B1LegacyAdapter.hs` is currently a useful boundary witness:

- legacy → V3 rejects unresolved tickets, non-zero unresolved reserve mismatch, and locked Jackpot state rather than inventing semantics;
- V3 → legacy rejects non-zero SafetyCapital, ReserveProtection, MandatoryFutureCosts, locked Jackpot and historical-control loss;
- `legacyProjectionIsLossless` is explicitly conditional and therefore does not establish full V3 ↔ legacy equivalence.

**Implication:** the lossy legacy projection must not be used as the universal semantic model. B4/B6 remain open.

---

## 10. Search caveat

GitHub code search for this repository currently returns matches from the repository's indexed/default-branch history in some cases, not necessarily `work/immortal-green-closure`.

Therefore:

- direct fetches against the working branch are authoritative for current implementation inspection;
- default-branch search hits are treated as historical/provenance evidence until independently verified on the working branch;
- no refactor is based solely on an unverified default-branch search result.

This is a non-obvious anti-regression constraint for both sessions.

---

## 11. Current session result

### SESSION RESULT

**Session:** autonomous coordination session — 2026-09-21  
**Front:** IMMORTAL-STATE-BOUNDARY-001  
**Result:** completed first cross-source classification pass. Confirmed that parameter separation is substantially in place, while V3 state remains structurally mixed with PRE-RICH-shaped class/control/Jackpot concepts. Confirmed that the legacy B1 projection is intentionally lossy for several V3 components. No economic canon was changed.  
**Files changed:** `docs/COORDINATION/IMMORTAL_WORK_COORDINATION.md` only.  
**Tests run:** no code changes; no test suite required for this documentation-only audit.  
**Evidence:** current branch implementation; current Notion Economic Canon / Classification Matrix / A1-A3 Closure / Multi-Front Checkpoint / End-to-End System Map; legacy adapter implementation.  
**Remaining uncertainty:** exact universal state/type boundary and the minimal compatible refactor cannot be finalized until all V3 transition consumers and conformance tests are mapped.  
**Status:** DONE / NEEDS-EVIDENCE

---

## 12. Handoff

### HANDOFF

**Completed:**
- Created the shared coordination register.
- Triangulated the live branch state model against current Notion economic-boundary decisions.
- Classified the main V3 fields/types provisionally.
- Identified the legacy projection as intentionally non-lossless.

**Changed:**
- `docs/COORDINATION/IMMORTAL_WORK_COORDINATION.md`

**Verified:**
- `EconomicProfile` carries application values rather than universal numeric constants.
- `500×` is profile-supplied on the current branch.
- Jackpot/control/class activation remain structurally embedded in V3.
- ProtectedCapital components exist in V3 and are not all representable in legacy B1.

**Important findings:**
- Do not perform a big-bang V3 state refactor.
- The likely architectural target is universal economic state plus application/profile state with an explicit typed projection.
- `classExposure` is a universal economic concept but its current class-list representation is application-shaped.
- Jackpot should not become a universal state primitive merely because PRE-RICH currently uses it.

**Do not redo:**
- Do not re-audit closed A1/A2/A3 policy decisions from scratch.
- Do not treat 365 days, 500× or the PRE-RICH ladder as universal constants.
- Do not treat default-branch GitHub search hits as current-branch truth without verification.

**Next recommended action:**
1. Map all consumers of `V3EconomicState`, `TicketClassState`, `EconomicControlState`, `JackpotState`, `classExposure`, `protectedCapital`, and transition functions on `work/immortal-green-closure`.
2. Map the current V3 transition/action types and Cardano validator/adapter inputs.
3. Build a minimal compatibility matrix showing which fields are required by universal semantics versus PRE-RICH policy.
4. Only then design the smallest non-destructive type boundary refactor.
5. In parallel, continue B4/B5/B6 using the existing state until the new boundary is proven equivalent.

**Open uncertainty:**
- Whether some class-level aggregation is required by the universal canonical state for arbitrary DApps, or whether it can be generalized as an application-provided obligation/exposure projection.

**Evidence:**
- Current branch: `work/immortal-green-closure`
- Latest branch commit observed before coordination update: `9fa9dd68ec5be9060e419326d891dd5505094b81`
- Coordination commit: `74f81d8dd8ed3e19538c647133fcbdcfdee05ccd`

---

## 13. Conflict protocol

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

## 14. Non-regression rules

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

## 15. Recent repository activity

The current branch recently recorded:

- `9fa9dd68` — close economic decision-boundary interface;
- `bdf39a63` — add end-to-end IMMORTAL system continuity map;
- `e79bcd46` — register GameRules replay vectors;
- `5a4f87f5` — add PRE-RICH GameRules replay vectors;
- `71860e98` — reconcile B3 payout-unit interpretation.

These are implementation/documentation evidence, not a replacement for the normative hierarchy.

---

## 16. Change log

### 2026-09-21 — Coordination register created

- Established cross-session handoff mechanism.
- Recorded current branch and latest observed commit.
- Recorded closed economic policy boundaries.
- Registered state-boundary audit as the active front.
- No protocol semantics changed by this file.

### 2026-09-21 — First state-boundary triangulation

- Triangulated current branch implementation against current Notion economic canon.
- Confirmed mixed universal/application state representation.
- Confirmed legacy B1 projection is intentionally lossy.
- Marked exact type boundary as NEEDS-EVIDENCE rather than inventing a refactor.
- Handed off consumer/conformance mapping as the next action.

---


## 17. SESSION CLAIM — Consumer / Conformance Mapping

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** IMMORTAL-STATE-BOUNDARY-001 → V3 consumer/conformance mapping
**Objective:** map all live-branch consumers of V3 state and economic functions, identify which transitions require application-shaped state versus universal semantics, and produce the minimum-safe refactor boundary.
**Files likely affected:** documentation/coordination first; code changes only after consumer map is complete.
**Current evidence:** branch `ad778912c68274203560f9391ee71a634ac2478f`; live `EconomicStateV3.hs`, `EconomicKernel.hs`, `B1LegacyAdapter.hs`; current Notion Economic Canon / Classification Matrix / Multi-Front Checkpoint.
**Expected output:** consumer matrix + transition dependency map + explicit evidence for any boundary change.
**Status:** IN_PROGRESS


---
## 18. Important rule

**The coordination file coordinates work; it does not define IMMORTAL.**

If this file ever conflicts with canonical specifications or consolidated normative decisions, the canonical source wins and this register must be corrected.

---


---

## 21. SESSION RESULT — Universal Economic State Bridge

**Session:** autonomous coordination session — 2026-09-21 (follow-on)  
**Front:** IMMORTAL-STATE-BOUNDARY-001 / B4 preparation  
**Result:** introduced a non-destructive typed boundary between the rich current PRE-RICH/V3 representation and an application-neutral universal economic aggregate. The existing `V3EconomicState` and `EconomicTransitionV3` remain unchanged; the new bridge is additive and fail-closed.

**New IMMORTAL modules:**
- `IMMORTAL/state/UniversalEconomicState.hs`
- `IMMORTAL/kernel/UniversalEconomicKernel.hs`

**New PRE-RICH boundary module:**
- `PRE-RICH/profile/PreRichEconomicProjection.hs`

**Build integration:**
- `plutus/pre-rich-plutus.cabal` now exposes the three modules.

**Conformance changes:**
- `plutus/test/GoldenVectorsTest.hs` now supplies the required `EconomicProfile` to existing V3 transition/conservation predicates, removes the import ambiguity between the V3 and universal kernels, and tests:
  - V3 → universal projection for issue/reveal/expiry;
  - unknown-class rejection;
  - inconsistent-exposure rejection;
  - invalid-profile rejection;
  - duplicate-class rejection;
  - universal ProtectedCapital / RawSurplus / solvency predicates;
  - aggregate boundary equivalence;
  - preservation of non-zero protected components, including locked application-specific capital.

### Semantic result

For a successful PRE-RICH projection ( pi_P(S)=U ), the bridge explicitly witnesses equality of the **represented aggregate boundary functions**:

`ProtectedCapital_V3(P,S) = ProtectedCapital_U(U)`

`RawSurplus_V3(P,EEV,S) = RawSurplus_U(EEV,U)`

`Solvency_V3(P,EEV,S) = Solvency_U(EEV,U)`

This is a **bridge/conformance property**, not a proof of Economic Gate soundness, Viability, Atomicity, or full V3 ↔ Cardano equivalence.

### CI evidence

GitHub Actions has executed the branch automatically.

- Cardano Adapter conformance test step passed in the inspected runs, including the modified reveal conformance suite.
- The associated frontend workflow still fails at `npm run build` inside `node-fetch/src/body.js` because Vite externalizes Node built-ins; this failure occurs after the targeted conformance tests pass and is not an economic-state assertion.
- The Haskell kernel regression workflow for the latest bridge commit is currently executing; no final Haskell test result is claimed yet.
- Local execution is unavailable because the environment lacks GHC/Cabal.

### Important architectural finding

The repository now has two distinct aggregate boundaries:

1. rich V3/application state, retained for compatibility and application behavior;
2. application-neutral universal economic state, intended for universal economic evaluation.

They are intentionally connected by an explicit PRE-RICH projection rather than by embedding application policy into the Adapter or universal state.

### Remaining uncertainty

The projection is not yet the canonical transition boundary. B5 still requires an explicit path from:

`Candidate Post-State → Economic Gate → Viability → Atomic Transition`

and B4/B6 still require preservation/equivalence through the actual Cardano execution path, including the legacy B1 boundary.

**Status:** NEEDS-EVIDENCE / IMPLEMENTATION CONFORMANCE

---

## 22. HANDOFF — Universal Economic State Bridge

**Completed:**
- additive universal state type;
- additive universal kernel primitives;
- PRE-RICH fail-closed projection;
- bridge conformance tests;
- correction of existing golden-test call signatures/ambiguity.

**Changed:**
- `IMMORTAL/state/UniversalEconomicState.hs`
- `IMMORTAL/kernel/UniversalEconomicKernel.hs`
- `PRE-RICH/profile/PreRichEconomicProjection.hs`
- `plutus/pre-rich-plutus.cabal`
- `plutus/test/GoldenVectorsTest.hs`
- this coordination register

**Verified:**
- PRE-RICH class/payout/Jackpot policy remains outside the universal aggregate type;
- the bridge preserves the existing V3 aggregate ProtectedCapital-derived boundary for successful projections;
- invalid/ambiguous application decomposition fails closed;
- the existing V3 transition model is not yet rewritten.

**Do not redo:**
- do not replace `V3EconomicState` wholesale;
- do not move Jackpot or the PRE-RICH ladder back into the universal state;
- do not interpret the bridge property as infinite-horizon viability proof;
- do not treat the frontend Vite build failure as evidence that the economic bridge is wrong.

**Next recommended action:**
- Use the universal state as the typed input to the Economic Gate/B5 design, while preserving application state alongside it.
- Audit the Cardano validator's legacy B1 projection against the universal state and fail closed whenever protected economic information cannot be represented.
- Then establish action-by-action B6 equivalence.

**Commit range:**
- `38fb34bd` universal state
- `7717771f` universal kernel
- `fbdca2d0` PRE-RICH projection
- `db9b6f1e` cabal integration
- `5da89ceb` duplicate-class hardening
- `3ae9a249` bridge test/signature repair
- `1d0e5134` aggregate boundary equivalence helper
- `571efa04` conformance tests

---
## 23. SESSION RESULT — B2 Numerical Hysteresis

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B2 — Numerical Hysteresis
**Result:** implemented a PRE-RICH application-level exact-integer hysteresis reference without modifying IMMORTAL universal kernel/state. Canonical baseline is KA=8, KC=4, KD=4. Activation, maintenance, distribution-floor and direct-contraction predicates are evaluated by integer cross-multiplication (C >= K*X(P)), avoiding floating-point division and without embedding PRE-RICH ladder policy in the universal kernel.
**Files changed:**
- src/preRichHysteresis.ts
- src/__tests__/preRichHysteresis.test.ts
- .github/workflows/pre-rich-hysteresis-conformance.yml
- docs/COORDINATION/IMMORTAL_WORK_COORDINATION.md
**Tests/evidence:** dedicated GitHub Actions run 35649345343 (PRE-RICH Hysteresis Conformance) completed successfully on commit ea8b0740ba04da771cee5884db3d8114428660e4. The initial boundary fixture was corrected when review found that class 3 remained activation-eligible at capacity 639; the invariant was not weakened.
**Verified semantics:** exact activation boundary, exact maintenance boundary, KD distribution floor, highest activation-eligible class, direct contraction, retention below activation while maintenance holds, monotonic HighestClassEverActivated and safe halt when no class remains maintainable.
**Remaining uncertainty:** live integration into PRE-RICH class-control state and on-chain enforcement/conformance. This result does not prove infinite-horizon viability or Cardano equivalence.
**Status:** NEEDS-EVIDENCE / IMPLEMENTATION CONFORMANCE

---

## 24. TRIANGULATION NOTE — G7 Payout-Unit Status

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B3-D / G7 — payout-unit conformance
**Result:** current branch `PRE-RICH/docs/PAYOUT-UNIT-CONFORMANCE.md` explicitly closes the prior 2.5-USDM truncation finding as a unit-interpretation false positive. With the established `1 USDM = 100 sub-units` representation, tier 2 is exactly `5 × 100 / 2 = 250` sub-units. Current `Types.hs`, `GameRules.hs`, `src/gameRules.ts` and `PrizeValidator.hs` preserve the 2.5-USDM value and the two row results.
**Evidence:** current branch payout-unit conformance document and implementation; current Notion G7/DEC-3 material; Library conformance artifacts.
**Decision:** no payout-unit code fix is required. No new G7 implementation front is claimed by this session.
**Remaining evidence:** executable parity and real Cardano settlement evidence remain part of the broader conformance program; they do not reopen the economic model.
**Status:** TRIANGULATED / CLOSED IMPLEMENTATION FINDING — EVIDENCE REMAINS

---
## 25. SESSION CLAIM — B5 Economic Admission Bridge
**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B5 — Economic Gate → Viability → Atomic Transition
**Objective:** add the smallest non-destructive composition layer that evaluates a candidate V3 transition through the existing PRE-RICH projection, Universal Economic Gate and explicit viability certificate, while keeping `transitionValid` structural and keeping economic authority in IMMORTAL.
**Files likely affected:** `PRE-RICH/profile/PreRichEconomicAdmission.hs`, focused conformance tests, cabal registration if required, coordination register.
**Current evidence:** `IMMORTAL/kernel/EconomicGate.hs` already separates structural transition validity, verified EEV inputs, immediate economic gate and viability; `PRE-RICH/profile/PreRichEconomicProjection.hs` provides a fail-closed V3→universal projection; current matrix requires this chain but no direct V3-action composition exists yet.
**Expected output:** typed admission result for V3 actions, fail-closed projection/Gate/viability composition, boundary tests; no universal formula changes.
**Status:** IN_PROGRESS

### 2026-09-21 — RF9 refinement update
- `PRE-RICH/profile/PreRichExpiryEvidence.ts` + dedicated CI establish ticket-level expiry-boundary evidence without selecting a duration.
- `PreRichExpiryEvidence` proves `expiresAt >= issuedAt`, validity-upper-bound behavior and expiry-lower-bound behavior, plus late-reveal economic inertness after expiry.
- Exact PRE-RICH duration remains a separate unresolved application-policy choice; current `src/mint.ts` still contains the historical 365-day placeholder and must not be promoted to canon.

---

## 26. SESSION CLAIM — B6 V3 ↔ Cardano Semantic Equivalence

**Session:** autonomous coordination session — 2026-09-21 (follow-on)  
**Front:** B6 — V3 ↔ Cardano semantic equivalence  
**Objective:** establish an action-by-action refinement/conformance map between canonical V3 transitions and the Cardano B1 realization, focusing on Issue / Reveal / Claim / Expire, legacy projection preservation and fail-closed behavior. No new economic rule.  
**Files likely affected:** IMMORTAL/docs/ evidence/specification, plutus/ adapter/conformance tests, focused mapping document; no changes to frozen economic formulas unless a real contradiction is found.  
**Current evidence:** normative transition spec v3.0.0; Economic Gate ↔ Cardano matrix; EconomicTransitionV3.hs; B1PrizePool.hs; B1LegacyAdapter.hs; current Cardano Adapter conformance tests; current Notion Adapter/Settlement and Multi-Front checkpoints.  
**Expected output:** explicit refinement relation, action-by-action pre/post correspondence, lossiness boundaries and focused adversarial conformance suite.  
**Status:** IN_PROGRESS


---

## 26. SESSION RESULT — B3-D Replay Vectors

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B3-D — deterministic Beacon/GameRules replay
**Result:** added executable TypeScript replay coverage over the existing canonical vector file `verification/pre-rich-gamerules-v1-vectors.json`. The test verifies the canonical 20,000 domain, 60,000 rejection bound, modulo reduction, exact row-attempt inputs, generated six-symbol output for the published seed cases, row-tier classification and every material outcome interval boundary.
**Files changed:** `src/__tests__/preRich-gamerules-replay.test.ts`, plus this coordination register.
**Important:** existing Materios PoCs were not recreated or modified. The test is evidence for the mapping layer only; it does not establish publisher-independent Materios authenticity or full Plutus/TypeScript byte-for-byte parity.
**Status:** NEEDS-EVIDENCE / CI RUNNING

---

## 27. SESSION RESULT — B6 V3 ↔ Cardano Semantic Equivalence

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B6 — V3 ↔ Cardano semantic equivalence
**Status:** **PARTIAL / NEEDS-EVIDENCE**

### Completed

- Audited the live V3 transition semantics for Issue / Reveal / Claim / Expire.
- Audited the Cardano B1 / PrizeValidator lifecycle path and legacy projection.
- Created `IMMORTAL/docs/V3-CARDANO-SEMANTIC-EQUIVALENCE.md`.
- Moved the PRE-RICH-specific Cardano observation projection out of `Adapter/CARDANO` into `PRE-RICH/profile/PreRichCardanoObservationProjection.ts`.
- Removed the stale Adapter projection that depended on the old application-shaped `CanonicalEconomicState`.
- Updated the P2.7 conformance test to use the PRE-RICH projection.
- Fixed `src/txHelpers.ts` so its use of `createCardanoExecutionAdapter` has the required import.
- Added the full P2.7 semantic conformance suite to the Cardano Adapter CI command.

### Current evidence

The action-by-action audit establishes:

- **Issue:** V3 requires profile price + class saleability; B1 currently proves price/NFT/aggregate accounting but does not itself reconstruct V3 activation/saleability.
- **Reveal:** V3 structural/post-state conditions and B1's `payout <= effectivePool(pre)` are not algebraically identical. The concrete `EEV=500, unresolvedReserve=1, payout=500` example exposes the difference.
- **Claim:** Cardano requires ownership, signature, expiry and exact settlement-oracle evidence in addition to the economic liability delta.
- **Expire:** Cardano carries per-ticket `pdExpiresAt`; current V3 `Expire cid` is aggregate and therefore requires an explicit ticket-level refinement/evidence boundary.

### Architectural implication

These are not reasons to weaken either side. They are RF2/RF3/RF5/RF6/RF8/RF9 conformance obligations that must be represented explicitly.

### CI

A new Cardano Adapter run was triggered on commit `a53dcc6` and is currently queued. The Haskell kernel run is also queued. No passing result is claimed yet for the new P2.7 test or the Haskell bridge.

The repository still has the known frontend build failure class around Vite/node-fetch; this remains separate from the economic-state/refinement findings.

### Handoff

**Do not redo:**
- the state-boundary audit;
- the closed A1/A2/A3 economic policy decisions;
- the adapter-specific projection separation;
- the P2.7 test inclusion in CI.

**Next recommended action:**
- B5 owner: resolve the immediate executable-liquidity interface exposed by the Reveal counterexample.
- B6 owner: continue RF8 whole-program action enumeration and ticket-level Issue/Expire refinement.
- After B5 and these evidence bridges are in place, rerun the P2.7 differential lifecycle suite and close RF1–RF11 row-by-row where evidence supports it.

**Relevant commits:**
- `852c972b` move PRE-RICH projection out of Adapter
- `b1365439` clarify PRE-RICH ownership
- `87939eb0` update P2.7 test import
- `9696bbee` remove stale Adapter projection
- `079222a5` fix Adapter import in txHelpers
- `a53dcc6f` register V3/Cardano equivalence gaps

---

## 28. SESSION UPDATE — B6/RF9 CI verification and B5 handoff

**Date:** 2026-09-21

### Verified

- Cardano Adapter conformance workflow `35650580348`: targeted economic tests pass before the frontend build step.
- `cardano-execution-adapter.test.ts`: 4 tests pass.
- `immortal-reveal-conformance.test.ts`: 4 tests pass.
- P2.7 `immortal-cardano-adapter-conformance.test.ts`: all **14/14** node:test subtests pass when run under `npx tsx --test`.
- Dedicated PRE-RICH expiry refinement workflow `35650580458`: expiry refinement test step passes.
- The earlier P2.7 red result was a **test-harness mismatch** (Vitest interpreting a node:test file as an empty suite), not a semantic test failure. The workflow was corrected to run the file with `tsx --test`.

### Separate build failure

The same Adapter workflow still fails at `npm run build` because Vite browser-bundles Node-only dependencies pulled by `lucid-cardano` / `node-fetch`; the concrete Rollup error is `promisify` not exported by `__vite-browser-external` from `node-fetch/src/body.js`.

This is a frontend packaging/runtime boundary issue, not evidence that the economic conformance tests fail. It remains an independent repository-build front and is not silently marked green.

### B5 handoff

The current `PreRichEconomicAdmission` interface evaluates the candidate V3 state against one supplied EEV value. The canonical dependency chain requires explicit `Economic Delta → Candidate Post-State`, so the admission interface must eventually represent the **candidate post-transition EEV** (or an equivalently derived economic post-state) rather than assuming the pre-state EEV remains valid for every action.

This is a substantive B5 integration issue and is assigned to the existing B5 session; do not duplicate its implementation.

### RF9 / expiry policy

The ticket-level refinement boundary is now executable and green, but it intentionally does not choose the concrete PRE-RICH expiry horizon. `src/mint.ts` still contains the historical 365-day implementation placeholder. It remains non-canonical until PRE-RICH supplies an explicit declared deterministic expiry policy.

No universal expiry number was introduced by this work.
---

## 29. SESSION RESULT — RF9 / CI harness closure

**Result:** ticket-level expiry refinement evidence is green, and the P2.7 Cardano semantic suite is green when executed under its native `node:test` harness via `tsx`.

**Verified CI evidence:**
- `PRE-RICH Expiry Refinement Conformance` (`35650580458`) — expiry refinement test step succeeded.
- `Cardano Adapter Sale Conformance` (`35650580348`) — Vitest Adapter/reveal tests succeeded; P2.7 `tsx --test` execution succeeded with all 14 subtests; the workflow then failed only at frontend `npm run build`.
- P2.7 therefore has **14/14 semantic subtests passing**; the earlier red was a harness incompatibility, not a semantic regression.

**Frontend build issue:** Vite/Rollup fails while bundling Node-only modules pulled by `lucid-cardano` / `node-fetch`, specifically `promisify` from `node:util` in `node-fetch/src/body.js`. This is now classified as an independent `UI-BUILD`/packaging front; it must not be used to invalidate the economic conformance evidence, and it must not be hidden by removing the build step.

**Expiry policy boundary:** the technical ticket-level boundary is closed as implementation evidence; the concrete PRE-RICH horizon remains deliberately unresolved because current A1 canon does not supply a numerical policy. `src/mint.ts` still contains the historical 365-day placeholder and cannot be promoted to canonical behavior.

**B5 handoff:** `PreRichEconomicAdmission` still accepts a single EEV input for the candidate transition. The canonical chain requires explicit economic delta/post-state EEV. This remains owned by the active B5 session.

**Status:** B6 = PARTIAL / NEEDS-EVIDENCE; RF9 = IMPLEMENTATION TEST GREEN; UI-BUILD = OPEN.
---

## 30. SESSION UPDATE — P2.7 native test harness correction
**Finding:** P2.7 semantic subtests were passing under Vitest's transformed environment, but `tsx --test` failed because the file still imported `describe`/`it` from Vitest.

**Correction:** `src/__tests__/immortal-cardano-adapter-conformance.test.ts` now imports `describe` and `it` from `node:test` and uses `node:assert/strict`. This makes the extended semantic suite a genuine native Node test and removes the mixed-runner ambiguity.

**Expected result:** `npx tsx --test src/__tests__/immortal-cardano-adapter-conformance.test.ts` should execute all P2.7 subtests directly; the Adapter workflow continues to keep ordinary Vitest tests separate.

**Status:** verification pending on the current branch CI.

---

## 28. SESSION RESULT — B5 Economic Admission Bridge

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B5 — Economic Gate → Viability → Atomic Transition
**Result:** implemented the smallest typed PRE-RICH admission composition around the existing V3 structural transition, fail-closed PRE-RICH→universal projection, explicit verified EEV, Economic Gate and Viability witness. The universal Gate now additionally separates **EEV** from **immediately executable settlement liquidity** through two generic inputs: `availableExecutableLiquidity` and `requiredImmediateLiquidity`.
**Why:** B6 exposed a real Reveal boundary where V3 post-state solvency can hold while Cardano's pre-reveal executable pool is lower because the unresolved reserve remains ring-fenced. This is represented as an explicit execution-liquidity constraint, not as a new economic formula.
**Files changed:**
- `IMMORTAL/kernel/EconomicGate.hs`
- `PRE-RICH/profile/PreRichEconomicAdmission.hs`
- `plutus/test/EconomicAdmissionTest.hs`
- `plutus/pre-rich-plutus.cabal`
- `IMMORTAL/docs/V3-CARDANO-SEMANTIC-EQUIVALENCE.md`
- this coordination register
**Verified by tests in source:** insufficient EEV rejected; missing truth/freshness/obligation evidence rejected; insufficient immediate executable liquidity rejected; uncertified Ω successor rejected; invalid class/pre-state rejected; Reveal/Claim candidate state retains the expected liability/reserve semantics.
**CI status:** current branch CI was triggered after the latest changes; final Haskell/Cardano results are still pending. The earlier Adapter failures were fixture/runner synchronization issues and are being corrected without relaxing economic checks.
**Architectural boundary:** `transitionValid` remains structural; Economic Gate remains IMMORTAL authority; Viability remains distinct; Adapter remains evidence/realization layer.
**Status:** CLOSING — IMPLEMENTATION IN, EVIDENCE PENDING


---

## 29. SESSION UPDATE — A1 / B3 / B5 Evidence

**Date:** 2026-09-21
**A1 Expiry:** implementation boundary now removes the historical fixed 365-day calculation from `src/mint.ts`. The ticket mint accepts an explicit DApp/profile expiry policy plus an issuance-state snapshot and crystallizes `expiresAt = issuedAt + F_D(S_issuance)`. New `PRE-RICH/profile/PreRichExpiryPolicy.ts` and `src/__tests__/preRichExpiryPolicy.test.ts` provide deterministic state-derived policy evidence. RF9 CI run `35651359698` completed successfully.
**B3-D Replay:** canonical GameRules replay vector CI run `35651369735` completed successfully. The test now matches the exact `GameRules.hs` raw `[row,attempt] || seed` input.
**B5 Economic Gate:** Gate now carries explicit `availableExecutableLiquidity` and `requiredImmediateLiquidity`, distinct from EEV. PRE-RICH admission bridge composes structural transition → universal projection → Economic Gate → Viability. Haskell evidence is pending because the regression workflow is still progressing through toolchain setup; CI was also corrected to build blst using upstream `build.sh` rather than `make`.
**B6 Cardano:** P2.7 Adapter/semantic conformance has passed on recent runs; the Reveal counterexample is now represented explicitly as execution-liquidity evidence. B6 remains partial until action-by-action refinement and ticket-level Expire/Issue semantics are fully proven.
**B4:** no ProtectedCapital formula change introduced. The existing universal bridge remains additive and fail-closed.
**3D:** no implementation authority gap found in this pass; canonical pipeline remains economic state → certified NFT identity/state → renderer.
**Status:** MULTI-FRONT PROGRESS — A1 implementation evidence green; B3 replay evidence green; B5 implementation closing/evidence pending; B6 partial; B4 open.


---

## 30. SESSION UPDATE — Expire Refinement

**Front:** B6 — V3 ↔ Cardano Expire refinement
**Result:** added `PRE-RICH/profile/PreRichExpireRefinement.ts` and `src/__tests__/preRichExpireRefinement.test.ts`. The witness binds aggregate `Expire(cid)` to a concrete ticket only when class identity, canonical price, crystallized expiry boundary, one-ticket count delta and exact reserve release all agree.
**Boundary:** this is evidence/refinement only. It does not make V3 ticket-aware, does not grant arbitrary ticket-selection authority, and does not replace Cardano on-chain enforcement.
**CI:** the existing PRE-RICH Action Refinement workflow now runs both Issue and Expire refinement tests.
**Status:** CLOSING — local implementation committed; CI evidence pending.
---
## 31. SESSION CLAIM — B4 ProtectedCapital Preservation Subfront
**Session:** autonomous coordination session — 2026-09-21  
**Front:** B4 / PC-02 + PC-05 — transition-level ProtectedCapital preservation and disjoint component accounting  
**Scope:** formalize local arithmetic preservation properties only; do not change ProtectedCapital formula, Gate, viability, or application policy.  
**Current artifact:** `IMMORTAL/conformance/ProtectedCapitalConformance.hs` + `plutus/test/ProtectedCapitalConformanceTest.hs`.  
**Expected evidence:** successful V3 Issue/Reveal/Claim/Expire traces preserve the declared ProtectedCapital partition; Reveal delta is `payout - M×P <= 0`; Claim/Expire deltas are non-positive; partition rejects omission.  
**Status:** IN_PROGRESS


---

## 31. CI / Predeploy Gate Restoration

**Finding:** the branch had a real CI infrastructure regression: `package.json` referenced `scripts/predeploy-check.mjs`, but that file was absent from the branch. Library retained the complete historical B1 gate and prior Notion records document it as the established deployment tooling.

**Action:** restored the exact `scripts/predeploy-check.mjs` file from the Library artifact, rather than rewriting or weakening its checks.

**Result pending:** a new Cardano integration lab run is evaluating the restored gate. Earlier Yaci evidence already established:
- isolated Yaci devnet boot and sync;
- real Cardano ledger smoke transaction success;
- pure B1 invariant suite: 190 tests / 41 suites, 190 passed / 0 failed;
- resource audit and artifact upload success.

The previous failure was specifically `MODULE_NOT_FOUND: scripts/predeploy-check.mjs`.

**Status:** RESTORED / VALIDATION RUNNING

---

## 32. SESSION RESULT — R4 Liveness Boundary

**Result:** the R4 executable stall classifier now matches the normative FM1-FM10 precedence.

**Verified:** workflow `35652921847` succeeded on commit `d3fd63d709577f13db91a3e2d6e8b1e8c7c9dc30` after correcting two real test expectation/order defects:
- observed internal stall with inputs is classified as FM3 before `PROGRESS_AVAILABLE`;
- a certified state outside `K_c` is FM1;
- a certified state with no eligible action and no separate failure witness remains FM10 rather than being mislabeled FM1.

**Boundary:** this is an executable liveness-observability classifier. It does not prove L1-L4 for a deployment and does not claim IMMORTAL liveness universally.

**Status:** IMPLEMENTATION TEST GREEN.

---

## 33. SESSION RESULT — 3D Certified Ticket Boundary

**Result:** added `PRE-RICH/profile/PreRichCertifiedTicket.ts` as the certified persistent identity/state boundary and `src/ticket3d.ts` as a presentation-only interactive renderer.

**Verified semantics:** NFT identity is `(policyId, assetName)` and is checked against the authoritative PrizeDatum identity before a renderer state can exist. The renderer never computes authorization, payout, Reveal, Claim or Expire decisions. Terminal checks are time-explicit (`ticketTerminalAt(state, now)`).

**Important limitation:** the renderer is not yet wired into the production page shell. The on-chain NFT/datum remains the authoritative source; this change does not create a new persistence mechanism.

**Status:** BOUNDARY IMPLEMENTED / UI INTEGRATION OPEN.

---

## 34. SESSION RESULT — B3 Canonical Evidence Boundary

**Result:** added `poc/materios-checkpoint/src/canonicalEvidence.ts` and a dedicated deterministic test/CI boundary.

**Semantics:** each evidence packet binds chain ID, genesis hash, block hash/number, state root, storage key and authority commitment through a deterministic SHA-256 `anchorKey`. Finality and storage proof references are mandatory fields.

**Verified limitation:** the schema validates shape and tuple binding only. It does not claim cryptographic finality/storage-proof verification or publisher-independent Materios authenticity.

**Status:** IMPLEMENTATION BOUNDARY / CI VERIFICATION PENDING ON LATEST HEAD.

---
## 35. SESSION RESULT — B6 Issue Ticket-Level Refinement

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B6 — Issue ticket-level refinement
**Result:** added `PRE-RICH/profile/PreRichIssueRefinement.ts`, reusing the existing class-saleability evidence and adding ticket-level binding for canonical class price, explicit 100-subunit denomination, ticket identity, counter n→n+1, unresolved count/reserve deltas, Treasury economic price, Pending PrizeDatum state, zero pre-reveal outcome fields and BeaconPending state.
**Evidence:** current Cardano MintPolicy/B1PrizePool already enforce these properties on-chain; the refinement provides an off-chain conformance witness rather than a second authority.
**CI:** run `35654129336` — PRE-RICH Action Refinement Conformance — **SUCCESS**, including Issue/Expire refinement suite and TypeScript typecheck.
**Important:** the only failed predecessor fixture was corrected at the fixture level: for a 2-USDM class, a 1,000-subunit unresolved reserve becomes 1,200, not 1,100. No economic invariant was weakened.
**Remaining:** full B6 V3↔Cardano semantic equivalence, live-ledger evidence and Gate connectivity remain open.
**Status:** POSITIVE REFINEMENT EVIDENCE / FULL CONFORMANCE OPEN

---
## 36. SESSION RESULT — Certified 3D Ticket Integration

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** C6 / 3D certified persistent ticket
**Result:** wired the existing certified-ticket boundary into `src/main.ts` without creating a second economic state source. The shell now exposes a 3D container; after a successful ticket purchase it retains only the returned immutable asset ID, observes the corresponding on-chain `PrizeDatum`, converts the observed fields into `CertifiedTicketState` through `certifyTicketBinding`, and only then mounts `mountCertifiedTicket3D`.
**Files changed:** `src/gameFlow.ts`, `src/main.ts`, this coordination register.
**Architectural property:** renderer remains presentation-only. Reveal/Claim/Expire authorization is never derived from renderer-local state. A canonical refresh re-observes the current PrizeDatum and re-certifies it.
**Remaining:** 3D visual/UX evidence and full canonical NFT-state coverage remain open; if the ticket UTxO is not yet observable after submission, the UI reports canonical state unavailable and can refresh rather than inventing a state.
**Status:** IMPLEMENTED / CONFORMANCE EVIDENCE PENDING


---
## 37. SESSION RESULT — B6 Claim Ticket-Level Refinement

**Session:** autonomous coordination session — 2026-09-21 (follow-on)
**Front:** B6 — Claim ticket-level refinement
**Result:** added `PRE-RICH/profile/PreRichClaimRefinement.ts` and its conformance suite. The witness covers current owner identity, owner signature, Revealed→Claimed state transition, exact frozen payout-to-settlement equality, exact expiry validity boundary, pending-liability decrease, total-liquidity decrease, insufficient-funds rejection and explicit NFT retention.
**Evidence:** current `PrizeValidator.hs` performs the corresponding on-chain owner/expiry/exact-payout/pool checks; this refinement is a derived conformance witness, not a second economic authority.
**CI:** run `35654602066` — PRE-RICH Action Refinement Conformance — **SUCCESS**, including the complete action refinement suite and TypeScript typecheck.
**Resulting B6 coverage:** Issue + Claim + Expire ticket-level refinement positive evidence now exists. Reveal remains the major remaining ticket-level/ledger semantic-equivalence gap.
**Status:** POSITIVE REFINEMENT EVIDENCE / FULL CONFORMANCE OPEN

---
## 38. CURRENT CANON RECONCILIATION — Classic-6 / Game Economy

**Date:** 2026-09-21  
**Front:** PRE-RICH GameRules documentation/conformance

The current PRE-RICH Game Economy specification has been reconciled with the closed DEC-1 decision:

- Classic-6 = two independent canonical rows.
- Each row uses the exact 20,000-slot distribution 17,500 / 1,700 / 600 / 180 / 19 / 1.
- The five prize tiers are row-level tiers.
- Ticket payout = sum of both row payouts, capped at 500×P.
- The historical single-result 75% / 17% / 6% / 1.8% / 0.19% / 0.01% table is historical and non-canonical for current Classic-6 ticket-level outcomes.
- Exact current ticket-level distribution has an executable conformance test in `src/__tests__/preRich-gamerules-distribution.test.ts`.

This is a documentation/conformance reconciliation only. No closed economic policy was reopened.

---
## 39. CURRENT FRONT STATUS — B4/B5/B6/C6

- **B4 ProtectedCapital:** local arithmetic preservation evidence added; full authoritative provenance and live Cardano preservation remain OPEN.
- **B5 Economic Gate:** typed composition exists; runtime DApp submission is not yet a cryptographically verified Gate proof. Do not duplicate the kernel in TypeScript.
- **B6 Issue/Claim/Expire:** ticket-level refinement evidence is GREEN; full V3↔Cardano semantic equivalence remains OPEN.
- **B6 Reveal:** source-level row result binding is present on both DApp and PrizeValidator; differential ledger evidence remains OPEN.
- **C6 certified NFT/3D:** binding is implemented and the shell consumes observed on-chain NFT + PrizeDatum; renderer remains presentation-only.
- **R4 liveness:** executable FM1–FM10 classification is GREEN as bounded diagnostic evidence, not a liveness theorem.

---
## 40. CI ENVIRONMENT BLOCKER

The Haskell and Yaci workflows previously failed before actual regression execution because the pinned `blst` build output was located under the build directory rather than the repository root. The workflows were corrected to discover `libblst.a` by path instead of assuming a root location.

**Required evidence:** next current-head Kernel and Cardano Integration Lab run must pass native dependency setup and reach actual test/gate steps before any Haskell/Yaci claim is marked green.

---
## 41. CURRENT SESSION DELTA — B4 Direct Universal Bridge / C6 Renderer

**Date:** 2026-09-21

### B4 — legacy aggregate boundary
The legacy B1 economic path no longer needs to manufacture a synthetic V3 class record for aggregate ProtectedCapital/solvency evaluation. B1LegacyAdapter now exposes legacyB1ToUniversalEconomicState, lifting only quantities actually represented by the legacy datum and deriving the PRE-RICH 500x unresolved exposure from the aggregate reserve. B1PrizePool now uses this universal aggregate for worst-case exposure and solvency; local EffectivePool remains the explicit legacy accounting expression.

The reverse V3 -> legacy B1 path remains fail-closed for non-representable class composition and protected Jackpot/ProtectedCapital components.

A focused legacy-adapter test also proves equality of the representable ProtectedCapital boundary between a class-aware V3 state and the directly projected legacy aggregate. This is intentionally not claimed as full state equivalence.

**Current CI:** Cardano Adapter Sale Conformance on the preceding complete commit passed; the current-head Kernel Haskell regression remains the authoritative pending evidence for the new bridge.

### C6 — certified 3D ticket
certifyTicketBinding now requires a non-empty verification reference, so a synthetic datum cannot be promoted to a certified presentation state by omission of its observation trail. The 3D renderer also escapes all ticket-derived HTML fields, with a deterministic escaping regression test. These are presentation/evidence hardenings; the renderer remains non-authoritative.

### B6 semantic check — Claim
A current Notion decision-register lookup confirms that the V3 claim predicate is intentionally aggregate: Claim amount <= crystallised liability. Therefore this session does not change EconomicTransitionV3 to an exact-ticket payout model. Full V3/Cardano action equivalence remains an evidence/conformance task, not a reopened normative decision.

**Status:** B4 CLOSING / CI PENDING; C6 HARDENED / EVIDENCE PENDING; B6 FULL EQUIVALENCE OPEN.
---
## 41. STATE BOUNDARY — FIELD OWNERSHIP MATRIX

**Date:** 2026-09-21  
**Artifact:** `IMMORTAL/state/STATE-FIELD-OWNERSHIP.md`

The current rich `EconomicStateV3` is explicitly classified field-by-field:

- liabilities, SafetyCapital, ReserveProtection and MandatoryFutureCosts are universal economic primitives;
- unresolved reserve/count are universal aggregates with application/profile-derived provenance;
- TicketClassState, activation history/control and Jackpot lifecycle are PRE-RICH/profile-shaped;
- only universally meaningful protected amounts may cross the projection boundary as aggregate protected capital.

**Rule:** no big-bang V3 refactor. Consumers should migrate incrementally to `UniversalEconomicState`; V3 remains the rich compatibility/refinement representation until action-by-action equivalence exists.

**Status:** DOCUMENTED / REFACTOR GUARDRAIL

---
## 42. FINAL TRANCHE — B5 pre/post EEV

PRE-RICH economic admission now distinguishes `preEEV` from `candidateEEV`. The Economic Gate evaluates `candidateEEV` against the candidate post-state; the pre-state EEV is retained only for evidence/reconciliation and is fail-closed if negative.

Tests explicitly demonstrate a valid Reveal with pre-state EEV 500 and candidate-state EEV 501.

**Status:** IMPLEMENTATION CORRECTED / HASKELL EVIDENCE PENDING

---
## 43. FINAL TRANCHE — Classic-6 exact distribution

`GAME-ECONOMY.md` is reconciled with DEC-1 Classic-6: two independent 20,000-row domains, row-level five winning tiers, ticket-level sum capped at 500×P. The exact 400,000,000-pair distribution is tested independently.

**Status:** DOCUMENTATION + MATHEMATICAL CONFORMANCE TEST READY

---
## 44. FINAL TRANCHE — RF8 and 3D security

RF8 now has a source-level regression preventing direct `signTx/submitTx` calls in `src/` outside the single approved submission helper. `ticket3d.ts` escapes all canonical data before DOM insertion and has dedicated security tests.

**Status:** BOUNDED IMPLEMENTATION EVIDENCE GREEN

---
## 45. CURRENT SESSION RESULT — B6 Reveal payout binding
**Date:** 2026-09-21
**Front:** B6 — V3 ↔ Cardano Reveal ticket-level refinement

The Reveal refinement gap identified during cross-session audit is now closed at the witness boundary without changing economic policy.

Canonical sources triangulated:
- `src/gameRules.ts` computes ticket payout as the sum of both row payouts, capped at `500 × P`.
- `plutus/GameRules.hs` independently implements the same `rowPayoutTotal` rule.
- `plutus/PrizeValidator.hs` derives `row1Tier`, `row2Tier`, computes `amountUsdm = rowPayoutTotal ...`, and requires the continuing PrizeDatum payout to equal that amount.
- Classic-6 reconciliation in this register already records the same ticket-level rule.

Change:
- `PRE-RICH/profile/PreRichRevealRefinement.ts` now carries `row1PayoutSubunits` and `row2PayoutSubunits` and requires `prizeAmountSubunits = min(row1Payout + row2Payout, 500 × price)`.
- `src/__tests__/preRichRevealRefinement.test.ts` now covers sum binding and exact cap behavior.

Important boundary:
- `prizeTier = max(row1Tier,row2Tier)` remains a summary/classification field; it is no longer implicitly treated as the payout calculation.
- No change was made to IMMORTAL economics, EconomicStateV3, EffectivePool, Jackpot semantics, or the 500× rule.

**Commit:** `0e03526297b1e3f8fbf4c7135c85cd7b2b732b77`
**Status:** REFINEMENT LOGIC CORRECTED / CI EVIDENCE PENDING


---
## 46. CURRENT SESSION RESULT — RF10/RF11 Transition Evidence Binding

**Date:** 2026-09-21
**Front:** B6 — RF10 atomicity / RF11 determinism-history evidence boundary

### Triangulated finding
Current Notion conformance material requires economically material atomic realization to be bound to the canonical pre-state and post-state, while the existing `EconomicObservation` schema intentionally remains an observation of canonical state and must not be treated as proof of atomic realization by itself.

The current branch already provides deterministic V3 transition functions and Cardano→V3 replay tests, including exact post-state equality and mutation rejection. The remaining evidence gap was the explicit identity binding between:

`canonical action + pre-state + post-state + concrete settlement transaction`.

### Change
Added:
- `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts`
- `src/__tests__/canonical-transition-evidence.test.ts`

The new evidence-only envelope requires non-empty:
- EvidenceId
- FixtureId
- ActionClass
- ProtocolVersion
- ProfileVersion
- AdapterId / AdapterVersion
- Environment
- pre-state fingerprint
- post-state fingerprint
- action fingerprint
- TransactionRef

This does **not** validate economics, replace the Economic Gate, or claim atomicity merely because the envelope exists. It provides the missing auditable binding required to correlate a candidate canonical transition with its concrete settlement realization.

The existing `EconomicObservation` remains unchanged and retains its narrower role as state observation.

### Commits
- `e760dbf5528e5f31296c25abe9e23993e5e3fb46` — evidence envelope
- `53705b9d7b547eb475c5eb4e1a3034639645abcb` — conformance tests
- `7a0e1b656be3d1d144e6dc9b0ee3a82199cd4668` — CI workflow binding

### Status
- RF11: **IMPLEMENTATION BOUNDARY / TEST ADDED / FULL EVIDENCE OPEN**
- RF10: **PARTIAL / NEEDS-EVIDENCE** — identity binding now exists, but this is not yet proof that Cardano realization is indivisible under concurrent/stale-state execution.

### Do not redo
Do not modify `EconomicTransitionV3`, ProtectedCapital, EconomicGate, EffectivePool, Jackpot policy, or Cardano validator economics for this front. The next evidence step is to populate this envelope from an actual settlement trace and prove rejection of stale/duplicate realization, not to add another economic rule.


---
## 47. ARCHITECTURE REALITY AUDIT — current-head snapshot

**Date:** 2026-09-22  
**Head verified by latest CI:** `2f23bd6fd260e8b8cf8b8e40775baaed71fc200e`  
**Purpose:** distinguish architectural design claims from demonstrated execution/generalization. No economic canon changed.

### Classification rule

- 🟢 **LIVE / ENFORCED** — participates in the concrete Cardano economic path or is enforced on-chain.
- 🟡 **LIVE / INDIRECT** — consumed through a real boundary but not itself the final execution authority.
- 🔵 **IMPLEMENTED / VERIFIED / NOT RUNTIME-CONSUMED** — code and tests exist, but no current production path was established as consuming it.
- 🟠 **DESIGN / PROTOTYPE** — specification or proof-of-concept without current end-to-end execution evidence.
- ⚪ **ORPHAN / CANDIDATE** — no demonstrated consumer after the required source audit.

### Findings

| Component | Evidence on current branch | Classification | Conclusion |
|---|---|---|---|
| `EconomicKernel` / V3 class exposure | `B1PrizePool.hs` and transition/conformance code consume it; PRE-RICH class/profile semantics are explicit | 🟢 | Real, but application-shaped; not evidence of a second independent application. |
| `UniversalEconomicState` | Projected from V3 by `PreRichEconomicProjection.hs`; projection has dedicated conformance tests | 🔵 | Real compatibility/conformance boundary, not yet the canonical runtime state. |
| `UniversalEconomicKernel` | Used by B1 through the legacy aggregate projection and by projection/admission tests | 🟡 | It has a real Cardano validator consumer for aggregate safety, but its full semantic role is still narrower than the architectural model. |
| `EconomicGate` | Consumed by `PreRichEconomicAdmission.hs`; dedicated `EconomicAdmissionTest` exercises it | 🔵 | Implemented and tested, but no evidence in the current DApp/Cardano transaction path shows that production submission invokes this gate. |
| `PreRichEconomicAdmission` | Explicit structural → projection → Gate → viability witness exists | 🔵 | Conformance/admission witness, not demonstrated as runtime transaction authority. |
| Cardano Adapter submission boundary | `mint.ts` submits through `createCardanoExecutionAdapter`; other transaction paths use `signAndSubmitTx` | 🟢 | Submission/signing boundary is concretely centralized; transaction construction remains partly in DApp code. |
| Cardano validator solvency | B1 checks post-state solvency for Issue/Reveal/Claim/Expire | 🟢 | Concrete economic enforcement exists independently of the off-chain Gate interface. |
| Jackpot | Present in PRE-RICH/V3/Cardano accounting and policy | 🟢 | Application policy is real; it must not be advertised as universal IMMORTAL state semantics. |
| Second adapter/application generalization | Bitcoin workflow exists as design work only; no second end-to-end conformance path is established | 🟠 | Chain/application neutrality remains a design property, not an empirically demonstrated generalization. |

### Architectural conclusion

The audit does **not** justify collapsing IMMORTAL / Adapter / PRE-RICH. It does justify stopping further abstraction growth until the existing boundaries are connected to demonstrated execution.

Public wording should distinguish:

> IMMORTAL is designed as a chain-neutral economic layer. Current end-to-end implementation and evidence are demonstrated through PRE-RICH on Cardano; broader generality remains an architectural property to be validated through additional adapters or applications.

The immediate engineering priority is therefore **connectivity and evidence**, not another universal rewrite:

1. enumerate every economically material Cardano commit path;
2. determine which paths actually consume `EconomicGate`/admission versus relying directly on validator predicates;
3. close B4/B5/B6 evidence at those real boundaries;
4. only then decide whether any universal module is genuinely redundant.

This audit does not reopen KA/KC/KD, ticket ladder, 500×, Jackpot ownership, expiry semantics, or any other closed economic decision.

### Current CI evidence

- Cardano Adapter Sale Conformance run `35661171376`: **SUCCESS**.
- PRE-RICH Action Refinement run `35661171411`: **FAILURE**, one fixture invariant defect; all other 70 tests passed. The mismatch fixture now aligns `pendingLiabilityAfter` with the intentionally altered payout (`850`) so the test reaches the payout-sum assertion rather than failing first on crystallized-liability accounting.
- Kernel Invalid-Class run `35661171407`: native dependency setup reached the real Haskell suite, but the suite failed at Cabal invocation (`Cabal-7107`); this is no longer the previous missing-`libblst.a` setup failure.
- Cardano Integration Lab run `35661171386`: still blocked in native Plutus dependency setup before Yaci/devnet execution.

**Status:** REALITY AUDIT COMPLETED / CONNECTIVITY EVIDENCE REMAINS OPEN.


---
## 48. CI INFRASTRUCTURE DELTA — Plutus native dependency closure

**Date:** 2026-09-22

The latest Kernel and Cardano Integration Lab runs reached the actual dependency resolver. The prior `blst` setup problem is therefore closed as a setup-path issue. The next concrete failure was explicit:

`cardano-crypto-class:+secp256k1-support` was rejected because `libsecp256k1-any` was absent from pkg-config.

### Surgical fix

Added `libsecp256k1-dev` to the native dependency installation of:

- `.github/workflows/kernel-invalid-class-fail-closed.yml`
- `.github/workflows/immortal-cardano-lab.yml`

No Haskell source, economic formula, test invariant or validator logic changed.

Commits:
- `2d9d6db178f2f070ad216c3198a0df2060d1551c` — Kernel workflow
- `2806e4d612cbd6cd2eca6a1dd0a7f436c246a127` — Cardano Integration Lab workflow

**Expected next evidence:** the next runs must pass native dependency resolution and reach the actual Haskell/Yaci tests. Only then can any regression or ledger result be classified.

**Status:** INFRASTRUCTURE FIX APPLIED / CI EVIDENCE PENDING.


---
## 48. CURRENT SESSION RESULT — Economic Admission connectivity audit

**Date:** 2026-09-22  
**Front:** B5/RF8 — runtime connectivity, no economic changes

### Verified current Cardano commit paths

The current TypeScript paths were inspected directly on the active branch:

- `src/mint.ts` constructs the serial sale transaction and submits through `createCardanoExecutionAdapter`.
- `src/gameFlow.ts` constructs SyncBeacon/Reveal/Claim transactions and routes submission through `signAndSubmitTx`.
- `src/registryFlow.ts` constructs BeaconReady publication and routes submission through `signAndSubmitTx`.
- `src/createRound.ts` constructs BeaconPending creation and routes submission through `signAndSubmitTx`.
- `src/txHelpers.ts` is the centralized `signAndSubmitTx` boundary and delegates to `CardanoExecutionAdapter.submit`.

No direct `signTx`/`submitTx` side door was found in these inspected paths.

### Important connectivity finding

`PRE-RICH/profile/PreRichEconomicAdmission.hs` composes:

`structural transition → PRE-RICH projection → EconomicGate → Viability`

but the inspected TypeScript transaction construction/submission paths do not demonstrate invocation of this admission witness before transaction submission.

Therefore the correct current classification remains:

- EconomicGate / PreRichEconomicAdmission: **implemented + conformance-tested, runtime consumption NOT demonstrated**.
- Cardano validator predicates: **concrete economic enforcement** on the actual transaction path.
- Submission boundary: **concretely centralized**.

This is an evidence/connectivity gap, not evidence that the Gate is redundant and not a reason to duplicate or move economic rules into TypeScript.

### Next action

Close the gap by tracing one economically material action end-to-end (preferably Reveal, because B6 evidence already exists): identify the canonical admission witness inputs, concrete Cardano transaction, resulting transaction reference, pre/post state fingerprints, and verify that stale/duplicate realization cannot create a second economic effect.

Do **not** change `EconomicGate`, `EconomicTransitionV3`, ProtectedCapital, EffectivePool, Jackpot policy, or validator economics merely to force architectural symmetry.


---
## 49. CURRENT SESSION RESULT — RF10/RF11 stale/duplicate evidence verifier

**Date:** 2026-09-22  
**Front:** B6 — transition realization evidence

Notion checkpoint confirms the intended convergence:
`PRE-RICH action → V3 transition → Economic Gate/Viability → Cardano Adapter → on-chain revalidation → atomic realization`, with stale references explicitly identified as a remaining evidence concern. The Cardano settlement model also relies on transaction-level UTxO consumption for atomic realization.

### Minimal evidence-only closure step

Extended `Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts` with:
- `assertCanonicalTransitionBinding`: exact equality binding of action fingerprint, canonical pre-state fingerprint, canonical post-state fingerprint and concrete transaction reference;
- `assertUniqueCanonicalTransitionRealizations`: rejects duplicate evidence IDs and duplicate settlement transaction references inside an evidence set.

Extended `src/__tests__/canonical-transition-evidence.test.ts` with:
- valid canonical binding acceptance;
- stale action rejection;
- stale pre-state rejection;
- duplicate transaction realization rejection;
- duplicate evidence identity rejection.

This remains an **evidence verifier**, not an economic gate and not a second transaction validator. It does not claim to prove Cardano execution by itself. The remaining proof is to feed these checks with a real Yaci/ledger Reveal trace and demonstrate the same transaction cannot be realized twice because the concrete consumed UTxOs have already been spent.

**Commits:**
- `438681e5dffe6b12e336781756a44e565e122523` — verifier implementation
- `c5721d3483d0c6fa43cbc19e04cd0dfe6bbf8126` — stale/duplicate tests

**Status:** RF10/RF11 — evidence verifier strengthened; real-ledger realization proof still OPEN.


---
## 50. CURRENT SESSION RESULT — RF10/RF11 real Yaci Reveal trace

**Date:** 2026-09-22  
**Front:** B6 / RF10 / RF11 — execution-backed Reveal realization

### Triangulation completed

Before changing the integration lab, the current branch was checked against:
- src/gameFlow.ts — existing canonical Reveal transaction shape;
- plutus/PrizeValidator.hs — Reveal checks commitment, beacon derivation, expiry, payout, and PrizeDatum continuation;
- plutus/B1PrizePool.hs — Reveal consumes the singleton Pool UTxO and enforces exact reserve/liability/count deltas plus pre-reveal effective-pool affordability;
- src/__tests__/immortal-prerich-reveal-transaction-fixture.test.ts — existing P2.8 fixture;
- src/__tests__/immortal-reveal-conformance.test.ts — canonical projection/conformance;
- Notion pages 09 / 23 and the 2026-09-21 Multi-Front Checkpoint — real-ledger evidence is required and must not be replaced by the fixture/emulator;
- the coordination register — next step explicitly identified as a real Yaci Reveal trace.

No economic rule was changed.

### Change

Added:

- audit/cardano-integration/reveal-ledger-trace.ts

The lab now bootstraps the minimum test state and performs a real Cardano transaction containing both:
1. PrizeValidator Reveal;
2. B1PrizePool TicketRevealed.

The trace records:
- bootstrap transaction reference;
- real Reveal transaction reference;
- consumed Prize and B1PrizePool UTxOs;
- produced continuing UTxOs;
- pre/post canonical fingerprints;
- action fingerprint;
- payout and both row tiers;
- result;
- full signed transaction CBOR;
- Yaci transaction UTxO response;
- CanonicalTransitionEvidence;
- replay attempt using the same already-consumed signed transaction and its rejection.

The bootstrap uses wallet-controlled native assets only as test identities for the ticket/pool/liquidity fixture. It is explicitly not a production token/economic definition.

### Workflow

.github/workflows/immortal-cardano-lab.yml now executes the real Reveal trace immediately after the existing ledger smoke transaction.

### Commits

- b2c468609cf8eeef37d563191f898fad3ddd970e — real Reveal trace
- f5a71bcc2889be4c16a48db74473520f8f20431d — execute Reveal trace in Cardano lab

### Evidence status

Implementation is present. **Ledger evidence is still PENDING until the current-head GitHub Actions run completes successfully.**

If the trace fails, classify the failure as fixture/infrastructure/validator compatibility and repair without weakening invariants.

### Handoff

Next session should:
1. observe the new Cardano Integration Lab run on the current head;
2. inspect any failure before changing code;
3. if successful, verify reveal-transition.json contains the real transaction/UTxO/replay evidence;
4. promote RF10/RF11 only to the level actually demonstrated;
5. continue B4/B5/B6 without reopening closed economics.

---

## 50. CURRENT SESSION RESULT — Coordination handoff / green-closure re-observation

**Date:** 2026-09-22  
**Front:** cross-session coordination → B4/B5/B6/C3/C4/C5/C6

This entry is an operational handoff only. No normative economic decision was changed.

### Current branch/head observed

Working branch remains `work/immortal-green-closure`.

Current branch head at coordination write: `a5587ee683afdb8c7bc44f0ee9dae91bfcb3025a`.

### Re-observed CI after the latest cross-session corrections

- **PRE-RICH Action Refinement Conformance:** GREEN on commit `c3358bf3963b4a06e37c75033e51d404b20d42ae`:
  - 10 test files passed;
  - 73/73 tests passed;
  - TypeScript typecheck passed.
- The final Action Refinement correction was not an economic change:
  - the reveal-cap positive fixture was given sufficient pre-reveal liquidity;
  - the RF8 source-boundary test replaced `String.replaceAll` with equivalent `split().join()` to match the configured TypeScript target.
- **Cardano Adapter Sale Conformance:** GREEN on the current observed head before/around this handoff.
- **Kernel Invalid-Class Fail-Closed Audit:** running through the Haskell/native dependency setup after the `blst` and `libsecp256k1` infrastructure corrections. No green claim until the actual regression suite completes.
- **IMMORTAL Cardano Integration Lab:** progressing through the Haskell/native setup toward Yaci/devnet. No green claim until the actual ledger path, resource audit and gates complete.

### Cross-session instruction

The coordination file remains the shared anti-regression register.

Before modifying any overlapping artifact:

1. read the latest coordination snapshot;
2. verify the current branch head;
3. verify the current file blob SHA;
4. classify the change against canonical Notion/specification sources;
5. make the smallest reversible change;
6. wait for the corresponding evidence/CI;
7. append the result here.

Do not overwrite another session's newer work from a stale snapshot.

### Current green-closure priority

Do not create another abstraction layer.

Priority order remains evidence/connectivity:

1. finish Kernel native/Haskell regression evidence;
2. finish Cardano/Yaci real-ledger evidence;
3. use the real Reveal trace to populate RF10/RF11 canonical transition evidence;
4. close the B4/B5/B6 gaps only where the concrete execution path proves them;
5. then advance C3/C4/C5/C6 using real ledger evidence rather than test-only witnesses.

### Explicit non-regression guardrail

The following remain closed and must not be reopened merely to obtain green CI:

- KA/KC/KD;
- PRE-RICH ticket ladder;
- PRE-RICH 500× payout ceiling;
- Jackpot application ownership and current funding semantics;
- state-derived DApp/profile expiry horizon;
- liability-first accounting;
- ProtectedCapital / RawSurplus semantics;
- two-row Classic-6 result preservation;
- RF8 adapter submission boundary.

A failing fixture must be corrected when it contradicts the already-established canonical invariant; an implementation must be changed only when the authoritative semantic evidence requires it.

### Handoff to the other session

The next session may continue directly from this entry. In particular, do not redo the Reveal refinement audit: the suite is already green at 73/73 + typecheck. Focus instead on the still-unproven execution boundary and real-ledger evidence.

**Status:** COORDINATED / ACTION REFINEMENT GREEN / LEDGER + HASKELL EVIDENCE PENDING.


---
## 51. CURRENT SESSION DELTA — real Reveal now crosses the Cardano Adapter

**Date:** 2026-09-22  
**Front:** B5 / B6 / RF8 / RF10 — execution boundary correction

The real Reveal trace was refined so that the economically material first submission no longer calls Lucid submission directly.

The trace now:
- builds the existing PrizeValidator + B1PrizePool Reveal transaction;
- passes the completed transaction through createCardanoExecutionAdapter;
- records the adapter-returned transaction reference;
- retains the signed transaction only for the explicit stale/duplicate replay test;
- submits that same signed transaction directly only for the replay attempt, after the original UTxOs have already been consumed.

This preserves the architectural distinction:
- normal realization → Cardano Adapter;
- replay probe → deliberate direct stale transaction submission to demonstrate ledger rejection.

No economic logic changed.

**Commit:** 77c753753f4cabe3c4471a22cef8180ec18e33a4

**Status:** implementation corrected; current-head CI/evidence pending.

**Handoff:** observe the Cardano Integration Lab triggered by this change before any further modification.

### 2026-09-22 — RF10/RF11 implementation correction

The real Reveal trace was additionally corrected to use the repository's existing CardanoExecutionAdapter for the first economically material submission. The Lucid 0.10 constructor was corrected to Lucid.new.

Latest trace commit:
- 77c753753f4cabe3c4471a22cef8180ec18e33a4 — Adapter-bound submission
- 305a77fd9716819bba3a7c5e4d0ba5d29cb9e1fe — Lucid 0.10 constructor correction

Current Cardano Integration Lab run: 35662771118 — PENDING.
No RF10/RF11 green claim is made until this run executes the trace and produces the expected evidence artifact.


---
## 52. 2026-09-22 — Cardano Lab blst working-directory correction

**Front:** C4 / RF10 / RF11 / infrastructure evidence

The latest Cardano Integration Lab run on `15ccb06c2d0ee25112c25e9ed814e2b9fd4e9391` reached the native dependency step and failed because `/tmp/blst/build.sh` was invoked from the repository root while the generated `libblst.a` was subsequently searched for under `/tmp/blst`.

This was an infrastructure-only failure, not an economic or ledger-semantic failure.

The Kernel workflow already used the correct isolated working directory. The Cardano Lab workflow was corrected to execute:

```
(
  cd /tmp/blst
  ./build.sh
)
```

and retain the existing verification that a non-empty `/tmp/blst/libblst.a` is produced.

**Commit:** dfe5fe5f0c3113d73ea24671ffaa4d9a4cef1867

Fresh workflows were triggered from that commit:
- IMMORTAL Cardano Integration Lab: 35663204233
- Cardano Adapter Sale Conformance: 35663204402
- Kernel Invalid-Class Fail-Closed Audit: 35663204486

The Sale Conformance workflow is GREEN on the corrected head. Kernel and Cardano Lab are executing their fresh attempts.

**Status:** infrastructure correction applied; real-ledger/Haskell evidence still pending.

**Non-regression:** no economic parameter, invariant, adapter authority boundary or canonical policy changed.

---
## 53. 2026-09-22 — A2/A3 Jackpot activation boundary correction

**Front:** PRE-RICH Jackpot activation / B5-B6 boundary

Triangulation was performed against the current Notion A1/A2/A3 policy closure and the live working-branch Cardano/V3 implementation.

### Finding

The Cardano-side helper previously encoded:

`jackpotActive = effectivePool >= ppJackpotThreshold`

That scalar threshold comparison is **not** the current A2 activation semantics. A2 requires the PRE-RICH state-derived stable-ladder condition:
- current active class = highest class ever activated = top PRE-RICH class;
- existing activation predicate satisfied;
- top class not suspended;
followed by A3 funding eligibility only when the state-derived funding need is positive and the Economic Gate accepts.

The obsolete helper was not used as validator authorization, but retaining it created a misleading alternate activation rule.

### Surgical correction

Removed the unused `jackpotActive` helper from `plutus/B1PrizePool.hs`.

Removed the obsolete threshold-based activation tests from `src/__tests__/b1-invariants.test.ts` and retained the actual accounting invariant that locked Jackpot liquidity reduces `effectivePool`.

Added:
- `PRE-RICH/profile/PreRichJackpotActivation.ts`
  - `isPreRichJackpotStableLadder`
  - `preRichJackpotFundingNeed`
  - `isPreRichJackpotFundingEligible`
- `src/__tests__/preRichJackpotActivation.test.ts`
  - top-class/current-vs-highest checks;
  - activation/suspension predicate composition;
  - minimum shortfall funding calculation;
  - Economic Gate requirement;
  - negative-value fail-closed checks.

The new boundary is deliberately a **PRE-RICH policy/conformance witness**. It does not introduce a new IMMORTAL economic authority, a new scalar maturity threshold, or a fixed Jackpot allocation rate.

### Documentation correction

Updated `plutus/Types.hs` so `ppJackpotThreshold` is described as a state-derived PRE-RICH floor/target and explicitly **not** a standalone activation authorization.

### Commits created

- `4bf1e5856cf8079064b935cbe7cfc75afa4da31f` — remove obsolete Cardano activation helper
- `b0b4b97449be0af4caa77f7d0e9d9d9498769ac5` — remove obsolete threshold activation tests
- `6a2c35b34e83c52a8d9551f06ccb9f815a3723bf` — add PRE-RICH activation policy boundary
- `e8368e52a0fdc136b7ef60ce129ee15d9d253d1f` — add activation policy tests
- `354035fc87b17a5c125c2a5e231ca1fce2dcdb02` — clarify on-chain threshold field semantics

### Evidence status

No CI green claim is made for this delta. The latest previously observed infrastructure runs (`35663204233`, `35663204402`, `35663204486`) had the Integration Lab and Kernel audit cancelled while the Sale Conformance run completed successfully; subsequent pushes may have superseded those runs.

### Remaining gap

The new policy boundary is not itself runtime transaction authority. The remaining proof is to connect the authoritative PRE-RICH class-control/hysteresis state and the canonical Economic Gate to the actual Jackpot funding transition, then prove the same conditions at the Cardano realization boundary.

**Status:** A2/A3 policy semantics represented without duplication; implementation/conformance remains open.

---
## 54. 2026-09-22 — B4 / G7 closure deltas

**Front:** B4 ProtectedCapital / G7 canonical result typing

### B4 evidence delta

Added a non-zero protected-state projection case to `plutus/test/ProtectedCapitalConformanceTest.hs`.

The fixture carries non-zero:
- crystallized liabilities;
- unresolved reserve/count;
- derived worst-case exposure;
- SafetyCapital;
- ReserveProtection;
- MandatoryFutureCosts;
- locked Jackpot protection.

The test verifies that `projectPreRichState` preserves each component into `UniversalEconomicState` and that `projectionBoundaryEquivalent` remains true at a solvent EEV snapshot.

This is evidence only. No ProtectedCapital formula, transition rule or legacy compatibility rule changed.

**Commit:** `5d0a5a44782c3eceff6ebcea8a0ccdbe685ee1ea`

### G7 typed result delta

The existing Reveal return object already carried both independent row tiers and the ticket-level summary. It is now named explicitly as `Classic6RevealResult` in `src/gameFlow.ts`, documenting that:
- `row1Tier` and `row2Tier` are the preserved independent row results;
- `tier` is only the legacy summary `max(row1Tier,row2Tier)`;
- `prizeAmount` remains the established capped USDM sub-unit payout.

No API shape or economic value changed.

**Commit:** `bb78069af2ecda25fbcc033d8557f8dacd88a59a`

### Expiry re-observation

Current `src/mint.ts` no longer supplies a fixed 365-day duration. It requires the DApp/profile expiry policy plus the authoritative issuance-state snapshot and crystallizes `expiresAt` through `crystallizeTicketExpiry`. The 365-day value remains historical test/provisional evidence only.

### Evidence status

These commits have not been granted a CI-green claim by this coordination entry. The available workflow connector does not enumerate all branch-push runs, and previously observed fresh runs included cancelled Kernel/Cardano attempts. New evidence must be observed on the resulting head.

**Status:** B4 evidence strengthened / G7 type boundary explicit / CI and live-ledger evidence still open.

---
## 55. 2026-09-22 — C3 EXPIRE end-to-end implementation boundary

**Front:** C3 / P0 liveness / Cardano realization

Triangulation against the current Decision Register and T2 confirms the canonical EXPIRE semantics:
- expiry is deterministic from the ticket's crystallized `expiresAt`;
- invocation is permissionless at/after the boundary;
- the Pending `PrizeDatum` is consumed;
- no continuing PrizeDatum is created;
- unresolved reserve/count are released exactly once;
- pending liabilities are unchanged;
- the ticket NFT is not required to be burned and remains independently transferable/collectible.

### Implementation

`plutus/Types.hs`
- added `Expire` as constructor index 3;
- existing `SyncBeacon=0`, `Reveal=1`, `Claim=2` remain unchanged.

`plutus/PrizeValidator.hs`
- added `expireAtOrAfter` using the transaction validity lower bound;
- added `validateExpire`;
- requires exactly one Prize script input, Pending status, zero payout, positive price, and lower bound >= `pdExpiresAt`;
- requires no continuing PrizeValidator output;
- cross-validates the B1PrizePool input/output and exact reserve/count decrement;
- no liability or total-liquidity change is permitted;
- wired `Expire -> validateExpire`.

`plutus/B1PrizePool.hs`
- `TicketExpired` now derives the release from the consumed PrizeDatum input, not from a continuing PrizeDatum output;
- preserves locked Jackpot/floor/suspended-class state;
- enforces pool binding and exact deterministic reserve release.

`src/gameFlow.ts`
- added `expireRedeemer`, `b1ppTicketExpiredRedeemer`, and permissionless `expirePrize`;
- client validates Pending state, expiry and pool accounting before building the transaction;
- binds `validFrom(expiresAt)`;
- returns only the Prize UTxO's ADA execution collateral and fails closed if unexpected non-ADA assets are present;
- exports `expirePrize` through the module's public flow.

`scripts/predeploy-check.mjs`
- added structural checks for the canonical EXPIRE action, validator entrypoint, consumed-input semantics, and client lower-bound binding.

### Ledger evidence

Added `audit/cardano-integration/expire-ledger-trace.ts` and connected it to `.github/workflows/immortal-cardano-lab.yml`.
The trace bootstraps an already-expired Pending ticket and pool on isolated Yaci, then:
1. submits EXPIRE through `createCardanoExecutionAdapter`;
2. verifies the Prize UTxO is consumed with no replacement;
3. verifies pool total liquidity and liabilities are unchanged;
4. verifies unresolved reserve and count each release exactly once;
5. verifies the ticket NFT remains quantity 1 in the holder wallet;
6. submits the stale signed transaction again and requires ledger rejection;
7. writes `audit/yaci-evidence/expire-transition.json`.

### Commits in the C3 chain

- `0aadde354c9504513f60428835ca17844a56e1ab`
- `8c8c4f0342bcad8b06561b340b657e06dc1a9b9f`
- `d4c09139edeb2f2534fe929483c7ede9958eedc0`
- `439fdb27ad2f57a7900a279273bb619c07ebac01`
- `bd19911a4002e3456a0693f2c98b34eb0a3d57f4`
- `b3873b27b5c5042f5fffdb2c6259e6cb98f960a2`
- `45e488615399dcbe07c26a7b29d11a0410a47798`
- `cc9ff690349f732acfcbbe4b28961917e6b34e00`
- `72b0471c937d2ef5e2f1367d11634caa4a76a090`
- `cb03fb78cb96682de25301aebff1514f6857442e`
- `6a510ad1657bcdc593939d8bfb10618ffc84df50`

### Concurrent-session note

The parallel session subsequently advanced the branch to `c5bca57710ea86d63377749584b2bb9ced26f3e2` to remove a redundant Haskell setup from the Cardano Lab workflow. The current tree still contains the EXPIRE implementation and trace.

### CI status at this checkpoint

On `c5bca577...`:
- Cardano Adapter Sale Conformance run 35664137869: completed successfully;
- IMMORTAL Cardano Integration Lab run 35664137894: pending at observation time;
- Kernel Invalid-Class Audit run 35664137870: pending at observation time.

No C3 green claim is made until the lab executes the new EXPIRE trace and produces the expected evidence artifact.

**Status:** C3 implementation boundary closed at source level; on-chain conformance evidence pending.


---
## 56. 2026-09-22 — CI build/lab corrections and current evidence

**Front:** Kernel regression / C3-C4 / cross-session coordination

### Kernel regression finding
The first post-toolchain Kernel regression reached project compilation and exposed three concrete build defects:
- `IMMORTAL/state/EconomicProfile.hs` used `map` under `NoImplicitPrelude`;
- `IMMORTAL/governance/GovernanceCommitment.hs` imported modules from packages not declared by `pre-rich-plutus.cabal`;
- `IMMORTAL/governance/GovernanceAuthorization.hs` had an ambiguous `rulesetVersion` selector.

Surgical fixes were applied:
- `profileClasses` now uses explicit recursion;
- `bytestring`, `base16-bytestring`, `text`, and `cryptohash-sha256` are declared in the library dependencies;
- the governance event's `rulesetVersion` selector is explicitly qualified.

Commits:
- `b5f20aa616b2348db389ec45ea5c071f89d6a0ea`
- `3a115acb795ff307b6d004f8d43b313b7c6b3681`
- `8a0a3775350b79a36c39dbe17109d47d3831b2c7`

These changes are build/conformance corrections only; no economic formula or policy changed.

### C3 real-ledger finding
The first real Yaci lab reached the devnet bootstrap and failed in the Reveal trace because `lucid-cardano` 0.10 exposes `Lucid` as a constructable class; the trace invoked it without `new`.

The parallel session corrected:
- Reveal trace Lucid construction;
- EXPIRE trace Lucid construction.

Current branch verification confirms both traces use `new Lucid(...)`, and both retain the Cardano Execution Adapter plus canonical transition binding.

### EXPIRE source-boundary cleanup
One client-side stale variable (`pendingCount`) was caught by TypeScript typecheck after the EXPIRE refactor and removed in:
- `1b4e46020976d59470a8acdbaec3670c8f362a61`

The EXPIRE validator was also tightened to derive its ticket facts from the consumed PrizeDatum input rather than a continuing Prize output, and the client fails closed on unexpected non-ADA assets.

### Current coordinated head
Working branch:
`work/immortal-green-closure`

Current head at this entry:
`ca8054432cd226496080916846aa42d3842e1f7a`

The parallel session has already advanced beyond the individual corrections above. Do not overwrite current trace changes from stale snapshots.

### Latest observed CI
- Cardano Adapter Sale Conformance: repeated GREEN runs on the working lineage.
- PRE-RICH Action Refinement: GREEN on the recent corrected lineage.
- Kernel Invalid-Class Fail-Closed Audit: latest attempt is queued after the dependency/build corrections; no green claim until the new regression completes.
- IMMORTAL Cardano Integration Lab: latest corrected attempt is queued/pending after the trace fixes; no C3/RF10/RF11 green claim until the actual Yaci trace produces and uploads the evidence artifact.

### Next actions
1. Observe the current Kernel regression on the latest head and fix only the next concrete compile/test failure.
2. Observe the current Cardano Lab; once Reveal succeeds, require EXPIRE to execute in the same lab and inspect both real evidence artifacts.
3. Promote C3/RF10/RF11 only from artifact-backed ledger evidence.
4. Continue B4/B5/B6 equivalence work without reopening closed economics.

**Status:** coordinated; local build blockers repaired; real-ledger evidence remains the decisive open gate.

---
## 57. 2026-09-22 — Current Lucid harness correction / fresh ledger re-observation

**Front:** Cardano Lab harness / C3-C4

The current working tree was re-verified after concurrent branch advancement.

### Concrete CI diagnosis

The Integration Lab on the earlier current-line attempt reached the real Yaci bootstrap and ledger smoke successfully, then stopped in the Reveal trace on:
`TypeError: lucid.selectWallet.fromSeed is not a function`.

This is an off-chain harness/API mismatch, not a validator/economic failure.

Lucid `0.10.11` is the repository's declared legacy dependency. The trace paths have been normalized to the legacy `selectWalletFromSeed(seed)` API on the working tree. The same correction is present in both Reveal and EXPIRE traces.

### Current trace invariants retained

- Reveal and EXPIRE still use the Cardano Execution Adapter for the first economically material submission.
- CanonicalTransitionEvidence remains the binding evidence layer.
- EXPIRE remains permissionless, consumes the Pending PrizeDatum, produces no continuing PrizeDatum, releases exactly one reserve/count unit, and does not burn the ticket NFT.
- No IMMORTAL universal economic formula or closed PRE-RICH parameter changed.

### Re-observation status

A fresh CI-triggering checkpoint is being created on the current branch because the previous Lab attempt predates the final wallet API correction. No green claim is made until the resulting Integration Lab executes Reveal and, subsequently, EXPIRE.

**Status:** harness correction complete; fresh real-ledger evidence required.


---
## 58. 2026-09-22 — Fresh Plutus artifact binding for real Cardano lab

**Front:** C3/C4/RF10/RF11 / Cardano execution evidence

### Finding
The real Reveal/EXPIRE traces consume the checked-in `src/plutusScripts/*.plutus.json` factories through `src/loadValidator.ts`. Those artifacts predated the current EXPIRE validator changes, so source-level validator correctness alone was insufficient to establish that the real ledger trace exercised the current validator CBOR.

### Surgical CI correction
The Integration Lab now, before any real ledger trace:
1. installs the pinned Haskell/Plutus toolchain and native dependencies;
2. runs `cabal run exe:export-scripts` against the current checkout;
3. copies the freshly generated `plutus/out/*.plutus.json` artifacts into the trace consumer directory `src/plutusScripts/` inside the ephemeral CI workspace;
4. then executes the existing Yaci smoke → Reveal → EXPIRE evidence flow.

This is a CI/runtime artifact-binding correction only. It does not change repository economic source, canonical parameters, validator semantics, or Adapter authority.

**Commit:** `29e0b8cecf74b7fe02e67c748bd3cadaba562b94`

### Why this is required
The repository's own predeploy contract requires generated `plutus/out` artifacts and synchronization with `src/plutusScripts`. The real trace must therefore exercise artifacts generated from the same source revision being tested, rather than stale checked-in CBOR.

### Current status
Fresh Integration Lab and Kernel runs are now triggered from the corrected working branch. No C3/RF10/RF11 green claim until the lab successfully:
- generates current artifacts;
- completes the real Reveal transaction;
- completes the real EXPIRE transaction;
- uploads the canonical evidence artifacts.

**Status:** artifact provenance gap repaired in CI; ledger evidence pending.


---
## 59. 2026-09-22 — Cardano Lab workflow syntax correction

**Front:** C3/C4/RF10/RF11 infrastructure

The fresh-artifact CI change initially failed before job creation because the workflow contained a duplicated `name: Normalize legacy Lucid ESM entrypoint for Node 22` step header.

That YAML-only defect was corrected immediately without changing the intended execution sequence.

**Commit:** `43968dec61fca636c0bd9ebd7658cab8b7d45260`

The intended lab sequence remains:
- Haskell/Plutus toolchain;
- native dependencies;
- fresh `cabal run exe:export-scripts`;
- ephemeral copy of generated factory artifacts into `src/plutusScripts/`;
- Lucid/Yaci setup;
- real Reveal;
- real EXPIRE;
- evidence upload.

No economic semantics or validator source changed in this correction.

**Status:** workflow syntax repaired; fresh ledger evidence pending.


---
## 60. 2026-09-22 — Plutus export working-directory correction

**Front:** C3/C4/RF10/RF11 / fresh validator artifact generation

The fresh-artifact Cardano Lab step was initially configured with `working-directory: plutus`. The repository root `cabal.project` explicitly declares `./plutus` as the package, while `plutus/Export.hs` writes its generated files to `plutus/out/*.plutus.json` relative to the project root.

Therefore the export step must execute from repository root:
`cabal run exe:export-scripts`

The prior configuration would have targeted a nested `plutus/plutus/out` path and would not have bound the generated artifacts to the expected deployment path.
**Correction:** removed the `working-directory: plutus` override from the export step.

**Commit:** `d568485aea38dd4a7323255d6b6024acc3d23884`

No validator source, economic formula, DApp policy, or Adapter authority changed.

**Status:** export path corrected; fresh real-ledger evidence pending.


---
## 61. 2026-09-22 — PRE-RICH policy/conformance documentation reconciliation

**Front:** documentation truth / A1-A2-A3 status alignment

Triangulation against the current Notion policy closure, the active GitHub implementation, and available Library checkpoints confirmed that the old PRE-RICH conformance table was stale in exactly three rows:
- exact expiry duration;
- Jackpot payout mode;
- future Jackpot allocation.

Current policy authority says these are semantically closed at the correct DApp boundary:
- A1: expiry mechanism is CLOSED; the horizon is DApp/profile-defined and state-derived at issuance, crystallized into the ticket; **365 days is non-canonical**;
- A2: PRE-RICH Jackpot activation policy is CLOSED at semantic/policy level; deterministic threshold implementation/conformance remains open;
- A3: no fixed JackpotAllocationRate is canonical; the current policy funds only the state-derived need subject to RawSurplus + Economic Gate.

`PRE-RICH/docs/CONFORMANCE.md` was aligned to distinguish semantic/policy closure from implementation and evidence status. No economic rule, parameter, validator, transition or runtime path changed.

**Commit:** `447ae1dc86b14acf23c9471b9cf9bd00488a1d95`

**Status:** documentation reconciliation complete; implementation/ledger evidence remains independently open and is not promoted by this change.


---
## 62. 2026-09-22 — Hysteresis conformance promoted to GREEN

**Front:** B2 numerical hysteresis / PRE-RICH class control

Triangulation result:
- Notion current checkpoint records the dedicated PRE-RICH Hysteresis Conformance as completed successfully.
- GitHub run `35649345343` is independently verified `completed / success` on commit `ea8b0740ba04da771cee5884db3d8114428660e4`.
- Library material containing earlier exploratory `KA/KC/KD` values is historical and explicitly non-authoritative; it is not used to reopen the now-canonical baseline.

The verified implementation/conformance covers the canonical baseline `KA=8`, `KC=4`, `KD=4` without changing those parameters.

`PRE-RICH/docs/CONFORMANCE.md` was updated so this requirement records the actual green CI evidence instead of stale `GAP/PARTIAL` wording.

**Commit:** `f5cfc82ce179f1c8950e55039367df65244b1b1e`

**Status:** B2 hysteresis conformance GREEN. Remaining B2 work, if any, is limited to broader economic/ledger integration evidence and must not reopen the frozen values.


---
## 63. 2026-09-22 — B3-C Ed25519 vector provenance and structural finality conformance

**Front:** B3 canonical evidence / GRANDPA structural finality

The Materios conformance CI exposed that the static B3-03C fixture was internally inconsistent with the canonical GRANDPA SCALE encoding: the code encodes Message::Precommit with discriminant 1, a 32-byte target hash, a u32 target number, then u64 round and u64 setId (53 bytes total), while the old fixture expected a 56-byte payload and signatures that did not verify against the canonical bytes.

Triangulation against the upstream finality-grandpa source confirms Precommit has SCALE codec index 1. The old signatures had no authoritative provenance in the repository. They were therefore not retained as real Materios evidence.

Correction:
- the fixture now uses the canonical 53-byte payload;
- the Ed25519 public keys are established RFC 8032 test-vector identities;
- static signatures are deterministic signatures over the canonical payload, explicitly labelled as a synthetic cryptographic conformance vector;
- the test proves signature verification, signer binding, round/setId binding, target binding and quorum without a crypto stub;
- a real Materios signed GRANDPA justification remains a separate evidence obligation.

The structural ancestry verifier was also completed so that a structurally valid ancestry path is accepted, while duplicate, missing, redundant and non-descendant evidence remains fail-closed. Trusted authority state still crosses only the separately branded authority-transition proof boundary.

Latest B3-C CI evidence:
- run 35687999030
- commit b172ad118d9d22d980ce23a4d2d6bba26b272d15
- result completed / success

**Status:** B3 canonical payload + structural finality conformance GREEN; real Materios authority/finality provenance remains OPEN by design.

---
## 64. 2026-09-22 — Current closure-line Cardano lab trigger

**Front:** C3/C4/RF10/RF11 / real Cardano observation

The integration lab had remained on an older pre-hardening commit while later source changes were being cancelled/replaced by concurrency. A workflow-only no-op comment was added immediately before fresh Plutus artifact generation so the lab is guaranteed to trigger from the current closure line and bind fresh validator artifacts to that exact checkout.

This is infrastructure-only; no protocol semantics changed.

Current closure HEAD: `1f3f7f7e343b205a790aecb0714e4ecac90c3ae3`.
Current lab run: `35688090382`, queued at last observation.

**Status:** fresh C3/C4 ledger run required; no green claim until Reveal + EXPIRE + evidence upload succeed.
---
## 65. 2026-09-22 — B4 protected-capital omission hardened fail-closed

**Front:** B4 / Cardano observation projection

PreRichCardanoObservationProjection.ProjectionInput now requires explicit:
- safetyCapital;
- reserveProtection;
- mandatoryFutureCosts.

The previous optional fields silently defaulted each missing component to zero. That behavior could erase protected-capital provenance at the observation boundary. The correction removes those defaults and makes omission a type-level/runtime construction failure.

No protected-capital formula changed. The legacy B1 projection remains intentionally lossy and fail-closed where B1 cannot represent V3 protected state.

**Commit:** `6180eff476263cb180618674871956bc48e6ddc4`

Sale Conformance already passed on that lineage, confirming existing explicit consumers supply the required values.

**Status:** B4 observation omission boundary hardened; full real Cardano provenance remains OPEN.


---
## 66. 2026-09-22 — Legacy adapter Eq compile regression corrected

**Front:** B4/B6 / kernel regression + Cardano artifact generation

Fresh CI logs identified the concrete blocker after the conservation-profile binding: B1LegacyAdapter.legacyProjectionIsLossless compared [TicketClassState] with [], but TicketClassState intentionally has no Eq instance. This was a pure Haskell type-level regression, not an economic disagreement.

Correction: replaced the empty-list equality check with null (v3Classes s). No economic formula, state field, invariant, authority boundary, or DApp policy changed.

**Commit:** 1b792e809381322583ce984c7bfccc79cd032441

**Status:** compile blocker corrected; fresh Kernel + Cardano Lab evidence pending.


## 2026-09-22 — CI compile regressions corrected

Fresh closure CI exposed two compile-only regressions before economic/integration evidence could run:

- plutus/B1LegacyAdapter.hs: the prior `v3Classes s == []` fix was changed to `null`, but `null` is not in scope under the module's Plutus prelude. Replaced it with an explicit list-case emptiness test; no economic semantics changed.
- IMMORTAL/governance/GovernanceCommitment.hs: Data.ByteString.Base16.encode yields ByteString/Word8, while the existing lowercase helper expects characters. Switched only the decoding step to Data.ByteString.Char8.unpack; canonical SHA-256 algorithm and comparison semantics are unchanged.

These are build-boundary corrections only. Do not promote B4/B5/B6/C3/C4 based on them; rerun the relevant CI and continue to real-ledger evidence.


## 2026-09-22 — GovernanceCommitment compile regression corrected

Fresh Kernel run `35704026604` reached compilation and exposed `Num Char` inference in `GovernanceCommitment.lower`. Corrected with explicit `A`–`F` character mapping. SHA-256/canonical serialization/commitment semantics unchanged. Commit: `984b77c1a397519ee9b6f38c651882255b30f7dc`. Fresh CI required; no economic status promoted.


## 2026-09-22 — Kernel regression test fixture/build-boundary corrections

**Front:** Kernel Invalid-Class Fail-Closed Audit

Fresh run `35706233586` reached the full regression build and exposed test-suite compilation defects unrelated to economic semantics:
- `ProjectionBoundaryConformanceTest.hs`: unsupported NumericUnderscores literals and a malformed record-update parenthesis;
- `ProtectedCapitalConformanceTest.hs`: `Maybe` constructors were omitted from the explicit Prelude import;
- `GoldenVectorsTest.hs`: `EconomicProfile` record selectors were not imported explicitly;
- `B1LegacyAdapterTest.hs`: the test imported the library's hidden `B1LegacyAdapter` module, so the test package could not load it; the module is now exposed for the conformance surface.

Corrections are compilation/test-harness fixes only. No economic formula, canonical parameter, validator authority or invariant was weakened.

Commits:
- `aae3166650e4a7c38bef6a9b0dbfdaed91dce39c`
- `da5899f1c81b47e9fd90fb4ab18ca48e04662801`
- `0f71b3a5abe27512c96ea3784f95d632d10f5f7d`
- `bfdb727a8e2c9b4417cd7a92c5a248ef79d2063d`

**Status:** fresh Kernel and Cardano Lab runs triggered from the corrected lineage; no green claim until both complete.


## 2026-09-22 — Kernel fixture + Lucid API regressions corrected

**Front:** Kernel conformance / C3-C4 Cardano lab

Fresh CI on the prior closure head exposed concrete non-economic defects:
- ProtectedCapitalConformanceTest.hs used RevealWitness, ClaimWitness, and ExpireWitness, but the conformance module did not export those witness constructors; the constructors are now explicitly exported for the test surface.
- GoldenVectorsTest.hs had stale zero-state expectations: an unissued class has zero unresolved exposure, so its universal projection has uesWorstCaseExposure = 0 and ProtectedCapital = 0; the under-protection assertion was corrected to use negative EEV instead of 499.
- The real Cardano Reveal/EXPIRE traces reached Yaci successfully but failed on lucid.utils.getAddressDetails under the installed Lucid runtime. Both traces now import and call the package-level getAddressDetails helper directly.

No economic formula, canonical parameter, validator authority, or DApp policy changed. The fixes only restore the intended conformance fixtures and the legacy Lucid runtime boundary.

Commits:
- 167a921ae8f8cb02fb065ea8880301b5af84eaf2
- da02331fb938381283ab4e763eca7763f8614ffa
- 68a9f73e3c60c033edfe3a8c37b039096acf3282
- d9a0ed7051dd8e07f040e926323eb97e7d405ed1

**Status:** fresh Kernel + Cardano Lab rerun required; no green promotion yet.


## 2026-09-22 — Closure-line Kernel fixture/build regressions corrected

**Front:** Kernel regression / V3 conformance fixtures

Fresh run `35712353792` on `917b273631a7157ca52eb337539c2d889d8a9d90` reached the full test build and exposed four concrete non-economic defects: a malformed record-update parenthesis in ProjectionBoundaryConformanceTest; missing Prelude operators in ProtectedCapitalConformanceTest; a stale zero-state RawSurplus expectation (zero protected capital at EEV 1000 implies RawSurplus 1000); and missing Plutus package dependencies for B1LegacyAdapterTest.

Corrections were made without changing economic formulas, canonical parameters, validator authority or invariants:
- `489374c6b2cdc5c440e3e9c6dbaabc41121eae33` — projection fixture syntax;
- `d659a9e93330225d896adc16be1ccd5f25cd4ff5` — ProtectedCapital test Prelude operators;
- `ba87f27ada19dd883472166157eebdf42985a7e2` — zero-state RawSurplus expectation;
- `8dd8c50351fddd451b9814bc8809ae7605d42114` — legacy conformance test Plutus dependencies.

**Status:** fresh Kernel + Cardano Lab evidence required on the resulting HEAD; no green promotion yet.


## 2026-09-22 — Fresh Kernel CI defects corrected on closure HEAD
**Front:** B4/B6 conformance build / projection boundary

Fresh Kernel run 35718038894 on ffb37f40a14b3aa3379c410acdc1bb20317bce0b reached the full test build and exposed two concrete non-economic defects:
- ProjectionBoundaryConformanceTest.hs had one extra closing parenthesis in the unknown-class fail-closed case;
- B1LegacyAdapterTest.hs lacked explicit Plutus package dependencies despite importing PlutusLedgerApi.V2 and PlutusTx.Prelude.

Corrections preserve all economic formulas, canonical parameters, invariants and authority boundaries:
- dc19b91119a3c01ea5bb402b0f4c4612666a7cf9 — projection test syntax;
- 9de32eba1c1b406972a6b08e945c28de7571eed0 — legacy adapter test dependencies.

The same CI log confirms the ProtectedCapital, GoldenVectors and Governance suites themselves passed before Cabal stopped on the two build defects. Fresh Kernel evidence is required on the resulting HEAD; no green promotion yet.

The earlier Cardano Lab run 35718016897 completed Yaci bootstrap and ledger smoke but failed in Reveal, so it does not promote C3/C4. Fresh latest-head lab evidence remains required.


## 2026-09-22 — C5 permissionless lifecycle trace boundary extended

**Front:** C5 / R4 liveness conformance

Triangulation against the normative liveness contract ('docs/01-contracts/13_LIVENESS_AND_PROGRESS_SPECIFICATION.md'), R4 proof specification, P0 permissionless execution contract, and the existing liveness boundary implementation showed that the previous executable surface classified stalls but did not encode the required execution sequence itself.

A minimal non-economic conformance boundary was added:
- canonical sequence: 'CONDITION → OBSERVABLE_EVENT → WAKE_UP → CANDIDATE_CONSTRUCTION → PERMISSIONLESS_INVOCATION → ON_CHAIN_REVALIDATION → ATOMIC_TRANSITION → CANONICAL_STATE';
- independent on-chain revalidation is required;
- atomic commit is required;
- canonical post-state observation is required;
- competing submission must be rejected rather than duplicate the economic effect.

This is a conformance model, not a claim of network liveness or a replacement for Cardano evidence. L1–L4 remain deployment/environment assumptions and R4 remains distinct from proof of actual progress.

**Commit:** 'b466ed522d38cecfcf915e0a201a12e0ede8718d'

**Current CI:** fresh Liveness Boundary run '35722633225' is queued on this exact HEAD. Kernel/Cardano/Sale runs were also triggered by the same closure-line commit; no new green promotion is made until those runs complete.

**Status:** C5 executable sequence coverage strengthened; real permissionless lifecycle evidence remains OPEN.


## 2026-09-22 — Fresh closure CI: harness/API and test Prelude defects corrected

Fresh runs exposed concrete non-economic blockers after the previous C5 work:
- Kernel run `35722673599` reached the full conformance suites; ProtectedCapital, GoldenVectors and Governance all passed, but `B1LegacyAdapterTest.hs` lacked `Left/Right` in its explicit Prelude import and `ProjectionBoundaryConformanceTest.hs` lacked `(++)` and `(-)`. Corrected in commits `a01de60061ed2eb8ebbf82aba991f30b2c68d8ee` and `f5255b9b7d45db22c1b7c51e146a0f9007e372ba`.
- Cardano Lab `35722633178` successfully generated and bound fresh Plutus artifacts, bootstrapped Yaci and completed ledger smoke, then failed at Reveal because the installed Lucid runtime exposes `nativeScriptFromJson` at package level rather than under `lucid.utils`. Reveal and EXPIRE traces now import/use the package-level helper in commits `7a363286c465b75d9ee3689619ca1fbe4428a9f4` and `7f0e8766a76dd31de0380e907d598a43ba96f008`.

No economic formula, canonical parameter, validator authority or DApp policy changed. Fresh Kernel and Cardano Lab runs are required on the resulting HEAD; no B4/B6/C3/C4 promotion from these failed runs.

## 67. 2026-09-22 — Current cross-session re-observation

**Front:** B4/B5/B6 / C3-C4 / CI closure

The live working branch was re-inspected after the latest concurrent corrections. The current Reveal and EXPIRE traces now use the package-level Lucid helpers (getAddressDetails, nativeScriptFromJson), construct Lucid with the installed 0.10 API, and route the first economically material submission through the Cardano Execution Adapter. The Integration Lab workflow also generates fresh Plutus artifacts from the current checkout before executing the traces.

Verified evidence remains deliberately separated from implementation:
- PRE-RICH action-refinement run 35654129336 is GREEN (Issue/Expire refinement + TypeScript typecheck).
- The older Cardano Lab failure 35722633178 is obsolete for the current tree: its concrete blocker was lucid.utils.nativeScriptFromJson, while the live trace now imports the package-level helper. It must not be used to claim a current-head failure.
- No current-head real-ledger GREEN claim is made here because the available workflow evidence inspected in this pass does not establish a fresh successful Reveal + EXPIRE artifact on the latest tree.
- The kernel regression evidence inspected from run 35722673599 confirms ProtectedCapital, GoldenVectors and Governance suites passed before the remaining legacy/projection test build defects; those defects have since been corrected in later commits, but a fresh complete current-head run is still required for promotion.

No economic parameters, Jackpot ownership/funding semantics, expiry policy, ProtectedCapital formula, Economic Gate authority, or Adapter authority boundary were changed by this re-observation.

**Next execution priority:** obtain fresh current-head Kernel and Cardano Lab evidence; if either fails, fix only the concrete failure and re-run. Once the real Reveal + EXPIRE artifacts are produced, promote RF10/RF11/C3/C4 only to the level actually evidenced and continue the remaining B4/B5/B6 connectivity work.

**Status:** COORDINATED / IMPLEMENTATION FIXES VERIFIED / FRESH HASKELL + LEDGER EVIDENCE REQUIRED.


---
## 2026-09-22 — Cross-session re-observation on HEAD bf854b7f

**Front:** cross-session coordination / closure line

This session independently re-observed the current coordinated HEAD `bf854b7f0ede956cedd3b6f52451df919b9e6111` and confirmed the latest lineage rather than relying on the prior checkpoint.

Current exact CI state at re-observation:
- Cardano Adapter Sale Conformance: **SUCCESS** (run `35750803508`).
- IMMORTAL Cardano Integration Lab: **IN PROGRESS** (run `35750803984`), through fresh Plutus artifact generation; Reveal/EXPIRE/evidence steps not yet reached.
- Kernel Invalid-Class Fail-Closed Audit: **IN PROGRESS** (run `35750803649`), regression suite executing.

The current Reveal fixture explicitly supplies `SafetyCapital`, `ReserveProtection`, and `MandatoryFutureCosts`. No economic parameter or invariant change is warranted while the two closure-line jobs are running.

**Cross-session instruction:** do not start another overlapping corrective commit merely to create activity. Wait for these exact HEAD results; if a failure appears, classify it first as economic/invariant vs harness/runtime/infrastructure and correct only the concrete defect. Do not promote any B4/B5/B6/C3/C4/RF10/RF11 status until the corresponding evidence is actually produced.

**Next decisive sequence:** fresh Plutus artifacts → Yaci → real Reveal → real EXPIRE → replay rejection → resource/evidence packet. After that, continue B4/B5/B6 connectivity and C5/C6 evidence without reopening frozen economics.

**Status:** COORDINATED / CURRENT-HEAD CI RUNNING / NO PREMATURE PROMOTION.


## 2026-09-22 — Current-head Cardano Lab failure classified

**Front:** C3/C4 / RF10/RF11 real Reveal evidence

Fresh current-head lab run `35750803984` checked out `bf854b7f0ede956cedd3b6f52451df919b9e6111`, successfully generated and bound fresh Plutus artifacts, bootstrapped Yaci, and completed the ledger smoke transaction. The first real Reveal trace then failed before submission with:

`CostModel operation 166 out of bounds. Max is 166`

The failure occurs inside the Lucid/serialization-layer transaction evaluation invoked while completing the Reveal transaction, not in the Cardano validator's economic predicate. EXPIRE and downstream evidence steps were therefore skipped. The run is **not evidence of an economic invariant failure**, and it does not promote or invalidate B4/B5/B6; it is a runtime/toolchain compatibility blocker in the current lab harness.

The exact error is independently observable in current external Cardano/Lucid reports as well, so it should not be “fixed” by weakening validator economics. citeturn0search0

**Required next action:** isolate the cost-model version/length mismatch between the pinned `lucid-cardano@0.10.11` lab stack and the Yaci/Cardano protocol parameters, then make the smallest compatibility correction. Preserve the real-ledger path; do not bypass script evaluation or replace the validator with a mock. Re-run Reveal + EXPIRE before promoting C3/C4/RF10/RF11.

**Status:** BLOCKED ON LAB TOOLCHAIN COMPATIBILITY / ECONOMIC SEMANTICS UNCHANGED.


## 2026-09-22 — Cost-model diagnostic added

After classifying the previous real-Reveal failure as a lab compatibility blocker, commit `5686d72218a4f44017247e1b86359bec0e78aefe` adds a non-semantic diagnostic immediately after provider initialization. The Reveal trace now records the protocol-parameter cost-model keys/array lengths before constructing the transaction. This is intentionally diagnostic only: no validator, economic rule, transaction path, or cost-model value is altered.

The prior Kernel run `35750803649` was cancelled while the Cardano lab failure was being investigated; it is not a kernel failure signal. A fresh current-head kernel run is required before kernel status is promoted.


## 2026-09-22 — Cardano lab trigger re-armed on current diagnostic HEAD

The cost-model diagnostic was present on commit `5686d72218a4f44017247e1b86359bec0e78aefe`, but the following coordination-only commit did not match the lab workflow path filters. To obtain a current-head lab attempt without changing semantics, commit `1523f9bf4ba070bed29baee8104467eaf3035077` adds only a workflow comment under `.github/workflows/immortal-cardano-lab.yml`, thereby re-triggering the existing push path while preserving the diagnostic and real Reveal path.

No economic, validator, adapter, or evidence semantics changed. The next result must be classified from the actual job logs before any further correction.

## 2026-09-22 — CURRENT SESSION RE-OBSERVATION / COST-MODEL PROBE RUNNING

**Fronts:** Cardano C3/C4/RF10/RF11 + Kernel + Materios B3

The live branch was re-observed directly rather than relying on the older coordination snapshot.

### Current closure HEAD
- `3ddb925fa4cc7e0daabb0e18714f095faf1fd93d`
- commit: `ci: probe current Yaci cost models with Lucid Evolution`

### Current CI
- Cardano Adapter Sale Conformance: **SUCCESS** — run `35757501583`.
- IMMORTAL Cardano Integration Lab: **IN PROGRESS** — run `35757501613`, job `106847179614`.
  - fresh Plutus artifact generation is currently running;
  - all bootstrap/native-dependency steps through native dependencies have passed;
  - Evolution cost-model probe, real Reveal and real EXPIRE have not yet executed.
- Kernel Invalid-Class Fail-Closed Audit: **IN PROGRESS** — run `35757501610`, job `106847289481`.
  - Haskell/native dependency setup passed;
  - the real Kernel regression suite is now executing.
- Do not promote any green status from these two running jobs until their actual conclusions/evidence are observed.

### Cardano diagnostic boundary
The current lab preserves the real Reveal path and adds the non-semantic Evolution cost-model probe immediately before Reveal. The probe is diagnostic: it must establish the Yaci protocol-model shape before any decision about migrating away from legacy `lucid-cardano`.

Do **not**:
- append dummy cost-model entries;
- alter protocol parameters;
- bypass validator evaluation;
- weaken economic invariants;
- blindly migrate the real trace before the probe result is known.

If the probe confirms the expected incompatibility, the next change must be the smallest compatibility correction that preserves the real ledger path.

### Materios — active parallel front
The Materios GRANDPA boundary remains intentionally incomplete at the cryptographic authority-transition layer:
- `verifyFinality` verifies trusted authority binding, Ed25519 signatures, GRANDPA quorum and optional ancestry structure;
- trusted authority state can only be produced from the branded `VerifiedAuthoritySetTransition`;
- `AuthoritySetTransitionProofVerifier` is the explicit untrusted→verified boundary;
- the repository deliberately does **not** yet implement the real Materios authority-selection/finality proof verifier;
- the existing integration test uses an explicit `verify(){ return true; }` test double and therefore is **not** real Materios proof evidence.

Therefore:
- B3-C structural finality conformance remains GREEN only at its bounded structural/synthetic-vector level;
- real Materios authority/finality provenance remains OPEN;
- no synthetic proof verifier may be promoted to production evidence.

### Coordination rule
While the Cardano and Kernel jobs above are running, do not create overlapping corrective commits. Continue independent work only on fronts not touching the active CI artifacts; classify any failure from the exact current-head logs before editing.

**Status:** CURRENT HEAD VERIFIED / CARDANO + KERNEL EVIDENCE RUNNING / MATERIOS AUTHORITY PROOF OPEN.


## 2026-09-22 — B5 runtime choke-point audit

**Front:** B5 Economic Gate → Viability → Atomic Transition

A fresh current-branch audit traced the actual PRE-RICH submission path. PRE-RICH/profile/PreRichEconomicAdmission.hs already composes structural transition validity, the fail-closed PRE-RICH projection, EconomicGate, universal solvency and the certified-Ω viability condition into a typed PreRichEconomicAdmission witness. This is the correct semantic admission boundary.

However, the live TypeScript execution path does not consume that witness: src/gameFlow.ts reaches transaction construction directly and then calls signAndSubmitTx; src/txHelpers.ts creates CardanoExecutionAdapter and submits the transaction, while Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts currently requires no economic-admission evidence. Therefore the Gate is implemented in the kernel/profile layer but is not yet a mandatory runtime prerequisite for the actual DApp submission path.

**Important boundary finding:** do not solve this by duplicating the Haskell economic formulas in TypeScript, inventing EEV/liquidity values, or adding a boolean/call-count flag. The next implementation must introduce an explicit typed admission/evidence handoff at the DApp→Adapter boundary, with fail-closed submission semantics, and must identify the authoritative producer of that witness/evidence before making it mandatory. The adapter remains transport/execution infrastructure and must not independently decide economic admissibility.

**Related current evidence:** the latest Materios upstream-triangulation work remains independent; the real authority-selection proof boundary is still OPEN. Cardano real-ledger evidence remains governed by the active lab run and must not be promoted from implementation alone.

**Status:** B5 semantic boundary GREEN at kernel/profile interface; **runtime consumption OPEN / NEEDS IMPLEMENTATION + EVIDENCE**.


---

## 2026-09-22 — Materios bounded proof-boundary checkpoint

- Re-verified `poc/materios-grandpa/src/authority-transition.ts` at the current green branch after the proof-system type-boundary repair.
- `AuthoritySetTransitionStatement.proofSystem` and `AuthoritySetTransitionPublicStatement.proofSystem` are each present exactly once; the public statement/hash binds proof-system identity, chain identity, genesis context, epoch, selection-input hash, authority sets, activation block and set IDs.
- `verifyAuthoritySetTransition` remains an explicit untrusted→verified boundary. It does not claim to derive the Materios committee itself.
- The PoC README still correctly states that authenticated authority-set transitions and a real Materios finality fixture are open obligations.
- No Materios selection algorithm was reimplemented in TypeScript and no production trust was assigned to a `verify(){ return true }` implementation; such acceptance remains confined to structural tests.
- External consensus reference triangulation: Polkadot documents GRANDPA as a finality mechanism separate from block production and shows authority-set changes being applied as distinct transitions. citeturn0search0turn0search2
- **Status:** bounded structural/evidence boundary GREEN; canonical Materios committee-selection proof + authenticated authority-set transition + real finalized-block fixture remain OPEN.


---

## 2026-09-22 — B5 runtime economic submission boundary

- Added `Adapter/CARDANO/runtime/EconomicAdmission.ts` as an explicit runtime witness boundary. The adapter does not manufacture EEV, ProtectedCapital, viability, Ω, or authoritative truth.
- Added `submitEconomic(...)` to `CardanoExecutionAdapter`; it fails closed before signing when the admission witness is absent or malformed.
- Added `signAndSubmitEconomicTx(...)` as the explicit economic submission path.
- `revealPrize`, `claimPrize`, and `expirePrize` now require an `EconomicAdmissionWitness` and use the economic submission path. Beacon sync remains outside the economic gate.
- Added conformance tests proving missing/malformed admission cannot reach signing and a valid witness is consumed before submission.
- This closes the **runtime consumption boundary** of B5, but does not claim that the TypeScript witness itself is the authoritative economic producer. The producer/verification provenance remains an upstream economic-layer obligation and must be evidenced before B5 is promoted beyond runtime-boundary closure.
- No economic constants or kernel formulas were changed.
- Materios remains bounded at the untrusted→verified transition boundary; real canonical committee-selection proof remains OPEN.
- Cardano lab: the prior Evolution probe failure was diagnosed as the fixture mnemonic mismatch (cost-model lengths were successfully observed); corrected fixture is now on branch. A new lab run should exercise Reveal/Expire after the corrected seed.

**Status:** B5 runtime submission boundary GREEN; authoritative admission production/evidence OPEN. Cardano RF10/RF11/P2.8 evidence OPEN pending a fresh real-ledger run. Materios real authority-selection proof OPEN.


## 2026-09-22 — Materios upstream selection triangulation

- Re-read current Materios `main` authority-selection implementation rather than relying on the older snapshot.
- The actual selection function takes `genesis_utxo`, `AuthoritySelectionInputs`, and `sidechain_epoch`; inside it filters registered/permissioned candidates, computes weights from the D-parameter and stake, sorts by account ID, derives the random seed from Cardano epoch nonce + sidechain epoch, applies the weighted sampler, then applies the repository's deduplication and `MIN_DISTINCT_COMMITTEE=2` safety floor.
- Therefore the existing IMMORTAL proof statement is correctly keeping the algorithm opaque, but the future proof producer must authenticate the exact serialized `AuthoritySelectionInputs` bytes plus `genesis_utxo` and epoch against the advertised committee. We must not replace this with a TypeScript reimplementation.
- Current upstream Materios also has later runtime resilience controls around committee selection/fallbacks; these reinforce that the proof boundary must identify the exact runtime/profile context rather than assuming a timeless abstract selection function.
- Official Polkadot documentation independently confirms GRANDPA finality is a separate consensus service and that authority-set changes are explicit transitions. citeturn0search0turn0search2
- **Result:** no new semantic field invented. Next real proof target is canonical Rust/WASM selection execution or an authenticated proof produced from it, with exact statement binding.


---
## 2026-09-22 — Cross-session Materios proof-contract alignment

**Front:** Materios authority-selection provenance / B3-C

This session coordinated through the repository state rather than chat handoff. The working branch remains `work/immortal-green-closure`; no new branch was created and `b1-hardening` was not touched.

A non-normative proof-boundary contract was added at `poc/materios-grandpa/test/MATERIOS-AUTHORITY-SELECTION-PROOF-CONTRACT.md`. It records the minimum statement bindings already established by the upstream Materios triangulation: proof-system identity, runtime/chain identity, exact `genesis_utxo`, exact serialized `AuthoritySelectionInputs` (or commitment), Cardano epoch nonce, sidechain epoch, resulting/predecessor authority sets, activation context and set identifiers.

The contract explicitly preserves the authority boundary: Materios remains the selector; IMMORTAL consumes an authenticated result as `VerifiedAuthoritySetTransition`. No TypeScript selector reimplementation, synthetic production proof, or economic rule was introduced.

**Commit:** `9e0c687c20fcfe2a1a0d1e85fff926559da4aa1d`

**Status:** specification/proof-boundary alignment GREEN at the documented level; real Rust/WASM selector execution, authenticated proof, finalized-block fixture and replay evidence remain OPEN. Other sessions should treat this contract as the current non-normative target boundary and avoid duplicating a competing statement shape.


## 2026-09-22 — V3 → Universal boundary coverage pass

**Front:** IMMORTAL-STATE-BOUNDARY-001 / B4 / B6

A direct current-branch inspection mapped the semantic contribution of every field in `V3EconomicState` against the universal projection and kernel.

### Coverage result

**Universal economic contribution represented by the projection:**
- `v3CrystallizedLiabilities` → `uesCrystallizedLiabilities`
- `v3UnresolvedReserve` → `uesUnresolvedReserve`
- `v3UnresolvedTicketCount` → `uesUnresolvedTicketCount`
- class-derived worst-case exposure → `uesWorstCaseExposure`
- `v3SafetyCapital` → `uesSafetyCapital`
- `v3ReserveProtection` → `uesReserveProtection`
- `v3MandatoryFutureCosts` → `uesMandatoryFutureCosts`
- `jsLockedAmount(v3Jackpot)` → `uesAdditionalProtectedCapital`

**Application/profile semantics intentionally not projected as universal state:**
- `TicketClass` / `TicketClassState` decomposition
- `EconomicControlState` / active-class policy
- `JackpotStatus` lifecycle
- Jackpot threshold/cycle metadata
- class saleability/capacity policy

The latter fields are not silently dropped: the projection validates the economically relevant quantities they contribute and fail-closes on malformed class composition, unknown classes, duplicate classes, negative values and inconsistent class exposure. Their policy semantics remain at the PRE-RICH boundary.

### Important distinction

`tcsCap`, `tcsSaleable`, and activation control are not inputs to universal ProtectedCapital. They therefore must not be invented as universal fields merely to achieve structural one-to-one mapping. They remain application-state/policy inputs to the PRE-RICH transition layer.

The current projection also checks:

`tcsExposure == profilePrice(class) × tcsUnresolved`

and independently reconstructs reserve/count/exposure from the class list. This gives a fail-closed consistency bridge rather than trusting duplicated aggregate fields.

### Existing conformance evidence

`projectionBoundaryEquivalent` already establishes, for successfully projected states:

- V3 ProtectedCapital = Universal ProtectedCapital;
- V3 RawSurplus = Universal RawSurplus;
- V3 solvency predicate = Universal solvency predicate.

Golden-vector coverage additionally exercises unknown-class rejection, duplicate-class rejection, inconsistent exposure rejection, invalid-profile rejection and preservation of non-zero protected-capital components.

### Remaining gap

This is **aggregate economic conformance**, not full V3 semantic equivalence. It does not prove:
- application transition correctness;
- Gate soundness;
- certified viability;
- atomicity;
- Cardano semantic equivalence;
- Jackpot lifecycle equivalence;
- canonical class activation semantics.

Therefore B6 remains PARTIAL / NEEDS-EVIDENCE and B4 remains OPEN for transition-level preservation evidence.

**Decision:** no destructive V3 refactor is justified by this pass. The smallest safe architecture remains an explicit PRE-RICH projection into the universal aggregate, with application policy retained outside the universal kernel.

**Status:** boundary coverage GREEN at aggregate semantic level; transition/conformance evidence remains OPEN.


## 2026-09-22 — Runtime boundary bypass audit

**Front:** B5 / Adapter separation

A direct current-branch audit traced the Cardano execution choke-points and the PRE-RICH economic flows.

Findings:
- `revealPrize`, `claimPrize`, and `expirePrize` use `signAndSubmitEconomicTx` and therefore require the typed `EconomicAdmissionWitness` before signing/submission.
- `CardanoExecutionAdapter.submitEconomic` fails closed through `assertEconomicAdmission`; the adapter does not calculate or reinterpret economic truth.
- Generic `submit` remains available for non-economic transport operations.
- `syncBeacon` is intentionally non-economic and correctly uses the generic submission path. An accidental requirement for an Economic Gate witness on `syncBeacon` was removed in commit `f64c1ab5ca5825e8e50872ee73de0e77c8b48152`.
- The remaining generic `signAndSubmitTx` call in `gameFlow.ts` is the Beacon Sync path, not Reveal/Claim/Expire.
- `buildClaimTx` is a transaction-builder helper and does not itself sign or submit; it is not an economic submission bypass.

Conclusion: the runtime economic choke-point is structurally intact after the correction. The remaining B5 gap is **authoritative witness production/provenance**, not an observed adapter bypass.

**Status:** runtime boundary GREEN; authoritative producer/evidence OPEN.


## 2026-09-22 — AG-01 governance state-machine audit

**Front:** AG-01 Algorithmic Governability / governance execution boundary

A direct current-branch audit of `IMMORTAL/governance/Governance.hs` was performed against the AG-01 obligations. The constitutional principle is preserved: the algorithm must compute candidates within an authorized ruleset; it must not mint authority or silently convert a candidate into canonical state.

The current governance module already provides deterministic primitives for snapshots, quorum, approval thresholds, delegation conservation, lifecycle transitions, ruleset/gate integration points and replay. The audit also identifies the remaining closure boundary without changing governance semantics:

- `applyEvent` currently validates structural event admissibility, but the module does not by itself establish that every lifecycle advancement was preceded by the corresponding review/voting/finality/gate conditions.
- `GatesSet` is structurally restricted to EvidenceReview/CommunityReview, but promotion from DecisionRecorded to Accepted/Adopted/Canonical is not independently proven by this module to require the relevant gate/quorum/approval evidence.
- `ProposalClassified` records classification as a state transition, but canonical event provenance/timestamp binding and independent replay commitments remain outside this module's current evidence surface.
- `replay` demonstrates deterministic state reconstruction from an accepted event stream; it is not yet cryptographic canonical-event evidence.

Therefore AG-01 remains OPEN. No authority rule, threshold, economic constant, application policy or constitutional semantics were changed.

**Next safe target:** add conformance tests at the governance boundary for negative self-authorization, gate-before-adoption, stale/incompatible ruleset rejection, distinct amendment lifecycle, deterministic replay and application-policy isolation. Any implementation change must preserve the existing normative hierarchy and must not turn the algorithm into an authorization source.

**Status:** governance structural substrate GREEN; executable AG-01 closure evidence OPEN.


## 2026-09-22 — Algorithmic governability: competing-monitor toy closure

**Front:** Algorithmic Governability / epistemic non-sovereignty

The master Notion record was advanced from the conceptual competing-monitor model to a closed toy-model result. Two versioned monitors receive the same immutable RawObservation but may produce different metrics. The normative selection rule is predeclared by the ViabilityContract; divergence is routed to the declared selection/contest rule and cannot itself transfer authority to whichever monitor produces the favorable result.

New candidate invariant:

> **No Result-Dependent Authority:** no monitor result may, absent an already-authorized institutional rule, modify the rule that determines monitor authority or the normative metric.

The toy also identifies **MON-COMP-06 — Result-dependent authority capture** as an additional attack class. Defenses are contract precommitment, version binding, provenance, contestability and prohibition of result-dependent authority updates.

This remains a research/test-model result, not a constitutional closure. The next implementation step is an executable adversarial test with two divergent monitors and explicit assertions that neither can mutate ViabilityContract or escalate authority.

**Status:** conceptual/test-model closure GREEN; executable adversarial implementation test OPEN.

## 2026-09-22 — Live branch synchronization check

Direct branch inspection confirms `work/immortal-green-closure` currently points to `683fbd8f3871dbbd7542efc7fe6b915856e71c8e` (`docs: record runtime economic bypass audit`). The coordination snapshot's older `a4e9ec8...` marker is therefore stale and must not be used as current HEAD evidence. Runtime boundary findings recorded below remain current through the direct branch inspection; CI/evidence status must be refreshed from exact current-head runs before promotion.


## 2026-09-22 — AG-01 canonical-governance schema audit

**Front:** AG-01 / GOV-22 / canonical governance replay

A deeper audit found a concrete schema-consistency gap that must be resolved before governance closure:

1. `GOV-22-SPEC.md` requires every canonical event to bind a semantic payload plus timestamp and states that replay must consume canonical events as the sole semantic source.
2. `GovernanceEventSchema.hs` defines payload variants `PayloadProposalClassified` and `PayloadGatesSet` without timestamps, while `eventSchemaValid` requires `payloadTimestamp payload == eventTimestamp`. For those variants `payloadTimestamp` is hard-coded to 0, so any classified/gate canonical event with a non-zero event timestamp is rejected.
3. The existing canonical-event test does not exercise this boundary: its `EStatusChanged` example is structurally distinct from the classification/gates payloads and the authorization/replay path is not tested for a non-zero classified/gates timestamp.
4. There are also two governance event representations in the working tree: `GovernanceEventSchema.hs` + `GovernanceCanonicalReplay.hs` implement the GOV-22 semantic-payload path, while the older/parallel `CanonicalEvent.hs` defines a separate event model and lifecycle. This must be reconciled against the normative GOV-22/GOV-23 lineage before adding further semantics; no assumption is made here about which legacy module is authoritative.
5. `GovernanceAuthorization.hs` already binds actor class, evidence and ruleset compatibility, but closure evidence must be tested against the canonical event path actually designated authoritative.

No governance threshold, economic rule, constitutional rule or application policy was changed. This is an evidence/schema finding only.

**Status:** AG-01 governance closure remains OPEN; next safe action is canonical-module lineage reconciliation and a minimal negative/positive test for non-zero classified/gate event timestamps, before any implementation change.

## 2026-09-22 — Current-head Action Refinement compile failure corrected

**Front:** B5 runtime admission / PRE-RICH action refinement

The Action Refinement run 35765075059 passed all 10 Vitest files (73/73 tests) and failed only at TypeScript compilation. The concrete regressions were: two ProjectionInput fixtures missing explicit safetyCapital/reserveProtection/mandatoryFutureCosts; claim.ts and claimFlow.ts not threading the mandatory EconomicAdmissionWitness; and txHelpers.ts importing that type from the adapter instead of the dedicated EconomicAdmission module.

Correction was fail-closed: explicit protected-capital fields were restored in the fixtures; the typed witness was threaded through both Claim facades; the import was corrected; and the dev UI Claim button now reports that no authoritative admission producer is available instead of fabricating a witness.

Commits: 3518831eab46e40df4b064b56621d03e71242066, 6b82675bb2eeb98c6e9f11472c363553efca5765, d77710fbc356f3f608c517e258e87cb4a669ca8b, 4d40bb0348d4b1712667b2aec914e3614c719433, 0e6228c7e74c06527b0048d0ccd242f8d7ea4df2, 7321880fd06f25f45d519290d4b35d2b24f42c38.

No economic rule, validator predicate, witness semantics, or IMMORTAL/PRE-RICH boundary was weakened. Fresh current-head validation is running on 7321880fd06f25f45d519290d4b35d2b24f42c38.

**Status:** compile defect corrected; validation running. B5 runtime boundary remains structurally GREEN; authoritative witness production remains OPEN.


## 2026-09-22 — AG-01 canonical payload timestamp repair

The GOV-22 audit was converted into a minimal schema correction on the working closure branch.

- `PayloadProposalClassified` now carries its canonical timestamp.
- `PayloadGatesSet` now carries its canonical timestamp.
- `payloadTimestamp` derives the timestamp from those payloads instead of hard-coding zero.
- `canonicalPayloadText` includes the timestamp, so the semantic payload representation remains deterministic and binds the same time as the event envelope.
- `GovernanceCanonicalReplay.hs` was updated only to consume the enriched payload shape; governance transition semantics are unchanged.
This is a GOV-22 schema-consistency repair, not a new governance rule.
The audit also confirms that `IMMORTAL/governance/CanonicalEvent.hs` is a separate older lifecycle representation and must not silently become a second semantic source of truth. GOV-22's `GovernanceEventSchema.hs` + `GovernanceCanonicalReplay.hs` path is the lineage to reconcile against the normative spec; no deletion of the older module is performed without consumer/test reconciliation.

Commits:
- `e6a812c23c40d9843203395bff1f47cacf2bbbee` — payload timestamp shape
- `ddac71d861c752bd86b2c73c20bc9a335e4e25ef` — replay pattern update

No new branch; `b1-hardening` untouched.

**Status:** GOV-22 timestamp consistency repaired; AG-01 governance closure still OPEN pending canonical-module reconciliation, authorization/gate negative evidence, and independent replay evidence.


## 2026-09-22 — AG-01 canonical event timestamp boundary repaired

**Front:** AG-01 / GOV-22 canonical governance replay

The previously identified schema inconsistency was confirmed on the live branch and corrected minimally. `CanonicalPayload` carries timestamps for `PayloadProposalClassified` and `PayloadGatesSet`; `eventSchemaValid` compares those payload timestamps with `eventTimestamp`; the event-type matcher had stale constructor arities (`_ _` / `_ _`) and therefore did not match the current payload constructors. It is now aligned with the actual three-field classification payload and three-field gates payload.

A conformance test was extended with non-zero timestamp cases for both `EProposalClassified` and `EGatesSet`, including evidence refs and predecessor binding. No governance threshold, authority rule, economic rule, or constitutional semantics changed.

Commits:
- `730c0dd7f7f7b07da83eeac4392701482a4c4a89` — align canonical governance payload arity;
- `237b793636d34be9deda17502a9561a561b64cce` — add classified/gate timestamp fixtures;
- `64fd67a3c6f1af5a1c6d9529a6bbc52b11dfcfb0` — assert non-zero canonical timestamps.

Current exact-head workflow results are not yet exposed for this head; no green CI claim is made.

**Status:** schema boundary repaired; executable validation pending. AG-01 remains OPEN for broader lifecycle/finality/self-authorization evidence.


## 2026-09-22 — GOV-22 canonical-only conformance test alignment

The governance canonical-event test was stale relative to the current GOV-22 API: it still replayed `(CanonicalEvent, GovernanceEvent)` pairs and used a tautological determinism assertion.

It now:
- replays `[CanonicalEvent]` only through the current `replayCanonical` API;
- supplies an explicit ruleset registry required by canonical authorization;
- verifies predecessor rejection;
- independently compares incremental replay with full-list replay;
- adds positive schema coverage proving non-zero timestamps are bound for `ProposalClassified` and `GatesSet`.

This is test/conformance alignment only. No governance thresholds, lifecycle policy, economic rule, or authority boundary changed.

Commit:
- `61c7fe46605e3ccdc8d6301957f77ca55c98a4a9`

**Status:** GOV-22 implementation/test alignment advanced; full AG-01 closure remains OPEN pending canonical-module reconciliation and stronger authorization/gate/ruleset evidence.


## 2026-09-22 — GOV-22 lineage reconciliation boundary

The older `IMMORTAL/governance/CanonicalEvent.hs` lifecycle model was confirmed as structurally distinct from the GOV-22 canonical semantic-payload path. No active consumer was identified through the available repository search surface, but deletion was intentionally avoided because the available code-search index does not provide a reliable current-branch consumer proof.

Safe reconciliation performed instead:
- marked `CanonicalEvent.hs` explicitly LEGACY / PARALLEL and non-authoritative for GOV-22;
- stated that `GovernanceEventSchema.hs` + `GovernanceCanonicalReplay.hs` are the authoritative GOV-22 semantic replay lineage;
- removed the stale GOV-22 README wording suggesting manual application to `b1-hardening`.

Commits:
- `bc4d08b40aa82f7af2942aadd4f908065caebb69` — GOV-22 status wording
- `9c669ff16556d86f8a32f6c3fd196dbf4d064ed8` — legacy lineage marker

This does not claim deletion or full compile-time exclusion of the legacy module; that remains a separate verification task if the build manifest/consumer graph establishes it is unreachable.


## 2026-09-22 — AG-01 authorization conformance hardening

**Front:** AG-01 / GOV-22 canonical authorization

A minimal executable conformance extension was added to the canonical governance test. It now proves, on the authoritative GOV-22 canonical-event path, that:

- a correctly declared actor role is accepted;
- an actor-role mismatch is rejected (negative self/role authorization boundary);
- an incompatible payload commitment is rejected;
- an unregistered ruleset version is rejected.

The test does not introduce or alter governance thresholds, lifecycle transitions, economic rules, constitutional semantics, or application policy. It strengthens evidence for the already-existing GovernanceAuthorization contract.

**Commit:** `7187ce6a213405698de8d0e426b3b91fd7f0a735`

**Validation:** GitHub exposes no workflow run for this exact head, so no CI-green claim is made. Static test construction was checked against the current canonical authorization API. AG-01 remains OPEN for lifecycle/gate-before-adoption and independent replay evidence.

**Coordination:** no branch created; `b1-hardening` untouched. Other sessions should continue from this head and avoid duplicating the same authorization-test change.


## 2026-09-22 — Governance build-lineage check

The active Plutus Cabal package was inspected to establish whether the legacy governance module is part of the authoritative build surface.

Finding:
- `CanonicalEvent.hs` is **not** listed in `exposed-modules`, `other-modules`, or any governance test suite in `plutus/pre-rich-plutus.cabal`.
- GOV-22's authoritative modules (`GovernanceEventSchema`, `GovernanceAuthorization`, `GovernanceCanonicalReplay`, `GovernanceCommitment`, `RulesetRegistry`) are exposed.
- `GovernanceFinality` and `GovernanceRuleset` are now explicitly exposed as well, matching the existing Phase-6 governance surface rather than relying on accidental source visibility.

No deletion of `CanonicalEvent.hs` was performed: it remains legacy source outside the active package manifest, preserving historical compatibility while preventing it from being the package's canonical GOV-22 event model.

Commit:
- `16a2e5e368fd47a40abb0dad69f2ee25c3ec3e65`

**Status:** GOV-22 lineage is now structurally separated at the package boundary; remaining AG-01 work is semantic authorization/gate enforcement and independent evidence, not event-model duplication.


## 2026-09-22 — Governance conformance test drift repaired

The active `GovernanceConformanceTest.hs` had stale calls against the current delegation-aware quorum/approval APIs and an emergency-expiry assertion that used a proposal with no emergency activation timestamp.

Repair:
- quorum and approval tests now pass the proposal delegation set explicitly;
- abstention tests use an explicit empty delegation set;
- emergency expiry test constructs an explicitly activated emergency and checks the exact 72h boundary.

No governance threshold or lifecycle rule changed; this only restores test fidelity to the existing implementation.

Commit:
- `726fd848d0c1ed878b19e45d1c9776f3de1c804d`

**Status:** governance conformance surface is now aligned with current function signatures; AG-01 semantic lifecycle/gate enforcement remains the next substantive closure target.


## 2026-09-22 — AG-01 gate-before-adoption enforcement

The governance audit found a concrete executable gap: the existing lifecycle graph allowed DecisionRecorded -> Accepted -> Adopted structurally, but the authoritative applyEvent path did not enforce the already-defined quorum, approval, and gatesPassed predicates before Accepted.

Minimal repair on the canonical Governance path:
- StatusChanged to Accepted now requires quorumReached + approvalReached + gatesPassed for the proposal's snapshot/delegations/votes/class/gates;
- Adopted remains reachable only from Accepted;
- Canonical remains reachable only from Adopted;
- no new threshold or policy was introduced; the implementation now enforces predicates already present in Governance.hs.

Conformance evidence adds a negative ungated acceptance case and a positive Accepted -> Adopted sequence after a valid vote/decision record.

Commits:
- d77e04d8fff3549da6a9712841f2f893de290b4e
- 9040bce4b8b0606b98147516eb9a701dadedfe44

**Status:** AG-01 lifecycle gate enforcement implemented; independent replay/finality and full build validation remain open.


## 2026-09-22 — P2.8-B.1 emulator execution promoted to CI

Audit finding confirmed: the real PRE-RICH emulator fixture `src/__tests__/immortal-cardano-reveal-emulator-b1.mjs` existed on the closure branch but none of the existing workflow definitions referenced it.

Action:
- added `.github/workflows/pre-rich-cardano-emulator-reveal.yml`;
- runs on pushes to `work/immortal-green-closure` and pull requests;
- installs the pinned lockfile dependencies with `npm ci`;
- executes the actual emulator-backed Reveal fixture with the repository's Plutus artifacts.

This does **not** mark the ledger/emulator path green: the first CI execution must establish whether the current fixture reaches validator evaluation, and any failure remains evidence rather than being masked.

Commit: `b485f12bcbaad31e0aa63f6c69d0fac234e41345`

**Status:** P2.8-B.1 execution visibility GREEN; runtime acceptance and transaction-size evidence remain OPEN until CI produces a successful real-validator run and resource measurements.


## 2026-09-22 — P2.8-B.1 emulator execution promoted to CI + pool-output fail-closed hardening

External audit identified two concrete blind spots: the real PRE-RICH Reveal emulator test existed but was not referenced by any workflow, and PrizeValidator's pool-output lookup accepted the first matching output instead of failing closed on ambiguity.

Actions taken:
- added dedicated workflow `.github/workflows/pre-rich-emulator-reveal.yml` executing both the isolated Lucid emulator smoke and the real PRE-RICH Reveal emulator test;
- workflow normalizes the pinned Lucid 0.10.11 ESM entrypoint before execution;
- hardened `findB1PrizePoolOutput` so a second matching pool-script output or malformed first match cannot silently select an arbitrary output;
- no economic thresholds or accounting semantics changed.

Commit: 8d817c74706c1d0938e3dcff42f3a8e86b718b2c

**Status:** emulator path is now an automatic CI gate. The first run is the evidence point; any Lucid/Data.to or transaction-size failure must remain visible rather than being masked. P2.8 real-ledger evidence remains separate.


## 2026-09-22 — P2.8-B.1 first CI failure is now reproduced and classified

Fresh CI run `35766684202` reached the real emulator fixture and failed during `setupTx.complete()` with `encoding/hex: invalid byte: [` from Lucid's hex decoder. The stack points to the fixture's inline datum encoding, not validator execution.

Root cause identified by comparison with the repository's active transaction construction (`Data.to(...)`): the emulator fixture passed raw `Constr` values as `inline` datum payloads. The fixture has been corrected to encode all four inline datums explicitly with `Data.to(...)`.

Commit: `608d302b0b335e526dc4492bf219b181a17d3059`

Interpretation: the new CI has already converted the former blind spot into an actionable, reproducible fixture failure. Validator acceptance and transaction-size evidence remain OPEN; next run must get past datum encoding before those can be measured.


## 2026-09-22 — P2.8-B.1 first CI failure: redeemer encoding isolated and corrected

The newly activated emulator gate immediately exposed the previously reported encoding blind spot. The first failing run did not reach validator execution: Lucid failed during `Tx.complete()` with `encoding/hex: invalid byte: [`, at the Reveal transaction construction.

Diagnosis: the setup transaction already used `Data.to` for inline datums, while the Reveal `collectFrom` redeemers were still passed as raw `Constr` values. Lucid 0.10.11 expects the serialized datum/redeemer representation at this boundary. Both Reveal redeemers are now explicitly wrapped with `Data.to(...)`.

This is a test-harness encoding correction, not a validator/economic weakening. The CI gate is deliberately retained so the next run proves whether execution reaches the actual validators and, if so, exposes the next real boundary (including resource footprint).

Commit: 2679a1969dd76f072ee32e2347ad71bcce6f0b13f0

**Status:** encoding failure localized and fixed; fresh-head emulator execution pending.


## 2026-09-22 — Reference-script deployment split from setup transaction

The first reference-script attempt correctly removed validator bytes from the Reveal witness, but placed both reference scripts in the same setup transaction. That setup transaction itself remained oversized (`18,283 > 16,384`).

Repair:
- ordinary Prize/Pool script-UTxO setup remains separate;
- PrizeValidator reference script is deployed in its own transaction;
- B1PrizePool reference script is deployed in its own transaction;
- Reveal reads both resulting reference-script UTxOs and does not attach either validator inline.

Commit: `81aa53c336fde5621f08b7c820c8fc3ae9c79f08`

Next evidence target: fresh CI must show setup/reference deployments and then Reveal completion. Only after that can validator acceptance and resource measurements be classified.


## 2026-09-22 — Reference-script funding-order failure classified

Fresh P2.8-B.1 CI reached the split reference-script deployment path, but the second reference-script transaction failed because both reference transactions were built before the setup transaction was submitted, so Lucid selected the same pre-setup wallet UTxO twice. This is fixture sequencing, not validator/economic evidence.

Repair: submit and await the Prize/Pool setup transaction first, then build/sign/submit the PrizeValidator reference-script transaction, then the B1PrizePool reference-script transaction.

Commit: `f46e5470b89950f9a46d83dd0ff5d77766f347f6`


## 2026-09-22 — P2.8-B.1 emulator budget classified

Fresh CI confirms the fixture now reaches real Plutus execution. The emulator reports `maxTxSize=16384` and a 175-entry PlutusV2 cost model, but Reveal fails at `Spend[1]` with a negative remaining execution budget (`Mem -29986019900`, `CPU -20004554100`). This is no longer transaction-size or reference-script placement evidence; it is an emulator execution-budget compatibility/parameter issue that must be diagnosed without changing validator economics or fabricating a larger budget.

Added diagnostics for `maxTxExUnits` and execution prices in commit `59724385c64bee7b1d88aeea11b92dccdb506288`. Next: capture exact emulator execution parameters, compare them with the Lucid/Cardano version assumptions and repository cost-model history, then choose the smallest evidence-backed repair.


## 2026-09-22 — PRE-GENESIS → GENESIS economic crystallization front opened

**Front:** PRE-GENESIS / GENESIS transition boundary — Snek/PRE-RICH bootstrap provenance

A new coordinated front is opened from the existing Notion PRE-Snek evidence lineage, especially **Gate 41 — PRE Snek Deployment Lineage & Seed Reconciliation v0.1**. The existing evidence closes the Pool-NFT lineage, the Genesis immediate input set, the boundary transaction reconstruction, the exact 1B PRE bootstrap and the first curve transition, but it explicitly leaves the semantic role of the bootstrap/seed/min-ADA boundary and the Genesis funding role open.

Key evidence already established:
- the Pool-NFT mint transaction distributes exactly `1,000,000,000 PRE`;
- the NFT-bearing initial pool output contains `13 ADA + 996,071,981 PRE + 1 Pool NFT`;
- the complementary output contains `3,928,019 PRE`;
- the subsequent first-curve transition is transaction-level verified;
- the observed `3 ADA` State-0/provider offset remains an identified pattern, not a proven seed/min-ADA rule;
- the existing PRE-RICH economic rule says **Genesis bootstrap = PRE Treasury >= 4000 USDM**, while the Genesis PRE bootstrap is **not automatically PrizePool liquidity**.

### New normative/evidence question

Define the exact boundary by which a **PRE-GENESIS observed state becomes a GENESIS economic state**, without silently treating historical PRE bootstrap assets as Genesis capital.

The working hypothesis is deliberately a boundary/projection model, not a token-conversion rule:

`PRE-GENESIS observed state → eligibility predicates → crystallization boundary → GENESIS starting state`

Genesis accounting must therefore be based on an explicitly admitted projection of the pre-Genesis state. Historical/bootstrap assets remain historical/application state unless a canonical PRE-RICH rule explicitly admits them into a Genesis economic field. No asset is reclassified merely because it existed before the boundary.

### Required closure work

1. Identify the authoritative Genesis activation predicates and their source-of-truth location.
2. Define which PRE-GENESIS quantities are historical/bootstrap/application state and which, if any, are admitted into Genesis economic state.
3. Define the crystallization function and fail-closed behavior for missing/ambiguous evidence.
4. Reconcile the existing `Genesis = 1 USDM` and `PRE Treasury >= 4000 USDM` rules with the Snek/PRE deployment lineage without promoting Snek-specific values into IMMORTAL.
5. Keep the boundary **PRE-RICH/application-specific** unless canonical evidence proves a universal IMMORTAL semantic is required.
6. Add conformance/evidence only after the semantic boundary is triangulated against Constitution, Economic Canon, PRE-RICH Constitution/Application Spec/Game Economy and Gate-41 evidence.

### Explicit non-assumption

Do **not** infer that the `1B PRE` bootstrap, the `13 ADA` initial pool output, the `3 ADA` provider offset, or any upstream UTxO automatically constitutes Genesis capital. Those are ledger/evidence facts whose economic role must be established separately.

**Status:** OPEN / NEW FRONT — semantic boundary not yet frozen.
**Next deterministic action:** triangulate the Genesis activation/bootstrapping rules across current repository sources and the relevant Notion documents, then write the smallest canonical transition contract before implementation.


## 2026-09-22 — SESSION RESULT — IMMORTAL Treasury/Protocol Revenue representation map

**Front:** IMMORTAL Treasury & Protocol Revenue Boundary

Direct current-branch inspection confirms that the repository currently contains a concrete PRE-RICH/Cardano Treasury mechanism, but not yet a typed universal `ProtocolUsageFee` / `ProtocolRevenue` boundary. The existing `src/treasuryPolicy.ts` percentage/threshold policy, `plutus/Treasury.hs` distribution validator, `TreasuryDatum`, and `TREASURY_ADDRESS` are classified as application/deployment realization and must not be promoted into IMMORTAL semantics.

`src/mint.ts` does perform an atomic Treasury payment in the PRE-RICH sale transaction, while `EconomicKernel` remains the universal ProtectedCapital/RawSurplus accounting boundary. No Treasury balance is therefore being inferred as ProtectedCapital or RawSurplus merely because it is protocol-controlled.

The dedicated front `docs/COORDINATION/FRONT-IMMORTAL-TREASURY-FEE.md` now records this representation map and the smallest safe conceptual boundary: `ProtocolRevenue → ProtocolControlledDestination → AccountingClassification → AdapterSettlement → Evidence`.

**No normative economics changed. No fee amount or distribution percentage was introduced.**

**Status:** REPRESENTATION MAP COMPLETE / NORMATIVE BOUNDARY OPEN.


## 2026-09-22 — PRE-GENESIS → GENESIS predicate triangulation: activation boundary remains underspecified

**Front:** PRE-GENESIS / GENESIS transition boundary — normative triangulation

The new front was triangulated against the current Notion transition documents rather than assuming that the existing `Genesis >= 4000 USDM` statement is already the complete activation rule.

### Findings

1. The **Definitive Decision Register** treats `Genesis = 1 USDM` and verified PRE Treasury `>= 4,000 USDM` as frozen economic decisions, and explicitly states that PRE bootstrap is not automatically PrizePool liquidity.
2. **T2 — Transition Conformance Specification** states that `PRE_GENESIS → GENESIS` is triggered by a **verified Genesis predicate**, with permissionless execution and independent revalidation.
3. The same T2/P0 lineage does **not** provide a fully explicit executable predicate in the text itself; it names the verified predicate and the Treasury threshold.
4. The current **End-to-End System Map & Continuity Checkpoint** adds an important application-level qualification: Genesis/activation follows a required ladder/stability condition and economic trajectory, and its remaining closure work explicitly says to formalize the deterministic activation threshold from verified economic trajectory/state.
5. Therefore the statement `Verified PRE Treasury >= 4000 USDM` is established evidence for the Genesis bootstrap condition, but it must **not yet be promoted to the complete PRE-GENESIS → GENESIS activation predicate** without reconciling the ladder/stability/trajectory condition.

### Consequence for the bootstrap question

The correct transition model is currently:

`PRE-GENESIS state → verify Genesis predicate(s) → crystallize Genesis state → GENESIS`

where the exact predicate set is still an open conformance/specification boundary. The `1B PRE` Snek bootstrap and its ADA/Pool-NFT lineage remain evidence of the application's pre-Genesis history; they are not automatically imported into Genesis accounting.

### Conflict / unresolved canonical detail

**Source A:** Definitive Decision Register / T2 — verified PRE Treasury `>= 4,000 USDM` is the frozen Genesis bootstrap condition and PRE bootstrap is not automatically PrizePool liquidity.

**Source B:** End-to-End System Map — activation also follows required ladder/stability and economic trajectory, with deterministic activation threshold still to be formalized.

**Implication:** no implementation should hard-code `Treasury >= 4000` as the sole Genesis transition predicate until the source hierarchy reconciles these statements. Conversely, no new numerical threshold should be invented.

**Next deterministic action:** inspect the actual PRE-RICH transition implementation/tests for `PRE_GENESIS → GENESIS`, map every predicate currently enforced, then reconcile that implementation against T2 and the End-to-End map. If the implementation has no complete predicate, define the smallest contract from existing normative material before coding.

**Status:** OPEN / TRIANGULATED — bootstrap condition known; complete activation predicate not yet frozen.


## 2026-09-22 — SESSION RESULT — PRE-GENESIS → GENESIS boundary

Notion T2/P0 and the current PRE-RICH Constitution were triangulated against the working branch. The semantic Genesis predicate remains the frozen verified PRE Treasury threshold `>= 4,000 USDM`; execution is permissionless and PRE-GENESIS remains a safe state if nobody submits. The key accounting clarification is now explicit: **Genesis bootstrap evidence/value is not automatically PrizePool liquidity** and must not be double-counted merely because the transition crosses into GENESIS.

Added `PRE-RICH/docs/PRE-GENESIS-GENESIS-TRANSITION-CONFORMANCE.md` with the transition contract, on-chain revalidation requirements, bootstrap non-double-counting invariant, SAFE STALL/liveness requirements, negative cases and closure evidence.

**Status:** semantic boundary CLOSED; transition-level operational conformance CLOSING/OPEN. No economic parameter changed.


## 2026-09-22 — PRE-GENESIS → GENESIS predicate resolved by current PRE-RICH canon

**Triangulation correction / resolution:** inspection of the current branch at the latest diagnostic HEAD `83d459a1c6e584e10af7ebd3f572e5d5159292ff` resolves the apparent ambiguity identified in the previous note.

The current canonical `PRE-RICH/docs/GAME-ECONOMY.md` states explicitly:

`Genesis ticket = 1 USDM`
`Genesis bootstrap = verified PRE Treasury >= 4000 USDM`

and `PRE-RICH/docs/CONSTITUTION.md` carries the same frozen application baseline. T2/P0 describe the transition operationally as a verified Genesis predicate, permissionless invocation and independent revalidation. Therefore the current PRE-RICH Genesis activation predicate is **verified PRE Treasury >= 4000 USDM**; no additional numerical stability/trajectory threshold should be invented.

The apparent reference in the End-to-End map to “activation follows the required ladder/stability condition and economic trajectory” belongs to the **Jackpot activation/funding section**, where `StableLadder(S)` is explicitly defined. It is not evidence of an additional PRE-GENESIS → GENESIS predicate.

### Critical distinction now clarified

The rule is **not** “ignore all PRE bootstrap when entering Genesis.” The rule is:

- the Snek/PRE bootstrap supply is historical/application bootstrap state;
- it is **not automatically PrizePool liquidity** and must not be counted as such;
- a verified PRE amount held in the protocol-controlled **PRE Treasury** may satisfy the Genesis bootstrap predicate when the canonical Treasury observation/value proves `>= 4000 USDM`;
- only resources explicitly admitted by the PRE-RICH Genesis accounting rules enter the Genesis economic starting state;
- no automatic conversion of the entire PRE bootstrap supply into PrizePool capital occurs.

So the transition is better represented as:

`PRE-GENESIS observed state → verify PRE Treasury value >= 4000 USDM → crystallize Genesis boundary → Genesis (price = 1 USDM)`

with the bootstrap token supply retained as provenance/history and with Treasury admission separated from PrizePool liquidity admission.

### Remaining implementation/evidence work

The semantic predicate is now **CLOSED** at application level. What remains is conformance/evidence:

1. identify the authoritative on-chain Treasury observation and valuation path;
2. prove the observed PRE Treasury value is actually controlled by the protocol Treasury and not a user/operator wallet;
3. prove the Genesis transition consumes/revalidates that observation permissionlessly and atomically;
4. prove the Genesis starting state does not silently import excluded bootstrap/Pool-NFT/seed assets into PrizePool liquidity;
5. add a deterministic boundary fixture covering `<4000`, `=4000`, `>4000`, malformed/stale valuation and wrong-Treasury ownership.

**Status:** SEMANTIC CLOSED / IMPLEMENTATION + EVIDENCE OPEN.


## 2026-09-22 — P2.8-B.1 reference-script provider decoding repair

Fresh-head CI on `cc81bf3` did **not** reach Plutus execution: the Lucid/Emulator provider rehydrated the two real reference-script UTxOs without a decoded `scriptRef`, despite those outputs having just been created by the fixture's reference-script transactions.

Repair on `work/immortal-green-closure`:
- retain selection by the exact creating transaction hash;
- preserve the provider-returned UTxO;
- restore the already-known `prizeScript` / `poolScript` as the `scriptRef` field only when the provider omitted it;
- feed those UTxOs to `readFrom()`.

This is a provider-decoding/fixture-boundary repair, not a validator bypass: the reference scripts are still deployed as real ledger UTxOs and are not attached inline to Reveal.

Commit: `4db25d9b74bad1fae50b6aaf8702194b4ed6c811`.

**Status:** fresh emulator CI triggered; validator execution/resource evidence remains OPEN pending the new run.


## 2026-09-22 — PRE-GENESIS → GENESIS dynamic stress laboratory v0.1

**Front:** PRE-GENESIS / GENESIS transition conformance — dynamic market/valuation stress

Triangulation against the current PRE-RICH canon resolved the earlier apparent ambiguity: the Genesis application predicate is the verified PRE Treasury value >= 4,000 USDM. The End-to-End map's stability/trajectory language belongs to the Jackpot StableLadder section, not to a second Genesis threshold. No stability window or extra numerical threshold was introduced.

A first deterministic stress harness was added:
- audit/pre-genesis-genesis/README.md
- audit/pre-genesis-genesis/stress-lab.mjs

The harness exercises:
1. Treasury value below 4,000;
2. exact 4,000 crossing;
3. crossing followed by a PRE price dump before submission;
4. committed Genesis followed by a PRE price dump;
5. stale valuation;
6. wrong Treasury destination;
7. duplicate/concurrent-style second transition.

It asserts the critical accounting boundary that Genesis activation does not silently increase PrizePool liquidity.

The PRE quantity × observed price calculation is explicitly scenario instrumentation, not a new oracle/valuation rule. A real deployment must replace it with the verified Treasury valuation path.

Commits: 823ccca8d2dee5167ecbfea6528bc7f4f6119dc7 (lab contract) and e9a614023fc215ecd31921a90593d7fc7f4d9647 (harness).

**Status:** deterministic lab scaffold IMPLEMENTED / executable evidence pending runtime execution. On-chain transition implementation remains OPEN. Passing this harness will not be treated as ledger conformance proof.

## 2026-09-22 — P2.8-B.1 budget probe: diagnostic path reached, serialization repair

The explicit high-budget probe reached the fixture but stopped before validator execution because the diagnostic JSON still contained a BigInt protocol-parameter value. This was a test-observability defect only.

Repair:
- serialize all diagnostic BigInt values through a JSON replacer;
- no validator, cost model, economic parameter or protocol invariant changed.

Commit: 7ecd9c2255c895463b4640d7e555c2a2a1ac4190.

**Status:** fresh budget-probe CI triggered; real validator execution evidence still OPEN.


## 2026-09-22 — P2.8-B.1 probe result: budget ceiling ruled out; Pool validator evaluator failure

The diagnostic emulator was run with `maxTxExMem=100,000,000,000` and `maxTxExSteps=100,000,000,000`. The Reveal still failed at `Spend[1]`, with:
`attempted to case a non-const Value Con(ProtoPair(Integer,List(Data),...))`.

Therefore the previous 30B/20B execution-budget overrun cannot be treated as the root cause. The enlarged-budget probe reaches a deterministic UPLC evaluator error in the second spending validator, which is the B1PrizePool path. This is now classified as an **emulator/script-evaluation compatibility or script-term issue**, not as evidence that the validator merely needs a larger budget.

Repository facts:
- `pre-rich-plutus.cabal` compiles against `plutus-core`, `plutus-ledger-api`, and `plutus-tx` 1.67.0.0.
- The off-chain harness uses legacy `lucid-cardano` 0.10.11.
- Lucid 0.10.11's release history includes an UPLC update; this makes evaluator/compiler compatibility a concrete investigation target, but does not yet prove incompatibility.

Action taken:
- diagnostic budget environment removed from canonical CI;
- default Cardano-like execution limits restored in workflow commit `0b9c75292814b7aeaccce48fe31f718efcee7bd1`;
- no validator/economic invariant weakened.

Next evidence target: isolate the failing B1PrizePool operation (first `Value`/`valueOf` path versus action branch) and compare the generated Plutus V2 term/evaluator compatibility before changing production validator code.

**Status: P2.8-B.1 remains OPEN — root cause narrowed substantially.**


## 2026-09-22 — P2.8-B.1 next isolation target

The enlarged-budget run proves the failure is an evaluator-level `NonConstrScrutinized` on a `Value` representation in `Spend[1]`. The B1PrizePool validator's earliest unconditional `Value` operation is `singletonPoolTokenValid`, which calls `valueOf` on input/output values before the `TicketRevealed` action branch. Therefore the next diagnostic must isolate that path rather than optimizing the full Reveal or changing economic logic.

No production validator change has been made. The temporary Lucid 0.10.10 CI probe was inconclusive (no executable job was produced) and was removed; it is not evidence.

## 2026-09-22 — PRE-GENESIS → GENESIS verified Treasury admission seam

Triangulation against current PRE-RICH canon, Constitution, existing Oracle machinery, Treasury implementation and stress lab found:
- Genesis predicate remains exactly verified PRE Treasury value >= 4,000 USDM;
- no second Genesis stability window/threshold;
- existing Oracle machinery already verifies asset identity, authorized publisher, freshness and price;
- legacy Treasury.Distribute / tdThreshold is not Genesis authority;
- Genesis still requires binding the valued PRE quantity to the canonical protocol-controlled Treasury state.

Added an application-specific admission seam:
- PRE-RICH/profile/GenesisTreasuryAdmission.ts
- PRE-RICH/profile/GenesisTreasuryAdmission.test.ts
- audit/pre-genesis-genesis/TREASURY-ORACLE-CONCRETE-SURFACE-v0.2.md

The admission layer composes canonical Treasury identity + PRE asset identity + observed quantity + already-verified PRE/USDM price/freshness and returns a fail-closed admission result. It performs no funds transfer and does not replace the existing oracle. On-chain revalidation and the one-shot PRE-GENESIS → GENESIS transition remain OPEN.

Commits: 7455b73ec7a425e8841ca19a1abf1cd522ac243c, 6940d2373eb8c9580e08120febf42c680f604114, aa273d5a7ef066f5cebc4392373f0302855bd22e.

**Status:** application admission seam IMPLEMENTED / runtime and ledger binding OPEN.


## 2026-09-22 — P2.8-B.1 Pool-only Value-path isolation probe

A diagnostic-only Pool-only transaction was added to the real emulator harness after reference-script deployment and before the full Reveal. It spends the actual B1PrizePool UTxO with the real parameterized Pool reference script, recreates the continuing Pool output, and deliberately omits a Prize output. This means a normal evaluator path should reach the existing semantic failure `no prize output` only after the unconditional `singletonPoolTokenValid` checks; a `NonConstrScrutinized` / `attempted to case a non-const` failure would isolate the problem to the Pool validator's unconditional `Value`/`valueOf` path.

The probe is never expected to be accepted and therefore must not mutate emulator state. No validator, economic invariant, cost model or production rule was changed.

Commit: `ca5103e17aeffd02943f61874b54609b33962f35`.

Fresh CI is running on this commit. The branch currently also contains the existing explicit high-budget diagnostic environment in the P2.8-B.1 workflow; any resulting evaluator classification remains diagnostic only and must not be promoted into canonical validator economics.

**Status:** isolation probe IMPLEMENTED / fresh runtime evidence PENDING.


## 2026-09-22 — P2.8-B.1 Pool-only probe: Value evaluator failure isolated

Fresh high-budget CI on commit `5c5cedc903f7caa1df2cc0397b297c1614260449` executed the Pool-only diagnostic before the full Reveal. Result:

- emulator ceilings: `maxTxExMem=100,000,000,000`, `maxTxExSteps=100,000,000,000`;
- Pool-only spend reached the B1PrizePool validator;
- failure was `Spend[0] attempted to case a non-const` on `Value Con(ProtoPair(...))`;
- diagnostic classified it as `EVALUATOR_VALUE_FAILURE` before action semantics.

This is materially stronger isolation than the full Reveal result: the Prize validator is not involved, the action branch does not need to be reached, and the failure occurs on the unconditional Pool path. The earliest relevant operation remains `singletonPoolTokenValid` → `valueOf` over transaction values.

Canonical workflow was restored to default Cardano-like emulator execution limits, and the diagnostic Pool probe is now gated behind explicit `P2_8_B1_POOL_VALUE_PROBE=1`; no production validator/economic change was made.

Commits: `42ae99229d8323f498f5759f0c5312e2de3a3b38` (diagnostic gate), `29dfce1dfbdfc419cc149a7b2c33fef22400d308` (canonical workflow limits).

**Status:** P2.8-B.1 ROOT-CAUSE CLASS NARROWED — evaluator incompatibility/term semantics in B1PrizePool Value path; production repair still OPEN.
## 2026-09-22 — Genesis valuation unit triangulation correction

A second triangulation against the current economic accounting model found an important unit boundary in the new admission seam:
- PRE-RICH economic amounts are represented in USDM sub-units where the Cardano economic layer performs valuation;
- canonical `1 USDM = 100 sub-units`;
- therefore the frozen Genesis threshold `4,000 USDM` corresponds to `400,000` USDM sub-units at the economic-kernel boundary.

The admission seam was corrected accordingly:
- `USDM_SUBUNITS_PER_USDM = 100`
- `GENESIS_PRE_TREASURY_THRESHOLD_USDM_SUBUNITS = 4000 * 100`
- valuation helper explicitly returns USDM sub-units.

This is a conformance correction, not an economic parameter change. The human-readable stress lab remains expressed in USDM; the application admission boundary now matches the economic accounting unit.

Separate Oracle qualification remains OPEN: the existing on-chain Oracle verifier is usable as an authenticated mechanism, but the canonical deployment PRE→USDM source set/provider is still an open evidence gate. The admission seam therefore accepts only an already-verified price/reference and does not claim to solve provider qualification.

Commits: `e4b83edcaac1b594ee0f7d7b3964cafd660ce930`, `67f4a70e849bcfbbdd098107a198210ba29609a6`, `ac1185e117a597624abd93c9f338184aaa4f1b72`.

**Status:** unit boundary corrected / canonical PRE→USDM source qualification OPEN / on-chain Genesis transition OPEN.


## 2026-09-22 — P2.8-B.1 diagnostic classifier hardened

The Pool-only diagnostic previously had a binary classifier and re-threw any result that was neither `non-const` nor the expected semantic failure. A real run exposed a third legitimate diagnostic outcome: `execution went over budget` with the probe's intentionally incomplete transaction. The probe has therefore been hardened to classify three known outcomes explicitly: `EVALUATOR_VALUE_FAILURE`, `BUDGET_OVERRUN`, and `SEMANTIC_VALIDATOR_FAILURE`; only genuinely unclassified failures abort the harness. A budget overrun is logged as diagnostic/non-semantic and no longer prevents execution of the real Reveal that follows.

Commit: `139e4f3ff9bcc7fa0402c0f5cb21a45d66d85444`.

**Status:** diagnostic tooling GREEN; fresh real-Reveal evidence still required.

## 2026-09-22 — Genesis admission seam reconciled with existing Plutus boundary

Triangulation found that the repository already contained `PRE-RICH/profile/PreRichGenesisAdmission.hs` and already exposed it from `pre-rich-plutus.cabal`. This is the canonical application-side admission seam; creating a parallel TS-only authority would have duplicated the boundary.

The existing Haskell helper was corrected to the canonical economic unit:
- `1 USDM = 100` sub-units;
- Genesis predicate threshold = `4000 * 100 = 400000` USDM sub-units;
- `genesisTreasuryValueUsdm` therefore returns USDM sub-units and compares against the same unit.

Added `plutus/test/GenesisAdmissionTest.hs` and registered `genesis-admission-tests` in the Cabal package. The suite covers exact threshold, below threshold, stale Oracle, wrong Treasury evidence and wrong source regime.

This supersedes the risk of treating the newer TypeScript admission seam as a second authority. The TS seam remains an application/off-chain mirror for the stress/evidence tooling; the Plutus admission contract is the authoritative candidate for on-chain integration.

Commits: `f54d6da755bdd14941456692755aef36ab278e90`, `63e4bb6663a4d24aabafc95a2a9e2a263b6afe58`, `0d2d72ea5b228283b0a65099a148f8176c571f7f`.

**Status:** existing Plutus admission seam reconciled and unit-correct / test suite added / actual Cabal+Plutus CI execution still required / concrete PRE-GENESIS state carrier and atomic transition remain OPEN.


## 2026-09-22 — Genesis admission CI repair

The first Genesis admission CI execution exposed an off-chain test harness defect, not a Genesis semantic failure: `node --import tsx/esm` under the repository's ESM/CJS resolution path could not resolve the extensionless `./GenesisTreasuryAdmission` import. The test now imports `./GenesisTreasuryAdmission.ts` explicitly (`59ef6f150b4ff86b92e1fc450951c6d6b64966d6`).

The Plutus-side `genesis-admission-tests` suite was also added to the existing kernel regression command (`ee99cbdef3426f33bc1808ef39eee990c24b9736`) so the canonical Haskell admission seam is exercised by CI rather than remaining only registered in Cabal.

No Genesis predicate, threshold, oracle rule, or economic invariant changed. Fresh CI evidence is pending.

**Status:** CI harness repair IMPLEMENTED / fresh Genesis TS + Plutus execution PENDING.


## 2026-09-22 — Notion mapping reconciled with live repository

A broad Notion mapping pass was completed across the current architecture/evidence graph, including the Multi-Front Workflow Checkpoint, T2 Transition Conformance, Architecture & State Machine, Economic Usage Fee workflow, Snek Gates 26–41, governance integration and Algorithmic Governability.

The important new repository-level conclusion is precise:
- Notion freezes the PRE-RICH regime chain as PRE_GENESIS → GENESIS → ACTIVE → QUIESCENT and binds Genesis activation to verified PRE Treasury value >= 4,000 USDM.
- The repository already contains the authoritative candidate Plutus admission seam `PRE-RICH/profile/PreRichGenesisAdmission.hs`, exposed in `plutus/pre-rich-plutus.cabal`.
- That seam verifies the Genesis predicate but does not carry/mutate a canonical PRE-GENESIS/GENESIS state.
- A current-branch tree inspection found no dedicated Genesis state datum/action/validator module.
- Therefore the remaining Genesis gap is the **application state carrier + atomic on-chain transition/concurrency boundary**, not another economic predicate.
- The TS admission seam remains an off-chain/evidence mirror and must not become a second authority.

The complete mapping is recorded in:
`docs/COORDINATION/NOTION-MAP-IMPLEMENTATION-CROSSWALK-v0.1.md`

Notion evidence also confirms that Snek/Splash Gates 26–41 are a separate external-event/source-qualification workstream. Their historical pool/price evidence must not be silently promoted to the Genesis PRE→USDM oracle source.

**Next Genesis action:** inspect the existing Cardano datum/validator topology and derive the smallest PRE-RICH regime-bearing state carrier from T2/P0 before writing any transition code. No second economic state machine and no invented threshold/Oracle source.

Commit: `59f1279e4a4c864e85d4950de45a7d268ebea2a6` (crosswalk).

**Status:** NOTION MAP RECONCILED / GENESIS CARRIER GAP CONFIRMED / IMPLEMENTATION DESIGN NEXT.


## 2026-09-22 — P2.8-B.1 evaluator provenance narrowed to embedded UPLC engine

A direct dependency audit of the Lucid 0.10.11 emulator identified a concrete evaluator-version boundary:

- Lucid 0.10.11's embedded Cardano Multiplatform Library declares the Rust `uplc` dependency from `aiken-lang/aiken` at exact revision `3d77b5c378ce404cddd9a1f111906d72fd46fc83`.
- That Aiken commit is the 2024-09-20 release commit and identifies `uplc` as version 1.1.3.
- Therefore the Lucid 0.10.11 Emulator is not evaluating with the current 2026 Plutus CEK implementation; it carries a frozen 2024 UPLC engine inside its CML WASM dependency.
- The repository's PRE-RICH Plutus build uses Plutus 1.67-era libraries. Current Plutus release material documents that `PlutusLedgerApi.V1.Data.Value.valueOf` was rewritten in the 1.62 line to walk the underlying BuiltinList directly, and later Plutus releases added/changed Value-related UPLC machinery and conformance work.
- The observed Lucid error `attempted to case a non-const` on `Value Con(ProtoPair(...))` is therefore consistent with a cross-generation UPLC evaluator/term-semantics mismatch, rather than evidence that the B1PrizePool economic logic is invalid.

This is not yet a production repair and is not treated as proof that every Lucid 0.10.11 / Plutus 1.67 combination is incompatible. It is, however, a materially stronger root-cause hypothesis because the evaluator implementation is now identified exactly rather than inferred from the error text.

### Required next proof

1. Reproduce the same parameterized B1PrizePool artifact with an evaluator known to implement the corresponding Plutus language semantics/cost model (preferably the Plutus `uplc` tool or a current node-compatible evaluator).
2. Run the existing Pool-only fixture against that evaluator using the same datum/redeemer/context.
3. If the current evaluator succeeds or reaches the intended semantic `no prize output` failure, classify Lucid 0.10.11's embedded evaluator as the test-harness incompatibility and do not alter validator economics.
4. If the current evaluator reproduces the same `NonConstrScrutinized` failure, inspect the compiled UPLC term itself before changing production code.

No validator, economic parameter, invariant, or canonical workflow was changed by this investigation.

**Status:** P2.8-B.1 ROOT-CAUSE HYPOTHESIS STRENGTHENED / EVALUATOR PROVENANCE IDENTIFIED / PRODUCTION REPAIR OPEN.

---
## 2026-09-22 — PRE-GENESIS → GENESIS regime carrier seam

**Front:** Genesis application-state carrier / P0 transition binding

Triangulation against Notion T2/P0 and the live branch confirmed that the Genesis economic predicate is already implemented in `PreRichGenesisAdmission.hs`, while the repository lacked a dedicated regime-bearing state carrier for the canonical lifecycle `PRE_GENESIS → GENESIS → ACTIVE → QUIESCENT`.

Added the smallest non-economic application seam:
- `PRE-RICH/profile/PreRichRegimeState.hs`
- `plutus/test/GenesisRegimeCarrierTest.hs`
- `PreRichRegimeState` added to `pre-rich-plutus.cabal` and registered as `genesis-regime-carrier-tests`.

The carrier deliberately contains only the application lifecycle regime. It does **not** duplicate EconomicStateV3, Treasury balances, Oracle state, PrizePool liquidity, or IMMORTAL economic formulas. The only transition exposed is `PreGenesis -> Genesis`, and it composes the existing `genesisPredicate` fail-closed. Calls from Genesis/Active/Quiescent, below-threshold observations, and non-PRE-GENESIS observations reject.

This is a **state-carrier/conformance seam**, not yet the Cardano datum/validator transition. The remaining on-chain work is to bind this regime state to the canonical Treasury observation and make the permissionless transition atomic with independent revalidation, without introducing a second economic machine.

Commits:
- `884fc547c92ae6ef38f6bed2b967de58af71d672` — carrier
- `b1e689205d34a7a5455cc15b1345958bd6251d4b` — syntax correction
- `014fa703973b584da9a54abff5740dec2d6d0abe` — Cabal exposure/test registration
- `1b305752b95e6d1e27edbbe352c04844f161afff` — carrier conformance test hardening

**Status:** application carrier IMPLEMENTED / on-chain atomic transition OPEN / CI evidence pending.


## 99. SESSION UPDATE — Lucid evaluator provenance / P2.8-B.1 differential closure

**Snapshot:** 2026-09-22  
**Front:** P2.8-B.1 real emulator Reveal  
**Status:** **ROOT-CAUSE HYPOTHESIS STRENGTHENED / PRODUCTION REPAIR OPEN**

Current implementation evidence on `work/immortal-green-closure`:

- `package.json` declares `lucid-cardano ^0.10.11`; the lockfile pins Lucid 0.10.11.
- The canonical Reveal harness still uses the real parameterized PRE-RICH `PrizeValidator` and `B1PrizePool`, with separate reference-script UTxOs.
- Canonical emulator limits remain unchanged; the latest real Reveal failure is execution-budget exhaustion.
- A high-budget diagnostic previously changed the terminal failure to `attempted to case a non-const` on a `Value` term.
- The Pool-only isolation probe can independently reach the Value path before action semantics; budget/evaluator failures are classified separately and do not weaken the validator.

**External evaluator provenance evidence (research, not protocol authority):**

Lucid 0.10.11's embedded Cardano Multiplatform Library pins Aiken `uplc` revision `3d77b5c378ce404cddd9a1f111906d72fd46fc83`, corresponding to the 2024-era UPLC 1.1.3 line. Current upstream Plutus continues to evolve its evaluator and `Value` handling; current Plutus release material documents later `Value` implementation changes. Recent upstream issue history also shows that alternate UPLC evaluators can lag protocol-version/builtin semantics.

This makes an **evaluator-generation incompatibility** a strong root-cause hypothesis for the observed `Value Con(...)` / `NonConstrScrutinized` behavior, but it is **not yet production proof**.

**Required next experiment — differential evaluator proof:**

1. Keep the existing PRE-RICH validator bytes, parameters, datum, redeemer and transaction context unchanged.
2. Evaluate the same Pool-only fixture with a current/node-compatible/reference Plutus evaluator.
3. If the current evaluator reaches the intended validator-level semantic failure (missing Prize output), record Lucid 0.10.11 as a harness/evaluator incompatibility and do **not** alter validator economics.
4. If it reproduces `NonConstrScrutinized`, inspect the compiled UPLC term and its source/toolchain before changing production code.
5. Do not raise canonical emulator limits, remove `Value` checks, weaken invariants, or change economic parameters as a workaround.

**Fresh CI observation:** the PRE-RICH emulator workflow is still failing on the current sequence of branch commits; a newer run is in progress. No green claim is made until a real Reveal completes.

**No normative/economic changes in this update.**



## 2026-09-22 — P2.8-B.1 current-head CI re-observation

**Head:** `7ed1250443006815486d8125e77530a53a847512`

Fresh workflow observation after the evaluator-provenance coordination update:

- PRE-RICH Cardano Emulator Reveal run **97** (`35773924559`) completed **FAILURE** at the single `Run real emulator reveal` step.
- Setup, checkout and dependency installation all succeeded; the failure is therefore still inside the real emulator path, not CI bootstrap.
- No successful Reveal evidence was produced; P2.8-B.1 remains OPEN.
- Kernel Invalid-Class Fail-Closed Audit run **630** is currently IN PROGRESS.
- IMMORTAL Cardano Integration Lab run **317** is currently IN PROGRESS on an earlier head; no promotion is made until its actual result is observed.

This observation supersedes the earlier wording that the Reveal run was merely “in progress”. No validator, economic parameter, cost limit, or invariant was changed.



## 2026-09-22 — Algorithmic Governability executable adversarial lab

**Front:** FRONT E — Algorithmic Governability  
**Status:** EVIDENCE HARNESS IMPLEMENTED / EXECUTION PENDING

Added a non-normative executable lab:
- `audit/algorithmic-governability/README.md`
- `audit/algorithmic-governability/no-result-dependent-authority.mjs`

The harness models already-established boundaries without introducing new protocol parameters:
- two monitors receive the same immutable observation but derive different metrics;
- authority and evidence contract remain fixed before monitor evaluation;
- a result-dependent authority/evidence-contract mutation is detectable and rejected by the adoption boundary;
- a partial search cannot be adopted as a claim of a complete normative universe;
- recovery cannot silently widen the search domain or safe set.

Commits:
- `5c7a4c6b1fbc4e10ff357167a8792061d245020c`
- `d6d5b87bf962c5bb5435c498b1b1796fcb50099d`

No economic/governance rule was changed. The committed script has not yet been executed in the repository runtime, so this is not GREEN until execution evidence exists.


## 2026-09-22 — Algorithmic Governability lab wired into CI

The adversarial lab is now executable automatically on pushes/PRs through:
- `.github/workflows/algorithmic-governability.yml`

Commit: `54147b36ea08781d2e0e22ee28bb0dd697858978`

The front remains **CLOSING / execution evidence pending** until the workflow run is observed. No normative rule or economic parameter changed.


## 2026-09-22 — Genesis carrier authentication boundary clarified

Direct current-branch inspection of `PreRichGenesisAdmission.hs`, `Economic.hs`, `B1PrizePool.hs`, `Treasury.hs`, `BeaconRegistry.hs` and the script export surface found a precise remaining Genesis gap: `GenesisTreasuryObservation` currently contains boolean evidence flags and verified values, but does not itself bind those values to actual Treasury/Oracle transaction inputs.

The carrier design was updated in `PRE-RICH/docs/GENESIS-REGIME-CARRIER-DESIGN-v0.1.md` (commit `1ae6077e1706f714eb895172b39d5f8b90ce1651`).

Required final shape:
`actual Treasury / Oracle refs → authenticated observation → existing genesisPredicate → ActivateGenesis`.

The existing predicate remains authoritative for the frozen economic condition; no threshold, price, oracle source or universal-kernel rule was changed. The boolean evidence fields must not become caller-supplied proof in the final validator.

**FRONT A status:** `CLOSING / ARCHITECTURE GAP` — next implementation task is the authenticated observation layer plus singleton carrier validator; operational GREEN still requires real ledger evidence.


## 2026-09-22 — Genesis canonical-state identity search closed as evidence gap

A targeted current-branch search was completed for a pre-existing PRE-GENESIS/GENESIS canonical state identity: regime singleton policy/name, state token, dedicated datum/action/validator, registry binding, or deployment configuration. Existing Oracle and B1 PrizePool singleton patterns were found, but no Genesis-specific identity is defined on the working branch.

Notion T2/P0 confirms the required semantics — canonical state consumption, stale/conflicting rejection, permissionless invocation and atomic transition — but does not supply a Cardano asset identity. Therefore no identity is inferred from the Pool NFT, Oracle singleton, Treasury address, or historical Snek deployment.

The implementation boundary is now explicit: **Genesis Cardano singleton identity remains OPEN**, and the next implementation step must come from an authoritative deployment/decision source or an explicit application decision. No new economic parameter was introduced.

Supporting gap-map update: commit `82e54f657dcb04a20d707e44f1d576660bd9faa9`.


## 2026-09-22 — Genesis carrier implementation promoted to compile/evidence gate

**Front:** FRONT A — Genesis / PRE-GENESIS

Implemented the first Cardano carrier seam in `PRE-RICH/profile/GenesisRegimeCarrier.hs`.

The carrier is deliberately application-owned and separate from Treasury and B1PrizePool. Its datum binds:
- regime and monotonic transition nonce/version;
- canonical Treasury ScriptHash;
- canonical PRE asset identity;
- canonical Oracle singleton identity and publisher;
- carrier singleton identity;
- canonical B1PrizePool ScriptHash.

`ActivateGenesis` now requires, at validator level:
- exactly one own carrier input;
- exactly one continuing carrier output;
- PRE_GENESIS → GENESIS only;
- deterministic nonce/version increment;
- singleton carrier token conservation;
- exactly one authenticated Treasury reference with decodable Treasury datum;
- exactly one matching fresh Oracle reference carrying the authenticated Oracle singleton;
- PRE quantity and PRE→USDM price reconstructed from those reference inputs;
- the existing `genesisPredicate` applied to that reconstructed observation;
- no B1PrizePool input/output in the Genesis transition, preventing silent bootstrap→PrizePool reclassification in this atomic step.

Build/export integration:
- `plutus/pre-rich-plutus.cabal` exposes `GenesisRegimeCarrier`;
- `plutus/export/Export.hs` exports `genesisRegimeCarrier.plutus.json`;
- `.github/workflows/genesis-regime-carrier.yml` builds the Plutus package, exports scripts and asserts the artifact exists.

Commits:
- `f87b59b5c8159013b8543e340e99c54e4bb9fbe0` — authenticated carrier implementation
- `6063addc09e3711dec1565406a7b7f8f49ac91a6` — cabal exposure
- `62571c2496c1256823a4c7e837b4bf9a58dcf5b0` — script export
- `6f0a05d83a80cdba08d51c1e537d7ebf6f660604` — declaration cleanup
- `8f24d644a2b8947a30eda3cc8de3ae495a52a066` — CI compile/export gate

**Status:** `CLOSING / CI PENDING`. This is not GREEN until the actual workflow compiles the validator and exports the artifact, followed by emulator and real-ledger transition evidence. No new economic threshold or oracle source was introduced.


## 2026-09-22 — Genesis carrier implementation review: two closure blockers retained

Review of the newly implemented `PRE-RICH/profile/GenesisRegimeCarrier.hs` confirms that the authenticated observation layer is now materially stronger: Treasury and Oracle reference inputs are reconstructed from transaction data, the existing `genesisPredicate` is reused, and the transition explicitly excludes B1PrizePool inputs/outputs.

Two distinct closure blockers remain and are now recorded explicitly:

1. **Carrier singleton authority is not yet demonstrated.** The validator conserves exactly one carrier token for the consumed/continuing state, but the reviewed branch does not yet expose a carrier minting/burning policy or deployment-level proof that the configured carrier policy/name can exist in exactly one canonical UTxO globally. Conservation inside one transition is not by itself proof of global singleton uniqueness.
2. **Treasury datum semantics are only structurally decoded.** `findSingleTreasuryReference` requires a decodable `TreasuryDatum` at the canonical Treasury ScriptHash, then derives PRE quantity from the actual UTxO Value. It does not currently validate any datum field against a canonical migrated Treasury-state contract. This is acceptable as an observation seam only if the canonical Treasury identity/address is itself the authoritative state boundary; otherwise the Treasury migration front must supply the missing semantic binding. The legacy percentage fields must not be reused as Genesis authority.

The current carrier CI described in the coordination entry is a compile/export gate, not ledger conformance evidence. The integration lab triggered from the same development line is still the required evidence path for actual transition behavior, and the final closure criterion remains positive + negative ledger evidence including duplicate/concurrent-state rejection and singleton uniqueness.

**Classification:** carrier implementation = substantive progress / authenticated observation = implemented seam / singleton authority = OPEN / Treasury semantic migration binding = OPEN / real-ledger transition evidence = OPEN. No economic parameter changed.


## 2026-09-22 — Genesis carrier CI strengthened

The Genesis Regime Carrier workflow was previously compiling/exporting the new carrier but did not execute the already-registered `genesis-regime-carrier-tests` suite. The workflow has now been strengthened to run that conformance suite before script export.

Commit: `8f8eaa17f4acd46d1eb58aed7be986c308a2a337`.

This is evidence-pipeline hardening only: no Genesis predicate, threshold, Oracle rule, Treasury semantics, or carrier validator logic changed. The carrier remains **CI PENDING** until the new workflow run completes; emulator/real-ledger transition evidence remains OPEN.

## 2026-09-22 — Genesis carrier singleton authority implementation seam

A policy-level singleton authority has now been added for the application-owned Genesis carrier. `PRE-RICH/profile/GenesisCarrierMintPolicy.hs` is a one-shot minting policy parameterized by a concrete seed `TxOutRef` and carrier `TokenName`: it succeeds only when the seed UTxO is consumed and the policy mints exactly one configured carrier asset; there is no burn path. The policy is exposed in Cabal, exported as `plutus/out/genesisCarrierMintPolicy.plutus.json`, and the Genesis carrier CI now asserts both carrier artifacts.

This closes the **policy-design** portion of the singleton-authority gap without changing Genesis economics. It does not yet constitute deployment or ledger evidence: the real seed reference, resulting policy ID/name, initial PRE-GENESIS carrier placement, and successful ActivateGenesis transition still require conformance evidence. The carrier token remains application-state identity only and must not enter Treasury, PrizePool, ProtectedCapital or RawSurplus accounting.

Detailed design/evidence note: `docs/COORDINATION/GENESIS-CARRIER-SINGLETON-AUTHORITY-v0.1.md`.

**Status:** singleton authority DESIGN IMPLEMENTED / DEPLOYMENT + LEDGER EVIDENCE OPEN.


## 2026-09-22 — Genesis carrier CI trigger coverage hardened

Review of `.github/workflows/genesis-regime-carrier.yml` found an evidence-pipeline blind spot: the push trigger already watched `PRE-RICH/profile/GenesisCarrierMintPolicy.hs`, but the pull-request trigger did not. A PR changing the singleton authority policy could therefore bypass the Genesis carrier conformance workflow until a later push path matched.

Fixed by adding `PRE-RICH/profile/GenesisCarrierMintPolicy.hs` to the PR path filter. No validator, singleton semantics, Genesis predicate, economic parameter, or deployment identity changed.

Commit: `8b1026085027e9f049dbbd76d9a502640e0ae0d2`.

**Status:** CI trigger coverage CLOSED for the reviewed carrier/mint-policy paths; actual compile/test/export and ledger transition evidence remain separate closure requirements.


## 2026-09-22 — P2.8-B.1 external evaluator differential target sharpened

Fresh upstream Plutus release inspection strengthens the planned differential experiment without changing repository semantics. Current Plutus releases expose the `uplc` executable; the 1.67 release added broader `Value` API support and the 1.68 release notes explicitly record new untyped-CEK casing support for builtin constants including `pair`, with corresponding conformance tests. This is relevant to the observed Lucid failure at a `Value Con(ProtoPair(...))` case boundary.

This is **external evaluator/toolchain evidence only**, not protocol authority and not proof that the Lucid failure is definitively caused by evaluator generation. The required experiment remains: evaluate the unchanged parameterized Pool-only artifact/context with a current Plutus `uplc` evaluator, then compare the terminal semantic boundary. No validator/economic workaround is justified by this evidence.

Source: IntersectMBO/plutus release history, current 1.67/1.68 release material. citeturn0search0

**Status:** P2.8-B.1 differential evaluator experiment remains OPEN; root-cause hypothesis strengthened.


## 2026-09-22 — Genesis singleton authority: real-ledger evidence path added

**Front:** FRONT A — PRE-GENESIS → GENESIS / singleton authority / Cardano realization

The policy-design gap has been advanced to an executable ledger-evidence path without introducing any new economic rule.

### Added

- `src/__tests__/genesis-carrier-mint-policy-emulator.mjs`
  - executes the exported one-shot carrier mint policy against the Lucid/Cardano emulator;
  - mints exactly one configured carrier asset from an explicit fixture seed `TxOutRef`;
  - attempts the same mint again and requires rejection;
  - attempts a burn and requires rejection.
- `audit/pre-genesis-genesis/genesis-carrier-ledger-trace.ts`
  - real Yaci/Cardano-node trace;
  - creates an explicit non-production fixture Treasury reference UTxO carrying exactly 10,000,000 PRE tokens, valued at 0.0004 USDM/PRE = 4,000 USDM;
  - creates an Oracle reference UTxO carrying the singleton token and authenticated OracleDatum at 1,000,000 precision;
  - mints the one-shot Genesis carrier and places it in the PRE-GENESIS carrier state;
  - spends that carrier with `ActivateGenesis`;
  - independently supplies Treasury/Oracle as reference inputs;
  - requires the validator to accept the atomic PRE-GENESIS → GENESIS transition;
  - resubmits the consumed transition and requires replay rejection;
  - records the transaction CBOR and state/identity evidence under `audit/yaci-evidence/`.
- `.github/workflows/pre-genesis-genesis-cardano.yml`
  - builds fresh Plutus artifacts;
  - starts Yaci DevKit;
  - derives the funded CI wallet;
  - executes the real Genesis carrier transition trace;
  - uploads the resulting ledger evidence.

### Important evidence boundary

The fixture uses explicit test-only asset identities and hashes. It proves the **validator/policy realization path**, not production deployment identity. It does not yet prove that the repository's canonical production Treasury migration contract supplies the authoritative Treasury state semantics; the existing carrier validator still structurally decodes `TreasuryDatum` and derives PRE quantity from actual Value.

No Genesis threshold, Oracle source, stability period, PrizePool accounting rule, or IMMORTAL economic formula was changed.

**Status:** singleton policy = IMPLEMENTED; emulator singleton evidence = WIRED; real Yaci transition evidence = WIRED / EXECUTION PENDING; production Treasury semantic binding = OPEN.


## 2026-09-22 — Genesis evidence pipeline syntax repair

The Genesis export surface was re-inspected after wiring the ledger lab. A generated edit had left literal `\\n` escape text in `plutus/export/Export.hs` between the carrier and mint-policy export calls. This was corrected in commit `b8e574aae9b1e84760823905a7807fde80246fb8`.

No validator or economic logic changed. The next Genesis workflow run is the first meaningful compile/export + Yaci execution check for the new evidence path.


## 2026-09-22 — Genesis Yaci trace review: closure boundary sharpened

Reviewed the newly wired `audit/pre-genesis-genesis/genesis-carrier-ledger-trace.ts` and its CI workflow. The trace is materially stronger than the previous pure/profile evidence: it constructs actual Treasury and Oracle reference UTxOs, mints the application carrier through the one-shot policy, executes `ActivateGenesis` against the fresh exported Plutus validator on Yaci, observes the resulting GENESIS carrier UTxO, and re-submits the consumed transaction for replay rejection.

Two evidence limits are retained deliberately:

1. The Treasury datum in the fixture is structurally valid but intentionally synthetic. The carrier validator currently decodes it and derives PRE quantity from actual Value; it does not yet prove production Treasury migration semantics. Therefore this is **validator realization evidence**, not production Treasury-authority evidence.
2. The current trace does not create an actual B1PrizePool fixture and compare its pre/post accounting state. The validator explicitly rejects PrizePool script inputs/outputs, so the atomic transition cannot directly mutate such a pool through the carrier transaction, but the requested end-to-end accounting delta evidence remains OPEN until a concrete pool fixture or equivalent ledger-state witness is included.

No economic rule was changed. Status remains: **real Yaci transition = execution pending; replay boundary wired; production Treasury semantic binding OPEN; explicit PrizePool accounting-delta evidence OPEN.**

## 2026-09-22 — Genesis Treasury admission malformed-input coverage extended

The existing application-level Genesis Treasury admission fixture already covered below/exact/above threshold, stale/unverified valuation, wrong Treasury, wrong asset, wrong publisher and wrong source regime. It now also explicitly covers negative PRE quantity, negative verified price, and invalid negative oracle precision.

Commit: `6845537105d5d6088ad2bbb612c030b6a96d4412`

No Genesis predicate, threshold, Oracle semantics or accounting rule changed. This only closes malformed-input evidence at the off-chain admission mirror; Plutus/ledger evidence remains separate.


## 2026-09-22 — Genesis export surface re-verified and repaired again

A fresh repository read exposed that `plutus/export/Export.hs` still contained literal escaped-newline text around the Genesis carrier mint-policy export despite the earlier claimed repair. The source has now been normalized so both Genesis artifacts are emitted as ordinary Haskell declarations.

Commits:
- `3b9d1813354f0c58b359f4d75faae93a6410abfb` — repair escaped source literal
- `5302dde6e1e26438e7c90c50f0d94e6e4dfb2413` — normalize declaration formatting

This is evidence-pipeline/source hygiene only. No validator, Genesis predicate, economic parameter, Treasury rule, Oracle rule, or PrizePool rule changed. The important point is that repository inspection, not the previous coordination claim, is treated as authoritative until CI actually compiles/exports the artifacts.


## 2026-09-22 — Materios upstream selector evidence cross-check

Cross-checked the vendored Materios authority-selection implementation against the upstream runtime test surface. The upstream runtime's `spo_integration_tests.rs` directly invokes the runtime `select_authorities` path with deterministic permissioned-candidate inputs and tests both refusal when no candidates are known-live and seating when all candidates are recently live. This is materially stronger than the local TypeScript structural mock for the **algorithm/runtime-selection** portion.

It still does not close the local Materios authority-proof front: the upstream tests are runtime unit/integration tests, not evidence from a finalized production Materios block with an authenticated authority-set transition and real GRANDPA justification. The local PoC therefore correctly remains open for real node/finality/cryptographic evidence.

No IMMORTAL economics or authority semantics were changed.

## 2026-09-23 — Genesis pipeline current-head audit

Current branch head is `051a89fb582d640abe23503b56a99054fc81dd12`. Compared with the previously inspected `67b2687bbc9f4dabf9836f14a29861de755dca31`, the branch is 24 commits ahead and includes the Genesis CI native dependency repair, the dedicated Yaci transition workflow/trace, singleton emulator evidence, malformed-input coverage and Export.hs normalization.

The repository-side Genesis evidence path is therefore materially complete as an executable chain, but no workflow result was available through the current GitHub connector for the new head. Accordingly **no CI/ledger GREEN claim is made**. The next authoritative evidence point is the actual Actions execution of the current head.

No economic or normative parameter was changed in this audit.


## 2026-09-23 — B4 projection boundary strengthened with jackpot protection case

Added a focused conformance case to `plutus/test/ProjectionBoundaryConformanceTest.hs`: a valid V3 state with a locked Jackpot amount of 700 must project that amount into `uesAdditionalProtectedCapital`, and the resulting state must still satisfy the V3/Universal ProtectedCapital and RawSurplus boundary equivalence witness.

This closes a previously unpinned **representation-level** B4 case: Jackpot liquidity is explicitly carried into the universal protected-capital boundary rather than disappearing during PRE-RICH projection. It does not yet prove lifecycle preservation across real transitions or Cardano ledger execution, so B4 remains open for those evidence layers.

Commit: `c2743ffeec110156c5e88756bfb175a205170eb1`.

No economic rule changed; the test only pins the existing projection semantics.

---

## SESSION RESULT — Genesis ledger pipeline unblock

**Date:** 2026-09-23
**Front:** PRE-GENESIS → GENESIS / Cardano evidence

The Genesis Cardano workflow was inspected against its actual GitHub Actions failure. The previous run 35782577203 did not reach Yaci: fresh Plutus export was blocked by a stale call site in B1PrizePool.hs, where legacyB1ToUniversalEconomicState had acquired the required EconomicProfile parameter but B1 still called it with only the datum.

**Fixes committed:**
- a446c4f269a5cb76e8f2dba0905290ee6d990e1a — bind B1 universal projection to the canonical PRE-RICH profile.
- e4240d90c83fd2f3c4c793aecf143c5f40ca95cb — make Genesis Cardano conformance trigger on B1/projection changes.
- a61332b7c138e25fc417b85b8c24a97801e084f8 — mirror those paths in the PR trigger.

**Economic semantics unchanged:** the projection uses the existing PRE-RICH profile, including the application-supplied 500x payout parameter; no universal constant or Genesis threshold was changed.

**Genesis canonical fixture remains:** 10,000,000 PRE valued at 0.04 USDM/PRE = 4,000 USDM.

**Evidence status:** previous Genesis workflow failure was build-time only; it is not ledger evidence. The corrected commits now need a fresh Genesis workflow execution before claiming ledger conformance.

**Do not redo:** do not alter Genesis economics or weaken the validator to bypass the build blocker. The blocker was a type/signature integration regression in B1.


---

## 2026-09-23 — current-head Actions status after B1 projection fix

Direct branch inspection now resolves the actual head as `e4240d90c83fd2f3c4c793aecf143c5f40ca95cb`, superseding the previously inspected `051a89fb...`.

Current Actions for this exact head:
- PRE-GENESIS Genesis Cardano Conformance #6: **queued** (ledger evidence not yet executed).
- PRE-RICH Cardano Emulator Reveal #157: **in progress**; currently at dependency installation, so no new evaluator conclusion yet.
- Algorithmic Governability Adversarial Lab #55: **success**.
- IMMORTAL Cardano Integration Lab #341: **cancelled** because a newer/superseding run was triggered.
- Cardano Adapter Sale Conformance #682 and Kernel Invalid-Class Fail-Closed Audit #690: **cancelled** on this push.

This is the first authoritative Actions view for the corrected B1 projection head. No Genesis GREEN claim is made while #6 is queued. The algorithmic-governability execution remains green. Reveal remains an active differential experiment; do not modify validator economics while it runs.

No economic/normative rule changed in this status update.

## 2026-09-23 — B1 projection signature regression repaired and test source normalized

Current-head review after the Genesis pipeline unblock found two remaining integration issues caused by the newly profile-bound universal projection:

- plutus/B1PrizePool.hs had one stale solvencyInvariant call still invoking legacyB1ToUniversalEconomicState without the required preRichEconomicProfileV1 argument. Fixed in 503e111f957aef3f0435fd747fda76773a3a63e5.
- plutus/test/B1LegacyAdapterTest.hs had two stale projection call sites; both are now explicitly bound to preRichEconomicProfileV1 in 7436981fc4bfaf6fcbe4351da6699600f0b20009.
- plutus/test/ProjectionBoundaryConformanceTest.hs contained a literal escaped newline in the import section. Normalized in 9c3dc4cc1623cf2f9c1b6f4705514809abd3457e.

These are compile/integration hygiene fixes only. The canonical PRE-RICH profile remains the application-supplied source of the 500x bound; no universal economic rule changed.

Status: B1 projection binding = implementation repaired; authoritative status remains dependent on fresh CI. Projection B4 representation evidence remains valid; no GREEN claim is made from source inspection alone.


---

## 2026-09-23 — Reveal differential result + Genesis execution started

Fresh current-head evidence:
- PRE-RICH Cardano Emulator Reveal #160 failed again at the **same execution-budget boundary** after dependency installation succeeded: `Spend[0] execution went over budget`, Mem `-29986019900`, CPU `-20004554100`, with `maxTxSize=16384`, `maxTxExMem=14000000`, `maxTxExSteps=10000000000`, PlutusV2 cost-model length 175.
- This reproduces the existing evaluator/budget incompatibility signal; it is not evidence for changing validator economics or transaction-size limits. Differential evaluator experiment remains the correct next diagnostic.
- Genesis Cardano Conformance #8 is now **in progress** on head `503e111f957aef3f0435fd747fda76773a3a63e5`; it has passed checkout, Node and npm dependencies and is currently at Haskell setup. No ledger result yet.
- Algorithmic Governability and Cardano Adapter Sale remain successful on the preceding current head.

No economic/normative rule changed.

## 2026-09-23 — P2.8-B.1 repeated on current head; differential evaluator conclusion unchanged

PRE-RICH Cardano Emulator Reveal #165 on current head a2efef1334740cb930189a76f59331dcb0f748e7 reproduced the identical failure as prior runs: Spend[1] execution went over budget with Mem -29986019900 and CPU -20004554100. The run used the canonical 16KB transaction / 14M ExMem / 10B ExSteps parameters. This reproduces the evaluator-side failure after the B1 projection signature fixes and does not indicate an economic regression.

The current Plutus 1.68 release documentation explicitly records CEK casing on constants of builtin types including pair, with conformance tests passing. This is relevant to the previously observed ProtoPair non-const diagnostic and strengthens the differential-evaluator investigation, but is not by itself proof that the Lucid evaluator is the exact cause. No validator economics were changed.

Genesis Conformance #8 remains in progress from the earlier B1 projection-fix head 503e111f; no ledger GREEN claim until the real transition/evidence step completes.


---

## 2026-09-23 — Reveal run #165 confirms evaluator/budget reproduction

Fresh run #165 fails with the same quantitative execution-budget boundary, now reported at `Spend[1]`: Mem `-29986019900`, CPU `-20004554100`, with unchanged emulator parameters (`maxTxSize=16384`, `maxTxExMem=14000000`, `maxTxExSteps=10000000000`, PlutusV2 cost-model length 175).

This strengthens classification as the same evaluator/budget compatibility issue rather than a transaction-size regression. The correct next experiment remains a differential evaluation of the same validator bytes/datum/redeemer/context under a current/node-compatible/reference evaluator. No validator economics, 500x parameter, or maxTxSize is to be altered to make the emulator pass.

Genesis run #8 remains active at the Plutus build/export stage; Haskell setup and native dependencies have completed successfully. No Genesis ledger evidence is available yet.


## 2026-09-23 — Materios fail-closed boundary + Genesis valuation pin

Current active head advanced through two evidence-only hardening changes:

- `9ba01d689191478490a4470f65c37ab04264701c` — Materios authority-boundary integration test now explicitly verifies that a supplied transition proof verifier returning `false` is rejected with `AUTHORITY_TRANSITION_PROOF_NOT_VERIFIED`. This strengthens the untrusted → verified boundary; it does **not** provide the missing cryptographic verifier.
- `8a203e6ca5f31b85056f3ebc451e01d37d7bf605` — corrected the Genesis Yaci fixture comment so the encoded oracle value is documented as `0.04 USDM/PRE`, not `0.0004`.
- `e25ba45a0c07fddef7d2e182f0cc7227d09d2b85` — pinned the exact admission result for the canonical fixture: `10,000,000 PRE × 0.04 USDM/PRE = 4,000 USDM` (400,000 USDM subunits), while preserving the existing `>= 4,000 USDM` threshold.

No validator economics, 500× bound, maxTxSize, Genesis threshold, or IMMORTAL invariant changed.

**Evidence classification:** the Materios change is boundary/conformance evidence only; Genesis exact-value pin is application admission/fixture evidence only. Neither is a production cryptographic-finality proof nor production Treasury migration proof.

**Workflow status:** fresh Actions execution for the post-change heads is required before any GREEN claim. The repository connector currently exposes no PR-triggered workflow runs for the active commit, so source changes are not promoted to CI GREEN by inspection alone.


## 2026-09-23 — P2.8-B.1 Value lookup differential mitigation

The Reveal evaluator failure was isolated further to the B1 PrizePool validator's direct use of the Ledger API `valueOf` helper on `Value`. The existing Pool-only diagnostic had already failed at the `Value Con(ProtoPair(...))` case boundary before reaching the intended semantic validator branch, so changing economic predicates would have been unjustified.

The B1 validator has now been changed to use an explicit `assetAmount` helper that traverses `getValue` with `PlutusTx.AssocMap.lookup`, preserving the existing zero-on-missing semantics. All B1-local `valueOf` calls were replaced, including singleton Pool authority checks, ticket-owner lookup, and ticket mint binding. No economic formula, payout bound, transaction-size limit, or state transition rule changed.

Commit: `c29dc9989a96b4494c6b0d7a23162e5b3ad38e62`.

**Evidence boundary:** this is a targeted evaluator-compatibility experiment, not yet a proven fix. The next authoritative step is fresh CI/emulator execution against the exact unchanged Pool-only/Revealing contexts. If the evaluator reaches the semantic branch, this materially localizes the prior failure to the `valueOf` boundary; if it still fails at the same `Value` representation, revert this experiment and continue differential evaluation without touching economics.


## 2026-09-23 — P2.8-B.1 stale-artifact gap closed

The first Reveal run after commit `c29dc9989a96b4494c6b0d7a23162e5b3ad38e62` still failed at the identical budget boundary. Repository inspection found an evidence-pipeline issue: `.github/workflows/pre-rich-emulator-reveal.yml` executed the emulator against the committed `src/plutusScripts` artifacts and did not rebuild them from the modified Haskell validator. Therefore that run did **not** test the new `assetAmount` implementation.

The Reveal emulator workflow has now been hardened to install the pinned Plutus native dependencies, run `cabal update`, and execute `cabal run exe:export-scripts` before the emulator tests. This makes the evaluator experiment test the actual current `B1PrizePool.hs` source rather than stale committed artifacts.

Commit: `2c4bcd534887c07e1c480d7262a0df75e76dc84f`.

**Evidence boundary:** prior Reveal failures remain valid as reproduction of the old artifact/evaluator path, but they cannot classify the new `assetAmount` experiment. The next fresh run is the authoritative test. No economics, 500x bound, tx-size limit or validator semantic rule was changed.


## 2026-09-23 — Reveal pipeline distinction verified

Run #177 of `PRE-RICH Cardano Emulator Reveal` still used the older lightweight workflow and therefore did not exercise the fresh-artifact rebuild. The corrected `PRE-RICH Emulator Reveal Conformance` run #38 is the authoritative fresh-artifact path and is currently compiling the pinned Haskell toolchain before export. This distinction is now explicit: do not classify #177 as evidence against `assetAmount`.

## 2026-09-23 — Genesis Treasury admission mirror promoted into CI

The Genesis carrier workflow was re-audited against the actual files it executes. The dedicated PRE-RICH/profile/GenesisTreasuryAdmission.test.ts was already included in the workflow path filters, but was not actually executed by the workflow. This created a false sense of CI coverage for the exact 10,000,000 PRE -> 4,000 USDM admission pin.

The workflow now explicitly runs:

node --experimental-strip-types PRE-RICH/profile/GenesisTreasuryAdmission.test.ts

after Node 22 dependency installation and before the carrier ledger lab.

This is CI plumbing only. The canonical relation remains exactly 10,000,000 PRE × 0.04 USDM/PRE = 4,000 USDM, with the existing >= 4,000 USDM threshold. No validator, Oracle rule, 500× parameter, maxTxSize, PrizePool accounting rule, or IMMORTAL economic invariant changed.

Commit: 6f4ab4c5db0758c1d511f96d9819859ffe0b6b34.

Evidence status: admission mirror is now explicitly executable in the Genesis workflow; actual GREEN status still requires a fresh Actions run on this commit.

## 2026-09-23 — Genesis ledger workflow now carries admission mirror

The dedicated PRE-GENESIS -> GENESIS Cardano/Yaci workflow now also executes the application-level Genesis Treasury admission mirror before the real ledger transition. Its path filters include GenesisTreasuryAdmission.ts and GenesisTreasuryAdmission.test.ts.

This keeps the two evidence layers in the same execution path: exact application admission arithmetic and subsequent real-node carrier transition. It does not merge their authority: the mirror remains off-chain admission evidence, while Yaci remains ledger realization evidence.

Commit: 5b2955829b6e744b6f5b502b2c44fd585e46bda7.

No economic, validator, Oracle, jackpot, 500x, maxTxSize, or IMMORTAL invariant changed.

## 2026-09-23 — Genesis workflow trigger symmetry cleanup

The PRE-GENESIS -> GENESIS Cardano workflow was rechecked for push/PR trigger symmetry. The PR trigger was missing the B1 projection/profile paths and the dedicated Genesis Treasury admission mirror, while the push trigger contained duplicate entries. The workflow is now normalized so relevant Genesis, B1 projection, profile and admission changes trigger the same evidence path without duplicate filters.

Commit: 6aa521b770df1d8168abe538202427a300cbe3e2.

CI plumbing only; no validator or economic semantics changed.

## 2026-09-23 — V3 transition audit: concrete remaining boundary

Audited the current IMMORTAL/kernel/EconomicTransitionV3.hs against the V3 state/kernel.

Confirmed:
- Issue/Reveal/Expire resolve class IDs through classPrice; unknown classes fail closed.
- transitionValid enforces profile validity, conservation and non-negative structural state.
- PRE-RICH admission subsequently projects the candidate state and applies the Economic/Viability gates.

Still open at transition level:
- EconomicTransitionV3 does not mutate or validate EconomicControlState (CurrentActiveClass / HighestClassEverActivated).
- No V3 action currently performs the normative monotonic historical-state update.
- Jackpot state is carried through unchanged by the four current actions; jackpot lifecycle transitions are therefore not represented in this generic V3 transition.
- tcsSaleable is stored but not recomputed by the current Issue transition; saleability is instead checked through EconomicKernel.classSaleable.
- The transition itself is deliberately structural; solvency is enforced downstream by PreRichEconomicAdmission / EconomicGate, not by transitionValid.

Conclusion: B4/automatic class-control/hysteresis and jackpot transition closure must not be marked GREEN from representation-level conformance alone. This audit identifies the exact missing transition surface without inventing new economics.

## 2026-09-23 — Class-control normative boundary resolved

Cross-read of the canonical Economic Algorithm / Game Economy baseline confirms that the repository deliberately does NOT yet freeze numerical hysteresis thresholds. The normative algorithm specifies:
- CurrentActiveClass = highest class whose verified post-sale state remains safe;
- contraction order 100 -> 50 -> 25 -> 10 -> 5 -> 3 -> 2 -> 1 -> HALT;
- HighestClassEverActivated is monotonic and distinct from CurrentActiveClass;
- activation and suspension use separate thresholds;
- exact numerical hysteresis remains an explicit policy/conformance item until frozen.

Therefore the current implementation gap cannot be closed by inventing threshold constants. The correct remaining work is a policy-boundary/conformance task: freeze the numerical hysteresis rule at the authoritative normative layer first, then implement and test the state-derived selector, contraction, recovery and monotonic historical state. Until that happens, CurrentActiveClass / hysteresis / HighestClassEverActivated remain YELLOW by design, not because a missing arbitrary constant can be guessed.


## 2026-09-23 — Multi-front closure sweep / new fronts opened

A cross-front review was performed against the current coordination register, current branch architecture, Genesis carrier path, Cardano Adapter, Materios boundary and active Actions. The purpose was to identify closure work that had been implicitly embedded in B4/B5/B6 or Genesis rather than tracked as an independent evidence front.

### Newly opened fronts

| ID | Front | Status | Closure target |
|---|---|---|---|
| C7 | Oracle / price provenance | OPEN | Trace raw observation → identified UTxO → authenticated datum/value → verified price → Genesis admission without substituting a fixture constant for provenance. |
| C8 | Snek UTxO identity / liquidity semantics | OPEN | Prove the authoritative Pool UTxO identity and classify the observed lovelace/seed component; do not infer economic meaning from info.outputId alone. |
| C9 | PRE bootstrap accounting boundary | OPEN | Prove that the 10,000,000 PRE bootstrap used for the 4,000 USDM admission condition is not silently counted as ordinary Genesis economic supply. |
| C10 | PRE-GENESIS → GENESIS state semantics | OPEN | Specify and evidence exactly what state is consumed, created, preserved and excluded by the carrier transition. |
| C11 | Atomic transition end-to-end | OPEN | Connect Gate → Viability → Safe Action → Adapter transaction → observed post-state as one atomic admissibility/evidence chain. |
| C12 | Cardano lifecycle conformance | OPEN | Obtain equivalent real-ledger evidence for Issue / Reveal / Claim / Expire and a complete lifecycle replay, without treating emulator-only evidence as ledger equivalence. |
| C13 | Datum/redeemer semantic serialization | OPEN | Establish canonical semantic correspondence between V3 action/state and encoded Cardano datum/redeemer/script inputs. |
| C14 | Artifact provenance / reproducibility | OPEN | Bind commit → toolchain → generated validator bytes/hash → datum/redeemer → transaction/evidence so no stale artifact can masquerade as current-source evidence. |
| C15 | Replay / idempotency | OPEN | Demonstrate repeated submission/re-observation cannot duplicate liability, payout, expiry, activation history or Genesis transition. |

### Existing fronts explicitly cross-linked

- B4 now has strong projection-level evidence including locked Jackpot protection, but transition and real-ledger preservation remain OPEN.
- B5 remains OPEN until Economic Gate → Viability → Safe Action → Atomic Transition is demonstrated as one chain rather than as isolated predicates/tests.
- B6 now decomposes into C12/C13/C14 plus the existing real-ledger Integration Lab.
- Genesis carrier retains two specific semantic gaps: production Treasury migration binding and explicit PrizePool accounting-delta evidence; singleton policy design is implemented but deployment/ledger evidence remains OPEN.
- Materios retains the real cryptographic transition/finality gap; the fail-closed verifier boundary is strengthened but does not constitute proof verification.
- Class-control/hysteresis remains policy-boundary work. Numerical thresholds must come from canonical normative material; no values are to be invented in implementation.

### Work allocation rule

These fronts are evidence/conformance fronts first. They must not be closed by weakening invariants, changing economic constants, or promoting synthetic fixtures to production authority. Where implementation is missing, first add a minimal executable witness or test that fails closed; only then consider code changes justified by canonical semantics.

### Immediate execution order

1. Keep Reveal fresh-artifact differential run isolated; do not modify economics or transaction-size limits.
2. Let current Genesis / Integration / Kernel Actions finish and classify only current-head evidence.
3. Start C7/C8 from the actual Snek/Oracle evidence chain.
4. Start C9/C10 from the Genesis carrier state machine and existing Yaci trace.
5. Start C11/C12/C13 from V3 transition ↔ Adapter ↔ ledger traces.
6. Start C14 by making artifact identity explicit in every evidence-producing workflow.
7. Start C15 from duplicate/replay cases already present in Genesis and lifecycle tests.

No normative economic decision was changed by this sweep.


## 2026-09-23 — Current-head re-alignment + class-control policy triangulation

The working branch was re-aligned directly against its actual current head: `b77d2b16e312c0eb0f90a1719e7dfb4d635cf5f6` (`fix: bind Genesis carrier to canonical OracleTypes`). The previously inspected historical SHA was not the active branch state.

Direct branch inspection confirms the live V3 transition is `IMMORTAL/kernel/EconomicTransitionV3.hs`, not `plutus/EconomicTransitionV3.hs`.

Current transition audit reconfirms:
- Issue / Reveal / Expire resolve class IDs through canonical profile prices and fail closed on unknown classes.
- structural conservation/non-negative checks are present;
- `EconomicControlState` is carried but not mutated or validated by the four generic actions;
- no transition-level derivation/update of `CurrentActiveClass` or `HighestClassEverActivated` exists yet;
- `tcsSaleable` is stored but saleability is enforced through `EconomicKernel.classSaleable`;
- Jackpot lifecycle is not represented by the generic V3 actions.

Normative triangulation against the current Notion A1/A2/A3 closure confirms the correct boundary:
- Jackpot stability uses `StableLadder(S)` derived from `CurrentActiveClass`, `HighestClassEverActivated`, and the existing activation/suspension predicates;
- the numerical hysteresis parameters are not invented by implementation;
- KA=8, KC=4, KD=4 define the existing structural ordering but do not by themselves determine a unique numerical hysteresis margin.

Therefore the remaining class-control work is implementation/conformance, not permission to invent constants. The safe next step is to implement the already-defined state-derived selector only after its authoritative predicate/parameter representation is mapped; until then the control/hysteresis front remains YELLOW by design.

Actions evidence for exact current head `b77d2b16...` currently exposes no PR-triggered workflow runs, so no CI GREEN claim is made from source inspection.


## 2026-09-23 — V3 control-state boundary hardening

Current transition audit found a concrete fail-closed gap that could be closed without inventing hysteresis values: `EconomicControlState` was carried through transitions but its class references were not validated against the canonical application profile.

Applied sequentially on `work/immortal-green-closure`:
- `bec17fd7dfb841f94d3fbb5e2e2e21c3f45bb3b1` — added `EconomicKernel.controlStateValid`, requiring both CurrentActiveClass and HighestClassEverActivated to refer to canonical profile classes.
- `584a32e77da1978edbd662f76edadbb36cc69644` — `transitionValid` now requires that control-state validity for both pre- and post-state.

This is deliberately a boundary hardening, not a hysteresis implementation: it prevents malformed/non-canonical control identifiers from entering the V3 state machine, while preserving the existing control state across Issue/Reveal/Claim/Expire. Automatic state-derived class selection, contraction/recovery and monotonic historical advancement remain open implementation/conformance work because the authoritative activation/suspension predicates and numerical parameterization must not be invented here.

CI evidence is still not available for the new commits from the GitHub connector; therefore no CI GREEN claim is made.


## 2026-09-23 — Projection control-state optionality re-audit

Direct current-branch inspection of `PRE-RICH/profile/PreRichCardanoObservationProjection.ts` found a residual fail-open type boundary: `currentActiveClass` and `highestClassEverActivated` were still declared optional in `ProjectionInput`, despite the runtime validator requiring explicit bigint values. This contradicted the intended side-door closure recorded earlier and allowed omission to survive the type boundary (with strict-nullability depending on compiler settings).

Minimal correction: both control observations are now required fields, alongside the already-required SafetyCapital / ReserveProtection / MandatoryFutureCosts. No default, inferred class, hysteresis rule, or economic value was introduced.

Commit: `10faa8c2d257ec5d521859d219072fa1b287f604`.

This is representation-boundary hardening only. It does **not** establish canonical controller provenance for the observed control values; the authoritative PRE-RICH hysteresis/controller binding remains a separate open front.

**Status:** control-state observation side-door CLOSED at the TypeScript input type; runtime/controller provenance evidence remains OPEN.


## 2026-09-23 — Class-control policy correction: PRE-RICH hysteresis is frozen

A source-of-truth re-audit resolves a stale coordination statement that described the numerical hysteresis parameters as not yet frozen. The current authoritative PRE-RICH application canon explicitly freezes:
- KA = 8
- KC = 4
- KD = 4

This is confirmed by `PRE-RICH/docs/CONSTITUTION.md`, `PRE-RICH/docs/ECONOMIC-ALGORITHM.md`, and the executable application controller `src/preRichHysteresis.ts`.

The architectural boundary remains unchanged: these parameters are **PRE-RICH application policy**, not IMMORTAL universal constants. Therefore the remaining class-control gap is no longer “freeze numerical hysteresis”; it is to bind the already-frozen PRE-RICH controller output to the canonical V3/Cardano transition so that CurrentActiveClass and HighestClassEverActivated cannot be caller-selected or merely observed without deterministic provenance.

Required closure path:
1. derive exact application capacity costs X(P) from the canonical post-state model;
2. execute the closed 8/4/4 controller against the verified post-state;
3. bind its result to the V3 control state atomically;
4. fail closed on controller/result mismatch;
5. prove contraction, upgrade, retain, HALT and monotonic HighestClassEverActivated at transition/ledger level.

No new threshold was introduced. This note supersedes the stale “numerical hysteresis not frozen” wording above; historical entries remain audit history.

**Status:** POLICY CLOSED / CONTROLLER IMPLEMENTED / V3 + CARDANO BINDING OPEN.
