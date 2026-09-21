# IMMORTAL — Cross-Session Work Coordination

> **Role:** shared operational handoff / anti-regression register between concurrent engineering sessions.
>
> **Authority:** this file is **not normative** and cannot change protocol semantics. Canonical Constitution/specifications and consolidated decisions remain authoritative.

**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Working branch:** `work/immortal-green-closure`  
**Snapshot:** 2026-09-21  
**Latest observed commit:** `571efa04c59de392dd825bea102cf7915828a44a` — universal economic bridge conformance test

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
