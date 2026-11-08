# Agent A — adaptive Issue capacity and transition-to-RiskMode matrix

**Date:** 2026-11-08  
**Branch:** `work/immortal-green-closure`  
**Baseline:** current branch inspected after the 2026-11-08 A-R1 Cantelli cohort audit and Agent B's statistical Issue-binding / cohort-accumulator proposals.  
**Classification:** ECONOMIC RESEARCH + POLICY-MAPPING PROPOSAL — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Owner:** Agent A — PRE-RICH economics, EEV and admission policy  
**Independent boundary review:** Agent B  
**Scope:** PRE-RICH Scratch & Win only. D3 Arb Agent / separate principal perimeter excluded.

## 1. Executive disposition

This report joins three existing pieces of work:

1. Agent A's dependence-robust Cantelli bound and fixed-cohort Reveal-path result;
2. Agent B's RiskDecision binding contract for one exact Issue, cohort, Pool snapshot and model;
3. Agent B's Cardano feasibility finding that a cohort accumulator and freeze barrier are not enforceable against the current Registry/Mint/Pool contracts.

The economic conclusion is positive but conditional:

- A governed probabilistic cohort profile can produce a materially higher candidate ticket capacity than the current deterministic 500× rule.
- A fixed, pre-outcome cohort can be bounded without assuming independence between tickets, provided every ticket retains the canonical Classic-6 marginal distribution.
- That result does **not** preserve the current unconditional 500× guarantee on every unresolved ticket. It is a different, explicitly probabilistic application guarantee.
- The existing hard deterministic accounting of known liabilities, settled claims, Jackpot, mandatory costs and universal viability constraints must remain in force.
- The current V1 profile, RiskProtectionBridge, B1 validator and first-Issue path remain unchanged and fail-closed. No statistical mode is currently admitted.

The selector must resolve from authenticated profile + state + candidate action + trajectory + evidence. It must never accept a caller-selected mode as authority and must never choose a mode merely because it produces a larger ticket count.

## 2. Do not conflate the five economic quantities

For a candidate cohort U sharing one B1 PrizePool, use distinct names:

| Quantity | Meaning | Treatment |
|---|---|---|
| F = Σ Pᵢ | Nominal face value of Pending cohort tickets | Already deducted through B1 unresolved face reserve when calculating effectivePool |
| W = 500 × F | Current PRE-RICH V1 deterministic worst-case exposure | Mandatory in V1 ProtectedCapital |
| S = Σ Xᵢ | Aggregate eventual payout of the fixed cohort | Random variable under the qualified payout model |
| E_pool | B1 effectivePool at one exact ledger cut | ppTotalLiquidity − ppPendingLiabilities − ppUnresolvedReserve − ppLockedJackpot |
| C_other | Additional capital committed to older/parallel epochs, excluding amounts already deducted as known liabilities or face reserve | Must be authenticated, disjoint and not assumed zero |

For the cohort candidate:

`E* = E_pool - C_other`

The Cantelli test compares the complete cohort payout S with E*. It must not subtract F again: the B1 effectivePool formula has already deducted the aggregate unresolved face reserve. Equally, a caller must not report gross Pool liquidity or Treasury bootstrap as E*.

The B1 source confirms that TicketIssued leaves ppTotalLiquidity unchanged and increments ppUnresolvedReserve by exactly the ticket price. Therefore, with no other state changes, every new Issue reduces B1 effectivePool by P. Every candidate Issue must use the exact post-state Pool snapshot and recompute E* for the whole post-Issue cohort.

Current ppTotalLiquidity is an accounting value derived through the configured Oracle State valuation path; it is not, by itself, proof of physically present tUSDM or immediately executable settlement liquidity. The capital source / asset qualification remains a separate gate under Issue #37.

## 3. Three RiskMode values: semantic boundary

RiskMode selects analytical mechanisms. It is not a safety override, an economic regime, a game class, a liveness permission or an authorization credential.

| Mode | Meaning | What it cannot do |
|---|---|---|
| DeterministicWorstCaseOnly | Require the profile's deterministic bounded-exposure assessment for the trajectory | Cannot waive universal invariants or known liabilities |
| StatisticalOnly | Require the profile-authorized statistical assessment for the trajectory's uncertain exposure component | Cannot waive deterministic accounting of known liabilities, mandatory capital floors, asset/liquidity qualification or QNE |
| DeterministicAndStatistical | Require both assessments as separately typed outputs for the same trajectory | Cannot imply addition, substitution, netting or a combined threshold without a separately approved versioned rule |

### Current PRE-RICH V1

For every V1 Issue that creates unresolved ticket exposure, deterministic WCE remains mandatory at 500×. The current bridge accepts only DeterministicWorstCaseOnly when the assessment exactly matches canonical projected WCE. StatisticalOnly and DeterministicAndStatistical fail closed. The bridge is not connected to production PreRichEconomicAdmission.

Therefore:
- a statistical calculation may be run as research/monitoring, but it cannot raise current V1 sale capacity;
- retaining the 500× WCE for every Pending ticket means the 500× bound still determines the maximum;
- no statistical value may be inserted into ReserveProtection or used to reduce ProtectedCapital.

### Candidate future statistical cohort profile

A profile that admits more than the V1 500× count would have to define a different guarantee for the unresolved random payout component. In that profile, StatisticalOnly could select the cohort-tail model for that component while independent deterministic checks continue to protect already-crystallized liabilities, Claim obligations, Jackpot, required capital, fees and universal invariants.

This is a profile-level policy change, not a RiskMode-only code change. It changes the guarantee for Pending payout exposure and must be explicit to ticket buyers, governed before new commitments, separately versioned, and non-retroactive.

DeterministicAndStatistical is appropriate only if an authorized profile requires both the statistical cohort test and a distinct deterministic bound on the same candidate. If the 500× Pending WCE remains mandatory, this combined assessment does not increase capacity. No combination formula is inferred here.

## 4. Transition-to-risk matrix

The table separates mandatory ledger/accounting treatment from the candidate statistical role. It is not an adopted executable selector map.

| Candidate action / trajectory | Deterministic treatment that always remains | V1 mode / disposition | Candidate statistical-cohort treatment |
|---|---|---|---|
| Issue, cohort OPEN, all included BeaconTargets still Pending | Exact ticket price, NFT/PrizeDatum, B1 reservation, post-state solvency and 500× WCE | DeterministicWorstCaseOnly | Under a separately approved cohort profile, recompute the full post-Issue cohort predicate against the post-Issue E* and one unchanged epoch risk budget. No per-ticket isolated calculation |
| Issue after any included result is available to a ticket holder | Exact V1 deterministic protection | V1 remains deterministic; no statistical downgrade | Static unconditional Cantelli is unavailable for the affected information set. Require a qualified conditional-moment proof or reject statistical admission |
| Issue while a prior cohort is FROZEN / RESOLVING | Existing obligations and Pool solvency | Existing profile rules only | Reject append to frozen cohort. A new cohort requires real capital partition, lifetime-risk allocation and payout ownership; none exists in current B1 |
| Reveal from a frozen cohort | Apply exact payout, pre-transition B1 affordability check, liability crystallization and face-reserve release | Deterministic ledger transition; no statistical replacement | The frozen cohort certificate remains an ex-ante bound for the whole set. Do not reapply the original unconditional PMF to the selectively remaining Pending subset |
| Expire from a frozen cohort | Apply exact expiry/right rules and release the correct face/WCE under the applicable profile | Deterministic ledger transition | Expiry does not reset or replenish the epoch ε. Keeping the ticket in the original frozen aggregate is conservative; removing it from the proof requires a governed lifecycle refinement |
| Claim | Reduce the exact known crystallized liability by the settled amount | DeterministicWorstCaseOnly / exact deterministic accounting | No statistical estimate may reduce or bypass a known liability. Claim does not replenish a lifetime risk budget |
| ACTIVE → QUIESCENT | Enforce lifecycle transition and universal QNE over the authoritative Ω | Separate lifecycle proof; RiskMode does not create QNE | Statistical signals may be monitoring inputs only if policy authorizes them; they cannot certify Ω or establish non-eroding witness availability |
| QUIESCENT maintenance / Recovery | Preserve nonce, state continuity, capital and QNE obligations | Separate lifecycle proof | Recovery requires governed, authenticated state/trajectory criteria. No automatic switch to StatisticalOnly or sale restart |
| EEV / Oracle / liquidity deterioration | Validate source, freshness, executable liquidity, obligations and solvency | Existing Economic Gate; no inferred mode | A statistical model cannot repair unqualified valuation or missing liquidity evidence. Combined analysis is possible only under an explicit profile rule |
| Terminal cohort closure | Reconcile every member, B1 accounting and all remaining obligations | Deterministic reconciliation | Close the risk epoch only when all members are terminal and accounting reconciles. ε and capital allocated to it are consumed, not recycled by default |

### Important interpretation

The statistical assessment concerns uncertainty in the **unresolved cohort payout**. It is not a replacement for exact accounting once an outcome or liability is known. Reveal moves a ticket from uncertain cohort exposure to an actual crystallized liability; Claim settles a known liability; Expire follows the separately governed expiry rights.

The statistical proof is established for the frozen set at its valid pre-outcome boundary. It is not recalculated on the residual Pending set after some users have learned outcomes and selectively revealed, withheld or expired tickets.

## 5. Candidate selector: required order and rejection rules

A future resolver must follow this order:

1. **Resolve authority:** load the exact deployed application profile and its approved risk-policy version/digest. A document hash without authenticated adoption is insufficient.
2. **Bind exact state:** authenticate the exact V3 carrier and B1 Pool UTxO references, datum hashes, network, slot/ledger cut and state versions.
3. **Bind exact action:** derive the Issue class/price, pre-state, candidate post-state and transaction fingerprint. A certificate for one ticket cannot authorize another.
4. **Resolve trajectory:** classify the actual transition and information boundary, including whether each included BeaconTarget is Pending or Ready and whether a result is available to any relevant ticket holder.
5. **Resolve the complete risk perimeter:** establish the Pool-wide Pending set, membership completeness, one cohort ID/epoch sequence, model/profile compatibility, and no omitted round sharing the same Pool.
6. **Derive capital:** calculate E_pool from the exact Pool datum and qualified asset/valuation evidence; subtract only separately evidenced, non-overlapping C_other. Missing C_other evidence is unavailable capital, not zero.
7. **Resolve the mechanism from policy:** use only the profile's predeclared trajectory mapping. Do not select whichever mode makes the candidate pass.
8. **Verify required assessment(s):** recompute exact deterministic WCE and/or the approved statistical integer predicate. Bind model, cohort, capital, risk-budget and evidence digests.
9. **Apply independent hard constraints:** known liabilities, mandatory protected components, asset/source qualification and Ω/QNE remain independently checked.
10. **Admit the exact candidate atomically:** the transaction must consume the exact state to which the decision is bound and update Pool, cohort accumulator, ticket NFT and PrizeDatum together.

Missing, stale, ambiguous, duplicated, outcome-selected, overlapping or unverifiable inputs reject the statistical candidate. No downgrade, fallback, epsilon reset or caller-authored mode is allowed.

### Candidate pre-outcome cohort path

```text
AUTHENTICATED PROFILE + POLICY
            |
EXACT B1 POOL + COMPLETE PENDING SET
            |
CANDIDATE ISSUE / POST-STATE
            |
ALL INCLUDED REGISTRIES STILL PENDING
            |
POOL-WIDE COHORT APPEND (ATOMIC)
            |
RECOMPUTE F, E*, CANTELLI PREDICATE
            |
DETERMINISTIC KNOWN-OBLIGATION / VIABILITY FLOOR
            |
ADMIT OR REJECT EXACT ISSUE
            |
OBJECTIVE FREEZE BEFORE ANY BEACON READY
            |
RESOLVE REVEAL / EXPIRE / CLAIM
            |
RECONCILE AND CLOSE EPOCH
```

This is a research architecture. Current MintPolicy/B1/Registry contracts do not implement mandatory cohort enrollment or a trustworthy freeze barrier. Agent B's feasibility audit also identifies the unresolved per-round Registry identity/publisher boundary and the need for a deterministic, permissionless freeze/liveness rule.

## 6. Capacity: correct capital cut and illustrative frontier

The Classic-6 ticket-level moments are:

- μ = 20,799 / 32,000 = 0.64996875;
- σ² = 9,164,987,571 / 204,800,000;
- σ ≈ 6.689612535.

For a fixed cohort with ticket prices Pᵢ, F = ΣPᵢ and aggregate payout S = ΣXᵢ. If each ticket retains the canonical Classic-6 marginal law, Cauchy–Schwarz gives Var(S) ≤ σ²F² for arbitrary cross-ticket dependence. Cantelli then gives:

`Pr(S > C) ≤ σ²F² / [σ²F² + (C − μF)²]`, for C > μF.

For ε = a/b, with 0 < a < b and C,F in the same integer sub-unit scale, the exact predicate is:

```text
D = 32000*C - 20799*F
require D > 0

5*(b-a)*9164987571*F^2 <= a*D^2
```

### 6.1 Illustrative Genesis frontier with the B1 face-reserve delta included

Assumptions solely for this calculation:
- G = 4,000 USDM of free cohort headroom before adding this cohort's unresolved face-price reserve;
- every ticket costs P = 1 USDM (100 USDM sub-units);
- no older/parallel cohort, no other Pool outflow, no additional encumbrance, no profile heterogeneity;
- all tickets belong to one static pre-outcome set and the candidate risk budget applies to that entire set.

After N Issues, B1's exact reservation rule means:

`F_N = N × P`
`E*_N = G − F_N`

The Cantelli predicate therefore uses C = E*_N, not a constant 4,000 USDM after each Issue. The existing deterministic comparison uses the same starting free headroom G and the current V1 maximum 500×P per unresolved ticket.

| Whole-cohort ceiling ε | V1 deterministic capacity from 4,000 USDM | Candidate Cantelli capacity | Cantelli bound at N | Bound at N+1 |
|---:|---:|---:|---:|---:|
| 0.1% | 8 | 18 | 0.091897% | 0.102466% |
| 0.5% | 8 | 41 | 0.484125% | 0.508332% |
| 1.0% | 8 | 58 | 0.977919% | 1.012435% |

This is the most useful apples-to-apples illustration for the stated 4,000-USDM starting budget: the candidate frontier is 18 / 41 / 58 rather than 8, **conditional on selecting the corresponding risk ceiling and satisfying every cohort/randomness/capital requirement**.

For comparison, Agent A's prior table held C = 4,000 USDM as the already-net B1 effectivePool at the final cohort risk cut. Under that different snapshot convention, the corresponding values are 18 / 42 / 59. The two tables are not contradictory: the second convention assumes the 4,000 is already available after all unresolved face reserves; this section starts with 4,000 before this cohort's face reserve is deducted.

Neither table means the Treasury's 4,000-USDM bootstrap is 4,000 USDM of B1 payout liquidity. The Genesis PRE Treasury bootstrap and the B1 PrizePool are distinct perimeters. Actual E* must be observed, qualified and derived from the exact B1 Pool state.

### 6.2 What the increase means — and does not mean

The higher count is a probabilistic upper-bound guarantee for the **whole fixed cohort**, not a deterministic promise that every ticket can pay 500×. It bounds the probability that aggregate payouts exceed the cohort's pre-Reveal available Pool headroom, subject to the canonical ticket marginal distribution.

If PRE-RICH V1 continues to require 500× WCE for every Pending ticket, its 8-ticket arithmetic limit remains. A statistical pass cannot lower that floor. Capacity above 8 requires an explicitly governed new profile that changes the unresolved-payout guarantee, retains deterministic protection of known and non-random obligations, and never applies retroactively to existing V1 tickets.

No ε value is selected here. The three ceilings above are sensitivity points only; specification authority must choose the guarantee, lifetime scope and risk-budget governance.

## 7. Why the bound can be dependence-robust — and why it is not rolling

The bound does not assume independence between tickets. It does require each ticket's individual marginal distribution to remain the canonical Classic-6 distribution at the cohort's valid pre-outcome boundary.

That precondition is material:
- the ticket commitment is made while the matching Registry is BeaconPending;
- the player secret is later used with the published Beacon to determine the payout;
- the current on-chain BeaconRegistry does not independently verify an external Materios receipt and still relies on a configured relayer signature;
- once a Beacon is Ready, a ticket holder can compute their own result and may choose when or whether to Reveal.

Under arbitrary dependence, observing one ticket may reveal information about another. Therefore a later subset of Pending tickets can be outcome-selected and cannot automatically reuse the original unconditional μ and σ.

A genuinely rolling/adaptive design needs valid conditional moments over the full adversarial information history Hₜ, including information held privately by ticket owners:

```text
M_t = Σ(i in U_t) P_i * μ_i(H_t)
V_t <= (Σ(i in U_t) P_i * σ_i(H_t))^2
E_t > M_t

Pr(S_t > E_t | H_t)
  <= V_t / (V_t + (E_t - M_t)^2)
```

This is the missing proof obligation, not an implemented facility. The present code cannot observe ticket-holder private information and no conditional-moment evidence contract exists. Until it does, do not admit statistical Issue into a cohort after outcomes in that information set are available.

### One risk budget, not ε per Issue

The ceiling ε must be global to the frozen cohort/risk epoch or allocated across epochs by an approved lifetime rule. Reusing ε separately for every Issue, every Beacon round or every refresh can make cumulative failure probability exceed ε.

Possible mathematical policy families include:
- one ε_global for one frozen aggregate cohort;
- a governed allocation εⱼ across epochs with Σ εⱼ ≤ ε_global;
- a separately proved global supermartingale / alpha-spending rule.

No allocation method is adopted. Overlapping epochs also require genuinely disjoint capital or one joint aggregate bound. A list of per-epoch E* figures against the same unpartitioned effectivePool is not capital partitioning.

## 8. State-machine and trustless constraints

A minimum future cohort lifecycle is:

| State | Permission | Required invariant |
|---|---|---|
| OPEN | Eligible Issue may append | Every Issue atomically updates Pool + cohort state + ticket/NFT; all included targets remain Pending; full candidate bound passes |
| FROZEN | No append; Registry publication may begin | Complete membership fixed; objective public freeze trigger met; exact capital/model/policy commitments recorded |
| RESOLVING | Reveal / Expire / Claim | No unmodeled Pool-draining Issue/outflow; exact ledger accounting; original cohort ε remains attached |
| CLOSED | No further cohort transitions | Every member terminal; accounting reconciled; capital and ε are not silently reused |

A freeze transition must be publicly executable but cannot permit arbitrary third-party premature freezing. An objective trigger and any timeout/liveness trade-off require specification authority. No privileged keeper, administrator, publisher or relayer may acquire hidden freeze/thaw powers.

Current B1 has one global Pool UTxO and serializes Issue transitions; the cohort accumulator would add another shared state input and serialization point. Agent B's feasibility audit says the smallest safe candidate pauses new Issues while one cohort resolves. Continuous issuance across overlapping cohorts requires additional B1-level capital ownership/payout allocation and a lifetime risk-budget mechanism, none of which currently exists.

The current Registry consumer's first-match payment-ScriptHash lookup and the unauthenticated Pending/Ready boundary cannot safely enforce the freeze. Issue #43 / #49 dependencies must be resolved before any cohort validator design can rely on Registry state.

## 9. Normative decisions still required

This analysis intentionally does not decide:

1. whether statistics are S-OBSERVE (monitoring), S-GATE (extra admission constraint), S-COHORT (whole fixed pre-outcome cohort guarantee), or S-HYBRID;
2. which profile version is permitted to use a probabilistic guarantee instead of V1's unresolved-ticket WCE;
3. ε, risk horizon, epoch scope, and lifetime risk-budget allocation;
4. freeze trigger, maximum OPEN duration, and liveness/timeout trade-off;
5. whether one active cohort per global B1 Pool is acceptable or overlapping cohorts are required;
6. the exact B1 capital/asset perimeter and qualification of E*;
7. the authenticated Beacon source, unpredictability, anti-grinding and marginal-distribution proof;
8. the version migration boundary and disclosure for tickets issued under distinct profiles;
9. whether/how a combined deterministic + statistical rule is approved.

No statistical field is assigned to ReserveProtection. No parameter, 500× multiplier, KA/KC/KD, price ladder, V3/Reveal semantics, Oracle schema or Economic Gate behavior is changed.

## 10. Conformance backlog before any implementation

| ID | Required evidence / adversarial test | Expected result |
|---|---|---|
| SEL-01 | Caller supplies a mode different from the profile resolver | Reject |
| SEL-02 | Unknown/unadopted profile, risk policy or model digest | Reject |
| SEL-03 | Exact state UTxO, action, post-state or Pool reference mismatch | Reject |
| SEL-04 | Stale/ambiguous Pool observation or mismatched unit scale | Reject |
| COH-01 | Issue omits cohort state append while B1 reservation succeeds | Reject |
| COH-02 | Duplicate/missing leaf, forged member count or face sum | Reject |
| COH-03 | Any shared-Pool Pending round omitted from aggregate perimeter | Reject |
| COH-04 | Included Beacon already Ready at freeze | Reject |
| COH-05 | Issue attempted after FROZEN | Reject |
| COH-06 | Beacon publication occurs before the exact cohort is FROZEN | Reject |
| CAP-01 | 4,000 is gross Pool Value but reported as E* without reserve/obligation deductions | Reject |
| CAP-02 | Same capital or ε reused by two epochs | Reject |
| CAP-03 | C_other omitted, overlapping or unproven | Reject |
| MOD-01 | Historical/one-row moments used instead of exact Classic-6 ticket moments | Reject |
| MOD-02 | Marginal law invalid, biased Beacon or result available before freeze | Reject |
| MOD-03 | Cross-ticket dependence ignored by an independence-only model | Reject for this Cantelli model; this bound permits arbitrary dependence |
| MOD-04 | Floating-point / rounded arithmetic or caller-supplied pass boolean | Reject |
| MOD-05 | ε is not governed or is reset at each Issue | Reject |
| MOD-06 | Rolling Issue uses unconditional μ/σ after outcomes become available | Reject |
| LIFE-01 | Reveal re-applies unconditional moments to an outcome-selected residual Pending set | Reject |
| LIFE-02 | Expire/Claim silently replenishes lifetime ε or capital | Reject |
| V1-01 | Statistical decision attempts to lower V1 500× WCE | Reject |
| V1-02 | Statistical output is mapped into ReserveProtection without provenance/non-overlap | Reject |
| V1-03 | New profile rewrites an already-issued V1 ticket | Reject |

These tests are requirements only; none is claimed as executed by this report.

## 11. Workstream separation and next actions

### First real V1 Preprod Issue

The first-ticket path remains governed by Issue #37: qualified USD/USDM source and exact asset identity, fresh EV1–EV7 observation, current deployment-bound approval, and deployment-bound R1/Kc/Ω certificate. The existing direct-tUSDM accounting profile and V1 500× rules remain separate. This statistical work must not delay or silently replace the first-ticket qualification path.

### Future adaptive cohort profile

1. Specification authority resolves the profile/guarantee/mode/ε/freeze/lifetime policy decisions.
2. Agent A supplies the economic contract and sensitivity frontier once those choices are fixed.
3. Agent B completes independent boundary review and, only after separate implementation authorization, designs the atomic Pool/cohort/Registry transitions and exact Plutus budget tests.
4. Agent C remains outside this PRE-RICH economics and capital perimeter.

### Final disposition

**RESEARCH RESULT:** a candidate 4,000-USDM starting budget can support 18 / 41 / 58 one-USDM tickets under illustrative whole-cohort Cantelli ceilings of 0.1% / 0.5% / 1.0%, compared with 8 under the simplified current 500× arithmetic. The values are not production sale limits.

**CURRENT PRODUCTION RESULT:** no new statistical mode is enabled; PRE-RICH V1 remains deterministic 500×; Issue #37 remains blocked by its independently recorded source/approval/R1-Kc requirements.

No code, tests, workflows, parameters, profile, certificate, wallet, transaction, deployment, or ledger state was changed or executed by this report.
