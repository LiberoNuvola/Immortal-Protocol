# Repository-wide coordination checkpoint

**Coordination update:** 2026-11-06  
**Working branch:** `work/immortal-green-closure`  
**HEAD before this checkpoint update:** `75f3dbb81a3740878b566528a37e5e8456de83bb`  
**Purpose:** central pointer for current cross-agent work. This entry records the new A-R1 frontier; it does not supersede earlier issue evidence or authorize protocol changes.

## Agent A — A-R1 Dynamic Economic Margin / Statistical Reserve

**Lead:** Agent A  
**Independent technical review:** Agent B  
**Status:** READ-ONLY BASELINE RECORDED; review and analytic follow-through open.

New baseline:
- `docs/COORDINATION/AGENT-A-R1-DYNAMIC-MARGIN-STATISTICAL-RESERVE-BASELINE-2026-11-06.md` (updated with exact moment reproduction and symbolic lifecycle vectors (latest report commit `aa7ac0160fb06fbe3ecfb11eb7324b7e6d9d44a8`))
- Commit introducing the baseline: `75f3dbb81a3740878b566528a37e5e8456de83bb`

The audit distinguishes:
1. nominal unresolved face reserve, currently `Σ(P_i × N_i)` in the V3 aggregate/carrier;
2. deterministic class-aware worst-case exposure, currently `500 × Σ(P_i × N_i)`;
3. PRE-RICH's documented statistical payout-risk model, `Nμ + Zσ√N`, with `μ = 0.64996875P`, `σ ≈ 6.689612535P`, and `Z` still a deployment/model parameter;
4. `ReserveProtection`, a separate protected-capital component whose source and non-overlap are not established by the current V3 arithmetic.

No statistical addend has been inserted into ProtectedCapital. No 500×, KA/KC/KD, price ladder, V3/Reveal semantics, EEV source, script identity or deployment rule has been changed.

### Agent A next steps
- Independently reproduce the current ticket-level probability moments from the canonical two-row payout table.
- Build lifecycle vectors that display nominal face reserve, deterministic WCE, crystallized liability and the statistical estimate separately through Issue/Reveal/Claim/Expire — **symbolically derived** in the A-R1 report; mixed-class variance expression remains conditional on cross-ticket independence.
- Identify the missing specification/evidence contract for the statistical model's role, Z, mixed-class dependence, precision and admission boundary.
- Keep the R1/QNE proof universal over the authoritative Ω; a statistical confidence estimate is not a substitute for that proof.

### Agent B review request
- Review `EconomicKernel.hs`, `EconomicTransitionV3.hs`, `PreRichEconomicProjection.hs`, `PreRichEconomicAdmission.hs`, and `V3EconomicStateCarrier.hs` against the new A-R1 crosswalk.
- Confirm the current carrier's unresolved reserve is nominal face value, not the statistical quantity — source review supports this; B1 explicitly calls it the deterministic ticket-price reserve and EconomicGate has no μ/σ/Z input.
- Check any candidate mapping to `ReserveProtection` against the PA3/PA4 source-provenance and non-overlap requirements.
- Do not change V3/Reveal semantics or introduce a new ProtectedCapital addend during review.

## Existing blockers retained

- **Issue #37 / R1-Kc-QNE:** concrete profile instantiation, complete E1–E10/VC1–VC6 evidence, authoritative Ω and a valid non-eroding witness remain open. The S0 Issue-only erosion finding is not superseded by the statistical reserve baseline.
- **Issue #37 / PA3–PA4:** component-level provenance and disjointness for SafetyCapital, ReserveProtection and MandatoryFutureCosts remain open. `ReserveProtection` must not be inferred from the nominal unresolved reserve.
- **Issue #37 / current EEV and Preprod evidence:** live snapshot, source completeness, Oracle qualification and first-Issue admission gates remain separate.
- **Issue #20 / expiry:** earlier builder-side time-anchor work remains bounded by the documented policy/provenance/on-chain conformance gaps; this checkpoint makes no status change.
- **Issue #41 / Treasury receipts:** read-only evidence remains non-authoritative for economic allocation or spending.

## Change-control boundary

This A-R1 increment is analysis/documentation only. No code/tests/workflows were changed or run; no certificate was issued; no wallet signature, transaction, bootstrap, approval or deployment was performed. Any implementation of statistical reserve behavior requires an explicit policy/specification decision and an evidence-backed field/gate contract first.


## 2026-11-07 — A-R1 correction: recovered dual-layer risk/intensity model

**Working branch:** `work/immortal-green-closure`  
**Starting HEAD verified before this update:** `74744cf4bb465b13c76fe8918d63aa8aedf38075`  
**Scope:** documentation and coordination only.

The A-R1 report now includes §10, recovering the previously omitted two-layer architecture and correcting the interpretation of the statistical-reserve gap.

### Recovered model

1. **Layer A — always-on deterministic floor:** candidate post-state must preserve the applicable `ProtectedCapital`, `A_safe` and authoritative `Ω` constraints. A statistical model or dynamic budget cannot waive this floor.
2. **Layer B — state-dependent intensity/allocation:** D3's application design expresses:
   `S_res = max(0, EEV - ProtectedCapital - L_dedicated)`,
   `B_t = α_t(S_res, class_t, stats_t) × S_res`,
   `0 ≤ α_t ≤ 1`, and
   `Notional ≤ min(B_t, RiskEnvelope)`.
   This is an exposure-intensity control above the floor, not a replacement for worst-case protection and not a mechanical statistical addend to ProtectedCapital.
3. **Operating regime controller:** D3 describes C0–C3, hysteresis and quiescence/recovery. These are application-design regimes, not the PRE-RICH Game prize class ladder or KA/KC/KD.

### Authority and boundary

- The IMMORTAL Canonical Economic Register supports trajectory-dependent use of separate Worst-Case and Statistical Risk Analysis mechanisms (either or both as appropriate). It does not define a universal addition formula, replacement rule or binary global mode switch.
- The explicit D3 “Economic Engine for Agents” double-layer design was recovered from Library artifact `Testo incollato(20261102-204028).txt` (2026-11-02). That note expressly marks itself non-normative against the current repo and keeps the Arb Agent separate from Scratch & Win/PrizePool.
- `PreRichAwraReference.ts` and `PreRichAwraDynamicReference.ts` remain research/historical references. The latter reconstructs a v36 envelope and observed v37 behavior; the original v37–v39 selector is unavailable. No α, Z, cadence, objective or fixed budget is promoted to protocol policy.
- D3's separate Principal/capital perimeter cannot spend PRE-RICH Game PrizePool, Jackpot or Treasury funds.

### Agent A / Agent B coordination

**Agent A:** maintain the A-R1 crosswalk, but treat the dynamic intensity/regime contract as a separate specification workstream. Define the perimeter, residual-surplus semantics, typed risk output, policy authority and evidence requirements before recommending integration.

**Agent B:** independently verify that no production V3/Plutus/Gate path already consumes an authorized dynamic intensity output. Review the separation between:
- deterministic floor and trajectory-specific Worst-Case analysis;
- statistical payout estimate `Nμ + Zσ√N`;
- AWRA/static candidate reference;
- historical dynamic risk envelope;
- proposed D3 α/class/quiescence controller.

Do not wire these references into V3, Reveal or the production Gate, and do not reinterpret C0–C3 as game prize classes.

### Existing blockers and change control retained

- The S0 Issue-only margin erosion of 500 RU remains the concrete R1/QNE obstruction. A lower α, statistical confidence estimate or informal quiescent mode does not create a certified non-eroding witness.
- Issue #37 R1/Kc, PA3–PA4 provenance/non-overlap, USD/USDM source qualification and current EEV/approval gates remain open as previously recorded.
- No code, tests, workflows, certificates, constants, ProtectedCapital formula, V3/Reveal semantics, wallet action or ledger state was changed or executed by this documentation update.



## 2026-11-07 — Agent B source audit: risk-mode scaffold and actual regime controllers

**Starting source HEAD audited:** `9e137d18e63b1459b8c97e794731c5e15c45374b`  
**Audit artifact:** `docs/COORDINATION/AGENT-B-R1-RISK-MODE-AND-REGIME-CONTROL-AUDIT-2026-11-07.md`  
**Status:** read-only source audit; no production modifications or tests executed.

### Key finding — the remembered model switch is present as a typed scaffold

`IMMORTAL/kernel/RiskProtectionBridge.hs` declares:
- `DeterministicWorstCaseOnly`;
- `StatisticalOnly`;
- `DeterministicAndStatistical`.

`RiskAssessment` binds the selected mode to a profile version and trajectory ID. This is the clearest recovered code-level trace of trajectory-specific risk-mode selection.

**Current implementation is deliberately fail-closed:** `deriveProtectionRequirement` accepts only deterministic-only mode when the reported exposure exactly matches projected WCE. Statistical-only and combined modes return `UnsupportedRiskMode`. The returned ProtectionRequirement carries only deterministic WCE. The module is exposed by Cabal and has a dedicated test suite, but those tests were not run during this review.

### The missing production connection is confirmed

- `PreRichEconomicAdmission.hs` does not import/call `RiskProtectionBridge`; it constructs the current EconomicGate input directly.
- `EconomicGate.hs` has no risk mode, statistical reserve, `α_t`, budget or RiskEnvelope input.
- Thus no inspected production path derives a mode from protocol state or carries statistical/combined output into Gate.

### Existing controllers are separate

- PRE-RICH class hysteresis `src/preRichHysteresis.ts` implements class activation/maintenance/contraction with `KA=8, KC=4, KD=4); it is not the D3 C0–C3 intensity controller.
- `PreRichLifecycleTransition.hs` supplies ACTIVE→QUIESCENT and QUIESCENT maintenance with nonce advancement plus a separate QNE predicate over an explicit non-empty Ω-witness list; it does not mutate V3 or select risk mode.
- `PreRichRegimeState` lists PRE_GENESIS/GENESIS/ACTIVE/QUIESCENT, while the Cardano Genesis carrier only implements PRE_GENESIS→GENESIS. ACTIVE→QUIESCENT is a separate lifecycle module.
- AWRA modules remain references; v37–v39 selector source remains unavailable.

### Coordination assignment

**Agent A:** prepare the normative state/trajectory-to-risk-mode selection contract and typed interface proposal. Do not choose thresholds, Z, α, statistical dependence, combination formula or preference objective unless a canonical decision already authorizes it.

**Agent B:** review the proposed contract against the hard deterministic floor and the existing Gate/Admission boundary; preserve V3/Reveal semantics.

### Blockers retained

The S0 Issue-only R1/QNE erosion finding remains unchanged. Neither a statistical mode, AWRA budget nor quiescent label creates a certified non-eroding witness by itself. Issue #37 remains open; no 500×, ProtectedCapital, V3/Reveal, deployment or Issue change is authorized.



## 2026-11-07 — Agent A proposal: trajectory-to-RiskMode selector contract

**Proposal:** `docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md`  
**Creation commit:** `f512d9dc691a13f23e87be1fa9bb4da8dc35e3cd`.

Agent A has translated the Canonical Economic Register and the current typed `RiskProtectionBridge` into a decision-ready contract proposal.

### Principal semantics

- `RiskMode` selects the risk-analysis mechanisms required for a particular verified trajectory; it is not a safety switch.
- `StatisticalOnly` cannot suppress universal invariants or a deterministic floor that is separately mandatory in the applicable profile.
- PRE-RICH V1 currently requires deterministic unresolved-ticket WCE at 500×. Statistical analysis cannot replace it.
- `DeterministicAndStatistical` requires both outputs to remain separately typed until a versioned rule defines role, units, horizon, perimeter and non-overlap.
- The mode must be resolved by an authorized, versioned profile policy over authenticated state/action/trajectory evidence. A caller-supplied enum is not sufficient authority.

### Proposal coverage

The document defines minimum selector inputs and evidence bindings, ordered fail-closed resolution, a trajectory-family matrix (Issue/Reveal/Claim/Expire, EEV/liquidity, quiescence and separate Arb Agent), typed output requirements into ProtectionRequirement/Gate, and open decisions for specification authority.

### Coordination

**Specification authority:** decide the trajectory-to-mode mapping, semantics/role of statistical results, model/horizon/confidence/dependence contract, any combined rule, and governing version.  
**Agent B:** review exact state/action/policy/evidence binding and confirm the hard floor remains invariant when the authorized mapping is provided.  
**Agent A:** preserve the separation between PRE-RICH Game and Arb Agent; no parameter or policy preference is to be invented.

Current bridge behavior stays unchanged: deterministic-only accepted when it exactly matches projected WCE; StatisticalOnly and DeterministicAndStatistical remain unsupported/fail-closed. No code/tests/CI/V3/Reveal/500×/ProtectedCapital or deployment semantics were changed. R1/Kc/QNE remains open.


## 2026-11-07 — Agent A final Cardano Lab #2569 disposition

**Exact run:** [IMMORTAL Cardano Integration Lab #42338809302](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42338809302)  
**Tested HEAD:** `2f6c437f1f9956f5c99ec4bf2b03d1317fba9fd8`  
**Branch HEAD re-fetched at checkpoint update:** `2f6c437f1f9956f5c99ec4bf2b03d1317fba9fd8`  
**Overall workflow:** `FAILURE`.

### Exact step outcomes

| Step | Outcome | Qualification |
|---|---|---|
| 10 — Plutus/Cabal conformance incl. BeaconRegistry adversarial CEK | PASS | B0 CEK suite reached successful exit |
| 27 — B0 BeaconRegistry adversarial Yaci characterization | PASS | Local Yaci ledger characterization only |
| 31 — Aiken V3 Reveal | PASS | Isolated Aiken V3 / local Yaci path |
| 32 — FundTreasury / Oracle valuation | PASS | Local Yaci fixture; not USD/USDM qualification |
| 33 — T3 TicketIssued boundary | STEP PASS / CAUSE QUALIFICATION OPEN | Eight accepted; ninth Plutus V2 script rejection, but prior valid ExUnits were reused after generic Yaci evaluation error |
| 34 — Aiken V3 Expire | PASS | Isolated Aiken V3 / local Yaci path |
| 35 — Haskell V2 Pending Expire | FAIL | Lucid/CML transaction builder rejected 16,540 bytes > 16,384 before submission |
| 36–50 — remaining Expire, Claim, P2.8, decoder, invariants and predeploy checks | SKIPPED | Upstream step-35 failure |

### T3 / 500× evidence boundary

The synthetic local Yaci fixture contains 400,000 USDM subunits at 100 subunits per ticket. Issues 1–8 were accepted; the eighth reaches the arithmetic exposure boundary (500 × 8 × 100 = 400,000). Issue 9 would imply (450,000) exposure and was rejected at submission. However, the negative candidate's evaluation failed with a generic machine/script error; the harness reused the previous valid budget (`expectedNegativeBudgetFallbackUsed=true`; spend budget 1,636,544 mem / 350,284,223 steps). The final rejection is generic Plutus V2 script failure without an identifying trace. Record the accepted transitions and submitted rejection as observed, but keep the specific 500× predicate cause **not independently distinguished from generic execution failure** until a properly evidenced negative rerun. Scope excludes production MintPolicy, admission, EEV and source qualification. No economic rule changes are authorized.

### Haskell V2 Pending Expire resource blocker

Step 35 failed in Lucid/CML `TransactionBuilder.min_fee` with a candidate size of 16,540 bytes, 156 bytes above the Cardano 16,384-byte limit. This is a pre-submission build/resource block, not a validator semantic rejection. The step's logs did not identify which of the trace's several `.complete()` calls constructed the oversized candidate. The next work is a bounded diagnostics-only pass that marks each builder boundary and records exact CBOR size; do not alter EXPIRE semantics, scripts or economic invariants to mask the limit.

### B0 disposition retained

- B0 CEK step 10: PASS.
- B0 Yaci step 27: PASS.
- B0 remains OPEN / release-blocking: direct Ready/fake Ready-to-Prize SyncBeacon balanced Yaci twin, T07 worker regression, T08 authenticated Preprod Registry identity/UTxO, and independent Plutus/security review plus protocol-owner disposition remain outstanding.
- The overall workflow failure at step 35 does not invalidate B0's two exact-step results.

### Evidence publication

The workflow generated and validated the JEV verification registry and operational prompt; their tests passed. The evidence packet contains 31 files and 82 redactions and was uploaded as artifact `13561096202`, ZIP SHA-256 `3a0ad6e6ad58d46cbb96c3a7e3252d7ed453b191caa8930387d2d68aaa226828`. The workflow log reports the Notion evidence ledger updated with run #2569.

### Coordination / next owners

- **Agent A:** keep R1/Kc/QNE, USD/USDM source qualification, EEV/deployment approval and first-Issue gates blocked; obtain an unambiguous T3 negative-cause proof without changing economic policy.
- **Agent B:** take a separate, diagnostics-only serialized task to localize the Haskell V2 Pending Expire 16,540-byte candidate. No production validator, V3, Reveal or economics changes.
- **Agent B / security reviewer:** continue the outstanding B0 Registry remediation specification/review separately; do not infer B0 closure from the passing characterization suite.
- **Shared branch:** no code commit is made by this update. This checkpoint is documentation-only; all execution evidence above is bound to `2f6c437f1f9956f5c99ec4bf2b03d1317fba9fd8`.

No deployment, signing, wallet operation, privileged approval or on-chain Preprod/mainnet action was performed.