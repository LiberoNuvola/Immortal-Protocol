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
