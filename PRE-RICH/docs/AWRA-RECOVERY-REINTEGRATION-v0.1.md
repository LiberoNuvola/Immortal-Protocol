# PRE-RICH — AWRA Recovery & Re-Integration Specification

**Status:** RESEARCH / HISTORICAL RECOVERY — NON-NORMATIVE  
**Target branch:** `work/immortal-green-closure`  
**Purpose:** restore the recovered AWRA lineage without inventing a new economic rule.

## 1. Recovery finding

The historical AWRA work is not lost. The Library contains the AWRA research lineage from formalization through viability, risk, ceiling, dynamic, recovery and state-dependent-risk studies.

The current canonical PRE-RICH economic documents retain the safety substrate used by AWRA:

`ProtectedCapital`, `RawSurplus`, Economic Gate, post-state validation, `K_Ω`, contraction, quiescence and recovery.

The current application documents do not yet contain the historical AWRA transformation/selection machinery explicitly.

Therefore this document restores the missing bridge without promoting any historical candidate to canon.

## 2. Historical AWRA contract

Historical formulation:

```
B_AWRA,t = α_t S_t
```

where the budget is drawn only from surplus available after protected capital.

AWRA MUST NOT consume:

- crystallized liabilities;
- unresolved exposure / required reserve;
- locked Jackpot;
- protected Reserve;
- protected Maintenance;
- committed mandatory OPEX.

The historical work treated AWRA as a consumer of available surplus, not as a source of solvency authority.

## 3. Historical candidate transformation

The historical outcome-space work used outcome multipliers including:

```
1×, 2×, 2.5×, 3.5×, 5×
```

with the high tail `≥6×` frozen.

For an outcome multiplier `x` and weight `w_x`, the recovered transformation rule is:

```
Δp_x = B_AWRA · w_x / x
```

The transformation is therefore budget-preserving in payout expectation; the budget is not itself probability mass.

## 4. Historical 55-candidate laboratory

Recovered experiment grid:

```
B ∈ {0.005, 0.01, 0.025, 0.05, 0.1}
w1 ∈ {0, 0.1, 0.2, ..., 1}
w2 = 1 - w1
```

giving:

```
5 × 11 = 55 candidates
```

The historical artifacts evaluate candidate-level metrics including:

- EV;
- Win Rate;
- Profit-Win Rate;
- probability of ≥5×;
- probability of ≥100×;
- variance / σ;
- deterministic-kernel safety;
- candidate selection power.

Historical result preserved in the recovery record:

```
55 / 55 safe under the tested deterministic hard kernel
0 selection power
```

This does NOT imply that one candidate is canonical. The hard deterministic kernel did not discriminate among those distributions.

## 5. Historical preference layer

The recovered work explicitly separated:

```
Viability / Solvency
        ↓
Risk
        ↓
Dynamic admissibility
        ↓
AWRA preference
        ↓
Execution
```

A historical Pareto frontier and multiple lexicographic orderings were explored.

The lexicographic experiments demonstrated that different preference orders select different candidates. Therefore no unique AWRA winner follows from mathematics alone.

This remains a governance/policy question unless a new objective rule is explicitly authorized.

## 6. Risk layer recovered

Historical risk experiments explored:

```
N ∈ {100, 1000, 10000}
Z ∈ {1.645, 1.96, 2.326}
```

with statistical reserve model:

```
R(N,Z) = N μ + Z σ √N
```

The statistical reserve is a risk estimate, not a replacement for deterministic 500× exposure protection.

A historical stable ceiling zone was identified:

```
[2.2565376, 2.3052772]
```

with a width of approximately `0.0487396` and 44 candidates admissible in that experiment.

These values are preserved as **historical research evidence**, not canonical parameters.

## 7. Dynamic lineage

The historical AWRA program then expanded from static candidate selection into:

- dynamic trajectories;
- dynamic tradeoffs;
- long-horizon behavior;
- adversarial recovery;
- recovery integration;
- state-dependent risk;
- risk envelopes;
- dynamic risk.

The recovered state-machine architecture is consistent with the later IMMORTAL model:

```
Certified State
  ↓
Protected Capital
  ↓
Residual / Raw Surplus
  ↓
Candidate AWRA transition
  ↓
Risk / Ω admissibility
  ↓
Viability
  ↓
Authorized preference
  ↓
Economic Gate
  ↓
Canonical post-state
```

## 8. Jackpot ordering

Current PRE-RICH policy closes Jackpot funding as the minimum state-derived amount required to reach the current Jackpot floor.

AWRA therefore belongs **after the protected Jackpot requirement has been satisfied**, not before it.

Conceptually:

```
EEV
 ↓
ProtectedCapital excluding discretionary AWRA
 ↓
Jackpot requirement / locked Jackpot
 ↓
post-Jackpot RawSurplus
 ↓
AWRA candidate budget
```

Any AWRA budget must then survive the same post-state Economic Gate and viability checks.

No percentage allocation from the old `75/10/10/5` scheme is imported.

## 9. Governability boundary

The current IMMORTAL governability work adds a constraint that was not explicit in the earliest AWRA notes:

AWRA may derive or select a current value only inside an already-authorized rule space.

The correct architecture is:

```
Constitution
  ↓
Authorized rule space
  ↓
Certified current state + environment
  ↓
AWRA candidate generation
  ↓
risk / viability admissibility
  ↓
authorized preference / selector
  ↓
atomic transition
```

It is forbidden for AWRA to:

- create its own objective;
- expand its own domain;
- relax a safety invariant;
- redefine evidence authority;
- convert an experimental candidate into universal law.

## 10. What is restored vs still open

### Restored from historical work

- AWRA as a post-protection surplus consumer;
- budget-to-probability transformation;
- candidate generation concept;
- 55-candidate historical grid;
- candidate metrics;
- risk discrimination layer;
- ceiling/stable-zone analysis;
- Pareto/lexicographic selection experiments;
- dynamic trajectory/recovery lineage;
- state-dependent risk lineage;
- integration point with the state machine.

### Still NOT canonical

- numeric `α_t`;
- a universal fixed AWRA budget fraction;
- a canonical Pareto objective;
- a canonical lexicographic ordering;
- a fixed AWRA cadence;
- a fixed AWRA risk ceiling;
- any historical 75/10/10/5 split.

## 11. Critical model-compatibility warning

The historical AWRA laboratory was built during an earlier economic-model phase.

The current PRE-RICH canonical Game Economy now uses the exact Classic-6 two-row ticket distribution with:

```
EV = 0.64996875 × P
σ ≈ 6.689612535 × P
```

and the corresponding exact ticket-level outcome distribution.

Therefore historical AWRA measurements MUST NOT be copied into the current canonical model as though they were already recalibrated.

The historical AWRA selector is recoverable. Its numerical outputs must be re-run against the current canonical distribution before any promotion.

## 11A. Current-model static recalibration result

The required static recalibration against the current Classic-6 ticket-level
distribution is now reproduced by the dependency-free AWRA reference test.

The test verifies all 55 recovered historical candidate configurations against
the current distribution and checks that each candidate increases expected
payout by exactly its declared AWRA budget `B_AWRA`. It also rechecks the
current baseline metrics:

```text
EV = 0.64996875 × P
Win Rate = 0.234375
Profit-Win Rate = 0.085625
P(payout >= 100×P) = 0.001999
```

This closes the **static model-adaptation** step. It does not close dynamic
risk/Ω admissibility, selection governance, cadence, or any numerical AWRA
policy parameter.

The current implementation additionally enforces the recovered policy
boundary that AWRA is checked against the residual left after exact Jackpot
`FundingNeed`, rather than against the pre-Jackpot `RawSurplus`.

## 12. Required next conformance work

The correct next research/implementation sequence is:

1. preserve the historical AWRA artifacts unchanged as provenance;
2. define a current-model adapter from the canonical Classic-6 distribution to the AWRA outcome representation;
3. reproduce the historical candidate-generation semantics;
4. rerun the 55-candidate experiment against the current canonical model;
5. apply the current Risk / Ω / Viability gate;
6. compare historical and current candidate surfaces;
7. only then evaluate whether a new PRE-RICH policy decision is required.

No current on-chain V3/Reveal behavior is changed by this recovery document.

## 13. Non-regression rule

A failure in the recovered AWRA implementation must first be classified as:

- historical-model mismatch;
- current-model adaptation error;
- risk/Ω calibration gap;
- implementation/conformance gap;
- genuine representational counterexample.

Only a genuine representational counterexample may justify reopening the architecture.

---

**Recovery conclusion:** AWRA is recovered as a real prior subsystem. Its safety boundary has already been absorbed into the current IMMORTAL architecture, while its adaptive distribution/selection machinery remains to be explicitly reattached and recalibrated to the current canonical PRE-RICH game model.
