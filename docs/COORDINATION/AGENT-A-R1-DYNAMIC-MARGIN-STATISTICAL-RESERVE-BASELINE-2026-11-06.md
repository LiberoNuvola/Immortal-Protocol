# Agent A-R1 — Dynamic Economic Margin and Statistical Reserve Baseline

**Date:** 2026-11-06  
**Branch:** `work/immortal-green-closure`  
**Source HEAD at start of this read-only audit:** `bf5480fd6f23aa8b3c8c9ccdb796a95ff9b1d99c`  
**Status:** READ-ONLY BASELINE / IMPLEMENTATION GAP ANALYSIS  
**Owner:** Agent A (Economy, EEV, accounting and R1)  
**Independent technical review:** Agent B  
**Normative changes:** none  
**Code, tests, workflows, certificates and ledger:** not changed or executed in this audit

## 1. Executive result

The repository already defines two different approaches to unresolved-ticket risk:

1. **Deterministic worst-case exposure**, frozen for PRE-RICH at 500 times the ticket price for every unresolved ticket.
2. **Statistical risk reserve**, documented against the current Classic-6 ticket-level payout distribution as
   `N × μ + Z × σ × sqrt(N)`.

These quantities are not interchangeable. The normative PRE-RICH game-economy document explicitly says the statistical model is not a deterministic guarantee and does not replace deterministic worst-case protection. The implementation also has a third quantity that must not be confused with either of them: the on-chain/V3 `unresolvedReserve`, which is the face-price sum of unresolved tickets.

The current V3 implementation derives and enforces the deterministic 500× exposure and carries the nominal face-price reserve. It does not derive the documented statistical formula from `N, μ, σ, Z`. The `ReserveProtection` field is carried as a separate component, but the code does not establish that it is the statistical reserve, derive it from the formula, or prove its source/disjointness.

**Therefore the gap is not “500× versus a better multiplier”. It is the missing typed and evidenced relationship between the statistical risk model, the nominal ring-fenced face reserve, the independent ReserveProtection component, the economic admission boundary and class/sale control.** No statistical addend to ProtectedCapital is authorized by this audit.

## 2. Canonical economic quantities

### 2.1 Deterministic worst-case exposure

PRE-RICH `GAME-ECONOMY.md` freezes:

```text
MaximumNormalPayout(P) = 500 × P
WorstCaseExposure = 500 × Σ_i (P_i × N_i)
```

The current V3 `EconomicKernel.worstCaseExposure` calculates the profile multiplier times class-aware unresolved face exposure. For the current profile that multiplier is 500.

The current `ProtectedCapital` definition is:

```text
CrystallizedLiabilities
+ WorstCaseExposure
+ SafetyCapital
+ ReserveProtection
+ LockedJackpot
+ MandatoryFutureCosts
```

This is the deterministic post-state protection boundary consumed by solvency checks. It must not be weakened or replaced by a statistical quantile.

### 2.2 Statistical payout-risk model

PRE-RICH `GAME-ECONOMY.md` §3.1–§4 declares the canonical Classic-6 ticket-level payout distribution and its moments:

```text
μ = 0.64996875 × P
σ ≈ 6.689612535 × P
UnresolvedReserve_stat(N) = N × μ + Z × σ × sqrt(N)
```

The two rows within a ticket are declared independent and the ticket payout is their sum, capped at 500×P. `Z` remains a deployment/model parameter; this baseline does not select it.

The same normative section says this is statistical risk capital, not a deterministic guarantee, and does not replace the deterministic worst-case rule. `PRE-RICH/docs/ECONOMIC-ALGORITHM.md` §2 separately lists evaluation of deterministic exposure, statistical reserve, safety floor and locked Jackpot during sale admission.

### 2.3 Nominal ring-fenced unresolved reserve

The V3/on-chain field `v3UnresolvedReserve` does **not** contain the statistical formula. The implementation defines it as:

```text
FaceReserve = Σ_i (P_i × N_i)
```

Evidence:
- `EconomicKernel.conservationInvariant` requires `v3UnresolvedReserve == totalClassExposure`.
- `PreRichEconomicProjection.foldClassesSeen` returns the sum of `price × unresolved` as the aggregate reserve and separately derives `500 × price × unresolved` as worst-case exposure.
- `V3EconomicStateCarrier.stateValid` requires the carrier aggregate unresolved reserve to equal the sum of class exposure.
- `EconomicKernel.effectivePool` subtracts this nominal face reserve, crystallized liabilities and locked Jackpot from EEV.

The same term “UnresolvedReserve” is consequently used in documentation for a statistical estimate and in V3 datum/code for the nominal face-price amount. These are different quantities and must be named distinctly in the A-R1 model/crosswalk.

## 3. Current implementation boundary

| Quantity | Current source/implementation | Dynamic treatment now | Finding |
|---|---|---|---|
| Nominal unresolved face reserve | V3 `v3UnresolvedReserve` / class prices | Issue adds ticket price; Reveal/Expire release ticket price | Implemented and conservation-checked |
| Unresolved ticket count | V3 `v3UnresolvedTicketCount` | Issue +1; Reveal/Expire −1 | Implemented |
| Deterministic worst-case exposure | derived from profile multiplier and class composition | Recomputed from unresolved tickets after each transition | Implemented |
| Crystallized liabilities | V3 `v3CrystallizedLiabilities` | Reveal adds actual payout; Claim subtracts claimed amount | Implemented structurally |
| Statistical reserve `Nμ + Zσ√N` | PRE-RICH specification | No derivation found in V3 projection/admission/kernel path | Not implemented at this boundary |
| `ReserveProtection` | V3 field projected to Universal state | Preserved unchanged by Issue/Reveal/Claim/Expire | Separate component; source/meaning/disjointness not proven |
| EEV / executable liquidity | explicit inputs to `PreRichEconomicAdmission` / Economic Gate | supplied per candidate action | Separate from the reserve formulas |

The relevant implementation details are:
- `EconomicTransitionV3.transition`: Issue increments face reserve/count; Reveal decrements face reserve/count and adds actual payout liability; Expire decrements face reserve/count; Claim reduces crystallized liability.
- `EconomicKernel.protectedCapital`: includes deterministic worst-case exposure and the pre-existing `v3ReserveProtection` value; it does not add nominal face reserve or calculate the statistical formula.
- `PreRichEconomicProjection`: projects face reserve, count, class-aware worst-case exposure and protected components; it does not compute `μ`, `σ` or `Z`.
- `PreRichEconomicAdmission`: accepts pre/candidate EEV, available/required executable liquidity and evidence booleans; it has no explicit statistical-risk observation/model input.
- `V3EconomicStateCarrier`: validates the nominal face-reserve aggregate; it does not validate a statistical-risk amount or its derivation.

### On-chain and Gate cross-check

The Cardano implementation independently confirms the same distinction:
- `plutus/B1PrizePool.hs` documents `ppUnresolvedReserve` as the deterministic ticket-price reservation, explicitly “not the full worst-case payout exposure”; its `effectivePool` deducts pending liabilities, this nominal face reserve and locked Jackpot.
- The same validator derives worst-case exposure separately from the legacy accounting datum and runs post-state `solvencyInvariant` for Issue, Reveal, Claim and Expire.
- `IMMORTAL/kernel/EconomicGate.hs` receives truth/freshness/obligation-completeness flags, EEV, and available/required immediate liquidity. It has no `μ`, `σ`, `Z`, statistical reserve or statistical threshold input.

Thus the absence is not just a missing V3 field name: the currently inspected Cardano/Economic Gate admission interface also has no explicit statistical-risk decision. This is an implementation/evidence mapping gap relative to the algorithm document's instruction to evaluate statistical reserve; it does not authorize altering the deterministic on-chain solvency predicate.

## 4. Lifecycle equations already represented

For one unresolved ticket of class price `P), the represented V3 lifecycle is:

| Action | Face reserve | Unresolved count | Worst-case exposure | Crystallized liability |
|---|---:|---:|---:|---:|
| Issue | +P | +1 | +500P | 0 |
| Reveal with actual payout R | −P | −1 | −500P | +R |
| Claim amount C | 0 | 0 | 0 | −C |
| Expire | −P | −1 | −500P | 0 |

With `0 ≤ R ≤ 500P`, the deterministic ProtectedCapital delta at Reveal is `R − 500P`. A maximum payout replaces the released 500P exposure with a 500P crystallized liability; a lower payout releases the difference. Claim then reduces ProtectedCapital by the exact amount settled. Expiry releases the unresolved maximum exposure without crystallizing a new liability, subject to the governing expiry/right rules.

This confirms that V3 already models **realized lifecycle dynamics**. What it does not model in this path is the separate **probabilistic reserve trajectory**.

### A3 — symbolic mixed-class lifecycle vector (analysis only)

For a class-aware unresolved portfolio, define:

```text
F = Σ_i (N_i × P_i)          -- nominal face reserve
W = 500 × F                  -- deterministic PRE-RICH worst-case exposure
Q = Σ_i (N_i × P_i²)         -- variance-weighted price mass
R_stat = μ₀ × F + Z × σ₀ × sqrt(Q)
```

where `μ₀ = 0.64996875` and `σ₀ = 6.689612535418134...`. The `Q` expression is only a candidate portfolio extension under independent ticket-level outcomes with the same normalized payout distribution for each price class. It is not adopted semantics. If cross-ticket dependencies exist, covariance terms or a larger authoritative `Ω) are required.

For an action on class `j`, with ticket price `P_j` and current `Q`:

| Action | `F` delta | `W` delta | `Q` delta | `R_stat` delta under the candidate independence model |
|---|---:|---:|---:|---|
| Issue | `+P_j` | `+500P_j` | `+P_j²` | `μ₀P_j + Zσ₀(√(Q+P_j²)−√Q)` |
| Reveal | `−P_j` | `−500P_j` | `−P_j²` | `−μ₀P_j + Zσ₀(√(Q−P_j²)−√Q)` |
| Expire | `−P_j` | `−500P_j` | `−P_j²` | same unresolved-cohort reduction as Reveal |
| Claim | `0` | `0` | `0` | `0` |

Reveal additionally changes crystallized liabilities by the **actual** payout `+R`; Claim reduces them by the exact amount `−C`. Expiry does not create a new crystallized payout liability under the declared expiry lifecycle.

The deterministic ProtectedCapital deltas remain:
- Issue: `+500P_j`;
- Reveal: `R − 500P_j`;
- Expire: `−500P_j`;
- Claim: `−C`.

These deterministic deltas are the current V3/kernel behavior. `R_stat` deltas above are a separate estimator and do not become extra ProtectedCapital deltas by being calculated. In particular, after Reveal the estimator removes the unresolved ticket's expected/variance contribution while the deterministic kernel replaces worst-case exposure with the realized payout liability.

### What this vector shows

The dynamic part is not merely a statistical buffer that grows with `N`: the unresolved ticket cohort changes over time, and a reveal transfers one ticket from uncertain exposure to a known crystallized liability. V3 already implements that **realized liability transfer** exactly. The missing piece is a governed/evidenced statistical measure and its intended use in the sale/class-control path; the current model does not derive it.

## 5. No automatic statistical addend

The audit matrix `IMMORTAL/docs/ECONOMIC-GATE-CARDANO-CONFORMANCE-MATRIX.md` explicitly lists “invent a statistical-reserve addend” and “change 500×” as non-goals. This is consistent with preserving the closed deterministic 500× protection boundary.

The statistical formula must therefore not be appended to `ProtectedCapital`, substituted for `WorstCaseExposure`, or silently placed into `ReserveProtection` by an implementation patch.

There is an additional evidence boundary: the existing PA3/PA4 audit on Issue #37 states that `ReserveProtection` cannot be inferred from the ring-fenced `ppUnresolvedReserve`; it requires its own explicit source/definition and item-level evidence. It also notes that the six protected-capital components still lack complete per-component provenance and pairwise non-overlap evidence.

The open question is narrower and must be decided explicitly: does PRE-RICH use the statistical model as (a) a monitoring/reporting measure, (b) a separate sale/class-control admission criterion, or (c) a separately funded reserve component with a governed source and evidence contract? Current normative/implementation material does not provide a complete executable contract connecting those choices to `ReserveProtection` and the Economic Gate.

## 6. Mixed-class portfolio caution

The documented formula is directly expressed for `N` tickets at a common price scale `P`. If a later analysis derives a mixed-class portfolio formula under an explicit independence assumption, the mathematical candidate is:

```text
Mean = μ × Σ_i (N_i × P_i)
Variance = σ² × Σ_i (N_i × P_i²)
Statistical bound = Mean + Z × sqrt(Variance)
```

This is **analysis only**, not adopted protocol semantics. It relies on independent ticket-level outcomes across tickets; any correlation or common-source dependency changes the variance and must be represented in the authoritative uncertainty envelope. A count-only `N` model must not be applied to a mixed-price portfolio without a justified normalization.

No value for `Z`, cross-ticket independence claim, rounding rule, numerical precision, statistical horizon or authoritative data source is selected in this baseline.

## 7. R1 / QNE consequence

R1 T-MARGIN requires a concrete witness action that is available and non-eroding for every authoritative `Ω)-successor. A statistical confidence estimate does not by itself discharge this universal requirement.

At the declared Preprod S0, the current structural action set has only `Issue(0,1)`. Under the Direct-USDM contract, the exact same B1 PrizePool observation is used for pre/candidate EEV and the Issue builder continues the PrizePool unchanged while directing the sale payment to Treasury. Thus the deterministic `ProtectedCapital` rises by 500 RU while EEV does not rise: `b = EEV − ProtectedCapital` erodes by 500 RU. This remains the concrete S0/QNE obstruction recorded in Issue #37.

The statistical reserve cannot erase that obstruction. If treated as an extra positive protected amount, it would make the margin smaller; if used to reduce or replace 500×, it would change the frozen deterministic policy and would not establish an all-`Ω` guarantee. No such change is proposed or authorized.

## 8. A-R1 work packages and ownership

| Work package | Owner | Deliverable | Constraint |
|---|---|---|---|
| A1 — Quantity/field crosswalk | Agent A | unambiguous distinction: face reserve, deterministic WCE, statistical risk estimate, ReserveProtection | no field reuse without provenance |
| A2 — Distribution/moment reproduction | Agent A | independently recomputed exact ticket-level moments and rounding bounds | no change to result distribution |
| A3 — Mixed-class/statistical trajectory | Agent A | mathematically explicit candidate analysis under declared dependence assumptions | do not select Z or assume independence across tickets |
| A4 — Economic admission mapping | Agent A | determine whether existing text requires reporting, separate gate input or funded component; isolate the missing policy/evidence contract | no ProtectedCapital addend |
| A5 — R1/QNE integration | Agent A | show which conditions are deterministic/universal and which are probabilistic/operational | no statistical shortcut for Ω |
| B1 — Independent implementation review | Agent B | review V3, projection, carrier and Plutus mapping against this crosswalk | do not modify V3/Reveal semantics |

### A2 — exact ticket-level moments independently reproduced (2026-11-06)

The 15 canonical ticket-level payout rows in `GAME-ECONOMY.md` sum to exactly 400,000,000 pair outcomes. Recomputing the first and second moments from the integer outcome counts gives:

```text
E[X]   = 0.64996875 × P = (20,799 / 32,000) × P
E[X²]  = 45.17337525 × P² = (180,693,501 / 4,000,000) × P²
Var[X] = 44.7509158740234... × P²
σ      = 6.689612535418134... × P
```

Before computing moments, the ticket-level table was also reconstructed from the row buckets `(payout, slots) = (0,17500), (1,1700), (2.5,600), (5,180), (100,19), (500,1)`: the Cartesian product of the two independent 20,000-slot rows, with ticket payout capped at 500×P, produces all 15 published ticket-level payout counts exactly (400,000,000 total pairs; zero row-count mismatches). The resulting moments reproduce the published `μ` and `σ` values to the stated precision. This was an independent arithmetic reconstruction, not a repository test or CI workflow. It validates the combinatorial table and its moments conditional on independent rows; it does not validate the RNG implementation, independence across different tickets, choice of `Z`, or authority of a deployment statistical reserve.

For a common-price cohort of `N` tickets, the documented statistical estimate therefore reads:

```text
R_stat(N,P) = P × [0.64996875 × N + Z × 6.689612535418134... × sqrt(N)]
```

Under the same-price independent-ticket model, the marginal change from issuing one additional ticket at current count `N` is:

```text
Δ_issue R_stat = P × [μ₀ + Z × σ₀ × (sqrt(N+1) − sqrt(N))]
```

and removing one unresolved ticket at count `N > 0` changes the estimate by:

```text
Δ_remove R_stat = P × [−μ₀ + Z × σ₀ × (sqrt(N−1) − sqrt(N))]
```

where `μ₀ = 0.64996875` and `σ₀ = 6.689612535418134...`. These equations describe the statistical estimator only. They are not ProtectedCapital deltas and are not a substitute for the exact realized payout/liability transition in V3.

## 9. Verification status and next safe steps

**Confirmed by source inspection**
- PRE-RICH defines the current two-row ticket distribution; an independent exact-count calculation reproduces the stated `μ`/`σ` moments to the published precision.
- PRE-RICH documents `Nμ + Zσ√N` as a statistical risk model and keeps deterministic worst-case protection separately.
- V3 `v3UnresolvedReserve` is the nominal face-price sum, not the statistical formula.
- V3 ProtectedCapital uses deterministic WCE plus separately carried protected components.
- The current Issue admission function and the Cardano Economic Gate have no explicit `μ`/`σ`/`Z` model input or statistical threshold.
- Existing PA3/PA4 evidence does not qualify `ReserveProtection` as the statistical reserve or prove its source/disjointness.

**Not established in this audit**
- a governed value or admissible range for `Z`;
- a cross-ticket independence/perimeter claim;
- exact portfolio formula for mixed ticket classes under authoritative `Ω`;
- whether the statistical model is intended to gate sale/class activation or only to report expected risk;
- a deployment-bound statistical reserve source, ledger category, custody path or evidence record;
- R1/Kc/QNE closure.

**Next safe sequence**
1. Agent A reproduces the current payout moments independently from the canonical exact outcome table.
2. Agent A has derived the same-price and mixed-class symbolic lifecycle vector for Issue/Reveal/Claim/Expire; next validate its portfolio assumptions and compare against action/refinement fixtures.
3. Agent B reviews the source-to-datum mapping and confirms that no statistic is being conflated with face reserve or ReserveProtection.
4. Only after that review, the protocol/specification authority can resolve the statistical model's role, `Z`, dependence assumptions, rounding and evidence authority.
5. Only an explicit approved decision may be translated into code and a governed profile; no current 500×, V3, Reveal, deployment or ProtectedCapital formula is changed by A-R1.

**CI/test status:** no tests or CI were run as part of this read-only baseline.  
**Ledger status:** no chain observation, signature, transaction, bootstrap, approval or deployment action was run.


## 10. Recovered dual-layer, state-dependent risk / intensity architecture (2026-11-07)

### 10.1 Why the A-R1 framing is being refined

The preceding sections correctly distinguish nominal face reserve, deterministic worst-case exposure, the documented ticket-level statistical estimate, and `ReserveProtection`. They do not, by themselves, capture the separate **two-layer risk/intensity architecture** recovered from the project records.

The recovered model is not a proposal to replace deterministic protection with a statistical model, nor is it a proposal to add `Nμ + Zσ√N` mechanically to `ProtectedCapital`. It separates:

1. an always-on **deterministic safety floor** that constrains whether a candidate post-state is admissible; and
2. a **state-dependent intensity/allocation layer** that governs how much of the surplus left after protection may be exposed, and in which operating regime.

This distinction changes the interpretation of the A-R1 gap: the question is not only whether a statistical reserve has been wired into the Cardano Gate. The missing normative contract is also whether and how risk observations are allowed to modulate deployable surplus, class/intensity, and operational regime above the unmodified safety floor.

### 10.2 Source hierarchy and normative status

The recovered records have different authority and scope:

| Source | Recovered content | Status / scope |
|---|---|---|
| IMMORTAL Canonical Economic Register, risk-engine sections | Worst-Case Analysis and Statistical Risk Analysis are separate mechanisms. The applicable analysis is selected trajectory-by-trajectory; either or both may be relevant. Their outputs feed a Protection Requirement and Gate. | Canonical architecture. It does **not** prescribe a universal additive formula, universal replacement rule, or binary global mode switch. |
| Library design note `Testo incollato(20261102-204028).txt`, D3 “Economic Engine for Agents” | Explicit two-layer safety: worst-case floor plus dynamic surplus/intensity budget; operating classes C0–C3; hysteresis and quiescence. | Recovered design; explicitly marked non-normative relative to the current repository. It belongs to the separate PRE-RICH Arb Agent application and does not merge the Agent with Scratch & Win or its PrizePool. |
| `PRE-RICH/src/PreRichAwraReference.ts` | Static current-model probability adaptation and candidate evaluation; caller supplies authorized policy/risk/viability functions. | Research/conformance reference, not a canonical policy selector. |
| `PRE-RICH/src/PreRichAwraDynamicReference.ts` | Reconstructed v36 dynamic risk envelope and observed v37 budget-fit behavior. | Historical reference only. The original v37–v39 selector source is unavailable; observed targets are not normative parameters. |

The Canonical Economic Register's trajectory-dependent treatment is the governing IMMORTAL statement. The more explicit Agent D3 model is useful evidence of the intended two-layer pattern, but cannot be promoted into Scratch & Win or the universal kernel without a separate specification decision.

### 10.3 Layer A — deterministic floor (always on)

For every candidate transition, the post-state must continue to satisfy the applicable deterministic protection conditions: the defined `ProtectedCapital`, `A_safe` and authoritative scenario envelope `Ω`. A statistical confidence level or a positive dynamic budget cannot authorize a transition that violates this floor.

For current PRE-RICH, this preserves the existing deterministic WCE/500× boundary and the established lifecycle transfer from unresolved exposure to realized liability. It does not change any constant, formula, datum, validator, V3 or Reveal behavior.

### 10.4 Layer B — dynamic surplus and exposure intensity

The recovered D3 design expresses the post-protection residual surplus and candidate exposure budget as:

```text
S_res = max(0, EEV - ProtectedCapital - L_dedicated)
B_t   = α_t(S_res, class_t, stats_t) × S_res
0 ≤ α_t ≤ 1
Notional ≤ min(B_t, RiskEnvelope)
```

Interpretation:

- `S_res` is the residual amount available to the application only after the applicable protection and dedicated-liability perimeter has been respected.
- `α_t` is state-dependent: it may depend on residual surplus, operating class and qualified statistics. It is an intensity/allocation coefficient, not a safety multiplier and not a substitute for the deterministic floor.
- `RiskEnvelope` independently caps the candidate exposure. Passing the surplus-budget calculation does not waive the exposure envelope; passing the envelope does not waive Layer A.
- The model therefore regulates the **amount and regime of new exposure**, rather than turning worst-case protection off when a statistical mode is selected.

This D3 expression must retain its original application boundary. In particular, the Arb Agent uses a separately mandated capital perimeter; it is not authorized to consume PRE-RICH Game PrizePool, Jackpot or Treasury funds. Any reuse in Scratch & Win first requires a game-specific definition of `S_res`, dedicated liabilities, authority and non-overlap.

### 10.5 Dynamic risk envelope and AWRA reference lineage

The repository's historical dynamic reference reconstructs a separate envelope calculation:

```text
exposurePressure = unresolvedWorstCaseExposure / executableCash
headroomFactor   = max(0, 1 - exposurePressure)
allowedRatio     = 1 + eta × headroomFactor
```

The module also records observed v37 budget-fit behavior as `max(historicalFloor, eta / 2)`. Its header explicitly classifies the material as historical recovery and says the original v37–v39 selector is unavailable. The static AWRA reference separately evaluates candidate probability distributions and leaves policy preference to an external caller.

These are two useful pieces of the recovered lineage, but they must not be conflated:
- the D3 formula `B_t = α_t × S_res` is the application-level dynamic allocation expression;
- the dynamic risk envelope is an additional exposure admissibility bound;
- the ticket statistical estimate `Nμ + Zσ√N` is a payout-distribution risk measure;
- the 55-candidate grid, historical budget floor/cap and observed `eta / 2` are reconstruction evidence, not an adopted selector.

No final α function, Z, fixed budget fraction, cadence, Pareto/lexicographic objective or v37–v39 selector is established as normative.

### 10.6 Operating regimes, hysteresis and quiescence

The D3 note describes operating regimes:

| Regime | Intended intensity |
|---|---|
| C0 | Observe / withdraw; no new exposure |
| C1 | Micro; one leg |
| C2 | Standard; two legs |
| C3 | Expanded operation, only in a healthy regime |

Promotion and contraction use separate high/low thresholds (hysteresis) to avoid regime thrashing. Quiescence is an admissible protective operating condition: no new exposure, while risk-reducing close/reduction and withdrawal of free funds remain possible. The design lists stale oracle data, inadequate depth, drawdown, revoked mandate, `α → 0` and incomplete evidence as possible quiescence triggers.

These C0–C3 regimes are **not** the PRE-RICH Game class ladder, not `KA/KC/KD`, and not a reinterpretation of `CurrentActiveClass` or `HighestClassEverActivated`. They are a separate proposed application controller. Their numeric thresholds, recovery rules and authority are not frozen for Scratch & Win.

### 10.7 Relationship to the A-R1 findings and R1/QNE

The two-layer recovery refines, but does not invalidate, the prior A-R1 quantity and lifecycle findings:

- Face reserve remains `Σ(P_i × N_i)`.
- Current PRE-RICH deterministic WCE remains `500 × Σ(P_i × N_i)`.
- The documented payout-distribution estimate remains a statistical measure, not the WCE and not an automatically funded component.
- `ReserveProtection` remains a separate field whose source, derivation and non-overlap must be evidenced.
- Any dynamic allocation budget must be downstream of the deterministic protection boundary; it cannot be used to reduce that boundary or to spend capital already needed for liabilities.

The recovered intensity layer does **not** close the concrete S0 R1/QNE obstruction in §7. A lower `α`, a quiescent regime or a statistical estimate does not itself supply the currently missing available, non-eroding successor witness under the existing action relation and authoritative `Ω`. A no-new-exposure/quiescent action would need to be formally represented and certified before it could count as an R1 witness; this addendum does not invent or authorize one.

### 10.8 Required contract before any implementation

Before integrating this pattern into the current PRE-RICH Game or IMMORTAL production Gate, the specification authority must explicitly settle:

1. application and capital perimeter (Arb Agent versus Scratch & Win; no cross-use of PrizePool/Treasury);
2. exact definitions and evidence sources for `EEV`, `ProtectedCapital`, dedicated liabilities, executable cash and residual surplus, including non-overlap;
3. the authority, distribution/horizon, dependence assumptions, freshness, confidence and precision of statistical/risk inputs;
4. the `α_t` policy, exposure-envelope semantics and their relationship to trajectory-specific Worst-Case and Statistical Risk Analysis;
5. regime transition, hysteresis, quiescence, recovery and admissible risk-reduction actions;
6. the typed output from risk/intensity assessment into `Protection Requirement`, Economic Gate and any deployment certificate;
7. the evidence and conformance tests that demonstrate the floor remains invariant through Issue/Reveal/Claim/Expire and all permitted operational regimes.

Until then, the safe disposition is:

- **Two-layer pattern recovered:** yes.
- **Canonical IMMORTAL floor + trajectory-dependent risk-analysis architecture:** yes.
- **Agent D3 intensity/regime controller adopted for PRE-RICH Game:** no; non-normative design only.
- **AWRA references:** recovered/reproduced as research references; final selector remains open.
- **Production Gate/Plutus integration authorized by A-R1:** no.
- **Changes to 500×, ProtectedCapital, V3, Reveal or deployment:** none authorized.



## 11. Agent B source review — typed risk-mode selector boundary (2026-11-07)

The independent production-source review found a more direct connection to the previously recovered dual-model architecture than the AWRA reference modules alone.

### 11.1 The remembered risk-mode choice exists as a typed scaffold

`IMMORTAL/kernel/RiskProtectionBridge.hs` declares:

```haskell
data RiskMode
  = DeterministicWorstCaseOnly
  | StatisticalOnly
  | DeterministicAndStatistical
```

Its `RiskAssessment` binds `raMode` and optional deterministic/statistical observations to a profile version and trajectory ID. This is strong source evidence that the architecture intended risk assessment to be trajectory-specific, with three possible risk-analysis configurations.

But this is a **typed interface, not a working state-to-mode selector**. The mode is supplied inside `RiskAssessment`; no inspected code derives it from the current protocol regime or trajectory facts.

### 11.2 The bridge currently supports deterministic-only

`deriveProtectionRequirement` accepts `DeterministicWorstCaseOnly` only when:
- profile version and trajectory ID match;
- evidence is verified;
- deterministic assessment is present and exactly equals the projected WCE;
- no statistical assessment or combination-rule version is smuggled into this mode.

It returns `UnsupportedRiskMode` for `StatisticalOnly` and `DeterministicAndStatistical`. Its `ProtectionRequirement` contains only the deterministic amount.

The module is exposed by `plutus/pre-rich-plutus.cabal` and has a dedicated `risk-protection-bridge-tests` suite. Those test sources cover deterministic acceptance and fail-closed statistical/combined cases. They were not executed in this audit.

### 11.3 No production admission connection yet

`PRE-RICH/onchain/PreRichEconomicAdmission.hs` imports `EconomicGate`, not `RiskProtectionBridge`. It creates the existing `EconomicGateInput` from truth/freshness/obligation evidence, EEV and immediate executable liquidity.

`IMMORTAL/kernel/EconomicGate.hs` has no risk mode, statistical reserve, `α_t`, dynamic budget or `RiskEnvelope` field. It checks evidence, immediate liquidity, post-state solvency and the all-`Ω)-successors certified-kernel condition.

Therefore the current flow is still deterministic WCE + Gate + Viability; the typed risk-mode bridge does not yet feed the production admission result.

### 11.4 Existing controls are real, but serve different purposes

- `src/preRichHysteresis.ts` implements PRE-RICH ticket-class activation/maintenance/contraction using `KA=8`, `KC=4`, `KD=4`. This is the Game class-capacity controller, not D3's C0–C3 AWRA intensity controller.
- `PreRichLifecycleTransition.hs` implements a separate `ACTIVE → QUIESCENT` transition and `QUIESCENT` maintenance with a real lifecycle nonce. Its QNE helper checks a non-empty explicit `Ω) witness set for non-eroding, safe, representation-preserving successors. It does not modify V3 economic fields or select a statistical risk mode.
- `PreRichRegimeState` has `PRE_GENESIS`, `GENESIS`, `ACTIVE`, and `QUIESCENT`, but the Cardano `GenesisRegimeCarrier` implements only `PRE_GENESIS → GENESIS`; the separate lifecycle module supplies the ACTIVE/QUIESCENT logic.
- AWRA static/dynamic modules remain research/historical references; the original v37–v39 selector is not recovered.

### 11.5 Corrected interpretation and next contract

The remembered “passaggio tra modelli in base allo stato” has now been located at the typed interface level: `RiskMode` is trajectory-bound in `RiskAssessment`. It has **not** been completed as a policy resolver or production flow.

Before implementation, the protocol authority must define the state/trajectory classifier, the exact conditions for each mode, the invariant hard floor, the semantics of `StatisticalOnly`, the dependence and evidence contract for statistical measures, any versioned combination rule, and the typed path into Admission/Gate.

Where the applicable profile makes a deterministic floor mandatory for the candidate trajectory, `StatisticalOnly` cannot suppress that floor: it may at most require a statistical criterion in addition, otherwise it remains unsupported. For current PRE-RICH V1 Issue, the 500× unresolved-ticket WCE is mandatory and remains binding. A future application profile could select a statistical payout criterion for a trajectory only through an explicit authority decision that changes that trajectory's payout-risk guarantee; it could not claim the current 500× pathwise coverage, and it would still have to preserve universal IMMORTAL invariants, known liabilities, any other mandatory deterministic floors, Economic Gate and Ω/viability. The Arb Agent D3 always-on floor is a separate application design and does not decide the PRE-RICH Game profile.

Full source review and file/blob references: [Agent B R1 RiskMode and Regime-Control Audit](AGENT-B-R1-RISK-MODE-AND-REGIME-CONTROL-AUDIT-2026-11-07.md).

**Disposition:** typed mode scaffold exists; only deterministic mode is supported; state-to-mode resolver and Admission integration are absent. No implementation or policy change is authorized by this audit.


## 12. Agent A — trajectory-to-RiskMode selection contract proposal (2026-11-07)

A separate proposal now formalizes the missing selector contract:

`docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md`

It interprets the existing three `RiskMode` values as analytical-mechanism selection results, not as safety switches. In particular, `StatisticalOnly` cannot waive universal invariants or any deterministic floor independently required by an application profile. PRE-RICH V1 still requires its current deterministic 500× unresolved-ticket WCE; a statistical result cannot replace it.

The proposal defines:
- the minimum authoritative inputs needed to resolve the mode (profile/version, pre-state and candidate transition commitments, trajectory definition, policy version, deterministic/statistical model references and evidence);
- the requirement that the mode be resolved from profile policy and authenticated trajectory facts, not trusted as a caller-selected value;
- an ordered fail-closed resolution sequence;
- a trajectory-family matrix for Issue, Reveal, Claim, Expire, EEV/liquidity deterioration, quiescence and the separate Arb Agent perimeter;
- the typed semantic output required before ProtectionRequirement can feed Admission/Gate;
- explicit decisions still requiring specification authority, including statistical role, `Z`, horizon, dependence, combined-mode semantics and non-double-counting.

The canonical Economic Register was rechecked: it states that the applicable profile supplies parameters and that IMMORTAL owns admissibility; trajectory-dependent selection is not a convenience choice by DApp, Adapter or user. It deliberately does not freeze a universal addition formula or a universal rule that one model replaces the other.

**Disposition:** proposal ready for authority review; no executable selector, new mode behavior, combination rule, numerical parameter or production integration is adopted. Existing RiskProtectionBridge behavior remains deterministic-only / fail-closed for the other two modes.


## 13. Agent A — synthesis: trajectory RiskMode, statistical cohort proof and adaptive intensity (2026-11-08)

This section reconciles three related but distinct mechanisms. They may coexist in one future profile, but none can be used as a substitute for the others.

### 13.1 Two independent axes, not one global toggle

**Axis 1 — required risk-analysis mechanisms for a candidate trajectory.** The IMMORTAL Canonical Economic Register and the typed RiskProtectionBridge describe the three analytical modes:

- DeterministicWorstCaseOnly
- StatisticalOnly
- DeterministicAndStatistical

The mode is a **profile-owned result of authenticated state + candidate action + trajectory facts + versioned policy**. It is not a caller preference, frontend setting, relayer parameter, or a free global switch. A state change can change the resolver's result only when the profile policy explicitly maps that verified state/trajectory to another required analysis mode.

The bridge currently accepts only DeterministicWorstCaseOnly; its other two modes fail closed, and it is not connected to PreRichEconomicAdmission. PRE-RICH V1 Issue continues to require the deterministic 500× unresolved-ticket WCE. Therefore no production mode transition or probabilistic sale capacity is currently available.

**Axis 2 — operating intensity / discretionary allocation after protection.** The recovered D3 note (Testo incollato(20261102-204028).txt) describes a second layer: compute a residual surplus after the applicable protection and dedicated obligations, then bound new discretionary notional by a state-dependent budget and a separate RiskEnvelope. This is an intensity/allocation controller, not a risk-analysis mode. It may reduce or cap optional new exposure; it cannot reduce ProtectedCapital, enlarge the safe action set, or bypass the Economic Gate / viability.

D3 is explicitly the **PRE-RICH Arb Agent** design with a separate Solo/Pool mandate and capital perimeter. Its S_res, α_t, RiskEnvelope and C0–C3 regimes are not Scratch & Win Game semantics. The PRE-RICH Game class hysteresis (KA=8, KC=4, KD=4) and PRE_GENESIS/GENESIS/ACTIVE/QUIESCENT lifecycle are separate controllers. Any Game-specific intensity layer requires its own policy and capital/obligation definitions; no D3 coefficient or regime is imported here.

### 13.2 Where the new Cantelli result belongs

The dependence-robust Cantelli predicate in the companion audit is a candidate **Statistical Risk Analysis** for one frozen, pre-outcome set of Pending tickets enrolled across one or more Beacon rounds sharing one B1 PrizePool. Every included round must still be BeaconPending at the common freeze boundary; membership is then closed before the first included outcome becomes available. It is not:

- the deterministic WCE;
- a ProtectedCapital or ReserveProtection component;
- the D3 α_t value or adaptive notional budget;
- a per-round limit that can be repeated against the same Pool;
- an unconditional rolling test for future Issues after ticket outcomes become available.

It supplies a candidate statistical constraint for a precisely defined population, horizon, tail ceiling and profile version. Its use would require the authority to freeze at least the PMF/profile version, the complete pre-outcome membership across included BeaconPending rounds, membership closure, aggregate shared-Pool perimeter, global ε, Beacon/randomness assumptions, conditional-information boundary, exact integer precision and evidence provenance. Pending tickets from a round already BeaconReady at a later epoch boundary are not fresh unconditional draws: they must remain covered by their original epoch / separately allocated capital or by a valid conditional-moment proof. Any new epoch's available headroom must be E*_new = effectivePool_B1 − C_other, where C_other is authenticated capital ring-fenced to all excluded epochs (excluding known liabilities / face reserve already deducted); the current B1 datum has no explicit epoch/capital-tranche fields and cannot authenticate C_other. The same global ε and the same Pool capital cannot be restarted independently for each round or Issue.

The previously documented Nμ + Zσ√N expression and the new Cantelli bound are two different statistical constructions. They must not be merged, treated as equivalent, or selected opportunistically from whichever yields a larger ticket count. The authority must choose a declared statistical criterion and version for a particular trajectory.

### 13.3 The capacity trade-off is explicit

At the same hypothetical C=4,000 USDM initial shared B1 pre-Reveal EffectivePool:

- **Current V1 deterministic floor:** 500× WCE permits 8 Genesis tickets.
- **Research-only Cantelli candidate:** one frozen set enrolled across multiple BeaconPending rounds before any included outcome is available gives total aggregate ceilings 18 / 42 / 59 at global ε=0.1% / 0.5% / 1.0%, under the stated common marginal assumptions. These are total ceilings for that one sealed set, not quotas for later rounds or epochs.

The second row is **not an increase available while retaining the same 500× pathwise WCE for every unresolved ticket**. If both constraints are required for the same exposure, the deterministic WCE remains binding and the statistical condition cannot raise the admissible count above it. Reaching a larger probabilistic capacity would require a separate, explicit PRE-RICH Game profile decision about whether the payout trajectory is governed by a statistical tail guarantee instead of the current per-ticket 500× deterministic reservation, while all other mandatory IMMORTAL invariants and known liabilities remain protected. Such a profile would offer a probabilistic guarantee, **not** the current unconditional 500× solvency guarantee. No such decision has been made.

This is the decisive distinction: a dynamic intensity calculation cannot mathematically turn 8 into 18 while the same 500× exposure remains fully protected. The governing risk requirement for the payout trajectory must be explicitly changed before such a capacity can be authorized.

### 13.4 Candidate trajectory contract — research mapping, no policy selection

| Candidate trajectory | Current V1 treatment | Future statistical / intensity relevance |
|---|---|---|
| Issue: new Pending ticket, before its Beacon becomes Ready | Deterministic WCE 500×, atomic shared-Pool face reserve, EEV/liquidity Gate and viability; deterministic-only bridge | Only a future profile may authorize another required analysis. Freeze the full multi-round risk set before outcomes are available. A statistical-only payout rule would be a different guarantee and explicit policy change. |
| Issue after another relevant outcome is public/privately knowable | Current V1 deterministic rule remains the authority | Do not restart unconditional moments. Require conditional moments over adversarial information, or a formally allocated risk epoch / global construction. |
| Reveal | Release unresolved WCE/face reserve under current rules and crystallize the actual payout as a known liability | Statistical evidence may describe the remaining portfolio only under the applicable frozen/conditional model; it cannot reduce the actual payout liability or change Reveal ordering rules. |
| Claim / Expire | Exact settlement / expiry lifecycle and rights remain authoritative | Statistical or intensity logic cannot erase a crystallized liability, alter expiry rights, or bypass the lifecycle transition. |
| EEV/liquidity deterioration, regime change, quiescence | Existing source, freshness, Gate, A_safe, Ω and lifecycle constraints apply | A future profile may specify contraction/no-new-exposure or another analysis mode; it must be trajectory-bound and cannot itself manufacture an R1/QNE successor witness. |

### 13.5 Required separation in any future typed interface

A future RiskAssessment / ProtectionRequirement / intensity output should preserve independent fields and evidence for:

1. deterministic mandatory floor and its profile-derived amount;
2. statistical assessment, with distribution/marginal model, population, horizon, tail criterion, dependence/conditional-information assumptions, rounding and evidence digest;
3. trajectory-to-mode policy version and the authenticated state/action commitment that selected it;
4. optional intensity budget / RiskEnvelope, its source, capital perimeter and policy version;
5. global risk-budget epoch / allocation identifier and proof that capital and ε are not double-counted;
6. the final Economic Gate and universal viability result for the exact same candidate.

The current interfaces do not yet carry this complete contract. RiskProtectionBridge remains a deterministic-only scaffold, PreRichEconomicAdmission has no statistical input, and the Economic Gate has no α_t / RiskEnvelope input. This is a mapping gap, not permission to add fields or alter production semantics without the required decisions.

### 13.6 Disposition

- The remembered state/trajectory-dependent model selection corresponds to the typed RiskMode architecture; the remembered dynamic/intensity behavior is a separate second axis.
- Static, pre-outcome, multi-round Cantelli aggregation is mathematically recorded for one sealed set whose included rounds are BeaconPending at freeze; the current Pool datum does not implement epoch membership or ring-fenced capital.
- Dynamic adaptive Issue after outcomes are knowable, the PRE-RICH Game-specific intensity model, global lifetime ε, exact capital qualification, Beacon qualification, typed Gate integration and authority decisions remain open.
- Current V1 deterministic 500×, ProtectedCapital, V3/Reveal, RiskProtectionBridge fail-closed behavior, QNE/R1 and first-Issue blockers remain unchanged.


## 14. Agent A — explicit state/action RiskMode applicability matrix (2026-11-08)

The detailed resolver contract and action matrix are recorded in [the RiskMode selection proposal, §11](https://github.com/LiberoNuvola/Immortal-Protocol/blob/work/immortal-green-closure/docs/COORDINATION/AGENT-A-R1-TRAJECTORY-TO-RISK-MODE-SELECTION-CONTRACT-PROPOSAL-2026-11-07.md).

Important PRE-RICH source reconciliation:

- The Economic Algorithm Sale sequence expressly lists both deterministic exposure evaluation and statistical reserve evaluation.
- The current V1 application profile still fixes the 500× WCE; current RiskProtectionBridge accepts deterministic-only, and PreRichEconomicAdmission / EconomicGate contain no statistical assessment input.
- The current source does not settle whether the Sale statistical evaluation is report-only or a binding second admission criterion. The Z/confidence/horizon, cross-ticket dependence, population/epoch and pass/fail rule are not fully qualified. Therefore the source-to-implementation gap is recorded; this audit does not pretend that Combined mode is already implemented or authorized.
- Reveal crystallizes actual payout as a known liability; Claim settles that known liability; Expire closes the right under the frozen lifecycle. These are not new unconditional payout draws and cannot reset a statistical epoch or recycle its ε.
- EEV/liquidity deterioration requires the relevant liquidation/stress model; the Classic-6 payout PMF cannot be reused as a market-liquidity model.
- The separate PRE-RICH Arb Agent D3 intensity architecture is not Scratch & Win Game RiskMode policy.

The target resolver derives one unique required-analysis set from the authenticated profile, pre-state, candidate action/post-state and trajectory evidence. Caller-selected modes, ambiguous/missing policy mappings, missing required evidence or unqualified model parameters fail closed. State-based mode changes can affect new candidates/new cohorts only; existing ticket guarantees remain immutable. Exact policy predicates, mode thresholds, statistical role/model, proof/resource format and epoch/budget state remain specification-authority decisions.

No code, test, profile, threshold, Z, alpha, 500× rule, RiskProtectionBridge, V3/Reveal, QNE/R1, wallet, deployment or ledger state changed.
