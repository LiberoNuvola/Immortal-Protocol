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

## 2026-11-07 — Agent B read-only feasibility report accepted; next diagnostic slot defined

**Completed analysis:** [Issue #45 — Haskell V2 PrizeValidator size feasibility](https://github.com/LiberoNuvola/Immortal-Protocol/issues/45) (closed completed after report).  
**Agent B report:** [comment #6702711331](https://github.com/LiberoNuvola/Immortal-Protocol/issues/45#issuecomment-6702711331).  
**Analysis baseline:** `9d51437b80ce046bf82ec8b9ab0279a2243c7882`.  
**Branch baseline for next work:** `a61db97fe58ec2340cb615b1d18bd2d19517f1b2`.

### Independent review and confirmed details

Agent A independently checked the report's key claims against the exact source and pinned upstream Plutus release:

- `src/gameRules.ts` confirms the default PrizeTable values: `2, 5, 10, 200, 1000`; `audit/cardano-integration/expire-ledger-trace.ts` passes this table into `buildScriptsFromLucid`.
- `src/loadValidator.ts` confirms the four PrizeValidator factory parameters: Registry ScriptHash; PrizeTable encoded as one `Constr` with five integer fields; Oracle singleton identity encoded as one `Constr` with policy and token name; Oracle publisher PubKeyHash.
- The `wrap` function in `plutus/PrizeValidator.hs` dispatches the common V2 validator over SyncBeacon, Reveal, Claim and Expire.
- Pinned upstream Plutus 1.67.0.0 plugin defaults confirm optimization enabled, relaxed float-in enabled, inline constants enabled, inline fix enabled and callsite inlining growth = 5. Its source documents that constant/fixpoint inlining can increase script size; `conservative-optimisation` disables those options while preserving logging. It is a comparison candidate, not a guaranteed size reduction.
- The V2 source-level target and GHC/Cabal restrictions are already pinned. No confirmed same-input/same-validator evidence of a Lucid/CML defect exists.
- A compiler-option change would alter script bytes/hash and potentially CEK costs. Since B1PrizePool is bound to the PrizeValidator hash and MintPolicy is bound to dependent script hashes, downstream identities/reference scripts must be regenerated and fully requalified for any implementation candidate.
- The trace currently logs the resulting PrizeValidator and B1PrizePool hashes/sizes after `buildScriptsFromLucid`, but does not log the imported fresh factory bytes before parameter application.

### Accepted technical disposition

1. The failing Haskell V2 Pending EXPIRE path is at reference-script publication `complete()`, pre-signing/pre-submission.
2. The measured V2 PrizeValidator is 16,443 bytes; its publication transaction is 16,540 bytes, requiring at least 156 bytes of reduction to reach 16,384. The 97-byte difference is one measured non-script envelope remainder, not a stable constant.
3. The exact fresh factory generated by Cabal is not in the evidence packet. Only its JSON SHA-256 was retained. The checked-in 9,760-byte factory is not proven to be the artifact consumed by the failing CI runtime. Hence parameter-application growth remains unquantified.
4. The separate Aiken V3 10,801-byte fixture is not equivalent to the Haskell V2 validator and is not a replacement authority.
5. No semantic, compiler, dependency, validator, ABI, deployment or economic change is authorized by the completed read-only report.

### Next bounded action

A separate follow-up issue is to grant Agent B a single-path, diagnostic-only write slot in `audit/cardano-integration/expire-ledger-trace.ts`. That slot may record the exact imported factory bytes/hash/length and the resulting parameterized script bytes/hash/length from the same CI run, plus the exact parameter identity and CBOR wrapper-depth diagnostics needed to reconcile the values. It must not change parameterization, compilation, script artifacts, transaction construction, or validator semantics. Any compiler-option comparison or code reduction remains out of scope and needs another explicit authorization.

Issue #45 is complete as a read-only feasibility report, not as proof that the factory-to-script byte delta has been reproduced. The missing provenance is carried forward to the next diagnostic task.


## 2026-11-07 — Haskell V2 factory-to-parameterized CBOR provenance measured on exact CI run

**Diagnostic issue:** [#46 — Capture exact V2 factory-to-parameterized-script CBOR provenance](https://github.com/LiberoNuvola/Immortal-Protocol/issues/46) — CLOSED / write slot returned.  
**Commit/exact tested SHA:** `8f12ecbca607c3e24d4feb1188a42619d2280bc1`.  
**Workflow:** [Cardano Integration Lab run #42342592012 / #2571](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42342592012) — overall FAIL at Haskell V2 Pending EXPIRE step 35.  
**Artifact:** [#13562462910](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42342592012/artifacts/13562462910), ZIP SHA-256 `9190b8b91e4fad7d641b2033977fd418d598aaf7adf3e10760d6ed8f614f2488`.

### Independent artifact verification

Agent A downloaded the actual uploaded ZIP, recomputed its archive SHA-256, extracted the runtime provenance JSON and recomputed both CBOR measurements:

- ZIP digest: exact match to the GitHub artifact digest.
- Packet source: repository `LiberoNuvola/Immortal-Protocol`, branch `work/immortal-green-closure`, commit `8f12ecb...`, run ID `42342592012`.
- Evidence packet: 32 files; provenance JSON 67,801 bytes; packet entry SHA-256 `0fc2916e568efe6486098753043ba6946e9816213006c8fa3cfa7879d0253d48`; zero redactions.
- Both embedded CBOR hex strings decode to their stated byte lengths, and their SHA-256 values independently recompute exactly.

### Same-run factory → parameterized Plutus V2 result

| Measure | Fresh Cabal-generated factory | Existing Haskell V2 parameter application |
|---|---:|---:|
| CBOR bytes | **16,309** | **16,443** |
| SHA-256 of raw CBOR | `3c879feab921f4e39964baded675395c12bc20030c7843f2004017738aa37bf2` | `9fec0f8342f0d1e55196dc57677222f45925087b46d0b15ca7c9aee8a5cf7036` |
| Outer CBOR byte-string | major type 2, 3-byte header | major type 2, 3-byte header |
| Inner payload bytes | 16,306 | 16,440 |
| Trailing bytes after declared payload | 0 | 0 |
| Plutus V2 script hash | factory not parameterized | `508588a6ac5925b316b87f85adcc746808b4b29d2e13952184e7175b` |

**Measured parameter-application delta: +134 bytes.** This is now a valid same-run comparison; the prior 9,760-byte figure was the checked-in factory only and must not be used as the CI baseline.

Exact four runtime parameter identities recorded in the evidence JSON:
- Registry ScriptHash: `7e77d0b44002ea15d7c4a11f5acc176bfccec5bb0eafac66c528dcd8`
- PrizeTable: `2 / 5 / 10 / 200 / 1000`
- Oracle singleton policy: `89234e0f20373cde0c7b0644edeb3cfc1dbca4005fd98b731518d235`
- Oracle token name: `4f5241434c45`
- Oracle publisher Pkh: `c8c47610a36034aac6fc58848bdae5c278d994ff502c05455e3b3ee8`

### Failure boundary remains exactly known

The Haskell V2 Pending EXPIRE step fails during `publish-prize-reference-script / complete()` at the Lucid/CML transaction builder with:

`Max transaction size of 16384 exceeded. Found: 16540`

- Transaction candidate: 16,540 bytes.
- Cardano max: 16,384 bytes.
- Minimum reduction to this exact candidate: **156 bytes**.
- The one-run non-script remainder is 97 bytes (16,540 − 16,443). The implied ≤16,287-byte script target assumes all other envelope bytes remain unchanged; it is not a general overhead constant.
- This is pre-signing and pre-submission for the failing reference-script publication. It is not a Plutus validation or ledger rejection.
- No Haskell V2 final EXPIRE spend was built; later Haskell EXPIRE cases were skipped.

### Other exact-run outcomes

- B0 Yaci characterization step 27: SUCCESS on this SHA; B0 remains OPEN because direct-Ready/fake-Ready SyncBeacon ledger twins, T07/T08 and independent security/owner disposition remain outstanding.
- Steps 25–34, including V3 carrier, active Reveal, FundTreasury, TicketIssued and Aiken V3 EXPIRE: SUCCESS as local-Yaci step evidence only.
- Evidence preservation, packet tests, upload and Notion evidence registration: SUCCESS.
- Overall lab: FAIL at step 35 only.
- No Preprod/Mainnet publication or user-wallet operation occurred in this diagnostic slot.

### Accepted disposition and next experiment boundary

1. The fresh generated factory is 16,309 bytes; applying the exact four current parameters produces a 16,443-byte V2 PrizeValidator (+134).
2. The remaining problem is not an unquantified factory/parameterization discrepancy. It is that the resulting V2 reference-script publication transaction is 156 bytes over the Cardano size limit.
3. No evidence identifies a Lucid/CML defect. No evidence yet proves a particular compiler option will reduce the script by at least 156 bytes.
4. A compiler-option comparison (first candidate: Plutus 1.67.0.0 `conservative-optimisation`) is the next bounded technical experiment, but it must be isolated from production, preserve the exact source/toolchain/parameters, and capture the changed script hash, complete publication CBOR size, all-action CEK costs and positive/negative conformance. Any changed artifact would change script identity and dependent B1PrizePool/MintPolicy bindings; it cannot be promoted based on size alone.
5. No source, compiler flag, dependency, ABI, validator, V2/V3, Reveal/Expire or economic semantics change is authorized by the successful diagnostic measurement.

Agent B explicitly returned the #46 write slot in [comment #6702888254](https://github.com/LiberoNuvola/Immortal-Protocol/issues/46#issuecomment-6702888254). The only tracked file changed by the slot is `audit/cardano-integration/expire-ledger-trace.ts`. Shared-branch writes may resume.


## 2026-11-07 — Agent A R1 / D3 two-layer model reconciliation

**Proposal update:** `docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md`  
**Clarification commit:** `40c49769b538e2dd80fc83c5bc79969a42356a9d`  
**Scope:** documentation-only; one proposal file updated.

Agent A recovered the historical Library note **D3 — Economic Engine for Agents** (2 Nov 2026) and reconciled it with the Canonical Economic Register and the three-value `RiskMode` scaffold.

### Key separation

1. **R1 / RiskMode** selects, for the authenticated candidate trajectory and profile, which analytical mechanisms are required: deterministic, statistical, or both. Their outputs remain distinct unless a versioned rule defines their joint role, units, horizon, perimeter and non-overlap.
2. **D3 / operating intensity** is a separate, historical non-normative PRE-RICH Arb Agent design: a permanent deterministic safety floor plus discretionary, state-dependent operating capacity above that floor. The recovered sketch uses `S_res=max(0, EEV-PC-L_dedicated)`, `B_t=alpha_t(S_res,class,stats)*S_res`, and `Notional<=min(B_t,RiskEnvelope)`. No coefficient, estimator, class threshold or combination rule is adopted.
3. D3's candidate C0–C3 capabilities are Observe/withdraw; micro one-leg; standard two-leg; and expanded operation only in a healthy regime. Separate high/low thresholds are proposed for hysteresis. Quiescence prohibits new exposure while permitting safe reduction/closure and withdrawal of uncommitted capital.
4. Open multi-leg exposure retains its worst-loss bound until close/expiry; unrealized gains are not harvestable. The historical Solo/Pool distinction requires segregated versus explicitly shared principal/NAV accounting, with no silent cross-user netting.
5. The D3 Arb Agent perimeter is separate from PRE-RICH Game PrizePool, Jackpot, ticket liabilities and Treasury. No automatic transfer of D3 mechanics to Scratch & Win is authorized.

### Disposition

The recovered D3 note is **design / non-normative relative to current repository**. Its dynamic budget is not `RawSurplus`, not a protected-reserve component, and cannot relax `ProtectedCapital`, `A_safe`, certified `Ω`, QNE or the Economic Gate. `RiskMode` is not the C0–C3 class selector; operating class is not a risk-analysis mode; Quiescence is not proof of `Ω).

No code, tests, workflows, economic constants, `500×`, `alpha_t`, `Z`, V3/Reveal, deployment, wallet, approval, certificate or ledger action changed. The original R1 proposal remains **PROPOSAL / specification-authority decision required**. R1/Kc/QNE and the first Issue blocker remain unchanged.


## 2026-11-07 — Agent B: PrizeValidator conservative-optimization probe runtime correction

**Failed workflow:** [PrizeValidator Conservative Optimization Size Experiment run #42356282755](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42356282755)  
**Tested commit:** `36fa878101bcd1cb15f0aea80b747c6b230ba8df`.  
**Job:** `compile-size-comparison` (job `128354964215`).  
**Failure boundary:** the canonical Plutus build and `export-scripts` completed. The generated measurement probe then failed before it wrote `baseline.json`, at the script-hash call, with `TypeError: Cannot read properties of undefined (reading 'validatorToScriptHash')`. The probe dynamically imported the `lucid-cardano` module namespace and incorrectly treated it as an instantiated Lucid object exposing `.utils`. The baseline integrity comparison was not reached; the candidate compiler profile was **not** compiled or measured. Therefore this run provides no evidence for or against `conservative-optimisation`.

**Restoration:** the workflow's unconditional restore step completed successfully; it restored the temporary Haskell source, generated factory and `plutus/out` state. The failure was in the diagnostic harness, not in Plutus compilation, validator execution, transaction construction or ledger validation.

**Correction already committed:** `705121a4c4549c46769d238d05b41a7071ffc1db` — `fix(ci): use exported Lucid Evolution hash helper in size probe`. The only changed path is `.github/workflows/prizevalidator-conservative-optimization-experiment.yml`; the probe now imports the exported `validatorToScriptHash` helper from the already-installed `@lucid-evolution/lucid` package and calls it directly. This mirrors the repository's existing Lucid Evolution helper usage. No production source, Plutus compiler option, script artifact, V3, Reveal, ABI, economic rule or deployment path was changed.

**Disposition:** diagnostic harness corrected; rerun result **PENDING / NOT YET VERIFIED**. On the rerun, first require the canonical baseline to reproduce the established factory/script byte lengths, digests and script hash before allowing the isolated candidate compile. Candidate size alone is not semantic, CEK-cost, publication-transaction or deployment qualification. Preserve the existing scope: diagnostics only; do not promote a changed script identity or touch V3/Reveal semantics.


## 2026-11-07 — Agent B: conservative-optimisation candidate rejected on size

**Successful corrected workflow:** [run #42359125101](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42359125101)  
**Tested commit:** `705121a4c4549c46769d238d05b41a7071ffc1db`.  
**Job:** `compile-size-comparison`, job `128363534196`; all steps 1–10 completed successfully, including the baseline guard, isolated candidate compile/measurement, cleanup and artifact upload.  
**Evidence artifact:** [artifact #13570121555](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42359125101/artifacts/13570121555), SHA-256 `5cb12852aa14137f889b8129abf8645120da0f9046c768ad6b5a625544e1fee7`.

### Exact result

The canonical baseline reproduced every guard value before candidate compilation:
- Fresh factory: **16,309 bytes**, SHA-256 `3c879feab921f4e39964baded675395c12bc20030c7843f2004017738aa37bf2`.
- Parameterized PrizeValidator: **16,443 bytes**, SHA-256 `9fec0f8342f0d1e55196dc57677222f45925087b46d0b15ca7c9aee8a5cf7036`.
- Baseline script hash: `508588a6ac5925b316b87f85adcc746808b4b29d2e13952184e7175b`.

With the only added compiler option `Plinth.Plugin:conservative-optimisation`:
- Candidate factory: **16,520 bytes**, SHA-256 `b24a7af259ec76d356b8cd8e51d8da0c5eaf8a7bdb8a5a9a064e6f651e2a49ab`.
- Parameterized PrizeValidator: **16,654 bytes**, SHA-256 `709ed21d4489d62e4c1553055134864c60fd9454285c065261c2886625a34893`.
- Candidate script hash: `54323dea3a02d4d6ccc0a7d3b9425af96607674452c0293c04b36ac4`.

**Delta:** candidate is **211 bytes larger** than baseline (−211 bytes saved). Applying the prior measured 97-byte non-script publication-envelope remainder solely as a projection gives **16,751 bytes**, 367 bytes above the Cardano 16,384-byte transaction limit. The conditional script threshold remains 16,287 bytes for that exact prior envelope; the candidate is 367 bytes above that threshold. No candidate publication transaction was built, so 16,751 is a projection, not a measured transaction.

### Disposition / boundary

- `conservative-optimisation` is **REJECTED for the size-reduction objective**. Do not carry this candidate into production or substitute its script artifact.
- The successful run establishes a compile-size comparison only. It does **not** establish CEK-cost equivalence, semantic equivalence, validator conformance, reference-script publication feasibility, Yaci behavior, Preprod readiness or deployment qualification.
- Candidate script identity differs from baseline. No dependent B1PrizePool/MintPolicy re-binding, artifact replacement, transaction, signing, wallet action, Preprod/Mainnet action or deployment was performed.
- The workflow's restore step passed. Haskell source, generated artifacts and temporary factory were restored; no production compiler pragma or Plutus artifact was committed.
- V3 carrier and Reveal semantics were not changed.

**Next step:** retain the canonical default compiler profile. Any further compiler experiment (for example, one separately isolated inline-growth/constant-inlining setting) needs its own explicitly bounded comparison and must retain the same baseline guard, exact source/toolchain/parameter provenance, changed script identity, full artifact and cleanup proof. Do not select a setting from a size result alone; any candidate that might fit must subsequently pass a separately authorized full semantic and CEK-cost conformance matrix before downstream identity rebinding is even considered.


## 2026-11-07 — Agent B: Aiken V3 migration qualification becomes primary Cardano Prize path

**Tracking issue:** [#48 — Aiken V3 PrizeValidator migration qualification](https://github.com/LiberoNuvola/Immortal-Protocol/issues/48).  
**Readiness audit:** `docs/COORDINATION/AGENT-B-AIKEN-V3-MIGRATION-READINESS-AUDIT-2026-11-07.md`.  
**Latest reviewed source head for the implementation update:** `d792d16304eea6441364a903bd5e399028ef1c1e`.  
**Decision:** Aiken Plutus V3 is the primary migration candidate; Haskell V2 is frozen as canonical differential reference/fallback. Further Haskell compiler-size experiments are suspended after `conservative-optimisation` made the parameterized script 211 bytes larger. No production substitution is authorized.

### Evidence baseline

- Cardano Lab [#42340114425](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42340114425): Aiken Reveal, Aiken Pending EXPIRE and the existing V3 carrier passed on synthetic local Yaci fixtures. Haskell V2 Pending EXPIRE failed before signing/submission at reference-script publication: 16,540 bytes against the 16,384-byte maximum.
- The Aiken package `poc/aiken-reveal-parity` is explicitly marked isolated prototype / not deployable; it is pinned to Aiken v1.1.22 and Plutus V3. Canonical Haskell PrizeValidator is Plutus V2. V2→V3 context, ledger-era, cost-model and transaction compatibility remain open.
- Earlier Aiken Claim trace was skipped because the step inherited implicit `success()` after Haskell failure.
- Aiken Prize dispatcher had no SyncBeacon branch; the catch-all rejects it. Aiken EXPIRE originally implemented Pending only, while Haskell also supports Revealed Loss and Revealed Win.

### Agent B implementation update

- `f36b3cbc1a8b05200a33339db0449ff98562f5c5`: Aiken Claim trace condition now uses `always() && steps.aiken-reveal-build.outcome == 'success'`.
- `c85a424e54e605d9036c12bb717440a770503047`: added Aiken EXPIRE status-specific Pending and Revealed accounting predicates plus five unit tests.
- `3d86dbf6334922af5ad4c126620ec25cc85585ad`: Cardano Lab now defines separate Aiken Pending, Revealed Loss and Revealed Win EXPIRE ledger traces.
- `d792d16304eea6441364a903bd5e399028ef1c1e`: removed the common Pending-only liability equality so Revealed Win can release its frozen unpaid liability.
- Readiness report published at the path above; Issue #48 records the acceptance gates and implementation commits.

### Exact-head CI observation

On `d792d16`, Cardano Integration Lab [#42367753185](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42367753185) and Aiken Reveal Parity [#42367753361](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42367753361) were in progress at the time of the audit. Adapter Sale Conformance, Aiken B1 PrizePool Claim Slice, IMMORTAL Portability Conformance and Algorithmic Governability completed successfully. Flux Point DoD Pilot and Documentation Link Check failed and are separate CI issues. **No PASS is claimed yet for the new Revealed EXPIRE branches or for the corrected Aiken Claim scheduling.**

### Acceptance gates and boundaries

1. Qualify pinned Aiken build and all three EXPIRE local-Yaci traces, including real B1PrizePool V2, exact accounting deltas and replay rejection.
2. Demonstrate that the Claim trace runs after Haskell failure and pass positive/adversarial settlement, oracle identity/publisher/freshness and pool tests.
3. Implement authenticated SyncBeacon Registry-reference-input handling and differential parity.
4. Complete Haskell/Aiken differential decisions and state effects for all Prize actions, constructor/field encodings, datums and adversarial contexts.
5. Qualify Plutus V3 on the intended Cardano target/network, including context, cost model, execution limits and complete transaction sizes.
6. Rebind Prize/B1PrizePool hashes and every dependent policy/reference-script/address/adapter/DApp/deployment reference only after all prior gates pass.
7. Local Yaci qualification precedes any separately approved Preprod plan.

No change was made to the existing V3 carrier, Haskell source/compiler flags, Reveal economics, 500×, KA/KC/KD, datum/redeemer ABI, EEV/USDM authority or first-Issue admission gates. No wallet signing, Preprod/Mainnet action or deployment occurred. Aiken remains a migration candidate, not a production-qualified validator.


## 2026-11-07 — Agent B follow-up: SyncBeacon source port and canonical Registry schema fixture

**Tracking:** Issue [#48 — Aiken V3 PrizeValidator migration qualification](https://github.com/LiberoNuvola/Immortal-Protocol/issues/48).  
**Detailed audit:** `docs/COORDINATION/AGENT-B-AIKEN-V3-MIGRATION-READINESS-AUDIT-2026-11-07.md`.  
**Source head at checkpoint edit:** `34afe24579403e8bcab803c6b7fd347b102dac7b`.

### Implementation added

- Aiken now defines the Haskell wire-compatible `BeaconRegistryDatum` (round, target, status, beacon value, mcHash, Materios context, relayer).
- New `sync_beacon_transaction.ak` reads the configured Registry script credential from reference inputs, decodes the Registry datum and checks Ready status, exact round/target, non-empty beacon, exactly one own Prize input and one continuing Prize output, preserved physical value, immutable ticket identity and exact Beacon/mcHash/Materios-context copy.
- Aiken Prize dispatcher now routes `SyncBeacon` to this transaction-level predicate. Registry ScriptHash is the first parameter of the isolated candidate; all Aiken Reveal/Expire/Claim/probe parameterization callsites have been aligned to the new parameter list.
- Haskell fixture producer adds a canonical serialized `BeaconRegistryDatum`; the Aiken fixture generator adds a byte-for-byte serialization check and CI now requires the key.
- Existing Aiken EXPIRE source branches and independent Claim workflow condition from the preceding checkpoint remain in place.

### New commits (in addition to the EXPIRE/Claim commits above)

`cff4ed08e5c9d703fba879bf6c695f898fce2f15`, `ca3886b36303a997af823696e860649127a46c07`, `39a09ff55bbe79ea48f57ca538ac77fb4e80203f`, `904302926d87eba596d331e5c225db8031cbaa9c`, `772f0aab4aa4cce74b43e26bf8ef3a64974f4655`, `4114743d30df2428ce71ca882ef13672ec1b9a06`, `bb6a47fba55d5eb658483fa4f03373729176e55f`, `a505e13923765ce8cd3b45a4f32cfb8e9d8c6442`, `4302835b8adea432e1efc043161b774e82379db4`, `ec4bd3b6bf9e45f2b409300311fbe3e2a76441d2`, `e4b88a82b94a4adfd41e9e3aeb7d5ef83e382d49`, `8a9d38bbf4150e605dc4425fd6d26bf4b02a7729`, `2663098630e61fb8f0a0371b34058ced53afbb0f`, `d8434c95a8178ff04ea1b0c4d0e315319672e26d`, `98593bad0ed47fe80e19a6ec727008535b56248d`, `134e636c6b343697f186bfe0f4764c75fac51dbb`, `34afe24579403e8bcab803c6b7fd347b102dac7b`.

### Verification still open

- The previous Aiken parity run at `d792d16` had passed `aiken check` and `aiken build`, but it predates SyncBeacon source/schema additions and cannot certify this head.
- The new exact-head Aiken Parity run was queued at `34afe245`; build, tests and Haskell-generated Registry datum serialization still require its result.
- A Cardano Lab run on an earlier head was still at the canonical Plutus setup step; all three Expire Yaci traces, Claim trace, and SyncBeacon Yaci behavior remain pending.
- Add adversarial Yaci fixtures for wrong/missing Registry, bad datum, round/target mismatch, non-Ready status, empty beacon, duplicate own input/output, altered identity and value. This is needed before calling SyncBeacon qualified.
- The existing V2→V3 compatibility and B1PrizePool hash-rebinding/deployment gates remain open. Aiken is the primary migration candidate, not production-qualified.

No change to Haskell production validator, V3 carrier semantics, Reveal economic rules, 500×, KA/KC/KD, datum/redeemer ABI, EEV/USDM source authority or first-Issue admission gates. No wallet signature, Preprod/Mainnet transaction or deployment has been performed.


## 2026-11-07 — Agent B: Aiken dispatcher compiler fix verified; full parity/Yaci still pending

**Latest source head at checkpoint edit:** `eb6688d98e219f003d191b605da16dd9f963bd47`.  
**Tracking issue:** [#48 — Aiken V3 PrizeValidator migration qualification](https://github.com/LiberoNuvola/Immortal-Protocol/issues/48).  
**Audit:** `docs/COORDINATION/AGENT-B-AIKEN-V3-MIGRATION-READINESS-AUDIT-2026-11-07.md`.

### Compiler error diagnosed and corrected

On head `51dc659`, Aiken failed with `aiken::check::redundant_pattern_match` at the wildcard `_ -> False` in `validators/reveal.ak`. All four current `PrizeAction` constructors were already explicitly matched. Commit `eb6688d` removes only the redundant wildcard; the explicit missing-datum failure and `else(_) { False }` remain.

### Exact-head verification

- Aiken B1 PrizePool Claim Slice [#42369160897](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42369160897): **SUCCESS** on `eb6688d`; pinned Aiken v1.1.22 `aiken check` and Plutus V3 `aiken build` both passed.
- Aiken Reveal Parity [#42369160948](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42369160948): still preparing the canonical Plutus toolchain at the time of observation; Haskell-generated fixture/serialization comparison not yet complete on the latest head.
- Cardano Integration Lab [#42369160963](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42369160963): workflow started, still installing isolated dependencies at the time of observation; no latest-head Reveal/Expire/Claim/SyncBeacon Yaci result claimed.
- On prior head `51dc659`, Haskell fixture generation succeeded and produced 13 Plutus Data encoding fixtures plus 11 compiled Haskell V2 CEK outcomes. The workflow then failed at Aiken check with the redundant-pattern diagnostic; no Aiken fixture parity result was accepted.

### Remaining gates

1. Latest-head Haskell/Aiken serialization parity and full Aiken parity workflow.
2. Cardano local-Yaci tests for Pending, Revealed Loss and Revealed Win Expire, plus Claim; keep their real B1PrizePool V2 limitation explicit.
3. Dedicated transaction-context/Yaci SyncBeacon positive and adversarial trace; pure transition tests are not enough.
4. Full differential action/state matrix, Plutus V2→V3 ledger/cost/context compatibility, full transaction resource measurements and coherent Prize/B1PrizePool hash rebinding.
5. Separately approved Preprod plan only after all prior gates pass.

Haskell V2 remains the unchanged canonical oracle/fallback; no further compiler-size experiments. Aiken V3 is the primary migration candidate, not yet production-qualified. Existing V3 carrier, Reveal semantics/economics, 500×, KA/KC/KD, datum/redeemer ABI, EEV/USDM authority and Issue admission gates remain unchanged. No Preprod/Mainnet activity or wallet signing occurred.

## 2026-11-07 — Agent B: decouple Haskell EXPIRE reference failures from Aiken/P2.8 CI

**Commit:** `32961d2efa22e1beef39498dc81220f06ef5f486`  
**Path:** `.github/workflows/immortal-cardano-lab.yml`  
**Tracking:** [Issue #48](https://github.com/LiberoNuvola/Immortal-Protocol/issues/48)

Run [#42369304644](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42369304644) established successful Aiken Pending, Revealed Loss and Revealed Win EXPIRE ledger traces and successful Aiken Prize + Haskell B1PrizePool Claim trace. The Haskell V2 Pending EXPIRE diagnostic failed before submission because the reference-script publication transaction measured 16,540 bytes against the 16,384-byte transaction limit. This is a resource/build failure, not evidence of a semantic Plutus rejection.

The workflow now marks all three Haskell V2 EXPIRE traces `continue-on-error: true`, assigns stable step IDs to Revealed Loss/Win and registers their separate `outcome` values in JEV. This preserves a visible Haskell `failure` without allowing it to suppress downstream P2.8 context materialization, UTxO decoder, evidence gate, resource audit and invariant checks.

**State:** workflow change committed and read-back verified. The new push-triggered run on `32961d2` is pending; its result must be inspected before closing this CI separation task.

No validator/source semantics, V3 carrier, Reveal economics, ABI, economic constants, EEV/USDM authority, or deployment path changed. No Preprod/Mainnet action or wallet signature occurred.

## 2026-11-08 — Agent A: dual-layer / RiskMode / PRE-RICH cohort-policy reconciliation

**Scope:** coordination and research disposition only. No production implementation, test, workflow, parameter, V3/Reveal, wallet or ledger action.

### Recovered model — three distinct mechanisms, not one global switch

1. **D3 — dynamic operating intensity:** the 2 Nov Library design is explicitly non-normative and belongs to PRE-RICH Arb Agent, not Scratch & Win. It describes an always-on deterministic floor (`ProtectedCapital`, `A_safe`, admissible `Ω`) plus a state-dependent discretionary budget above the floor:
   `S_res = max(0, EEV - ProtectedCapital - L_dedicated)`,
   `B_t = α_t(S_res, class_t, stats_t) × S_res`,
   `Notional ≤ min(B_t, RiskEnvelope)`.
   C0–C3, hysteresis and Quiescence regulate Arb Agent operating intensity. Agent capital, open exposure and Solo/Pool accounting remain separate from Game PrizePool, Jackpot and ticket liabilities.
2. **IMMORTAL R1 — trajectory-specific analytical RiskMode:** the Canonical Economic Register supports selecting Worst-Case Analysis, Statistical Risk Analysis, or both according to an authenticated trajectory/profile. The mechanisms are distinct, not automatically additive or interchangeable. No universal replacement formula or global binary switch is canonical. A user, DApp, relayer or caller cannot choose a weaker analysis for convenience.
3. **PRE-RICH Game statistical cohort profile:** this is a separate application-policy proposal, not an implementation consequence of D3 or the R1 enum. It would define a new probabilistic guarantee for a specific immutable cohort. It requires an explicit specification-authority decision before implementation.

### Capacity frontier — research only

For the exact Classic-6 two-row ticket PMF, Genesis tickets at P=1 USDM, independent ticket outcomes, no extra obligations and a hypothetical **4,000 USDM already eligible and ring-fenced in PrizePool**:

| Lifetime cohort tail ceiling | Maximum unresolved tickets (research) |
|---:|---:|
| 0.1% | 3,579 |
| 0.5% | 4,028 |
| 1.0% | 4,248 |

These are probabilistic cohort capacities, not 500× guarantees and not currently admissible limits. A Gaussian moment shortcut with Z=3.09 is not an adequate substitute: at N=4,114 the exact finite-distribution tail was about 0.658913%, not 0.1%. Mixed ticket classes require class-aware distributions, not average-price scaling.

### Current production capital and admission boundary

- PRE-RICH V1 still applies deterministic unresolved-ticket WCE = 500 × Σ(P_i × N_i). With 4,000 USDM of **actual eligible PrizePool liquidity**, the pure Genesis limit is 8 unresolved tickets.
- The 4,000 Genesis bootstrap is a PRE Treasury threshold; it does not establish a 4,000 USDM PrizePool balance. The inspected Issue transaction pays the sale settlement basket to Treasury and preserves B1 PrizePool physical Value / total liquidity on TicketIssued. Current Issue-time Pool receipt allocation is therefore f=0.
- No production authenticated Treasury→PrizePool funding path was established in the reviewed source set. Historical f=25/50/60% simulation scenarios are not current capacity evidence.
- `ppUnresolvedReserve` remains face-price accounting (ΣP_i); deterministic WCE is derived separately; statistical cohort/path assessment is a third distinct object. Do not rename or repurpose the datum field as a statistical reserve.

### Agent B independent review — 8 Nov 2026

Agent B's independent source cross-review on HEAD `07248f8664c4651a5538903b43c3f6f41c435f18` confirms:
- the actual PRE-RICH V1 Issue/B1 path fixes the 500× floor and does not accept RiskMode input;
- RiskProtectionBridge remains deterministic-only and fail-closed for StatisticalOnly / DeterministicAndStatistical; it is not wired into PreRichEconomicAdmission;
- R1 remains incomplete as an authenticated state/action/policy/evidence resolver; the R1/Kc/Ω certificate remains missing;
- the current Issue-admission path still has a configured signed-authority dependency and must not be described as fully permissionless/trustless;
- the first real Preprod Issue remains BLOCKED under Issue #37.

### Disposition / next gate

The dual-layer concept is recovered, but its D3 form is an Arb Agent design. For Scratch & Win, capacity above the deterministic 8-ticket illustration is possible only as a separately approved statistical cohort guarantee, or with additional real eligible capital / a qualified deterministic backstop. It cannot be obtained while simultaneously claiming the unchanged unconditional 500× guarantee on the same 4,000 USDM pool.

Before any implementation, specification authority must decide whether PRE-RICH Game may adopt a statistical cohort profile and, if so, its lifetime/global ε, eligible-capital perimeter, cohort/model/horizon/dependence contract, path-risk criterion, transition/recovery policy, and immutable version binding. Until then V1 remains unchanged and fail-closed.

**Evidence:** [Agent A capacity analysis](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6704197472) · [cash-flow / class-mix extension](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6704380744) · [Issue/Pool/Treasury source trace](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6704392984) · [statistical cohort policy contract](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6704450038) · [Agent B independent review](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6717575698) · [D3 source note](https://app.notion.com/p/3d9c4454d6d581e680d5e5d3f3a9df79?pvs=204).
## 2026-11-08 — Agent A: permissionless automatic selector target

The R1 proposal now records a separate target contract for the required permissionless / automatic / trustless architecture. This does not claim current production conformance.

### Hard target constraints

- Any user/keeper/relayer may submit a candidate; no caller may choose RiskMode, policy version, risk budget or evidence validity.
- The selector is deterministic and profile/trajectory-bound over authenticated pre-state, action, post-state/projection, policy and evidence commitments. Required analysis is chosen before results are evaluated; there is no fallback to a weaker mode after failure.
- Off-chain statistical computation is acceptable only when any party can generate a witness/proof that the canonical verifier can validate. A backend scalar, enum or single signer assertion is insufficient. If the statistical proof cannot fit the target ledger/resource envelope, that mode remains unavailable.
- Cohort/global risk-budget allocation must be atomic and concurrency/replay safe. A reference-only read of a budget UTxO is not a lock.
- Ticket/cohort terms are immutable; automatic regime changes apply to new Issue/new cohorts only. Existing ticket rights and crystallised liabilities remain unchanged.
- Quiescence stops new exposure but preserves existing Reveal/Claim/Expire/settlement.
- D3 Arb Agent intensity remains separate from PRE-RICH Game statistical cohort policy.

### Current limitation confirmed

Agent B's review records a configured Ed25519 authority binding in the current Issue-admission path and confirms RiskProtectionBridge is not wired into PreRichEconomicAdmission. Consequently production is not yet fully permissionless/trustless and statistical/combined modes remain fail-closed. Removing that dependency requires a separate proof-backed design; no signer substitution is authorised.

**Proposal update:** [Agent A R1 trajectory-to-RiskMode contract, §10](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md) · [Agent B independent review](https://github.com/LiberoNuvola/Immortal-Protocol/issues/37#issuecomment-6717575698).

**Status:** design target recorded; no implementation, parameter, risk appetite, policy approval, code test, V3/Reveal, wallet, deployment or ledger change.
## 2026-11-08 — Agent A: dependence-robust statistical bound / Reveal-path audit

**Research artifact:** [AGENT-A-CANTELLI-COHORT-BOUND-AND-REVEAL-PATH-AUDIT-2026-11-08.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-CANTELLI-COHORT-BOUND-AND-REVEAL-PATH-AUDIT-2026-11-08.md)  
**Commit:** `d53925aa14b4eef67c34891596e8ab3477c55e8f`  
**Scope:** mathematical/source feasibility only; no implementation or policy approval.

### New mathematical candidate

From the exact Classic-6 ticket PMF:
- `μ = 20799/32000 = 0.64996875`
- `E[Y²] = 180693501/4000000`
- `σ² = 9164987571/204800000 ≈ 44.7509158740`

For ticket prices `P_i`, unresolved face amount `F = ΣP_i`, and aggregate payout `S = ΣP_iY_i`, Cauchy–Schwarz gives `Var(S) ≤ σ²F²` without assuming cross-ticket independence, provided each ticket retains the canonical marginal payout distribution. Cantelli therefore gives an upper bound:
`Pr(S>C) ≤ σ²F² / (σ²F² + (C−μF)²)`, for `C>μF`.

For a rational ceiling `ε=a/b), the static-cohort bound is exactly checkable by integer arithmetic:
`D = 32000C − 20799F > 0`
`5(b−a)9164987571F² ≤ aD²`

Under a hypothetical 4,000-USDM *total payout budget* and Genesis-only cohort, the resulting dependence-robust upper-bound capacities are 18 / 42 / 59 at ε of 0.1% / 0.5% / 1.0%, respectively. These are mathematical sensitivities only, not approved ticket limits, not current Pool capital and not an unconditional 500× guarantee. No Plutus resource benchmark has been run.

### Blocking source findings

- Issue commits the player secret before the matching BeaconRegistry leaves `BeaconPending`; Reveal later receives that secret and derives the result from the public Beacon. This supports a commit-before-beacon requirement, but does not prove Beacon entropy, unpredictability or resistance to publisher grinding.
- `BeaconRegistry.hs` explicitly does not independently verify the external Materios receipt; it validates the configured relayer signature and deterministic Beacon derivation. The marginal PMF therefore remains conditional on an unclosed randomness trust boundary.
- B1 `TicketRevealed` checks the payout against the **pre-transition** effective Pool, then increases pending liabilities, releases face-price reserve and preserves physical liquidity. The available amount changes with Reveal order.
- **Fixed-cohort worst-order formula:** for a fixed outcome vector, the minimum initial B1 effectivePool needed to make every Reveal ordering pass its pre-transition payout check is `R_max = Σ_i max(0, X_i−P_i) + max_i min(X_i,P_i)`, where X_i is the payout and P_i the face price. This is derived by maximizing each prefix requirement `X_current + Σ(previous reveals)(X−P)` over all permutations. An exploratory enumeration checked the closed form against all permutations for 600 random fixed-cohort vectors with at most six tickets (not a repository test).
- Since `R_max ≤ S = Σ_i X_i`, the simpler sufficient condition `S ≤ E0` guarantees every Reveal ordering and Pending Expire interleaving passes the B1 pre-Reveal affordability check for a fixed cohort. Therefore Cantelli's `Pr(S > E0)` upper bound conservatively bounds this fixed-cohort affordability failure probability, provided no additional Pool-draining Issue or other outflow occurs during resolution. This is conservative, not tight.
- Once the Beacon is Ready, the ticket holder can compute the result before submitting Reveal; Reveal order is therefore a strategic path variable. Withholding a losing ticket does not increase the sum of its fixed outcomes, but reserve-release timing still matters. The fixed-cohort lemma covers that ordering conservatively only when `C=E0` is derived from the exact pre-Reveal effective Pool.
- The cohort budget `C` has not yet been qualified from physical PrizePool Value, pending liabilities, face-price reserve, Jackpot, safety capital and any overlapping cohorts or new-Issue interleavings. It must not be equated to gross Treasury bootstrap or gross Pool Value.

### Disposition

The Cantelli predicate is a promising constant-size integer verifier for a **static fixed cohort**, but it is not yet an admissible Issue rule. Next gates are: (1) extend the fixed-cohort path lemma to overlapping cohorts/new-Issue interleavings and derive the shared capital perimeter, (2) independently qualify Beacon/marginal-randomness assumptions, (3) implement exact-integer reference/property tests, and (4) benchmark Plutus CEK / full-transaction resources. Only then should the specification authority consider a new statistical profile and lifetime/global ε.

PRE-RICH V1, deterministic 500×, current RiskProtectionBridge fail-closed behavior, V3/Reveal semantics, deployment and first-Issue gates remain unchanged. No code or tests were modified or executed by this research update.


## 2026-11-08 — Agent A: global multi-round cohort bound / adaptive-Issue boundary

**Research artifact:** [AGENT-A-CANTELLI-COHORT-BOUND-AND-REVEAL-PATH-AUDIT-2026-11-08.md](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-CANTELLI-COHORT-BOUND-AND-REVEAL-PATH-AUDIT-2026-11-08.md), §8.  
**Classification:** RESEARCH ONLY; static mathematical extension, not implementation or policy approval.

### Static result across active Beacon rounds

The risk set for a shared B1 PrizePool is the union of all Pending tickets **enrolled in one frozen risk epoch across selected BeaconTarget / rounds**, counted once. To use unconditional moments, every included round must still be BeaconPending and the epoch membership must be closed before the first included outcome becomes available to an adversarial ticket holder; later Issues are not auto-added. A Pending ticket from an already BeaconReady round remains in its prior epoch or requires separate conditional-moment / capital evidence; it cannot be re-labelled as a fresh draw. For a pre-specified fixed set (U^*), aggregate face value (F^* = ΣP_i), authenticated initial B1 (E^*) and aggregate potential payout (S^* = ΣX_i), the same Classic-6 Cantelli bound applies if every ticket retains the canonical marginal law. Source cross-check: MintPolicy binds every new ticket to the configured B1 PrizePool hash, while `atomicPoolReservationValid` increments the single Pool's aggregate `ppUnresolvedReserve` by that ticket's price. This proves shared face-reserve accounting only; the current Pool datum does not implement epoch membership freeze, membership closure, ε allocation or ring-fenced capital. Cauchy–Schwarz supports arbitrary dependence between tickets and between rounds. Do not compute separate per-round limits against the same Pool as if each round had its own capital.

The exact fixed-set Reveal path requirement also aggregates over all rounds:

```text
R_max(U*) = Σ_i max(0, X_i − P_i) + max_i min(X_i, P_i) ≤ S*
```

Thus (S^* ≤ E^*) is sufficient for all Reveal/Expire orderings across a frozen multi-round set, provided there are no new Issues or other Pool-draining outflows while it resolves.

### Dynamic Issue is a separate blocker

This does **not** authorize reapplying unconditional (μ,σ) after outcomes have become available. With arbitrary dependence, observing one payout can make another ticket's payout conditionally known (e.g. (Y_2=Y_1)); after Reveal/Beacon availability and strategic withholding, the remaining Pending set can be outcome-selected. New Issues admitted at that point require a conditional-moment proof valid over the full adversarial information history, including ticket-holder private information, or another formally bounded construction.

A possible conditional envelope is (M_t=ΣP_i μ_i(H_t)), (V_t≤(ΣP_i σ_i(H_t))²), then conditional Cantelli against current (E_t), only where (E_t>M_t) and the bounds are proven. Current sources do not supply this contract.

### Lifetime budget / capital non-overlap

One `ε` cannot be freshly reused for each Issue or state refresh. A governing specification must select one frozen aggregate risk set, or allocate conditional epoch budgets `ε_j` with `Σ ε_j ≤ ε_global` (or prove an alternative global supermartingale/alpha-spending rule). If epochs overlap in one Pool, their capital tranches must be disjoint/ring-fenced or covered by one joint aggregate bound. Per-cohort `C_j` values that all point at the same unpartitioned `effectivePool` would double-count capital.

### Disposition / boundaries

- **Research-level extension closed:** static multi-round aggregate with one common marginal PMF, arbitrary cross-round dependence, and one fixed shared Pool.
- **Still blocked:** adaptive/new Issue after outcomes become available; conditional private-information model; heterogeneous profile moments; global lifetime epsilon; capital ring-fencing; authenticated (E^*); Beacon qualification and Plutus resource evidence.
- No production source, test, risk parameter, profile, V1 500×, RiskProtectionBridge, V3/Reveal semantics, wallet, deployment or ledger state changed.
- Agent A owns the economic/risk contract; Agent B's independent V1/Plutus review remains separate.


## 2026-11-08 — Agent A: two-axis risk selection and adaptive intensity synthesis

**Detailed baseline:** [Agent A-R1 Dynamic Margin / Statistical Reserve Baseline, §13](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-R1-DYNAMIC-MARGIN-STATISTICAL-RESERVE-BASELINE-2026-11-06.md).  
**Related multi-round proof:** [Cantelli / Reveal-path audit, §8](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-CANTELLI-COHORT-BOUND-AND-REVEAL-PATH-AUDIT-2026-11-08.md).

### Two independent axes

1. **Risk-analysis mode**: profile-owned, trajectory-bound selection among DeterministicWorstCaseOnly / StatisticalOnly / DeterministicAndStatistical. It must be resolved from authenticated pre-state, candidate action, trajectory facts and versioned policy; not supplied by caller. Current PRE-RICH V1 and RiskProtectionBridge accept deterministic-only. No production selector exists. Where the profile mandates a deterministic floor, StatisticalOnly cannot suppress it; changing the payout trajectory to a statistical guarantee requires an explicit profile/authority decision and cannot be described as retaining 500× pathwise coverage.
2. **Operating intensity**: a separate post-protection allocator can cap optional new notional using state-dependent surplus and a distinct risk envelope. The recovered D3 S_res / α_t / C0–C3 model belongs to the PRE-RICH Arb Agent with separate Solo/Pool capital, not Scratch & Win Game. PRE-RICH Game class hysteresis KA/KC/KD and lifecycle regimes are different controllers.

The static Cantelli multi-round result is a candidate Statistical Risk Analysis for one sealed pre-outcome risk epoch. Every included round must still be BeaconPending at the common freeze boundary and membership closes before the first included outcome becomes available; later Issues are not auto-added. Pending tickets from already BeaconReady rounds remain in their previous epoch / separately allocated capital or require conditional-moment evidence. A new epoch's headroom must be E*_new = effectivePool_B1 − C_other, where C_other is authenticated capital ring-fenced to excluded epochs (excluding known liabilities / face reserve already deducted); current B1 datum cannot authenticate C_other. It has no explicit epoch-membership/freeze or capital-tranche fields. It is neither WCE nor ProtectedCapital/ReserveProtection nor an α_t budget. It also cannot be merged opportunistically with Nμ+Zσ√N; the profile authority must choose the statistical criterion and version.

### Capacity consequence

At hypothetical C=4,000 USDM: current V1 500× deterministic WCE remains 8 Genesis tickets. Cantelli yields 18 / 42 / 59 **combined across all rounds enrolled in that one sealed epoch** at global ε=0.1% / 0.5% / 1%, but only under the frozen-set marginal assumptions; it is not a quota for each future round or epoch. These higher figures are not available while retaining 500× pathwise coverage for the same unresolved payout exposure. A larger statistical capacity requires an explicit new PRE-RICH Game profile decision about the applicable payout-risk guarantee; it would be probabilistic, not the current unconditional 500× guarantee.

### Disposition

The static proof and two-axis conceptual reconciliation are research/documentation only. Dynamic Issue after outcomes become knowable, Game-specific intensity policy, global lifetime ε, conditional moments, capital qualification, Beacon qualification, Gate integration and specification authority decisions remain open. No production code/tests, policy parameters, 500×, ProtectedCapital, V3/Reveal, QNE/R1, wallet, deployment or ledger state changed.


## 2026-11-08 — Agent A: explicit RiskMode state/action resolver matrix

**Detailed contract:** [Trajectory-to-RiskMode proposal §11](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md).

### Verified applicability boundaries

- PRE-RICH Sale algorithm lists both deterministic exposure and statistical-reserve evaluation. However, current V1 WCE 500× remains mandatory; current code/Gate implements deterministic only. The statistical evaluation's role (reporting versus binding admission criterion), Z/confidence/horizon/epoch and acceptance rule remain unresolved. Record a source-to-implementation gap; do not claim D+S production conformance.
- Reveal crystallizes actual payout into a known liability; Claim settles it; Expire closes the right. None is a fresh unconditional payout draw or a budget reset.
- Classic-6 payout moments do not model EEV / market-liquidity risk.
- Arb Agent D3 intensity is a separate application/capital profile, not Game RiskMode.

### Resolver target

Derive one unique required-analysis set from authenticated profile, pre-state, action, candidate post-state and trajectory evidence. Caller-supplied mode is rejected. Missing/ambiguous policy predicates or missing required model/proof fail closed. Any automatic state-based mode change is profile/version-bound, replay-safe and applies only to new commitments; existing ticket terms remain immutable. Universal invariants, known liabilities, mandatory deterministic floors and Ω viability remain mandatory.

**Authority decisions still OPEN:** Issue statistical role; selected statistical construction and parameters; state/regime predicates and hysteresis; lifetime ε/epoch/capital allocation; proof format/resource bound; and any new Game-specific probabilistic guarantee. No code/tests, 500×, RiskProtectionBridge, V3/Reveal, QNE/R1 or deployment semantics changed.

## 2026-11-08 — Agent A: PRE-RICH Sale statistical-reserve decision packet

**Detail:** [Trajectory-to-RiskMode proposal §12](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md#12-pre-rich-sale-statistical-reserve-decision-packet).

### Source reconciliation

- PRE-RICH Economic Algorithm explicitly includes “evaluate statistical reserve” in the Sale sequence. Game Economy §4 defines the reference Classic-6 statistic N × μ + Z × σ × sqrt(N), with Z a deployment/model parameter, and says it does not replace deterministic worst-case protection.
- The canonical Economic Register keeps deterministic and statistical risk as distinct trajectory-dependent mechanisms and does not approve a universal additive formula or automatic replacement rule. The Sale sources still do not decide whether the statistical output is monitoring-only or a binding second criterion.
- Three state quantities are separate: B1/V3 face-price reserve ΣPᵢ; V1 deterministic WCE = 500 × ΣPᵢ; statistical payout-risk assessment. The generic ReserveProtection field has no proven mapping to the Classic-6 statistic.
- B1 TicketIssued records face price; B1LegacyAdapter / PRE-RICH V3 projection derive 500× separately. EconomicGate and current PreRichEconomicAdmission do not consume a statistical assessment. RiskProtectionBridge remains deterministic-only, rejects statistical/combined modes and is not wired into admission.

### Current disposition

V1's 500× hard floor remains unchanged. The statistical Sale evaluation is an explicit source-to-implementation/specification gap: Z, mixed-price cohort aggregation, horizon/confidence, cross-ticket/Beacon dependence, capital comparator and binding effect are unresolved. Do not infer report-only, do not invent a reserve addend, and do not claim D+S production conformance.

At hypothetical 4,000 USDM of actual eligible Pool capital, V1 remains limited to 8 Genesis tickets. Cantelli research figures 18 / 42 / 59 at global ε of 0.1% / 0.5% / 1% are a distinct sealed-cohort sensitivity and cannot lift capacity while the same 500× pathwise guarantee remains mandatory. Increased capacity requires a separately approved probabilistic or hybrid profile for new commitments; existing tickets remain immutable.

**Authority choices:** S-OBSERVE (non-binding measurement), S-GATE (separate criterion with V1 floor retained), S-COHORT (new probabilistic guarantee) or S-HYBRID (qualified deterministic backstop plus statistical criterion). No option, Z/ε, horizon or admission predicate is selected by this work.

No code, test, workflow, branch topology, V1 constant, V3/Reveal semantics, datum/redeemer ABI, wallet, deployment or ledger state changed. No CI run was started.

## 2026-11-08 — Agent B: statistical Issue decision binding contract

**Proposal:** [AGENT-B-R1-STATISTICAL-ISSUE-BINDING-CONTRACT-PROPOSAL-2026-11-08.md](AGENT-B-R1-STATISTICAL-ISSUE-BINDING-CONTRACT-PROPOSAL-2026-11-08.md)  
**Baseline reviewed:** \`d67997372c9605910167f06f2cf67bc89c7a8215\`  
**Proposal commit:** \`71d0faf4af6fe4ad4bc12fa6a680cd1b0af5f894\`  
**Classification:** non-normative technical contract; no implementation authority.

The contract binds a future RiskDecision to the exact Issue action and state transition, a complete pre-outcome cohort, the exact B1 Pool snapshot and non-overlapping capital perimeter, the game/Beacon randomness evidence, the model/policy version and a reproducible integer calculation.

### Agent B findings recorded

- Current PRE-RICH V1 and B1 independently preserve the deterministic 500× floor; a statistical certificate alone cannot increase current V1 capacity.
- The current RiskProtectionBridge remains deterministic-only and is not wired into PreRichEconomicAdmission.
- The current V3 Carrier has a configured Ed25519 authority-signature dependency; BeaconRegistry relies on a configured relayer signature and does not independently verify the external Materios receipt. The current path therefore cannot be described as fully permissionless/trustless.
- The B1 effectivePool accounting value is Oracle-valued; direct physical tUSDM, executable settlement liquidity and the B1 accounting predicate must not be conflated.
- The current Pool datum does not commit a complete cohort membership root, epoch freeze or disjoint capital tranches. A Merkle root alone does not prove membership completeness.
- The static Cantelli candidate remains conditional on valid ticket marginals, a pre-outcome freeze, qualified Beacon evidence, a non-overlapping capital budget and no unmodeled Pool-draining outflow.

**Next gates:** policy authority decision; Beacon/randomness qualification; authenticated Pool capital and C_other disjointness; permissionless append/freeze state machine; removal or explicit governance of configured signer/relayer dependencies; exact-integer reference/property tests and Plutus/transaction resource benchmarks.

No production code, test, workflow, RiskMode, V1 500×, V3/Reveal, datum/redeemer ABI, oracle, wallet, deployment or ledger state was changed or run by this proposal.


## 2026-11-08 — Agent B: Cardano cohort accumulator / freeze feasibility

**Proposal:** [AGENT-B-CARDANO-COHORT-ACCUMULATOR-FREEZE-FEASIBILITY-2026-11-08.md](AGENT-B-CARDANO-COHORT-ACCUMULATOR-FREEZE-FEASIBILITY-2026-11-08.md)  
**Exact baseline reviewed:** \`f62ed27d4f985e30686adabcd76adcadcf4c502c\`  
**Proposal commit:** \`4433fada252edcfa2a86ae31b274dbfb6c86c1e0\`  
**Classification:** READ-ONLY FEASIBILITY / NON-NORMATIVE.

### Findings

- A Cardano UTxO cohort accumulator is technically possible, but every eligible Issue must atomically append to it; off-chain lists or a bare Merkle root do not prove cohort completeness.
- The current MintPolicy, B1 \`TicketIssued\` and PrizeValidator paths do not require/update a cohort state. The current Registry reads select the first payment-ScriptHash match and do not authenticate a unique per-round identity.
- Issue #43's B0/Yaci evidence has characterized fake-Ready and reference-order findings. Issue #49 must resolve per-round identity/publisher binding and the unique Registry read contract before Registry state can guard a statistical freeze.
- A freeze barrier must be enforced by every per-round RegistryPublish validator, not just by an off-chain observer. Its objective trigger must prevent both premature third-party freeze and privileged-only control.
- The minimal safe shape is one OPEN/FROZEN cohort per global B1 Pool, with new Issue paused while that epoch resolves. Continuous Issue across overlapping cohorts requires a ledger-enforced capital partition and B1 payout ownership rules that do not exist in the current Pool datum/validator.
- The current B1 500× floor remains mandatory; no statistical capacity increase follows from an accumulator alone.

### Next dependencies

1. Issue #49 authenticated per-round Registry design and separate implementation authorization.
2. Explicit cohort freeze/liveness policy.
3. Qualified capital predicate and non-overlap/lifetime-risk contract.
4. Accumulator encoding/implementation and native-ledger adversarial conformance, including CEK/transaction-size measurements.

No code, tests, workflow, ABI, B1/Registry/Prize/MintPolicy/V3/Reveal semantics, policy parameter, economic constant, deployment, wallet or ledger state changed or executed.


## 2026-11-08 — Agent B: Issue #49 trustless Factory readiness / governance and target dependency audit

**Research artifact:** [AGENT-B-ISSUE49-TRUSTLESS-FACTORY-READINESS-2026-11-08.md](AGENT-B-ISSUE49-TRUSTLESS-FACTORY-READINESS-2026-11-08.md)  
**Exact reviewed HEAD:** `0cc3e4f077e5f6544dfeff2894f42b805121f49c`  
**Artifact commit:** `77b7f23a3cec42f4a72b7b54572a492de4a758ba`  
**Artifact blob:** `d360a6cb729b1d6a858d7841056572bf8eee9c63`  
**Classification:** DESIGN / READINESS AUDIT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY.

### Disposition

- A single Factory STT per game/deployment namespace remains the preferred candidate for unique per-round identity and replay prevention; separate Registry UTxOs can coexist.
- The STT authenticates identity issuance but does **not** authenticate the selected target or prove application governance adoption.
- The protocol-owner clarification rejects any privileged per-round opener signature, including RoundDefinitionAuthority, B1 publisher, relayer, keeper, maintainer, administrator, or off-chain service.
- The current governance Haskell snapshot/event model is not a Cardano-verifiable canonical governance state. PRE voting snapshot authenticity and denominator completeness remain unproven, and the exported Plutus script set contains no governance validator/state carrier.
- The deterministic rule for the complete `BeaconTarget`, especially `mainchainRef`, remains unspecified/unproven. B1 publisher may publish an observation for an already-determined target; it cannot choose the target.
- A candidate acyclic hash dependency is documented: independent Registry hash → Factory STT parameterized by Registry hash → consumers parameterized by Registry and Factory IDs. This is a design candidate only; actual multipurpose purpose handling, script hashes, CEK and transaction-size evidence remain mandatory.
- Existing seven-field Registry datum can remain the first candidate ABI by carrying identity in Value, provided Factory creation authenticates the publisher field and RegistryPublish preserves identity plus complete Value.
- Legacy Registry outputs without the identity token must fail closed. Existing live ticket compatibility needs an inventory and separately reviewed migration/legacy path.
- Issue #43 remains release-blocking. Issue #37 first-Issue gates are unaffected.

### Next gates

1. Design and independently review a Cardano-verifiable governance/genesis/configuration state, including authentic and complete PRE snapshot proof under the existing non-custodial voting rules.
2. Specify deterministic, authenticated derivation of the full BeaconTarget before B1 publication.
3. Reproduce current Haskell V2 artifact sizes and establish Factory/Registry hash topology and CEK/transaction-size feasibility before implementation.
4. Obtain a separately authorized implementation slot with exact HEAD and bounded paths.

No code, ABI, tests, workflow, CI run, wallet action, transaction, deployment, or ledger state was changed or executed by this audit.

## 2026-11-08 — Agent A: source-level multi-provider oracle boundary audit (Option B)

**Detailed audit:** [PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md §47](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md#47-agent-a--source-level-multi-provider-oracle-boundary-audit-and-target-architecture--2026-11-08).

### Verified implementation boundary

- `OracleQuoteSet` in `Adapter/CARDANO/observation/OracleTypes.hs` is a **multi-asset** container: it can hold one quote for each distinct asset identity. `lookupOracleQuote` rejects duplicate matches for the same policy/name, even from different publishers. It is not a multi-provider consensus set.
- `Economic.oraclePriceFor` uses one configured Oracle State singleton and one configured publisher, requires a unique matching asset quote and freshness against the transaction validity upper bound, and returns that single integer price. Current quote schema lacks source/feed ID, network, base/quote direction, explicit exponent/rational denominator, confidence and a source-set proof digest.
- MintPolicy Treasury valuation, PrizeValidator Claim valuation and B1PrizePool payout/Pool valuation all call the current `totalUsdmValue` path with one configured Oracle State/publisher. `src/genesisTreasuryObservation.ts` also reads a single singleton and its current parser is legacy five-field shape.
- Existing `EconomicOracleTest.hs` proves multi-asset basket support and duplicate rejection; its Pyth-binding characterization explicitly shows that an unqualified candidate quote is not consumed and the configured legacy Oracle State remains authoritative. It is not a Pyth or multi-provider integration pass.

### Provider/source status for Option B

Pyth Lazer, DIA Cardano Oracle, Orcfax CER, Charli3 and Cardano DEX two-leg routes are distinct provider/market leads, not a currently qualified multi-provider USD/USDM set for the exact Preprod tUSDM unit. The source memo records stale historical Charli3/Orcfax observations, a DIA custom-feed/Preprod gap, Pyth entitlement/feed-unit gaps, and Mainnet DEX research that cannot be substituted for the Preprod asset. Option B remains the approved approach; the USD/USDM source remains NOT QUALIFIED.

### Target architecture (proposal only)

A true multi-provider path requires independently verified provider-specific witnesses; exact asset/network/direction and rational price/exponent metadata; a versioned governed source-set; cross-provider reconciliation under an explicit authority-approved rule; exact rational two-leg composition where used; source-set hash and evidence binding; and on-chain verification so any participant can assemble/submit a candidate while relayers/indexers remain liveness-only. Missing, stale, duplicate, equivocal or out-of-policy inputs must fail closed.

No quorum size, source count, dispersion tolerance, confidence cut, timestamp skew or aggregation method is selected here. No Oracle schema, `OracleQuote`, `Economic.totalUsdmValue`, MintPolicy, PrizeValidator, B1PrizePool, deployment or ledger semantics are changed. This audit is documentation/source review only; no tests or CI were run.
### Additional trust boundary — publisher field is not a signature proof

Further source review of `Economic.oraclePriceFor` and `PRE-RICH/onchain/GenesisRegimeCarrier.hs` finds that consumers compare the datum's `oqPublisher` field with a configured publisher key, verify singleton-token presence, freshness and non-negative price, but do not themselves verify a publisher signature or a provider-specific signed-update witness. The consumer also does not bind the quote to a provider validator/payment credential. This may be supplied by the upstream source contract, but EV1/EV2 must pin and prove that exact policy/validator/update path; the publisher field alone is not proof of authorization.

**Next source qualification gate:** recover the exact Preprod Oracle State singleton minting policy, holding/update address, credential/validator and update transaction; show that publisher-field substitution, unsigned price update, stale/future quote, malformed datum and replay cannot become an accepted price. Until then the current publisher check is a configured identity comparison, not a complete proof of source authenticity.

Detail: [source memo §47.6–47.7](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/audit/pre-genesis-genesis/PYTH-USDM-UNIT-CONVERSION-DECISION-20261021.md#476-publisher-identity-field-versus-proof-of-publisher-authorization). No code, schema, tests or ledger state changed.

## 2026-11-08 — Agent B: governance PRE snapshot and BeaconTarget trustless prerequisites

**Research artifact:** [AGENT-B-GOVERNANCE-PRE-SNAPSHOT-AND-BEACON-TARGET-TRUSTLESS-GAP-2026-11-08.md](AGENT-B-GOVERNANCE-PRE-SNAPSHOT-AND-BEACON-TARGET-TRUSTLESS-GAP-2026-11-08.md)  
**Exact reviewed HEAD:** `fdc9f8f3533efffdbf4bf8f69ded7ae8b7bc1d65`  
**Artifact commit:** `1a9e3d649ea71f4e91d3b804d3cc9c76982ce951`  
**Artifact blob:** `ac45a5dcf381898df55362eea0afe407820ea5ac`  
**Classification:** DESIGN / SOURCE AUDIT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY.

### Findings

- Chain-neutral GOV canonical replay and SHA-256 commitments exist, but they do not prove PRE snapshot truth/completeness or actor credential provenance. Haskell snapshots still contain supplied entity/weight pairs; no Cardano governance validator/configuration carrier is exported.
- The frozen GOV-16/17/18 contract remains linear PRE weight, voting-start snapshot, direct non-recursive delegation, 25% quorum and strict >50% ordinary approval. No ADA/DRep, custody, PRE lock/escrow or reward-snapshot substitution is proposed.
- Candidate PRE snapshot mechanisms were compared. An on-ledger Merkle-sum balance commitment would require every PRE balance movement to pass through a mandatory update path and would serialize transfers through shared state. A custom Mithril-style PRE snapshot artifact is the most promising non-custodial research candidate, but it is not a standard Mithril artifact or current repository feature; it needs a custom complete PRE balance tree, on-chain verifiable certificate relation and explicit stake-threshold/genesis-key trust model. Not selected.
- The current `BeaconTarget` is caller-supplied. Materios `OrinqReceipts::Anchors` takes caller-supplied `anchor_id`; observed Orynq `SHA256(rootHash || manifestHash)` is producer convention, not adopted round-to-anchor protocol law. A storage proof alone does not prove that anchor is canonical for a PRE-RICH round.
- The semantic meaning of `mainchainRef` is unresolved and must not be guessed. B1 publisher may publish for an already-determined target; it cannot select it. B3-A finality/authority/ancestry, B3-B storage/value and B3-C Cardano verification remain separate proof gates.
- Factory STT remains a uniqueness/replay-prevention candidate only. No per-round privileged signer is permitted.

### Next gates

1. Select and specify an acceptable authentic/complete PRE snapshot proof that preserves the existing non-custodial linear-PRE voting rules.
2. Define Cardano-credential binding for GOV `EntityId`, vote/delegation authorization and the complete GOV-16/17/18 canonical state/configuration transition.
3. Define the exact semantic meaning of `BeaconTarget.mainchainRef` and the canonical Materios checkpoint/round-to-AnchorRecord relation.
4. Then measure the complete governance/Factory/Registry verifier design, including Cardano resource and transaction-size feasibility.

No code, ABI, workflow, tests, CI, wallet, transaction, deployment, token identity, voting rule, target formula, publisher role or ledger state was changed or executed. Issue #43 remains release-blocking; Issue #37 first-ticket gates remain independent.

## 2026-11-08 — Agent B: Mithril PRE snapshot and Plutus verifier feasibility

**Research artifact:** [AGENT-B-MITHRIL-PRE-SNAPSHOT-ONCHAIN-VERIFICATION-FEASIBILITY-2026-11-08.md](AGENT-B-MITHRIL-PRE-SNAPSHOT-ONCHAIN-VERIFICATION-FEASIBILITY-2026-11-08.md)  
**Exact reviewed HEAD:** `0df1b84906c48e88305b9f4902c761b093baf953`  
**Artifact commit:** `0d700d881c9edf2b083531157a090e30ac9271d5`  
**Artifact blob:** `75b612abd08a48c1db2992152e2d6b2dc818da65`  
**Classification:** DESIGN / EXTERNAL-PROTOCOL FEASIBILITY — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY.

### Findings

- Mithril's official certification framework supports pluggable custom data modules. Signers independently compute messages, aggregators aggregate signatures, and clients verify artifacts/certificates. Custom modules require significant work and deployment across signers (the majority of registered SPOs), aggregators and clients.
- Standard Mithril SPO stake distribution is not PRE holder distribution. Standard Cardano DB v2 certifies committed immutable-file hashes but explicitly excludes the last immutable file, ledger state and volatile data. The new Cardano blocks/transactions certification authenticates membership and depth, not a complete PRE balance tree.
- A custom PRE module could independently aggregate all PRE-bearing UTxOs by a canonical governance entity/credential at one exact snapshot point and sign a Merkle-sum root plus total and asset/network/boundary/ruleset commitments. Entity identity, PRE asset identity, eligibility and complete full-UTxO computation remain unresolved.
- Mithril 2642 (2026-10-21) introduced compact SNARK certificate support and a genesis-signed circuit verification-key registry, both still unstable. On 2026-11-04, activation of the SNARK feature by default was still in progress.
- Documented approximate aggregate-signature sizes: concatenation ~150 KB (stable); non-recursive SNARK ~4 KB (unstable, one cert at a time); recursive SNARK/IVC ~13 KB (unstable, can prove the certificate chain back to genesis).
- Plutus V3 / protocol version 11 exposes BLS12-381 pairing operations and CIP-133 multi-scalar multiplication, creating a plausible primitive overlap with Mithril's Halo2/KZG verifier. This is not a verified drop-in: exact transcript/field/key encodings, circuit-key registry, CEK and full transaction-size measurements are still absent.
- The strongest research candidate is a custom PRE snapshot module plus recursive Mithril certificate verification inside Plutus. It would remove a single per-proposal snapshot publisher and allow any participant to submit the proof, but retains explicit Cardano consensus, stake-threshold, genesis/circuit-key and module-correctness assumptions.
- Off-chain certificate verification followed by an unverified root passed to the governance/Factory UTxO is rejected as final authority. It is not on-chain trustless verification.

### Next gates

1. M1: prototype a custom PRE snapshot module in an isolated Mithril dev/test network; show independent signers produce the same complete Merkle-sum root at one exact test ledger point.
2. M2: verify a real Mithril recursive certificate proof in a minimal Plutus V3 validator; test the genesis/circuit-key roots and measure CEK, memory and transaction-size limits.
3. Only after M1/M2, request an explicit governance decision on the Mithril stake-threshold trust model and the canonical entity/asset/snapshot rules.

No production code, test, workflow, CI, wallet, transaction, deployment, PRE identity, voting rule, trust root or ledger state changed or was executed. The Factory STT remains a uniqueness candidate, not an implementation-ready trustless opener. Issue #43 remains release-blocking; Issue #37 first-ticket gates remain independent.

## 2026-11-08 — Agent B: M1 signer-local PRE UTxO index and Mithril test contract

**Research/prototype contract:** [AGENT-B-M1-PRE-SNAPSHOT-INDEXER-AND-MITHRIL-CERTIFICATION-TEST-PLAN-2026-11-08.md](AGENT-B-M1-PRE-SNAPSHOT-INDEXER-AND-MITHRIL-CERTIFICATION-TEST-PLAN-2026-11-08.md)  
**Baseline HEAD:** `1070bb001bfed0ce21101668c7560cc65e2c7354`  
**Artifact commit:** `1070bb001bfed0ce21101668c7560cc65e2c7354`  
**Artifact blob:** `95d847bd8d59bcbe58011afa6a3b689c11c97a82`  
**Classification:** DESIGN / PROTOTYPE TEST CONTRACT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY.

### Findings

- The active branch contains no Mithril custom module, PRE snapshot indexer, Mithril Plutus verifier or M1 tests.
- Governance.hs still models EntityId as Integer; snapshotValid checks structural properties only (timestamp, positive weight and unique entity IDs), not Cardano credential authenticity, ledger-balance truth or denominator completeness.
- The Cardano API exposes QueryUTxOWhole with O(n) time and O(n) space. Repeated whole-ledger scans at every proposal are not accepted as the production design without strong measurement.
- LocalStateQuery has explicit chain-point acquisition constraints; it is not an unlimited historical UTxO query. A signer that starts late cannot assume it can query an old voting-start point on demand.
- The candidate M1 architecture is a signer-local incremental PRE UTxO index fed by each signer's own Node-to-Client full-block stream, with exact point binding, rollback/undo handling and no remote authoritative holder-list API.
- M1 must compare full-history replay against one-time whole-UTxO bootstrap plus incremental tracking, reproduce identical canonical messages across independent signers, exercise splits/scripts/mint/burn/forks/rollback, then create and verify a real custom-module certificate in an isolated Mithril test network.
- A private test network does not qualify the production Mithril signer population. Custom certification requires deployment across signers (the majority of registered SPOs), aggregators and clients.
- The experiment uses raw address bytes as a **test-only** leaf identity. It does not choose the production GOV EntityId mapping, PRE asset identity, eligibility, exclusions or voting-start block-selection rule.

### Next gates

1. M1-A/B: deterministic indexer, independent replicas, full-state reference parity and rollback/adversarial tests.
2. M1-C/D: real test custom-module certificate + official-client verification and resource/operations measurements.
3. M2: verify a real recursive certificate proof in minimal Plutus V3 and measure actual CEK/memory/transaction envelope before any protocol decision.

No code, tests, workflows, CI runs, Mithril network, certificate, wallet action, transaction, Preprod/Mainnet query, governance rule or ledger state was changed or executed. V3, Reveal, Issue #37, Issue #43 and Issue #49 remain separate and untouched.


## 2026-11-08 — Agent B: M1-A local Cardano node / Ogmios / Kupo execution profile

**Execution profile:** [AGENT-B-M1-A-LOCAL-NODE-INDEXER-EXECUTION-PROFILE-2026-11-08.md](AGENT-B-M1-A-LOCAL-NODE-INDEXER-EXECUTION-PROFILE-2026-11-08.md)  
**Baseline HEAD:** `401085bbb2aca9152e12e6f456c4ac3dadcbca2d`  
**Artifact commit:** `401085bbb2aca9152e12e6f456c4ac3dadcbca2d`  
**Artifact blob:** `f2ae89cb87be1811bbaece4bbb120f401eb3798a`  
**Classification:** TEST-ENVIRONMENT DESIGN — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY.

### M1-A profile

- The first prototype baseline to evaluate is cardano-node `11.0.1` + Ogmios `7.0.0` + Kupo `2.12.x`; upstream compatibility tables align these versions, but the local private-testnet config still needs a real smoke test.
- Two independently operated local Cardano nodes each get their own Ogmios bridge and custom chain-sync indexer. No remote/shared holder-list API or project publisher is authoritative.
- Ogmios transports full blocks from local Node-to-Client ChainSync and exposes explicit roll-forward/rollback; indexers persist exact `(slot, headerHash)` points and commit state before advancing cursors.
- Kupo is a local, independent filtered-UTxO comparison only. Disable `--prune-utxo`; compare only at a proven common point. It is not a certificate source or Plutus proof.
- The parser must apply Alonzo+ phase-2-invalid transaction semantics, distinguishing ordinary inputs from collateral inputs and preserving valid collateral-return outputs; unknown era/input-source shapes fail closed.
- Compare full replay, whole-UTxO bootstrap plus incremental index, and Kupo where point-specific history allows. Require exact TxIn/address/quantity-set equality, not merely equal total supply.
- Existing repository reuse: `ws@8.18.3` is already pinned in `audit/cardano-integration`; the Haskell `YaciUTxO` parser only decodes materialized Yaci UTxO JSON and is not a Node-to-Client full-block indexer.

### Acceptance and status

M1-A is only an indexer-correctness gate. It requires two node replicas, full-replay parity, phase-2/collateral handling, idempotent reconnect, atomic rollback/recovery and pinned resource evidence. A simulated rollback alone is not a node-level fork demonstration. No private testnet, Ogmios, Kupo, indexer, source code, tests, workflow, CI, certificate, wallet, transaction or ledger query was run/created in this documentation pass.

M1-C Mithril certification and M2 Plutus verification remain separate. Production entity identity, eligibility, PRE policy/name, snapshot-point selection and stake-threshold acceptance remain undecided. V3, Reveal, Issue #37, Issue #43 and Issue #49 are untouched.


## 2026-11-08 — Agent A: adaptive Issue capacity and transition-to-RiskMode matrix

**Research artifact:** [AGENT-A-R1-ADAPTIVE-ISSUE-CAPACITY-AND-TRANSITION-MATRIX-2026-11-08.md](AGENT-A-R1-ADAPTIVE-ISSUE-CAPACITY-AND-TRANSITION-MATRIX-2026-11-08.md)  
**Artifact commit:** `e7f798f73e43b85e0f3ff259ff502ef70382e103`  
**Classification:** ECONOMIC RESEARCH / POLICY-MAPPING PROPOSAL — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY.

### Result

- Completed the Issue / Reveal / Claim / Expire / Quiesce / Recovery / liquidity trajectory matrix against the three existing RiskMode values.
- Confirmed that RiskMode selects analytical mechanisms, not safety overrides. Current PRE-RICH V1 continues to require deterministic 500× WCE for every unresolved ticket; the bridge continues to accept only the exact deterministic mode and remains unwired from production admission.
- Formalized the only plausible route to higher ticket capacity: a separately governed, non-retroactive statistical cohort profile for unresolved payout risk. Known liabilities, Claim settlement, Jackpot, mandatory costs and universal viability constraints remain deterministic. This is a different guarantee from V1's unconditional 500× Pending-ticket protection; it cannot be presented as preserving that per-ticket guarantee.
- Corrected the capacity illustration for B1's actual reservation delta. With a hypothetical 4,000-USDM headroom before the cohort's face-price reserve, one-USDM tickets, no other encumbrances and one fixed pre-outcome cohort, post-Issue E* is 4,000 − N. The dependence-robust Cantelli sensitivity frontier is 18 / 41 / 58 tickets for illustrative whole-cohort ceilings 0.1% / 0.5% / 1.0%, versus 8 under the simplified 500× arithmetic. These are conditional research numbers, not approved sale limits. The alternative prior convention with 4,000 USDM already net of all face reserves yields 18 / 42 / 59 and is explicitly distinguished in the report.
- Added the entire current ticket-price ladder sensitivity. For the same 4,000-USDM pre-reserve headroom, the candidate homogeneous-class counts at ε = 0.1% / 0.5% / 1.0% are: P=1: 18/41/58; P=2: 9/20/29; P=3: 6/13/19; P=5: 3/8/11; P=10: 1/4/5; P=25: 0/1/2; P=50: 0/0/1; P=100: 0/0/0. Mixed classes must consume one aggregate face-value budget F and one shared Pool/risk perimeter; these are not independent class allowances.
- Reaffirmed that an unconditional static Cantelli bound cannot be reused after Beacon results become available and remaining Pending membership becomes outcome-selected. Rolling Issue needs conditional moments over the full adversarial/private information history, one lifetime risk budget, and non-overlapping capital.
- Current Pool datum does not enforce cohort membership/freeze, C_other allocation or lifetime ε. Existing Registry identity / publication and Beacon authenticity gaps also prevent a trustless freeze barrier.

### Ownership / next boundary

- **Agent A:** economic profile semantics, guarantee choice, ε/horizon/lifetime allocation, capacity frontier and capital perimeter.
- **Specification authority:** must approve the new probabilistic guarantee, profile migration, freeze/liveness rule and risk-budget policy. No values are selected by this report.
- **Agent B:** independent technical review; any cohort accumulator, Registry freeze integration or Plutus change requires a separate bounded implementation authorization and exact write slot.
- **First V1 Preprod Issue:** remains a separate Issue #37 path; current USD/USDM source, fresh EV1–EV7, deployment-bound approval and R1/Kc/Ω certificate remain independent blockers.

No code, tests, workflows, constants, profile, V3/Reveal semantics, oracle schema, certificate, wallet action, transaction, deployment or ledger state was changed or executed.


## 2026-11-08 — Agent B: isolated PRE snapshot UTxO reducer prototype

**Core source:** `audit/cardano-integration/preSnapshotUtxoIndex.mjs`  
**Unit tests:** `audit/cardano-integration/preSnapshotUtxoIndex.test.mjs`  
**Test command:** `cd audit/cardano-integration && npm run test:pre-snapshot-index`  
**Status:** CORE CODE PRESENT / TESTS AUTHORED BUT NOT RUN / NO LEDGER INTEGRATION.

### Implemented

- Pure, Node built-in-crypto reducer over a normalized block contract; no production or external dependencies added.
- Exact PRE policy/name matching, arbitrary-precision quantities and test-only raw-address aggregation.
- Deterministic SHA-256 Merkle-sum root and canonical snapshot message binding network, exact point, asset, identity-rule ID, total and leaf count.
- Valid ordinary-input/output handling; invalid phase-2 collateral-input and collateral-return handling; valid mint/burn delta reconciliation.
- Fail-closed checks for duplicate transactions/inputs/UTxOs, unknown validity, malformed quantities/addresses, zero target-asset outputs, wrong parent, skipped block number and conservation mismatch.
- Immutable public state; rollback journals correctly handle UTxOs created and then spent inside the same block; rollback and alternate replay are modeled.
- Twelve Node built-in test cases authored and a package command registered.

### Remaining gap

This is a reducer plus an Ogmios v7 normalization adapter and reconnecting WebSocket ChainSync client; it is **not yet a running Cardano node indexer**. Durable cursor/database, local cardano-node topology, UTxO bootstrap, full replay, Kupo comparison, real chain rollback and resource measurements remain open. Tests are authored but not run in this environment; do not report a pass. Ogmios v7 requires `Transaction.spends` (`inputs` or `collaterals`); an earlier checkpoint sentence saying `inputSource` was incorrect and is superseded by the v7 schema erratum in the M1-A profile.

**M1-A status:** reducer implementation present; node ingestion and ledger conformance open. M1-C custom Mithril certificate and M2 Plutus proof verification remain future independent gates.

No production governance rules, PRE asset identity, GOV entity mapping, voting eligibility, voting snapshot point, V3, Reveal, B1 EEV, Issue #37, Issue #43, Issue #49, workflow, wallet, transaction, deployment or ledger state changed.


## 2026-11-08 — Agent B: Ogmios v7 decoder and reconnecting ChainSync client added

**Sources:**
- `audit/cardano-integration/ogmiosV7PreSnapshotAdapter.mjs`
- `audit/cardano-integration/ogmiosV7ChainSyncClient.mjs`
- `audit/cardano-integration/ogmiosV7PreSnapshotAdapter.test.mjs`
- Package commands in `audit/cardano-integration/package.json`

### Implementation

- Added a v7-specific block/transaction adapter. It maps Praos headers, chain points, output references, addresses, nested multi-asset values, mint and collateral-return outputs into the normalized PRE reducer input.
- The exact v7 transaction discriminator is required `spends: "inputs" | "collaterals"`. **Correction:** an earlier M1-A profile/checkpoint sentence used the wrong field name `inputSource`; it is not the v7 transaction field. The v7 schema and upstream TypeScript client were inspected directly.
- Added Bech32 Shelley address decoding with checksum validation and Base58 Byron raw-byte decoding. Byron CBOR/checksum validation remains an explicit hardening limitation; it must be closed before a production completeness claim.
- Added rollback mapping from Ogmios `{slot,id}` / `origin` to the exact retained local point including block number. Intersection candidate selection includes a bounded origin fallback when the index is genesis-anchored.
- Added a reconnecting ChainSync WebSocket client with JSON-RPC request-ID matching, BigInt-safe JSON parsing, one outstanding `nextBlock` request and callback completion/backpressure before the next request. Protocol/decoder/callback errors stop fail-closed; transport errors attempt reconnect using the current retained index history.
- Added end-to-end synthetic test coverage connecting Ogmios-decoded normal mint and collateral-return transactions to the PRE reducer.

### Test and qualification status

- Reducer suite: 12 tests written.
- Ogmios adapter/client suite: 13 tests written.
- Total: **25 tests authored, none executed** in this environment. The package scripts are `npm run test:pre-snapshot-index` and `npm run test:ogmios-v7-adapter`.
- The dependency `@cardanosolutions/json-bigint@1.0.1` is pinned in the isolated `audit/cardano-integration/package.json`. The root `package-lock.json` is not an npm workspace lock for that isolated sub-package; no root lock change was made.
- No real WebSocket endpoint, Cardano node, private testnet, Kupo or Mithril network was contacted or started. Persistent cursor/database, atomic journal, crash recovery and true node-level rollback remain unimplemented.

**Disposition:** reducer + adapter + ChainSync client code present; static/synthetic tests authored but not run; live M1-A ledger integration/conformance remains OPEN. M1-C and M2 are not started. No V3, Reveal, GOV-16/17/18, B1/EEV, Issue #37, Issue #43 or Issue #49 protocol semantics changed.


## 2026-11-08 — Agent B: Ogmios v7 static review corrections

**Profile:** `AGENT-B-M1-A-LOCAL-NODE-INDEXER-EXECUTION-PROFILE-2026-11-08.md` §12–14  
**Implementation files:** `ogmiosV7PreSnapshotAdapter.mjs`, `ogmiosV7ChainSyncClient.mjs`  
**Tests:** `ogmiosV7PreSnapshotAdapter.test.mjs` (13 cases), `preSnapshotUtxoIndex.test.mjs` (12 cases).

- Corrected earlier v7 schema misstatement: official field is required `Transaction.spends` with `"inputs" | "collaterals"`; `inputSource` is not the v7 field.
- Corrected ChainSync request envelope: `findIntersection` uses `params.points`, while `nextBlock` has no `params` member. Added fake-WebSocket assertion.
- Reserved a slot for the `"origin"` intersection fallback under a bounded candidate list, including `maxIntersectionPoints = 1`.
- Added an adapter-to-reducer test exercising ordinary mint plus collateral-return application in one decoded v7 block.
- BigInt-safe JSON parsing uses pinned `@cardanosolutions/json-bigint@1.0.1`; the isolated integration package also retains `ws@8.18.3`.

**Test status:** 25 tests authored; none executed. No local Cardano node, Ogmios endpoint, Kupo, private testnet or Mithril network was started. The Byron Base58 path converts address bytes but does not yet validate the full Byron CBOR envelope/checksum; this remains an explicit pre-production parser hardening item. No durable DB/cursor journal or crash recovery yet.

**Qualification:** source code / static repository verification only. M1-A live ingestion, ledger conformance and resource benchmarks remain OPEN; M1-C/M2 remain NOT STARTED. The previous erroneous `inputSource` checkpoint statement has been corrected in the current status. No production protocol, V3, Reveal, GOV rules, Issue #37, Issue #43 or Issue #49 semantics changed.


## 2026-11-08 — Agent B: persistent PRE snapshot WAL and restart/reorg recovery

**Source:** `audit/cardano-integration/preSnapshotJournal.mjs`  
**Tests:** `audit/cardano-integration/preSnapshotJournal.test.mjs`  
**Integrated factory:** `createPersistentOgmiosV7ChainSyncClient({ journal, url, ...options })`  
**Test commands:** `npm run test:pre-snapshot-journal`; combined `npm run test:pre-snapshot-index`.

### WAL behavior

- Bootstrap manifest binds network, exact PRE test asset, anchor point and initial UTxO rows with a SHA-256 digest; manifest is written to a temporary file, fsynced and atomically renamed.
- Append-only `journal.ndjson` stores normalized full-block and rollback events. Sequence number + previous-record hash + record digest form a hash chain.
- Each append is fsynced before reducer state/cursor changes. The cursor is derived from replayed state; no separate cursor file can drift away from the WAL.
- Startup verifies manifest, record sequence, previous-hash chain, record digest and every reducer transition. Only an incomplete final fragment without a newline is truncated and fsynced; a complete malformed record, bad digest or invalid transition fails closed.
- Single writer lock records PID and hostname. A provably dead PID on the same host is reclaimed under an exclusive reaper lock. Live, foreign-host and unverifiable locks are not removed. A stale reaper file left by a crash during lock reclamation needs manual inspection.
- Queued operations serialize; block/rollback inputs are detached from caller mutation; close drains queued writes and rejects new ones.
- WAL-backed ChainSync handlers commit forward and rollback callbacks before returning. On reconnect, a findIntersection earlier than the current local cursor is recorded as a WAL rollback before any further nextBlock request. The persistent client factory combines those callbacks with the v7 ChainSync client.

### Test and qualification status

- WAL test suite: 11 cases authored (reopen/replay, rollback and alternate branch across restart, torn-tail recovery, complete-record corruption, fail-closed invalid block, single-writer lock, callback commits, stale lock recovery, foreign lock, factory construction, queued writes/close race).
- Total M1-A test inventory: **36 authored (12 reducer + 13 Ogmios adapter/client + 11 WAL); none executed**. Sparse checkout was attempted for execution, but this environment could not resolve `github.com`. Remote source re-reading is static verification only and is not test execution.
- The isolated integration package adds `test:pre-snapshot-journal`; combined command `test:pre-snapshot-index` includes all three suites.

### Known limits

- Bootstrap UTxO manifest is one JSON payload; no large-state streaming/chunking.
- Full normalized blocks remain in the WAL, replay starts at bootstrap on every restart, and the full undo history remains in memory. No compaction, checkpoint snapshots, retention policy, pruning or journal rotation. Resource growth is unmeasured.
- SHA-256 hashes detect accidental corruption/torn records but are not signatures and do not prevent an administrator rewriting the whole store.
- Single-writer/local-filesystem target; no shared network filesystem qualification.
- On Windows, Node directory-entry fsync is skipped; file contents are fsynced. Linux/macOS attempt directory fsync.
- Stale/unverifiable reaper lock files need manual recovery; Byron CBOR/checksum validation remains open.

**Status:** persistent reducer + Ogmios v7 adapter/client + local WAL/replay and automatic intersection rollback = CODE PRESENT. Tests written/not run. Live two-node Cardano ledger conformance and resource measurements remain OPEN. M1-C Mithril certificate integration and M2 Plutus verification remain NOT STARTED. No production governance, PRE identity/eligibility, V3, Reveal, B1 EEV, Issue #37, Issue #43 or Issue #49 semantics changed.


## 2026-11-08 — Agent B: M1-A test execution result

**Workflow:** `.github/workflows/m1-a-pre-snapshot-tests.yml`  
**Successful run:** https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42459666825  
**Commit tested:** `c6aa10829b54bd140e949e3693fa2964fbf492a7`

- `npm run test:pre-snapshot-index`: **36 tests, 36 passed, 0 failed, 0 skipped** (12 reducer + 13 Ogmios adapter/client + 11 persistent WAL).
- The follow-up `node --check` succeeded for `preSnapshotUtxoIndex.mjs`, `ogmiosV7PreSnapshotAdapter.mjs`, `ogmiosV7ChainSyncClient.mjs` and `preSnapshotJournal.mjs`.
- Node 22 runner used a temporary dependency directory with only `ws@8.18.3` and `@cardanosolutions/json-bigint@1.0.1`; no root lockfile or production package dependency changes were made.
- The initial run exposed two test-only defects: a helper default concealed an explicitly missing `spends` field, and the lock assertion expected an outdated error wording. Both tests were corrected; the reducer contract itself was unchanged. The final run passed.
- The run uses synthetic fixtures and a fake WebSocket. It does **not** qualify a real Cardano node/Ogmios connection, Kupo parity, bootstrap completeness, Byron CBOR/checksum, performance/resource behavior, persistent-disk crash injection, or Mithril certification.

**Updated M1-A status:** unit suite PASS (36/36); live two-node ledger conformance and resource qualification OPEN; M1-C Mithril and M2 Plutus verification NOT STARTED. No live chain services, wallet signing, Preprod/Mainnet transactions or protocol-economic/governance semantics were changed.


## 2026-11-08 — Agent B: M1-A dual-replica comparator and local ChainSync runner

**Comparator:** `audit/cardano-integration/preSnapshotReplicaConformance.mjs` and `.test.mjs` (8 tests).  
**Runner:** `audit/cardano-integration/preSnapshotDualReplicaRunner.mjs` and `.test.mjs` (9 tests).  
**Workflow:** `.github/workflows/m1-a-pre-snapshot-tests.yml`  
**Latest successful run:** https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42460691746  
**Exact tested commit:** `6158c847545fdefe5b6d6b908b824b7b3279f028`

- Comparator requires two distinct labelled replicas, exact operator-provided network/asset and fixed `expectedPoint`. PASS requires both local indexes at that point (or non-mutating projection from a later tip where retained history permits), byte-identical canonical snapshot bytes and matching digest. A same-height different header hash fails; behind replicas remain WAITING; unavailable historical target/config mismatches fail closed. It never selects a snapshot point or changes either state.
- Local runner accepts exactly two distinct node instance labels, separate local journal directories and two distinct loopback `ws://` Ogmios URLs. It opens two persistent clients, requires successful `findIntersection` for both, remote tips at/after the supplied target, and exact snapshot match. Transport error resets that session's readiness; fatal Ogmios RPC is FAIL. It stops both sessions and rechecks the target before returning PASS. It writes local WALs only; no signing/submission or Cardano-node write API.
- A successful fake-WebSocket integration test executes both intersection sessions, fixed-point compare, and final freeze. A separate negative test ensures fatal intersection errors cannot return stale-state PASS. `WebSocketImpl` is injectable for deterministic tests; the real CLI uses the pinned `ws` package.
- Config's replica IDs, nodeInstanceIDs and URLs are declarations supplied by the operator, not cryptographic attestation of independent physical/process nodes. Real node identity/process independence must be established in the local runtime evidence.
- The local config's `expectedPoint`, exact PRE policy/name, network identity, anchor point and full bootstrap UTxO set remain operator inputs. `initialUtxos: []` in documentation is schema illustration only, not zero-supply evidence. Invocation: `node preSnapshotDualReplicaRunner.mjs <path-to-local-config.json>` from `audit/cardano-integration`.

### Test execution

Latest isolated M1-A workflow run **42460691746**: **53 tests / 53 passed / 0 failed / 0 skipped**. Inventory: 12 reducer + 13 Ogmios adapter/client + 11 WAL + 8 replica comparator + 9 dual local-runner. Six module `node --check` steps also passed. Run used Node 22 and only the runtime dependencies in a temporary runner directory. Earlier 36/36 and 44/44 runs are superseded by this wider 53-test run.

**Important qualification boundary:** the suite uses synthetic fixtures and fake WebSockets; no actual Cardano node, Ogmios service, Kupo, private testnet or Mithril network has been started or contacted. Live M1-A acceptance remains OPEN: two independent local node processes and their own Ogmios processes, verified complete bootstrap set, one fixed target, exact replica state/message agreement and Kupo parity at the same point; then resource, restart, rollback and pinned runtime evidence. M1-C and M2 remain NOT STARTED. No V3, Reveal, GOV-16/17/18, B1/EEV, Issue #37, Issue #43, Issue #49 or economic policy semantics changed.


## 2026-11-08 — Agent B: M1-A Kupo parity and two-node runbook

**Kupo parity:** `audit/cardano-integration/preSnapshotKupoParity.mjs`, `preSnapshotKupoHttp.mjs`, `preSnapshotKupoAudit.mjs`  
**Local runbook:** `docs/COORDINATION/AGENT-B-M1-A-TWO-NODE-LOCAL-DEVNET-RUNBOOK-2026-11-08.md`  
**Successful M1-A run:** https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42462349216

- Kupo exact-asset matcher compares the complete returned unspent match set against each reducer WAL at the operator-supplied slot/hash/block point. It validates out-refs, address bytes, quantity, creation point and `spent_at`, then compares canonical bytes + digest.
- Loopback-only HTTP client calls `/checkpoints/{slot}?strict` and `/matches/{pattern}?unspent`, requests asset quantities as strings, and fails on checkpoint mismatch, HTTP error, malformed response or snapshot divergence.
- Upstream Kupo v2.12.0 source confirms inclusive `--until POINT|SLOT`, `--since origin`, optional `--prune-utxo` (omitted by runbook), and OpenAPI match fields/quantity media type.
- Upstream Cardano node 11.0.1 source confirms `cardano-testnet create-env --num-pool-nodes`, `--testnet-magic`, `--output`, the persisted `cardano-testnet cardano --node-env` flow, and paths `configuration.yaml`, `socket/nodeN/sock`, `node-data/nodeN/port`. Ogmios 7.0.0 and Kupo 2.12.0 declare/test compatibility with node 11.0.1.
- GitHub Actions run **42462349216**, commit `bc4cbb72b91467adad90286c2928a7ca4f56265a`: **69 tests / 69 pass / 0 fail / 0 skipped**. Current HEAD adds only the runbook after that tested commit; executable M1-A files and the CI workflow are unchanged since the successful run.
- The WSL2 runbook is documentation only and has not been executed on a real local machine. Real two-node/two-Ogmios/two-Kupo conformance, pinned bootstrap provenance, runtime identity and resource/restart/rollback evidence remain OPEN. Two testnet producer nodes on one locally generated genesis are not independent operators or an adversarial trustlessness proof.

**Status:** M1-A synthetic test gate PASS (69/69); local two-node + Kupo runtime acceptance OPEN; Byron envelope/checksum hardening and complete bootstrap provenance OPEN; M1-C Mithril and M2 Plutus not started. No Preprod/Mainnet transactions, wallet signing or IMMORTAL protocol/economic/governance semantics changed.


### M1-A private-devnet asset-scope clarification

The 2-node local runbook in this branch is presently a **zero-state plumbing smoke test** unless a test-only asset is separately created. A fresh `cardano-testnet` genesis does not contain the production PRE token or its Preprod/Mainnet UTxO history. Using production PRE policy/name on that fresh chain and obtaining two empty, matching indexes is not a non-zero PRE distribution proof. A non-zero local ledger fixture requires a clearly test-only native asset and ephemeral test keys, with its mint transaction confined to the private testnet; that fixture is not yet implemented or run. A real production PRE balance check must instead use the appropriate public Cardano network read-only and the exact governed PRE policy/name/eligibility inputs. Do not conflate these two evidence tracks.
