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

## 2026-11-07 — Agent B EXPIRE size diagnosis complete; reference-script publication is the blocker

**Diagnostics commit:** `9d51437b80ce046bf82ec8b9ab0279a2243c7882`  
**Commit message:** `test(cardano): instrument EXPIRE transaction size stages`  
**Scope:** exactly one changed path, `audit/cardano-integration/expire-ledger-trace.ts`; 1 commit / 1 path versus release HEAD `a26cfd5d6fa9fdefea7da6d5ff2cb7256ed308b9`.  
**Cardano Lab:** [run #42340114425](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42340114425)  
**Evidence:** artifact [#13561801023](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42340114425/artifacts/13561801023), SHA-256 `c11595ec538a848a81f1bfa400ccae4b2ec4e3476e9e94a22db4ea52db078311`.

### Exact failure localization

The diagnostic conclusively locates the Haskell V2 Pending EXPIRE failure at:

`publish-prize-reference-script / complete()`

- The original 16,540-byte error is preserved and rethrown by the diagnostic wrapper.
- Failure occurs before signing or submission.
- It is not a final EXPIRE spend build failure, validator rejection or ledger rejection.
- Bootstrap fixture transaction passed: 876 bytes unsigned / 982 bytes signed.
- Prize reference-script publication failed at 16,540 bytes.
- B1PrizePool reference-script publication was not reached.
- Final Haskell V2 EXPIRE spending transaction was not built.

Parameterized script measurements in the Haskell V2 Pending path:
- PrizeValidator, PlutusV2, hash `508588a6ac5925b316b87f85adcc746808b4b29d2e13952184e7175b`: **16,443 bytes**, 59 bytes above the 16,384-byte maximum.
- B1PrizePool, PlutusV2, hash `1fba040c25320f744120b9c6aa8f126f505bd6246779a903ab30bde1`: **12,085 bytes**.
- Full Prize reference-script publication candidate: **16,540 bytes**, 156 bytes above the maximum.

Thus the immediate blocker is the size of the parameterized Haskell V2 PrizeValidator carried in its reference-script publication transaction. No code shrink, split, validator rewrite, compiler change or alternate deployment arrangement has been applied or authorized.

### Aiken V3 control — separate implementation, not equivalence proof

The isolated Aiken V3 Pending EXPIRE control on the same local devnet succeeded:
- Aiken PrizeValidator: PlutusV3, 10,801 bytes.
- Bound B1PrizePool: PlutusV2, 12,085 bytes.
- Prize reference publication: 10,999 unsigned / 11,105 signed bytes.
- Pool reference publication: 12,283 unsigned / 12,389 signed bytes.
- Final EXPIRE spend: 706 unsigned / 812 signed bytes; ledger accepted and replay rejected.

This is local fixture evidence only. It does not establish semantic equivalence with the canonical Haskell V2 validator or authorize switching the production path to Aiken V3.

### Avoid a misleading cross-language diagnostic

The separate Reveal trace emits a `parameterizationDifferential` of 10,801 vs 16,443 bytes. Source inspection shows this is **not** a same-validator/same-input comparison of two parameterization libraries: the 10,801-byte side is the selected Aiken V3 candidate, while the 16,443-byte side is the separately parameterized Haskell V2 factory. Do not infer a Lucid parameterization defect from that differential. The Haskell V2 size finding above comes from its own exact Expire step's script diagnostic.

### Exact run step outcomes

- Step 10 Plutus/Cabal conformance including B0 CEK: PASS.
- Step 27 B0 BeaconRegistry Yaci characterization: PASS.
- Steps 29–34 V3 carrier, Reveal, FundTreasury, T3 TicketIssued and Aiken V3 Expire: PASS as workflow steps. T3's negative-cause evidence caveat remains recorded above and in Issue #37.
- Step 35 Haskell V2 Pending EXPIRE: FAIL, precisely localized above.
- Steps 36–50 (Haskell V2 Revealed Loss/Win, Claim, P2.8, decoder, invariants and predeploy gates): SKIPPED.
- Steps 52–61 evidence preservation, JEV registry/prompt, packet generation/upload and Notion registration: SUCCESS.

Agent B returned the diagnostics write slot. The diagnostics change itself is harness-only and does not change validator semantics. The follow-on [Issue #45](https://github.com/LiberoNuvola/Immortal-Protocol/issues/45) requests a **read-only** size feasibility study; it grants no write slot.

### Separate Preprod Context workflow failure

The same SHA triggered [IMMORTAL Cardano Preprod Context run #42340114380](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42340114380), which failed at step 8, `Probe Demeter Ogmios Preprod context`, with `Ogmios RPC timeout: queryLedgerState/utxo`. Steps 9–13 (live wallet/PrizeValidator/B1 Pool UTxO observation and observation binding) were skipped. Demeter credential and wallet-address validation passed. This is an RPC availability failure, **not** evidence that a qualifying UTxO/source is absent. It yields no new live Preprod observation or Issue-admission qualification. Issue #37 remains OPEN.

### Current coordination

- B0 CEK and Yaci characterization results remain PASS at steps 10 and 27; B0 remains OPEN for T01b/T04 balanced Yaci twins, T07 worker behavior, T08 authenticated Preprod identity and independent security/owner disposition.
- Haskell V2 EXPIRE is blocked before ledger execution because its parameterized PrizeValidator reference script cannot be published within the active transaction size limit.
- T3 remains source-consistent with a 500× post-state rejection but runtime failure cause is not independently typed.
- EEV/Option B source qualification, deployment approval, R1/Kc and first real Issue remain blocked.
- No economic rule, 500×, ProtectedCapital, datum/redeemer ABI, validator semantics, compiler or workflow was changed by the diagnostics task.
- No wallet signing, privileged approval, deployment or Preprod/mainnet ledger action was performed.

**Next technical owner:** Agent B, read-only feasibility analysis in Issue #45. Agent A resumes documentation/coordination only; any implementation requires a new explicit, bounded authorization.

## 2026-11-07 — Agent A read-only Haskell V2 PrizeValidator size-feasibility cross-check

**Analysis issue:** [#45 — Haskell V2 PrizeValidator size feasibility](https://github.com/LiberoNuvola/Immortal-Protocol/issues/45)  
**Source baseline:** `9d51437b80ce046bf82ec8b9ab0279a2243c7882`  
**Branch HEAD before this documentation update:** `98ef14085563f0d047f89c33f441708cf4443a1b`  
**Scope:** read-only source/build/log review; no implementation slot requested or granted.

### Critical provenance correction

The checked-in `plutus/out/prizeValidatorFactory.plutus.json` and `src/plutusScripts/prizeValidatorFactory.plutus.json` at the source baseline are byte-identical, with 19,520 hex characters = 9,760 CBOR-hex bytes. However, the Cardano Lab run does **not** consume the tracked artifact unchanged:

1. Step 8 executes `cabal run exe:export-scripts`.
2. `plutus/export/Export.hs` exports `PrizeValidator.compiledValidatorFactory` with `serialiseCompiledCode` and hex encoding.
3. Step 12 records SHA-256 for the freshly generated artifacts.
4. Step 13 copies the fresh PrizeValidator factory into `src/plutusScripts`.
5. `src/loadValidator.ts` imports that artifact and applies the Registry ScriptHash, PrizeTable, Oracle singleton identity and Oracle publisher Pkh.

Run #42340114425 / #2570 records generated factory JSON SHA-256:
`14e6a36d7ae9de9bb5e64514c01fa20e224167c79d3b50745a677d8b7a6a7e60`.

The tracked 19,713-byte JSON at the same source SHA has SHA-256:
`5c0ba5880c423afd77c81cfd0cc5fdbda96a99e5759d1f3718e298b80970ed4a`.

The generated JSON is therefore not byte-identical to the tracked artifact. The run retained only the generated JSON SHA, not the fresh `cborHex` bytes/length or wrapper depth. Consequently, **9,760 bytes is not established as the exact factory input to the failing runtime parameterization**, and the apparent 9,760 → 16,443 delta must not be attributed to parameter application or Lucid without further evidence.

### Canonical toolchain and runtime path

- CI uses GHC 9.6.7 / Cabal 3.12.1.0.
- `cabal.project` pins Plutus release 1.67.0.0 at `48e9bf08f439e7223de713b5b71696fcd81cffc3` and exact package constraints.
- `plutus/PrizeValidator.hs` targets Plutus Core 1.0.0 for V2 compatibility; current Cabal flags already use the standard Plinth-safe restrictions on GHC full-laziness, strictness, specialisation, SpecConstr and unboxing.
- Export uses `serialiseCompiledCode`; parameter application is a distinct subsequent step through `lucid-cardano@0.10.11` `applyParamsToScript`, delegated to CML `apply_params_to_plutus_script`.
- The exact Haskell V2 runtime PrizeValidator measurement remains hash `508588a6ac5925b316b87f85adcc746808b4b29d2e13952184e7175b`, 16,443 bytes. B1PrizePool is 12,085 bytes. The reference-script publication transaction is 16,540 bytes and fails before signing/submission.

### Size-feasibility ranking and safe next experiment

1. **First: build/representation provenance.** Capture exact fresh factory JSON, `cborHex`, inner flat bytes, CBOR wrapper depth, SHA-256 and byte length; capture exact parameterized bytes/hash from that fresh artifact; then measure the complete publication transaction.
2. **Then: isolated compiler option comparison.** Plutus 1.67.0.0 exposes `conservative-optimisation`, `inline-callsite-growth`, `inline-constants` etc. These may affect UPLC bytes, script hash and CEK costs. Compare one option at a time in a throwaway checkout with same source/toolchain/target/parameters, retaining full all-action positive/negative/golden/CEK-cost evidence.
3. **Source factoring/profile.** PrizeValidator contains 38 INLINABLE pragmas, no explicit INLINE/NOINLINE, 67 traceIfFalse sites; compact numeric trace labels are already used. Raw BuiltinData/Claim helpers and repeated TxInfo traversal are possible profiling targets but not demonstrated size hotspots.
4. **Structural validator split.** High semantic/deployment risk: changes script topology/hashes/addresses/reference identity and parameter binding; requires a separate normative architecture and migration decision.
5. **Aiken V3.** Smaller isolated local Yaci candidate is not semantic equivalence or authorization to replace the canonical V2 implementation.

The measured publication transaction requires at least **156 bytes** reduction to fit the 16,384-byte limit. The one-run non-script remainder is 97 bytes, implying a 16,287-byte script target only under that exact same envelope; this is not a general overhead guarantee.

### Agent A disposition

- Haskell V2 failure is precisely localized to PrizeValidator reference-script publication.
- The fresh factory → parameterized script growth is **not yet quantified** because the exact fresh factory CBOR was not retained.
- Do not claim a Lucid parameterization bug, select a compiler flag, shrink scripts, alter ABI/validators, split the validator or substitute Aiken V3 from current evidence.
- [Issue #45 comment #6702649762](https://github.com/LiberoNuvola/Immortal-Protocol/issues/45#issuecomment-6702649762) contains the full source-path review, risk ranking and bounded experiment recommendation.
- Issue #45 remains **READ-ONLY / NO WRITE SLOT**. Any source/compiler implementation work requires a separate explicit authorization after provenance is reconciled.

No code, build flags, dependencies, workflow, script artifact, economic rule, signing, deployment or ledger state was changed by this analysis.