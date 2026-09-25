# IMMORTAL — Cross-Session Work Coordination

> **Role:** shared operational handoff / anti-regression register between concurrent engineering sessions.
>
> **Authority:** this file is **not normative** and cannot change protocol semantics. Canonical Constitution/specifications and consolidated decisions remain authoritative.

**Repository:** `LiberoNuvola/Immortal-Protocol`  
**Working branch:** `work/immortal-green-closure`  
**Snapshot:** 2026-09-24
**Latest observed commit by this session:** `6530a80c08cc2fb7c58db5ff56ee499699b7545d` — current observed branch snapshot at handoff

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

| RESEARCH-NOVELTY | OPEN / RESEARCH | Establish a source-grounded prior-art map for the emergent IMMORTAL system architecture: distinguish known individual mechanisms from any potentially novel composition; document terminology, closest precedents, differentiators, and evidence gaps without making a novelty claim before the comparison is complete. |

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

## 11A. Research-novelty front — initial prior-art baseline

A first source-grounded scan was performed to establish the baseline for the new research front. The scan confirms that the individual building blocks are established prior art: smart-contract state-transition modeling, invariants, Hoare-style pre/postconditions, safety/liveness, temporal logic, refinement, atomicity, formal verification, proof-carrying code/data, and protocol-level verification all have substantial literature and tooling.

High-signal baseline sources reviewed include:
- Tolmach et al., **A Survey of Smart Contract Formal Specification and Verification** (ACM): state-transition systems, invariants, safety/liveness, temporal logic, Hoare-style specifications, atomicity and financial invariants.
- Ethereum formal-verification documentation: FSM/state-transition modeling, invariants, safety/liveness, Hoare-style specifications and model checking.
- Gupta et al. (2026), **Formal Verification of Blockchain Consensus Mechanisms Using Event-B**: FSM abstraction, invariants, refinement and temporal-logic verification at protocol level.
- Necula/Lee lineage on **Proof-Carrying Code**, plus Ben-Sasson et al. on **Proof-Carrying Data**: machine-checkable certificates/proofs carried with code or data and verified by recipients.

Current research hypothesis remains deliberately narrower than a novelty claim: the potentially distinctive object is the **composition and boundary discipline** of IMMORTAL — normative economic constitution → certified economic state/transition model → ProtectedCapital/solvency → viability/successor admissibility → liveness/permissionless execution boundary → economic admission with authenticated executable-liquidity provenance → chain adapter → on-chain revalidation → atomic transition → canonical state → reproducible evidence/provenance.

This is **NOT a novelty determination**. The next pass must compare this composition against the closest prior systems across formal-methods protocols, DeFi/economic safety, proof-carrying/admission systems, permissionless execution/liveness, and blockchain governance. Individual mechanisms must not be presented as novel merely because IMMORTAL combines them.

Status: **RESEARCH-NOVELTY FRONT OPEN / PRIOR-ART BASELINE ESTABLISHED**.


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


## 2026-09-23 — Genesis carrier atomic/value-boundary cross-review

Cross-review of the Genesis carrier transition found a concrete state-integrity side door: the validator already enforced the singleton carrier token, PRE-GENESIS → GENESIS datum transition, Treasury/Oracle reference semantics, and PrizePool exclusion, but it did not require the carrier UTxO's complete asset value to be preserved across the transition. Because the carrier is a state identity and is not an economic funding leg, allowing its value to change would introduce an unaccounted transfer surface.

Applied:
- `35c63d07f086ec08703600bc3c34cde2db12e776` — Genesis carrier validator now requires `txOutValue ownIn == txOutValue ownOut`.
- `4a75fdd6f9d79488354b747d9566c97dd97fbf91` — Yaci trace now compares the complete carrier asset map and records `carrierValuePreserved` in the economic-boundary evidence packet.

This strengthens C10/C11 without introducing new economics. The trace already rejects replay and verifies Treasury/Oracle reference preservation; the new check extends that evidence to the carrier's complete value conservation. Fresh compilation and Yaci execution are still required before promoting this to ledger GREEN.

**Cross-review assignment:** C10/C11 primary hardening by this session; the other session should adversarially test whether any other carrier-owned value or unrelated transaction leg can alter the canonical transition, and whether the equality check remains compatible with the production deployment path.


## 2026-09-23 — Genesis admission boundary test correction

Adversarial review of the Genesis admission mirror found an invalid threshold test. The test attempted to derive a PRE quantity from the USDM-subunit threshold alone, producing a quantity of 4,001 PRE while the fixture price is 0.04 USDM/PRE; that value is far below 4,000 USDM and therefore could never legitimately be admitted.

Corrected in 37b2f2cdd733da94888bb7b415132eba9d348a3f: the boundary is now tested explicitly with 9,999,999 PRE rejected and 10,000,000 PRE admitted at the canonical 0.04 USDM/PRE oracle value. This is a test-fixture correction only; the admission implementation and threshold are unchanged.

Cross-review lesson: Genesis admission tests must vary quantity around the economically derived threshold, not derive quantity by dividing the USDM threshold without accounting for the oracle price.


## 2026-09-23 — C14 evidence-packet correlation hardened

The Genesis workflow previously hashed generated validator artifacts before ledger execution, but the uploaded transition evidence did not itself carry those hashes. This left a provenance-correlation gap even though the workflow used fresh artifacts.

Added `audit/pre-genesis-genesis/record-artifact-provenance.ts` and wired it after the real Yaci transition. The evidence packet now records:
- current `GITHUB_SHA`;
- SHA-256 of the exact generated `genesisRegimeCarrier.plutus.json`;
- SHA-256 of the exact generated `genesisCarrierMintPolicy.plutus.json`;
- the observed transition transaction reference;
- presence of the transition transaction CBOR.

Commits:
- `5c9dff9a79932ca52cdbbefbb88a1da5f0de5ca0`
- `83e479e5989fcb32ec497913288eda3f87257f90`
- coordination record: `e47deef7ccece529c902e5ede7ed8278d49a394a`

Status: **C14 HARDENED / NEEDS FRESH EXECUTION**. This is evidence-pipeline hardening only; it does not promote Genesis to ledger GREEN without a fresh successful Yaci run.


## 2026-09-23 — PRE-RICH controller provenance witness

The remaining class-control gap was narrowed without inventing economics. The canonical PRE-RICH controller already consumes an externally supplied exact-integer capacity cost X(P) and the frozen KA=8/KC=4/KD=4 policy. A new application-boundary witness now recomputes the controller result from verified capacity/classes and fails closed when observed CurrentActiveClass / HighestClassEverActivated disagree with that deterministic result.

Added:
- `PRE-RICH/profile/PreRichHysteresisBinding.ts` — derives the closed controller result and rejects observed-control mismatch; also checks monotonic historical control.
- `PRE-RICH/profile/PreRichHysteresisBinding.test.ts` — activation acceptance, caller-selected mismatch rejection, direct contraction/history preservation, and history-shape rejection.
- `.github/workflows/pre-rich-hysteresis-conformance.yml` — includes the new binding test in the existing conformance workflow and triggers on both binding files.

Commits: `975d95d6ade0cad9e105934bc1c93beab726edca`, `a2993ec3c1776d9b1b33cfc78de8e11d79e27c5e`, `cf1b6b8b98c2e63f98761aea720d359a5f6034c7`.

Boundary remains explicit: this is an application-level provenance witness, not yet V3/Cardano atomic integration. It deliberately does not choose or derive X(P) from unverified inputs; the caller must supply the canonical exact-integer class costs. The next closure step is to connect this witness to the authoritative PRE-RICH post-state/capacity computation and then to the V3/Cardano transition so the on-chain control cannot be caller-selected.

**Status:** CONTROLLER PROVENANCE WITNESS IMPLEMENTED / CI PENDING / V3+CARDANO BINDING OPEN.


## 2026-09-23 — Genesis CI failure classified and trigger repaired

The previous Genesis ledger run `35782577203` failed at fresh Plutus compilation. The job log showed a concrete stale-source mismatch at `B1PrizePool.hs`: the failing run invoked `legacyB1ToUniversalEconomicState d` although the adapter signature requires `EconomicProfile -> B1PrizePoolDatum -> UniversalEconomicState`. Current branch source now correctly supplies `preRichEconomicProfileV1`, so the failure is classified as stale/intermediate-source CI evidence rather than an economic failure.

A separate workflow hygiene defect was also found in `.github/workflows/pre-genesis-genesis-cardano.yml`: one path entry contained a literal escaped newline before the next path. Corrected in `05631ed2037f0c187f06ddb6b76b9ddb491340a7` so the Genesis ledger workflow has a clean trigger path for the carrier trace and artifact-provenance recorder.

**Status:** previous build failure explained; fresh current-head compilation/ledger execution still required before Genesis/C14 can be promoted GREEN.


---

## 2026-09-23 — C14 signed-witness provenance hardening

**Commits**
- `35db1b4f6d4137732a6f9ac23c71f676d2661616` — `test: bind Genesis evidence to signed witness script`
- `c20d4b45c4db2c693d76849e8d3777fb64140e89` — `test: remove duplicate Genesis evidence field`

**Finding / fix**
The previous C14 binder correlated generated Genesis artifact hashes and independently recomputed script identities with fields already recorded in the evidence packet, but did not inspect the exact signed transaction CBOR witness set.

The binder now:
1. parses the exact `transitionTxCbor` through Lucid/CML;
2. extracts the transaction Plutus V2 witness scripts;
3. compares the observed witness bytes against the generated `genesisRegimeCarrier.plutus.json` `cborHex`;
4. independently derives witness script hashes and requires one to equal the generated carrier validator hash;
5. records `witnessScriptPresent`, `witnessIdentityBound`, and the observed Plutus V2 script hashes in `artifactProvenance.binding`.

This closes the previously identified **structural gap** between generated artifact bytes and the script bytes actually carried by the signed transition transaction.

**Important limitation**
This is still an evidence-binder check, not a fresh successful Yaci run. The branch currently has no workflow-run/status result exposed for these latest commits, so C14 must remain **NEEDS-FRESH-CI-EVIDENCE** until the Genesis workflow executes successfully with the new binder.

**Secondary cleanup**
`genesis-carrier-ledger-trace.ts` had a duplicate `economicBoundary` JSON property. The duplicate was removed without changing economic semantics.

**Adversarial next question**
If the Genesis workflow exposes a fresh successful run, inspect its uploaded evidence and verify that:
- `witnessScriptPresent=true`;
- `witnessIdentityBound=true`;
- generated artifact hashes, source commit, transition tx reference and witness identity all coexist in the same evidence packet;
- the signed CBOR is the exact CBOR submitted by the real Yaci transition, not a reconstructed or post-hoc transaction.

**Status:** C14 **HARDENED / NEEDS-FRESH-CI-EVIDENCE**.


### C14 follow-up — exact signed-CBOR transaction identity

The provenance binder now independently computes the transaction hash from the exact signed `transitionTxCbor` parsed by Lucid/CML and requires it to equal the transition transaction reference recorded by the real ledger trace.

Evidence now records:
- `transactionHash`
- `transactionHashBound`
- `witnessScriptPresent`
- `witnessIdentityBound`
- observed Plutus V2 witness script hashes

This strengthens the evidence chain to:

`generated artifact bytes → witness bytes in signed CBOR → transaction hash → observed transition tx reference`.

Status remains **HARDENED / NEEDS-FRESH-CI-EVIDENCE** because no fresh workflow result has yet been observed for the latest binder commits.


## 2026-09-23 — C13 semantic action boundary witness

Added a representation-level C13 witness for the canonical B1/Cardano action encoding used by PRE-RICH:
- Issue maps to B1 TicketIssued(price);
- Reveal maps to B1 TicketRevealed(price), with payout remaining datum-owned in PrizeDatum;
- Claim maps to B1 TicketClaimed(amount);
- Expire maps to B1 TicketExpired with no caller-selected amount.

Added:
- src/__tests__/cardano-v3-semantic-conformance.test.ts
- .github/workflows/c13-cardano-semantic-conformance.yml

The witness asserts constructor indices, field ownership/arity, and fail-closed semantic separation. It is explicitly representation-level: it does not substitute for Plutus/Yaci execution evidence, so C12 remains open until real-ledger lifecycle evidence exists.

Commits: 9d080f34291c125147675dda805e8d920e63460f, efc9dfb1d6623e68c7af62eac66676029233afe6.

Status: C13 REPRESENTATION WITNESS ADDED / NEEDS CI + LEDGER CORRELATION.


### C14 parser sanity correction

A direct current-head source audit caught a concrete TypeScript compile defect in the new provenance binder: the binder used `Lucid` / `Blockfrost` without importing them in the actual branch file. Corrected in `a209d032f71157d4a4f70a6dffbf0464fc088609`.

This is a tooling/compile correction only. No economic or validator semantics changed.

Fresh workflow execution remains required.


### Genesis workflow trigger re-audit

Current-head inspection found the previously reported workflow-path repair had not actually removed a literal escaped newline from the Genesis trace path. The `paths` entry contained:

`genesis-carrier-ledger-trace.ts\\n      - record-artifact-provenance.ts`

and therefore was malformed as a single path entry.

Corrected in `126d041c39148741837f79f430c74f76fac71d20` to two real YAML list entries. This matters because the new C14 binder must itself trigger the Genesis workflow on source changes; otherwise provenance hardening can silently remain unexecuted.

Status: **workflow trigger syntax corrected / fresh execution still required**.


## 2026-09-23 — PRE-RICH controller-binding adversarial correction

A cross-review of the application-level hysteresis witness found that `assertPreRichControlMatches` checked deterministic controller equality but did not invoke its own independent historical-control invariants. Thus a caller could satisfy the deterministic result comparison while bypassing the separately defined monotonic-history checks.

Applied:
- `fcf1574eb6f58d8b3f414b89407742b9362a75a3` — control binding now calls `assertPreRichControlHistory` before returning an admissible result.
- `730334654ac5b39ec504bbbd5c0d030f6ad463fe` — added a conformance test for a matching-controller result whose historical maximum regresses.

This remains application-boundary hardening. It does not claim V3/Cardano atomic control binding.

**Status:** controller witness strengthened / fresh CI evidence required / V3+Cardano binding still OPEN.


### Genesis workflow PR-trigger completeness

A second trigger audit found the C14 provenance binder was present in the `push.paths` list but missing from the corresponding `pull_request.paths` list.

Applied `84b1558077da3724d922d68f92f8df43572fd0de` so both trigger modes include `audit/pre-genesis-genesis/record-artifact-provenance.ts`.

This prevents a PR from modifying the provenance binder without executing the Genesis conformance workflow.

**Status:** trigger coverage corrected for push + pull_request / fresh execution still required.


## 2026-09-23 — External red-team attack pass mapped to current branch

An external adversarial review was triangulated against the current branch. It does not change protocol semantics; it identifies attack surfaces where the implementation could remain formally conformant while relying on incomplete or optimistic world-state assumptions.

Created docs/audits/REDTEAM-STATUS.md as the non-normative attack register.

### Immediate findings

1. RT-1 Valuation / EEV / executable liquidity is now the highest-value unresolved boundary. The key question is not whether RawSurplus = max(0, EEV-ProtectedCapital) is mathematically correct; it is whether EEV and executable liquidity are authenticated, fresh, non-double-counted and actually realizable. No new haircut or valuation rule is authorized by this review.
2. RT-1.8 Treasury double-counting is substantially hardened by the Genesis carrier boundary: Genesis carrier rejects PrizePool I/O and preserves its complete carrier value. Fresh ledger evidence is still required.
3. RT-1.6 reflexive PRE valuation is a design/source-of-truth question. The existing Genesis admission proves a verified mark 10,000,000 PRE × 0.04 USDM/PRE = 4,000 USDM; it does not by itself prove executable liquidation value. Do not invent a haircut. First determine what the canonical economic documents require.
4. RT-2 Genesis observation/carrier is materially more advanced than the older red-team description: an executable carrier, authenticated Treasury/Oracle references, singleton lifecycle, replay rejection, value preservation and signed-CBOR provenance binding now exist. Remaining attacks are forged observation, wrong asset identity, conflicting observations, off-chain/on-chain revalidation mismatch and duplicate-authority/capture tests.
5. RT-3 RF8 side-door inventory remains open: every economic state mutator must be enumerated and have a canonical authority path plus a negative twin.
6. RT-4 B1 liveness remains open and must preserve the safety/liveness distinction.
7. RT-5 Omega completeness remains open: an incomplete commitment perimeter can leave the formulas internally correct while the modeled obligations are incomplete.

### Red-team status rule

No red-team finding may be closed by weakening a normative economic rule. A failure is classified as REJECT, NEUTRALIZE, DETECT, or GAP. Model evidence, fixture evidence and ledger evidence remain separate.

### Current execution order

1. RT-2.13–2.15 against the real Genesis carrier.
2. RT-1.3–1.5 and RT-1.8 against the Treasury/Oracle observation and liquidity boundary.
3. RF8 complete economic-mutator inventory (RT-3.1–3.10).
4. RT-1.6 source-of-truth determination for executable vs mark valuation.
5. RT-4 publisher/liveness adversarial suite.
6. RT-5 commitment-perimeter/Omega completeness suite.

Status: RED-TEAM PASS IN PROGRESS / NO NEW ECONOMIC DECISIONS.
Evidence register: docs/audits/REDTEAM-STATUS.md.


## 2026-09-23 — Red-team valuation arithmetic hardening

Adversarial inspection found upward rounding at the Genesis lower-bound conversion. A value below the exact threshold could round upward into admission. GenesisTreasuryAdmission now uses floor division, and its regression suite covers the sub-threshold fractional boundary.

Commits: 388eb97c2ea5d79b7a089336f9f9397593fdd7dd; 547d8f99f00473b3228ba691d576dd0982e4b6eb.

No threshold, price, or economic policy changed. This is arithmetic hardening of the existing lower-bound predicate. Broader RT-1 valuation and executable-liquidity attacks remain open.

Status: RT-1 ARITHMETIC HARDENED / BROADER VALUATION SURFACE OPEN.


## 2026-09-23 — C15 Prize/Pool atomicity cross-review

A separate cross-review found the same validator-boundary issue on the current branch: B1PrizePool Reveal/Claim accounting was coupled to the Prize output, but the Pool validator did not independently require consumption of the matching canonical Prize input. This meant the safety of the pair depended on the caller assembling the companion Prize spend.

Commit `c0e68db47192f4aba0fa3d080f83b60c9005010e` closes that side door:
- Reveal requires exactly one Prize input in Pending state, with matching ticket identity and price.
- Claim requires exactly one Prize input in Revealed state, with matching ticket identity and frozen payout.

The existing PrizeValidator and `src/gameFlow.ts` already perform the paired spends; the change makes the Pool side independently fail closed as well.

**Status:** C12/C15 pairing boundary HARDENED / fresh compile + real-ledger lifecycle/replay evidence still OPEN.


## 2026-09-23 — RT-1.5 executable-liquidity audit

Current branch inspection confirms that EconomicGate distinguishes EEV from immediate executable liquidity and checks required immediate liquidity against the supplied available amount. This is a useful semantic separation.

Red-team finding: `egiAvailableExecutableLiquidity` remains an input asserted by the authoritative observation/refinement layer; the universal kernel does not authenticate it against concrete spendable UTxOs. The Cardano economic-admission witness likewise carries EEV and an observation reference but does not independently derive/bind executable liquidity.

Classification: **SEMANTIC DISTINCTION PRESENT / PROVENANCE BINDING OPEN**.

No economic rule or haircut was invented. Next step is to identify the authoritative Cardano observation surface for spendable liquidity and bind that observed value to the gate input with negative tests for locked, unrelated, double-counted and non-spendable assets.


## 2026-09-23 — RT-1.5 executable-liquidity provenance hardening

Implemented the smallest runtime observation boundary identified by the red-team pass.

Added:
- `Adapter/CARDANO/observation/ExecutableLiquidityObservation.ts`
- hardened `Adapter/CARDANO/runtime/EconomicAdmission.ts`
- expanded `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts`

The admission witness now requires an executable-liquidity observation bound to the same authoritative observation reference and validates:
- concrete Cardano UTxO references;
- non-negative values;
- spendable-only inputs;
- rejection of ring-fenced inputs;
- duplicate UTxO rejection;
- exact equality between declared immediate liquidity and the observed spendable UTxO sum;
- required immediate liquidity <= observed executable liquidity.

This closes the previously unbound **runtime provenance witness** for immediate liquidity without inventing a haircut, valuation rule, or economic constant.

Commits:
- `1e3e6ed450623264d027e35b6d3a2c7d269eb0ef`
- `2dc35494957c4b976079986c595054536ea06031`
- `bec5e017bbb56b1274d2be90e8c158b4ec16ebf7`

Important boundary:
this is **observation/runtime hardening, not yet ledger proof**. The observation is still supplied by the authoritative Cardano observation layer; the next evidence step is to bind these UTxO references to the actual transaction/input set and reject unrelated/double-counted/non-spendable value in a real-ledger trace.

**Status:** RT-1.5 RUNTIME PROVENANCE WITNESS HARDENED / REAL-LEDGER BINDING OPEN.


## 2026-09-23 — RT-1.5 canonical Cardano liquidity surface identified

Cross-review of the current B1/Cardano implementation identified an existing canonical observation surface for executable PrizePool liquidity. plutus/B1PrizePool.hs recomputes the continuing Pool UTxO's USDM value through Economic.poolUsdmValue and requires ppTotalLiquidity to equal that value on FundTreasury; Claim also derives the consumed and continuing Pool UTxO values and checks the physical pool-value delta against the crystallized payout. The singleton Pool NFT and exactly-one-own-input constraints bind this accounting to the concrete Pool state UTxO.

This means the next RT-1.5 implementation should reuse the authenticated B1PrizePool UTxO/value path rather than inventing a new liquidity oracle or haircut. The remaining gap is specifically the off-chain admission boundary: EconomicAdmissionWitness does not yet bind its liquidity/EEV decision to the exact Pool UTxO reference and observed executable value consumed by the economic transaction.

Required negative twins: wrong Pool UTxO, stale observation, double-counted Pool liquidity, unrelated/non-spendable value, and observed value differing from the authenticated Pool UTxO valuation. Status remains PROVENANCE BINDING OPEN.


## 2026-09-23 — RT-3 concrete mutator hardening: TicketIssued now crosses Economic Admission

Inventory found a concrete side door in `src/mint.ts`: the canonical TicketIssued economic transition was assembled correctly and protected by on-chain MintPolicy/B1PrizePool validators, but the final submission used the generic Cardano adapter path instead of the Economic Admission boundary.

Hardening applied:
- `MintSerialOptions.economicAdmission` is mandatory.
- `mintSerialNFT` submits through `submitEconomic`.
- `buyTickets` no longer supplies an implicit empty options object.

Commits: `ff778c30d1c64b7692dac75877d007829fa59cfe`, `f7d48278888c572aca755d714ac81091d6326b8d`.

Classification: RT-3 side-door **HARDENED FOR TICKET ISSUANCE / GLOBAL MUTATOR INVENTORY OPEN**. Fresh CI is required; no workflow run is currently associated with these commits. This change does not alter economic parameters or validator semantics.


## 2026-09-23 — RT-1.5 admission witness metadata hardening

`EconomicAdmissionWitness` now explicitly carries `executableLiquidity` and `executableLiquidityObservationReference`, and `assertEconomicAdmission` rejects negative liquidity or an empty observation reference. This records the provenance surface required by the gate without inventing a new valuation rule.

Commit: `8210d62a1029e6af85b4af8f127a469ce4eb8bb4`.

Status remains **RT-1.5 PROVENANCE BINDING OPEN**: the next step must correlate this reference/value with the exact authenticated B1PrizePool UTxO consumed by the submitted transaction.


## 2026-09-23 — RT-3 mutator inventory + B4 preservation hardening

A current-branch mutator audit was completed against the actual execution paths rather than default-branch search results.

### Economic mutator inventory

| Transition / path | Economic effect | Submission boundary | Status |
|---|---|---|---|
| TicketIssued / `src/mint.ts` | creates unresolved reserve + ticket liability exposure | `submitEconomic` with mandatory `EconomicAdmissionWitness` | **HARDENED** |
| Reveal / `src/gameFlow.ts` | releases unresolved reserve + crystallizes payout liability | `signAndSubmitEconomicTx` | **HARDENED** |
| Claim / `src/gameFlow.ts` | reduces crystallized liability | `signAndSubmitEconomicTx` | **HARDENED** |
| Expire / `src/gameFlow.ts` | releases unresolved reserve | `signAndSubmitEconomicTx` | **HARDENED** |
| FundTreasury / `plutus/B1PrizePool.hs` | changes physical Pool liquidity under validator accounting | on-chain validator boundary; off-chain economic-admission integration remains evidence work | **ON-CHAIN HARDENED / EVIDENCE OPEN** |
| Genesis activation | changes regime/carrier state, not PrizePool liquidity | Genesis carrier validator + real-ledger workflow | **HARDENED / FRESH-CI OPEN** |
| SyncBeacon / registry publication / pending-round creation | observational/state anchoring only; no V3 economic delta | generic Cardano submission | **NON-ECONOMIC** |

`src/txHelpers.ts::buildClaimTx` remains a construction-only legacy helper and is not a canonical submission path; no caller was found in the current UI flow. It must not be promoted to an economic submitter without the full PrizePool + Economic Gate boundary.

### Concrete RT-3 side-door found and closed

The mandatory `MintSerialOptions.economicAdmission` change exposed a compile-time caller that was previously relying on an implicit empty options object:

`src/main.ts` called `tickets.buyTickets(1)` without an admission witness.

Rather than manufacturing a witness, the UI now fails closed and reports that authoritative Economic Gate admission is required.

Commit: `ff18342abdceb891e338ee1f765804b5c6ef7c71`.

No economic parameter or validator semantics changed.

### B4 ProtectedCapital preservation hardening

The existing conformance suite already proved the arithmetic lifecycle deltas and partition. A cross-review identified a remaining blind spot: it did not explicitly assert that the protected components not touched by Issue/Reveal/Claim/Expire remain unchanged.

Added:
- `protectedCapitalComponentsPreserved` in `IMMORTAL/conformance/ProtectedCapitalConformance.hs`;
- non-zero SafetyCapital / ReserveProtection / MandatoryFutureCosts / Jackpot fixtures across Issue, Reveal, Claim and Expire in `plutus/test/ProtectedCapitalConformanceTest.hs`.

The predicate requires semantic preservation of:
- `v3SafetyCapital`;
- `v3ReserveProtection`;
- `v3MandatoryFutureCosts`;
- Jackpot locked amount, threshold, status and cycle.

Commits:
- `07713168ebfdf98d5e97647a1d695a8236128d66`
- `d73cab1fc8542d8725055dc9df787441b7f67e3d`

No fresh workflow result is exposed yet for these commits.

**Status:** B4 **FORMAL PRESERVATION WITNESS HARDENED / CI EVIDENCE OPEN**. RT-3 **MUTATOR INVENTORY ADVANCED / GLOBAL REAL-LEDGER COVERAGE OPEN**.


## 2026-09-23 — RT-1.5 exact economic-source binding hardening

The runtime witness was tightened one step further after cross-review: merely requiring observed liquidity UTxOs to be among transaction inputs was insufficient, because an admission could still nominate an unrelated input as its liquidity source.

Implemented on `work/immortal-green-closure`:
- `ExecutableLiquidityObservation.sourceInputReferences` is now mandatory and must exactly match the observed liquidity UTxO set.
- `assertExecutableLiquidityBoundToInputs` requires every declared liquidity source to be a consumed candidate input.
- `EconomicAdmissionWitness` validation now requires the declared liquidity source set to match the economic action's explicit liquidity-source input set.
- `CardanoExecutionAdapter.submitEconomic` and `signAndSubmitEconomicTx` now carry the explicit liquidity-source references.
- TicketIssued, Reveal, Claim and Expire explicitly nominate the concrete B1PrizePool UTxO as the liquidity source.
- Added regression tests for: valid Pool source, source not consumed, observed UTxO differing from declared source, and source/observation set mismatch.

Commits:
- `801c9fb930ef278921cf979bc239736b47016875`
- `9764280a3037ff2720a416abffc5a416897ac0d7`
- `c2e7540c73a74769bbc476e6db1a01b4726d42ce`
- `546c9457c3a4458975997fd1a948d66a03c88d6a`
- `d27ed55d2f430e5f3cbbeed1359290bad826cdaa`
- `cb5772d24131ed717ffeb38b2c94ab7efe8c65f2`
- `451def3b6cf309b8d9bdfb5498488690b763d6f4`

This is still **runtime provenance/source binding**, not production ledger proof of the observed USDM quantity. The remaining RT-1.5 evidence gap is to correlate the observation's declared value with the authenticated B1PrizePool UTxO/value path on a real ledger trace, including stale/wrong-Pool/double-count/value-mismatch negative twins.

**Status:** RT-1.5 **EXACT ECONOMIC SOURCE BINDING HARDENED / REAL-LEDGER VALUE CORRELATION OPEN**.


CI coverage for the new source-binding tests was added to `.github/workflows/adapter-sale-conformance.yml` (commit `8b3d03cc7d53b968b8d8d053f36c96fdcfac6167`). The connector exposes no push-trigger run for this commit yet, so CI is **pending evidence**, not green.


## 2026-09-23 — RT-1.5 source-binding test alignment

Cross-review found that the new exact-source-binding API had advanced faster than one adapter test fixture: `EconomicAdmission.test.ts` still exercised the old two-argument `submitEconomic` shape and omitted the mandatory `sourceInputReferences`. This was a test/contract drift, not an economic defect.

Fixed by aligning the fixture and all adapter calls with the current four-argument economic submission boundary, and by adding negative twins for:
- source observed but not consumed;
- economic action source set differing from the admission source set.

Commit: `0e6bd370997d675895eabd47c3cd67ac633bdd54`.

The adapter-sale workflow already includes `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts`, but no workflow run is currently exposed for this commit. Therefore status remains **TEST CONTRACT ALIGNED / CI EVIDENCE OPEN**.

RT-1.5 remains **EXACT ECONOMIC SOURCE BINDING HARDENED / REAL-LEDGER VALUE CORRELATION OPEN**: the next substantive step is not another runtime abstraction, but binding the declared source reference and USDM amount to the authenticated B1PrizePool UTxO/value calculation in a real-ledger trace, with stale/wrong-Pool/double-count/value-mismatch twins.


## 2026-09-23 — Multi-agent cross-check: source binding CI and liveness

Fresh Green Closure CI now provides independent confirmation for the recent boundary work:
- `C13 Cardano Semantic Conformance` — **SUCCESS**;
- `Cardano Adapter Sale Conformance` — **SUCCESS**;
- `Algorithmic Governability Adversarial Lab` — **SUCCESS**;
- P2.8-B.1 emulator reveal remains **FAIL**, with the already-known evaluator symptom `Spend[0] execution went over budget` and nonsensical negative residual budget values.

Therefore RT-1.5 exact economic-source binding is no longer merely test-authored: the adapter conformance workflow has executed the aligned `EconomicAdmission` fixtures successfully. The remaining release gap is specifically real-ledger correlation of the declared USDM amount with the authenticated B1PrizePool UTxO/value path.

### RT-4 cross-review
`src/livenessBoundary.ts` plus `src/__tests__/livenessBoundary.test.ts` cover the normative FM1–FM10 classifier and the permissionless execution sequence, including independent revalidation, atomicity, canonical-state observation and competing-submission rejection. The dedicated workflow is configured to run this suite on Green Closure. This supports **implementation/test closure of the classifier layer**, but does not by itself prove end-to-end network liveness.

### Gate 41 cross-review
Notion Gate 41 remains the authoritative evidence status for the PRE/Snek deployment lineage. The transaction-level funding boundary is closed (`19,081,941` lovelace inputs = `18,753,135` outputs + `328,806` fee), while the source explicitly keeps **GENESIS FUNDING ROLE**, **SEED / MIN-ADA SEMANTICS**, **3 ADA RECONCILIATION** and **FIRST CURVE REPLAY** open. No economic interpretation is added here. The next evidence pass must therefore continue from the six upstream output references and their provenance rather than inventing a seed rule.

## 2026-09-23 — RT-1.5 authenticated B1 Pool valuation correlation witness

Advanced the remaining RT-1.5 boundary without introducing a new valuation rule or haircut.

Added `assertExecutableLiquidityMatchesAuthenticatedPool` in `Adapter/CARDANO/observation/ExecutableLiquidityObservation.ts`. The witness now requires:
- exactly one liquidity source;
- that source to equal the authenticated B1 PrizePool input reference;
- exactly one observed UTxO;
- observed UTxO reference to equal the authenticated Pool input;
- declared executable USDM liquidity to equal the independently authenticated B1 PrizePool USDM valuation supplied by the Cardano/B1 observation path.

The helper deliberately does not calculate prices or value UTxOs itself; it only correlates the already-authenticated `Economic.poolUsdmValue` result with the economic-admission observation.

Added regression twins in `Adapter/CARDANO/runtime/__tests__/EconomicAdmission.test.ts` for:
- valid exact Pool correlation;
- wrong Pool UTxO;
- duplicate/double-counted Pool liquidity;
- valuation mismatch.

Commits:
- `0761a700efd149d1a0393533be1a096bde47c16a`
- `538558f9e7bdfc6a892c89345479ca4c217b13fe`

This is stronger runtime/evidence binding, but **not yet real-ledger proof**. A fresh workflow run is still required for these commits, and the final RT-1.5 closure requires the helper to be exercised by a trace containing an actual authenticated B1 Pool UTxO/value observation (plus stale/wrong-Pool/value-mismatch twins). No economic semantics changed.

## 2026-09-23 — RT-1.5 stale-observation hardening

The remaining negative twin for observation freshness was addressed without introducing a protocol-wide time constant.

Added `assertExecutableLiquidityObservationFresh`, which takes the authoritative current observation time and a caller-supplied freshness horizon, and rejects:
- future observations;
- observations older than the supplied horizon;
- invalid negative time/horizon inputs.

Added conformance tests for accepted fresh data, stale data and future data.

Commits:
- `d114d49ae7345996fa29483b5aba4f6974eac636`
- `47f97cd249fbae9d1a152bbed1530f837ac8708d`

This is observation-layer provenance hardening only. It does not choose a universal freshness window and does not yet constitute real-ledger evidence. RT-1.5 remains open for exercising freshness + authenticated Pool valuation against an actual Cardano/Yaci trace.


## 2026-09-23 — RT-2 forged-observation mirror cross-check

Current Green Closure head was re-triangulated against the red-team register and Genesis carrier implementation. The carrier already binds Treasury identity, PRE policy/asset identity, Oracle policy/name/publisher and freshness at the reference-input observation boundary, while the one-shot carrier token provides singleton lifecycle authority. The remaining epistemic gap is narrower: the repository does not yet contain a real adversarial ledger trace demonstrating that an attacker cannot replace the referenced Oracle/Treasury state with a forged state while preserving the required token identities.

Added mirror negative twins to `audit/pre-genesis-genesis/stress-lab.mjs` for wrong PRE asset, forged Oracle publisher and wrong PRE policy. These tests deliberately remain classified as instrumentation, not ledger proof.

Triangulation:
- Green Closure implementation: `GenesisRegimeCarrier.hs` authenticates the observed fields and singleton carrier transition.
- Red-team register: RT-2.13 remains OPEN; RT-2.14 remains OPEN; RT-2.15 remains PARTIAL.
- Audit contract: `TREASURY-OBSERVATION-CONTRACT-v0.1.md` requires canonical Treasury identity, PRE asset identity, valuation evidence/freshness and on-chain revalidation.

No economic rule, threshold, haircut or valuation semantics changed.
Status: **RT-2 mirror coverage HARDENED / ledger authority evidence OPEN**.


## 2026-09-23 — RT-1.5 Economic Admission now consumes authenticated Pool correlation

Cross-review found that the authenticated Pool correlation helper existed and had direct unit tests, but the canonical `assertEconomicAdmission` boundary did not yet consume that witness. This left a gap between the runtime correlation primitive and the actual economic submission gate.

Hardened the boundary:
- `EconomicAdmissionWitness` now requires `authenticatedPoolInputReference` and `authenticatedPoolUsdmValue`;
- `assertEconomicAdmission` invokes `assertExecutableLiquidityMatchesAuthenticatedPool` before signing/submission;
- wrong Pool reference and valuation-mismatch twins now fail at the economic submission boundary, not only in helper-level tests;
- no second price source, haircut, or economic constant was introduced: the authenticated USDM valuation remains supplied by the Cardano/B1 observation path.

Commits:
- `a5c0f5f809402185f7c3028916e157fa17380494`
- `85dca2e2cc8903ff06fa3e43ab76adf12b1917ad`
- `8c3f03b0e9439d073c162112155fce6fc4b818e7`

This closes the **runtime integration gap** between authenticated B1 Pool valuation correlation and Economic Admission. It is still not real-ledger evidence: the authenticated Pool valuation must ultimately be populated from an actual observed B1 PrizePool UTxO in a Yaci/Cardano trace.

**Status:** RT-1.5 **ECONOMIC-ADMISSION INTEGRATION HARDENED / REAL-LEDGER CORRELATION OPEN / FRESH CI OPEN**.


## 2026-09-23 — B6 legacy/universal boundary cross-check advanced

Cross-review of the V3/Cardano conformance matrix and the existing B1 legacy adapter found that the repository already had a strong ProtectedCapital equivalence witness for the representable legacy domain, but the test did not explicitly compare the downstream RawSurplus and solvency predicates over the same representable state.

Extended `plutus/test/B1LegacyAdapterTest.hs` with paired assertions for:
- ProtectedCapital;
- RawSurplus;
- solvencyInvariant;

using the same PRE-RICH profile, representable B1 aggregate and identical EEV. This is a conformance strengthening only; it does not claim full V3↔Cardano equivalence and does not alter the legacy fail-closed rules.

Commit: `7585628cf7b158bb8f963b3b97ab1ed0a2a43f89`.

**Status:** B6 **REPRESENTABLE LEGACY→UNIVERSAL BOUNDARY WITNESS STRENGTHENED / FULL V3↔CARDANO EQUIVALENCE OPEN / FRESH CI OPEN**.

## 2026-09-23 — Green Closure current-head triangulation: B6 / Gate 41 / P2.8

Current branch ref: `work/immortal-green-closure` = `b4d75279b097e44b47691c953bb9bcf774b111f1` (18:50 UTC). The branch contains the earlier `c0e68db...` B1 Pool Reveal/Claim input-binding hardening as an ancestor; current `plutus/B1PrizePool.hs` confirms Reveal and Claim require the corresponding Prize input and validate input/output identity/state/price/payout continuity.

### Triangulation result
- **GitHub implementation:** B6 witness is present in `plutus/test/B1LegacyAdapterTest.hs`, including paired ProtectedCapital, RawSurplus and solvency comparisons over the representable legacy aggregate; fail-closed tests remain present for unsupported class composition, ProtectedCapital, historical control and locked Jackpot.
- **Coordination/red-team:** B6 remains **REPRESENTABLE LEGACY→UNIVERSAL BOUNDARY WITNESS STRENGTHENED / FULL V3↔CARDANO EQUIVALENCE OPEN / FRESH CI OPEN**. This matches the implementation: stronger witness, not full closure.
- **Notion Gate 41:** State-0/current transaction and direct Pool-NFT lineage are closed; **DEPLOYMENT INPUT GRAPH, SEED/MIN-ADA SEMANTICS, 3 ADA RECONCILIATION and FIRST CURVE REPLAY remain OPEN**. No economic interpretation of the 3 ADA is introduced.
- **CI current head:** Kernel Invalid-Class #872 was in progress at inspection; Algorithmic Governability #237 and Cardano Adapter Sale Conformance #864 succeeded; PRE-RICH Cardano Emulator Reveal #339 failed again. The repeated Reveal failure is the known evaluator/emulator `Spend[0] execution went over budget` class, not evidence of an economic invariant failure.

### Classification
- **B6:** IN CORSO / NEEDS-EVIDENCE
- **Gate 41:** IN CORSO — upstream deployment reconstruction is the active deterministic next step
- **P2.8-B.1:** BLOCCATO — evaluator/emulator, not semantic/economic verdict
- **RT-1.5:** HARDENED at runtime/Economic Admission; real-ledger value correlation remains OPEN
- **RT-2.13/2.14:** OPEN for ledger-authority/off-on-chain evidence

No economic constants, thresholds, valuation rules or canonical semantics were changed in this triangulation.


## 2026-09-23 — RT-1.5 real-Yaci Pool correlation witness added

The existing `audit/cardano-integration/reveal-ledger-trace.ts` already discovers and consumes the real B1PrizePool UTxO on Yaci. It now also constructs an `ExecutableLiquidityObservation` from that exact observed Pool reference and runs the canonical `assertExecutableLiquidityMatchesAuthenticatedPool` correlation helper against the same concrete input/value.

This closes a previously missing **real-ledger reference/value binding witness** for RT-1.5: the observation cannot point at an arbitrary UTxO while the Reveal trace is executing against another Pool input.

Important boundary retained: the Reveal fixture's liquidity asset is a deliberate 1:1 test asset, so this witness records `fixture-1-to-1-test-asset` valuation. It explicitly does **not** claim production `Economic.poolUsdmValue` oracle valuation; canonical oracle valuation remains open conformance evidence.

Commit: `7e6f3148f56445f12d65927b09cc60dba0b8b079`.

**Status:** RT-1.5 **REAL-YACI POOL REFERENCE/VALUE CORRELATION WITNESSED / CANONICAL ORACLE VALUATION OPEN / FRESH CI OPEN**.


## 2026-09-23 — RT-1.5 oracle triangulation finding

Cross-check of `plutus/Economic.hs` and `plutus/B1PrizePool.hs` shows the canonical `Economic.poolUsdmValue` valuation is actively invoked by the B1 `FundTreasury` validator path. The existing real Yaci Reveal trace, by contrast, consumes the Pool UTxO but does not exercise the validator's canonical oracle valuation path for Reveal; Reveal accounting is driven by the authenticated Pool datum and payout/reserve transition rules.

Therefore the correct next evidence target is **not** to inject an artificial oracle into the Reveal trace. It is a dedicated real-Yaci FundTreasury/Pool-funding trace that proves:
1. actual Pool input/output values;
2. actual Oracle reference input + singleton + datum;
3. canonical `Economic.poolUsdmValue` valuation semantics;
4. continuing `ppTotalLiquidity` equality to that valuation;
5. executable-liquidity observation bound to the same authenticated Pool state.

This preserves the separation between Reveal's accounting path and FundTreasury's physical-value recomputation path and avoids inventing a second valuation formula.

**Status:** RT-1.5 **REVEAL UTxO CORRELATION GREEN / CANONICAL ORACLE VALUATION TARGET IDENTIFIED / FUND-TREASURY REAL-LEDGER EVIDENCE OPEN**.

## 2026-09-23 — Current-head triangulation: Pool input binding + Gate 41 first-curve reconciliation

Current Green Closure head is `c0e68db47192f4aba0fa3d080f83b60c9005010e`.

### B1 Prize input binding

The current head hardens the on-chain B1 PrizePool Reveal/Claim boundary so the prize datum is no longer read only from a candidate output. Both transitions now require exactly one decodable Prize input and then correlate input → output:

- Reveal: input must be `Pending`; ticket policy/name must remain identical; input price must equal the action price.
- Claim: input must be `Revealed`; ticket policy/name and payout must remain identical.
- The existing output-side payout, solvency and accounting predicates remain in force.

Commit: `c0e68db47192f4aba0fa3d080f83b60c9005010e`.

This is an on-chain identity/state-continuity hardening. It does not change economic constants, valuation, payout ceiling or canonical economic rules.

### Gate 41 triangulation

The current Notion Gate 41 page now contains transaction-level evidence that is stronger than the older coordination entries:

- Pool-NFT mint transaction `0235e186...c6cf4` reconstructed and balanced.
- Exact PRE bootstrap of 1,000,000,000 PRE observed.
- Pool NFT-bearing output is `0235...#1`, containing 13,000,000 lovelace + 996,071,981 PRE + 1 Pool NFT.
- Direct Pool-NFT lineage is closed through the State-0 UTxO.
- The first curve transition `4288d5b7...` is transaction-level reconstructed and conservation-checked; its direct Pool-NFT state transition is verified.
- The remaining Gate 41 questions are semantic/provenance questions: Snek `info.outputId` mapping, Genesis funding role, seed/min-ADA semantics and the 3 ADA reconciliation.

Therefore the older coordination statements that still list **FIRST CURVE REPLAY — OPEN** are stale relative to the latest Notion evidence and must not be used as the current status. Current classification: **FIRST CURVE TRANSITION CLOSED / 3 ADA SEMANTICS OPEN**.

No economic interpretation of the 3 ADA is added.

### Evidence discipline

The direct on-chain findings are evidence of ledger facts and conservation, not attribution of economic intent. In particular, the observed 13 ADA initial Pool output and the later first-curve ADA delta do not by themselves prove seed/min-ADA/bootstrap semantics.

Status:
- **B1 Reveal/Claim Prize-input binding: HARDENED**
- **Gate 41 first-curve transition: CLOSED**
- **Gate 41 3 ADA semantics: OPEN**
- **Gate 41 Genesis funding role: OPEN**
- **Gate 41 Snek info.outputId mapping: OPEN**

## 2026-09-23 — Research-novelty prior-art pass: composition boundary sharpened

A targeted prior-art pass was run against the open RESEARCH-NOVELTY front. The result does **not** establish novelty; it sharpens the comparison set.

### High-signal overlaps

- Ethereum formal-verification guidance explicitly covers state-transition models, invariants, pre/postconditions, safety/liveness and admissible execution paths.
- VeriSolid models smart contracts as transition systems and proves observational equivalence between an abstract transition model and an augmented executable model.
- Chainlink OCR3 uses authenticated observations, quorum aggregation, signed reports, on-chain report validation and sequence numbers/high-water handling for stale reports.
- Existing reserve/DeFi systems enforce local post-state solvency invariants and explicit reserve accounting; examples include invariant-first reserve tokens and formally verified DeFi pool solvency.
- Recent formal work on authenticated cross-domain state combines safety/liveness with authenticated state-preservation and Merkle-based provenance.

### Implication for IMMORTAL

The following components are clearly **not individually novel** on the present evidence:
state-transition modeling; invariant preservation; safety/liveness separation; observational/refinement equivalence; reserve/solvency invariants; oracle freshness/authentication; provenance commitments; on-chain revalidation.

The research question therefore remains the **composition and boundary discipline**, specifically whether the complete chain

`normative economic state → candidate transition → ProtectedCapital / solvency → viability / successor admissibility → permissionless execution boundary → authenticated executable-liquidity provenance → adapter realization → on-chain revalidation → atomic state transition → reproducible evidence`

has a sufficiently close prior analogue.

The closest comparison families now identified are:
1. formal smart-contract transition/refinement systems;
2. reserve/solvency-enforced DeFi protocols;
3. authenticated oracle/reporting systems;
4. authenticated cross-domain state/provenance systems;
5. permissionless liveness / guarded convergence systems.

**Research status: PRIOR-ART MAP ADVANCED / NOVELTY DETERMINATION STILL OPEN.**

No novelty claim is made, and no protocol semantics were changed.



## 2026-09-23 — RT-1.5 dedicated FundTreasury Oracle valuation trace

The remaining RT-1.5 evidence target was implemented as a dedicated real-Yaci FundTreasury trace rather than modifying the existing Reveal trace.

Added:
- `audit/cardano-integration/fund-treasury-oracle-valuation-trace.ts`;
- real Yaci bootstrap of an authenticated Oracle State singleton + ADA price datum;
- real B1 PrizePool input with singleton Pool NFT;
- FundTreasury transaction consuming the Pool input and carrying the Oracle as a reference input;
- continuing Pool output whose `ppTotalLiquidity` is checked by the on-chain B1 validator through canonical `Economic.poolUsdmValue`;
- exact executable-liquidity observation bound to the same Pool input;
- retained signed CBOR, transaction reference, pre/post Pool refs, Oracle ref, valuation parameters and Yaci UTxO response in `audit/yaci-evidence/fund-treasury-oracle-valuation.json`;
- workflow execution in `.github/workflows/immortal-cardano-lab.yml`.

Fixture is deliberately ADA-only apart from the Pool singleton, so the single Oracle reference prices ADA and `Economic.poolUsdmValue` removes the singleton before valuation. With the canonical 1.6M lovelace min-UTxO exclusion and oracle price 80, the fixture expects:
- 5,000,000 lovelace -> 272 USDM sub-units;
- 7,000,000 lovelace -> 432 USDM sub-units.

This is an evidence harness addition, not a new economic rule. The TypeScript expected-value calculation is only an independent evidence cross-check; acceptance still comes from the actual B1 validator path invoking `Economic.poolUsdmValue`.

Commits:
- `d989ca4289d43e27143f7ea6d4729710e4765fe5` — initial trace
- `2124518a64c077fc28bf371771d4af136ee572bc` — corrected ADA Oracle asset identity
- `3913c8c1cb69f44fc69c84af756918777dded8ca` — workflow integration

Status: RT-1.5 **REAL-LEDGER FUND-TREASURY VALUATION TRACE IMPLEMENTED / FRESH CI EXECUTION OPEN**. If the fresh lab run succeeds, the remaining RT-1.5 gap becomes primarily negative-twin coverage (wrong/stale Oracle, wrong Pool, double-count/value mismatch) and provenance review rather than absence of a canonical valuation path.

## 2026-09-23 — Current-head re-triangulation after FundTreasury trace

The operational branch has advanced beyond the earlier c0e68db snapshot.

**Current Green Closure HEAD:** 31295198e0c1356292f4902c202f0aeb7d2a95b5  
**Commit:** Record RT-1.5 FundTreasury Oracle valuation trace

The latest implementation now contains the dedicated real-Yaci FundTreasury trace: audit/cardano-integration/fund-treasury-oracle-valuation-trace.ts.

Independent code inspection confirms the trace invokes the actual B1 FundTreasury redeemer and the B1 validator's canonical Economic.poolUsdmValue path, using an Oracle reference input and the continuing Pool output's actual value. The trace also correlates the executable-liquidity observation with the exact consumed Pool input/value.

This is stronger than the earlier Reveal-only correlation witness because FundTreasury is the canonical B1 path that actually recomputes Pool USDM valuation through the Oracle.

### Evidence classification

- RT-1.5 real FundTreasury valuation path: IMPLEMENTED / NEEDS FRESH CI EXECUTION
- Canonical Oracle valuation semantics: EXERCISED BY THE ACTUAL B1 VALIDATOR PATH in the trace design
- Real-ledger negative twins: still needed for wrong/stale Oracle, wrong Pool, double-count and valuation mismatch at ledger level
- Fresh CI: no workflow run is yet associated with HEAD 31295198...; therefore no green CI claim is made.
- P2.8: remains evaluator/emulator-blocked until independently re-evaluated.
- B6: remains partial; the FundTreasury trace does not establish universal V3↔Cardano equivalence.
- Gate 41: first-curve transition remains closed on the latest Notion evidence; semantic/provenance questions remain open.

### Prior-art cross-check

The current research pass confirms that state-transition/invariant verification, safety/liveness, refinement, authenticated oracle inputs and transaction-level solvency are established techniques in the literature. citeturn0search0turn0search11turn0search10

Therefore the research front should continue to test the composition of these boundaries rather than claiming novelty for any individual mechanism.

Status: RT-1.5 ADVANCED / FRESH EXECUTION REQUIRED / NO OVERCLAIM.


## 2026-09-23 — Prior-art deep pass: new reusable boundary patterns

A further research pass identified several patterns that are useful as **experimental test designs**, without treating them as new IMMORTAL semantics.

### A. Admission binding is independently established prior art

Recent transaction-admission research explicitly binds an accepted proof to the transaction reference, replay-binding value and current state, and records an accepted digest after verification. This supports continuing to model Economic Admission as a distinct boundary rather than collapsing it into generic transaction validity.

Adaptation target:
- bind `EconomicAdmissionWitness` to the exact candidate transaction/action identity;
- reject replay, stale-state and mismatched-transaction witnesses;
- keep admission evidence non-authoritative with respect to IMMORTAL economics.

### B. Event semantics are a separate evidence boundary

Recent ISSTA 2026 work identifies state/event mismatch, event collision, unauthorized event emission and event-parameter mismatch as distinct blockchain defects.

Adaptation target:
- add a negative-triad experiment where the validator state transition is valid but the emitted/observed event identifies a different semantic action;
- require event identity to bind to the same transition identity rather than treating logs as proof of state change.

This is especially relevant to C13/C14 and the CAES composition lab.

### C. Execution-finality / exact-act binding is a close architectural analogue

Recent work on execution-finality architecture requires the enforcement boundary to reconstruct the actual operation, verify exact-act binding and current protected state, prevent stale/replayed authority, and couple authorization to the resulting effect atomically.

Adaptation target:
- model `proposal -> reconstructed action -> revalidation -> atomic effect`;
- explicitly reject a certificate that proves an earlier proposal but not the exact action ultimately committed;
- compare this with the existing PERMISSIONLESS_EXECUTION_SEQUENCE.

This strengthens RT-4/Candidate→Atomic Transition without importing external policy.

### D. Provenance should be lifecycle-oriented, not merely hash-oriented

IEEE P3232.03 frames blockchain provenance across creation, transformation, transfer and verification of artifacts.

Adaptation target:
- treat C14 provenance as a lifecycle chain:
  model artifact -> refined artifact -> compiled artifact -> deployed artifact -> observed ledger event;
- require each edge to identify predecessor/successor artifacts and preserve transition identity;
- do not treat a final hash alone as proof of semantic continuity.

### E. Shadow-state / dual-check migrations offer a reusable evidence pattern

Current Ethereum state-migration work uses an independently verifiable snapshot, replayed updates, dual checking and a shadow commitment during a transition window.

Adaptation target:
- for difficult V3/Cardano equivalence fronts, maintain an independent replay/reference state and compare the concrete ledger-derived state against it;
- classify mismatches as evidence failures rather than changing economic semantics.

This may be useful for B6 and C14, especially where direct validator equivalence is difficult.

### Research classification

These findings reinforce that:
- transaction admission, exact-act binding, event semantics, provenance, replay protection, refinement and solvency are individually established;
- the potentially distinctive research question remains their **composition around one canonical economic transition identity**.

No economic constants or normative protocol semantics were changed by this research pass.


## 2026-09-23 — P2.8 evaluator deepening: runner gap isolated

A fresh evaluator-focused cross-check was performed against the Cardano ledger/Plutus APIs and the existing P2.8 runner.

### Finding
The existing `audit/cardano-ledger-runner/Main.hs` is correctly fail-closed, but it currently stops after verifying that the exact artifact pair and the six required evidence files are present/non-empty. Its own next step is explicitly to parse/validate the packet and invoke ledger-aligned `evalTxExUnitsWithLogs`; that invocation is not yet implemented in the inspected runner.

The Cardano ledger API exposes `evalTxExUnitsWithLogs` with the exact inputs already identified by the audit:
- protocol parameters;
- transaction;
- current/relevant UTxO set;
- EpochInfo;
- SystemStart.

The same API returns either a `TransactionScriptFailure` or sufficient ExUnits/logs. The Plutus V2 evaluation context separately requires the protocol's cost-model parameters in the exact declared order and must be recreated after protocol updates.

### Consequence
This sharpens P2.8-B.1 from a generic 'evaluator blocked' statement into a concrete implementation boundary:

`exact ledger evidence packet -> typed Cardano ledger reconstruction -> evalTxExUnitsWithLogs -> ExUnits OR TransactionScriptFailure -> persisted evaluator evidence`

No synthetic PParams/EpochInfo/SystemStart may be substituted. The existing emulator `execution went over budget` symptom remains diagnostic only and is not promoted to a validator/economic verdict.

### Reusable external pattern
Cardano's own ledger evaluation API and existing budget tooling demonstrate that transaction execution-unit estimation is performed against a ledger-aligned transaction/context, rather than by evaluating an isolated script with guessed context. This supports the current fail-closed architecture and gives a precise implementation target; it does not alter IMMORTAL semantics.

**Status:** P2.8-B.1 **BLOCKED → CONCRETE IMPLEMENTATION TARGET IDENTIFIED**. Evidence acceptance remains open until the runner actually reconstructs the ledger context and records ExUnits or an exact `TransactionScriptFailure`.

No economic constants, valuation rules, validator semantics or protocol decisions changed in this research pass.


## 2026-09-23 — RT-1.5 validator-path audit / C15 next witness

Re-inspected the current B1PrizePool and Economic implementation against the new FundTreasury trace.

Confirmed directly in source:
- FundTreasury obtains the continuing Pool output value with ownOutputValue;
- it calls recomputedLiquidity;
- recomputedLiquidity delegates directly to Economic.poolUsdmValue;
- Economic.poolUsdmValue removes the Pool singleton and delegates to totalUsdmValue;
- ADA valuation subtracts canonical minUtxoLovelace, requires the matching Oracle reference input, validates Oracle publisher/timestamp/price, and applies ceilingDiv;
- ppTotalLiquidity must equal that canonical recomputation and must increase.

This confirms the RT-1.5 trace is targeting the correct canonical validator path, not an off-chain approximation.

Additional C15 observation: the FundTreasury trace currently has no explicit post-submit duplicate-submission assertion, unlike the existing Reveal trace. This is now the next minimal evidence hardening target: after a successful FundTreasury, resubmitting the identical signed transaction should be required to fail, and the rejection should be recorded in the evidence packet. No economic semantics change.

External Cardano documentation independently confirms that consumed EUTxOs cannot be reused and that reference inputs can read state without consuming it. citeturn0search0turn0search4

Status: RT-1.5 CANONICAL VALIDATOR PATH CONFIRMED / C15 FUND-TREASURY DUPLICATE-SUBMISSION WITNESS OPEN / FRESH CI OPEN.

## 2026-09-23 — Prior-art pass: stronger overlaps and new adaptations

Further research found several additional high-signal overlaps.

### 1. Transaction admission can be cryptographically bound to one exact transaction
A 2026 admission framework explicitly binds current state, policy checks, replay control and proof material to the same accepted transaction instance. This reinforces the existing RT-1.5 direction.
Adaptation:
- make the CAES admission witness commit to the exact candidate action/transition identity;
- add negative twins for stale state, replay, and valid proof components mixed across different transactions;
- keep admission as a boundary check, not an economic authority.

### 2. Event semantics are an independent correctness boundary
ISSTA 2026 EventSpec identifies state-event mismatch, unauthorized emission, event collision and event-parameter mismatch as distinct blockchain defects. Events are therefore not safe evidence merely because the underlying transaction is valid.
Adaptation:
- C13/C14 experiment: require observed event identity and parameters to bind to the same canonical economic transition;
- test: valid state transition + valid event + different transition identity => reject;
- do not treat logs/events as substitutes for canonical state observation.

### 3. State-diff assertions suggest a useful Cardano-agnostic oracle for the lab
EIP-7906 proposes transaction-level assertions over state diffs and emitted events. It is Ethereum-specific and not suitable as IMMORTAL semantics, but the abstraction is useful for the audit lab: expected state delta, observed state delta, expected event, observed event, and exact correspondence check.
Adaptation target is a test-only ObservedTransitionDelta witness, not a new protocol primitive.

### 4. Semantic state translation is an active research problem
HyperCross formalizes heterogeneous ledger state mapping with canonical state objects carrying identity, semantic value and provenance, and emphasizes invariant-preserving translation between UTXO/account-style state spaces.
Adaptation:
- B6 can use a canonical (identity, semantic state, provenance) tuple for comparison;
- test that Cardano serialization preserves semantic identity/value/provenance;
- classify semantic drift separately from ordinary encoding mismatch.

### 5. Autonomous economic systems are now direct prior art
AMOS describes itself as a bounded autonomous economic organism and combines proof-carrying bounties, verified outcomes, economic state and on-chain settlement. AEA/P separately defines accountable autonomous economic agents with identity, performance proof, liability escrow and governance.
Implication:
- autonomous economic system is not a safe novelty phrase by itself;
- CAES must remain a proposed architectural class centered on economic transition preservation across normative/refinement/admission/execution/evidence boundaries, not merely autonomy + economics + proofs.

### 6. New identity-transition precedent
A 2026 paper on cryptographic individuality for autonomous blockchain agents re-checks an identity invariant at every state transition and anchors it into on-chain history.
Adaptation:
- the CAES lab can use the same pattern conceptually for transition identity: derive/commit identity once, then re-check it at each boundary;
- this is prior art for persistent transition-time invariants, so it cannot be claimed as novel independently.

### Current research conclusion
The prior-art boundary is becoming clearer:
- autonomous economic systems: prior art;
- proof-carrying actions/transactions: prior art;
- admission binding/replay protection: prior art;
- event/state semantic consistency: prior art;
- heterogeneous state translation with provenance: prior art;
- transition-time identity invariants: prior art.

The remaining candidate distinction is still the composition in which one canonical economic transition identity is preserved through:
normative economic state -> refinement -> economic admission -> executable-liquidity binding -> adapter realization -> atomic revalidation -> observed ledger transition.

No novelty claim is established by this pass. No economic semantics were changed.

## 2026-09-23 — RT-1.5 / Gate 41 triangulation update

Fresh source inspection confirms the FundTreasury target is the correct canonical valuation boundary: B1PrizePool.FundTreasury computes recomputedLiquidity from the continuing output and requires ppTotalLiquidity == recomputedLiquidity; Economic.poolUsdmValue removes the Pool singleton, requires an authenticated Oracle reference input for every asset, validates publisher and timestamp freshness, excludes minUtxoLovelace from ADA economic quantity, and uses canonical precision/ceiling conversion. This independently reinforces the dedicated Yaci trace; no Oracle was injected into Reveal because Reveal does not invoke this valuation path.

Prior-art pass (official Cardano developer material, 2025–2026) confirms the same boundary ingredients are established patterns: authenticated reference-input oracle state, explicit freshness checks, singleton/NFT authentication of protocol UTxOs, and transaction-level revalidation. This does not establish novelty for IMMORTAL. The remaining research question is the composition around one canonical economic transition/admission identity.

Gate 41 remains semantically open on Genesis funding role, Snek info.outputId mapping, seed/min-ADA semantics and 3 ADA meaning. The 3 ADA coincidence with both physical/provider threshold deltas remains evidence only; no attribution is promoted.

Status: RT-1.5 CANONICAL VALUATION PATH TRIANGULATED / FRESH CI + NEGATIVE LEDGER TWINS OPEN. RESEARCH PRIOR-ART MAP ADVANCED / NOVELTY OPEN. GATE 41 SEMANTIC RECONSTRUCTION CONTINUES.

## 2026-09-23 — RT-1.5 / C15 FundTreasury duplicate-submission witness added

The dedicated real-Yaci FundTreasury trace was hardened with a post-success replay check. After the signed FundTreasury transaction is accepted and awaited, the exact same signed transaction is submitted again; the trace now requires that resubmission to be rejected and records the rejection error in the evidence packet.

This closes the previously identified positive-path evidence gap around consumed-input finality for FundTreasury at the harness level. It does not replace ledger-level negative twins for wrong/stale Oracle, wrong Pool, double-count and valuation mismatch.

Commit: 1dfb069ed8228b308b73c96b0a931f320f047662.

Status: RT-1.5 POSITIVE FUND-TREASURY PATH + DUPLICATE-SUBMISSION WITNESS IMPLEMENTED / FRESH CI OPEN. C15 duplicate replay is now instrumented; green classification still requires fresh execution and the remaining negative twins.

No economic constants, valuation semantics or normative rules changed.

## 2026-09-23 — Prior-art pass: canonical state and state-proof boundaries

New high-signal findings refine B6/C14.

### Cardano CIP-0165: canonical ledger state
CIP-0165 defines a stable, versioned, verifiable canonical interchange representation of Cardano ledger state, with deterministic CBOR, per-chunk commitments and a manifest. It explicitly separates canonical export/interchange from node-internal representation.
Adaptation:
- B6 should distinguish semantic canonical state from local representation;
- a future evidence harness can compare a canonical state snapshot/commitment with the adapter-derived economic state;
- C14 can treat canonical-state serialization as an evidence boundary, not as a new economic authority.

### Algorand State Proofs: ledger-produced state-change evidence
Algorand State Proofs provide cryptographic evidence of state changes over blocks, signed by consensus participants and verified without running the full ledger.
Adaptation:
- use the pattern to distinguish ledger-authenticated state evidence from transition semantic validity;
- a state proof can establish that a ledger state/change was attested, but it does not by itself prove that the economic transition was the normative transition T.

### Ethereum PBT migration: shadow commitments and dual-check
EIP-8347 uses byte-canonical state snapshots, replayed updates, dual-check verification and a shadow commitment before switching the canonical state representation.
Adaptation:
- B6 can use an independent shadow/reference state and replay;
- compare reference and Cardano-derived states without modifying the canonical protocol;
- classify divergence as translation/evidence failure;
- preserve the distinction between off-chain conversion evidence and consensus-critical state.

### Current research implication
A stronger decomposition is now:
1. semantic transition validity;
2. canonical-state representation;
3. ledger-authenticated state evidence;
4. artifact/provenance evidence;
5. same-transition identity across the boundaries.

Existing systems clearly cover items 2–4 individually. The research question remains whether IMMORTAL's complete economic transition chain can be independently checked as one composition.

No protocol/economic semantics changed.

## 2026-09-23 — Prior-art pass: exact-act binding, replay/freshness and evidence closure

A current execution-finality protocol draft provides a particularly clean adversarial test vocabulary for the CAES lab: exact candidate-act reconstruction at the consequence boundary, stale-authorization/TOCTOU substitution, replay, finality-sink substitution, forged validation evidence, and fail-open degradation. It also requires outcome records to bind the candidate-act digest, protected-state generation, consumption record, sink identity and resulting consequence identifier. This is directly useful as a test-pattern analogue, not as IMMORTAL normative semantics. citeturn0search0turn0search1

Adaptation for CAES:
- define a test-only CanonicalTransitionDigest(T) over the already-existing canonical transition identity fields;
- require the same digest to survive proposal, admission, reconstruction, revalidation and observation;
- reject T1 proof + T2 committed effect even when both T1 and T2 are individually valid;
- reject valid T1 evidence replayed against a newer protected-state generation;
- record the final consequence identifier alongside the transition digest in the evidence packet;
- classify indeterminate/retry states separately from committed exactly-once outcomes.

This gives a sharper negative-twin family:
1. TOCTOU substitution: proposed T1, reconstructed T2;
2. stale admission: T1 admitted under state generation g, committed under g+1;
3. sink substitution: T1 valid for sink S1, effect appears at S2;
4. replay: already-consumed T1 submitted again;
5. evidence forgery: certificate says T1 but recomputed canonical digest is T2;
6. event/state mismatch: ledger state delta is valid but observed event identifies a different T.

CIP-0190 supplies an independent Cardano-native pattern for exact-byte identity: the verifier recomputes/validates a cryptographic digest over the exact committed bytes and treats the ledger inclusion time as the chain witness. This supports the broader rule already used in C14: do not trust a declared identity when the verifier can recompute it from the artifact. It does not prove semantic equivalence by itself. citeturn0search3

A 2026 ledger-authenticator line of work likewise separates authentication safety from ledger liveness and studies canonical transition freshness and finalized-transcript context. This reinforces keeping freshness/replay protection separate from the economic validity predicate. citeturn0academia6

An additional economic-state protocol proposal models events as causally linked records with predecessor references and tamper-evident seals. It is not an authority source for IMMORTAL, but the causal-linking pattern is useful for evidence packets: every observed transition should identify the predecessor evidence/state it claims to follow. citeturn0search5

### Implementation target
The next CAES-lab hardening should therefore be transition-digest continuity, not a new economic rule:
T_proposed.digest == T_admitted.digest == T_reconstructed.digest == T_revalidated.digest == T_observed.digest.
If any edge differs, the certificate must fail closed.

No economic constants, valuation rules, validator semantics or protocol decisions changed.


## 2026-09-23 — Prior-art pass: transition identity as chained state commitment

A new 2026 Ethereum state-registry specification gives a particularly useful concrete precedent for the CAES lab: it defines a deterministic Transition ID from the exact transition fields, requires the transition to name the current predecessor state root, requires sequential state continuity, and atomically stores the Transition ID, next state root and sequence. The specification also explicitly distinguishes the guarantee enforced by deployed logic from merely passing published test vectors. citeturn1search2

This is more directly useful than a generic hash-the-transition pattern.

Adaptation target for the lab:
- TransitionId should commit to canonical action identity plus predecessor and successor canonical identities;
- the checker should require predecessor identity to equal the currently authenticated pre-state;
- the successor identity should be derivable from the accepted transition witness rather than merely declared;
- a sequence/generation witness should prevent accepting an otherwise valid transition against an obsolete predecessor;
- the final evidence packet should bind the accepted transition ID to the observed ledger consequence.

This yields a stronger continuity predicate:

CurrentPreState == T.preState
AcceptedTransitionId == H(canonical(T))
ObservedPostState == T.postState
ObservedTransitionId == AcceptedTransitionId

and, where a monotonic state-generation exists:

T.generation == CurrentGeneration + 1.

The lab should not import the EIP's agent-memory semantics, cryptographic format, or Solidity/EVM assumptions. The reusable pattern is the separation of:
1. exact transition identity;
2. predecessor-state continuity;
3. successor-state derivation/observation;
4. atomic state commitment.

A second 2026 IETF draft sharpens the same idea into a continuity predicate: exact-act binding alone is insufficient if the decision basis, resource generation, mapping revision, revocation state, or other protected state can change. The final enforcement boundary must establish that the basis remains current or re-evaluate. citeturn1search6

This maps cleanly onto the CAES distinction already present in the project:
- economic validity of T;
- admission under an observed state;
- executable-liquidity binding;
- current protected-state revalidation;
- atomic realization;
- observed consequence.

### New negative twin

T1 is valid and admitted against state generation g. Before realization, the authoritative state advances to g+1. The finalizer still commits T1 using the old admission evidence.

Expected result: REJECT, unless the protocol explicitly proves that the old basis remains valid under the new state. No economic rule is changed by this test.

This is a stronger formulation of the existing stale-admission negative twin because it identifies the precise missing edge: decision-basis continuity.

No protocol/economic semantics changed.


## 2026-09-23 — Prior-art pass: Cardano native state-transition and artifact boundaries

A fresh Cardano-focused pass adds two useful boundary references.

First, Cardano's STS model explicitly treats the ledger as a state-transition system with small-step operational semantics. The smart-contract model similarly represents state in continuing UTxOs: an old state UTxO is consumed and a new state UTxO is produced, while the validator checks the legality of the transition. This is useful for B6 because the CAES reference transition should be compared against the concrete UTxO transition, not against an abstract notion of “the contract changed”. citeturn0search9turn0search11

Second, CIP-0171 provides an on-chain mechanism for independently linking a Cardano script hash to source origin through repository, commit, compiler/build metadata and parameters, with independent recompilation used to verify the deployed script hash. This is a strong C14 precedent for separating source provenance from deployment identity and for recomputing rather than trusting a declared relationship. citeturn0search7

Third, current Cardano developer documentation makes the transaction identity boundary unusually explicit: transaction ID is derived from the serialized body, while witnesses are not included in that body hash. This gives the lab a useful distinction between economic/action identity and witness/provenance identity; they should not be silently conflated. citeturn0search10

### New B6/C14 experiment

Define a test-only comparison record with four separate identities:
- economic transition identity;
- Cardano transaction-body identity;
- deployed script/artifact identity;
- observed ledger-state identity.

Require explicit correspondence edges rather than one omnibus hash. A mismatch at one edge is classified by boundary:
- semantic mismatch;
- transaction realization mismatch;
- artifact provenance mismatch;
- observation mismatch.

This is deliberately compatible with the existing architecture and does not introduce a new protocol primitive.

A separate 2026 financial-process verification paper provides a useful adversarial testing pattern: each processing component must present evidence of the preceding control steps, while an explicit adversary is allowed to reorder components and replay evidence issued for another transaction. The model checks fail-secure and non-bypassability properties and uses weakened baselines to generate counterexamples. This is prior art for the *testing method*, not IMMORTAL semantics. citeturn0search4

Adaptation:
- add cross-transaction certificate replay to the CAES composition lab;
- add path-bypass tests where a later certificate is valid but a required earlier boundary is missing;
- maintain an explicit “weakened checker” baseline so each security condition has a counterexample demonstrating why it is needed.

No economic constants, validator rules or normative protocol semantics changed.


## 2026-09-23 — P2.8 emulator workflow convergence correction

Direct current-head Actions inspection exposed a concrete CI blind spot: two Reveal emulator workflows existed in parallel. The active `PRE-RICH Cardano Emulator Reveal` workflow executed only `npm ci` + the emulator against checked-in `src/plutusScripts` artifacts, while the intended fresh-artifact workflow `PRE-RICH Emulator Reveal Conformance` rebuilt Plutus artifacts but incorrectly invoked `cabal run exe:export-scripts` with `working-directory: plutus`, conflicting with the repository-root `cabal.project`/export path.

The stale duplicate workflow was removed and the canonical fresh-artifact workflow was corrected to run `cabal run exe:export-scripts` from repository root.

Commits:
- `1689cc052be1ce4e1f8d1305ad1f118995803804` — fix fresh Plutus export working directory
- `26954b0fe8bd8d729701db29fab834ab53e83908` — remove duplicate stale emulator workflow

This is CI/evidence-pipeline hardening only. No validator, evaluator, economic parameter, transaction-size limit or protocol semantics changed.

### Current evidence
For the pre-fix head, the active emulator run failed at the known `Spend[1] execution went over budget` boundary using the stale-artifact workflow. That result is retained as evidence of the old path, but it is **not** evidence against the current `assetAmount` source change because the workflow did not rebuild the validator.

The corrected fresh-artifact workflow is now executing on commit `1689cc052be1ce4e1f8d1305ad1f118995803804` (run #64). Its first step is still running; no evaluator/validator conclusion is available yet.

The concurrent Adapter Sale and Algorithmic Governability workflows were triggered on the same head; both are active/success paths independent of this emulator classification. Kernel/Cardano integration runs on the same push may be cancelled/superseded by concurrency; they must be re-observed from the exact resulting head before promotion.

**Status:** P2.8-B.1 **EVIDENCE PIPELINE CONVERGED / FRESH DIFFERENTIAL RUN IN PROGRESS**.


## 2026-09-23 — Governance research expansion: algorithmic governance / constitutional governance

The research scope is now expanded from protocol prior art to algorithmic governance and constitutional governance.

### 1. Important distinction: governance of algorithms vs governance by algorithms

The 2026 Oxford Handbook frames algorithmic governance broadly as both the governance of algorithmic systems and the use of algorithmic systems in governing. It emphasizes participation in the design, operation, evolution and decommissioning of governed systems, alongside validity, accountability and legitimacy. citeturn0search0

For IMMORTAL this suggests keeping two questions separate:
- Governance of IMMORTAL: who may alter constitutional/economic rules, and under what procedure?
- Governance by IMMORTAL: once rules are frozen, which decisions are determined mechanically by the protocol rather than by discretionary operators?

The second is already close to IMMORTAL's intended economic architecture; the first is not automatically solved merely because execution is deterministic.

### 2. Full algorithmic governance is established DLT prior art

Banca d'Italia explicitly discusses governance models for DLTs including cases of full algorithmic governance, and analyzes governance tokens and concrete Ethereum/Polkadot structures. Therefore algorithmic governance itself cannot be treated as a novelty claim. citeturn1search7

### 3. Blockchain constitutionalism is established prior art

Research on blockchain constitutionalism argues that blockchain systems can function as constitutional orders and distinguishes formal on-chain constitutions from material/off-chain constitutional forces. This is directly relevant to IMMORTAL because the existing Source-of-Truth hierarchy should be tested not only for formal hierarchy but also for what can actually mutate the enforced system. citeturn1search3

A 2026 constitutional-accountability framework further separates epistemic authority (who controls knowledge/visibility), normative authority (who sets and enforces standards), and systemic authority (which institutions provide review and legitimacy). citeturn1search0

This maps well onto a CAES governance audit without importing the legal framework as protocol semantics.

### 4. DAO governance itself has a new attack surface

A 2026 study of 48 active Ethereum DAOs identifies governance attacks arising from governance-mechanism design even when the underlying contracts are assumed bug-free. This is important: correct execution of a governance mechanism does not prove that the governance mechanism itself is constitutionally safe. citeturn1academia12

Adaptation:
- add a governance-layer threat model separate from smart-contract correctness;
- test capture, proposal/vote/execution separation, delegated authority, quorum/threshold manipulation and upgrade-path bypass;
- distinguish the statement that a vote executed correctly from the statement that the vote was authorized to change this class of rule.

### 5. Formal verification of DAO governance is now an explicit research area

A 2026 ABZ contribution proposes formal specification and verification of DAO governance properties using Abstract State Machines. This confirms that governance properties themselves can be treated as formal state-transition properties, rather than merely documentation. citeturn1search2

## 2026-09-24 — Multi-front closure sweep / current evidence reconciliation

This entry records a fresh cross-front re-observation on `work/immortal-green-closure`. It is operational, not normative.

### Governance
- GOV-01/07/17 finalization outcome correction is implemented: finalization derives Accepted/Rejected from quorum + approval + gates rather than forcing Accepted.
- GOV-18 decision witness now carries `decisionCanonicalizationReference`; GOV-10 requires a later canonicalization boundary. The remaining gap is **reference identity/provenance**, not a new governance rule.
- Canonical governance payload timestamp/schema repairs, authorization negatives, and gate-before-adoption enforcement are present. Fresh full Kernel validation remains the evidence gate; no green claim is inferred from source inspection.

### Gate 41 / PRE-Snek
- Notion remains authoritative for the latest evidence: State-0, Pool-NFT mint, direct NFT lineage and first-curve transition are closed.
- The remaining semantic/provenance gaps are **Snek info.outputId mapping, Genesis funding role, seed/min-ADA semantics and 3 ADA reconciliation**. The transaction-level funding conservation is already closed.
- Do not convert the observed 3 ADA into a seed/min-ADA rule without the missing primary evidence.

### P2.8-B.1 / evaluator
- The emulator path is still blocked by the repeated Lucid 0.10.11 evaluator/budget boundary; this is not an economic verdict.
- The sharper implementation target remains the real ledger-aligned evaluator path: exact evidence packet → typed transaction/UTxO/PParams/EpochInfo/SystemStart → `evalTxExUnitsWithLogs` → persisted ExUnits or exact script failure. No synthetic ledger context is acceptable.
- The stale-artifact distinction remains mandatory: emulator runs that did not rebuild current Plutus artifacts cannot classify the latest `assetAmount` experiment.

### B4 / B5 / B6
- B4 projection/preservation evidence is materially strengthened, including non-zero protected components and Jackpot locked protection. Transition-level preservation and real-ledger provenance remain open.
- B5 runtime economic submission boundary is hardened: TicketIssued, Reveal, Claim and Expire require typed Economic Admission; the adapter fails closed and does not manufacture economic truth. Remaining gap is authoritative witness production and real execution evidence.
- RT-1.5 now binds executable liquidity to the exact authenticated B1 Pool input/value surface. The dedicated FundTreasury trace exercises the canonical `Economic.poolUsdmValue` validator path. Its current source already includes duplicate-submission rejection; the remaining evidence target is fresh CI plus wrong/stale Oracle, wrong-Pool, double-count and valuation-mismatch ledger twins.
- B6 remains partial: representable legacy→universal ProtectedCapital/RawSurplus/solvency witnesses are stronger, but full V3↔Cardano action equivalence is not closed.

### Genesis / C10-C15
- Genesis semantic predicate is closed at application level: verified PRE Treasury ≥ 4,000 USDM; Snek bootstrap is not automatically PrizePool liquidity.
- The application carrier, one-shot singleton mint policy, authenticated Treasury/Oracle references, carrier-value preservation and signed-CBOR provenance binder are implemented. Fresh Yaci execution is still required before ledger-green promotion.
- Production Treasury migration semantics and the canonical deployment identity remain distinct evidence obligations where not supplied by authoritative sources.
- C13 representation witness, C14 artifact/witness/transaction provenance and C15 replay/idempotency surfaces are implemented/hardened; ledger correlation remains the closure gate.

### Materios / AG-01
- Materios proof boundary is correctly fail-closed and preserves selector authority in the upstream Rust/WASM implementation; no TypeScript reimplementation is being promoted. Real authenticated authority-set transition + finalized GRANDPA evidence remains open.
- AG-01 governance has executable schema/authorization/gate hardening and algorithmic-governability adversarial coverage; canonical lifecycle/finality replay evidence still needs current-head CI.

### New research / cross-front conclusion
The strongest common closure object is not another abstraction layer. It is a **transition identity/evidence chain** binding canonical action + pre-state + post-state + authenticated economic observations + generated artifact identity + signed transaction + observed ledger result. This is an evidence/conformance target, not a new economic primitive.

### Current non-regression rule
Do not reopen KA/KC/KD, ladder, 500×, Jackpot ownership/funding semantics, expiry mechanism, ProtectedCapital formula, or Genesis threshold to solve CI/evaluator/evidence failures. Fix fixtures/toolchains/evidence binding at the smallest boundary justified by the observed failure.

**Status:** MULTI-FRONT RECONCILED / NO NORMATIVE CHANGE / FRESH CI + REAL-LEDGER EVIDENCE REMAIN DECISIVE.


## 2026-09-24 — Gate 41: Koios API-version correction
A further provider triangulation caught a concrete acquisition defect before any historical evidence was claimed: the helper was using `/api/v1`, while the current Koios client/documentation identifies `v0` as the default API version and the mainnet host as `api.koios.rest`. citeturn0search0turn0search1turn0search4

Corrected `scripts/acquire-pre-snek-koios-redeemer.ps1` to `https://api.koios.rest/api/v0`.
Commit: `516a9ca576aaeb9299e3cb999a9a17583c207f99`.

This is exactly the kind of pre-acquisition correction required by Gate 41: no response was interpreted, and no evidence status was promoted. The helper remains fail-closed and paginated. Historical PRE mint redeemer remains OPEN until a real response is acquired and preserved.


## 2026-09-24 — Gate 41: Koios version re-correction
A provider-documentation triangulation found that the previous `v0` correction was itself stale. Current Cardano Developer Portal documentation lists mainnet Koios as `https://api.koios.rest/api/v1`, and the current Koios Python client documents `/api/v1` as its default/custom API base. The Koios API's `script_redeemers` operation is confirmed as the provider surface for redeemers of a script. citeturn0search3turn1search0turn1search3

The Gate 41 helper has therefore been corrected back to `https://api.koios.rest/api/v1` in commit `0b41fc53b9e21754d890b1a8ac80f72284170a22`.

This correction is important: the earlier `516a9ca...` v0 change must not be treated as evidence that v0 is current. No historical witness response has been interpreted or claimed from either version. Direct provider retrieval remains an acquisition task, not a semantic conclusion.

**Gate 41 status remains OPEN:** historical PRE mint redeemer/witness and serialized transaction CBOR remain the primary missing artifacts. No economic or validator semantics changed.


## 2026-09-24 — Autonomous all-front sweep

This operational update records direct current-branch verification at HEAD `e6bafb58bb3987a87afc427a41c3fb680e25621d`.

### Gate 41 / PRE-Snek
- The current branch has the Koios acquisition helper on `https://api.koios.rest/api/v1`, matching the latest provider triangulation already recorded in this register.
- The exact target remains tx `0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4`, PRE policy `1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4`, purpose `mint`.
- Direct acquisition was attempted from the execution environment but DNS/network access to `api.koios.rest` is unavailable; therefore **no redeemer response is claimed**. The helper remains the reproducible acquisition path.
- The semantic status stays OPEN: no seed/min-ADA interpretation is promoted from the observed 3 ADA.

### P2.8 / evaluator
- Current Cardano documentation confirms deterministic validation and that exact transaction inputs/context determine script execution; redeemer indexing depends on canonical input ordering. This supports the existing requirement that P2.8 use the exact ledger-aligned transaction/UTxO/PParams/EpochInfo/SystemStart rather than synthetic context.
- The closure target remains: evidence packet → typed ledger objects → `evalTxExUnitsWithLogs` → persisted ExUnits or exact script failure, with negative input-binding tests.
- No evaluator green result is claimed from source inspection alone.

### B4 / B5 / B6
- Current project state remains: B4 preservation materially strengthened but real-ledger provenance open; B5 admission boundary hardened but authoritative witness production/real execution open; B6 partial with universal aggregate witnesses but not full V3↔Cardano action equivalence.
- No new economic rule was introduced. The universal bridge remains additive/fail-closed.
- The next concrete closure test is action-by-action: authenticated pre-state → candidate post-state → ProtectedCapital/RawSurplus → Economic Gate → admissible transition → observed Cardano state.

### Materios / AG-01
- Materios authority-selection authority remains in the upstream selector boundary; no TypeScript selector replacement is justified.
- The remaining proof target is authenticated authority-set transition + finalized GRANDPA evidence + ancestry/quorum linkage.
- AG-01 remains on the canonical replay/finality evidence path; governance implementation has the Accepted/Rejected final-outcome correction and lifecycle separation, while current-head CI remains the evidence gate.

### Genesis / C10–C15
- Genesis application semantics remain closed at the documented threshold and carrier boundary; fresh Yaci execution and production deployment/provenance correlation remain the decisive evidence gaps where not already observed.
- C13/C14/C15 are implementation-hardened but not ledger-green merely from code inspection.

### Universal boundary / research
- The universal/application state bridge remains the correct non-destructive direction. No big-bang V3 refactor is justified before consumer/conformance mapping is complete.
- Research novelty remains open: individual mechanisms are established prior art; only the composition/boundary discipline is under comparative study, with no novelty claim.

### Current conclusion
**MULTI-FRONT ACTIVE / NO NORMATIVE CHANGE.** The main remaining closure class across fronts is now evidence continuity: exact canonical transition identity → authenticated pre-state → generated artifact/transaction identity → observed ledger consequence. Tooling/network limitations must not be converted into semantic claims.


## 2026-09-24 — Mainnet evidence gate matrix
Created `docs/COORDINATION/IMMORTAL_MAINNET_EVIDENCE_GATE.md` at commit `e578b2ee4aee231267b3cc960b48d545283f279f`.

The matrix converts the current R1–R9/B4/B5/B6/Cardano/Governance/Materios fronts into an evidence-oriented mainnet gate. It explicitly separates implementation/test presence from closure evidence and identifies the common closure object as the complete canonical-transition → transaction → ledger-observation → post-state chain.

No normative economics changed. Gate 41 remains historical provenance rather than a core economic blocker; the historical mint redeemer/CBOR acquisition remains open and fail-closed. Mainnet-critical evidence gaps remain M6 composition, M7 ProtectedCapital preservation, M8 Economic Gate/atomic transition, M9 V3↔Cardano equivalence, M10 Ω completeness, M11 oracle integrity, M14 Materios authority/finality provenance, and M16 independent security review.

## 2026-09-24 — Golden Reveal evidence packet / B6 concrete closure path

This operational update advances Priority A of the Mainnet Evidence Gate without claiming a real-ledger closure.

### Triangulated implementation boundary

The current working branch shows that src/gameFlow.ts already makes Reveal an economic transition requiring an explicit EconomicAdmissionWitness and coordinates the PrizeValidator and B1PrizePool updates. The runtime submission boundary in Adapter/CARDANO/runtime/EconomicAdmission.ts checks the witness, state hash, EEV, authenticated Pool input/value, executable-liquidity source references and immediate-liquidity requirement before submitEconomic.

The Reveal implementation also derives and freezes the two Classic-6 row tiers, the result, payout and summary tier, while updating the B1 pool reserve, unresolved-ticket count and pending liabilities.

### New artifact

Created:

- audit/transition-evidence/PRE-RICH-REVEAL-GOLDEN-PACKET.md
- Commit: 9e238db8feadc69ab8bf62a0c7e9b8b3daa69bcc

The manifest binds the existing implementation boundaries to the evidence chain:

canonical action → authenticated pre-state → economic admission → candidate post-state → exact transaction CBOR/witness/context → signed transaction → observed ledger result → reconstructed post-state → evaluator output.

It deliberately contains no invented TxId, UTxO, ExUnits, datum hash or ledger result.

### External protocol triangulation

Current Cardano documentation confirms that a transaction consists of body, witness set, validity flag and auxiliary data; Plutus redeemers are part of the witness set and mint/spend redeemer indexing is tied to canonical transaction ordering. It also states that deterministic validation depends on the exact transaction/context presented to the ledger. citeturn0search1turn0search3turn0search4

Therefore the golden packet must preserve the exact serialized transaction and ledger-aligned evaluation context rather than only an explorer/indexer summary.

### Current B6 consequence

Issue / Claim / Expire already have positive ticket-level refinement evidence recorded in this register. Reveal remains the principal action for which the same chain must now be populated with a real Cardano execution.

**Status:** B6 Reveal evidence path concretely specified / REAL-LEDGER PACKET OPEN / NO NORMATIVE CHANGE.


## 2026-09-24 — Fresh multi-front evidence observation

Exact-head CI lookup for reported HEAD `e6bafb58bb3987a87afc427a41c3fb680e25621d` returned **no workflow runs**. This is evidence absence, not a failure result; GOV-28 therefore remains CLOSING with no current-head GREEN claim. Gate 41 helper remains on `https://api.koios.rest/api/v1`, fail-closed, with raw-page/hash/provenance capture; no live redeemer/CBOR semantics are promoted. P2.8 remains tied to the exact ledger-aligned transaction/UTxO/PParams/EpochInfo/SystemStart evaluator path. B4 requires real-transition ProtectedCapital preservation; B5 requires Economic Admission witness bound to executed transaction and post-state; B6 requires action-by-action V3↔Cardano correspondence. Materios remains proof-gated with upstream selector authority and requires authenticated authority-set transition plus finalized GRANDPA ancestry/quorum evidence. Genesis/C10–C15 still require fresh Yaci/deployment/artifact/transaction/ledger correlation where not observed. No destructive V3 refactor or normative economic change is justified.

**Status: MULTI-FRONT ACTIVE / NO NORMATIVE CHANGE / EXACT-HEAD CI EVIDENCE ABSENT / REAL-LEDGER EVIDENCE DECISIVE.**

## 2026-09-24 — Branch provenance correction / CAES quarantine

External review identified an attribution error in the previous mainnet-evidence assessment: repository commits are not evidence on the closure branch unless the artifact is actually present/integrated there.

Fresh branch triangulation confirms `audit/p2-8-b1-reference-scripts-2026-09-21` exists and contains `audit/caes-transition-lab/` as a separate audit experiment. The current directory listing does not contain the previously cited `ComposedTransitionCertificate.ts`; therefore no claim is made that this composition artifact is integrated into `work/immortal-green-closure`.

Consequence:
- M6 composition remains OPEN / NOT INTEGRATED on the closure branch.
- CAES remains quarantined audit material until explicit integration.
- The Mainnet Evidence Gate now requires repository + branch/ref + commit SHA + path + artifact role + integration status + closure acceptance for every evidence row.

This correction supersedes any earlier wording that treated repository-wide CAES commits as progress already present on `work/immortal-green-closure`.

**No normative change.**

## 2026-09-24 — Closure-branch dispersion audit / current-head correction

Fresh direct branch verification establishes the current closure ref as `work/immortal-green-closure` at HEAD `3750bb4f8a936f78f3f97d86fd8d25c4ea4f5730`.

Inventory of `docs/COORDINATION/` on this exact branch:
- 45 markdown coordination files;
- 5 Gate 41-specific documents;
- 22 GOV-28-specific documents;
- 3 R2/RF8 recovery/audit documents.

These are inventory facts only. They are not gate scores. Gate 41 remains one historical acquisition workstream; GOV-28 documents represent multiple distinct lifecycle/finality/replay/conformance findings, including an explicit OPEN finality-to-acceptance integration blocker. Documentation presence is not equivalent to closure.

The green branch contains `CAES_PRIOR_ART_HANDOFF_2026-09-23.md`, whose explicit instruction is still: do not move the CAES experiment into `work/immortal-green-closure`. Direct lookup of `audit/caes-transition-lab/ComposedTransitionCertificate.ts` on green returns 404. Therefore:

- CAES experiment: isolated audit material;
- M6 composition: **OPEN / NOT INTEGRATED**;
- no repository-wide commit may be promoted to green-branch closure evidence without exact ref/path provenance.

### Operational dispersion control

No new coordination document should be created unless it closes/narrows an existing gate, preserves indispensable raw provenance, records a distinct actionable blocker, or consolidates existing findings. New documents must state their parent gate/front and evidence role. Duplicate status narratives should be consolidated rather than multiplied.

This is an operational anti-dispersion rule only. No economics, validator semantics, governance rules or architecture authority changed.


## 2026-09-24 — P2.8 runner trigger alignment

Fresh workflow triangulation found a concrete CI wiring gap: `.github/workflows/p2-8-b1-cardano-ledger-runner.yml` had `workflow_dispatch` plus a push trigger only for `audit/p2-8-b1-cardano-ledger-runner`, although the complete `audit/cardano-ledger-runner/` implementation is present on `work/immortal-green-closure`.

The workflow was minimally corrected to add `work/immortal-green-closure` to its push branches, without changing runner semantics or evaluator inputs.

Commit: `7b9f6856bcfe30ff8c96b7524d2c5c6646a97867`.

Immediate exact-commit observation returned no workflow run yet. This is evidence absence, not failure. If a run appears, preserve the runner report before classifying P2.8.

**Status:** P2.8 CI trigger wiring corrected / execution evidence still OPEN / NO NORMATIVE CHANGE.


## 2026-09-24 — P2.8 runner implementation re-triangulation

Fresh exact-branch inspection confirms the workflow now triggers on both the audit branch and `work/immortal-green-closure`. Exact-commit lookup for `1113c960d5267b7b58e0300d526814e59805aef6` still returns zero workflow runs: evidence absence, not failure.

`audit/cardano-ledger-runner/Main.hs` is currently a fail-closed evidence-packet gate, not yet the promised ledger evaluator. It checks non-empty exact Plutus artifacts plus `tx.cbor`, `utxo.json`, `pparams.json`, `epoch-info.json`, `system-start.json`, and `manifest.json`; when complete it prints `COMPLETE_EVIDENCE_PACKET_PRESENT` and explicitly states that parsing/evaluation remains the next step. Although the Cabal file declares Cardano ledger/Plutus dependencies, Main.hs does not yet invoke `evalTxExUnitsWithLogs` or an equivalent ledger-aligned evaluator.

**P2.8 status:** RUNNER WIRED / EVIDENCE-PACKET CHECK IMPLEMENTED / LEDGER EVALUATION NOT YET IMPLEMENTED / NO GREEN CLAIM. Next justified step is typed evidence parsing plus exact ledger-aligned evaluation, not another status document.

No normative economics, validator semantics, or evaluator verdict changed.


## 2026-09-24 — P2.8 evaluator API triangulation

External primary documentation was triangulated against the exact dependency pin in `audit/cardano-ledger-runner/cabal.project`.

- The project pins IntersectMBO/cardano-ledger at `f649f9751074d2ab3de033fc3912f29c9862c1f5`, with Alonzo implementation plus ledger API/core and related packages.
- The corresponding `cardano-ledger-alonzo-1.16.0.0` documentation exposes `evalTxExUnitsWithLogs` through `Cardano.Ledger.Api.Tx` with the required shape: `PParams → Tx → UTxO → EpochInfo (Either Text) → SystemStart → RedeemerReportWithLogs`.
- The same API explicitly states that supplied transaction execution budgets are ignored and the evaluator derives the required budgets from the supplied transaction and ledger context. This matches the project's fail-closed requirement to use the exact transaction plus authenticated UTxO/PParams/EpochInfo/SystemStart rather than synthetic context. citeturn0search0turn0search3
- The exact project packet directory currently contains no evidence files; only the empty `evidence/` directory is present. Therefore there is still no real transaction/context packet that can legitimately be evaluated on this branch.

**Engineering consequence:** the evaluator API is no longer an unknown. The remaining implementation task is packet decoding/binding into the exact ledger types, followed by `evalTxExUnitsWithLogs`. It is not justified to fabricate parsers for absent evidence or to mark P2.8 green before an actual packet is supplied and evaluated.

**Status:** API CONFIRMED / PACKET ABSENT / EVALUATION OPEN / NO GREEN CLAIM.


## 2026-09-24 — P2.8 evidence handoff strengthened from real Reveal trace

The existing real Yaci Reveal trace was re-triangulated against the P2.8 packet contract. A minimal additive change now persists two raw observations that the trace already obtains:

- `audit/yaci-evidence/reveal-tx.cbor`: exact signed Reveal transaction serialized CBOR, written as binary from the Lucid-produced CBOR string;
- `audit/yaci-evidence/reveal-protocol-parameters.json`: the protocol-parameter object returned by the Yaci/Blockfrost provider at trace time, serialized with BigInt values represented as decimal strings.

Change commit: `463e319c886ba7643c866549568647fddfd03204`.

This improves raw provenance and makes the real transaction/context handoff more concrete without pretending that provider JSON is already a decoded ledger `PParams` or that the transaction alone is sufficient for evaluation.

The trace already persists the signed transaction reference, pre/post UTxO fingerprints, action fingerprint and Yaci `/txs/{hash}/utxos` observation. The unresolved P2.8 requirements remain a ledger-typed `UTxO`, exact `PParams`, `EpochInfo (Either Text)`, `SystemStart`, and the actual `evalTxExUnitsWithLogs` invocation.

Exact-commit P2.8 workflow lookup remains empty; no CI execution result is inferred.

**Status:** REAL REVEAL RAW-ARTIFACT HANDOFF STRENGTHENED / TYPED LEDGER EVALUATION STILL OPEN / NO GREEN CLAIM.


## 2026-09-24 — P2.8 runner-to-lab handoff audit

Fresh workflow triangulation found a second concrete wiring limitation. The dedicated P2.8 runner executes `cabal run cardano-ledger-runner` in isolation and its default evidence directory is `audit/cardano-ledger-runner/evidence`. That directory is empty on the closure branch. The real Cardano lab, by contrast, generates the Reveal artifacts under `audit/yaci-evidence/` in a separate workflow (`immortal-cardano-lab.yml`).

Therefore the current runner does **not** automatically consume the real Reveal transaction/context produced by the Cardano lab. The two workflows have no artifact handoff in the inspected configuration. The runner's current Main.hs then stops at file-presence checks and does not invoke `evalTxExUnitsWithLogs`.

This does not invalidate the real Reveal trace; it identifies a reproducibility/CI-continuity gap between generation and evaluation. The correct next implementation is an explicit evidence-packet handoff (or a single workflow that generates and evaluates the same packet), followed by typed decoding and ledger-aligned evaluation. No synthetic copy of provider JSON may be treated as a typed ledger `UTxO/PParams/EpochInfo/SystemStart`.

**Status:** P2.8 HANDOFF GAP CONFIRMED / EVALUATION STILL OPEN / NO GREEN CLAIM / NO NORMATIVE CHANGE.


## 2026-09-24 — B5 Reveal lab boundary re-triangulated

A direct comparison of the production Reveal path and the real Yaci Reveal trace found a concrete evidence-boundary distinction.

- Production `src/gameFlow.ts::revealPrize` correctly submits through `signAndSubmitEconomicTx(..., opts.economicAdmission, ...)`, which reaches `CardanoExecutionAdapter.submitEconomic` and `assertEconomicAdmission`.
- The real Yaci laboratory `audit/cardano-integration/reveal-ledger-trace.ts` instead constructs a Reveal and calls the generic `executionAdapter.submit(reveal)`. Therefore its successful local-ledger execution demonstrates validator/transaction realization and post-state observation, but **does not by itself demonstrate the B5 Economic Admission boundary**.
- The trace cannot safely be changed to fabricate an EconomicAdmissionWitness: the witness is explicitly an economic authority supplied by the authoritative economic/profile layer, and the lab itself currently marks its liquidity valuation as fixture-specific rather than canonical oracle valuation.
- This distinction is therefore an evidence-classification issue, not a reason to weaken the adapter or invent fixture economics.

**Consequence:** RF10/RF11 real Reveal evidence can support Cardano realization and B6 evidence continuity, but B5 still requires a real execution path whose EconomicAdmissionWitness is produced authoritatively and is bound to the exact transaction inputs/post-state.

No normative economics or validator semantics changed.


## 2026-09-24 — P2.8 lab handoff wired

The Cardano integration lab workflow was minimally updated so its same-run real Yaci evidence is handed to the dedicated P2.8 runner via `--evidence-dir ../yaci-evidence` after the economic traces complete.

Commit: `5bc3a60445af1dd813ab190aa7db9760b75863ed`.

This removes the previous CI continuity gap between evidence generation and the P2.8 packet presence gate. It does **not** make P2.8 green: the runner still stops safely until the required ledger-typed context (`UTxO`, exact `PParams`, `EpochInfo`, `SystemStart`) is present and `evalTxExUnitsWithLogs` is actually invoked.

**Status:** HANDOFF WIRED / LEDGER EVALUATION OPEN / NO GREEN CLAIM / NO NORMATIVE CHANGE.


## 2026-09-24 — P2.8 current-head re-observation

Current closure branch HEAD is `4789859ead926259b082a461082b9c9183a0d747`.

The P2.8 workflow handoff is now present and the runner explicitly distinguishes the real raw Yaci handoff from the canonical typed ledger packet. On the current HEAD, exact-commit workflow lookup still returns no workflow runs. This is evidence absence, not failure.

Current P2.8 classification:
**HANDOFF WIRED / RAW REAL-LEDGER EVIDENCE AVAILABLE AFTER LAB RUN / TYPED UTxO-PParams-EpochInfo-SystemStart MATERIALIZATION OPEN / evalTxExUnitsWithLogs OPEN / NO GREEN CLAIM.**

The real Reveal lab remains valuable for transaction/post-state observation and B6 evidence continuity, but its generic adapter submission path does not by itself satisfy B5 Economic Admission execution.

No normative economics, validator semantics, or governance rules changed.


## 2026-09-24 — P2.8 artifact-path execution bug corrected

After the Yaci → P2.8 handoff was wired, exact workflow execution context was rechecked. The workflow invokes the runner with working-directory: audit/cardano-ledger-runner, while Main.hs previously referenced src/plutusScripts/... as if launched from repository root. That would make the runner report EXACT_PLUTUS_ARTIFACT_MISSING even when the generated artifacts were present.

Minimal correction applied:
- artifactPaths now resolves ../../src/plutusScripts/prizeValidatorFactory.plutus.json
- artifactPaths now resolves ../../src/plutusScripts/b1PrizePoolFactory.plutus.json

Commit: 21f3e9463e70123055c013d048a6490934f7bbc6.

This is execution wiring only. It does not add synthetic evidence, does not evaluate transactions, and does not change any validator/economic/governance semantics.

Status: P2.8 RUNNER PATH CORRECTED / RAW HANDOFF WIRED / TYPED LEDGER CONTEXT + evalTxExUnitsWithLogs STILL OPEN / NO GREEN CLAIM.


## 2026-09-24 — RF8 Treasury side-door confirmed

Fresh exact-branch triangulation of docs/treasury-distribution-spec.md, plutus/Treasury.hs, and relayer/relayer.js confirms a concrete economic-admission boundary gap.

- The specification states that Treasury distribution must derive from verified economic state and must not bypass the canonical Economic Gate.
- The current relayer.js Treasury worker reads Treasury UTxOs, applies an operational lovelace threshold, constructs Distribute, and calls lucid.submitTx(...) directly. It does not consume EconomicAdmissionWitness or the adapter submitEconomic boundary.
- plutus/Treasury.hs enforces threshold/percentage/output predicates, but those checks are not equivalent to the universal Economic Gate and do not establish canonical admission provenance.
- This makes Treasury a genuine potential economic side door until an authoritative admission path is defined and wired.

No code was changed because replacing the worker's distribution arithmetic or inventing a Treasury admission witness would choose economic semantics not yet established for this surface.

Status: RF8 TREASURY SIDE-DOOR CONFIRMED / ECONOMIC GATE MEMBERSHIP OPEN / LEGACY RELAYER PATH NOT EVIDENCE OF CANONICAL ADMISSION / NO NORMATIVE CHANGE.


## 2026-09-24 — Cardano audit workflow self-trigger corrected

The current `.github/workflows/cardano-ledger-audit.yml` had a `paths` filter covering runner sources and Plutus artifacts, but not the workflow file itself. The preceding workflow-only correction commit therefore produced no push-triggered run. Added the workflow path to its own filter so future workflow-only wiring corrections can execute the audit.

Commit: ec6ac111e595ed77ca2e143bef1d0c46df4013d2.

Exact-commit workflow/status lookup immediately after the correction still returns no run/status. This remains evidence absence, not a failure.

Status: CI TRIGGER FILTER CORRECTED / RUN EVIDENCE STILL PENDING / NO GREEN CLAIM.


## 2026-09-24 — RF8 re-observation: Treasury fail-closed boundary

Current exact-branch inspection of `relayer/relayer.js` shows the Treasury worker no longer signs or submits a `Distribute` transaction. When the configured threshold is reached, it stops at an explicit fail-closed migration boundary and requires an authoritative EconomicAdmission path.

Therefore the earlier direct `lucid.submitTx` Treasury side-door is **removed in the current working tree**.

The remaining issue is semantic, not a live bypass:

- define the authoritative Treasury economic admission witness;
- bind Treasury pre-state/action/candidate post-state to the canonical economic transition;
- establish whether and how Treasury distribution participates in ProtectedCapital / RawSurplus / viability;
- add ledger evidence once that admission contract exists.

Do not restore the legacy percentage split or invent a replacement admission formula merely to make the worker operational.

## 2026-09-24 — RF8 admission fingerprint hardening

`EconomicAdmissionWitness.actionFingerprint` now requires a 32-byte hexadecimal digest and has a negative regression test. Current latest test-triggering commit: `85da4b681036f30d22a9f26676d0507046af6843`.

No normative economic semantics changed.


## 2026-09-24 — RF8 Treasury relayer side-door closed fail-closed

Current-ref triangulation against the PRE-RICH Treasury specification confirmed that the legacy `relayer/relayer.js::treasuryWorker` was an economically material side surface: it could read Treasury UTxOs, compute a four-way percentage distribution, construct `Distribute`, sign and submit directly with Lucid, without an EconomicAdmissionWitness.

The current V3 Treasury specification requires economic Treasury operations to derive from verified economic state, pass the applicable Economic Gate, remain atomic, and keep relayer execution authority separate from economic authority. It also identifies the legacy percentage fields as migration debt rather than current V3 invariants.

The worker has therefore been changed to **observation-only / fail-closed** once the threshold is reached. It no longer signs or submits a Treasury distribution. No replacement percentage rule was introduced. A dedicated RF8 regression test now asserts that the Treasury worker contains neither direct `lucid.signTx` nor `lucid.submitTx` and retains the explicit disabled state.

Commits:
- `0014b206769df894f6459012ae31405db4bbbedf` — fail-closed Treasury worker;
- `90ad52b4319e2896030bab0be46ceca95caecca1` — RF8 regression coverage.

**Status:** RF8 TREASURY SIDE-DOOR CLOSED / V3 TREASURY MIGRATION STILL OPEN / NO NORMATIVE ECONOMIC CHANGE.


## 2026-09-24 — RF8 regression promoted into CI

The RF8 submission-boundary regression suite now runs in `.github/workflows/adapter-sale-conformance.yml` together with the existing Adapter/economic conformance tests.

Commit: `dc5479c95b9bf52e212754cb3c8f46d2acf4fe3d`.

This makes the Treasury-relayer side-door closure executable as a CI guard rather than documentation-only evidence. The guard specifically covers the legacy `treasuryWorker` surface and rejects direct `lucid.signTx` / `lucid.submitTx` calls there.

**Status:** RF8 TREASURY SIDE-DOOR CLOSED / REGRESSION IN CI / V3 TREASURY MIGRATION STILL OPEN / NO NORMATIVE ECONOMIC CHANGE.


## 2026-09-24 — Cardano Ledger Audit workflow self-trigger fixed

The previous Cardano Ledger Audit workflow failure was confirmed from the actual job log: Cabal was invoked from repository root while `audit/cardano-ledger-runner/cabal.project` declares `packages: .`, causing `The package directory '.' does not contain any .cabal file.`

The workflow was corrected to run build/run commands from `audit/cardano-ledger-runner`. The workflow's own YAML was also added to its push path filters so future runner changes trigger the audit automatically.

Commit: `7f24b056af19d93aa042472ac36f3713c93433cb`.

This is CI/tooling correction only. It does not constitute ledger evaluation or a P2.8 green result. The actual evaluator remains open.

**Status:** LEDGER AUDIT WORKFLOW INVOCATION FIXED / SELF-TRIGGER WIRED / LEDGER EVALUATION OPEN / NO NORMATIVE CHANGE.


## 2026-09-24 — PRE-GENESIS Oracle precision hardening

Triangulation of the current PRE-GENESIS Treasury admission against the existing Cardano OracleTypes surface found that `GenesisTreasuryAdmission.ts` previously accepted `oraclePrecision` from the witness without checking the canonical precision.

Canonical source: `Adapter/CARDANO/observation/OracleTypes.hs` defines `precision = 1_000_000`.

The admission boundary now rejects any precision other than `1_000_000` before calculating the verified Treasury PRE value.

Commits:
- `3c6a496e23c097fae959075c3f46b7a454fc0896` — canonical precision binding;
- `a3cb629597a59551ed88b8f38087fd2fa00fbb43` — negative regression tests for zero, 999999 and 1000001.

This does not add a new threshold or oracle. It prevents witness-controlled precision from altering the frozen Genesis valuation.

Status: PRE-GENESIS valuation precision boundary **HARDENED / TRANSITION STILL OPEN**.


## 2026-09-24 — Genesis oracle-precision conformance mismatch fixed

Current-head inspection of `PRE-RICH/profile/GenesisTreasuryAdmission.ts` found that the admission implementation already returned `INVALID_ORACLE_PRECISION`, while the declared `GenesisTreasuryAdmission.reason` union did not include that case. The new adversarial test added coverage for precision values outside the canonical `1_000_000` scale, so the mismatch would have surfaced as a TypeScript type/conformance failure.

Added `INVALID_ORACLE_PRECISION` to the union without changing the Genesis threshold, valuation formula, or canonical precision.

Commit: `023e10e2b2da5b0e1ebede519c7f2817e489e2d4`.

**Status:** GENESIS ORACLE-BOUNDARY CONFORMANCE MISMATCH FIXED / NO NORMATIVE ECONOMIC CHANGE.


## 2026-09-24 — B6/PC-05 scale-conformance test restored on active branch

The active branch now contains `PRE-RICH/profile/B6-PC05-monetary-scale.conformance.test.ts`.

It explicitly verifies the existing Cardano→V3 normalization contract:

- B1 USDM sub-units → IMMORTAL reference units at 100:1;
- liabilities, unresolved reserve, locked Jackpot and threshold normalize exactly;
- class exposure remains in V3 reference units;
- non-integral normalization (501 sub-units) fails closed;
- canonical Reveal post-state preserves the normalized monetary scale.

Commit: `388623d886af4e1bb41082734389d06715f3c268`.

This is evidence hardening only. No economic constant or conversion rule was changed.

B6/PC-05 status remains **OPEN for cross-boundary equivalence**, with explicit normalization evidence now stronger.


## 2026-09-24 — RF8 CI matcher/consolidation pass

The RF8 regression added for the Treasury side-door initially failed at test parsing because two matcher literals were over-escaped. The suite was corrected and duplicate Treasury-relayer coverage was consolidated so the dedicated `rf8-treasury-relayer-boundary.test.ts` owns that specific assertion. The Adapter Conformance workflow now executes both the general RF8 submission-boundary test and the dedicated Treasury-relayer guard.

Current verification chain:
`relayer treasuryWorker` fail-closed → dedicated regression → Adapter CI.

No economic semantics changed.


## 2026-09-24 — P2.8 SAFE_STALL CI contract aligned

Fresh exact-branch execution inspection found that the Cardano Ledger Audit workflow asserted `NO NORMATIVE A/B VERDICT` for the explicit SAFE_STALL path, while `audit/cardano-ledger-runner/Main.hs` emitted that line only after a complete evidence packet. The runner now emits the non-verdict line unconditionally after classification, preserving fail-closed behavior and making the existing workflow assertion internally consistent.

Commit: `c41686d8cedaa38806513f3d0488216b83d35ecf`.

No synthetic transaction/context, evaluator verdict, or normative protocol semantics were added.

**Status:** P2.8 FAIL-CLOSED CI CONTRACT ALIGNED / TYPED LEDGER EVALUATION STILL OPEN / NO GREEN CLAIM.

## 2026-09-24 — Cardano Ledger Audit workflow filter normalized

The active `cardano-ledger-audit.yml` contained the workflow file itself twice in `push.paths`. The duplicate was removed; the runner path, Plutus-artifact path, and workflow self-trigger remain covered.

Commit: `4c6c40aaabfc75224df9a25fe246826d9d7dc130`.

No ledger or economic semantics changed.

**Status:** CARDANO AUDIT WORKFLOW PATH FILTER CLEAN / RUN EVIDENCE STILL REQUIRED.


## 2026-09-24 — GOV-28 canonicalization-reference provenance re-triangulated

Fresh exact-branch inspection compared `GovernanceDecisionWitness.hs`, `GovernanceCanonicalizationWitness.hs`, `GovernanceEventSchema.hs`, `GovernanceCanonicalReplay.hs`, `GovernanceCommitment.hs`, and `GovernanceCanonicalizationTest.hs`.

Finding: `DecisionRecord.decisionCanonicalizationReference` is required to be non-empty, and `CanonicalizationRecord.canonicalizationDecisionRecordReference` is also required to be non-empty, but the replay layer does not currently prove that the two references identify the same finalized decision record. The existing SHA-256 commitment mechanism authenticates whole canonical events; it does not define a canonical serialization/identity for `CanonicalizationRecord` itself, and canonical replay currently receives only the immediate predecessor event.

Therefore the remaining GOV-28 gap is confirmed as an identity/provenance binding gap, not a missing generic hash primitive. No new reference format, serializer, digest convention, or governance rule should be invented merely to close it.

Status: **GOV-28 PROVENANCE/IDENTITY BINDING OPEN / LIFECYCLE HARDENING OTHERWISE IN PLACE / NO NORMATIVE CHANGE.**


## 2026-09-24 — Gate 41 PRE-native CBOR payload preservation hardened

Official Blockfrost API documentation confirms distinct transaction endpoints for transaction content, transaction redeemers, and serialized transaction CBOR. The `/txs/{hash}/cbor` response is an application/json object whose `cbor` field contains the serialized transaction payload. The Cardano Developer Portal independently confirms the current Blockfrost mainnet base endpoint as `https://cardano-mainnet.blockfrost.io/api/v0` and the current Koios mainnet endpoint as `https://api.koios.rest/api/v1`. citeturn217534search0turn718033search1turn966534search0

The Gate 41 Blockfrost acquisition helper now preserves both forms without interpretation: the exact provider response envelope (`tx-cbor.raw.json`) and the exact `cbor` payload as normalized hex (`tx.cbor.hex`) plus decoded bytes (`tx.cbor`). It also records a SHA-256 hash of the extracted byte payload and fail-closes if the envelope has no non-empty even-length hexadecimal `cbor` field. The transaction `/txs/{hash}` response hash is now checked against the requested target before the packet is accepted.

Commit: `a3dbdf0959259979e7063ab44b9d0ace290eea6f`.

This is acquisition/provenance hardening only. It does not interpret the historical PRE mint redeemer, seed, min-ADA, or 10 ADA residual.

**Status:** GATE 41 PRE-NATIVE PACKET STRUCTURE HARDENED / HISTORICAL MINT WITNESS STILL OPEN / NO NORMATIVE CHANGE.


## 2026-09-24 — RF8 admission-to-transition evidence binding integrated on green branch

A previously observed RF8 improvement existed only in a divergent snapshot. Fresh current-head reconciliation confirmed that `EconomicAdmissionWitness` and `CanonicalTransitionEvidence` are already compatible in the green branch. The additive bridge `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts` is now integrated on `work/immortal-green-closure`, together with a dedicated four-case regression suite covering matching action/pre-state/post-state and rejection of each mismatch. The Adapter Sale Conformance workflow executes this regression.

Commits: `34eff997d0b25f36bbe704b254f981e1a40bdeb0`, `5e92f84c5e90fedcf65c163c3c5527a61e3f8f34`, `d0962d126e1bc3a1ad0a7140f69b1e6c4c16727f`.

Boundary remains explicit: the bridge does not calculate or validate the underlying canonical fingerprints. RF8 semantic hash provenance therefore remains OPEN; this change only prevents an already-issued admission witness from being silently paired with different canonical action/pre/post identifiers in the evidence layer.

**Status:** RF8 STRUCTURAL WITNESS→TRANSITION BINDING **INTEGRATED + CI WIRED** / HASH PROVENANCE **OPEN** / NO NORMATIVE CHANGE.


## 2026-09-24 — RF10/RF11 evidence semantics corrected: observed Cardano hashes are not canonical V3 identity

Fresh inspection of the real Yaci Reveal trace found a semantic over-labeling in the evidence layer. The trace was hashing concrete UTxO/datums before and after the transaction, while CanonicalTransitionEvidence names those fields as canonical V3 state fingerprints. The trace does not currently observe all authoritative inputs required by the PRE-RICH to V3 projection (notably protected-capital and control observations), so those hashes cannot be promoted to canonical V3 state identity.

Safe correction:
- added Adapter/CARDANO/observation/CardanoObservedTransitionEvidence.ts;
- added dedicated regression coverage for observed action/pre-state/post-state/transaction binding;
- real Yaci trace now records observedCardanoTransitionEvidence and no longer calls its ledger-observation hashes canonical V3 fingerprints;
- Adapter Sale Conformance workflow executes the new observed-evidence regression.

This is a provenance/terminology correction only. No Economic Gate, V3 transition, validator, payout, ProtectedCapital or governance semantics changed.

Commits:
- 6984329f020fb1466d7860d377c028802c71b516
- 0ac2ea1aeaaa4c5b4d5856ed9acfeac5e156c1e8
- 70b8ae6a089609d0c532a200d65fc133c4feef5b
- de6bb3728da146c3ac9bd2d3a002ba21aa029e50
- 6c0ab4124ff149505630baf94764cf6c95e3d1c0

Status: RF10/RF11 OBSERVED-LEDGER EVIDENCE SEMANTIC BOUNDARY CORRECTED / CANONICAL V3 IDENTITY + RF8 PROVENANCE STILL OPEN / NO NORMATIVE CHANGE.


## 2026-09-24 — PRE-RICH action-refinement workflow path hygiene corrected

Fresh current-branch audit found one real YAML defect in `.github/workflows/pre-rich-action-refinement-conformance.yml`: the `push.paths` list contained the same RF8 test path twice, while four test paths had been concatenated into a single YAML string. The path list was normalized into distinct entries and the duplicate RF8 entry removed.

Commit: `41a5542c48c777b5f50e9bf8eff978f9f0234ded`.

This is CI trigger hygiene only. No test selection semantics were broadened beyond the files already intended by the workflow, and no economic/validator/governance rule changed.

**Status:** PRE-RICH ACTION-REFINEMENT WORKFLOW PATHS CLEAN / CONFORMANCE RESULT STILL DEPENDS ON FRESH RUN EVIDENCE.


## 2026-09-24 — Legacy Treasury policy module quarantined

Current-branch search found `src/treasuryPolicy.ts` still containing the historical percentage distribution constants and arithmetic, while no repository code-search result showed an active import of that module. The file is retained for migration/history compatibility, but now carries an explicit `@deprecated` boundary stating that it is not an authoritative V3 economic rule and must not be used by production economic flows.

Commit: `3990640a61ab11c9c7eff777a3948ee2ec4452ea`.

No legacy percentage rule was reactivated, changed, or promoted; Treasury distribution remains fail-closed pending authoritative V3 EconomicAdmission semantics.

**Status:** LEGACY TREASURY SURFACE EXPLICITLY QUARANTINED / NO NORMATIVE CHANGE.


## 2026-09-24 — RF8 economic action-class binding hardened at production submission boundary

Fresh current-head inspection found that the EconomicAdmissionWitness already carries the intended action class, but the adapter previously only required a non-empty value. That allowed a caller to present an admission for one economic action while the orchestrator submitted a different action-shaped transaction.

Safe correction:
- introduced the closed action vocabulary already used by the V3 transition layer: Issue / Reveal / Claim / Expire;
- EconomicAdmission can now optionally validate an expected action class;
- CardanoExecutionAdapter forwards that expected class to the admission check;
- production Mint path binds the admission to Issue;
- production Reveal / Claim / Expire paths bind the admission to their respective actions;
- added a negative adapter regression proving a mismatched action class is rejected before signing/submission.

This binds an existing declared field to the concrete orchestrator; it does not define a new fingerprint algorithm or change economic semantics.

Commits:
- c209ed6d7b8c5f2056919c45664c4d633c340f43
- 0d86c1454d66b3470347796393cf9593c7cc8d45
- e23081512874f354a9d91f77e9dd91b622726e51
- 7b45de2949306d28d17346a9a6d9a778b79c4a13
- a8c89bb5486be3eb8bb2da245e968cbfd9b2f10a
- 9ea69d1c02605dabcafc928f9821b8249557df74

Status: RF8 ORCHESTRATOR→ACTION-CLASS BINDING IMPLEMENTED / FINGERPRINT PROVENANCE + CANONICAL TRANSITION BINDING EVIDENCE STILL OPEN / NO NORMATIVE CHANGE.


## 2026-09-24 — PRE-RICH action-refinement workflow second hygiene pass

A second exact-list audit found six remaining duplicate entries inside the same `push.paths` list of `.github/workflows/pre-rich-action-refinement-conformance.yml`: `PreRichCertifiedTicket.ts`, `PreRichJackpotPolicy.ts`, `PreRichExpiryPolicy.ts`, `src/ticket3d.ts`, `src/gameFlow.ts`, and `src/txHelpers.ts`. They were distinct from the legitimate reuse of paths between `push` and `pull_request` sections.

The duplicate entries were removed without changing the workflow's intended test commands or economic semantics.

Commit: `53d938899c5dd55c5152ba0ca2117a5240f5ccbd`.

**Status:** PRE-RICH ACTION-REFINEMENT `push.paths` DEDUPLICATED / FRESH WORKFLOW EXECUTION STILL REQUIRED.


## 2026-09-24 — CI fixture reconciliation: Genesis Oracle precision precedence

Observed CI run 36037689673 on commit bfd76ad061cc20433d525d1fe66a38d952873f4d completed with one failure in the Genesis Treasury admission conformance step. The 73-test PRE-RICH refinement suite was fully green; the failure was a single stale assertion in GenesisTreasuryAdmission.test.ts: an observation with oraclePrecision = -1 was expected to classify as ORACLE_UNVERIFIED, but the current fail-closed validator correctly rejects non-canonical precision first as INVALID_ORACLE_PRECISION.

The fixture was corrected to assert INVALID_ORACLE_PRECISION. No validator or economic semantics were changed.

Failure evidence: workflow 36037689673, job 107761768239.
Fix commit: d1052f2e76902b7dabb164b86ebdaaadec90814a.

Status: CI FIXTURE RECONCILIATION APPLIED / FRESH HEAD RUN PENDING / NO NORMATIVE CHANGE.


## 2026-09-24 — P2.8 dependency failure isolated and source-pinned

P2.8-B.1 run 36037873961 reached the ledger-runner build but failed during Cabal dependency resolution: `cardano-data-1.3.0.0` required `cardano-strict-containers`, which was not resolvable from the runner's pinned project context. This was a build/dependency failure before any ledger evaluation, not a SAFE_STALL verdict and not an economic/validator failure.

Upstream CHaP currently lists `cardano-strict-containers-0.1.6.0` from cardano-base commit `58a3814c049324578a1cbc7f8ab9e0edae42249a`; the current runner was consuming cardano-ledger sources at the corresponding dependency generation but did not explicitly materialize this package. The runner project now pins that exact cardano-base subdirectory as a source-repository-package.

External cross-check: upstream Cardano ledger/plutus integration explicitly uses the ledger execution-unit evaluator (`evaluateTransactionExecutionUnitsWithLogs`), while the current runner still stops before evaluation. citeturn0search2

Fix commit: ac799928e6bc759476d276ad8638998061a5ab91.
Status: P2.8 BUILD BLOCKER ISOLATED / DEPENDENCY PIN APPLIED / FRESH CI REQUIRED / EVALUATION STILL OPEN.

## 2026-09-24 — Concurrent-agent triangulation handoff

A separate recent commit line was inspected because repository activity shows new B4/B6/RF8 work after the current coordinated branch snapshot. The line is **diverged** from `11e8bf4c19fb9f0d674c53dd71ff3b5dd5054a68`; it must not be treated as already integrated into this working branch.

Verified artifacts on the concurrent line:

- `Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.ts` — an evidence-layer check binds admission `actionClass`, pre-state hash and candidate post-state hash to a `CanonicalTransitionEvidence` record. It validates evidence first and does not compute economic truth.
- `docs/COORDINATION/RF8_WITNESS_TRANSITION_BINDING_DELTA_20260924.md` — RF8-A submission boundary is recorded as strong implementation/regression; RF8-B structural witness binding is implemented/regressed; semantic hash provenance remains open.
- `docs/COORDINATION/B4_RF5_PROTECTED_CAPITAL_EVIDENCE_DELTA_20260924.md` — B4/RF5 local projection/accounting is classified as substantial implementation + conformance, while adapter preservation, protected-component provenance, real-ledger preservation, and action-by-action correspondence remain open.
- `docs/COORDINATION/B6_PC05_UNIT_SCALE_DELTA_20260924.md` — explicit 100× B1 sub-unit ↔ V3 reference-unit normalization is required before any raw UniversalEconomicState equality claim. Unit-contract evidence remains open.
- `audit/caes-transition-lab/ComposedTransitionCertificate.ts` — experimental composition layer combines existing V3 transition validity, refinement exactness, semantic encoding validity and explicit liveness hypotheses; it explicitly does not replace canonical verification.

Additional concurrent test evidence includes `PRE-RICH/profile/PreRichCardanoObservationProjection.test.ts`, covering exact monetary normalization and rejection of non-representable 501-subunit input.

### Anti-regression disposition

Do **not** duplicate this work blindly and do **not** claim it is present on the coordinated branch. The immediate integration question is whether/when the concurrent line can be reconciled with `work/immortal-green-closure` without importing unrelated history.

For the coordinated branch, the next safe technical target remains:
1. verify current CI after the Genesis precision fixture fix;
2. inspect RF8 hash provenance rather than adding more witness fields;
3. preserve the explicit B6 unit-conversion witness requirement;
4. keep B4 closure classified as cross-layer OPEN until adapter/ledger evidence exists.

No normative economic change is authorized by this handoff.

## 2026-09-24 — Fresh HEAD CI observation after Genesis fixture reconciliation

Current branch HEAD is `86952a597af4b9092d4daf4f39fffadb956d85f9`.

Fresh push-triggered workflow inspection for this exact HEAD shows:
- **Cardano Adapter Sale Conformance**: completed / success (run `36040538840`);
- **Algorithmic Governability Adversarial Lab**: completed / success (run `36040539137`);
- **Kernel Invalid-Class Fail-Closed Audit**: pending (run `36040538984`);
- **P2.8-B.1 Cardano-ledger runner**: in progress (run `36040539155`).

The P2.8 job has completed checkout and is currently at **Install GHC and Cabal**; ledger bootstrap and evaluator invocation have not yet run. Therefore this is not a ledger-evaluation result and no P2.8 GREEN claim is made.

The successful Adapter Conformance run confirms the current RF8 submission-boundary/regression suite is passing on the exact current HEAD, but it does not close RF8 semantic fingerprint provenance, B4 cross-layer preservation, or B6 unit-contract evidence.

External ledger cross-check: the pinned upstream `evalTxExUnitsWithLogs` API takes typed protocol parameters, a top-level transaction, UTxO, epoch info and system start, and returns per-redeemer evaluation/failure information. This reinforces that the current P2.8 runner must materialize authentic typed context rather than substitute synthetic inputs. citeturn0search0

**Status:** CURRENT HEAD ADAPTER CI GREEN / P2.8 EVALUATION IN PROGRESS / B4-B6-RF8 SEMANTIC CLOSURE STILL OPEN / NO NORMATIVE CHANGE.


## 2026-09-24 — P2.8 evaluator implementation target re-triangulated

Fresh current-head inspection plus official Cardano Ledger API documentation confirms the remaining P2.8 work is specifically the typed evidence materialization boundary, not another dependency/bootstrap issue.

Current CI run 36040539155 on HEAD 86952a597af4b9092d4daf4f39fffadb956d85f9 remains in progress at GHC/Cabal installation; no evaluator result exists yet.

The runner currently stops safely after checking for tx.cbor, utxo.json, pparams.json, epoch-info.json, system-start.json and manifest.json, and deliberately emits LEDGER_TYPED_CONTEXT_NOT_MATERIALIZED when only the raw Yaci handoff is present.

Official Ledger API confirms evalTxExUnitsWithLogs requires typed PParams, top-level Tx, UTxO, EpochInfo (Either Text), and SystemStart; it returns per-redeemer success/failure together with execution units and logs. The supplied execution budget is ignored by the evaluator. See the official Ledger API cross-check recorded for this iteration.

Next implementation target:
1. Decode the exact Reveal transaction CBOR into the pinned Ledger-era Tx type.
2. Materialize the exact consumed UTxO entries into the pinned Ledger UTxO type.
3. Decode the exact protocol parameters into the pinned PParams type rather than mapping arbitrary JSON fields.
4. Construct authentic EpochInfo (Either Text) from recorded Yaci epoch/slot evidence.
5. Materialize the exact SystemStart used by the devnet.
6. Invoke evalTxExUnitsWithLogs.
7. Persist the complete typed evaluation report, including per-redeemer logs/failures/exunits, as evidence.
8. Keep any missing or ambiguous typed component fail-closed.

The Ledger API exposes native CBOR/JSON decoding and protocol-parameter serialization machinery, so the implementation should use Ledger-native decoders rather than inventing a parallel schema.

The raw Yaci packet contains reveal-tx.cbor and reveal-protocol-parameters.json, but the existing runner does not yet materialize all required typed context. The correct next step is a narrow decoding/materialization patch, not a synthetic fixture and not an economic change.

Status: P2.8 BUILD/BOOTSTRAP UNDER CI / TYPED LEDGER MATERIALIZATION IS NEXT BLOCKER / evalTxExUnitsWithLogs STILL OPEN / NO GREEN CLAIM / NO NORMATIVE CHANGE.

## 2026-09-24 — P2.8 dependency reconciliation: second missing ledger package

Run `36040539155` was inspected at job-log level. The runner successfully completed checkout of commit `86952a597af4b9092d4daf4f39fffadb956d85f9`, installed GHC 9.8.4 and Cabal 3.12.1.0, cloned the pinned `cardano-base`, `cardano-ledger` and `plutus` sources, then failed in Cabal dependency resolution before runner compilation/evaluation.

Exact failure:
- required package: `cardano-slotting`;
- requested by `cardano-ledger-alonzo-1.16.0.0`;
- failure class: dependency/toolchain resolution, not validator failure, not ledger evaluation, not SAFE_STALL.

The current CHaP package index identifies `cardano-slotting-0.2.1.0` as a `cardano-base` subdirectory at commit `a02ed49194501620f03b2f868aabd5a48ebde937`. A dedicated source-repository-package pin for that exact subdirectory was added to `audit/cardano-ledger-runner/cabal.project`.

Fix commit: `ce1159bb3c8d88b2b175f4f91f9b2b08335e209b`.

The runner therefore has not yet reached the typed evidence packet, ledger-context reconstruction or execution-unit evaluator. Do not classify the failure as a protocol/economic failure.

Status: P2.8 DEPENDENCY BLOCKER #2 IDENTIFIED + PINNED / FRESH RUN REQUIRED / LEDGER EVALUATION STILL OPEN.

## 2026-09-24 — B6/PC-05 test surface deduplicated and CI-wired

The active branch already contained the canonical B6 conformance test:
`PRE-RICH/profile/B6-PC05-monetary-scale.conformance.test.ts`.

A duplicate test file created during concurrent inspection was removed immediately after detecting the existing canonical surface. The existing test covers:
- exact 100× B1-subunit → V3-reference-unit normalization;
- rejection of non-representable `501` sub-units;
- preservation of normalized scale through canonical Reveal post-state derivation.

The PRE-RICH action-refinement workflow was updated to trigger on the existing B6 test/source and to execute the existing B6 conformance test. No second economic test surface was retained.

Commits:
- duplicate cleanup: `f58a119b53e51239114257ed04b95208c499e208`
- CI wiring: `8339af91e75518301b4f263f1f0a35fa5b9deaba`

Status: B6/PC-05 LOCAL SCALE CONFORMANCE **CI-WIRED / CROSS-BOUNDARY SEMANTIC EQUIVALENCE STILL OPEN**.

No normative economic change.

## 2026-09-24 — RF8 evidence fingerprint shape hardening

Current-head inspection confirmed that RF8 already binds EconomicAdmissionWitness action/pre-state/post-state identifiers to CanonicalTransitionEvidence, but the evidence layer previously accepted arbitrary non-empty strings for those fingerprints. This was a representational weakness: the admission boundary already requires 32-byte hex digests, while the persisted evidence packet did not enforce the same shape.

Implemented a narrow fail-closed hardening:
- Adapter/CARDANO/observation/CanonicalTransitionEvidence.ts now validates preStateFingerprint, postStateFingerprint, and actionFingerprint as 64-character hexadecimal digests;
- Adapter/CARDANO/observation/EconomicAdmissionTransitionBinding.test.ts adds a negative regression for malformed action-fingerprint encoding;
- no canonical serializer, hash preimage, or fingerprint computation was invented;
- this hardens evidence shape only and does not close semantic fingerprint provenance.

Commits:
- 60192842cd81d6cf39bd1e42e2d72ba20a20f18f
- b359cc5b03295d9bffe7c6b66b47e6432fa89081

Status: RF8 REPRESENTATIONAL HARDENING COMPLETE / SEMANTIC FINGERPRINT PROVENANCE OPEN.

## 2026-09-24 — Fresh CI observation after RF8 hardening

The branch advanced again during concurrent work; current observed HEAD is b359cc5b03295d9bffe7c6b66b47e6432fa89081.

Latest observed push runs on the preceding coordinated snapshot show:
- Cardano Adapter Sale Conformance: success;
- Algorithmic Governability Adversarial Lab: success;
- P2.8-B.1 Cardano-ledger runner: still in progress at Install GHC and Cabal;
- Kernel Invalid-Class audit: pending on the newest push.

P2.8 has therefore not yet reached typed-context reconstruction or evalTxExUnitsWithLogs. Official Cardano Ledger API documentation continues to expose evalTxExUnitsWithLogs as the ledger-aligned evaluator requiring transaction/UTxO/protocol-parameter/epoch/system-start context. citeturn0search0

No GREEN claim and no normative economic change.


## 2026-09-24 — P2.8 dependency blocker #2 reproduced and source pin consolidated

Fresh inspection of P2.8 run `36040539155` shows the previous bootstrap reached Cabal dependency resolution but failed before runner compilation:
`unknown package: cardano-slotting` required by `cardano-ledger-alonzo-1.16.0.0`.

The active `audit/cardano-ledger-runner/cabal.project` had two separate `source-repository-package` blocks for the same `cardano-base` repository at different commits. This was consolidated into one exact source pin at `a02ed49194501620f03b2f868aabd5a48ebde937`, exposing both:
- `cardano-strict-containers`
- `cardano-slotting`

The pinned `cardano-slotting` package is version `0.2.1.0`, and the pinned `cardano-strict-containers` package remains available from the same source snapshot. The Alonzo package accepts `cardano-slotting` without a tighter version constraint.

Fix commit on the active branch: `2e21fbc634ce62ea562e56a873d01d704944fb64`.

This is still dependency/bootstrap work only. P2.8 has NOT yet reached typed transaction/UTxO/PParams/EpochInfo/SystemStart materialization or `evalTxExUnitsWithLogs`. No protocol/economic semantics were changed.

Status: P2.8 DEPENDENCY BLOCKER #2 FIX COMMITTED / FRESH CI RUN REQUIRED / TYPED LEDGER EVALUATION STILL OPEN / NO GREEN CLAIM.


## 2026-09-24 — P2.8 dependency blocker #3 triage

Fresh run `36041228970` reproduced the previous fix and advanced one dependency level: `cardano-slotting` is now resolved from the consolidated `cardano-base` pin, but Cabal next reports `unknown package: cardano-ledger-shelley`, required by `cardano-ledger-alonzo-1.16.0.0`.

Triangulation against the exact pinned `cardano-ledger` commit confirms Alonzo depends on the Shelley, Allegra and Mary era packages, while Shelley in turn depends on the Byron ledger/crypto layer. The runner source package list therefore needs the relevant released era packages materialized from the same exact ledger commit rather than relying on the CHaP package index to discover them.

Applied narrow source-package extension in `audit/cardano-ledger-runner/cabal.project`:
- `eras/byron/crypto`
- `eras/byron/ledger/impl`
- `eras/shelley/impl`
- `eras/allegra/impl`
- `eras/mary/impl`
- existing Alonzo/API/Core/Binary/Data/etc. pins remain unchanged.

Fix commit: `9708619c8d9dc1f85a61e507358968e4d6cf6165`.

No evaluator or economic code was changed. P2.8 remains dependency-resolution work; typed ledger context and `evalTxExUnitsWithLogs` are still unreached. No GREEN claim.

## 2026-09-24 — RF8 fingerprint provenance re-audit: existing SHA-256 is not canonical V3 identity

A direct current-branch inspection re-audited the remaining RF8 semantic fingerprint gap. The branch contains a deterministic SHA-256 commitment implementation in `poc/materios-checkpoint/src/checkpoint.ts`, but its preimage is explicitly limited to the GRANDPA authority list (count + public keys + weights) and it produces a Materios PoC authority commitment. It is therefore not a canonical serializer/hash for V3 economic state, economic action, or candidate post-state.

The active RF8 evidence layer (`CanonicalTransitionEvidence.ts`) only validates the 64-hex digest shape, while `EconomicAdmissionTransitionBinding.ts` compares those identifiers without computing them. No authoritative current-branch function was found that defines the V3 state/action/post-state hash preimages required by RF8.

Disposition:
- do **not** reuse the Materios authority commitment for RF8;
- do **not** invent a JSON/CBOR canonicalization or hash preimage;
- keep RF8 semantic fingerprint provenance OPEN until the normative V3 identity/serialization source is identified or explicitly specified by an authorized decision.

This closes a false-positive avenue in the provenance audit without changing economic, governance, validator, or adapter semantics.

Status: RF8 SEMANTIC FINGERPRINT PROVENANCE **CONFIRMED OPEN / EXISTING SHA-256 HELPER REJECTED AS IRRELEVANT PREIMAGE / NO NORMATIVE CHANGE**.

## 2026-09-24 — P2.8 typed-transaction decoding boundary

Triangulation against the pinned `cardano-ledger` source confirmed that the real Reveal trace uses inline datums, which are a Babbage-era feature. The dedicated runner previously depended only on the Alonzo package, so its typed transaction target was too narrow for the actual Reveal artifact.

Evidence:
- Cardano Developer Portal identifies Babbage as the era introducing inline datums/reference inputs; the current Reveal trace stores continuing outputs with inline datums. citeturn233642search0turn233642search1
- pinned upstream `cardano-ledger` tag `f649f975...` defines `cardano-ledger-babbage` version `1.14.0.0` and explicitly describes the package as introducing inline datums.
- the same pinned Ledger API exports `evalTxExUnitsWithLogs`, while Babbage `Tx` is decoded through `DecCBOR (Annotator (Tx ... BabbageEra))`, not a direct `DecCBOR Tx` instance.

Implementation:
- `audit/cardano-ledger-runner/cabal.project` now pins `eras/babbage/impl` from the same ledger commit.
- `audit/cardano-ledger-runner/cardano-ledger-runner.cabal` now depends on `cardano-ledger-babbage == 1.14.0.0` and `cardano-ledger-binary == 1.9.0.0`.
- new `audit/cardano-ledger-runner/TypedPacketDecode.hs` decodes `PParams BabbageEra` using the native `FromJSON` instance and decodes `Tx TopTx BabbageEra` through native `decodeFullAnnotator`, using the protocol-version major from the decoded PParams.
- `Main.hs` invokes this native typed decode only after all required packet files are present; malformed PParams or transaction CBOR fail closed with explicit reasons.

Important limitation:
this is only the typed PParams/transaction stage. The runner still does not synthesize or bypass exact `UTxO`, `EpochInfo`, or `SystemStart`, and it still does not invoke `evalTxExUnitsWithLogs` until those authentic components are materialized.

Commit: `e524ebc83a027c2914a22588007337adeca5ca16`.

Status: P2.8 BABBAGE-TX / PPARAMS NATIVE-DECODE STAGE IMPLEMENTED / COMPILE-CI VERIFICATION PENDING / UTxO + EPOCHINFO + SYSTEMSTART + EVALUATION STILL OPEN.

No normative economic change.
## 2026-09-24 — Yaci timing provenance preserved for P2.8

The real Cardano lab now persists the raw output of `yaci-devkit info` as `audit/yaci-evidence/yaci-devkit-info.txt` before the economic traces execute.

The Yaci DevKit cluster-info surface exposes `Start Time`, `Slot Length` and `Epoch Length`; these are the concrete source fields needed later to construct authentic `SystemStart` and epoch/slot mapping rather than inventing timing parameters. citeturn717417search3

Only evidence capture was added. The runner still must decode and validate these values against the ledger-required `SystemStart` and `EpochInfo`; raw CLI text is not itself a typed ledger object.

Commit: `f015320132831e372386a90a8f18df9f966c7d1d`.

Status: P2.8 TIMING PROVENANCE CAPTURE STRENGTHENED / TYPED SYSTEMSTART + EPOCHINFO MATERIALIZATION STILL OPEN / NO NORMATIVE CHANGE.

## 2026-09-24 — P2.8 raw-evidence continuity + RF8 lab-hash classification
Fresh current-branch inspection of `audit/cardano-integration/reveal-ledger-trace.ts` shows the real Yaci Reveal lab already persists two critical raw components: the signed Reveal CBOR and the provider-returned protocol-parameters JSON; its `reveal-transition.json` also embeds the exact Yaci `/txs/{hash}/utxos` response. Therefore the P2.8 blocker is **not absence of raw transaction/UTxO evidence**. The missing layer is conversion of that raw evidence into the exact ledger-native `UTxO BabbageEra`, `EpochInfo`, and `SystemStart` objects required before `evalTxExUnitsWithLogs`. Official Ledger sources confirm that validity/time translation depends on `EpochInfo` + `SystemStart`, and script context lookup depends on typed `UTxO`. citeturn1search1turn1search2turn1search3

The same Reveal lab computes `preStateFingerprint`, `postStateFingerprint`, and `actionFingerprint` with a local `hashJson(JSON.stringify(...))` helper. This is useful **observation evidence for RF10/RF11**, but it is not adopted as RF8 canonical identity because the repository has not established a normative canonical serialization/preimage for V3 economic state/action/post-state. No production semantic is changed.

Status: P2.8 RAW EVIDENCE CONTINUITY CONFIRMED / LEDGER-NATIVE TYPED CONTEXT MATERIALIZATION OPEN / RF8 LAB HASH CLASSIFIED OBSERVATION-ONLY / NO NORMATIVE CHANGE.

## 2026-09-24 — P2.8 native typed-packet step

After resolving the second dependency blocker (`cardano-slotting`), the runner was advanced without synthesizing missing ledger context.

- Added Babbage-era ledger dependency and native `cardano-ledger-binary` decoding surface.
- Added `TypedPacketDecode.hs` to decode the supplied `pparams.json` as `PParams BabbageEra` and the supplied `tx.cbor` as `Tx TopTx BabbageEra`, using the protocol version carried by PParams and the upstream `decodeFullAnnotator`/`DecCBOR` path.
- `Main.hs` remains fail-closed: the native decode path is reached only after the complete typed evidence packet exists; raw Yaci handoff still produces `SAFE_STALL`.
- If native PParams/Tx decoding succeeds, the runner reports `TYPED_BABBAGE_TX_PPARAMS_DECODED` and explicitly requires exact UTxO, EpochInfo and SystemStart materialization before `evalTxExUnitsWithLogs`.

Current status: P2.8 TYPED TX/PPARAMS DECODE PATH IMPLEMENTED / BUILD + REAL PACKET DECODE PENDING / UTxO + EpochInfo + SystemStart + EXECUTION EVALUATION OPEN.

No economic or validator semantics changed. No synthetic ledger context introduced.

## 2026-09-24 — P2.8 current-HEAD CI boundary recheck
Current branch head rechecked: `d861329e4ff85ed8255176717de9d54f93ad871f`. The dedicated P2.8 workflow is present on `work/immortal-green-closure`, but no workflow run is currently associated with this HEAD, so there is **no fresh CI compile/evaluator verdict** to promote. The runner source remains fail-closed and reaches only native Babbage Tx/PParams decoding when the complete typed evidence packet exists. The next legitimate advance is a fresh workflow execution followed by inspection of the actual build/evidence output; an absent run is not treated as failure or success.

This recheck also confirms that the repository already preserves the raw Yaci timing provenance and Reveal evidence required to attempt typed-context materialization. No synthetic ledger context will be introduced merely to make CI green.

Status: P2.8 CURRENT HEAD VERIFIED / WORKFLOW PRESENT / FRESH CI RUN ABSENT / NO GREEN CLAIM / NO NORMATIVE CHANGE.


## 2026-09-24 — P2.8 raw Yaci context materialization stage added

The next concrete P2.8 bridge is now committed on `work/immortal-green-closure`:

- new `audit/cardano-integration/materialize-p28-ledger-context.mjs`;
- it consumes only the real lab evidence already produced by the Yaci Reveal trace:
  - `reveal-tx.cbor`;
  - `reveal-protocol-parameters.json`;
  - `reveal-transition.json`;
  - `epoch-latest.json`;
  - `yaci-devkit-info.txt`;
- it re-fetches `GET /txs/{transactionRef}/utxos` directly from the running Yaci Store for the exact observed Reveal transaction;
- it writes byte-preserving `tx.cbor` and `pparams.json`, plus provenance-preserving `utxo.json`, `epoch-info.json`, `system-start.json`;
- it writes `manifest.json` with SHA-256 hashes and explicit materialization status;
- it does **not** fabricate a UTxO, cost model, epoch mapping, or system start.

The CI lab now runs this materialization step immediately before the P2.8 runner.

Important boundary:
the generated `utxo.json`, `epoch-info.json`, and `system-start.json` are still **raw Yaci evidence containers**, not typed `UTxO BabbageEra`, `EpochInfo (Either Text)`, or `SystemStart`. The runner therefore remains correctly fail-closed until the Haskell side reconstructs those exact ledger-native objects.

Relevant commits:
- `92d0edc4873c4ea4699818baaf7da2446440d3ae` — initial materialization script;
- `db6f2bfd6ade4b9e758087a87877f9ef895a2140` — robust Yaci timing parsing;
- `4c8a4e6b4d025f7fc18dc86ebecc00497e5d9f67` — CI integration.

Status: P2.8 RAW YACI CONTEXT MATERIALIZATION **IMPLEMENTED** / TYPED UTxO + EpochInfo + SystemStart **OPEN** / evalTxExUnitsWithLogs **OPEN** / NO GREEN CLAIM / NO NORMATIVE CHANGE.

## 2026-09-24 — P2.8 fail-closed correction: raw packet is not typed context
Inspection of `audit/cardano-integration/materialize-p28-ledger-context.mjs` exposed an important boundary: the materializer deliberately writes `utxo.json`, `epoch-info.json`, and `system-start.json` as **raw Yaci provenance**, and its manifest explicitly sets `typed_context_ready: false`. The ledger runner previously checked only file presence/non-emptiness and could therefore proceed to native Tx/PParams decoding while the surrounding packet was still raw-only.

Correction committed in `audit/cardano-ledger-runner/Main.hs`: when the manifest explicitly records `typed_context_ready: false`, the runner now stops with `LEDGER_TYPED_CONTEXT_NOT_READY` and refuses to imply that the complete ledger context exists. This is a fail-closed evidence correction, not a synthetic conversion and not an economic change.

Commit: `c6ac959190180c115dd947b6d42b2aa1d8d788a9`.

Status: P2.8 RAW MATERIALIZATION = GREEN AS RAW PROVENANCE / TYPED LEDGER CONTEXT = OPEN / EVALUATOR = NOT YET INVOKED / NO NORMATIVE CHANGE.


## 2026-09-24 — P2.8 raw packet identity hardening and explicit typed boundary

The Yaci materializer now fails before packet publication if the Reveal transaction reference is malformed, consumed references are missing/duplicated, the exact consumed input set disagrees with Yaci Store `GET /txs/{hash}/utxos`, or the three required Yaci timing fields cannot be extracted. These are evidence integrity checks, not ledger evaluation.

The Haskell runner now reads `manifest.json` explicitly: `raw-yaci-context-materialized` allows attempting the existing native Babbage Tx/PParams decode, but it **never** authorizes `evalTxExUnitsWithLogs`; even a successful decode ends with `SAFE_STALL: RAW_YACI_CONTEXT_NOT_LEDGER_TYPED`. Other manifest statuses also fail closed until native typed-context verification is implemented.

Commits: `e07658852f4964c917ff018dcd17fec545e564d5` (Yaci identity/timing checks), `5871855e04dece1fc7bd38912918ef15be62fecb` (manifest boundary), `c24bf2e7d2fec7cb0462c3f2918080af610deb0f` (preserve native decode path).

Still OPEN: verified full pre-state UTxO including reference inputs, typed `EpochInfo` and `SystemStart`, exact protocol-parameter provenance at transaction evaluation point, ledger evaluation and persisted ExUnits/script failures. Fresh CI execution is required before claiming that the hardening passes on a real Yaci packet.


## 2026-09-24 — MATERIOS ALL-FRONT PASS

**Directive:** all active work is temporarily concentrated on Materios / GRANDPA / authority-selection provenance. Unrelated fronts pause unless they unblock Materios evidence.

### Current snapshot
- Branch: `work/immortal-green-closure`.
- Snapshot observed before this coordination write: `6530a80c08cc2fb7c58db5ff56ee499699b7545d`.
- Materios PoC currently contains dedicated authority transition, authority, GRANDPA, ancestry, header, crypto, SCALE, quorum and verifier modules.

### Triangulated findings
1. **Authority selection remains upstream-authoritative.** IMMORTAL must verify and bind the upstream selection/finality result; it must not replace the selector with a TypeScript reimplementation merely to make a proof executable.
2. **GRANDPA trust boundary is materially advanced.** Historical repo work includes PoC-1 discovery/specification and later proof-boundary hardening/finalization. Current code separates parsing, ancestry, authority, crypto, quorum and transition verification.
3. **PoC-0 commitment classification is fixed:** `poc/materios-checkpoint/src/checkpoint.ts` commits only the GRANDPA authority list (count + public keys + weights). It is **not** a V3 economic state/action/post-state commitment and must not be promoted to RF8 identity.
4. **M6 composition is the principal open integration point:** compose upstream authority selection + GRANDPA finality + transition proof without duplicating the selector. Composition must bind chain/genesis identity, source authority set, selection inputs/epoch, selected authorities, finality target, activation block and proof references.
5. **External-source triangulation** confirms the public Materios architecture uses Cardano anchoring/governance, stake-weighted committee selection via the Partner Chains/Ariadne path, and GRANDPA finality. Public material is corroboration, not permission to infer or replace upstream selector semantics.

### All-agent workstreams
- **A — Selector provenance:** identify exact upstream implementation/API/spec for `genesis_utxo + AuthoritySelectionInputs + sidechain_epoch`; capture exact input/output types and version.
- **B — GRANDPA finality:** verify SCALE decoding, signing payload, authority-set binding, target block/ancestry, set-id and >2/3 weight against upstream code/test vectors.
- **C — Transition proof:** audit every identity-bearing field in `AuthoritySetTransitionStatement`; mutation-test each field and proof reference.
- **D — M6 composition:** compose only proven A/B/C artifacts; no new selector logic, synthetic proof bytes or invented hash preimages.
- **E — Real-node evidence:** acquire reproducible finalized head, GRANDPA justification, authority set/set-id and selected committee/epoch transition; distinguish extraction from cryptographic verification.
- **F — Version drift:** reconcile current Materios runtime/spec/toolkit provenance before treating historical vectors as current evidence.
- **G — Adversarial matrix:** retain/add negatives for genesis, authority set, epoch, selection-input, set-id, target block, proof-kind, insufficient weight, duplicate/invalid authority and activation-state mutations.
- **H — Documentation:** update Notion/coordination only with evidence-backed status; keep OPEN / VERIFIED / REAL-LEDGER evidence separate.

### Closure rule
Materios is not GREEN from local tests alone. Closure requires upstream selector provenance + cryptographic GRANDPA verification + transition tuple binding + M6 composition + reproducible real-node evidence, with no selector reimplementation in IMMORTAL.


## 2026-09-24 — MATERIOS M6 COMPOSITION BOUNDARY ADDED

Fresh branch re-audit found the Materios trust boundary already separates untrusted transition evidence from branded verified authority state, and GRANDPA finality verification already binds chain/genesis/target/signatures/quorum/ancestry. The remaining integration hole was M6 composition: there was no dedicated fail-closed boundary composing independently verified transition + finality artifacts.

Added:
- `poc/materios-grandpa/src/m6-composition.ts` — composition statement + external composition-proof verifier + branded verified M6 certificate.
- `poc/materios-grandpa/test/m6-composition.test.ts` — chain/genesis/source-set mismatch negatives, proof rejection, successful branded certificate, and explicit non-reimplementation guard.

Important semantics: M6 **does not** derive `toAuthorities`, does not invent a selector, and does not infer that the finality target is the activation block. It only binds shared identity and `fromSetId == finality.setId`; the protocol-specific relationship remains an explicit external proof obligation.

Primary-source triangulation also reinforces the architectural boundary: GRANDPA verification relies on the relevant authority set and finality justification, while authority-set handoffs are a separate concern; bridge designs re-verify finality evidence rather than trusting a relayer. citeturn0search2turn0search6

Commits: `0981a1059d676b1a83f402980f6e235d40560214`, `0454b8a7178217a5ff14cf62ff7e07469d429e00`.

Status: **M6 structural boundary advanced; cryptographic composition proof and real Materios node evidence remain OPEN.**


## 2026-09-24 — MATERIOS SELECTOR PROVENANCE DEEPENED

A fresh external triangulation against the upstream Input Output HK Partner Chains sources tightened the selector boundary without reimplementing it in IMMORTAL.

Evidence established:
- The Partner Chains documentation identifies Ariadne as the committee-selection algorithm and states that it reads committee candidates and parameters from Cardano, selecting a new committee for each epoch.
- The same source explicitly identifies the D-parameter and permissioned-candidate / registered-SPO inputs as selector inputs, and ties the Partner Chain identity to the immutable genesisUtxo.
- The upstream release history records an Ariadne v2 selection path with guaranteed seats and candidate weights, confirming that selector semantics can evolve by toolkit version. Therefore historical selector behavior must not be treated as current merely because the POC compiles.
- The public Partner Chains repository is now archived and states that development moved into Midnight; current-version provenance therefore needs to be pinned to the actual Materios/Partner-Chains runtime used by the target network rather than inferred from the archived documentation alone.

Primary sources: Input Output HK Partner Chains documentation/repository and release notes.

Implication for IMMORTAL:
- Keep selectionInputs opaque at the proof boundary.
- Require the external proof to authenticate that the supplied toAuthorities are the canonical selector output for the authenticated Cardano/Partner-Chain inputs and epoch.
- Do not encode Ariadne/Ariadne-v2 selection mathematics in TypeScript.
- Add version binding to the evidence/proof contract only when the upstream runtime/proof format supplies an authoritative version identifier; do not invent one locally.

New concrete gap: exact current selector implementation + proof/verifier artifact + version for the Materios deployment remain OPEN. The external documentation proves the architectural provenance, not the cryptographic proof of a specific committee transition.

Status: SELECTOR ARCHITECTURAL PROVENANCE VERIFIED; DEPLOYMENT-SPECIFIC CRYPTOGRAPHIC PROVENANCE OPEN.

## 2026-09-24 — MATERIOS M6 ADVERSARIAL REVIEW

Review of the new M6 boundary confirms that its local bindings are intentionally narrow: chain ID, genesis hash and source set ID are checked before composition. The M6 verifier receives both the verified transition and verified finality artifacts, so the external proof remains responsible for binding selection inputs/epoch, selected authorities, activation block and finality target.

No selector semantics or local proof preimage were added. This is deliberate: adding a local hash of opaque selector inputs would create a second, potentially divergent protocol encoding.

Required next evidence remains:
1. exact upstream selector source/version;
2. actual composition/transition proof verifier;
3. real finalized Materios/Partner-Chain node evidence containing the authority-set transition and GRANDPA justification;
4. mutation evidence showing the external proof rejects mismatched epoch/inputs/to-authorities/activation block.

Status: M6 STRUCTURAL BOUNDARY = IMPLEMENTED; CRYPTOGRAPHIC/REAL-NODE CLOSURE = OPEN.


## 2026-09-24 — MATERIOS M6 PROOF-BOUNDARY INPUT HARDENING

Current branch head after the latest M6 test hardening: `ef4b0b481879834adf0fb1bc427518cf379d5e3f`.

Added adversarial M6 coverage to ensure the external composition verifier receives the complete verified transition/finality artifacts rather than a reduced local surrogate. The test explicitly observes `sidechainEpoch`, `toSetId`, activation-block metadata and finality target metadata, and demonstrates that a mutated epoch is rejected only by the external proof boundary.

This preserves the architectural rule: IMMORTAL does not implement Ariadne/authority-selection mathematics and does not invent a second proof preimage. The local M6 layer binds chain/genesis/source-set identity; the external proof remains responsible for authenticating the protocol-specific relationship between Cardano-derived selector inputs, selected committee, activation state and GRANDPA finality.

External triangulation strengthened the provenance picture:
- Partner Chains docs state that Ariadne reads committee candidates and parameters from Cardano and selects a new committee for each epoch; `genesisUtxo` is the immutable Partner Chain identifier and the Session Committee Management pallet consumes Cardano-derived selection inputs.
- Partner Chains release v1.8.0 records an `ariadne_v2` path with guaranteed seats and candidate weights and updates the Polkadot SDK dependency. Therefore historical selector behavior cannot be promoted to current deployment semantics without version binding.
- The Partner Chains repository is archived and directs continued development to Midnight; deployment-specific current selector/proof provenance therefore remains OPEN.

Primary-source references: Partner Chains introduction, archived repository notice, and release v1.8.0. citeturn1search0turn1search1turn1search2

Status:
- M6 structural boundary: IMPLEMENTED
- M6 adversarial input handoff: HARDENED
- Selector architectural provenance: VERIFIED
- Exact deployment/version + cryptographic selector/transition proof: OPEN
- Cryptographic M6 composition proof: OPEN
- Real finalized Materios node evidence: OPEN
- No selector reimplementation / no synthetic proof bytes / no normative economic change.


## 2026-09-25 — MATERIOS SELECTION / ENACTMENT / FINALITY SEPARATION

Upstream `pallet-session-validator-management` confirms that the authority transition has three distinct runtime stages:

```
select_authorities(...)
    -> Call::set
    -> NextCommittee persisted
    -> session rotation
    -> CurrentCommittee
    -> GRANDPA/session authority context
```

The `set` inherent carries `for_epoch_number` and `selection_inputs_hash`; when selection returns `None`, the pallet can retain the current committee. Therefore an observed committee, an enacted committee and the GRANDPA SetId used for finality are not interchangeable evidence.

B3/M6 must therefore prove the complete relation:
`selection regime + selection context -> selected committee -> enacted committee -> effective authority SetId -> finalized target`.

Local IMMORTAL code only binds the typed transition statement and remains deliberately unable to infer this relationship from local hashes or from committee bytes alone.

Status: **SELECTION / ENACTMENT / FINALITY DISTINCTION VERIFIED AT SOURCE LEVEL; CRYPTOGRAPHIC COMPOSITION + LIVE-NODE EVIDENCE OPEN.**

## 2026-09-25 — MATERIOS RECEIPT PROVENANCE VS AUTHORITY-SELECTION BOUNDARY

A direct source audit of the upstream Materios `orinq-receipts` runtime adds an important B3 constraint that the new Receipt Explorer lineage does not resolve.

The upstream runtime contains an explicit **L1-independent emergency pinned committee** mechanism:
- `PinnedCommittee` is committed runtime storage;
- while `sidechain_epoch <= until_epoch`, `select_authorities` returns the pinned committee verbatim;
- this bypasses the normal Ariadne/Cardano-driven selection and liveness filters;
- the pin is set by a Root-only dispatchable and emits `PinnedCommitteeSet`;
- expiry returns selection to the L1-driven path;
- the source documents operational coupling with `Grandpa::note_stalled` for the SetId handoff.

Therefore the B3 proof obligation is not merely “prove the receipt lineage”. A production verifier must establish **which authority-selection regime produced the authority set for the exact transition**:
1. normal L1/Ariadne-driven selection, with exact selector inputs and runtime provenance; or
2. the explicit pinned-committee regime, with authenticated committed-storage state, expiry bound, event/transition evidence and the corresponding GRANDPA SetId/finality relationship.

The Receipt Explorer provenance chain strengthens receipt/certificate/checkpoint/Merkle/Cardano-anchor evidence, but it does not by itself prove this authority-regime distinction.

### B3 consequence

**New OPEN item:** authority-regime provenance.

Closure requires the verified transition proof to bind the exact selection regime, not merely the resulting authority set. A verifier must reject an evidence packet that silently treats a pinned committee as an Ariadne output, or vice versa.

No selector mathematics is added to IMMORTAL. No economic semantics change.

## 2026-09-24 — MATERIOS VERSION-DRIFT / SELECTOR RUNTIME PROVENANCE

A deeper triangulation of the public Materios source repository closes an important part of the previously open selector-version question, while exposing a concrete **runtime/tooling version split** that must not be silently collapsed.

### Source-level fact: the Materios runtime source currently compiles Ariadne from IOG Partner Chains v1.5.1

The current public `Flux-Point-Studios/materios` `partnerchain/Cargo.toml` pins the IOG Partner Chains crates — including:

- `authority-selection-inherents`;
- `pallet-session-validator-management`;
- `sp-session-validator-management`;
- `sidechain-domain`;
- `session-manager`;

to upstream tag **`v1.5.1`**.

The repository also vendors `authority-selection-inherents` as version **1.5.1**, explicitly describing it as a fork of IOG v1.5.1 with Materios patches.

The vendored `select_authorities.rs` is therefore currently the strongest source-level selector provenance we have for the Materios runtime source. It shows the canonical flow remains:

`genesis_utxo + AuthoritySelectionInputs + sidechain_epoch -> candidate filtering -> weighted selection -> committee`.

The local fork adds Materios-specific post-selection behavior (including duplicate collapse / safety floor and an early-launch timing change elsewhere in the fork). Those patches are **not** Ariadne reimplementation in IMMORTAL; they are part of the Materios runtime implementation and must be treated as deployment-specific semantics.

### Critical distinction: CLI/tooling v1.8.0 != source-level runtime dependency v1.5.1

Materios public operator documentation says the **`partner-chains-node` CLI binary is v1.8.0** and describes the current v6 network as using that binary.

This does **not** prove that the on-chain runtime's selector implementation is v1.8.0.

Current source evidence says the runtime workspace is built against the v1.5.1 IOG crates and a vendored v1.5.1 authority-selection fork. Therefore:

- **CLI / operator tooling:** documented as v1.8.0;
- **Materios runtime source dependency for Ariadne:** v1.5.1 + Materios fork patches;
- **live deployed runtime spec:** not yet cryptographically pinned from a direct RPC/runtime-version observation in this audit;
- **exact live WASM/source commit correspondence:** OPEN.

This distinction is now a mandatory M6 provenance constraint. We must not use the v1.8.0 `ariadne_v2` release semantics as if they were the semantics of the currently compiled Materios runtime without a direct deployment/source correspondence.

### Current runtime source snapshot

The public Materios runtime source currently declares `spec_version = 238` in `partnerchain/runtime/src/lib.rs`.

This is **repository-source evidence**, not yet direct live-node evidence. Public Materios documentation only states that v6 has live runtime upgrades and advises querying `state_getRuntimeVersion`; therefore the live spec/version must still be captured from the canonical node and bound to the deployed WASM artifact.

### New M6 provenance matrix

| Artifact / claim | Evidence | Status |
|---|---|---|
| Ariadne architectural role | IOG Partner Chains docs | VERIFIED |
| Materios selector source dependency | Materios `Cargo.toml` | **VERIFIED: v1.5.1** |
| Selector implementation | vendored `authority-selection-inherents/src/select_authorities.rs` | **VERIFIED: v1.5.1 + Materios patches** |
| CLI / operator toolkit | Materios docs | **VERIFIED: v1.8.0 documented** |
| Ariadne v2 semantics | IOG v1.8.0 release | VERIFIED as upstream v1.8.0 behavior, **NOT attributed to Materios runtime** |
| Materios source runtime spec | `runtime/src/lib.rs` | **VERIFIED IN SOURCE: spec 238** |
| Live deployed runtime spec | direct canonical RPC | **OPEN** |
| Live WASM ↔ source commit | reproducible artifact hash/build correspondence | **OPEN** |
| Cryptographic selector/transition proof artifact | deployment evidence | **OPEN** |
| Cryptographic M6 composition proof | external proof verifier | **OPEN** |
| Real finalized-node evidence | finalized header + GRANDPA justification + transition | **OPEN** |

### Action

Do **not** migrate IMMORTAL's selector assumptions to Ariadne v2 merely because v1.8.0 exists.

The next concrete M6 step is to obtain, from the canonical Materios deployment:

1. `state_getRuntimeVersion` at a finalized block;
2. the exact deployed runtime/WASM identity or reproducible runtime artifact;
3. the corresponding Materios source commit/tag;
4. the exact selector proof/transition artifact, if one exists;
5. a real finalized authority-set transition carrying epoch, `toSetId`, activation block and GRANDPA target.

Only after that correspondence is established can the deployment-specific selector version be promoted from **source-provenance** to **live-runtime-provenance**.

No selector mathematics has been added to IMMORTAL. No economic semantics changed.

Status: **SELECTOR SOURCE VERSION IDENTIFIED (v1.5.1 + MATERIOS PATCHES) / CLI VERSION SEPARATED (v1.8.0) / LIVE RUNTIME + CRYPTOGRAPHIC PROVENANCE STILL OPEN.**


## 2026-09-24 — MATERIOS SELECTOR SOURCE CONFIRMATION: DIRECT RUNTIME CALL + VENDOR LOCK

A further source audit removes an ambiguity from the previous provenance note.

The Materios runtime does not merely depend on the selector crate indirectly: `partnerchain/runtime/src/lib.rs` directly imports:

`authority_selection_inherents::select_authorities::select_authorities`

and the runtime source pins:

`spec_name = materios`
`spec_version = 238`
`transaction_version = 4`

The workspace `Cargo.toml` pins the IOG Partner Chains family to tag **v1.5.1**, including `authority-selection-inherents`, and applies a local Cargo patch replacing that upstream crate with the vendored Materios copy.

The vendored selector source is therefore the concrete selector implementation in the current source tree. It explicitly takes:

`genesis_utxo`
`AuthoritySelectionInputs`
`sidechain_epoch`

and performs candidate filtering, weighting, deterministic candidate ordering, seed derivation from epoch nonce + sidechain epoch, committee-size selection, followed by Materios-specific post-processing.

Two Materios-specific selector changes are directly visible in that source:

1. **Ariadne output deduplication** with a minimum distinct-committee safety floor.
2. **Force-include-when-fits**: when the number of eligible positive-weight candidates is no greater than the requested committee size, all eligible candidates are deterministically included instead of performing the weighted draw.

Therefore the phrase "Ariadne v1.5.1 + Materios patches" is now source-verified, not inferred.

### Important correction to previous wording

The earlier note that "runtime source dependency v1.5.1" remains correct, but the workspace comment says the Polkadot SDK is pinned to `polkadot-stable2409-4` "to match Partner Chains v1.8.x". This describes the SDK compatibility baseline; it does **not** turn the Partner Chains selector crates into v1.8.0. The actual selector crate remains v1.5.1 and is locally patched.

### Live-runtime check

The official Materios documentation identifies `/chain-info` as the public chain-information surface and instructs operators to query `state_getRuntimeVersion` for the live runtime. The endpoint could not be retrieved from this environment, so **no live spec-version claim is promoted**.

Consequently:

- source runtime: **spec 238 — VERIFIED**;
- selector source: **v1.5.1 + Materios patches — VERIFIED**;
- operator CLI: **v1.8.0 — VERIFIED from Materios documentation**;
- live runtime: **OPEN until direct RPC observation**;
- deployed WASM ↔ source correspondence: **OPEN**.

This is the exact point where the next evidence must come from the canonical Materios RPC, not more static-source triangulation.

No selector logic was added to IMMORTAL. No economic semantics changed.


## 2026-09-25 — MATERIOS UPSTREAM HEAD / SPEC-238 LINEAGE PASS

A fresh audit against the current public Materios repository advances the version-drift front beyond the earlier source snapshot.

### New upstream evidence

The current Materios main history reaches merge commit `011473c88ef82fad3d4877af8d89a5b52abf235f` (2026-09-23 23:37 UTC). The immediately preceding work includes the **spec-238** runtime line and subsequent hardening/tests. In particular, commit `0c57e2da6a6d5dbd63ee6e535eebcb0735e7699d` merges the spec-238 break-glass documentation/test correction, while `ff67a9f21b038e3d7221602b9dc9d61b12b89bd6` records the shipped last-holder scope and reports the runtime/pallet test counts for that change.

This gives us a stronger source-lineage statement:

- current public Materios source tree: **post-spec-238 main lineage**;
- runtime source declares **spec_version 238**;
- spec-238 was not merely an isolated local source edit: it has a subsequent merge/test lineage in the public repository;
- the current public source still directly imports `authority_selection_inherents::select_authorities::select_authorities`;
- the selector dependency remains **Partner Chains v1.5.1 + Materios vendored patches**, despite the workspace's Polkadot SDK compatibility comment referring to Partner Chains v1.8.x.

### Important boundary

This still does **not** prove that the canonical live Materios endpoint currently runs spec 238. The source repository and its commit history prove what the public source line contains; deployment state requires a direct `state_getRuntimeVersion` observation at a known finalized block, followed by WASM/source correspondence.

### New M6 implication

The next evidence target is now narrower than before. We should not keep searching the static source tree for a selector version unless a new source change appears. The unresolved chain is:

`canonical RPC`
→ `finalized block hash`
→ `state_getRuntimeVersion(at finalized block)`
→ `deployed runtime/WASM identity`
→ `source commit correspondence`
→ `selector transition artifact`
→ `GRANDPA justification / authority-set binding`
→ `external M6 composition proof`.

If the live runtime resolves to spec 238, the source-side selector provenance can be tied to the current public source line much more tightly. If it resolves to another spec, the source correspondence must branch accordingly; **do not assume 238**.

No Ariadne mathematics was added to IMMORTAL. No economic semantics changed.

Status:
- current Materios public source lineage: **VERIFIED / post-spec-238**
- selector source/version: **VERIFIED / v1.5.1 + Materios patches**
- live runtime version: **OPEN**
- deployed WASM ↔ source: **OPEN**
- cryptographic selector/transition proof: **OPEN**
- cryptographic M6 composition proof: **OPEN**
- real finalized-node evidence: **OPEN**


## 2026-09-25 — MATERIOS LIVE-VS-SOURCE DEPLOYMENT BOUNDARY TIGHTENED

Another triangulation pass found a materially stronger distinction between the current Materios source tree, the public documentation repository, and the last explicitly documented live-runtime observation.

### Evidence chain

1. The current public Materios source line is post-spec-238 and `partnerchain/runtime/src/lib.rs` declares `spec_version = 238`.
2. The spec-238 change itself states **NOT DEPLOYED** at the time it was introduced, and the subsequent security-review/test commits continue to discuss the spec-238 source/test line without providing a deployment ceremony or live RPC observation.
3. The public Materios documentation source (`Flux-Point-Studios/docs`, current `main`) identifies the network as `Materios Preprod v6`, keeps the live runtime field intentionally open as `211+`, and tells operators to query `state_getRuntimeVersion` rather than hard-code a version.
4. The same documentation repository records a concrete live verification from **2026-09-03** with **chain spec_version 237**, including on-chain WASM/API evidence and live Koios cross-checks. This is the strongest explicitly dated live-runtime evidence found in the available sources.
5. A separate rendered GitBook fetch currently exposes a conflicting generic node page showing `spec_version 109` and a different node image/tag. This does not match the GitHub source-of-truth page for the v6 preprod network and is therefore classified as a **published-surface inconsistency**, not as live network evidence.

### Consequence for M6

The correct status is now more precise:

- **Source implementation:** spec 238 — VERIFIED.
- **Last explicitly corroborated live preprod runtime:** spec 237 on 2026-09-03 — VERIFIED AS HISTORICAL LIVE EVIDENCE.
- **Spec 238 deployed live after that observation:** OPEN / no deployment evidence found.
- **Current live runtime today:** OPEN; must be read directly from canonical RPC.
- **GitBook rendered `spec_version 109`:** NOT TRUSTED as current v6 runtime evidence because it conflicts with the repository-backed v6 documentation and network identity.

This prevents an especially dangerous provenance collapse: `source HEAD 238` must not be treated as `live 238`, while the old `237 live` observation must not be silently treated as today's state either.

### Exact next proof target

The minimal decisive packet is now:

`canonical preprod endpoint`
→ `system_health`
→ `chain_getFinalizedHead`
→ `state_getRuntimeVersion { at: finalized_hash }`
→ `state_getCode { at: finalized_hash }` (or equivalent deployed runtime identity)
→ match runtime identity to a source commit/build artifact
→ retrieve the real authority-set transition + GRANDPA justification
→ verify the external selector/transition proof
→ compose M6.

No selector mathematics was added to IMMORTAL. No economic semantics changed.

Status: **LIVE 237 = last dated observation / LIVE CURRENT VERSION = OPEN / SOURCE 238 = VERIFIED / DEPLOYMENT CORRESPONDENCE = OPEN.**


## 2026-09-25 — B3 EXECUTION-PROOF TRANSPORT NARROWED

A fresh upstream triangulation resolves the next B3 engineering boundary.

### Runtime execution target confirmed

Materios exposes `SessionValidatorManagementApi::calculate_committee(authority_selection_inputs, sidechain_epoch)` from the runtime. The runtime implementation delegates to `SessionCommitteeManagement::calculate_committee`, and the pallet implementation delegates directly to `T::select_authorities(...)`. Therefore this API enters the same authoritative runtime path that contains the PinnedCommittee, sanitization, liveness, eviction, slack, quorum and break-glass branches. It must not be reduced conceptually to the vendor Ariadne selector.

### Native proof primitive confirmed

Current Polkadot SDK documentation confirms that `ProofProvider::execution_proof(hash, method, call_data)` executes a runtime call against the state at the specified block hash and returns the runtime result together with a `StorageProof`. `sp_state_machine` also exposes the corresponding execution-proof checking primitives. The proof represents the storage nodes touched by execution and therefore gives the independent verifier material to authenticate runtime state access against a known state root. citeturn113675search2turn113675search0turn113675search1

### Materios transport gap identified

The Materios node already carries a concrete `FullClient` and depends on `sc-client-api`, while `node/src/rpc.rs` builds custom JSON-RPC extensions. The inspected current RPC surface exposes System, Orinq Receipts and MOTRA, but no generic execution-proof RPC. Therefore the missing piece is no longer the underlying proof capability; it is an independently verifiable transport surface for the native client proof primitive.

This transport must remain untrusted. An RPC response does not establish canonicality. The independent verifier must still bind finalized block, state root, runtime identity/code, exact SCALE call bytes, execution result and proof material, then authenticate the result before creating `VerifiedAuthoritySetTransition`.

### IMMORTAL implementation status

Added `poc/materios-checkpoint/src/executionProof.ts` with a typed B3 transport envelope and fail-closed validation for:

- finalized block/state binding fields;
- runtime identity/version;
- runtime API method and exact call/result hex;
- non-empty execution proof nodes;
- sidechain epoch and Cardano epoch nonce;
- genesis UTxO context;
- pinned vs normal selection path;
- authority commitment.

Added `poc/materios-checkpoint/test-executionProof.ts` covering valid construction, malformed binding rejection and mutation of bound execution material. Added the `test:execution-proof` package script.

These are transport/conformance checks only. They do **not** verify Substrate trie proofs or runtime execution cryptographically.

Commits:
- `1bc4b184bb0419c7410145c03d6fc5781a2100da` — execution-proof envelope.
- `129f9a2b2dcf3afc387df31e6031995760892254` — envelope tests.
- `7c250b0513e6bde2947988f1ddfa14891d95bb75` — test command.
- `01cb6262370720bd3ab4690a6a7f5214880f22c5` — B3 contract transport finding.

### Current B3 status

**OPEN — proof transport and independent verification remain required.**

The next evidence target is a real finalized Materios block plus the native `execution_proof` result for `SessionValidatorManagementApi::calculate_committee`, followed by independent verification of the returned `StorageProof` against the finalized state root and binding of the runtime/code identity. No TypeScript reimplementation of the selector is authorized.
